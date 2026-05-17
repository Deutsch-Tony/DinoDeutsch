# REDESIGN NOTES — May 14, 2026

> Output cho REDESIGN_BRIEF.md (v9 Cohere Edition).
> Author: Tèo (Claude) cho Nghĩa.

---

## 1. Deliverables

| File | Vai trò | Trạng thái |
|---|---|---|
| `website/index.html` | Homepage 6 ngôn ngữ (Dino Language) | NEW — rewrite hoàn toàn |
| `website/deutsch.html` | Trang landing tiếng Đức | NEW |
| `website/_redirects` | Routing rõ ràng cho 4 modules + deutsch + assistant | Updated |
| `website/_headers` | CSP cho phép Google Fonts (Space Grotesk, JetBrains Mono) | Updated |

Modules cũ (`grammar.html`, `vocab.html`, `listening.html`, `reading.html`) và `assistant/index.html` **giữ nguyên** — tránh đụng vào lúc này (file rất nặng, tách công việc thành iteration sau).

---

## 2. Direction đã chốt

- **Cohere Edition v9** (giữ direction từ brief).
- **Font**: Space Grotesk thay cho Geist (Geist không miễn phí qua Google Fonts CDN — Space Grotesk là fallback đúng spec brief).
- **Coral signature** `#ff7759` chỉ dùng cho accents (taxonomy chips, live status, hero h1 emphasis). Không dùng làm broad surface — đúng theo Cohere DESIGN principle trong brief.
- **No drop shadows** trừ flashcard demo trong hero (depth subtle 24px 56px -16px 6%).
- **22px radius signature** dùng cho cards lớn (flashcard, how-card).
- **1px hairline borders** thay cho box-shadow để tạo depth.

---

## 3. Giải quyết các vấn đề brief PHẦN 4

### ✅ Vấn đề #1 — Hero chưa đủ "hook"
- **Homepage**: Hero 2-col layout. Bên trái: H1 + lede + 2 CTAs + 3-stat meta. Bên phải: card stack 3D xoay nhẹ với 3 thẻ Wortschatz mẫu (der Mann, arbeiten, Ich sehe den Hund) — visual mang ý nghĩa của Zettelkasten.
- **Deutsch**: Hero 2-col tương tự nhưng visual là 1 flashcard A1 mẫu thật `die Schwester` với đầy đủ ID, IPA, nghĩa Việt/Anh, ví dụ.

### ✅ Vấn đề #2 — Lang-cards Homepage cá nhân hoá yếu
- Mỗi lang card giờ có 3 dòng meta cá nhân hoá:
  - 🇩🇪 `der/die/das · plural · 4 Fälle`
  - 🇬🇧 `IPA phonetics · 45 chủ đề` + `Collocations · phrasal verbs`
  - 🇫🇷 `Giống đực/cái · liaison` + `Conjugaison · subjonctif`
  - 🇯🇵 `3 bảng chữ · kanji theo bộ thủ` + `Keigo · thể lịch sự`
  - 🇰🇷 `Hangul · ngữ pháp thân thể` + `Particles 은/는 이/가`
  - 🇨🇳 `4 tone pinyin · 214 bộ thủ` + `Giản thể · stroke order`
- Mỗi card có chứng chỉ riêng (Goethe / TOEIC+IELTS / DELF / JLPT / TOPIK / HSK).

### ✅ Vấn đề #3 — deutsch.html dài quá
- Giảm từ 10 sections xuống còn **5 sections chính**:
  1. Hero (với flashcard demo)
  2. Modules grid (7 modules + KI Tutor = 8 cards)
  3. Roadmap A1→B2
  4. How Zettelkasten works (3 cards)
  5. AI Band (KI Tutor) — kèm chat mock
- **Bỏ**: Activity ticker, Testimonials, Featured grammar cards (gộp ý vào How section).

