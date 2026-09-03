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

  // Solid, high-contrast surfaces — the app's design tokens are not
  // `prefers-color-scheme`-aware, so `dark:` variants here would render light
  // text on a light card. Fixed emerald/rose scales stay AA in both.
  return (
    <div
      role="status"
      className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
        isCorrect
          ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
          : 'bg-rose-50 border-rose-400 text-rose-950'
      }`}
    >
      <div
        className={`shrink-0 mt-0.5 ${isCorrect && !reducedMotion ? 'animate-bounce' : ''}`}
        aria-hidden
      >
        {isCorrect ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        ) : (
          <XCircle className="w-6 h-6 text-rose-600" />
        )}
      </div>
      <div className="space-y-1.5 flex-1">
        <h4 className={`text-sm font-bold ${isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}>
          {isCorrect ? t('interactive.feedback.correct') : t('interactive.feedback.incorrect')}
        </h4>
        {explanation && (
          <p className={`text-sm leading-relaxed ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
            {explanation}
          </p>
        )}
        {!isCorrect && onRequestHint && (
          <button
            type="button"
            onClick={onRequestHint}
            className="text-xs font-semibold text-rose-700 underline underline-offset-2 min-h-[44px]"
          >
            {t('interactive.feedback.showHint')}
          </button>
        )}
      </div>
    </div>
  );
};
