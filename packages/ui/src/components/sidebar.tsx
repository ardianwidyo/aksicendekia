'use client';

import * as React from 'react';
import { useI18n } from '../providers/i18n-provider';
import { useTheme } from '../providers/theme-provider';
import { Button } from './button';
import { LevelSelector } from './level-selector';
import { BookOpen, Award, Settings, Sparkles, X } from 'lucide-react';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose,
  className = '',
}) => {
  const { t } = useI18n();
  const { gradeLevel } = useTheme();

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 w-72 h-screen bg-surface border-r border-outline-variant p-5 flex flex-col justify-between transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${className}`}
    >
      <div className="space-y-6">
        {/* Logo & Header */}
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-heading font-bold text-xl shadow-md">
              A
            </div>
            <div>
              <div className="font-heading font-bold text-lg text-on-surface leading-none">
                AksiCendekia
              </div>
              <div className="text-[10px] text-on-surface-variant font-medium mt-1">
                Fase {gradeLevel.toUpperCase()}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              aria-label="Tutup menu"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Grade Level Selector */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-on-surface-variant px-1 uppercase tracking-wider">
            {t('common.selectGrade')}
          </div>
          <LevelSelector variant="horizontal" />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 pt-4 border-t border-outline-variant">
          <a
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container transition-colors"
          >
            <BookOpen className="w-5 h-5 text-primary" />
            <span>{t('nav.dashboard')}</span>
          </a>
          <a
            href="/#achievements"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container transition-colors"
          >
            <Award className="w-5 h-5 text-secondary" />
            <span>{t('nav.achievements')}</span>
          </a>
          <a
            href="/catalog"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container transition-colors"
          >
            <Sparkles className="w-5 h-5 text-tertiary" />
            <span>{t('nav.catalog')}</span>
          </a>
          <a
            href="/#settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container transition-colors"
          >
            <Settings className="w-5 h-5 text-on-surface-variant" />
            <span>{t('nav.settings')}</span>
          </a>
        </nav>
      </div>

      {/* Upgrade CTA Card */}
      <div className="bg-gradient-to-br from-primary-container to-surface-container p-4 rounded-2xl border border-primary/30 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>AksiCendekia Pro</span>
        </div>
        <p className="text-xs text-on-surface-variant font-medium">
          Akses seluruh modul Kurikulum Merdeka & fitur kuis tanpa batas.
        </p>
        <Button variant="primary" size="sm" fullWidth>
          {t('common.upgradeToPro')}
        </Button>
      </div>
    </aside>
  );
};
