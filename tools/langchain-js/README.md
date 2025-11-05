Node JS Membit Agent Example

This script demonstrates a lightweight "agent" pattern in Node.js without pulling in LangChain JS: it uses the server proxy endpoints to fetch Membit data, summarizes results, and queries OpenAI ChatCompletions to produce a viral prediction.

Requirements:
- Node 18+ (global fetch)
- OPENAI_API_KEY set in env
- Server proxy reachable (MEMBIT_PROXY_BASE env, default http://localhost:8080)

Install:
- No extra npm packages required (uses global fetch and native Node features). If your Node does not expose fetch, run with a newer Node version.

Usage:
  MEMBIT_PROXY_BASE="http://localhost:8080" OPENAI_API_KEY="sk-..." node tools/langchain-js/agent.js "post-quantum crypto"

Output:
- Prints the posts/clusters fetched, then the LLM response containing a numeric viral score (0-100), rationale, and suggested action.

Next steps:
- Convert this to a long-running service, add caching, or replace the OpenAI direct call with any other provider.
- If you prefer a full LangChain JS integration, I can add a version using the langchain package and tools/agents abstractions.
