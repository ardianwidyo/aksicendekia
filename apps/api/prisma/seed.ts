import { PrismaClient, EducationStage, CurriculumPhase, ContentStatus, DifficultyLevel, QuestionType, MatchingMode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed database for AksiCendekia Feature 003...");

  // Clean existing curriculum seed data if any
  await prisma.questionHint.deleteMany();
  await prisma.questionItem.deleteMany();
  await prisma.lessonPrerequisite.deleteMany();
  await prisma.studentLessonProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.subject.deleteMany();

  // Helper generator for 10 rich questions per lesson
  function generate10Questions(lessonId: string, subjectTag: string, lessonIdx: number) {
    const questions = [];

    for (let i = 1; i <= 10; i++) {
      let qType: QuestionType = QuestionType.MULTIPLE_CHOICE;
      let payload: any = {};

      if (i % 3 === 1) {
        // Multiple Choice
        qType = QuestionType.MULTIPLE_CHOICE;
        payload = {
          choices: [
            { id: "a", text: `Jawaban Opsi A untuk Soal ${i} (${subjectTag})`, isCorrect: true },
            { id: "b", text: `Jawaban Opsi B untuk Soal ${i} (${subjectTag})`, isCorrect: false },
            { id: "c", text: `Jawaban Opsi C untuk Soal ${i} (${subjectTag})`, isCorrect: false },
            { id: "d", text: `Jawaban Opsi D untuk Soal ${i} (${subjectTag})`, isCorrect: false },
          ],
        };
      } else if (i % 3 === 2) {
        // Short Answer
        qType = QuestionType.SHORT_ANSWER;
        payload = {
          acceptedAnswers: [
            i === 2 ? "10" : i === 5 ? "Satuan Si" : i === 8 ? "Panjang" : `Jawaban ${i}`,
            i === 2 ? "Sepuluh" : i === 5 ? "SI" : `jawaban ${i}`,
          ],
          matchingMode: MatchingMode.NORMALIZED,
        };
      } else {
        // Matching Pairs
        qType = QuestionType.MATCHING_PAIRS;
        payload = {
          pairs: [
            { id: "p1", left: `Item Kiri 1 (Soal ${i})`, right: `Item Kanan 1 (Soal ${i})` },
            { id: "p2", left: `Item Kiri 2 (Soal ${i})`, right: `Item Kanan 2 (Soal ${i})` },
            { id: "p3", left: `Item Kiri 3 (Soal ${i})`, right: `Item Kanan 3 (Soal ${i})` },
          ],
        };
      }

      questions.push({
        lessonId,
        questionType: qType,
        promptText: `Pertanyaan Butir Soal Ke-${i} mengenai materi Pelajaran ${lessonIdx} [${subjectTag}]: Bagaimana konsep dasar dan penerapan prinsip ini dalam konteks pembelajaran Kurikulum Merdeka?`,
        contentPayload: payload,
        explanation: `Pembahasan rinci untuk soal ke-${i} (${subjectTag}): Jawaban benar didasarkan pada definisi standar Kurikulum Merdeka dan pemahaman konsep mendasar.`,
        orderIndex: i,
        status: ContentStatus.PUBLISHED,
        hints: {
          create: [
            { stepOrder: 1, hintText: `Petunjuk Tahap 1: Perhatikan kata kunci utama pada soal ke-${i}.` },
            { stepOrder: 2, hintText: `Petunjuk Tahap 2: Eliminasi opsi yang tidak sesuai dengan prinsip dasar ${subjectTag}.` },
          ],
        },
      });
    }

    return questions;
  }

  // 1. SD SEED DATA (Matematika SD - Fase B)
  const subjectSD = await prisma.subject.create({
    data: {
      code: "MATH_SD",
      name: "Matematika SD",
      educationStage: EducationStage.SD,
      phase: CurriculumPhase.FASE_B,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  const unitSD = await prisma.unit.create({
    data: {
      subjectId: subjectSD.id,
      title: "Unit 1: Bilangan Cacah & Operasi Hitung",
      description: "Memahami bilangan cacah sampai 10.000 dan operasi penjumlahan serta pengurangan.",
      orderIndex: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const lessonSD1 = await prisma.lesson.create({
    data: {
      unitId: unitSD.id,
      title: "Pelajaran 1: Mengenal Nilai Tempat Bilangan Cacah",
      summary: "Memahami ribuan, ratusan, puluhan, dan satuan pada bilangan cacah.",
      learningObjective: "Siswa mampu mengidentifikasi nilai tempat bilangan cacah hingga 10.000.",
      educationStage: EducationStage.SD,
      phase: CurriculumPhase.FASE_B,
      difficultyLevel: DifficultyLevel.BEGINNER,
      estimatedDurationMinutes: 30,
      orderIndex: 1,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  const lessonSD2 = await prisma.lesson.create({
    data: {
      unitId: unitSD.id,
      title: "Pelajaran 2: Penjumlahan Tanpa Menyimpan",
      summary: "Menguasai operasi penjumlahan bilangan cacah 4 angka tanpa teknik menyimpan.",
      learningObjective: "Siswa mampu menjumlahkan dua bilangan cacah 4 angka.",
      educationStage: EducationStage.SD,
      phase: CurriculumPhase.FASE_B,
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      estimatedDurationMinutes: 40,
      orderIndex: 2,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  const lessonSD3 = await prisma.lesson.create({
    data: {
      unitId: unitSD.id,
      title: "Pelajaran 3: Pengurangan Dengan Teknik Meminjam",
      summary: "Menguasai operasi pengurangan bilangan cacah dengan teknik meminjam.",
      learningObjective: "Siswa mampu menyelesaikan persoalan pengurangan beruntun.",
      educationStage: EducationStage.SD,
      phase: CurriculumPhase.FASE_B,
      difficultyLevel: DifficultyLevel.ADVANCED,
      estimatedDurationMinutes: 45,
      orderIndex: 3,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  // SD Prerequisites: Lesson 2 requires Lesson 1; Lesson 3 requires Lesson 2
  await prisma.lessonPrerequisite.createMany({
    data: [
      { lessonId: lessonSD2.id, prerequisiteLessonId: lessonSD1.id },
      { lessonId: lessonSD3.id, prerequisiteLessonId: lessonSD2.id },
    ],
  });

  // Seed 30 SD Questions
  for (const q of generate10Questions(lessonSD1.id, "Matematika SD", 1)) await prisma.questionItem.create({ data: q });
  for (const q of generate10Questions(lessonSD2.id, "Matematika SD", 2)) await prisma.questionItem.create({ data: q });
  for (const q of generate10Questions(lessonSD3.id, "Matematika SD", 3)) await prisma.questionItem.create({ data: q });

  console.log("✅ Seed SD Data Completed: 1 Subject, 1 Unit, 3 Lessons, 30 Questions");

  // 2. SMP SEED DATA (IPA Terpadu SMP - Fase D)
  const subjectSMP = await prisma.subject.create({
    data: {
      code: "IPA_SMP",
      name: "Ilmu Pengetahuan Alam SMP",
      educationStage: EducationStage.SMP,
      phase: CurriculumPhase.FASE_D,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  const unitSMP = await prisma.unit.create({
    data: {
      subjectId: subjectSMP.id,
      title: "Unit 1: Hakikat Sains & Metode Ilmiah",
      description: "Pengenalan langkah-langkah metode ilmiah dan keselamatan kerja di laboratorium.",
      orderIndex: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const lessonSMP1 = await prisma.lesson.create({
    data: {
      unitId: unitSMP.id,
      title: "Pelajaran 1: Mengenal Alat Laboratorium & K3",
      summary: "Memahami alat ukur laboratorium IPA dan simbol bahaya bahan kimia.",
      learningObjective: "Siswa mampu mengidentifikasi alat laboratorium sains beserta fungsinya.",
      educationStage: EducationStage.SMP,
      phase: CurriculumPhase.FASE_D,
      difficultyLevel: DifficultyLevel.BEGINNER,
      estimatedDurationMinutes: 35,
      orderIndex: 1,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  const lessonSMP2 = await prisma.lesson.create({
    data: {
      unitId: unitSMP.id,
      title: "Pelajaran 2: Tahapan Metode Ilmiah & Hipotesis",
      summary: "Merumuskan masalah, hipotesis, variabel bebas, terikat, dan kontrol.",
      learningObjective: "Siswa mampu merancang percobaan ilmiah sederhana.",
      educationStage: EducationStage.SMP,
      phase: CurriculumPhase.FASE_D,
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      estimatedDurationMinutes: 45,
      orderIndex: 2,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  const lessonSMP3 = await prisma.lesson.create({
    data: {
      unitId: unitSMP.id,
      title: "Pelajaran 3: Pengukuran & Pengolahan Data Hasil Percobaan",
      summary: "Mencatat hasil observasi, membuat grafik, dan menarik kesimpulan.",
      learningObjective: "Siswa mampu menganalisis data hasil pengamatan ilmiah.",
      educationStage: EducationStage.SMP,
      phase: CurriculumPhase.FASE_D,
      difficultyLevel: DifficultyLevel.ADVANCED,
      estimatedDurationMinutes: 50,
      orderIndex: 3,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  await prisma.lessonPrerequisite.createMany({
    data: [
      { lessonId: lessonSMP2.id, prerequisiteLessonId: lessonSMP1.id },
      { lessonId: lessonSMP3.id, prerequisiteLessonId: lessonSMP2.id },
    ],
  });

  for (const q of generate10Questions(lessonSMP1.id, "IPA SMP", 1)) await prisma.questionItem.create({ data: q });
  for (const q of generate10Questions(lessonSMP2.id, "IPA SMP", 2)) await prisma.questionItem.create({ data: q });
  for (const q of generate10Questions(lessonSMP3.id, "IPA SMP", 3)) await prisma.questionItem.create({ data: q });

  console.log("✅ Seed SMP Data Completed: 1 Subject, 1 Unit, 3 Lessons, 30 Questions");

  // 3. SMA SEED DATA (Fisika SMA - Fase E)
  const subjectSMA = await prisma.subject.create({
    data: {
      code: "PHYS_SMA",
      name: "Fisika SMA",
      educationStage: EducationStage.SMA,
      phase: CurriculumPhase.FASE_E,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  const unitSMA = await prisma.unit.create({
    data: {
      subjectId: subjectSMA.id,
      title: "Unit 1: Vektor dan Kinematika Gerak Lurus",
      description: "Konsep dasar besaran vektor, gerak lurus beraturan (GLB) dan gerak lurus berubah beraturan (GLBB).",
      orderIndex: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const lessonSMA1 = await prisma.lesson.create({
    data: {
      unitId: unitSMA.id,
      title: "Pelajaran 1: Vektor & Penjumlahan Vektor",
      summary: "Memahami besaran skalar vs vektor dan analisis komponen vektor sumbu x dan y.",
      learningObjective: "Siswa mampu menjumlahkan dua atau lebih vektor dalam bidang 2D.",
      educationStage: EducationStage.SMA,
      phase: CurriculumPhase.FASE_E,
      difficultyLevel: DifficultyLevel.BEGINNER,
      estimatedDurationMinutes: 45,
      orderIndex: 1,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  const lessonSMA2 = await prisma.lesson.create({
    data: {
      unitId: unitSMA.id,
      title: "Pelajaran 2: Gerak Lurus Beraturan (GLB)",
      summary: "Grafik posisi terhadap waktu (s-t) dan kecepatan terhadap waktu (v-t) pada GLB.",
      learningObjective: "Siswa mampu mengkalkulasi jarak dan waktu tempuh benda pada GLB.",
      educationStage: EducationStage.SMA,
      phase: CurriculumPhase.FASE_E,
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      estimatedDurationMinutes: 50,
      orderIndex: 2,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  const lessonSMA3 = await prisma.lesson.create({
    data: {
      unitId: unitSMA.id,
      title: "Pelajaran 3: Gerak Lurus Berubah Beraturan (GLBB)",
      summary: "Persamaan Kinematika GLBB, percepatan konstan, dan gerak jatuh bebas.",
      learningObjective: "Siswa mampu memecahkan persamaan GLBB dan gerak jatuh bebas.",
      educationStage: EducationStage.SMA,
      phase: CurriculumPhase.FASE_E,
      difficultyLevel: DifficultyLevel.ADVANCED,
      estimatedDurationMinutes: 60,
      orderIndex: 3,
      status: ContentStatus.PUBLISHED,
      version: 1,
    },
  });

  await prisma.lessonPrerequisite.createMany({
    data: [
      { lessonId: lessonSMA2.id, prerequisiteLessonId: lessonSMA1.id },
      { lessonId: lessonSMA3.id, prerequisiteLessonId: lessonSMA2.id },
    ],
  });

  for (const q of generate10Questions(lessonSMA1.id, "Fisika SMA", 1)) await prisma.questionItem.create({ data: q });
  for (const q of generate10Questions(lessonSMA2.id, "Fisika SMA", 2)) await prisma.questionItem.create({ data: q });
  for (const q of generate10Questions(lessonSMA3.id, "Fisika SMA", 3)) await prisma.questionItem.create({ data: q });

  console.log("✅ Seed SMA Data Completed: 1 Subject, 1 Unit, 3 Lessons, 30 Questions");
  console.log("🎉 Total Seed Completed: 3 Subjects, 3 Units, 9 Lessons, 90 Questions (All PUBLISHED with hints & explanations)!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
