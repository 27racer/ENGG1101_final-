type Props = { value: number; tone?: "ok" | "warn" | "danger"; size?: number };

const COLORS = { ok: "#16A34A", warn: "#D97706", danger: "#DC2626" };

export function CircleProgress({ value, tone = "ok", size = 44 }: Props) {
  const stroke = 3;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  const cx = size / 2;
  const color = COLORS[tone];
  const fontSize = size < 38 ? "8px" : "9px";

  return (
    <div className="circle-progress" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: "block" }}
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="#E7E5E4"
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </svg>
      <span
        className="circle-progress__label"
        style={{ fontSize, color }}
      >
        {value}%
      </span>
    </div>
  );
}
