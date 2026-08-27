"use client";

import React, { useState } from "react";
import { Button, Card } from "@aksicendekia/ui";

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 border-b border-slate-800 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`font-bold text-slate-100 ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-xs text-slate-400 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const CardFooter = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 border-t border-slate-800 ${className}`}>{children}</div>
);

type EducationStage = "SD" | "SMP" | "SMA";
type ContentStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
type QuestionType = "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "MATCHING_PAIRS";
type MatchingMode = "EXACT" | "CASE_INSENSITIVE" | "NORMALIZED";

interface Subject {
  id: string;
  code: string;
  name: string;
  educationStage: EducationStage;
  phase: string;
  status: ContentStatus;
  version: number;
}

interface Unit {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  orderIndex: number;
  status: ContentStatus;
}

interface Lesson {
  id: string;
  unitId: string;
  title: string;
  summary: string;
  learningObjective: string;
  educationStage: EducationStage;
  phase: string;
  difficultyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedDurationMinutes: number;
  orderIndex: number;
  status: ContentStatus;
  version: number;
  prerequisites: string[];
}

interface QuestionItem {
  id: string;
  lessonId: string;
  questionType: QuestionType;
  promptText: string;
  explanation: string;
  orderIndex: number;
  status: ContentStatus;
  hints: Array<{ stepOrder: number; hintText: string }>;
  multipleChoicePayload?: { choices: Array<{ id: string; text: string; isCorrect: boolean }> };
  shortAnswerPayload?: { acceptedAnswers: string[]; matchingMode: MatchingMode };
  matchingPairsPayload?: { pairs: Array<{ id: string; left: string; right: string }> };
}

// Initial Mock Seed Data for CMS Demo UI State
const initialSubjects: Subject[] = [
  { id: "s1", code: "MATH_SD", name: "Matematika SD", educationStage: "SD", phase: "FASE_B", status: "PUBLISHED", version: 1 },
  { id: "s2", code: "IPA_SMP", name: "IPA Terpadu SMP", educationStage: "SMP", phase: "FASE_D", status: "PUBLISHED", version: 1 },
  { id: "s3", code: "PHYS_SMA", name: "Fisika SMA", educationStage: "SMA", phase: "FASE_E", status: "PUBLISHED", version: 1 },
];

const initialUnits: Unit[] = [
  { id: "u1", subjectId: "s1", title: "Unit 1: Bilangan & Operasi Hitung", description: "Operasi cacah dan penjumlahan.", orderIndex: 1, status: "PUBLISHED" },
  { id: "u2", subjectId: "s2", title: "Unit 1: Hakikat Sains & Pengukuran", description: "Alat ukur dan metode ilmiah.", orderIndex: 1, status: "PUBLISHED" },
  { id: "u3", subjectId: "s3", title: "Unit 1: Kinematika Gerak Lurus", description: "GLB dan GLBB.", orderIndex: 1, status: "PUBLISHED" },
];

const initialLessons: Lesson[] = [
  { id: "l1", unitId: "u1", title: "Pelajaran 1: Nilai Tempat Bilangan", summary: "Ribuan, ratusan, puluhan.", learningObjective: "Mengenal nilai tempat.", educationStage: "SD", phase: "FASE_B", difficultyLevel: "BEGINNER", estimatedDurationMinutes: 30, orderIndex: 1, status: "PUBLISHED", version: 1, prerequisites: [] },
  { id: "l2", unitId: "u1", title: "Pelajaran 2: Penjumlahan Tanpa Menyimpan", summary: "Penjumlahan 4 angka.", learningObjective: "Menjumlahkan 4 angka.", educationStage: "SD", phase: "FASE_B", difficultyLevel: "INTERMEDIATE", estimatedDurationMinutes: 40, orderIndex: 2, status: "PUBLISHED", version: 1, prerequisites: ["l1"] },
  { id: "l3", unitId: "u1", title: "Pelajaran 3: Pengurangan Teknik Meminjam", summary: "Pengurangan beruntun.", learningObjective: "Pengurangan 4 angka.", educationStage: "SD", phase: "FASE_B", difficultyLevel: "ADVANCED", estimatedDurationMinutes: 45, orderIndex: 3, status: "PUBLISHED", version: 1, prerequisites: ["l2"] },
];

