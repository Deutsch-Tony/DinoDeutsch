# 🎨 REDESIGN BRIEF — Dino Language UI/UX

> **Mục đích file này:** Cung cấp đầy đủ context cho AI agent (Claude Code, Cursor, v.v.) để **redesign lại layout** website Dino Language. Đọc từ trên xuống — KHÔNG nhảy section.
>
> **Hiện trạng:** Đã có 2 file mockup HTML (`Homepage.html` + `deutsch.html`) build theo v9 Cohere Edition. Cần redesign tốt hơn — không phải làm lại từ đầu.
>
> **Author:** Tèo (Claude) for Nguyễn Lâm Trọng Nghĩa
> **Last update:** May 15, 2026

---

## 📌 PHẦN 1 — CONTEXT DỰ ÁN (đọc trước)

### 1.1. Dino Language là gì
Website học ngôn ngữ vận hành bởi 5 AI agents tự động. Bắt đầu với **tiếng Đức** rồi mở rộng sang Anh/Pháp/Nhật/Hàn/Trung. Phương pháp học: **Zettelkasten** — mỗi khái niệm là 1 thẻ độc lập có ID, liên kết qua lại.

**Target user:** Người Việt 22-35 tuổi muốn nghiêm túc học tiếng Đức (du học, làm việc, ôn Goethe A1-B2). Không phải "casual learner kiểu Duolingo".

**Brand tone:** Tử tế, chững chạc, đi thẳng vào việc. Không sến, không "cùng nhau chinh phục hành trình ngôn ngữ".

### 1.2. Stack đã chốt
- **Frontend:** Next.js 14 + Tailwind + shadcn/ui (target migration)
- **Hosting:** Cloudflare Pages (free, unlimited bandwidth)
- **Database:** Supabase (8 tables, RLS, 3,170 vocab + 30 grammar cards đã có data)
- **Cache:** Upstash Redis
- **AI:** Claude Haiku 4.5 cho hầu hết task
- **Domain:** Sẽ là `dinolanguage.com`

### 1.3. Status
- 🟢 Đang mở **beta** — chưa có user thật
- 🟢 Data tiếng Đức đã có: 3,170 từ vựng + 30 chủ đề ngữ pháp + 12 cabinets
- 🔴 Chưa launch — cần landing convert user beta

---

## 📁 PHẦN 2 — FILES BẠN CẦN ĐỌC

Trước khi redesign, đọc các file này theo thứ tự:

| Thứ tự | File | Mục đích |
|---|---|---|
| 1 | `Homepage.html` | Landing 6 ngôn ngữ (33 KB) |
| 2 | `deutsch.html` | Trang tiếng Đức (81 KB) |
| 3 | `UI_UX_PROPOSAL_v9.md` | Design system spec (13 KB) |
| 4 | `DinoLanguage_AI_Agents_Architecture_v1.4.docx` | Architecture chi tiết (20 KB) |
| 5 (tham khảo) | `grammar.html` | Data 30 grammar cards (275 KB) |
| 6 (tham khảo) | `vocab.html` | Data 3,170 vocab (758 KB) |

**Quan trọng:** 2 file mockup hiện tại đã build theo direction Cohere Edition. Bạn có thể:
- **Option A:** Giữ direction Cohere, tinh chỉnh các vấn đề cụ thể bên dưới
- **Option B:** Đề xuất direction mới với lý do rõ ràng tại sao tốt hơn

---

## 🎨 PHẦN 3 — DESIGN DIRECTION HIỆN TẠI (v9 Cohere Edition)

