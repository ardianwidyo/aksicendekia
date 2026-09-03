import type { InteractiveLesson, SdGradeLevel } from '../types.js';
import type { VideoEmbedRef } from '../../schema/video-embed.schema.js';
import { makePlaceValueLesson, type PlaceValueLessonSpec } from '../archetypes/place-value.js';
import { makeNumberLineLesson, type NumberLineLessonSpec } from '../archetypes/number-line.js';
import { makeFractionsLesson, type FractionsLessonSpec } from '../archetypes/fractions.js';
import { makeOperationsLesson, type OperationsLessonSpec } from '../archetypes/operations.js';
import { makeMeasurementLesson, type MeasurementLessonSpec } from '../archetypes/measurement.js';
import { makeGeometryLesson, type GeometryLessonSpec } from '../archetypes/geometry.js';
import { makeDataChartLesson, type DataChartLessonSpec } from '../archetypes/data-chart.js';
import { makeTimeLesson, type TimeLessonSpec } from '../archetypes/time.js';
import { makeMoneyLesson, type MoneyLessonSpec } from '../archetypes/money.js';
import { makePatternsLesson, type PatternsLessonSpec } from '../archetypes/patterns.js';
import { phaseForGrade } from '../archetypes/shared.js';

/**
 * Feature 011 — the thin dispatcher that lets a `kelas-{n}.ts` file stay pure
 * data (contracts/lesson-authoring.md). A `LessonBrief` names an archetype, the
 * curriculum element it covers, and the archetype `params`; `buildGrade` turns a
 * list of briefs into `{ lessons, videos }` — assigning a contiguous
 * `orderIndex` (catalog invariant 5) and a matching `VideoEmbedRef` per lesson
 * so invariant 8 holds without hand-writing 60 registry rows.
 */

export type CurriculumElementKey = 'bilangan' | 'aljabar' | 'pengukuran' | 'geometri' | 'data';

const ELEMENT_SUFFIX: Record<CurriculumElementKey, string> = {
  bilangan: 'bilangan',
  aljabar: 'aljabar',
  pengukuran: 'pengukuran',
  geometri: 'geometri',
  data: 'data-peluang',
};

const PHASE_LETTER: Record<ReturnType<typeof phaseForGrade>, string> = {
  FOUNDATION: 'a',
  FASE_A: 'a',
  FASE_B: 'b',
  FASE_C: 'c',
  FASE_D: 'd',
  FASE_E: 'e',
};

export function cpIdFor(grade: SdGradeLevel, element: CurriculumElementKey): string {
  return `cp-fase-${PHASE_LETTER[phaseForGrade(grade)]}-matematika-${ELEMENT_SUFFIX[element]}`;
}

type ArchetypeName =
  | 'place-value'
  | 'number-line'
  | 'fractions'
  | 'operations'
  | 'measurement'
  | 'geometry'
  | 'data-chart'
  | 'time'
  | 'money'
  | 'patterns';

interface CommonBrief {
  id: string;
  element: CurriculumElementKey;
  unitTitle: string;
  title: string;
  summary: string;
  learningObjective: string;
  difficultyLevel?: InteractiveLesson['difficultyLevel'];
  estimatedDurationMinutes?: number;
  questionCount?: number;
}

export type LessonBrief =
  | (CommonBrief & { archetype: 'place-value'; params: PlaceValueLessonSpec['params'] })
  | (CommonBrief & { archetype: 'number-line'; params: NumberLineLessonSpec['params'] })
  | (CommonBrief & { archetype: 'fractions'; params: FractionsLessonSpec['params'] })
  | (CommonBrief & { archetype: 'operations'; params: OperationsLessonSpec['params'] })
  | (CommonBrief & { archetype: 'measurement'; params: MeasurementLessonSpec['params'] })
  | (CommonBrief & { archetype: 'geometry'; params: GeometryLessonSpec['params'] })
  | (CommonBrief & { archetype: 'data-chart'; params: DataChartLessonSpec['params'] })
  | (CommonBrief & { archetype: 'time'; params: TimeLessonSpec['params'] })
  | (CommonBrief & { archetype: 'money'; params: MoneyLessonSpec['params'] })
  | (CommonBrief & { archetype: 'patterns'; params: PatternsLessonSpec['params'] });

/** Deterministic 11-char YouTube-shaped id derived from the lesson id (real ids land in T083/T095). */
function placeholderExternalId(lessonId: string): string {
  const cleaned = lessonId.replace(/[^A-Za-z0-9_-]/g, '');
  const filler = 'abcdefghijk';
  return (cleaned + filler).slice(0, 11).padEnd(11, '_');
}

function makeVideoRef(grade: SdGradeLevel, lessonId: string, title: string): VideoEmbedRef {
  return {
    id: `yt-${lessonId}`,
    provider: 'YOUTUBE',
    externalId: placeholderExternalId(lessonId),
    title: `Video: ${title}`,
    publisherName: 'AksiCendekia Studio',
    posterStorageKey: `assets/lessons/sd/kelas-${grade}/${lessonId}-poster.svg`,
    transcriptText: `Ringkasan video untuk pelajaran "${title}". Transkrip lengkap ditambahkan pada tahap produksi media (US3).`,
    verifiedAt: '2026-09-02',
  };
}

const BUILDERS = {
  'place-value': makePlaceValueLesson,
  'number-line': makeNumberLineLesson,
  fractions: makeFractionsLesson,
  operations: makeOperationsLesson,
  measurement: makeMeasurementLesson,
  geometry: makeGeometryLesson,
  'data-chart': makeDataChartLesson,
  time: makeTimeLesson,
  money: makeMoneyLesson,
  patterns: makePatternsLesson,
} as const;

export interface GradeCatalog {
  lessons: InteractiveLesson[];
  videos: VideoEmbedRef[];
}

export function buildGrade(grade: SdGradeLevel, briefs: readonly LessonBrief[]): GradeCatalog {
  const ids = new Set<string>();
  const titles = new Set<string>();
  const lessons: InteractiveLesson[] = [];
  const videos: VideoEmbedRef[] = [];

  briefs.forEach((brief, index) => {
    if (ids.has(brief.id)) throw new Error(`kelas-${grade}: id pelajaran duplikat "${brief.id}".`);
    ids.add(brief.id);
    const titleKey = brief.title.trim().toLowerCase();
    if (titles.has(titleKey)) {
      throw new Error(`kelas-${grade}: judul duplikat dalam satu kelas "${brief.title}".`);
    }
    titles.add(titleKey);

    const videoEmbedId = `yt-${brief.id}`;
    const spec = {
      id: brief.id,
      gradeLevel: grade,
      curriculumAchievementId: cpIdFor(grade, brief.element),
      unitTitle: brief.unitTitle,
      title: brief.title,
      summary: brief.summary,
      learningObjective: brief.learningObjective,
      orderIndex: index,
      videoEmbedId,
      difficultyLevel: brief.difficultyLevel,
      estimatedDurationMinutes: brief.estimatedDurationMinutes,
      questionCount: brief.questionCount,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: brief.params as any,
    };
    const build = BUILDERS[brief.archetype];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lessons.push(build(spec as any));
    videos.push(makeVideoRef(grade, brief.id, brief.title));
  });

  return { lessons, videos };
}
