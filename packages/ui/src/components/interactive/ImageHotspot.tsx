'use client';

import React, { useState } from 'react';
import { useI18n } from '../../providers/i18n-provider';
import type { InteractiveWidgetProps } from './registry';

export interface ImageHotspotParams {
  mediaAssetId: string;
  /** Resolved to a URL by the block renderer; falls back to the id for tests. */
  imageUrl?: string;
  imageAlt?: string;
  hotspots: Array<{ id: string; xPercent: number; yPercent: number; label: string; body: string }>;
}

export const ImageHotspot: React.FC<InteractiveWidgetProps<ImageHotspotParams>> = ({
  params,
  onInteract,
}) => {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const hotspots = params.hotspots ?? [];

  const toggle = (id: string): void => {
    setOpenId((current) => (current === id ? null : id));
    onInteract?.();
  };

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={params.imageUrl ?? params.mediaAssetId}
          alt={params.imageAlt ?? ''}
          className="w-full rounded-lg"
        />
        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-expanded={openId === h.id}
            aria-label={openId === h.id ? t('interactive.widget.hotspot.close') : `${h.label}: ${t('interactive.widget.hotspot.open')}`}
            onClick={() => toggle(h.id)}
            style={{ left: `${h.xPercent}%`, top: `${h.yPercent}%` }}
            className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 text-sm font-bold text-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ?
          </button>
        ))}
      </div>
      {openId && (
        <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-slate-800" role="status">
          <p className="font-semibold">{hotspots.find((h) => h.id === openId)?.label}</p>
          <p className="mt-1">{hotspots.find((h) => h.id === openId)?.body}</p>
        </div>
      )}
    </div>
  );
};
