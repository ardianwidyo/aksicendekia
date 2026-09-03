import { buildGrade, type LessonBrief } from './_authoring.js';

/**
 * Kelas 4 — Fase B. Bilangan cacah sampai 10.000, perkalian/pembagian, pecahan
 * sederhana, satuan baku panjang/berat, keliling & ciri bangun datar, diagram
 * batang. `sd-matematika-03` (dulu Fase B lepas kelas) di-assign ke kelas 4 (T067).
 */
const BRIEFS: LessonBrief[] = [
  {
    id: 'sd-matematika-03',
    archetype: 'place-value',
    element: 'bilangan',
    unitTitle: 'Bilangan Cacah sampai 10.000',
    title: 'Nilai Tempat sampai Ribuan',
    summary: 'Membaca, menulis, dan menguraikan nilai tempat bilangan cacah sampai 10.000.',
    learningObjective: 'Siswa dapat menentukan nilai tempat serta menyusun dan mengurai bilangan sampai 10.000.',
    params: { numbers: [3482, 5764, 2305, 4060, 9999, 1263], askPlaces: [3, 2, 1] },
  },
  {
    id: 'sd-mtk-k4-02',
    archetype: 'number-line',
    element: 'bilangan',
    unitTitle: 'Operasi pada Garis Bilangan',
    title: 'Penjumlahan dan Pengurangan sampai 10.000',
    summary: 'Menjumlah dan mengurang bilangan cacah besar dengan melompat pada garis bilangan.',
    learningObjective: 'Siswa dapat menyelesaikan penjumlahan dan pengurangan bilangan sampai 10.000.',
    params: { min: 0, max: 10000, step: 500, jumps: [[2000, 1500], [4500, 3000], [8000, -2500], [6500, -4000], [1000, 4500]] },
  },
  {
    id: 'sd-mtk-k4-03',
    archetype: 'operations',
    element: 'bilangan',
    unitTitle: 'Perkalian dan Pembagian',
    title: 'Perkalian dan Pembagian Bersusun',
    summary: 'Menyelesaikan perkalian dan pembagian bilangan cacah dua angka.',
    learningObjective: 'Siswa dapat menyelesaikan perkalian dan pembagian bilangan cacah sampai 1.000.',
    params: { operation: 'MIX', factPairs: [[12, 4], [15, 6], [24, 3], [18, 5], [21, 7], [16, 8]] },
  },
  {
    id: 'sd-mtk-k4-04',
    archetype: 'fractions',
    element: 'bilangan',
    unitTitle: 'Pecahan Sederhana',
    title: 'Pecahan sebagai Bagian dari Keseluruhan',
    summary: 'Mengenal pecahan sebagai bagian yang sama besar dan membandingkan pecahan sederhana.',
    learningObjective: 'Siswa dapat menyatakan dan membandingkan pecahan sederhana.',
    params: {
      denominators: [2, 3, 4, 6, 8],
      compares: [
        [1, 2, 1, 4],
        [2, 4, 1, 2],
        [3, 6, 1, 2],
        [2, 3, 3, 4],
        [1, 3, 2, 5],
      ],
    },
  },
  {
    id: 'sd-mtk-k4-05',
    archetype: 'patterns',
    element: 'aljabar',
    unitTitle: 'Kalimat Matematika',
    title: 'Mengisi Nilai yang Belum Diketahui',
    summary: 'Mengisi nilai yang belum diketahui pada kalimat penjumlahan dan pengurangan sampai 100.',
    learningObjective: 'Siswa dapat mengisi nilai yang belum diketahui dalam kalimat matematika sampai 100.',
    params: { sequences: [{ start: 6, diff: 6 }, { start: 15, diff: 5 }, { start: 48, diff: -4 }, { start: 9, diff: 9 }, { start: 90, diff: -7 }] },
  },
  {
    id: 'sd-mtk-k4-06',
    archetype: 'number-line',
    element: 'aljabar',
    unitTitle: 'Keseimbangan Operasi',
    title: 'Menyeimbangkan Kedua Sisi',
    summary: 'Menentukan bilangan agar kedua sisi tanda "=" bernilai sama pada bilangan cacah sampai 100.',
    learningObjective: 'Siswa dapat menyeimbangkan kalimat matematika penjumlahan dan pengurangan sampai 100.',
    params: { min: 0, max: 100, step: 2, jumps: [[36, 24], [50, -14], [62, 20], [80, -26], [40, 34]] },
  },
  {
    id: 'sd-mtk-k4-07',
    archetype: 'measurement',
    element: 'pengukuran',
    unitTitle: 'Satuan Panjang Baku',
    title: 'Hubungan cm dan m',
    summary: 'Mengukur panjang dengan satuan baku dan mengubah antara cm dan m.',
    learningObjective: 'Siswa dapat menentukan hubungan antar-satuan panjang cm dan m.',
    params: {
      quantity: 'panjang',
      base: 'm',
      sub: 'cm',
      factor: 100,
      objects: [
        { name: 'pensil', sub: 15 },
        { name: 'meja', sub: 120 },
        { name: 'buku', sub: 25 },
        { name: 'papan tulis', sub: 300 },
        { name: 'penggaris', sub: 30 },
      ],
    },
  },
  {
    id: 'sd-mtk-k4-08',
    archetype: 'time',
    element: 'pengukuran',
    unitTitle: 'Durasi dan Jadwal',
    title: 'Menghitung Durasi Kegiatan',
    summary: 'Membaca jam dan menghitung lama kegiatan yang melewati satu jam.',
    learningObjective: 'Siswa dapat menghitung durasi kegiatan dan menentukan waktu selesai.',
    params: {
      times: [
        { h: 6, m: 45 },
        { h: 14, m: 15 },
        { h: 10, m: 30 },
        { h: 17, m: 5 },
        { h: 8, m: 50 },
      ],
      durations: [
        [6, 30, 75],
        [14, 0, 105],
        [10, 45, 50],
      ],
    },
  },
  {
    id: 'sd-mtk-k4-09',
    archetype: 'geometry',
    element: 'geometri',
    unitTitle: 'Keliling Bangun Datar',
    title: 'Ciri Bangun Datar dan Keliling',
    summary: 'Mendeskripsikan ciri bangun datar serta menghitung keliling dan luas persegi panjang.',
    learningObjective: 'Siswa dapat mendeskripsikan ciri bangun datar dan menghitung keliling/luas persegi panjang.',
    params: {
      shapes: [
        { name: 'segitiga', sides: 3, vertices: 3 },
        { name: 'persegi', sides: 4, vertices: 4 },
        { name: 'segi lima', sides: 5, vertices: 5 },
        { name: 'segi enam', sides: 6, vertices: 6 },
      ],
      rects: [
        [5, 3],
        [8, 2],
        [6, 6],
        [7, 4],
      ],
    },
  },
  {
    id: 'sd-mtk-k4-10',
    archetype: 'data-chart',
    element: 'data',
    unitTitle: 'Menafsirkan Data',
    title: 'Diagram Batang dan Piktogram',
    summary: 'Membaca, membandingkan, dan menafsirkan data pada diagram batang dan piktogram.',
    learningObjective: 'Siswa dapat menganalisis dan menafsirkan data dalam bentuk tabel, piktogram, dan diagram batang.',
    params: {
      categories: [
        { name: 'Sepak bola', count: 12 },
        { name: 'Basket', count: 8 },
        { name: 'Voli', count: 5 },
        { name: 'Renang', count: 9 },
      ],
    },
  },
];

export const { lessons: KELAS_4_LESSONS, videos: KELAS_4_VIDEOS } = buildGrade(4, BRIEFS);
