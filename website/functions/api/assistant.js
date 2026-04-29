import { json } from "../_lib/response.js";
import { modules, vocab } from "../_lib/data.js";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function tokenize(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9äöüß]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
    .slice(0, 16);
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
  const value = String(topic || "").toLowerCase();
  if (value.includes("gram") || value.includes("ngữ pháp") || value.includes("ngu phap")) return "grammar";
  if (value.includes("wort") || value.includes("vocab") || value.includes("từ vựng") || value.includes("tu vung")) return "vocab";
  if (value.includes("hör") || value.includes("hoeren") || value.includes("listen") || value.includes("hội thoại") || value.includes("hoi thoai")) return "listening";
  return "mixed";
}

function flattenGrammar() {
  return (modules.grammar.levels || []).flatMap((level) =>
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

function flattenListening() {
  return (modules.listening.levels || []).flatMap((level) =>
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

function flattenVocab() {
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

const grammarIndex = flattenGrammar();
const listeningIndex = flattenListening();
const vocabIndex = flattenVocab();

function scoreItem(item, terms) {
  if (!terms.length) return 0;
  const haystack = item.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function pickMatches(topic, query) {
  const terms = tokenize(query);
  const sources =
    topic === "grammar"
      ? grammarIndex
      : topic === "vocab"
        ? vocabIndex
        : topic === "listening"
          ? listeningIndex
          : [...grammarIndex, ...vocabIndex, ...listeningIndex];

  return sources
    .map((item) => ({ ...item, score: scoreItem(item, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function buildContext(topic, query) {
  const matches = pickMatches(topic, query);
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
    : "Khong tim thay muc nao khop rat sat. Hay tra loi dua tren hoc lieu co san va goi y nguoi dung noi ro hon level/chu de.";

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
      "- Giai thich Akkusativ A1 kem 2 vi du.",
      "- Cho 8 tu vung A2 ve cong viec.",
      "- Tom tat bai nghe gioi thieu ban than va chi ra tu khoa."
    ].join("\n");
  }

  const top = context.matches.slice(0, 3).map((item) => `- ${item.level} · ${item.section} · ${item.title}`).join("\n");
  return [
    intro,
    "",
    "Muc gan nhat voi cau hoi cua ban:",
    top,
    "",
    "Mình có thể đi tiếp theo 1 trong 3 hướng:",
    "1. Giai thich ngan gon theo level hien tai.",
    "2. Tao mini quiz 3-5 cau tu hoc lieu vua tim duoc.",
    "3. Rut ra danh sach tu khoa va bai tap on nhanh 10 phut."
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

export async function onRequestPost({ request, env }) {
  const headers = corsHeaders();
  let body = null;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, { status: 400, headers });
  }

  if (body?.action === "feedback") {
    return json({ ok: true }, { headers });
  }

  const messages = normalizeMessages(body?.messages);
  const lastUser = [...messages].reverse().find((item) => item.role === "user");
  const query = lastUser?.content || "";
  const topic = normalizeTopic(body?.topic);
  const context = buildContext(topic, query);
  const nextState = {
    difficulty: Math.max(1, Math.min(10, Number(body?.sessionState?.difficulty || 3))),
    messages_count: Number(body?.sessionState?.messages_count || 0) + 1
  };

  let reply = buildLocalReply(topic, query, context);
  let toolsUsed = [...context.toolsUsed, "local-fallback"];
  let abVariant = "assistant::local-context";

  if (env.ANTHROPIC_API_KEY) {
    try {
      const systemPrompt = [
        "Ban la KI Tutor cua DinoDeutsch.",
        "Luon tra loi bang tieng Viet, ngan gon, ro cau truc, co vi du tieng Duc khi phu hop.",
        "Chi uu tien su dung hoc lieu duoc cung cap lam nguon su that chinh.",
        "Neu hoc lieu khong du, noi ro phan nao la suy luan.",
        "",
        context.systemContext
      ].join("\n");

      reply = await callAnthropic(
        env.ANTHROPIC_API_KEY,
        env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
        messages.length ? messages : [{ role: "user", content: query || "Chao ban" }],
        systemPrompt
      );
      toolsUsed = [...context.toolsUsed, "anthropic"];
      abVariant = "assistant::anthropic-context";
    } catch (error) {
      reply = `${reply}\n\n(Goi AI that khong thanh cong: ${error.message})`;
      toolsUsed = [...context.toolsUsed, "anthropic-error", "local-fallback"];
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
}