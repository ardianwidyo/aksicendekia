import { WIDGET_PARAMS_SCHEMAS, WIDGET_TYPE_IDS, type WidgetTypeId } from '../schema/widget-params.schema.js';

/**
 * Widget catalog metadata — Feature 010 / FR-002, FR-009 / data-model.md §4.
 * The DB table `interactive_widget_types` is a mirror of this, seeded on every
 * `prisma db seed`. Behaviour + params schemas live in code, never in the DB.
 */

export type WidgetSupportStatus = 'SUPPORTED' | 'DEPRECATED' | 'REMOVED';

export interface WidgetCatalogEntry {
  id: WidgetTypeId;
  displayName: string;
  description: string;
  supportStatus: WidgetSupportStatus;
  catalogVersion: number;
  a11yNotes: string;
}

export const WIDGET_CATALOG: readonly WidgetCatalogEntry[] = [
  {
    id: 'STEP_REVEAL',
    displayName: 'Pengungkapan Bertahap',
    description: 'Menyingkap konsep langkah demi langkah, satu kartu per langkah.',
    supportStatus: 'SUPPORTED',
    catalogVersion: 1,
    a11yNotes: 'Enter/Space maju, Backspace mundur; kemajuan diumumkan via aria-live.',
  },
  {
    id: 'PARAMETER_EXPLORER',
    displayName: 'Penjelajah Parameter',
    description: 'Menggeser variabel untuk melihat efeknya pada sebuah rumus tertutup.',
    supportStatus: 'SUPPORTED',
    catalogVersion: 1,
    a11yNotes: 'Setiap variabel adalah <input type="range"> native.',
  },
  {
    id: 'NUMBER_LINE_EXPLORER',
    displayName: 'Penjelajah Garis Bilangan',
    description: 'Garis bilangan yang dapat digeser siswa untuk menjelajah nilai.',
    supportStatus: 'SUPPORTED',
    catalogVersion: 1,
    a11yNotes: 'role="slider"; panah kiri/kanan satu step; Home/End ke ujung; PageUp/PageDown sepuluh step.',
  },
  {
    id: 'FRACTION_BAR_BUILDER',
    displayName: 'Perakit Batang Pecahan',
    description: 'Mengarsir bagian batang untuk membangun dan membandingkan pecahan.',
    supportStatus: 'SUPPORTED',
    catalogVersion: 1,
    a11yNotes: 'Panah memindah fokus antar bagian; Enter/Space mengarsir; state via aria-pressed.',
  },
  {
    id: 'IMAGE_HOTSPOT',
    displayName: 'Titik-Sentuh Gambar',
    description: 'Gambar dengan titik interaktif yang membuka penjelasan singkat.',
    supportStatus: 'SUPPORTED',
    catalogVersion: 1,
    a11yNotes: 'Tiap hotspot adalah <button> sungguhan dalam urutan Tab; aria-expanded.',
  },
  {
    id: 'SORT_INTO_GROUPS',
    displayName: 'Kelompokkan Objek',
    description: 'Menempatkan objek ke kelompok yang tepat dengan pola pilih-lalu-letakkan.',
    supportStatus: 'SUPPORTED',
    catalogVersion: 1,
    a11yNotes: 'Select-then-place (bukan HTML5 DnD); perubahan diumumkan via aria-live.',
  },
  {
    id: 'ANIMATED_WORKED_EXAMPLE',
    displayName: 'Contoh Pengerjaan Beranimasi',
    description: 'Animasi berbasis kode yang memperagakan langkah penyelesaian.',
    supportStatus: 'SUPPORTED',
    catalogVersion: 1,
    a11yNotes: 'Kontrol Putar/Jeda/Ulang sebagai <button>; takarir selalu tampil; mode manual saat reduced-motion.',
  },
] as const;

const CATALOG_BY_ID = new Map<string, WidgetCatalogEntry>(WIDGET_CATALOG.map((w) => [w.id, w]));

export function getWidgetCatalogEntry(id: string): WidgetCatalogEntry | undefined {
  return CATALOG_BY_ID.get(id);
}

/** Derive a coarse JSON-Schema-ish descriptor from the Zod schema for CMS display. */
export function widgetParamsDescriptor(id: WidgetTypeId): Record<string, unknown> {
  const schema = WIDGET_PARAMS_SCHEMAS[id];
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: id,
    type: 'object',
    zod: schema.description ?? id,
  };
}

/** Full seed rows for the `interactive_widget_types` mirror table. */
export function widgetCatalogSeedRows(): Array<
  WidgetCatalogEntry & { paramsSchema: Record<string, unknown> }
> {
  return WIDGET_CATALOG.map((entry) => ({
    ...entry,
    paramsSchema: widgetParamsDescriptor(entry.id),
  }));
}

export { WIDGET_TYPE_IDS };
