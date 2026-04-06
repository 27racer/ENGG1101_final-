import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/brand/BrandLogo";
import { useAlerts } from "../context/AlertContext";
import { useSensorData } from "../context/SensorDataContext";
import { buildInstalledSystems } from "../sensorTelemetryContent";
import {
  countPopulatedSensorChannels,
  readableAlertName,
} from "../types/sensorData";

const HelmetViewer = lazy(() =>
  import("../components/HelmetViewer").then((m) => ({ default: m.HelmetViewer }))
);

function SignalIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="4.5" y="5" width="3" height="7" rx="1" />
      <rect x="9" y="2.5" width="3" height="9.5" rx="1" />
      <rect x="13.5" y="0" width="2.5" height="12" rx="1" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="currentColor" aria-hidden>
      <rect x="0" y="1" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
      <rect x="1.5" y="2.5" width="13" height="7" rx="1" />
      <path d="M19 4.5v3a1.5 1.5 0 000-3z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 18a2 2 0 11-4 0h4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M6.5 16h11l-1-8.5A4 4 0 0012.5 4h-1a4 4 0 00-4 3.5L6.5 16z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

export function DashboardPage() {
  const { data, alertLevel, connectionStatus } = useSensorData();
  const { triggerAlert } = useAlerts();
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(null);
  const isLive = connectionStatus === "live";

  const systems = useMemo(() => buildInstalledSystems(data), [data]);

  const sensorsOnline = countPopulatedSensorChannels(data, isLive);
  const activeAlertsDisplay = !isLive ? "—" : alertLevel === "OK" ? "0" : "1";
  const helmetDisplay = !isLive ? "—" : data.helmetOn ? "Yes" : "No";
  const sensorsDisplay = sensorsOnline === null ? "—" : String(sensorsOnline);

  const statusLine = !isLive
    ? "Connect the Pi in Settings — readings appear here when data is live."
    : `Status: ${readableAlertName(alertLevel)}`;

  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="page page--home">
      <div className="page-hero-gradient">
        <div className="page-hero-gradient__inner">
          <div className="status-bar">
            <span>9:41</span>
            <div className="status-bar__icons">
              <SignalIcon />
              <BatteryIcon />
            </div>
          </div>

          <div className="hero-top-row">
            <div className="hero-brand">
              <div className="hero-brand__logo-wrap" aria-hidden>
                <BrandLogo variant="hero" size={40} />
              </div>
              <div className="hero-brand__text">
                <span className="hero-brand__name">Smart Helmet</span>
                <span className="hero-brand__tagline">Worksite safety · BLE · IoT</span>
              </div>
            </div>
            <button type="button" className="hero-bell" aria-label="Notifications (coming soon)">
              <IconBell />
            </button>
          </div>

          <div className="hero-status-blurb">
            <p className="hero-status-blurb__text">{statusLine}</p>
          </div>

          <div className="hero-sub-row">
            <div>
              <span className="hero-sub__val">{activeAlertsDisplay}</span>
              <span className="hero-sub__key">Active alerts</span>
            </div>
            <div>
              <span className="hero-sub__val">{sensorsDisplay}</span>
              <span className="hero-sub__key">Sensors online</span>
            </div>
            <div>
              <span className="hero-sub__val">{helmetDisplay}</span>
              <span className="hero-sub__key">Helmet on</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body page-body--home">
        <div
          className={
            "connection-banner" +
            (connectionStatus === "error" ? " connection-banner--warn" : "")
          }
        >
          <div className="connection-banner__icon" aria-hidden>
            <BrandLogo variant="surface" size={36} />
          </div>
          <div className="connection-banner__text">
            <p className="connection-banner__title">
              {connectionStatus === "live" && "Live from Raspberry Pi"}
              {connectionStatus === "connecting" && "Connecting to Pi…"}
              {connectionStatus === "error" && "Cannot reach Pi"}
              {connectionStatus === "disconnected" && "Pi URL not set"}
            </p>
            <p className="connection-banner__sub">
              {connectionStatus === "live" &&
                "Sensor data from GET /api/sensors. Helmet ↔ Pi uses BLE."}
              {connectionStatus === "connecting" && "Trying your Pi URL from Settings…"}
              {connectionStatus === "error" &&
                "Check the Pi is on, on the same network, and serving /api/sensors."}
              {connectionStatus === "disconnected" &&
                "Add the Pi sensor server URL in Settings to load real readings."}
            </p>
          </div>
          <Link to="/settings" className="connection-banner__cta">
            {connectionStatus === "live" ? "Pi" : "Set URL"}
          </Link>
        </div>

        <div className="card home-card at-a-glance-card">
          <div className="card-header">
            <span className="card-header__title">At a glance</span>
            <span className="card-header__badge">
              <span className="card-header__live-dot" />
              {today}
            </span>
          </div>

          <div className="at-a-glance-stack">
            <div className="systems-section systems-section--embedded systems-section--last">
              <div className="sensor-readings-head">
                <h3 className="sensor-readings-head__title">What the app is reading now</h3>
                <p className="sensor-readings-head__sub">
                  {isLive
                    ? "Tap a row to see the full line — numbers stay short on the surface."
                    : "Values fill in after the Pi is connected and streaming."}
                </p>
              </div>
              <div className="sensor-readings" role="list">
                {systems.map((s) => {
                  const open = expandedReadingId === s.id;
                  return (
                    <div key={s.id} className="sensor-readings__item" role="listitem">
                      <button
                        type="button"
                        className={`sensor-readings__row${open ? " sensor-readings__row--open" : ""}`}
                        onClick={() =>
                          setExpandedReadingId((id) => (id === s.id ? null : s.id))
                        }
                        aria-expanded={open}
                      >
                        <span className="sensor-readings__label">{s.readingLabel}</span>
                        <span className="sensor-readings__value-wrap">
                          <span
                            className={`sensor-readings__value sensor-readings__value--${s.tone}`}
                          >
                            {!isLive ? "—" : s.valueShort}
                          </span>
                          <span className="sensor-readings__chev" aria-hidden>
                            {open ? "▾" : "▸"}
                          </span>
                        </span>
                      </button>
                      {open ? (
                        <div className="sensor-readings__detail">
                          <p className="sensor-readings__detail-text">
                            {!isLive
                              ? "Waiting for live data from your Raspberry Pi."
                              : s.detailText}
                          </p>
                          <p className="sensor-readings__hw">{s.hardware}</p>
                          <button
                            type="button"
                            className="sensor-readings__test"
                            disabled={!isLive}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerAlert(s.alert);
                            }}
                          >
                            Test alarm
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <p className="at-a-glance-hint hint">
                <strong>Test alarm</strong> plays the full-screen alert for practice — it does not
                change hardware.
              </p>
            </div>
          </div>
        </div>

        <div className="overview-card home-card home-card--3d">
          <div className="card-header">
            <span className="card-header__title">Helmet view</span>
            <span className="card-header__badge">
              <span className="card-header__live-dot" />
              {today}
            </span>
          </div>
          <div className="overview-card__visual overview-card__visual--3d">
            <Suspense
              fallback={
                <div className="helmet-viewer helmet-viewer--loading" role="status">
                  Loading 3D helmet…
                </div>
              }
            >
              <HelmetViewer />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
