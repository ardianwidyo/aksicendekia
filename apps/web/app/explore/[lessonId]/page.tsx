'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, ProgressBar, useTheme } from '@aksicendekia/ui';
import { BookOpen, Sparkles, Clock, Target, ArrowLeft, Play, Award } from 'lucide-react';
import Link from 'next/link';
import { useGuestProgress } from '../../../lib/context/guest-progress-context';

export default function LessonDetailPage() {
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
          const data = await res.json();
          setLesson(data);
        } else {
          // Fallback sample lesson for standalone preview
          setLesson({
            id: lessonId,
            title: 'Mengenal Angka & Nilai Tempat',
            summary: 'Pahami konsep satuan, puluhan, dan ratusan dengan ilustrasi benda nyata.',
            learningObjective: 'Siswa mampu membaca dan menguraikan bilangan hingga 100.',
            educationStage: gradeLevel.toUpperCase(),
            difficultyLevel: 'BEGINNER',
            estimatedDurationMinutes: 10,
            questionItems: [
              {
                id: 'q1',
                questionType: 'MULTIPLE_CHOICE',
                promptText: 'Berapakah jumlah puluhan pada angka 45?',
                contentPayload: {
                  options: [
                    { id: 'opt_a', text: '4' },
                    { id: 'opt_b', text: '5' },
                    { id: 'opt_c', text: '40' },
                  ],
                  correct_option_id: 'opt_a',
                  explanation: 'Angka 45 terdiri dari 4 puluhan (40) dan 5 satuan (5).',
                },
                hints: [{ stepOrder: 1, hintText: 'Perhatikan angka yang berada di posisi depan (kiri).' }],
              },
              {
                id: 'q2',
                questionType: 'SHORT_ANSWER',
                promptText: 'Tuliskan nama bilangan dari lambang angka 10 dalam huruf kecil:',
                contentPayload: {
                  matching_mode: 'NORMALIZED',
                  accepted_answers: ['sepuluh'],
                  explanation: 'Angka 10 dibaca sebagai "sepuluh".',
                },
                hints: [{ stepOrder: 1, hintText: 'Dimulai dengan huruf s dan diakhiri huruf h.' }],
              },
            ],
          });
        }
      } catch {
        // Fallback sample lesson
        setLesson({
          id: lessonId,
          title: 'Mengenal Angka & Nilai Tempat',
          summary: 'Pahami konsep satuan, puluhan, dan ratusan dengan ilustrasi benda nyata.',
          learningObjective: 'Siswa mampu membaca dan menguraikan bilangan hingga 100.',
          educationStage: gradeLevel.toUpperCase(),
          difficultyLevel: 'BEGINNER',
          estimatedDurationMinutes: 10,
          questionItems: [
            {
              id: 'q1',
              questionType: 'MULTIPLE_CHOICE',
              promptText: 'Berapakah jumlah puluhan pada angka 45?',
              contentPayload: {
                options: [
                  { id: 'opt_a', text: '4' },
                  { id: 'opt_b', text: '5' },
                  { id: 'opt_c', text: '40' },
                ],
                correct_option_id: 'opt_a',
                explanation: 'Angka 45 terdiri dari 4 puluhan (40) dan 5 satuan (5).',
              },
              hints: [{ stepOrder: 1, hintText: 'Perhatikan angka yang berada di posisi depan.' }],
            },
          ],
        });
      } finally {
        setLoading(false);
      }
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

        {/* Learning Objective */}
        {lesson.learningObjective && (
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/15 space-y-1">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Capaian Pembelajaran
            </h4>
            <p className="text-xs text-on-surface leading-relaxed">
              {lesson.learningObjective}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