### 3.1. Inspiration
- **Cohere.com** (Pentagram's "new nature" rebrand 2023) — sober enterprise AI vibe
- **Stripe.com** — editorial typography, restrained palette
- **Linear.app** — precision, black/white

### 3.2. Design tokens

#### Colors
```css
--canvas:       #ffffff;   /* Default background */
--ink:          #212121;   /* Default body text */
--near-black:   #17171c;   /* Primary CTA */
--green:        #003c33;   /* Enterprise dark band */
--navy:         #071829;   /* Security/financial bands */
--action-blue:  #1863dc;   /* Editorial links */
--coral:        #ff7759;   /* SIGNATURE accent */
--coral-soft:   #ffad9b;
--muted:        #93939f;
--hairline:     #d9d9dd;
--soft-stone:   #eeece7;
```

#### Typography
- **Display/Body:** Geist (Vercel) → fallback Space Grotesk → Inter
- **Mono:** Geist Mono → fallback JetBrains Mono

| Role | Size | Line | Tracking |
|---|---:|---:|---:|
| Hero Display | 96px | 1.00 | -1.92px |
| Section | 48px | 1.20 | -0.48px |
| Card Heading | 32px | 1.20 | -0.32px |
| Feature | 24px | 1.30 | 0 |
| Body | 16px | 1.50 | 0 |
| Mono Label | 14px | 1.40 | 0.28px |

#### Radius
- `xs: 4px` · `sm: 8px` · `md: 16px` · **`lg: 22px` (signature)** · `xl: 30px` · `pill: 32px`

### 3.3. Component patterns (Cohere DESIGN.md)
- **Pill CTA** near-black `#17171c` cho primary action
- **Text link underlined** cho secondary action
- **No drop shadows** — depth từ surface alternation + 1px borders
- **22px rounded media cards** signature
- **Trust logo strips** wide spacing, monochrome
- **Coral chỉ dùng cho taxonomy chips** — KHÔNG dùng làm broad surface

---

## 🚨 PHẦN 4 — CÁC VẤN ĐỀ HIỆN TẠI CẦN REDESIGN

Đây là phần **quan trọng nhất** — đọc kỹ và redesign giải quyết từng vấn đề:

### Vấn đề #1 — Hero Homepage chưa đủ "hook"
**Hiện trạng:** H1 84px "Sáu ngôn ngữ. Một mạng lưới." + badge "Đang mở beta" + lede + 2 CTAs + 4 stats nhỏ.

**Vấn đề cụ thể:**
- User scroll vào không cảm thấy "ngay được vào học" — phải hiểu Zettelkasten trước
- Stats row tinh tế nhưng có thể bị bỏ qua
- Visual đơn điệu — chỉ text + 2 buttons + 4 numbers

**Hướng redesign gợi ý:**
- Thêm visual element ở hero (card stack 3D, animated cell pattern, hoặc inline demo flashcard)
- Cân nhắc layout 2 cột: text bên trái + visual interactive bên phải
- A/B test: hero ngắn hơn (chỉ H1 + 1 CTA) vs hero dài (full context)

### Vấn đề #2 — Lang-cards Homepage cá nhân hoá yếu
**Hiện trạng:** 6 cards (1 live + 5 soon) đều cùng template `Q3 2026 · ~5.000 từ · 45 chủ đề`.

**Vấn đề:** Pattern lặp 5 lần → cảm giác "fake content, copy-paste" → giảm trust.

**Hướng redesign gợi ý:**
- Mỗi ngôn ngữ có "personality" riêng. Đề xuất content:
  - 🇩🇪 **Đức** (live): "3.170 từ · 30 chủ đề · 12 cabinets Zettelkasten" ✓ đã OK
  - 🇬🇧 **Anh**: "TOEIC + IELTS · IPA phonetics · 45 chủ đề"
  - 🇫🇷 **Pháp**: "DELF A1—B2 · giống đực/cái · liaison phonetics"
  - 🇯🇵 **Nhật**: "JLPT N5—N2 · 3 bảng chữ + kanji theo bộ thủ"
  - 🇰🇷 **Hàn**: "TOPIK 1—4 · Hangul · ngữ pháp thân thể"
  - 🇨🇳 **Trung**: "HSK 1—5 · 4 tone pinyin · bộ thủ hán tự"

### Vấn đề #3 — deutsch.html dài quá (10 sections)
**Hiện trạng:** Hero · Activity · How-it-works · Demo flashcard · Featured cards · Roadmap · 7 modules · Testimonials · Footer.

**Vấn đề:** Scroll fatigue. User mất tập trung trước khi đến CTA.

**Hướng redesign gợi ý:**
- Cân nhắc bỏ hoặc gộp section: Activity ticker có thể bỏ, Testimonials có thể move vào footer
- Hoặc dùng **anchor nav sticky** để user nhảy section nhanh
- Hoặc tách thành 2 trang: `deutsch.html` (landing) + `deutsch/learn.html` (sau khi register)

### Vấn đề #4 — Lang-code format chưa quyết
**Hiện trạng:** Dùng `DE.A1 — B2`, `GR.A2/0007`, `VO.A1/0142`.

**Vấn đề:** Format tự định nghĩa, không user-recognizable. Người học tiếng Đức quen với "Goethe A1, A2, B1, B2".

**Hướng redesign gợi ý:** Đổi sang chuẩn nơi dùng:
- 🇩🇪 `Goethe A1 — B2`
- 🇬🇧 `TOEIC + IELTS · A1—C1`
- 🇫🇷 `DELF A1—B2`
- 🇯🇵 `JLPT N5—N2`
- 🇰🇷 `TOPIK 1—4`
- 🇨🇳 `HSK 1—5`

### Vấn đề #5 — Footer 3 cột (Homepage) vs 4 cột (deutsch) inconsistent
**Hướng redesign:** Đồng bộ. Đề xuất 3 cột:
- Col 1: Brand + tagline + email contact
- Col 2: Ngôn ngữ (6 link)
- Col 3: Hỗ trợ + Tài nguyên (gộp)

### Vấn đề #6 — Dark mode chưa polish
**Hiện trạng:** Có `data-theme=dark` nhưng chưa tinh chỉnh contrast/saturation.

**Hướng redesign:** Test kỹ dark mode, đặc biệt:
- Card surface trong dark có quá `--surface-2` hay `--surface-3`?
- Coral `#ff7759` trên dark background có chói không?
- Border `--hairline` có đủ visible không?

### Vấn đề #7 — Mobile experience chưa được test kỹ
**Hiện trạng:** Có responsive breakpoint, nhưng nhiều element vẫn cảm thấy chật ở <600px.

**Hướng redesign:**
- Hero H1 96px → giảm xuống bao nhiêu trên mobile? Hiện 48px có quá nhỏ không?
- Lang-cards 1 column nhưng card đó có cần thay đổi gì khác không?
- Topbar mobile menu (burger) có hoạt động đúng không?

### Vấn đề #8 — Loading state & skeleton chưa có
**Hiện trạng:** Page load thẳng, không có skeleton.

**Hướng redesign:** Thiết kế skeleton loading cho:
- Hero (text shimmer)
- Lang-cards grid (placeholder cards)
- Featured cards (placeholder rows)
- Khi migrate sang Next.js, dùng `loading.tsx` của App Router

---

## ⛔ PHẦN 5 — KHÔNG ĐƯỢC LÀM (LESSONS LEARNED)

Đã thử và **bị reject** trong 8 iterations trước. Tránh các direction này:

| ❌ Tránh | Lý do |
|---|---|
| **Warm Earth palette** (forest + amber + coral đậm) | Quá ấm, không nghiêm túc |
| **Cyberpunk** (neon, glitch, tactical labels `⟦LOCKED⟧`, `//`) | Quá lõ, không phù hợp brand học thuật |
| **Pokemon pixel art** (Press Start 2P, chunky borders, 8-bit) | Quá game-y, trẻ con |
| **Editorial Modern v8** (Fraunces serif, italic emphasis) | Quá điệu, "trống cảm giác" |
| **Notion warm** | Quá mainstream, không nổi bật |
| **Bauhaus geometric** (color blocks lớn) | Quá loud |
| **Tagline kiểu "cùng nhau chinh phục"** | User ghét sến |
| **Decorative chrome thừa** (corner brackets `┌ ┐`, clip-path notch) | Distract |
| **Fake numbers** ("1.247 học viên", "23 user trong giờ qua") | Bị lộ khi launch beta |
| **Mini-card illustrations generic** trong how-it-works | Nên dùng data thật |
| **`alert()` native** cho locked module | Xấu, không brand |
| **Mascot Dino vẫy tay** | Cliché |
| **Confetti / fireworks animation** | Sến |
| **Hero video** | Nặng + cliché |
| **Parallax scroll** | Rối, lag mobile |
| **Auto-carousel testimonial** | Chưa có testimonial thật |

---

## ✅ PHẦN 6 — SUCCESS CRITERIA

Redesign được coi là thành công khi:

### 6.1. Visual
- [ ] Brand identity nhất quán giữa Homepage và deutsch.html
- [ ] Mỗi section có visual hierarchy rõ — không flat đều
- [ ] Whitespace dùng đúng — không bị "dense panic" cũng không "empty waste"
- [ ] Dark mode test kỹ, contrast WCAG AA tối thiểu
- [ ] Mobile responsive ở 320px, 480px, 768px, 1024px, 1440px

### 6.2. UX
- [ ] Routing 2 file rõ ràng (logo deutsch.html click về Homepage)
- [ ] CTA primary visible above-the-fold trên mọi screen size
- [ ] Lang-cards có personality riêng cho mỗi ngôn ngữ
- [ ] Locked module có cách dẫn user đi chỗ khác (không dead-end)
- [ ] Loading state cho data-heavy sections

### 6.3. Performance
- [ ] Total HTML + CSS + JS < 100 KB per page (hiện tại Homepage 33KB, deutsch 81KB)
- [ ] No external image dependencies (CSS-only graphics ưu tiên)
- [ ] Font subset Vietnamese để giảm Geist size
- [ ] `prefers-reduced-motion` được respect

### 6.4. Code quality
- [ ] CSS variables cho tokens (`--canvas`, `--ink`, etc.)
- [ ] Class naming consistent (BEM hoặc utility-first)
- [ ] Semantic HTML (header/main/section/article/footer)
- [ ] ARIA labels cho interactive elements
- [ ] Comments giải thích section structure

### 6.5. Content quality
- [ ] Không có fake numbers
- [ ] Beta-honest messaging
- [ ] Tagline đúng tone: tử tế, chững chạc, không sến
- [ ] Vietnamese punctuation đúng (em dash `—`, number `1.247`)

---

## 🔧 PHẦN 7 — TECHNICAL DETAILS

### 7.1. File output mong muốn
- `Homepage.html` — Single file HTML+CSS+JS (giữ pattern hiện tại)
- `deutsch.html` — Single file HTML+CSS+JS
- (Optional) `design-tokens.css` — Shared tokens nếu muốn extract

### 7.2. Browser support
- Chrome/Edge/Safari/Firefox latest 2 versions
- Mobile Safari iOS 14+
- Chrome Android 11+

### 7.3. Accessibility minimum
- WCAG 2.1 AA cho contrast
- Keyboard navigable (Tab order logic, focus visible)
- Screen reader friendly (ARIA where needed)
- `prefers-reduced-motion` support
- `prefers-color-scheme` honor (auto switch dark/light)

### 7.4. Đừng dùng (chưa cần)
- React/Vue/Svelte (giữ vanilla HTML+CSS+JS cho mockup)
- Framework CSS (Tailwind cho production, không cho mockup)
- Build tools (Webpack, Vite) — mockup phải mở trực tiếp được trong browser
- External fonts khác ngoài Geist + Geist Mono
- Analytics scripts (mockup không cần)

---

## 📊 PHẦN 8 — DATA AVAILABLE

### 8.1. Grammar cards (30 thẻ)
File: `grammar.html` — 12 cabinets:
1. **Grundlagen** — A1 basics
2. **Artikel & Nomen** — der/die/das, plural, declension
3. **Die Fälle** — Nominativ, Akkusativ, Dativ, Genitiv
4. **Zeitformen** — Präsens, Perfekt, Präteritum, Futur
5. **Präpositionen** — mit/ohne case
6. **Adjektive** — declension, comparison
7. **Pronomen** — personal, possessive, reflexive
8. **Satzstruktur** — main, subordinate, questions
9. **Spezialverben** — modal, separable
10. **Passiv & Konjunktiv** — voice, mood
11. **Kommunikation** — discourse markers
12. **Wortbildung** — compound, derivation

### 8.2. Vocab (3,170 từ)
File: `vocab.html` — 15 nhóm chủ đề. Mỗi từ có:
- `w` (word), `art` (der/die/das), `pl` (plural)
- `type` (N/V/Adj/Adv/Ph/In)
- `ipa` (phonetic), `en` (English), `vi` (Vietnamese)
- `gr` (grammar note), `ex` (example), `exVi` (example translation)
- `cat` (category)

### 8.3. 7 modules planned
1. **Grammatik** (live, 77% — 23/30) 📐
2. **Wortschatz** (live, 25% — 789/3.170) 📚
3. **Hören** (locked) 🎧
4. **Lesen** (locked) 📖
5. **Sprechen** (locked) 🎤
6. **Schreiben** (locked) ✍️
7. **Prüfung** (locked) 📝

### 8.4. Roadmap A1 → B2
- **A1** Khởi đầu (~2-3 tháng) — Completed ✓
- **A2** Cơ bản (~3-4 tháng) — Current, 68% active
- **B1** Giao tiếp (~4-6 tháng) — Locked
- **B2** Thành thạo (~6-9 tháng) — Locked

---

## 💬 PHẦN 9 — TONE & VOICE GUIDE

### 9.1. Đúng
- ✅ "Học tiếng Đức theo phương pháp Zettelkasten."
- ✅ "Đang mở beta. Một dev người Việt đang học tiếng Đức."
- ✅ "3.170 từ vựng + 30 chủ đề ngữ pháp. Chỉ vậy thôi."
- ✅ "Mở thẻ. Lật xem nghĩa. Tự đánh giá. Não nhớ đúng lúc."
- ✅ "Không phải Duolingo. Không có streak chấm xanh. Chỉ có thẻ."

### 9.2. Sai (cliché tránh)
- ❌ "Cùng nhau chinh phục hành trình ngôn ngữ"
- ❌ "Bứt phá giới hạn bản thân"
- ❌ "Trở thành phiên bản tốt nhất của chính mình"
- ❌ "Học tiếng Đức chưa bao giờ dễ đến thế"
- ❌ Emoji bừa bãi trong content (chỉ dùng 🇩🇪🇬🇧🇫🇷🇯🇵🇰🇷🇨🇳 cho lang flags)

### 9.3. Format
- Em dash `—` thay vì hyphen `-` cho ngắt câu
- Number Vietnamese: `1.247` (dấu chấm, không phẩy)
- Quote dùng `"..."` thay vì smart quote
- Time: `2-3 tháng` không phải `2 - 3 tháng`

---

## 🎯 PHẦN 10 — DELIVERABLES MONG MUỐN

Sau khi redesign, output bao gồm:

1. **`Homepage.html` (redesigned)** — Single file, mở trực tiếp browser được
2. **`deutsch.html` (redesigned)** — Single file
3. **`REDESIGN_NOTES.md`** — Giải thích các quyết định design:
   - Đã giải quyết vấn đề nào trong PHẦN 4
   - Lý do chọn các pattern cụ thể
   - Trade-offs đã đánh đổi
   - To-do còn lại (nếu có)
4. **(Optional) `design-tokens.json`** — Tokens dạng JSON nếu muốn dùng cho figma/code sync

### Khi nào hỏi user trước:
- Nếu muốn đổi hoàn toàn direction (không phải Cohere Edition nữa) → hỏi trước
- Nếu thêm dependency mới (framework, library) → hỏi trước
- Nếu thay đổi cấu trúc file (tách thành nhiều file) → hỏi trước

### Không cần hỏi (tự quyết):
- Tinh chỉnh spacing, color, typography trong tokens hiện tại
- Thêm/bớt section trong page
- Đổi component pattern (button style, card style)
- Cải thiện responsive behavior
- Fix accessibility issues

---

## 📞 PHẦN 11 — SUPPORT INFO

**User profile:**
- Tên: Nguyễn Lâm Trọng Nghĩa
- Background: Làm thương mại điện tử
- Đang học tiếng Đức A2→B1
- Gọi Claude là "Tèo", xưng tao-mày
- Preference: Research kỹ trước khi trả lời, code và phân tích data cẩn thận

**Communication style:**
- Trả lời thẳng thắn, không sến
- Phản hồi ngắn ("xấu quá", "lõ", "đơn điệu") → đừng defensive, hỏi rõ vấn đề cụ thể
- Discuss từng điểm trước → confirm → build (không bulk-fix)
- Show, don't tell — luôn data thật trong examples

**Lịch sử iterations:**
v1 → v9 (Cohere Edition) — chi tiết trong `UI_UX_PROPOSAL_v9.md`

---

## 🚀 BẮT ĐẦU

Khi đọc xong file này, agent nên:

1. **Đọc 2 file mockup hiện tại** (`Homepage.html`, `deutsch.html`)
2. **Note xuống các issue cụ thể** thấy được (ngoài 8 vấn đề liệt kê ở PHẦN 4)
3. **Đề xuất hướng tiếp cận** trước khi code (1-2 paragraph)
4. **Hỏi user confirm** direction trước khi build
5. **Build từng phần** (Homepage trước, deutsch sau hoặc parallel)
6. **Validate output** (HTML balanced, JS syntax, mobile responsive)
7. **Present 2 files + REDESIGN_NOTES.md**

**Important:** Đừng overengineer. Đây là **mockup HTML đơn lẻ** — sẽ migrate sang Next.js + Tailwind + shadcn/ui trong Sprint 1. Mục tiêu mockup là **rapid iteration design** với code dễ đọc, không phải production-ready.

---

*File này được generate ngày May 15, 2026 bởi Tèo (Claude) for Nghĩa.*
*Khi update hoặc bổ sung, ghi rõ trong section 11 lịch sử iterations.*