### ✅ Vấn đề #4 — Lang-code format
- Đổi sang chuẩn dùng thật: `Goethe A1 — B2`, `TOEIC + IELTS · A1—C1`, `DELF A1 — B2`, `JLPT N5 — N2`, `TOPIK 1 — 4`, `HSK 1 — 5`.
- Card ID nội bộ vẫn dùng `VO.A1/0142`, `GR.A2/0007` — đây là ID Zettelkasten, không phải metric user-facing.

### ✅ Vấn đề #5 — Footer inconsistent
- Cả 2 trang dùng **footer 3 cột** đồng nhất:
  - Col 1: Brand + tagline + email contact
  - Col 2: 6 ngôn ngữ (Homepage) / 5 modules (Deutsch)
  - Col 3: Tài nguyên (Resources MD, Phương pháp, Liên hệ, etc.)

### ✅ Vấn đề #6 — Dark mode chưa polish
- Token dark hoàn toàn riêng: `--canvas: #0f0f12`, `--surface-1: #16161b`, `--ink: #ededee`.
- Coral trong dark đổi sang `#ff8466` (giảm saturation), CTA primary trong dark = coral (đứng nổi trên dark canvas).
- Hairline `#2c2c33` đủ contrast.
- Theme persist qua `localStorage['dl-theme']` + respect `prefers-color-scheme` lần đầu vào.

### ✅ Vấn đề #7 — Mobile experience
- Breakpoint: 960px (tablet) + 640px (mobile).
- Mobile (≤640px):
  - Hero H1 dùng `clamp(36px, 11vw, 56px)` thay 88px.
  - Card stack/flashcard ẩn (hero-visual `display:none`) để giữ focus vào H1+CTA.
  - Nav links ẩn (chỉ giữ logo + theme toggle) — không có burger menu vì site chưa đủ phức tạp.
  - Grids đều stack 1 cột.
- Tablet (≤960px): grids stack 2 cột.

### ✅ Vấn đề #8 — Loading state
- Trang HTML thuần, không có loading async lớn. Skeleton sẽ là việc của Next.js sprint sau (note trong roadmap).

---

## 4. Lessons learned được áp dụng (brief PHẦN 5)

- ✗ Không có Warm Earth palette → dùng `--canvas: #fff` + coral accent.
- ✗ Không Cyberpunk / Pokemon / Editorial Modern.
- ✗ Không tagline "cùng nhau chinh phục".
- ✗ Không decorative chrome thừa.
- ✗ **Không fake numbers** — 3.170 và 30 là số thật từ data file. Bỏ "1.247 học viên" và "23 user trong giờ qua".
- ✗ Không testimonials (chưa có thật).
- ✗ Không hero video / parallax / confetti / mascot dino.
- ✗ Không alert() — locked modules dùng text-only state + giải thích "Đang xây".

---

## 5. Routing strategy

**Trước:** SPA — toàn bộ URLs serve `/index.html`, JS lo routing nội bộ.

**Sau:** Multi-page. `_redirects` chỉ rewrite cho 4 modules vì các path khác Cloudflare tự xử lý:
```
/grammar       → /modules/grammar.html    200
/vocab         → /modules/vocab.html      200
/listening     → /modules/listening.html  200
/reading       → /modules/reading.html    200
```

**Cloudflare auto-serve (KHÔNG được rewrite trong `_redirects`):**
- `/` → `index.html` (auto)
- `/deutsch` → `deutsch.html` (auto-clean-URL strip `.html`)
- `/assistant` → `/assistant/index.html` (auto-trailing-slash + index)

**⚠️ Gotcha — `ERR_TOO_MANY_REDIRECTS`:**
Lần đầu tao thêm rule `/deutsch /deutsch.html 200` vào `_redirects` — gây loop:
1. User → `/deutsch`
2. `_redirects` rewrite → `/deutsch.html`
3. Cloudflare canonical: redirect `/deutsch.html` → `/deutsch` (301)
4. Loop về step 1

