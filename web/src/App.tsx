import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { AlertsPage } from "./pages/AlertsPage";
import { PiLoginPage } from "./pages/PiLoginPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<AlertsPage />} />
        <Route path="alerts" element={<Navigate to="/dashboard" replace />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/pi-login" element={<PiLoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
