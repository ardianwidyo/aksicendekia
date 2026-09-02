# @aksicendekia/web

Next.js (App Router, static export) frontend for AksiCendekia.

## Content preview switch (Feature 010 / FR-030b)

`NEXT_PUBLIC_CONTENT_PREVIEW` gates client-side visibility of `REVIEW`-status
interactive content (e.g. legacy-route banners, admin preview affordances) so the
feature can be validated end-to-end before a lesson is published.

- Default: unset / `false`.
- `pnpm build` (`next build`) runs `scripts/assert-production-guards.js` first,
  which fails the build with a non-zero exit if `NEXT_PUBLIC_CONTENT_PREVIEW=true`
  is set — `next build` always produces this app's production static export, so
  the switch must never be on for it.
- Only ever set it for local development.

## Scripts

- `pnpm dev` — Next.js dev server.
- `pnpm build` — production guard check, then `next build` (static export to `out/`).
- `pnpm test` — Vitest unit/component tests.
