'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@aksicendekia/ui';
import { apiFetch } from '@/lib/api-fetch';

type BlockType = 'RICH_TEXT' | 'ILLUSTRATION' | 'ANIMATION' | 'VIDEO' | 'INTERACTIVE_WIDGET';

interface ContentBlock {
  id: string;
  lessonId: string;
  orderIndex: number;
  blockType: BlockType;
  payload: Record<string, unknown>;
  altText: string | null;
  transcriptText: string | null;
  mediaAssetId: string | null;
  captionAssetId: string | null;
  fallbackAssetId: string | null;
  narrationText: string | null;
  narrationAssetId: string | null;
  status: string;
}

interface WidgetCatalogEntry {
  id: string;
  displayName: string;
  description: string;
  supportStatus: 'SUPPORTED' | 'DEPRECATED' | 'REMOVED';
  a11yNotes: string;
}

interface MediaAsset {
  id: string;
  kind: string;
  storageKey: string;
  altText: string | null;
}

interface CurriculumAchievement {
  id: string;
  educationStage: string;
  phase: string;
  subjectCode: string;
  element: string;
  achievementText: string;
}

const BLOCK_TYPES: BlockType[] = ['RICH_TEXT', 'ILLUSTRATION', 'ANIMATION', 'VIDEO', 'INTERACTIVE_WIDGET'];

const DEFAULT_PAYLOAD_BY_TYPE: Record<BlockType, string> = {
  RICH_TEXT: '{\n  "markdown": "Tulis teks di sini..."\n}',
  ILLUSTRATION: '{\n  "caption": ""\n}',
  ANIMATION: '{\n  "animationId": "count-objects",\n  "steps": [{ "atMs": 0, "caption": "...", "frame": "frame-1" }],\n  "loop": false\n}',
  VIDEO: '{\n  "title": "Judul video"\n}',
  INTERACTIVE_WIDGET: '{\n  "widgetType": "NUMBER_LINE_EXPLORER",\n  "params": { "min": 0, "max": 10, "step": 1, "initial": 0 }\n}',
};

