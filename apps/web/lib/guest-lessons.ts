import {
  INTERACTIVE_LESSONS,
  getLessonById,
  listForCatalog,
  listForGrade,
  getVideoEmbed,
  allLessonIds as contentKitAllLessonIds,
  getLegacyLessonRef,
  type InteractiveLesson,
  type LessonBlockInput,
} from '@aksicendekia/content-kit';

export interface QuestionItem {
  id: string;
  questionType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'MATCHING_PAIRS' | 'DRAG_DROP_GROUPING' | 'NUMBER_LINE';
  promptText: string;
  contentPayload: {
    options?: { id: string; text: string; illustrationAssetId?: string }[];
    correct_option_id?: string;
    correctOptionId?: string;
    matching_mode?: 'EXACT' | 'CASE_INSENSITIVE' | 'NORMALIZED';
    matchingMode?: 'EXACT' | 'CASE_INSENSITIVE' | 'NORMALIZED';
    accepted_answers?: string[];
    acceptedAnswers?: string[];
    explanation?: string;
    narrationText?: string;
    // interactive question types (DRAG_DROP_GROUPING / NUMBER_LINE)
    items?: { id: string; label: string; illustrationAssetId?: string }[];
    groups?: { id: string; label: string }[];
    correctMapping?: Record<string, string>;
    requireAllPlaced?: boolean;
    min?: number;
    max?: number;
    step?: number;
    targetValue?: number;
    tolerance?: number;
    [key: string]: unknown;
  };
  hints?: { stepOrder: number; hintText: string }[];
}

export interface GuestLesson {
  id: string;
  title: string;
  summary: string;
  learningObjective: string;
  educationStage: string;
  difficultyLevel: string;
  estimatedDurationMinutes: number;
  questionItems: QuestionItem[];
}

