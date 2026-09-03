import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { I18nProvider } from '../../../providers/i18n-provider';
import { resolveWidget, WIDGET_REGISTRY } from '../registry';
import { StepRevealExplainer } from '../StepRevealExplainer';
import { NumberLineExplorer } from '../NumberLineExplorer';
import { FractionBarBuilder } from '../FractionBarBuilder';
import { SortIntoGroups } from '../SortIntoGroups';
import { ParameterExplorer } from '../ParameterExplorer';
import { ImageHotspot } from '../ImageHotspot';
import { AnimatedWorkedExample } from '../AnimatedWorkedExample';

const wrap = (ui: React.ReactElement) => render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

describe('widget registry', () => {
  it('exposes all 7 catalog widgets as SUPPORTED with a component + schema', () => {
    expect(Object.keys(WIDGET_REGISTRY)).toHaveLength(7);
    for (const entry of Object.values(WIDGET_REGISTRY)) {
      expect(entry.supportStatus).toBe('SUPPORTED');
      // Each widget is a React.lazy chunk (T087) — not a plain function component.
      expect(entry.component).toBeTruthy();
      expect((entry.component as unknown as { $$typeof: symbol }).$$typeof.toString()).toContain('lazy');
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

  it('advances with Space and clicking the Next/Prev buttons', async () => {
    wrap(<StepRevealExplainer params={params} />);
    await userEvent.click(screen.getByRole('button', { name: /Langkah berikutnya/ }));
    expect(screen.getByText('Dua')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Langkah sebelumnya/ }));
    expect(screen.getByText('Satu')).toBeInTheDocument();

    const group = screen.getByRole('group');
    group.focus();
    await userEvent.keyboard(' ');
    expect(screen.getByText('Dua')).toBeInTheDocument();
  });

  it('does not go past the first step on Backspace (clamped, no-op)', async () => {
    const onInteract = vi.fn();
    wrap(<StepRevealExplainer params={params} onInteract={onInteract} />);
    const group = screen.getByRole('group');
    group.focus();
    await userEvent.keyboard('{Backspace}');
    expect(screen.getByText('Satu')).toBeInTheDocument();
    expect(onInteract).not.toHaveBeenCalled();
  });

  it('does not go past the last step on Enter (clamped, no-op)', async () => {
    const onInteract = vi.fn();
    wrap(<StepRevealExplainer params={{ steps: [{ title: 'Satu', body: 'a' }] }} onInteract={onInteract} />);
    const group = screen.getByRole('group');
    group.focus();
    await userEvent.keyboard('{Enter}');
    expect(onInteract).not.toHaveBeenCalled();
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

  it('moves by a bigger step on PageUp/PageDown and by one on ArrowLeft/ArrowDown', async () => {
    wrap(<NumberLineExplorer params={params} />);
    const slider = screen.getByRole('slider');
    slider.focus();
    await userEvent.keyboard('{PageUp}');
    expect(slider).toHaveAttribute('aria-valuenow', '10');
    await userEvent.keyboard('{PageDown}');
    expect(slider).toHaveAttribute('aria-valuenow', '0');
    await userEvent.keyboard('{ArrowUp}');
    expect(slider).toHaveAttribute('aria-valuenow', '1');
    await userEvent.keyboard('{ArrowDown}');
    expect(slider).toHaveAttribute('aria-valuenow', '0');
  });

  it('ignores unrelated keys and clamps at the configured bounds', async () => {
    wrap(<NumberLineExplorer params={{ min: 0, max: 2, step: 1, initial: 2 }} />);
    const slider = screen.getByRole('slider');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '2');
    await userEvent.keyboard('a');
    expect(slider).toHaveAttribute('aria-valuenow', '2');
  });
});

describe('AnimatedWorkedExample — play/pause, manual step, replay', () => {
  const params = {
    animationId: 'count-objects',
    steps: [
      { atMs: 0, caption: 'Satu', frame: 'f0' },
      { atMs: 400, caption: 'Dua', frame: 'f1' },
    ],
    totalDurationMs: 1000,
  };

  it('advances to the next step and back to the start via manual controls', async () => {
    wrap(<AnimatedWorkedExample params={params} />);
    expect(screen.getByText('Satu')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Bagian 1 dari 2/ }));
    expect(screen.getByText('Dua')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Ulang/ }));
    expect(screen.getByText('Satu')).toBeInTheDocument();
  });

  it('auto-pauses immediately when playback starts already at the last step (no loop)', () => {
    // A single-step animation is "already at the last step" the instant Play is
    // pressed, exercising the loop:false branch synchronously (no timer needed).
    const oneStepParams = { ...params, steps: [params.steps[0]] };
    wrap(<AnimatedWorkedExample params={oneStepParams} />);
    act(() => {
      screen.getByRole('button', { name: /Putar/ }).click();
    });
    expect(screen.getByRole('button', { name: /Putar/ })).toBeInTheDocument();
  });

  it('keeps playing past the last step when loop is true (does not auto-pause)', async () => {
    vi.useFakeTimers();
    try {
      wrap(<AnimatedWorkedExample params={{ ...params, loop: true }} />);
      act(() => { screen.getByRole('button', { name: /Putar/ }).click(); });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(screen.getByText('Dua')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Jeda/ })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders a labelled placeholder frame when no renderFrame is supplied', () => {
    wrap(<AnimatedWorkedExample params={params} />);
    expect(screen.getByText('f0')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = wrap(<AnimatedWorkedExample params={params} />);
    expect(await axe(container)).toHaveNoViolations();
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

  it('deselects an item when clicked twice', async () => {
    wrap(<SortIntoGroups params={params} />);
    const apel = screen.getByRole('button', { name: 'Apel' });
    await userEvent.click(apel);
    expect(apel).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(apel);
    expect(apel).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows a placeholder once every item has been placed', async () => {
    wrap(<SortIntoGroups params={params} />);
    await userEvent.click(screen.getByRole('button', { name: 'Apel' }));
    await userEvent.click(screen.getByRole('button', { name: /Letakkan di Buah/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Bola' }));
    await userEvent.click(screen.getByRole('button', { name: /Letakkan di Mainan/ }));
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('ImageHotspot — real <button> hotspots in Tab order', () => {
  const params = {
    mediaAssetId: 'asset-1',
    imageUrl: '/assets/lessons/sd-01/diagram.svg',
    imageAlt: 'Diagram pecahan',
    hotspots: [
      { id: 'h1', xPercent: 20, yPercent: 30, label: 'Pembilang', body: 'Angka di atas garis pecahan.' },
      { id: 'h2', xPercent: 60, yPercent: 70, label: 'Penyebut', body: 'Angka di bawah garis pecahan.' },
    ],
  };

  it('opens and closes the explanation panel, toggling aria-expanded', async () => {
    wrap(<ImageHotspot params={params} />);
    const first = screen.getByRole('button', { name: /Pembilang/ });
    expect(first).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Angka di atas garis pecahan.');

    await userEvent.click(screen.getByRole('button', { name: /Tutup/ }));
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('fires onInteract on the first hotspot click', async () => {
    const onInteract = vi.fn();
    wrap(<ImageHotspot params={params} onInteract={onInteract} />);
    await userEvent.click(screen.getByRole('button', { name: /Penyebut/ }));
    expect(onInteract).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const { container } = wrap(<ImageHotspot params={params} />);
    expect(await axe(container)).toHaveNoViolations();
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

  it('recomputes and fires onInteract when a slider changes', () => {
    const onInteract = vi.fn();
    wrap(
      <ParameterExplorer
        params={{
          expressionId: 'proportional-y-kx',
          variables: [
            { key: 'k', label: 'k', min: 0, max: 5, step: 1, initial: 2 },
            { key: 'x', label: 'x', min: 0, max: 5, step: 1, initial: 3 },
          ],
        }}
        onInteract={onInteract}
      />,
    );
    expect(screen.getByText('6')).toBeInTheDocument();

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '4' } });

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(onInteract).toHaveBeenCalledTimes(1);
  });

  it('computes fraction-parts, including the divide-by-zero guard', () => {
    wrap(
      <ParameterExplorer
        params={{
          expressionId: 'fraction-parts',
          variables: [
            { key: 'n', label: 'n', min: 0, max: 5, step: 1, initial: 3 },
            { key: 'd', label: 'd', min: 0, max: 5, step: 1, initial: 4 },
          ],
        }}
      />,
    );
    expect(screen.getByText('0.75')).toBeInTheDocument();

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], { target: { value: '0' } });
    expect(screen.getByText('0', { selector: 'p' })).toBeInTheDocument();
  });

  it('falls back to a constant 0 for an unrecognized expressionId', () => {
    wrap(
      <ParameterExplorer
        params={{
          expressionId: 'not-a-real-expression' as never,
          variables: [{ key: 'x', label: 'x', min: 0, max: 5, step: 1, initial: 3 }],
        }}
      />,
    );
    expect(screen.getByText('0', { selector: 'p' })).toBeInTheDocument();
  });

  it('hides the readout when showValueReadout is false', () => {
    wrap(
      <ParameterExplorer
        params={{
          expressionId: 'area-rectangle',
          variables: [{ key: 'w', label: 'w', min: 0, max: 5, step: 1, initial: 3 }],
          showValueReadout: false,
        }}
      />,
    );
    expect(screen.queryByText('interactive.widget.parameterExplorer.readout')).not.toBeInTheDocument();
  });
});
