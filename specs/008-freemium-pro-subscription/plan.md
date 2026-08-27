# Implementation Plan: Model Freemium dan Langganan Pro AksiCendekia

**Feature Branch**: `008-freemium-pro-subscription`
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/008-freemium-pro-subscription/spec.md)
**Data Model**: [data-model.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/008-freemium-pro-subscription/data-model.md)
**Research**: [research.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/008-freemium-pro-subscription/research.md)

---

## 1. Technical Architecture & Component Overview

```mermaid
flowchart TD
    subgraph Web Frontend ("apps/web")
        UpgradePage["Upgrade Page (/upgrade)"]
        SoftPaywallModal["Soft Paywall Modal"]
        BillingHistoryPage["Billing & Invoice Page (/settings/billing)"]
        AppHeader["Header & Past Due Grace Warning Banner"]
    end

    subgraph Fastify API Server ("apps/api")
        EntitlementService["Centralized EntitlementService"]
        SubscriptionService["Subscription & Checkout Engine"]
        PaymentWebhookHandler["Idempotent Payment Webhook Handler"]
        SignatureVerifier["Payment Signature Cryptographic Verifier"]
        InvoiceGenerator["Digital Invoice Builder"]
        StaleTxCleaner["Stale Pending Transaction Expirer"]
    end

    subgraph Consumer Modules ("apps/api/src/modules")
        LearningEngine["Learning Session Engine (Quota Check)"]
        GamificationEngine["Gamification & Powerups (Allowance Check)"]
        ParentDashboard["Parent Dashboard (Report Depth Check)"]
    end

    subgraph PostgreSQL Database ("Prisma ORM")
        PlansTable[(subscription_plans & plan_entitlement_configs)]
        SubsTable[(subscriptions)]
        TxTable[(payment_transactions)]
        InvoiceTable[(invoices)]
        ParentChildTable[(parent_child_links)]
    end

    UpgradePage --> SubscriptionService
    SoftPaywallModal --> UpgradePage
    BillingHistoryPage --> InvoiceGenerator

    LearningEngine --> EntitlementService
    GamificationEngine --> EntitlementService
    ParentDashboard --> EntitlementService

    SubscriptionService --> SignatureVerifier
    PaymentWebhookHandler --> SignatureVerifier
    PaymentWebhookHandler --> SubscriptionService

    EntitlementService --> SubsTable
    EntitlementService --> PlansTable
    EntitlementService --> ParentChildTable

    SubscriptionService --> SubsTable
    SubscriptionService --> TxTable
    InvoiceGenerator --> InvoiceTable
```

---

## 2. Proposed System Modules & Component Changes

### Backend Monorepo (`apps/api/src/modules/`)

#### 1. `entitlements` Module (`[NEW]`)
- `entitlements.routes.ts`: `GET /api/v1/entitlements/me`
- `entitlements.service.ts`:
  - `checkQuotaAccess(userId, entitlementKey, context)`: Evaluasi terpusat untuk batasan kuota.
  - `getUserEntitlements(userId)`: Resolusi tier (`FREE`, `PRO_PERSONAL`, `PRO_FAMILY`), kewarisan dari Orang Tua (`INHERITED_PARENT`), hitung penggunaan kuota harian berbasis zona waktu lokal pengguna (`00:00 local time reset`).

#### 2. `subscriptions` Module (`[NEW]`)
- `subscriptions.routes.ts`:
  - `POST /api/v1/subscriptions/checkout`: Inisiasi checkout pembayaran (dengan kalkulasi prorata upgrade).
  - `POST /api/v1/subscriptions/cancel`: Batalkan perpanjangan otomatis.
- `subscriptions.service.ts`: Pengelolaan siklus hidup langganan, transisi status (`PENDING_PAYMENT`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `EXPIRED`), hitung kredit prorata upgrade, penanganan pewarisan Paket Keluarga (maksimal 5 anak).

#### 3. `payments` Module (`[NEW]`)
- `payments.routes.ts`:
  - `POST /api/v1/payments/webhook`: Webhook handler konfirmasi pembayaran (idempoten & signature verification).
  - `GET /api/v1/payments/history`: Ambil riwayat transaksi pembayaran pengguna.
  - `GET /api/v1/payments/invoices/:invoiceId`: Rincian invoice digital (termasuk kalkulasi PPN 11%).
