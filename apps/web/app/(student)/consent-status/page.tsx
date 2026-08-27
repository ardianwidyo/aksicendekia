'use client';

import React from 'react';
import Link from 'next/link';
import { MascotSpeechBubble, ButtonPrimary, Alert } from '@aksicendekia/ui';

export default function ConsentStatusPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg space-y-6 text-center">
        <MascotSpeechBubble message="Halo! Akun kamu sedang menunggu persetujuan dari orang tua/wali ya!" />

        <h1 className="text-3xl font-bold text-primary tracking-tight mt-4">
          Status Akun: Menunggu Persetujuan Wali
        </h1>

        <Alert
          variant="warning"
          title="Prinsip Perlindungan Data Anak (Prinsip VII Konstitusi)"
        >
          Sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, akun siswa di bawah 18 tahun memerlukan persetujuan resmi dari orang tua atau wali sebelum dapat mengakses seluruh fitur belajar AksiCendekia.
        </Alert>

        <div className="bg-surface-container border border-outline/20 p-6 rounded-2xl space-y-4 text-left shadow-sm">
          <h2 className="text-base font-semibold text-primary">Langkah Selanjutnya:</h2>
          <ul className="text-xs text-surface-variant space-y-2 list-disc list-inside">
            <li>Minta orang tua/wali memeriksa email masuk untuk tautan verifikasi persetujuan.</li>
            <li>Orang tua dapat menyetujui langsung via tautan email atau memasukkan kode OTP 6-digit pada dasbor orang tua.</li>
            <li>Setelah persetujuan terekam, status akunmu akan otomatis berubah menjadi aktif!</li>
          </ul>
        </div>

        <div className="pt-2">
          <Link href="/login">
            <ButtonPrimary type="button" className="px-6 py-2">
              Kembali ke Halaman Masuk
            </ButtonPrimary>
          </Link>
        </div>
      </div>
    </div>
  );
}
