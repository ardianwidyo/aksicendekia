import type { ComponentType } from 'react';
import { WIDGET_PARAMS_SCHEMAS, WIDGET_CATALOG, type WidgetTypeId } from '@aksicendekia/content-kit';

/** Minimal structural view of a Zod schema — avoids a direct `zod` dep in packages/ui. */
export interface ParamsSchema {
  safeParse: (value: unknown) => { success: boolean; data?: unknown; error?: unknown };
}
import { StepRevealExplainer } from './StepRevealExplainer';
import { ParameterExplorer } from './ParameterExplorer';
import { NumberLineExplorer } from './NumberLineExplorer';
import { FractionBarBuilder } from './FractionBarBuilder';
import { ImageHotspot } from './ImageHotspot';
import { SortIntoGroups } from './SortIntoGroups';
import { AnimatedWorkedExample } from './AnimatedWorkedExample';

export interface InteractiveWidgetProps<TParams = unknown> {
  params: TParams;
  /** Fired on the first meaningful interaction — used to mark the concept walkthrough progressed. */
  onInteract?: () => void;
}

export interface WidgetRegistryEntry {
  id: WidgetTypeId;
  paramsSchema: ParamsSchema;
  component: ComponentType<InteractiveWidgetProps<never>>;
  supportStatus: 'SUPPORTED' | 'DEPRECATED' | 'REMOVED';
}

const COMPONENTS: Record<WidgetTypeId, ComponentType<InteractiveWidgetProps<never>>> = {
  STEP_REVEAL: StepRevealExplainer as ComponentType<InteractiveWidgetProps<never>>,
  PARAMETER_EXPLORER: ParameterExplorer as ComponentType<InteractiveWidgetProps<never>>,
  NUMBER_LINE_EXPLORER: NumberLineExplorer as ComponentType<InteractiveWidgetProps<never>>,
  FRACTION_BAR_BUILDER: FractionBarBuilder as ComponentType<InteractiveWidgetProps<never>>,
  IMAGE_HOTSPOT: ImageHotspot as ComponentType<InteractiveWidgetProps<never>>,
  SORT_INTO_GROUPS: SortIntoGroups as ComponentType<InteractiveWidgetProps<never>>,
  ANIMATED_WORKED_EXAMPLE: AnimatedWorkedExample as ComponentType<InteractiveWidgetProps<never>>,
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
