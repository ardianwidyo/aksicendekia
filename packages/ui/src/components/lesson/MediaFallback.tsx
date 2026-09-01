'use client';

import React from 'react';
import { ImageOff } from 'lucide-react';
import { useI18n } from '../../providers/i18n-provider';

export interface MediaFallbackProps {
  fallbackImageUrl?: string;
  fallbackAlt?: string;
  text: string;
}

/**
 * Feature 010 / FR-015. Shown when a video/animation/image fails to load.
 * Always keeps the lesson completable via the text explanation.
 */
export const MediaFallback: React.FC<MediaFallbackProps> = ({ fallbackImageUrl, fallbackAlt, text }) => {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
      {fallbackImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fallbackImageUrl} alt={fallbackAlt ?? ''} className="mx-auto max-h-56 rounded-lg" />
      ) : (
        <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <ImageOff className="h-4 w-4" aria-hidden />
          {t('interactive.media.fallbackNote')}
        </p>
      )}
      <p className="mt-2 text-slate-700">{text}</p>
    </div>
  );
};
