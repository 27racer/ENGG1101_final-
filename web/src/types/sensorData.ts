// ─────────────────────────────────────────────────────────────
//  Smart Helmet — Sensor Types (direct port of smart_helmet.py)
// ─────────────────────────────────────────────────────────────

/** 3-axis vector (accel in g, gyro in °/s) */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Full snapshot of all sensor readings.
 * Field names and units match smart_helmet.py exactly.
 */
export interface SensorReading {
  // MPU6050 — I2C 0x68 (GPIO SDA/SCL)
  accel: Vec3;        // g  (±2 g range, 16384 LSB/g)
  gyro: Vec3;         // °/s (±250°/s range, 131 LSB/°/s)
  totalG: number;     // √(ax²+ay²+az²)
  totalGyro: number;  // √(gx²+gy²+gz²)
  fallDetected: boolean;

  // DHT22 — GPIO 21
  temperature: number | null;  // °C
  humidity: number | null;     // %RH
  heatIndex: number | null;    // °C  (Rothfusz regression)

  // HC-SR04 Ultrasonic — Trig GPIO23, Echo GPIO24
  usDist: number | null;   // cm

  // VL53L0X ToF — I2C 0x29
  tofDist: number | null;  // mm  ← different unit to HC-SR04!

  // BH1750 Ambient Light — I2C 0x23
  lux: number | null;

  // Touch sensor — GPIO18  (HIGH = head contact)
  touchActive: boolean;

  // IR sensor — GPIO20  (active-low: LOW = head present)
  irDetecting: boolean;

  // Derived from Touch + IR (HelmetRemovalDetector logic)
  helmetOn: boolean;
}

// ─────────────────────────────────────────────────────────────
//  Alert levels  (mirrors AlertManager + _evaluate_alerts())
// ─────────────────────────────────────────────────────────────
export type AlertLevel =
  | "OK"
  | "LOW LIGHT"     // BH1750 < 50 lux
  | "HEAT CAUTION"  // Heat index ≥ 27 °C
  | "PROX WARN"     // HC-SR04 < 100 cm
  | "TOF WARN"      // VL53L0X < 600 mm
  | "HEAT DANGER"   // Heat index ≥ 32 °C
  | "HEAT EXTREME"  // Heat index ≥ 40 °C
  | "PROX DANGER"   // HC-SR04 < 40 cm
  | "TOF DANGER"    // VL53L0X < 250 mm
  | "HELMET OFF"    // Both Touch + IR lost for 3 s (priority 4)
  | "!! FALL !!";   // Free-fall + impact OR tumble  (priority 3→ display 1)

// ─────────────────────────────────────────────────────────────
//  Thresholds — exact copy of Python configuration block
// ─────────────────────────────────────────────────────────────
export const THRESHOLDS = {
  // Fall Detection (MPU6050)
  FREEFALL_THRESHOLD_G:   0.4,   // below this total-g → free-fall
  IMPACT_THRESHOLD_G:     3.0,   // above this total-g → hard impact
  FALL_CONFIRM_MS:        150,   // free-fall must last ≥ this long
  GYRO_TUMBLE_THRESHOLD:  250.0, // °/s — rapid rotation = tumbling

  // Helmet Removal
  HELMET_REMOVAL_SECONDS: 3,     // both sensors must agree "no head"

  // HC-SR04 Ultrasonic
  ULTRASONIC_WARN_CM:   100,     // obstacle < 100 cm → WARN
  ULTRASONIC_DANGER_CM:  40,     // obstacle < 40 cm  → DANGER

  // VL53L0X ToF (different unit — mm!)
  TOF_WARN_MM:    600,           // < 600 mm → WARN
  TOF_DANGER_MM:  250,           // < 250 mm → DANGER

  // DHT22 Heat Index
  HEAT_INDEX_CAUTION:  27.0,     // ≥ 27 °C → caution
  HEAT_INDEX_DANGER:   32.0,     // ≥ 32 °C → danger
  HEAT_INDEX_EXTREME:  40.0,     // ≥ 40 °C → extreme danger

  // BH1750
  LOW_LIGHT_LUX: 50,             // < 50 lux → poor visibility

  // Buzzer GPIO pin (reference only)
  PIN_BUZZER: 17,
} as const;

