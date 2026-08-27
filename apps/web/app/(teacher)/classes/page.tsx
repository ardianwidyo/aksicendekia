'use client';

import React, { useState } from 'react';
import {
  ProfessionalShell,
  DataTable,
  ButtonPrimary,
  Modal,
  TextInput,
  Select,
  FormField,
  Alert,
  StatCard,
} from '@aksicendekia/ui';

export default function TeacherClassesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [educationStage, setEducationStage] = useState('SMP');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample data for teacher's classes
  const [classes, setClasses] = useState([
    {
      id: 'class-1',
      name: 'Matematika 7-A',
      educationStage: 'SMP',
      classCode: 'AKSI-8X2K',
      studentCount: 24,
    },
    {
      id: 'class-2',
      name: 'IPA Terpadu 8-B',
      educationStage: 'SMP',
      classCode: 'AKSI-9M4L',
      studentCount: 28,
    },
  ]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: className,
          educationStage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal membuat kelas');
      }

      setClasses([
        ...classes,
        {
          id: data.data.id,
          name: data.data.name,
          educationStage: data.data.educationStage,
          classCode: data.data.classCode,
          studentCount: 0,
        },
      ]);

      setIsModalOpen(false);
      setClassName('');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membuat kelas');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Nama Kelas' },
    { key: 'educationStage', header: 'Jenjang' },
    { key: 'classCode', header: 'Kode Kelas (Bagikan ke Siswa)' },
    { key: 'studentCount', header: 'Jumlah Siswa' },
  ];

  return (
    <ProfessionalShell userRole="teacher" userName="Guru Pengajar">
      <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              Manajemen Kelas & Roster Siswa
            </h1>
            <p className="text-xs text-surface-variant">
              Buat kelas baru, peroleh kode kelas unik, dan kelola daftar anggota siswa
            </p>
          </div>

          <ButtonPrimary type="button" onClick={() => setIsModalOpen(true)}>
            + Buat Kelas Baru
          </ButtonPrimary>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Kelas Aktif" value={classes.length.toString()} change="2 kelas" trend="up" />
          <StatCard title="Total Siswa Terdaftar" value="52" change="+4 siswa" trend="up" />
          <StatCard title="Kode Kelas Terbaru" value={classes[classes.length - 1]?.classCode || '-'} change="Aktif" trend="neutral" />
        </div>

        <DataTable columns={columns} data={classes} />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Buat Kelas Pembelajaran Baru"
        >
          <form onSubmit={handleCreateClass} className="space-y-4 pt-2">
            {error && <Alert variant="error" title="Gagal">{error}</Alert>}

            <FormField label="Nama Kelas" error={undefined}>
              <TextInput
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Contoh: Matematika 7-A"
                required
              />
            </FormField>

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

            <div className="p-3 bg-surface rounded-xl border border-outline/10 text-xs text-surface-variant">
              Sistem akan menghasilkan Kode Kelas alfanumerik unik secara otomatis untuk dibagikan kepada siswa.
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-surface-variant hover:underline"
              >
                Batal
              </button>
              <ButtonPrimary type="submit" disabled={loading}>
                {loading ? 'Membuat...' : 'Simpan & Buat Kelas'}
              </ButtonPrimary>
            </div>
          </form>
        </Modal>
      </div>
    </ProfessionalShell>
  );
}
