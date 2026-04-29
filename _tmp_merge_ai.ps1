$ErrorActionPreference = 'Stop'

$root = 'C:\Users\adminn\Desktop\code'
$website = Join-Path $root 'website'

function Normalize-LineEndings([string]$text) {
  return ($text -replace "`r?`n", "`r`n")
}

$brandLogoMain = @'
<a class="brand" href="/" onclick="navigateTo(''home'');return false;">
  <span class="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dinoMarkMain" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stop-color="#111827"/>
          <stop offset="1" stop-color="#334155"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#dinoMarkMain)"/>
      <path d="M15 15.5H23.5C30.2 15.5 34 19.2 34 24C34 28.9 30.2 32.5 23.7 32.5H15V15.5Z" fill="#F8FAFC"/>
      <path d="M20.7 20.6H23.3C26.2 20.6 28.1 21.8 28.1 24C28.1 26.3 26.2 27.5 23.3 27.5H20.7V20.6Z" fill="#111827"/>
      <path d="M31.4 14.8C28.6 15.5 26 17 24.1 19.4" stroke="#93C5FD" stroke-width="2.1" stroke-linecap="round"/>
    </svg>
  </span>
  <div class="brand-copy"><div class="bname">DinoDeutsch</div><span class="bsub">German Learning Workspace</span></div>
</a>
'@
$brandTabsReplacement = $brandLogoMain.Trim() + "`r`n" + '  <div class="tabs">'

$logoMarkAssistant = @'
<span class="logo-mark" aria-hidden="true">
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dinoMarkAssistant" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop stop-color="#111827"/>
        <stop offset="1" stop-color="#334155"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#dinoMarkAssistant)"/>
    <path d="M15 15.5H23.5C30.2 15.5 34 19.2 34 24C34 28.9 30.2 32.5 23.7 32.5H15V15.5Z" fill="#F8FAFC"/>
    <path d="M20.7 20.6H23.3C26.2 20.6 28.1 21.8 28.1 24C28.1 26.3 26.2 27.5 23.3 27.5H20.7V20.6Z" fill="#111827"/>
    <path d="M31.4 14.8C28.6 15.5 26 17 24.1 19.4" stroke="#93C5FD" stroke-width="2.1" stroke-linecap="round"/>
  </svg>
</span>
'@
$assistantLogoReplacement = $logoMarkAssistant.Trim() + "`r`n    " + '<span class="logo-wordmark">DinoDeutsch</span>'

# Transform dino-language.html into website/index.html
$mainSourcePath = Join-Path $website 'dino-language.html'
$mainLines = Get-Content -LiteralPath $mainSourcePath
$mainRaw = Get-Content -LiteralPath $mainSourcePath -Raw
$mainRaw = Normalize-LineEndings $mainRaw

$mainRaw = [regex]::Replace($mainRaw, '<title>.*?</title>', '<title>DinoDeutsch | German Learning Workspace</title>', 'Singleline')
$mainRaw = $mainRaw.Replace('.bsub{font-size:9px;font-weight:500;color:var(--tx3);letter-spacing:.7px;text-transform:uppercase;display:block;margin-top:2px;}', ".bsub{font-size:9px;font-weight:500;color:var(--tx3);letter-spacing:.7px;text-transform:uppercase;display:block;margin-top:2px;}`r`n.brand-mark{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}`r`n.brand-mark svg{width:100%;height:100%;display:block;}`r`n.brand-copy{display:flex;flex-direction:column;gap:2px;}")
$mainRaw = [regex]::Replace($mainRaw, '(?s)<a class="brand"[^>]*>.*?</a>\s*<div class="tabs">', $brandTabsReplacement, 'Singleline')
$mainRaw = [regex]::Replace($mainRaw, '(?s)<button class="tab"\s+data-id="dino-ai".*?</button>', '<button class="tab" data-id="assistant" onclick="openAssistant();return false;"><span>🤖</span><span class="tlbl">KI Tutor</span><span class="bdg live">LIVE</span></button>', 'Singleline')
$mainRaw = $mainRaw -replace 'onclick="go\(''dino-ai''\)"', 'onclick="openAssistant();return false;"'
$mainRaw = [regex]::Replace($mainRaw, 'onclick="go\(''([^'']+)''\)"', 'onclick="navigateTo(''$1'');return false;"')
$mainRaw = $mainRaw.Replace("{id:'dino-ai', ic:'🤖',t:'Dino AI',   live:true, mc:'#0075de',d:'AI coach tiếng Đức cá nhân — hội thoại, ngữ pháp, sửa lỗi. Powered by Claude.',tags:['Claude AI','Hội thoại']},", "{id:'assistant', ic:'🤖',t:'KI Tutor', live:true, mc:'#0075de',d:'Tro ly AI de hoi dap, giai thich va tao bai tap tieng Duc theo muc tieu hoc cua ban.',tags:['Claude','Practice']},")
$mainRaw = $mainRaw.Replace('onclick="go(''${m.id}'');return false;"', 'onclick="modClick(''${m.id}'');return false;"')

