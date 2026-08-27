'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, ProgressBar, Modal } from '@aksicendekia/ui';
import { apiFetch } from '../../../lib/api-fetch';

interface DailyChallengeData {
  id: string;
  educationStage: string;
  challengeDate: string;
  title: string;
  description: string;
  targetType: string;
  targetValue: number;
  currentProgress: number;
  rewardXp: number;
  rewardPowerupType?: string;
  rewardPowerupQty?: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED' | 'EXPIRED';
  completedAt?: string | null;
  claimedAt?: string | null;
}

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  avatarToken: string;
  weeklyXp: number;
}

interface ClassLeaderboardData {
  classId: string;
  className: string;
  weekStartDate: string;
  topStudents: LeaderboardEntry[];
  myRank?: LeaderboardEntry & { isHidden?: boolean };
}

interface PrivacySettingData {
  studentUserId: string;
  isHiddenFromLeaderboard: boolean;
  isPrivacyLocked: boolean;
  updatedAt: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<DailyChallengeData | null>(null);
  const [leaderboard, setLeaderboard] = useState<ClassLeaderboardData | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettingData | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Fetch Today's Daily Challenge
      const challengeRes = await apiFetch('/api/v1/daily-challenges/today');
      if (challengeRes.ok) {
        const json = await challengeRes.json();
        setChallenge(json.data);
      }

      // Fetch Privacy Settings
      const privacyRes = await apiFetch('/api/v1/students/me/privacy');
      if (privacyRes.ok) {
        const json = await privacyRes.json();
        setPrivacy(json.data);
      }

