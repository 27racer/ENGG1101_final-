import { IconHelmet } from "./icons/SensorIcons";

export function VisualPlaceholder() {
  return (
    <div className="visual-placeholder">
      <div className="visual-placeholder__icon-wrap" aria-hidden>
        <IconHelmet />
      </div>
      <p className="visual-placeholder__title">3D helmet preview</p>
      <p className="visual-placeholder__text">
        When you connect a 3D viewer, your helmet model and live Pi status will show here.
      </p>
    </div>
  );
}