$oldAiViewBlock = (($mainLines[310..338]) -join "`r`n")
$mainRaw = $mainRaw.Replace((Normalize-LineEndings $oldAiViewBlock), '')

$oldRouteBlock = (($mainLines[418..484]) -join "`r`n")
$newRouteBlock = @'
/* ══ ROUTING ══ */
const PATHS={home:'/',grammar:'/grammar',vocab:'/vocab',listening:'/listening',reading:'/reading',writing:'/writing',test:'/test'};
function pathFor(id){return PATHS[id]||'/';}
function openAssistant(){window.location.href='/assistant';}
function modClick(id){if(id==='assistant'){openAssistant();return;}navigateTo(id);}
function viewFromLocation(){
  const hash=(window.location.hash||'').replace('#','').trim();
  if(hash&&PATHS[hash]){history.replaceState({view:hash},'',pathFor(hash));return hash;}
  const clean=(window.location.pathname||'/').replace(/\/+$/,'')||'/';
  if(clean==='/'||clean==='/index.html')return 'home';
  for(const [id,path] of Object.entries(PATHS)){if(path!=='/'&&path===clean)return id;}
  return 'home';
}
function go(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  const el=id==='home'?document.getElementById('vh'):document.getElementById('v'+id);
  const nextId=el?id:'home';
  (nextId==='home'?document.getElementById('vh'):document.getElementById('v'+nextId))?.classList.add('on');
  document.querySelector('.tab[data-id="'+nextId+'"]')?.classList.add('on');
  if(nextId==='grammar')loadMod('grammar');
  if(nextId==='vocab')loadMod('vocab');
  if(!['home','grammar','vocab'].includes(nextId)){
    setTimeout(()=>{ document.getElementById('v'+nextId)?.querySelectorAll('.cspfill[data-w]').forEach(b=>{b.style.width=b.dataset.w+'%';}); },180);
  }
}
function navigateTo(id){
  if(id==='assistant'){openAssistant();return;}
  const target=pathFor(id);
  if(window.location.pathname!==target){history.pushState({view:id},'',target);}
  go(id);
}
window.addEventListener('popstate',()=>{go(viewFromLocation());});
document.addEventListener('DOMContentLoaded',function(){go(viewFromLocation());});
'@
$mainRaw = $mainRaw.Replace((Normalize-LineEndings $oldRouteBlock), (Normalize-LineEndings $newRouteBlock.Trim()))

Set-Content -LiteralPath (Join-Path $website 'index.html') -Value $mainRaw -Encoding UTF8
Remove-Item -LiteralPath $mainSourcePath -Force

