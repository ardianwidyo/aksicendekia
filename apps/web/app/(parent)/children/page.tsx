'use client';

import React, { useState } from 'react';
import {
  ProfessionalShell,
  DataTable,
  ButtonPrimary,
  Modal,
  TextInput,
  PasswordInput,
  Select,
  FormField,
  Alert,
} from '@aksicendekia/ui';
import { apiFetch } from '../../../lib/api-fetch';

export default function ParentChildrenPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for adding child
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [educationStage, setEducationStage] = useState('SD');
  const [gradeLevel, setGradeLevel] = useState(4);
  const [avatarId, setAvatarId] = useState('avatar-1');
  const [birthDate, setBirthDate] = useState('2015-01-01');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample initial data for children
  const [children, setChildren] = useState([
    {
      id: 'sp-1',
      displayName: 'Budi Cendekia',
      educationStage: 'SD',
      gradeLevel: 4,
      status: 'ACTIVE',
      consentedAt: '2026-08-27',
    },
  ]);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await apiFetch('/api/v1/parent/children', {
        method: 'POST',
        body: JSON.stringify({
          displayName,
          email,
          password,
          educationStage,
          gradeLevel: Number(gradeLevel),
          avatarId,
          birthDate: new Date(birthDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menambahkan akun anak');
      }

      setChildren([
        ...children,
        {
          id: data.data.id,
          displayName: data.data.displayName,
          educationStage: data.data.educationStage,
          gradeLevel: data.data.gradeLevel,
          status: 'ACTIVE',
          consentedAt: new Date().toISOString().split('T')[0],
        },
      ]);

      setIsModalOpen(false);
      // Reset form
      setDisplayName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'displayName', header: 'Nama Tampilan Anak' },
    { key: 'educationStage', header: 'Jenjang' },
    { key: 'gradeLevel', header: 'Kelas' },
    { key: 'status', header: 'Status Akun' },
    { key: 'consentedAt', header: 'Tanggal Persetujuan' },
  ];

  return (
    <ProfessionalShell userRole="parent" userName="Orang Tua Wali">
      <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              Manajemen Akun Anak
            </h1>
            <p className="text-xs text-surface-variant">
              Kelola akun anak di bawah naungan Anda dan periksa status persetujuan resmi
            </p>
          </div>

          <ButtonPrimary type="button" onClick={() => setIsModalOpen(true)}>
            + Tambah Akun Anak
          </ButtonPrimary>
        </div>

        <DataTable columns={columns} data={children} />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Tambah Akun Anak Baru"
        >
          <form onSubmit={handleAddChild} className="space-y-4 pt-2">
            {error && <Alert variant="error" title="Gagal">{error}</Alert>}

            <FormField label="Nama Tampilan Anak" error={undefined}>
              <TextInput
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Contoh: Budi Cendekia"
                required
              />
            </FormField>

            <FormField label="Email Akun Anak" error={undefined}>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anak@email.com"
                required
              />
            </FormField>

            <FormField label="Kata Sandi Anak" error={undefined}>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi untuk anak"
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

            <FormField label="Tanggal Lahir Anak" error={undefined}>
              <TextInput
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </FormField>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-surface-variant hover:underline"
              >
                Batal
              </button>
              <ButtonPrimary type="submit" disabled={loading}>
                {loading ? 'Menambahkan...' : 'Simpan Akun Anak'}
              </ButtonPrimary>
            </div>
          </form>
        </Modal>
      </div>
    </ProfessionalShell>
  );
}
