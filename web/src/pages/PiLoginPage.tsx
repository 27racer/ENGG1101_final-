import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSensorData } from "../context/SensorDataContext";
import { piHomeUrl, piLoginUrl } from "../utils/piUrls";

function IconChevronBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPiScreen() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 16v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PiLoginPage() {
  const { piBaseUrl } = useSensorData();
  const [piHost, setPiHost] = useState(piBaseUrl);

  useEffect(() => {
    setPiHost(piBaseUrl);
  }, [piBaseUrl]);

  const trimmed = piHost.trim();
  const loginTarget = trimmed ? piLoginUrl(trimmed) : "";
  const homeTarget = trimmed ? piHomeUrl(trimmed) : "";

  function goToPiLogin() {
    if (loginTarget) window.location.assign(loginTarget);
  }

  function openPiHome() {
    if (homeTarget) window.open(homeTarget, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="page page--pi-login">
      <div className="page-top page-top--pi-login">
        <Link to="/settings" className="pi-login-back" aria-label="Back to Settings">
          <IconChevronBack />
        </Link>
        <p className="page-eyebrow">Raspberry Pi</p>
        <h1 className="page-title-lg">Pi web login</h1>
        <p className="page-sub-text">
          Sign in on the Pi to manage services or the gateway. Enter where your Pi is reachable, then
          open login or home.
        </p>
      </div>

      <div className="page-body" style={{ paddingTop: 0 }}>
        <div className="settings-group">
          <div className="settings-card pi-login-card">
            <div className="pi-login-card__visual" aria-hidden>
              <span className="pi-login-card__icon">
                <IconPiScreen />
              </span>
            </div>
            <div className="pi-login-card__field">
              <label className="pi-login-card__label" htmlFor="pi-host">
                Pi on your network
              </label>
              <input
                id="pi-host"
                type="url"
                value={piHost}
                onChange={(e) => setPiHost(e.target.value)}
                className="pi-login-card__input"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            {trimmed ? (
              <p className="pi-login-card__url">
                <span className="pi-login-card__url-label">Login URL</span>
                <code className="pi-login-card__url-value">{loginTarget}</code>
              </p>
            ) : null}
            <div className="pi-login-actions">
              <button
                type="button"
                className="pi-login-btn pi-login-btn--primary"
                disabled={!trimmed}
                onClick={goToPiLogin}
              >
                Go to Pi login
              </button>
              <button
                type="button"
                className="pi-login-btn pi-login-btn--secondary"
                disabled={!trimmed}
                onClick={openPiHome}
              >
                Open Pi home in new tab
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
