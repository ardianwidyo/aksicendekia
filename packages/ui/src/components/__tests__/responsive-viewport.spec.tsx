import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../providers/i18n-provider';
import {
  VIEWPORT_WIDTHS,
  PORTRAIT_CRITICAL_WIDTH,
  setViewportWidth,
  expectNoDeclaredOverflow,
} from '../../test-utils/viewports';
import { StepRevealExplainer } from '../interactive/StepRevealExplainer';
import { NumberLineExplorer } from '../interactive/NumberLineExplorer';
import { FractionBarBuilder } from '../interactive/FractionBarBuilder';
import { SortIntoGroups } from '../interactive/SortIntoGroups';
import { ParameterExplorer } from '../interactive/ParameterExplorer';
import { ImageHotspot } from '../interactive/ImageHotspot';
import { AnimatedWorkedExample } from '../interactive/AnimatedWorkedExample';
import { DragDropGroupingQuestion } from '../question/DragDropGroupingQuestion';
import { NumberLinePlacementQuestion } from '../question/NumberLinePlacementQuestion';

const wrap = (ui: React.ReactElement) => render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

/** Give the number-line tracks a real width so tap-to-place is exercisable in jsdom. */
function stubRect(width = 300): void {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: width,
    bottom: 48,
    width,
    height: 48,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
}

const widgetCases: Array<[string, () => React.ReactElement]> = [
  ['StepRevealExplainer', () => <StepRevealExplainer params={{ steps: [{ title: 'A', body: 'a' }, { title: 'B', body: 'b' }] }} />],
  ['NumberLineExplorer', () => <NumberLineExplorer params={{ min: 0, max: 100, step: 10, initial: 0, markers: [0, 50, 100] }} />],
  ['FractionBarBuilder', () => <FractionBarBuilder params={{ denominator: 8 }} />],
  [
    'SortIntoGroups',
    () => (
      <SortIntoGroups
        params={{
          items: [
            { id: 'i1', label: '3.641' },
            { id: 'i2', label: '1.263' },
            { id: 'i3', label: '6.900' },
          ],
          groups: [
            { id: 'g1', label: 'Ratusan' },
            { id: 'g2', label: 'Puluhan' },
          ],
        }}
      />
    ),
  ],
  ['ParameterExplorer', () => <ParameterExplorer params={{ expressionId: 'area-rectangle', variables: [{ key: 'w', label: 'Lebar', min: 1, max: 10, step: 1, initial: 3 }] }} />],
  [
    'ImageHotspot',
    () => (
      <ImageHotspot
        params={{
          mediaAssetId: 'assets/lessons/sd/kelas-1/x.svg',
          hotspots: [{ id: 'h1', xPercent: 20, yPercent: 30, label: 'Sisi', body: 'Tiga sisi.' }],
        }}
      />
    ),
  ],
  ['AnimatedWorkedExample', () => <AnimatedWorkedExample params={{ animationId: 'count-objects', totalDurationMs: 3000, steps: [{ atMs: 0, caption: 'A', frame: 'a' }, { atMs: 1500, caption: 'B', frame: 'b' }] }} />],
];

/**
 * Feature 011 / T105 (SC-013, FR-041/FR-042). Every widget + interactive
 * question renders across 320/375/768/1280 with no element declaring a width
 * beyond the viewport, and the narrowest portrait width is completable by tap.
 */
describe('responsive widgets — no declared horizontal overflow at any viewport', () => {
  it.each(widgetCases)('%s fits every viewport width', (_name, make) => {
    for (const width of VIEWPORT_WIDTHS) {
      setViewportWidth(width);
      const { container, unmount } = wrap(make());
      expectNoDeclaredOverflow(container, width);
      unmount();
    }
  });

  it('DragDropGroupingQuestion + NumberLinePlacementQuestion fit every viewport width', () => {
    for (const width of VIEWPORT_WIDTHS) {
      setViewportWidth(width);
      const { container: c1, unmount: u1 } = wrap(
        <DragDropGroupingQuestion
          items={[{ id: 'i1', label: '3.641' }, { id: 'i2', label: '4.860' }]}
          groups={[{ id: 'g1', label: 'A' }, { id: 'g2', label: 'B' }]}
          placements={{}}
          onPlacementsChange={() => {}}
        />,
      );
      expectNoDeclaredOverflow(c1, width);
      u1();
      const { container: c2, unmount: u2 } = wrap(
        <NumberLinePlacementQuestion min={0} max={100} step={10} value={null} onChange={() => {}} />,
      );
      expectNoDeclaredOverflow(c2, width);
      u2();
    }
  });
});

describe('portrait 320px — completable by tap alone', () => {
  it('NumberLineExplorer marker moves on a track tap (no drag, no keyboard)', () => {
    setViewportWidth(PORTRAIT_CRITICAL_WIDTH);
    stubRect(300);
    const { getByRole } = wrap(
      <NumberLineExplorer params={{ min: 0, max: 100, step: 10, initial: 0 }} />,
    );
    const slider = getByRole('slider');
    fireEvent.click(slider, { clientX: 150 });
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    vi.restoreAllMocks();
  });

  it('NumberLinePlacementQuestion records a value on a track tap', () => {
    setViewportWidth(PORTRAIT_CRITICAL_WIDTH);
    stubRect(300);
    const onChange = vi.fn();
    const { getByRole } = wrap(
      <NumberLinePlacementQuestion min={0} max={100} step={10} value={null} onChange={onChange} />,
    );
    fireEvent.click(getByRole("slider"), { clientX: 90 });
    expect(onChange).toHaveBeenCalledWith(30);
    vi.restoreAllMocks();
  });

  it('SortIntoGroups completes with taps only — select item, then tap a group', () => {
    setViewportWidth(PORTRAIT_CRITICAL_WIDTH);
    const { getByRole } = wrap(
      <SortIntoGroups
        params={{
          items: [{ id: 'i1', label: '3.641' }],
          groups: [{ id: 'hit', label: 'Ratusan' }, { id: 'miss', label: 'Bukan' }],
          correctMapping: { i1: 'hit' },
        }}
      />,
    );
    fireEvent.click(getByRole('button', { name: '3.641' }));
    fireEvent.click(getByRole('button', { name: /ratusan/i }));
    // the item is now inside the group, gone from the unplaced pool
    expect(() => getByRole('button', { name: '3.641' })).toThrow();
  });
});