# Transform assistant-FINAL.html into website/assistant/index.html
$assistantSourcePath = Join-Path $website '_incoming_ai\assistant-FINAL.html'
$assistantRaw = Get-Content -LiteralPath $assistantSourcePath -Raw
$assistantRaw = Normalize-LineEndings $assistantRaw
$assistantRaw = [regex]::Replace($assistantRaw, '<title>.*?</title>', '<title>KI Tutor | DinoDeutsch</title>', 'Singleline')
$assistantRaw = $assistantRaw.Replace(".logo-mark {`r`n  width: 24px; height: 24px;`r`n  background: var(--near-black);`r`n  color: white;`r`n  border-radius: var(--r4);`r`n  display: flex; align-items: center; justify-content: center;`r`n  font-size: 12px; font-weight: 700;`r`n}", ".logo-mark {`r`n  width: 28px; height: 28px;`r`n  border-radius: 8px;`r`n  display: inline-flex; align-items: center; justify-content: center;`r`n  overflow: hidden; flex-shrink: 0;`r`n}`r`n.logo-mark svg{width:100%;height:100%;display:block;}")
$assistantRaw = $assistantRaw.Replace('<span class="logo-mark">D</span>' + "`r`n    DinoDeutsch", $assistantLogoReplacement)
$assistantRaw = $assistantRaw.Replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>' + "`r`n", '')
$assistantRaw = [regex]::Replace($assistantRaw, '(?s)<div class="nav-r">.*?</div>\s*</nav>', "  <div class=`"nav-r`"><span class=`"nav-link`" style=`"pointer-events:none;color:var(--gray-300);`">Anonymous</span></div>`r`n</nav>", 'Singleline')
$assistantRaw = [regex]::Replace($assistantRaw, 'id="xpSub">.*?</div>', 'id="xpSub">AI chay an danh · khong can dang nhap</div>', 'Singleline')
$assistantRaw = [regex]::Replace($assistantRaw, 'const WORKER_URL = .*?;\r\nconst SB_URL\s+= .*?;\r\nconst SB_KEY\s+= .*?;', "const WORKER_URL = '/api/assistant';", 'Singleline')
$assistantRaw = $assistantRaw.Replace("const CONFIGURED = !WORKER_URL.includes('YOUR_WORKER');", 'const CONFIGURED = true;')
$assistantRaw = [regex]::Replace($assistantRaw, '(?s)// ── Auth .*?// ── Mode & Topic', "// ── Auth removed`r`n// ── Mode & Topic", 'Singleline')
$assistantRaw = $assistantRaw.Replace('    if (!CONFIGURED || !user) return;', '    if (!CONFIGURED) return;')
$assistantRaw = $assistantRaw.Replace("      body: JSON.stringify({ action: 'feedback', hash, text: msgText, rating: r, topic: curTopic, mode: curMode, ab_variant: abVariant, userId: user.id, supabaseToken: sbTok }),", "      body: JSON.stringify({ action: 'feedback', hash, text: msgText, rating: r, topic: curTopic, mode: curMode, ab_variant: abVariant }),")
$assistantRaw = $assistantRaw.Replace("      body: JSON.stringify({ messages: history, topic: curTopic, mode: mSys, userId: user?.id || null, supabaseToken: sbTok || null, sessionState }),", "      body: JSON.stringify({ messages: history, topic: curTopic, mode: mSys, sessionState }),")
$assistantRaw = $assistantRaw.Replace('    if (user) await loadMemory();' + "`r`n", '')
$assistantRaw = [regex]::Replace($assistantRaw, '(?s)// Init\r\ndocument\.getElementById\(''authBtn''\).*?</script>', '</script>', 'Singleline')

$assistantDir = Join-Path $website 'assistant'
if (-not (Test-Path $assistantDir)) { New-Item -ItemType Directory -Path $assistantDir | Out-Null }
Set-Content -LiteralPath (Join-Path $assistantDir 'index.html') -Value $assistantRaw -Encoding UTF8

# New Pages Function assistant backend
$assistantFn = @'
import { json } from "../_lib/response.js";
import { modules, vocab } from "../_lib/data.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value) {
  return text(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function stripMeta(value) {
  return text(value).replace(/\[[^\]]+\]/g, " ").replace(/\s+/g, " ").trim();
}

function anthropicMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: [{ type: "text", text: stripMeta(item.content) }]
    }))
    .filter((item) => item.content[0].text.length > 0)
    .slice(-10);
}

function lastUserMessage(messages) {
  if (!Array.isArray(messages)) return "";

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    if (item?.role === "user" && typeof item.content === "string") {
      return stripMeta(item.content);
    }
  }

  return "";
}

function grammarSnippets(query, limit = 5) {
  const nQuery = normalize(query);
  const lessons = [];

  for (const level of modules.grammar.levels || []) {
    for (const section of level.sections || []) {
      for (const lesson of section.lessons || []) {
        const haystack = normalize([
          level.level,
          level.label,
          section.group,
          lesson.slug,
          lesson.title,
          lesson.summary,
          lesson.pattern,
          ...(lesson.examples || []),
          ...(lesson.mistakes || [])
        ].join(" "));

        if (!nQuery || haystack.includes(nQuery)) {
          lessons.push(
            `${level.level} · ${section.group} · ${lesson.title}\n` +
              `Tom tat: ${lesson.summary}\n` +
              `Cau truc: ${lesson.pattern}\n` +
              `Vi du: ${(lesson.examples || []).slice(0, 2).join(" | ")}`
          );
        }
      }
    }
  }

  return lessons.slice(0, limit);
}

function vocabSnippets(query, limit = 8) {
  const nQuery = normalize(query);
  const matches = [];

  for (const [level, topics] of Object.entries(vocab)) {
    for (const [topic, items] of Object.entries(topics)) {
      for (const item of items) {
        const haystack = normalize([
          level,
          topic,
          item.word,
          item.gender,
          item.pos,
          item.vi,
          item.en,
          item.ipa,
          item.example
        ].join(" "));

        if (!nQuery || haystack.includes(nQuery)) {
          matches.push(
            `${level} · ${topic} · ${item.word} (${item.gender})\n` +
              `${item.pos} · VI: ${item.vi} · EN: ${item.en}\n` +
              `IPA: ${item.ipa}\n` +
              `Vi du: ${item.example}`
          );
        }
      }
    }
  }

  return matches.slice(0, limit);
}

