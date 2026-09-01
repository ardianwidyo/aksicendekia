'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { useI18n } from '../../providers/i18n-provider';
import { useSpeechSynthesis } from '../../hooks/use-speech-synthesis';

export interface ListenButtonProps {
  /** Text read aloud when there is no recorded narration asset. */
  text: string;
  /** Optional recorded narration (FR-017d). Played instead of synthesis when present. */
  narrationAssetUrl?: string;
  className?: string;
}

/**
 * Feature 010 / FR-017b–d — the TK "listen" control.
 * Renders nothing when neither a recorded asset nor an Indonesian synthesis voice
 * is available (FR-017c): TK lessons must never depend on this control.
 */
export const ListenButton: React.FC<ListenButtonProps> = ({ text, narrationAssetUrl, className = '' }) => {
  const { t } = useI18n();
  const { available, speaking, speak, cancel } = useSpeechSynthesis();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      cancel();
    };
  }, [cancel]);

  const usingAsset = Boolean(narrationAssetUrl);
  if (!usingAsset && !available) return null;

  const active = usingAsset ? audioPlaying : speaking;

  const toggle = (): void => {
    if (usingAsset) {
      const el = audioRef.current;
      if (!el) return;
      if (audioPlaying) {
        el.pause();
        el.currentTime = 0;
        setAudioPlaying(false);
      } else {
        void el.play();
        setAudioPlaying(true);
      }
      return;
    }
    if (speaking) cancel();
    else speak(text);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={active}
        aria-label={active ? t('interactive.listen.stop') : t('interactive.listen.play')}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      >
        {active ? <Square className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
        <span>{active ? t('interactive.listen.stop') : t('interactive.listen.play')}</span>
      </button>
      {usingAsset && (
        <audio
          ref={audioRef}
          src={narrationAssetUrl}
          preload="none"
          onEnded={() => setAudioPlaying(false)}
        />
      )}
    </>
  );
};