// ─────────────────────────────────────────────────────────────
//  Rothfusz heat-index formula  (exact Python port)
// ─────────────────────────────────────────────────────────────
export function computeHeatIndex(tempC: number, humidity: number): number {
  const T = (tempC * 9.0) / 5.0 + 32.0;
  const RH = humidity;

  let HI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094);

  if (HI >= 80) {
    HI =
      -42.379 +
      2.04901523 * T +
      10.14333127 * RH -
      0.22475541 * T * RH -
      0.00683783 * T * T -
      0.05481717 * RH * RH +
      0.00122874 * T * T * RH +
      0.00085282 * T * RH * RH -
      0.00000199 * T * T * RH * RH;

    if (RH < 13 && T > 80 && T < 112) {
      HI -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    } else if (RH > 85 && T > 80 && T < 87) {
      HI += ((RH - 85) / 10) * ((87 - T) / 5);
    }
  }

  return Math.round(((HI - 32) * 5.0) / 9.0 * 10) / 10;
}

// ─────────────────────────────────────────────────────────────
//  _evaluate_alerts() — exact Python port
//  Priority: FALL(3) → HELMET_OFF(4→display) → DANGER(2) → WARN(1) → OK
// ─────────────────────────────────────────────────────────────
export function evaluateAlerts(d: SensorReading): AlertLevel {
  // Python uses PATTERN enum values as numeric priority
  // NONE=0, WARN=1, DANGER=2, FALL=3, HELMET_OFF=4
  let priority = 0;
  let level: AlertLevel = "OK";

  // 1. Fall (priority 3)
  if (d.fallDetected) {
    level = "!! FALL !!";
    priority = 3;
  }

  // 2. Helmet removal (priority 4 — overrides fall for buzzer, but same display)
  if (!d.helmetOn && priority < 4) {
    level = "HELMET OFF";
    priority = 4;
  }

  // 3. HC-SR04 ultrasonic proximity
  if (d.usDist !== null) {
    if (d.usDist < THRESHOLDS.ULTRASONIC_DANGER_CM && priority < 2) {
      level = "PROX DANGER";
      priority = 2;
    } else if (d.usDist < THRESHOLDS.ULTRASONIC_WARN_CM && priority < 1) {
      level = "PROX WARN";
      priority = 1;
    }
  }

  // 4. VL53L0X ToF proximity
  if (d.tofDist !== null) {
    if (d.tofDist < THRESHOLDS.TOF_DANGER_MM && priority < 2) {
      level = "TOF DANGER";
      priority = 2;
    } else if (d.tofDist < THRESHOLDS.TOF_WARN_MM && priority < 1) {
      level = "TOF WARN";
      priority = 1;
    }
  }

  // 5. DHT22 heat index
  if (d.heatIndex !== null) {
    if (d.heatIndex >= THRESHOLDS.HEAT_INDEX_EXTREME && priority < 2) {
      level = "HEAT EXTREME";
      priority = 2;
    } else if (d.heatIndex >= THRESHOLDS.HEAT_INDEX_DANGER && priority < 2) {
      level = "HEAT DANGER";
      priority = 2;
    } else if (d.heatIndex >= THRESHOLDS.HEAT_INDEX_CAUTION && priority < 1) {
      level = "HEAT CAUTION";
      priority = 1;
    }
  }

  // 6. BH1750 low light
  if (d.lux !== null && d.lux < THRESHOLDS.LOW_LIGHT_LUX && priority < 1) {
    level = "LOW LIGHT";
    priority = 1;
  }

  return level;
}

