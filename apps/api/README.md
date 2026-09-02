# @aksicendekia/api

Fastify + Prisma backend for AksiCendekia.

## Content preview switch (Feature 010 / FR-030b)

`CONTENT_PREVIEW_INCLUDE_REVIEW` lets `GET /api/v1/public/lessons/:id` also serve
`REVIEW`-status lessons (not just `PUBLISHED`), so interactive content produced by
this feature can be validated end-to-end before a human publishes it.

- Default: unset / `false` — only `PUBLISHED` lessons are ever served publicly.
- Must be `false` (or unset) whenever `NODE_ENV=production`. `public-content.controller.ts`
  ignores the switch outside a non-production `NODE_ENV` as a first line of defense, and
  `buildApp()` (`src/app.ts`) calls `assertProductionPreviewGuards()`
  (`src/common/env/production-guard.ts`) at startup, which throws if the switch is
  `true` while `NODE_ENV=production` — a misconfigured production deploy fails to
  boot instead of silently being safe-by-luck.
- Only ever set it locally or in a non-production preview environment.
