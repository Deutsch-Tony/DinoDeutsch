$ErrorActionPreference = 'Stop'

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Read-Utf8([string]$Path) {
  [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8([string]$Path, [string]$Content) {
  [System.IO.File]::WriteAllText($Path, $Content, $Utf8NoBom)
}

function Remove-IfExists([string]$Path) {
  if (Test-Path -LiteralPath $Path) {
    Remove-Item -LiteralPath $Path -Recurse -Force
  }
}

$Root = 'C:\Users\adminn\Desktop\code'
$Website = Join-Path $Root 'website'
$AssistantDir = Join-Path $Website 'assistant'
$IncomingDir = Join-Path $Website '_incoming_ai'

$IndexPath = Join-Path $Website 'index.html'
$DinoPath = Join-Path $Website 'dino-language.html'
$IncomingAssistantPath = Join-Path $IncomingDir 'assistant-FINAL.html'
$AssistantIndexPath = Join-Path $AssistantDir 'index.html'
$AssistantFnPath = Join-Path $Website 'functions\api\assistant.js'
$AssistantBridgePath = Join-Path $Root 'functions\api\assistant.js'
$HeadersPath = Join-Path $Website '_headers'

# Main page: replace index with dino-language and remove old inline AI.
$Main = Read-Utf8 $DinoPath
$Main = $Main.Replace('<title>Dino Language 🦕</title>', '<title>DinoDeutsch | German Learning System</title>')
$Main = $Main.Replace('<div><div class="bname">Dino Language</div><span class="bsub">Learn German</span></div>', '<div><div class="bname">DinoDeutsch</div><span class="bsub">German Learning System</span></div>')
$Main = [regex]::Replace(
  $Main,
  "<button class=""tab""\s+data-id=""dino-ai""\s+onclick=""go\('dino-ai'\)"">\s*<span>🤖</span><span class=""tlbl"">Dino AI</span>\s*<span class=""bdg live"">NEW</span></button>",
  "<button class=""tab"" onclick=""window.location.href='/assistant'"">  <span>🤖</span><span class=""tlbl"">KI Tutor</span>   <span class=""bdg live"">LIVE</span></button>"
)
$Main = $Main.Replace("<button class=""btns"" onclick=""go('dino-ai')"">🤖 Dino AI</button>", "<button class=""btns"" onclick=""window.location.href='/assistant'"">🤖 KI Tutor</button>")
$Main = [regex]::Replace(
  $Main,
  "\{id:'dino-ai'.*?\},",
  "{id:'assistant', ic:'🤖',t:'KI Tutor', live:true, mc:'#0075de',d:'Tro ly hoc tieng Duc, goi y bai hoc va giai thich theo dung hoc lieu cua web.',tags:['AI tutor','Ngu phap','Tu vung']},"
)
$Main = [regex]::Replace($Main, '(?s)\s*<!-- DINO AI -->.*?(?=<script>)', "`r`n<script>")

$MainRouting = @'
/* ══ ROUTING ══ */
const VIEW_IDS = new Set(['home','grammar','vocab','listening','reading','writing','test']);

function pathToView(pathname){
  const clean = ((pathname || '/').replace(/\/+$/, '')) || '/';
  if(clean === '/' || clean === '/home') return 'home';
  const key = clean.slice(1);
  return VIEW_IDS.has(key) ? key : 'home';
}

function viewToPath(id){
  return id === 'home' ? '/' : '/' + id;
}

function go(id, push = true){
  if(id === 'assistant'){
    window.location.href = '/assistant';
    return;
  }
  if(!VIEW_IDS.has(id)) id = 'home';

  document.querySelectorAll('.view').forEach((view) => view.classList.remove('on'));
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('on'));

  if(id === 'home'){
    document.getElementById('vh').classList.add('on');
  } else {
    const view = document.getElementById('v' + id);
    if(view){
      view.classList.add('on');
    } else {
      document.getElementById('vh').classList.add('on');
      id = 'home';
    }
  }

  if(id !== 'home'){
    const tab = document.querySelector('.tab[data-id="' + id + '"]');
    if(tab) tab.classList.add('on');
  }

  if(id === 'grammar') loadMod('grammar');
  if(id === 'vocab') loadMod('vocab');

  if(!['grammar','vocab','home'].includes(id)){
    const active = id === 'home' ? document.getElementById('vh') : document.getElementById('v' + id);
    if(active){
      setTimeout(() => {
        active.querySelectorAll('.cspfill[data-w]').forEach((bar) => { bar.style.width = bar.dataset.w + '%'; });
      }, 180);
    }
  }

  if(push){
    const next = viewToPath(id);
    if(window.location.pathname !== next){
      history.pushState({ view: id }, '', next);
    }
  }
}

window.addEventListener('popstate', () => {
  go(pathToView(window.location.pathname), false);
});

document.addEventListener('DOMContentLoaded', function(){
  go(pathToView(window.location.pathname), false);
});
'@

$Main = [regex]::Replace(
  $Main,
  "(?s)/\* ══ ROUTING ══ \*/.*?document\.addEventListener\('DOMContentLoaded',function\(\)\{ go\('grammar'\); \}\);",
  $MainRouting
)

Write-Utf8 $IndexPath $Main
Remove-IfExists $DinoPath

# Assistant page: replace Claude import file, remove auth/Supabase, wire to /api/assistant.
$Assistant = Read-Utf8 $IncomingAssistantPath
$Assistant = [regex]::Replace($Assistant, '<title>.*?</title>', '<title>KI Tutor | DinoDeutsch</title>')
$Assistant = $Assistant.Replace(
@'
.logo-mark {
  width: 24px; height: 24px;
  background: var(--near-black);
  color: white;
  border-radius: var(--r4);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
'@,
@'
.logo-mark {
  width: 28px; height: 28px;
  background: linear-gradient(135deg, #1f2937 0%, #455468 100%);
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 18px rgba(31, 41, 55, 0.18);
}
.logo-mark svg { width: 18px; height: 18px; display: block; }
.logo-copy { display: flex; flex-direction: column; gap: 1px; }
.logo-copy strong { font-size: 14px; line-height: 1; }
.logo-copy small {
  font-size: 10px;
  line-height: 1;
  color: var(--gray-300);
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}
'@
)
$Assistant = $Assistant.Replace('.nav-r { margin-left: auto; display: flex; align-items: center; gap: 8px; }', ".nav-r { margin-left: auto; display: flex; align-items: center; gap: 8px; }`r`n.anon-pill { font-size: 12px; font-weight: 700; color: var(--gray-300); background: var(--warm-white); border: var(--border); border-radius: 999px; padding: 7px 12px; letter-spacing: .04em; text-transform: uppercase; }")
$Assistant = [regex]::Replace(
  $Assistant,
  '(?s)<a href="/" class="logo">\s*<span class="logo-mark">D</span>\s*DinoDeutsch\s*</a>',
@'
<a href="/" class="logo">
  <span class="logo-mark" aria-hidden="true">
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#dinoGrad)"/>
      <path d="M10 21C10 16.58 13.58 13 18 13H19.4C21.94 13 24 15.06 24 17.6C24 20.14 21.94 22.2 19.4 22.2H18.2C17.54 22.2 17 21.66 17 21V18.3" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="19.2" cy="16.7" r="1.1" fill="white"/>
      <path d="M10.5 22.3L8.2 24.4H10.3" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <defs>
        <linearGradient id="dinoGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1F2937"/>
          <stop offset="1" stop-color="#455468"/>
        </linearGradient>
      </defs>
    </svg>
  </span>
  <span class="logo-copy"><strong>DinoDeutsch</strong><small>KI Tutor</small></span>
</a>
'@
)
$Assistant = [regex]::Replace(
  $Assistant,
  '(?s)<div class="nav-r">.*?</div>',
  '<div class="nav-r"><span class="anon-pill">Anonymous mode</span></div>'
)
$Assistant = [regex]::Replace(
  $Assistant,
  '(?s)<div class="xp-sub" id="xpSub">.*?</div>',
  '<div class="xp-sub" id="xpSub">Anonymous mode - no login required</div>'
)
$Assistant = [regex]::Replace(
  $Assistant,
  '(?s)<div style="margin:12px 24px 0;padding:10px 14px;background:#fff8f4;border:1px solid rgba\(221,91,0,0.25\);border-radius:var\(--r8\);font-size:13px;color:var\(--orange\);" id="cfgWarn">.*?</div>',
  '<div style="margin:12px 24px 0;padding:10px 14px;background:#fff8f4;border:1px solid rgba(221,91,0,0.25);border-radius:var(--r8);font-size:13px;color:var(--orange);" id="cfgWarn">KI Tutor is calling <code style="font-family:monospace;font-size:12px;background:var(--warm-white);padding:1px 5px;border-radius:3px;">/api/assistant</code> on the same site.</div>'
)
$Assistant = [regex]::Replace($Assistant, '(?s)<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2/dist/umd/supabase\.min\.js"></script>\s*', '')
$Assistant = [regex]::Replace(
  $Assistant,
  "(?s)const WORKER_URL = 'https://YOUR_WORKER\.YOUR_SUBDOMAIN\.workers\.dev';\s*const SB_URL\s*= 'YOUR_SUPABASE_URL';\s*const SB_KEY\s*= 'YOUR_SUPABASE_ANON_KEY';\s*// .*?\s*const CONFIGURED = !WORKER_URL\.includes\('YOUR_WORKER'\);\s*if \(CONFIGURED\) document\.getElementById\('cfgWarn'\)\.style\.display = 'none';",
  "const WORKER_URL = '/api/assistant';`r`nconst CONFIGURED = true;`r`ndocument.getElementById('cfgWarn').style.display = 'none';"
)
$Assistant = $Assistant.Replace('let sb = null, user = null, sbTok = null;', 'const user = null;')
$Assistant = [regex]::Replace(
  $Assistant,
  '(?s)try \{\s*sb = window\.supabase\.createClient\(SB_URL, SB_KEY\);\s*sb\.auth\.getSession\(\)\.then\(\(\{ data: \{ session \} \}\) => \{ if \(session\) onLogin\(session\); \}\);\s*sb\.auth\.onAuthStateChange\(\(_, s\) => \{ if \(s\) onLogin\(s\); else onLogout\(\); \}\);\s*\} catch \(_\) \{\}\s*async function onLogin\(s\) \{.*?function setMode\(el\) \{',
  'function setMode(el) {'
)
$Assistant = $Assistant.Replace('if (!CONFIGURED || !user) return;', 'if (!CONFIGURED) return;')
$Assistant = $Assistant.Replace(", userId: user.id, supabaseToken: sbTok", '')
$Assistant = $Assistant.Replace(", userId: user?.id || null, supabaseToken: sbTok || null", '')
$Assistant = [regex]::Replace($Assistant, "(?m)^\s*if \(!CONFIGURED\) throw new Error\('.*?'\);\r?\n", '')
$Assistant = $Assistant.Replace("    if (user) await loadMemory();`r`n", '')
$Assistant = [regex]::Replace($Assistant, "(?s)// Init\s*document\.getElementById\('authBtn'\)\.onclick = \(\) => \{\s*if \(user\) sb\?\.auth\.signOut\(\);\s*\};", '')

Write-Utf8 $AssistantIndexPath $Assistant

$AssistantFunction = @'
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
'@

Write-Utf8 $AssistantFnPath $AssistantFunction
Write-Utf8 $AssistantBridgePath "export { onRequestOptions, onRequestPost } from '../../website/functions/api/assistant.js';`r`n"

$Headers = @'
/index.html
  Cache-Control: public, max-age=0, must-revalidate
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self' blob:; child-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'

/assistant/index.html
  Cache-Control: public, max-age=0, must-revalidate
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'

/og-card.svg
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/data/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/api/*
  Cache-Control: public, max-age=60, stale-while-revalidate=300

/LEARN_GERMAN_RESOURCES.md
  Cache-Control: public, max-age=600
'@
Write-Utf8 $HeadersPath $Headers

Remove-IfExists (Join-Path $Website 'app.js')
Remove-IfExists (Join-Path $Website 'styles.css')
Remove-IfExists (Join-Path $AssistantDir 'app.js')
Remove-IfExists (Join-Path $AssistantDir 'styles.css')
Remove-IfExists (Join-Path $Website 'assistant-v2.html')
Remove-IfExists (Join-Path $Website 'assistant-with-memory.html')
Remove-IfExists (Join-Path $Website 'supabase-config.js')
Remove-IfExists (Join-Path $Website 'supabase-schema.sql')
Remove-IfExists (Join-Path $Website 'SUPABASE_SCHEMA.sql')
Remove-IfExists (Join-Path $Website 'SUPABASE_SETUP.md')
Remove-IfExists (Join-Path $Website 'worker.js')
Remove-IfExists (Join-Path $Website 'wrangler.toml')
Remove-IfExists (Join-Path $Root 'render.yaml')
Remove-IfExists (Join-Path $Website '_ai_import')
Remove-IfExists (Join-Path $Website '_incoming_ai')
