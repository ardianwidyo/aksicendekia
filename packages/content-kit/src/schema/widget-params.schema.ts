import { z } from 'zod';

/**
 * Interactive widget catalog — parameter schemas (Feature 010 / FR-002, FR-028).
 * contracts/widget-catalog.contract.md §3. Content stores { widgetType, params };
 * engineering owns behaviour + these schemas.
 */

export const WIDGET_TYPE_IDS = [
  'STEP_REVEAL',
  'PARAMETER_EXPLORER',
  'NUMBER_LINE_EXPLORER',
  'FRACTION_BAR_BUILDER',
  'IMAGE_HOTSPOT',
  'SORT_INTO_GROUPS',
  'ANIMATED_WORKED_EXAMPLE',
] as const;
export type WidgetTypeId = (typeof WIDGET_TYPE_IDS)[number];

/** Closed enum of parametric expressions a ParameterExplorer may render — no eval of content strings. */
export const EXPRESSION_IDS = [
  'linear-y-mx-c',
  'proportional-y-kx',
  'area-rectangle',
  'fraction-parts',
] as const;
export type ExpressionId = (typeof EXPRESSION_IDS)[number];

/** Closed enum of code-drawn animations (blocks + worked examples). */
export const ANIMATION_IDS = [
  'count-objects',
  'compare-quantity',
  'shapes-intro',
  'place-value-split',
  'fraction-of-whole',
  'number-line-walk',
  'integer-number-line',
  'ratio-scale',
  'linear-function-slope',
  'sequence-pattern',
] as const;
export type AnimationId = (typeof ANIMATION_IDS)[number];

export const animationStepSchema = z.object({
  atMs: z.number().int().nonnegative(),
  caption: z.string().min(1),
  frame: z.string().min(1),
});
export type AnimationStep = z.infer<typeof animationStepSchema>;

const stepRevealParams = z.object({
  steps: z
    .array(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        illustrationAssetId: z.string().optional(),
      }),
    )
    .min(2)
    .max(8),
  autoAdvance: z.boolean().default(false),
});

const parameterExplorerParams = z.object({
  expressionId: z.enum(EXPRESSION_IDS),
  variables: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        min: z.number(),
        max: z.number(),
        step: z.number().positive(),
        initial: z.number(),
      }),
    )
    .min(1)
    .max(3),
  showValueReadout: z.boolean().default(true),
});

const numberLineExplorerParams = z
  .object({
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    initial: z.number(),
    markers: z.array(z.number()).max(10).default([]),
    showFractions: z.boolean().default(false),
  })
  .refine((p) => p.max > p.min, { message: 'max harus > min', path: ['max'] })
  .refine((p) => (p.max - p.min) / p.step <= 100, {
    message: '(max - min) / step tidak boleh melebihi 100',
    path: ['step'],
  });

const fractionBarBuilderParams = z.object({
  denominator: z.number().int().min(2).max(12),
  targetFraction: z
    .object({ numerator: z.number().int().nonnegative(), denominator: z.number().int().min(1) })
    .optional(),
  allowCompare: z.boolean().default(false),
});

const imageHotspotParams = z.object({
  mediaAssetId: z.string().min(1),
  hotspots: z
    .array(
      z.object({
        id: z.string().min(1),
        xPercent: z.number().min(0).max(100),
        yPercent: z.number().min(0).max(100),
        label: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .min(1)
    .max(8),
});

const sortIntoGroupsParams = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        illustrationAssetId: z.string().optional(),
      }),
    )
    .min(2)
    .max(12),
  groups: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(2).max(4),
  correctMapping: z.record(z.string()).optional(),
});

const animatedWorkedExampleParams = z.object({
  animationId: z.enum(ANIMATION_IDS),
  steps: z.array(animationStepSchema).min(2).max(12),
  loop: z.boolean().default(false),
  totalDurationMs: z.number().int().positive().max(60_000),
});

/** widgetType → params Zod schema. */
export const WIDGET_PARAMS_SCHEMAS = {
  STEP_REVEAL: stepRevealParams,
  PARAMETER_EXPLORER: parameterExplorerParams,
  NUMBER_LINE_EXPLORER: numberLineExplorerParams,
  FRACTION_BAR_BUILDER: fractionBarBuilderParams,
  IMAGE_HOTSPOT: imageHotspotParams,
  SORT_INTO_GROUPS: sortIntoGroupsParams,
  ANIMATED_WORKED_EXAMPLE: animatedWorkedExampleParams,
} as const satisfies Record<WidgetTypeId, z.ZodTypeAny>;

export function widgetParamsSchemaFor(widgetType: string): z.ZodTypeAny | undefined {
  return (WIDGET_PARAMS_SCHEMAS as Record<string, z.ZodTypeAny>)[widgetType];
}

/** A widget instance as stored in a content block payload. */
export const interactiveWidgetInstanceSchema = z
  .object({
    widgetType: z.enum(WIDGET_TYPE_IDS),
    params: z.record(z.unknown()),
  })
  .superRefine((val, ctx) => {
    const schema = WIDGET_PARAMS_SCHEMAS[val.widgetType];
    const result = schema.safeParse(val.params);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue, path: ['params', ...issue.path] });
      }
    }
  });
export type InteractiveWidgetInstance = z.infer<typeof interactiveWidgetInstanceSchema>;
