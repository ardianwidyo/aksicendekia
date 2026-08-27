"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function UpgradePage() {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("QRIS");
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  const plans = [
    {
      code: "FREE",
      name: "Gratis",
      priceMonthly: "Rp 0",
      priceAnnual: "Rp 0",
      periodLabel: "Selamanya Gratis",
      description: "Untuk siswa yang ingin mencoba pengalaman belajar bergamifikasi",
      features: [
        { title: "Batas Sesi Belajar", val: "3 Sesi / Hari" },
        { title: "Mata Pelajaran", val: "Mapel Utama (Matematika & Bahasa)" },
        { title: "Saldo Power-up Harian", val: "1 Free Power-up / Hari" },
        { title: "Kedalaman Laporan Orang Tua", val: "Ringkasan Singkat" },
        { title: "Kapasitas Anggota Keluarga", val: "Tidak Termasuk" },
      ],
      isPopular: false,
      ctaText: "Paket Saat Ini",
      disabled: true,
    },
    {
      code: "PRO_PERSONAL",
      name: "Pro Personal",
      priceMonthly: "Rp 49.000",
      priceAnnual: "Rp 490.000",
      annualDiscount: "Hemat Rp 98.000 / thn",
      periodLabel: billingCycle === "ANNUAL" ? "/ tahun (setara Rp 40.833/bln)" : "/ bulan",
      description: "Akses tanpa batas untuk 1 siswa dengan analisis performa mendalam",
      features: [
        { title: "Batas Sesi Belajar", val: "Tanpa Batas (Unlimited)" },
        { title: "Mata Pelajaran", val: "Seluruh Kurikulum Merdeka" },
        { title: "Saldo Power-up Harian", val: "5 Power-up / Hari" },
        { title: "Kedalaman Laporan Orang Tua", val: "Analisis Akurasi & Rekomendasi AI" },
        { title: "Kapasitas Anggota Keluarga", val: "1 Akun Siswa" },
      ],
      isPopular: true,
      ctaText: "Pilih Pro Personal",
      disabled: false,
    },
    {
      code: "PRO_FAMILY",
      name: "Pro Keluarga",
      priceMonthly: "Rp 99.000",
      priceAnnual: "Rp 990.000",
      annualDiscount: "Hemat Rp 198.000 / thn",
      periodLabel: billingCycle === "ANNUAL" ? "/ tahun (setara Rp 82.500/bln)" : "/ bulan",
      description: "Satu langganan orang tua untuk hingga 5 akun anak sekaligus",
      features: [
        { title: "Batas Sesi Belajar", val: "Tanpa Batas (Semua Anak)" },
        { title: "Mata Pelajaran", val: "Seluruh Kurikulum Merdeka" },
        { title: "Saldo Power-up Harian", val: "5 Power-up / Hari per Anak" },
        { title: "Kedalaman Laporan Orang Tua", val: "Dasbor Multi-Anak & Rekap Mingguan" },
        { title: "Kapasitas Anggota Keluarga", val: "Hingga 5 Akun Anak" },
      ],
      isPopular: false,
      ctaText: "Pilih Pro Keluarga",
      disabled: false,
    },
  ];

  const handleCheckout = async (planCode: string) => {
    setIsProcessing(true);
    setCheckoutResult(null);

    try {
      const res = await fetch("/api/v1/subscriptions/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          planCode,
          billingCycle,
          paymentMethod: selectedPaymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Gagal membuat transaksi checkout");
        setIsProcessing(false);
        return;
      }

      setCheckoutResult(data);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Radial Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-600/20 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Beranda
          </Link>
          <Link
            href="/settings/billing"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
          >
            Riwayat Transaksi & Invoice
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>✨ Tingkatkan Pengalaman Belajar</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Pilih Paket Langganan AksiCendekia Pro
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Dapatkan akses penuh tanpa batas ke seluruh mata pelajaran Kurikulum Merdeka, analisis performa presisi, dan laporan lengkap orang tua.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                billingCycle === "MONTHLY"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Bayar Bulanan
            </button>
            <button
              onClick={() => setBillingCycle("ANNUAL")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                billingCycle === "ANNUAL"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Bayar Tahunan</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] uppercase">
                Hemat 17%
              </span>
            </button>
          </div>
        </div>

        {/* Payment Method Selector Bar */}
        <div className="max-w-md mx-auto mb-10 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-center">
          <label className="block text-xs font-semibold text-slate-400 mb-2">Pilih Metode Pembayaran Utama</label>
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-xl border border-slate-700 p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="QRIS">QRIS (Gopay, OVO, ShopeePay, Dana)</option>
            <option value="VIRTUAL_ACCOUNT">Virtual Account (BCA, Mandiri, BRI, BNI)</option>
            <option value="CREDIT_CARD">Kartu Kredit / Debit Online</option>
            <option value="EWALLET">E-Wallet Direct</option>
          </select>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.isPopular
                  ? "bg-slate-900/90 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-20"
                  : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                  Paling Populer
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">{plan.description}</p>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {billingCycle === "ANNUAL" ? plan.priceAnnual : plan.priceMonthly}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{plan.periodLabel}</span>
                  </div>
                  {billingCycle === "ANNUAL" && plan.annualDiscount && (
                    <div className="mt-2 text-xs font-semibold text-amber-400">
                      {plan.annualDiscount}
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-400">{f.title}</span>
                        <span className="text-sm font-semibold text-slate-200">{f.val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action CTA Button */}
              <button
                onClick={() => !plan.disabled && handleCheckout(plan.code)}
                disabled={plan.disabled || isProcessing}
                className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all duration-200 shadow-lg ${
                  plan.disabled
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : plan.isPopular
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}
              >
                {isProcessing ? "Memproses..." : plan.ctaText}
              </button>
            </div>
          ))}
        </div>

        {/* Modal Checkout Simulation Result */}
        {checkoutResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 text-white">
              <h3 className="text-xl font-bold text-center mb-4">Transaksi Checkout Berhasil Dibuat!</h3>
              <div className="bg-slate-800/80 rounded-2xl p-4 space-y-2 text-xs font-mono text-slate-300 mb-6">
                <div>Order ID: {checkoutResult.orderId}</div>
                <div>Total Pembayaran: Rp {checkoutResult.grossAmountIdr.toLocaleString()}</div>
                <div>Termasuk PPN 11%: Rp {checkoutResult.taxAmountIdr.toLocaleString()}</div>
                {checkoutResult.proratedCreditIdr > 0 && (
                  <div className="text-amber-400">Kredit Prorata Paket Lama: -Rp {checkoutResult.proratedCreditIdr.toLocaleString()}</div>
                )}
                <div>Snap Token: {checkoutResult.snapToken}</div>
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href={checkoutResult.snapRedirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold text-center text-sm"
                >
                  Bayar Sekarang via Payment Gateway Snap
                </a>
                <button
                  onClick={() => setCheckoutResult(null)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm"
                >
                  Tutup Window Ini
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
