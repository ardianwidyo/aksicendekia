'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@aksicendekia/ui';
import { LessonContentRenderer, type RenderableBlock } from '@aksicendekia/ui';
import { apiFetch } from '@/lib/api-fetch';

interface RawBlock {
  id: string;
  orderIndex: number;
  blockType: RenderableBlock['blockType'];
  payload: Record<string, unknown>;
  altText: string | null;
  transcriptText: string | null;
  mediaAssetId: string | null;
  captionAssetId: string | null;
  fallbackAssetId: string | null;
  narrationText: string | null;
}

interface MediaAsset {
  id: string;
  storageKey: string;
}

function assetUrl(assetId: string | null, assetsById: Map<string, MediaAsset>): string | undefined {
  if (!assetId) return undefined;
  const asset = assetsById.get(assetId);
  return asset ? `/${asset.storageKey}` : undefined;
}

/**
 * Bridges the CMS's DB row shape (companion fields as separate columns) into the
 * shape LessonContentRenderer expects (companion fields folded into `payload`,
 * asset ids already resolved to URLs) — see packages/ui LessonContentRenderer.tsx.
 */
function toRenderableBlock(block: RawBlock, assetsById: Map<string, MediaAsset>): RenderableBlock {
  const p = block.payload;
  let payload: Record<string, unknown> = p;

  switch (block.blockType) {
    case 'ILLUSTRATION':
      payload = {
        ...p,
        imageUrl: assetUrl(block.mediaAssetId, assetsById) ?? '',
        altText: block.altText ?? '',
      };
      break;
    case 'ANIMATION':
      payload = { ...p, transcriptText: block.transcriptText ?? '' };
      break;
    case 'VIDEO':
      payload = {
        ...p,
        videoUrl: assetUrl(block.mediaAssetId, assetsById) ?? '',
        captionUrl: assetUrl(block.captionAssetId, assetsById) ?? '',
        transcriptText: block.transcriptText ?? '',
        fallbackImageUrl: assetUrl(block.fallbackAssetId, assetsById),
      };
      break;
    case 'INTERACTIVE_WIDGET':
      payload = { widget: p };
      break;
    default:
      payload = p;
  }

  return {
    id: block.id,
    blockType: block.blockType,
    payload,
    narrationText: block.narrationText,
  };
}

export default function PreviewClient() {
  const params = useParams();
  const lessonId = (params?.lessonId as string) || '';

  const [blocks, setBlocks] = useState<RenderableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [blocksRes, assetsRes] = await Promise.all([
          apiFetch(`/api/v1/admin/lessons/${lessonId}/blocks`),
          apiFetch('/api/v1/admin/media-assets'),
        ]);
        if (!blocksRes.ok) throw new Error('Gagal memuat blok konten');
        const blocksData = await blocksRes.json();
        const assetsData = assetsRes.ok ? await assetsRes.json() : { assets: [] };
        const assetsById = new Map<string, MediaAsset>((assetsData.assets ?? []).map((a: MediaAsset) => [a.id, a]));
        const raw: RawBlock[] = (blocksData.blocks ?? []).sort((a: RawBlock, b: RawBlock) => a.orderIndex - b.orderIndex);
        setBlocks(raw.map((b) => toRenderableBlock(b, assetsById)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat pratinjau');
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Pratinjau Tampilan Siswa</h1>
          <p className="text-sm text-slate-400 font-mono">Pelajaran: {lessonId} (FR-006)</p>
        </div>
        <Link href={`/admin/curriculum/${lessonId}`}>
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 text-xs">
            ← Kembali ke Editor
          </Button>
        </Link>
      </div>

      {loading && <p className="text-slate-400 text-sm">Memuat pratinjau...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="max-w-2xl mx-auto bg-white text-slate-900 rounded-2xl p-6 shadow-xl">
          {blocks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-12">Belum ada blok konten untuk ditampilkan.</p>
          ) : (
            <LessonContentRenderer blocks={blocks} />
          )}
        </div>
      )}
    </div>
  );
}
