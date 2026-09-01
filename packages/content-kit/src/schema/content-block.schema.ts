import { z } from 'zod';
import { animationStepSchema, ANIMATION_IDS, interactiveWidgetInstanceSchema } from './widget-params.schema.js';

/**
 * Lesson content block — Feature 010 / FR-001 / data-model.md §3.2.
 * The body of an interactive lesson is an ordered list of these.
 */

export const CONTENT_BLOCK_TYPES = [
  'RICH_TEXT',
  'ILLUSTRATION',
  'ANIMATION',
  'VIDEO',
  'INTERACTIVE_WIDGET',
] as const;
export type ContentBlockType = (typeof CONTENT_BLOCK_TYPES)[number];

const richTextPayload = z.object({
  blockType: z.literal('RICH_TEXT'),
  markdown: z.string().min(1),
});

const illustrationPayload = z.object({
  blockType: z.literal('ILLUSTRATION'),
  mediaAssetId: z.string().min(1),
  altText: z.string().min(1),
  caption: z.string().optional(),
});

const animationPayload = z.object({
  blockType: z.literal('ANIMATION'),
  animationId: z.enum(ANIMATION_IDS),
  steps: z.array(animationStepSchema).min(1),
  loop: z.boolean().default(false),
  transcriptText: z.string().min(1),
  fallbackAssetId: z.string().min(1),
});

const videoPayload = z.object({
  blockType: z.literal('VIDEO'),
  title: z.string().min(1),
  mediaAssetId: z.string().min(1),
  captionAssetId: z.string().min(1),
  transcriptText: z.string().min(1),
  fallbackAssetId: z.string().min(1),
});

const interactiveWidgetPayload = z.object({
  blockType: z.literal('INTERACTIVE_WIDGET'),
  widget: interactiveWidgetInstanceSchema,
});

/** Discriminated union on blockType — companion-field requirements are baked in per branch. */
export const contentBlockPayloadSchema = z.discriminatedUnion('blockType', [
  richTextPayload,
  illustrationPayload,
  animationPayload,
  videoPayload,
  interactiveWidgetPayload,
]);
export type ContentBlockPayload = z.infer<typeof contentBlockPayloadSchema>;

/** A positioned block within a lesson. narrationText is required for TK (gate A8, enforced elsewhere). */
export const contentBlockSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  payload: contentBlockPayloadSchema,
  narrationText: z.string().min(1).nullable().optional(),
  narrationAssetId: z.string().nullable().optional(),
});
export type ContentBlock = z.infer<typeof contentBlockSchema>;

export function isConceptBlock(block: ContentBlock): boolean {
  return block.payload.blockType === 'ILLUSTRATION' || block.payload.blockType === 'ANIMATION';
}

export function isWidgetBlock(block: ContentBlock): boolean {
  return block.payload.blockType === 'INTERACTIVE_WIDGET';
}
