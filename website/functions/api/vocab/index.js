import { getVocabItems, vocab } from "../../_lib/data.js";
import { json } from "../../_lib/response.js";

export function onRequestGet(context) {
  const url = new URL(context.request.url);
  const level = url.searchParams.get("level");
  const topic = url.searchParams.get("topic");
  const search = url.searchParams.get("search") || "";

  if (!level || !topic) {
    return json(
      {
        ok: false,
        error: "Missing level or topic"
      },
      { status: 400 }
    );
  }

  if (!vocab[level] || !vocab[level][topic]) {
    return json(
      {
        ok: false,
        error: "Unknown level or topic"
      },
      { status: 404 }
    );
  }

  const items = getVocabItems(level, topic, search);

  return json({
    ok: true,
    level,
    topic,
    count: items.length,
    items
  });
}
