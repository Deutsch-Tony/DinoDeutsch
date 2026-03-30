import { resources } from "../_lib/data.js";
import { json } from "../_lib/response.js";

export function onRequestGet(context) {
  const url = new URL(context.request.url);
  const category = url.searchParams.get("category");
  const filtered = category
    ? resources.filter((item) => item.category === category)
    : resources;

  return json({
    ok: true,
    items: filtered
  });
}
