import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SensorSection({ title, subtitle, children }: Props) {
  return (
    <section className="sensor-section">
      <div className="sensor-section__head">
        <h2 className="sensor-section__title">{title}</h2>
        {subtitle ? <p className="sensor-section__sub">{subtitle}</p> : null}
      </div>
      <div className="sensor-section__card">{children}</div>
    </section>
  );
}
