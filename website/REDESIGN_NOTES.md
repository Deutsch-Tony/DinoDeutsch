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

**Sau:** Multi-page với `_redirects` rõ ràng:
```
/                  → website/index.html        (Homepage 6 lang)
/deutsch           → website/deutsch.html      (Landing Đức)
/grammar           → website/modules/grammar.html
/vocab             → website/modules/vocab.html
/listening         → website/modules/listening.html
/reading           → website/modules/reading.html
/assistant         → website/assistant/index.html
```

**Lý do:** Khi migrate Next.js sprint sau, mapping page → route cleaner. URL friendly cho SEO.

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

- [ ] Redesign 4 module HTML files (grammar.html, vocab.html, listening.html, reading.html) theo cùng design tokens
- [ ] Redesign `assistant/index.html` (KI Tutor chat UI) theo Cohere Edition
- [ ] Tạo OG image cho social sharing (hiện chỉ có og-card.svg generic)
- [ ] Self-host fonts khi migrate Next.js (subset Vietnamese để giảm size)
- [ ] Add SEO meta `og:title`, `og:description`, `og:image`, `twitter:card`
- [ ] Real flashcard demo trong hero — load thẻ ngẫu nhiên từ vocab.json (chứ không hardcode)
- [ ] Migrate sang Next.js + Tailwind + shadcn/ui (Sprint 1)

---

## 9. File size

| File | Size | Target |
|---|---:|---:|
| `index.html` | ~26 KB | < 100 KB ✅ |
| `deutsch.html` | ~28 KB | < 100 KB ✅ |

Đều dưới ngưỡng brief PHẦN 6.3 (`< 100 KB per page`).

---

*Generated May 14, 2026.*
