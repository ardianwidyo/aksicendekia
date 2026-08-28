'use client';

import React, { useState } from 'react';
import {
  AppShell,
  Card,
  ProgressBar,
  AchievementBadge,
  Button,
  MascotSpeechBubble,
  GuestHeaderBanner,
  GuestProfileModal,
  GuestResetModal,
  useI18n,
  useTheme,
} from '@aksicendekia/ui';
import { Sparkles, Trophy, ArrowRight, BookOpen, Flame, Compass, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useGuestProgress } from '../lib/context/guest-progress-context';

export default function HomePage() {
  const { t } = useI18n();
  const { gradeLevel } = useTheme();
  const { state, updateProfile, clearState, isPrivateMode } = useGuestProgress();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Guest Status Banner */}
        <GuestHeaderBanner
          displayName={state?.profile.displayName}
          totalXp={state?.gamification.totalXp}
          currentStreak={state?.gamification.streak.currentStreak}
          isIncognito={isPrivateMode}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenReset={() => setIsResetOpen(true)}
        />

        {/* Hero Welcome Banner */}
        <section className="bg-gradient-to-r from-primary-container via-surface-container to-secondary-container p-6 md:p-8 rounded-3xl border border-primary/20 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Fase {gradeLevel.toUpperCase()} Aktif
              </span>
              <h1 className="text-2xl md:text-4xl font-heading font-bold text-on-surface">
                Selamat Datang di AksiCendekia!
              </h1>
              <p className="text-sm md:text-base text-on-surface-variant font-medium leading-relaxed">
                Belajar seru bergamifikasi untuk semua jenjang. Mulai belajar langsung tanpa harus mendaftar, atau masuk ke akunmu!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link href="/explore" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  leftIcon={<Compass className="w-5 h-5" />}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Mulai Belajar Langsung
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full border border-outline/25"
                  leftIcon={<LogIn className="w-5 h-5" />}
                >
                  Masuk ke Akun
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Mascot Greeting */}
        <section>
          <MascotSpeechBubble
            speakerName="Aksi"
            message={`Halo ${state?.profile.displayName || 'Teman Cendekia'}! Kamu sedang berada di Mode Tamu. Semua progres belajarmu tersimpan aman di perangkat ini!`}
          />
        </section>

        {/* Guest Progress & Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="surface" padding="md" className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-on-surface">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Pelajaran Selesai
              </span>
              <span className="text-xs text-primary font-mono font-bold">
                {state?.curriculumProgress.completedLessonIds.length || 0} Modul
              </span>
            </div>
            <ProgressBar
              value={Math.min(100, (state?.curriculumProgress.completedLessonIds.length || 0) * 10)}
              showLabel
              size="md"
            />
          </Card>

          <Card variant="surface" padding="md" className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-on-surface">
              <span className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-secondary" />
                Rentetan Belajar (Streak)
              </span>
              <span className="text-xs text-secondary font-mono font-bold">
                {state?.gamification.streak.currentStreak || 0} Hari
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Pertahankan streak belajar setiap hari untuk meningkatkan level belajarmu!
            </p>
          </Card>

          <Card variant="surface" padding="md" className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-on-surface">
              <span className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-tertiary" />
                Akumulasi XP
              </span>
              <span className="text-xs text-tertiary font-mono font-bold">
                Level {state?.gamification.currentLevel || 1}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <AchievementBadge
                title={`${state?.gamification.totalXp || 0} XP`}
                size="sm"
                unlocked={Boolean(state && state.gamification.totalXp > 0)}
              />
              <div className="text-xs text-on-surface-variant font-medium">
                {state?.gamification.totalXp ? 'Hebat, terus belajar!' : 'Mulai latihan untuk raih XP!'}
              </div>
            </div>
          </Card>
        </section>
      </div>

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
        onConfirm={clearState}
      />
    </AppShell>
  );
}
