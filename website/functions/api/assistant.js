import { json } from "../_lib/response.js";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeConversation(conversation) {
  if (!Array.isArray(conversation)) return [];

  return conversation
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      role: typeof item.role === "string" ? item.role : "user",
      content: typeof item.content === "string" ? item.content : ""
    }))
    .filter((item) => item.content.trim().length > 0)
    .slice(-12);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders()
  });
}

export async function onRequestPost(context) {
  const corsHeaders = getCorsHeaders();
  const backendUrl = context.env.AGENT_BACKEND_URL;
  const backendToken = context.env.AGENT_BACKEND_TOKEN;

  if (!backendUrl) {
    return json(
      {
        ok: false,
        error: "AGENT_BACKEND_URL is not configured"
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }

  const body = await parseJson(context.request);
  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    return json(
      {
        ok: false,
        error: "Request body must include a non-empty 'message' string"
      },
      {
        status: 400,
        headers: corsHeaders
      }
    );
  }

  const payload = {
    message: body.message.trim(),
    route: typeof body.route === "string" ? body.route : "home",
    locale: typeof body.locale === "string" ? body.locale : "vi-VN",
    level: typeof body.level === "string" ? body.level : null,
    user: body.user && typeof body.user === "object" ? body.user : null,
    conversation: normalizeConversation(body.conversation)
  };

  try {
    const headers = {
      "Content-Type": "application/json"
    };

    if (backendToken) {
      headers.Authorization = `Bearer ${backendToken}`;
    }

    const upstream = await fetch(`${backendUrl.replace(/\/+$/, "")}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const upstreamText = await upstream.text();
    let upstreamJson = null;

    try {
      upstreamJson = upstreamText ? JSON.parse(upstreamText) : null;
    } catch {
      upstreamJson = null;
    }

    if (!upstream.ok) {
      return json(
        {
          ok: false,
          error: upstreamJson?.error || "Agent backend request failed",
          status: upstream.status
        },
        {
          status: upstream.status,
          headers: corsHeaders
        }
      );
    }

    return json(
      {
        ok: true,
        ...upstreamJson
      },
      {
        headers: corsHeaders
      }
    );
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected proxy error"
      },
      {
        status: 502,
        headers: corsHeaders
      }
    );
  }
}
