function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function stripMarks(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(text = "") {
  return stripMarks(text)
    .split(/[^a-z0-9äöüß]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
    .slice(0, 18);
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: typeof item.content === "string" ? item.content.trim() : ""
    }))
    .filter((item) => item.content.length > 0)
    .slice(-12);
}

function normalizeTopic(topic) {
  const value = stripMarks(topic || "");
  if (value.includes("gram") || value.includes("ngu phap")) return "grammar";
  if (value.includes("wort") || value.includes("vocab") || value.includes("tu vung")) return "vocab";
  if (value.includes("hor") || value.includes("hoeren") || value.includes("listen") || value.includes("hoi thoai")) return "listening";
  return "mixed";
}

async function fetchJsonFromSite(request, path) {
  const origin = new URL(request.url).origin;
  const response = await fetch(`${origin}${path}`);
  if (!response.ok) {
    throw new Error(`Khong tai duoc ${path}: HTTP ${response.status}`);
  }
  return response.json();
}

function flattenGrammar(grammar) {
  return (grammar?.levels || []).flatMap((level) =>
    (level.sections || []).flatMap((section) =>
      (section.lessons || []).map((lesson) => ({
        type: "grammar",
        level: level.level,
        section: section.title,
        title: lesson.title,
        slug: lesson.slug,
        text: [
          lesson.title,
          lesson.summary,
          lesson.pattern,
          ...(lesson.examples || []),
          ...(lesson.mistakes || [])
        ].join(" ")
      }))
    )
  );
}

function flattenListening(listening) {
  return (listening?.levels || []).flatMap((level) =>
    (level.tracks || []).flatMap((track) =>
      (track.lessons || []).map((lesson) => ({
        type: "listening",
        level: level.level,
        section: track.title,
        title: lesson.title,
        slug: lesson.slug,
        text: [
          lesson.title,
          lesson.scenario,
          lesson.goal,
          ...(lesson.transcript || []),
          ...(lesson.listenFor || [])
        ].join(" ")
      }))
    )
  );
}

function flattenVocab(vocab) {
  const rows = [];
  for (const [level, topics] of Object.entries(vocab || {})) {
    for (const [topic, items] of Object.entries(topics || {})) {
      for (const item of items || []) {
        rows.push({
          type: "vocab",
          level,
          section: topic,
          title: item.word,
          slug: item.word,
          text: [item.word, item.gender, item.pos, item.vi, item.en, item.ipa, item.example].join(" ")
        });
      }
    }
  }
  return rows;
}

