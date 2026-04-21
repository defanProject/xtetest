# XTE API — Full Stack

Backend + Frontend terintegrasi untuk XTE API.  
Struktur API endpoint lama **tidak diubah** — auth & dashboard ditambahkan di atasnya.

---

## Stack

- **Runtime**: Node.js v18+
- **Entry point**: `index.js` (sama seperti sebelumnya)
- **Port default**: `4000`
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (access token 1 jam + refresh token 7 hari via httpOnly cookie)
- **Password**: bcryptjs
- **Email OTP**: Nodemailer (SMTP)

---

## Struktur Folder

```
/
├── index.js                   ← Entry point (lama, sudah di-patch)
├── package.json               ← + deps baru (bcryptjs, jwt, supabase, cookie-parser)
├── .env.example               ← Template env
├── supabase-schema.sql        ← SQL untuk buat tabel di Supabase
├── api-page/                  ← HTML (auth, dash, docs sudah di-patch)
│   ├── index.html
│   ├── auth.html              ← ✅ Patched — real API call
│   ├── dash.html              ← ✅ Patched — real API call
│   ├── docs.html              ← ✅ Patched — cek token dari localStorage
│   ├── 404.html
│   └── 500.html
└── src/
    ├── api/                   ← Endpoint lama (tidak diubah)
    │   ├── anime/
    │   ├── download/
    │   ├── canvas/
    │   └── ...
    ├── routes/                ← ✅ Baru
    │   ├── auth.js            ← /api/auth/*
    │   └── dashboard.js       ← /api/dashboard/*
    ├── middleware/             ← ✅ Baru
    │   └── auth.js            ← JWT middleware
    └── utils/                 ← ✅ Baru
        ├── supabase.js
        ├── jwt.js
        └── mailer.js
```

---

## Cara Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Buat file `.env`

```bash
cp .env.example .env
```

Isi semua value:

```env
PORT=4000
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...    ← pakai service_role, bukan anon
JWT_SECRET=random-panjang-min-32-karakter
JWT_REFRESH_SECRET=random-lain-yang-berbeda
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=emailkamu@gmail.com
SMTP_PASS=app-password-16-karakter
SMTP_FROM="XTE API <emailkamu@gmail.com>"
BASE_URL=http://localhost:4000
```

> **BASE_URL** = origin server kamu. Dipakai CORS supaya browser boleh kirim request + cookie.  
> Kalau sudah domain: `BASE_URL=https://api.xte.web.id`

### 3. Setup Supabase

1. Buka project Supabase → **SQL Editor**
2. Paste isi `supabase-schema.sql` → klik **Run**
3. Tabel `users` otomatis terbuat

Ambil kredensial dari **Settings → API**:
- `SUPABASE_URL` = Project URL
- `SUPABASE_SERVICE_KEY` = key `service_role` *(bukan anon!)*

### 4. Setup Gmail SMTP

1. Aktifkan **2-Step Verification** di Google
2. Buka [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Buat App Password → isi ke `SMTP_PASS`

### 5. Jalankan

```bash
npm start        # production
npm run dev      # development (auto-restart)
```

---

## API Endpoints Baru

> Endpoint lama (`/anime/*`, `/download/*`, dll) tidak berubah sama sekali.

### Auth — `/api/auth`

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/auth/register` | Daftar, kirim OTP ke email |
| POST | `/api/auth/verify-otp` | Verifikasi OTP, aktifkan akun |
| POST | `/api/auth/resend-otp` | Kirim ulang OTP (max 3x/jam) |
| POST | `/api/auth/login` | Login, return JWT + set cookie |
| POST | `/api/auth/refresh` | Refresh access token dari cookie |
| POST | `/api/auth/logout` | Clear cookie |

### Dashboard — `/api/dashboard` *(butuh Bearer token)*

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/dashboard/me` | Data user |
| PATCH | `/api/dashboard/profile` | Update nama / email |
| POST | `/api/dashboard/regenerate-key` | Generate API key baru |

---

## Deploy PM2

```bash
npm install -g pm2
pm2 start index.js --name xte-api
pm2 startup && pm2 save
```

---

## Error Codes

| Code | Keterangan |
|------|-----------|
| `WEAK_PASSWORD` | Password tidak memenuhi syarat |
| `EMAIL_EXISTS` | Email sudah terdaftar |
| `INVALID_OTP` | Kode OTP salah |
| `OTP_EXPIRED` | OTP sudah expired |
| `NOT_VERIFIED` | Akun belum diverifikasi |
| `INVALID_CREDENTIALS` | Email / password salah |
| `TOKEN_EXPIRED` | JWT expired (frontend auto-refresh) |
| `RATE_LIMIT` | Resend OTP terlalu sering |
