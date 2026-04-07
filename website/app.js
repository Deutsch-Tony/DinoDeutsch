const ROUTES = [
  { key: "home", path: "/" },
  { key: "grammar", path: "/grammar" },
  { key: "vocab", path: "/vocab" },
  { key: "listening", path: "/listening" },
  { key: "reading", path: "/reading" },
  { key: "test", path: "/test" }
];

const SEO = {
  home: {
    title: "Deutsch Sprint | Tu hoc tieng Duc theo nhip gon va ro",
    description:
      "Deutsch Sprint la khong gian tu hoc tieng Duc ca nhan voi Wortschatz, Grammatik, Horen, Lesen va Tests duoc to chuc gon, ro va de mo rong."
  },
  grammar: {
    title: "Grammatik | Deutsch Sprint",
    description: "Hoc ngu phap tieng Duc theo tung khoi ro rang: cases, thi, wortstellung va cau truc can nho."
  },
  vocab: {
    title: "Wortschatz | Deutsch Sprint",
    description: "Thu vien hon 1000 tu vung tieng Duc theo level A1-B2, chu de, tim kiem, IPA va tien do hoc."
  },
  listening: {
    title: "Horen | Deutsch Sprint",
    description: "Module luyen nghe tieng Duc voi transcript, shadowing va nguon hoc chon loc theo cap do."
  },
  reading: {
    title: "Lesen | Deutsch Sprint",
    description: "Module doc hieu tieng Duc gom bai doc ngan, glossary va cau hoi kiem tra de hoc gon hon."
  },
  test: {
    title: "Tests | Deutsch Sprint",
    description: "Mini test va checkpoint de tu danh gia trinh do tieng Duc theo tung muc hoc."
  }
};

const dataCache = new Map();
const VOCAB_STATE_KEY = "deutschSprint.vocabState";
let activeListeningAudio = null;
let listeningPlayback = {
  lessonId: null,
  lines: [],
  duration: 0,
  currentTime: 0,
  sentenceIndex: 0,
  sentenceStartedAt: 0,
  sentenceOffset: 0,
  sentenceDurations: [],
  utterance: null,
  timer: null,
  timeout: null,
  playing: false
};

function routeFromLocation() {
  const hashKey = (location.hash || "").replace("#", "");
  if (ROUTES.some((route) => route.key === hashKey)) {
    history.replaceState({}, "", hashKey === "home" ? "/" : `/${hashKey}`);
    return hashKey;
  }

  const normalizedPath = (location.pathname || "/")
    .replace(/index\.html$/i, "")
    .replace(/\/+$/, "") || "/";
  const match = ROUTES.find((route) => route.path === normalizedPath || `${route.path}/` === `${normalizedPath}/`);
  return match ? match.key : "home";
}

function routeToPath(routeKey) {
  const match = ROUTES.find((route) => route.key === routeKey);
  return match ? match.path : "/";
}

function isLearningRoute(routeKey) {
  return ["grammar", "vocab", "listening", "reading", "test"].includes(routeKey);
}

function goToRoute(routeKey) {
  const nextPath = routeToPath(routeKey);
  if (location.pathname !== nextPath) {
    history.pushState({}, "", nextPath);
  }
  void mountRoute();
}

function bindRouteLinks() {
  document.querySelectorAll('a[href^="/"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "/";
      const route = ROUTES.find((item) => item.path === href);
      if (!route) return;
      event.preventDefault();
      goToRoute(route.key);
    });
  });
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getRouteLabel(route) {
  const labels = {
    home: "Tong quan",
    grammar: "Grammatik",
    vocab: "Wortschatz",
    listening: "Horen",
    reading: "Lesen",
    test: "Tests"
  };
  return labels[route] || "Tong quan";
}

function getVocabId(level, topic, word) {
  return `${level}__${topic}__${word}`;
}

function normalizeStateEntry(entry = {}) {
  return {
    favorite: Boolean(entry.favorite),
    progress: entry.progress || "new",
    updatedAt: entry.updatedAt || new Date().toISOString()
  };
}

function loadVocabState() {
  try {
    const raw = localStorage.getItem(VOCAB_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, normalizeStateEntry(value)]));
  } catch {
    return {};
  }
}

function saveVocabState(state) {
  localStorage.setItem(VOCAB_STATE_KEY, JSON.stringify(state));
}

function markStateChanged(mutator) {
  const state = loadVocabState();
  mutator(state);
  saveVocabState(state);
}

function toggleFavorite(vocabId) {
  markStateChanged((state) => {
    const current = normalizeStateEntry(state[vocabId]);
    state[vocabId] = {
      ...current,
      favorite: !current.favorite,
      updatedAt: new Date().toISOString()
    };
  });
}

function setProgress(vocabId, progress) {
  markStateChanged((state) => {
    const current = normalizeStateEntry(state[vocabId]);
    state[vocabId] = {
      ...current,
      progress: current.progress === progress ? "new" : progress,
      updatedAt: new Date().toISOString()
    };
  });
}

function getStateSummary(vocabState) {
  const values = Object.values(vocabState);
  return {
    favorite: values.filter((item) => item.favorite).length,
    learned: values.filter((item) => item.progress === "learned").length,
    review: values.filter((item) => item.progress === "review").length
  };
}

