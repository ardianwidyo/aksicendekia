import { z } from "zod";
import { EducationStage, CurriculumPhase } from "@prisma/client";
import { widgetParamsSchemaFor } from "@aksicendekia/content-kit";

/**
 * Admin CMS request/response schemas — contracts/content-blocks.contract.md.
 * Reuses @aksicendekia/content-kit for widget param validation (single source
 * of truth, same rules the public renderer and the seed pipeline rely on).
 */

export const CONTENT_BLOCK_TYPES = ["RICH_TEXT", "ILLUSTRATION", "ANIMATION", "VIDEO", "INTERACTIVE_WIDGET"] as const;
export type ContentBlockTypeLiteral = (typeof CONTENT_BLOCK_TYPES)[number];

const animationStepSchema = z.object({
  atMs: z.number().int().nonnegative(),
  caption: z.string().min(1),
  frame: z.string().min(1),
});

const payloadSchemaByBlockType = {
  RICH_TEXT: z.object({ markdown: z.string().min(1) }),
  ILLUSTRATION: z.object({ caption: z.string().optional() }),
  ANIMATION: z.object({
    animationId: z.string().min(1),
    steps: z.array(animationStepSchema).min(1),
    loop: z.boolean().default(false),
  }),
  VIDEO: z.object({ title: z.string().min(1) }),
  INTERACTIVE_WIDGET: z
    .object({
      // Not z.enum(WIDGET_TYPE_IDS): an unrecognized id must reach the service as a
      // 404 catalog lookup miss (contract §2), not a 400 shape-validation failure.
      widgetType: z.string().min(1),
      params: z.record(z.unknown()),
    })
    .superRefine((val, ctx) => {
      const schema = widgetParamsSchemaFor(val.widgetType);
      if (!schema) return;
      const result = schema.safeParse(val.params);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({ ...issue, path: ["params", ...issue.path] });
        }
      }
    }),
} satisfies Record<ContentBlockTypeLiteral, z.ZodTypeAny>;

/** Companion top-level fields REQUIRED per blockType (data-model.md §3.2 table). */
export const REQUIRED_COMPANION_FIELDS: Record<ContentBlockTypeLiteral, string[]> = {
  RICH_TEXT: [],
  ILLUSTRATION: ["mediaAssetId", "altText"],
  ANIMATION: ["transcriptText"],
  VIDEO: ["mediaAssetId", "captionAssetId", "transcriptText", "fallbackAssetId"],
  INTERACTIVE_WIDGET: [],
};

export type ParseBlockPayloadResult =
  | { success: true; data: unknown }
  | { success: false; reason: "unknown_block_type" }
  | { success: false; reason: "invalid_payload"; error: z.ZodError };

export function parseBlockPayload(blockType: string, payload: unknown): ParseBlockPayloadResult {
  const schema = payloadSchemaByBlockType[blockType as ContentBlockTypeLiteral];
  if (!schema) return { success: false, reason: "unknown_block_type" };
  const result = schema.safeParse(payload);
  if (!result.success) return { success: false, reason: "invalid_payload", error: result.error };
  return { success: true, data: result.data };
}

const companionFieldsSchema = z.object({
  altText: z.string().min(1).nullish(),
  transcriptText: z.string().min(1).nullish(),
  mediaAssetId: z.string().min(1).nullish(),
  captionAssetId: z.string().min(1).nullish(),
  fallbackAssetId: z.string().min(1).nullish(),
  narrationText: z.string().min(1).nullish(),
  narrationAssetId: z.string().min(1).nullish(),
});

export const createContentBlockSchema = z
  .object({
    orderIndex: z.number().int().nonnegative(),
    blockType: z.enum(CONTENT_BLOCK_TYPES),
    payload: z.record(z.unknown()),
  })
  .merge(companionFieldsSchema);
export type CreateContentBlockInput = z.infer<typeof createContentBlockSchema>;

export const updateContentBlockSchema = z
  .object({
    orderIndex: z.number().int().nonnegative().optional(),
    payload: z.record(z.unknown()).optional(),
  })
  .merge(companionFieldsSchema.partial());
export type UpdateContentBlockInput = z.infer<typeof updateContentBlockSchema>;

export const reorderBlocksSchema = z.object({
  orderedBlockIds: z.array(z.string().min(1)).min(1),
});

export const createMediaAssetSchema = z.object({
  kind: z.enum(["IMAGE", "ANIMATION", "VIDEO", "AUDIO", "CAPTION", "TRANSCRIPT"]),
  mimeType: z.string().min(1),
  byteSize: z.number().int().positive(),
  storageKey: z.string().min(1).optional(),
  widthPx: z.number().int().positive().optional(),
  heightPx: z.number().int().positive().optional(),
  durationSeconds: z.number().int().positive().optional(),
  altText: z.string().min(1).optional(),
  licenseNote: z.string().optional(),
  attribution: z.string().optional(),
});
export type CreateMediaAssetInput = z.infer<typeof createMediaAssetSchema>;

export const publishLessonSchema = z.object({
  reviewerNote: z.string().min(1).optional(),
});

const OFFICIAL_SOURCE_HOST_SUFFIXES = ["kemdikbud.go.id", "kemendikbud.go.id"];

export const createCurriculumAchievementSchema = z.object({
  educationStage: z.nativeEnum(EducationStage),
  phase: z.nativeEnum(CurriculumPhase),
  subjectCode: z.string().min(1),
  element: z.string().min(1),
  achievementText: z.string().min(1),
  sourceDocument: z.string().min(1),
  sourceUrl: z
    .string()
    .url()
    .refine((url) => {
      try {
        const { protocol, hostname } = new URL(url);
        return protocol === "https:" && OFFICIAL_SOURCE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
      } catch {
        return false;
      }
    }, "sourceUrl harus https pada domain resmi kementerian (kemdikbud.go.id)."),
  retrievedAt: z.coerce.date(),
});
export type CreateCurriculumAchievementInput = z.infer<typeof createCurriculumAchievementSchema>;
