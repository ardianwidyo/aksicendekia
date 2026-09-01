'use client';

import React, { useState } from 'react';
import { useI18n } from '../../providers/i18n-provider';
import type { InteractiveWidgetProps } from './registry';

export type ExpressionId = 'linear-y-mx-c' | 'proportional-y-kx' | 'area-rectangle' | 'fraction-parts';

export interface ParameterExplorerParams {
  expressionId: ExpressionId;
  variables: Array<{ key: string; label: string; min: number; max: number; step: number; initial: number }>;
  showValueReadout?: boolean;
}

/** Closed set — no evaluation of author-supplied strings. */
const EXPRESSIONS: Record<ExpressionId, (v: Record<string, number>) => number> = {
  'linear-y-mx-c': (v) => (v.m ?? 0) * (v.x ?? 0) + (v.c ?? 0),
  'proportional-y-kx': (v) => (v.k ?? 0) * (v.x ?? 0),
  'area-rectangle': (v) => (v.w ?? 0) * (v.h ?? 0),
  'fraction-parts': (v) => (v.d ?? 1 ? (v.n ?? 0) / (v.d ?? 1) : 0),
};

export const ParameterExplorer: React.FC<InteractiveWidgetProps<ParameterExplorerParams>> = ({
  params,
  onInteract,
}) => {
  const { t } = useI18n();
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries((params.variables ?? []).map((v) => [v.key, v.initial])),
  );

  const compute = EXPRESSIONS[params.expressionId] ?? (() => 0);
  const result = compute(values);
  const showReadout = params.showValueReadout ?? true;

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
      <div className="space-y-4">
        {(params.variables ?? []).map((v) => (
          <label key={v.key} className="block">
            <span className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span>{v.label}</span>
              <span className="tabular-nums text-slate-500">{values[v.key]}</span>
            </span>
            <input
              type="range"
              min={v.min}
              max={v.max}
              step={v.step}
              value={values[v.key]}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [v.key]: Number(e.target.value) }));
                onInteract?.();
              }}
              className="mt-2 w-full accent-blue-600"
            />
          </label>
        ))}
      </div>
      {showReadout && (
        <p className="mt-4 rounded-lg bg-blue-50 p-3 text-center text-lg font-bold text-blue-700">
          <span className="sr-only">{t('interactive.widget.parameterExplorer.readout')}: </span>
          {Number(result.toFixed(4))}
        </p>
      )}
    </div>
  );
};
