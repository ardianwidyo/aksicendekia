'use client';

import React, { useState } from 'react';
import {
  ProfessionalShell,
  DataTable,
  ButtonPrimary,
  ButtonSecondary,
  Modal,
  Select,
  FormField,
  Alert,
  StatCard,
  Badge,
} from '@aksicendekia/ui';
import { apiFetch } from '../../../lib/api-fetch';

interface ChildSummary {
  studentId: string;
  displayName: string;
  avatarId: string;
  educationStage: string;
  gradeLevel: number;
  totalLearningMinutes: number;
  lessonsCompleted: number;
  averageAccuracy: number;
  currentStreak: number;
  strongestSubject: { subjectName: string; accuracyRate: number } | null;
  weakestSubject: { subjectName: string; accuracyRate: number } | null;
  parentalControl: {
    dailyTimeLimitMinutes: number | null;
    todayTimeSpentMinutes: number;
    isTimeLimitExceeded: boolean;
    isPrivacyLocked: boolean;
  };
}

interface Activity {
  sessionId: string;
  lessonTitle: string;
  subjectName: string;
  durationMinutes: number;
  score: number;
  xpEarned: number;
  completedAt: string;
}

export default function ParentDashboardPage() {
  const [selectedChildId, setSelectedChildId] = useState<string>('student-1');
  const [summary, setSummary] = useState<ChildSummary | null>({
    studentId: 'student-1',
    displayName: 'Budi Cendekia',
    avatarId: 'avatar-1',
    educationStage: 'SD',
    gradeLevel: 4,
    totalLearningMinutes: 145,
    lessonsCompleted: 12,
    averageAccuracy: 88.5,
    currentStreak: 5,
    strongestSubject: { subjectName: 'Matematika SD', accuracyRate: 94.0 },
    weakestSubject: { subjectName: 'Bahasa Indonesia SD', accuracyRate: 78.0 },
    parentalControl: {
      dailyTimeLimitMinutes: 45,
      todayTimeSpentMinutes: 30,
      isTimeLimitExceeded: false,
      isPrivacyLocked: true,
    },
  });

  const [activities, setActivities] = useState<Activity[]>([
    {
      sessionId: 'ses-1',
      lessonTitle: 'Pecahan Senilai',
      subjectName: 'Matematika SD',
      durationMinutes: 15,
      score: 100,
      xpEarned: 50,
      completedAt: '2026-08-27 10:30',
    },
    {
      sessionId: 'ses-2',
      lessonTitle: 'Operasi Penjumlahan',
      subjectName: 'Matematika SD',
      durationMinutes: 12,
      score: 80,
      xpEarned: 40,
      completedAt: '2026-08-26 14:15',
    },
  ]);

  const [isControlModalOpen, setIsControlModalOpen] = useState(false);
  const [dailyLimit, setDailyLimit] = useState<string>('45');
  const [privacyLocked, setPrivacyLocked] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSaveControls = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const limitMinutes = dailyLimit === 'unlimited' ? null : Number(dailyLimit);
      const res = await apiFetch(`/api/v1/parent/children/${selectedChildId}/controls`, {
        method: 'PUT',
        body: JSON.stringify({
          dailyTimeLimitMinutes: limitMinutes,
          isPrivacyLocked: privacyLocked,
        }),
      });

      if (summary) {
        setSummary({
          ...summary,
          parentalControl: {
            ...summary.parentalControl,
            dailyTimeLimitMinutes: limitMinutes,
            isPrivacyLocked: privacyLocked,
          },
        });
      }

      setMessage('Pengaturan Kontrol Orang Tua berhasil diperbarui!');
      setIsControlModalOpen(false);
    } catch (err: any) {
      setMessage('Gagal memperbarui pengaturan kontrol');
    } finally {
      setLoading(false);
    }
  };

  const activityColumns = [
    { key: 'lessonTitle', header: 'Pelajaran' },
    { key: 'subjectName', header: 'Mata Pelajaran' },
    { key: 'durationMinutes', header: 'Durasi (Menit)' },
    { key: 'score', header: 'Akurasi (%)' },
    { key: 'xpEarned', header: 'XP Diperoleh' },
    { key: 'completedAt', header: 'Waktu Selesai' },
  ];

  return (
    <ProfessionalShell userRole="parent" userName="Orang Tua Budi">
      <div className="max-w-6xl mx-auto space-y-6 py-6 px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              Dasbor Pemantauan Orang Tua
            </h1>
            <p className="text-xs text-surface-variant">
              Ringkasan progres belajar, batas durasi harian, dan analisis perkembangan anak terverifikasi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ButtonSecondary onClick={() => setIsControlModalOpen(true)}>
              ⚙️ Pengaturan Kontrol Orang Tua
            </ButtonSecondary>
          </div>
        </div>

        {message && <Alert variant="success">{message}</Alert>}

        {/* Child Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-surface-variant pb-2">
          <button
            onClick={() => setSelectedChildId('student-1')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              selectedChildId === 'student-1'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-surface-variant hover:bg-surface-hover'
            }`}
          >
            👦 Budi Cendekia (SD Kelas 4)
          </button>
        </div>

        {summary && (
          <>
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Waktu Belajar Total"
                value={`${summary.totalLearningMinutes} Menit`}
                change={`Hari ini: ${summary.parentalControl.todayTimeSpentMinutes} m`}
              />
              <StatCard
                title="Pelajaran Selesai"
                value={`${summary.lessonsCompleted} Modul`}
                change="Selesai"
              />
              <StatCard
                title="Akurasi Rata-rata"
                value={`${summary.averageAccuracy}%`}
                change="Rerata"
              />
              <StatCard
                title="Harian Streak"
                value={`${summary.currentStreak} Hari 🔥`}
                change="Aktif"
              />
            </div>

            {/* Parental Control & Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Strongest & Weakest Subject */}
              <div className="bg-surface p-5 rounded-xl border border-surface-variant space-y-4">
                <h3 className="text-sm font-bold text-primary">Mata Pelajaran Terkuat & Terlemah</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs">🌟 Terkuat</p>
                      <p className="font-semibold">{summary.strongestSubject?.subjectName || '-'}</p>
                    </div>
                    <Badge variant="success">{summary.strongestSubject?.accuracyRate}%</Badge>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs">🎯 Perlu Pendampingan</p>
                      <p className="font-semibold">{summary.weakestSubject?.subjectName || '-'}</p>
                    </div>
                    <Badge variant="warning">{summary.weakestSubject?.accuracyRate}%</Badge>
                  </div>
                </div>
              </div>

              {/* Status Kontrol Orang Tua */}
              <div className="bg-surface p-5 rounded-xl border border-surface-variant space-y-4 col-span-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-primary">Status Kontrol & Privasi Anak</h3>
                  <button
                    onClick={() => setIsControlModalOpen(true)}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Ubah Pengaturan
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Batas Waktu Belajar Harian:</span>
                    <p className="font-bold text-slate-800 text-sm">
                      {summary.parentalControl.dailyTimeLimitMinutes
                        ? `${summary.parentalControl.dailyTimeLimitMinutes} Menit / Hari`
                        : 'Tidak Terbatas'}
                    </p>
                    {summary.parentalControl.isTimeLimitExceeded && (
                      <span className="text-red-600 font-bold block text-[11px]">
                        ⚠️ Kuota waktu belajar harian tercapai
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Penguncian Privasi Anak:</span>
                    <p className="font-bold text-slate-800 text-sm">
                      {summary.parentalControl.isPrivacyLocked ? '🔒 Terkunci oleh Wali' : '🔓 Terbuka'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Papan peringkat & visibilitas sosial dilindungi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-surface p-5 rounded-xl border border-surface-variant space-y-4">
              <h3 className="text-sm font-bold text-primary">Riwayat Aktivitas Belajar Terbaru</h3>
              <DataTable columns={activityColumns} data={activities} />
            </div>
          </>
        )}

        {/* Modal Kontrol Orang Tua */}
        <Modal
          isOpen={isControlModalOpen}
          onClose={() => setIsControlModalOpen(false)}
          title="⚙️ Pengaturan Kontrol Orang Tua"
        >
          <form onSubmit={handleSaveControls} className="space-y-4">
            <FormField label="Batas Waktu Belajar Harian Anak">
              <Select
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                options={[
                  { value: '15', label: '15 Menit / Hari' },
                  { value: '30', label: '30 Menit / Hari' },
                  { value: '45', label: '45 Menit / Hari' },
                  { value: '60', label: '60 Menit (1 Jam) / Hari' },
                  { value: '90', label: '90 Menit / Hari' },
                  { value: '120', label: '120 Menit (2 Jam) / Hari' },
                  { value: 'unlimited', label: 'Tidak Terbatas' },
                ]}
              />
            </FormField>

            <FormField label="Kunci Pengaturan Privasi Anak">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={privacyLocked}
                  onChange={(e) => setPrivacyLocked(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Kunci visibilitas papan peringkat dan profil anak agar tidak bisa diubah sendiri oleh anak
                </span>
              </label>
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <ButtonSecondary type="button" onClick={() => setIsControlModalOpen(false)}>
                Batal
              </ButtonSecondary>
              <ButtonPrimary type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </ButtonPrimary>
            </div>
          </form>
        </Modal>
      </div>
    </ProfessionalShell>
  );
}
