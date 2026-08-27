'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, ProgressBar, Modal } from '@aksicendekia/ui';
import { apiFetch } from '../../../lib/api-fetch';

interface Badge {
  badgeId: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progressPercentage: number;
}

interface SubjectSummary {
  subjectId: string;
  subjectName: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  totalXpEarned: number;
}

interface AchievementDashboard {
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  xpCurrentLevelProgress: number;
  currentStreak: number;
  longestStreak: number;
  formattedStreakText: string;
  powerupBalances: {
    HINT_TOKEN: number;
    STREAK_FREEZE: number;
  };
  badges: Badge[];
  subjectProgress: SubjectSummary[];
}

export default function AchievementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<AchievementDashboard | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [consumingPowerup, setConsumingPowerup] = useState<boolean>(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/students/achievements');

      if (!res.ok) {
        throw new Error('Gagal memuat data pencapaian');
      }

      const data = await res.json();
      setDashboard(data);
    } catch {
      // Demo fallback data
      setDashboard({
        totalXp: 450,
        level: 3,
        xpToNextLevel: 70,
        xpCurrentLevelProgress: 168,
        currentStreak: 5,
        longestStreak: 12,
        formattedStreakText: '5 Hari Beruntun!',
        powerupBalances: {
          HINT_TOKEN: 4,
          STREAK_FREEZE: 1
        },
        badges: [
          {
            badgeId: 'bdg-1',
            code: 'FIRST_STEP',
            name: 'Langkah Pertama',
            description: 'Menyelesaikan 1 pelajaran pertama di AksiCendekia',
            iconUrl: '/badges/first-step.png',
            category: 'LESSON_MILESTONE',
            isUnlocked: true,
            unlockedAt: '2026-08-25T10:00:00.000Z',
            progressPercentage: 100
          },
          {
            badgeId: 'bdg-2',
            code: 'STREAK_MASTER_7',
            name: 'Pejuang 7 Hari',
            description: 'Mencapai streak harian 7 hari berurut-turut',
            iconUrl: '/badges/streak-7.png',
            category: 'STREAK_MILESTONE',
            isUnlocked: false,
            unlockedAt: null,
            progressPercentage: 71
          },
          {
            badgeId: 'bdg-3',
            code: 'ACCURACY_EXPERT',
            name: 'Pakar Akurasi 90%',
            description: 'Mempertahankan rata-rata akurasi ≥ 90% pada 5 sesi',
            iconUrl: '/badges/accuracy.png',
            category: 'ACCURACY_MASTER',
            isUnlocked: true,
            unlockedAt: '2026-08-26T14:30:00.000Z',
            progressPercentage: 100
          }
        ],
        subjectProgress: [
          {
            subjectId: 'subj-sd-mtk-01',
            subjectName: 'Matematika SD Kelas 1',
            totalLessons: 10,
            completedLessons: 3,
            completionPercentage: 30,
            totalXpEarned: 250
          },
          {
            subjectId: 'subj-sd-ipa-01',
            subjectName: 'IPAS SD Kelas 1',
            totalLessons: 8,
            completedLessons: 4,
            completionPercentage: 50,
            totalXpEarned: 200
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsumePowerup = async (powerupType: 'HINT_TOKEN' | 'STREAK_FREEZE') => {
    setConsumingPowerup(true);
    try {
      const res = await apiFetch('/api/v1/powerups/consume', {
        method: 'POST',
        body: JSON.stringify({ powerupType })
      });

      if (res.ok) {
        await fetchAchievements();
      }
    } catch {
      // Ignore in demo
    } finally {
      setConsumingPowerup(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <p className="text-xl font-bold text-amber-800 animate-pulse">Memuat Halaman Pencapaian...</p>
      </div>
    );
  }

  const levelProgressPercent = Math.min(
    100,
    Math.round((dashboard?.xpCurrentLevelProgress || 0) / ((dashboard?.xpCurrentLevelProgress || 0) + (dashboard?.xpToNextLevel || 1)) * 100)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-sky-50 to-emerald-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Banner Streak Harian */}
        <Card className="p-6 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border-4 border-amber-300">
          <div className="flex items-center space-x-4">
            <span className="text-6xl animate-bounce" role="img" aria-label="Flame icon">🔥</span>
            <div>
              <span className="inline-block px-3 py-1 bg-amber-900/40 text-amber-200 font-extrabold text-xs rounded-full uppercase tracking-wider mb-1">
                Streak Harian Siswa
              </span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {dashboard?.formattedStreakText}
              </h1>
              <p className="text-amber-100 font-medium text-sm mt-1">
                Rekor Terbaik: <span className="font-black text-white">{dashboard?.longestStreak} Hari Beruntun!</span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/mission-map')}
            className="w-full md:w-auto px-6 py-3 bg-white text-rose-700 font-black text-base rounded-2xl shadow-lg hover:bg-amber-100 border-2 border-white active:scale-95"
          >
            Lanjutkan Belajar 🔥
          </Button>
        </Card>

        {/* Grid Level & Saldo Power-up */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Level & XP */}
          <Card className="p-6 bg-white/90 backdrop-blur rounded-3xl shadow-lg border-2 border-amber-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">Level Siswa</span>
                <h2 className="text-2xl font-black text-slate-800">Level {dashboard?.level}</h2>
              </div>
              <div className="w-14 h-14 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-200">
                {dashboard?.level}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-extrabold text-slate-600">
                <span>Total akumulasi: {dashboard?.totalXp} XP</span>
                <span className="text-amber-600">Sisa {dashboard?.xpToNextLevel} XP ke Level {(dashboard?.level || 1) + 1}</span>
              </div>
              <ProgressBar value={levelProgressPercent} className="h-4 bg-slate-100 rounded-full overflow-hidden" />
            </div>
          </Card>

          {/* Card Saldo Power-up */}
          <Card className="p-6 bg-white/90 backdrop-blur rounded-3xl shadow-lg border-2 border-sky-200 space-y-4">
            <span className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">Inventaris Power-up</span>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-center space-y-1">
                <span className="text-3xl">💡</span>
                <p className="font-extrabold text-slate-800 text-sm">Token Petunjuk</p>
                <p className="text-2xl font-black text-sky-700">{dashboard?.powerupBalances.HINT_TOKEN || 0}</p>
              </div>

              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-center space-y-1">
                <span className="text-3xl">❄️</span>
                <p className="font-extrabold text-slate-800 text-sm">Pembeku Waktu</p>
                <p className="text-2xl font-black text-indigo-700">{dashboard?.powerupBalances.STREAK_FREEZE || 0}</p>
              </div>
            </div>
          </Card>

        </div>

        {/* Section Badge Pencapaian */}
        <Card className="p-6 bg-white/90 backdrop-blur rounded-3xl shadow-lg border-2 border-emerald-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-800">Badge Pencapaian</h3>
              <p className="text-xs text-slate-500 font-medium">Buka badge baru dengan menyelesaikan tantangan belajar</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full">
              {dashboard?.badges.filter((b) => b.isUnlocked).length || 0} / {dashboard?.badges.length || 0} Didapat
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dashboard?.badges.map((badge) => (
              <button
                key={badge.badgeId}
                type="button"
                onClick={() => setSelectedBadge(badge)}
                className={`
                  p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-start space-x-3 focus:outline-none focus:ring-2 focus:ring-amber-400
                  ${
                    badge.isUnlocked
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-sm hover:border-emerald-400'
                      : 'bg-slate-50 border-slate-200 opacity-65 hover:opacity-100'
                  }
                `}
              >
                <span className="text-3xl">{badge.isUnlocked ? '🏅' : '🔒'}</span>
                <div>
                  <p className="font-black text-sm text-slate-800">{badge.name}</p>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{badge.description}</p>
                  {!badge.isUnlocked && (
                    <div className="mt-2 space-y-1">
                      <ProgressBar value={badge.progressPercentage} className="h-2 bg-slate-200 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500">{badge.progressPercentage}% Progres</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Section Progres per Mata Pelajaran */}
        <Card className="p-6 bg-white/90 backdrop-blur rounded-3xl shadow-lg border-2 border-slate-200 space-y-4">
          <h3 className="text-xl font-black text-slate-800">Progres Mata Pelajaran</h3>
          
          <div className="space-y-4">
            {dashboard?.subjectProgress.map((sub) => (
              <div key={sub.subjectId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-800 text-sm">{sub.subjectName}</h4>
                  <span className="font-black text-emerald-700 text-sm">{sub.completionPercentage}% Selesai</span>
                </div>
                <ProgressBar value={sub.completionPercentage} className="h-3 bg-slate-200 rounded-full" />
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>{sub.completedLessons} dari {sub.totalLessons} Pelajaran</span>
                  <span>{sub.totalXpEarned} XP diperoleh</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Modal Detail Badge */}
        {selectedBadge && (
          <Modal
            isOpen={!!selectedBadge}
            onClose={() => setSelectedBadge(null)}
            title={selectedBadge.name}
          >
            <div className="p-4 space-y-4 text-center">
              <span className="text-6xl inline-block">{selectedBadge.isUnlocked ? '🏅' : '🔒'}</span>
              <h4 className="text-lg font-black text-slate-800">{selectedBadge.name}</h4>
              <p className="text-sm text-slate-600">{selectedBadge.description}</p>
              {selectedBadge.isUnlocked ? (
                <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl">
                  Diperoleh pada: {selectedBadge.unlockedAt ? new Date(selectedBadge.unlockedAt).toLocaleDateString('id-ID') : '-'}
                </div>
              ) : (
                <div className="p-3 bg-amber-100 text-amber-900 text-xs font-bold rounded-2xl">
                  Progres: {selectedBadge.progressPercentage}%
                </div>
              )}
              <Button onClick={() => setSelectedBadge(null)} className="w-full">Tutup</Button>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
}
