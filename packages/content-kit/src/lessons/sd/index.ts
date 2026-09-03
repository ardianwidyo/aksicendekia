import type { InteractiveLesson } from '../types.js';
import type { VideoEmbedRef } from '../../schema/video-embed.schema.js';
import { KELAS_1_LESSONS, KELAS_1_VIDEOS } from './kelas-1.js';
import { KELAS_2_LESSONS, KELAS_2_VIDEOS } from './kelas-2.js';
import { KELAS_3_LESSONS, KELAS_3_VIDEOS } from './kelas-3.js';
import { KELAS_4_LESSONS, KELAS_4_VIDEOS } from './kelas-4.js';
import { KELAS_5_LESSONS, KELAS_5_VIDEOS } from './kelas-5.js';
import { KELAS_6_LESSONS, KELAS_6_VIDEOS } from './kelas-6.js';

export {
  KELAS_1_LESSONS,
  KELAS_2_LESSONS,
  KELAS_3_LESSONS,
  KELAS_4_LESSONS,
  KELAS_5_LESSONS,
  KELAS_6_LESSONS,
};

/**
 * Feature 011 (T070) — replaces the old hand-authored `lessons/sd.ts`. The SD
 * Matematika catalog is now 60 lessons (10 per grade, kelas 1-6), each produced
 * by an archetype factory from a data brief in `kelas-{n}.ts`. All stay at
 * REVIEW (FR-030a); ordering is per-grade via each lesson's `orderIndex`.
 */
export const SD_LESSONS: InteractiveLesson[] = [
  ...KELAS_1_LESSONS,
  ...KELAS_2_LESSONS,
  ...KELAS_3_LESSONS,
  ...KELAS_4_LESSONS,
  ...KELAS_5_LESSONS,
  ...KELAS_6_LESSONS,
];

/**
 * One `VideoEmbedRef` per lesson, aggregated from the grade files. Consumed by
 * `video-registry.ts` (T083) to populate `VIDEO_REGISTRY`; kept here so catalog
 * invariant 8 (every embedded VIDEO block resolves + self-hosted poster) can be
 * checked at US2 scale before the registry itself is wired.
 */
export const SD_VIDEO_REFS: VideoEmbedRef[] = [
  ...KELAS_1_VIDEOS,
  ...KELAS_2_VIDEOS,
  ...KELAS_3_VIDEOS,
  ...KELAS_4_VIDEOS,
  ...KELAS_5_VIDEOS,
  ...KELAS_6_VIDEOS,
];

const LESSONS_BY_GRADE: Record<number, InteractiveLesson[]> = {
  1: KELAS_1_LESSONS,
  2: KELAS_2_LESSONS,
  3: KELAS_3_LESSONS,
  4: KELAS_4_LESSONS,
  5: KELAS_5_LESSONS,
  6: KELAS_6_LESSONS,
};

/** Lessons for one SD grade, ordered by `orderIndex` (FR-010). */
export function listForGrade(gradeLevel: number): InteractiveLesson[] {
  return [...(LESSONS_BY_GRADE[gradeLevel] ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
}

/** All 6 grade buckets, each ordered by `orderIndex`. */
export function lessonsByGrade(): Record<1 | 2 | 3 | 4 | 5 | 6, InteractiveLesson[]> {
  return {
    1: listForGrade(1),
    2: listForGrade(2),
    3: listForGrade(3),
    4: listForGrade(4),
    5: listForGrade(5),
    6: listForGrade(6),
  };
}
