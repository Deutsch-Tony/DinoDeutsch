import { createClient } from "https://esm.sh/@supabase/supabase-js@2?bundle";
import { SUPABASE_CONFIG } from "./supabase-config.js";

const ROUTES = [
  { key: "home", selector: "#home" },
  { key: "grammar", selector: "#grammar" },
  { key: "vocab", selector: "#vocab" },
  { key: "listening", selector: "#listening" },
  { key: "reading", selector: "#reading" },
  { key: "test", selector: "#test" }
];

const SEO = {
  home: {
    title: "Deutsch Sprint | Tự học tiếng Đức theo nhịp gọn và rõ",
    description:
      "Deutsch Sprint là không gian tự học tiếng Đức cá nhân với Wortschatz, Grammatik, Hören, Lesen và Tests được tổ chức gọn, rõ và dễ mở rộng."
  },
  grammar: {
    title: "Grammatik | Deutsch Sprint",
    description: "Học ngữ pháp tiếng Đức theo từng khối rõ ràng: cases, thì, wortstellung và cấu trúc cần nhớ."
  },
  vocab: {
    title: "Wortschatz | Deutsch Sprint",
    description: "Thư viện hơn 1000 từ vựng tiếng Đức theo level A1-B2, chủ đề, tìm kiếm, IPA và tiến độ học."
  },
  listening: {
    title: "Hören | Deutsch Sprint",
    description: "Module luyện nghe tiếng Đức với transcript, shadowing và nguồn học chọn lọc theo cấp độ."
  },
  reading: {
    title: "Lesen | Deutsch Sprint",
    description: "Module đọc hiểu tiếng Đức gồm bài đọc ngắn, glossary và câu hỏi kiểm tra để học gọn hơn."
  },
  test: {
    title: "Tests | Deutsch Sprint",
    description: "Mini test và checkpoint để tự đánh giá trình độ tiếng Đức theo từng mục học."
  }
};

const dataCache = new Map();
const VOCAB_STATE_KEY = "deutschSprint.vocabState";
const hasSupabaseConfig = Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
const supabase = hasSupabaseConfig ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey) : null;

let authMode = "signin";
let currentSession = null;

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

function updateSeo(route) {
  const seo = SEO[route] || SEO.home;
  const baseUrl = "https://deutsch-easy.pages.dev/";
  const routeUrl = route === "home" ? baseUrl : `${baseUrl}#${route}`;
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

function getRedirectTo() {
  return SUPABASE_CONFIG.redirectTo || window.location.origin;
}

function setAuthStatus(message, type = "") {
  const statusEl = document.getElementById("authStatus");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = "auth-status";
  if (type) statusEl.classList.add(`is-${type}`);
}

function syncAuthTabUI() {
  const titleEl = document.getElementById("authTitle");
  const descEl = document.getElementById("authDescription");
  const submitEl = document.getElementById("authSubmit");
  const passwordEl = document.getElementById("authPassword");

  document.querySelectorAll(".auth-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.authTab === authMode);
  });

  if (titleEl) {
    titleEl.textContent =
      authMode === "signin" ? "Đăng nhập để lưu nhịp học của bạn" : "Tạo tài khoản để giữ tiến độ học lâu dài";
  }

  if (descEl) {
    descEl.textContent =
      authMode === "signin"
        ? "Bạn có thể đăng nhập bằng email hoặc liên kết tài khoản Google. Phiên đăng nhập sẽ do Supabase Auth quản lý."
        : "Đăng ký bằng email hoặc dùng Google để tạo tài khoản nhanh. Sau đó bạn có thể quay lại tiếp tục học trên cùng một tài khoản.";
  }

  if (submitEl) {
    submitEl.textContent = authMode === "signin" ? "Đăng nhập bằng email" : "Đăng ký bằng email";
  }

  if (passwordEl) {
    passwordEl.setAttribute("autocomplete", authMode === "signin" ? "current-password" : "new-password");
  }
}

function openAuthModal(mode = "signin") {
  authMode = mode;
  syncAuthTabUI();
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  setAuthStatus("");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}

function getUserDisplay(user) {
  const email = user?.email || "Tài khoản";
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || email;
  return { name, email };
}

function renderTopbarAuth() {
  const container = document.getElementById("topbarAuth");
  if (!container) return;

  const user = currentSession?.user;
  if (!user) {
    container.innerHTML = `
      <button class="auth-link auth-trigger" type="button" data-auth-mode="signin">Đăng nhập</button>
      <button class="auth-button auth-trigger" type="button" data-auth-mode="signup">Đăng ký</button>
    `;
    bindAuthTriggers();
    return;
  }

  const display = getUserDisplay(user);
  const initials = (display.name || display.email).trim().charAt(0).toUpperCase();

  container.innerHTML = `
    <div class="user-chip">
      <span class="user-avatar">${escapeAttr(initials)}</span>
      <span>${escapeAttr(display.email)}</span>
    </div>
    <div class="user-actions">
      <button type="button" id="openAuthProfile">Tài khoản</button>
      <button type="button" id="logoutButton">Đăng xuất</button>
    </div>
  `;

  document.getElementById("openAuthProfile")?.addEventListener("click", () => openAuthModal("signin"));
  document.getElementById("logoutButton")?.addEventListener("click", async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  });
}

