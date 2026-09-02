import { describe, it, expect } from "vitest";
import { assertProductionPreviewGuards } from "../production-guard.js";

describe("assertProductionPreviewGuards (FR-030b)", () => {
  it("throws when CONTENT_PREVIEW_INCLUDE_REVIEW=true in production", () => {
    expect(() =>
      assertProductionPreviewGuards({ NODE_ENV: "production", CONTENT_PREVIEW_INCLUDE_REVIEW: "true" }),
    ).toThrow(/FR-030b/);
  });

  it("does not throw in production when the switch is off", () => {
    expect(() => assertProductionPreviewGuards({ NODE_ENV: "production" })).not.toThrow();
  });

  it("does not throw outside production even if the switch is on", () => {
    expect(() =>
      assertProductionPreviewGuards({ NODE_ENV: "development", CONTENT_PREVIEW_INCLUDE_REVIEW: "true" }),
    ).not.toThrow();
  });
});