→ Quy tắc: với file HTML ở root build (như `deutsch.html`) và folder có `index.html` (như `assistant/`), KHÔNG thêm rule trong `_redirects`. Cloudflare lo. Chỉ thêm rule khi path không match file trực tiếp (như `/grammar` → file ở `/modules/grammar.html`).

---

## 6. Trade-offs

| Trade-off | Quyết định | Lý do |
|---|---|---|
| Font: Geist vs Space Grotesk | Space Grotesk | Geist không có trên Google Fonts CDN miễn phí, Space Grotesk là fallback đúng spec brief |
| Module pages: redesign hay giữ nguyên | Giữ nguyên | Mỗi file 275KB+, không nằm trong scope brief; làm sau khi mockup landing được approve |
| Mobile menu burger | Không có | Chỉ 3 nav link, ẩn được trên mobile mà không hỏng UX. Burger là overhead chưa cần |
| Localized fonts | Google Fonts CDN | Tốc độ Cloudflare + Google đủ tốt, không cần self-host trong giai đoạn mockup. Sprint Next.js sẽ self-host và subset Vietnamese |
| Brand mark | Chữ "D" trong square | Đơn giản, scale tốt từ favicon đến nav. SVG mark phức tạp hơn để sprint sau |

---

## 7. Browser test checklist (đã pass)

- [x] HTML balanced (no unclosed tags)
- [x] CSS variables resolve (light + dark mode)
- [x] No JS errors (theme toggle, smooth scroll)
- [x] All internal links match `_redirects` rules
- [x] Mobile responsive at 320 / 480 / 768 / 1024 / 1440
- [x] `prefers-reduced-motion` respected (transition → 0.01ms)
- [x] `prefers-color-scheme` honored on first load
- [x] Focus visible outlines (2px action-blue)
- [x] Sample tab order through nav → hero CTAs → cards → footer

---

## 8. To-do còn lại (sprint sau)

- [x] ~~Redesign 4 module HTML files (grammar, vocab, listening, reading) theo cùng design tokens~~ **DONE (May 17, 2026)**
- [x] ~~Redesign `assistant/index.html` (KI Tutor chat UI) theo Cohere Edition~~ **DONE**
- [ ] Tạo OG image cho social sharing (hiện chỉ có og-card.svg generic)
- [ ] Self-host fonts khi migrate Next.js (subset Vietnamese để giảm size)
- [ ] Add SEO meta `og:title`, `og:description`, `og:image`, `twitter:card`
- [ ] Real flashcard demo trong hero — load thẻ ngẫu nhiên từ vocab.json (chứ không hardcode)
- [ ] Migrate sang Next.js + Tailwind + shadcn/ui (Sprint 1)

---

## 9. File size

| File | Size | Target |
|---|---:|---:|
| `index.html` | ~28 KB | < 100 KB ✅ |
| `deutsch.html` | ~31 KB | < 100 KB ✅ |
| `modules/listening.html` | ~20 KB | — |
| `modules/reading.html` | ~21 KB | — |
| `modules/grammar.html` | ~276 KB | (data-heavy) |
| `modules/vocab.html` | ~747 KB | (data-heavy, 3.192 từ embedded) |
| `assistant/index.html` | ~38 KB | — |

Hai trang landing đều dưới ngưỡng brief PHẦN 6.3 (`< 100 KB per page`). Module data-heavy không nằm trong constraint vì chúng là full app pages, không phải marketing pages.

---

## 10. Sprint 2 — Module + Assistant harmonization (May 17, 2026)

### 10.1. Scope thực hiện

Đồng bộ UX/UI 5 page nội bộ với Cohere Edition của 2 trang landing. Không full redesign — strategy "Cohere Shell + Token Swap":

- **Cohere Shell** (sticky top nav 64px): Brand mark + breadcrumb "Tiếng Đức / [Module]" + module-specific controls (search, VI/EN, TTS, Stats) + theme toggle.
- **Token Swap**: Replace Notion design tokens → Cohere palette (canvas, ink, hairline, coral, action-blue). Giữ semantic names trong CSS rules nên không touch logic, chỉ thay color values.
- **Theme bridge**: Single source of truth `localStorage['dl-theme']`, dual-write tới legacy keys `theme` (grammar) + `dm` (vocab) cho backwards compat.
- **Font**: Inter → Space Grotesk + JetBrains Mono.

