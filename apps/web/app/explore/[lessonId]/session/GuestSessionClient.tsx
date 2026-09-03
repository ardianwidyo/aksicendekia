'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Button,
  ProgressBar,
  TactileOptionButton,
  TextInput,
  useTheme,
  DragDropGroupingQuestion,
  NumberLinePlacementQuestion,
  ListenButton,
} from '@aksicendekia/ui';
import { Sparkles, HelpCircle, CheckCircle, XCircle, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { LocalSessionEngine } from '@/lib/gamification/local-session-engine';
import { useGuestProgress } from '@/lib/context/guest-progress-context';
import { GuestSessionAnswerRecord } from '@/lib/gamification/guest-progress.schema';

export default function GuestSessionClient() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  const { gradeLevel } = useTheme();
  const { recordCompletedSession } = useGuestProgress();

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [answersLog, setAnswersLog] = useState<GuestSessionAnswerRecord[]>([]);
  const [startTime] = useState<string>(new Date().toISOString());

  useEffect(() => {
    async function loadLesson() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/api/v1/public/lessons/${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.questionItems) && data.questionItems.length > 0) {
            setLesson(data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // fall through to the local content-kit catalog below
      }

      // Feature 011 — the 60 SD Matematika lessons (kelas 1-6) live in
      // @aksicendekia/content-kit with their full >=10-question banks. Resolve
      // those FIRST; only fall back to the legacy guest fixtures for the 3 old
      // sample ids (matches LessonDetailClient). Deferred import so the initial
      // bundle stays lean when the public API answers.
      const { getInteractiveLesson, getGuestLessonFallback } = await import('@/lib/guest-lessons');
      setLesson(getInteractiveLesson(lessonId) ?? getGuestLessonFallback(lessonId, gradeLevel));
      setLoading(false);
    }

    if (lessonId) {
      loadLesson();
    }
  }, [lessonId, gradeLevel]);

  if (loading) {
    return (
      <div className="text-center py-20 text-on-surface-variant text-sm">
        Menyiapkan sesi belajar lokal...
      </div>
    );
  }

  const questions = lesson?.questionItems || [];
  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex) / (questions.length || 1)) * 100);

  const handleCheckAnswer = () => {
    if (!selectedAnswer && selectedAnswer !== 0) return;

    const evalResult = LocalSessionEngine.evaluateAnswer(
      currentQuestion.questionType,
      currentQuestion.contentPayload,
      selectedAnswer
    );

    setIsCurrentCorrect(evalResult.isCorrect);
    setExplanation(evalResult.explanation || currentQuestion.explanation || '');
    setIsAnswerChecked(true);

    const answerRecord: GuestSessionAnswerRecord = {
      questionId: currentQuestion.id,
      userAnswer: selectedAnswer,
      isCorrect: evalResult.isCorrect,
      timeSpentSeconds: 15,
      hintsUsed,
    };

    setAnswersLog((prev) => [...prev, answerRecord]);
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer('');
      setIsAnswerChecked(false);
      setShowHint(false);
      setHintsUsed(0);
    } else {
      // Completed all questions
      const completedAt = new Date().toISOString();
      const correctCount = answersLog.filter((a) => a.isCorrect).length;

      const sessionRecord = LocalSessionEngine.buildSessionRecord({
        lessonId,
        educationStage: (lesson.educationStage as any) || 'SD',
        totalQuestions: questions.length,
        correctCount,
        startedAt: startTime,
        completedAt,
        timeSpentSeconds: 60,
        answers: answersLog,
      });

      await recordCompletedSession(sessionRecord);

      // Redirect to summary with session query stats
      router.push(
        `/explore/${lessonId}/session/summary?score=${sessionRecord.scorePercentage}&xp=${sessionRecord.xpEarned}&correct=${sessionRecord.correctCount}&total=${sessionRecord.totalQuestions}`
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Bar & Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant">
          <span>Soal {currentIndex + 1} dari {questions.length}</span>
          <span>{progressPercent}% Selesai</span>
        </div>
        <ProgressBar value={progressPercent} size="md" />
      </div>

      {/* Main Question Card */}
      <Card variant="surface" padding="lg" className="space-y-6 border border-primary/20 shadow-md">
        {/* Question Prompt */}
        <div className="space-y-2">
          <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
            {
              {
                MULTIPLE_CHOICE: 'Pilihan Ganda',
                SHORT_ANSWER: 'Isian Singkat',
                MATCHING_PAIRS: 'Mencocokkan Pasangan',
                DRAG_DROP_GROUPING: 'Kelompokkan Objek',
                NUMBER_LINE: 'Garis Bilangan',
              }[currentQuestion.questionType as string] ?? currentQuestion.questionType
            }
          </span>
          <div className="flex items-start gap-2">
            <h2 className="text-lg md:text-xl font-heading font-bold text-on-surface leading-relaxed flex-1">
              {currentQuestion.promptText}
            </h2>
            {/* Feature 011 / T109 (FR-024) — kelas 1-2 questions carry a narration; expose a listen control. */}
            {currentQuestion.contentPayload?.narrationText && (
              <ListenButton
                text={String(currentQuestion.contentPayload.narrationText)}
                className="shrink-0"
              />
            )}
          </div>
        </div>

        {/* Question Input Area */}
        <div className="space-y-3 pt-2">
          {currentQuestion.questionType === 'MULTIPLE_CHOICE' && (
            <div className="grid grid-cols-1 gap-3">
              {(currentQuestion.contentPayload.options || []).map((opt: any) => {
                const isSelected = selectedAnswer === opt.id;
                let state: 'default' | 'selected' | 'correct' | 'incorrect' = isSelected ? 'selected' : 'default';

                if (isAnswerChecked) {
                  if (opt.id === currentQuestion.contentPayload.correct_option_id) {
                    state = 'correct';
                  } else if (isSelected && !isCurrentCorrect) {
                    state = 'incorrect';
                  }
                }

                return (
                  <TactileOptionButton
                    key={opt.id}
                    label={opt.text}
                    illustrationUrl={opt.illustrationAssetId ? `/${opt.illustrationAssetId}` : undefined}
                    status={state}
                    disabled={isAnswerChecked}
                    onClick={() => setSelectedAnswer(opt.id)}
                  />
                );
              })}
            </div>
          )}

          {currentQuestion.questionType === 'SHORT_ANSWER' && (
            <div className="space-y-2">
              <TextInput
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={isAnswerChecked}
                placeholder="Ketik jawabanmu di sini..."
                className={
                  isAnswerChecked
                    ? isCurrentCorrect
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300'
                    : ''
                }
              />
            </div>
          )}

          {currentQuestion.questionType === 'DRAG_DROP_GROUPING' && (
            <DragDropGroupingQuestion
              items={currentQuestion.contentPayload.items || []}
              groups={currentQuestion.contentPayload.groups || []}
              placements={selectedAnswer?.placements || {}}
              onPlacementsChange={(placements) => setSelectedAnswer({ placements })}
              disabled={isAnswerChecked}
              correctMapping={isAnswerChecked ? currentQuestion.contentPayload.correctMapping : undefined}
            />
          )}

          {currentQuestion.questionType === 'NUMBER_LINE' && (
            <NumberLinePlacementQuestion
              min={currentQuestion.contentPayload.min ?? 0}
              max={currentQuestion.contentPayload.max ?? 10}
              step={currentQuestion.contentPayload.step ?? 1}
              markers={currentQuestion.contentPayload.markers}
              value={typeof selectedAnswer === 'number' ? selectedAnswer : null}
              onChange={(value) => setSelectedAnswer(value)}
              disabled={isAnswerChecked}
              targetValue={isAnswerChecked ? currentQuestion.contentPayload.targetValue : undefined}
            />
          )}
        </div>

        {/* Tiered Hints */}
        {currentQuestion.hints && currentQuestion.hints.length > 0 && !isAnswerChecked && (
          <div className="pt-2">
            {!showHint ? (
              <button
                type="button"
                onClick={() => {
                  setShowHint(true);
                  setHintsUsed((prev) => prev + 1);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline min-h-[44px]"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Buka Petunjuk (+0 XP)</span>
              </button>
            ) : (
              <div className="p-3 bg-secondary/10 text-secondary border border-secondary/25 rounded-2xl text-xs leading-relaxed flex items-start gap-2">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{currentQuestion.hints[0].hintText}</span>
              </div>
            )}
          </div>
        )}

        {/* Feedback Area After Checking Answer */}
        {isAnswerChecked && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
              isCurrentCorrect
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
            }`}
          >
            {isCurrentCorrect ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-bold">
                {isCurrentCorrect ? 'Jawaban Kamu Benar! 🎉 (+10 XP)' : 'Kurang Tepat! Tetap Semangat!'}
              </h4>
              {explanation && (
                <p className="text-xs leading-relaxed opacity-90">{explanation}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-end pt-4 border-t border-outline/15">
          {!isAnswerChecked ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckAnswer}
              disabled={
                currentQuestion.questionType === 'DRAG_DROP_GROUPING'
                  ? (currentQuestion.contentPayload.items || []).some(
                      (it: any) => !selectedAnswer?.placements?.[it.id],
                    )
                  : !selectedAnswer && selectedAnswer !== 0
              }
            >
              Periksa Jawaban
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              {currentIndex + 1 < questions.length ? 'Lanjut ke Soal Berikutnya' : 'Lihat Hasil Belajar'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
