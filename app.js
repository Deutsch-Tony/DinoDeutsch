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

async function loadJson(path) {
  if (dataCache.has(path)) return dataCache.get(path);

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    const data = await response.json();
    dataCache.set(path, data);
    return data;
  } catch (error) {
    const inlineData = window.__INLINE_DATA__?.[path];
    if (inlineData) {
      dataCache.set(path, inlineData);
      return inlineData;
    }
    throw error;
  }
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
        "Dự án này đã được refactor theo hướng dễ sống lâu dài: layout tách riêng, logic tách riêng, dữ liệu tách riêng. Từ đây bạn có thể mở rộng từng module như Grammatik, Wortschatz, Hören, Lesen và Tests mà không cần đụng một file khổng lồ.",
      sideTitle: "Mục tiêu 90 ngày",
      sideStats: [
        { title: "20+", text: "chủ đề nền tảng" },
        { title: "1000+", text: "từ vựng đã gom" },
        { title: "IPA", text: "đã chuẩn hóa hàng loạt" },
        { title: "Local", text: "lưu tiến độ ngay trên máy" }
      ]
    })}
    <section class="pill-row">
      <span>Tập trung người mới học</span>
      <span>Lộ trình A1-A2 dễ hiểu</span>
      <span>Code tách lớp rõ ràng</span>
      <span>Dễ mở rộng sau này</span>
    </section>
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Tổng quan kiến trúc</p>
        <h2>Mỗi mục trên menu bây giờ đều có thể phát triển như một module riêng</h2>
      </div>
      <div class="feature-grid">
        <article class="card"><h3>Dữ liệu riêng</h3><p>Mỗi phần có thể dùng file JSON riêng để quản lý nội dung dễ hơn.</p></article>
        <article class="card"><h3>Logic riêng</h3><p>JavaScript render từng view theo route, không cần nhồi hết vào HTML.</p></article>
        <article class="card"><h3>Theme chung</h3><p>CSS dùng chung giúp giữ giao diện nhất quán trên tất cả các module.</p></article>
        <article class="card"><h3>Dễ mở rộng</h3><p>Sau này muốn thêm API hoặc backend thì chỉ nối ở một vài điểm rõ ràng.</p></article>
      </div>
    </section>
  `;
}

async function renderGenericModule(path) {
  const [module, resources] = await Promise.all([
    loadJson(path),
    loadJson("./data/resources.json")
  ]);
  const related = resources.filter((item) => item.category === module.resourceCategory);

  return `
    ${renderHero({
      eyebrow: module.eyebrow,
      title: module.title,
      description: module.description,
      sideTitle: "Trọng tâm",
      sideStats: module.highlights
    })}
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Nguồn học liên quan</p>
        <h2>Các nguồn nên xem cho ${module.eyebrow}</h2>
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
  if (entryState.progress === "learned") {
    return { label: "Đã học", className: "is-learned" };
  }
  if (entryState.progress === "review") {
    return { label: "Cần ôn", className: "is-review" };
  }
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
  const vocabData = await loadJson("./data/vocab.json");
  const resources = await loadJson("./data/resources.json");
  const levels = Object.keys(vocabData);
  const initialLevel = levels[0];
  const initialTopic = Object.keys(vocabData[initialLevel])[0];
  const stateSummary = getStateSummary(loadVocabState());

  return `
    ${renderHero({
      eyebrow: "Wortschatz",
      title: "Học từ vựng theo nhóm để dễ nhớ hơn và dễ lặp lại hơn.",
      description:
        "Module này tổ chức từ vựng theo level A1-A2-B1-B2, chia theo chủ đề, có tìm kiếm, có IPA, ví dụ, phát âm và trạng thái học. Dữ liệu giờ đã vượt mốc 1000 từ để bạn dùng như một thư viện thật sự.",
      sideTitle: "Bắt đầu nhanh",
      sideStats: [
        { title: "1000+", text: "từ trong thư viện" },
        { title: "Themen", text: "chủ đề dày hơn trước" },
        { title: "IPA", text: "đã backfill toàn bộ" },
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
        ${renderResourceCards(resources.filter((item) => item.category === "vocab"))}
      </div>
    </section>
  `;
}

function setupVocabInteractions(vocabData) {
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

  const levels = Object.keys(vocabData);
  let activeLevel = levels[0];
  let activeTopic = Object.keys(vocabData[activeLevel])[0];
  let keyword = "";

  function renderLevels() {
    levelEl.innerHTML = levels
      .map(
        (level) => `<button class="level-btn ${level === activeLevel ? "is-active" : ""}" data-level="${level}">${level}</button>`
      )
      .join("");

    levelEl.querySelectorAll("[data-level]").forEach((button) => {
      button.addEventListener("click", () => {
        activeLevel = button.dataset.level;
        activeTopic = Object.keys(vocabData[activeLevel])[0];
        renderLevels();
        renderTopics();
        renderTable();
      });
    });
  }

  function renderTopics() {
    const topics = Object.keys(vocabData[activeLevel]);
    topicEl.innerHTML = topics
      .map(
        (topic) => `<button class="topic-btn ${topic === activeTopic ? "is-active" : ""}" data-topic="${topic}">${topic}</button>`
      )
      .join("");

    topicEl.querySelectorAll("[data-topic]").forEach((button) => {
      button.addEventListener("click", () => {
        activeTopic = button.dataset.topic;
        renderTopics();
        renderTable();
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

  function renderTable() {
    const source = vocabData[activeLevel][activeTopic];
    const vocabState = loadVocabState();
    const items = source.filter((item) => {
      if (!keyword) return true;
      const haystack = [item.word, item.gender, item.pos, item.vi, item.en, item.ipa, item.example]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword.toLowerCase());
    });

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
        renderTable();
      });
    });
  }

  searchEl.addEventListener("input", (event) => {
    keyword = event.target.value.trim();
    renderTable();
  });

  renderLevels();
  renderTopics();
  renderTable();
}

function renderLoadError(message) {
  return `<div class="section"><div class="load-error">${message}</div></div>`;
}

async function renderRoute(route) {
  try {
    if (route === "home") return await renderHome();
    if (route === "vocab") return await renderVocab();
    if (route === "grammar") return await renderGenericModule("./data/grammar.json");
    if (route === "listening") return await renderGenericModule("./data/listening.json");
    if (route === "reading") return await renderGenericModule("./data/reading.json");
    if (route === "test") return await renderGenericModule("./data/tests.json");
    return await renderHome();
  } catch (error) {
    return renderLoadError("Không tải được dữ liệu. Hãy mở web qua static server hoặc dùng bản fallback nội bộ.");
  }
}

async function mountRoute() {
  const route = routeFromHash();
  updateActiveNav(route);
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = await renderRoute(route);

  if (route === "vocab") {
    const vocabData = await loadJson("./data/vocab.json");
    setupVocabInteractions(vocabData);
  }
}

window.addEventListener("hashchange", mountRoute);
window.addEventListener("DOMContentLoaded", mountRoute);
