import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSensorData } from "../context/SensorDataContext";

function IconPi() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 4h12M8 4v8a4 4 0 008 0V4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 12v8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsPage() {
  const { piBaseUrl, setPiBaseUrl, connectionStatus } = useSensorData();
  const [draft, setDraft] = useState(piBaseUrl);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(piBaseUrl);
  }, [piBaseUrl]);

  function handleSave() {
    setPiBaseUrl(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const connLabel =
    connectionStatus === "live"
      ? "Receiving data"
      : connectionStatus === "connecting"
        ? "Connecting…"
        : connectionStatus === "error"
          ? "Unreachable"
          : "Not set";

  const connColor =
    connectionStatus === "live"
      ? "var(--ok)"
      : connectionStatus === "connecting"
        ? "var(--warn)"
        : connectionStatus === "error"
          ? "var(--danger)"
          : "var(--text-3)";

  return (
    <div className="page page--settings">
      <div className="page-top">
        <p className="page-eyebrow">Connection</p>
        <h1 className="page-title-lg">Settings</h1>
        <p className="page-sub-text">
          The helmet links to the Raspberry Pi over <strong>BLE</strong>. Enter the Pi address where
          this app can reach your sensor HTTP server (same LAN as the phone).
        </p>
      </div>

      <div className="page-body" style={{ paddingTop: 0 }}>
        <div className="settings-group">
          <span className="settings-group__label">Raspberry Pi</span>
          <div className="settings-card">
            <Link to="/settings/pi-login" className="settings-row settings-row--link">
              <span className="settings-row__icon" aria-hidden>
                <IconPi />
              </span>
              <span className="settings-row__text">
                <span className="settings-row__title">Pi web login</span>
                <span className="settings-row__sub">Open the Pi sign-in page in your browser</span>
              </span>
              <span className="settings-row__chev" aria-hidden>
                ›
              </span>
            </Link>
          </div>
        </div>

        <div className="settings-group">
          <span className="settings-group__label">Sensor server</span>
          <div className="settings-card">
            <div className="settings-row">
              <span className="settings-row__icon" aria-hidden>
                <IconPi />
              </span>
              <span className="settings-row__text">
                <span className="settings-row__title">Pi URL</span>
                <span className="settings-row__sub" style={{ color: connColor }}>
                  {connLabel}
                </span>
              </span>
            </div>
            <div style={{ padding: "8px 18px 14px" }}>
              <input
                type="url"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "var(--r-sm)",
                  border: "1.5px solid var(--border)",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  background: "var(--surface2)",
                  color: "var(--text)",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--orange-500)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                }}
              />
              <button
                type="button"
                onClick={handleSave}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "10px",
                  borderRadius: "var(--r-sm)",
                  border: "none",
                  background: saved ? "var(--ok)" : "var(--orange-600)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background .2s",
                }}
              >
                {saved ? "✓ Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
