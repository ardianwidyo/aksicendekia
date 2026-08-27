'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ButtonPrimary, TextInput, FormField, Alert } from '@aksicendekia/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal mengirim permintaan reset password');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Lupa Kata Sandi?
          </h1>
          <p className="text-sm text-surface-variant">
            Masukkan email Anda untuk menerima instruksi pemulihan akun
          </p>
        </div>

        {submitted ? (
          <Alert
            variant="info"
            title="Email Terkirim"
          >
            Instruksi pemulihan kata sandi telah dikirim ke {email}. Silakan periksa kotak masuk email Anda.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface-container border border-outline/20 p-6 rounded-2xl space-y-4 shadow-sm">
            {error && <Alert variant="error" title="Gagal">{error}</Alert>}

            <FormField label="Email Terdaftar" error={undefined}>
              <TextInput
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>

            <ButtonPrimary
              type="submit"
              className="w-full justify-center py-3 text-base"
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Kirim Instruksi Reset'}
            </ButtonPrimary>

            <div className="text-center pt-2 text-xs text-surface-variant">
              Kembali ke{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Halaman Masuk
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
