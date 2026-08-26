'use client';

import React from 'react';
import {
  AppShell,
  Card,
  ProgressBar,
  AchievementBadge,
  Button,
  MascotSpeechBubble,
  useI18n,
  useTheme,
} from '@aksicendekia/ui';
import { Sparkles, Trophy, Star, ArrowRight, BookOpen, Flame } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { t } = useI18n();
  const { gradeLevel } = useTheme();

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-primary-container via-surface-container to-secondary-container p-6 md:p-8 rounded-3xl border border-primary/20 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Fase {gradeLevel.toUpperCase()} Active
              </span>
              <h1 className="text-2xl md:text-4xl font-heading font-bold text-on-surface">
                Selamat Datang di AksiCendekia!
              </h1>
              <p className="text-sm md:text-base text-on-surface-variant font-medium">
                Siap melanjutkan petualangan belajar hari ini? Selesaikan tantangan harianmu dan dapatkan lencana prestasi!
              </p>
            </div>

            <Link href="/catalog">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Lihat Katalog UI
              </Button>
            </Link>
          </div>
        </section>

        {/* Mascot Greeting */}
        <section>
          <MascotSpeechBubble
            speakerName="Aksi"
            message={`Halo Teman Cendekia! Kamu sedang berada di tampilan Jenjang ${gradeLevel.toUpperCase()}. Coba ganti jenjang di sidebar untuk melihat perubahan tema visual!`}
          />
        </section>

        {/* Progress & Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="surface" padding="md" className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-on-surface">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Kemajuan Misi Harian
              </span>
              <span className="text-xs text-primary font-mono">3 / 5 Soal</span>
            </div>
            <ProgressBar value={60} showLabel size="md" />
          </Card>

          <Card variant="surface" padding="md" className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-on-surface">
              <span className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-secondary" />
                Rentetan Belajar (Streak)
              </span>
              <span className="text-xs text-secondary font-mono">7 Hari</span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Pertahankan streak belajar setiap hari untuk membuka lencana emas!
            </p>
          </Card>

          <Card variant="surface" padding="md" className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-on-surface">
              <span className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-tertiary" />
                Lencana Terbaru
              </span>
            </div>
            <div className="flex items-center gap-3">
              <AchievementBadge title="Jagoan Hitung" size="sm" unlocked />
              <div className="text-xs text-on-surface-variant font-medium">
                Dimenangkan kemarin!
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