- `payments.service.ts` & `payment-signature.verifier.ts`: Verifikasi signature SHA-512/HMAC, proteksi replay attack, pembentukan invoice digital.

#### 4. Integrasi ke Consumer Modules (`[MODIFY]`)
- `apps/api/src/modules/learning-sessions/learning-sessions.service.ts`: Panggil `EntitlementService.checkQuotaAccess(userId, 'DAILY_SESSION_LIMIT')` sebelum membuat sesi belajar baru.
- `apps/api/src/modules/gamification/gamification.service.ts`: Panggil `EntitlementService.checkQuotaAccess(userId, 'DAILY_POWERUP_ALLOWANCE')` sebelum klaim power-up harian.
- `apps/api/src/modules/parent-dashboard/parent-dashboard.service.ts`: Panggil `EntitlementService.checkQuotaAccess(userId, 'PARENT_REPORT_DEPTH')` untuk menentukan kedalaman data laporan.

---

### Frontend Monorepo (`apps/web/`) & Design Tokens (`packages/design-tokens`)

#### 1. Halaman Upgrade & Matriks Komparasi Paket (`[NEW]`)
- `apps/web/app/upgrade/page.tsx`: Halaman responsif CTA "Tingkatkan ke Pro" yang menampilkan tabel perbandingan paket (Free vs Pro Personal vs Pro Keluarga) sesuai token visual AksiCendekia.
- `apps/web/components/subscriptions/PlanComparisonTable.tsx`: Komponen tabel matriks fitur dengan toggle billing cycle Bulanan / Tahunan (hemat 17%).

#### 2. Modal Soft Paywall (`[NEW]`)
- `apps/web/components/subscriptions/SoftPaywallModal.tsx`: Modal dialog elegan yang menangkap error HTTP 403 `PAYWALL_LIMIT_REACHED` dari API backend dan memberikan opsi upgrade atau "Kembali Besok".

#### 3. Riwayat Transaksi & Digital Invoice (`[NEW]`)
- `apps/web/app/settings/billing/page.tsx`: Halaman riwayat transaksi pembayaran dan unduh/lihat invoice digital resmi.
- `apps/web/components/subscriptions/InvoiceViewer.tsx`: Tampilan invoice digital terformat.

---

## 3. Database Migration & Seed Plan

### Prisma Migration
```bash
pnpm --filter api exec prisma migrate dev --name add_freemium_pro_subscriptions
```
Membuat tabel:
- `subscription_plans`
- `plan_entitlement_configs`
- `subscriptions`
- `payment_transactions`
- `invoices`

### Database Seeding
```bash
pnpm --filter api run seed:subscriptions
```
Mengisi data awal paket `FREE`, `PRO_PERSONAL`, `PRO_FAMILY` beserta matriks entitlement-nya.

---

## 4. Verification & Testing Plan

### Automated Tests (Vitest TDD)
- **Unit Tests**:
  - `entitlements.service.test.ts`: Pengujian evaluasi kuota gratis (3 sesi/hari), reset harian 00:00 local timezone, pewarisan Paket Keluarga, dan pencabutan real-time saat `ends_at` terlewati.
  - `payment-signature.verifier.test.ts`: Verifikasi signature valid vs invalid (HMAC / SHA-512).
  - `prorated-credit.test.ts`: Uji kalkulasi prorata upgrade dari Pro Personal ke Pro Keluarga.
- **Integration Tests**:
  - `webhook-idempotency.test.ts`: Pengiriman webhook berulang 10x untuk `order_id` yang sama -> Memastikan status transaksi diperbarui tepat 1x dan durasi langganan tidak berganda.
  - `paywall-enforcement.test.ts`: Request sesi belajar ke-4 pada tier Free mengembalikan error HTTP 403 `PAYWALL_LIMIT_REACHED`.

### Manual Verification
- Simulasi alur checkout Snap gateway di environment sandbox.
- Pengujian tampilan Halaman Upgrade dan Soft Paywall Modal pada berbagai ukuran layar (mobile & desktop) sesuai standar aksesibilitas WCAG 2.1 AA.
- Verifikasi bahwa 0 kredensial gateway pembayaran ter-hardcode di kode via pemindaian keamanan static analyzer.

---
