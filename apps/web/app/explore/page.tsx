'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar, useTheme, useI18n } from '@aksicendekia/ui';
import { BookOpen, CheckCircle, ArrowRight, Sparkles, Clock } from 'lucide-react';
import Link from 'next/link';
import { useGuestProgress } from '../../lib/context/guest-progress-context';

interface LessonSummary {
  id: string;
  title: string;
  summary: string;
  difficultyLevel: string;
  estimatedDurationMinutes: number;
}

interface UnitSummary {
  id: string;
  title: string;
  description?: string;
  lessons: LessonSummary[];
}

interface SubjectSummary {
  id: string;
  code: string;
  name: string;
  units: UnitSummary[];
}

const STAGES = [
  { id: 'tk', label: 'TK / PAUD' },
  { id: 'sd', label: 'Sekolah Dasar (SD)' },
  { id: 'smp', label: 'SMP / Sederajat' },
  { id: 'sma', label: 'SMA / SMK' },
];

export default function ExplorePage() {
  const { gradeLevel, setGradeLevel } = useTheme();
  const { state } = useGuestProgress();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      setLoading(true);
      try {
        const stageUpper = gradeLevel.toUpperCase();
        const res = await fetch(`http://localhost:4000/api/v1/public/subjects?stage=${stageUpper}`);
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.subjects || []);
        } else {
          // Fallback sample data if backend is not actively running during static render
          setSubjects([
            {
              id: 'sub_math',
              code: `MATH_${stageUpper}`,
              name: `Matematika ${stageUpper}`,
              units: [
                {
                  id: 'unit_1',
                  title: 'Unit 1: Bilangan & Operasi Hitung',
                  description: 'Konsep dasar angka dan logika berhitung',
                  lessons: [
                    {
                      id: 'lesson_m1',
                      title: 'Mengenal Angka & Nilai Tempat',
                      summary: 'Belajar membaca dan menulis angka secara visual',
                      difficultyLevel: 'BEGINNER',
                      estimatedDurationMinutes: 10,
                    },
                    {
                      id: 'lesson_m2',
                      title: 'Penjumlahan & Pengurangan Cepat',
                      summary: 'Latihan taktik berhitung penjumlahan seru',
                      difficultyLevel: 'BEGINNER',
                      estimatedDurationMinutes: 15,
                    },
                  ],
                },
              ],
            },
            {
              id: 'sub_ipa',
              code: `IPA_${stageUpper}`,
              name: `Ilmu Pengetahuan Alam (IPA) ${stageUpper}`,
              units: [
                {
                  id: 'unit_2',
                  title: 'Unit 1: Makhluk Hidup & Lingkungan',
                  description: 'Eksplorasi alam semesta dan rantai makanan',
                  lessons: [
                    {
                      id: 'lesson_i1',
                      title: 'Klasifikasi Tumbuhan dan Hewan',
                      summary: 'Mengenal ciri-ciri makhluk hidup di sekitar',
                      difficultyLevel: 'BEGINNER',
                      estimatedDurationMinutes: 12,
                    },
                  ],
                },
              ],
            },
          ]);
        }
      } catch {
        // Fallback sample data for offline / standalone preview
        const stageUpper = gradeLevel.toUpperCase();
        setSubjects([
          {
            id: 'sub_math',
            code: `MATH_${stageUpper}`,
            name: `Matematika ${stageUpper}`,
            units: [
              {
                id: 'unit_1',
                title: 'Unit 1: Bilangan & Operasi Hitung',
                description: 'Konsep dasar angka dan logika berhitung',
                lessons: [
                  {
                    id: 'lesson_m1',
                    title: 'Mengenal Angka & Nilai Tempat',
                    summary: 'Belajar membaca dan menulis angka secara visual',
                    difficultyLevel: 'BEGINNER',
                    estimatedDurationMinutes: 10,
                  },
                ],
              },
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, [gradeLevel]);

  const completedLessonIds = state?.curriculumProgress.completedLessonIds || [];

  return (
    <div className="space-y-8">
      {/* Header & Stage Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-on-surface">
            Jelajah Kurikulum Merdeka
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Pilih mata pelajaran dan materi belajar yang ingin kamu pelajari hari ini.
          </p>
        </div>

        {/* Level Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-surface-container rounded-2xl border border-outline/15">
          {STAGES.map((s) => {
            const active = gradeLevel === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setGradeLevel(s.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                  active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Curriculum Subjects & Lessons */}
      {loading ? (
        <div className="text-center py-16 text-on-surface-variant text-sm font-medium">
          Memuat kurikulum materi...
        </div>
      ) : subjects.length === 0 ? (
        <Card variant="surface" padding="lg" className="text-center py-12">
          <p className="text-on-surface-variant text-sm">
            Belum ada materi pelajaran yang diterbitkan untuk jenjang ini.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {subjects.map((subject) => (
            <div key={subject.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-lg md:text-xl font-heading font-bold text-on-surface">
                  {subject.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {subject.units.map((unit) => (
                  <Card key={unit.id} variant="surface" padding="md" className="space-y-4 border border-outline/15">
                    <div>
                      <h3 className="text-base font-bold text-on-surface">{unit.title}</h3>
                      {unit.description && (
                        <p className="text-xs text-on-surface-variant mt-0.5">{unit.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {unit.lessons.map((lesson) => {
                        const isCompleted = completedLessonIds.includes(lesson.id);
                        return (
                          <div
                            key={lesson.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              isCompleted
                                ? 'bg-emerald-500/5 border-emerald-500/30'
                                : 'bg-surface border-outline/15 hover:border-primary/40'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-bold text-on-surface">{lesson.title}</h4>
                                {isCompleted && (
                                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="w-4 h-4" />
                                    Selesai
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-on-surface-variant line-clamp-2">
                                {lesson.summary}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-outline/10 text-xs text-on-surface-variant">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {lesson.estimatedDurationMinutes} Menit
                              </span>

                              <Link href={`/explore/${lesson.id}`}>
                                <Button
                                  variant={isCompleted ? 'ghost' : 'primary'}
                                  size="sm"
                                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                                >
                                  {isCompleted ? 'Ulangi Materi' : 'Mulai Belajar'}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
