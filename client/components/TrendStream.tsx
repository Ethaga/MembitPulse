import type { TrendTopic } from "@shared/api";
import { cn } from "@/lib/utils";

export interface TrendStreamProps {
  topics: TrendTopic[];
  className?: string;
}

function Sparkline({ data }: { data: number[] }) {
  const width = 120;
  const height = 28;
  const max = Math.max(1, ...data);
  const min = Math.min(...data);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / Math.max(1, max - min)) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        className="[filter:drop-shadow(0_0_6px_hsl(var(--primary)/.8))]"
      />
    </svg>
  );
}

function ViralBadge({ score }: { score: number }) {
  const label = score > 80 ? "🔥 Viral" : score >= 50 ? "🚀 Rising" : "💤 Stable";
  const color = score > 80 ? "text-secondary" : score >= 50 ? "text-primary" : "text-foreground/70";
  return <span className={cn("text-xs font-semibold", color)}>{label}</span>;
}

export function TrendStream({ topics, className }: TrendStreamProps) {
  return (
    <div className={cn("rounded-2xl border border-cyan-400/30 bg-[#0f0f0f]/80 neon-border", className)}>
      <div className="px-4 py-3 border-b border-cyan-400/20 text-sm tracking-wide text-foreground/70">Real-Time Trend Stream</div>
      <ul className="divide-y divide-cyan-400/15">
        {topics.map((t) => (
          <li key={t.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors">
            <div className="col-span-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary neon-pulse" />
              <div className="font-semibold text-foreground">{t.name}</div>
            </div>
            <div className="col-span-2 text-xs text-foreground/80">
              Mentions: <span className="text-primary font-semibold">{t.mentions.toLocaleString()}</span>
            </div>
            <div className={cn("col-span-2 text-xs", t.growth24h >= 0 ? "text-primary" : "text-secondary")}>24h: {t.growth24h}%</div>
            <div className="col-span-2 text-xs text-foreground/80">Sent: {Math.round(((t.sentiment + 1) / 2) * 100)}%</div>
            <div className="col-span-1"><ViralBadge score={t.viralScore} /></div>
            <div className="col-span-1 justify-self-end">
              <Sparkline data={t.spark} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default TrendStream;
