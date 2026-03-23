# Deploy Deutsch Sprint Lên Cloudflare

## Kiến trúc đề xuất

- `Host`: Cloudflare Pages
- `CDN`: Cloudflare global edge cache
- `SSL`: Cloudflare Universal SSL
- `DNS / Domain`: Cloudflare DNS

Project hiện tại là frontend tĩnh + Cloudflare Pages Functions cho API động, nên vẫn không cần server riêng. Cách này là gọn nhất và rẻ nhất.

## File đã được chuẩn bị

- `wrangler.toml`: cấu hình deploy cho Cloudflare
- `_headers`: cache rules + security headers
- `functions/`: API serverless chạy ngay trên Cloudflare Pages
- `.gitignore`: file bỏ qua khi đưa lên GitHub
- `.github/workflows/deploy-cloudflare-pages.yml`: auto deploy từ GitHub Actions lên Cloudflare Pages

## Cách deploy nhanh nhất

### Cách 1: Deploy bằng giao diện Cloudflare Pages

1. Đăng nhập Cloudflare.
2. Vào `Workers & Pages`.
3. Chọn `Create application`.
4. Chọn `Pages`.
5. Chọn `Upload assets`.
6. Upload toàn bộ thư mục project này.
7. Đặt tên project, ví dụ `deutsch-easy`.
8. Sau khi deploy xong, Cloudflare sẽ cấp cho bạn một domain tạm dạng:
   - `https://deutsch-easy.pages.dev`

### Cách 2: Deploy bằng Wrangler CLI

Nếu máy bạn đã cài Node.js:

```powershell
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name deutsch-easy
```

### Cách 3: Deploy tự động từ GitHub

1. Tạo repo trên GitHub.
2. Upload toàn bộ project này lên repo đó.
3. Trong GitHub repo, vào `Settings -> Secrets and variables -> Actions`.
4. Tạo 2 secret:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
5. Push lên branch `main`.
6. Workflow ở `.github/workflows/deploy-cloudflare-pages.yml` sẽ tự deploy.

## Cách lấy Cloudflare secrets

### `CLOUDFLARE_ACCOUNT_ID`

1. Đăng nhập Cloudflare.
2. Ở dashboard bên phải thường có `Account ID`.
3. Copy giá trị đó vào GitHub secret.

### `CLOUDFLARE_API_TOKEN`

1. Vào `My Profile -> API Tokens`.
2. Chọn `Create Token`.
3. Dùng template gần giống `Edit Cloudflare Workers` hoặc tạo custom token có quyền Pages/Workers deploy.
4. Copy token đó vào GitHub secret.

## Gắn domain riêng

1. Mua hoặc đưa domain về Cloudflare DNS.
2. Vào project `deutsch-easy` trong Pages.
3. Mở `Custom domains`.
4. Thêm domain của bạn, ví dụ:
   - `deutschsprint.com`
   - `app.deutschsprint.com`
5. Cloudflare sẽ tự tạo SSL và route CDN.

## Cách cache hiện tại

- `index.html`: không cache cứng, luôn có thể cập nhật ngay
- `app.js`, `styles.css`: cache 1 ngày
- `data/*.json`: cache 1 giờ
- `/api/*`: cache ngắn 1 phút

Cách này hợp với site học tập có data thay đổi theo đợt.

## Khi nào nên đổi lên backend thật

Bạn chỉ cần backend riêng hoặc database riêng khi muốn:

- login thật
- đồng bộ tiến độ giữa nhiều thiết bị
- admin panel
- API động

Hiện tại API động cơ bản đã có thể chạy bằng `Cloudflare Pages Functions`.

Nếu chưa cần mấy thứ đó, Cloudflare Pages là đủ.

## Ghi chú thẳng thắn

Mình đã chuẩn bị sẵn cấu hình deploy trong codebase, nhưng chưa thể tạo project thật trên tài khoản Cloudflare của bạn từ đây vì không có quyền đăng nhập hoặc token. Khi bạn có tài khoản, chỉ cần làm theo các bước trên là site lên host + CDN được ngay.

## Lưu ý trên máy hiện tại

Máy này hiện chưa có `git`, nên chưa thể `git init`, commit hay push thẳng repo từ terminal. Nếu bạn cài `git`, mình có thể làm tiếp phần đó ngay.
