const ROUTES = [
  { key: "home", selector: "#home" },
  { key: "grammar", selector: "#grammar" },
  { key: "vocab", selector: "#vocab" },
  { key: "listening", selector: "#listening" },
  { key: "reading", selector: "#reading" },
  { key: "test", selector: "#test" }
];

const dataCache = new Map();
const VOCAB_STATE_KEY = "deutschSprint.vocabState";

function routeFromHash() {
  const key = (location.hash || "#home").replace("#", "");
  return ROUTES.some((route) => route.key === key) ? key : "home";
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getVocabId(level, topic, word) {
  return `${level}__${topic}__${word}`;
}

function loadVocabState() {
  try {
    const raw = localStorage.getItem(VOCAB_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVocabState(state) {
  localStorage.setItem(VOCAB_STATE_KEY, JSON.stringify(state));
}

function toggleFavorite(vocabId) {
  const state = loadVocabState();
  const current = state[vocabId] || { favorite: false, progress: "new" };
  state[vocabId] = { ...current, favorite: !current.favorite };
  saveVocabState(state);
}

function setProgress(vocabId, progress) {
  const state = loadVocabState();
  const current = state[vocabId] || { favorite: false, progress: "new" };
  state[vocabId] = {
    ...current,
    progress: current.progress === progress ? "new" : progress
  };
  saveVocabState(state);
}

function getStateSummary(vocabState) {
  const values = Object.values(vocabState);
  return {
    favorite: values.filter((item) => item.favorite).length,
    learned: values.filter((item) => item.progress === "learned").length,
    review: values.filter((item) => item.progress === "review").length
  };
}

async function loadApi(path) {
  if (dataCache.has(path)) return dataCache.get(path);
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  const data = await response.json();
  dataCache.set(path, data);
  return data;
}

function updateActiveNav(route) {
  document.querySelectorAll(".topbar-item").forEach((item) => {
    const href = (item.getAttribute("href") || "").replace("#", "");
    item.classList.toggle("is-active", href === route);
  });
}

function renderHero({ eyebrow, title, description, sideTitle, sideStats = [] }) {
  return `
    <section class="hero">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
      <div class="card">
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
          <a href="${item.url}" target="_blank" rel="noreferrer">Mở nguồn này</a>
        </article>
      `
    )
    .join("");
}

async function renderHome() {
  return `
    ${renderHero({
      eyebrow: "Không gian học tiếng Đức cho riêng bạn",
      title: "Từ mất gốc đến có nhịp học rõ ràng, nhẹ đầu hơn mỗi ngày.",
      description:
        "Website này giờ có thể chuyển dần sang kiến trúc động: frontend giữ nguyên trải nghiệm, còn dữ liệu đi qua API serverless trên Cloudflare Pages Functions. Từ đây bạn có thể thêm search, filter, lưu tiến độ, và sau này nối database mà không phải đập lại giao diện.",
      sideTitle: "Mục tiêu 90 ngày",
      sideStats: [
        { title: "Dynamic", text: "dữ liệu qua API" },
        { title: "1000+", text: "từ vựng đã gom" },
        { title: "Functions", text: "Cloudflare serverless" },
        { title: "Ready", text: "sẵn để nối DB" }
      ]
    })}
    <section class="pill-row">
      <span>Dữ liệu động qua API</span>
      <span>Lộ trình A1-A2 dễ hiểu</span>
      <span>Code tách lớp rõ ràng</span>
      <span>Dễ mở rộng sau này</span>
    </section>
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Tổng quan kiến trúc</p>
        <h2>Frontend vẫn gọn, nhưng dữ liệu giờ đã đi qua Cloudflare Pages Functions</h2>
      </div>
      <div class="feature-grid">
        <article class="card"><h3>API cho modules</h3><p>Grammatik, Hören, Lesen và Tests đều có endpoint riêng.</p></article>
        <article class="card"><h3>API cho Wortschatz</h3><p>Meta, level, topic và search đều đi qua route động.</p></article>
        <article class="card"><h3>State phía client</h3><p>Favoriten, Đã học và Cần ôn vẫn được nhớ bằng localStorage.</p></article>
        <article class="card"><h3>Sẵn lên cloud</h3><p>Phù hợp luôn với Cloudflare Pages + GitHub integration.</p></article>
      </div>
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
      sideTitle: "Trọng tâm",
      sideStats: moduleItem.highlights
    })}
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Nguồn học liên quan</p>
        <h2>Các nguồn nên xem cho ${moduleItem.eyebrow}</h2>
      </div>
      <div class="resource-grid">
        ${renderResourceCards(related)}
      </div>
    </section>
  `;
}

function speakGerman(text) {
  if (!("speechSynthesis" in window)) {
    alert("Trình duyệt này chưa hỗ trợ phát âm.");
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
  if (entryState.progress === "learned") return { label: "Đã học", className: "is-learned" };
  if (entryState.progress === "review") return { label: "Cần ôn", className: "is-review" };
  return { label: "Mới", className: "is-new" };
}

function renderVocabTableRows(items, level, topic, vocabState) {
  return items
    .map((item) => {
      const vocabId = getVocabId(level, topic, item.word);
      const entryState = vocabState[vocabId] || { favorite: false, progress: "new" };
      const progress = getProgressMeta(entryState);
      const favoriteLabel = entryState.favorite ? "Bỏ fav" : "Fav";

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
              <button class="state-btn ${entryState.progress === "learned" ? "is-active" : ""}" type="button" data-action="learned" data-id="${escapeAttr(vocabId)}">Học</button>
              <button class="state-btn ${entryState.progress === "review" ? "is-active" : ""}" type="button" data-action="review" data-id="${escapeAttr(vocabId)}">Ôn lại</button>
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
      title: "Học từ vựng theo nhóm để dễ nhớ hơn và dễ lặp lại hơn.",
      description:
        "Module này giờ chạy qua API động: lấy meta, lấy danh sách theo level/topic, hỗ trợ search từ serverless endpoint và sẵn đường để nối database sau này.",
      sideTitle: "Bắt đầu nhanh",
      sideStats: [
        { title: `${meta.total}+`, text: "từ trong thư viện" },
        { title: `${meta.levels.length}`, text: "level đang có" },
        { title: "API", text: "query theo chủ đề" },
        { title: "Local", text: "nhớ tiến độ học" }
      ]
    })}
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Wortschatz-Bibliothek</p>
        <h2>Chọn trình độ, mở chủ đề và theo dõi từ đang học</h2>
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
            <input id="vocabSearch" class="search-input" type="search" placeholder="Tìm theo từ Đức, nghĩa Việt, nghĩa Anh..." />
          </div>
          <div class="vocab-meta">
            <span id="vocabLevelLabel">Trình độ: ${initialLevel}</span>
            <span id="vocabTopicLabel">Chủ đề: ${initialTopic}</span>
            <span id="vocabCountLabel"></span>
          </div>
          <div class="vocab-summary" id="vocabSummary">
            <span>Favoriten: ${stateSummary.favorite}</span>
            <span>Đã học: ${stateSummary.learned}</span>
            <span>Cần ôn: ${stateSummary.review}</span>
          </div>
        </div>
        <div class="table-card">
          <table class="vocab-table">
            <thead>
              <tr>
                <th>Từ vựng</th>
                <th>Loại từ</th>
                <th>Nghĩa Việt</th>
                <th>Nghĩa Anh</th>
                <th>IPA</th>
                <th>Ví dụ cách dùng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
                <th>Âm thanh</th>
              </tr>
            </thead>
            <tbody id="vocabTableBody"></tbody>
          </table>
          <div id="vocabEmpty" class="empty-state" hidden>Không có từ nào khớp bộ lọc hiện tại.</div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Nguồn học liên quan</p>
        <h2>Các nguồn nên xem cho Wortschatz</h2>
      </div>
      <div class="resource-grid">
        ${renderResourceCards(resources.items)}
      </div>
    </section>
  `;
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
      <span>Đã học: ${summary.learned}</span>
      <span>Cần ôn: ${summary.review}</span>
    `;
  }

  async function renderTable() {
    const vocabState = loadVocabState();
    const query = new URLSearchParams({ level: activeLevel, topic: activeTopic });
    if (keyword) query.set("search", keyword);

    dataCache.delete(`/api/vocab?${query.toString()}`);
    const result = await loadApi(`/api/vocab?${query.toString()}`);
    const items = result.items;

    levelLabel.textContent = `Trình độ: ${activeLevel}`;
    topicLabel.textContent = `Chủ đề: ${activeTopic}`;
    countLabel.textContent = `Số từ: ${items.length}`;
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
    if (route === "vocab") return await renderVocab();
    if (route === "grammar") return await renderGenericModule("grammar");
    if (route === "listening") return await renderGenericModule("listening");
    if (route === "reading") return await renderGenericModule("reading");
    if (route === "test") return await renderGenericModule("test");
    return await renderHome();
  } catch (error) {
    return renderLoadError("Không tải được dữ liệu động từ API. Hãy kiểm tra Cloudflare Pages Functions hoặc môi trường deploy.");
  }
}

async function mountRoute() {
  const route = routeFromHash();
  updateActiveNav(route);
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = await renderRoute(route);

  if (route === "vocab") {
    const vocabMeta = await loadApi("/api/vocab/meta");
    setupVocabInteractions(vocabMeta);
  }
}

window.addEventListener("hashchange", mountRoute);
window.addEventListener("DOMContentLoaded", mountRoute);
