import { buildGrade, type LessonBrief } from './_authoring.js';

/**
 * Kelas 3 — Fase B. Bilangan cacah sampai 1.000, perkalian/pembagian, pengukuran
 * satuan baku, ciri bangun datar, diagram batang skala satu satuan.
 * `sd-matematika-01` dan `sd-matematika-02` (dulu Fase B lepas kelas) di-assign
 * ke kelas 3 di sini alih-alih diduplikasi (T066).
 */
const BRIEFS: LessonBrief[] = [
  {
    id: 'sd-matematika-01',
    archetype: 'place-value',
    element: 'bilangan',
    unitTitle: 'Bilangan Cacah sampai 1.000',
    title: 'Nilai Tempat sampai Ratusan',
    summary: 'Membaca, menulis, dan menguraikan nilai tempat bilangan cacah sampai 1.000.',
    learningObjective: 'Siswa dapat menentukan nilai tempat serta menyusun dan mengurai bilangan sampai 1.000.',
    params: { numbers: [348, 576, 205, 640, 999, 126], askPlaces: [2, 1, 0] },
  },
  {
    id: 'sd-matematika-02',
    archetype: 'number-line',
    element: 'bilangan',
    unitTitle: 'Operasi pada Garis Bilangan',
    title: 'Penjumlahan dan Pengurangan sampai 1.000',
    summary: 'Menjumlah dan mengurang bilangan cacah sampai 1.000 pada garis bilangan.',
    learningObjective: 'Siswa dapat menyelesaikan penjumlahan dan pengurangan sampai 1.000 pada garis bilangan.',
    params: { min: 0, max: 1000, step: 50, jumps: [[200, 150], [450, 300], [800, -250], [650, -400], [100, 450]] },
  },
  {
    id: 'sd-mtk-k3-03',
    archetype: 'operations',
    element: 'bilangan',
    unitTitle: 'Perkalian dan Pembagian',
    title: 'Perkalian dan Pembagian Bilangan Cacah',
    summary: 'Menyelesaikan perkalian dan pembagian melalui pengelompokan.',
    learningObjective: 'Siswa dapat menyelesaikan perkalian dan pembagian bilangan cacah sampai 100.',
    params: { operation: 'MIX', factPairs: [[4, 3], [6, 2], [5, 5], [7, 3], [8, 4], [9, 2]] },
  },
  {
    id: 'sd-mtk-k3-04',
    archetype: 'patterns',
    element: 'aljabar',
    unitTitle: 'Pola dan Kalimat Matematika',
    title: 'Bilangan yang Belum Diketahui',
    summary: 'Mengisi bilangan yang belum diketahui pada kalimat penjumlahan dan pengurangan sampai 100.',
    learningObjective: 'Siswa dapat mengisi nilai yang belum diketahui pada kalimat matematika sampai 100.',
    params: { sequences: [{ start: 5, diff: 5 }, { start: 12, diff: 4 }, { start: 30, diff: -3 }, { start: 7, diff: 7 }, { start: 100, diff: -10 }] },
  },
  {
    id: 'sd-mtk-k3-05',
    archetype: 'number-line',
    element: 'aljabar',
    unitTitle: 'Keseimbangan Kalimat Matematika',
    title: 'Menjaga Kedua Sisi Tetap Sama',
    summary: 'Memahami tanda "=" pada operasi penjumlahan dan pengurangan sampai 100.',
    learningObjective: 'Siswa dapat menentukan bilangan agar kedua sisi kalimat matematika bernilai sama.',
    params: { min: 0, max: 100, step: 2, jumps: [[24, 18], [40, -8], [56, 14], [72, -20], [30, 26]] },
  },
  {
    id: 'sd-mtk-k3-06',
    archetype: 'measurement',
    element: 'pengukuran',
    unitTitle: 'Satuan Panjang Baku',
    title: 'Sentimeter dan Meter',
    summary: 'Mengukur panjang dengan cm dan m serta hubungan antar-satuannya.',
    learningObjective: 'Siswa dapat mengukur panjang dengan satuan baku dan menentukan hubungan cm dan m.',
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
        { name: 'tali', sub: 250 },
      ],
    },
  },
  {
    id: 'sd-mtk-k3-07',
    archetype: 'time',
    element: 'pengukuran',
    unitTitle: 'Waktu dan Durasi',
    title: 'Membaca Jam dan Menghitung Lama Kegiatan',
    summary: 'Membaca jam sampai menit lima dan menghitung durasi sederhana.',
    learningObjective: 'Siswa dapat membaca jam analog dan menghitung durasi kegiatan.',
    params: {
      times: [
        { h: 7, m: 15 },
        { h: 13, m: 30 },
        { h: 9, m: 45 },
        { h: 16, m: 0 },
        { h: 6, m: 20 },
      ],
      durations: [
        [7, 0, 45],
        [13, 15, 90],
        [9, 30, 40],
      ],
    },
  },
  {
    id: 'sd-mtk-k3-08',
    archetype: 'geometry',
    element: 'geometri',
    unitTitle: 'Ciri Bangun Datar',
    title: 'Segitiga, Segiempat, dan Segi Banyak',
    summary: 'Mendeskripsikan ciri berbagai bangun datar dan menyusun bangun baru.',
    learningObjective: 'Siswa dapat mendeskripsikan ciri bangun datar serta menyusun dan menguraikannya.',
    params: {
      shapes: [
        { name: 'segitiga', sides: 3, vertices: 3 },
        { name: 'persegi', sides: 4, vertices: 4 },
        { name: 'jajar genjang', sides: 4, vertices: 4 },
        { name: 'segi lima', sides: 5, vertices: 5 },
      ],
    },
  },
  {
    id: 'sd-mtk-k3-09',
    archetype: 'data-chart',
    element: 'data',
    unitTitle: 'Diagram Batang',
    title: 'Membaca Diagram Batang Skala Satu Satuan',
    summary: 'Membaca dan menafsirkan diagram batang dengan skala satu satuan.',
    learningObjective: 'Siswa dapat membaca, membandingkan, dan menafsirkan data pada diagram batang.',
    params: {
      categories: [
        { name: 'Senin', count: 12 },
        { name: 'Selasa', count: 8 },
        { name: 'Rabu', count: 5 },
        { name: 'Kamis', count: 9 },
      ],
    },
  },
  {
    id: 'sd-mtk-k3-10',
    archetype: 'money',
    element: 'pengukuran',
    unitTitle: 'Belanja dan Kembalian',
    title: 'Menghitung Total Belanja dan Kembalian',
    summary: 'Menghitung total harga beberapa barang dan kembalian.',
    learningObjective: 'Siswa dapat menghitung total belanja dan kembalian dengan uang rupiah.',
    params: {
      paidWith: 10000,
      prices: [
        { item: 'pensil', price: 2500 },
        { item: 'penghapus', price: 1500 },
        { item: 'buku', price: 4000 },
        { item: 'penggaris', price: 3000 },
      ],
    },
  },
];

export const { lessons: KELAS_3_LESSONS, videos: KELAS_3_VIDEOS } = buildGrade(3, BRIEFS);
