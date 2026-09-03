'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar, useTheme, useI18n } from '@aksicendekia/ui';
import { BookOpen, CheckCircle, ArrowRight, Sparkles, Clock } from 'lucide-react';
import Link from 'next/link';
import { useGuestProgress } from '../../lib/context/guest-progress-context';
import { listExploreLessons, listSdGradeCatalog } from '../../lib/guest-lessons';
import { filterStageOptions } from '../../lib/focus';

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

/**
 * Feature 010 — build the catalog from the bundled content-kit lessons (LISTED
 * only; legacy lessons are excluded). Used when the API is unreachable, which is
 * always the case for the static-export production build.
 */
function buildCatalogFromContentKit(stageUpper: string): SubjectSummary[] {
  // Feature 011 (T080): SD Matematika is grouped into one unit per kelas 1-6.
  if (stageUpper === 'SD') {
    const groups = listSdGradeCatalog().filter((g) => g.lessons.length > 0);
    if (groups.length === 0) return [];
    return [
      {
        id: 'subject-SD',
        code: 'MATH_SD',
        name: 'Matematika SD',
        units: groups.map((g) => ({
          id: `unit-SD-k${g.gradeLevel}`,
          title: `Kelas ${g.gradeLevel}`,
          description: `Materi interaktif Matematika Kelas ${g.gradeLevel} — konsep, animasi, dan latihan.`,
          lessons: g.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            summary: l.summary,
            difficultyLevel: l.difficultyLevel,
            estimatedDurationMinutes: l.estimatedDurationMinutes,
          })),
        })),
      },
    ];
  }

  const lessons = listExploreLessons(stageUpper);
  if (lessons.length === 0) return [];
  const bySubject = new Map<string, LessonSummary[]>();
  const subjectName = new Map<string, string>();
  for (const l of lessons) {
    const key = `${l.educationStage}`;
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push({
      id: l.id,
      title: l.title,
      summary: l.summary,
      difficultyLevel: l.difficultyLevel,
      estimatedDurationMinutes: l.estimatedDurationMinutes,
    });
    subjectName.set(key, l.educationStage === 'TK' ? 'Numerasi & Literasi Dasar' : 'Matematika');
  }
  return [...bySubject.entries()].map(([key, subjectLessons]) => ({
    id: `subject-${key}`,
    code: `MATH_${key}`,
    name: `${subjectName.get(key)} ${key}`,
    units: [
      {
        id: `unit-${key}`,
        title: 'Materi Interaktif',
        description: 'Pelajari konsep dengan animasi dan manipulatif, lalu berlatih.',
        lessons: subjectLessons,
      },
    ],
  }));
}

export default function ExplorePage() {
  const { gradeLevel, setGradeLevel } = useTheme();
  const { state } = useGuestProgress();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  // Feature 011 — which kelas is open per subject; avoids one long vertical
  // stack of every grade (painful to scroll on a phone).
  const [activeUnit, setActiveUnit] = useState<Record<string, string>>({});
  const visibleStages = filterStageOptions(STAGES);

  // Focus mode (FR-002): if the active stage was filtered out, snap to an
  // in-focus one so the catalog never fetches an off-focus jenjang.
  useEffect(() => {
    if (visibleStages.length > 0 && !visibleStages.some((s) => s.id === gradeLevel)) {
      setGradeLevel(visibleStages[0].id as any);
    }
  }, [gradeLevel, visibleStages, setGradeLevel]);

  useEffect(() => {
    async function fetchSubjects() {
      setLoading(true);
      const stageUpper = gradeLevel.toUpperCase();
      try {
        const res = await fetch(`http://localhost:4000/api/v1/public/subjects?stage=${stageUpper}`);
        if (res.ok) {
          const data = await res.json();
          const apiSubjects: SubjectSummary[] = data.subjects || [];
          const hasLessons = apiSubjects.some((s) => s.units.some((u) => u.lessons.length > 0));
          setSubjects(hasLessons ? apiSubjects : buildCatalogFromContentKit(stageUpper));
        } else {
          setSubjects(buildCatalogFromContentKit(stageUpper));
        }
      } catch {
        setSubjects(buildCatalogFromContentKit(stageUpper));
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

        {/* Level Selector Tabs — hidden entirely when focus mode leaves one stage (FR-002) */}
        <div
          className="flex flex-wrap gap-1.5 p-1 bg-surface-container rounded-2xl border border-outline/15"
          hidden={visibleStages.length <= 1}
        >
          {visibleStages.map((s) => {
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
          {subjects.map((subject) => {
            const hasGradeTabs = subject.units.length > 1;
            const activeUnitId = activeUnit[subject.id] ?? subject.units[0]?.id;
            const shownUnits = hasGradeTabs
              ? subject.units.filter((u) => u.id === activeUnitId)
              : subject.units;
            return (
            <div key={subject.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-lg md:text-xl font-heading font-bold text-on-surface">
                  {subject.name}
                </h2>
              </div>

              {/* Kelas selector — one tap to switch grade, no scrolling a 6-grade stack. */}
              {hasGradeTabs && (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {subject.units.map((unit) => {
                    const active = unit.id === activeUnitId;
                    const done =
                      unit.lessons.length > 0 &&
                      unit.lessons.every((l) => completedLessonIds.includes(l.id));
                    return (
                      <button
                        key={unit.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setActiveUnit((prev) => ({ ...prev, [subject.id]: unit.id }))
                        }
                        className={`shrink-0 min-h-[44px] px-4 rounded-xl text-sm font-bold border transition-colors inline-flex items-center gap-1.5 ${
                          active
                            ? 'bg-primary text-on-primary border-primary shadow-sm'
                            : 'bg-surface text-on-surface-variant border-outline/20 hover:border-primary/40'
                        }`}
                      >
                        {unit.title}
                        {done && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {shownUnits.map((unit) => {
                  const unitIndex = subject.units.findIndex((u) => u.id === unit.id);
                  const unitDone =
                    unit.lessons.length > 0 &&
                    unit.lessons.every((l) => completedLessonIds.includes(l.id));
                  const nextUnit = subject.units[unitIndex + 1];
                  return (
                  <Card key={unit.id} id={unit.id} variant="surface" padding="md" className="space-y-4 border border-outline/15">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-on-surface">{unit.title}</h3>
                        {unit.description && (
                          <p className="text-xs text-on-surface-variant mt-0.5">{unit.description}</p>
                        )}
                      </div>
                      {unitDone && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircle className="w-4 h-4" />
                          Tuntas
                        </span>
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

                    {unitDone && nextUnit && (
                      <button
                        type="button"
                        onClick={() => {
                          if (hasGradeTabs) {
                            setActiveUnit((prev) => ({ ...prev, [subject.id]: nextUnit.id }));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          } else {
                            document
                              .getElementById(nextUnit.id)
                              ?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="flex w-full items-center justify-center gap-2 mt-1 min-h-[44px] rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/15 transition-colors"
                      >
                        Lanjut ke {nextUnit.title}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </Card>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
