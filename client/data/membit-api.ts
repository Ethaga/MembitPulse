import type { TrendResponse } from "@shared/api";

export async function fetchTrends(signal?: AbortSignal): Promise<TrendResponse> {
  const res = await fetch("/api/membit/trends", { signal, headers: { "accept": "application/json" } });
  if (!res.ok) throw new Error(`Failed to fetch trends: ${res.status}`);
  const json = (await res.json()) as TrendResponse;
  return json;
}

export async function searchPosts(query: string, limit = 25) {
  const res = await fetch("/api/membit/search-posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) throw new Error(`Search posts failed ${res.status}`);
  return res.json();
}

export async function searchClusters(query: string, limit = 10) {
  const res = await fetch("/api/membit/search-clusters", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) throw new Error(`Search clusters failed ${res.status}`);
  return res.json();
}
