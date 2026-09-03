'use client';

import React from 'react';
import { User, Sparkles, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { Button } from '../button';
import { useI18n } from '../../providers/i18n-provider';

export interface GuestHeaderBannerProps {
  displayName?: string;
  totalXp?: number;
  currentStreak?: number;
  isIncognito?: boolean;
  onOpenProfile?: () => void;
  onOpenSync?: () => void;
  onOpenReset?: () => void;
}

export const GuestHeaderBanner: React.FC<GuestHeaderBannerProps> = ({
  displayName = 'Siswa Hebat',
  totalXp = 0,
  currentStreak = 0,
  isIncognito = false,
  onOpenProfile,
  onOpenSync,
  onOpenReset,
}) => {
  const { t } = useI18n();

  return (
    <header className="bg-surface border-b border-outline/15 px-4 py-2.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Guest Badge & Profile Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/25 transition-all text-on-surface text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            aria-label="Ubah Profil Tamu"
          >
            <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <span>{displayName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-primary font-bold">
              Mode Tamu
            </span>
          </button>

          {/* Quick Stats: XP & Streak */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-on-surface-variant">
            <span className="flex items-center gap-1 text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              {totalXp} XP
            </span>
            <span className="text-outline">|</span>
            <span className="flex items-center gap-1 text-secondary">
              🔥 {currentStreak} Hari
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isIncognito && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 rounded-full text-xs font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Mode Penyamaran</span>
            </div>
          )}

          {onOpenReset && (
            <button
              type="button"
              onClick={onOpenReset}
              className="p-2 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-surface-container min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Reset Progres Belajar"
              aria-label="Reset Progres Belajar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {onOpenSync && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenSync}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {t('guest.banner.cta') || 'Simpan ke Akun'}
            </Button>
          )}
        </div>
      </div>

      {/* Feature 011 / FR-030 — the "progress not saved" notice stays visible at
          every viewport (including 320px portrait), not only on large screens. */}
      {isIncognito && (
        <div
          role="status"
          className="max-w-7xl mx-auto mt-2 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>
            Kemajuan tidak tersimpan.{' '}
            {t('guest.incognito.warning') || 'Kamu memakai mode penyamaran; buat akun untuk menyimpan permanen.'}
          </span>
        </div>
      )}
    </header>
  );
};
