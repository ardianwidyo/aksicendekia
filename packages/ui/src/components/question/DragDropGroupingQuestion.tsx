'use client';

import React, { useState } from 'react';
import { useI18n } from '../../providers/i18n-provider';

export interface DragDropGroupingItem {
  id: string;
  label: string;
  illustrationAssetId?: string | null;
}

export interface DragDropGroupingGroup {
  id: string;
  label: string;
}

export interface DragDropGroupingQuestionProps {
  items: DragDropGroupingItem[];
  groups: DragDropGroupingGroup[];
  placements: Record<string, string>;
  onPlacementsChange: (placements: Record<string, string>) => void;
  disabled?: boolean;
  /** Only provided once the answer has been graded, to color placements. */
  correctMapping?: Record<string, string>;
}

/**
 * Keyboard-first select-then-place (contracts/widget-catalog.contract.md R5,
 * contracts/interactive-questions.contract.md §2). HTML5 drag-and-drop is
 * deliberately NOT used — a placed item can be reselected and moved again,
 * or clicked to return to the unplaced pool, until the answer is submitted.
 */
export const DragDropGroupingQuestion: React.FC<DragDropGroupingQuestionProps> = ({
  items,
  groups,
  placements,
  onPlacementsChange,
  disabled = false,
  correctMapping,
}) => {
  const { t } = useI18n();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const unplaced = items.filter((it) => !placements[it.id]);
  const isGraded = Boolean(correctMapping);

  const selectItem = (itemId: string): void => {
    if (disabled) return;
    setSelectedItemId((cur) => (cur === itemId ? null : itemId));
  };

  const placeIn = (groupId: string): void => {
    if (disabled || !selectedItemId) return;
    const item = items.find((it) => it.id === selectedItemId);
    const group = groups.find((g) => g.id === groupId);
    onPlacementsChange({ ...placements, [selectedItemId]: groupId });
    setAnnouncement(t('interactive.widget.sort.movedTo', { item: item?.label ?? '', group: group?.label ?? '' }));
    setSelectedItemId(null);
  };

  const unplace = (itemId: string): void => {
    if (disabled) return;
    const { [itemId]: _removed, ...rest } = placements;
    onPlacementsChange(rest);
    setSelectedItemId(null);
  };

  return (
    <div className="space-y-4">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('interactive.widget.sort.unplaced')}>
        {unplaced.map((it) => (
          <button
            key={it.id}
            type="button"
            aria-pressed={selectedItemId === it.id}
            disabled={disabled}
            onClick={() => selectItem(it.id)}
            className={`min-h-11 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 ${
              selectedItemId === it.id
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            {it.label}
          </button>
        ))}
        {unplaced.length === 0 && <span className="text-sm text-slate-400">—</span>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => {
          const contents = items.filter((it) => placements[it.id] === g.id);
          return (
            <div
              key={g.id}
              className="min-h-24 rounded-lg border-2 border-dashed border-slate-300 p-3 text-left"
            >
              <button
                type="button"
                disabled={disabled || !selectedItemId}
                onClick={() => placeIn(g.id)}
                aria-label={t('interactive.widget.sort.placeIn', { group: g.label })}
                className="mb-2 block text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-default"
              >
                {g.label}
              </button>
              <div className="flex flex-wrap gap-1">
                {contents.map((it) => {
                  const isCorrect = isGraded ? correctMapping?.[it.id] === g.id : undefined;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => unplace(it.id)}
                      className={`rounded px-2 py-1 text-xs font-medium disabled:cursor-default ${
                        isGraded
                          ? isCorrect
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                            : 'bg-rose-100 text-rose-800 border border-rose-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {it.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
