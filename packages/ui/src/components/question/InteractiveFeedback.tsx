'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useI18n } from '../../providers/i18n-provider';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

export interface InteractiveFeedbackProps {
  state: 'idle' | 'correct' | 'incorrect';
  explanation?: string;
  onRequestHint?: () => void;
}

/**
 * contracts/interactive-questions.contract.md §5 (FR-020). Correct/incorrect is
 * always conveyed with an icon + text, never color alone (FR-023). The `correct`
 * state's brief animation is replaced by a static equivalent under
 * prefers-reduced-motion (FR-013).
 */
export const InteractiveFeedback: React.FC<InteractiveFeedbackProps> = ({
  state,
  explanation,
  onRequestHint,
}) => {
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();

  if (state === 'idle') return null;

  const isCorrect = state === 'correct';

  return (
    <div
      role="status"
      className={`p-4 rounded-2xl border flex items-start gap-3 ${
        isCorrect
          ? 'bg-tertiary-container/20 border-tertiary-container text-on-surface'
          : 'bg-error-container/20 border-error-container text-on-surface'
      }`}
    >
      <div
        className={`shrink-0 mt-0.5 ${isCorrect && !reducedMotion ? 'animate-bounce' : ''}`}
        aria-hidden
      >
        {isCorrect ? (
          <CheckCircle2 className="w-6 h-6 text-tertiary" />
        ) : (
          <XCircle className="w-6 h-6 text-error" />
        )}
      </div>
      <div className="space-y-2 flex-1">
        <h4 className="text-sm font-bold">
          {isCorrect ? t('interactive.feedback.correct') : t('interactive.feedback.incorrect')}
        </h4>
        {explanation && <p className="text-sm leading-relaxed opacity-90">{explanation}</p>}
        {!isCorrect && onRequestHint && (
          <button
            type="button"
            onClick={onRequestHint}
            className="text-xs font-semibold text-error underline underline-offset-2 min-h-[44px]"
          >
            {t('interactive.feedback.showHint')}
          </button>
        )}
      </div>
    </div>
  );
};
