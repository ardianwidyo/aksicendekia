"use client";

import React from "react";
import Link from "next/link";

interface SoftPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  currentUsage?: number;
  limit?: number;
}

export const SoftPaywallModal: React.FC<SoftPaywallModalProps> = ({
  isOpen,
  onClose,
  title = "Sesi Gratis Hari Ini Sudah Habis!",
  message = "Kamu telah menyelesaikan 3/3 sesi belajar gratis hari ini. Tingkatkan ke AksiCendekia Pro untuk belajar tanpa batas!",
  currentUsage = 3,
  limit = 3,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 md:p-8 text-white">
        {/* Glow Header Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Badge Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 shadow-lg shadow-amber-500/30 mb-6">
          <svg className="w-8 h-8 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-center tracking-tight text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-300 text-center mb-6 leading-relaxed">
          {message}
        </p>

        {/* Quota Progress Bar */}
        <div className="bg-slate-800/80 rounded-2xl p-4 mb-6 border border-slate-700/50">
          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
            <span>Kuota Sesi Gratis Harian</span>
            <span className="text-amber-400 font-bold">{currentUsage} / {limit} Terpakai</span>
          </div>
          <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/upgrade"
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-center text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <span>Tingkatkan ke Pro</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <button
            onClick={onClose}
            className="py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors duration-200 text-center"
          >
            Kembali Besok
          </button>
        </div>
      </div>
    </div>
  );
};
