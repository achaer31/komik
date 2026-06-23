# Komik Pilihanku

Mobile-first landing page dan custom checkout QRIS untuk produk digital
`100+ Komik Fantasi Digital Pilihan 2026`.

## Setup

```bash
npm install
npm run dev
```

## Environment variables

Tambahkan di environment hosting, jangan commit secret ke GitHub:

```bash
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_SITE_URL=https://komikpilihanku.vercel.app
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PRODUCT_MAIN_URL=https://drive.google.com/drive/folders/1JVkhWb0aNuCl9gxZ30dlmkTpQ48rYI0Z?usp=drive_link
PRODUCT_VIDEO_URL=https://docs.google.com/spreadsheets/d/16JI0yPynJ55UHPp4JNm_18AJsAwOp1Kxd7sYzOULEBA/edit?usp=drive_link
```

## Supabase table

```sql
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  email text not null,
  include_addon boolean default false,
  amount integer not null,
  status text default 'PENDING',
  xendit_payment_id text,
  xendit_reference_id text,
  qris_payload jsonb,
  qris_expires_at timestamptz,
  paid_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Xendit

1. Aktifkan QR Code/QRIS di akun Xendit.
2. Pastikan API key punya permission Money-in Write dan Money-in Read.
3. Set callback/webhook URL:
   `https://komikpilihanku.vercel.app/api/xendit/webhook`
4. Simpan verification/callback token sebagai `XENDIT_WEBHOOK_TOKEN`.
5. Test sandbox dulu sebelum live key dipakai.

Checkout memakai direct QR Code API `POST https://api.xendit.co/qr_codes`
dengan `type=DYNAMIC`, bukan hosted invoice/payment link.

## Resend

1. Verifikasi domain/sender di Resend.
2. Set `RESEND_API_KEY` dan `RESEND_FROM_EMAIL`.
3. Email akses dikirim hanya setelah webhook pembayaran sukses.

## Deploy

App ini memakai Next.js API routes untuk Xendit webhook, QRIS, Supabase, dan
Resend. Hosting harus mendukung Node.js/Next.js server runtime atau serverless
functions. Jika memakai Hostinger, gunakan paket/fitur yang mendukung Node.js
app, bukan static hosting biasa.
