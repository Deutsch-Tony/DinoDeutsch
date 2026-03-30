import { getVocabMeta } from "../../_lib/data.js";
import { json } from "../../_lib/response.js";

export function onRequestGet() {
  return json({
    ok: true,
    ...getVocabMeta()
  });
}
