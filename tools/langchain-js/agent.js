#!/usr/bin/env node
/**
 * Simple Node.js agent that uses the server proxy endpoints to fetch Membit data
 * and calls OpenAI's ChatCompletions API to produce a viral prediction.
 *
 * Requirements:
 * - Node 18+ (global fetch available)
 * - Set OPENAI_API_KEY in env
 * - Optionally set MEMBIT_PROXY_BASE (default: http://localhost:8080)
 *
 * Usage:
 *   MEMBIT_PROXY_BASE="http://localhost:8080" OPENAI_API_KEY="sk-..." node tools/langchain-js/agent.js "post-quantum crypto"
 */

const PROXY_BASE = process.env.MEMBIT_PROXY_BASE || 'http://localhost:8080';
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.error('ERROR: OPENAI_API_KEY not set in environment');
  process.exit(1);
}

const queryArg = process.argv.slice(2).join(' ') || 'post-quantum cryptography';

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    // 20s timeout handled by environment if needed
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Request failed ${res.status}: ${txt}`);
  }
  return res.json();
}

async function searchPosts(query, limit = 8) {
  const url = `${PROXY_BASE}/api/membit/search-posts`;
  const data = await postJson(url, { query, limit });
  // try common shapes
  const results = data.results || data.items || data.posts || data.data || (Array.isArray(data) ? data : null);
  return results || [];
}

async function searchClusters(query, limit = 6) {
  const url = `${PROXY_BASE}/api/membit/search-clusters`;
  const data = await postJson(url, { query, limit });
  const clusters = data.clusters || data.items || data.results || data.data || (Array.isArray(data) ? data : null);
  return clusters || [];
}

function summarizeItems(items, max = 6) {
  return items.slice(0, max).map((it, i) => {
    const title = it.title || it.name || it.id || '(untitled)';
    const excerpt = it.excerpt || it.text || it.summary || '';
    const mentions = it.mentions || it.metric || '';
    return `${i + 1}. ${title} — ${excerpt} (mentions: ${mentions})`;
  }).join('\n');
}

async function callOpenAI(system, user, model = 'gpt-3.5-turbo') {
  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.2,
    max_tokens: 600,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const reply = json?.choices?.[0]?.message?.content;
  return reply;
}

async function run(query) {
  console.log('Query:', query);
  console.log('Fetching top posts and clusters from proxy...', PROXY_BASE);
  let posts = [];
  let clusters = [];
  try {
    posts = await searchPosts(query, 8);
    clusters = await searchClusters(query, 6);
  } catch (e) {
    console.error('Proxy call failed:', e.message || e);
  }

  const postsSummary = summarizeItems(posts, 6) || '(no posts)';
  const clustersSummary = summarizeItems(clusters, 6) || '(no clusters)';

  const context = `Top posts:\n${postsSummary}\n\nTop clusters:\n${clustersSummary}`;

  const system = `You are Membit Pulse analyst assistant. Given recent posts and clusters from social tracking, produce a concise viral prediction for the provided topic. Output must include:\n- A numeric Viral Score between 0 and 100\n- A short rationale (3 bullets) referencing volume/growth/sentiment or memeability\n- Suggested short action: "Monitor", "Amplify", "Ignore"\nRespond in plain text.`;

  const user = `Topic: ${query}\n\nContext:\n${context}\n\nPlease provide the viral score and short rationale.`;

  console.log('\nCalling OpenAI to synthesize predictions...');
  try {
    const out = await callOpenAI(system, user);
    console.log('\n=== AGENT OUTPUT ===\n');
    console.log(out);
  } catch (e) {
    console.error('OpenAI call failed:', e.message || e);
  }
}

run(queryArg).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
