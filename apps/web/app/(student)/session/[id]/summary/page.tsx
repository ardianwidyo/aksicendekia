'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card } from '@aksicendekia/ui';

interface IncorrectQuestionSummary {
  questionId: string;
  prompt: string;
  studentAnswer: any;
  correctAnswer: any;
  explanation: string;
}

interface SummaryData {
  sessionId: string;
  lessonId: string;
  status: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  durationSeconds: number;
  completedAt: string;
  incorrectQuestionsSummary: IncorrectQuestionSummary[];
}

export default function SessionSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSummary();
  }, [sessionId]);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = async () => {
    if (!summary) return;
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lessonId: summary.lessonId })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/session/${data.sessionId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-lg animate-pulse">Menghitung hasil belajar...</p>
      </div>
    );
  }

  const minutes = Math.floor(summary.durationSeconds / 60);
  const seconds = summary.durationSeconds % 60;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Main Score Banner */}
        <Card className="p-8 text-center bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
          <div className="inline-block p-4 bg-emerald-100 rounded-full text-4xl">
            🏆
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Sesi Belajar Selesai!</h1>
          
          <div className="text-6xl font-extrabold text-blue-600 my-2">
            {summary.score}%
          </div>

          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-slate-100 text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Total Soal</p>
              <p className="text-xl font-bold">{summary.totalQuestions}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">Benar</p>
              <p className="text-xl font-bold text-emerald-600">{summary.correctCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-rose-600 font-semibold">Salah</p>
              <p className="text-xl font-bold text-rose-600">{summary.incorrectCount}</p>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            ⏱ Total Waktu: {minutes > 0 ? `${minutes} menit ` : ''}{seconds} detik
          </p>
        </Card>

        {/* Incorrect Questions Breakdown */}
        {summary.incorrectQuestionsSummary.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Pembahasan Soal yang Perlu Dipelajari Lagi</h3>
            {summary.incorrectQuestionsSummary.map((item, idx) => (
              <Card key={item.questionId} className="p-5 bg-white border border-rose-200 rounded-2xl space-y-2">
                <p className="font-semibold text-slate-800">
                  {idx + 1}. {item.prompt}
                </p>
                <p className="text-sm text-rose-600">
                  Jawaban Anda: <strong>{JSON.stringify(item.studentAnswer)}</strong>
                </p>
                <p className="text-sm text-emerald-700">
                  Kunci Jawaban: <strong>{JSON.stringify(item.correctAnswer)}</strong>
                </p>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  💡 <strong>Pembahasan:</strong> {item.explanation}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button variant="ghost" onClick={handleRetake} className="flex-1 py-4 border-2 border-slate-300">
            🔄 Ulangi Sesi
          </Button>
          <Button onClick={() => router.push('/catalog')} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 font-bold">
            Lanjut Belajar ➔
          </Button>
        </div>

      </div>
    </div>
  );
}
