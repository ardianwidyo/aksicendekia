'use client';

import React, { useState } from 'react';
import { GradeLevel } from '@aksicendekia/design-tokens';
import { Flame, Globe, Sparkles, Award, Settings, Crown, Menu, X, BookOpen } from 'lucide-react';
import { LevelSelector } from '../components/level-selector';
import { useTheme } from '../providers/theme-provider';

export interface StudentShellProps {
  children: React.ReactNode;
  activeNavId?: string;
  onNavSelect?: (id: string) => void;
  onUpgradeClick?: () => void;
}

export const StudentShell: React.FC<StudentShellProps> = ({
  children,
  activeNavId = 'dashboard',
  onNavSelect,
  onUpgradeClick,
}) => {
  const { gradeLevel, setGradeLevel } = useTheme();
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [streakCount] = useState(7);

  const navItems = [
    { id: 'dashboard', label: 'Beranda Belajar', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'achievements', label: 'Pencapaian & Lencana', icon: <Award className="w-5 h-5" /> },
    { id: 'settings', label: 'Pengaturan Akun', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body antialiased" data-jenjang={gradeLevel}>
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant px-md py-sm flex items-center justify-between min-h-[64px]">
        <div className="flex items-center gap-md">
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Buka Menu Sidebar"
            className="md:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-xs">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-heading font-bold text-lg shadow-sm">
              AC
            </div>
            <span className="font-heading font-bold text-title-md text-primary hidden sm:inline-block">
              AksiCendekia
            </span>
          </div>
        </div>

        <div className="flex items-center gap-sm">
          {/* Streak Indicator */}
          <div className="flex items-center gap-xs px-md py-1.5 rounded-full bg-secondary-container/30 border border-secondary/30 text-on-secondary-container font-heading font-bold text-body-sm shadow-sm">
            <Flame className="w-5 h-5 text-secondary fill-secondary animate-bounce" />
            <span>{streakCount} Hari Beruntun</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLang((l) => (l === 'id' ? 'en' : 'id'))}
            className="flex items-center gap-xs px-sm py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-body text-label-md font-semibold transition-colors min-h-[44px]"
            aria-label="Tukar Bahasa"
          >
            <Globe className="w-4 h-4 text-primary" />
            <span className="uppercase">{lang}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex w-full max-w-container-max mx-auto px-0 md:px-gutter">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-surface-container-lowest border-r border-outline-variant p-md flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="space-y-lg">
            {/* Grade Selector */}
            <div>
              <label className="block font-heading text-label-md font-bold text-on-surface-variant mb-xs uppercase tracking-wider">
                Jenjang Sekolah
              </label>
              <LevelSelector
                variant="horizontal"
                activeLevel={gradeLevel}
                onLevelChange={(lvl) => setGradeLevel(lvl)}
              />
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-xs">
              <label className="block font-heading text-label-md font-bold text-on-surface-variant mb-xs uppercase tracking-wider">
                Menu Utama
              </label>
              {navItems.map((item) => {
                const isActive = activeNavId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavSelect?.(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-md px-md py-sm rounded-xl font-heading font-semibold text-body-md transition-all min-h-[48px] ${
                      isActive
                        ? 'bg-primary text-on-primary border-b-4 border-on-primary-fixed-variant shadow-sm'
                        : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* CTA Upgrade to Pro */}
          <div className="pt-md border-t border-outline-variant">
            <div className="p-md rounded-2xl bg-gradient-to-br from-secondary-container/40 via-surface-container-low to-primary-container/20 border border-secondary/40 space-y-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5" />
              </div>
              <div className="font-heading font-bold text-title-sm text-on-surface">
                AksiCendekia Pro
              </div>
              <p className="font-body text-body-sm text-on-surface-variant">
                Buka seluruh materi kuis tanpa batas dan laporan belajar lengkap!
              </p>
              <button
                onClick={onUpgradeClick}
                className="w-full border-b-[4px] border-on-secondary-fixed-variant bg-secondary text-on-secondary font-heading font-bold text-label-lg py-sm px-md rounded-xl active:border-b-0 active:translate-y-[2px] transition-all min-h-[44px]"
              >
                Tingkatkan ke Pro
              </button>
            </div>
          </div>
        </aside>

        {/* Backdrop for Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-on-surface/30 z-30 md:hidden"
          />
        )}

        {/* Main Content Container */}
        <main className="flex-1 p-md md:p-lg min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
