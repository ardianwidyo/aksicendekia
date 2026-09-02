import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { WIDGET_PARAMS_SCHEMAS, WIDGET_CATALOG, type WidgetTypeId } from '@aksicendekia/content-kit';

/** Minimal structural view of a Zod schema — avoids a direct `zod` dep in packages/ui. */
export interface ParamsSchema {
  safeParse: (value: unknown) => { success: boolean; data?: unknown; error?: unknown };
}

export interface InteractiveWidgetProps<TParams = unknown> {
  params: TParams;
  /** Fired on the first meaningful interaction — used to mark the concept walkthrough progressed. */
  onInteract?: () => void;
}

export interface WidgetRegistryEntry {
  id: WidgetTypeId;
  paramsSchema: ParamsSchema;
  component: LazyExoticComponent<ComponentType<InteractiveWidgetProps<never>>>;
  supportStatus: 'SUPPORTED' | 'DEPRECATED' | 'REMOVED';
}

/**
 * Feature 010 / T087 (SC-004, SC-006) — every widget is its own `React.lazy` chunk so a
 * lesson only ships the JS for the widget types it actually uses, not all 7. Plain
 * `React.lazy` (not `next/dynamic`) is deliberate: packages/ui has no dependency on
 * Next.js elsewhere, and webpack code-splits a dynamic `import()` the same way either
 * API does — InteractiveWidgetBlock wraps the render in <Suspense> with a SkeletonState.
 */
const COMPONENTS: Record<WidgetTypeId, LazyExoticComponent<ComponentType<InteractiveWidgetProps<never>>>> = {
  STEP_REVEAL: lazy(() => import('./StepRevealExplainer').then((m) => ({ default: m.StepRevealExplainer }))) as never,
  PARAMETER_EXPLORER: lazy(() => import('./ParameterExplorer').then((m) => ({ default: m.ParameterExplorer }))) as never,
  NUMBER_LINE_EXPLORER: lazy(() => import('./NumberLineExplorer').then((m) => ({ default: m.NumberLineExplorer }))) as never,
  FRACTION_BAR_BUILDER: lazy(() => import('./FractionBarBuilder').then((m) => ({ default: m.FractionBarBuilder }))) as never,
  IMAGE_HOTSPOT: lazy(() => import('./ImageHotspot').then((m) => ({ default: m.ImageHotspot }))) as never,
  SORT_INTO_GROUPS: lazy(() => import('./SortIntoGroups').then((m) => ({ default: m.SortIntoGroups }))) as never,
  ANIMATED_WORKED_EXAMPLE: lazy(() =>
    import('./AnimatedWorkedExample').then((m) => ({ default: m.AnimatedWorkedExample })),
  ) as never,
};

export const WIDGET_REGISTRY: Readonly<Record<string, WidgetRegistryEntry>> = Object.fromEntries(
  WIDGET_CATALOG.map((entry) => [
    entry.id,
    {
      id: entry.id,
      paramsSchema: WIDGET_PARAMS_SCHEMAS[entry.id] as unknown as ParamsSchema,
      component: COMPONENTS[entry.id],
      supportStatus: entry.supportStatus,
    } satisfies WidgetRegistryEntry,
  ]),
);

export function resolveWidget(widgetType: string): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY[widgetType];
}
