'use client';

import * as React from 'react';
import { useI18n } from '../providers/i18n-provider';
import { Flame, Menu, Globe, User } from 'lucide-react';

export interface TopBarProps {
  currentStreak?: number;
  onMenuToggle?: () => void;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentStreak = 7,
  onMenuToggle,
  className = '',
}) => {
  const { locale, setLocale, t } = useI18n();

  return (
    <header
      className={`sticky top-0 z-30 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant px-4 md:px-8 flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <div className="font-heading font-bold text-lg text-on-surface hidden sm:block">
          {t('common.appTitle')}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Streak Indicator */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container/30 border border-secondary text-secondary font-bold text-sm shadow-sm"
          title="Hari Belajar Beruntun"
        >
          <Flame className="w-5 h-5 text-secondary animate-pulse" />
          <span>{t('common.streakDays', { count: currentStreak })}</span>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors text-xs font-bold text-on-surface"
          aria-label="Ganti bahasa"
        >
          <Globe className="w-4 h-4 text-primary" />
          <span>{locale.toUpperCase()}</span>
        </button>

        {/* User Profile Avatar Preview */}
        <div className="w-9 h-9 rounded-full bg-primary-container border-2 border-primary flex items-center justify-center text-on-primary-container font-bold text-sm">
          <User className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
};
