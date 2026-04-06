# Life Ledger

Mot web app nho de quan ly:

- Chi tieu ca nhan va budget thang
- Tai san ca nhan: so tiet kiem va quy mo
- Thoi khoa bieu / lich ca nhan trong tuan
- Goc ghi chu, idea, task kieu notion mini

## Mo app

Mo file `index.html` trong trinh duyet, hoac double-click `open-app.bat`.

## Mang sang may khac

- Copy nguyen folder nay sang may moi la chay duoc
- Neu muon mang ca du lieu da nhap trong app, bam `Nhap du lieu` / `Xuat du lieu` de luu file JSON roi import lai o may moi

## Tinh nang hien co

- Luu du lieu bang `localStorage`
- Them, xoa giao dich
- Theo doi tong thu, tong chi, so du, budget con lai
- Xem top danh muc chi tieu trong thang
- Co menu module `Tien` va `Nhip Song`
- Trong module `Tien` co:
- `So tiet kiem 12 thang`: tinh lai theo tung ngay cho moi lan gui, chi dua tren lich su gui thuc te ban nhap
- `VESAF` va `VMEEF`: theo doi von da nap, so CCQ, gia tri hien tai, lai/lo tong, lai/lo hom nay
- Quỹ tinh `lai/lo tong` tren `gia von trung binh` va so tien ban da nap
- Co popup `Quan ly` cho tung quy de `Nap` them va `Cap nhat NAV`
- NAV hien tai dang duoc seed theo moc Fmarket `30/03/2026`; ban co the them moc NAV moi de cap nhat tiep
- Them lich ca nhan va xem su kien sap toi
- Xem lich theo `thang / tuan / ngay`
- Bam vao ngay de mo popup xem va sua truc tiep event / note
- Keo tha event giua cac ngay trong lich
- Hien note ngay le dac biet theo ca lich duong va lich am
- Them block note/task/idea, pin, done, xoa
- Gan note vao ngay cu the de hien cung lich
- Xuat va nhap du lieu dang JSON
- Khoi tao lai du lieu demo

## File chinh

- `index.html`: layout va cac form
- `styles.css`: giao dien
- `app.js`: logic luu du lieu va render dashboard
