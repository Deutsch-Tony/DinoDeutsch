# Supabase Auth cho Deutsch Sprint

## Dữ liệu được lưu ở đâu

### Auth

- Email
- Mật khẩu đã băm
- Tài khoản Google liên kết
- Session đăng nhập

Phần này được lưu trong `Supabase Auth`.

### Dữ liệu học tập

Hiện tại:

- Favorite
- Đã học
- Cần ôn

vẫn đang lưu ở `localStorage` trên trình duyệt.

Nếu muốn đồng bộ nhiều thiết bị, bước tiếp theo là tạo bảng trong Supabase Postgres để lưu tiến độ học.

## Cần tạo gì trong Supabase

1. Tạo project mới trên Supabase.
2. Vào `Project Settings -> API`.
3. Copy:
   - `Project URL`
   - `anon public key`
4. Mở file [supabase-config.js](C:\Users\adminn\Desktop\code\supabase-config.js)
5. Điền:

```js
export const SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR-ANON-KEY",
  redirectTo: "https://deutsch-easy.pages.dev"
};
```

Sau này khi domain riêng chạy ổn thì đổi `redirectTo` thành:

```js
redirectTo: "https://deutschdeec.com.vn"
```

## Bật Email Auth

1. Vào `Supabase -> Authentication -> Providers`.
2. Bật `Email`.
3. Chọn cho phép:
   - sign up
   - sign in

## Bật Google Auth

1. Vào `Supabase -> Authentication -> Providers -> Google`.
2. Bật `Google`.
3. Tạo OAuth credentials trong Google Cloud.
4. Copy `Client ID` và `Client Secret` vào Supabase.

## Redirect URLs cần thêm

Trong Supabase:

`Authentication -> URL Configuration`

Thêm:

- `https://deutsch-easy.pages.dev`
- `https://deutsch-easy.pages.dev/`
- `https://deutschdeec.com.vn`
- `https://deutschdeec.com.vn/`

Nếu bạn dùng `www` thì thêm luôn:

- `https://www.deutschdeec.com.vn`
- `https://www.deutschdeec.com.vn/`

## Lưu ý

- `anonKey` là public key, để ở frontend được
- không đưa `service_role` key vào frontend
- nếu muốn lưu tiến độ học lên cloud, nên làm bước tiếp theo bằng bảng `profiles` và `user_progress`
