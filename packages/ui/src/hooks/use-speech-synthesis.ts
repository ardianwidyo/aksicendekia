'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Feature 010 / FR-017b–c. Wraps the browser-native `speechSynthesis` for the
 * TK "listen" control. NO third-party TTS. Reports `available: false` when there
 * is no Indonesian voice so callers can hide the control entirely (FR-017c).
 */

interface UseSpeechSynthesisResult {
  /** True only when speechSynthesis exists AND an `id-*` voice is present. */
  available: boolean;
  speaking: boolean;
  speak: (text: string) => void;
  cancel: () => void;
}

const LANG = 'id-ID';

function hasIndonesianVoice(synth: SpeechSynthesis): boolean {
  return synth.getVoices().some((v) => v.lang?.toLowerCase().startsWith('id'));
}

export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const [available, setAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synthRef.current = synth;

    const refresh = (): void => setAvailable(hasIndonesianVoice(synth));
    refresh();
    // getVoices() is often empty on first call; wait for the async population.
    synth.addEventListener('voiceschanged', refresh);
    return () => {
      synth.removeEventListener('voiceschanged', refresh);
      synth.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      const synth = synthRef.current;
      if (!synth || !text.trim()) return;
      synth.cancel(); // never let readings overlap
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG;
      const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith('id'));
      if (voice) utterance.voice = voice;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(utterance);
    },
    [],
  );

  const cancel = useCallback(() => {
    synthRef.current?.cancel();
    setSpeaking(false);
  }, []);

  return { available, speaking, speak, cancel };
}