function bindAuthTriggers() {
  document.querySelectorAll(".auth-trigger").forEach((button) => {
    button.addEventListener("click", () => openAuthModal(button.dataset.authMode || "signin"));
  });
}

async function handleEmailAuth(event) {
  event.preventDefault();
  if (!supabase) {
    setAuthStatus("Bạn chưa cấu hình Supabase nên chưa dùng được đăng nhập thật.", "error");
    return;
  }

  const email = document.getElementById("authEmail")?.value.trim();
  const password = document.getElementById("authPassword")?.value || "";

  if (!email || !password) {
    setAuthStatus("Hãy nhập đủ email và mật khẩu.", "error");
    return;
  }

  setAuthStatus("Đang xử lý...", "success");

  if (authMode === "signin") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthStatus(error.message, "error");
      return;
    }
    setAuthStatus("Đăng nhập thành công.", "success");
    closeAuthModal();
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectTo()
    }
  });

  if (error) {
    setAuthStatus(error.message, "error");
    return;
  }

  setAuthStatus("Đăng ký thành công. Kiểm tra email để xác nhận nếu Supabase đang bật email confirmation.", "success");
}

async function handleGoogleAuth() {
  if (!supabase) {
    setAuthStatus("Bạn chưa cấu hình Supabase nên chưa dùng được Google login.", "error");
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getRedirectTo()
    }
  });

  if (error) {
    setAuthStatus(error.message, "error");
  }
}

async function initAuth() {
  renderTopbarAuth();

  const notice = document.getElementById("authConfigNotice");
  if (!hasSupabaseConfig) {
    if (notice) notice.hidden = false;
    bindAuthTriggers();
    return;
  }

  const sessionRes = await supabase.auth.getSession();
  currentSession = sessionRes.data.session;
  renderTopbarAuth();

  supabase.auth.onAuthStateChange((_event, session) => {
    currentSession = session;
    renderTopbarAuth();
  });

  bindAuthTriggers();
}

function initAuthUI() {
  document.getElementById("authClose")?.addEventListener("click", closeAuthModal);
  document.querySelector("[data-auth-close='true']")?.addEventListener("click", closeAuthModal);
  document.getElementById("authForm")?.addEventListener("submit", handleEmailAuth);
  document.getElementById("googleAuthButton")?.addEventListener("click", handleGoogleAuth);

  document.querySelectorAll(".auth-tab").forEach((button) => {
    button.addEventListener("click", () => {
      authMode = button.dataset.authTab || "signin";
      syncAuthTabUI();
      setAuthStatus("");
    });
  });

  syncAuthTabUI();
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
          <a class="hero-primary" href="#vocab">Mở Wortschatz</a>
          <a class="hero-secondary" href="#grammar">Xem Grammatik</a>
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
          <a href="${item.url}" target="_blank" rel="noreferrer">Mở nguồn này</a>
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
        <p class="eyebrow">Nhịp học đề xuất</p>
        <h2>Mỗi tab là một không gian nhỏ, gọn và dễ quay lại đúng chỗ đang học</h2>
      </div>
      ${renderCompactCards(
        [
          { title: "Wortschatz", text: "Chọn level, chọn chủ đề rồi search ngay trong cùng một nhịp." },
          { title: "Grammatik", text: "Gom ngữ pháp thành từng khối ngắn để đọc ít mà vẫn vào ý chính." },
          { title: "Hören", text: "Nghe, đối chiếu transcript, rồi quay lại shadowing theo cụm." },
          { title: "Lesen + Tests", text: "Đọc ngắn, chốt bằng câu hỏi nhỏ để giữ nhịp học đều hơn." }
        ],
        "Study flow"
      )}
    </section>
    <section class="section">
      <div class="section-head">
        <p class="eyebrow">Tài khoản</p>
        <h2>Đăng ký bằng email hoặc Google để sau này đồng bộ tiến độ học lên cloud</h2>
      </div>
      ${renderCompactCards(
        [
          { title: "Email", text: "Đăng nhập và đăng ký trực tiếp bằng email + mật khẩu." },
          { title: "Google", text: "Liên kết nhanh bằng tài khoản Google qua Supabase Auth." },
          { title: "Session", text: "Phiên đăng nhập được Supabase quản lý, không cần tự viết auth từ đầu." },
          { title: "Progress", text: "Hiện tiến độ vẫn ở localStorage; bước sau có thể đẩy lên Supabase DB." }
        ],
        "Auth"
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
      sideTitle: "Trọng tâm",
      sideStats: moduleItem.highlights
    })}
    <section class="section">
      ${renderCompactCards(moduleItem.highlights, moduleItem.eyebrow)}
    </section>
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
      ${renderCompactCards(
        [
          { title: "A1-B2", text: "Đi theo level trước, rồi mới chia nhỏ theo từng chủ đề." },
          { title: "Search", text: "Tìm theo từ Đức, nghĩa Việt, nghĩa Anh và cả ví dụ." },
          { title: "Progress", text: "Đánh dấu Favorit, Đã học và Cần ôn ngay trong bảng." },
          { title: "Audio", text: "Bấm loa để nghe phát âm nhanh khi trình duyệt hỗ trợ voice Đức." }
        ],
        "Wortschatz"
      )}
    </section>
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
  updateSeo(route);
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
window.addEventListener("DOMContentLoaded", async () => {
  initAuthUI();
  await initAuth();
  await mountRoute();
});
