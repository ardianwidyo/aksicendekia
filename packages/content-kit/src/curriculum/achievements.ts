/**
 * Official Kurikulum Merdeka Capaian Pembelajaran quotes — Feature 010 / FR-008, FR-008a.
 *
 * These are QUOTES, not paraphrases. Each carries the source document reference,
 * the URL it was retrieved from, and the retrieval date so a reviewer can trace
 * it back before a lesson is PUBLISHED (FR-030a).
 *
 * Primary source is Keputusan Kepala BSKAP Kemendikbudristek No. 032/H/KR/2024.
 * The primary PDF host (kurikulum.kemdikbud.go.id) was not reachable from the
 * build environment, so text below was captured from public mirrors that cite
 * SK BSKAP 032/2024. `needsPrimaryVerification: true` marks every row that a
 * human reviewer MUST confirm verbatim against the official salinan before the
 * referencing lessons move REVIEW -> PUBLISHED.
 */

// Feature 011 — FASE_A (kelas 1-2) and FASE_C (kelas 5-6) added: SD Matematika
// now spans all three SD phases, not just FASE_B (kelas 3-4).
export type CurriculumPhase = 'FOUNDATION' | 'FASE_A' | 'FASE_B' | 'FASE_C' | 'FASE_D' | 'FASE_E';
export type EducationStage = 'TK' | 'SD' | 'SMP' | 'SMA';

export interface CurriculumAchievement {
  id: string;
  educationStage: EducationStage;
  phase: CurriculumPhase;
  subjectCode: string;
  element: string;
  /** Verbatim quote from the official document. */
  achievementText: string;
  sourceDocument: string;
  sourceUrl: string;
  /** ISO date the text was retrieved. */
  retrievedAt: string;
  /** True until a reviewer confirms the quote against the primary BSKAP salinan. */
  needsPrimaryVerification: boolean;
}

const SK_BSKAP_032_2024 =
  'Keputusan Kepala BSKAP Kemendikbudristek No. 032/H/KR/2024 tentang Capaian Pembelajaran pada PAUD, Pendidikan Dasar, dan Pendidikan Menengah pada Kurikulum Merdeka';

const RETRIEVED_AT = '2026-09-01';

// Feature 011 — retrieved 2026-09-02 from the same mirror the Feature 010
// Fase B / Bilangan row already cites (kurikulummerdeka.com), which covers
// Fase A, B, and C together. Same `needsPrimaryVerification: true` caveat
// applies: a human reviewer MUST confirm each quote against the official
// BSKAP salinan before any referencing lesson moves REVIEW -> PUBLISHED.
const RETRIEVED_AT_011 = '2026-09-02';
const SD_MATEMATIKA_FASE_ABC_URL =
  'https://kurikulummerdeka.com/capaian-pembelajaran-cp-matematika-sd-fase-a-b-dan-ckurikulum-merdeka-2024/';

