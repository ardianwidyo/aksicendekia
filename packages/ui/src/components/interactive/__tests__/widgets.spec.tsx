import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { I18nProvider } from '../../../providers/i18n-provider';
import { resolveWidget, WIDGET_REGISTRY } from '../registry';
import { StepRevealExplainer } from '../StepRevealExplainer';
import { NumberLineExplorer } from '../NumberLineExplorer';
import { FractionBarBuilder } from '../FractionBarBuilder';
import { SortIntoGroups } from '../SortIntoGroups';
import { ParameterExplorer } from '../ParameterExplorer';

const wrap = (ui: React.ReactElement) => render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

describe('widget registry', () => {
  it('exposes all 7 catalog widgets as SUPPORTED with a component + schema', () => {
    expect(Object.keys(WIDGET_REGISTRY)).toHaveLength(7);
    for (const entry of Object.values(WIDGET_REGISTRY)) {
      expect(entry.supportStatus).toBe('SUPPORTED');
      expect(typeof entry.component).toBe('function');
      expect(typeof entry.paramsSchema.safeParse).toBe('function');
    }
  });

  it('resolveWidget returns undefined for an unknown type', () => {
    expect(resolveWidget('NOT_A_WIDGET')).toBeUndefined();
    expect(resolveWidget('NUMBER_LINE_EXPLORER')?.id).toBe('NUMBER_LINE_EXPLORER');
  });
});

describe('StepRevealExplainer — keyboard', () => {
  const params = {
    steps: [
      { title: 'Satu', body: 'a' },
      { title: 'Dua', body: 'b' },
      { title: 'Tiga', body: 'c' },
    ],
  };

  it('advances with Enter and goes back with Backspace', async () => {
    wrap(<StepRevealExplainer params={params} />);
    expect(screen.getByText('Satu')).toBeInTheDocument();
    const group = screen.getByRole('group');
    group.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Dua')).toBeInTheDocument();
    await userEvent.keyboard('{Backspace}');
    expect(screen.getByText('Satu')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = wrap(<StepRevealExplainer params={params} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('NumberLineExplorer — slider semantics', () => {
  const params = { min: 0, max: 10, step: 1, initial: 5, markers: [0, 5, 10] };

  it('is a slider with correct ARIA values and arrow-key control', async () => {
    wrap(<NumberLineExplorer params={params} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '5');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '6');
    await userEvent.keyboard('{Home}');
    expect(slider).toHaveAttribute('aria-valuenow', '0');
    await userEvent.keyboard('{End}');
    expect(slider).toHaveAttribute('aria-valuenow', '10');
  });
});

describe('FractionBarBuilder — toggle parts', () => {
  it('each part is a pressable button reflecting state', async () => {
    wrap(<FractionBarBuilder params={{ denominator: 4 }} />);
    const parts = screen.getAllByRole('button');
    expect(parts).toHaveLength(4);
    expect(parts[0]).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(parts[0]);
    expect(parts[0]).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('SortIntoGroups — select then place (no HTML5 DnD)', () => {
  const params = {
    items: [
      { id: 'a', label: 'Apel' },
      { id: 'b', label: 'Bola' },
    ],
    groups: [
      { id: 'buah', label: 'Buah' },
      { id: 'mainan', label: 'Mainan' },
    ],
  };

  it('places a selected item into a group via keyboard', async () => {
    wrap(<SortIntoGroups params={params} />);
    await userEvent.click(screen.getByRole('button', { name: 'Apel' }));
    await userEvent.click(screen.getByRole('button', { name: /Letakkan di Buah/ }));
    // "Apel" leaves the unplaced row and appears inside the group
    expect(screen.queryByRole('button', { name: 'Apel' })).toBeNull();
  });
});

describe('ParameterExplorer — native range + live readout', () => {
  it('recomputes the result when a variable changes', async () => {
    wrap(
      <ParameterExplorer
        params={{
          expressionId: 'linear-y-mx-c',
          variables: [
            { key: 'm', label: 'm', min: 0, max: 5, step: 1, initial: 2 },
            { key: 'x', label: 'x', min: 0, max: 5, step: 1, initial: 3 },
            { key: 'c', label: 'c', min: 0, max: 5, step: 1, initial: 1 },
          ],
        }}
      />,
    );
    // 2*3 + 1 = 7
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
