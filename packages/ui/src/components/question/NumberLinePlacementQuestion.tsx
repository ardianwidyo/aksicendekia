'use client';

import React from 'react';
import { useI18n } from '../../providers/i18n-provider';

export interface NumberLinePlacementQuestionProps {
  min: number;
  max: number;
  step: number;
  markers?: number[];
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Only provided once the answer has been graded, to show the target position. */
  targetValue?: number;
}

function clampToStep(raw: number, min: number, max: number, step: number): number {
  const stepped = min + Math.round((raw - min) / step) * step;
  return Math.max(min, Math.min(max, Number(stepped.toFixed(6))));
}

/**
 * `role="slider"` keyboard-first placement (contracts/widget-catalog.contract.md,
 * contracts/interactive-questions.contract.md §3). Mirrors the arrow/Home/End/
 * PageUp/PageDown pattern already established by NumberLineExplorer.
 */
export const NumberLinePlacementQuestion: React.FC<NumberLinePlacementQuestionProps> = ({
  min,
  max,
  step,
  markers = [],
  value,
  onChange,
  disabled = false,
  targetValue,
}) => {
  const { t } = useI18n();
  const current = value ?? min;
  const isGraded = targetValue !== undefined;

  const update = (next: number): void => {
    if (disabled) return;
    onChange(clampToStep(next, min, max, step));
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (disabled) return;
    const bigStep = step * 10;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        update(current + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        update(current - step);
        break;
      case 'PageUp':
        event.preventDefault();
        update(current + bigStep);
        break;
      case 'PageDown':
        event.preventDefault();
        update(current - bigStep);
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

  const percent = ((current - min) / (max - min)) * 100;
  const targetPercent = isGraded ? ((targetValue! - min) / (max - min)) * 100 : null;

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={t('interactive.widget.numberLine.label')}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={t('interactive.widget.numberLine.value', { value: current })}
        aria-disabled={disabled}
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
        {isGraded && targetPercent !== null && (
          <span
            className="absolute top-1/2 h-8 w-1 -translate-y-1/2 -translate-x-1/2 rounded bg-emerald-500"
            style={{ left: `${targetPercent}%` }}
            aria-hidden
          />
        )}
        <span
          className={`absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
            isGraded
              ? Math.abs(current - (targetValue ?? current)) < 1e-9
                ? 'border-emerald-700 bg-emerald-500'
                : 'border-rose-700 bg-rose-500'
              : 'border-blue-700 bg-blue-500'
          }`}
          style={{ left: `${percent}%` }}
          aria-hidden
        />
      </div>
      <p className="mt-4 text-center text-lg font-bold text-blue-700">{current}</p>
    </div>
  );
};
