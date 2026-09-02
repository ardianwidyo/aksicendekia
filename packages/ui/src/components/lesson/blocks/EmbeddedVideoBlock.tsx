'use client';

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { toNoCookieEmbedUrl } from '@aksicendekia/content-kit';
import { useI18n } from '../../../providers/i18n-provider';

export interface EmbeddedVideoBlockProps {
  title: string;
  /** YouTube video id (11 chars) — never a full URL (video-embed.schema.ts). */
  externalId: string;
  publisherName: string;
  posterImageUrl: string;
  transcriptText: string;
  durationSeconds?: number;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Feature 011 — the click-to-load facade for the Constitution VI v1.2.0
 * third-party video exception (contracts/video-embed.md).
 *
 * State 1 (default): a self-hosted poster + play button. Nothing here may
 * reference a third-party domain — that is the whole point of the facade
 * (butir 2: zero network requests to the provider before an explicit click).
 * State 2 (after activation): exactly one `youtube-nocookie.com` iframe,
 * composed from `externalId` so a caller cannot supply a bypassing URL.
 *
 * Always render this alongside a self-hosted `ConceptAnimationBlock` on the
 * same lesson (butir 1) — this component does not enforce that pairing
 * itself; the catalog invariant suite does (data-model.md §4).
 */
export const EmbeddedVideoBlock: React.FC<EmbeddedVideoBlockProps> = ({
  title,
  externalId,
  publisherName,
  posterImageUrl,
  transcriptText,
  durationSeconds,
}) => {
  const { t } = useI18n();
  const [activated, setActivated] = useState(false);
  const activate = (): void => setActivated(true);

  return (
    <figure className="my-2 space-y-2">
      {activated ? (
        <iframe
          src={toNoCookieEmbedUrl(externalId)}
          title={title}
          className="aspect-video w-full rounded-xl"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="relative overflow-hidden rounded-xl bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterImageUrl}
            alt={t('interactive.embeddedVideo.play', { title })}
            className="aspect-video w-full object-cover opacity-90"
          />
          <button
            type="button"
            aria-label={t('interactive.embeddedVideo.play', { title })}
            onClick={activate}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate();
              }
            }}
            className="absolute inset-0 m-auto flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            <Play className="h-6 w-6 translate-x-0.5" aria-hidden />
          </button>
          <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
            {publisherName}
            {durationSeconds ? ` · ${formatDuration(durationSeconds)}` : ''}
          </div>
        </div>
      )}
      <figcaption className="sr-only">
        {t('interactive.embeddedVideo.transcriptLabel')}: {transcriptText}
      </figcaption>
      <p className="text-sm text-slate-600">{transcriptText}</p>
    </figure>
  );
};
