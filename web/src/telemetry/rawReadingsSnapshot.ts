/**
 * Full Pi-style sensor snapshot for diagnostics, logging, or a future API —
 * not shown in the main UI.
 */
import type { SensorReading } from "../types/sensorData";
import { THRESHOLDS } from "../types/sensorData";
import {
  distTone,
  heatTone,
  tofPercent,
  usPercent,
} from "../sensorTelemetryContent";
import type { TelemetryTone } from "../sensorTelemetryContent";

export interface RawReadingRow {
  label: string;
  value: string;
  tone?: TelemetryTone;
}

/** Builds the same row set as the old “Raw readings” screen; call from services or debug tools. */
export function buildRawReadingsSnapshot(data: SensorReading): RawReadingRow[] {
  return [
    {
      label: "Accel X/Y/Z (g)",
      value: `${data.accel.x > 0 ? "+" : ""}${data.accel.x.toFixed(2)} / ${data.accel.y > 0 ? "+" : ""}${data.accel.y.toFixed(2)} / ${data.accel.z > 0 ? "+" : ""}${data.accel.z.toFixed(2)}`,
    },
    {
      label: "Gyro X/Y/Z (°/s)",
      value: `${data.gyro.x > 0 ? "+" : ""}${data.gyro.x.toFixed(1)} / ${data.gyro.y > 0 ? "+" : ""}${data.gyro.y.toFixed(1)} / ${data.gyro.z > 0 ? "+" : ""}${data.gyro.z.toFixed(1)}`,
    },
    {
      label: "Total-g",
      value: `${data.totalG.toFixed(2)} g  (fall threshold: ${THRESHOLDS.FREEFALL_THRESHOLD_G} g / impact: ${THRESHOLDS.IMPACT_THRESHOLD_G} g)`,
      tone: data.fallDetected ? "danger" : "ok",
    },
    {
      label: "Total gyro (°/s)",
      value: `${data.totalGyro.toFixed(1)} °/s  (tumble threshold: ${THRESHOLDS.GYRO_TUMBLE_THRESHOLD} °/s)`,
    },
    {
      label: "Fall detected",
      value: data.fallDetected ? "YES ⚠" : "No",
      tone: data.fallDetected ? "danger" : "ok",
    },
    {
      label: "Temperature",
      value: data.temperature != null ? `${data.temperature.toFixed(1)} °C` : "—",
    },
    {
      label: "Humidity",
      value: data.humidity != null ? `${data.humidity.toFixed(1)} %RH` : "—",
    },
    {
      label: "Heat index",
      value:
        data.heatIndex != null
          ? `${data.heatIndex.toFixed(1)} °C  (caution ≥${THRESHOLDS.HEAT_INDEX_CAUTION} / danger ≥${THRESHOLDS.HEAT_INDEX_DANGER} / extreme ≥${THRESHOLDS.HEAT_INDEX_EXTREME})`
          : "—",
      tone: heatTone(data.heatIndex),
    },
    {
      label: "HC-SR04 (cm)",
      value:
        data.usDist != null
          ? `${data.usDist.toFixed(1)} cm  (warn <${THRESHOLDS.ULTRASONIC_WARN_CM} / danger <${THRESHOLDS.ULTRASONIC_DANGER_CM})`
          : "—",
      tone: distTone(usPercent(data.usDist)),
    },
    {
      label: "VL53L0X ToF (mm)",
      value:
        data.tofDist != null
          ? `${data.tofDist} mm  (warn <${THRESHOLDS.TOF_WARN_MM} / danger <${THRESHOLDS.TOF_DANGER_MM})`
          : "—",
      tone: distTone(tofPercent(data.tofDist)),
    },
    {
      label: "Illuminance (lux)",
      value:
        data.lux != null
          ? `${data.lux} lux  (low-vis threshold <${THRESHOLDS.LOW_LIGHT_LUX})`
          : "—",
      tone: data.lux != null && data.lux < THRESHOLDS.LOW_LIGHT_LUX ? "danger" : "ok",
    },
    {
      label: "Touch GPIO18",
      value: data.touchActive ? "Y — head contact" : "N",
      tone: data.touchActive ? "ok" : "warn",
    },
    {
      label: "IR GPIO20 (active-low)",
      value: data.irDetecting ? "Y — head present" : "N — no object",
      tone: data.irDetecting ? "ok" : "warn",
    },
    {
      label: "Helmet status",
      value: data.helmetOn ? "ON" : `OFF ⚠ (alert after ${THRESHOLDS.HELMET_REMOVAL_SECONDS}s)`,
      tone: data.helmetOn ? "ok" : "danger",
    },
  ];
}
