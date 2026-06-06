import type { FormatValue, PaletteSize, ThemeState } from '@/types'
import type { DashboardTheme } from '@/lib/dashboardThemeResolver'

/**
 * themeAudit — a read-only diagnostic of the *active theme* (the Zustand store
 * plus the resolved DashboardTheme). It answers: "which theme properties are
 * explicitly set, which are derived for the preview, and which are genuinely
 * missing?"
 *
 * It does NOT change any functionality — it only inspects. The dashboard preview
 * mounts a dev-only panel (ThemeAuditPanel) that renders this + console.table()s
 * it, so theme changes are observable as concrete values while debugging.
 */

/** The subset of store state the audit reads. */
export type ThemeAuditInput = Pick<
  ThemeState,
  | 'themeName'
  | 'paletteSize'
  | 'dataColors'
  | 'bg'
  | 'customCanvasBackground'
  | 'visualBackground'
  | 'cardBackground'
  | 'borderColor'
  | 'titleColor'
  | 'labelColor'
  | 'canvasBackgroundMode'
  | 'visualBackgroundMode'
  | 'fg'
  | 'good'
  | 'neutral'
  | 'bad'
  | 'tableAccent'
  | 'formatProps'
>

/**
 * - set            → an explicit value lives in state / formatProps.
 * - derived        → not set explicitly, but the resolver computes a concrete,
 *                    readable value from the background (still "present").
 * - dashboard-only → a preview-only value not part of the Power BI export.
 * - missing        → genuinely absent (should be rare after seeding defaults).
 */
export type AuditStatus = 'set' | 'derived' | 'dashboard-only' | 'missing'

export interface AuditField {
  /** The effective value (explicit, derived, or null when truly missing). */
  value: string | number | null
  /** Where the value comes from (state key, formatProps path, or "derived"). */
  source: string
  status: AuditStatus
}

export interface ThemeAudit {
  themeName: string
  paletteSize: PaletteSize
  dataColorsCount: number
  dataColors: string[]
  /** property name → { value, source, status } — console.table-friendly. */
  fields: Record<string, AuditField>
  /** Property names whose value is genuinely missing from state. */
  missing: string[]
}

const DEFAULT_FONT_FAMILY = 'Segoe UI'
const DEFAULT_TITLE_FONT_SIZE = 14
const DEFAULT_LABEL_FONT_SIZE = 10

function fmtKey(props: Record<string, FormatValue>, key: string): string | number | null {
  const v = props[key]
  if (typeof v === 'string') return v.trim() ? v.trim() : null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return null
}

function topLevel(value: string | undefined | null, source: string): AuditField {
  const v = typeof value === 'string' && value.trim() ? value.trim() : null
  return { value: v, source, status: v === null ? 'missing' : 'set' }
}

/**
 * An explicit formatProps value if present; otherwise the resolver-derived
 * value (reported as "derived", never "missing", because the preview paints it).
 */
function explicitOrDerived(
  props: Record<string, FormatValue>,
  key: string,
  derived: string | number,
): AuditField {
  const v = fmtKey(props, key)
  if (v !== null) return { value: v, source: `formatProps['${key}']`, status: 'set' }
  return { value: derived, source: `derived (resolver) — would set formatProps['${key}']`, status: 'derived' }
}

/**
 * Build a property-by-property audit of the active theme. Pure / side-effect
 * free. Pass the resolved DashboardTheme so derived (non-explicit) values are
 * reported as concrete colours rather than "missing".
 */
export function getThemeAudit(state: ThemeAuditInput, theme: DashboardTheme): ThemeAudit {
  const props = state.formatProps ?? {}

  const fields: Record<string, AuditField> = {
    background:       topLevel(state.bg, 'state.bg'),
    effectiveCanvasBackground: {
      value: theme.effectiveCanvasBackground,
      source: state.canvasBackgroundMode === 'custom' ? 'state.customCanvasBackground' : 'state.bg',
      status: 'set',
    },
    canvasBackgroundSource: {
      value: theme.canvasBackgroundSource,
      source: 'state.canvasBackgroundMode',
      status: 'set',
    },
    foreground:       topLevel(state.fg, 'state.fg'),
    // Visual background: explicit general.background.color, else the resolver's
    // readable derived surface (white-ish on light themes, dark on dark themes).
    visualBackground: topLevel(state.visualBackground, 'state.visualBackground'),
    effectiveVisualBackground: {
      value: theme.effectiveVisualBackground,
      source: state.visualBackgroundMode === 'custom' ? "formatProps['general.background.color']" : 'state.visualBackground',
      status: state.visualBackgroundMode === 'custom' ? 'set' : 'derived',
    },
    visualBackgroundSource: {
      value: theme.visualBackgroundSource,
      source: 'state.visualBackgroundMode',
      status: 'set',
    },
    // cardBackground is a preview-only surface (mirrors visualBackground); it is
    // not a separate Power BI export field — hence "dashboard-only", not missing.
    cardBackground:   topLevel(state.cardBackground, 'state.cardBackground'),
    titleColor:       explicitOrDerived(props, 'general.title.fontColor', theme.titleColor),
    labelColor:       explicitOrDerived(props, 'general.label.fontColor', theme.labelColor),
    borderColor:      explicitOrDerived(props, 'general.border.color', theme.borderColor),
    tableAccent:      topLevel(state.tableAccent, 'state.tableAccent'),
    good:             topLevel(state.good, 'state.good'),
    bad:              topLevel(state.bad, 'state.bad'),
    neutral:          topLevel(state.neutral, 'state.neutral'),
    fontFamily:       explicitOrDerived(props, 'general.typography.fontFace', DEFAULT_FONT_FAMILY),
    titleFontSize:    explicitOrDerived(props, 'general.title.fontSize', DEFAULT_TITLE_FONT_SIZE),
    labelFontSize:    explicitOrDerived(props, 'general.label.fontSize', DEFAULT_LABEL_FONT_SIZE),
  }

  const missing = Object.entries(fields)
    .filter(([, f]) => f.status === 'missing')
    .map(([name]) => name)

  // theme.dataColors is already capped to paletteSize by the resolver, so the
  // reported count matches the active palette (and the exported dataColors).
  const activeColors = theme.dataColors ?? []

  return {
    themeName: state.themeName ?? 'Untitled',
    paletteSize: state.paletteSize,
    dataColorsCount: activeColors.length,
    dataColors: activeColors,
    fields,
    missing,
  }
}
