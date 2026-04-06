import { NavLink } from "react-router-dom";
import { IconDashboard, IconHome, IconSettings } from "./icons/NavIcons";

const LINKS: { to: string; label: string; end?: boolean; Icon: typeof IconHome }[] = [
  { to: "/",           label: "Home",     end: true, Icon: IconHome },
  { to: "/dashboard",  label: "Dashboard",         Icon: IconDashboard },
  { to: "/settings",   label: "Settings",          Icon: IconSettings },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav__tabs">
        {LINKS.map(({ to, label, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end ?? false}
            className={({ isActive }) =>
              "bottom-nav__link" + (isActive ? " bottom-nav__link--active" : "")
            }
          >
            <span className="bottom-nav__icon-wrap" aria-hidden>
              <Icon />
            </span>
            <span className="bottom-nav__label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