function listeningSnippets(query, limit = 4) {
  const nQuery = normalize(query);
  const matches = [];

  for (const level of modules.listening.levels || []) {
    for (const track of level.tracks || []) {
      for (const lesson of track.lessons || []) {
        const haystack = normalize([
          level.level,
          level.label,
          track.group,
          lesson.slug,
          lesson.title,
          lesson.scenario,
          lesson.goal,
          ...(lesson.listenFor || []),
          ...(lesson.transcript || [])
        ].join(" "));

        if (!nQuery || haystack.includes(nQuery)) {
          matches.push(
            `${level.level} · ${track.group} · ${lesson.title}\n` +
              `Tinh huong: ${lesson.scenario}\n` +
              `Muc tieu: ${lesson.goal}\n` +
              `Transcript: ${(lesson.transcript || []).slice(0, 2).join(" ")}`
          );
        }
      }
    }
  }

  return matches.slice(0, limit);
}

function buildContext(topic, latestUserMessage, modeText) {
  const query = [topic, latestUserMessage, modeText].filter(Boolean).join(" ");
  const nTopic = normalize(topic);
  const nQuery = normalize(query);
  const blocks = [];
  const toolsUsed = [];

  const wantsGrammar = nTopic.includes("ngu phap") || /akkusativ|dativ|perfekt|praeteritum|satz|artikel|grammatik/.test(nQuery);
  const wantsVocab = nTopic.includes("tu vung") || /wort|vocab|ipa|gender|plural|nghia/.test(nQuery);
  const wantsListening = nTopic.includes("hoi thoai") || nTopic.includes("nghe") || /shadow|dictation|nghe|hoi thoai|listening|transcript/.test(nQuery);

  if (wantsGrammar || (!wantsVocab && !wantsListening)) {
    const grammar = grammarSnippets(query);
    if (grammar.length) {
      blocks.push(`GRAMMAR CONTEXT\n${grammar.join("\n\n")}`);
      toolsUsed.push("grammar-data");
    }
  }

  if (wantsVocab || (!wantsGrammar && !wantsListening)) {
    const vocabMatches = vocabSnippets(query);
    if (vocabMatches.length) {
      blocks.push(`VOCAB CONTEXT\n${vocabMatches.join("\n\n")}`);
      toolsUsed.push("vocab-data");
    }
  }

  if (wantsListening || (!wantsGrammar && !wantsVocab)) {
    const listening = listeningSnippets(query);
    if (listening.length) {
      blocks.push(`LISTENING CONTEXT\n${listening.join("\n\n")}`);
      toolsUsed.push("listening-data");
    }
  }

  return {
    context: blocks.join("\n\n"),
    toolsUsed
  };
}

