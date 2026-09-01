import type { InteractiveLesson, LessonQuestionInput } from './types.js';

/** SMP — Matematika, Fase D. All lessons stay at REVIEW (FR-030a). */

const CP = 'cp-fase-d-matematika-aljabar';
const A = 'assets/lessons/smp';

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

export const SMP_LESSONS: InteractiveLesson[] = [
  {
    id: 'smp-matematika-01',
    educationStage: 'SMP',
    phase: 'FASE_D',
    subjectCode: 'MATH_SMP',
    subjectName: 'Matematika',
    unitTitle: 'Bilangan Bulat',
    title: 'Bilangan Bulat pada Garis Bilangan',
    summary: 'Menempatkan, membandingkan, dan mengoperasikan bilangan bulat positif dan negatif.',
    learningObjective:
      'Siswa dapat membandingkan bilangan bulat dan menyelesaikan penjumlahan/pengurangan bilangan bulat menggunakan garis bilangan.',
    curriculumAchievementId: CP,
    difficultyLevel: 'BEGINNER',
    estimatedDurationMinutes: 15,
    orderIndex: 0,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ANIMATION',
        payload: {
          animationId: 'integer-number-line',
          steps: [
            { atMs: 0, caption: 'Mulai di -3.', frame: 'start-neg3' },
            { atMs: 700, caption: 'Tambah 5: lompat 5 ke kanan.', frame: 'jump' },
            { atMs: 1400, caption: 'Tiba di 2. Jadi -3 + 5 = 2.', frame: 'land-2' },
          ],
        },
        transcriptText: 'Animasi melompat dari -3 sejauh 5 satuan ke kanan hingga tiba di 2.',
        fallbackStorageKey: `${A}/smp-01-fallback.svg`,
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'NUMBER_LINE_EXPLORER',
            params: { min: -10, max: 10, step: 1, initial: -3, markers: [-10, -5, 0, 5, 10] },
          },
        },
      },
    ],
    questions: [
      numberLine(
        'smp-01-q1',
        'Tempatkan hasil dari -4 + 7 pada garis bilangan.',
        { min: -10, max: 10, step: 1, targetValue: 3 },
        '-4 + 7 = 3 (lompat 7 ke kanan dari -4).',
        ['Bergerak ke kanan untuk penjumlahan.'],
      ),
      numberLine(
        'smp-01-q2',
        'Tempatkan hasil dari 2 - 6 pada garis bilangan.',
        { min: -10, max: 10, step: 1, targetValue: -4 },
        '2 - 6 = -4 (lompat 6 ke kiri dari 2).',
        ['Melewati nol menuju bilangan negatif.'],
      ),
      mc(
        'smp-01-q3',
        'Manakah pernyataan yang benar?',
        [
          { id: 'a', text: '-7 < -2' },
          { id: 'b', text: '-2 < -7' },
          { id: 'c', text: '-7 = -2' },
        ],
        'a',
        'Semakin ke kiri pada garis bilangan, semakin kecil. -7 < -2.',
        ['Bandingkan letak keduanya dari nol.'],
      ),
      shortAnswer(
        'smp-01-q4',
        'Hitunglah -8 + 3 - (-5).',
        ['0', 'nol'],
        '-8 + 3 = -5, lalu -5 - (-5) = -5 + 5 = 0.',
        ['Ubah kurang negatif menjadi tambah positif.'],
      ),
      {
        id: 'smp-01-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan hasil operasi: bernilai positif atau negatif.',
        contentPayload: {
          items: [
            { id: 'i1', label: '-3 + 8' },
            { id: 'i2', label: '4 - 11' },
            { id: 'i3', label: '-6 + 1' },
            { id: 'i4', label: '10 - 2' },
          ],
          groups: [
            { id: 'pos', label: 'Positif' },
            { id: 'neg', label: 'Negatif' },
          ],
          correctMapping: { i1: 'pos', i2: 'neg', i3: 'neg', i4: 'pos' },
          requireAllPlaced: true,
          explanation: '-3+8=5 dan 10-2=8 (positif). 4-11=-7 dan -6+1=-5 (negatif).',
        },
        explanation: 'Selesaikan tiap operasi, lalu tentukan tandanya.',
        hints: [{ stepOrder: 1, hintText: 'Bandingkan besar bilangan positif dan negatif dalam operasi.' }],
      },
    ],
  },
  {
    id: 'smp-matematika-02',
    educationStage: 'SMP',
    phase: 'FASE_D',
    subjectCode: 'MATH_SMP',
    subjectName: 'Matematika',
    unitTitle: 'Perbandingan',
    title: 'Perbandingan Senilai dan Berbalik Nilai',
    summary: 'Membedakan dan menyelesaikan masalah perbandingan senilai dan berbalik nilai.',
    learningObjective:
      'Siswa dapat mengidentifikasi jenis perbandingan pada suatu situasi dan menyelesaikan masalah yang berkaitan.',
    curriculumAchievementId: CP,
    difficultyLevel: 'INTERMEDIATE',
    estimatedDurationMinutes: 15,
    orderIndex: 1,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ILLUSTRATION',
        payload: { caption: 'Tabel: 2 buku Rp10.000, 4 buku Rp20.000, 6 buku Rp30.000.' },
        altText: 'Tabel jumlah buku dan harga yang bertambah dengan pola sebanding.',
        mediaStorageKey: `${A}/smp-02-table.svg`,
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'PARAMETER_EXPLORER',
            params: {
              expressionId: 'proportional-y-kx',
              variables: [
                { key: 'k', label: 'Harga per buku (ribu)', min: 1, max: 20, step: 1, initial: 5 },
                { key: 'x', label: 'Jumlah buku', min: 0, max: 12, step: 1, initial: 3 },
              ],
            },
          },
        },
      },
    ],
    questions: [
      mc(
        'smp-02-q1',
        'Semakin banyak pekerja, semakin cepat pekerjaan selesai. Ini adalah perbandingan...',
        [
          { id: 'a', text: 'Berbalik nilai' },
          { id: 'b', text: 'Senilai' },
          { id: 'c', text: 'Tidak keduanya' },
        ],
        'a',
        'Satu naik, yang lain turun — perbandingan berbalik nilai.',
        ['Cek arah perubahan kedua besaran.'],
      ),
      shortAnswer(
        'smp-02-q2',
        'Jika 3 kg apel harganya Rp45.000, berapa harga 5 kg apel? (tulis angka saja, mis. 75000)',
        ['75000', 'rp75000', '75.000', 'rp 75.000'],
        'Harga per kg = 15.000, maka 5 kg = 75.000.',
        ['Cari harga 1 kg dulu.'],
      ),
      mc(
        'smp-02-q3',
        'Sebuah mobil menempuh 180 km dengan 12 liter bensin. Untuk 270 km diperlukan...',
        [
          { id: 'a', text: '18 liter' },
          { id: 'b', text: '15 liter' },
          { id: 'c', text: '24 liter' },
        ],
        'a',
        '180/12 = 15 km per liter; 270/15 = 18 liter.',
        ['Hitung km per liter, lalu bagi jaraknya.'],
      ),
      shortAnswer(
        'smp-02-q4',
        'Makanan cukup untuk 8 orang selama 6 hari. Untuk 12 orang, cukup untuk berapa hari?',
        ['4', 'empat', '4 hari'],
        'Berbalik nilai: 8 x 6 = 48 orang-hari; 48 / 12 = 4 hari.',
        ['Total "orang-hari" tetap.'],
      ),
      {
        id: 'smp-02-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan situasi: perbandingan senilai atau berbalik nilai.',
        contentPayload: {
          items: [
            { id: 'i1', label: 'Jumlah barang vs total harga' },
            { id: 'i2', label: 'Kecepatan vs waktu tempuh (jarak tetap)' },
            { id: 'i3', label: 'Banyak keran vs waktu mengisi bak' },
            { id: 'i4', label: 'Lama bekerja vs upah harian' },
          ],
          groups: [
            { id: 'senilai', label: 'Senilai' },
            { id: 'berbalik', label: 'Berbalik nilai' },
          ],
          correctMapping: { i1: 'senilai', i2: 'berbalik', i3: 'berbalik', i4: 'senilai' },
          requireAllPlaced: true,
          explanation:
            'Jika satu naik dan yang lain ikut naik: senilai. Jika satu naik dan yang lain turun: berbalik nilai.',
        },
        explanation: 'Perhatikan apakah kedua besaran berubah searah atau berlawanan.',
        hints: [{ stepOrder: 1, hintText: 'Tanyakan: kalau yang satu digandakan, yang lain jadi apa?' }],
      },
    ],
  },
  {
    id: 'smp-matematika-03',
    educationStage: 'SMP',
    phase: 'FASE_D',
    subjectCode: 'MATH_SMP',
    subjectName: 'Matematika',
    unitTitle: 'Persamaan Linear',
    title: 'Persamaan Linear Satu Variabel',
    summary: 'Menyelesaikan persamaan linear satu variabel dengan operasi yang seimbang.',
    learningObjective:
      'Siswa dapat menyelesaikan persamaan linear satu variabel dan memeriksa kebenaran penyelesaiannya.',
    curriculumAchievementId: CP,
    difficultyLevel: 'INTERMEDIATE',
    estimatedDurationMinutes: 15,
    orderIndex: 2,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ANIMATION',
        payload: {
          animationId: 'ratio-scale',
          steps: [
            { atMs: 0, caption: 'Timbangan seimbang: 2x + 3 = 11.', frame: 'balance' },
            { atMs: 700, caption: 'Kurangi 3 di kedua sisi: 2x = 8.', frame: 'minus-3' },
            { atMs: 1400, caption: 'Bagi 2 di kedua sisi: x = 4.', frame: 'divide-2' },
          ],
        },
        transcriptText:
          'Animasi timbangan menyelesaikan 2x + 3 = 11 dengan mengurangi 3 lalu membagi 2 di kedua sisi.',
        fallbackStorageKey: `${A}/smp-03-fallback.svg`,
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'STEP_REVEAL',
            params: {
              steps: [
                { title: 'Tulis persamaan', body: '3x - 5 = 16.' },
                { title: 'Tambah 5', body: 'Kedua sisi + 5: 3x = 21.' },
                { title: 'Bagi 3', body: 'Kedua sisi : 3: x = 7.' },
                { title: 'Periksa', body: '3(7) - 5 = 16. Benar.' },
              ],
            },
          },
        },
      },
    ],
    questions: [
      shortAnswer(
        'smp-03-q1',
        'Selesaikan: x + 9 = 21. x = ?',
        ['12', 'x=12', 'x = 12'],
        'Kurangi 9 di kedua sisi: x = 12.',
        ['Pindahkan 9 ke ruas kanan (menjadi -9).'],
      ),
      shortAnswer(
        'smp-03-q2',
        'Selesaikan: 4x = 28. x = ?',
        ['7', 'x=7', 'x = 7'],
        'Bagi 4 di kedua sisi: x = 7.',
        ['Bagi kedua sisi dengan koefisien x.'],
      ),
      shortAnswer(
        'smp-03-q3',
        'Selesaikan: 2x - 3 = 11. x = ?',
        ['7', 'x=7', 'x = 7'],
        'Tambah 3: 2x = 14, lalu bagi 2: x = 7.',
        ['Selesaikan operasi tambah/kurang dulu, baru bagi.'],
      ),
      mc(
        'smp-03-q4',
        'Manakah langkah yang benar dari 5x + 2 = 3x + 10?',
        [
          { id: 'a', text: '2x = 8, lalu x = 4' },
          { id: 'b', text: '8x = 8, lalu x = 1' },
          { id: 'c', text: '2x = 12, lalu x = 6' },
        ],
        'a',
        'Kurangi 3x dan 2 di kedua sisi: 2x = 8, jadi x = 4.',
        ['Kumpulkan x di satu ruas, angka di ruas lain.'],
      ),
      {
        id: 'smp-03-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan persamaan menurut penyelesaiannya: x = 3 atau x = 5.',
        contentPayload: {
          items: [
            { id: 'i1', label: '2x + 1 = 7' },
            { id: 'i2', label: '3x - 4 = 11' },
            { id: 'i3', label: 'x + 8 = 11' },
            { id: 'i4', label: '4x = 20' },
          ],
          groups: [
            { id: 'x3', label: 'x = 3' },
            { id: 'x5', label: 'x = 5' },
          ],
          correctMapping: { i1: 'x3', i2: 'x5', i3: 'x3', i4: 'x5' },
          requireAllPlaced: true,
          explanation: '2x+1=7 dan x+8=11 memberi x=3. 3x-4=11 dan 4x=20 memberi x=5.',
        },
        explanation: 'Selesaikan tiap persamaan, lalu cocokkan hasilnya.',
        hints: [{ stepOrder: 1, hintText: 'Isolasi x pada setiap persamaan.' }],
      },
    ],
  },
];
