'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@aksicendekia/ui';
import { apiFetch } from '../../../../lib/api-fetch';

interface SessionHistoryItem {
  sessionId: string;
  lessonTitle: string;
  subjectName: string;
  score: number | null;
  status: string;
  completedAt: string | null;
  durationSeconds: number;
}

export default function StudentSessionHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiFetch('/api/v1/students/me/sessions?page=1&limit=20');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Riwayat Sesi Belajar</h1>
            <p className="text-sm text-slate-500">Daftar sesi belajar yang pernah Anda kerjakan.</p>
          </div>
          <Button variant="ghost" onClick={() => router.push('/catalog')}>
            ← Kembali ke Katalog
          </Button>
        </div>

        {isLoading ? (
          <p className="text-center py-10 text-slate-500 animate-pulse">Memuat riwayat sesi...</p>
        ) : history.length === 0 ? (
          <Card className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">Belum ada riwayat sesi belajar.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <Card
                key={item.sessionId}
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex justify-between items-center gap-4"
              >
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                    {item.subjectName}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">{item.lessonTitle}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.completedAt ? new Date(item.completedAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : 'Belum Selesai'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {item.score !== null ? (
                    <span className="text-2xl font-extrabold text-blue-600">{item.score}%</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 font-semibold rounded-md">
                      {item.status}
                    </span>
                  )}
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/session/${item.sessionId}/summary`)}
                      className="text-xs text-blue-600 hover:bg-blue-50"
                    >
                      Lihat Detail ➔
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
