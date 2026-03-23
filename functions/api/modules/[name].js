import { modules } from "../../_lib/data.js";
import { json } from "../../_lib/response.js";

export function onRequestGet(context) {
  const name = context.params.name;
  const moduleData = modules[name];

  if (!moduleData) {
    return json(
      {
        ok: false,
        error: "Module not found"
      },
      { status: 404 }
    );
  }

  return json({
    ok: true,
    item: moduleData
  });
}
