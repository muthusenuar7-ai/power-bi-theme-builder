/**
 * Theme Resolver — bridges Theme Studio's ResolvedVisualPreviewFormat
 * into strongly-typed per-visual theme objects for the pbi-mimic engine.
 *
 * Currently supports pie / donut (ResolvedPieTheme).
 * Future extensions: bar, column, line, scatter, etc.
 *
 * The resolved theme contains plain values (not CSS variables) so engine
 * functions can be called from both React components and pure unit tests.
 * Chart components that need live CSS-variable reactivity may still use
 * var(--preview-*) references in SVG attributes alongside these values.
 */

import type { ResolvedPieTheme } from './types'
import type { ResolvedVisualPreviewFormat } from '@/lib/formatPreview'

/* ── CSS data-color defaults ─────────────────────────────────────────── */

/**
 * Default slice color array using CSS variables so the output tracks the
 * current theme when used directly in SVG fill attributes.
 */
const DEFAULT_DATA_COLORS: string[] = [
  'var(--c1,#0D9488)',
  'var(--c2,#3B82F6)',
  'var(--c3,#8B5CF6)',
  'var(--c4,#F59E0B)',
  'var(--c5,#EF4444)',
  'var(--c6,#10B981)',
  'var(--c7,#F97316)',
  'var(--c8,#EC4899)',
  'var(--c9,#2563EB)',
  'var(--c10,#64748B)',
]

/* ── Fallback theme (no format available) ────────────────────────────── */

const FALLBACK_PIE_THEME: ResolvedPieTheme = {
  fontFamily:       "var(--preview-font-family,'Segoe UI',sans-serif)",
  dataColors:       DEFAULT_DATA_COLORS,
  legendShow:       true,
  legendPosition:   'Top left',
  legendFontSize:   7,
  legendColor:      '#605E5C',
  legendTitleShow:  false,
  legendTitleText:  '',
  legendTextShow:   true,
  legendFontFamily: "var(--preview-font-family,'Segoe UI',sans-serif)",
  legendFontWeight: 400,
  legendFontStyle:  'normal',
  legendTextDecoration: 'none',
  legendTitleColor: '#605E5C',
  legendTitleFontSize: 7,
  legendTitleFontFamily: "var(--preview-font-family,'Segoe UI',sans-serif)",
  legendTitleFontWeight: 700,
  legendTitleFontStyle: 'normal',
  legendTitleTextDecoration: 'none',
  labelsShow:       true,
  labelsFontSize:   6.4,
  labelsColor:      '#252423',
  labelsStyle:      'Data value, percent of total',
  labelsFontFamily: "var(--preview-font-family,'Segoe UI',sans-serif)",
  labelsFontWeight: 700,
  labelsFontStyle: 'normal',
  labelsTextDecoration: 'none',
  labelsDisplayUnits: 'Auto',
  labelsDecimals: 'Auto',
  sliceOpacity:     1,
  sliceBorderShow:  false,
  sliceBorderColor: '#C8C6C4',
  sliceBorderWidth: 1,
}

/* ── Pie / donut resolver ────────────────────────────────────────────── */

/**
 * Resolve a strongly-typed theme object for a pie or donut visual.
 *
 * @param format          Resolved visual preview format (from resolveVisualPreviewFormat).
 *                        Pass `undefined` to get sensible PBI defaults.
 * @param cssDataColors   Override slice colors. Defaults to var(--c1) through var(--c10)
 *                        so the chart tracks the live theme automatically.
 */
export function resolvePieTheme(
  format: ResolvedVisualPreviewFormat | undefined,
  cssDataColors: string[] = DEFAULT_DATA_COLORS,
): ResolvedPieTheme {
  if (!format) {
    return { ...FALLBACK_PIE_THEME, dataColors: cssDataColors }
  }

  // fontFamily: prefer the value stored in format; the axis fontFamily field
  // holds the visual's default font because resolveAxisPreview falls back to
  // the theme-level general.typography.fontFace.
  const fontFamily = format.xAxis.fontFamily
    ? `var(--preview-font-family,'${format.xAxis.fontFamily}',sans-serif)`
    : FALLBACK_PIE_THEME.fontFamily

  return {
    fontFamily,
    dataColors: cssDataColors,

    legendShow:      format.legend.show,
    legendPosition:  format.legend.position,
    legendFontSize:  format.legend.fontSize,
    legendColor:     format.legend.color,
    legendTitleShow: format.legend.titleShow,
    legendTitleText: format.legend.titleText,
    legendTextShow:  format.legend.textShow,
    legendFontFamily: format.legend.fontFamily,
    legendFontWeight: format.legend.fontWeight,
    legendFontStyle: String(format.legend.fontStyle ?? 'normal'),
    legendTextDecoration: String(format.legend.textDecoration ?? 'none'),
    legendTitleColor: format.legend.titleColor,
    legendTitleFontSize: format.legend.titleFontSize,
    legendTitleFontFamily: format.legend.titleFontFamily,
    legendTitleFontWeight: format.legend.titleFontWeight,
    legendTitleFontStyle: String(format.legend.titleFontStyle ?? 'normal'),
    legendTitleTextDecoration: String(format.legend.titleTextDecoration ?? 'none'),

    labelsShow:     format.dataLabels.show,
    labelsFontSize: format.dataLabels.fontSize,
    labelsColor:    format.dataLabels.color,
    labelsStyle:    format.dataLabels.labelStyle,
    labelsFontFamily: format.dataLabels.fontFamily,
    labelsFontWeight: format.dataLabels.fontWeight,
    labelsFontStyle: String(format.dataLabels.fontStyle ?? 'normal'),
    labelsTextDecoration: String(format.dataLabels.textDecoration ?? 'none'),
    labelsDisplayUnits: format.dataLabels.displayUnits,
    labelsDecimals: format.dataLabels.decimals,

    sliceOpacity:     format.shape.opacity,
    sliceBorderShow:  format.shape.borderShow,
    sliceBorderColor: format.shape.borderColor,
    sliceBorderWidth: format.shape.borderWidth,
  }
}