export const GUEST_LESSONS_CATALOG: Record<string, GuestLesson> = {
  lesson_m1: {
    id: 'lesson_m1',
    title: 'Mengenal Angka & Nilai Tempat',
    summary: 'Pahami konsep satuan, puluhan, dan ratusan dengan ilustrasi bilangan nyata.',
    learningObjective: 'Siswa mampu membaca dan menguraikan nilai tempat bilangan cacah hingga 100.',
    educationStage: 'SD',
    difficultyLevel: 'BEGINNER',
    estimatedDurationMinutes: 10,
    questionItems: [
      {
        id: 'q1',
        questionType: 'MULTIPLE_CHOICE',
        promptText: 'Berapakah jumlah puluhan pada angka 45?',
        contentPayload: {
          options: [
            { id: 'opt_a', text: '4 (Empat Puluhan)' },
            { id: 'opt_b', text: '5 (Lima Puluhan)' },
            { id: 'opt_c', text: '45 (Empat Puluh Lima)' },
          ],
          correct_option_id: 'opt_a',
          explanation: 'Angka 45 terdiri dari 4 puluhan (40) dan 5 satuan (5).',
        },
        hints: [{ stepOrder: 1, hintText: 'Perhatikan angka di posisi puluhan (sebelah kiri).' }],
      },
      {
        id: 'q2',
        questionType: 'SHORT_ANSWER',
        promptText: 'Tuliskan nama bilangan dari lambang angka 10 dalam huruf kecil:',
        contentPayload: {
          matching_mode: 'NORMALIZED',
          accepted_answers: ['sepuluh'],
          explanation: 'Angka 10 dibaca sebagai "sepuluh".',
        },
        hints: [{ stepOrder: 1, hintText: 'Dimulai dengan huruf s dan diakhiri huruf h.' }],
      },
      {
        id: 'q3',
        questionType: 'MULTIPLE_CHOICE',
        promptText: 'Manakah lambang bilangan dari "Tujuh Puluh Dua"?',
        contentPayload: {
          options: [
            { id: 'opt_1', text: '27' },
            { id: 'opt_2', text: '72' },
            { id: 'opt_3', text: '702' },
          ],
          correct_option_id: 'opt_2',
          explanation: 'Tujuh puluh dua ditulis dengan lambang bilangan 72.',
        },
        hints: [{ stepOrder: 1, hintText: 'Angka 7 di depan sebagai puluhan dan 2 sebagai satuan.' }],
      },
    ],
  },
  lesson_m2: {
    id: 'lesson_m2',
    title: 'Penjumlahan & Pengurangan Cepat',
    summary: 'Latihan taktik berhitung penjumlahan dan pengurangan seru dan tangkas.',
    learningObjective: 'Siswa mampu menyelesaikan operasi penjumlahan dan pengurangan dasar secara akurat.',
    educationStage: 'SD',
    difficultyLevel: 'BEGINNER',
    estimatedDurationMinutes: 15,
    questionItems: [
      {
        id: 'q1',
        questionType: 'MULTIPLE_CHOICE',
        promptText: 'Berapakah hasil dari 15 + 27?',
        contentPayload: {
          options: [
            { id: 'opt_a', text: '32' },
            { id: 'opt_b', text: '42' },
            { id: 'opt_c', text: '52' },
          ],
          correct_option_id: 'opt_b',
          explanation: '15 + 27 = 42 (10 + 20 = 30, 5 + 7 = 12, 30 + 12 = 42).',
        },
        hints: [{ stepOrder: 1, hintText: 'Jumlahkan puluhannya dulu (10 + 20 = 30), lalu satuannya (5 + 7 = 12).' }],
      },
      {
        id: 'q2',
        questionType: 'SHORT_ANSWER',
        promptText: 'Berapakah hasil dari 50 - 18? (Tuliskan angkanya)',
        contentPayload: {
          matching_mode: 'EXACT',
          accepted_answers: ['32'],
          explanation: '50 - 18 = 32 (50 - 10 = 40, 40 - 8 = 32).',
        },
        hints: [{ stepOrder: 1, hintText: 'Kurangkan 10 terlebih dahulu menjadi 40, lalu kurangi 8.' }],
      },
      {
        id: 'q3',
        questionType: 'MULTIPLE_CHOICE',
        promptText: 'Ani memiliki 8 permen, lalu Ibu memberi 9 permen lagi. Berapa total permen Ani sekarang?',
        contentPayload: {
          options: [
            { id: 'opt_1', text: '16' },
            { id: 'opt_2', text: '17' },
            { id: 'opt_3', text: '18' },
          ],
          correct_option_id: 'opt_2',
          explanation: '8 + 9 = 17 permen.',
        },
        hints: [{ stepOrder: 1, hintText: 'Ingat: 8 + 8 = 16, lalu tambahkan 1 lagi.' }],
      },
    ],
  },
  lesson_i1: {
    id: 'lesson_i1',
    title: 'Klasifikasi Tumbuhan dan Hewan',
    summary: 'Mengenal ciri-ciri makhluk hidup dan rantai makanan di lingkungan sekitar.',
    learningObjective: 'Siswa mampu mengelompokkan makhluk hidup berdasarkan karakteristik dan habitatnya.',
    educationStage: 'SD',
    difficultyLevel: 'BEGINNER',
    estimatedDurationMinutes: 12,
    questionItems: [
      {
        id: 'q1',
        questionType: 'MULTIPLE_CHOICE',
        promptText: 'Manakah di bawah ini yang merupakan hewan herbivora (pemakan tumbuhan)?',
        contentPayload: {
          options: [
            { id: 'opt_a', text: 'Singa' },
            { id: 'opt_b', text: 'Sapi' },
            { id: 'opt_c', text: 'Elang' },
          ],
          correct_option_id: 'opt_b',
          explanation: 'Sapi adalah herbivora karena makanan utamanya adalah rumput/tumbuhan.',
        },
        hints: [{ stepOrder: 1, hintText: 'Hewan ini memakan rumput di padang rumput dan menghasilkan susu.' }],
      },
      {
        id: 'q2',
        questionType: 'SHORT_ANSWER',
        promptText: 'Organ tumbuhan yang berfungsi menyerap air dan mineral dari dalam tanah adalah:',
        contentPayload: {
          matching_mode: 'NORMALIZED',
          accepted_answers: ['akar'],
          explanation: 'Akar menancap di dalam tanah untuk menyerap air dan nutrisi.',
        },
        hints: [{ stepOrder: 1, hintText: 'Bagian tumbuhan yang biasanya berada di dalam tanah.' }],
      },
    ],
  },
};

