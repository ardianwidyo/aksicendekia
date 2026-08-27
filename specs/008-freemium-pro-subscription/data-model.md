# Data Model Specification: Model Freemium dan Langganan Pro AksiCendekia

**Feature Branch**: `008-freemium-pro-subscription`
**Date**: 2026-08-27
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/008-freemium-pro-subscription/spec.md)

---

## 1. Prisma Schema Amendments

Modul ini menambah entitas baru pada `apps/api/prisma/schema.prisma` serta memperbarui relasi pada entitas `User`.

```prisma
// ==========================================
// Enums for Subscription & Entitlements
// ==========================================

enum PlanTier {
  FREE
  PRO_PERSONAL
  PRO_FAMILY
}

enum BillingCycle {
  MONTHLY
  ANNUAL
}

enum SubscriptionStatus {
  PENDING_PAYMENT
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}

enum PaymentStatus {
  PENDING
  SETTLED
  FAILED
  EXPIRED
  REFUNDED
}

enum PaymentMethod {
  EWALLET
  VIRTUAL_ACCOUNT
  CREDIT_CARD
  QRIS
  BANK_TRANSFER
}

enum EntitlementKey {
  DAILY_SESSION_LIMIT
  SUBJECT_ACCESS_TIER
  DAILY_POWERUP_ALLOWANCE
  PARENT_REPORT_DEPTH
  FAMILY_MEMBER_CAPACITY
}

enum InvoiceStatus {
  UNPAID
  PAID
  VOID
}

// ==========================================
// Subscription Plan Definition Model
// ==========================================

model SubscriptionPlan {
  id                 String                  @id @default(uuid())
  code               PlanTier                @unique
  name               String
  description        String
  priceMonthlyIdr    Int                     @map("price_monthly_idr")
  priceAnnualIdr     Int                     @map("price_annual_idr")
  maxFamilyMembers   Int                     @default(0) @map("max_family_members")
  isActive           Boolean                 @default(true) @map("is_active")
  createdAt          DateTime                @default(now()) @map("created_at")
  updatedAt          DateTime                @updatedAt @map("updated_at")

  entitlements       PlanEntitlementConfig[]
  subscriptions      Subscription[]

  @@map("subscription_plans")
}

// ==========================================
// Plan Entitlement Configuration Model
// ==========================================

model PlanEntitlementConfig {
  id               String         @id @default(uuid())
  planId           String         @map("plan_id")
  entitlementKey   EntitlementKey @map("entitlement_key")
  entitlementValue String         @map("entitlement_value")
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")

  plan             SubscriptionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@unique([planId, entitlementKey])
  @@map("plan_entitlement_configs")
}

// ==========================================
// User Subscription Lifecycle Model
// ==========================================

model Subscription {
  id                      String             @id @default(uuid())
  userId                  String             @map("user_id")
  planId                  String             @map("plan_id")
  billingCycle            BillingCycle       @map("billing_cycle")
  status                  SubscriptionStatus @default(PENDING_PAYMENT)
  startsAt                DateTime           @map("starts_at")
  endsAt                  DateTime           @map("ends_at")
  gracePeriodEndsAt       DateTime?          @map("grace_period_ends_at")
  autoRenew               Boolean            @default(true) @map("auto_renew")
  paymentGatewayCustomerId String?           @map("payment_gateway_customer_id")
  createdAt               DateTime           @default(now()) @map("created_at")
  updatedAt               DateTime           @updatedAt @map("updated_at")

  user                    User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan                    SubscriptionPlan   @relation(fields: [planId], references: [id])
  transactions            PaymentTransaction[]

  @@index([userId, status])
  @@index([endsAt, status])
  @@map("subscriptions")
}

// ==========================================
// Payment Transaction Ledger Model
// ==========================================

model PaymentTransaction {
  id                   String        @id @default(uuid())
  orderId              String        @unique @map("order_id") // Unique payment gateway order reference
  subscriptionId       String        @map("subscription_id")
  userId               String        @map("user_id")
  grossAmountIdr       Int           @map("gross_amount_idr")
  taxAmountIdr         Int           @map("tax_amount_idr") // PPN 11%
  paymentMethod        PaymentMethod @map("payment_method")
  gatewayTransactionId String?       @map("gateway_transaction_id")
  snapToken            String?       @map("snap_token")
  snapRedirectUrl      String?       @map("snap_redirect_url")
  status               PaymentStatus @default(PENDING)
  rawGatewayResponse   Json?         @map("raw_gateway_response")
  paidAt               DateTime?     @map("paid_at")
  createdAt            DateTime      @default(now()) @map("created_at")
  updatedAt            DateTime      @updatedAt @map("updated_at")

  subscription         Subscription  @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  user                 User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoice              Invoice?

  @@index([orderId])
  @@index([userId, status])
  @@map("payment_transactions")
}

// ==========================================
// Digital Invoice Model
// ==========================================

model Invoice {
  id                   String        @id @default(uuid())
  invoiceNumber        String        @unique @map("invoice_number") // e.g. INV/2026/08/AC-00192
  paymentTransactionId String        @unique @map("payment_transaction_id")
  userId               String        @map("user_id")
  subtotalIdr          Int           @map("subtotal_idr")
  taxIdr               Int           @map("tax_idr") // PPN 11%
  totalIdr             Int           @map("total_idr")
  billingName          String        @map("billing_name")
  billingEmail         String        @map("billing_email")
  status               InvoiceStatus @default(UNPAID)
  issuedAt             DateTime      @default(now()) @map("issued_at")
  pdfUrl               String?       @map("pdf_url")
  createdAt            DateTime      @default(now()) @map("created_at")
  updatedAt            DateTime      @updatedAt @map("updated_at")

  transaction          PaymentTransaction @relation(fields: [paymentTransactionId], references: [id], onDelete: Cascade)
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("invoices")
}
```

