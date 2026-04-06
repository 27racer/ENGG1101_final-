export interface AlertHistoryDay {
  day: string;
  fall: number;
  heat: number;
  prox: number;
}

const TIMEOUT_MS = 1500;

function normalizePayload(raw: unknown): AlertHistoryDay[] | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  let rows: unknown = o.history ?? o.alert_history ?? o.days ?? o;
  if (!Array.isArray(rows)) return null;
  const out: AlertHistoryDay[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const day = typeof r.day === "string" ? r.day : "";
    const fall = typeof r.fall === "number" ? r.fall : 0;
    const heat = typeof r.heat === "number" ? r.heat : 0;
    const prox = typeof r.prox === "number" ? r.prox : 0;
    if (day) out.push({ day, fall, heat, prox });
  }
  return out.length ? out : null;
}

/** `GET /api/alert-history` — optional Pi endpoint; returns null if missing or invalid. */
export async function fetchPiAlertHistory(
  baseUrl: string,
  signal?: AbortSignal
): Promise<AlertHistoryDay[] | null> {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  const url = `${trimmed}/api/alert-history`;
  try {
    const res = await fetch(url, {
      signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return normalizePayload(json);
  } catch {
    return null;
  }
}