export function getGuestLessonFallback(lessonId: string, stage: string = 'SD'): GuestLesson {
  if (GUEST_LESSONS_CATALOG[lessonId]) {
    return GUEST_LESSONS_CATALOG[lessonId];
  }
  return {
    id: lessonId || 'preview',
    title: 'Latihan Interaktif Siswa',
    summary: 'Eksplorasi materi kurikulum merdeka dan uji pemahaman dengan latihan interaktif.',
    learningObjective: 'Siswa mampu memahami materi dasar dan menyelesaikan tantangan dengan baik.',
    educationStage: stage.toUpperCase(),
    difficultyLevel: 'BEGINNER',
    estimatedDurationMinutes: 10,
    questionItems: [
      {
        id: 'q1',
        questionType: 'MULTIPLE_CHOICE',
        promptText: 'Berapakah hasil dari 7 + 8?',
        contentPayload: {
          options: [
            { id: 'opt_1', text: '14' },
            { id: 'opt_2', text: '15' },
            { id: 'opt_3', text: '16' },
          ],
          correct_option_id: 'opt_2',
          explanation: '7 + 8 = 15.',
        },
        hints: [{ stepOrder: 1, hintText: 'Ingat: 7 + 7 = 14, tambahkan 1 lagi.' }],
      },
      {
        id: 'q2',
        questionType: 'SHORT_ANSWER',
        promptText: 'Tuliskan nama ibukota negara Indonesia (IKN baru):',
        contentPayload: {
          matching_mode: 'NORMALIZED',
          accepted_answers: ['nusantara', 'ikn nusantara'],
          explanation: 'Ibukota Nusantara (IKN) terletak di Kalimantan Timur.',
        },
        hints: [{ stepOrder: 1, hintText: 'Dimulai dengan huruf N dan berakhiran A.' }],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Feature 010 — bridge to @aksicendekia/content-kit (the 12 interactive lessons).
// The legacy GUEST_LESSONS_CATALOG above is kept so old routes never 404.
// ---------------------------------------------------------------------------

export interface InteractiveLessonView {
  id: string;
  title: string;
  summary: string;
  learningObjective: string;
  educationStage: string;
  /** Feature 011 — set for SD lessons (kelas 1-6); matches the registered API. */
  gradeLevel?: number;
  phase?: string;
  difficultyLevel: string;
  estimatedDurationMinutes: number;
  contentBlocks: LessonBlockInput[];
  questionItems: QuestionItem[];
  supersededByLessonId?: string;
}

/** Feature 011 — the public-safe embedded-video shape, identical to the API's `toPublicVideoEmbed`. */
function hydrateVideoBlock(block: LessonBlockInput): LessonBlockInput {
  if (block.blockType !== 'VIDEO' || !block.videoEmbedId) return block;
  const ref = getVideoEmbed(block.videoEmbedId);
  if (!ref) return block;
  return {
    ...block,
    payload: {
      ...block.payload,
      videoEmbed: {
        provider: ref.provider,
        externalId: ref.externalId,
        title: ref.title,
        publisherName: ref.publisherName,
        durationSeconds: ref.durationSeconds ?? null,
        posterUrl: `/${ref.posterStorageKey}`,
        transcriptText: ref.transcriptText,
      },
    },
  };
}

function toQuestionItem(q: InteractiveLesson['questions'][number]): QuestionItem {
  return {
    id: q.id,
    // widen: renderer handles the interactive types too
    questionType: q.questionType as QuestionItem['questionType'],
    promptText: q.promptText,
    contentPayload: q.contentPayload as QuestionItem['contentPayload'],
    hints: q.hints,
  };
}

export function toInteractiveLessonView(lesson: InteractiveLesson): InteractiveLessonView {
  return {
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary,
    learningObjective: lesson.learningObjective,
    educationStage: lesson.educationStage,
    gradeLevel: lesson.gradeLevel,
    phase: lesson.phase,
    difficultyLevel: lesson.difficultyLevel,
    estimatedDurationMinutes: lesson.estimatedDurationMinutes,
    contentBlocks: lesson.contentBlocks.map(hydrateVideoBlock),
    questionItems: lesson.questions.map(toQuestionItem),
    supersededByLessonId: lesson.supersededByLessonId,
  };
}

/** Interactive lesson for a given route id, or the legacy replacement, or undefined. */
export function getInteractiveLesson(lessonId: string): InteractiveLessonView | undefined {
  const direct = getLessonById(lessonId);
  if (direct) return toInteractiveLessonView(direct);
  const legacy = getLegacyLessonRef(lessonId);
  if (legacy) {
    const replacement = getLessonById(legacy.supersededByLessonId);
    if (replacement) {
      return { ...toInteractiveLessonView(replacement), id: lessonId, supersededByLessonId: legacy.supersededByLessonId };
    }
  }
  return undefined;
}

export function listExploreLessons(stage?: string): InteractiveLessonView[] {
  const normalized = stage ? (stage.toUpperCase() as 'TK' | 'SD' | 'SMP' | 'SMA') : undefined;
  return listForCatalog(normalized).map(toInteractiveLessonView);
}

export interface SdGradeGroup {
  gradeLevel: 1 | 2 | 3 | 4 | 5 | 6;
  lessons: InteractiveLessonView[];
}

/**
 * Feature 011 (T080/T081) — the SD Matematika catalog grouped by kelas 1-6, each
 * grade's lessons ordered by `orderIndex` (FR-010). Powers the per-grade
 * grouping + "next grade" navigation in explore/ and catalog/.
 */
export function listSdGradeCatalog(): SdGradeGroup[] {
  return ([1, 2, 3, 4, 5, 6] as const).map((gradeLevel) => ({
    gradeLevel,
    lessons: listForGrade(gradeLevel)
      .filter((l) => l.listing === 'LISTED')
      .map(toInteractiveLessonView),
  }));
}

/** All routable lesson ids (12 interactive + 3 legacy) for generateStaticParams. */
export function allLessonIds(): string[] {
  return contentKitAllLessonIds();
}

export { INTERACTIVE_LESSONS };