---

## 2. Default Seed Data for Subscription Plans

```json
[
  {
    "code": "FREE",
    "name": "AksiCendekia Gratis",
    "description": "Paket dasar untuk belajar harian dengan fitur terbatas",
    "priceMonthlyIdr": 0,
    "priceAnnualIdr": 0,
    "maxFamilyMembers": 0,
    "entitlements": [
      { "entitlementKey": "DAILY_SESSION_LIMIT", "entitlementValue": "3" },
      { "entitlementKey": "SUBJECT_ACCESS_TIER", "entitlementValue": "BASIC" },
      { "entitlementKey": "DAILY_POWERUP_ALLOWANCE", "entitlementValue": "1" },
      { "entitlementKey": "PARENT_REPORT_DEPTH", "entitlementValue": "SUMMARY_ONLY" },
      { "entitlementKey": "FAMILY_MEMBER_CAPACITY", "entitlementValue": "0" }
    ]
  },
  {
    "code": "PRO_PERSONAL",
    "name": "AksiCendekia Pro Personal",
    "description": "Akses tanpa batas untuk 1 siswa dengan analisis mendalam",
    "priceMonthlyIdr": 49000,
    "priceAnnualIdr": 490000,
    "maxFamilyMembers": 0,
    "entitlements": [
      { "entitlementKey": "DAILY_SESSION_LIMIT", "entitlementValue": "-1" },
      { "entitlementKey": "SUBJECT_ACCESS_TIER", "entitlementValue": "ALL" },
      { "entitlementKey": "DAILY_POWERUP_ALLOWANCE", "entitlementValue": "5" },
      { "entitlementKey": "PARENT_REPORT_DEPTH", "entitlementValue": "FULL_ANALYTICS" },
      { "entitlementKey": "FAMILY_MEMBER_CAPACITY", "entitlementValue": "0" }
    ]
  },
  {
    "code": "PRO_FAMILY",
    "name": "AksiCendekia Pro Keluarga",
    "description": "Satu langganan orang tua untuk hingga 5 akun anak",
    "priceMonthlyIdr": 99000,
    "priceAnnualIdr": 990000,
    "maxFamilyMembers": 5,
    "entitlements": [
      { "entitlementKey": "DAILY_SESSION_LIMIT", "entitlementValue": "-1" },
      { "entitlementKey": "SUBJECT_ACCESS_TIER", "entitlementValue": "ALL" },
      { "entitlementKey": "DAILY_POWERUP_ALLOWANCE", "entitlementValue": "5" },
      { "entitlementKey": "PARENT_REPORT_DEPTH", "entitlementValue": "FULL_ANALYTICS" },
      { "entitlementKey": "FAMILY_MEMBER_CAPACITY", "entitlementValue": "5" }
    ]
  }
]
```

---

## 3. Data Transfer Objects (DTOs) & Zod Validation Schemas

### 3.1 Checkout Request Payload Schema
```typescript
import { z } from 'zod';

export const CheckoutSubscriptionSchema = z.object({
  planCode: z.enum(['PRO_PERSONAL', 'PRO_FAMILY']),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']),
  paymentMethod: z.enum(['EWALLET', 'VIRTUAL_ACCOUNT', 'CREDIT_CARD', 'QRIS', 'BANK_TRANSFER']),
  customerDetails: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
});

export type CheckoutSubscriptionInput = z.infer<typeof CheckoutSubscriptionSchema>;
```

### 3.2 Payment Gateway Webhook Payload Schema
```typescript
export const PaymentGatewayWebhookSchema = z.object({
  order_id: z.string().min(1),
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string().min(1),
  transaction_status: z.enum(['capture', 'settlement', 'pending', 'deny', 'expire', 'cancel']),
  payment_type: z.string(),
  transaction_id: z.string().optional(),
  transaction_time: z.string().optional(),
  fraud_status: z.string().optional(),
});

export type PaymentGatewayWebhookInput = z.infer<typeof PaymentGatewayWebhookSchema>;
```

### 3.3 Entitlement Evaluation Output Schema
```typescript
export const UserEntitlementsResponseSchema = z.object({
  tier: z.enum(['FREE', 'PRO_PERSONAL', 'PRO_FAMILY']),
  source: z.enum(['DIRECT', 'INHERITED_PARENT', 'DEFAULT_FREE']),
  isProActive: z.boolean(),
  endsAt: z.string().nullable(),
  entitlements: z.object({
    dailySessionLimit: z.number(), // -1 for unlimited, or e.g. 3
    dailySessionsUsed: z.number(),
    subjectAccessTier: z.enum(['BASIC', 'ALL']),
    dailyPowerupAllowance: z.number(),
    dailyPowerupsUsed: z.number(),
    parentReportDepth: z.enum(['SUMMARY_ONLY', 'FULL_ANALYTICS']),
    familyMemberCapacity: z.number(),
  }),
});

export type UserEntitlementsResponse = z.infer<typeof UserEntitlementsResponseSchema>;
```

---