      // Demo fallback or class fetch
      const demoClassId = 'cls-demo-123';
      const leaderboardRes = await apiFetch(`/api/v1/classes/${demoClassId}/leaderboard`);
      if (leaderboardRes.ok) {
        const json = await leaderboardRes.json();
        setLeaderboard(json.data);
      } else {
        // Fallback demo data if no active class endpoint
        setLeaderboard({
          classId: 'cls-demo-123',
          className: 'Kelas 4A SD Cendekia',
          weekStartDate: '2026-08-24',
          topStudents: [
            { rank: 1, displayName: 'Bintang Cerdas', avatarToken: 'avatar_fox', weeklyXp: 450 },
            { rank: 2, displayName: 'Kancil Pintar', avatarToken: 'avatar_bear', weeklyXp: 380 },
            { rank: 3, displayName: 'Elang Utama', avatarToken: 'avatar_eagle', weeklyXp: 310 },
            { rank: 4, displayName: 'Singa Hebat', avatarToken: 'avatar_lion', weeklyXp: 290 },
            { rank: 5, displayName: 'Tupai Cepat', avatarToken: 'avatar_squirrel', weeklyXp: 240 }
          ],
          myRank: {
            rank: 14,
            displayName: 'Garuda Muda',
            avatarToken: 'avatar_eagle',
            weeklyXp: 120,
            isHidden: false
          }
        });
      }
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async () => {
    if (!challenge || challenge.status !== 'COMPLETED') return;
    setClaiming(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch(`/api/v1/daily-challenges/${challenge.id}/claim`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Gagal mengklaim hadiah');
      }

      setSuccessMessage(`Selamat! Anda mendapatkan +${json.xpAwarded} XP dan Power-up.`);
      setChallenge((prev) => (prev ? { ...prev, status: 'CLAIMED' } : null));
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengklaim hadiah');
    } finally {
      setClaiming(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!privacy || privacy.isPrivacyLocked) return;
    setUpdatingPrivacy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const newHiddenState = !privacy.isHiddenFromLeaderboard;

    try {
      const res = await apiFetch('/api/v1/students/me/privacy', {
        method: 'PATCH',
        body: JSON.stringify({ isHiddenFromLeaderboard: newHiddenState })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memperbarui visibilitas');
      }

      setPrivacy(json.data);
      setSuccessMessage(
        newHiddenState
          ? 'Nama Anda sekarang tersembunyi dari papan peringkat teman sekelas.'
          : 'Nama Anda kembali terlihat di papan peringkat kelas.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengubah pengaturan privasi');
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-amber-400 text-amber-950 font-bold';
    if (rank === 2) return 'bg-slate-300 text-slate-900 font-bold';
    if (rank === 3) return 'bg-amber-700 text-amber-100 font-bold';
    return 'bg-slate-100 text-slate-700 font-medium';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 text-sm font-medium">Memuat Tantangan & Papan Peringkat...</p>
        </div>
      </div>
    );
  }

  const challengeProgress = challenge
    ? Math.min(100, Math.round((challenge.currentProgress / challenge.targetValue) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/mission-map')}
              className="mb-2 min-h-[44px] min-w-[44px]"
              aria-label="Kembali ke Peta Misi"
            >
              ← Peta Misi
            </Button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tantangan Harian & Papan Peringkat
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Capai target harian dan lihat peringkat XP kelas mingguanmu!
            </p>
          </div>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-red-800 text-sm font-medium">
            ⚠️ {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-md text-emerald-800 text-sm font-medium">
            🎉 {successMessage}
          </div>
        )}

        {/* SECTION 1: TANTANGAN HARIAN */}
        <Card className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl rounded-2xl border-0">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              ⚡ Tantangan Hari Ini
            </span>
            <span className="text-xs text-indigo-300">
              Reset Pukul 00:00 Waktu Lokal
            </span>
          </div>

          {challenge ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">{challenge.title}</h2>
                <p className="text-indigo-200 text-sm mt-1">{challenge.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-indigo-200">
                  <span>Progres Berjalan</span>
                  <span className="font-bold text-white">
                    {challenge.currentProgress} / {challenge.targetValue} ({challengeProgress}%)
                  </span>
                </div>
                <ProgressBar value={challengeProgress} max={100} className="h-3 rounded-full bg-indigo-950" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-indigo-800/50">
                <div className="flex items-center gap-3 text-xs">
                  <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md font-bold border border-amber-500/30">
                    +{challenge.rewardXp} XP
                  </span>
                  {challenge.rewardPowerupType && (
                    <span className="bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-md font-bold border border-cyan-500/30">
                      +{challenge.rewardPowerupQty} Token Petunjuk
                    </span>
                  )}
                </div>

                {challenge.status === 'CLAIMED' ? (
                  <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg text-sm border border-emerald-500/30 min-h-[44px] flex items-center">
                    ✓ Hadiah Terklaim
                  </span>
                ) : challenge.status === 'COMPLETED' ? (
                  <Button
                    onClick={handleClaimReward}
                    disabled={claiming}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-2.5 rounded-lg shadow-lg min-h-[44px] min-w-[120px]"
                    aria-label="Klaim Hadiah Tantangan Harian"
                  >
                    {claiming ? 'Mengklaim...' : '🎁 Klaim Hadiah'}
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="bg-slate-700 text-slate-400 font-medium px-5 py-2 rounded-lg text-sm min-h-[44px]"
                    aria-label="Tantangan Belum Selesai"
                  >
                    Belum Selesai ({challenge.currentProgress}/{challenge.targetValue})
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-indigo-200 text-sm">Tidak ada tantangan aktif untuk hari ini.</p>
          )}
        </Card>

        {/* SECTION 2: PAPAN PERINGKAT KELAS MINGGUAN */}
        <Card className="p-6 bg-white shadow-md rounded-2xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  🏆 Papan Peringkat Kelas Mingguan
                </h2>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                {leaderboard?.className} • Reset Setiap Hari Senin 00:00
              </p>
            </div>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
              🔒 Terbatas pada Kelas Sendiri (UU PDP Protected)
            </span>
          </div>

          {/* Top 10 Table */}
          <div className="space-y-2">
            {leaderboard?.topStudents && leaderboard.topStudents.length > 0 ? (
              leaderboard.topStudents.map((student) => (
                <div
                  key={student.rank}
                  className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${
                    student.rank <= 3
                      ? 'bg-slate-50 border border-slate-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${getRankBadgeColor(
                        student.rank
                      )}`}
                    >
                      #{student.rank}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {student.avatarToken ? student.avatarToken.slice(0, 2).toUpperCase() : '⭐'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{student.displayName}</p>
                      <p className="text-[11px] text-slate-500">Anggota Kelas</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-indigo-600">
                      {student.weeklyXp} XP
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm text-center py-6">
                Belum ada perolehan XP mingguan di kelas ini.
              </p>
            )}
          </div>

          {/* PINNED CURRENT STUDENT RANK */}
          {leaderboard?.myRank && (
            <div className="pt-4 border-t-2 border-dashed border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Posisi Anda Saat Ini
              </p>
              <div className="flex items-center justify-between p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm">
                    #{leaderboard.myRank.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-slate-900">
                        {leaderboard.myRank.displayName} (Anda)
                      </p>
                      {privacy?.isHiddenFromLeaderboard && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Tersembunyi dari Teman
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-700 font-medium">
                      Peringkat #{leaderboard.myRank.rank} dari Anggota Kelas
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-indigo-700">
                    {leaderboard.myRank.weeklyXp} XP
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* SECTION 3: PENGATURAN PRIVASI & PARENTAL LOCK */}
        <Card className="p-6 bg-slate-900 text-white shadow-md rounded-2xl border-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🛡️ Pengaturan Visibilitas Papan Peringkat
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Pilih apakah nama tampilan Anda ingin ditampilkan di papan peringkat teman sekelas.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-800 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">
                Sembunyikan Saya dari Papan Peringkat
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {privacy?.isPrivacyLocked
                  ? '🔒 Pengaturan ini telah dikunci oleh Orang Tua Anda.'
                  : 'Jika diaktifkan, nama Anda tidak akan terlihat oleh teman sekelas.'}
              </p>
            </div>

            <Button
              onClick={handleTogglePrivacy}
              disabled={updatingPrivacy || privacy?.isPrivacyLocked}
              variant={privacy?.isHiddenFromLeaderboard ? 'secondary' : 'outline'}
              className={`min-h-[44px] min-w-[100px] font-bold text-xs ${
                privacy?.isPrivacyLocked
                  ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400 border-slate-600'
                  : privacy?.isHiddenFromLeaderboard
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'border-slate-600 text-white hover:bg-slate-700'
              }`}
              aria-label="Toggle Sembunyikan Saya dari Papan Peringkat"
            >
              {updatingPrivacy
                ? 'Memuat...'
                : privacy?.isPrivacyLocked
                ? '🔒 Dikunci'
                : privacy?.isHiddenFromLeaderboard
                ? 'Tersembunyi'
                : 'Terlihat'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
