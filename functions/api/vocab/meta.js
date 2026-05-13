const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request }) {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/data/vocab.json`);
  if (!res.ok) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" }
    });
  }

  const vocab = await res.json();
  const meta = {};

  for (const [level, topics] of Object.entries(vocab || {})) {
    meta[level] = { topics: {}, total: 0 };
    for (const [topic, items] of Object.entries(topics || {})) {
      const count = Array.isArray(items) ? items.length : 0;
      meta[level].topics[topic] = count;
      meta[level].total += count;
    }
  }

  return new Response(JSON.stringify(meta), {
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
    }
  });
}
