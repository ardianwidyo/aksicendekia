'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../providers/i18n-provider';
import type { InteractiveWidgetProps } from './registry';

export interface StepRevealParams {
  steps: Array<{ title: string; body: string; illustrationAssetId?: string }>;
  autoAdvance?: boolean;
}

export const StepRevealExplainer: React.FC<InteractiveWidgetProps<StepRevealParams>> = ({
  params,
  onInteract,
}) => {
  const { t } = useI18n();
  const steps = params.steps ?? [];
  const [index, setIndex] = useState(0);
  const total = steps.length || 1;
  const step = steps[index];

  const go = (next: number): void => {
    const clamped = Math.max(0, Math.min(total - 1, next));
    if (clamped !== index) {
      setIndex(clamped);
      onInteract?.();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      go(index - 1);
    }
  };

  return (
    <div
      className="rounded-xl border-2 border-slate-200 bg-white p-4"
      role="group"
      aria-roledescription="step-by-step"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500" aria-live="polite">
        {t('interactive.widget.stepReveal.stepOf', { current: index + 1, total })}
      </p>
      <h4 className="mt-1 text-lg font-bold text-slate-900">{step?.title}</h4>
      <p className="mt-2 text-slate-700">{step?.body}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-lg border-2 border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {t('interactive.widget.stepReveal.prev')}
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === total - 1}
          className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-lg border-2 border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t('interactive.widget.stepReveal.next')}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};
