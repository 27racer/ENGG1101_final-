import { Outlet } from "react-router-dom";
import { SensorDataProvider } from "../context/SensorDataContext";
import { AlertOverlay } from "./AlertOverlay";
import { BottomNav } from "./BottomNav";
import { AlertProvider } from "../context/AlertContext";

export function AppShell() {
  return (
    <SensorDataProvider>
      <AlertProvider>
        <div className="app-shell">
          <main className="app-main">
            <Outlet />
          </main>
          <BottomNav />
          <AlertOverlay />
        </div>
      </AlertProvider>
    </SensorDataProvider>
  );
}