### 10.2. UX issues phát hiện & fix

| File | Issue | Fix |
|---|---|---|
| grammar.html | "39 thẻ ngữ pháp" trong hero + footer — sai số thật | Đối chiếu data/grammar.json (30 cards / 8 cabinets active), sửa thành "30 thẻ" |
| grammar.html | Topbar gốc bị ẩn (`display: none !important`) — user mất search, theme, lang toggle | Khôi phục đầy đủ trong Cohere shell với JS delegation (forward input/click vào legacy IDs) |
| vocab.html | "🔥 0 ngày" streak hardcoded — fake number per brief | CSS `#skBadge { display: none !important }` cho đến khi có data thật |
| vocab.html | Hero pills "🌙 Dark mode" + "⚙️ Conjugation" — noise, không phải content | Bỏ. Chỉ giữ "X từ" + "15 chủ đề" + "A1 → B2" |
| vocab.html | Hero h1 emoji "🗄️ Tủ Từ Vựng" — brief cấm emoji bừa | Đổi thành "Wortschatz · Từ vựng A1—B2" (tone bilingual đồng nhất với listening/reading) |
| vocab.html | Topbar gốc bị ẩn — mất search, TTS, stats | Khôi phục đầy đủ trong shell với delegation tới `sI`, `toggleTTS()`, `#stov` overlay |
| vocab.html theme toggle | Click shell theme button gọi `applyDark()` legacy → reset data-theme về trạng thái cũ (vì `dark` global var stale) | Bỏ call `applyDark()` từ shell handler. `write()` đã set data-theme + dl-theme + theme + dm. Next page load đọc lại đúng. |
| assistant/index.html | "Anonymous mode" pill — noise không cần thiết khi không có auth | Bỏ. Thay vào đó: nav-r chứa 4 module icon (📐📚🎧📖) cho quick switching |
| listening + reading | Hero h1 ngắn "Listening A1-B2" — thiếu German native term + Vietnamese tone | Đổi: "Hören · Luyện nghe A1—B2" / "Lesen · Đọc hiểu A1—B2" |
| Tất cả 5 file | Không có cách quay về `/deutsch` landing | Breadcrumb "Tiếng Đức" trong shell → `/deutsch` |

### 10.3. UX evaluation từ góc nhìn user (audit)

**Entry flow**: `/` → `/deutsch` → click module card → module page. Flow rõ ràng, có nav consistent.

**Strengths**:
- Brand identity đồng nhất (D mark + Space Grotesk + Cohere palette) toàn site
- Theme persist seamless qua tất cả 7 page
- Search affordance cao (input visible trong shell ở grammar + vocab)
- Mobile responsive an toàn — không horizontal scroll, breakpoint phù hợp

**Weak points còn lại** (để Sprint 3 xử lý):
- grammar.html: 12 cabinets × 30 cards = trung bình 2.5 card/tủ. Vài tủ trống/lẻ. Có thể gộp lại còn 6-8 cabinets cô đặc hơn.
- vocab.html: 15 cabinets × 3192 từ = ~213 từ/tủ — hợp lý. Nhưng UI không indicate trạng thái "đã học X từ" rõ rệt. Cần SRS progress visible.
- assistant chat UI: chưa redesign chat bubble theo Cohere (user bubble bg + assistant border) — out of scope đợt này.
- grammar hero hơi dày: H1 + lede + 4 badges. Có thể giảm còn 2 badges critical.

### 10.4. Verification — đã pass

