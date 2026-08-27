"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface TransactionItem {
  id: string;
  orderId: string;
  planName: string;
  grossAmountIdr: number;
  taxAmountIdr: number;
  paymentMethod: string;
  status: "PENDING" | "SETTLED" | "FAILED" | "EXPIRED" | "REFUNDED";
  paidAt: string | null;
  createdAt: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
}

export default function BillingHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/payments/history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat transaksi", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoiceDetail = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/v1/payments/invoices/${invoiceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedInvoice(data);
      }
    } catch (err) {
      console.error("Gagal memuat rincian invoice", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SETTLED":
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">Lunas (Settled)</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">Menunggu Pembayaran</span>;
      case "FAILED":
      case "EXPIRED":
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">Batal / Kedaluwarsa</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/upgrade"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Halaman Upgrade
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Riwayat Pembayaran & Invoice Digital
          </h1>
          <p className="text-sm text-slate-400">
            Daftar seluruh transaksi pembayaran langganan Pro AksiCendekia beserta bukti faktur resmi.
          </p>
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Memuat riwayat transaksi...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Belum ada riwayat transaksi pembayaran.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 font-semibold">Order ID</th>
                    <th className="py-4 px-6 font-semibold">Paket</th>
                    <th className="py-4 px-6 font-semibold">Total Bayar</th>
                    <th className="py-4 px-6 font-semibold">Metode</th>
                    <th className="py-4 px-6 font-semibold">Status</th>
                    <th className="py-4 px-6 font-semibold text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-indigo-300">{tx.orderId}</td>
                      <td className="py-4 px-6 font-medium text-white">{tx.planName}</td>
                      <td className="py-4 px-6 font-semibold text-white">
                        Rp {tx.grossAmountIdr.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">{tx.paymentMethod}</td>
                      <td className="py-4 px-6">{getStatusBadge(tx.status)}</td>
                      <td className="py-4 px-6 text-right">
                        {tx.invoiceId ? (
                          <button
                            onClick={() => fetchInvoiceDetail(tx.invoiceId!)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                          >
                            Lihat Invoice
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Faktur Invoice Resmi</h3>
                  <p className="text-xs font-mono text-indigo-400 mt-1">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                  LUNAS
                </div>
              </div>

              {/* Invoice Customer & Payment Info */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="block text-slate-500 mb-1">Ditagihkan Kepada:</span>
                  <div className="font-semibold text-white">{selectedInvoice.billingName}</div>
                  <div className="text-slate-400">{selectedInvoice.billingEmail}</div>
                </div>
                <div>
                  <span className="block text-slate-500 mb-1">Rincian Pembayaran:</span>
                  <div className="text-slate-300">Order: {selectedInvoice.orderId}</div>
                  <div className="text-slate-300">Metode: {selectedInvoice.paymentMethod}</div>
                  <div className="text-slate-300">Tanggal: {new Date(selectedInvoice.issuedAt).toLocaleDateString("id-ID")}</div>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 mb-6 pb-6 border-b border-slate-800 text-sm">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-300">{selectedInvoice.planName} ({selectedInvoice.billingCycle})</span>
                  <span className="text-white">Rp {selectedInvoice.subtotalIdr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Pajak Pertambahan Nilai (PPN 11%)</span>
                  <span>Rp {selectedInvoice.taxIdr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-white pt-2 border-t border-slate-800/60">
                  <span>Total Bayar</span>
                  <span className="text-indigo-400">Rp {selectedInvoice.totalIdr.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors text-center"
                >
                  Cetak / Unduh PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
