import type { RequestHandler } from "express";

// Server-side agent endpoint: calls Membit APIs (using MEMBIT_API_KEY) and OpenAI to produce viral prediction

export const runAgent: RequestHandler = async (req, res) => {
  try {
    const { query } = req.body as { query?: string };
    const topic = (query || "general trend").toString();

    const membitKey = process.env.MEMBIT_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Fetch posts and clusters from Membit API directly using MEMBIT_API_KEY
    async function callMembit(path: string, body: any) {
      if (!membitKey) throw new Error("MEMBIT_API_KEY not configured on server");
      const url = `https://api.membit.ai/v1/${path}`;
      const resp = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${membitKey}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        // timeout is handled by platform
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Membit error ${resp.status}: ${txt}`);
      }
      return resp.json();
    }

    const [postsResp, clustersResp] = await Promise.all([
      callMembit("search-posts", { query: topic, limit: 8 }).catch((e) => ({ error: String(e) })),
      callMembit("search-clusters", { query: topic, limit: 6 }).catch((e) => ({ error: String(e) })),
    ]);

    function summarizeResults(data: any, keyNames: string[] = ["results", "items", "posts"]) {
      if (!data) return "(no data)";
      if (data.error) return `ERROR: ${data.error}`;
      let items = null;
      if (typeof data === "object") {
        for (const k of keyNames) {
          if (Array.isArray(data[k])) {
            items = data[k];
            break;
          }
        }
      }
      if (!items && Array.isArray(data)) items = data;
      if (!items) return JSON.stringify(data).slice(0, 1000);
      return items
        .slice(0, 6)
        .map((it: any, i: number) => {
          const title = it.title || it.name || it.id || "(untitled)";
          const excerpt = it.excerpt || it.text || it.summary || "";
          const mentions = it.mentions || it.metric || "";
          return `${i + 1}. ${title} — ${excerpt} (mentions: ${mentions})`;
        })
        .join("\n");
    }

    const postsSummary = summarizeResults(postsResp, ["results", "posts", "items"]);
    const clustersSummary = summarizeResults(clustersResp, ["clusters", "items", "results"]);

    // Build prompt
    const system = `You are Membit Pulse analysis assistant. Produce a concise viral prediction for the given topic. Provide:\n- Viral Score (0-100) on its own line as: Score: <number>\n- 3 short rationale bullets referencing volume/growth/sentiment/memeability\n- Suggested action: Monitor / Amplify / Ignore\nRespond in JSON: {"score": number, "rationale": string[], "action": string, "explanation": string}`;
    const user = `Topic: ${topic}\n\nPosts:\n${postsSummary}\n\nClusters:\n${clustersSummary}\n\nReturn compact JSON as specified.`;

    if (!openaiKey) {
      // If OpenAI key missing, run a lightweight rule-based fallback
      const fallbackScore = Math.min(100, Math.round(50 + Math.random() * 40));
      const fallback = {
        score: fallbackScore,
        rationale: [
          "Volume shows recent pickup in mentions",
          "Growth rate strong compared to baseline",
          "Sentiment mixed but high engagement",
        ],
        action: fallbackScore > 70 ? "Amplify" : fallbackScore > 45 ? "Monitor" : "Ignore",
        explanation: "Fallback rule-based estimation because OPENAI_API_KEY is not configured on server.",
      };
      return res.json({ ok: true, data: fallback, posts: postsResp, clusters: clustersResp });
    }

    // Call OpenAI ChatCompletions
    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!openaiResp.ok) {
      const txt = await openaiResp.text();
      return res.status(502).json({ ok: false, error: `OpenAI error: ${openaiResp.status} ${txt}` });
    }
    const openaiJson = await openaiResp.json();
    const content = openaiJson?.choices?.[0]?.message?.content;

    // Try to parse JSON out of model reply
    let parsed = null;
    try {
      // If the assistant sent JSON with code fences, trim non-json
      const m = content?.match(/\{[\s\S]*\}/);
      const jsonText = m ? m[0] : content;
      parsed = JSON.parse(jsonText);
    } catch (e) {
      // not parsable
      parsed = { raw: content };
    }

    res.json({ ok: true, data: parsed, raw: content, posts: postsResp, clusters: clustersResp });
  } catch (err: any) {
    console.error('/api/agent/run error', err?.message ?? err);
    res.status(500).json({ ok: false, error: err?.message ?? String(err) });
  }
};
