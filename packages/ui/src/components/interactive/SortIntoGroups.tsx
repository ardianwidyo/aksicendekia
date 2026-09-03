'use client';

import React, { useMemo, useState } from 'react';
import { useI18n } from '../../providers/i18n-provider';
import type { InteractiveWidgetProps } from './registry';
import { usePlacementInput } from './usePlacementInput';

export interface SortIntoGroupsParams {
  items: Array<{ id: string; label: string; illustrationAssetId?: string }>;
  groups: Array<{ id: string; label: string }>;
  correctMapping?: Record<string, string>;
}

/**
 * Select-then-place (contracts/widget-catalog.contract.md R5). Feature 011 /
 * T098 — tap, keyboard, and drag all funnel through the one `usePlacementInput`
 * state machine so the three modalities cannot drift apart.
 */
export const SortIntoGroups: React.FC<InteractiveWidgetProps<SortIntoGroupsParams>> = ({
  params,
  onInteract,
}) => {
  const { t } = useI18n();
  const items = params.items ?? [];
  const groups = params.groups ?? [];
  const [placement, setPlacement] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState('');

  const { selectedId, getItemProps, getTargetProps } = usePlacementInput((itemId, groupId) => {
    const item = items.find((it) => it.id === itemId);
    const group = groups.find((g) => g.id === groupId);
    setPlacement((prev) => ({ ...prev, [itemId]: groupId }));
    setAnnouncement(
      t('interactive.widget.sort.movedTo', { item: item?.label ?? '', group: group?.label ?? '' }),
    );
    onInteract?.();
  });

  const unplaced = useMemo(() => items.filter((it) => !placement[it.id]), [items, placement]);

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('interactive.widget.sort.unplaced')}>
        {unplaced.map((it) => {
          const props = getItemProps(it.id);
          return (
            <button
              key={it.id}
              type="button"
              {...props}
              className={`min-h-11 rounded-lg border-2 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                selectedId === it.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              {it.label}
            </button>
          );
        })}
        {unplaced.length === 0 && <span className="text-sm text-slate-400">—</span>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {groups.map((g) => {
          const contents = items.filter((it) => placement[it.id] === g.id);
          const props = getTargetProps(g.id);
          return (
            <button
              key={g.id}
              type="button"
              {...props}
              disabled={!selectedId}
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