export const CURRICULUM_ACHIEVEMENTS: readonly CurriculumAchievement[] = [
  {
    id: 'cp-foundation-paud-numerasi',
    educationStage: 'TK',
    phase: 'FOUNDATION',
    subjectCode: 'NUMERASI_TK',
    element: 'Dasar-dasar Literasi, Matematika, Sains, Teknologi, Rekayasa, dan Seni',
    achievementText:
      'Matematika pada konteks PAUD meliputi kemampuan menyatakan hubungan antar bilangan dengan berbagai cara (kesadaran bilangan), mengidentifikasi pola, mengenali bentuk dan karakteristik benda di sekitar yang dapat dibandingkan dan diukur, mengklasifikasi objek, kesadaran mengenai waktu melalui proses eksplorasi, dan pengalaman langsung dengan benda-benda konkret di lingkungan.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: 'https://kurikulummerdeka.com/cp-paud-fondasi-2024-kurikulum-merdeka-di-bskap-032/',
    retrievedAt: RETRIEVED_AT,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-b-matematika-bilangan',
    educationStage: 'SD',
    phase: 'FASE_B',
    subjectCode: 'MATH_SD',
    element: 'Bilangan',
    achievementText:
      'Peserta didik menunjukkan pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 10.000. Mereka dapat membaca, menulis, menentukan nilai tempat, membandingkan, mengurutkan, menggunakan nilai tempat, melakukan komposisi dan dekomposisi bilangan tersebut.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl:
      'https://kurikulummerdeka.com/capaian-pembelajaran-cp-matematika-sd-fase-a-b-dan-ckurikulum-merdeka-2024/',
    retrievedAt: RETRIEVED_AT,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-d-matematika-aljabar',
    educationStage: 'SMP',
    phase: 'FASE_D',
    subjectCode: 'MATH_SMP',
    element: 'Aljabar',
    achievementText:
      'Mengenali, memprediksi dan menggeneralisasi pola dalam bentuk susunan benda dan bilangan; Menyatakan suatu situasi ke dalam bentuk aljabar; menggunakan sifat-sifat operasi (komutatif, asosiatif, dan distributif) untuk menghasilkan bentuk aljabar yang ekuivalen. Murid dapat memahami relasi dan fungsi (domain, kodomain, range) serta menyajikannya dalam bentuk diagram panah, tabel, himpunan pasangan berurutan, dan grafik.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: 'https://karyaanugrah.sch.id/rumus-cp/capaian-pembelajaran-matematika-fase-d/',
    retrievedAt: RETRIEVED_AT,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-e-matematika-aljabar',
    educationStage: 'SMA',
    phase: 'FASE_E',
    subjectCode: 'MATH_SMA',
    element: 'Aljabar',
    achievementText:
      'Di akhir fase E, peserta didik dapat menyelesaikan masalah yang berkaitan dengan sistem persamaan linear tiga variabel dan sistem pertidaksamaan linear dua variabel. Mereka dapat menyelesaikan masalah yang berkaitan dengan persamaan dan fungsi kuadrat (termasuk akar imajiner), dan persamaan eksponensial (berbasis sama) dan fungsi eksponensial.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: 'https://blog.kejarcita.id/capaian-pembelajaran-matematika-fase-e/',
    retrievedAt: RETRIEVED_AT,
    needsPrimaryVerification: true,
  },

  // --- Feature 011 — SD Matematika, Fase A (kelas 1-2) -----------------------
  {
    id: 'cp-fase-a-matematika-bilangan',
    educationStage: 'SD',
    phase: 'FASE_A',
    subjectCode: 'MATH_SD',
    element: 'Bilangan',
    achievementText:
      'Peserta didik menunjukkan pemahaman dan memiliki intuisi bilangan (number sense) pada bilangan cacah sampai 100. Peserta didik dapat membaca, menulis, menentukan nilai tempat, membandingkan, mengurutkan, serta melakukan komposisi (menyusun) dan dekomposisi (mengurai) bilangan.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-a-matematika-aljabar',
    educationStage: 'SD',
    phase: 'FASE_A',
    subjectCode: 'MATH_SD',
    element: 'Aljabar',
    achievementText:
      'Peserta didik dapat menunjukkan pemahaman makna simbol matematika "=" dalam suatu kalimat matematika yang terkait dengan penjumlahan dan pengurangan bilangan cacah sampai 20 menggunakan gambar.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-a-matematika-pengukuran',
    educationStage: 'SD',
    phase: 'FASE_A',
    subjectCode: 'MATH_SD',
    element: 'Pengukuran',
    achievementText:
      'Peserta didik dapat membandingkan panjang dan berat benda secara langsung, dan membandingkan durasi waktu. Mereka dapat mengukur dan mengestimasi panjang benda menggunakan satuan tidak baku.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-a-matematika-geometri',
    educationStage: 'SD',
    phase: 'FASE_A',
    subjectCode: 'MATH_SD',
    element: 'Geometri',
    achievementText:
      'Peserta didik dapat mengenal berbagai bangun datar (segitiga, segiempat, segibanyak, lingkaran) dan bangun ruang (balok, kubus, kerucut, dan bola).',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-a-matematika-data-peluang',
    educationStage: 'SD',
    phase: 'FASE_A',
    subjectCode: 'MATH_SD',
    element: 'Analisis Data dan Peluang',
    achievementText:
      'Peserta didik dapat mengurutkan, menyortir, mengelompokkan, membandingkan, dan menyajikan data dari banyak benda dengan menggunakan turus dan piktogram paling banyak 4 kategori.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },

  // --- Feature 011 — SD Matematika, Fase B (kelas 3-4) — Bilangan already ----
  // exists above (cp-fase-b-matematika-bilangan); the remaining 4 elements
  // for this phase are added here.
  {
    id: 'cp-fase-b-matematika-aljabar',
    educationStage: 'SD',
    phase: 'FASE_B',
    subjectCode: 'MATH_SD',
    element: 'Aljabar',
    achievementText:
      'Peserta didik dapat mengisi nilai yang belum diketahui dalam sebuah kalimat matematika yang berkaitan dengan penjumlahan dan pengurangan pada bilangan cacah sampai 100.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-b-matematika-pengukuran',
    educationStage: 'SD',
    phase: 'FASE_B',
    subjectCode: 'MATH_SD',
    element: 'Pengukuran',
    achievementText:
      'Peserta didik dapat mengukur panjang dan berat benda menggunakan satuan baku. Mereka dapat menentukan hubungan antar-satuan baku panjang (cm, m).',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-b-matematika-geometri',
    educationStage: 'SD',
    phase: 'FASE_B',
    subjectCode: 'MATH_SD',
    element: 'Geometri',
    achievementText:
      'Peserta didik dapat mendeskripsikan ciri berbagai bentuk bangun datar (segiempat, segitiga, segi banyak). Mereka dapat menyusun (komposisi) dan mengurai (dekomposisi) berbagai bangun datar dengan lebih dari satu cara jika memungkinkan.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-b-matematika-data-peluang',
    educationStage: 'SD',
    phase: 'FASE_B',
    subjectCode: 'MATH_SD',
    element: 'Analisis Data dan Peluang',
    achievementText:
      'Peserta didik dapat mengurutkan, membandingkan, menyajikan, menganalisis dan menginterpretasi data dalam bentuk tabel, diagram gambar, piktogram, dan diagram batang (skala satu satuan).',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },

  // --- Feature 011 — SD Matematika, Fase C (kelas 5-6) -----------------------
  {
    id: 'cp-fase-c-matematika-bilangan',
    educationStage: 'SD',
    phase: 'FASE_C',
    subjectCode: 'MATH_SD',
    element: 'Bilangan',
    achievementText:
      'Peserta didik dapat menunjukkan pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 1.000.000. Mereka dapat membaca, menulis, menentukan nilai tempat, membandingkan, mengurutkan, melakukan komposisi dan dekomposisi bilangan tersebut.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-c-matematika-aljabar',
    educationStage: 'SD',
    phase: 'FASE_C',
    subjectCode: 'MATH_SD',
    element: 'Aljabar',
    achievementText:
      'Peserta didik dapat mengisi nilai yang belum diketahui dalam sebuah kalimat matematika yang berkaitan dengan penjumlahan, pengurangan, perkalian, dan pembagian pada bilangan cacah sampai 1000.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-c-matematika-pengukuran',
    educationStage: 'SD',
    phase: 'FASE_C',
    subjectCode: 'MATH_SD',
    element: 'Pengukuran',
    achievementText:
      'Peserta didik dapat menentukan keliling dan luas berbagai bentuk bangun datar (segitiga, segiempat, dan segi banyak) serta gabungannya.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-c-matematika-geometri',
    educationStage: 'SD',
    phase: 'FASE_C',
    subjectCode: 'MATH_SD',
    element: 'Geometri',
    achievementText:
      'Peserta didik dapat mengonstruksi dan mengurai bangun ruang (kubus, balok, dan gabungannya) dan mengenali visualisasi spasial (bagian depan, atas, dan samping).',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
  {
    id: 'cp-fase-c-matematika-data-peluang',
    educationStage: 'SD',
    phase: 'FASE_C',
    subjectCode: 'MATH_SD',
    element: 'Analisis Data dan Peluang',
    achievementText:
      'Peserta didik dapat mengurutkan, membandingkan, menyajikan, dan menganalisis data banyak benda dan data hasil pengukuran dalam bentuk gambar, piktogram, diagram batang, dan tabel frekuensi untuk mendapatkan informasi.',
    sourceDocument: SK_BSKAP_032_2024,
    sourceUrl: SD_MATEMATIKA_FASE_ABC_URL,
    retrievedAt: RETRIEVED_AT_011,
    needsPrimaryVerification: true,
  },
];

const BY_KEY = new Map<string, CurriculumAchievement>(
  CURRICULUM_ACHIEVEMENTS.map((a) => [`${a.phase}::${a.subjectCode}::${a.element}`, a]),
);

export function getAchievement(
  phase: CurriculumPhase,
  subjectCode: string,
  element: string,
): CurriculumAchievement | undefined {
  return BY_KEY.get(`${phase}::${subjectCode}::${element}`);
}

export function getAchievementById(id: string): CurriculumAchievement | undefined {
  return CURRICULUM_ACHIEVEMENTS.find((a) => a.id === id);
}
