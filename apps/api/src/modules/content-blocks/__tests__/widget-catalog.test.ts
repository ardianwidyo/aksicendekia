import { describe, it, expect } from "vitest";
import { widgetCatalogSeedRows } from "@aksicendekia/content-kit";

/**
 * GET /api/v1/admin/widget-catalog (contract §8) is served directly from
 * @aksicendekia/content-kit's catalog — code is the single source of truth
 * (data-model.md §3.3), so this test asserts on that source rather than
 * spinning up Fastify.
 */
describe("GET /api/v1/admin/widget-catalog data source", () => {
  it("exposes exactly the 7 v1 widgets, all SUPPORTED, with a paramsSchema", () => {
    const rows = widgetCatalogSeedRows();
    expect(rows).toHaveLength(7);
    for (const row of rows) {
      expect(row.supportStatus).toBe("SUPPORTED");
      expect(row.catalogVersion).toBe(1);
      expect(row.paramsSchema).toBeTruthy();
      expect(row.displayName.length).toBeGreaterThan(0);
      expect(row.a11yNotes.length).toBeGreaterThan(0);
    }
  });

  it("includes every widget id referenced by the interactive widget registry", () => {
    const ids = widgetCatalogSeedRows().map((r) => r.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "STEP_REVEAL",
        "PARAMETER_EXPLORER",
        "NUMBER_LINE_EXPLORER",
        "FRACTION_BAR_BUILDER",
        "IMAGE_HOTSPOT",
        "SORT_INTO_GROUPS",
        "ANIMATED_WORKED_EXAMPLE",
      ]),
    );
  });
});
