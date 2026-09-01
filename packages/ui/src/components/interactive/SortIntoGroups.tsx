'use client';

import React, { useMemo, useState } from 'react';
import { useI18n } from '../../providers/i18n-provider';
import type { InteractiveWidgetProps } from './registry';

export interface SortIntoGroupsParams {
  items: Array<{ id: string; label: string; illustrationAssetId?: string }>;
  groups: Array<{ id: string; label: string }>;
  correctMapping?: Record<string, string>;
}

/**
 * Keyboard-first select-then-place (contracts/widget-catalog.contract.md R5).
 * HTML5 drag-and-drop is deliberately NOT used.
 */
export const SortIntoGroups: React.FC<InteractiveWidgetProps<SortIntoGroupsParams>> = ({
  params,
  onInteract,
}) => {
  const { t } = useI18n();
  const items = params.items ?? [];
  const groups = params.groups ?? [];
  const [placement, setPlacement] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const unplaced = useMemo(() => items.filter((it) => !placement[it.id]), [items, placement]);

  const place = (groupId: string): void => {
    if (!selectedItemId) return;
    const item = items.find((it) => it.id === selectedItemId);
    const group = groups.find((g) => g.id === groupId);
    setPlacement((prev) => ({ ...prev, [selectedItemId]: groupId }));
    setSelectedItemId(null);
    setAnnouncement(t('interactive.widget.sort.movedTo', { item: item?.label ?? '', group: group?.label ?? '' }));
    onInteract?.();
  };

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('interactive.widget.sort.unplaced')}>
        {unplaced.map((it) => (
          <button
            key={it.id}
            type="button"
            aria-pressed={selectedItemId === it.id}
            onClick={() => setSelectedItemId((cur) => (cur === it.id ? null : it.id))}
            className={`min-h-11 rounded-lg border-2 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {groups.map((g) => {
          const contents = items.filter((it) => placement[it.id] === g.id);
          return (
            <button
              key={g.id}
              type="button"
              disabled={!selectedItemId}
              onClick={() => place(g.id)}
              aria-label={t('interactive.widget.sort.placeIn', { group: g.label })}
              className="min-h-24 rounded-lg border-2 border-dashed border-slate-300 p-3 text-left disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="text-sm font-semibold text-slate-700">{g.label}</span>
              <span className="mt-2 flex flex-wrap gap-1">
                {contents.map((it) => (
                  <span key={it.id} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {it.label}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
