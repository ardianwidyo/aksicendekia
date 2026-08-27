'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ButtonPrimary, TextInput, FormField, Alert, Checkbox } from '@aksicendekia/ui';

export default function ParentConsentApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const studentProfileId = (params?.token as string) || '';

  const [agreed, setAgreed] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Anda harus menyetujui syarat & ketentuan persetujuan wali');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/parent/consent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId,
          otpCode: otpCode.length === 6 ? otpCode : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal memproses persetujuan wali');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengonfirmasi persetujuan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Persetujuan Orang Tua / Wali
          </h1>
          <p className="text-sm text-surface-variant">
            Konfirmasi izin penggunaan platform belajar AksiCendekia untuk anak Anda
          </p>
        </div>

        {error && <Alert variant="error" title="Gagal">{error}</Alert>}

        {success ? (
          <Alert
            variant="success"
            title="Persetujuan Berhasil Diberikan!"
          >
            Terima kasih! Persetujuan wali telah terekam secara sah (versi teks v1.0). Akun siswa kini telah aktif dan dapat digunakan untuk belajar.
          </Alert>
        ) : (
          <form onSubmit={handleApprove} className="bg-surface-container border border-outline/20 p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="p-4 bg-surface rounded-xl border border-outline/10 text-xs text-surface-variant space-y-2">
              <h2 className="font-semibold text-primary text-sm">Pernyataan Persetujuan Wali (Versi v1.0):</h2>
              <p>
                Saya menyatakan bahwa saya adalah orang tua / wali sah dari siswa yang didaftarkan. Saya memberikan izin pemrosesan data pribadi anak terbatas pada aktivitas belajar anonim di platform AksiCendekia sesuai UU No. 27/2022 tentang Pelindungan Data Pribadi.
              </p>
            </div>

            <FormField label="Kode OTP 6-Digit (Opsional jika via tautan langsung)" error={undefined}>
              <TextInput
                placeholder="Contoh: 123456"
                value={otpCode}
                maxLength={6}
                onChange={(e) => setOtpCode(e.target.value)}
              />
            </FormField>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                label="Saya menyetujui pernyataan persetujuan wali di atas secara sadar"
              />
            </div>

            <ButtonPrimary
              type="submit"
              className="w-full justify-center py-3 text-base"
              disabled={loading || !agreed}
            >
              {loading ? 'Memproses...' : 'Setujui & Aktifkan Akun Anak'}
            </ButtonPrimary>
          </form>
        )}
      </div>
    </div>
  );
}