const initialQuestions: QuestionItem[] = [
  {
    id: "q1",
    lessonId: "l1",
    questionType: "MULTIPLE_CHOICE",
    promptText: "Berapakah nilai tempat angka 5 pada bilangan 3.524?",
    explanation: "Angka 5 berada di posisi ratusan sehingga bernilai 500.",
    orderIndex: 1,
    status: "PUBLISHED",
    hints: [
      { stepOrder: 1, hintText: "Hitung posisi dari paling kanan: satuan, puluhan, ratusan, ribuan." },
      { stepOrder: 2, hintText: "Angka 5 terletak pada urutan ketiga dari belakang." },
    ],
    multipleChoicePayload: {
      choices: [
        { id: "a", text: "Ribuan", isCorrect: false },
        { id: "b", text: "Ratusan", isCorrect: true },
        { id: "c", text: "Puluhan", isCorrect: false },
        { id: "d", text: "Satuan", isCorrect: false },
      ],
    },
  },
  {
    id: "q2",
    lessonId: "l1",
    questionType: "SHORT_ANSWER",
    promptText: "Tuliskan lambang bilangan untuk lima ribu empat ratus dua puluh!",
    explanation: "Lima ribu empat ratus dua puluh ditulis dalam angka 5420.",
    orderIndex: 2,
    status: "PUBLISHED",
    hints: [{ stepOrder: 1, hintText: "Gabungkan nilai ribuan 5000 + ratusan 400 + puluhan 20." }],
    shortAnswerPayload: {
      acceptedAnswers: ["5420", "5.420"],
      matchingMode: "NORMALIZED",
    },
  },
  {
    id: "q3",
    lessonId: "l1",
    questionType: "MATCHING_PAIRS",
    promptText: "Cocokkan bilangan di sebelah kiri dengan nilai tempat angka utamanya di sebelah kanan!",
    explanation: "Pasangkan angka ribuan dengan nilai tempat yang sesuai.",
    orderIndex: 3,
    status: "PUBLISHED",
    hints: [{ stepOrder: 1, hintText: "Perhatikan angka pertama di sebelah kiri setiap bilangan." }],
    matchingPairsPayload: {
      pairs: [
        { id: "p1", left: "7.000", right: "7 Ribuan" },
        { id: "p2", left: "400", right: "4 Ratusan" },
        { id: "p3", left: "90", right: "9 Puluhan" },
      ],
    },
  },
];

