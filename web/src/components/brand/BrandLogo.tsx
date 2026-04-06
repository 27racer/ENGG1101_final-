/**
 * Smart Helmet brand mark — hard hat + signal arc (works on light or orange backgrounds).
 */
type Props = {
  /** "hero" = white on gradient; "surface" = orange on light bg */
  variant?: "hero" | "surface";
  size?: number;
  className?: string;
};

export function BrandLogo({ variant = "hero", size = 40, className = "" }: Props) {
  const stroke = variant === "hero" ? "#ffffff" : "var(--orange-600)";
  const fill = variant === "hero" ? "rgba(255,255,255,0.18)" : "var(--orange-tint)";
  const accent = variant === "hero" ? "#fff" : "var(--orange-500)";

  return (
    <svg
      className={`brand-logo ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="40" height="40" rx="11" fill={fill} />
      {/* Hard hat dome */}
      <path
        d="M10 22c0-5.5 4-10 10-10s10 4.5 10 10v2H10v-2z"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="none"
        opacity={variant === "hero" ? 0.95 : 1}
      />
      {/* Brim */}
      <path
        d="M8 24h24"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity={variant === "hero" ? 0.9 : 1}
      />
      {/* Sensor / pulse dot */}
      <circle cx="20" cy="17" r="2.25" fill={accent} opacity="0.95" />
      {/* Safety arc */}
      <path
        d="M14 14c2.5-2.2 5.8-3.5 9.5-3.5"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
