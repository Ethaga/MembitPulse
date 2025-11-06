import type { RequestHandler } from "express";

type CacheEntry = { ts: number; data: any };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 1000; // 30s

async function callMembit(path: string, body: any) {
  const apiKey = process.env.MEMBIT_API_KEY;
  if (!apiKey) throw new Error("MEMBIT_API_KEY not configured");

  const url = `https://api.membit.ai/v1/${path}`;
  const resp = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // read body text once and parse
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Membit error ${resp.status}: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    // fallback to raw text
    return text;
  }
}

export const searchPosts: RequestHandler = async (req, res) => {
  try {
    const q = (req.body?.query ?? req.query.q ?? "") as string;
    const limit = parseInt((req.body?.limit ?? req.query.limit ?? 25) as any, 10) || 25;
    const cacheKey = `search-posts:${q}:${limit}`;
    const now = Date.now();
    const hit = cache.get(cacheKey);
    if (hit && now - hit.ts < CACHE_TTL) return res.json(hit.data);

    const body = { query: q, limit };
    const json = await callMembit("search-posts", body).catch((e) => {
      console.error("membit search-posts call failed", e);
      return null;
    });
    const out = json ?? { results: [] };
    cache.set(cacheKey, { ts: now, data: out });
    res.json(out);
  } catch (err: any) {
    console.error("/api/membit/search-posts error", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "internal" });
  }
};

export const searchClusters: RequestHandler = async (req, res) => {
  try {
    const q = (req.body?.query ?? req.query.q ?? "") as string;
    const limit = parseInt((req.body?.limit ?? req.query.limit ?? 10) as any, 10) || 10;
    const cacheKey = `search-clusters:${q}:${limit}`;
    const now = Date.now();
    const hit = cache.get(cacheKey);
    if (hit && now - hit.ts < CACHE_TTL) return res.json(hit.data);

    const body = { query: q, limit };
    const json = await callMembit("search-clusters", body).catch((e) => {
      console.error("membit search-clusters call failed", e);
      return null;
    });
    const out = json ?? { clusters: [] };
    cache.set(cacheKey, { ts: now, data: out });
    res.json(out);
  } catch (err: any) {
    console.error("/api/membit/search-clusters error", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "internal" });
  }
};
