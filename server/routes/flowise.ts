import type { RequestHandler } from "express";

function normalizeBaseUrl(base: string) {
  if (!base) return base;
  // strip trailing slash
  return base.replace(/\/$/, "");
}

export const flowiseChat: RequestHandler = async (req, res) => {
  try {
    const base = process.env.FLOWISE_API_URL;
    const key = process.env.FLOWISE_API_KEY;
    if (!base)
      return res
        .status(500)
        .json({ error: "FLOWISE_API_URL not configured on server" });

    const body = req.body || {};
    const question =
      typeof body.question === "string"
        ? body.question
        : typeof body.input === "string"
          ? body.input
          : typeof body.message === "string"
            ? body.message
            : typeof body.query === "string"
              ? body.query
              : "";
    const payload: any = { question };
    if (body.meta) payload.meta = body.meta;

    const baseUrl = normalizeBaseUrl(base);
    // prefer /prediction endpoint unless user provided a full path
    const endpoint = baseUrl.match(/\/prediction|\/chat/)
      ? baseUrl
      : `${baseUrl}/prediction`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (key) {
      headers["Authorization"] = `Bearer ${key}`;
    }

    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    if (!resp.ok) {
      return res
        .status(resp.status)
        .json({ error: `Flowise error ${resp.status}: ${text}` });
    }
    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch (e) {
      return res.send(text);
    }
  } catch (err: any) {
    console.error("/api/flowise/chat error", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? String(err) });
  }
};

export const flowiseConfig: RequestHandler = async (_req, res) => {
  const url = !!process.env.FLOWISE_API_URL;
  const key = !!process.env.FLOWISE_API_KEY;
  res.json({ ok: true, urlConfigured: url, keyConfigured: key });
};