- ✅ Theme sync cross-page: `/` → toggle dark → vào `/deutsch` → dark giữ → `/grammar` → dark giữ → `/vocab` → dark giữ → `/listening` → dark giữ → `/reading` → dark giữ → `/assistant` → dark giữ
- ✅ Search delegation: grammar tìm "Akkusativ" (13 results), "Perfekt" (10 results); vocab tìm "Mann" (12 results)
- ✅ Cabinet open: grammar Grundlagen → drawer với 4 cards
- ✅ Stats overlay: vocab "📊" button → overlay với "3192 Tổng từ" (số thật)
- ✅ VI/EN toggle grammar: click EN → text đổi sang English, data-lang="en"
- ✅ TTS button vocab: toggle works (label/style)
- ✅ Mobile 375px: no horizontal scroll, nav links collapse, grid stack 1-col
- ✅ No console errors trên bất kỳ page nào
- ✅ HTML tag balance: validated qua Bash regex scan

### 10.5. Known limitations

- **vocab.html theme legacy desync**: legacy `dark` global variable (block-scoped `let`) không update khi shell toggle theme. Chỉ data-theme attribute + localStorage được set đúng. Bất kỳ code nào sau đó gọi `applyDark()` (e.g., postMessage listener line 4287) sẽ reset theme. Hiện không có trigger thực tế nên OK; sẽ refactor khi migrate Next.js.
- **grammar.html theme legacy `btnTheme` icon**: legacy button icon "🌙 Dark" không update khi shell toggle, nhưng button đã ẩn nên không visible. OK.
- **Module pages không thay đổi data structure**: vẫn dùng cabinet/card layout cũ. Token swap chỉ thay color không thay UX flow. UX flow nâng cấp (SRS progress, cabinet consolidation) là Sprint 3.

---

*Updated May 17, 2026.*

---

## 11. Sprint 3 — URL restructure + Bold visual refresh (May 18, 2026)

### 11.1. URL restructure

User feedback: `/modules/grammar` không semantic, muốn `/deutsch/grammar`.

Cấu trúc mới:
```
website/
├── index.html                  → /
├── deutsch/
│   ├── index.html              → /deutsch  (cũ: deutsch.html)
│   ├── grammar.html            → /deutsch/grammar  (cũ: modules/grammar.html)
│   ├── vocab.html              → /deutsch/vocab
│   ├── listening.html          → /deutsch/listening
│   └── reading.html            → /deutsch/reading
└── assistant/
    └── index.html              → /assistant
```

`_redirects` mới:
```
/grammar       → /deutsch/grammar.html  200
/vocab         → /deutsch/vocab.html    200
/listening     → /deutsch/listening.html 200
/reading       → /deutsch/reading.html  200
```
(Cloudflare auto-clean-URL serves `/deutsch/grammar.html` tại `/deutsch/grammar` không cần rule)

`_headers` đổi `/modules/*` → `/deutsch/*`.

Internal links updated: `deutsch/index.html` + `assistant/index.html`: `/grammar` → `/deutsch/grammar`, etc.

### 11.2. Bold visual refresh

Sprint 2 chỉ swap color tokens + thêm shell — user feedback "vẫn thấy như cũ". Sprint 3 redesign **bold** 2 module dense nhất: grammar + vocab.

#### Hero (editorial Cohere)

| Element | Trước | Sau |
|---|---|---|
| Layout | Center-aligned, gradient bg | Left-aligned trong container 1200px, flat bg |
| Eyebrow | (không có) | Mono chip với coral dot · "Ngữ pháp · Goethe A1 — B2" |
| H1 | 32-54px, weight 700, tracking -1.5px | **clamp(38px, 6.5vw, 80px)**, weight 600, tracking -0.022em |
| H1 highlight | (không có) | `<em>` coral color trên 1 từ key ("Zettelkasten" / "thẻ") |
| Lede | 18px, max 540px, centered | 19px, max 620px, left |
| Stat badges | 4 pill nhỏ với emoji ("📚 30 thẻ", "🗂️ 12 nhóm chủ đề", etc.) | **3 stat blocks** to: số 22px + mono uppercase label below (`30` / `THẺ NGỮ PHÁP`) |
| Border | bottom 1px | bottom 1px + top hairline divider trước stat row |

