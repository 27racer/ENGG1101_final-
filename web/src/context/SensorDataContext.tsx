import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { fetchPiSensors } from "../api/piSensors";
import {
  type AlertLevel,
  type ConnectionStatus,
  type SensorReading,
  createDisconnectedReading,
  evaluateAlerts,
} from "../types/sensorData";

const STORAGE_KEY = "pi_base_url";
const LEGACY_KEY = "helmet_api_url";
const POLL_MS = 500;

function readInitialPiUrl(): string {
  const fromEnv = import.meta.env.VITE_PI_BASE_URL?.trim() ?? "";
  try {
    const stored = localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
    if (stored) return stored;
    const legacy = localStorage.getItem(LEGACY_KEY)?.trim() ?? "";
    if (legacy) {
      localStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_KEY);
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return fromEnv;
}

interface SensorDataContextValue {
  data: SensorReading;
  alertLevel: AlertLevel;
  connectionStatus: ConnectionStatus;
  piBaseUrl: string;
  setPiBaseUrl: (url: string) => void;
}

const SensorDataContext = createContext<SensorDataContextValue | null>(null);

export function SensorDataProvider({ children }: { children: ReactNode }) {
  const [piBaseUrl, setPiBaseUrlState] = useState(readInitialPiUrl);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>(() => (readInitialPiUrl().trim() ? "connecting" : "disconnected"));
  const [data, setData] = useState<SensorReading>(() => createDisconnectedReading());
  const [alertLevel, setAlertLevel] = useState<AlertLevel>("OK");
  const failCountRef = useRef(0);
  const hadSuccessRef = useRef(false);

  const setPiBaseUrl = useCallback((url: string) => {
    const trimmed = url.trim();
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      /* ignore */
    }
    setPiBaseUrlState(trimmed);
    failCountRef.current = 0;
    hadSuccessRef.current = false;
    setConnectionStatus(trimmed ? "connecting" : "disconnected");
    if (!trimmed) {
      setData(createDisconnectedReading());
      setAlertLevel("OK");
    }
  }, []);

  useEffect(() => {
    const base = piBaseUrl.trim();
    hadSuccessRef.current = false;
    if (!base) {
      setData(createDisconnectedReading());
      setAlertLevel("OK");
      setConnectionStatus("disconnected");
      return;
    }

    let cancelled = false;
    failCountRef.current = 0;

    const tick = async () => {
      if (cancelled) return;
      try {
        const reading = await fetchPiSensors(base);
        if (cancelled) return;
        setData(reading);
        setAlertLevel(evaluateAlerts(reading));
        setConnectionStatus("live");
        failCountRef.current = 0;
        hadSuccessRef.current = true;
      } catch {
        failCountRef.current += 1;
        if (cancelled) return;
        const hardFail = failCountRef.current >= 2;
        setConnectionStatus(hardFail ? "error" : "connecting");
        if (!hadSuccessRef.current) {
          setData(createDisconnectedReading());
          setAlertLevel("OK");
        }
      }
    };

    setConnectionStatus("connecting");
    const id = setInterval(tick, POLL_MS);
    tick();

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [piBaseUrl]);

  return (
    <SensorDataContext.Provider
      value={{
        data,
        alertLevel,
        connectionStatus,
        piBaseUrl,
        setPiBaseUrl,
      }}
    >
      {children}
    </SensorDataContext.Provider>
  );
}

export function useSensorData() {
  const ctx = useContext(SensorDataContext);
  if (!ctx) throw new Error("useSensorData must be inside <SensorDataProvider>");
  return ctx;
}

export { buildRawReadingsSnapshot } from "../telemetry/rawReadingsSnapshot";
