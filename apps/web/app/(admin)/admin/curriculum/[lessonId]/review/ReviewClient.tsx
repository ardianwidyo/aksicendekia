'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@aksicendekia/ui';
import { apiFetch } from '@/lib/api-fetch';

interface RawBlock {
  id: string;
  blockType: string;
  payload: Record<string, unknown>;
  mediaAssetId: string | null;
  captionAssetId: string | null;
  fallbackAssetId: string | null;
}

interface WidgetCatalogEntry {
  id: string;
  displayName: string;
  supportStatus: 'SUPPORTED' | 'DEPRECATED' | 'REMOVED';
}

interface Violation {
  rule: string;
  blockId: string | null;
  blockType: string | null;
  field: string | null;
  message: string;
}

export default function ReviewClient() {
  const params = useParams();
  const lessonId = (params?.lessonId as string) || '';

  const [blocks, setBlocks] = useState<RawBlock[]>([]);
  const [widgets, setWidgets] = useState<WidgetCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [violations, setViolations] = useState<Violation[] | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [blocksRes, widgetsRes] = await Promise.all([
        apiFetch(`/api/v1/admin/lessons/${lessonId}/blocks`),
        apiFetch('/api/v1/admin/widget-catalog'),
      ]);
      if (!blocksRes.ok) throw new Error('Gagal memuat blok konten');
      const blocksData = await blocksRes.json();
      const widgetsData = widgetsRes.ok ? await widgetsRes.json() : { widgets: [] };
      setBlocks(blocksData.blocks ?? []);
      setWidgets(widgetsData.widgets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (lessonId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  async function runGateAction(path: 'submit-review' | 'publish') {
    setSubmitting(true);
    setViolations(null);
    setStatusMessage(null);
    try {
      const res = await apiFetch(`/api/v1/admin/lessons/${lessonId}/${path}`, {
        method: 'POST',
        body: path === 'publish' ? JSON.stringify({ reviewerNote: reviewerNote || undefined }) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422) {
        setViolations(data.violations ?? []);
        return;
      }
      if (!res.ok) {
        setStatusMessage(data.message || 'Aksi gagal');
        return;
      }
      setStatusMessage(`Berhasil — status kini: ${data.status}`);
    } finally {
      setSubmitting(false);
    }
  }

  const widgetById = new Map(widgets.map((w) => [w.id, w]));
  const widgetTypesUsed = Array.from(
    new Set(
      blocks
        .filter((b) => b.blockType === 'INTERACTIVE_WIDGET')
        .map((b) => String((b.payload as { widgetType?: string })?.widgetType ?? '')),
    ),
  );
  const mediaAssetIdsUsed = Array.from(
    new Set(blocks.flatMap((b) => [b.mediaAssetId, b.captionAssetId, b.fallbackAssetId]).filter((id): id is string => Boolean(id))),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Dasbor Review & Penerbitan</h1>
          <p className="text-sm text-slate-400 font-mono">Pelajaran: {lessonId}</p>
        </div>
        <Link href={`/admin/curriculum/${lessonId}`}>
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 text-xs">
            ← Kembali ke Editor
          </Button>
        </Link>
      </div>

      {loading && <p className="text-slate-400 text-sm">Memuat...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <>
          <Card className="bg-slate-900 border-slate-800 p-4 space-y-3">
            <h2 className="text-sm font-bold text-emerald-400">Tipe Widget yang Dipakai (FR-009)</h2>
            {widgetTypesUsed.length === 0 ? (
              <p className="text-xs text-slate-500">Tidak ada widget interaktif pada pelajaran ini.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {widgetTypesUsed.map((id) => {
                  const entry = widgetById.get(id);
                  const supported = entry?.supportStatus === 'SUPPORTED';
                  return (
                    <span
                      key={id}
                      className={`px-2 py-1 rounded text-[11px] font-mono border ${
                        supported
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {id} {entry ? `(${entry.supportStatus})` : '(tidak dikenal)'}
                    </span>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="bg-slate-900 border-slate-800 p-4 space-y-3">
            <h2 className="text-sm font-bold text-emerald-400">Aset Media yang Dipakai</h2>
            {mediaAssetIdsUsed.length === 0 ? (
              <p className="text-xs text-slate-500">Tidak ada aset media tertaut pada pelajaran ini.</p>
            ) : (
              <ul className="text-xs font-mono text-slate-300 space-y-1">
                {mediaAssetIdsUsed.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="bg-slate-900 border-slate-800 p-4 space-y-4">
            <h2 className="text-sm font-bold text-emerald-400">Gerbang Aksesibilitas & Kurikulum</h2>
            {statusMessage && <p className="text-xs text-emerald-300">{statusMessage}</p>}
            {violations && (
              <div className="space-y-2">
                {violations.length === 0 ? (
                  <p className="text-xs text-emerald-300">Tidak ada pelanggaran — lolos gerbang.</p>
                ) : (
                  <>
                    <p className="text-xs text-red-400 font-semibold">
                      {violations.length} pelanggaran ditemukan:
                    </p>
                    <ul className="space-y-1">
                      {violations.map((v, i) => (
                        <li key={i} className="text-[11px] font-mono bg-red-950/40 border border-red-900 rounded p-2 text-red-300">
                          [{v.rule}] {v.field ? `${v.field}: ` : ''}
                          {v.message}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-200 text-xs"
                disabled={submitting}
                onClick={() => runGateAction('submit-review')}
              >
                Ajukan ke Review
              </Button>
              <input
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Catatan reviewer (opsional)"
                className="bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white flex-1 min-w-[200px]"
              />
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                disabled={submitting}
                onClick={() => runGateAction('publish')}
              >
                Terbitkan (PUBLISHED)
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
