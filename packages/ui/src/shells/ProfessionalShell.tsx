'use client';

import React, { useState } from 'react';
import { Search, Bell, User, BookOpen, Users, FileText, Settings, ShieldCheck, ChevronDown, LogOut } from 'lucide-react';

export interface ProfessionalShellProps {
  children: React.ReactNode;
  userRole?: 'admin' | 'teacher' | 'parent';
  userName?: string;
  activeNavId?: string;
  onNavSelect?: (id: string) => void;
}

export const ProfessionalShell: React.FC<ProfessionalShellProps> = ({
  children,
  userRole = 'admin',
  userName = 'Budi Santoso, M.Pd.',
  activeNavId = 'curriculum',
  onNavSelect,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<'admin' | 'teacher' | 'parent'>(userRole);

  const roleLabels = {
    admin: 'Admin CMS & Sekolah',
    teacher: 'Guru / Pendidik',
    parent: 'Orang Tua / Wali',
  };

  const navItems = [
    { id: 'curriculum', label: 'Kurikulum & Butir Soal', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'analytics', label: 'Laporan & Analitik', icon: <FileText className="w-4 h-4" /> },
    { id: 'users', label: 'Manajemen Pengguna', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'Pengaturan Sistem', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div
      data-shell="professional"
      className="min-h-screen bg-background text-on-surface flex flex-col font-body antialiased"
    >
      {/* High Density Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-surface-container-lowest border-b border-outline-variant px-md py-xs flex items-center justify-between min-h-[56px] shadow-sm">
        <div className="flex items-center gap-lg">
          {/* Brand */}
          <div className="flex items-center gap-xs">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
              AC
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-label-lg text-primary leading-none">
                AksiCendekia
              </span>
              <span className="font-body text-[10px] text-on-surface-variant font-medium">
                Portal Profesional
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center relative w-72">
            <Search className="w-4 h-4 absolute left-3 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Cari butir soal, kelas, atau siswa..."
              className="w-full pl-9 pr-md py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary min-h-[36px]"
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-xs">
            {navItems.map((item) => {
              const isActive = activeNavId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavSelect?.(item.id)}
                  className={`flex items-center gap-xs px-sm py-1.5 rounded-md font-heading font-semibold text-label-md transition-colors min-h-[36px] ${
                    isActive
                      ? 'bg-primary-container/20 text-primary border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-sm">
          {/* Role Switcher Badge */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen((p) => !p)}
              className="flex items-center gap-xs px-sm py-1 rounded-full bg-surface-container-high border border-outline-variant text-on-surface font-body text-xs font-semibold hover:bg-surface-container-highest transition-colors min-h-[36px]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>{roleLabels[activeRole]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-xs w-48 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg py-xs z-50">
                {(['admin', 'teacher', 'parent'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setActiveRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full px-md py-sm text-left font-body text-body-sm transition-colors ${
                      activeRole === r
                        ? 'bg-primary-container/20 font-semibold text-primary'
                        : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button
            aria-label="Notifikasi"
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors relative min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-xs pl-xs border-l border-outline-variant">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container font-bold text-xs flex items-center justify-center">
              BS
            </div>
            <span className="hidden sm:inline-block font-body text-body-sm font-semibold text-on-surface">
              {userName}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-md md:p-lg max-w-container-max mx-auto w-full min-w-0">
        {children}
      </main>
    </div>
  );
};
