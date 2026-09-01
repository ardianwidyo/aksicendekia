import type { InteractiveLesson, LessonQuestionInput } from './types.js';

/** SD — Matematika, Fase B. All lessons stay at REVIEW (FR-030a). */

const CP = 'cp-fase-b-matematika-bilangan';
const A = 'assets/lessons/sd';

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

export const SD_LESSONS: InteractiveLesson[] = [
  {
    id: 'sd-matematika-01',
    educationStage: 'SD',
    phase: 'FASE_B',
    subjectCode: 'MATH_SD',
    subjectName: 'Matematika',
    unitTitle: 'Bilangan Cacah sampai Ribuan',
    title: 'Nilai Tempat sampai Ribuan',
    summary: 'Membaca, menulis, dan menguraikan nilai tempat bilangan cacah sampai 9.999.',
    learningObjective:
      'Siswa dapat menentukan nilai tempat setiap angka pada bilangan cacah sampai ribuan serta melakukan komposisi dan dekomposisi bilangan.',
    curriculumAchievementId: CP,
    difficultyLevel: 'BEGINNER',
    estimatedDurationMinutes: 12,
    orderIndex: 0,
    status: 'REVIEW',
    listing: 'LISTED',
    supersededByLessonId: undefined,
    contentBlocks: [
      {
        blockType: 'ANIMATION',
        payload: {
          animationId: 'place-value-split',
          steps: [
            { atMs: 0, caption: 'Ambil bilangan 3.482.', frame: 'number' },
            { atMs: 700, caption: '3 ribuan, 4 ratusan, 8 puluhan, 2 satuan.', frame: 'blocks' },
            { atMs: 1400, caption: '3.000 + 400 + 80 + 2 = 3.482.', frame: 'sum' },
          ],
        },
        transcriptText:
          'Animasi menguraikan 3.482 menjadi 3 ribuan, 4 ratusan, 8 puluhan, dan 2 satuan, lalu menjumlahkannya kembali.',
        fallbackStorageKey: `${A}/sd-01-fallback.svg`,
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'PARAMETER_EXPLORER',
            params: {
              expressionId: 'linear-y-mx-c',
              variables: [
                { key: 'm', label: 'Ratusan', min: 0, max: 9, step: 1, initial: 4 },
                { key: 'x', label: 'Faktor (100)', min: 100, max: 100, step: 1, initial: 100 },
                { key: 'c', label: 'Sisa (puluhan + satuan)', min: 0, max: 99, step: 1, initial: 82 },
              ],
            },
          },
        },
      },
    ],
    questions: [
      mc(
        'sd-01-q1',
        'Berapa nilai angka 7 pada bilangan 5.764?',
        [
          { id: 'a', text: '7' },
          { id: 'b', text: '70' },
          { id: 'c', text: '700' },
        ],
        'c',
        'Angka 7 berada di tempat ratusan, jadi nilainya 700.',
        ['Lihat posisi angka 7 dari kanan.', 'Urutannya: satuan, puluhan, ratusan, ribuan.'],
      ),
      shortAnswer(
        'sd-01-q2',
        'Tuliskan bentuk panjang dari 2.305 (contoh: 2000 + 300 + 5).',
        ['2000 + 300 + 5', '2000+300+5', '2.000 + 300 + 5'],
        '2.305 terdiri dari 2 ribuan, 3 ratusan, 0 puluhan, dan 5 satuan.',
        ['Uraikan tiap angka menurut tempatnya.', 'Tempat puluhan berisi 0, jadi tidak ditulis.'],
      ),
      mc(
        'sd-01-q3',
        'Bilangan "empat ribu enam puluh" ditulis...',
        [
          { id: 'a', text: '4.060' },
          { id: 'b', text: '4.600' },
          { id: 'c', text: '460' },
        ],
        'a',
        'Empat ribu = 4.000, enam puluh = 60, tidak ada ratusan.',
        ['Tempat ratusan kosong berarti 0.'],
      ),
      numberLine(
        'sd-01-q4',
        'Letakkan bilangan 1.500 pada garis bilangan.',
        { min: 0, max: 3000, step: 500, targetValue: 1500 },
        '1.500 tepat di tengah antara 0 dan 3.000.',
        ['Garis dibagi tiap 500.', 'Hitung tiga langkah dari 0.'],
      ),
      {
        id: 'sd-01-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan bilangan: "angka 6 bernilai 600" atau "angka 6 bernilai 60".',
        contentPayload: {
          items: [
            { id: 'i1', label: '3.641' },
            { id: 'i2', label: '1.263' },
            { id: 'i3', label: '6.900' },
            { id: 'i4', label: '4.860' },
          ],
          groups: [
            { id: 'r600', label: 'Angka 6 = 600' },
            { id: 'r60', label: 'Angka 6 = 60' },
          ],
          correctMapping: { i1: 'r600', i2: 'r600', i3: 'r600', i4: 'r60' },
          requireAllPlaced: true,
          explanation:
            'Pada 3.641, 1.263, dan 6.900 angka 6 berada di tempat ratusan (600). Pada 4.860 angka 6 di tempat puluhan (60).',
        },
        explanation:
          'Perhatikan posisi angka 6: di tempat ratusan bernilai 600, di tempat puluhan bernilai 60.',
        hints: [{ stepOrder: 1, hintText: 'Hitung posisi angka 6 dari kanan pada tiap bilangan.' }],
      },
    ],
  },
  {
    id: 'sd-matematika-02',
    educationStage: 'SD',
    phase: 'FASE_B',
    subjectCode: 'MATH_SD',
    subjectName: 'Matematika',
    unitTitle: 'Pecahan Sederhana',
    title: 'Pecahan sebagai Bagian dari Keseluruhan',
    summary: 'Mengenal pecahan 1/2, 1/3, 1/4 sebagai bagian yang sama besar dari suatu keseluruhan.',
    learningObjective:
      'Siswa dapat menyatakan pecahan sederhana sebagai bagian yang sama besar dari keseluruhan dan membandingkan dua pecahan sederhana.',
    curriculumAchievementId: CP,
    difficultyLevel: 'INTERMEDIATE',
    estimatedDurationMinutes: 12,
    orderIndex: 1,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ILLUSTRATION',
        payload: { caption: 'Sebuah pizza dibagi menjadi 4 bagian sama besar; 1 bagian diarsir.' },
        altText: 'Pizza bulat dibagi empat sama besar, satu potong berwarna berbeda menandakan seperempat.',
        mediaStorageKey: `${A}/sd-02-pizza.svg`,
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'FRACTION_BAR_BUILDER',
            params: { denominator: 4, targetFraction: { numerator: 1, denominator: 4 }, allowCompare: true },
          },
        },
      },
    ],
    questions: [
      mc(
        'sd-02-q1',
        'Sebuah kue dibagi 3 bagian sama besar. Satu bagian adalah...',
        [
          { id: 'a', text: 'Sepertiga (1/3)' },
          { id: 'b', text: 'Setengah (1/2)' },
          { id: 'c', text: 'Seperempat (1/4)' },
        ],
        'a',
        'Dibagi 3 sama besar, satu bagian bernilai 1/3.',
        ['Penyebut = banyak bagian sama besar.'],
      ),
      shortAnswer(
        'sd-02-q2',
        'Tuliskan pecahan untuk 2 bagian yang diarsir dari 4 bagian sama besar.',
        ['2/4', '1/2', 'dua per empat', 'setengah'],
        '2 dari 4 bagian sama dengan 2/4, yang senilai dengan 1/2.',
        ['Pembilang = bagian diarsir; penyebut = total bagian.'],
      ),
      mc(
        'sd-02-q3',
        'Mana yang lebih besar, 1/2 atau 1/4?',
        [
          { id: 'a', text: '1/2 lebih besar' },
          { id: 'b', text: '1/4 lebih besar' },
          { id: 'c', text: 'Sama besar' },
        ],
        'a',
        'Semakin banyak bagian, semakin kecil tiap bagian. 1/2 > 1/4.',
        ['Bayangkan membagi kue jadi 2 vs 4 potong.'],
      ),
      mc(
        'sd-02-q4',
        'Pecahan yang senilai dengan 1/2 adalah...',
        [
          { id: 'a', text: '2/4' },
          { id: 'b', text: '1/3' },
          { id: 'c', text: '3/4' },
        ],
        'a',
        '2/4 = 1/2 karena 2 adalah setengah dari 4.',
        ['Kalikan pembilang dan penyebut 1/2 dengan 2.'],
      ),
      {
        id: 'sd-02-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan pecahan: senilai dengan 1/2 atau tidak.',
        contentPayload: {
          items: [
            { id: 'i1', label: '2/4' },
            { id: 'i2', label: '1/3' },
            { id: 'i3', label: '3/6' },
            { id: 'i4', label: '2/5' },
          ],
          groups: [
            { id: 'half', label: 'Senilai 1/2' },
            { id: 'notHalf', label: 'Bukan 1/2' },
          ],
          correctMapping: { i1: 'half', i2: 'notHalf', i3: 'half', i4: 'notHalf' },
          requireAllPlaced: true,
          explanation: '2/4 dan 3/6 sama dengan 1/2. 1/3 dan 2/5 tidak.',
        },
        explanation: 'Pecahan senilai 1/2 jika pembilang tepat setengah dari penyebut.',
        hints: [{ stepOrder: 1, hintText: 'Cek apakah penyebut = 2 kali pembilang.' }],
      },
    ],
  },
  {
    id: 'sd-matematika-03',
    educationStage: 'SD',
    phase: 'FASE_B',
    subjectCode: 'MATH_SD',
    subjectName: 'Matematika',
    unitTitle: 'Operasi pada Garis Bilangan',
    title: 'Penjumlahan dan Pengurangan pada Garis Bilangan',
    summary: 'Menjumlah dan mengurang bilangan cacah dengan melompat pada garis bilangan.',
    learningObjective:
      'Siswa dapat menyelesaikan penjumlahan dan pengurangan bilangan cacah sampai 100 menggunakan garis bilangan.',
    curriculumAchievementId: CP,
    difficultyLevel: 'INTERMEDIATE',
    estimatedDurationMinutes: 12,
    orderIndex: 2,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ANIMATION',
        payload: {
          animationId: 'number-line-walk',
          steps: [
            { atMs: 0, caption: 'Mulai di angka 12.', frame: 'start-12' },
            { atMs: 600, caption: 'Melompat 5 ke kanan: +5.', frame: 'jump-right' },
            { atMs: 1200, caption: 'Berhenti di 17. Jadi 12 + 5 = 17.', frame: 'land-17' },
          ],
        },
        transcriptText:
          'Animasi menunjukkan lompatan dari 12 sejauh 5 satuan ke kanan hingga tiba di 17.',
        fallbackStorageKey: `${A}/sd-03-fallback.svg`,
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'NUMBER_LINE_EXPLORER',
            params: { min: 0, max: 20, step: 1, initial: 12, markers: [0, 5, 10, 15, 20] },
          },
        },
      },
    ],
    questions: [
      numberLine(
        'sd-03-q1',
        'Mulai dari 8, lompat 6 ke kanan. Di angka berapa kamu berhenti?',
        { min: 0, max: 20, step: 1, targetValue: 14 },
        '8 + 6 = 14.',
        ['Lompat satu-satu enam kali dari 8.'],
      ),
      numberLine(
        'sd-03-q2',
        'Mulai dari 15, lompat 9 ke kiri. Di angka berapa kamu berhenti?',
        { min: 0, max: 20, step: 1, targetValue: 6 },
        '15 - 9 = 6.',
        ['Melompat ke kiri berarti mengurang.'],
      ),
      mc(
        'sd-03-q3',
        'Lompatan dari 20 ke 13 pada garis bilangan menunjukkan...',
        [
          { id: 'a', text: '20 - 7' },
          { id: 'b', text: '20 + 7' },
          { id: 'c', text: '13 - 7' },
        ],
        'a',
        'Bergerak 7 langkah ke kiri dari 20, yaitu 20 - 7 = 13.',
        ['Arah kiri = pengurangan; hitung jumlah langkahnya.'],
      ),
      shortAnswer(
        'sd-03-q4',
        'Berapakah 24 + 18?',
        ['42', 'empat puluh dua'],
        '24 + 18 = 42 (24 + 16 = 40, lalu + 2).',
        ['Pecah 18 menjadi 16 + 2 agar mudah.'],
      ),
      {
        id: 'sd-03-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan operasi: hasilnya "kurang dari 30" atau "30 atau lebih".',
        contentPayload: {
          items: [
            { id: 'i1', label: '12 + 15' },
            { id: 'i2', label: '40 - 8' },
            { id: 'i3', label: '19 + 6' },
            { id: 'i4', label: '25 + 9' },
          ],
          groups: [
            { id: 'lt30', label: 'Kurang dari 30' },
            { id: 'ge30', label: '30 atau lebih' },
          ],
          correctMapping: { i1: 'lt30', i2: 'ge30', i3: 'lt30', i4: 'ge30' },
          requireAllPlaced: true,
          explanation: '12+15=27 dan 19+6=25 (< 30). 40-8=32 dan 25+9=34 (≥ 30).',
        },
        explanation: 'Hitung tiap operasi lebih dulu, lalu bandingkan dengan 30.',
        hints: [{ stepOrder: 1, hintText: 'Selesaikan operasinya, baru kelompokkan.' }],
      },
    ],
  },
];
