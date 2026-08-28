'use client';

import React, { useState } from 'react';
import { Card, Button, GuestResetModal, GuestProfileModal, useI18n } from '@aksicendekia/ui';
import { RotateCcw, User, HardDrive, ShieldCheck, ArrowLeft, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useGuestProgress } from '../../../lib/context/guest-progress-context';

export default function GuestSettingsPage() {
  const { t } = useI18n();
  const { state, updateProfile, clearState, isPrivateMode } = useGuestProgress();
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleConfirmReset = async () => {
    await clearState();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back to Explore */}
      <Link href="/explore">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Jelajah Materi</span>
        </button>
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-on-surface">
          Pengaturan Belajar Lokal
        </h1>
        <p className="text-sm text-on-surface-variant">
          Kelola profil samaran dan penyimpanan progres belajar pada perangkat ini.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Data progres belajar lokal telah berhasil direset ke kondisi awal.</span>
        </div>
      )}

      {/* Profile Card */}
      <Card variant="surface" padding="md" className="space-y-4 border border-outline/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">
                Profil Tamu ({state?.profile.displayName || 'Siswa Hebat'})
              </h3>
              <p className="text-xs text-on-surface-variant">
                Avatar Karakter &amp; Jenjang {state?.profile.educationStage || 'SD'}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => setIsProfileOpen(true)}>
            Ubah Profil
          </Button>
        </div>
      </Card>

      {/* Storage & Privacy Card */}
      <Card variant="surface" padding="md" className="space-y-4 border border-outline/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-secondary/10 text-secondary">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">Penyimpanan Perangkat</h3>
            <p className="text-xs text-on-surface-variant">
              Status memori browser: {isPrivateMode ? 'Mode Penyamaran (Sementara)' : 'Persisten (IndexedDB / LocalStorage)'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-surface-container rounded-xl">
            <div className="text-on-surface-variant font-medium">Total XP</div>
            <div className="text-base font-bold text-on-surface mt-0.5">
              {state?.gamification.totalXp || 0} XP
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-xl">
            <div className="text-on-surface-variant font-medium">Streak Belajar</div>
            <div className="text-base font-bold text-on-surface mt-0.5">
              {state?.gamification.streak.currentStreak || 0} Hari
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-xl col-span-2 sm:col-span-1">
            <div className="text-on-surface-variant font-medium">Pelajaran Selesai</div>
            <div className="text-base font-bold text-on-surface mt-0.5">
              {state?.curriculumProgress.completedLessonIds.length || 0} Modul
            </div>
          </div>
        </div>
      </Card>

      {/* Reset Data Card */}
      <Card variant="surface" padding="md" className="space-y-4 border border-error/25 bg-error/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-error/10 text-error shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Reset Data Perangkat</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Gunakan opsi ini jika gawai digunakan bergantian dengan orang lain agar data belajar kembali bersih.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="bg-error hover:bg-error/90 text-on-error border-error shrink-0 w-full sm:w-auto"
            onClick={() => setIsResetOpen(true)}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset Progres Lokal
          </Button>
        </div>
      </Card>

      {/* Modals */}
      {state && (
        <GuestProfileModal
          isOpen={isProfileOpen}
          currentName={state.profile.displayName}
          currentAvatarId={state.profile.avatarId}
          onClose={() => setIsProfileOpen(false)}
          onSave={updateProfile}
        />
      )}

      <GuestResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