// ─────────────────────────────────────────────────────────────
//  Safety-score helpers  (for Dashboard hero metric)
// ─────────────────────────────────────────────────────────────
export function safetyScore(level: AlertLevel): number {
  switch (level) {
    case "OK":           return 98.2;
    case "LOW LIGHT":
    case "HEAT CAUTION":
    case "PROX WARN":
    case "TOF WARN":     return 74.0;
    case "HEAT DANGER":
    case "HEAT EXTREME":
    case "PROX DANGER":
    case "TOF DANGER":   return 41.5;
    case "HELMET OFF":   return 12.0;
    case "!! FALL !!":   return 0.0;
  }
}

/**
 * Short headline under the big percentage (plain language, not alarm codes).
 */
export function friendlyHeroHeadline(level: AlertLevel): string {
  switch (level) {
    case "OK":
      return "You're in good shape";
    case "LOW LIGHT":
      return "Low light — mind your footing";
    case "HEAT CAUTION":
      return "Warm conditions — take it easy";
    case "HEAT DANGER":
    case "HEAT EXTREME":
      return "Heat stress — cool down now";
    case "PROX WARN":
    case "TOF WARN":
      return "Something is getting close";
    case "PROX DANGER":
    case "TOF DANGER":
      return "Obstacle very close — move back";
    case "HELMET OFF":
      return "Helmet not detected on your head";
    case "!! FALL !!":
      return "Possible fall — check in";
    default:
      return "Stay aware";
  }
}

/**
 * One line explaining why the score dropped (shown when not OK).
 */
export function friendlyScoreExplain(level: AlertLevel): string {
  if (level === "OK") {
    return "Score stays high when sensors report no warnings.";
  }
  return "The score reflects active warnings from your helmet. Check At a glance below for the reading that triggered it.";
}

/** Human-readable alert name for pills and banners (not ALL CAPS codes). */
export function readableAlertName(level: AlertLevel): string {
  const names: Record<AlertLevel, string> = {
    OK: "All clear",
    "LOW LIGHT": "Low light",
    "HEAT CAUTION": "Heat — caution",
    "HEAT DANGER": "Heat — danger",
    "HEAT EXTREME": "Heat — extreme",
    "PROX WARN": "Distance — caution",
    "TOF WARN": "Laser distance — caution",
    "PROX DANGER": "Distance — danger",
    "TOF DANGER": "Laser distance — danger",
    "HELMET OFF": "Helmet removed",
    "!! FALL !!": "Fall detected",
  };
  return names[level];
}

/**
 * When the Pi is live, counts how many sensor channels are reporting real data (max 6):
 * MPU motion, DHT climate, ultrasonic, ToF, IR, ambient light.
 */
export function countPopulatedSensorChannels(
  data: SensorReading,
  isLive: boolean
): number | null {
  if (!isLive) return null;
  let n = 0;
  if (Number.isFinite(data.totalG)) n += 1;
  if (data.temperature != null && data.humidity != null) n += 1;
  if (data.usDist != null) n += 1;
  if (data.tofDist != null) n += 1;
  if (typeof data.irDetecting === "boolean") n += 1;
  if (data.lux != null) n += 1;
  return n;
}

/** @deprecated Use friendlyHeroHeadline */
export function safetyLabel(level: AlertLevel): string {
  return friendlyHeroHeadline(level);
}

/** Placeholder before the first successful read from the Pi (no fake physics). */
export function createDisconnectedReading(): SensorReading {
  return {
    accel: { x: 0, y: 0, z: 0 },
    gyro: { x: 0, y: 0, z: 0 },
    totalG: 0,
    totalGyro: 0,
    fallDetected: false,
    temperature: null,
    humidity: null,
    heatIndex: null,
    usDist: null,
    tofDist: null,
    lux: null,
    touchActive: false,
    irDetecting: false,
    helmetOn: false,
  };
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "live"
  | "error";
