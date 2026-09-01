import type { InteractiveLesson, LessonQuestionInput } from './types.js';

/** SMA — Matematika, Fase E. All lessons stay at REVIEW (FR-030a). */

const CP = 'cp-fase-e-matematika-aljabar';
const A = 'assets/lessons/sma';

function mc(
  id: string,
  promptText: string,
  options: Array<{ id: string; text: string }>,
  correctOptionId: string,
  explanation: string,
  hints: string[],
): LessonQuestionInput {
  return {
    id,
    questionType: 'MULTIPLE_CHOICE',
    promptText,
    contentPayload: { options, correctOptionId, explanation },
    explanation,
    hints: hints.map((hintText, i) => ({ stepOrder: i + 1, hintText })),
  };
}

function shortAnswer(
  id: string,
  promptText: string,
  acceptedAnswers: string[],
  explanation: string,
  hints: string[],
): LessonQuestionInput {
  return {
    id,
    questionType: 'SHORT_ANSWER',
    promptText,
    contentPayload: { acceptedAnswers, matchingMode: 'NORMALIZED', explanation },
    explanation,
    hints: hints.map((hintText, i) => ({ stepOrder: i + 1, hintText })),
  };
}

function numberLine(
  id: string,
  promptText: string,
  payload: { min: number; max: number; step: number; targetValue: number; tolerance?: number },
  explanation: string,
  hints: string[],
): LessonQuestionInput {
  return {
    id,
    questionType: 'NUMBER_LINE',
    promptText,
    contentPayload: { ...payload, tolerance: payload.tolerance ?? 0, explanation },
    explanation,
    hints: hints.map((hintText, i) => ({ stepOrder: i + 1, hintText })),
  };
}

