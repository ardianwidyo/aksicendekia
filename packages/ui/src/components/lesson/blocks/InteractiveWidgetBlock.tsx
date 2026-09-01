'use client';

import React from 'react';
import { resolveWidget } from '../../interactive/registry';
import { UnsupportedWidgetFallback } from '../UnsupportedWidgetFallback';

export interface InteractiveWidgetBlockProps {
  widgetType: string;
  params: unknown;
  /** Static explanation carried by the block, shown by the fallback. */
  fallbackNote?: string;
  onInteract?: () => void;
}

/**
 * Feature 010 / FR-002, FR-009. Resolves a widget from the registry, validates
 * its params against the catalog schema, and renders the component — or a
 * graceful fallback for unknown / deprecated / invalid widgets. Never throws.
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
  return <Widget params={parsed.data as never} onInteract={onInteract} />;
};
