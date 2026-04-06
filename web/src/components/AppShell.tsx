import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { AlertProvider, useAlerts } from "../context/AlertContext";
import type { AlertInfo } from "../context/AlertContext";
import { SensorDataProvider, useSensorData } from "../context/SensorDataContext";
import type { AlertLevel, SensorReading } from "../types/sensorData";
import { AlertOverlay } from "./AlertOverlay";
import { BottomNav } from "./BottomNav";

function levelToAlertInfo(level: AlertLevel, d: SensorReading): AlertInfo {
  switch (level) {
    case "!! FALL !!":
      return {
        sensor: "MPU6050 · I2C 0x68",
        type: "Fall Detected!",
        detail: `Total-g: ${d.totalG.toFixed(2)}g — fall or hard impact`,
        alarmType: "fall",
      };
    case "HELMET OFF":
      return {
        sensor: "Touch GPIO18 · IR GPIO20",
        type: "Helmet Removed!",
        detail: "Head contact lost on both sensors for ≥3 s",
        alarmType: "helmet_off",
      };
    case "PROX DANGER":
      return {
        sensor: "HC-SR04 · GPIO23/24",
        type: "Proximity Danger!",
        detail: `Object at ${d.usDist?.toFixed(0) ?? "?"}cm — danger zone (<40 cm)`,
        alarmType: "proximity",
      };
    case "TOF DANGER":
      return {
        sensor: "VL53L0X · I2C 0x29",
        type: "Proximity Danger!",
        detail: `ToF reading: ${d.tofDist ?? "?"}mm — danger zone (<250 mm)`,
        alarmType: "proximity",
      };
    case "HEAT EXTREME":
      return {
        sensor: "DHT22 · GPIO21",
        type: "Extreme Heat!",
        detail: `Heat index ${d.heatIndex?.toFixed(1) ?? "?"}°C — evacuate immediately`,
        alarmType: "heat",
      };
    case "HEAT DANGER":
      return {
        sensor: "DHT22 · GPIO21",
        type: "Heat Stress Danger!",
        detail: `Heat index ${d.heatIndex?.toFixed(1) ?? "?"}°C — take a break now`,
        alarmType: "heat",
      };
    case "HEAT CAUTION":
      return {
        sensor: "DHT22 · GPIO21",
        type: "Heat Caution",
        detail: `Heat index ${d.heatIndex?.toFixed(1) ?? "?"}°C — stay hydrated`,
        alarmType: "heat",
      };
    case "PROX WARN":
      return {
        sensor: "HC-SR04 · GPIO23/24",
        type: "Proximity Warning",
        detail: `Object at ${d.usDist?.toFixed(0) ?? "?"}cm — approaching limit`,
        alarmType: "proximity",
      };
    case "TOF WARN":
      return {
        sensor: "VL53L0X · I2C 0x29",
        type: "Proximity Warning",
        detail: `ToF reading: ${d.tofDist ?? "?"}mm — approaching limit`,
        alarmType: "proximity",
      };
    case "LOW LIGHT":
    default:
      return {
        sensor: "BH1750 · I2C 0x23",
        type: "Low Visibility!",
        detail: `Illuminance: ${d.lux?.toFixed(0) ?? "?"}lux — dangerously dark`,
        alarmType: "emergency",
      };
  }
}

function SensorAlertBridge() {
  const { data, alertLevel, connectionStatus } = useSensorData();
  const { triggerAlert, dismissAlert, activeAlert } = useAlerts();
  const prevLevelRef = useRef<AlertLevel>("OK");

  useEffect(() => {
    const isLive = connectionStatus === "live";
    const level = alertLevel;

    if (isLive && level === "OK" && activeAlert) {
      dismissAlert();
    }

    if (isLive && level !== "OK" && level !== prevLevelRef.current) {
      triggerAlert(levelToAlertInfo(level, data));
    }

    prevLevelRef.current = level;
  }, [alertLevel, connectionStatus, data, activeAlert, dismissAlert, triggerAlert]);

  return null;
}

export function AppShell() {
  return (
    <SensorDataProvider>
      <AlertProvider>
        <SensorAlertBridge />
        <div className="app-shell">
          <main className="app-main">
            <Outlet />
          </main>
          <BottomNav />
        </div>
        <AlertOverlay />
      </AlertProvider>
    </SensorDataProvider>
  );
}
