// @aksicendekia/content-kit — canonical source of truth for interactive lesson
// content, the widget catalog, pure grading logic, and the 12 seeded lessons.
//
// Imported by:
//   - apps/web  (static export — content is bundled at build time)
//   - apps/api  (prisma seed + server-side grading)
//   - packages/ui (widget param schemas, question payload types)
//
// This package MUST stay free of React and Prisma dependencies so both apps can
// import it without pulling a UI or DB runtime.

export * from './schema/media-asset.schema.js';
export * from './schema/widget-params.schema.js';
export * from './schema/content-block.schema.js';
export * from './schema/question-payload.schema.js';
export * from './grading/normalize.js';
export * from './grading/grade-question.js';
export * from './catalog/widget-catalog.js';
export * from './curriculum/achievements.js';
export * from './lessons/types.js';
export * from './lessons/legacy.js';
export * from './lessons/catalog.js';
