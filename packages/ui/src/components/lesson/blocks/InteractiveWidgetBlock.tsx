'use client';

import React, { Suspense } from 'react';
import { resolveWidget } from '../../interactive/registry';
import { UnsupportedWidgetFallback } from '../UnsupportedWidgetFallback';
import { SkeletonState } from '../../states/SkeletonState';

export interface InteractiveWidgetBlockProps {
  widgetType: string;
  params: unknown;
  /** Static explanation carried by the block, shown by the fallback. */
  fallbackNote?: string;
  onInteract?: () => void;
}

/**
 * Feature 010 / FR-002, FR-009, FR-006a (T087). Resolves a widget from the registry,
 * validates its params against the catalog schema, and renders the component — or a
 * graceful fallback for unknown / deprecated / invalid widgets. Never throws. The
 * widget itself is a React.lazy chunk (see registry.ts); <Suspense> shows a
 * SkeletonState while that chunk loads instead of blocking the rest of the lesson.
 */
export const InteractiveWidgetBlock: React.FC<InteractiveWidgetBlockProps> = ({
  widgetType,
  params,
  fallbackNote,
  onInteract,
}) => {
  const entry = resolveWidget(widgetType);
  if (!entry || entry.supportStatus !== 'SUPPORTED') {
    return <UnsupportedWidgetFallback note={fallbackNote} />;
  }

  const parsed = entry.paramsSchema.safeParse(params);
  if (!parsed.success) {
    return <UnsupportedWidgetFallback note={fallbackNote} />;
  }

  const Widget = entry.component;
  return (
    <Suspense fallback={<SkeletonState variant="generic" />}>
      <Widget params={parsed.data as never} onInteract={onInteract} />
    </Suspense>
  );
};
