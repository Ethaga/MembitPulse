import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { SentimentBreakdown } from "@shared/api";

export interface SentimentChartProps {
  data: SentimentBreakdown;
  className?: string;
}

const COLORS = ["hsl(166 100% 50%)", "hsl(210 8% 40%)", "hsl(330 100% 50%)"]; // pos, neutral, neg

export default function SentimentChart({ data }: SentimentChartProps) {
  const pieData = [
    { name: "Positive", value: data.positive },
    { name: "Neutral", value: data.neutral },
    { name: "Negative", value: data.negative },
  ];
  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-[#0f0f0f]/80 neon-border p-4">
      <div className="mb-2 text-sm tracking-wide text-foreground/70">Sentiment & Context</div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} strokeWidth={2} stroke="hsl(var(--primary))" >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} filter="url(#glow)" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(0,255,204,.3)", borderRadius: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded-full border border-cyan-400/30 text-primary glow-cyan">#ai</span>
        <span className="px-2 py-1 rounded-full border border-cyan-400/30 text-secondary glow-magenta">#crypto</span>
        <span className="px-2 py-1 rounded-full border border-cyan-400/30 text-foreground/80">#governance</span>
        <span className="px-2 py-1 rounded-full border border-cyan-400/30 text-foreground/80">#memetics</span>
      </div>
    </div>
  );
}
