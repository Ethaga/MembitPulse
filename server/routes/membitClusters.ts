import type { RequestHandler } from "express";

async function safeJson(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text };
  }
}

export const getClustersWithPosts: RequestHandler = async (req, res) => {
  try {
    const apiKey = process.env.MEMBIT_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'MEMBIT_API_KEY not configured' });

    const clustersUrl = 'https://api.membit.ai/v1/clusters/search';
    const postsUrl = 'https://api.membit.ai/v1/posts/search';

    // Fetch clusters — clusters API requires a query parameter 'q'; use 'trending' as default
    const clustersUrlObj = new URL(clustersUrl);
    clustersUrlObj.searchParams.set('q', 'trending');
    clustersUrlObj.searchParams.set('limit', '10');

    // Fetch clusters
    const cResp = await fetch(clustersUrlObj.toString(), {
      method: 'GET',
      headers: { 'X-Membit-Api-Key': apiKey, Accept: 'application/json' },
    });
    const cText = await cResp.text();
    if (!cResp.ok) {
      return res.status(502).json({ error: `Membit clusters search error ${cResp.status}: ${cText}` });
    }
    let cJson: any;
    try { cJson = JSON.parse(cText); } catch (e) { return res.status(502).json({ error: 'Invalid JSON from clusters/search', raw: cText }); }

    const clusters = Array.isArray(cJson.clusters) ? cJson.clusters : (Array.isArray(cJson.data) ? cJson.data : []);

    // For each cluster, fetch top posts. We'll try posts/search with cluster_label param; if that fails, fetch all posts and filter.
    const enriched: any[] = [];

    for (const cl of clusters.slice(0, 10)) {
      const label = cl.label ?? cl.name ?? '';
      let posts: any[] = [];
      try {
        // try with query param cluster_label
        const url = new URL(postsUrl);
        url.searchParams.set('cluster_label', label);
        url.searchParams.set('limit', '3');
        const pResp = await fetch(url.toString(), { method: 'GET', headers: { 'X-Membit-Api-Key': apiKey, Accept: 'application/json' } });
        const pText = await pResp.text();
        if (pResp.ok) {
          let pJson: any;
          try { pJson = JSON.parse(pText); } catch (e) { pJson = { raw: pText }; }
          posts = Array.isArray(pJson.posts) ? pJson.posts : (Array.isArray(pJson.data) ? pJson.data : []);
        } else {
          // fallback: try searching posts without cluster filter and filter client-side
          const fallbackResp = await fetch(postsUrl, { method: 'GET', headers: { 'X-Membit-Api-Key': apiKey, Accept: 'application/json' } });
          const fallbackText = await fallbackResp.text();
          if (fallbackResp.ok) {
            let fJson: any;
            try { fJson = JSON.parse(fallbackText); } catch (e) { fJson = { raw: fallbackText }; }
            const allPosts = Array.isArray(fJson.posts) ? fJson.posts : (Array.isArray(fJson.data) ? fJson.data : []);
            posts = allPosts.filter((p: any) => (p.cluster_label ?? '') === label).slice(0, 3);
          }
        }
      } catch (err) {
        // ignore per-cluster errors
        posts = [];
      }

      enriched.push({
        label,
        summary: cl.summary ?? cl.description ?? '',
        category: cl.category ?? cl.tags ?? null,
        engagement_score: cl.engagement_score ?? cl.search_score ?? 0,
        posts,
      });
    }

    res.json({ ok: true, clusters: enriched });
  } catch (err: any) {
    console.error('/api/membit/clusters error', err);
    res.status(500).json({ error: String(err) });
  }
};
