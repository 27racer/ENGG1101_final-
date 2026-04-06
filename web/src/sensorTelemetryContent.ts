import type { AlertInfo } from "./context/AlertContext";
import type { SensorReading } from "./types/sensorData";
import { THRESHOLDS } from "./types/sensorData";

export type TelemetryTone = "ok" | "warn" | "danger";

export function usPercent(cm: number | null): number {
  if (cm == null) return 100;
  if (cm < THRESHOLDS.ULTRASONIC_DANGER_CM) return 10;
  if (cm < THRESHOLDS.ULTRASONIC_WARN_CM) return 55;
  return 100;
}

export function tofPercent(mm: number | null): number {
  if (mm == null) return 100;
  if (mm < THRESHOLDS.TOF_DANGER_MM) return 10;
  if (mm < THRESHOLDS.TOF_WARN_MM) return 55;
  return 100;
}

export function heatPercent(hi: number | null): number {
  if (hi == null) return 100;
  if (hi >= THRESHOLDS.HEAT_INDEX_EXTREME) return 5;
  if (hi >= THRESHOLDS.HEAT_INDEX_DANGER) return 30;
  if (hi >= THRESHOLDS.HEAT_INDEX_CAUTION) return 65;
  return 100;
}

export function heatTone(hi: number | null): TelemetryTone {
  if (hi == null) return "ok";
  if (hi >= THRESHOLDS.HEAT_INDEX_DANGER) return "danger";
  if (hi >= THRESHOLDS.HEAT_INDEX_CAUTION) return "warn";
  return "ok";
}

export function luxPercent(lux: number | null): number {
  if (lux == null) return 100;
  return lux < THRESHOLDS.LOW_LIGHT_LUX ? 20 : 100;
}

export function distTone(pct: number): TelemetryTone {
  return pct < 30 ? "danger" : pct < 70 ? "warn" : "ok";
}

/** One live reading row: compact value on surface, detail on tap. */
export interface InstalledSystemRow {
  id: string;
  /** Left column — short label (e.g. “Overall motion (g)”). */
  readingLabel: string;
  /** Right column — numbers/units only when possible. */
  valueShort: string;
  /** Shown when the row is expanded. */
  detailText: string;
  hardware: string;
  pct: number;
  tone: TelemetryTone;
  alert: AlertInfo;
}

export function buildInstalledSystems(data: SensorReading): InstalledSystemRow[] {
  const usP = usPercent(data.usDist);
  const tofP = tofPercent(data.tofDist);

  return [
    {
      id: "motion",
      readingLabel: "Overall motion (g)",
      valueShort: `${data.totalG.toFixed(2)} g`,
      detailText: data.fallDetected
        ? `About ${data.totalG.toFixed(2)} g total — possible fall or hard impact. MPU6050.`
        : `About ${data.totalG.toFixed(2)} g total acceleration — movement looks normal. MPU6050.`,
      hardware: "MPU6050",
      pct: data.fallDetected ? 5 : 100,
      tone: data.fallDetected ? "danger" : "ok",
      alert: {
        sensor: "MPU6050 · I2C 0x68",
        type: "Fall Detected!",
        detail: `Impact ${data.totalG.toFixed(2)}g — fall event`,
        alarmType: "fall",
      },
    },
    {
      id: "climate",
      readingLabel: "Heat index",
      valueShort:
        data.heatIndex != null ? `${data.heatIndex.toFixed(1)} °C` : "—",
      detailText:
        data.temperature != null && data.humidity != null && data.heatIndex != null
          ? `${data.heatIndex.toFixed(1)} °C heat index · ${data.temperature.toFixed(1)} °C air · ${data.humidity.toFixed(0)}% RH. DHT22.`
          : "Waiting for temperature / humidity readings. DHT22.",
      hardware: "DHT22",
      pct: heatPercent(data.heatIndex),
      tone: heatTone(data.heatIndex),
      alert: {
        sensor: "DHT22 · GPIO21",
        type: "Heat Stress Alert",
        detail: `Heat index ${data.heatIndex?.toFixed(1) ?? "?"}°C — rest immediately`,
        alarmType: "heat",
      },
    },
    {
      id: "ultrasonic",
      readingLabel: "Ultrasonic distance",
      valueShort: data.usDist != null ? `${data.usDist.toFixed(0)} cm` : "—",
      detailText:
        data.usDist != null
          ? `${data.usDist.toFixed(1)} cm to echo · ${
              data.usDist < THRESHOLDS.ULTRASONIC_DANGER_CM
                ? "very close (danger zone)."
                : data.usDist < THRESHOLDS.ULTRASONIC_WARN_CM
                  ? "getting close (caution)."
                  : "path ahead looks clear."
            } HC-SR04.`
          : "No ultrasonic echo yet. HC-SR04.",
      hardware: "HC-SR04",
      pct: usP,
      tone: distTone(usP),
      alert: {
        sensor: "HC-SR04 · GPIO23/24",
        type: "Proximity Alert",
        detail: `Object at ${data.usDist?.toFixed(0) ?? "?"}cm — stand back!`,
        alarmType: "proximity",
      },
    },
    {
      id: "tof",
      readingLabel: "Laser distance",
      valueShort: data.tofDist != null ? `${data.tofDist} mm` : "—",
      detailText:
        data.tofDist != null
          ? `${data.tofDist} mm laser range · ${
              data.tofDist < THRESHOLDS.TOF_DANGER_MM
                ? "very close."
                : data.tofDist < THRESHOLDS.TOF_WARN_MM
                  ? "caution distance."
                  : "clear ahead."
            } VL53L0X.`
          : "Waiting for laser distance. VL53L0X.",
      hardware: "VL53L0X",
      pct: tofP,
      tone: distTone(tofP),
      alert: {
        sensor: "VL53L0X · I2C 0x29",
        type: "Proximity Alert",
        detail: `ToF: ${data.tofDist ?? "?"}mm — obstacle detected!`,
        alarmType: "proximity",
      },
    },
    {
      id: "ir",
      readingLabel: "Close-up IR",
      valueShort: data.irDetecting ? "Clear" : "Blocked",
      detailText: data.irDetecting
        ? "IR beam clear — nothing very close to the shell."
        : "IR beam broken — object extremely close.",
      hardware: "IR sensor",
      pct: data.irDetecting ? 100 : 15,
      tone: data.irDetecting ? "ok" : "danger",
      alert: {
        sensor: "IR Sensor · GPIO20",
        type: "Proximity Alert",
        detail: "IR beam broken — object very close!",
        alarmType: "proximity",
      },
    },
    {
      id: "light",
      readingLabel: "Light level",
      valueShort: data.lux != null ? `${data.lux} lux` : "—",
      detailText:
        data.lux != null
          ? `${data.lux} lux · ${
              data.lux < THRESHOLDS.LOW_LIGHT_LUX ? "low visibility." : "adequate brightness."
            } BH1750.`
          : "Waiting for light level. BH1750.",
      hardware: "BH1750",
      pct: luxPercent(data.lux),
      tone: data.lux != null && data.lux < THRESHOLDS.LOW_LIGHT_LUX ? "danger" : "ok",
      alert: {
        sensor: "BH1750 · I2C 0x23",
        type: "Low Visibility!",
        detail: `Illuminance: ${data.lux ?? "?"}lux — dangerously dark`,
        alarmType: "emergency",
      },
    },
  ];
}
