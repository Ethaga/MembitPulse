"""
Membit LangChain Tool wrapper (using server proxy endpoints)

This version calls your server proxy endpoints (/api/membit/search-posts and /api/membit/search-clusters)
so the tool does NOT require MEMBIT_API_KEY locally. Configure MEMBIT_PROXY_BASE to point at your dev server
(e.g. https://b560de43035a4d848c2a15b158158d00-dbf084e4596c48838d40d27a8.fly.dev).
"""
import os
import requests
from typing import Any, Dict, List

# Use server proxy base; default to local dev or the provided fly.dev URL
PROXY_BASE = os.getenv("MEMBIT_PROXY_BASE", "https://b560de43035a4d848c2a15b158158d00-dbf084e4596c48838d40d27a8.fly.dev")

class MembitError(Exception):
    pass


def _call_proxy(path: str, body: Dict[str, Any]) -> Any:
    url = f"{PROXY_BASE}/api/membit/{path}"
    try:
        resp = requests.post(url, json=body, timeout=20)
    except Exception as e:
        raise MembitError(f"Failed to reach proxy {url}: {e}") from e
    if not resp.ok:
        raise MembitError(f"Proxy returned {resp.status_code}: {resp.text}")
    try:
        return resp.json()
    except Exception:
        return resp.text


def summarize_posts(results: List[Dict[str, Any]], max_items: int = 5) -> str:
    out = []
    for i, item in enumerate(results[:max_items]):
        title = item.get("title") or item.get("name") or item.get("id") or "(untitled)"
        excerpt = item.get("excerpt") or item.get("text") or item.get("summary") or ""
        mentions = item.get("mentions")
        out.append(f"{i+1}. {title} — {excerpt} (mentions: {mentions})")
    return "\n".join(out) if out else "(no results)"


def membit_search_posts(query: str, limit: int = 10) -> str:
    """Search posts using the server proxy and return a short summary string for LLM context."""
    body = {"query": query, "limit": limit}
    data = _call_proxy("search-posts", body)

    results = None
    if isinstance(data, dict):
        results = data.get("results") or data.get("posts") or data.get("items") or data.get("data")
    if results is None and isinstance(data, list):
        results = data
    if results is None:
        return str(data)

    summary = summarize_posts(results, max_items=min(8, limit))
    return summary


def membit_search_clusters(query: str, limit: int = 6) -> str:
    """Search clusters using server proxy and return concise descriptions."""
    body = {"query": query, "limit": limit}
    data = _call_proxy("search-clusters", body)
    clusters = None
    if isinstance(data, dict):
        clusters = data.get("clusters") or data.get("items") or data.get("results") or data.get("data")
    if clusters is None and isinstance(data, list):
        clusters = data
    if clusters is None:
        return str(data)
    lines = []
    for i, c in enumerate(clusters[:limit]):
        title = c.get("name") or c.get("title") or c.get("id") or "(cluster)"
        score = c.get("score") or c.get("volume") or c.get("mentions") or ""
        excerpt = c.get("summary") or c.get("excerpt") or ""
        lines.append(f"{i+1}. {title} — {excerpt} (metric: {score})")
    return "\n".join(lines)
