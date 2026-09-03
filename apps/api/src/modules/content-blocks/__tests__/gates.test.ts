import { describe, it, expect } from "vitest";
import { runAccessibilityGate } from "../accessibility-gate.js";
import { runCurriculumGate } from "../curriculum-gate.js";
import type { GateSnapshot } from "../gate-types.js";

function baseSnapshot(overrides: Partial<GateSnapshot["lesson"]> = {}): GateSnapshot {
  return {
    lesson: {
      id: "lesson-1",
      educationStage: "SD",
      phase: "FASE_B",
      learningObjective: "Siswa dapat menjumlahkan pecahan sejenis",
      unitId: "unit-1",
      curriculumAchievementId: "ca-1",
      curriculumAchievement: {
        achievementText: "Kutipan resmi",
        sourceDocument: "Kepmendikbudristek No. X",
        sourceUrl: "https://kurikulum.kemdikbud.go.id/x",
        retrievedAt: new Date("2026-09-01"),
      },
      ...overrides,
    },
    blocks: [
      {
        id: "block-illustration",
        blockType: "ILLUSTRATION",
        payload: { caption: "ilustrasi" },
        altText: "Dua apel di atas meja",
        transcriptText: null,
        captionAssetId: null,
        fallbackAssetId: null,
        narrationText: "Ada dua apel",
      },
      {
        id: "block-widget",
        blockType: "INTERACTIVE_WIDGET",
        payload: { widgetType: "NUMBER_LINE_EXPLORER", params: { min: 0, max: 10, step: 1, initial: 0 } },
        altText: null,
        transcriptText: null,
        captionAssetId: null,
        fallbackAssetId: null,
        narrationText: "Geser garis bilangan",
      },
    ],
    questionItems: [],
  };
}

describe("accessibility-gate (A1-A8)", () => {
  it("returns no violations for a fully compliant lesson", () => {
    expect(runAccessibilityGate(baseSnapshot())).toEqual([]);
  });

  it("A1: flags an ILLUSTRATION block missing altText", () => {
    const snapshot = baseSnapshot();
    snapshot.blocks[0]!.altText = "";
    const violations = runAccessibilityGate(snapshot);
    expect(violations.some((v) => v.rule === "A1" && v.blockId === "block-illustration")).toBe(true);
  });

  it("A2: flags a VIDEO block missing caption or transcript", () => {
    const snapshot = baseSnapshot();
    snapshot.blocks.push({
      id: "block-video",
      blockType: "VIDEO",
      payload: { title: "Video" },
      altText: null,
      transcriptText: null,
      captionAssetId: null,
      fallbackAssetId: "asset-1",
      narrationText: "narasi",
    });
    const violations = runAccessibilityGate(snapshot);
    expect(violations.some((v) => v.rule === "A2" && v.blockId === "block-video")).toBe(true);
  });

  it("A3: flags an ANIMATION block missing transcriptText", () => {
    const snapshot = baseSnapshot();
    snapshot.blocks.push({
      id: "block-anim",
      blockType: "ANIMATION",
      payload: { animationId: "count-objects", steps: [{ atMs: 0, caption: "c", frame: "f" }], loop: false },
      altText: null,
      transcriptText: null,
      captionAssetId: null,
      fallbackAssetId: "asset-1",
      narrationText: "narasi",
    });
    const violations = runAccessibilityGate(snapshot);
    expect(violations.some((v) => v.rule === "A3" && v.blockId === "block-anim")).toBe(true);
  });

  it("A4: flags VIDEO/ANIMATION blocks missing fallbackAssetId", () => {
    const snapshot = baseSnapshot();
    snapshot.blocks.push({
      id: "block-anim",
      blockType: "ANIMATION",
      payload: { animationId: "count-objects", steps: [{ atMs: 0, caption: "c", frame: "f" }], loop: false },
      altText: null,
      transcriptText: "transkrip lengkap",
      captionAssetId: null,
      fallbackAssetId: null,
      narrationText: "narasi",
    });
    const violations = runAccessibilityGate(snapshot);
    expect(violations.some((v) => v.rule === "A4" && v.blockId === "block-anim")).toBe(true);
  });

  it("A5: flags an INTERACTIVE_WIDGET block with an unknown widgetType", () => {
    const snapshot = baseSnapshot();
    snapshot.blocks[1]!.payload = { widgetType: "NOT_REAL_WIDGET", params: {} };
    const violations = runAccessibilityGate(snapshot);
    expect(violations.some((v) => v.rule === "A5" && v.blockId === "block-widget")).toBe(true);
  });

  it("A6: flags an INTERACTIVE_WIDGET block whose params fail schema validation", () => {
    const snapshot = baseSnapshot();
    snapshot.blocks[1]!.payload = { widgetType: "NUMBER_LINE_EXPLORER", params: { min: 10, max: 0, step: 1, initial: 0 } };
    const violations = runAccessibilityGate(snapshot);
    expect(violations.some((v) => v.rule === "A6" && v.blockId === "block-widget")).toBe(true);
  });

  it("A7/A8: TK lessons require illustrated options and narrationText", () => {
    const snapshot = baseSnapshot({ educationStage: "TK" });
    snapshot.questionItems = [
      {
        id: "q1",
        contentPayload: {
          options: [{ id: "opt_a" }, { id: "opt_b", illustrationAssetId: "asset-b" }],
          narrationText: "",
        },
      },
    ];
    const violations = runAccessibilityGate(snapshot);
    expect(violations.some((v) => v.rule === "A7" && v.field === "questionItems[0].options[0].illustrationAssetId")).toBe(
      true,
    );
    expect(violations.some((v) => v.rule === "A8" && v.field === "questionItems[0].narrationText")).toBe(true);
  });

  it("A7/A8 do not apply outside TK", () => {
    const snapshot = baseSnapshot({ educationStage: "SD" });
    snapshot.questionItems = [{ id: "q1", contentPayload: { options: [{ id: "opt_a" }] } }];
    const violations = runAccessibilityGate(snapshot);
    expect(violations.some((v) => v.rule === "A7" || v.rule === "A8")).toBe(false);
  });
});

describe("curriculum-gate (C1-C3)", () => {
  it("returns no violations for a fully compliant lesson", () => {
    expect(runCurriculumGate(baseSnapshot())).toEqual([]);
  });

  it("C1: flags missing learningObjective", () => {
    const snapshot = baseSnapshot({ learningObjective: "" });
    expect(runCurriculumGate(snapshot).some((v) => v.rule === "C1")).toBe(true);
  });

  it("C2: flags a lesson missing a concept block or a widget block", () => {
    const snapshot = baseSnapshot();
    snapshot.blocks = [snapshot.blocks[0]!];
    expect(runCurriculumGate(snapshot).some((v) => v.rule === "C2")).toBe(true);
  });

  it("C3: flags a missing curriculum achievement reference", () => {
    const snapshot = baseSnapshot({ curriculumAchievementId: null, curriculumAchievement: null });
    expect(runCurriculumGate(snapshot).some((v) => v.rule === "C3")).toBe(true);
  });

  it("C3: flags a referenced achievement with an incomplete provenance trail", () => {
    const snapshot = baseSnapshot();
    snapshot.lesson.curriculumAchievement = {
      achievementText: "Kutipan",
      sourceDocument: "",
      sourceUrl: "https://kurikulum.kemdikbud.go.id/x",
      retrievedAt: new Date(),
    };
    expect(runCurriculumGate(snapshot).some((v) => v.rule === "C3")).toBe(true);
  });
});
