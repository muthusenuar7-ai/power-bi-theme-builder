/**
 * Visual ID normalisation utilities.
 *
 * Theme Studio uses a set of canonical lowercase visual IDs (defined in
 * visualCatalog.ts). External sources — Power BI SDK event payloads, import
 * files, URL params — may use camelCase aliases or legacy names.  This module
 * provides a single conversion point so callers don't need to know all the
 * aliases.
 *
 * Usage:
 *   import { normalizeVisualId } from '@/lib/visualIdUtils'
 *   const id = normalizeVisualId(externalId)   // → canonical Studio ID
 */

/**
 * Maps every known alias → canonical Theme Studio visual ID.
 * Keys are the external/SDK form; values are the canonical IDs used in
 * visualCatalog.ts and visualIconRegistry.ts.
 */
const ALIAS_MAP: Record<string, string> = {
  // ── Combo (camelCase SDK / import aliases) ───────────────────────────────
  lineClusteredColumn:          'lineclustered',
  lineclusteredcolumn:          'lineclustered',
  lineStackedColumn:            'linestacked',
  linestackedcolumn:            'linestacked',

  // ── Bar variants ─────────────────────────────────────────────────────────
  hundredStackedBar:            'hundredstackedbar',
  hundredPercentStackedBar:     'hundredstackedbar',
  hundredpercentstackedbar:     'hundredstackedbar',

  // ── Column variants ──────────────────────────────────────────────────────
  stackedColumn:                'stackedcol',
  stackedcolumn:                'stackedcol',
  clusteredColumn:              'clusteredcol',
  clusteredcolumn:              'clusteredcol',
  hundredStackedCol:            'hundredstackedcol',
  hundredStackedColumn:         'hundredstackedcol',
  hundredPercentStackedColumn:  'hundredstackedcol',
  hundredpercentstackedcolumn:  'hundredstackedcol',

  // ── Area variants ────────────────────────────────────────────────────────
  stackedArea:                  'stackedarea',
  stackedarea:                  'stackedarea',   // already canonical, kept for safety
  hundredStackedArea:           'hundredstackedarea',
  hundredPercentStackedArea:    'hundredstackedarea',
  hundredpercentstackedarea:    'hundredstackedarea',

  // ── Slicers / Cards (camelCase → same canonical camelCase ID) ───────────
  // These are already canonical in the catalog; aliases for case-insensitive input.
  buttonslicer:                 'buttonSlicer',
  slicerstandard:               'slicerStandard',
  cardcurrent:                  'cardCurrent',
  cardlegacy:                   'cardLegacy',
  multirowCard:                 'multirowcard',

  // ── Decomposition Tree ───────────────────────────────────────────────────
  decompositionTree:            'decompositiontree',
  DecompositionTree:            'decompositiontree',

  // ── Scatter / Bubble ─────────────────────────────────────────────────────
  scatterBubblePreview:         'bubble',
  scatterbubblepreview:         'bubble',
}

/**
 * Normalise a visual ID from any external source to the canonical
 * Theme Studio ID used in visualCatalog and visualIconRegistry.
 *
 * Returns the input unchanged if no alias mapping exists (i.e. the ID
 * is already canonical or is unknown).
 *
 * @example
 *   normalizeVisualId('buttonSlicer')         // 'buttonSlicer'
 *   normalizeVisualId('buttonslicer')          // 'buttonSlicer'
 *   normalizeVisualId('lineClusteredColumn')   // 'lineclustered'
 *   normalizeVisualId('hundredStackedBar')     // 'hundredstackedbar'
 *   normalizeVisualId('decompositionTree')     // 'decompositiontree'
 */
export function normalizeVisualId(id: string): string {
  return ALIAS_MAP[id] ?? id
}
