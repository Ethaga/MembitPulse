import type { TrendResponse } from "@shared/api";

export async function fetchTrends(signal?: AbortSignal): Promise<TrendResponse> {
  const res = await fetch("/api/membit/trends", { signal, headers: { "accept": "application/json" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`Failed to fetch trends: ${res.status} ${text}`);
  try {
    return JSON.parse(text) as TrendResponse;
  } catch (e) {
    throw new Error(`Failed to parse trends JSON: ${(e as Error).message}. Raw text: ${text}`);
  }
}

export async function searchPosts(query: string, limit = 25) {
  const res = await fetch("/api/membit/search-posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Search posts failed ${res.status} ${text}`);
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse searchPosts JSON: ${(e as Error).message}. Raw text: ${text}`);
  }
}

export async function searchClusters(query: string, limit = 10) {
  const res = await fetch("/api/membit/search-clusters", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Search clusters failed ${res.status} ${text}`);
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse searchClusters JSON: ${(e as Error).message}. Raw text: ${text}`);
  }
}
