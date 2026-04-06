import { useEffect, useMemo, useState } from "react";
import { fetchPiAlertHistory, type AlertHistoryDay } from "../api/piAlertHistory";
import { useSensorData } from "../context/SensorDataContext";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildEmptyWeek(): AlertHistoryDay[] {
  const out: AlertHistoryDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push({
      day: DAY_SHORT[d.getDay()],
      fall: 0,
      heat: 0,
      prox: 0,
    });
  }
  return out;
}

const CHART_H = 100;

function pct(totalWeek: number, n: number) {
  if (totalWeek === 0) return 0;
  return Math.round((n / totalWeek) * 100);
}

function AlertBarChart({
  history,
  maxCount,
}: {
  history: AlertHistoryDay[];
  maxCount: number;
}) {
  const scale = Math.max(maxCount, 1);
  return (
    <div className="alert-chart alert-chart--st" aria-label="7-day alert history">
      <div className="alert-chart-baseline" />
      {history.map(({ day, fall, heat, prox }, i) => {
        const total = fall + heat + prox;
        const heatH = Math.round((heat / scale) * CHART_H);
        const fallH = Math.round((fall / scale) * CHART_H);
        const proxH = Math.round((prox / scale) * CHART_H);
        return (
          <div className="alert-chart__col" key={`${day}-${i}`}>
            <div className="alert-chart__bars">
              {total === 0 ? (
                <div className="alert-chart__bar alert-chart__bar--base" />
              ) : (
                <>
                  {heatH > 0 && (
                    <div
                      className="alert-chart__bar alert-chart__bar--orange"
                      style={{ height: heatH }}
                    />
                  )}
                  {fallH > 0 && (
                    <div
                      className="alert-chart__bar alert-chart__bar--yellow"
                      style={{ height: fallH }}
                    />
                  )}
                  {proxH > 0 && (
                    <div
                      className="alert-chart__bar"
                      style={{
                        height: proxH,
                        background: "var(--orange-200)",
                      }}
                    />
                  )}
                </>
              )}
            </div>
            <span className="alert-chart__label">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AlertsPage() {
  const { piBaseUrl, connectionStatus } = useSensorData();
  const [history, setHistory] = useState<AlertHistoryDay[]>(buildEmptyWeek);

  useEffect(() => {
    const base = piBaseUrl.trim();
    if (!base || connectionStatus === "disconnected") {
      setHistory(buildEmptyWeek());
      return;
    }

    let cancelled = false;
    (async () => {
      const rows = await fetchPiAlertHistory(base);
      if (cancelled) return;
      if (rows && rows.length) {
        setHistory(rows.slice(0, 7));
      } else {
        setHistory(buildEmptyWeek());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [piBaseUrl, connectionStatus]);

  const totals = useMemo(() => {
    const totalFalls = history.reduce((s, d) => s + d.fall, 0);
    const totalHeat = history.reduce((s, d) => s + d.heat, 0);
    const totalProx = history.reduce((s, d) => s + d.prox, 0);
    const totalWeek = totalFalls + totalHeat + totalProx;
    const maxCount = Math.max(...history.map((d) => d.fall + d.heat + d.prox), 1);
    return { totalFalls, totalHeat, totalProx, totalWeek, maxCount };
  }, [history]);

  const breakdown = [
    {
      key: "heat",
      label: "Heat",
      count: totals.totalHeat,
      pct: pct(totals.totalWeek, totals.totalHeat),
      swatch: "alerts-chart-legend__swatch alerts-chart-legend__swatch--heat",
    },
    {
      key: "fall",
      label: "Fall",
      count: totals.totalFalls,
      pct: pct(totals.totalWeek, totals.totalFalls),
      swatch: "alerts-chart-legend__swatch alerts-chart-legend__swatch--fall",
    },
    {
      key: "prox",
      label: "Proximity",
      count: totals.totalProx,
      pct: pct(totals.totalWeek, totals.totalProx),
      swatch: "alerts-chart-legend__swatch alerts-chart-legend__swatch--prox",
    },
  ] as const;

  return (
    <div className="page page--dashboard-tab">
      <div className="st-screen">
        <header className="st-hero">
          <p className="st-hero__eyebrow">Last 7 days</p>
          <p
            className="st-hero__value"
            aria-label={
              totals.totalWeek === 0 ? "Zero alerts in the last 7 days" : `${totals.totalWeek} total alerts`
            }
          >
            {totals.totalWeek === 0 ? "—" : totals.totalWeek}
          </p>
          <p className="st-hero__unit">alerts</p>
          <p className="st-hero__sub">Heat, fall, and proximity — from the Pi</p>
        </header>

        <section className="st-chart-panel" aria-labelledby="st-chart-title">
          <div className="st-chart-panel__head">
            <h2 id="st-chart-title" className="st-chart-panel__title">
              Daily
            </h2>
            <ul className="alerts-chart-legend st-chart-legend" aria-label="Series">
              <li>
                <span className="alerts-chart-legend__swatch alerts-chart-legend__swatch--heat" />
                Heat
              </li>
              <li>
                <span className="alerts-chart-legend__swatch alerts-chart-legend__swatch--fall" />
                Fall
              </li>
              <li>
                <span className="alerts-chart-legend__swatch alerts-chart-legend__swatch--prox" />
                Proximity
              </li>
            </ul>
          </div>
          <div className="st-chart-inner">
            <AlertBarChart history={history} maxCount={totals.maxCount} />
          </div>
        </section>

        <section className="st-group" aria-labelledby="st-by-cat">
          <h2 id="st-by-cat" className="st-group__label">
            By category
          </h2>
          <ul className="st-group__list">
            {breakdown.map((row) => (
              <li key={row.key} className="st-row">
                <span className={row.swatch} aria-hidden />
                <span className="st-row__name">{row.label}</span>
                <span className="st-row__pct">{row.pct}%</span>
                <span className="st-row__val">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
