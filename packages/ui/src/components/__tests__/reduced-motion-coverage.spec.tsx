import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../../providers/i18n-provider';
import { AnimatedWorkedExample } from '../interactive/AnimatedWorkedExample';
import { ConceptAnimationBlock } from '../lesson/blocks/ConceptAnimationBlock';
import { StepRevealExplainer } from '../interactive/StepRevealExplainer';
import { InteractiveFeedback } from '../question/InteractiveFeedback';

const wrap = (ui: React.ReactElement) => render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

type Listener = (event: MediaQueryListEvent) => void;
function installMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: (_: string, _cb: Listener) => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    })),
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Feature 010 / T084 (FR-013). Every animated component has a static equivalent
 * under prefers-reduced-motion: no autoplay, no timer-driven advance — control is
 * fully manual, driven by discrete clicks/keypresses rather than motion.
 */
describe('AnimatedWorkedExample — static under reduced motion', () => {
  const params = {
    animationId: 'count-objects',
    steps: [
      { atMs: 0, caption: 'Satu', frame: 'f0' },
      { atMs: 400, caption: 'Dua', frame: 'f1' },
      { atMs: 800, caption: 'Tiga', frame: 'f2' },
    ],
    totalDurationMs: 1000,
  };

  it('hides Play/Pause and offers only manual step controls when reduced motion is on', () => {
    installMatchMedia(true);
    wrap(<AnimatedWorkedExample params={params} />);
    expect(screen.queryByRole('button', { name: /putar|jeda/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ulang/i })).toBeInTheDocument();
  });

  it('offers Play/Pause when reduced motion is off', () => {
    installMatchMedia(false);
    wrap(<AnimatedWorkedExample params={params} />);
    expect(screen.getByRole('button', { name: /putar/i })).toBeInTheDocument();
  });
});

describe('ConceptAnimationBlock — inherits the static equivalent (wraps AnimatedWorkedExample)', () => {
  it('hides Play/Pause under reduced motion', () => {
    installMatchMedia(true);
    wrap(
      <ConceptAnimationBlock
        animationId="count-objects"
        steps={[
          { atMs: 0, caption: 'Mulai', frame: 'f0' },
          { atMs: 500, caption: 'Selesai', frame: 'f1' },
        ]}
        transcriptText="Menghitung dua benda."
      />,
    );
    expect(screen.queryByRole('button', { name: /putar|jeda/i })).not.toBeInTheDocument();
  });
});

describe('StepRevealExplainer — never animated, so reduced motion changes nothing', () => {
  const params = {
    steps: [
      { title: 'Satu', body: 'a' },
      { title: 'Dua', body: 'b' },
    ],
  };

  it('renders identically (no motion to begin with) whether reduced motion is on or off', () => {
    installMatchMedia(true);
    const { container: reduced } = wrap(<StepRevealExplainer params={params} />);
    installMatchMedia(false);
    const { container: normal } = wrap(<StepRevealExplainer params={params} />);
    expect(reduced.querySelector('[class*="transition"]')).toBeNull();
    expect(normal.querySelector('[class*="transition"]')).toBeNull();
  });
});

describe('InteractiveFeedback — static correct state under reduced motion', () => {
  it('drops the bounce animation class when reduced motion is on', () => {
    installMatchMedia(true);
    const { container } = wrap(<InteractiveFeedback state="correct" />);
    expect(container.querySelector('.animate-bounce')).toBeNull();
    // Still conveys correctness via icon + text (FR-023), not just motion.
    expect(screen.getByText(/tepat sekali/i)).toBeInTheDocument();
  });

  it('shows the bounce animation class when reduced motion is off', () => {
    installMatchMedia(false);
    const { container } = wrap(<InteractiveFeedback state="correct" />);
    expect(container.querySelector('.animate-bounce')).not.toBeNull();
  });
});
