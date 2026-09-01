import { describe, it, expect } from 'vitest';
import { WIDGET_CATALOG, getWidgetCatalogEntry, widgetCatalogSeedRows } from '../widget-catalog';
import { WIDGET_TYPE_IDS, WIDGET_PARAMS_SCHEMAS } from '../../schema/widget-params.schema';

describe('widget catalog', () => {
  it('has exactly the 7 v1 widget types, all SUPPORTED', () => {
    expect(WIDGET_CATALOG).toHaveLength(7);
    expect(WIDGET_CATALOG.every((w) => w.supportStatus === 'SUPPORTED')).toBe(true);
    expect(WIDGET_CATALOG.every((w) => w.catalogVersion === 1)).toBe(true);
  });

  it('catalog ids match the params-schema keys exactly', () => {
    const catalogIds = WIDGET_CATALOG.map((w) => w.id).sort();
    expect(catalogIds).toEqual([...WIDGET_TYPE_IDS].sort());
    expect(catalogIds).toEqual(Object.keys(WIDGET_PARAMS_SCHEMAS).sort());
  });

  it('every entry has a non-empty display name, description, a11y note', () => {
    for (const w of WIDGET_CATALOG) {
      expect(w.displayName.length).toBeGreaterThan(0);
      expect(w.description.length).toBeGreaterThan(0);
      expect(w.a11yNotes.length).toBeGreaterThan(0);
    }
  });

  it('getWidgetCatalogEntry resolves known / unknown', () => {
    expect(getWidgetCatalogEntry('NUMBER_LINE_EXPLORER')?.id).toBe('NUMBER_LINE_EXPLORER');
    expect(getWidgetCatalogEntry('NOPE')).toBeUndefined();
  });

  it('seed rows carry a paramsSchema descriptor', () => {
    const rows = widgetCatalogSeedRows();
    expect(rows).toHaveLength(7);
    expect(rows.every((r) => typeof r.paramsSchema === 'object')).toBe(true);
  });
});
