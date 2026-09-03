# @aksicendekia/content-kit

Canonical source of truth for interactive lesson content, the widget catalog, and
pure grading logic (Feature 010). Deliberately free of React and Prisma
dependencies so both `apps/web` (static export, bundles this at build time) and
`apps/api` (seed pipeline + server-side grading) can import it without pulling in
a UI or database runtime.

## Authoring a new interactive lesson

Lessons live under `src/lessons/<stage>.ts` (`tk.ts`, `sd.ts`, `smp.ts`, `sma.ts`),
one exported array (`TK_LESSONS`, `SD_LESSONS`, ...) per stage. Each entry is an
`InteractiveLesson` (`src/lessons/types.ts`):

- `contentBlocks: LessonBlockInput[]` — the ordered concept walkthrough. At least
  one `ILLUSTRATION`/`ANIMATION` block **and** one `INTERACTIVE_WIDGET` block are
  required (gate C2). Widget instances are `{ widgetType, params }`, validated
  against `src/schema/widget-params.schema.ts` — see
  `../../specs/010-interactive-lesson-content/contracts/widget-catalog.contract.md`
  for the 7 supported `widgetType`s and their parameters.
- `questions: LessonQuestionInput[]` — 10 per lesson, `contentPayload` includes the
  answer key (stripped before reaching an authenticated student — see
  `apps/api/src/modules/session/session-mapper.ts`).
- `curriculumAchievementId` — must reference a row in
  `src/curriculum/achievements.ts`. Achievement text is a **verbatim quote** from
  an official Kemendikbudristek document, never model-authored prose (R9) — an
  empty/missing citation is preferred over an invented one.
- `status` — always `'REVIEW'`. Nothing in this package, the seed pipeline, or any
  script may write `'PUBLISHED'` (FR-030a) — see
  `apps/api/src/modules/content-blocks/publish.service.ts`, the only code path
  allowed to do so, and its accompanying static guard test
  (`__tests__/publish-authority.spec.ts`).
- TK-stage lessons (`educationStage: 'TK'`) must give every question option an
  `illustrationAssetId` and every block/question a `narrationText` (gates A7/A8) —
  TK content must be answerable without reading.

After adding or editing a lesson, run `pnpm --filter @aksicendekia/content-kit test`
— `lesson-catalog-validity.spec.ts` and `tk-readability.spec.ts` validate the shape
and TK-specific rules automatically.

## Widget catalog

`src/catalog/widget-catalog.ts` is the single source of truth for the 7 v1 widget
types (id, display name, support status, a11y notes). `apps/api`'s
`interactive_widget_types` table is just a seeded mirror for CMS display/filtering
— behavior and parameter validation always live here in code.

## Grading

`src/grading/grade-question.ts` (`gradeQuestion`) is the one grader for both the
authenticated session path (`apps/api`) and Guest Mode (`apps/web`). It accepts
both camelCase and snake_case payload key conventions (a historical divergence
between the two call sites) and normalizes them internally — see
`src/schema/question-payload.schema.ts`.

## Preview switches & the publish flow

Everything produced by this package stops at `REVIEW`. Turning a lesson from
`REVIEW` into `PUBLISHED` — the only status the production public API serves — is
a human action through the CMS `POST /api/v1/admin/lessons/:id/publish` endpoint
(`apps/api/src/modules/content-blocks/publish.service.ts`), gated by the
accessibility (A1–A8) and curriculum (C1–C3) checks in
`accessibility-gate.ts`/`curriculum-gate.ts`. To validate a `REVIEW` lesson
end-to-end before it's published, use the non-production preview switches
documented in `apps/api/README.md` and `apps/web/README.md`
(`CONTENT_PREVIEW_INCLUDE_REVIEW`, `NEXT_PUBLIC_CONTENT_PREVIEW`) — both must stay
`false` in production, and both builds/startups assert that.
