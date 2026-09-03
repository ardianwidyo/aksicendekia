'use client';

import React, { useState } from 'react';
import {
  StudentShell,
  ProfessionalShell,
  Card,
  ProgressBar,
  AchievementBadge,
  Button,
  GhostButton,
  MascotSpeechBubble,
  LevelSelector,
  TextInput,
  PasswordInput,
  Select,
  Checkbox,
  RadioGroup,
  FormField,
  Modal,
  Toast,
  Alert,
  DataTable,
  Tabs,
  DropdownMenu,
  StatCard,
  ChartWrapper,
  FileDropzone,
  SkeletonState,
  EmptyState,
  ErrorState,
} from '@aksicendekia/ui';
import {
  Sparkles,
  Award,
  Layers,
  Palette,
  Type,
  Layout,
  CheckCircle2,
  FileText,
  Users,
  Settings,
  MoreVertical,
  Plus,
  RefreshCw,
  Monitor,
  Smartphone,
} from 'lucide-react';

export default function CatalogPage() {
  const [shellMode, setShellMode] = useState<'student' | 'professional'>('student');
  const [viewportWidth, setViewportWidth] = useState<'375px' | '1440px' | 'full'>('full');
  const [cState, setCState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [radioVal, setRadioVal] = useState('a');
  const [checkboxVal, setCheckboxVal] = useState(true);

  // M3 Color Tokens List (47 tokens)
  const colorTokens = [
    { name: 'primary', hex: '#0058be', bg: 'bg-primary', text: 'text-on-primary' },
    { name: 'on-primary', hex: '#ffffff', bg: 'bg-on-primary border', text: 'text-on-surface' },
    { name: 'primary-container', hex: '#2170e4', bg: 'bg-primary-container', text: 'text-on-primary-container' },
    { name: 'on-primary-container', hex: '#fefcff', bg: 'bg-on-primary-container border', text: 'text-on-surface' },
    { name: 'primary-fixed', hex: '#d8e2ff', bg: 'bg-primary-fixed', text: 'text-on-primary-fixed' },
    { name: 'on-primary-fixed', hex: '#001a42', bg: 'bg-on-primary-fixed', text: 'text-on-primary' },
    { name: 'secondary', hex: '#855300', bg: 'bg-secondary', text: 'text-on-secondary' },
    { name: 'secondary-container', hex: '#fea619', bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
    { name: 'secondary-fixed', hex: '#ffddb8', bg: 'bg-secondary-fixed', text: 'text-on-secondary-fixed' },
    { name: 'tertiary', hex: '#006947', bg: 'bg-tertiary', text: 'text-on-tertiary' },
    { name: 'tertiary-container', hex: '#00855b', bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
    { name: 'tertiary-fixed', hex: '#6ffbbe', bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-fixed' },
    { name: 'error', hex: '#ba1a1a', bg: 'bg-error', text: 'text-on-error' },
    { name: 'error-container', hex: '#ffdad6', bg: 'bg-error-container', text: 'text-on-error-container' },
    { name: 'surface', hex: '#f8f9ff', bg: 'bg-surface border', text: 'text-on-surface' },
    { name: 'surface-dim', hex: '#cbdbf5', bg: 'bg-surface-dim', text: 'text-on-surface' },
    { name: 'surface-container', hex: '#e5eeff', bg: 'bg-surface-container', text: 'text-on-surface' },
    { name: 'surface-container-high', hex: '#dce9ff', bg: 'bg-surface-container-high', text: 'text-on-surface' },
    { name: 'surface-variant', hex: '#d3e4fe', bg: 'bg-surface-variant', text: 'text-on-surface-variant' },
    { name: 'outline', hex: '#727785', bg: 'bg-outline', text: 'text-on-primary' },
    { name: 'outline-variant', hex: '#c2c6d6', bg: 'bg-outline-variant', text: 'text-on-surface' },
  ];

  const tableColumns = [
    { key: 'code', header: 'Kode Soal', sortable: true },
    { key: 'title', header: 'Judul Butir Soal', sortable: true },
    { key: 'subject', header: 'Mata Pelajaran' },
    { key: 'grade', header: 'Fase/Jenjang' },
    { key: 'status', header: 'Status Review', render: (row: any) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        row.status === 'Published' ? 'bg-tertiary-container/30 text-tertiary' : 'bg-secondary-container/30 text-secondary'
      }`}>
        {row.status}
      </span>
    )},
  ];

  // Feature 011 (T081): the Matematika SD catalog is grouped by kelas 1-6 — the
  // component showcase mirrors that grouping so the DataTable demo stays honest.
  const tableData = [
    { code: 'sd-mtk-k1-01', title: 'Puluhan dan Satuan sampai 20', subject: 'Matematika', grade: 'SD · Kelas 1', status: 'Review' },
    { code: 'sd-mtk-k2-04', title: 'Perkalian sebagai Penjumlahan Berulang', subject: 'Matematika', grade: 'SD · Kelas 2', status: 'Review' },
    { code: 'sd-matematika-01', title: 'Nilai Tempat sampai Ratusan', subject: 'Matematika', grade: 'SD · Kelas 3', status: 'Review' },
    { code: 'sd-mtk-k4-04', title: 'Pecahan sebagai Bagian dari Keseluruhan', subject: 'Matematika', grade: 'SD · Kelas 4', status: 'Review' },
    { code: 'sd-mtk-k5-03', title: 'Membandingkan Pecahan dan Menyederhanakan', subject: 'Matematika', grade: 'SD · Kelas 5', status: 'Review' },
    { code: 'sd-mtk-k6-02', title: 'Bilangan Bulat Positif dan Negatif', subject: 'Matematika', grade: 'SD · Kelas 6', status: 'Review' },
  ];

  const catalogContent = (
    <div className="space-y-xl pb-xl">
      {/* Header Controls */}
      <section className="bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant shadow-sm space-y-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div>
            <span className="inline-flex items-center gap-xs px-sm py-0.5 rounded-full bg-primary-container/20 text-primary font-body text-xs font-bold mb-xs">
              <Layers className="w-3.5 h-3.5" />
              Sistem Desain Kanon v1.0.0
            </span>
            <h1 className="font-heading text-headline-lg font-bold text-on-surface">
              Katalog Komponen UI AksiCendekia
            </h1>
            <p className="font-body text-body-md text-on-surface-variant mt-xs">
              Verifikasi token visual, 3 kelompok komponen, 3 state universal, dan override tipografi profesional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-sm">
            {/* Shell Mode Toggle */}
            <div className="flex items-center p-1 bg-surface-container-low rounded-xl border border-outline-variant">
              <button
                onClick={() => setShellMode('student')}
                className={`px-md py-1.5 rounded-lg font-body text-label-md font-semibold transition-all ${
                  shellMode === 'student'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Shell Siswa
              </button>
              <button
                onClick={() => setShellMode('professional')}
                className={`px-md py-1.5 rounded-lg font-body text-label-md font-semibold transition-all ${
                  shellMode === 'professional'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Shell Profesional (Inter)
              </button>
            </div>

            {/* Viewport Width Controls */}
            <div className="flex items-center p-1 bg-surface-container-low rounded-xl border border-outline-variant">
              <button
                onClick={() => setViewportWidth('375px')}
                title="Pratinjau Layar Seluler 375px"
                className={`p-1.5 rounded-lg font-body text-xs font-semibold flex items-center gap-xs ${
                  viewportWidth === '375px' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>375px</span>
              </button>
              <button
                onClick={() => setViewportWidth('1440px')}
                title="Pratinjau Layar Komputer 1440px"
                className={`p-1.5 rounded-lg font-body text-xs font-semibold flex items-center gap-xs ${
                  viewportWidth === '1440px' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>1440px</span>
              </button>
              <button
                onClick={() => setViewportWidth('full')}
                title="Lebar Penuh"
                className={`p-1.5 rounded-lg font-body text-xs font-semibold ${
                  viewportWidth === 'full' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                Penuh
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Design Tokens Section */}
      <section className="space-y-md">
        <div className="flex items-center gap-xs border-b border-outline-variant pb-xs">
          <Palette className="w-6 h-6 text-primary" />
          <h2 className="font-heading text-title-md font-bold text-on-surface">
            1. Paket Design Tokens (47 Material Design 3 Palette & Tipografi)
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-sm">
          {colorTokens.map((token) => (
            <div key={token.name} className="p-sm rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm space-y-xs">
              <div className={`w-full h-12 rounded-lg ${token.bg} flex items-center justify-center font-mono text-xs ${token.text}`}>
                {token.hex}
              </div>
              <div className="font-body text-xs font-semibold text-on-surface truncate">
                {token.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Group A: Gamification Components */}
      <section className="space-y-md">
        <div className="flex items-center gap-xs border-b border-outline-variant pb-xs">
          <Sparkles className="w-6 h-6 text-secondary" />
          <h2 className="font-heading text-title-md font-bold text-on-surface">
            2. Kelompok A: Komponen Bermain & Gamifikasi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Interactive Card */}
          <Card variant="surface" padding="md" interactive className="space-y-sm">
            <h3 className="font-heading text-title-sm font-bold text-on-surface">
              Interactive Card (Taktil 3D)
            </h3>
            <p className="font-body text-body-md text-on-surface-variant">
              Kartu belajar interaktif dengan bayangan taktil dan sudut membulat 16px (`rounded-xl`).
            </p>
            <Button variant="primary" size="sm">Uji Klik Card</Button>
          </Card>

          {/* Level Selector */}
          <div className="space-y-xs">
            <h3 className="font-heading text-label-lg font-bold text-on-surface">
              Level Selector (TK, SD, SMP, SMA)
            </h3>
            <LevelSelector variant="grid" />
          </div>

          {/* Mascot Speech Bubble */}
          <div className="space-y-xs md:col-span-2">
            <h3 className="font-heading text-label-lg font-bold text-on-surface">
              Mascot Speech Bubble
            </h3>
            <MascotSpeechBubble
              speakerName="Aksi - Maskot Cendekia"
              message="Hebat sekali! Kamu berhasil menguasai materi penjumlahan hari ini. Yuk, lanjut ke level berikutnya!"
            />
          </div>

          {/* Progress Bar & Achievement Badges */}
          <div className="space-y-sm p-md rounded-xl border border-outline-variant bg-surface-container-lowest">
            <h3 className="font-heading text-label-lg font-bold text-on-surface">
              Progress Bar (Pill Gradient Primary → Success)
            </h3>
            <ProgressBar value={75} showLabel size="lg" />
          </div>

          <div className="space-y-sm p-md rounded-xl border border-outline-variant bg-surface-container-lowest">
            <h3 className="font-heading text-label-lg font-bold text-on-surface">
              Achievement Badges (Secondary Gold Border)
            </h3>
            <div className="flex items-center gap-md">
              <AchievementBadge title="Bintang Misi" level="gold" unlocked />
              <AchievementBadge title="Pakar Logika" level="gold" unlocked={false} />
            </div>
          </div>

          {/* Button Variants */}
          <div className="space-y-sm p-md rounded-xl border border-outline-variant bg-surface-container-lowest md:col-span-2">
            <h3 className="font-heading text-label-lg font-bold text-on-surface mb-xs">
              Button Primary (Bottom Border 4px Taktil) vs Ghost Button
            </h3>
            <div className="flex flex-wrap items-center gap-md">
              <Button variant="primary" size="md">
                Primary Button (Tekan Me)
              </Button>
              <GhostButton onClick={() => alert('Ghost Button clicked')}>
                Ghost Button
              </GhostButton>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Group B: Form Primitives & Feedback */}
      <section className="space-y-md">
        <div className="flex items-center gap-xs border-b border-outline-variant pb-xs">
          <Type className="w-6 h-6 text-tertiary" />
          <h2 className="font-heading text-title-md font-bold text-on-surface">
            3. Kelompok B: Primitif Form & Umpan Balik
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md p-lg rounded-xl border border-outline-variant bg-surface-container-lowest">
          <FormField label="Nama Lengkap Siswa" required helperText="Masukkan nama sesuai dokumen sekolah.">
            <TextInput placeholder="Contoh: Andi Pratama" />
          </FormField>

          <FormField label="Kata Sandi Akun" required>
            <PasswordInput placeholder="Masukkan kata sandi aman" />
          </FormField>

          <FormField label="Pilih Kelas / Rombel" error="Kelas wajib dipilih.">
            <Select
              error
              options={[
                { value: '', label: '-- Pilih Kelas --' },
                { value: '1a', label: 'Kelas 1 - SD Cendekia A' },
                { value: '7b', label: 'Kelas 7 - SMP Cendekia B' },
              ]}
            />
          </FormField>

          <div className="space-y-sm">
            <label className="block font-heading text-label-md font-semibold text-on-surface">
              Pilihan Pendaftaran (Radio Group & Checkbox)
            </label>
            <RadioGroup
              name="reg-role"
              selectedValue={radioVal}
              onChange={setRadioVal}
              options={[
                { value: 'a', label: 'Siswa Sekolah (Reguler)', description: 'Akses kuis harian & materi' },
                { value: 'b', label: 'Siswa Mandiri (Pro)', description: 'Buka seluruh fitur tanpa batas' },
              ]}
            />
            <Checkbox
              label="Saya menyetujui Syarat & Ketentuan serta Persetujuan Orang Tua"
              checked={checkboxVal}
              onChange={(e) => setCheckboxVal(e.target.checked)}
            />
          </div>

          {/* Dialog & Toast Triggers */}
          <div className="md:col-span-2 pt-md border-t border-outline-variant flex flex-wrap items-center gap-md">
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              Buka Modal / Dialog
            </Button>
            <GhostButton onClick={() => setIsToastOpen(true)}>
              Pemicu Toast Notification
            </GhostButton>
          </div>
        </div>

        {/* Inline Alerts */}
        <div className="space-y-sm">
          <Alert variant="info" title="Informasi Sistem">
            Pembaruan Kurikulum Merdeka Fase D telah diterapkan secara otomatis.
          </Alert>
          <Alert variant="warning" title="Peringatan Ujian">
            Sesi kuis akan berakhir dalam 5 menit. Simpan jawaban Anda.
          </Alert>
        </div>
      </section>

      {/* 4. Group C: Data Components & 3 Universal States */}
      <section className="space-y-md">
        <div className="flex items-center justify-between border-b border-outline-variant pb-xs flex-wrap gap-sm">
          <div className="flex items-center gap-xs">
            <Layout className="w-6 h-6 text-primary" />
            <h2 className="font-heading text-title-md font-bold text-on-surface">
              4. Kelompok C & Tiga State Universal (Skeleton, Empty, Error)
            </h2>
          </div>

          {/* State Switcher for Controls */}
          <div className="flex items-center gap-xs bg-surface-container-low p-1 rounded-xl border border-outline-variant">
            <span className="font-body text-xs font-bold text-on-surface-variant px-sm">Switch State:</span>
            {(['normal', 'loading', 'empty', 'error'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setCState(st)}
                className={`px-sm py-1 rounded-lg font-body text-xs font-semibold capitalize transition-all ${
                  cState === st ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="space-y-xs">
          <h3 className="font-heading text-label-lg font-bold text-on-surface">
            Data Table (Sort, Pagination, Native 3-State Support)
          </h3>
          <DataTable
            columns={tableColumns}
            data={tableData}
            state={cState}
            onRetry={() => setCState('normal')}
          />
        </div>

        {/* Stat Cards */}
        <div className="space-y-xs">
          <h3 className="font-heading text-label-lg font-bold text-on-surface">
            Stat Cards (Summary Indicators)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            <StatCard
              title="Total Butir Soal"
              value="1,240"
              change="+12% bulan ini"
              trend="up"
              icon={<FileText className="w-5 h-5" />}
              state={cState}
              onRetry={() => setCState('normal')}
            />
            <StatCard
              title="Siswa Aktif"
              value="8,520"
              change="+5% minggu ini"
              trend="up"
              icon={<Users className="w-5 h-5" />}
              state={cState}
              onRetry={() => setCState('normal')}
            />
            <StatCard
              title="Rata-rata Skor Kuis"
              value="84.5"
              change="-2% minggu ini"
              trend="down"
              icon={<Award className="w-5 h-5" />}
              state={cState}
              onRetry={() => setCState('normal')}
            />
          </div>
        </div>

        {/* Tabs & Chart Wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <h3 className="font-heading text-label-lg font-bold text-on-surface">
              Tabs (Bilah Tab Interaktif)
            </h3>
            <div className="p-md rounded-xl border border-outline-variant bg-surface-container-lowest">
              <Tabs
                state={cState}
                onRetry={() => setCState('normal')}
                tabs={[
                  { id: 'tab1', label: 'Ringkasan', content: <p>Isi konten ringkasan performa siswa.</p> },
                  { id: 'tab2', label: 'Riwayat Kuis', content: <p>Daftar riwayat sesi kuis yang telah diselesaikan.</p> },
                ]}
              />
            </div>
          </div>

          <div className="space-y-xs">
            <h3 className="font-heading text-label-lg font-bold text-on-surface">
              Chart Wrapper & Dropdown Menu
            </h3>
            <ChartWrapper
              title="Statistik Belajar Mingguan"
              subtitle="Perbandingan durasi kuis per hari"
              state={cState}
              onRetry={() => setCState('normal')}
            />
          </div>
        </div>

        {/* File Dropzone & Dropdown Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <h3 className="font-heading text-label-lg font-bold text-on-surface">
              File Dropzone (Drag & Drop Upload)
            </h3>
            <FileDropzone state={cState} onRetry={() => setCState('normal')} />
          </div>

          <div className="space-y-xs">
            <h3 className="font-heading text-label-lg font-bold text-on-surface">
              Dropdown Menu Action Control
            </h3>
            <div className="p-md rounded-xl border border-outline-variant bg-surface-container-lowest flex items-center justify-between">
              <span className="font-body text-body-md font-medium text-on-surface">
                Opsi Aksi Item Soal #102:
              </span>
              <DropdownMenu
                triggerLabel="Pilih Aksi"
                triggerIcon={<MoreVertical className="w-4 h-4" />}
                state={cState}
                onRetry={() => setCState('normal')}
                items={[
                  { id: 'edit', label: 'Ubah Butir Soal', onClick: () => alert('Ubah') },
                  { id: 'preview', label: 'Pratinjau Kuis', onClick: () => alert('Pratinjau') },
                  { id: 'delete', label: 'Hapus Soal', danger: true, divider: true, onClick: () => alert('Hapus') },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Modal Dialog Instance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jendela Modal Konfirmasi"
        footer={
          <>
            <GhostButton onClick={() => setIsModalOpen(false)}>Batal</GhostButton>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Simpan Perubahan
            </Button>
          </>
        }
      >
        <p className="font-body text-body-md">
          Ini adalah komponen Modal / Dialog yang memenuhi WCAG 2.1 AA dengan penutup ESC, backdrop click handler, dan focus trap.
        </p>
      </Modal>

      {/* Toast Notification Instance */}
      <Toast
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
        variant="success"
        message="Berhasil memperbarui data komponen UI!"
      />
    </div>
  );

  const containerWidthClass =
    viewportWidth === '375px'
      ? 'max-w-[375px] mx-auto border-x border-outline-variant shadow-2xl overflow-x-hidden'
      : viewportWidth === '1440px'
      ? 'max-w-[1440px] mx-auto border-x border-outline-variant shadow-2xl'
      : 'w-full';

  if (shellMode === 'professional') {
    return (
      <div className={containerWidthClass}>
        <ProfessionalShell userRole="admin" activeNavId="curriculum">
          {catalogContent}
        </ProfessionalShell>
      </div>
    );
  }

  return (
    <div className={containerWidthClass}>
      <StudentShell activeNavId="catalog">
        {catalogContent}
      </StudentShell>
    </div>
  );
}
