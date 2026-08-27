# Quickstart Guide: Model Freemium dan Langganan Pro AksiCendekia

**Feature Branch**: `008-freemium-pro-subscription`
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/008-freemium-pro-subscription/spec.md)

---

## 1. Prerequisites & Environment Setup

Pastikan Anda berada di direktori utama `aksicendekia` dengan Node.js v18+ dan pnpm terinstal.

### Konfigurasi Variabel Environment (`apps/api/.env`)
> [!IMPORTANT]
> DILARANG menuliskan kredensial rahasia secara hardcoded di kode. Gunakan variabel environment di `.env` lokal Anda:

```env
PAYMENT_GATEWAY_CLIENT_KEY="SB-Mid-client-sample-key"
PAYMENT_GATEWAY_SERVER_KEY="SB-Mid-server-sample-key"
PAYMENT_GATEWAY_WEBHOOK_SECRET="sample-webhook-secret-hash"
```

### Jalankan Migrasi & Client Prisma
```bash
# Migration database
pnpm --filter api exec prisma migrate dev --name add_freemium_pro_subscriptions

# Generate Prisma Client
pnpm --filter api exec prisma generate
```

---

## 2. Seed Test Data

Jalankan script seed untuk memasukkan definisi paket `FREE`, `PRO_PERSONAL`, `PRO_FAMILY` serta akun pengujian:

```bash
pnpm --filter api run seed:subscriptions
```

Akun Pengujian yang Tersedia:
- **Free Student User**: `siswa.gratis@aksicendekia.id` / `Password123!` (Siswa paket Gratis, 3 sesi/hari)
- **Pro Parent User**: `ortu.pro@aksicendekia.id` / `Password123!` (Pemilik paket `PRO_FAMILY` aktif)
- **Linked Child User**: `anak.pro@aksicendekia.id` / `Password123!` (Anak terhubung yang mewarisi Pro)

---

## 3. Jalankan Dev Server

```bash
pnpm dev
```

- Backend Fastify API: `http://localhost:3001`
- Web Frontend: `http://localhost:3000`

---

## 4. Pengujian Manual & Endpoint Flows

### A. Pengujian Entitlement User Gratis & Soft Paywall
1. Login sebagai `siswa.gratis@aksicendekia.id`.
2. Panggil `GET http://localhost:3001/api/v1/entitlements/me` -> Verifikasi `tier: "FREE"`, `dailySessionLimit: 3`.
3. Jalankan 3 sesi belajar -> Sesi ke-4 memicu HTTP 403 `PAYWALL_LIMIT_REACHED`.
4. Verifikasi bahwa UI menampilkan **Soft Paywall Modal** dengan CTA "Tingkatkan ke Pro".

### B. Simulasi Checkout & Webhook Konfirmasi
1. Login sebagai `ortu.pro@aksicendekia.id`.
2. Kirim request checkout:
   ```bash
   curl -X POST http://localhost:3001/api/v1/subscriptions/checkout \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -d '{"planCode":"PRO_FAMILY","billingCycle":"MONTHLY","paymentMethod":"QRIS"}'
   ```
   *Menerima `orderId` dan `snapToken`.*

3. Simulasi Webhook Konfirmasi Payment Gateway:
   ```bash
   curl -X POST http://localhost:3001/api/v1/payments/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "order_id": "<ORDER_ID_FROM_CHECKOUT>",
       "status_code": "200",
       "gross_amount": "99000",
       "signature_key": "<VALID_SHA512_HASH>",
       "transaction_status": "settlement",
       "payment_type": "qris"
     }'
   ```
4. Ulangi cURL webhook ke-2x untuk `order_id` yang sama -> Verifikasi HTTP 200 OK dengan respons idempoten `Transaction already settled`.

### C. Pengujian Pewarisan Paket Keluarga
1. Login sebagai `anak.pro@aksicendekia.id` (anak dari `ortu.pro@aksicendekia.id`).
2. Panggil `GET http://localhost:3001/api/v1/entitlements/me`.
3. Verifikasi respons: `tier: "PRO_FAMILY"`, `source: "INHERITED_PARENT"`, `isProActive: true`.

---

## 5. Menjalankan Pengujian Otomatis (Vitest TDD)

```bash
# Jalankan seluruh unit & integration test untuk fitur subscription
pnpm --filter api test subscriptions entitlements payments
```