export default function BlockEditorClient() {
  const params = useParams();
  const lessonId = (params?.lessonId as string) || '';

  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [widgets, setWidgets] = useState<WidgetCatalogEntry[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [achievements, setAchievements] = useState<CurriculumAchievement[]>([]);
  const [lessonAchievementId, setLessonAchievementId] = useState<string>('');
  const [savingAchievement, setSavingAchievement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newBlockType, setNewBlockType] = useState<BlockType>('RICH_TEXT');
  const [newPayloadJson, setNewPayloadJson] = useState(DEFAULT_PAYLOAD_BY_TYPE.RICH_TEXT);
  const [newAltText, setNewAltText] = useState('');
  const [newTranscriptText, setNewTranscriptText] = useState('');
  const [newMediaAssetId, setNewMediaAssetId] = useState('');
  const [newCaptionAssetId, setNewCaptionAssetId] = useState('');
  const [newFallbackAssetId, setNewFallbackAssetId] = useState('');
  const [newNarrationText, setNewNarrationText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [blocksRes, widgetsRes, assetsRes, achievementsRes, lessonRes] = await Promise.all([
        apiFetch(`/api/v1/admin/lessons/${lessonId}/blocks`),
        apiFetch('/api/v1/admin/widget-catalog'),
        apiFetch('/api/v1/admin/media-assets'),
        apiFetch('/api/v1/admin/curriculum-achievements'),
        apiFetch(`/api/v1/admin/curriculum/lessons/${lessonId}`),
      ]);
      if (!blocksRes.ok) throw new Error('Gagal memuat blok konten');
      const blocksData = await blocksRes.json();
      const widgetsData = widgetsRes.ok ? await widgetsRes.json() : { widgets: [] };
      const assetsData = assetsRes.ok ? await assetsRes.json() : { assets: [] };
      const achievementsData = achievementsRes.ok ? await achievementsRes.json() : { achievements: [] };
      const lessonData = lessonRes.ok ? await lessonRes.json() : null;
      setBlocks(blocksData.blocks ?? []);
      setWidgets(widgetsData.widgets ?? []);
      setMediaAssets(assetsData.assets ?? []);
      setAchievements(achievementsData.achievements ?? []);
      setLessonAchievementId(lessonData?.curriculumAchievementId ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (lessonId) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  async function handleAddBlock(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    let payload: unknown;
    try {
      payload = JSON.parse(newPayloadJson);
    } catch {
      setFormError('Payload bukan JSON yang valid');
      return;
    }

    const body = {
      orderIndex: blocks.length,
      blockType: newBlockType,
      payload,
      altText: newAltText || undefined,
      transcriptText: newTranscriptText || undefined,
      mediaAssetId: newMediaAssetId || undefined,
      captionAssetId: newCaptionAssetId || undefined,
      fallbackAssetId: newFallbackAssetId || undefined,
      narrationText: newNarrationText || undefined,
    };

    const res = await apiFetch(`/api/v1/admin/lessons/${lessonId}/blocks`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.message || 'Gagal menambah blok konten');
      return;
    }

    setShowAddForm(false);
    setNewAltText('');
    setNewTranscriptText('');
    setNewMediaAssetId('');
    setNewCaptionAssetId('');
    setNewFallbackAssetId('');
    setNewNarrationText('');
    await loadAll();
  }

  async function handleDeleteBlock(blockId: string) {
    if (!confirm('Hapus blok konten ini?')) return;
    const res = await apiFetch(`/api/v1/admin/blocks/${blockId}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) await loadAll();
  }

  async function handleMove(blockId: string, direction: -1 | 1) {
    const sorted = [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);
    const idx = sorted.findIndex((b) => b.id === blockId);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const orderedBlockIds = reordered.map((b) => b.id);

    const res = await apiFetch(`/api/v1/admin/lessons/${lessonId}/blocks/order`, {
      method: 'PUT',
      body: JSON.stringify({ orderedBlockIds }),
    });
    if (res.ok) await loadAll();
  }

  async function handleSaveAchievement() {
    setSavingAchievement(true);
    try {
      const res = await apiFetch(`/api/v1/admin/curriculum/lessons/${lessonId}`, {
        method: 'PATCH',
        body: JSON.stringify({ curriculumAchievementId: lessonAchievementId || undefined }),
      });
      if (res.ok) await loadAll();
    } finally {
      setSavingAchievement(false);
    }
  }

  const widgetById = new Map(widgets.map((w) => [w.id, w]));
  const sortedBlocks = [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Editor Blok Konten</h1>
          <p className="text-sm text-slate-400 font-mono">Pelajaran: {lessonId}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/curriculum/${lessonId}/preview`}>
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 text-xs">
              👁️ Pratinjau Siswa
            </Button>
          </Link>
          <Link href={`/admin/curriculum/${lessonId}/review`}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">
              Dasbor Review →
            </Button>
          </Link>
        </div>
      </div>

      {loading && <p className="text-slate-400 text-sm">Memuat blok konten...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <>
          <Card className="bg-slate-900 border-slate-800 p-4 space-y-2">
            <h2 className="text-sm font-bold text-emerald-400">Capaian Pembelajaran (FR-008a, gerbang C3)</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={lessonAchievementId}
                onChange={(e) => setLessonAchievementId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
              >
                <option value="">— Belum ditautkan —</option>
                {achievements.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.phase} · {a.subjectCode} · {a.element}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                disabled={savingAchievement}
                onClick={handleSaveAchievement}
              >
                Tautkan
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            {sortedBlocks.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                Belum ada blok konten. Tambahkan blok pertama di bawah.
              </div>
            ) : (
              sortedBlocks.map((block, idx) => (
                <Card key={block.id} className="bg-slate-900 border-slate-800 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
                        {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                        {block.blockType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        {block.status}
                      </span>
                      {block.blockType === 'INTERACTIVE_WIDGET' &&
                        (() => {
                          const widgetType = String((block.payload as { widgetType?: string })?.widgetType ?? '');
                          const entry = widgetById.get(widgetType);
                          if (entry && entry.supportStatus !== 'SUPPORTED') {
                            return (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                                {entry.supportStatus}
                              </span>
                            );
                          }
                          return null;
                        })()}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(block.id, -1)}
                        disabled={idx === 0}
                        className="text-xs text-slate-400 hover:text-white disabled:opacity-30 px-1"
                        aria-label="Pindah ke atas"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMove(block.id, 1)}
                        disabled={idx === sortedBlocks.length - 1}
                        className="text-xs text-slate-400 hover:text-white disabled:opacity-30 px-1"
                        aria-label="Pindah ke bawah"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="text-xs text-red-400 hover:underline ml-2"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <pre className="text-[11px] font-mono bg-slate-950 border border-slate-800 rounded p-2 overflow-x-auto text-slate-300">
                    {JSON.stringify(block.payload, null, 2)}
                  </pre>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4">
                    {block.altText && <span>altText: {block.altText}</span>}
                    {block.transcriptText && <span>transcriptText: ✓</span>}
                    {block.mediaAssetId && <span>mediaAssetId: {block.mediaAssetId}</span>}
                    {block.fallbackAssetId && <span>fallbackAssetId: {block.fallbackAssetId}</span>}
                    {block.narrationText && <span>narrationText: ✓</span>}
                  </div>
                </Card>
              ))
            )}
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-emerald-400">Tambah Blok Konten</h2>
              <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 text-xs" onClick={() => setShowAddForm((v) => !v)}>
                {showAddForm ? 'Tutup' : '+ Tambah Blok'}
              </Button>
            </div>
            {showAddForm && (
              <form onSubmit={handleAddBlock} className="p-4 space-y-3 text-xs">
                {formError && <p className="text-red-400">{formError}</p>}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tipe Blok</label>
                  <select
                    value={newBlockType}
                    onChange={(e) => {
                      const t = e.target.value as BlockType;
                      setNewBlockType(t);
                      setNewPayloadJson(DEFAULT_PAYLOAD_BY_TYPE[t]);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  >
                    {BLOCK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {newBlockType === 'INTERACTIVE_WIDGET' && widgets.length > 0 && (
                  <div className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded p-2">
                    Widget tersedia: {widgets.map((w) => `${w.id} (${w.supportStatus})`).join(', ')}
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Payload (JSON)</label>
                  <textarea
                    value={newPayloadJson}
                    onChange={(e) => setNewPayloadJson(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">altText</label>
                    <input value={newAltText} onChange={(e) => setNewAltText(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">transcriptText</label>
                    <input value={newTranscriptText} onChange={(e) => setNewTranscriptText(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">mediaAssetId</label>
                    <select value={newMediaAssetId} onChange={(e) => setNewMediaAssetId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white">
                      <option value="">—</option>
                      {mediaAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.storageKey}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">captionAssetId</label>
                    <select value={newCaptionAssetId} onChange={(e) => setNewCaptionAssetId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white">
                      <option value="">—</option>
                      {mediaAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.storageKey}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">fallbackAssetId</label>
                    <select value={newFallbackAssetId} onChange={(e) => setNewFallbackAssetId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white">
                      <option value="">—</option>
                      {mediaAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.storageKey}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">narrationText (TK)</label>
                    <input value={newNarrationText} onChange={(e) => setNewNarrationText(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">
                    Simpan Blok
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
