'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useI18n } from '../../providers/i18n-provider';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import type { InteractiveWidgetProps } from './registry';

export interface AnimatedWorkedExampleParams {
  animationId: string;
  steps: Array<{ atMs: number; caption: string; frame: string }>;
  loop?: boolean;
  totalDurationMs: number;
  /** Optional visual renderer for a named frame; defaults to a labelled box. */
  renderFrame?: (frameId: string) => React.ReactNode;
}

export const AnimatedWorkedExample: React.FC<InteractiveWidgetProps<AnimatedWorkedExampleParams>> = ({
  params,
  onInteract,
}) => {
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();
  const steps = params.steps ?? [];
  const total = steps.length || 1;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = (): void => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    if (index >= total - 1) {
      if (params.loop) {
        timer.current = setTimeout(() => setIndex(0), 900);
      } else {
        setPlaying(false);
      }
      return;
    }
    const nextAt = steps[index + 1]?.atMs ?? 0;
    const currentAt = steps[index]?.atMs ?? 0;
    timer.current = setTimeout(() => setIndex((i) => i + 1), Math.max(400, nextAt - currentAt));
    return clearTimer;
  }, [playing, index, total, reducedMotion, params.loop, steps]);

  const step = steps[index];
  const canAnimate = !reducedMotion;

  const renderFrame =
    params.renderFrame ??
    ((frame: string) => (
      <div className="flex h-40 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
        {frame}
      </div>
    ));

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
      {renderFrame(step?.frame ?? '')}
      <p className="mt-3 min-h-[3rem] text-slate-800" aria-live="polite">
        {step?.caption}
      </p>
      <p className="text-xs text-slate-400">
        {t('interactive.widget.animation.stepOf', { current: index + 1, total })}
      </p>

      <div className="mt-3 flex gap-2">
        {canAnimate && (
          <button
            type="button"
            onClick={() => {
              setPlaying((p) => !p);
              onInteract?.();
            }}
            className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-lg border-2 border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {playing ? t('interactive.widget.animation.pause') : t('interactive.widget.animation.play')}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setIndex((i) => Math.min(total - 1, i + 1));
            onInteract?.();
          }}
          disabled={index >= total - 1}
          className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-lg border-2 border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('interactive.widget.animation.stepOf', { current: index + 1, total })}
        </button>
        <button
          type="button"
          onClick={() => {
            clearTimer();
            setPlaying(false);
            setIndex(0);
            onInteract?.();
          }}
          className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-lg border-2 border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          {t('interactive.widget.animation.replay')}
        </button>
      </div>
    </div>
  );
};
