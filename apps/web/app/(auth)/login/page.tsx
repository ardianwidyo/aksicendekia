'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ButtonPrimary,
  TextInput,
  PasswordInput,
  FormField,
  Alert,
  MascotSpeechBubble,
  GuestSyncModal,
} from '@aksicendekia/ui';
import { useGuestProgress } from '../../../lib/context/guest-progress-context';

export default function LoginPage() {
  const router = useRouter();
  const { state, clearState } = useGuestProgress();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const navigateAfterLogin = (role: string, status: string) => {
    if (status === 'PENDING_CONSENT') {
      router.push('/consent-status');
    } else if (role === 'GURU') {
      router.push('/teacher-dashboard');
    } else if (role === 'ORANG_TUA') {
      router.push('/children');
    } else {
      router.push('/onboarding');
    }
  };

  const handleSyncConfirm = async () => {
    if (!authToken || !state) return;
    try {
      setLoading(true);
      await fetch('http://localhost:4000/api/v1/sync/guest-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          guestId: state.guestId,
          totalXp: state.gamification.totalXp,
          streakCount: state.gamification.streak.currentStreak,
          completedLessonIds: state.curriculumProgress.completedLessonIds,
          completedModuleIds: state.curriculumProgress.completedModuleIds,
          unlockedBadgeIds: state.gamification.unlockedBadgeIds,
          sessionHistory: state.recentSessions,
        }),
      });
      await clearState();
    } catch (err) {
      console.error('Failed to sync guest progress:', err);
    } finally {
      setIsSyncModalOpen(false);
      setLoading(false);
      navigateAfterLogin(userRole || 'SISWA', userStatus || 'ACTIVE');
    }
  };

  const handleSyncSkip = () => {
    setIsSyncModalOpen(false);
    navigateAfterLogin(userRole || 'SISWA', userStatus || 'ACTIVE');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('userRole', data.user.role);
        setAuthToken(data.accessToken);
        setUserStatus(data.user.status);
        setUserRole(data.user.role);
      }

      // Check if there is guest progress to sync for student role
      const hasGuestProgress =
        state &&
        (state.gamification.totalXp > 0 || state.curriculumProgress.completedLessonIds.length > 0);

      if (hasGuestProgress && data.user.role === 'SISWA') {
        setIsSyncModalOpen(true);
      } else {
        navigateAfterLogin(data.user.role, data.user.status);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <MascotSpeechBubble message="Selamat datang kembali! Yuk masuk untuk melanjutkan petualangan belajarmu!" />
          <h1 className="text-3xl font-bold text-primary tracking-tight mt-4">
            Masuk ke AksiCendekia
          </h1>
          <p className="text-sm text-surface-variant">
            Platform belajar bergamifikasi untuk masa depan Indonesia
          </p>
        </div>

        {error && <Alert variant="error" title="Gagal Masuk">{error}</Alert>}

        <form onSubmit={handleSubmit} className="bg-surface-container p-6 rounded-2xl border border-outline/20 space-y-4 shadow-sm">
          <FormField label="Email Pengguna" required>
            <TextInput
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Kata Sandi" required>
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Lupa kata sandi?
            </Link>
          </div>

          <ButtonPrimary
            type="submit"
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </ButtonPrimary>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-surface-variant">
            Belum punya akun?{' '}
            <Link href="/register" className="font-bold text-primary hover:underline">
              Daftar di sini
            </Link>
          </p>
          <p className="text-xs text-on-surface-variant">
            Atau{' '}
            <Link href="/explore" className="font-bold text-secondary hover:underline">
              Lanjut Belajar Mode Tamu
            </Link>
          </p>
        </div>
      </div>

      <GuestSyncModal
        isOpen={isSyncModalOpen}
        totalXp={state?.gamification.totalXp || 0}
        completedLessonsCount={state?.curriculumProgress.completedLessonIds.length || 0}
        onClose={() => setIsSyncModalOpen(false)}
        onConfirm={handleSyncConfirm}
        onSkip={handleSyncSkip}
        isLoading={loading}
      />
    </div>
  );
}