async function loadStaticJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load fallback ${path}`);
  return await response.json();
}

async function loadApiFallback(path) {
  const url = new URL(path, window.location.origin);

  if (url.pathname.startsWith("/api/modules/")) {
    const moduleName = url.pathname.split("/").pop();
    const fileName = moduleName === "test" ? "tests" : moduleName;
    const data = await loadStaticJson(`/data/${fileName}.json`);
    return { ok: true, item: data };
  }

  if (url.pathname === "/api/resources") {
    const data = await loadStaticJson("/data/resources.json");
    const category = url.searchParams.get("category");
    return {
      ok: true,
      items: category ? data.filter((item) => item.category === category) : data
    };
  }

  if (url.pathname === "/api/vocab/meta") {
    const vocab = await loadStaticJson("/data/vocab.json");
    const levels = Object.entries(vocab).map(([level, topics]) => {
      const topicEntries = Object.entries(topics).map(([topic, items]) => ({
        topic,
        count: items.length
      }));

      return {
        level,
        count: topicEntries.reduce((sum, item) => sum + item.count, 0),
        topics: topicEntries
      };
    });

    return {
      total: levels.reduce((sum, item) => sum + item.count, 0),
      levels
    };
  }

  if (url.pathname === "/api/vocab") {
    const vocab = await loadStaticJson("/data/vocab.json");
    const level = url.searchParams.get("level");
    const topic = url.searchParams.get("topic");
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();

    const topicData = vocab?.[level]?.[topic] || [];
    const items = !search
      ? topicData
      : topicData.filter((item) =>
          [item.word, item.gender, item.pos, item.vi, item.en, item.ipa, item.example]
            .join(" ")
            .toLowerCase()
            .includes(search)
        );

    return { ok: true, items };
  }

  throw new Error(`No fallback available for ${path}`);
}

async function loadApi(path) {
  if (dataCache.has(path)) return dataCache.get(path);
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    const data = await response.json();
    dataCache.set(path, data);
    return data;
  } catch (error) {
    const fallback = await loadApiFallback(path);
    dataCache.set(path, fallback);
    return fallback;
  }
}

function updateActiveNav(route) {
  document.querySelectorAll(".topbar-item").forEach((item) => {
    const href = item.getAttribute("href") || "/";
    const normalized = href === "/" ? "home" : href.replace(/^\//, "");
    item.classList.toggle("is-active", normalized === route);
  });
}

function updateSeo(route) {
  const seo = SEO[route] || SEO.home;
  const baseUrl = window.location.origin.replace(/\/+$/, "");
  const routeUrl = route === "home" ? `${baseUrl}/` : `${baseUrl}${routeToPath(route)}`;
  document.title = seo.title;

  const descriptionEl = document.getElementById("meta-description");
  const ogTitleEl = document.getElementById("meta-og-title");
  const ogDescriptionEl = document.getElementById("meta-og-description");
  const ogUrlEl = document.getElementById("meta-og-url");
  const twitterTitleEl = document.getElementById("meta-twitter-title");
  const twitterDescriptionEl = document.getElementById("meta-twitter-description");
  const canonicalEl = document.getElementById("canonical-link");

  if (descriptionEl) descriptionEl.setAttribute("content", seo.description);
  if (ogTitleEl) ogTitleEl.setAttribute("content", seo.title);
  if (ogDescriptionEl) ogDescriptionEl.setAttribute("content", seo.description);
  if (ogUrlEl) ogUrlEl.setAttribute("content", routeUrl);
  if (twitterTitleEl) twitterTitleEl.setAttribute("content", seo.title);
  if (twitterDescriptionEl) twitterDescriptionEl.setAttribute("content", seo.description);
  if (canonicalEl) canonicalEl.setAttribute("href", routeUrl);
}

function renderHero({ eyebrow, title, description, sideTitle, sideStats = [] }) {
  return `
    <section class="hero">
      <div class="hero-copy">
        <div class="liquid-band">
          <span class="liquid-dot"></span>
          <span>Liquid study flow</span>
        </div>
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p>${description}</p>
        <div class="hero-actions">
          <a class="hero-primary" href="/vocab">Mo Wortschatz</a>
          <a class="hero-secondary" href="/grammar">Xem Grammatik</a>
        </div>
      </div>
      <div class="card glass-card">
        <div class="glass-wave glass-wave-a"></div>
        <div class="glass-wave glass-wave-b"></div>
        <p class="eyebrow">${sideTitle}</p>
        <div class="stat-grid">
          ${sideStats
            .map(
              (item) => `
                <div class="mini-stat">
                  <strong>${item.title}</strong>
                  <span>${item.text}</span>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderResourceCards(items) {
  return items
    .map(
      (item) => `
        <article class="resource-card">
          <div class="meta">
            <span>${item.category}</span>
            <span>${item.level}</span>
            <span>${item.price}</span>
          </div>
          <h3>${item.name}</h3>
          <p>${item.note}</p>
          <a href="${item.url}" target="_blank" rel="noreferrer">Mo nguon nay</a>
        </article>
      `
    )
    .join("");
}

function renderCompactCards(items, eyebrow) {
  return `
    <div class="feature-grid">
      ${items
        .map(
          (item) => `
            <article class="card compact-card">
              <p class="mini-kicker">${eyebrow}</p>
              <h3>${item.title}</h3>
              <p>${item.text}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

async function renderHome() {
  return `
    ${renderHero({
      eyebrow: "Khong gian hoc tieng Duc cho rieng ban",
      title: "Tu mat goc den co nhip hoc ro rang, nhe dau hon moi ngay.",
      description:
        "Website nay gio co the chuyen dan sang kien truc dong: frontend giu nguyen trai nghiem, con du lieu di qua API serverless tren Cloudflare Pages Functions. Tu day ban co the them search, filter, luu tien do, va sau nay noi database ma khong phai dap lai giao dien.",
      sideTitle: "Muc tieu 90 ngay",
      sideStats: [
        { title: "Dynamic", text: "du lieu qua API" },
        { title: "1000+", text: "tu vung da gom" },
        { title: "Functions", text: "Cloudflare serverless" },
        { title: "Ready", text: "san de noi DB" }
      ]
    })}
    <section class="pill-row">
      <span>Du lieu dong qua API</span>
      <span>Lo trinh A1-A2 de hieu</span>
      <span>Code tach lop ro rang</span>
      <span>De mo rong sau nay</span>
    </section>
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Nhip hoc de xuat</p>
        <h2>Moi tab la mot khong gian nho, gon va de quay lai dung cho dang hoc</h2>
      </div>
      ${renderCompactCards(
        [
          { title: "Wortschatz", text: "Chon level, chon chu de roi search ngay trong cung mot nhip." },
          { title: "Grammatik", text: "Gom ngu phap thanh tung khoi ngan de doc it ma van vao y chinh." },
          { title: "Horen", text: "Nghe, doi chieu transcript, roi quay lai shadowing theo cum." },
          { title: "Lesen + Tests", text: "Doc ngan, chot bang cau hoi nho de giu nhip hoc deu hon." }
        ],
        "Study flow"
      )}
    </section>
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Assistant moi</p>
        <h2>Tro ly hoc tap nay dang chay rieng tai /assistant, khong can dang nhap hay backend cu</h2>
      </div>
      ${renderCompactCards(
        [
          { title: "Local-first", text: "Assistant moi doc du lieu grammar, vocab va listening ngay trong website." },
          { title: "Khong dang nhap", text: "Tam thoi bo toan bo flow email, Google va Supabase de build lai sach hon." },
          { title: "Assistant page", text: "Mo /assistant de chat, chon mode va prompt nhanh tu mot page rieng." },
          { title: "De thay the", text: "Ve sau ban co the gan AI moi vao assistant page ma khong dung vao app chinh." }
        ],
        "Assistant"
      )}
    </section>
  `;
}

async function renderGenericModule(moduleName) {
  const [moduleRes, resourcesRes] = await Promise.all([
    loadApi(`/api/modules/${moduleName}`),
    loadApi("/api/resources")
  ]);

  const moduleItem = moduleRes.item;
  const related = resourcesRes.items.filter((item) => item.category === moduleItem.resourceCategory);

  return `
    ${renderHero({
      eyebrow: moduleItem.eyebrow,
      title: moduleItem.title,
      description: moduleItem.description,
      sideTitle: "Trong tam",
      sideStats: moduleItem.highlights
    })}
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Nguon hoc lien quan</p>
        <h2>Cac nguon nen xem cho ${moduleItem.eyebrow}</h2>
      </div>
      <div class="resource-grid">
        ${renderResourceCards(related)}
      </div>
    </section>
  `;
}

function getListeningLessonCount(listening) {
  return listening.levels.reduce(
    (total, level) => total + level.tracks.reduce((sum, track) => sum + track.lessons.length, 0),
    0
  );
}

function renderListeningLessonCard(lesson) {
  const transcriptText = lesson.transcript.join(" ");
  const encodedLines = escapeAttr(JSON.stringify(lesson.transcript));
  const audioPanel = lesson.audioUrl
    ? `
        <div class="listening-panel listening-audio-panel">
          <p class="mini-kicker">${lesson.audioLabel || "Audio that"}</p>
          <div class="listening-player listening-player-audio" data-lesson="${lesson.slug}">
            <audio preload="none" src="${escapeAttr(lesson.audioUrl)}"></audio>
            <div class="listening-player-controls">
              <button class="listening-control" type="button" data-audio-action="back">-5s</button>
              <button class="listening-control listening-play" type="button" data-audio-action="toggle">Play</button>
              <button class="listening-control" type="button" data-audio-action="forward">+5s</button>
            </div>
            <div class="listening-progress-wrap">
              <input class="listening-progress" type="range" min="0" max="1000" value="0" step="1" data-audio-action="seek" />
              <div class="listening-time">
                <span data-role="current">00:00</span>
                <span data-role="total">00:00</span>
              </div>
            </div>
            <p class="listening-player-note">${lesson.audioSource || "Audio gan tu nguon hoc ben ngoai."}</p>
          </div>
        </div>
      `
    : `
        <div class="listening-panel listening-audio-panel">
          <p class="mini-kicker">Audio player</p>
          <div class="listening-player" data-lesson="${lesson.slug}" data-text="${escapeAttr(transcriptText)}" data-lines="${encodedLines}">
            <div class="listening-player-controls">
              <button class="listening-control" type="button" data-listening-action="back">-5s</button>
              <button class="listening-control listening-play" type="button" data-listening-action="toggle">Play</button>
              <button class="listening-control" type="button" data-listening-action="forward">+5s</button>
            </div>
            <div class="listening-progress-wrap">
              <input class="listening-progress" type="range" min="0" max="1000" value="0" step="1" data-listening-action="seek" />
              <div class="listening-time">
                <span data-role="current">00:00</span>
                <span data-role="total">00:00</span>
              </div>
            </div>
            <p class="listening-player-note">Dang dung voice cua trinh duyet de phat transcript. Sau nay co the doi sang audio that.</p>
          </div>
        </div>
      `;
  return `
    <details class="listening-lesson">
      <summary>
        <div>
          <h3>${lesson.title}</h3>
          <p>${lesson.scenario}</p>
        </div>
        <div class="listening-summary-meta">
          <span>${lesson.duration}</span>
          <span class="listening-open">Mo bai</span>
        </div>
      </summary>
      <div class="listening-lesson-body">
        <div class="listening-panel">
          <p class="mini-kicker">Muc tieu nghe</p>
          <p>${lesson.goal}</p>
        </div>
        <div class="listening-panel">
          <p class="mini-kicker">Tinh huong</p>
          <p>${lesson.scenario}</p>
        </div>
        <div class="listening-panel listening-transcript">
          <p class="mini-kicker">Transcript</p>
          <ol class="listening-lines">
            ${lesson.transcript.map((line, index) => `<li data-line-index="${index}">${line}</li>`).join("")}
          </ol>
        </div>
        ${audioPanel}
        <div class="listening-panel">
          <p class="mini-kicker">Can nghe ra</p>
          <ul class="grammar-list">
            ${lesson.listenFor.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
        <div class="listening-panel">
          <p class="mini-kicker">Shadowing</p>
          <ul class="grammar-list">
            ${lesson.shadowing.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
        <div class="listening-panel">
          <p class="mini-kicker">Tu check</p>
          <ul class="grammar-list">
            ${lesson.checklist.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
        <div class="listening-panel">
          <p class="mini-kicker">Ghi chu</p>
          <p>${lesson.sourceHint}</p>
        </div>
      </div>
    </details>
  `;
}

function renderListeningTrack(track, level) {
  return `
    <section class="listening-group">
      <div class="listening-group-head">
        <div>
          <p class="eyebrow">${level}</p>
          <h3>${track.group}</h3>
        </div>
        <span class="grammar-group-count">${track.lessons.length} bai nghe</span>
      </div>
      <div class="listening-lessons">
        ${track.lessons.map((lesson) => renderListeningLessonCard(lesson)).join("")}
      </div>
    </section>
  `;
}

async function renderListening() {
  const [listeningRes, resourcesRes] = await Promise.all([
    loadApi("/api/modules/listening"),
    loadApi("/api/resources?category=listening")
  ]);

  const listening = listeningRes.item;
  const firstLevel = listening.levels[0];
  const totalLessons = getListeningLessonCount(listening);

  return `
    ${renderHero({
      eyebrow: listening.eyebrow,
      title: "Luyen nghe theo tinh huong de bat am, hieu y va noi lai de hon.",
      description: listening.description,
      sideTitle: "Tong quan",
      sideStats: [
        { title: `${listening.levels.length}`, text: "level A1-B2" },
        { title: `${totalLessons}`, text: "bai nghe ngan" },
        { title: firstLevel.label, text: `${firstLevel.level} khoi dau` },
        { title: "Flow", text: "nghe -> doc -> shadowing" }
      ]
    })}
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Hoer-Bibliothek</p>
        <h2>Chon level, mo nhom bai va luyen nghe theo transcript, checklist va shadowing</h2>
      </div>
      <div class="grammar-shell listening-shell">
        <div class="toolbar-card">
          <p class="eyebrow">CEFR-Stufen</p>
          <div class="level-row" id="listeningLevels"></div>
        </div>
        <div class="topic-card grammar-toolbar">
          <div>
            <p class="eyebrow">Suche</p>
            <input id="listeningSearch" class="search-input" type="search" placeholder="Tim theo bai nghe, tinh huong, transcript, tu khoa..." />
          </div>
          <div class="vocab-meta grammar-meta">
            <span id="listeningLevelLabel">Trinh do: ${firstLevel.level}</span>
            <span id="listeningFocusLabel">Trong tam: ${firstLevel.focus}</span>
            <span id="listeningCountLabel"></span>
          </div>
          <div class="grammar-flow">
            ${listening.overview.studyFlow.map((item) => `<span>${item}</span>`).join("")}
          </div>
        </div>
        <div id="listeningContent" class="grammar-content listening-content"></div>
        <div id="listeningEmpty" class="empty-state" hidden>Khong co bai nghe nao khop bo loc hien tai.</div>
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Nguon hoc lien quan</p>
        <h2>Cac nguon nen xem them cho Horen</h2>
      </div>
      <div class="resource-grid">
        ${renderResourceCards(resourcesRes.items)}
      </div>
    </section>
  `;
}

function estimateListeningDuration(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(12000, words * 430);
}

function estimateListeningDurations(lines) {
  return lines.map((line) => {
    const words = line.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1800, words * 420 + 350);
  });
}

function formatListeningTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getListeningVoice() {
  const voices = speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("de")) || null;
}

function stopListeningTimer() {
  if (listeningPlayback.timer) {
    clearInterval(listeningPlayback.timer);
    listeningPlayback.timer = null;
  }
}

function stopListeningTimeout() {
  if (listeningPlayback.timeout) {
    clearTimeout(listeningPlayback.timeout);
    listeningPlayback.timeout = null;
  }
}

function stopActiveListeningAudio() {
  if (activeListeningAudio) {
    activeListeningAudio.pause();
    activeListeningAudio.currentTime = activeListeningAudio.currentTime || 0;
    activeListeningAudio = null;
  }
}

function syncNativeAudioPlayers() {
  document.querySelectorAll(".listening-player-audio").forEach((player) => {
    const audio = player.querySelector("audio");
    const currentEl = player.querySelector('[data-role="current"]');
    const totalEl = player.querySelector('[data-role="total"]');
    const progressEl = player.querySelector(".listening-progress");
    const playButton = player.querySelector(".listening-play");
    if (!audio || !currentEl || !totalEl || !progressEl || !playButton) return;

    const durationMs = Number.isFinite(audio.duration) ? audio.duration * 1000 : 0;
    const currentMs = (audio.currentTime || 0) * 1000;
    currentEl.textContent = formatListeningTime(currentMs);
    totalEl.textContent = formatListeningTime(durationMs);
    progressEl.value = durationMs ? Math.round((currentMs / durationMs) * 1000) : 0;
    playButton.textContent = !audio.paused ? "Pause" : "Play";
  });
}

function getListeningCurrentTime() {
  if (!listeningPlayback.playing) return listeningPlayback.currentTime;
  const sentenceBase = listeningPlayback.sentenceDurations
    .slice(0, listeningPlayback.sentenceIndex)
    .reduce((sum, value) => sum + value, 0);
  const sentenceProgress = Math.max(
    0,
    Math.min(
      listeningPlayback.sentenceDurations[listeningPlayback.sentenceIndex] || 0,
      listeningPlayback.sentenceOffset + (Date.now() - listeningPlayback.sentenceStartedAt)
    )
  );
  return Math.min(listeningPlayback.duration, sentenceBase + sentenceProgress);
}

function updateListeningTranscriptHighlight() {
  document.querySelectorAll(".listening-player").forEach((player) => {
    const lessonId = player.dataset.lesson;
    const isActive = listeningPlayback.lessonId === lessonId;
    const activeIndex = isActive ? listeningPlayback.sentenceIndex : -1;
    player
      .closest(".listening-lesson-body")
      ?.querySelectorAll(".listening-lines [data-line-index]")
      .forEach((line) => {
        line.classList.toggle("is-active", Number(line.dataset.lineIndex) === activeIndex && isActive);
      });
  });
}

function syncListeningPlayers() {
  document.querySelectorAll(".listening-player").forEach((player) => {
    if (player.classList.contains("listening-player-audio")) return;
    const lessonId = player.dataset.lesson;
    const currentEl = player.querySelector('[data-role="current"]');
    const totalEl = player.querySelector('[data-role="total"]');
    const progressEl = player.querySelector(".listening-progress");
    const playButton = player.querySelector(".listening-play");
    if (!currentEl || !totalEl || !progressEl || !playButton) return;

    const lines = JSON.parse(player.dataset.lines || "[]");
    const isActive = listeningPlayback.lessonId === lessonId;
    const duration = isActive ? listeningPlayback.duration : estimateListeningDurations(lines).reduce((sum, value) => sum + value, 0);
    const currentTime = isActive ? getListeningCurrentTime() : 0;

    currentEl.textContent = formatListeningTime(currentTime);
    totalEl.textContent = formatListeningTime(duration);
    progressEl.value = duration ? Math.round((currentTime / duration) * 1000) : 0;
    playButton.textContent = isActive && listeningPlayback.playing ? "Pause" : "Play";
  });
  syncNativeAudioPlayers();
  updateListeningTranscriptHighlight();
}

function stopListeningPlayback({ reset = false } = {}) {
  stopListeningTimer();
  stopListeningTimeout();
  stopActiveListeningAudio();
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
  listeningPlayback.playing = false;
  listeningPlayback.utterance = null;
  listeningPlayback.currentTime = getListeningCurrentTime();
  listeningPlayback.sentenceStartedAt = 0;
  listeningPlayback.sentenceOffset = 0;

  if (reset) {
    listeningPlayback = {
      lessonId: null,
      lines: [],
      duration: 0,
      currentTime: 0,
      sentenceIndex: 0,
      sentenceStartedAt: 0,
      sentenceOffset: 0,
      sentenceDurations: [],
      utterance: null,
      timer: null,
      timeout: null,
      playing: false
    };
  }

  syncListeningPlayers();
}

function playListeningSentence(lessonId, lines) {
  if (!("speechSynthesis" in window)) {
    alert("Trinh duyet nay chua ho tro phat am transcript.");
    return;
  }

  const sentence = lines[listeningPlayback.sentenceIndex];
  if (!sentence) {
    listeningPlayback.currentTime = listeningPlayback.duration;
    listeningPlayback.playing = false;
    syncListeningPlayers();
    return;
  }

  stopListeningTimer();
  stopListeningTimeout();
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = "de-DE";
  utterance.rate = 0.92;
  utterance.pitch = 1;
  const voice = getListeningVoice();
  if (voice) utterance.voice = voice;

  listeningPlayback.lessonId = lessonId;
  listeningPlayback.lines = lines;
  listeningPlayback.duration = listeningPlayback.sentenceDurations.reduce((sum, value) => sum + value, 0);
  listeningPlayback.currentTime = listeningPlayback.sentenceDurations
    .slice(0, listeningPlayback.sentenceIndex)
    .reduce((sum, value) => sum + value, 0);
  listeningPlayback.sentenceStartedAt = Date.now();
  listeningPlayback.utterance = utterance;
  listeningPlayback.playing = true;
  listeningPlayback.timer = setInterval(() => {
    syncListeningPlayers();
  }, 250);

  utterance.onend = () => {
    stopListeningTimer();
    const finishedSentenceDuration = listeningPlayback.sentenceDurations[listeningPlayback.sentenceIndex] || 0;
    listeningPlayback.currentTime =
      listeningPlayback.sentenceDurations
        .slice(0, listeningPlayback.sentenceIndex)
        .reduce((sum, value) => sum + value, 0) + finishedSentenceDuration;
    listeningPlayback.sentenceOffset = 0;
    listeningPlayback.utterance = null;

    if (listeningPlayback.sentenceIndex >= lines.length - 1) {
      listeningPlayback.playing = false;
      syncListeningPlayers();
      return;
    }

    listeningPlayback.sentenceIndex += 1;
    listeningPlayback.timeout = setTimeout(() => {
      playListeningSentence(lessonId, lines);
    }, 220);
    syncListeningPlayers();
  };

  utterance.onerror = () => {
    stopListeningPlayback();
  };

  speechSynthesis.speak(utterance);
  syncListeningPlayers();
}

function pauseListeningTranscript() {
  if (!listeningPlayback.playing) return;
  stopListeningPlayback();
}

function getSentenceIndexFromTime(durations, time) {
  let sum = 0;
  for (let i = 0; i < durations.length; i += 1) {
    const next = sum + durations[i];
    if (time < next) return { index: i, offset: Math.max(0, time - sum) };
    sum = next;
  }
  return { index: Math.max(0, durations.length - 1), offset: 0 };
}

function toggleListeningTranscript(lessonId, lines) {
  if (listeningPlayback.lessonId === lessonId && listeningPlayback.playing) {
    pauseListeningTranscript();
    return;
  }

  const durations = estimateListeningDurations(lines);

  if (listeningPlayback.lessonId !== lessonId) {
    stopListeningPlayback({ reset: true });
    listeningPlayback.lessonId = lessonId;
    listeningPlayback.lines = lines;
    listeningPlayback.sentenceDurations = durations;
    listeningPlayback.duration = durations.reduce((sum, value) => sum + value, 0);
    listeningPlayback.currentTime = 0;
    listeningPlayback.sentenceIndex = 0;
    listeningPlayback.sentenceOffset = 0;
  } else {
    const nextPosition = getSentenceIndexFromTime(durations, listeningPlayback.currentTime);
    listeningPlayback.sentenceDurations = durations;
    listeningPlayback.sentenceIndex = nextPosition.index;
    listeningPlayback.sentenceOffset = nextPosition.offset;
  }

  playListeningSentence(lessonId, lines);
}

function seekListeningTranscript(lessonId, lines, nextTime) {
  const durations = estimateListeningDurations(lines);
  const duration = durations.reduce((sum, value) => sum + value, 0);
  const clamped = Math.max(0, Math.min(duration, nextTime));
  const nextPosition = getSentenceIndexFromTime(durations, clamped);

  if (listeningPlayback.lessonId !== lessonId) {
    listeningPlayback.lessonId = lessonId;
    listeningPlayback.lines = lines;
    listeningPlayback.duration = duration;
    listeningPlayback.sentenceDurations = durations;
  }

  listeningPlayback.currentTime = clamped;
  listeningPlayback.sentenceIndex = nextPosition.index;
  listeningPlayback.sentenceOffset = nextPosition.offset;

  if (listeningPlayback.playing) {
    playListeningSentence(lessonId, lines);
  } else {
    syncListeningPlayers();
  }
}

function setupListeningPlayers() {
  document.querySelectorAll(".listening-player-audio").forEach((player) => {
    const audio = player.querySelector("audio");
    if (!audio) return;

    const playButton = player.querySelector('.listening-play');
    const progressEl = player.querySelector(".listening-progress");

    audio.addEventListener("loadedmetadata", () => syncNativeAudioPlayers());
    audio.addEventListener("timeupdate", () => syncNativeAudioPlayers());
    audio.addEventListener("ended", () => {
      if (activeListeningAudio === audio) activeListeningAudio = null;
      syncNativeAudioPlayers();
    });
    audio.addEventListener("pause", () => syncNativeAudioPlayers());
    audio.addEventListener("play", () => syncNativeAudioPlayers());

    player.querySelectorAll("[data-audio-action]").forEach((control) => {
      const action = control.dataset.audioAction;

      if (action === "toggle") {
        control.addEventListener("click", async () => {
          stopListeningPlayback({ reset: true });
          if (activeListeningAudio && activeListeningAudio !== audio) {
            activeListeningAudio.pause();
          }

          if (audio.paused) {
            activeListeningAudio = audio;
            try {
              await audio.play();
            } catch {
              if (playButton) playButton.textContent = "Play";
            }
          } else {
            audio.pause();
            if (activeListeningAudio === audio) activeListeningAudio = null;
          }
          syncNativeAudioPlayers();
        });
      }

      if (action === "back") {
        control.addEventListener("click", () => {
          audio.currentTime = Math.max(0, (audio.currentTime || 0) - 5);
          syncNativeAudioPlayers();
        });
      }

      if (action === "forward") {
        control.addEventListener("click", () => {
          const duration = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + 5;
          audio.currentTime = Math.min(duration, (audio.currentTime || 0) + 5);
          syncNativeAudioPlayers();
        });
      }

      if (action === "seek") {
        control.addEventListener("input", (event) => {
          const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
          if (!duration) return;
          const ratio = Number(event.target.value) / 1000;
          audio.currentTime = duration * ratio;
          syncNativeAudioPlayers();
        });
      }
    });
  });

  document.querySelectorAll(".listening-player").forEach((player) => {
    if (player.classList.contains("listening-player-audio")) return;
    const lessonId = player.dataset.lesson;
    const lines = JSON.parse(player.dataset.lines || "[]");

    player.querySelectorAll("[data-listening-action]").forEach((control) => {
      const action = control.dataset.listeningAction;

      if (action === "toggle") {
        control.addEventListener("click", () => toggleListeningTranscript(lessonId, lines));
      }

      if (action === "back") {
        control.addEventListener("click", () => {
          const base =
            listeningPlayback.lessonId === lessonId ? getListeningCurrentTime() : 0;
          seekListeningTranscript(lessonId, lines, base - 5000);
        });
      }

      if (action === "forward") {
        control.addEventListener("click", () => {
          const base =
            listeningPlayback.lessonId === lessonId ? getListeningCurrentTime() : 0;
          seekListeningTranscript(lessonId, lines, base + 5000);
        });
      }

      if (action === "seek") {
        control.addEventListener("input", (event) => {
          const duration = estimateListeningDurations(lines).reduce((sum, value) => sum + value, 0);
          const ratio = Number(event.target.value) / 1000;
          seekListeningTranscript(lessonId, lines, duration * ratio);
        });
      }
    });
  });

  syncListeningPlayers();
}

function getGrammarLessonCount(grammar) {
  return grammar.levels.reduce(
    (total, level) => total + level.sections.reduce((sum, section) => sum + section.lessons.length, 0),
    0
  );
}

function renderGrammarLessonCard(lesson) {
  return `
    <details class="grammar-lesson">
      <summary>
        <div>
          <h3>${lesson.title}</h3>
          <p>${lesson.summary}</p>
        </div>
        <span class="grammar-open">Mo bai</span>
      </summary>
      <div class="grammar-lesson-body">
        <div class="grammar-panel">
          <p class="mini-kicker">Trong tam</p>
          <p>${lesson.summary}</p>
        </div>
        <div class="grammar-panel">
          <p class="mini-kicker">Cong thuc</p>
          <p class="grammar-pattern">${lesson.pattern}</p>
        </div>
        <div class="grammar-panel">
          <p class="mini-kicker">Giai thich nhanh</p>
          <p>${lesson.what || lesson.summary}</p>
        </div>
        <div class="grammar-panel">
          <p class="mini-kicker">Vi du</p>
          <ul class="grammar-list">
            ${lesson.examples.map((example) => `<li>${example}</li>`).join("")}
          </ul>
        </div>
        <div class="grammar-panel">
          <p class="mini-kicker">Loi hay gap</p>
          <ul class="grammar-list">
            ${lesson.mistakes.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      </div>
    </details>
  `;
}

function renderGrammarSection(section, level) {
  return `
    <section class="grammar-group">
      <div class="grammar-group-head">
        <div>
          <p class="eyebrow">${level}</p>
          <h3>${section.group}</h3>
        </div>
        <span class="grammar-group-count">${section.lessons.length} bai</span>
      </div>
      <div class="grammar-lessons">
        ${section.lessons.map((lesson) => renderGrammarLessonCard(lesson)).join("")}
      </div>
    </section>
  `;
}

async function renderGrammar() {
  const [grammarRes, resourcesRes] = await Promise.all([
    loadApi("/api/modules/grammar"),
    loadApi("/api/resources?category=grammar")
  ]);

  const grammar = grammarRes.item;
  const firstLevel = grammar.levels[0];
  const totalLessons = getGrammarLessonCount(grammar);

  return `
    ${renderHero({
      eyebrow: grammar.eyebrow,
      title: "Hoc ngu phap theo level de biet minh dang dung o dau va can mo rong cho nao.",
      description: grammar.description,
      sideTitle: "Tong quan",
      sideStats: [
        { title: `${grammar.levels.length}`, text: "level A1-B2" },
        { title: `${totalLessons}`, text: "bai grammar" },
        { title: firstLevel.label, text: `${firstLevel.level} mo dau` },
        { title: "Flow", text: "level -> nhom -> bai" }
      ]
    })}
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Grammatik-Bibliothek</p>
        <h2>Chon level roi mo tung diem ngu phap can hoc hoac can on lai</h2>
      </div>
      <div class="grammar-shell">
        <div class="toolbar-card">
          <p class="eyebrow">CEFR-Stufen</p>
          <div class="level-row" id="grammarLevels"></div>
        </div>
        <div class="topic-card grammar-toolbar">
          <div>
            <p class="eyebrow">Suche</p>
            <input id="grammarSearch" class="search-input" type="search" placeholder="Tim theo ten bai, pattern, vi du, loi hay gap..." />
          </div>
          <div class="vocab-meta grammar-meta">
            <span id="grammarLevelLabel">Trinh do: ${firstLevel.level}</span>
            <span id="grammarFocusLabel">Trong tam: ${firstLevel.focus}</span>
            <span id="grammarCountLabel"></span>
          </div>
          <div class="grammar-flow">
            ${grammar.overview.studyFlow.map((item) => `<span>${item}</span>`).join("")}
          </div>
        </div>
        <div id="grammarContent" class="grammar-content"></div>
        <div id="grammarEmpty" class="empty-state" hidden>Khong co bai grammar nao khop bo loc hien tai.</div>
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Nguon hoc lien quan</p>
        <h2>Cac nguon nen xem them cho Grammatik</h2>
      </div>
      <div class="resource-grid">
        ${renderResourceCards(resourcesRes.items)}
      </div>
    </section>
  `;
}

function speakGerman(text) {
  if (!("speechSynthesis" in window)) {
    alert("Trinh duyet nay chua ho tro phat am.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  const voices = speechSynthesis.getVoices();
  const voice = voices.find((item) => item.lang && item.lang.toLowerCase().startsWith("de"));
  if (voice) utterance.voice = voice;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function getProgressMeta(entryState) {
  if (entryState.progress === "learned") return { label: "Da hoc", className: "is-learned" };
  if (entryState.progress === "review") return { label: "Can on", className: "is-review" };
  return { label: "Moi", className: "is-new" };
}

function renderVocabTableRows(items, level, topic, vocabState) {
  return items
    .map((item) => {
      const vocabId = getVocabId(level, topic, item.word);
      const entryState = normalizeStateEntry(vocabState[vocabId]);
      const progress = getProgressMeta(entryState);
      const favoriteLabel = entryState.favorite ? "Bo fav" : "Fav";

      return `
        <tr>
          <td>
            <div class="word-main">${item.word}</div>
            <div class="word-gender">${item.gender !== "-" ? item.gender : ""}</div>
          </td>
          <td>${item.pos}</td>
          <td>${item.vi}</td>
          <td>${item.en}</td>
          <td class="ipa">${item.ipa}</td>
          <td>${item.example}</td>
          <td>
            <div class="status-stack">
              <span class="status-pill ${progress.className}">${progress.label}</span>
              ${entryState.favorite ? '<span class="mini-fav">Favorit</span>' : ""}
            </div>
          </td>
          <td>
            <div class="action-stack">
              <button class="state-btn ${entryState.favorite ? "is-active" : ""}" type="button" data-action="favorite" data-id="${escapeAttr(vocabId)}">${favoriteLabel}</button>
              <button class="state-btn ${entryState.progress === "learned" ? "is-active" : ""}" type="button" data-action="learned" data-id="${escapeAttr(vocabId)}">Hoc</button>
              <button class="state-btn ${entryState.progress === "review" ? "is-active" : ""}" type="button" data-action="review" data-id="${escapeAttr(vocabId)}">On lai</button>
            </div>
          </td>
          <td><button class="speak-btn" type="button" data-speak="${escapeAttr(item.word)}">&#128266;</button></td>
        </tr>
      `;
    })
    .join("");
}

async function renderVocab() {
  const [meta, resources] = await Promise.all([
    loadApi("/api/vocab/meta"),
    loadApi("/api/resources?category=vocab")
  ]);

  const initialLevel = meta.levels[0]?.level || "A1";
  const initialTopic = meta.levels[0]?.topics[0]?.topic || "Familie";
  const stateSummary = getStateSummary(loadVocabState());

  return `
    ${renderHero({
      eyebrow: "Wortschatz",
      title: "Hoc tu vung theo nhom de de nho hon va de lap lai hon.",
      description:
        "Module nay gio chay qua API dong: lay meta, lay danh sach theo level/topic, ho tro search tu serverless endpoint va san duong de noi database sau nay.",
      sideTitle: "Bat dau nhanh",
      sideStats: [
        { title: `${meta.total}+`, text: "tu trong thu vien" },
        { title: `${meta.levels.length}`, text: "level dang co" },
        { title: "API", text: "query theo chu de" },
        { title: "Local", text: "luu tien do tren may" }
      ]
    })}
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Wortschatz-Bibliothek</p>
        <h2>Chon trinh do, mo chu de va theo doi tu dang hoc</h2>
      </div>
      <div class="vocab-shell">
        <div class="toolbar-card">
          <p class="eyebrow">CEFR-Stufen</p>
          <div class="level-row" id="vocabLevels"></div>
        </div>
        <div class="topic-card">
          <div>
            <p class="eyebrow">Themen</p>
            <div class="topic-row" id="vocabTopics"></div>
          </div>
          <div>
            <p class="eyebrow">Suche</p>
            <input id="vocabSearch" class="search-input" type="search" placeholder="Tim theo tu Duc, nghia Viet, nghia Anh..." />
          </div>
          <div class="vocab-meta">
            <span id="vocabLevelLabel">Trinh do: ${initialLevel}</span>
            <span id="vocabTopicLabel">Chu de: ${initialTopic}</span>
            <span id="vocabCountLabel"></span>
          </div>
          <div class="vocab-summary" id="vocabSummary">
            <span>Favoriten: ${stateSummary.favorite}</span>
            <span>Da hoc: ${stateSummary.learned}</span>
            <span>Can on: ${stateSummary.review}</span>
          </div>
          <p>Tien do hien duoc luu tren trinh duyet nay. Ban co the noi database moi sau.</p>
        </div>
        <div class="table-card">
          <table class="vocab-table">
            <thead>
              <tr>
                <th>Tu vung</th>
                <th>Loai tu</th>
                <th>Nghia Viet</th>
                <th>Nghia Anh</th>
                <th>IPA</th>
                <th>Vi du cach dung</th>
                <th>Trang thai</th>
                <th>Hanh dong</th>
                <th>Am thanh</th>
              </tr>
            </thead>
            <tbody id="vocabTableBody"></tbody>
          </table>
          <div id="vocabEmpty" class="empty-state" hidden>Khong co tu nao khop bo loc hien tai.</div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Nguon hoc lien quan</p>
        <h2>Cac nguon nen xem cho Wortschatz</h2>
      </div>
      <div class="resource-grid">
        ${renderResourceCards(resources.items)}
      </div>
    </section>
  `;
}

function setupGrammarInteractions(grammar) {
  const levelEl = document.getElementById("grammarLevels");
  const searchEl = document.getElementById("grammarSearch");
  const contentEl = document.getElementById("grammarContent");
  const emptyEl = document.getElementById("grammarEmpty");
  const levelLabel = document.getElementById("grammarLevelLabel");
  const focusLabel = document.getElementById("grammarFocusLabel");
  const countLabel = document.getElementById("grammarCountLabel");

  if (!levelEl || !searchEl || !contentEl || !emptyEl || !levelLabel || !focusLabel || !countLabel) return;

  let activeLevel = grammar.levels[0]?.level || "A1";
  let keyword = "";

  function renderLevels() {
    levelEl.innerHTML = grammar.levels
      .map(
        (level) =>
          `<button class="level-btn ${level.level === activeLevel ? "is-active" : ""}" data-level="${level.level}">${level.level}</button>`
      )
      .join("");

    levelEl.querySelectorAll("[data-level]").forEach((button) => {
      button.addEventListener("click", () => {
        activeLevel = button.dataset.level;
        renderLevels();
        renderGrammarView();
      });
    });
  }

  function renderGrammarView() {
    const level = grammar.levels.find((item) => item.level === activeLevel) || grammar.levels[0];
    const query = keyword.trim().toLowerCase();

    const filteredSections = level.sections
      .map((section) => ({
        ...section,
        lessons: section.lessons.filter((lesson) =>
          [lesson.title, lesson.summary, lesson.what, lesson.pattern, ...(lesson.examples || []), ...(lesson.mistakes || [])]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      }))
      .filter((section) => section.lessons.length > 0);

    levelLabel.textContent = `Trinh do: ${level.level}`;
    focusLabel.textContent = `Trong tam: ${level.focus}`;
    countLabel.textContent = `So bai: ${filteredSections.reduce((sum, section) => sum + section.lessons.length, 0)}`;
    contentEl.innerHTML = filteredSections.map((section) => renderGrammarSection(section, level.level)).join("");
    emptyEl.hidden = filteredSections.length > 0;
  }

  searchEl.addEventListener("input", (event) => {
    keyword = event.target.value;
    renderGrammarView();
  });

  renderLevels();
  renderGrammarView();
}

function setupListeningInteractions(listening) {
  const levelEl = document.getElementById("listeningLevels");
  const searchEl = document.getElementById("listeningSearch");
  const contentEl = document.getElementById("listeningContent");
  const emptyEl = document.getElementById("listeningEmpty");
  const levelLabel = document.getElementById("listeningLevelLabel");
  const focusLabel = document.getElementById("listeningFocusLabel");
  const countLabel = document.getElementById("listeningCountLabel");

  if (!levelEl || !searchEl || !contentEl || !emptyEl || !levelLabel || !focusLabel || !countLabel) return;

  let activeLevel = listening.levels[0]?.level || "A1";
  let keyword = "";

  function renderLevels() {
    levelEl.innerHTML = listening.levels
      .map(
        (level) =>
          `<button class="level-btn ${level.level === activeLevel ? "is-active" : ""}" data-level="${level.level}">${level.level}</button>`
      )
      .join("");

    levelEl.querySelectorAll("[data-level]").forEach((button) => {
      button.addEventListener("click", () => {
        activeLevel = button.dataset.level;
        renderLevels();
        renderListeningView();
      });
    });
  }

  function renderListeningView() {
    const level = listening.levels.find((item) => item.level === activeLevel) || listening.levels[0];
    const query = keyword.trim().toLowerCase();

    const filteredTracks = level.tracks
      .map((track) => ({
        ...track,
        lessons: track.lessons.filter((lesson) =>
          [
            lesson.title,
            lesson.scenario,
            lesson.goal,
            lesson.sourceHint,
            ...(lesson.transcript || []),
            ...(lesson.listenFor || []),
            ...(lesson.shadowing || []),
            ...(lesson.checklist || [])
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      }))
      .filter((track) => track.lessons.length > 0);

    levelLabel.textContent = `Trinh do: ${level.level}`;
    focusLabel.textContent = `Trong tam: ${level.focus}`;
    countLabel.textContent = `So bai: ${filteredTracks.reduce((sum, track) => sum + track.lessons.length, 0)}`;
    stopListeningPlayback({ reset: true });
    contentEl.innerHTML = filteredTracks.map((track) => renderListeningTrack(track, level.level)).join("");
    setupListeningPlayers();
    emptyEl.hidden = filteredTracks.length > 0;
  }

  searchEl.addEventListener("input", (event) => {
    keyword = event.target.value;
    renderListeningView();
  });

  renderLevels();
  renderListeningView();
}

function setupVocabInteractions(vocabMeta) {
  const levelEl = document.getElementById("vocabLevels");
  const topicEl = document.getElementById("vocabTopics");
  const searchEl = document.getElementById("vocabSearch");
  const bodyEl = document.getElementById("vocabTableBody");
  const emptyEl = document.getElementById("vocabEmpty");
  const levelLabel = document.getElementById("vocabLevelLabel");
  const topicLabel = document.getElementById("vocabTopicLabel");
  const countLabel = document.getElementById("vocabCountLabel");
  const summaryEl = document.getElementById("vocabSummary");

  if (!levelEl || !topicEl || !searchEl || !bodyEl || !emptyEl || !summaryEl) return;

  const levels = vocabMeta.levels.map((item) => item.level);
  let activeLevel = levels[0];
  let activeTopic = vocabMeta.levels[0]?.topics[0]?.topic;
  let keyword = "";

  function renderLevels() {
    levelEl.innerHTML = levels
      .map((level) => `<button class="level-btn ${level === activeLevel ? "is-active" : ""}" data-level="${level}">${level}</button>`)
      .join("");

    levelEl.querySelectorAll("[data-level]").forEach((button) => {
      button.addEventListener("click", () => {
        activeLevel = button.dataset.level;
        activeTopic = vocabMeta.levels.find((item) => item.level === activeLevel)?.topics[0]?.topic;
        renderLevels();
        renderTopics();
        void renderTable();
      });
    });
  }

  function renderTopics() {
    const topics = vocabMeta.levels.find((item) => item.level === activeLevel)?.topics.map((item) => item.topic) || [];
    topicEl.innerHTML = topics
      .map((topic) => `<button class="topic-btn ${topic === activeTopic ? "is-active" : ""}" data-topic="${topic}">${topic}</button>`)
      .join("");

    topicEl.querySelectorAll("[data-topic]").forEach((button) => {
      button.addEventListener("click", () => {
        activeTopic = button.dataset.topic;
        renderTopics();
        void renderTable();
      });
    });
  }

  function renderSummary(vocabState) {
    const summary = getStateSummary(vocabState);
    summaryEl.innerHTML = `
      <span>Favoriten: ${summary.favorite}</span>
      <span>Da hoc: ${summary.learned}</span>
      <span>Can on: ${summary.review}</span>
    `;
  }

  async function renderTable() {
    const vocabState = loadVocabState();
    const query = new URLSearchParams({ level: activeLevel, topic: activeTopic });
    if (keyword) query.set("search", keyword);

    dataCache.delete(`/api/vocab?${query.toString()}`);
    const result = await loadApi(`/api/vocab?${query.toString()}`);
    const items = result.items;

    levelLabel.textContent = `Trinh do: ${activeLevel}`;
    topicLabel.textContent = `Chu de: ${activeTopic}`;
    countLabel.textContent = `So tu: ${items.length}`;
    bodyEl.innerHTML = renderVocabTableRows(items, activeLevel, activeTopic, vocabState);
    emptyEl.hidden = items.length > 0;
    renderSummary(vocabState);

    bodyEl.querySelectorAll("[data-speak]").forEach((button) => {
      button.addEventListener("click", () => speakGerman(button.dataset.speak));
    });

    bodyEl.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const vocabId = button.dataset.id;
        const action = button.dataset.action;
        if (action === "favorite") toggleFavorite(vocabId);
        if (action === "learned") setProgress(vocabId, "learned");
        if (action === "review") setProgress(vocabId, "review");
        void renderTable();
      });
    });
  }

  searchEl.addEventListener("input", (event) => {
    keyword = event.target.value.trim();
    void renderTable();
  });

  renderLevels();
  renderTopics();
  void renderTable();
}

function renderLoadError(message) {
  return `<div class="section"><div class="load-error">${message}</div></div>`;
}

async function renderRoute(route) {
  try {
    if (route === "home") return await renderHome();
    if (route === "grammar") return await renderGrammar();
    if (route === "vocab") return await renderVocab();
    if (route === "listening") return await renderListening();
    if (route === "reading") return await renderGenericModule("reading");
    if (route === "test") return await renderGenericModule("test");
    return await renderHome();
  } catch (error) {
    return renderLoadError("Khong tai duoc du lieu hoc. Hay kiem tra Pages Functions va cac file du lieu JSON.");
  }
}

async function mountRoute() {
  const route = routeFromLocation();
  updateSeo(route);
  updateActiveNav(route);
  bindRouteLinks();
  const app = document.getElementById("app");
  if (!app) return;
  stopListeningPlayback({ reset: true });
  app.innerHTML = await renderRoute(route);
  bindRouteLinks();

  if (route === "grammar") {
    const grammarRes = await loadApi("/api/modules/grammar");
    setupGrammarInteractions(grammarRes.item);
  }

  if (route === "vocab") {
    const vocabMeta = await loadApi("/api/vocab/meta");
    setupVocabInteractions(vocabMeta);
  }

  if (route === "listening") {
    const listeningRes = await loadApi("/api/modules/listening");
    setupListeningInteractions(listeningRes.item);
  }
}

window.addEventListener("popstate", mountRoute);
window.addEventListener("DOMContentLoaded", async () => {
  await mountRoute();
});


