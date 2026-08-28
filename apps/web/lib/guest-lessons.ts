export interface QuestionItem {
  id: string;
  questionType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';
  promptText: string;
  contentPayload: {
    options?: { id: string; text: string }[];
    correct_option_id?: string;
    matching_mode?: 'EXACT' | 'NORMALIZED';
    accepted_answers?: string[];
    explanation?: string;
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
