import { useMemo, useState } from "react";
import Filters, { type Category } from "@/components/Filters";
import TrendStream from "@/components/TrendStream";
import SentimentChart from "@/components/SentimentChart";
import CPIGauge from "@/components/CPIGauge";
import ViralPanel from "@/components/ViralPanel";
import { useRealTimeTrends } from "@/hooks/useRealTimeTrends";
import type { TrendTopic } from "@shared/api";

function classifyCategory(name: string): Category {
  const n = name.toLowerCase();
  if (/(ai|agent|neural|gpu|llm|model)/.test(n)) return "AI";
  if (/(crypto|defi|eth|btc|chain|layer)/.test(n)) return "Crypto";
  if (/(election|policy|govern|geopolit|state)/.test(n)) return "Politics";
  if (/(tech|infra|compute|startup)/.test(n)) return "Tech";
  if (/(bio|biohack|genome|crispr)/.test(n)) return "Bio";
  return "Other";
}

export default function Index() {
  const { data, sortedTopics, loading, error } = useRealTimeTrends({ intervalMs: 60000, immediate: true });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");

  const filtered: TrendTopic[] = useMemo(() => {
    let base = sortedTopics;
    if (category !== "All") base = base.filter((t) => classifyCategory(t.name) === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      base = base.filter((t) =>
        t.name.toLowerCase().includes(q) || t.keywords.some((k) => k.toLowerCase().includes(q)),
      );
    }
    return base;
  }, [sortedTopics, query, category]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-[0.3em] text-foreground/60">Project: Membit Pulse — Cypherpunk Edition</div>
        <h1 className="text-2xl md:text-3xl font-extrabold glow-cyan">AI Dashboard for Real-Time Trends</h1>
      </div>

      <Filters query={query} category={category} onQueryChange={setQuery} onCategoryChange={setCategory} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TrendStream topics={filtered} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          {data && <CPIGauge value={data.cpi.cpi} />}
          {data && <SentimentChart data={data.sentiment} />}
        </div>
      </div>

      <ViralPanel topics={filtered} />

      {loading && (
        <div className="text-sm text-foreground/60">Loading real-time data…</div>
      )}
      {error && (
        <div className="text-sm text-secondary">Failed to load latest trends. Showing cached/mock data.</div>
      )}
    </div>
  );
}
