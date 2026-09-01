/**
 * Legacy sample lessons (Feature 010 / FR-031a).
 * The three ids that shipped hard-coded in apps/web/lib/guest-lessons.ts.
 * Their routes stay alive (no 404) but they are HIDDEN from the explore catalog,
 * and each points a visitor at its interactive equivalent.
 */

export interface LegacyLessonRef {
  id: string;
  title: string;
  educationStage: 'TK' | 'SD' | 'SMP' | 'SMA';
  supersededByLessonId: string;
}

export const LEGACY_LESSON_REFS: readonly LegacyLessonRef[] = [
  {
    id: 'lesson_m1',
    title: 'Mengenal Angka & Nilai Tempat',
    educationStage: 'SD',
    supersededByLessonId: 'sd-matematika-01',
  },
  {
    id: 'lesson_m2',
    title: 'Penjumlahan Dasar',
    educationStage: 'SD',
    supersededByLessonId: 'sd-matematika-03',
  },
  {
    id: 'lesson_i1',
    title: 'Membaca Pemahaman Sederhana',
    educationStage: 'SD',
    supersededByLessonId: 'sd-matematika-02',
  },
];

const BY_ID = new Map(LEGACY_LESSON_REFS.map((l) => [l.id, l]));

export function getLegacyLessonRef(id: string): LegacyLessonRef | undefined {
  return BY_ID.get(id);
}

export function isLegacyLessonId(id: string): boolean {
  return BY_ID.has(id);
}
