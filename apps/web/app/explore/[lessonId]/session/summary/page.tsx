'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, Button, AchievementBadge } from '@aksicendekia/ui';
import { Trophy, Sparkles, CheckCircle, RotateCcw, ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';

export default function SessionSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = params.lessonId as string;

  const score = parseInt(searchParams.get('score') || '100', 10);
  const xp = parseInt(searchParams.get('xp') || '50', 10);
  const correct = parseInt(searchParams.get('correct') || '5', 10);
  const total = parseInt(searchParams.get('total') || '5', 10);

  const isPerfect = score === 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center py-6">
      <Card variant="surface" padding="lg" className="space-y-6 border border-primary/25 shadow-lg">
        {/* Celebration Header */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-on-surface">
            {isPerfect ? 'Luar Biasa! Nilai Sempurna! 🎉' : 'Hebat! Sesi Belajar Selesai! 👏'}
          </h1>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            Kamu telah menyelesaikan seluruh butir latihan soal. Progres dan XP kamu telah tersimpan di memori perangkat ini.
          </p>
        </div>

        {/* Score & XP Showcase */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 space-y-1">
            <div className="text-xs text-primary font-bold uppercase tracking-wider">Skor Akhir</div>
            <div className="text-3xl font-heading font-bold text-on-surface">{score}%</div>
          </div>

          <div className="p-4 bg-secondary/10 rounded-2xl border border-secondary/20 space-y-1">
            <div className="text-xs text-secondary font-bold uppercase tracking-wider">XP Diperoleh</div>
            <div className="text-3xl font-heading font-bold text-on-surface flex items-center justify-center gap-1">
              <Sparkles className="w-5 h-5 text-secondary" />
              +{xp}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 bg-surface-container rounded-2xl border border-outline/15 space-y-1">
            <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Jawaban Benar</div>
            <div className="text-3xl font-heading font-bold text-on-surface">
              {correct} / {total}
            </div>
          </div>
        </div>

        {/* Badge Preview */}
        <div className="p-4 bg-surface-container/50 rounded-2xl border border-outline/15 flex items-center justify-center gap-4">
          <AchievementBadge title="Pejuang Belajar" size="md" unlocked />
          <div className="text-left text-xs">
            <div className="font-bold text-on-surface">Lencana Terbuka!</div>
            <div className="text-on-surface-variant">Kamu membuka pencapaian belajar lokal baru.</div>
          </div>
        </div>

        {/* Cloud Sync Reminder Banner */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Simpan Progres Belajar Selamanya
            </h4>
            <p className="text-xs text-on-surface-variant">
              Daftar akun gratis agar XP dan lencanamu tidak hilang saat berganti perangkat.
            </p>
          </div>
          <Link href="/register" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Daftar Akun
            </Button>
          </Link>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-outline/15">
          <Link href={`/explore/${lessonId}/session`} className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="md"
              className="w-full sm:w-auto"
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Ulangi Latihan
            </Button>
          </Link>
          <Link href="/explore" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Lanjut Belajar Materi Lain
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