export const SMA_LESSONS: InteractiveLesson[] = [
  {
    id: 'sma-matematika-01',
    educationStage: 'SMA',
    phase: 'FASE_E',
    subjectCode: 'MATH_SMA',
    subjectName: 'Matematika',
    unitTitle: 'Fungsi Linear',
    title: 'Fungsi Linear dan Gradien',
    summary: 'Menafsirkan gradien dan titik potong pada fungsi linear y = mx + c.',
    learningObjective:
      'Siswa dapat menentukan gradien dan titik potong sumbu dari fungsi linear serta mengaitkannya dengan grafik.',
    curriculumAchievementId: CP,
    difficultyLevel: 'INTERMEDIATE',
    estimatedDurationMinutes: 18,
    orderIndex: 0,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ANIMATION',
        payload: {
          animationId: 'linear-function-slope',
          steps: [
            { atMs: 0, caption: 'Garis y = 2x + 1 memotong sumbu-y di (0, 1).', frame: 'intercept' },
            { atMs: 800, caption: 'Naik 2 satuan setiap bergerak 1 ke kanan: gradien 2.', frame: 'rise-run' },
            { atMs: 1600, caption: 'Gradien besar berarti garis lebih curam.', frame: 'steeper' },
          ],
        },
        transcriptText:
          'Animasi menggambar y = 2x + 1: titik potong sumbu-y di (0,1) dan kemiringan naik 2 turun 1.',
        fallbackStorageKey: `${A}/sma-01-fallback.svg`,
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'PARAMETER_EXPLORER',
            params: {
              expressionId: 'linear-y-mx-c',
              variables: [
                { key: 'm', label: 'Gradien (m)', min: -5, max: 5, step: 1, initial: 2 },
                { key: 'x', label: 'x', min: -5, max: 5, step: 1, initial: 3 },
                { key: 'c', label: 'Titik potong (c)', min: -5, max: 5, step: 1, initial: 1 },
              ],
            },
          },
        },
      },
    ],
    questions: [
      mc(
        'sma-01-q1',
        'Gradien garis y = -3x + 4 adalah...',
        [
          { id: 'a', text: '-3' },
          { id: 'b', text: '4' },
          { id: 'c', text: '3' },
        ],
        'a',
        'Pada y = mx + c, gradien adalah koefisien x, yaitu -3.',
        ['Bandingkan dengan bentuk umum y = mx + c.'],
      ),
      shortAnswer(
        'sma-01-q2',
        'Garis melalui (0, -2) dengan gradien 5. Tuliskan persamaannya dalam bentuk y = mx + c.',
        ['y = 5x - 2', 'y=5x-2', 'y = 5x + (-2)'],
        'c = -2 (titik potong sumbu-y) dan m = 5, jadi y = 5x - 2.',
        ['Titik potong sumbu-y memberi nilai c.'],
      ),
      mc(
        'sma-01-q3',
        'Dua garis y = 2x + 1 dan y = 2x - 4 bersifat...',
        [
          { id: 'a', text: 'Sejajar' },
          { id: 'b', text: 'Berpotongan tegak lurus' },
          { id: 'c', text: 'Berimpit' },
        ],
        'a',
        'Gradien sama (2) tetapi titik potong berbeda, jadi sejajar.',
        ['Garis sejajar memiliki gradien sama.'],
      ),
      numberLine(
        'sma-01-q4',
        'Untuk fungsi f(x) = 2x - 3, tempatkan nilai f(4) pada garis bilangan.',
        { min: -5, max: 15, step: 1, targetValue: 5 },
        'f(4) = 2(4) - 3 = 5.',
        ['Substitusikan x = 4.'],
      ),
      {
        id: 'sma-01-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan garis: gradien positif atau gradien negatif.',
        contentPayload: {
          items: [
            { id: 'i1', label: 'y = 4x - 1' },
            { id: 'i2', label: 'y = -2x + 3' },
            { id: 'i3', label: 'y = 7 - x' },
            { id: 'i4', label: 'y = x/2 + 5' },
          ],
          groups: [
            { id: 'pos', label: 'Gradien positif' },
            { id: 'neg', label: 'Gradien negatif' },
          ],
          correctMapping: { i1: 'pos', i2: 'neg', i3: 'neg', i4: 'pos' },
          requireAllPlaced: true,
          explanation:
            'y = 4x - 1 (m=4) dan y = x/2 + 5 (m=1/2) positif. y = -2x + 3 (m=-2) dan y = 7 - x (m=-1) negatif.',
        },
        explanation: 'Tuliskan tiap garis dalam bentuk y = mx + c lalu lihat tanda m.',
        hints: [{ stepOrder: 1, hintText: 'Susun ulang "7 - x" menjadi "-x + 7".' }],
      },
    ],
  },
  {
    id: 'sma-matematika-02',
    educationStage: 'SMA',
    phase: 'FASE_E',
    subjectCode: 'MATH_SMA',
    subjectName: 'Matematika',
    unitTitle: 'Sistem Persamaan Linear',
    title: 'Sistem Persamaan Linear Dua Variabel',
    summary: 'Menyelesaikan SPLDV dengan substitusi dan eliminasi serta menafsirkannya secara grafik.',
    learningObjective:
      'Siswa dapat menyelesaikan sistem persamaan linear dua variabel dan menafsirkan titik potong dua garis.',
    curriculumAchievementId: CP,
    difficultyLevel: 'ADVANCED',
    estimatedDurationMinutes: 18,
    orderIndex: 1,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ILLUSTRATION',
        payload: { caption: 'Dua garis berpotongan di titik (2, 1) pada bidang koordinat.' },
        altText: 'Grafik dua garis lurus yang berpotongan di satu titik dengan koordinat 2 dan 1.',
        mediaStorageKey: `${A}/sma-02-intersection.svg`,
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'STEP_REVEAL',
            params: {
              steps: [
                { title: 'Sistem', body: 'x + y = 5 dan x - y = 1.' },
                { title: 'Eliminasi y', body: 'Jumlahkan: 2x = 6, jadi x = 3.' },
                { title: 'Substitusi', body: '3 + y = 5, jadi y = 2.' },
                { title: 'Penyelesaian', body: '(x, y) = (3, 2).' },
              ],
            },
          },
        },
      },
    ],
    questions: [
      shortAnswer(
        'sma-02-q1',
        'Selesaikan: x + y = 7 dan x - y = 3. Tuliskan nilai x.',
        ['5', 'x=5', 'x = 5'],
        'Jumlahkan kedua persamaan: 2x = 10, jadi x = 5.',
        ['Eliminasi y dengan menjumlahkan.'],
      ),
      shortAnswer(
        'sma-02-q2',
        'Dari soal sebelumnya (x + y = 7), tuliskan nilai y.',
        ['2', 'y=2', 'y = 2'],
        'Substitusi x = 5: 5 + y = 7, jadi y = 2.',
        ['Masukkan nilai x ke salah satu persamaan.'],
      ),
      mc(
        'sma-02-q3',
        'Sistem 2x + y = 4 dan 4x + 2y = 8 memiliki...',
        [
          { id: 'a', text: 'Tak hingga banyak penyelesaian' },
          { id: 'b', text: 'Tepat satu penyelesaian' },
          { id: 'c', text: 'Tidak ada penyelesaian' },
        ],
        'a',
        'Persamaan kedua adalah kelipatan 2 dari yang pertama — dua garis berimpit.',
        ['Bandingkan rasio koefisien x, y, dan konstanta.'],
      ),
      mc(
        'sma-02-q4',
        'Titik potong garis y = x + 1 dan y = -x + 5 adalah...',
        [
          { id: 'a', text: '(2, 3)' },
          { id: 'b', text: '(3, 2)' },
          { id: 'c', text: '(1, 2)' },
        ],
        'a',
        'x + 1 = -x + 5 → 2x = 4 → x = 2, y = 3.',
        ['Samakan kedua ruas kanan.'],
      ),
      {
        id: 'sma-02-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan sistem menurut banyak penyelesaiannya.',
        contentPayload: {
          items: [
            { id: 'i1', label: 'x + y = 2; x - y = 0' },
            { id: 'i2', label: 'x + y = 1; 2x + 2y = 6' },
            { id: 'i3', label: 'y = 3x; y = 3x + 4' },
            { id: 'i4', label: '2x - y = 1; x + y = 5' },
          ],
          groups: [
            { id: 'one', label: 'Satu penyelesaian' },
            { id: 'none', label: 'Tidak ada penyelesaian' },
          ],
          correctMapping: { i1: 'one', i2: 'none', i3: 'none', i4: 'one' },
          requireAllPlaced: true,
          explanation:
            'i1 dan i4: garis berpotongan (satu solusi). i2 dan i3: garis sejajar berbeda (tidak ada solusi).',
        },
        explanation: 'Garis sejajar dengan titik potong berbeda tidak punya penyelesaian.',
        hints: [{ stepOrder: 1, hintText: 'Bandingkan gradien tiap pasangan garis.' }],
      },
    ],
  },
  {
    id: 'sma-matematika-03',
    educationStage: 'SMA',
    phase: 'FASE_E',
    subjectCode: 'MATH_SMA',
    subjectName: 'Matematika',
    unitTitle: 'Barisan dan Deret',
    title: 'Barisan Aritmetika dan Geometri',
    summary: 'Mengenali pola barisan aritmetika dan geometri serta menentukan suku ke-n.',
    learningObjective:
      'Siswa dapat membedakan barisan aritmetika dan geometri serta menentukan suku ke-n dan jumlah beberapa suku pertama.',
    curriculumAchievementId: CP,
    difficultyLevel: 'ADVANCED',
    estimatedDurationMinutes: 18,
    orderIndex: 2,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ANIMATION',
        payload: {
          animationId: 'sequence-pattern',
          steps: [
            { atMs: 0, caption: 'Barisan 3, 7, 11, 15 ...', frame: 'terms' },
            { atMs: 700, caption: 'Selisih tetap +4: barisan aritmetika.', frame: 'diff-4' },
            { atMs: 1400, caption: 'Suku ke-n: Un = 3 + (n - 1)(4).', frame: 'formula' },
          ],
        },
        transcriptText:
          'Animasi menunjukkan barisan 3, 7, 11, 15 dengan beda tetap 4 dan rumus suku ke-n Un = 3 + (n-1)4.',
        fallbackStorageKey: `${A}/sma-03-fallback.svg`,
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'STEP_REVEAL',
            params: {
              steps: [
                { title: 'Barisan geometri', body: '2, 6, 18, 54 ... rasio r = 3.' },
                { title: 'Suku ke-n', body: 'Un = 2 · 3^(n-1).' },
                { title: 'Contoh', body: 'U4 = 2 · 3^3 = 54.' },
              ],
            },
          },
        },
      },
    ],
    questions: [
      mc(
        'sma-03-q1',
        'Barisan 5, 8, 11, 14, ... adalah barisan...',
        [
          { id: 'a', text: 'Aritmetika dengan beda 3' },
          { id: 'b', text: 'Geometri dengan rasio 3' },
          { id: 'c', text: 'Bukan keduanya' },
        ],
        'a',
        'Selisih antar suku tetap 3, jadi aritmetika dengan beda 3.',
        ['Kurangi suku kedua dengan suku pertama.'],
      ),
      shortAnswer(
        'sma-03-q2',
        'Suku ke-10 dari barisan aritmetika 2, 5, 8, ... adalah? (tulis angka)',
        ['29', 'dua puluh sembilan'],
        'Un = 2 + (10 - 1)(3) = 2 + 27 = 29.',
        ['Gunakan Un = a + (n - 1)b.'],
      ),
      shortAnswer(
        'sma-03-q3',
        'Barisan geometri 3, 6, 12, ... Suku ke-5 adalah? (tulis angka)',
        ['48', 'empat puluh delapan'],
        'Rasio 2; U5 = 3 · 2^4 = 48.',
        ['Un = a · r^(n-1).'],
      ),
      numberLine(
        'sma-03-q4',
        'Jumlah 4 suku pertama barisan 1, 3, 5, 7. Letakkan hasilnya pada garis bilangan.',
        { min: 0, max: 40, step: 2, targetValue: 16 },
        '1 + 3 + 5 + 7 = 16.',
        ['Jumlahkan langsung keempat suku.'],
      ),
      {
        id: 'sma-03-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan barisan: aritmetika atau geometri.',
        contentPayload: {
          items: [
            { id: 'i1', label: '4, 9, 14, 19' },
            { id: 'i2', label: '5, 10, 20, 40' },
            { id: 'i3', label: '100, 90, 80, 70' },
            { id: 'i4', label: '1, 3, 9, 27' },
          ],
          groups: [
            { id: 'arit', label: 'Aritmetika' },
            { id: 'geo', label: 'Geometri' },
          ],
          correctMapping: { i1: 'arit', i2: 'geo', i3: 'arit', i4: 'geo' },
          requireAllPlaced: true,
          explanation:
            'i1 (beda +5) dan i3 (beda -10) aritmetika. i2 (rasio 2) dan i4 (rasio 3) geometri.',
        },
        explanation: 'Aritmetika: selisih tetap. Geometri: perbandingan tetap.',
        hints: [{ stepOrder: 1, hintText: 'Cek beda antar suku dan rasio antar suku.' }],
      },
    ],
  },
];
