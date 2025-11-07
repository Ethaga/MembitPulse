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

    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    async function doFetch(useXApiKey: boolean) {
      const headers: Record<string, string> = { ...baseHeaders };
      if (key) {
        if (useXApiKey) headers["x-api-key"] = key;
        else headers["Authorization"] = `Bearer ${key}`;
      }
      const r = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const txt = await r.text();
      return { r, txt };
    }

    // Try Authorization: Bearer first, then fallback to x-api-key if unauthorized
    let result = await doFetch(false);
    if (!result.r.ok) {
      const status = result.r.status;
      const bodyText = result.txt || "";
      const isUnauthorized = status === 401 || /unauthori/i.test(bodyText);
      if (isUnauthorized && key) {
        // retry with x-api-key
        result = await doFetch(true);
      }
    }

    if (!result.r.ok) {
      return res.status(result.r.status).json({ error: `Flowise error ${result.r.status}: ${result.txt}` });
    }

    try {
      const json = JSON.parse(result.txt);
      return res.json(json);
    } catch (e) {
      return res.send(result.txt);
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
