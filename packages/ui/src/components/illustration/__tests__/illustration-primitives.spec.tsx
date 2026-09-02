import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PlaceValueBlocks } from '../PlaceValueBlocks';
import { NumberLineStrip } from '../NumberLineStrip';
import { FractionShape } from '../FractionShape';
import { ArrayGrid } from '../ArrayGrid';
import { ShapeFigure } from '../ShapeFigure';
import { BarChartMini } from '../BarChartMini';
import { ClockFace } from '../ClockFace';
import { MoneyStack } from '../MoneyStack';
import { PatternRow } from '../PatternRow';
import { MeasureRuler } from '../MeasureRuler';

/**
 * Feature 011 / FR-013, FR-040, FR-041 — smoke test across all 10 primitives.
 * Full a11y scanning (axe) is US3's job (T091, once real lessons use these);
 * this Foundational-phase test only proves the shared contract every
 * primitive must meet: an accessible label, a responsive viewBox instead of
 * a fixed pixel size, and zero hardcoded hex colors (Constitution VI).
 */

const cases: Array<[string, React.ReactElement]> = [
  ['PlaceValueBlocks', <PlaceValueBlocks title="Nilai tempat 45" tens={4} ones={5} />],
  ['NumberLineStrip', <NumberLineStrip title="Garis bilangan 0-10" min={0} max={10} highlightValues={[7]} />],
  ['FractionShape (circle)', <FractionShape title="Tiga per empat" numerator={3} denominator={4} />],
  ['FractionShape (bar)', <FractionShape title="Satu per dua" numerator={1} denominator={2} shape="bar" />],
  ['ArrayGrid', <ArrayGrid title="3 baris 4 kolom" rows={3} cols={4} />],
  ['ShapeFigure', <ShapeFigure title="Segitiga" shape="segitiga" />],
  ['BarChartMini', <BarChartMini title="Buah favorit" data={[{ label: 'Apel', value: 5 }, { label: 'Jeruk', value: 3 }]} />],
  ['ClockFace', <ClockFace title="Pukul 3:30" hour={3} minute={30} />],
  ['MoneyStack', <MoneyStack title="Uang kertas" denominations={[{ value: 2000, count: 3 }]} />],
  ['PatternRow', <PatternRow title="Pola bentuk" items={['circle', 'square', 'circle']} highlightIndex={2} />],
  ['MeasureRuler', <MeasureRuler title="Panjang pensil" lengthUnits={4} unitLabel="cm" />],
];

describe.each(cases)('%s', (_name, element) => {
  it('renders an <svg role="img"> with an accessible label', () => {
    const { container } = render(element);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg?.getAttribute('aria-label')?.length).toBeGreaterThan(0);
  });

  it('scales via viewBox rather than a fixed pixel width/height', () => {
    const { container } = render(element);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBeTruthy();
    expect(svg.getAttribute('width')).toBeNull();
    expect(svg.getAttribute('height')).toBeNull();
  });

  it('contains no hardcoded hex color (Constitution VI — design tokens only)', () => {
    const { container } = render(element);
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