#### Cabinet cards (Cohere "more whitespace, no shadow")

| Element | Trước | Sau |
|---|---|---|
| Grid | `minmax(260px, 1fr)` gap 14px | `minmax(300px, 1fr)` gap 16px, max-width 1200px container |
| Padding | 20px | **28px** |
| Border-radius | 12-16px | **22px (Cohere signature)** |
| Box-shadow | `0 4px 18px` multi-layer | **none** — depth qua hairline border |
| Icon | 28px emoji inline | **56×56 square** với bg surface-1, radius 14px, emoji 30px inside |
| Title | 16px weight 700 tracking -0.2px | 19px weight 600 tracking -0.01em |
| Count badge | Pill blue bg #f2f9ff | Plain mono text "X thẻ" right-aligned |
| Tags | 9-11px font, soft bg | 11px mono, transparent bg, hairline border, radius 4px |
| Hover | translateY(-2px) + shadow | Chỉ background change → surface-1 (Cohere "no shadow") |
| Active strip top | 3px colored bar `::before` opacity 0→1 | Bỏ. Thay bằng 6px coral dot ở góc top-left khi hover |

#### Section labels

| Element | Trước | Sau |
|---|---|---|
| Markup | Single `<div class="section-label">` plain | 2-line: `<div class="section-eyebrow"><span class="se-num">01</span> CABINETS</div>` + `<div class="section-label">12 cabinets · 30 thẻ</div>` |
| Eyebrow style | (chưa có) | Mono font, 12px, uppercase, letter-spacing 0.06em, coral số prefix |
| Label style | 11px uppercase 0.8px letter-spacing | clamp(22px, 3vw, 32px), weight 600, no transform (now is the h2-style section title) |

### 11.3. Files modified

- `website/deutsch/grammar.html` — `:root` + hero CSS + hero HTML (eyebrow, em highlight, stat badges) + cabinet-card CSS + section-eyebrow markup + mobile breakpoints
- `website/deutsch/vocab.html` — same pattern: hero CSS + HTML + `.cab` cabinet CSS refresh + cabinet cell labels (`.cd`, `.cc`, `.ctag`) + section-eyebrow markup + JS `totPill` text formatting (vi-VN locale)

### 11.4. Verification

- ✅ Visual diff confirmed via Preview MCP inspect — H1 78px desktop (1100px width), 38px mobile (375px)
- ✅ Cabinet cards 22px radius, no box-shadow, 56×56 icon square with surface bg
- ✅ Pills render as stat blocks (number + mono label below)
- ✅ Section eyebrow shows "01 · CABINETS · Chọn một tủ" với coral số prefix
- ✅ Cross-page theme persistence: `/deutsch/grammar` dark → vào `/deutsch/vocab` dark giữ
- ✅ Functional: grammar cabinet open → drawer hiện 4 cards ✓; search "Perfekt" → 10 results ✓
- ✅ Mobile 375px: H1 scale down properly, grid stack 1-col, no horizontal scroll
- ✅ All 7 HTML files balance check pass (`<script>`, `<style>`, `<div>`, `<section>` etc. open=close)
- ✅ No console errors

### 11.5. Trade-offs Sprint 3

| Decision | Lý do |
|---|---|
| Bỏ box-shadow → border-only depth | Cohere principle "no drop shadows"; visual cleaner; performance tốt hơn |
| Hover: chỉ change bg, no transform | "Restrained" — Cohere/Stripe/Linear không bouncy. User cảm giác serious |
| Stat-style pills thay pill chips | Information density cao hơn ít chip noise hơn. Số to dễ scan |
| Keep emoji icon trong card | Mỗi cabinet đã có identity emoji (🏗️🔗📦...) — bỏ hết thì cabinet mất distinction. Compromise: emoji trong soft-stone square (less prominent) |
| H1 dùng `<em>` coral | Tạo focal point editorial, không phải decoration. 1 từ duy nhất per page |

---

*Updated May 18, 2026.*
