import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlacementInput } from '../usePlacementInput';

/**
 * Feature 011 / FR-042, FR-043 — one select-then-place state machine shared
 * by tap, drag, and keyboard, so a widget only needs to wire it once.
 * T022 — written before usePlacementInput.ts exists — must fail first (Constitution III).
 */

type KeyDownHandler = (e: { key: string; preventDefault: () => void }) => void;

function fireKeyDown(handler: KeyDownHandler, key: string) {
  const preventDefault = vi.fn();
  handler({ key, preventDefault });
  return preventDefault;
}

describe('usePlacementInput — tap path', () => {
  it('selecting an item then tapping a target calls onPlace(itemId, targetId)', () => {
    const onPlace = vi.fn();
    const { result } = renderHook(() => usePlacementInput(onPlace));

    act(() => result.current.getItemProps('item-1').onClick());
    expect(result.current.selectedId).toBe('item-1');

    act(() => result.current.getTargetProps('target-a').onClick());
    expect(onPlace).toHaveBeenCalledWith('item-1', 'target-a');
    expect(result.current.selectedId).toBeNull();
  });

  it('tapping the same item twice deselects it (toggle) without calling onPlace', () => {
    const onPlace = vi.fn();
    const { result } = renderHook(() => usePlacementInput(onPlace));

    act(() => result.current.getItemProps('item-1').onClick());
    act(() => result.current.getItemProps('item-1').onClick());
    expect(result.current.selectedId).toBeNull();
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('tapping a target with nothing selected does not call onPlace', () => {
    const onPlace = vi.fn();
    const { result } = renderHook(() => usePlacementInput(onPlace));
    act(() => result.current.getTargetProps('target-a').onClick());
    expect(onPlace).not.toHaveBeenCalled();
  });
});

describe('usePlacementInput — keyboard path (identical state machine as tap)', () => {
  it('Enter on an item selects it; Enter on a target places it', () => {
    const onPlace = vi.fn();
    const { result } = renderHook(() => usePlacementInput(onPlace));

    act(() => {
      const pd = fireKeyDown(result.current.getItemProps('item-1').onKeyDown, 'Enter');
      expect(pd).toHaveBeenCalled();
    });
    expect(result.current.selectedId).toBe('item-1');

    act(() => fireKeyDown(result.current.getTargetProps('target-a').onKeyDown, 'Enter'));
    expect(onPlace).toHaveBeenCalledWith('item-1', 'target-a');
  });

  it('Space activates the same as Enter', () => {
    const onPlace = vi.fn();
    const { result } = renderHook(() => usePlacementInput(onPlace));
    act(() => result.current.getItemProps('item-1').onKeyDown({ key: ' ', preventDefault: vi.fn() } as never));
    act(() => result.current.getTargetProps('target-a').onKeyDown({ key: ' ', preventDefault: vi.fn() } as never));
    expect(onPlace).toHaveBeenCalledWith('item-1', 'target-a');
  });

  it('ignores unrelated keys', () => {
    const onPlace = vi.fn();
    const { result } = renderHook(() => usePlacementInput(onPlace));
    act(() => result.current.getItemProps('item-1').onKeyDown({ key: 'Tab', preventDefault: vi.fn() } as never));
    expect(result.current.selectedId).toBeNull();
  });
});

describe('usePlacementInput — drag path (bypasses selection, same onPlace)', () => {
  it('dropping an item on a target calls onPlace directly, without requiring prior selection', () => {
    const onPlace = vi.fn();
    const { result } = renderHook(() => usePlacementInput(onPlace));

    const setData = vi.fn();
    act(() => result.current.getItemProps('item-1').onDragStart({ dataTransfer: { setData } } as never));
    expect(setData).toHaveBeenCalledWith('text/plain', 'item-1');

    const getData = vi.fn().mockReturnValue('item-1');
    act(() =>
      result.current
        .getTargetProps('target-a')
        .onDrop({ preventDefault: vi.fn(), dataTransfer: { getData } } as never),
    );
    expect(onPlace).toHaveBeenCalledWith('item-1', 'target-a');
  });

  it('a drop with no dragged item id is a no-op', () => {
    const onPlace = vi.fn();
    const { result } = renderHook(() => usePlacementInput(onPlace));
    const getData = vi.fn().mockReturnValue('');
    act(() =>
      result.current
        .getTargetProps('target-a')
        .onDrop({ preventDefault: vi.fn(), dataTransfer: { getData } } as never),
    );
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('onDragOver on a target calls preventDefault so the drop is allowed', () => {
    const { result } = renderHook(() => usePlacementInput(vi.fn()));
    const preventDefault = vi.fn();
    act(() => result.current.getTargetProps('target-a').onDragOver({ preventDefault } as never));
    expect(preventDefault).toHaveBeenCalled();
  });
});

describe('usePlacementInput — a11y hooks', () => {
  it('marks the currently selected item aria-pressed=true and others false', () => {
    const { result } = renderHook(() => usePlacementInput(vi.fn()));
    act(() => result.current.getItemProps('item-1').onClick());
    expect(result.current.getItemProps('item-1')['aria-pressed']).toBe(true);
    expect(result.current.getItemProps('item-2')['aria-pressed']).toBe(false);
  });
});
