'use client';

import React, { useState } from 'react';
import { useI18n } from '../../providers/i18n-provider';
import type { InteractiveWidgetProps } from './registry';

export interface NumberLineExplorerParams {
  min: number;
  max: number;
  step: number;
  initial: number;
  markers?: number[];
  showFractions?: boolean;
}

function clampToStep(value: number, min: number, max: number, step: number): number {
  const stepped = min + Math.round((value - min) / step) * step;
  return Math.max(min, Math.min(max, Number(stepped.toFixed(6))));
}

export const NumberLineExplorer: React.FC<InteractiveWidgetProps<NumberLineExplorerParams>> = ({
  params,
  onInteract,
}) => {
  const { t } = useI18n();
  const { min, max, step } = params;
  const [value, setValue] = useState(() => clampToStep(params.initial, min, max, step));
  const markers = params.markers ?? [];

  const update = (next: number): void => {
    const clamped = clampToStep(next, min, max, step);
    if (clamped !== value) {
      setValue(clamped);
      onInteract?.();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    const bigStep = step * 10;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        update(value + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        update(value - step);
        break;
      case 'PageUp':
        event.preventDefault();
        update(value + bigStep);
        break;
      case 'PageDown':
        event.preventDefault();
        update(value - bigStep);
        break;
      case 'Home':
        event.preventDefault();
        update(min);
        break;
      case 'End':
        event.preventDefault();
        update(max);
        break;
      default:
        break;
    }
  };

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
      <div
        role="slider"
        tabIndex={0}
        aria-label={t('interactive.widget.numberLine.label')}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={t('interactive.widget.numberLine.value', { value })}
        onKeyDown={onKeyDown}
        className="relative mt-6 h-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-4 rounded"
      >
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded bg-slate-300" />
        {markers.map((m) => {
          const p = ((m - min) / (max - min)) * 100;
          return (
            <span
              key={m}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-xs text-slate-500"
              style={{ left: `${p}%` }}
              aria-hidden
            >
              |<span className="block">{m}</span>
            </span>
          );
        })}
        <span
          className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-700 bg-blue-500"
          style={{ left: `${percent}%` }}
          aria-hidden
        />
      </div>
      <p className="mt-4 text-center text-lg font-bold text-blue-700">{value}</p>
    </div>
  );
};
