import React, { useEffect, useRef, useState } from "react";

export default function FlowiseChat({ meta }: { meta?: any }) {
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([
    {
      role: "assistant",
      text: "Connected to Membit Flowise assistant. Ask about the posts or clusters shown above.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [configOk, setConfigOk] = useState<boolean | null>(null);
  const [followUps, setFollowUps] = useState<string[] | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/flowise/config");
        const j = await r.json();
        setConfigOk(!!j?.urlConfigured);
      } catch (e) {
        setConfigOk(false);
      }
    })();
    // If meta posts exist, inject a system message summarizing count
    if (meta?.posts) {
      setMessages((m) => [
        ...m,
        {
          role: "system",
          text: `Context: ${Array.isArray(meta.posts) ? meta.posts.length + " posts" : "posts available"}`,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // scroll to bottom on new message
    if (scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [messages, followUps]);

  function parseFollowUps(raw: any): string[] | null {
    if (!raw) return null;
    try {
      if (Array.isArray(raw)) return raw.map(String);
      if (typeof raw === "string") {
        // try parse once
        try {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) return p.map(String);
          // if parsed to string again, try parse twice
          if (typeof p === "string") {
            const p2 = JSON.parse(p);
            if (Array.isArray(p2)) return p2.map(String);
          }
        } catch (e) {
          // fallback: try to extract array-like text
          const m = raw.match(/\[.*\]/s);
          if (m) {
            try {
              const p = JSON.parse(m[0]);
              if (Array.isArray(p)) return p.map(String);
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
    return null;
  }

  async function send(msg: string) {
    if (!msg) return;
    if (configOk === false) {
      setMessages((m) => [...m, { role: "assistant", text: "FLOWISE_API_URL not configured" }]);
      return;
    }
    const userMsg = { role: "user", text: msg };
    setMessages((m) => [...m, userMsg]);
    setFollowUps(null);
    setInput("");
    setLoading(true);
    try {
      const resp = await fetch("/api/flowise/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: msg, meta }),
      });

      if (!resp.ok) {
        setMessages((m) => [...m, { role: "assistant", text: "⚠️ Connection error, check Flowise config" }]);
        return;
      }

      const text = await resp.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch (e) {
        json = { raw: text };
      }

      // Prefer 'text' field from Flowise responses
      let reply = "(no reply)";
      if (typeof json === "string") reply = json;
      else if (json?.text) reply = String(json.text);
      else if (json?.answer) reply = String(json.answer);
      else if (json?.data && typeof json.data === "string") reply = json.data;
      else if (json?.data && typeof json.data === "object") reply = JSON.stringify(json.data);
      else if (json?.output) reply = typeof json.output === "string" ? json.output : JSON.stringify(json.output);
      else if (json?.result) reply = typeof json.result === "string" ? json.result : JSON.stringify(json.result);
      else if (json?.raw) reply = json.raw;

      setMessages((m) => [...m, { role: "assistant", text: reply }]);

      // parse follow-up prompts if present
      const prompts = parseFollowUps(json?.followUpPrompts ?? json?.follow_up_prompts ?? json?.followups ?? json?.followUps);
      setFollowUps(prompts);
    } catch (err: any) {
      const msgText = String(err?.message ?? err);
      if (msgText.includes("body stream") || msgText.includes("already read")) {
        setMessages((m) => [...m, { role: "assistant", text: "⚠️ Connection error, check Flowise config" }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", text: `Error: ${msgText}` }]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 text-xs text-foreground/60">
      {configOk === false && (
        <div className="p-3 rounded-md bg-[#1b0f0f] border border-red-600/30 text-sm">FLOWISE_API_URL not configured</div>
      )}

      <div ref={scroller} className="border rounded-md bg-[#070707] p-3 max-h-56 overflow-auto text-xs space-y-3 neon-border">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-full break-words p-2 rounded-md ${m.role === "user" ? "ml-auto bg-gradient-to-r from-cyan-700/30 to-cyan-900/20 text-right border border-cyan-400/30" : m.role === "system" ? "bg-[#0b0b0b] text-foreground/60 border border-foreground/10" : "bg-[#061216] border border-cyan-400/10"}`}>
            <div className="text-[11px] font-semibold mb-1">{m.role === "user" ? "You" : m.role === "assistant" ? "Flowise" : "System"}</div>
            <div className="text-sm leading-snug">{m.text}</div>
          </div>
        ))}

        {followUps && followUps.length > 0 && (
          <div className="mt-2 w-full flex flex-wrap gap-2">
            {followUps.map((p, idx) => (
              <button
                key={idx}
                onClick={() => send(p)}
                className="px-3 py-1 text-xs rounded-full bg-[#071722] border border-cyan-400/20 hover:bg-cyan-700/10"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(input);
          }}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md bg-[#050505] border border-cyan-400/20 text-sm"
          placeholder="Ask the Flowise assistant..."
        />
        <button disabled={loading} onClick={() => send(input)} className="px-4 py-2 rounded-md bg-cyan-600/10 border border-cyan-400/30 text-sm">
          Send
        </button>
      </div>
    </div>
  );
}
