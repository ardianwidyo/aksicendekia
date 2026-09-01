'use client';

import React, { useState } from 'react';
import { useI18n } from '../../providers/i18n-provider';
import type { InteractiveWidgetProps } from './registry';

export interface FractionBarBuilderParams {
  denominator: number;
  targetFraction?: { numerator: number; denominator: number };
  allowCompare?: boolean;
}

export const FractionBarBuilder: React.FC<InteractiveWidgetProps<FractionBarBuilderParams>> = ({
  params,
  onInteract,
}) => {
  const { t } = useI18n();
  const denominator = Math.max(2, Math.min(12, params.denominator || 2));
  const [shaded, setShaded] = useState<boolean[]>(() => Array(denominator).fill(false));

  const toggle = (i: number): void => {
    setShaded((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
    onInteract?.();
  };

  const shadedCount = shaded.filter(Boolean).length;

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
      <div
        className="flex overflow-hidden rounded-lg border-2 border-slate-400"
        role="group"
        aria-label={t('interactive.widget.fractionBar.shadedOf', { shaded: shadedCount, total: denominator })}
      >
        {shaded.map((isShaded, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={isShaded}
            aria-label={t('interactive.widget.fractionBar.part', { index: i + 1 })}
            onClick={() => toggle(i)}
            className={`min-h-11 flex-1 border-r-2 border-slate-400 last:border-r-0 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
              isShaded ? 'bg-blue-500' : 'bg-white hover:bg-blue-50'
            }`}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-lg font-bold text-slate-800" aria-live="polite">
        {shadedCount}/{denominator}
        {params.targetFraction && (
          <span className="ml-2 text-sm font-normal text-slate-500">
            (target {params.targetFraction.numerator}/{params.targetFraction.denominator})
          </span>
        )}
      </p>
    </div>
  );
};
