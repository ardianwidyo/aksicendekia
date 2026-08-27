'use client';

import React, { useState } from 'react';
import {
  ProfessionalShell,
  DataTable,
  ButtonPrimary,
  ButtonSecondary,
  Modal,
  TextInput,
  Select,
  FormField,
  Alert,
  StatCard,
  Badge,
} from '@aksicendekia/ui';
import { apiFetch } from '../../../lib/api-fetch';

interface StudentProgress {
  studentId: string;
  displayName: string;
  avatarId: string;
  totalLearningMinutes: number;
  lessonsCompleted: number;
  averageAccuracy: number;
  riskStatus: 'ON_TRACK' | 'BEHIND';
  riskReasons: string[];
  lastActiveAt: string | null;
}

interface ItemAnalysis {
  questionId: string;
  questionTextSnippet: string;
  lessonTitle: string;
  subjectName: string;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  accuracyRate: number;
}

export default function TeacherDashboardPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>('class-1');
  const [activeTab, setActiveTab] = useState<'students' | 'item-analysis' | 'assignments'>('students');

  // Sample Class Student Data
  const [students, setStudents] = useState<StudentProgress[]>([
    {
      studentId: 'stud-1',
      displayName: 'Budi Cendekia',
      avatarId: 'avatar-1',
      totalLearningMinutes: 120,
      lessonsCompleted: 8,
      averageAccuracy: 88.0,
      riskStatus: 'ON_TRACK',
      riskReasons: [],
      lastActiveAt: '2026-08-27 10:30',
    },
    {
      studentId: 'stud-2',
      displayName: 'Siti Rahma',
      avatarId: 'avatar-2',
      totalLearningMinutes: 15,
      lessonsCompleted: 2,
      averageAccuracy: 52.0,
      riskStatus: 'BEHIND',
      riskReasons: ['LOW_ACCURACY', 'LOW_ACTIVITY'],
      lastActiveAt: '2026-08-20 14:00',
    },
  ]);

  // Sample Item Accuracy Data
  const [itemAnalysis, setItemAnalysis] = useState<ItemAnalysis[]>([
    {
      questionId: 'q-101',
      questionTextSnippet: 'Siti memiliki 3/4 kg gula, digunakan 1/2 kg untuk kue. Berapa sisa gula Siti?',
      lessonTitle: 'Pecahan Senilai',
      subjectName: 'Matematika SD',
      totalAttempts: 25,
      correctAttempts: 10,
      wrongAttempts: 15,
      accuracyRate: 40.0,
    },
    {
      questionId: 'q-102',
      questionTextSnippet: 'Ubahlah 0.75 menjadi bentuk pecahan biasa paling sederhana.',
      lessonTitle: 'Desimal & Pecahan',
      subjectName: 'Matematika SD',
      totalAttempts: 24,
      correctAttempts: 20,
      wrongAttempts: 4,
      accuracyRate: 83.3,
    },
  ]);

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [lessonId, setLessonId] = useState('les-1');
  const [dueDate, setDueDate] = useState('2026-08-30T23:59');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await apiFetch('/api/v1/teacher/assignments', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClassId,
          lessonId,
          title: assignmentTitle,
          dueDate: new Date(dueDate).toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal membuat penugasan');
      }

      setMessage('Penugasan pelajaran berhasil dibuat dan dikirim ke kelas!');
      setIsAssignmentModalOpen(false);
      setAssignmentTitle('');
    } catch (err: any) {
      setMessage(err.message || 'Terjadi kesalahan saat membuat penugasan');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    window.open(`/api/v1/teacher/classes/${selectedClassId}/export-csv`, '_blank');
  };

  const studentColumns = [
    { key: 'displayName', header: 'Nama Tampilan Siswa' },
    { key: 'totalLearningMinutes', header: 'Waktu Belajar (Menit)' },
    { key: 'lessonsCompleted', header: 'Pelajaran Selesai' },
    { key: 'averageAccuracy', header: 'Akurasi Rata-rata (%)' },
    {
      key: 'riskStatus',
      header: 'Status Performa',
      render: (row: StudentProgress) =>
        row.riskStatus === 'BEHIND' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            ⚠️ Perlu Pendampingan
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✅ Lancar
          </span>
        ),
    },
    { key: 'lastActiveAt', header: 'Aktivitas Terakhir' },
  ];

  const itemColumns = [
    { key: 'questionTextSnippet', header: 'Cuplikan Soal' },
    { key: 'lessonTitle', header: 'Pelajaran' },
    { key: 'totalAttempts', header: 'Total Percobaan' },
    { key: 'wrongAttempts', header: 'Salah (Kali)' },
    {
      key: 'accuracyRate',
      header: 'Tingkat Akurasi Soal (%)',
      render: (row: ItemAnalysis) => (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                row.accuracyRate < 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${row.accuracyRate}%` }}
            />
          </div>
          <span className="text-xs font-bold">{row.accuracyRate}%</span>
        </div>
      ),
    },
  ];

  return (
    <ProfessionalShell userRole="teacher" userName="Guru Pengajar">
      <div className="max-w-6xl mx-auto space-y-6 py-6 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              Dasbor Manajemen Pembelajaran Guru
            </h1>
            <p className="text-xs text-surface-variant">
              Pantau progres kelas, deteksi siswa yang tertinggal, analisis butir soal, dan buat penugasan
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ButtonSecondary onClick={handleExportCsv}>📥 Ekspor CSV Kelas</ButtonSecondary>
            <ButtonPrimary onClick={() => setIsAssignmentModalOpen(true)}>
              ➕ Buat Penugasan Kelas
            </ButtonPrimary>
          </div>
        </div>

        {message && <Alert variant="success">{message}</Alert>}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Siswa Kelas" value={`${students.length} Siswa`} change="Kelas 4-A" />
          <StatCard
            title="Siswa Perlu Pendampingan"
            value={`${students.filter((s) => s.riskStatus === 'BEHIND').length} Siswa ⚠️`}
            change="Perlu Bantuan"
          />
          <StatCard title="Rata-rata Akurasi Kelas" value="70.0%" change="Evaluasi Soal" />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-surface-variant gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 transition-all ${
              activeTab === 'students'
                ? 'border-b-2 border-primary text-primary'
                : 'text-surface-variant hover:text-primary'
            }`}
          >
            📋 Daftar Siswa & Status Risiko ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('item-analysis')}
            className={`pb-3 transition-all ${
              activeTab === 'item-analysis'
                ? 'border-b-2 border-primary text-primary'
                : 'text-surface-variant hover:text-primary'
            }`}
          >
            📊 Analisis Butir Soal (Paling Sering Salah)
          </button>
        </div>

        {/* Tab 1: Student List */}
        {activeTab === 'students' && (
          <div className="bg-surface p-5 rounded-xl border border-surface-variant space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-primary">Rekapitulasi Progres & Status Risiko Siswa</h3>
              <span className="text-xs text-slate-500">
                Deteksi otomatis berdasarkan akurasi &lt;60% atau keaktifan &lt;30% rerata kelas
              </span>
            </div>
            <DataTable columns={studentColumns} data={students} />
          </div>
        )}

        {/* Tab 2: Item Analysis */}
        {activeTab === 'item-analysis' && (
          <div className="bg-surface p-5 rounded-xl border border-surface-variant space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-primary">Analisis Butir Soal (Urut dari Akurasi Terendah)</h3>
              <span className="text-xs text-slate-500">
                Menampilkan soal yang paling sering salah untuk keperluan remediasi
              </span>
            </div>
            <DataTable columns={itemColumns} data={itemAnalysis} />
          </div>
        )}

        {/* Modal Buat Penugasan */}
        <Modal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          title="📝 Buat Penugasan Pelajaran ke Kelas"
        >
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <FormField label="Judul Penugasan">
              <TextInput
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                placeholder="Contoh: Tugas Minggu 4 - Pecahan Senilai"
                required
              />
            </FormField>

            <FormField label="Pelajaran yang Ditugaskan">
              <Select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                options={[
                  { value: 'les-1', label: 'Pecahan Senilai (Matematika SD)' },
                  { value: 'les-2', label: 'Desimal & Pecahan (Matematika SD)' },
                ]}
              />
            </FormField>

            <FormField label="Tenggat Waktu Penyelesaian (Due Date)">
              <TextInput
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <ButtonSecondary type="button" onClick={() => setIsAssignmentModalOpen(false)}>
                Batal
              </ButtonSecondary>
              <ButtonPrimary type="submit" disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim Penugasan'}
              </ButtonPrimary>
            </div>
          </form>
        </Modal>
      </div>
    </ProfessionalShell>
  );
}
