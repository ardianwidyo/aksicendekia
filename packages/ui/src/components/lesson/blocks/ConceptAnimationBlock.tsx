'use client';

import React, { useState } from 'react';
import { useI18n } from '../../../providers/i18n-provider';
import { AnimatedWorkedExample } from '../../interactive/AnimatedWorkedExample';

export interface ConceptAnimationBlockProps {
  animationId: string;
  steps: Array<{ atMs: number; caption: string; frame: string }>;
  loop?: boolean;
  transcriptText: string;
  renderFrame?: (frameId: string) => React.ReactNode;
}

/**
 * The "video" slot for v1 — a code/SVG animation with play/pause and a transcript
 * (Feature 010 / Q3, FR-014). Reduced-motion handling is inherited from
 * AnimatedWorkedExample (manual step mode).
 */
export const ConceptAnimationBlock: React.FC<ConceptAnimationBlockProps> = ({
  animationId,
  steps,
  loop,
  transcriptText,
  renderFrame,
}) => {
  const { t } = useI18n();
  const [showTranscript, setShowTranscript] = useState(false);
  const lastAt = steps.length ? steps[steps.length - 1].atMs : 0;

  return (
    <div className="my-2">
      <AnimatedWorkedExample
        params={{
          animationId,
          steps,
          loop: loop ?? false,
          totalDurationMs: Math.min(60_000, Math.max(1000, lastAt + 1000)),
          renderFrame,
        }}
      />
      <button
        type="button"
        onClick={() => setShowTranscript((v) => !v)}
        aria-expanded={showTranscript}
        className="mt-2 text-sm font-medium text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {showTranscript ? t('interactive.block.transcript.hide') : t('interactive.block.transcript.show')}
      </button>
      {showTranscript && (
        <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{transcriptText}</p>
      )}
    </div>
  );
};
