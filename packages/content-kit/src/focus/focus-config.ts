import { z } from 'zod';
import type { EducationStage } from '../curriculum/achievements.js';

/**
 * Feature 011 — the single source of truth for "focus mode": which
 * education stage(s) and subject(s) the app currently surfaces
 * (contracts/focus-config.md, FR-001..FR-006).
 *
 * Read once from build-time env (`NEXT_PUBLIC_FOCUS_ENABLED` for apps/web,
 * `FOCUS_ENABLED` for apps/api) and cached. Every predicate below is a pure
 * function — no network, no database, no localStorage — so it is safe to
 * call from `generateStaticParams`, from a Fastify service, or from a React
 * component, without pulling in a framework dependency here.
 */

export interface FocusConfig {
  readonly enabled: boolean;
  readonly stages: readonly EducationStage[];
  readonly subjectCodes: readonly string[];
  readonly redirectTarget: string;
}

const focusConfigSchema = z
  .object({
    enabled: z.boolean(),
    stages: z.array(z.enum(['TK', 'SD', 'SMP', 'SMA'])),
    subjectCodes: z.array(z.string().min(1)),
    redirectTarget: z.string().min(1),
  })
  .refine((c) => !c.enabled || c.stages.length > 0, {
    message: 'FocusConfig.stages tidak boleh kosong saat enabled=true.',
  })
  .refine((c) => !c.enabled || c.subjectCodes.length > 0, {
    message: 'FocusConfig.subjectCodes tidak boleh kosong saat enabled=true.',
  });

const DEFAULT_STAGES: readonly EducationStage[] = ['SD'];
const DEFAULT_SUBJECT_CODES: readonly string[] = ['MATH_SD'];
const DEFAULT_REDIRECT_TARGET = '/explore';

/** `'false'` (case-insensitive) disables focus mode; anything else, including unset, enables it. */
function readEnabledFromEnv(): boolean {
  const raw = process.env.NEXT_PUBLIC_FOCUS_ENABLED ?? process.env.FOCUS_ENABLED;
  return raw?.trim().toLowerCase() !== 'false';
}

let cached: FocusConfig | undefined;

/** Exposed for tests only — env vars are read once per process otherwise. */
export function resetFocusConfigCache(): void {
  cached = undefined;
}

export function getFocusConfig(): FocusConfig {
  if (cached) return cached;
  const candidate: FocusConfig = {
    enabled: readEnabledFromEnv(),
    stages: DEFAULT_STAGES,
    subjectCodes: DEFAULT_SUBJECT_CODES,
    redirectTarget: DEFAULT_REDIRECT_TARGET,
  };
  const result = focusConfigSchema.safeParse(candidate);
  if (!result.success) {
    // Fail fast at the boundary (Constitution IV) — a malformed focus config
    // must not silently fall through to "everything hidden" or "everything shown".
    throw new Error(`FocusConfig tidak valid: ${result.error.message}`);
  }
  cached = candidate;
  return candidate;
}

export function isStageInFocus(stage: EducationStage): boolean {
  const config = getFocusConfig();
  return !config.enabled || config.stages.includes(stage);
}

export function isSubjectInFocus(subjectCode: string): boolean {
  const config = getFocusConfig();
  return !config.enabled || config.subjectCodes.includes(subjectCode);
}

export interface FocusableLesson {
  educationStage: EducationStage;
  subjectCode: string;
}

export function isLessonInFocus(lesson: FocusableLesson): boolean {
  return isStageInFocus(lesson.educationStage) && isSubjectInFocus(lesson.subjectCode);
}

/** Generic so it works on Prisma rows and content-kit lesson objects alike. */
export function filterLessonsForFocus<T extends FocusableLesson>(items: readonly T[]): T[] {
  if (!getFocusConfig().enabled) return [...items];
  return items.filter((item) => isLessonInFocus(item));
}

export function focusRedirectTarget(): string {
  return getFocusConfig().redirectTarget;
}
