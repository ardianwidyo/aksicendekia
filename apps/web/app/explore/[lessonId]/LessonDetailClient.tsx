'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, useTheme, LessonContentRenderer, type RenderableBlock } from '@aksicendekia/ui';
import { BookOpen, Sparkles, Clock, Target, ArrowLeft, Play, Award, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useGuestProgress } from '@/lib/context/guest-progress-context';

/** Map a content-kit / public-API block into the renderer's RenderableBlock. */
function toRenderableBlocks(raw: any[]): RenderableBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((b, i) => {
    const src = b.payload ?? b;
    const payload: Record<string, unknown> = { ...src };
    if (src.mediaStorageKey && !payload.imageUrl) payload.imageUrl = `/${src.mediaStorageKey}`;
    if (src.fallbackStorageKey) payload.fallbackImageUrl = `/${src.fallbackStorageKey}`;
    if (b.altText && !payload.altText) payload.altText = b.altText;
    if (b.transcriptText && !payload.transcriptText) payload.transcriptText = b.transcriptText;
    return {
      id: b.id ?? `b${i}`,
      blockType: b.blockType,
      payload,
      narrationText: b.narrationText ?? null,
    };
  });
}

export default function LessonDetailClient() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  const { gradeLevel } = useTheme();
  const { state } = useGuestProgress();

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLesson() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/api/v1/public/lessons/${lessonId}`);
        if (res.ok) {
          setLesson(await res.json());
          setLoading(false);
          return;
        }
      } catch {
        // fall through to the local content-kit fallback below
      }

      // T088 (SC-004/SC-006): the local lesson catalog (content-kit's 12 lessons +
      // legacy guest fixtures) is only imported here, on demand, so the initial
      // page bundle doesn't carry it when the public API answers successfully.
      const { getInteractiveLesson, getGuestLessonFallback } = await import('@/lib/guest-lessons');
      setLesson(getInteractiveLesson(lessonId) ?? getGuestLessonFallback(lessonId, gradeLevel));
      setLoading(false);
    }

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId, gradeLevel]);

  const isCompleted = state?.curriculumProgress.completedLessonIds.includes(lessonId) || false;
  const bestScore = state?.curriculumProgress.lessonScores[lessonId]?.bestScore;

  if (loading) {
    return (
      <div className="text-center py-16 text-on-surface-variant text-sm">
        Memuat detail pelajaran...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-on-surface-variant text-sm">Pelajaran tidak ditemukan.</p>
        <Link href="/explore">
          <Button variant="ghost">Kembali ke Katalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link href="/explore">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Jelajah Kurikulum</span>
        </button>
      </Link>

      {/* Main Lesson Hero Card */}
      <Card variant="surface" padding="lg" className="space-y-6 border border-primary/20 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Jenjang {lesson.educationStage}
            </span>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-on-surface">
              {lesson.title}
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
              {lesson.summary}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 w-full md:w-auto">
            <Link href={`/explore/${lessonId}/session`} className="w-full md:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full md:w-auto min-w-[200px]"
                leftIcon={<Play className="w-5 h-5 fill-current" />}
              >
                {isCompleted ? 'Kerjakan Ulang' : 'Mulai Belajar'}
              </Button>
            </Link>
            {isCompleted && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Skor Terbaik: {bestScore}%
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-outline/15 text-sm">
          <div className="flex items-center gap-3 p-3 bg-surface-container rounded-2xl">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-on-surface-variant">Estimasi Waktu</div>
              <div className="font-bold text-on-surface">
                {lesson.estimatedDurationMinutes} Menit
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-container rounded-2xl">
            <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-on-surface-variant">Jumlah Latihan</div>
              <div className="font-bold text-on-surface">
                {lesson.questionItems?.length || 0} Soal Interaktif
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-container rounded-2xl">
            <div className="p-2 rounded-xl bg-tertiary/10 text-tertiary">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-on-surface-variant">Tingkat Kesulitan</div>
              <div className="font-bold text-on-surface">
                {lesson.difficultyLevel || 'BEGINNER'}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Objective + official curriculum quote */}
        {lesson.learningObjective && (
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/15 space-y-1">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Capaian Pembelajaran
            </h4>
            <p className="text-xs text-on-surface leading-relaxed">{lesson.learningObjective}</p>
            {lesson.curriculumReference && (
              <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-xs italic text-on-surface-variant">
                &ldquo;{lesson.curriculumReference.achievementText}&rdquo;
                <cite className="mt-1 block not-italic">
                  — {lesson.curriculumReference.sourceDocument}
                </cite>
              </blockquote>
            )}
          </div>
        )}
      </Card>

      {/* Legacy notice — this route is kept alive but superseded (FR-031a) */}
      {lesson.supersededByLessonId && (
        <Card variant="surface" padding="md" className="border border-amber-300 bg-amber-50">
          <p className="text-sm text-amber-900">
            Materi ini punya versi interaktif yang lebih baru.{' '}
            <Link
              href={`/explore/${lesson.supersededByLessonId}`}
              className="inline-flex items-center gap-1 font-semibold underline"
            >
              Buka versi interaktif <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </Card>
      )}

      {/* Concept walkthrough (FR-010) */}
      {Array.isArray(lesson.contentBlocks) && lesson.contentBlocks.length > 0 && (
        <Card variant="surface" padding="lg" className="space-y-4">
          <h2 className="text-lg font-heading font-bold text-on-surface">Pelajari Konsepnya</h2>
          <LessonContentRenderer blocks={toRenderableBlocks(lesson.contentBlocks)} />
        </Card>
      )}
    </div>
  );
}
