'use client';

import { useCallback, useState } from 'react';

/**
 * Feature 011 / FR-042, FR-043 — one select-then-place state machine shared
 * by tap, drag, and keyboard.
 *
 * FR-025 already requires every lesson to be keyboard-completable; the
 * keyboard shape for placing an object ("select the item, then select the
 * destination") is mechanically identical to tap-to-place. This hook lifts
 * that one state machine so a widget wires it once and gets all three input
 * modalities, instead of building tap and keyboard as separate paths that
 * can drift apart. Drag bypasses the `selectedId` step entirely (a drop
 * always carries its own item id) but still funnels into the same `onPlace`
 * callback, so grading logic never has to know which modality was used.
 */

export interface UsePlacementInputResult {
  /** The item currently awaiting a target, or null when nothing is selected. */
  selectedId: string | null;
  /** Clear or force the current selection (e.g. after an out-of-band change like un-placing). */
  setSelectedId: (id: string | null) => void;
  getItemProps: (itemId: string) => {
    'aria-pressed': boolean;
    onClick: () => void;
    onKeyDown: (e: { key: string; preventDefault: () => void }) => void;
    draggable: true;
    onDragStart: (e: { dataTransfer: { setData: (format: string, data: string) => void } }) => void;
  };
  getTargetProps: (targetId: string) => {
    onClick: () => void;
    onKeyDown: (e: { key: string; preventDefault: () => void }) => void;
    onDragOver: (e: { preventDefault: () => void }) => void;
    onDrop: (e: {
      preventDefault: () => void;
      dataTransfer: { getData: (format: string) => string };
    }) => void;
  };
}

const ACTIVATION_KEYS = new Set(['Enter', ' ']);

export function usePlacementInput(
  onPlace: (itemId: string, targetId: string) => void,
): UsePlacementInputResult {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectItem = useCallback((itemId: string) => {
    setSelectedId((prev) => (prev === itemId ? null : itemId));
  }, []);

  const placeAt = useCallback(
    (targetId: string) => {
      setSelectedId((prev) => {
        if (prev) onPlace(prev, targetId);
        return null;
      });
    },
    [onPlace],
  );

  const getItemProps = useCallback(
    (itemId: string) => ({
      'aria-pressed': selectedId === itemId,
      onClick: () => selectItem(itemId),
      onKeyDown: (e: { key: string; preventDefault: () => void }) => {
        if (!ACTIVATION_KEYS.has(e.key)) return;
        e.preventDefault();
        selectItem(itemId);
      },
      draggable: true as const,
      onDragStart: (e: { dataTransfer: { setData: (format: string, data: string) => void } }) => {
        e.dataTransfer.setData('text/plain', itemId);
      },
    }),
    [selectedId, selectItem],
  );

  const getTargetProps = useCallback(
    (targetId: string) => ({
      onClick: () => placeAt(targetId),
      onKeyDown: (e: { key: string; preventDefault: () => void }) => {
        if (!ACTIVATION_KEYS.has(e.key)) return;
        e.preventDefault();
        placeAt(targetId);
      },
      onDragOver: (e: { preventDefault: () => void }) => e.preventDefault(),
      onDrop: (e: {
        preventDefault: () => void;
        dataTransfer: { getData: (format: string) => string };
      }) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        if (itemId) onPlace(itemId, targetId);
        setSelectedId(null);
      },
    }),
    [onPlace, placeAt],
  );

  return { selectedId, setSelectedId, getItemProps, getTargetProps };
}
