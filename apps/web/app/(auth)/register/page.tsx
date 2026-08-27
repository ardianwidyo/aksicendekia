'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ButtonPrimary,
  TextInput,
  PasswordInput,
  Select,
  FormField,
  Alert,
} from '@aksicendekia/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<'SISWA' | 'ORANG_TUA' | 'GURU' | 'ADMIN'>('SISWA');

  // Common Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Student specific fields
  const [displayName, setDisplayName] = useState('');
  const [educationStage, setEducationStage] = useState('SD');
  const [gradeLevel, setGradeLevel] = useState(1);
  const [avatarId, setAvatarId] = useState('avatar-1');
  const [birthDate, setBirthDate] = useState('2012-01-01');
  const [parentEmail, setParentEmail] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: Record<string, any> = {
        email,
        password,
        role: activeRole,
      };

      if (activeRole === 'SISWA') {
        payload.displayName = displayName;
        payload.educationStage = educationStage;
        payload.gradeLevel = Number(gradeLevel);
        payload.avatarId = avatarId;
        payload.birthDate = new Date(birthDate).toISOString();
        if (parentEmail) payload.parentEmail = parentEmail;
      }

      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registrasi gagal');
      }

      if (data.data?.requiresConsent) {
        router.push('/consent-status');
      } else {
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: Array<{ id: 'SISWA' | 'ORANG_TUA' | 'GURU' | 'ADMIN'; label: string }> = [
    { id: 'SISWA', label: 'Siswa' },
    { id: 'ORANG_TUA', label: 'Orang Tua / Wali' },
    { id: 'GURU', label: 'Guru' },
    { id: 'ADMIN', label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Pendaftaran Akun Baru
          </h1>
          <p className="text-sm text-surface-variant">
            Pilih peran Anda dan lengkapi formulir pendaftaran
          </p>
        </div>

        <div className="flex border-b border-outline/20 gap-1 overflow-x-auto">
          {roleOptions.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setActiveRole(role.id)}
              className={`px-4 py-2 font-semibold text-xs rounded-t-xl transition-all ${
                activeRole === role.id
                  ? 'bg-primary text-on-primary border-b-2 border-primary'
                  : 'text-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>

        {error && <Alert variant="error" title="Pendaftaran Gagal">{error}</Alert>}

        <form onSubmit={handleSubmit} className="bg-surface-container border border-outline/20 p-6 rounded-2xl space-y-4 shadow-sm">
          <FormField label="Email Valid" error={undefined}>
            <TextInput
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Kata Sandi (Min. 8 karakter)" error={undefined}>
            <PasswordInput
              placeholder="Buat kata sandi aman"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>

          {activeRole === 'SISWA' && (
            <>
              <FormField label="Nama Tampilan (Publik)" error={undefined}>
                <TextInput
                  placeholder="Contoh: Budi Cendekia"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Jenjang Pendidikan" error={undefined}>
                  <Select
                    value={educationStage}
                    onChange={(e) => setEducationStage(e.target.value)}
                    options={[
                      { value: 'TK', label: 'TK' },
                      { value: 'SD', label: 'SD' },
                      { value: 'SMP', label: 'SMP' },
                      { value: 'SMA', label: 'SMA' },
                    ]}
                  />
                </FormField>

                <FormField label="Tingkat Kelas" error={undefined}>
                  <Select
                    value={gradeLevel.toString()}
                    onChange={(e) => setGradeLevel(Number(e.target.value))}
                    options={Array.from({ length: 12 }, (_, i) => ({
                      value: (i + 1).toString(),
                      label: `Kelas ${i + 1}`,
                    }))}
                  />
                </FormField>
              </div>

              <FormField label="Tanggal Lahir (Untuk verifikasi usia < 18)" error={undefined}>
                <TextInput
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Email Orang Tua / Wali (Opsional / Diperlukan jika usia < 18)" error={undefined}>
                <TextInput
                  type="email"
                  placeholder="orangtua@email.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                />
              </FormField>
            </>
          )}

          <ButtonPrimary
            type="submit"
            className="w-full justify-center py-3 text-base mt-2"
            disabled={loading}
          >
            {loading ? 'Membuat Akun...' : 'Daftar Akun'}
          </ButtonPrimary>

          <div className="text-center pt-2 text-xs text-surface-variant">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Masuk di sini
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
