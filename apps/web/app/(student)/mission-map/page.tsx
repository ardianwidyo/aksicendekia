'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, ProgressBar } from '@aksicendekia/ui';

interface MissionNode {
  lessonId: string;
  title: string;
  sequenceOrder: number;
  status: 'COMPLETED' | 'CURRENT' | 'UNLOCKED' | 'LOCKED';
  bestScore: number | null;
  prerequisites: string[];
}

interface MissionMapData {
  subjectId: string;
  subjectName: string;
  nodes: MissionNode[];
}

export default function MissionMapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missionMap, setMissionMap] = useState<MissionMapData | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('subj-sd-mtk-01');

  useEffect(() => {
    fetchMissionMap(selectedSubjectId);
  }, [selectedSubjectId]);

  const fetchMissionMap = async (subjectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/v1/curriculum/subjects/${subjectId}/mission-map`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });

      if (!res.ok) {
        throw new Error('Gagal memuat data Peta Misi');
      }

      const data = await res.json();
      setMissionMap(data);
    } catch (err: any) {
      // Demo fallback jika API belum terhubung ke database live
      setMissionMap({
        subjectId: 'subj-sd-mtk-01',
        subjectName: 'Matematika SD Kelas 1',
        nodes: [
          {
            lessonId: 'les-01',
            title: 'Mengenal Angka 1-10',
            sequenceOrder: 1,
            status: 'COMPLETED',
            bestScore: 100,
            prerequisites: []
          },
          {
            lessonId: 'les-02',
            title: 'Penjumlahan Dasar 1-10',
            sequenceOrder: 2,
            status: 'CURRENT',
            bestScore: null,
            prerequisites: ['les-01']
          },
          {
            lessonId: 'les-03',
            title: 'Pengurangan Dasar 1-10',
            sequenceOrder: 3,
            status: 'LOCKED',
            bestScore: null,
            prerequisites: ['les-02']
          },
          {
            lessonId: 'les-04',
            title: 'Bentuk Bangun Datar',
            sequenceOrder: 4,
            status: 'LOCKED',
            bestScore: null,
            prerequisites: ['les-03']
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (lessonId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ lessonId })
      });

      if (res.ok) {
        const sessionData = await res.json();
        router.push(`/session/${sessionData.sessionId}`);
      } else {
        router.push(`/session/demo-session-id`);
      }
    } catch {
      router.push(`/session/demo-session-id`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <p className="text-xl font-bold text-amber-800 animate-pulse">Memuat Peta Misi Petualangan...</p>
      </div>
    );
  }

  const completedCount = missionMap?.nodes.filter((n) => n.status === 'COMPLETED').length || 0;
  const totalCount = missionMap?.nodes.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Peta Misi */}
        <Card className="p-6 bg-white/90 backdrop-blur shadow-xl border-4 border-amber-300 rounded-3xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 bg-amber-200 text-amber-900 font-extrabold text-xs rounded-full uppercase tracking-wider mb-2">
                Peta Misi Belajar
              </span>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                {missionMap?.subjectName}
              </h1>
              <p className="text-slate-600 font-medium text-sm mt-1">
                Selesaikan setiap simpul misi untuk membuka petualangan berikutnya!
              </p>
            </div>
            <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-700">
                <span>Kemajuan Subjek</span>
                <span className="text-emerald-600 font-extrabold">{progressPercent}%</span>
              </div>
              <ProgressBar value={progressPercent} className="h-4 bg-slate-200 rounded-full overflow-hidden" />
              <p className="text-xs text-slate-500 text-right">
                {completedCount} dari {totalCount} Pelajaran Selesai
              </p>
            </div>
          </div>
        </Card>

        {/* Graf Simpul Pelajaran (Path Vector Layout) */}
        <div className="relative py-8 px-4 flex flex-col items-center space-y-12">
          {missionMap?.nodes.map((node, index) => {
            const isCompleted = node.status === 'COMPLETED';
            const isCurrent = node.status === 'CURRENT';
            const isUnlocked = node.status === 'UNLOCKED';
            const isLocked = node.status === 'LOCKED';

            // Zig-zag offset untuk nuansa Peta Misi Petualangan
            const offsetClasses = [
              'translate-x-0',
              'translate-x-12 md:translate-x-24',
              'translate-x-0',
              '-translate-x-12 md:-translate-x-24'
            ];
            const currentOffset = offsetClasses[index % offsetClasses.length];

            return (
              <div
                key={node.lessonId}
                className={`relative flex flex-col items-center transition-transform duration-300 ${currentOffset}`}
              >
                {/* Node Button */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => !isLocked && handleStartSession(node.lessonId)}
                  aria-label={`${node.title} - Status: ${node.status}`}
                  className={`
                    relative group min-w-[76px] min-h-[76px] w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl shadow-lg border-4
                    transition-all duration-200 active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-400
                    ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-300 text-white shadow-emerald-700/40 hover:bg-emerald-600'
                        : isCurrent
                        ? 'bg-amber-400 border-amber-200 text-amber-950 shadow-amber-600/50 animate-bounce ring-4 ring-amber-300/60'
                        : isUnlocked
                        ? 'bg-sky-500 border-sky-300 text-white shadow-sky-700/40 hover:bg-sky-600'
                        : 'bg-slate-300 border-slate-400 text-slate-500 shadow-slate-400/30 cursor-not-allowed'
                    }
                  `}
                >
                  {isCompleted && <span>✓</span>}
                  {isCurrent && <span>★</span>}
                  {isUnlocked && <span>▶</span>}
                  {isLocked && <span>🔒</span>}
                </button>

                {/* Info Card Badge */}
                <div className="mt-3 text-center max-w-xs bg-white/90 backdrop-blur px-4 py-2 rounded-2xl border-2 border-slate-200 shadow-md">
                  <p className="font-extrabold text-slate-800 text-sm">{node.title}</p>
                  {isCompleted && node.bestScore !== null && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full">
                      Skor Terbaik: {node.bestScore}%
                    </span>
                  )}
                  {isCurrent && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-amber-200 text-amber-900 text-xs font-black rounded-full animate-pulse">
                      Target Sekarang
                    </span>
                  )}
                  {isLocked && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">
                      Prasyarat Terkunci
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/achievements')}
            className="px-6 py-3 bg-white font-black text-amber-800 border-2 border-amber-300 rounded-2xl shadow-md hover:bg-amber-100"
          >
            Lihat Halaman Pencapaian Siswa →
          </Button>
        </div>
      </div>
    </div>
  );
}
