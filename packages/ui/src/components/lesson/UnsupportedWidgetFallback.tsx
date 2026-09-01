'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '../../providers/i18n-provider';

export interface UnsupportedWidgetFallbackProps {
  /** Optional static explanation carried by the surrounding block. */
  note?: string;
}

/**
 * Feature 010 / FR-009, FR-015. Rendered in place of an interactive widget when
 * its type is unknown, deprecated, or its params fail validation. NEVER throws —
 * the lesson stays completable.
 */
export const UnsupportedWidgetFallback: React.FC<UnsupportedWidgetFallbackProps> = ({ note }) => {
  const { t } = useI18n();
  return (
    <div
      role="note"
      className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {t('interactive.widget.unsupported.title')}
      </p>
      <p className="mt-1">{note ?? t('interactive.widget.unsupported.body')}</p>
    </div>
  );
};
