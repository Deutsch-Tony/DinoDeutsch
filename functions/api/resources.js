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
  const res = await fetch(`${origin}/data/resources.json`);
  if (!res.ok) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" }
    });
  }
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
    }
  });
}
