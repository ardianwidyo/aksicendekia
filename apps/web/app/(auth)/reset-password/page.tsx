'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ButtonPrimary, PasswordInput, FormField, Alert } from '@aksicendekia/ui';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Reset password gagal');
      }

      router.push('/login?reset=success');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui kata sandi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container border border-outline/20 p-6 rounded-2xl space-y-4 shadow-sm">
      {error && <Alert variant="error" title="Gagal">{error}</Alert>}

      <FormField label="Kata Sandi Baru (Min. 8 Karakter)" error={undefined}>
        <PasswordInput
          placeholder="Masukkan kata sandi baru"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Konfirmasi Kata Sandi Baru" error={undefined}>
        <PasswordInput
          placeholder="Ulangi kata sandi baru"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </FormField>

      <ButtonPrimary
        type="submit"
        className="w-full justify-center py-3 text-base"
        disabled={loading}
      >
        {loading ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}
      </ButtonPrimary>

      <div className="text-center pt-2 text-xs text-surface-variant">
        Kembali ke{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Halaman Masuk
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Pembaruan Kata Sandi
          </h1>
          <p className="text-sm text-surface-variant">
            Masukkan kata sandi baru untuk akun Anda
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-4 text-xs text-surface-variant">Memuat formulir...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
