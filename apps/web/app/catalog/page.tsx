'use client';

import React from 'react';
import {
  Card,
  ProgressBar,
  AchievementBadge,
  Button,
  MascotSpeechBubble,
  LevelSelector,
  useTheme,
  useI18n,
} from '@aksicendekia/ui';
import { GradeLevel } from '@aksicendekia/design-tokens';
import { Sparkles, Trophy, Star, ShieldCheck, Flame, BookOpen, ArrowRight, RefreshCw } from 'lucide-react';

export default function ComponentCatalogPage() {
  const { gradeLevel, setGradeLevel } = useTheme();
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="min-h-screen bg-background text-on-surface p-4 md:p-8">
      <div className="max-w-container mx-auto space-y-8">
        {/* Header & Controls */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-outline-variant">
          <div>
            <span className="inline-block px-3 py-1 bg-primary-container text-on-primary-container text-xs font-bold rounded-full mb-2">
              Internal Dev Tool
            </span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-on-surface">
              {t('common.catalogTitle')}
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {t('common.catalogSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface-container p-2 rounded-xl border border-outline-variant">
            <span className="text-xs font-semibold text-on-surface-variant pl-2">
              {t('common.language')}:
            </span>
            <button
              onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
              className="px-3 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              {locale.toUpperCase()}
            </button>
          </div>
        </header>

        {/* Level Switcher Banner */}
        <section className="bg-surface-container p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold text-on-surface">
              {t('common.selectGrade')}
            </h2>
            <span className="text-xs font-mono bg-surface-container-highest px-3 py-1 rounded-full text-on-surface-variant">
              Active: data-jenjang=&quot;{gradeLevel}&quot;
            </span>
          </div>

          <LevelSelector />
        </section>

        {/* Live Theme Tokens & Typography Showcase */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="surface" padding="md">
            <h3 className="text-xl font-heading font-bold mb-4 text-on-surface">
              Typography Scale ({gradeLevel.toUpperCase()})
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-on-surface-variant block">display-lg (Quicksand / Montserrat)</span>
                <span className="text-3xl md:text-4xl font-heading font-bold text-primary">
                  Display Heading
                </span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block">headline-lg</span>
                <span className="text-xl md:text-2xl font-heading font-bold text-on-surface">
                  Section Headline Title
                </span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block">body-md (Inter)</span>
                <p className="text-sm font-body text-on-surface leading-relaxed">
                  Soal Matematika: Ibu membeli 5 buah apel dan 3 buah jeruk. Berapa total buah yang dibeli Ibu?
                </p>
              </div>
            </div>
          </Card>

          <Card variant="surface" padding="md">
            <h3 className="text-xl font-heading font-bold mb-4 text-on-surface">
              Active Theme Palette Tokens
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-primary text-on-primary font-bold shadow-sm">
                Primary (#0058BE / Neon)
              </div>
              <div className="p-3 rounded-xl bg-secondary text-on-secondary font-bold shadow-sm">
                Secondary (#FEA619 Amber)
              </div>
              <div className="p-3 rounded-xl bg-tertiary text-on-tertiary font-bold shadow-sm">
                Tertiary (#00855B Emerald)
              </div>
              <div className="p-3 rounded-xl bg-surface-container text-on-surface border border-outline-variant font-bold">
                Surface Container
              </div>
            </div>
          </Card>
        </section>

        {/* Component Suite Showcase */}
        <section className="space-y-6">
          <h2 className="text-2xl font-heading font-bold text-on-surface border-b border-outline-variant pb-2">
            Komponen Inti (UI Primitives Suite)
          </h2>

          {/* Buttons Showcase */}
          <Card variant="surface" padding="lg" className="space-y-4">
            <h3 className="text-lg font-heading font-bold text-on-surface">
              1. 3D Tactile Action Buttons
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary" leftIcon={<Sparkles className="w-4 h-4" />}>
                Mulai Petualangan
              </Button>
              <Button variant="secondary" leftIcon={<Trophy className="w-4 h-4" />}>
                Klaim Hadiah
              </Button>
              <Button variant="outline">
                Kembali
              </Button>
              <Button variant="ghost">
                Lewati Soal
              </Button>
              <Button variant="primary" disabled>
                Terkunci
              </Button>
            </div>
          </Card>

          {/* Progress Bar & Mascot Bubble Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="surface" padding="md" className="space-y-4">
              <h3 className="text-lg font-heading font-bold text-on-surface">
                2. Progress Bar (Pill-shaped Gradient)
              </h3>
              <div className="space-y-4">
                <ProgressBar value={25} showLabel size="sm" />
                <ProgressBar value={65} showLabel size="md" />
                <ProgressBar value={100} showLabel size="lg" />
              </div>
            </Card>

            <Card variant="surface" padding="md" className="space-y-4">
              <h3 className="text-lg font-heading font-bold text-on-surface">
                3. Mascot Speech Bubble
              </h3>
              <MascotSpeechBubble
                speakerName="Aksi - Si Burung Hantu"
                message="Hebat sekali! Kamu berhasil menyelesaikan 5 soal tanpa salah. Lanjutkan ke tantangan berikutnya!"
              />
            </Card>
          </div>

          {/* Achievement Badges Showcase */}
          <Card variant="surface" padding="lg" className="space-y-4">
            <h3 className="text-lg font-heading font-bold text-on-surface">
              4. Achievement Badges (Collectible Coin)
            </h3>
            <div className="flex flex-wrap gap-6 items-center justify-around">
              <AchievementBadge
                title="Penjelajah Paud"
                icon={<Star className="w-8 h-8 text-secondary" />}
                unlocked={true}
              />
              <AchievementBadge
                title="Jagoan Hitung"
                icon={<Flame className="w-8 h-8 text-secondary" />}
                unlocked={true}
              />
              <AchievementBadge
                title="Pakar Fisika"
                icon={<ShieldCheck className="w-8 h-8 text-secondary" />}
                unlocked={true}
              />
              <AchievementBadge
                title="Master SMA"
                unlocked={false}
              />
            </div>
          </Card>
        </section>

        {/* Simultaneous 4 Theme Comparison Grid */}
        <section className="space-y-6 pt-6 border-t border-outline-variant">
          <h2 className="text-2xl font-heading font-bold text-on-surface">
            Pratinjau Simultan 4 Tema Jenjang
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['tk', 'sd', 'smp', 'sma'] as GradeLevel[]).map((lvl) => (
              <div
                key={lvl}
                data-jenjang={lvl}
                className="p-5 rounded-2xl bg-background border-2 border-primary/30 shadow-md space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="font-heading font-bold text-sm text-primary uppercase">
                    {lvl} Level
                  </span>
                  <button
                    onClick={() => setGradeLevel(lvl)}
                    className="text-xs bg-primary text-on-primary px-2.5 py-1 rounded-lg font-semibold"
                  >
                    Aktifkan
                  </button>
                </div>
                <Card variant="surface" padding="sm" className="space-y-2">
                  <div className="text-xs font-bold text-on-surface">
                    Kartu Demo {lvl.toUpperCase()}
                  </div>
                  <ProgressBar value={70} size="sm" />
                  <Button variant="primary" size="sm" fullWidth>
                    Jelajah
                  </Button>
                </Card>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
