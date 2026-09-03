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

/** Indonesian grouping (472.039) so large place-value numbers stay readable on a phone. */
function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
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
  const hasPlaced = value !== null && value !== undefined && Number.isFinite(value);
  const current = hasPlaced ? (value as number) : (min + max) / 2;
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

  // Feature 011 / T103 (FR-043) — tap-to-place: tapping the track moves the
  // marker to the nearest step, so the question completes by touch alone.
  const placeFromPointer = (clientX: number, el: HTMLElement): void => {
    if (disabled) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    update(min + ratio * (max - min));
  };

  const percent = Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
  const targetPercent = isGraded ? ((targetValue! - min) / (max - min)) * 100 : null;

  const handleTone = !hasPlaced
    ? 'border-slate-400 bg-white opacity-40'
    : isGraded
      ? Math.abs(current - (targetValue ?? current)) <= (max - min) / 200 + 1e-9
        ? 'border-emerald-700 bg-emerald-500'
        : 'border-rose-700 bg-rose-500'
      : 'border-blue-700 bg-blue-500';

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-3 sm:p-4">
      {/* Track row — handle and ticks only; labels live in their own row below so
          they never collide with the draggable handle on a narrow screen. */}
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
        onPointerDown={(e) => placeFromPointer(e.clientX, e.currentTarget)}
        onClick={(e) => placeFromPointer(e.clientX, e.currentTarget)}
        className="relative h-10 cursor-pointer touch-none rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
        <div
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-blue-300"
          style={{ width: `${percent}%` }}
          aria-hidden
        />
        {markers.map((m) => {
          const p = ((m - min) / (max - min)) * 100;
          return (
            <span
              key={m}
              className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-400"
              style={{ left: `${p}%` }}
              aria-hidden
            />
          );
        })}
        {isGraded && targetPercent !== null && (
          <span
            className="absolute top-1/2 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-emerald-500"
            style={{ left: `${targetPercent}%` }}
            aria-hidden
          />
        )}
        <span
          className={`absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm transition-opacity ${handleTone}`}
          style={{ left: `${percent}%` }}
          aria-hidden
        />
      </div>

      {/* Marker labels — first sticks to the left edge, last to the right edge, so
          nothing gets clipped by the card on mobile. */}
      {markers.length > 0 && (
        <div className="relative mt-1.5 h-4">
          {markers.map((m, i) => {
            const p = ((m - min) / (max - min)) * 100;
            const isFirst = i === 0;
            const isLast = i === markers.length - 1;
            const shift = isFirst ? 'translateX(0)' : isLast ? 'translateX(-100%)' : 'translateX(-50%)';
            return (
              <span
                key={m}
                className="absolute top-0 text-[10px] leading-none tabular-nums text-slate-500 sm:text-xs"
                style={{ left: `${p}%`, transform: shift }}
                aria-hidden
              >
                {formatNumber(m)}
              </span>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-center text-lg font-bold text-blue-700">
        {hasPlaced ? (
          formatNumber(current)
        ) : (
          <span className="text-sm font-medium text-slate-400">
            Ketuk garis untuk meletakkan jawabanmu
          </span>
        )}
      </p>
    </div>
  );
};
