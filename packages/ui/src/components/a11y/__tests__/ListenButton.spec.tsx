import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { I18nProvider } from '../../../providers/i18n-provider';
import { ListenButton } from '../ListenButton';

interface FakeVoice {
  lang: string;
}

function installSpeechSynthesis(voices: FakeVoice[]) {
  const speak = vi.fn();
  const cancel = vi.fn();
  let voicesChanged: (() => void) | null = null;
  const synth = {
    speak,
    cancel,
    getVoices: () => voices,
    addEventListener: (_: string, cb: () => void) => {
      voicesChanged = cb;
    },
    removeEventListener: () => {
      voicesChanged = null;
    },
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string;
      lang = '';
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    },
  );
  return { speak, cancel, emitVoicesChanged: () => voicesChanged?.() };
}

const renderWithI18n = (ui: React.ReactElement) =>
  render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

beforeEach(() => {
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ListenButton', () => {
  it('does not render when no Indonesian voice and no recorded asset (FR-017c)', () => {
    installSpeechSynthesis([{ lang: 'en-US' }]);
    renderWithI18n(<ListenButton text="Ada berapa apel?" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders and is keyboard-operable when an id-* voice exists', async () => {
    const { speak } = installSpeechSynthesis([{ lang: 'id-ID' }]);
    renderWithI18n(<ListenButton text="Ada berapa apel?" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(speak).toHaveBeenCalledOnce();
  });

  it('cancels the previous reading before speaking again (no overlap)', async () => {
    const { speak, cancel } = installSpeechSynthesis([{ lang: 'id-ID' }]);
    renderWithI18n(<ListenButton text="Halo" />);
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    await userEvent.click(btn); // toggle off then...
    await userEvent.click(btn); // ...on again
    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalled();
  });

  it('renders for a recorded asset even without a synthesis voice (FR-017d)', () => {
    installSpeechSynthesis([]);
    renderWithI18n(<ListenButton text="x" narrationAssetUrl="assets/lessons/tk/q1.mp3" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    installSpeechSynthesis([{ lang: 'id-ID' }]);
    const { container } = renderWithI18n(<ListenButton text="Halo" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
