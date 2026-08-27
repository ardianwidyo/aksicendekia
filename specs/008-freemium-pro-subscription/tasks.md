# Implementation Tasks: Model Freemium dan Langganan Pro AksiCendekia

**Feature Branch**: `008-freemium-pro-subscription`
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/008-freemium-pro-subscription/spec.md)
**Plan**: [plan.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/008-freemium-pro-subscription/plan.md)
**Data Model**: [data-model.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/008-freemium-pro-subscription/data-model.md)

---

## Phase 1: Database Schema & Migrations

- [x] **Task 1.1**: Update `apps/api/prisma/schema.prisma` with Enums (`PlanTier`, `BillingCycle`, `SubscriptionStatus`, `PaymentStatus`, `PaymentMethod`, `EntitlementKey`, `InvoiceStatus`).
- [x] **Task 1.2**: Add models `SubscriptionPlan`, `PlanEntitlementConfig`, `Subscription`, `PaymentTransaction`, and `Invoice`.
- [x] **Task 1.3**: Execute Prisma migration `add_freemium_pro_subscriptions`.
- [x] **Task 1.4**: Run `pnpm --filter api exec prisma generate` to refresh Prisma Client types.
- [x] **Task 1.5**: Create seed script `apps/api/prisma/seed-subscriptions.ts` populating `FREE`, `PRO_PERSONAL`, and `PRO_FAMILY` plans with entitlement configs, and register `seed:subscriptions` in `package.json`.

---

## Phase 2: Centralized Entitlement Layer (`apps/api/src/modules/entitlements`)

- [x] **Task 2.1**: Implement `EntitlementService.getUserEntitlements(userId)` resolving direct user subscription vs inherited Family Plan from parent via `ParentChildLink`.
- [x] **Task 2.2**: Implement `EntitlementService.checkQuotaAccess(userId, entitlementKey, context)` enforcing `DAILY_SESSION_LIMIT`, `DAILY_POWERUP_ALLOWANCE`, `SUBJECT_ACCESS_TIER`, and `PARENT_REPORT_DEPTH` with 00:00 local timezone quota reset (`timezone`).
- [x] **Task 2.3**: Implement `GET /api/v1/entitlements/me` route in `entitlements.controller.ts`.
- [x] **Task 2.4**: Write unit tests for `EntitlementService` in `entitlements.service.test.ts` verifying quota enforcement, Family Plan inheritance, and real-time expiration cutoff.

---

## Phase 3: Subscription & Checkout Engine (`apps/api/src/modules/subscriptions`)

- [x] **Task 3.1**: Implement `POST /api/v1/subscriptions/checkout` route and service with Zod validation.
- [x] **Task 3.2**: Implement prorated credit calculation in `subscriptions.service.ts` for mid-cycle upgrades from `PRO_PERSONAL` to `PRO_FAMILY`.
- [x] **Task 3.3**: Implement `POST /api/v1/subscriptions/cancel` to disable auto-renewal (`autoRenew = false`) while keeping status active until `endsAt`.
- [x] **Task 3.4**: Implement 24-hour auto-expiration logic for stale `PENDING` payment transactions.
- [x] **Task 3.5**: Write unit and integration tests for checkout, prorata upgrade calculation, and cancellation.

---

## Phase 4: Payment Webhook, Signature Verification & Invoicing (`apps/api/src/modules/payments`)

- [x] **Task 4.1**: Implement cryptographic signature verifier `payment-signature.verifier.ts` validating SHA-512 / HMAC hashes using `PAYMENT_GATEWAY_SERVER_KEY`.
- [x] **Task 4.2**: Implement `POST /api/v1/payments/webhook` handler with DB idempotency locking on `orderId` to prevent subscription duration duplication.
- [x] **Task 4.3**: Implement `GET /api/v1/payments/history` for user transaction history ledger.
- [x] **Task 4.4**: Implement `GET /api/v1/payments/invoices/:invoiceId` generating formatted digital invoice details with PPN 11%.
- [x] **Task 4.5**: Write integration tests simulating 10x webhook retries for idempotency verification and invalid signature rejection (HTTP 401).

---

## Phase 5: Integration with Consumer Feature Modules

- [x] **Task 5.1**: Integrate `EntitlementService.checkQuotaAccess(userId, 'DAILY_SESSION_LIMIT')` into `SessionService.createSession` (`apps/api/src/modules/session/session.service.ts`), returning HTTP 403 `PAYWALL_LIMIT_REACHED` on quota depletion.
- [x] **Task 5.2**: Integrate `EntitlementService.checkQuotaAccess(userId, 'DAILY_POWERUP_ALLOWANCE')` into `GamificationService` for power-up claims.
- [x] **Task 5.3**: Integrate `EntitlementService.checkQuotaAccess(userId, 'PARENT_REPORT_DEPTH')` into `ParentDashboardService`.

---

## Phase 6: Frontend Upgrade Page, Soft Paywall & Invoices (`apps/web`)

- [x] **Task 6.1**: Build Upgrade Page (`apps/web/app/upgrade/page.tsx`) with Plan Comparison Table (`FREE`, `PRO_PERSONAL`, `PRO_FAMILY`), billing cycle toggle (Monthly/Annual), and CTA "Tingkatkan ke Pro".
- [x] **Task 6.2**: Build Soft Paywall Modal component (`apps/web/components/subscriptions/SoftPaywallModal.tsx`) capturing HTTP 403 `PAYWALL_LIMIT_REACHED` API error and providing upgrade option.
- [x] **Task 6.3**: Build Past Due Grace Warning Banner in App Header when user subscription is in `PAST_DUE` state (7-day grace period).
- [x] **Task 6.4**: Build Billing & Invoices Page (`apps/web/app/settings/billing/page.tsx`) displaying transaction history and digital invoice viewer (`InvoiceViewer.tsx`).

---

## Phase 7: Verification, Security & Type Checking

- [x] **Task 7.1**: Run static security scan to verify zero payment gateway credentials are hardcoded.
- [x] **Task 7.2**: Run full Vitest test suite (`pnpm --filter api test`) verifying minimum 80% coverage threshold.
- [x] **Task 7.3**: Run `tsc --noEmit` across workspace to ensure zero compiler errors.
