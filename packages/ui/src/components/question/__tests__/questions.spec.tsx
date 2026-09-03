import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { I18nProvider } from '../../../providers/i18n-provider';
import { DragDropGroupingQuestion } from '../DragDropGroupingQuestion';
import { NumberLinePlacementQuestion } from '../NumberLinePlacementQuestion';
import { InteractiveFeedback } from '../InteractiveFeedback';

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
  installMatchMedia(false);
});

describe('DragDropGroupingQuestion — select then place (no HTML5 DnD)', () => {
  const items = [
    { id: 'it_1', label: '1/2' },
    { id: 'it_2', label: '2/4' },
    { id: 'it_3', label: '1/3' },
  ];
  const groups = [
    { id: 'grp_half', label: 'Senilai setengah' },
    { id: 'grp_other', label: 'Tidak senilai setengah' },
  ];

  it('places an item into a group via click (select item, then click group)', async () => {
    const onPlacementsChange = vi.fn();
    wrap(
      <DragDropGroupingQuestion
        items={items}
        groups={groups}
        placements={{}}
        onPlacementsChange={onPlacementsChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '1/2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Letakkan di Senilai setengah' }));

    expect(onPlacementsChange).toHaveBeenCalledWith({ it_1: 'grp_half' });
  });

  it('is fully keyboard operable (Tab + Enter, no pointer events required)', async () => {
    const onPlacementsChange = vi.fn();
    wrap(
      <DragDropGroupingQuestion
        items={items}
        groups={groups}
        placements={{}}
        onPlacementsChange={onPlacementsChange}
      />,
    );

    const itemButton = screen.getByRole('button', { name: '1/2' });
    itemButton.focus();
    await userEvent.keyboard('{Enter}');
    const groupButton = screen.getByRole('button', { name: 'Letakkan di Senilai setengah' });
    groupButton.focus();
    await userEvent.keyboard('{Enter}');

    expect(onPlacementsChange).toHaveBeenCalledWith({ it_1: 'grp_half' });
  });

  it('announces placement via an aria-live region', async () => {
    wrap(
      <DragDropGroupingQuestion
        items={items}
        groups={groups}
        placements={{}}
        onPlacementsChange={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: '1/2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Letakkan di Senilai setengah' }));
    expect(screen.getByText(/dipindahkan ke/i)).toBeInTheDocument();
  });

  it('clicking a placed item returns it to the unplaced pool', async () => {
    const onPlacementsChange = vi.fn();
    wrap(
      <DragDropGroupingQuestion
        items={items}
        groups={groups}
        placements={{ it_1: 'grp_half' }}
        onPlacementsChange={onPlacementsChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: '1/2' }));
    expect(onPlacementsChange).toHaveBeenCalledWith({});
  });

  it('disables interaction when disabled', async () => {
    wrap(
      <DragDropGroupingQuestion
        items={items}
        groups={groups}
        placements={{}}
        onPlacementsChange={() => {}}
        disabled
      />,
    );
    expect(screen.getByRole('button', { name: '1/2' })).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = wrap(
      <DragDropGroupingQuestion
        items={items}
        groups={groups}
        placements={{ it_1: 'grp_half' }}
        onPlacementsChange={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('colors a wrongly-placed item as incorrect once graded', () => {
    wrap(
      <DragDropGroupingQuestion
        items={items}
        groups={groups}
        placements={{ it_1: 'grp_other' }}
        onPlacementsChange={() => {}}
        disabled
        correctMapping={{ it_1: 'grp_half' }}
      />,
    );
    expect(screen.getByRole('button', { name: '1/2' })).toHaveClass('bg-rose-100');
  });
});

describe('NumberLinePlacementQuestion — slider semantics', () => {
  it('is a slider with correct ARIA values and arrow/Home/End/PageUp/PageDown control', async () => {
    const onChange = vi.fn();
    wrap(
      <NumberLinePlacementQuestion min={-10} max={10} step={1} value={0} onChange={onChange} />,
    );
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '0');

    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(1);
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(-1);
    await userEvent.keyboard('{PageUp}');
    expect(onChange).toHaveBeenLastCalledWith(10);
    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith(-10);
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it('is not focusable when disabled', () => {
    wrap(
      <NumberLinePlacementQuestion min={0} max={10} step={1} value={5} onChange={() => {}} disabled />,
    );
    expect(screen.getByRole('slider')).toHaveAttribute('tabIndex', '-1');
  });

  it('has no axe violations', async () => {
    const { container } = wrap(
      <NumberLinePlacementQuestion min={0} max={10} step={1} value={5} onChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders markers and a green marker + green dot once graded correctly', () => {
    const { container } = wrap(
      <NumberLinePlacementQuestion
        min={0}
        max={10}
        step={1}
        markers={[0, 5, 10]}
        value={5}
        onChange={() => {}}
        disabled
        targetValue={5}
      />,
    );
    expect(screen.getByText('5', { selector: 'span.tabular-nums' })).toBeInTheDocument();
    expect(container.querySelector('.border-emerald-700')).not.toBeNull();
  });

  it('shows a rose dot when the graded value misses the target', () => {
    const { container } = wrap(
      <NumberLinePlacementQuestion min={0} max={10} step={1} value={3} onChange={() => {}} disabled targetValue={7} />,
    );
    expect(container.querySelector('.border-rose-700')).not.toBeNull();
  });
});

describe('InteractiveFeedback — correct/incorrect states (FR-020, FR-023)', () => {
  it('renders nothing when idle', () => {
    const { container } = wrap(<InteractiveFeedback state="idle" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('correct state pairs an icon with text, not color alone', () => {
    wrap(<InteractiveFeedback state="correct" explanation="Karena..." />);
    expect(screen.getByText(/tepat sekali/i)).toBeInTheDocument();
    expect(screen.getByText('Karena...')).toBeInTheDocument();
  });

  it('incorrect state offers a hint request and shows the explanation', async () => {
    const onRequestHint = vi.fn();
    wrap(<InteractiveFeedback state="incorrect" explanation="Coba lagi" onRequestHint={onRequestHint} />);
    expect(screen.getByText(/belum tepat/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /petunjuk/i }));
    expect(onRequestHint).toHaveBeenCalled();
  });

  it('drops the motion class under prefers-reduced-motion for the correct state', () => {
    installMatchMedia(true);
    const { container } = wrap(<InteractiveFeedback state="correct" />);
    expect(container.querySelector('.animate-bounce')).toBeNull();
  });

  it('has no axe violations for either state', async () => {
    const { container: correctContainer } = wrap(<InteractiveFeedback state="correct" />);
    expect(await axe(correctContainer)).toHaveNoViolations();
    const { container: incorrectContainer } = wrap(<InteractiveFeedback state="incorrect" />);
    expect(await axe(incorrectContainer)).toHaveNoViolations();
  });
});
