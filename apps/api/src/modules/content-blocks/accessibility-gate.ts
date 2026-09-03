import { getWidgetCatalogEntry, widgetParamsSchemaFor } from "@aksicendekia/content-kit";
import type { GateSnapshot, GateViolation } from "./gate-types.js";

/**
 * Accessibility gate — A1-A8 (data-model.md §5). Pure function: blocks DRAFT -> REVIEW
 * (FR-004, FR-030) when it returns any violation. TK-only rules (A7/A8) are skipped
 * for other education stages.
 */
export function runAccessibilityGate(snapshot: GateSnapshot): GateViolation[] {
  const violations: GateViolation[] = [];
  const { lesson, blocks, questionItems } = snapshot;

  for (const block of blocks) {
    if (block.blockType === "ILLUSTRATION" && !block.altText?.trim()) {
      violations.push({
        rule: "A1",
        blockId: block.id,
        blockType: block.blockType,
        field: "altText",
        message: "Ilustrasi belum memiliki teks alternatif.",
      });
    }

    if (block.blockType === "VIDEO") {
      if (!block.captionAssetId || !block.transcriptText?.trim()) {
        violations.push({
          rule: "A2",
          blockId: block.id,
          blockType: block.blockType,
          field: !block.captionAssetId ? "captionAssetId" : "transcriptText",
          message: "Video belum memiliki takarir dan/atau transkrip lengkap.",
        });
      }
    }

    if (block.blockType === "ANIMATION" && !block.transcriptText?.trim()) {
      violations.push({
        rule: "A3",
        blockId: block.id,
        blockType: block.blockType,
        field: "transcriptText",
        message: "Animasi belum memiliki transkrip.",
      });
    }

    if ((block.blockType === "VIDEO" || block.blockType === "ANIMATION") && !block.fallbackAssetId) {
      violations.push({
        rule: "A4",
        blockId: block.id,
        blockType: block.blockType,
        field: "fallbackAssetId",
        message: `${block.blockType === "VIDEO" ? "Video" : "Animasi"} belum memiliki ilustrasi cadangan.`,
      });
    }

    if (block.blockType === "INTERACTIVE_WIDGET") {
      const payload = block.payload as { widgetType?: string; params?: unknown } | null;
      const widgetType = payload?.widgetType;
      const catalogEntry = widgetType ? getWidgetCatalogEntry(widgetType) : undefined;

      if (!catalogEntry || catalogEntry.supportStatus !== "SUPPORTED") {
        violations.push({
          rule: "A5",
          blockId: block.id,
          blockType: block.blockType,
          field: "payload.widgetType",
          message: catalogEntry
            ? `Tipe widget "${widgetType}" berstatus ${catalogEntry.supportStatus}, bukan SUPPORTED.`
            : `Tipe widget "${widgetType ?? ""}" tidak ada di katalog.`,
        });
      } else {
        const paramsSchema = widgetParamsSchemaFor(widgetType as string);
        const result = paramsSchema?.safeParse(payload?.params);
        if (!result || !result.success) {
          violations.push({
            rule: "A6",
            blockId: block.id,
            blockType: block.blockType,
            field: "payload.params",
            message: "Parameter widget tidak lolos validasi skema.",
          });
        }
      }
    }

    if (lesson.educationStage === "TK" && !block.narrationText?.trim()) {
      violations.push({
        rule: "A8",
        blockId: block.id,
        blockType: block.blockType,
        field: "narrationText",
        message: "Blok konten jenjang TK belum memiliki narrationText untuk kontrol dengarkan.",
      });
    }
  }

  if (lesson.educationStage === "TK") {
    questionItems.forEach((question, qIndex) => {
      const options = question.contentPayload?.options ?? [];
      options.forEach((option, oIndex) => {
        if (!option.illustrationAssetId) {
          violations.push({
            rule: "A7",
            blockId: null,
            blockType: null,
            field: `questionItems[${qIndex}].options[${oIndex}].illustrationAssetId`,
            message: "Soal jenjang TK belum memiliki pilihan jawaban bergambar.",
          });
        }
      });

      if (!question.contentPayload?.narrationText?.trim()) {
        violations.push({
          rule: "A8",
          blockId: null,
          blockType: null,
          field: `questionItems[${qIndex}].narrationText`,
          message: "Soal jenjang TK belum memiliki narrationText untuk kontrol dengarkan.",
        });
      }
    });
  }

  return violations;
}
