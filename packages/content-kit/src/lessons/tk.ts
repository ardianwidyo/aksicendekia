import type { InteractiveLesson } from './types.js';

/**
 * TK — Numerasi & Literasi Dasar (Fase Fondasi).
 * Picture-first: every option carries an illustration, every block/question has
 * narrationText, no SHORT_ANSWER, 2-3 options (FR-017a-b, gates A7/A8, T1-T5).
 * All lessons stay at REVIEW (FR-030a).
 */

const CP = 'cp-foundation-paud-numerasi';
const A = 'assets/lessons/tk';

function mc(
  id: string,
  promptText: string,
  narrationText: string,
  options: Array<{ id: string; text: string; asset: string }>,
  correctOptionId: string,
  explanation: string,
  hint: string,
): InteractiveLesson['questions'][number] {
  return {
    id,
    questionType: 'MULTIPLE_CHOICE',
    promptText,
    contentPayload: {
      options: options.map((o) => ({ id: o.id, text: o.text, illustrationAssetId: `${A}/${o.asset}` })),
      correctOptionId,
      explanation,
      narrationText,
    },
    explanation,
    hints: [{ stepOrder: 1, hintText: hint }],
  };
}

export const TK_LESSONS: InteractiveLesson[] = [
  {
    id: 'tk-numerasi-01',
    educationStage: 'TK',
    phase: 'FOUNDATION',
    subjectCode: 'NUMERASI_TK',
    subjectName: 'Numerasi & Literasi Dasar',
    unitTitle: 'Mengenal Bilangan',
    title: 'Menghitung Benda 1 sampai 5',
    summary: 'Menghitung banyak benda dan mencocokkannya dengan lambang bilangan 1-5.',
    learningObjective:
      'Anak dapat menyebut banyak benda 1-5 dan mencocokkannya dengan lambang bilangan melalui benda konkret.',
    curriculumAchievementId: CP,
    difficultyLevel: 'BEGINNER',
    estimatedDurationMinutes: 8,
    orderIndex: 0,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ANIMATION',
        payload: {
          animationId: 'count-objects',
          steps: [
            { atMs: 0, caption: 'Ada apel di keranjang. Mari kita hitung bersama.', frame: 'basket-empty' },
            { atMs: 800, caption: 'Satu... dua... tiga apel.', frame: 'basket-3' },
            { atMs: 1600, caption: 'Angka tiga untuk tiga apel.', frame: 'basket-3-label' },
          ],
        },
        transcriptText:
          'Animasi menghitung apel di keranjang satu per satu sampai tiga, lalu menampilkan lambang bilangan 3.',
        fallbackStorageKey: `${A}/tk-01-fallback.svg`,
        narrationText: 'Mari menghitung apel di keranjang satu per satu.',
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'STEP_REVEAL',
            params: {
              steps: [
                { title: 'Satu jari', body: 'Angkat satu jari sambil bilang "satu".' },
                { title: 'Dua jari', body: 'Tambah satu jari lagi, sekarang "dua".' },
                { title: 'Tiga jari', body: 'Satu jari lagi, jadi "tiga".' },
              ],
            },
          },
        },
        narrationText: 'Ikuti menghitung dengan jari: satu, dua, tiga.',
      },
    ],
    questions: [
      mc(
        'tk-01-q1',
        'Ada berapa bintang?',
        'Ada berapa bintang di gambar?',
        [
          { id: 'a', text: 'Dua', asset: 'tk-01-q1-2.svg' },
          { id: 'b', text: 'Tiga', asset: 'tk-01-q1-3.svg' },
          { id: 'c', text: 'Empat', asset: 'tk-01-q1-4.svg' },
        ],
        'b',
        'Kalau dihitung satu-satu, ada tiga bintang.',
        'Tunjuk setiap bintang sambil berhitung.',
      ),
      mc(
        'tk-01-q2',
        'Pilih gambar yang berisi 1 bola.',
        'Pilih gambar yang isinya hanya satu bola.',
        [
          { id: 'a', text: 'Satu bola', asset: 'tk-01-q2-1.svg' },
          { id: 'b', text: 'Dua bola', asset: 'tk-01-q2-2.svg' },
        ],
        'a',
        'Gambar pertama hanya punya satu bola.',
        'Cari gambar yang paling sedikit bolanya.',
      ),
      mc(
        'tk-01-q3',
        'Mana kumpulan yang berjumlah 5 buah?',
        'Kumpulan mana yang jumlahnya lima buah?',
        [
          { id: 'a', text: 'Empat buah', asset: 'tk-01-q3-4.svg' },
          { id: 'b', text: 'Lima buah', asset: 'tk-01-q3-5.svg' },
          { id: 'c', text: 'Enam buah', asset: 'tk-01-q3-6.svg' },
        ],
        'b',
        'Hitung satu-satu: kumpulan tengah berjumlah lima.',
        'Berhitung sambil menyentuh tiap buah.',
      ),
      mc(
        'tk-01-q4',
        'Lambang bilangan untuk dua kucing adalah...',
        'Angka mana untuk dua ekor kucing?',
        [
          { id: 'a', text: 'Angka 2', asset: 'tk-01-q4-2.svg' },
          { id: 'b', text: 'Angka 3', asset: 'tk-01-q4-3.svg' },
        ],
        'a',
        'Dua kucing ditulis dengan angka 2.',
        'Hitung dulu kucingnya, baru pilih angkanya.',
      ),
      {
        id: 'tk-01-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan gambar: sedikit (1-2) dan banyak (4-5).',
        contentPayload: {
          items: [
            { id: 'i1', label: '1 apel', illustrationAssetId: `${A}/tk-01-q5-1.svg` },
            { id: 'i2', label: '5 apel', illustrationAssetId: `${A}/tk-01-q5-5.svg` },
            { id: 'i3', label: '2 apel', illustrationAssetId: `${A}/tk-01-q5-2.svg` },
            { id: 'i4', label: '4 apel', illustrationAssetId: `${A}/tk-01-q5-4.svg` },
          ],
          groups: [
            { id: 'sedikit', label: 'Sedikit' },
            { id: 'banyak', label: 'Banyak' },
          ],
          correctMapping: { i1: 'sedikit', i2: 'banyak', i3: 'sedikit', i4: 'banyak' },
          requireAllPlaced: true,
          explanation: 'Satu dan dua termasuk sedikit; empat dan lima termasuk banyak.',
          narrationText: 'Pindahkan gambar ke kotak sedikit atau kotak banyak.',
        },
        explanation: 'Satu dan dua termasuk sedikit; empat dan lima termasuk banyak.',
        hints: [{ stepOrder: 1, hintText: 'Hitung dulu, lalu tanya: ini sedikit atau banyak?' }],
      },
    ],
  },
  {
    id: 'tk-numerasi-02',
    educationStage: 'TK',
    phase: 'FOUNDATION',
    subjectCode: 'NUMERASI_TK',
    subjectName: 'Numerasi & Literasi Dasar',
    unitTitle: 'Membandingkan Banyak',
    title: 'Lebih Banyak, Lebih Sedikit, Sama',
    summary: 'Membandingkan dua kumpulan benda: lebih banyak, lebih sedikit, atau sama banyak.',
    learningObjective:
      'Anak dapat membandingkan dua kumpulan benda dan menyatakan mana yang lebih banyak, lebih sedikit, atau sama.',
    curriculumAchievementId: CP,
    difficultyLevel: 'BEGINNER',
    estimatedDurationMinutes: 8,
    orderIndex: 1,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ILLUSTRATION',
        payload: { caption: 'Dua piring kue: satu berisi 2, satu berisi 4.' },
        altText: 'Dua piring, piring kiri berisi dua kue dan piring kanan berisi empat kue.',
        mediaStorageKey: `${A}/tk-02-compare.svg`,
        narrationText: 'Lihat dua piring kue. Mana yang kuenya lebih banyak?',
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'SORT_INTO_GROUPS',
            params: {
              items: [
                { id: 'p1', label: '3 vs 3', illustrationAssetId: `${A}/tk-02-w-33.svg` },
                { id: 'p2', label: '2 vs 5', illustrationAssetId: `${A}/tk-02-w-25.svg` },
                { id: 'p3', label: '4 vs 4', illustrationAssetId: `${A}/tk-02-w-44.svg` },
              ],
              groups: [
                { id: 'sama', label: 'Sama banyak' },
                { id: 'beda', label: 'Berbeda' },
              ],
            },
          },
        },
        narrationText: 'Coba kelompokkan: pasangan mana yang sama banyak?',
      },
    ],
    questions: [
      mc(
        'tk-02-q1',
        'Piring mana yang kuenya lebih banyak?',
        'Piring mana yang kuenya lebih banyak?',
        [
          { id: 'a', text: 'Piring kiri (2 kue)', asset: 'tk-02-q1-left.svg' },
          { id: 'b', text: 'Piring kanan (4 kue)', asset: 'tk-02-q1-right.svg' },
        ],
        'b',
        'Empat lebih banyak daripada dua.',
        'Hitung kue di tiap piring lalu bandingkan.',
      ),
      mc(
        'tk-02-q2',
        'Mana yang lebih sedikit?',
        'Kumpulan mana yang jumlahnya lebih sedikit?',
        [
          { id: 'a', text: '1 balon', asset: 'tk-02-q2-1.svg' },
          { id: 'b', text: '3 balon', asset: 'tk-02-q2-3.svg' },
        ],
        'a',
        'Satu lebih sedikit daripada tiga.',
        'Lebih sedikit berarti jumlahnya paling kecil.',
      ),
      mc(
        'tk-02-q3',
        'Dua kelompok ini...',
        'Apakah kedua kelompok ini sama banyak?',
        [
          { id: 'a', text: 'Sama banyak', asset: 'tk-02-q3-eq.svg' },
          { id: 'b', text: 'Tidak sama', asset: 'tk-02-q3-neq.svg' },
        ],
        'a',
        'Keduanya berisi tiga, jadi sama banyak.',
        'Pasangkan satu-satu. Kalau pas, berarti sama.',
      ),
      mc(
        'tk-02-q4',
        'Tambah berapa agar jumlahnya sama dengan kelompok kanan?',
        'Berapa yang harus ditambahkan agar kedua kelompok sama?',
        [
          { id: 'a', text: 'Tambah 1', asset: 'tk-02-q4-1.svg' },
          { id: 'b', text: 'Tambah 2', asset: 'tk-02-q4-2.svg' },
        ],
        'a',
        'Kelompok kiri kurang satu, jadi tambah satu.',
        'Hitung selisihnya dengan memasangkan.',
      ),
      {
        id: 'tk-02-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan: "lebih banyak dari 3" dan "kurang dari 3".',
        contentPayload: {
          items: [
            { id: 'i1', label: '2 bintang', illustrationAssetId: `${A}/tk-02-q5-2.svg` },
            { id: 'i2', label: '5 bintang', illustrationAssetId: `${A}/tk-02-q5-5.svg` },
            { id: 'i3', label: '1 bintang', illustrationAssetId: `${A}/tk-02-q5-1.svg` },
            { id: 'i4', label: '4 bintang', illustrationAssetId: `${A}/tk-02-q5-4.svg` },
          ],
          groups: [
            { id: 'lebih', label: 'Lebih dari 3' },
            { id: 'kurang', label: 'Kurang dari 3' },
          ],
          correctMapping: { i1: 'kurang', i2: 'lebih', i3: 'kurang', i4: 'lebih' },
          requireAllPlaced: true,
          explanation: 'Empat dan lima lebih dari tiga; satu dan dua kurang dari tiga.',
          narrationText: 'Pindahkan tiap gambar ke kotak yang tepat.',
        },
        explanation: 'Empat dan lima lebih dari tiga; satu dan dua kurang dari tiga.',
        hints: [{ stepOrder: 1, hintText: 'Bandingkan tiap gambar dengan tiga bintang.' }],
      },
    ],
  },
  {
    id: 'tk-numerasi-03',
    educationStage: 'TK',
    phase: 'FOUNDATION',
    subjectCode: 'NUMERASI_TK',
    subjectName: 'Numerasi & Literasi Dasar',
    unitTitle: 'Mengenal Bentuk',
    title: 'Lingkaran, Segitiga, dan Segi Empat',
    summary: 'Mengenali dan mengelompokkan bentuk dasar di sekitar kita.',
    learningObjective:
      'Anak dapat mengenali lingkaran, segitiga, dan segi empat serta mengelompokkan benda menurut bentuknya.',
    curriculumAchievementId: CP,
    difficultyLevel: 'BEGINNER',
    estimatedDurationMinutes: 8,
    orderIndex: 2,
    status: 'REVIEW',
    listing: 'LISTED',
    contentBlocks: [
      {
        blockType: 'ANIMATION',
        payload: {
          animationId: 'shapes-intro',
          steps: [
            { atMs: 0, caption: 'Ini lingkaran. Bulat, tanpa sudut.', frame: 'circle' },
            { atMs: 700, caption: 'Ini segitiga. Punya tiga sisi.', frame: 'triangle' },
            { atMs: 1400, caption: 'Ini segi empat. Punya empat sisi.', frame: 'square' },
          ],
        },
        transcriptText:
          'Animasi memperkenalkan lingkaran (bulat tanpa sudut), segitiga (tiga sisi), dan segi empat (empat sisi).',
        fallbackStorageKey: `${A}/tk-03-fallback.svg`,
        narrationText: 'Kenali tiga bentuk: lingkaran, segitiga, dan segi empat.',
      },
      {
        blockType: 'INTERACTIVE_WIDGET',
        payload: {
          widget: {
            widgetType: 'IMAGE_HOTSPOT',
            params: {
              mediaAssetId: `${A}/tk-03-room.svg`,
              hotspots: [
                { id: 'h1', xPercent: 25, yPercent: 40, label: 'Jam', body: 'Jam dinding berbentuk lingkaran.' },
                { id: 'h2', xPercent: 60, yPercent: 55, label: 'Rambu', body: 'Rambu ini berbentuk segitiga.' },
                { id: 'h3', xPercent: 80, yPercent: 35, label: 'Jendela', body: 'Jendela berbentuk segi empat.' },
              ],
            },
          },
        },
        narrationText: 'Tekan titik pada gambar untuk menemukan bentuknya.',
      },
    ],
    questions: [
      mc(
        'tk-03-q1',
        'Mana yang berbentuk lingkaran?',
        'Benda mana yang berbentuk lingkaran?',
        [
          { id: 'a', text: 'Roda', asset: 'tk-03-q1-circle.svg' },
          { id: 'b', text: 'Buku', asset: 'tk-03-q1-square.svg' },
        ],
        'a',
        'Roda berbentuk bulat, itu lingkaran.',
        'Lingkaran itu bulat dan tidak punya sudut.',
      ),
      mc(
        'tk-03-q2',
        'Segitiga punya berapa sisi?',
        'Berapa sisi sebuah segitiga?',
        [
          { id: 'a', text: 'Tiga sisi', asset: 'tk-03-q2-3.svg' },
          { id: 'b', text: 'Empat sisi', asset: 'tk-03-q2-4.svg' },
        ],
        'a',
        'Segitiga punya tiga sisi.',
        'Hitung garis pinggirnya.',
      ),
      mc(
        'tk-03-q3',
        'Pilih benda berbentuk segi empat.',
        'Benda mana yang berbentuk segi empat?',
        [
          { id: 'a', text: 'Bola', asset: 'tk-03-q3-circle.svg' },
          { id: 'b', text: 'Pintu', asset: 'tk-03-q3-square.svg' },
          { id: 'c', text: 'Topi ulang tahun', asset: 'tk-03-q3-triangle.svg' },
        ],
        'b',
        'Pintu berbentuk segi empat dengan empat sisi.',
        'Cari benda yang punya empat sisi lurus.',
      ),
      mc(
        'tk-03-q4',
        'Bentuk mana yang TIDAK punya sudut?',
        'Bentuk mana yang tidak memiliki sudut?',
        [
          { id: 'a', text: 'Lingkaran', asset: 'tk-03-q4-circle.svg' },
          { id: 'b', text: 'Segitiga', asset: 'tk-03-q4-triangle.svg' },
        ],
        'a',
        'Lingkaran mulus tanpa sudut.',
        'Sudut adalah tempat dua sisi bertemu.',
      ),
      {
        id: 'tk-03-q5',
        questionType: 'DRAG_DROP_GROUPING',
        promptText: 'Kelompokkan benda menurut bentuknya.',
        contentPayload: {
          items: [
            { id: 'i1', label: 'Koin', illustrationAssetId: `${A}/tk-03-q5-coin.svg` },
            { id: 'i2', label: 'Penggaris segitiga', illustrationAssetId: `${A}/tk-03-q5-triangle.svg` },
            { id: 'i3', label: 'Piring', illustrationAssetId: `${A}/tk-03-q5-plate.svg` },
            { id: 'i4', label: 'Bingkai foto', illustrationAssetId: `${A}/tk-03-q5-frame.svg` },
          ],
          groups: [
            { id: 'lingkaran', label: 'Lingkaran' },
            { id: 'segiempat', label: 'Segi empat' },
          ],
          correctMapping: { i1: 'lingkaran', i2: 'segiempat', i3: 'lingkaran', i4: 'segiempat' },
          requireAllPlaced: false,
          explanation: 'Koin dan piring berbentuk lingkaran; penggaris dan bingkai berbentuk segi empat.',
          narrationText: 'Pindahkan tiap benda ke kotak bentuk yang cocok.',
        },
        explanation:
          'Koin dan piring berbentuk lingkaran; penggaris segitiga dan bingkai foto berbentuk segi empat.',
        hints: [{ stepOrder: 1, hintText: 'Lihat garis pinggir benda: bulat atau punya sisi lurus?' }],
      },
    ],
  },
];
