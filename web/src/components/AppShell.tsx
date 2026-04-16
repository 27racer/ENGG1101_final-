import { Outlet } from "react-router-dom";
import { SensorDataProvider } from "../context/SensorDataContext";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <SensorDataProvider>
      <div className="app-shell">
        <main className="app-main">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </SensorDataProvider>
  );
}
