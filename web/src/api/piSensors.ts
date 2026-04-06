import { createDisconnectedReading, computeHeatIndex, type SensorReading } from "../types/sensorData";

const TIMEOUT_MS = 1500;

function num(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return undefined;
}

function mergeVec3(
  v: Partial<{ x: number; y: number; z: number }> | undefined,
  fallback: { x: number; y: number; z: number }
) {
  if (!v || typeof v !== "object") return fallback;
  return {
    x: typeof v.x === "number" ? v.x : fallback.x,
    y: typeof v.y === "number" ? v.y : fallback.y,
    z: typeof v.z === "number" ? v.z : fallback.z,
  };
}

/** Merge JSON from `GET /api/sensors` into a full SensorReading (handles partial payloads). */
export function parseSensorPayload(raw: unknown): SensorReading {
  const base = createDisconnectedReading();
  if (!raw || typeof raw !== "object") return base;

  const j = raw as Record<string, unknown>;
  const accel = mergeVec3(j.accel as Partial<{ x: number; y: number; z: number }>, base.accel);
  const gyro = mergeVec3(j.gyro as Partial<{ x: number; y: number; z: number }>, base.gyro);

  const totalG = num(j.totalG, j.total_g) ?? base.totalG;
  const totalGyro = num(j.totalGyro, j.total_gyro) ?? base.totalGyro;
  const fallDetected =
    typeof j.fallDetected === "boolean"
      ? j.fallDetected
      : typeof j.fall_detected === "boolean"
        ? j.fall_detected
        : base.fallDetected;

  const temperature = num(j.temperature, j.temp) ?? null;
  const humidity = num(j.humidity) ?? null;
  let heatIndex: number | null = null;
  const hiRaw = num(j.heatIndex, j.heat_index);
  if (hiRaw !== undefined) heatIndex = hiRaw;
  else if (j.heatIndex === null || j.heat_index === null) heatIndex = null;
  if (heatIndex === null && temperature !== null && humidity !== null) {
    heatIndex = computeHeatIndex(temperature, humidity);
  }

  const usDist = num(j.usDist, j.us_dist) ?? null;
  const tofDist = num(j.tofDist, j.tof_dist) ?? null;
  const lux = num(j.lux) ?? null;

  const touchActive =
    typeof j.touchActive === "boolean"
      ? j.touchActive
      : typeof j.touch_active === "boolean"
        ? j.touch_active
        : base.touchActive;
  const irDetecting =
    typeof j.irDetecting === "boolean"
      ? j.irDetecting
      : typeof j.ir_detecting === "boolean"
        ? j.ir_detecting
        : base.irDetecting;
  const helmetOn =
    typeof j.helmetOn === "boolean"
      ? j.helmetOn
      : typeof j.helmet_on === "boolean"
        ? j.helmet_on
        : base.helmetOn;

  return {
    accel,
    gyro,
    totalG,
    totalGyro,
    fallDetected,
    temperature,
    humidity,
    heatIndex,
    usDist,
    tofDist,
    lux,
    touchActive,
    irDetecting,
    helmetOn,
  };
}

export async function fetchPiSensors(baseUrl: string, signal?: AbortSignal): Promise<SensorReading> {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!trimmed) throw new Error("Missing Pi base URL");

  const url = `${trimmed}/api/sensors`;
  const res = await fetch(url, {
    signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return parseSensorPayload(json);
}
