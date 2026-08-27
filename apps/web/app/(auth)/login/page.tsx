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
} from '@aksicendekia/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      // Store in-memory access token & navigate based on role/status
      if (data.user.status === 'PENDING_CONSENT') {
        router.push('/consent-status');
      } else if (data.user.role === 'GURU') {
        router.push('/teacher/classes');
      } else if (data.user.role === 'ORANG_TUA') {
        router.push('/parent/children');
      } else {
        router.push('/onboarding');
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

        <form onSubmit={handleSubmit} className="bg-surface-container border border-outline/20 p-6 rounded-2xl space-y-4 shadow-sm">
          <FormField label="Email" error={undefined}>
            <TextInput
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Kata Sandi" error={undefined}>
            <PasswordInput
              placeholder="Masukkan kata sandi"
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
            className="w-full justify-center py-3 text-base"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </ButtonPrimary>

          <div className="text-center pt-2 text-xs text-surface-variant">
            Belum memiliki akun?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Daftar Akun Baru
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
