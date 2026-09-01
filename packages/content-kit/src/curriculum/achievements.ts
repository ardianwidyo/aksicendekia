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

export type CurriculumPhase = 'FOUNDATION' | 'FASE_B' | 'FASE_D' | 'FASE_E';
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
