import type { TrendTopic } from "@shared/api";

export interface ViralPanelProps {
  topics: TrendTopic[];
  className?: string;
}

function badgeColor(score: number) {
  if (score > 80) return "border-secondary/40 text-secondary glow-magenta";
  if (score >= 50) return "border-primary/40 text-primary glow-cyan";
  return "border-foreground/20 text-foreground/80";
}

export default function ViralPanel({ topics, className }: ViralPanelProps) {
  const top = topics.slice(0, 6).sort((a, b) => b.viralScore - a.viralScore);
  return (
    <div className={("rounded-2xl border border-cyan-400/30 bg-[#0f0f0f]/80 neon-border p-4 " + (className ?? "")).trim()}>
      <div className="mb-2 text-sm tracking-wide text-foreground/70">Viral Prediction Engine</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {top.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-cyan-400/20 px-3 py-2 hover:bg-primary/5">
            <div>
              <div className="font-semibold text-foreground">{t.name}</div>
              <div className="text-xs text-foreground/70">score: <span className="text-primary font-semibold">{t.viralScore}</span></div>
            </div>
            <span className={("px-2 py-1 rounded-full border text-xs font-semibold " + badgeColor(t.viralScore)).trim()}>
              {t.viralScore > 80 ? "🔥 Viral" : t.viralScore >= 50 ? "🚀 Rising" : "💤 Stable"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