export default function AdminCurriculumPage() {
  const [selectedStage, setSelectedStage] = useState<EducationStage>("SD");
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("s1");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("u1");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("l1");

  // Modals & Editor state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // New Question Form state
  const [qType, setQType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [qPrompt, setQPrompt] = useState("");
  const [qExplanation, setQExplanation] = useState("");
  const [qHint1, setQHint1] = useState("");
  const [qHint2, setQHint2] = useState("");
  const [mcChoiceA, setMcChoiceA] = useState("");
  const [mcChoiceB, setMcChoiceB] = useState("");
  const [mcCorrect, setMcCorrect] = useState<"a" | "b">("a");
  const [saAnswers, setSaAnswers] = useState("");
  const [mpLeft1, setMpLeft1] = useState("");
  const [mpRight1, setMpRight1] = useState("");
  const [mpLeft2, setMpLeft2] = useState("");
  const [mpRight2, setMpRight2] = useState("");

  // Preview state
  const [previewItem, setPreviewItem] = useState<QuestionItem | null>(null);

  // CSV Import state
  const [csvContent, setCsvContent] = useState("");
  const [csvReport, setCsvReport] = useState<any | null>(null);

  // Status transitions
  const handleStatusChange = (type: "subject" | "unit" | "lesson" | "question", id: string, newStatus: ContentStatus) => {
    if (type === "subject") {
      setSubjects((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          if (s.status === "PUBLISHED" && newStatus === "DRAFT") {
            // Immutable versioning clone
            return { ...s, version: s.version + 1, status: "DRAFT" };
          }
          return { ...s, status: newStatus };
        })
      );
    } else if (type === "lesson") {
      setLessons((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          if (l.status === "PUBLISHED" && newStatus === "DRAFT") {
            return { ...l, version: l.version + 1, status: "DRAFT" };
          }
          return { ...l, status: newStatus };
        })
      );
    } else if (type === "question") {
      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
    }
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPrompt.trim()) return;

    let payload: any = {};
    if (qType === "MULTIPLE_CHOICE") {
      payload.multipleChoicePayload = {
        choices: [
          { id: "a", text: mcChoiceA || "Opsi A", isCorrect: mcCorrect === "a" },
          { id: "b", text: mcChoiceB || "Opsi B", isCorrect: mcCorrect === "b" },
        ],
      };
    } else if (qType === "SHORT_ANSWER") {
      payload.shortAnswerPayload = {
        acceptedAnswers: saAnswers ? saAnswers.split(",").map((s) => s.trim()) : ["Jawaban Benar"],
        matchingMode: "NORMALIZED",
      };
    } else if (qType === "MATCHING_PAIRS") {
      payload.matchingPairsPayload = {
        pairs: [
          { id: "p1", left: mpLeft1 || "Kiri 1", right: mpRight1 || "Kanan 1" },
          { id: "p2", left: mpLeft2 || "Kiri 2", right: mpRight2 || "Kanan 2" },
        ],
      };
    }

    const newQuestion: QuestionItem = {
      id: "q_" + Date.now(),
      lessonId: selectedLessonId,
      questionType: qType,
      promptText: qPrompt,
      explanation: qExplanation || "Pembahasan standar untuk butir soal.",
      orderIndex: questions.filter((q) => q.lessonId === selectedLessonId).length + 1,
      status: "DRAFT",
      hints: [
        { stepOrder: 1, hintText: qHint1 || "Petunjuk tahap pertama." },
        ...(qHint2 ? [{ stepOrder: 2, hintText: qHint2 }] : []),
      ],
      ...payload,
    };

    setQuestions((prev) => [...prev, newQuestion]);
    setShowQuestionModal(false);
    // Reset form
    setQPrompt("");
    setQExplanation("");
    setQHint1("");
    setQHint2("");
  };

  const handleRunCsvImport = () => {
    if (!csvContent.trim()) return;

    const lines = csvContent.split("\n").filter((l) => l.trim().length > 0);
    const errors: any[] = [];
    const created: QuestionItem[] = [];

    // Skip header line if present
    const dataLines = lines[0].toLowerCase().includes("question_type") ? lines.slice(1) : lines;

    dataLines.forEach((line, index) => {
      const rowNum = index + 2;
      const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      const [orderStr, typeStr, promptStr] = parts;

      if (!typeStr || !["MULTIPLE_CHOICE", "SHORT_ANSWER", "MATCHING_PAIRS"].includes(typeStr.toUpperCase())) {
        errors.push({ row: rowNum, column: "question_type", message: `Tipe '${typeStr}' tidak dikenal` });
        return;
      }
      if (!promptStr || promptStr.length < 3) {
        errors.push({ row: rowNum, column: "prompt_text", message: "Teks soal terlalu pendek (min 3 char)" });
        return;
      }

      created.push({
        id: "q_csv_" + Date.now() + "_" + index,
        lessonId: selectedLessonId,
        questionType: typeStr.toUpperCase() as QuestionType,
        promptText: promptStr,
        explanation: "Pembahasan impor CSV",
        orderIndex: created.length + 1,
        status: "PUBLISHED",
        hints: [{ stepOrder: 1, hintText: "Petunjuk Impor CSV" }],
        multipleChoicePayload: {
          choices: [
            { id: "a", text: "Opsi A CSV", isCorrect: true },
            { id: "b", text: "Opsi B CSV", isCorrect: false },
          ],
        },
      });
    });

    if (errors.length > 0) {
      setCsvReport({
        success: false,
        totalRows: dataLines.length,
        passedRows: dataLines.length - errors.length,
        failedRows: errors.length,
        errors,
      });
    } else {
      setQuestions((prev) => [...prev, ...created]);
      setCsvReport({
        success: true,
        totalRows: dataLines.length,
        passedRows: dataLines.length,
        failedRows: 0,
        errors: [],
        createdCount: created.length,
      });
    }
  };

  const filteredSubjects = subjects.filter((s) => s.educationStage === selectedStage);
  const filteredUnits = units.filter((u) => u.subjectId === selectedSubjectId);
  const filteredLessons = lessons.filter((l) => l.unitId === selectedUnitId);
  const filteredQuestions = questions.filter((q) => q.lessonId === selectedLessonId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Portal Admin CMS Kurikulum Merdeka</h1>
          <p className="text-sm text-slate-400">Pengelolaan Hirarki, Lifecycle Konten, Prasyarat, & Editor Butir Soal</p>
        </div>

        {/* Stage Filter */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 space-x-1">
          {(["SD", "SMP", "SMA"] as EducationStage[]).map((stage) => (
            <button
              key={stage}
              onClick={() => {
                setSelectedStage(stage);
                const sub = subjects.find((s) => s.educationStage === stage);
                if (sub) setSelectedSubjectId(sub.id);
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedStage === stage ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Jenjang {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Panel (Hierarchy) & Right Panel (Questions Editor & List) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Subject & Unit & Lesson Selectors */}
        <div className="space-y-6">
          {/* Subjects */}
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader className="py-3 border-b border-slate-800">
              <CardTitle className="text-sm font-semibold text-emerald-400 flex justify-between items-center">
                <span>1. Mata Pelajaran ({selectedStage})</span>
                <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  {filteredSubjects.length} Mata Pelajaran
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {filteredSubjects.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubjectId(sub.id);
                    const unit = units.find((u) => u.subjectId === sub.id);
                    if (unit) setSelectedUnitId(unit.id);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedSubjectId === sub.id
                      ? "border-emerald-500 bg-emerald-950/40 text-white"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{sub.name}</div>
                    <div className="text-xs text-slate-400">
                      Kode: <span className="font-mono">{sub.code}</span> | {sub.phase} | v{sub.version}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={sub.status} />
                    {sub.status === "PUBLISHED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-6 px-2 border-emerald-700 text-emerald-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange("subject", sub.id, "DRAFT");
                        }}
                      >
                        Edit Revisi
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Units / Bab */}
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader className="py-3 border-b border-slate-800">
              <CardTitle className="text-sm font-semibold text-emerald-400 flex justify-between items-center">
                <span>2. Unit / Bab</span>
                <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  {filteredUnits.length} Unit
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {filteredUnits.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    setSelectedUnitId(u.id);
                    const les = lessons.find((l) => l.unitId === u.id);
                    if (les) setSelectedLessonId(les.id);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedUnitId === u.id
                      ? "border-emerald-500 bg-emerald-950/40 text-white"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{u.title}</div>
                    <div className="text-xs text-slate-400">{u.description}</div>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Lessons */}
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader className="py-3 border-b border-slate-800">
              <CardTitle className="text-sm font-semibold text-emerald-400 flex justify-between items-center">
                <span>3. Pelajaran & Prasyarat</span>
                <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  {filteredLessons.length} Pelajaran
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {filteredLessons.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLessonId(l.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedLessonId === l.id
                      ? "border-emerald-500 bg-emerald-950/40 text-white"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{l.title}</div>
                    <div className="text-xs text-slate-400">
                      Tingkat: <span className="text-amber-400">{l.difficultyLevel}</span> | Durasi: {l.estimatedDurationMinutes}m | v{l.version}
                    </div>
                    {l.prerequisites.length > 0 && (
                      <div className="text-[11px] text-red-400 mt-1 font-mono">
                        🔒 Syarat: Pelajaran #{l.prerequisites.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={l.status} />
                    {l.status === "DRAFT" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange("lesson", l.id, "PUBLISHED");
                        }}
                        className="text-[10px] text-emerald-400 underline"
                      >
                        Terbitkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Question Items Management & Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader className="py-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-emerald-400">
                  Daftar Butir Soal (Pelajaran ID: {selectedLessonId})
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Total {filteredQuestions.length} Butir Soal Terdaftar (PG, Isian Singkat, Pasangan)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-200 text-xs"
                  onClick={() => setShowCsvModal(true)}
                >
                  📤 Impor CSV (500 Baris)
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  onClick={() => setShowQuestionModal(true)}
                >
                  ➕ Tambah Butir Soal
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Belum ada butir soal pada pelajaran ini. Klik "Tambah Butir Soal" atau "Impor CSV".
                </div>
              ) : (
                filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          {q.questionType}
                        </span>
                        <StatusBadge status={q.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPreviewItem(q);
                            setShowPreviewModal(true);
                          }}
                          className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900 px-3 py-1 rounded font-medium transition-all"
                        >
                          👁️ Pratinjau Interaktif
                        </button>
                        {q.status === "DRAFT" ? (
                          <button
                            onClick={() => handleStatusChange("question", q.id, "PUBLISHED")}
                            className="text-xs text-blue-400 hover:underline"
                          >
                            Terbitkan
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange("question", q.id, "DRAFT")}
                            className="text-xs text-amber-400 hover:underline"
                          >
                            Revisi Draf
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-sm font-medium text-slate-200">{q.promptText}</div>

                    {/* Question Type Content Snippet */}
                    <div className="text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-slate-300 font-mono">
                      {q.questionType === "MULTIPLE_CHOICE" && (
                        <div className="grid grid-cols-2 gap-2">
                          {q.multipleChoicePayload?.choices.map((c) => (
                            <div
                              key={c.id}
                              className={`p-1.5 rounded border ${
                                c.isCorrect
                                  ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold"
                                  : "border-slate-800 text-slate-400"
                              }`}
                            >
                              {c.id.toUpperCase()}. {c.text} {c.isCorrect && "✓"}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.questionType === "SHORT_ANSWER" && (
                        <div>
                          Jawaban Diterima:{" "}
                          <span className="text-emerald-400 font-bold">
                            [{q.shortAnswerPayload?.acceptedAnswers.join(", ")}]
                          </span>{" "}
                          (Mode: {q.shortAnswerPayload?.matchingMode})
                        </div>
                      )}

                      {q.questionType === "MATCHING_PAIRS" && (
                        <div className="space-y-1">
                          {q.matchingPairsPayload?.pairs.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-slate-300">
                              <span>{p.left}</span>
                              <span className="text-emerald-500">➔</span>
                              <span>{p.right}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hints & Explanation summary */}
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>
                        💡 <span className="font-semibold">Petunjuk ({q.hints.length}):</span>{" "}
                        {q.hints.map((h) => h.hintText).join(" | ")}
                      </div>
                      <div>
                        📘 <span className="font-semibold">Pembahasan:</span> {q.explanation}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal 1: Create Question Item Form */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-lg text-emerald-400">Editor Butir Soal Baru</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Pilih tipe soal, isi prompt, kunci jawaban, petunjuk bertingkat, dan pembahasan.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveQuestion}>
              <CardContent className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tipe Soal</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as QuestionType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="MULTIPLE_CHOICE">Pilihan Ganda (MULTIPLE_CHOICE)</option>
                    <option value="SHORT_ANSWER">Isian Singkat Toleran (SHORT_ANSWER)</option>
                    <option value="MATCHING_PAIRS">Mencocokkan Pasangan (MATCHING_PAIRS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Teks Soal / Pertanyaan</label>
                  <textarea
                    value={qPrompt}
                    onChange={(e) => setQPrompt(e.target.value)}
                    rows={2}
                    required
                    placeholder="Masukkan pertanyaan butir soal di sini..."
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                {/* Specific Type Forms */}
                {qType === "MULTIPLE_CHOICE" && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="font-semibold text-emerald-400">Opsi Pilihan Ganda</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400">Opsi A:</span>
                        <input
                          type="text"
                          value={mcChoiceA}
                          onChange={(e) => setMcChoiceA(e.target.value)}
                          placeholder="Teks Opsi A"
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400">Opsi B:</span>
                        <input
                          type="text"
                          value={mcChoiceB}
                          onChange={(e) => setMcChoiceB(e.target.value)}
                          placeholder="Teks Opsi B"
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Jawaban Benar:</span>
                      <select
                        value={mcCorrect}
                        onChange={(e) => setMcCorrect(e.target.value as "a" | "b")}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white mt-1"
                      >
                        <option value="a">Opsi A (Correct)</option>
                        <option value="b">Opsi B (Correct)</option>
                      </select>
                    </div>
                  </div>
                )}

                {qType === "SHORT_ANSWER" && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="font-semibold text-emerald-400">Jawaban Benar Diterima (Pisahkan Koma)</div>
                    <input
                      type="text"
                      value={saAnswers}
                      onChange={(e) => setSaAnswers(e.target.value)}
                      placeholder="misal: Jakarta, Dki jakarta, JAKARTA"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    />
                    <div className="text-[11px] text-slate-400">
                      Mode pencocokan toleran `NORMALIZED` mengabaikan huruf kapital, spasi berlebih, dan tanda baca.
                    </div>
                  </div>
                )}

                {qType === "MATCHING_PAIRS" && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="font-semibold text-emerald-400">Pasangan Kiri - Kanan</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={mpLeft1}
                        onChange={(e) => setMpLeft1(e.target.value)}
                        placeholder="Kiri 1"
                        className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                      />
                      <input
                        type="text"
                        value={mpRight1}
                        onChange={(e) => setMpRight1(e.target.value)}
                        placeholder="Kanan 1"
                        className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                      />
                      <input
                        type="text"
                        value={mpLeft2}
                        onChange={(e) => setMpLeft2(e.target.value)}
                        placeholder="Kiri 2"
                        className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                      />
                      <input
                        type="text"
                        value={mpRight2}
                        onChange={(e) => setMpRight2(e.target.value)}
                        placeholder="Kanan 2"
                        className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Petunjuk Bertingkat (Hints)</label>
                  <input
                    type="text"
                    value={qHint1}
                    onChange={(e) => setQHint1(e.target.value)}
                    placeholder="Petunjuk Tahap 1"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white mb-2"
                  />
                  <input
                    type="text"
                    value={qHint2}
                    onChange={(e) => setQHint2(e.target.value)}
                    placeholder="Petunjuk Tahap 2 (opsional)"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Pembahasan Jawaban Benar</label>
                  <textarea
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    rows={2}
                    placeholder="Penjelasan rinci mengapa jawaban tersebut benar..."
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-800 flex justify-end gap-2 p-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 text-slate-300 text-xs"
                  onClick={() => setShowQuestionModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">
                  Simpan Butir Soal
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Modal 2: Interactive Real-time Question Preview */}
      {showPreviewModal && previewItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg w-full">
            <CardHeader className="border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span>Pratinjau Tampilan Siswa (Feature 004 Engine)</span>
                </CardTitle>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {previewItem.questionType}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="text-base font-semibold text-white">{previewItem.promptText}</div>

              {/* Interactive Options Preview */}
              {previewItem.questionType === "MULTIPLE_CHOICE" && (
                <div className="space-y-2">
                  {previewItem.multipleChoicePayload?.choices.map((c) => (
                    <button
                      key={c.id}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                        c.isCorrect
                          ? "border-emerald-500 bg-emerald-950/50 text-emerald-300 font-semibold"
                          : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {c.id.toUpperCase()}. {c.text} {c.isCorrect && " (Jawaban Benar)"}
                    </button>
                  ))}
                </div>
              )}

              {previewItem.questionType === "SHORT_ANSWER" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    disabled
                    value={previewItem.shortAnswerPayload?.acceptedAnswers[0]}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-emerald-500 text-emerald-300 text-sm font-semibold"
                  />
                  <div className="text-xs text-slate-400">
                    Mode pencocokan toleran active ({previewItem.shortAnswerPayload?.matchingMode}).
                  </div>
                </div>
              )}

              {previewItem.questionType === "MATCHING_PAIRS" && (
                <div className="space-y-2">
                  {previewItem.matchingPairsPayload?.pairs.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <span className="font-semibold text-slate-200">{p.left}</span>
                      <span className="text-emerald-400 font-bold">➔</span>
                      <span className="font-semibold text-emerald-300">{p.right}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Hints */}
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/50 space-y-1">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  💡 Petunjuk Bertingkat Siswa
                </div>
                {previewItem.hints.map((h) => (
                  <div key={h.stepOrder} className="text-xs text-amber-200/80">
                    Tahap {h.stepOrder}: {h.hintText}
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-emerald-400">📘 Pembahasan Jawaban Benar</div>
                <div className="text-xs text-slate-300">{previewItem.explanation}</div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-800 flex justify-end p-4">
              <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 text-xs" onClick={() => setShowPreviewModal(false)}>
                Tutup Pratinjau
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Modal 3: CSV Mass Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100 max-w-xl w-full">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-base text-emerald-400">Impor Massal Butir Soal via CSV (hingga 500 Baris)</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Tempel atau unggah file CSV dengan kolom order_index, question_type, prompt_text, content_payload_json.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={6}
                placeholder={`order_index,question_type,prompt_text,content_payload_json\n1,MULTIPLE_CHOICE,"Soal 1","{""choices"":[{""id"":""a"",""text"":""A"",""isCorrect"":true}]}"`}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-200"
              />

              {csvReport && (
                <div className={`p-3 rounded-lg text-xs ${csvReport.success ? "bg-emerald-950 border border-emerald-800 text-emerald-300" : "bg-red-950 border border-red-800 text-red-300"}`}>
                  <div className="font-bold mb-1">
                    {csvReport.success ? "✅ Impor CSV Berhasil!" : "❌ Impor Gagal - Ditemukan Kesalahan Validasi"}
                  </div>
                  <div>
                    Total Baris: {csvReport.totalRows} | Berhasil: {csvReport.passedRows} | Gagal: {csvReport.failedRows}
                  </div>
                  {csvReport.errors.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {csvReport.errors.map((err: any, i: number) => (
                        <div key={i} className="font-mono text-[11px] bg-red-900/40 p-1 rounded">
                          Baris {err.row} [{err.column}]: {err.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t border-slate-800 flex justify-end gap-2 p-4">
              <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 text-xs" onClick={() => { setShowCsvModal(false); setCsvReport(null); }}>
                Tutup
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold" onClick={handleRunCsvImport}>
                Jalankan Impor
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const colors: Record<ContentStatus, string> = {
    DRAFT: "bg-slate-800 text-slate-300 border-slate-700",
    REVIEW: "bg-amber-950 text-amber-300 border-amber-800",
    PUBLISHED: "bg-emerald-950 text-emerald-300 border-emerald-800",
    ARCHIVED: "bg-red-950 text-red-400 border-red-900",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${colors[status]}`}>
      {status}
    </span>
  );
}
