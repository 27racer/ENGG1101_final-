import { useAlerts } from "../context/AlertContext";
import type { AlarmType } from "../context/AlertContext";

// Sensor-specific icons rendered inside the pulsing ring
const SENSOR_ICON: Record<AlarmType, JSX.Element> = {
  helmet_off: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a8 8 0 018 8v2H4v-2a8 8 0 018-8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8 13v4a4 4 0 008 0v-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M2 6l20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  proximity: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5.5 5.5a9 9 0 0113 0M3 3a13.5 13.5 0 0118 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M5.5 18.5a9 9 0 0013 0M3 21a13.5 13.5 0 0018 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
  fall: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 7v5l-3 4M12 12l3 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 20h12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
  heat: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v14M8 5c0 2 2 2 2 4s-2 2-2 4 2 2 2 4M14 5c0 2 2 2 2 4s-2 2-2 4 2 2 2 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M7 17h10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
  emergency: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5L1 21.5h22L12 2.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v5.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="18" r="1.1" fill="currentColor" />
    </svg>
  ),
};

export function AlertOverlay() {
  const { activeAlert, dismissAlert, setDismissedAlertKey } = useAlerts();

  if (!activeAlert) return null;

  const alertKey = `${activeAlert.alarmType}:${activeAlert.type}:${activeAlert.detail}`;

  return (
    <div
      className="alert-overlay"
      role="alertdialog"
      aria-modal
      aria-label={`${activeAlert.type} — ${activeAlert.sensor}`}
    >
      {/* Pulsing background layer */}
      <div className="alert-overlay__bg" />

      {/* Content */}
      <div className="alert-overlay__inner">
        {/* Pulsing ring + sensor icon */}
        <div className="alert-overlay__icon-ring" aria-hidden>
          <div className="alert-overlay__icon-inner">
            {SENSOR_ICON[activeAlert.alarmType]}
          </div>
        </div>

        {/* Sensor label */}
        <p className="alert-overlay__sensor-lbl">{activeAlert.sensor}</p>

        {/* Main alert type */}
        <p className="alert-overlay__type">{activeAlert.type}</p>

        {/* Reading detail */}
        <p className="alert-overlay__detail">{activeAlert.detail}</p>

        {/* Dismiss */}
        <button
          type="button"
          className="alert-overlay__dismiss"
          onClick={() => {
            setDismissedAlertKey(alertKey);
            dismissAlert();
          }}
        >
          DISMISS ALARM
        </button>
      </div>
    </div>
  );
}