function parsePayload(body) {
  if (!body || typeof body !== "object") return null;

  return {
    action: text(body.action),
    topic: text(body.topic) || "Tong quat",
    mode: text(body.mode),
    messages: Array.isArray(body.messages) ? body.messages : [],
    sessionState: body.sessionState && typeof body.sessionState === "object"
      ? body.sessionState
      : { difficulty: 3, messages_count: 0 }
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const headers = corsHeaders();
  let body;

  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, { status: 400, headers });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return json({ ok: false, error: "Invalid assistant payload" }, { status: 400, headers });
  }

  if (payload.action === "feedback") {
    return json({ ok: true, stored: false }, { headers });
  }

  const latestUser = lastUserMessage(payload.messages);
  if (!latestUser) {
    return json({ ok: true, reply: "Hay gui cau hoi cu the de minh co the ho tro dung nguyen tac ngu phap, tu vung hoac bai nghe cho ban.", toolsUsed: [], abVariant: null, sessionState: payload.sessionState }, { headers });
  }

  const apiKey = text(context.env.ANTHROPIC_API_KEY);
  if (!apiKey) {
    return json({ ok: true, reply: "Cloudflare Pages chua duoc cau hinh ANTHROPIC_API_KEY, nen assistant chua the tra loi. Them key nay vao Pages env roi redeploy la duoc.", toolsUsed: [], abVariant: null, sessionState: payload.sessionState }, { headers });
  }

  const { context: localContext, toolsUsed } = buildContext(payload.topic, latestUser, payload.mode);
  const system = [
    "Ban la KI Tutor cua DinoDeutsch.",
    "Mac dinh tra loi bang tieng Viet, ngan gon, ro rang, va dua vi du tieng Duc chinh xac.",
    "Neu co local learning context thi uu tien dung no; neu context khong du thi noi ro gioi han thay vi bịa them.",
    "Neu nguoi dung hoi ngu phap: giai thich ngan, cong thuc, 2 vi du, 1 loi hay gap.",
    "Neu nguoi dung hoi tu vung: neu giong, nghia Viet, nghia Anh, IPA va 1 vi du.",
    "Neu nguoi dung hoi bai nghe: tom tat tinh huong, tu khoa, va 1 bai shadowing ngan.",
    payload.mode ? `Huong dan bo sung cho che do hien tai: ${payload.mode}` : "",
    localContext ? `Ngu lieu noi bo de uu tien su dung:\n\n${localContext}` : ""
  ].filter(Boolean).join("\n\n");

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: text(context.env.ANTHROPIC_MODEL) || ANTHROPIC_MODEL,
        max_tokens: 1200,
        system,
        messages: anthropicMessages(payload.messages)
      })
    });

    const result = await upstream.json();
    if (!upstream.ok) {
      const message = result?.error?.message || result?.error || `Anthropic request failed (${upstream.status})`;
      return json({ ok: true, reply: `Claude API chua tra loi duoc: ${message}`, toolsUsed, abVariant: null, sessionState: payload.sessionState }, { headers });
    }

    const reply = Array.isArray(result.content)
      ? result.content.map((part) => part?.text || "").join("\n\n").trim()
      : "";

    return json({
      ok: true,
      reply: reply || "Minh chua tao duoc cau tra loi tu Claude. Thu hoi lai ngan hon hoac cu the hon.",
      toolsUsed,
      abVariant: null,
      sessionState: {
        ...payload.sessionState,
        messages_count: Number(payload.sessionState?.messages_count || 0) + 1
      }
    }, { headers });
  } catch (error) {
    return json({
      ok: true,
      reply: `Minh chua goi duoc Claude API: ${error instanceof Error ? error.message : "Unknown error"}`,
      toolsUsed,
      abVariant: null,
      sessionState: payload.sessionState
    }, { headers });
  }
}
'@
Set-Content -LiteralPath (Join-Path $website 'functions\api\assistant.js') -Value (Normalize-LineEndings $assistantFn.Trim()) -Encoding UTF8

$rootAssistantBridge = @'
export { onRequestOptions, onRequestPost } from "../../website/functions/api/assistant.js";
'@
Set-Content -LiteralPath (Join-Path $root 'functions\api\assistant.js') -Value (Normalize-LineEndings $rootAssistantBridge.Trim()) -Encoding UTF8

$headersContent = @'
/index.html
  Cache-Control: public, max-age=0, must-revalidate
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'

/assistant/index.html
  Cache-Control: public, max-age=0, must-revalidate
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'

/og-card.svg
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/data/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/api/*
  Cache-Control: public, max-age=60, stale-while-revalidate=300

/LEARN_GERMAN_RESOURCES.md
  Cache-Control: public, max-age=600
'@
Set-Content -LiteralPath (Join-Path $website '_headers') -Value (Normalize-LineEndings $headersContent.Trim()) -Encoding UTF8

$pathsToRemove = @(
  'C:\Users\adminn\Desktop\code\website\app.js',
  'C:\Users\adminn\Desktop\code\website\styles.css',
  'C:\Users\adminn\Desktop\code\website\assistant\app.js',
  'C:\Users\adminn\Desktop\code\website\assistant\styles.css',
  'C:\Users\adminn\Desktop\code\render.yaml',
  'C:\Users\adminn\Desktop\code\website\assistant-v2.html',
  'C:\Users\adminn\Desktop\code\website\assistant-with-memory.html',
  'C:\Users\adminn\Desktop\code\website\supabase-config.js',
  'C:\Users\adminn\Desktop\code\website\supabase-schema.sql',
  'C:\Users\adminn\Desktop\code\website\SUPABASE_SCHEMA.sql',
  'C:\Users\adminn\Desktop\code\website\SUPABASE_SETUP.md',
  'C:\Users\adminn\Desktop\code\website\worker.js',
  'C:\Users\adminn\Desktop\code\website\_incoming_ai',
  'C:\Users\adminn\Desktop\code\website\_ai_import'
)
foreach($path in $pathsToRemove){ if(Test-Path $path){ Remove-Item -LiteralPath $path -Recurse -Force } }
