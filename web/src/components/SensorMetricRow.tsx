import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  name: string;
  detail: string;
  value: string;
  valueTone?: "default" | "ok" | "warn" | "danger";
};

export function SensorMetricRow({ icon, name, detail, value, valueTone = "default" }: Props) {
  return (
    <div className="sensor-metric">
      <div className="sensor-metric__icon" aria-hidden>
        {icon}
      </div>
      <div className="sensor-metric__body">
        <div className="sensor-metric__name">{name}</div>
        <div className="sensor-metric__detail">{detail}</div>
      </div>
      <div className={"sensor-metric__value sensor-metric__value--" + valueTone}>{value}</div>
    </div>
  );
}
