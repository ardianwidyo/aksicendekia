'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  TactileOptionButton,
  Button,
  ProgressBar,
  Card,
  Modal,
  Toast
} from '@aksicendekia/ui';

interface Option {
  id: string;
  text: string;
}

interface QuestionDTO {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'MATCHING_PAIRS';
  prompt: string;
  options?: Option[];
  matchingItemsLeft?: string[];
  matchingItemsRight?: string[];
  availableHintsCount: number;
}

interface ActiveSessionData {
  sessionId: string;
  lessonId: string;
  status: string;
  currentIndex: number;
  totalQuestions: number;
  currentQuestion: QuestionDTO | null;
}

interface FeedbackState {
  isSubmitted: boolean;
  isCorrect: boolean;
  explanation: string;
  correctAnswer: any;
}

export default function ActiveSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<ActiveSessionData | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [shortAnswerText, setShortAnswerText] = useState<string>('');
  const [matchingPairs, setMatchingPairs] = useState<Record<string, string>>({});
  
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Pause & Retry modals
  const [showPauseModal, setShowPauseModal] = useState<boolean>(false);
  const [showNetworkErrorModal, setShowNetworkErrorModal] = useState<boolean>(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    // Generate initial idempotency key for current question
    setIdempotencyKey(crypto.randomUUID());
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        setStartTime(Date.now());
      } else if (res.status === 409) {
        alert('Sesi ini telah kedaluwarsa setelah 24 jam.');
        router.push('/catalog');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestHint = async () => {
    if (!session?.currentQuestion) return;
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/sessions/${sessionId}/hints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ questionId: session.currentQuestion.id })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveHint(data.hintText);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session?.currentQuestion || isSubmitting) return;

    let answerPayload: any = null;
    const qType = session.currentQuestion.type;

    if (qType === 'MULTIPLE_CHOICE') {
      if (!selectedOptionId) return;
      answerPayload = { type: 'MULTIPLE_CHOICE', selectedOptionId };
    } else if (qType === 'SHORT_ANSWER') {
      if (!shortAnswerText.trim()) return;
      answerPayload = { type: 'SHORT_ANSWER', text: shortAnswerText };
    } else if (qType === 'MATCHING_PAIRS') {
      answerPayload = { type: 'MATCHING_PAIRS', pairs: matchingPairs };
    }

    setIsSubmitting(true);
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/sessions/${sessionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: session.currentQuestion.id,
          answer: answerPayload,
          timeSpentSeconds
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback({
          isSubmitted: true,
          isCorrect: data.isCorrect,
          explanation: data.explanation,
          correctAnswer: data.correctAnswer
        });
      } else {
        setShowNetworkErrorModal(true);
      }
    } catch (err) {
      setShowNetworkErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (session && session.currentIndex + 1 >= session.totalQuestions) {
      // Go to completion summary
      router.push(`/session/${sessionId}/summary`);
    } else {
      // Reset state for next question
      setSelectedOptionId('');
      setShortAnswerText('');
      setMatchingPairs({});
      setFeedback(null);
      setActiveHint(null);
      setIdempotencyKey(crypto.randomUUID());
      fetchSession();
    }
  };

  const handlePauseSession = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`/api/v1/sessions/${sessionId}/pause`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push('/catalog');
    } catch (err) {
      console.error(err);
    }
  };

  if (!session || !session.currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-lg animate-pulse">Memuat sesi belajar...</p>
      </div>
    );
  }

  const q = session.currentQuestion;
  const progressPercent = Math.round(((session.currentIndex + 1) / session.totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Progress & Pause */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => setShowPauseModal(true)}>
            ⏸ Jeda Sesi
          </Button>
          <div className="flex-1 max-w-md">
            <ProgressBar value={progressPercent} />
          </div>
          <span className="font-bold text-slate-700 text-sm">
            {session.currentIndex + 1} / {session.totalQuestions}
          </span>
        </div>

        {/* Question Prompt Card */}
        <Card className="p-6 bg-white shadow-sm rounded-2xl border-2 border-slate-200">
          <div className="flex justify-between items-start gap-4 mb-4">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase">
              {q.type.replace('_', ' ')}
            </span>
            {q.availableHintsCount > 0 && !activeHint && (
              <Button size="sm" variant="ghost" onClick={handleRequestHint} className="text-amber-700 hover:bg-amber-50">
                💡 Minta Petunjuk
              </Button>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-relaxed mb-4">
            {q.prompt}
          </h2>

          {activeHint && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-amber-900 text-sm">
              💡 <strong>Petunjuk:</strong> {activeHint}
            </div>
          )}

          {/* Question Type Input Renderers */}
          {q.type === 'MULTIPLE_CHOICE' && q.options && (
            <div className="space-y-3 mt-6">
              {q.options.map((opt, idx) => {
                const optionKey = String.fromCharCode(65 + idx); // A, B, C, D
                let status: 'default' | 'selected' | 'correct' | 'incorrect' = 'default';

                if (feedback?.isSubmitted) {
                  if (opt.id === feedback.correctAnswer?.correctOptionId) {
                    status = 'correct';
                  } else if (opt.id === selectedOptionId && !feedback.isCorrect) {
                    status = 'incorrect';
                  }
                } else if (selectedOptionId === opt.id) {
                  status = 'selected';
                }

                return (
                  <TactileOptionButton
                    key={opt.id}
                    label={opt.text}
                    optionKey={optionKey}
                    status={status}
                    disabled={feedback?.isSubmitted}
                    onClick={() => setSelectedOptionId(opt.id)}
                  />
                );
              })}
            </div>
          )}

          {q.type === 'SHORT_ANSWER' && (
            <div className="mt-6 space-y-4">
              <input
                type="text"
                value={shortAnswerText}
                onChange={(e) => setShortAnswerText(e.target.value)}
                placeholder="Tuliskan jawaban Anda di sini..."
                disabled={feedback?.isSubmitted}
                className="w-full p-4 text-lg border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>
          )}
        </Card>

        {/* Feedback Container */}
        {feedback?.isSubmitted && (
          <Card
            className={`p-6 rounded-2xl border-2 ${
              feedback.isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3 mb-2 font-bold text-lg">
              {feedback.isCorrect ? '🎉 Jawaban Benar!' : '❌ Jawaban Belum Tepat'}
            </div>
            <p className="text-sm sm:text-base leading-relaxed mb-4">
              {feedback.explanation}
            </p>
            <Button
              onClick={handleNextQuestion}
              className={`w-full ${
                feedback.isCorrect ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {session.currentIndex + 1 >= session.totalQuestions ? 'Lihat Hasil Belajar 🏆' : 'Soal Berikutnya ➔'}
            </Button>
          </Card>
        )}

        {/* Submit Button (if not yet submitted) */}
        {!feedback?.isSubmitted && (
          <Button
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || (!selectedOptionId && !shortAnswerText.trim())}
            className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700 font-bold"
          >
            {isSubmitting ? 'Menilai Jawaban...' : 'Kirim Jawaban ✓'}
          </Button>
        )}

      </div>

      {/* Pause Confirmation Modal */}
      <Modal isOpen={showPauseModal} onClose={() => setShowPauseModal(false)} title="Jeda Sesi Belajar?">
        <p className="text-slate-600 mb-6">
          Progres Anda akan disimpan. Anda dapat melanjutkan sesi ini kapan saja dalam waktu 24 jam.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowPauseModal(false)}>Kembali Belajar</Button>
          <Button onClick={handlePauseSession} className="bg-amber-600 hover:bg-amber-700">Ya, Jeda Sesi</Button>
        </div>
      </Modal>

      {/* Network Error Retry Modal */}
      <Modal isOpen={showNetworkErrorModal} onClose={() => setShowNetworkErrorModal(false)} title="Koneksi Terputus">
        <p className="text-slate-600 mb-6">
          Gagal mengirimkan jawaban karena gangguan koneksi internet. Silakan coba lagi tanpa kehilangan progres.
        </p>
        <div className="flex justify-end gap-3">
          <Button onClick={() => { setShowNetworkErrorModal(false); handleSubmitAnswer(); }}>
            🔄 Coba Lagi
          </Button>
        </div>
      </Modal>
    </div>
  );
}
