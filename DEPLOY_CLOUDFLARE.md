# Deploy Deutsch Sprint lên Cloudflare Pages

## Kiến trúc hiện tại

- `Host`: Cloudflare Pages
- `CDN`: Cloudflare global edge
- `API`: Cloudflare Pages Functions trong thư mục `functions/`
- `Data`: JSON nội bộ trong thư mục `data/`
- `Config tối thiểu`: `wrangler.toml` + `_headers`

Project này không cần GitHub Actions để deploy nữa vì Cloudflare Pages đã kết nối thẳng với repo GitHub.

## File còn cần giữ

- [wrangler.toml](C:\Users\adminn\Desktop\code\wrangler.toml)
- [_headers](C:\Users\adminn\Desktop\code\_headers)
- [index.html](C:\Users\adminn\Desktop\code\index.html)
- [app.js](C:\Users\adminn\Desktop\code\app.js)
- [styles.css](C:\Users\adminn\Desktop\code\styles.css)
- thư mục `functions/`
- thư mục `data/`

## Cách deploy đúng

1. Đẩy code lên branch `main` của repo GitHub.
2. Vào `Cloudflare -> Workers & Pages -> deutsch-easy`.
3. Để Cloudflare tự build từ Git integration.

Build config đúng:

- `Framework preset`: `None`
- `Build command`: để trống
- `Build output directory`: `.`
- `Root directory`: để trống

Cloudflare sẽ tự:

- publish asset tĩnh
- nhận `functions/` làm API serverless
- áp dụng header từ `_headers`

## Kiểm tra sau deploy

Mở các URL này:

- `https://deutsch-easy.pages.dev/`
- `https://deutsch-easy.pages.dev/api/resources`
- `https://deutsch-easy.pages.dev/api/vocab/meta`
- `https://deutsch-easy.pages.dev/api/modules/grammar`

Nếu 3 URL `/api/...` trả JSON thì phần động đang chạy đúng.

## Gắn custom domain

1. Đưa domain về cùng tài khoản Cloudflare.
2. Vào `Cloudflare -> Workers & Pages -> deutsch-easy`.
3. Mở `Custom domains`.
4. Bấm `Set up a custom domain`.
5. Nhập domain bạn muốn gắn, ví dụ:
   - `deutsch.yourdomain.com`
   - `app.yourdomain.com`
   - `yourdomain.com`
6. Cloudflare sẽ tự tạo DNS record và SSL nếu domain nằm trong cùng account.

Khuyến nghị:

- dùng subdomain như `deutsch.domain.com` an toàn và gọn hơn
- chỉ dùng apex domain nếu bạn thật sự muốn đây là trang chính

## Khi nào cần đụng Wrangler CLI

Hiện tại gần như không cần chạy deploy thủ công bằng Wrangler nữa.

`wrangler.toml` vẫn nên giữ vì:

- Cloudflare đọc `compatibility_date`
- Cloudflare đọc `pages_build_output_dir`
- cấu hình này giúp Pages Functions ổn định hơn

## Cache hiện tại

- `index.html`: luôn revalidate
- `app.js`, `styles.css`: cache 1 ngày
- `data/*`: cache 1 giờ
- `/api/*`: cache 60 giây

Cấu hình này đủ ổn cho app học tập cá nhân và vẫn cập nhật nhanh sau mỗi lần push.
