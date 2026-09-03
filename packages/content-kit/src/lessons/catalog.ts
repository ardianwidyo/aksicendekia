import type { EducationStage } from '../curriculum/achievements.js';
import type { InteractiveLesson, SdGradeLevel } from './types.js';
import { TK_LESSONS } from './tk.js';
import { SD_LESSONS, listForGrade, lessonsByGrade } from './sd/index.js';

export { listForGrade, lessonsByGrade };
import { SMP_LESSONS } from './smp.js';
import { SMA_LESSONS } from './sma.js';
import { LEGACY_LESSON_REFS } from './legacy.js';

/**
 * The interactive lesson catalog: 3 TK + 60 SD Matematika (Feature 011, kelas
 * 1-6) + 3 SMP + 3 SMA. Everything stays at REVIEW (FR-030a).
 */
export const INTERACTIVE_LESSONS: readonly InteractiveLesson[] = [
  ...TK_LESSONS,
  ...SD_LESSONS,
  ...SMP_LESSONS,
  ...SMA_LESSONS,
];

/** Feature 011 (T071) — per-grade catalog view for the kelas 1-6 explore/catalog UI. */
export function listForGradeLevel(gradeLevel: SdGradeLevel): InteractiveLesson[] {
  return listForGrade(gradeLevel);
}

const BY_ID = new Map(INTERACTIVE_LESSONS.map((l) => [l.id, l]));

export function getLessonById(id: string): InteractiveLesson | undefined {
  return BY_ID.get(id);
}

/** Catalog view for /explore — LISTED lessons only (FR-031a), optionally by stage. */
export function listForCatalog(stage?: EducationStage): InteractiveLesson[] {
  return INTERACTIVE_LESSONS.filter(
    (l) => l.listing === 'LISTED' && (stage ? l.educationStage === stage : true),
  ).sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Every routable lesson id — the 12 interactive lessons PLUS the 3 legacy ids.
 * Static-export `generateStaticParams` MUST use this (not the catalog view) so
 * legacy routes keep resolving instead of 404-ing.
 */
export function allLessonIds(): string[] {
  return [...INTERACTIVE_LESSONS.map((l) => l.id), ...LEGACY_LESSON_REFS.map((l) => l.id)];
}

export function lessonsByStage(): Record<EducationStage, InteractiveLesson[]> {
  return {
    TK: INTERACTIVE_LESSONS.filter((l) => l.educationStage === 'TK'),
    SD: INTERACTIVE_LESSONS.filter((l) => l.educationStage === 'SD'),
    SMP: INTERACTIVE_LESSONS.filter((l) => l.educationStage === 'SMP'),
    SMA: INTERACTIVE_LESSONS.filter((l) => l.educationStage === 'SMA'),
  };
}
