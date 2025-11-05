"""
Membit LangChain Tool wrapper

Usage:
  - Set MEMBIT_API_KEY in environment
  - Import membit_search from this module and register as a LangChain Tool

This wrapper calls Membit REST endpoints and returns a concise textual summary suitable for feeding into an LLM.
"""
import os
import requests
from typing import Any, Dict, List

MEMBIT_BASE = os.getenv("MEMBIT_API_BASE", "https://api.membit.ai/v1")
API_KEY = os.getenv("MEMBIT_API_KEY")


class MembitError(Exception):
    pass


def _call_membit(path: str, body: Dict[str, Any]) -> Any:
    if not API_KEY:
        raise MembitError("MEMBIT_API_KEY is not set in the environment")
    url = f"{MEMBIT_BASE}/{path}"
    resp = requests.post(url, json=body, headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }, timeout=20)
    try:
        resp.raise_for_status()
    except Exception as e:
        raise MembitError(f"Membit returned error {resp.status_code}: {resp.text}") from e
    return resp.json()


def summarize_posts(results: List[Dict[str, Any]], max_items: int = 5) -> str:
    out = []
    for i, item in enumerate(results[:max_items]):
        title = item.get("title") or item.get("name") or item.get("id")
        excerpt = item.get("excerpt") or item.get("text") or item.get("summary") or ""
        mentions = item.get("mentions")
        ts = item.get("ts") or item.get("timestamp")
        out.append(f"{i+1}. {title} \u2014 {excerpt} (mentions: {mentions})")
    return "\n".join(out) if out else "(no results)"


def membit_search_posts(query: str, limit: int = 10) -> str:
    """Search posts on Membit and return a short summary string suitable for LLM context.

    Parameters:
      - query: search query
      - limit: maximum number of posts to request from Membit

    Returns a textual summary.
    """
    body = {"query": query, "limit": limit}
    data = _call_membit("search-posts", body)

    # Try common shapes: { results: [...] } or direct list
    results = None
    if isinstance(data, dict):
        results = data.get("results") or data.get("posts") or data.get("items")
    if results is None:
        if isinstance(data, list):
            results = data
    if results is None:
        # fallback: stringify top-level
        return str(data)

    summary = summarize_posts(results, max_items=min(8, limit))
    return summary


def membit_search_clusters(query: str, limit: int = 6) -> str:
    """Search clusters on Membit and return concise descriptions."""
    body = {"query": query, "limit": limit}
    data = _call_membit("search-clusters", body)
    clusters = None
    if isinstance(data, dict):
        clusters = data.get("clusters") or data.get("items") or data.get("results")
    if clusters is None and isinstance(data, list):
        clusters = data
    if clusters is None:
        return str(data)
    # create short lines per cluster
    lines = []
    for i, c in enumerate(clusters[:limit]):
        title = c.get("name") or c.get("title") or c.get("id")
        score = c.get("score") or c.get("volume") or c.get("mentions")
        excerpt = c.get("summary") or c.get("excerpt") or ""
        lines.append(f"{i+1}. {title} — {excerpt} (metric: {score})")
    return "\n".join(lines)
