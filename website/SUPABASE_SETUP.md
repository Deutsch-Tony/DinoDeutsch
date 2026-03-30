# Supabase setup cho Deutsch Sprint

## Dữ liệu được lưu ở đâu

### Auth

- Email
- Mật khẩu đã băm
- Tài khoản Google liên kết
- Session đăng nhập

Phần này được lưu trong `Supabase Auth`.

### Dữ liệu học tập

Hiện tại website sẽ lưu:

- `favorite`
- `progress` gồm `new / learned / review`
- thời điểm cập nhật cuối

Phần này được lưu trong bảng `user_vocab_state` của Supabase khi user đăng nhập.

### Hồ sơ tài khoản

Thông tin cơ bản như:

- email
- tên hiển thị
- avatar url
- provider đăng nhập

được lưu trong bảng `profiles`.

## 1. Điền config frontend

Mở file [supabase-config.js](C:\Users\adminn\Desktop\code\supabase-config.js) và điền:

```js
export const SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR-ANON-PUBLIC-KEY",
  redirectTo: "https://deutsch-easy.pages.dev"
};
```

Sau khi domain riêng hoạt động, đổi `redirectTo` thành:

```js
redirectTo: "https://deutschdeec.com.vn"
```

## 2. Bật provider

Trong Supabase:

- `Authentication -> Sign In / Providers`
- bật `Email`
- bật `Google`

## 3. Thêm redirect URLs

Trong:

- `Authentication -> URL Configuration`

Thêm:

- `https://deutsch-easy.pages.dev`
- `https://deutsch-easy.pages.dev/`

Sau này thêm tiếp:

- `https://deutschdeec.com.vn`
- `https://deutschdeec.com.vn/`
- `https://www.deutschdeec.com.vn`
- `https://www.deutschdeec.com.vn/`

## 4. Tạo bảng database

Mở `SQL Editor` trong Supabase và chạy toàn bộ file:

- [SUPABASE_SCHEMA.sql](C:\Users\adminn\Desktop\code\SUPABASE_SCHEMA.sql)

File này sẽ tạo:

- bảng `profiles`
- bảng `user_vocab_state`
- RLS policies để mỗi user chỉ đọc/ghi dữ liệu của chính mình

## 5. Luồng hoạt động sau khi xong

1. User đăng nhập bằng email hoặc Google.
2. Supabase tạo session.
3. Frontend upsert hồ sơ vào `profiles`.
4. Frontend tải dữ liệu từ `user_vocab_state`.
5. Tiến độ local và cloud được merge theo `updated_at`.
6. Khi user bấm `Fav / Học / Ôn lại`, website tự upsert lại lên Supabase.

## Lưu ý bảo mật

- `anonKey` là public key, để ở frontend được
- không bao giờ đưa `service_role` key vào website
- RLS phải bật như trong SQL schema

## Nếu muốn mở rộng tiếp

Bước kế tiếp hợp lý là thêm:

- bảng `user_test_attempts`
- bảng `user_settings`
- lưu lịch sử mini test
- lưu level mục tiêu A1/A2/B1/B2
