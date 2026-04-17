import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export type AlarmType =
  | "proximity"  // PATTERN_DANGER — B6 (1976 Hz) + E6 (1319 Hz) double beep
  | "fall"       // PATTERN_FALL   — rapid B6 + E6 alternating
  | "heat"       // PATTERN_DANGER variant — B6/E6 warble
  | "helmet_off" // PATTERN_HELMET_OFF — long B6 repeating
  | "emergency"; // PATTERN_FALL variant  — fire alarm T3 triple beep

export interface AlertInfo {
  sensor: string;
  type: string;
  detail: string;
  alarmType: AlarmType;
}

interface AlertContextValue {
  activeAlert: AlertInfo | null;
  triggerAlert: (alert: AlertInfo) => void;
  dismissAlert: () => void;
  overlayEnabled: boolean;
  setOverlayEnabled: (enabled: boolean) => void;
  dismissedAlertKey: string | null;
  setDismissedAlertKey: (key: string | null) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
//  Audio engine — frequencies match Python's KY-006 buzzer notes:
//    A5 = 880 Hz   (PATTERN_WARN)
//    B6 = 1976 Hz  (PATTERN_DANGER / PATTERN_FALL / PATTERN_HELMET_OFF)
//    E6 = 1319 Hz  (PATTERN_DANGER / PATTERN_FALL)
// ─────────────────────────────────────────────────────────────
const A5 = 880;
const B6 = 1976;
const E6 = 1319;

function beep(
  ctx: AudioContext,
  freq: number,
  t: number,
  dur: number,
  vol = 0.38
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.008);
  gain.gain.setValueAtTime(vol, t + dur - 0.008);
  gain.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

/**
 * Schedule one alarm cycle.  Returns the time after the cycle ends so the
 * caller can chain many cycles to fill a long pre-scheduled buffer.
 *
 * Patterns mirror smart_helmet.py AlertManager._loop():
 *   WARN       → A5 short beep, 900 ms silence
 *   DANGER     → B6 + E6 double beep, 550 ms silence
 *   FALL       → rapid B6 + E6 (500 ms each, 40 ms gap)
 *   HELMET_OFF → long B6, 500 ms silence
 */
function scheduleOneCycle(
  ctx: AudioContext,
  type: AlarmType,
  startAt: number
): number {
  let t = startAt;

  switch (type) {
    case "proximity": {
      // PATTERN_DANGER: B6 (100ms) + silence (80ms) + E6 (100ms) + pause (550ms)
      beep(ctx, B6, t, 0.1);
      t += 0.18;
      beep(ctx, E6, t, 0.1);
      t += 0.1 + 0.55;
      break;
    }
    case "fall": {
      // PATTERN_FALL: rapid B6 (500ms) + gap (40ms) + E6 (500ms) + gap (40ms)
      beep(ctx, B6, t, 0.5);
      t += 0.54;
      beep(ctx, E6, t, 0.5);
      t += 0.54;
      break;
    }
    case "heat": {
      // PATTERN_DANGER variant: B6/E6 warble (3 alternating pairs)
      for (let i = 0; i < 3; i++) {
        beep(ctx, i % 2 === 0 ? B6 : E6, t, 0.1);
        t += 0.18;
      }
      t += 0.45;
      break;
    }
    case "helmet_off": {
      // PATTERN_HELMET_OFF: long B6 (500ms) + silence (500ms)
      beep(ctx, B6, t, 0.5);
      t += 1.0;
      break;
    }
    default:
    case "emergency": {
      // PATTERN_FALL variant: T3 triple beep (A5) — fire alarm
      for (let i = 0; i < 3; i++) {
        beep(ctx, A5, t, 0.1);
        t += 0.22;
      }
      t += 1.1;
      break;
    }
  }

  return t;
}

function startAlarm(ctx: AudioContext, type: AlarmType) {
  let t = ctx.currentTime + 0.05;
  const deadline = t + 90; // 90 s pre-scheduled
  while (t < deadline) {
    t = scheduleOneCycle(ctx, type, t);
  }
}

// ─────────────────────────────────────────────────────────────
//  Provider
// ─────────────────────────────────────────────────────────────
const OVERLAY_ENABLED_KEY = "red_alert_overlay_enabled";

function readInitialOverlayEnabled(): boolean {
  try {
    return localStorage.getItem(OVERLAY_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [activeAlert, setActiveAlert] = useState<AlertInfo | null>(null);
  const [overlayEnabled, setOverlayEnabledState] = useState<boolean>(readInitialOverlayEnabled);
  const [dismissedAlertKey, setDismissedAlertKey] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const triggerAlert = useCallback((alert: AlertInfo) => {
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    startAlarm(ctx, alert.alarmType);
    setActiveAlert(alert);
  }, []);

  const dismissAlert = useCallback(() => {
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    setActiveAlert(null);
  }, []);

  const setOverlayEnabled = useCallback((enabled: boolean) => {
    try {
      localStorage.setItem(OVERLAY_ENABLED_KEY, enabled ? "1" : "0");
    } catch {
      /* ignore */
    }
    setOverlayEnabledState(enabled);
    if (!enabled) {
      if (ctxRef.current) {
        ctxRef.current.close();
        ctxRef.current = null;
      }
      setActiveAlert(null);
      setDismissedAlertKey(null);
    }
  }, []);

  return (
    <AlertContext.Provider value={{ activeAlert, triggerAlert, dismissAlert, overlayEnabled, setOverlayEnabled, dismissedAlertKey, setDismissedAlertKey }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlerts must be inside <AlertProvider>");
  return ctx;
}
