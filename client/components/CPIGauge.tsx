export interface CPIGaugeProps {
  value: number; // 0..100
  label?: string;
  className?: string;
}

export default function CPIGauge({ value, label = "Community Pulse Index", className }: CPIGaugeProps) {
  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;

  return (
    <div className={"rounded-2xl border border-cyan-400/30 bg-[#0f0f0f]/80 neon-border p-4 text-center " + (className ?? "") }>
      <div className="mb-2 text-sm tracking-wide text-foreground/70">{label}</div>
      <div className="flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(330 100% 50%)" />
              <stop offset="100%" stopColor="hsl(166 100% 50%)" />
            </linearGradient>
            <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx={size/2} cy={size/2} r={r} stroke="hsl(var(--primary) / .2)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size/2}
            cy={size/2}
            r={r}
            stroke="url(#grad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            fill="none"
            transform={`rotate(-90 ${size/2} ${size/2})`}
            filter="url(#outerGlow)"
            className="neon-pulse"
          />
          <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" className="fill-foreground text-3xl font-bold">
            {Math.round(pct)}
          </text>
          <text x="50%" y="66%" dominantBaseline="middle" textAnchor="middle" className="fill-foreground/70 text-xs">
            /100
          </text>
        </svg>
      </div>
    </div>
  );
}
