import { buildGrade, type LessonBrief } from './_authoring.js';

/**
 * Kelas 1 — Fase A. Bilangan cacah sampai 20-40, makna simbol "=", pengukuran
 * dengan satuan tidak baku, bangun datar dasar, dan piktogram sampai 4 kategori.
 * Semua pelajaran picture-first (kelas 1-2, O8).
 */
const BRIEFS: LessonBrief[] = [
  {
    id: 'sd-mtk-k1-01',
    archetype: 'place-value',
    element: 'bilangan',
    unitTitle: 'Bilangan sampai 20',
    title: 'Puluhan dan Satuan sampai 20',
    summary: 'Mengenal puluhan dan satuan pada bilangan sampai 20 dengan blok.',
    learningObjective: 'Siswa dapat menyusun dan mengurai bilangan sampai 20 menjadi puluhan dan satuan.',
    params: { numbers: [12, 15, 10, 18, 14, 11], askPlaces: [1, 0] },
  },
  {
    id: 'sd-mtk-k1-02',
    archetype: 'number-line',
    element: 'bilangan',
    unitTitle: 'Garis Bilangan sampai 20',
    title: 'Menghitung Maju dan Mundur sampai 20',
    summary: 'Menghitung maju dan mundur pada garis bilangan sampai 20.',
    learningObjective: 'Siswa dapat menentukan hasil hitung maju/mundur sampai 20 pada garis bilangan.',
    params: {
      min: 0,
      max: 20,
      step: 1,
      jumps: [
        [3, 4],
        [10, 5],
        [15, -6],
        [7, 8],
        [18, -9],
      ],
    },
  },
  {
    id: 'sd-mtk-k1-03',
    archetype: 'operations',
    element: 'bilangan',
    unitTitle: 'Penjumlahan Berkelompok',
    title: 'Menjumlah Kelompok Benda',
    summary: 'Menjumlah beberapa kelompok benda yang jumlahnya sama.',
    learningObjective: 'Siswa dapat menjumlah kelompok benda sebagai dasar perkalian.',
    params: {
      operation: 'MUL',
      factPairs: [
        [2, 2],
        [2, 3],
        [3, 2],
        [2, 4],
        [3, 3],
      ],
    },
  },
  {
    id: 'sd-mtk-k1-04',
    archetype: 'number-line',
    element: 'bilangan',
    unitTitle: 'Urutan Bilangan',
    title: 'Mengurutkan Bilangan sampai 20',
    summary: 'Membandingkan dan mengurutkan bilangan sampai 20 pada garis.',
    learningObjective: 'Siswa dapat mengurutkan bilangan sampai 20 dari terkecil ke terbesar.',
    params: {
      min: 0,
      max: 20,
      step: 1,
      jumps: [
        [5, 2],
        [12, 3],
        [9, 4],
        [16, 2],
        [1, 7],
      ],
    },
  },
  {
    id: 'sd-mtk-k1-05',
    archetype: 'patterns',
    element: 'aljabar',
    unitTitle: 'Pola Sederhana',
    title: 'Melanjutkan Pola Bilangan',
    summary: 'Menemukan aturan pola bilangan naik dan turun yang sederhana.',
    learningObjective: 'Siswa dapat melanjutkan pola bilangan dengan selisih tetap.',
    params: {
      sequences: [
        { start: 1, diff: 1 },
        { start: 2, diff: 2 },
        { start: 10, diff: -1 },
        { start: 0, diff: 5 },
        { start: 3, diff: 3 },
      ],
    },
  },
  {
    id: 'sd-mtk-k1-06',
    archetype: 'number-line',
    element: 'aljabar',
    unitTitle: 'Makna Tanda Sama Dengan',
    title: 'Kalimat Matematika yang Seimbang',
    summary: 'Memahami tanda "=" sebagai keseimbangan dua sisi kalimat matematika.',
    learningObjective: 'Siswa dapat mengisi bilangan agar kedua sisi tanda "=" bernilai sama sampai 20.',
    params: {
      min: 0,
      max: 20,
      step: 1,
      jumps: [
        [6, 4],
        [8, 2],
        [5, 5],
        [11, 3],
        [9, 6],
      ],
    },
  },
  {
    id: 'sd-mtk-k1-07',
    archetype: 'measurement',
    element: 'pengukuran',
    unitTitle: 'Panjang dengan Satuan Tidak Baku',
    title: 'Mengukur dengan Jengkal dan Langkah',
    summary: 'Membandingkan panjang benda menggunakan jengkal dan langkah.',
    learningObjective: 'Siswa dapat mengukur dan membandingkan panjang benda dengan satuan tidak baku.',
    params: {
      quantity: 'panjang',
      base: 'langkah',
      sub: 'jengkal',
      factor: 3,
      objects: [
        { name: 'meja', sub: 6 },
        { name: 'pintu', sub: 9 },
        { name: 'buku', sub: 2 },
        { name: 'lemari', sub: 12 },
        { name: 'karpet', sub: 15 },
      ],
    },
  },
  {
    id: 'sd-mtk-k1-08',
    archetype: 'time',
    element: 'pengukuran',
    unitTitle: 'Waktu Sehari-hari',
    title: 'Membaca Jam Tepat',
    summary: 'Membaca jam bulat (tepat) dan mengenal pagi, siang, sore, malam.',
    learningObjective: 'Siswa dapat membaca jam tepat pada jam analog.',
    params: {
      times: [
        { h: 7, m: 0 },
        { h: 12, m: 0 },
        { h: 8, m: 0 },
        { h: 15, m: 0 },
        { h: 6, m: 0 },
      ],
    },
  },
  {
    id: 'sd-mtk-k1-09',
    archetype: 'geometry',
    element: 'geometri',
    unitTitle: 'Mengenal Bangun Datar',
    title: 'Lingkaran, Segitiga, dan Segiempat',
    summary: 'Mengenal bentuk lingkaran, segitiga, dan segiempat di sekitar kita.',
    learningObjective: 'Siswa dapat mengenali bangun datar dari jumlah sisi dan sudutnya.',
    params: {
      shapes: [
        { name: 'lingkaran', sides: 0, vertices: 0 },
        { name: 'segitiga', sides: 3, vertices: 3 },
        { name: 'persegi', sides: 4, vertices: 4 },
        { name: 'persegi panjang', sides: 4, vertices: 4 },
      ],
    },
  },
  {
    id: 'sd-mtk-k1-10',
    archetype: 'data-chart',
    element: 'data',
    unitTitle: 'Menyajikan Data',
    title: 'Piktogram Buah Kesukaan',
    summary: 'Membaca piktogram sederhana sampai 4 kategori.',
    learningObjective: 'Siswa dapat membaca dan membandingkan data pada piktogram sampai 4 kategori.',
    params: {
      categories: [
        { name: 'Apel', count: 4 },
        { name: 'Jeruk', count: 6 },
        { name: 'Mangga', count: 3 },
        { name: 'Pisang', count: 5 },
      ],
    },
  },
];

export const { lessons: KELAS_1_LESSONS, videos: KELAS_1_VIDEOS } = buildGrade(1, BRIEFS);