function scoreItem(item, terms) {
  if (!terms.length) return 0;
  const haystack = stripMarks(item.text);
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function pickMatches(topic, query, sources) {
  const terms = tokenize(query);
  const active =
    topic === "grammar"
      ? sources.grammar
      : topic === "vocab"
        ? sources.vocab
        : topic === "listening"
          ? sources.listening
          : [...sources.grammar, ...sources.vocab, ...sources.listening];

  return active
    .map((item) => ({ ...item, score: scoreItem(item, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function buildContext(topic, query, sources) {
  const matches = pickMatches(topic, query, sources);
  const topicLabel =
    topic === "grammar"
      ? "Grammatik"
      : topic === "vocab"
        ? "Wortschatz"
        : topic === "listening"
          ? "Hören"
          : "Tong hop";

  const summary = matches.length
    ? matches
        .map((item, index) => `${index + 1}. [${item.type.toUpperCase()}] ${item.level} · ${item.section} · ${item.title}`)
        .join("\n")
    : "Khong tim thay muc nao khop sat. Hay tra loi dua tren hoc lieu co san va goi y nguoi dung noi ro hon level/chu de.";

  return {
    topicLabel,
    matches,
    toolsUsed: [`context:${topicLabel.toLowerCase()}`, "local-data"],
    systemContext: `Nguon du lieu uu tien: ${topicLabel}\nKet qua tim duoc:\n${summary}`
  };
}

function buildLocalReply(topic, query, context) {
  const intro =
    topic === "grammar"
      ? "Mình đang bám vào kho Grammatik của web."
      : topic === "vocab"
        ? "Mình đang bám vào kho Wortschatz của web."
        : topic === "listening"
          ? "Mình đang bám vào kho Hören của web."
          : "Mình đang bám vào kho học liệu tổng hợp của web.";

  if (!context.matches.length) {
    return [
      intro,
      "",
      `Mình chưa thấy mục khớp sát với câu hỏi: "${query}".`,
      "Bạn nên hỏi kèm level (A1-B2), tên bài, hoặc chủ đề cụ thể để mình bám đúng học liệu hơn.",
      "",
      "Ví dụ:",
      "- Giải thích Akkusativ A1 kèm 2 ví dụ.",
      "- Cho 8 từ vựng A2 về công việc.",
      "- Tóm tắt bài nghe giới thiệu bản thân và chỉ ra từ khóa."
    ].join("\n");
  }

  const top = context.matches
    .slice(0, 3)
    .map((item) => `- ${item.level} · ${item.section} · ${item.title}`)
    .join("\n");

  return [
    intro,
    "",
    "Mục gần nhất với câu hỏi của bạn:",
    top,
    "",
    "Mình có thể đi tiếp theo 1 trong 3 hướng:",
    "1. Giải thích ngắn gọn theo level hiện tại.",
    "2. Tạo mini quiz 3-5 câu từ học liệu vừa tìm được.",
    "3. Rút ra danh sách từ khóa và bài tập ôn nhanh 10 phút."
  ].join("\n");
}

async function callAnthropic(apiKey, model, messages, systemPrompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      temperature: 0.35,
      system: systemPrompt,
      messages
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Anthropic HTTP ${response.status}`);
  }

  const text = Array.isArray(payload?.content)
    ? payload.content.filter((item) => item?.type === "text").map((item) => item.text).join("\n\n").trim()
    : "";

  if (!text) throw new Error("Anthropic returned no text");
  return text;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = corsHeaders();

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, { status: 400, headers });
    }

    if (body?.action === "feedback") {
      return json({ ok: true }, { headers });
    }

    const [grammar, vocab, listening] = await Promise.all([
      fetchJsonFromSite(request, "/data/grammar.json"),
      fetchJsonFromSite(request, "/data/vocab.json"),
      fetchJsonFromSite(request, "/data/listening.json")
    ]);

    const sources = {
      grammar: flattenGrammar(grammar),
      vocab: flattenVocab(vocab),
      listening: flattenListening(listening)
    };

    const messages = normalizeMessages(body?.messages);
    const lastUser = [...messages].reverse().find((item) => item.role === "user");
    const query = lastUser?.content || "";
    const topic = normalizeTopic(body?.topic);
    const contextInfo = buildContext(topic, query, sources);
    const nextState = {
      difficulty: Math.max(1, Math.min(10, Number(body?.sessionState?.difficulty || 3))),
      messages_count: Number(body?.sessionState?.messages_count || 0) + 1
    };

    let reply = buildLocalReply(topic, query, contextInfo);
    let toolsUsed = [...contextInfo.toolsUsed, "local-fallback"];
    let abVariant = "assistant::local-context";

    if (env.ANTHROPIC_API_KEY) {
      try {
        const systemPrompt = [
          "Ban la KI Tutor cua DinoDeutsch.",
          "Luon tra loi bang tieng Viet, ngan gon, ro cau truc, co vi du tieng Duc khi phu hop.",
          "Chi uu tien su dung hoc lieu duoc cung cap lam nguon su that chinh.",
          "Neu hoc lieu khong du, noi ro phan nao la suy luan.",
          "",
          contextInfo.systemContext
        ].join("\n");

        reply = await callAnthropic(
          env.ANTHROPIC_API_KEY,
          env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
          messages.length ? messages : [{ role: "user", content: query || "Chao ban" }],
          systemPrompt
        );
        toolsUsed = [...contextInfo.toolsUsed, "anthropic"];
        abVariant = "assistant::anthropic-context";
      } catch (error) {
        reply = `${reply}\n\n(Gọi AI thật không thành công: ${error.message})`;
        toolsUsed = [...contextInfo.toolsUsed, "anthropic-error", "local-fallback"];
        abVariant = "assistant::local-context";
      }
    }

    return json(
      {
        ok: true,
        reply,
        toolsUsed,
        abVariant,
        sessionState: nextState
      },
      { headers }
    );
  } catch (error) {
    return json(
      {
        ok: false,
        error: error?.message || "Assistant function failed"
      },
      { status: 500, headers }
    );
  }
}
