'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  StudentShell,
  LevelSelector,
  ButtonPrimary,
  TextInput,
  FormField,
  Alert,
} from '@aksicendekia/ui';
import { apiFetch } from '../../../lib/api-fetch';

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('Siswa Cendekia');
  const [stage, setStage] = useState<'tk' | 'sd' | 'smp' | 'sma'>('sd');
  const [gradeLevel, setGradeLevel] = useState(4);
  const [selectedAvatar, setSelectedAvatar] = useState('avatar-1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetAvatars = [
    { id: 'avatar-1', label: 'Rubah Cendekia' },
    { id: 'avatar-2', label: 'Gajah Pintar' },
    { id: 'avatar-3', label: 'Burung Hantu Bijak' },
    { id: 'avatar-4', label: 'Harimau Berani' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch('/api/v1/students/me', {
        method: 'PUT',
        body: JSON.stringify({
          displayName,
          educationStage: stage.toUpperCase(),
          gradeLevel: Number(gradeLevel),
          avatarId: selectedAvatar,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal menyimpan profil');
      }

      router.push('/mission-map');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentShell>
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Selamat Datang! Mari Atur Profil Belajarmu
          </h1>
          <p className="text-sm text-surface-variant">
            Pilih jenjang, avatar bawaan, dan tingkat kelasmu untuk memulai petualangan
          </p>
        </div>

        {error && <Alert variant="error" title="Gagal">{error}</Alert>}

        <form onSubmit={handleSave} className="bg-surface-container border border-outline/20 p-6 rounded-2xl space-y-6 shadow-sm">
          <FormField label="Nama Tampilan (Anonim & Publik)" error={undefined}>
            <TextInput
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Contoh: Siswa Bintang"
              required
            />
          </FormField>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-surface-variant">
              Pilih Jenjang Pendidikan
            </label>
            <LevelSelector
              activeLevel={stage}
              onLevelChange={(level) => setStage(level)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-surface-variant">
              Pilih Avatar Preset Bawaan
            </label>
            <div className="grid grid-cols-4 gap-3">
              {presetAvatars.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    selectedAvatar === av.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary'
                      : 'border-outline/20 bg-surface-container hover:border-outline'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {av.label.charAt(0)}
                  </div>
                  <span className="text-xs text-center font-medium">{av.label}</span>
                </button>
              ))}
            </div>
          </div>

          <ButtonPrimary
            type="submit"
            className="w-full justify-center py-3 text-base"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Mulai Belajar'}
          </ButtonPrimary>
        </form>
      </div>
    </StudentShell>
  );
}
