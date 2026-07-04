/**
 * themeSurfaceFormula — the ONE standard colour-surface formula for every
 * palette in the studio.
 *
 * Given a theme's declared colours (which are often flat: 87 of the 398 library
 * themes ship canvas ≈ visual background, and 127 ship washed-out pastel data
 * colours), this module calculates and VALIDATES the professional Power BI
 * surface set:
 *
 *   canvasBackground · visualBackground · titleBackground · borderColor ·
 *   gridlineColor · tableHeaderBackground · tableRowAlt · titleColor ·
 *   labelColor · dataColors · kpiGood · kpiBad · kpiNeutral
 *
 * Core rules (in order):
 *  1. Canvas = subtle palette-aware tint (near-white pages pick up the primary
 *     hue; real tinted/dark pages are kept).
 *  2. Visual background must be CLEARLY distinguishable from the canvas —
 *     light mode lifts the card toward white ("paper on a desk"); if both are
 *     already near-white the canvas is deepened with a slate+primary desk tint.
 *     Dark mode elevates the card above the canvas.
 *  3. Title background matches the visual card unless the theme intentionally
 *     declares a distinct header surface.
 *  4. Border softly separates card from canvas (visible but never harsh).
 *  5. Chart colours keep their hue but are strengthened when washed out and
 *     gently tempered when neon; near-duplicate colours are nudged apart.
 *  6. All text is checked for readability against the card surface.
 *
 * The formula is consumed by themeSurfaceResolver (and therefore by the
 * dashboard preview, the visuals preview, general property defaults and the
 * exported Power BI JSON — they all read the same resolved surfaces) and by
 * the store when a preset or imported theme is applied (data colours).
 */

import {
  getContrastRatio,
  getRelativeLuminance,
  hexToRgb,
  lighten,
  mixColor,
  rgbToHex,
} from '@/lib/colorUtils'
import { normalizeHexColor } from '@/lib/paletteUtils'

/* ── Tunable thresholds ─────────────────────────────────────────── */

/** Canvas↔visual separation: visible when the luminance gap is at least this
 *  (light surfaces) OR the WCAG ratio is at least RATIO_MIN (dark surfaces). */
const LUM_GAP_MIN = 0.05
const RATIO_MIN = 1.25

const TITLE_CONTRAST_MIN = 4.5
const LABEL_CONTRAST_MIN = 3.5
/** A chart colour below this contrast vs the card is "washed out"… */
const CHART_VISIBILITY_FLOOR = 1.55
/** …and is strengthened until it reaches this. */
const CHART_VISIBILITY_TARGET = 1.9
const KPI_VISIBILITY_TARGET = 2.0

export type SurfaceMode = 'light' | 'dark'

export interface DeclaredSurfaceSet {
  canvasBackground?: string
  visualBackground?: string
  titleBackground?: string
  borderColor?: string
  gridlineColor?: string
  tableHeaderBackground?: string
  tableRowAlt?: string
  foreground?: string
  titleColor?: string
  labelColor?: string
  kpiGood?: string
  kpiBad?: string
  kpiNeutral?: string
}

export type SurfaceLocks = Partial<Record<
  | 'canvasBackground' | 'visualBackground' | 'titleBackground' | 'borderColor'
  | 'gridlineColor' | 'tableHeaderBackground' | 'tableRowAlt'
  | 'foreground' | 'titleColor' | 'labelColor', boolean
>>

export interface ResolvedSurfaceSet {
  mode: SurfaceMode
  canvasBackground: string
  visualBackground: string
  titleBackground: string
  borderColor: string
  gridlineColor: string
  tableHeaderBackground: string
  tableRowAlt: string
  foreground: string
  titleColor: string
  labelColor: string
  kpiGood: string
  kpiBad: string
  kpiNeutral: string
  /** Field names the formula had to correct (for QA / warnings). */
  adjusted: string[]
}

export interface SurfaceFormulaInput {
  dataColors: readonly string[]
  paletteColors?: readonly string[]
  primary?: string
  secondary?: string
  accent?: string
  /** Declared surfaces per mode — pass whichever the theme defines. */
  light?: DeclaredSurfaceSet
  dark?: DeclaredSurfaceSet
  /** Which mode the theme is being used in (default: inferred from declared canvas). */
  activeMode?: SurfaceMode
}

export interface SurfaceFormulaResult {
  mode: SurfaceMode
  light: ResolvedSurfaceSet
  dark: ResolvedSurfaceSet
  /** The resolved set for the active mode. */
  surfaces: ResolvedSurfaceSet
  /** Chart colours refined against the active visual background. */
  dataColors: string[]
  /** 0–100 composite contrast/quality score for the active mode. */
  contrastScore: number
  warnings: string[]
}

/* ── HSL helpers (hue-preserving strengthening) ─────────────────── */

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
  else if (max === gn) h = ((bn - rn) / d + 2) * 60
  else h = ((rn - gn) / d + 4) * 60
  return [h, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360
  const sat = Math.max(0, Math.min(1, s))
  const lig = Math.max(0, Math.min(1, l))
  const c = (1 - Math.abs(2 * lig - 1)) * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = lig - c / 2
  const [r, g, b] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x]
    : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x]
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/* ── Separation primitives ──────────────────────────────────────── */

export function isSurfaceSeparated(a: string, b: string): boolean {
  const gap = Math.abs(getRelativeLuminance(a) - getRelativeLuminance(b))
  return gap >= LUM_GAP_MIN || getContrastRatio(a, b) >= RATIO_MIN
}

function isDarkSurface(hex: string): boolean {
  return getRelativeLuminance(hex) < 0.35
}

/**
 * Rule 1+2: palette-aware canvas tint + guaranteed canvas↔visual separation.
 * Locked surfaces (explicit user picks) are never moved — separation is then
 * achieved by moving the other surface only. If both are locked the user's
 * exact choices win.
 */
function ensureSurfaceSeparation(
  canvas: string,
  visual: string,
  primary: string,
  locks: { canvas: boolean; visual: boolean },
): { canvas: string; visual: string; adjusted: boolean } {
  if (isSurfaceSeparated(canvas, visual) || (locks.canvas && locks.visual)) {
    return { canvas, visual, adjusted: false }
  }
  const dark = isDarkSurface(canvas)

  if (dark) {
    // Elevated card: lift the visual above the canvas.
    if (!locks.visual) {
      let base = getRelativeLuminance(visual) < getRelativeLuminance(canvas) ? canvas : visual
      for (let t = 0.04; t <= 0.32; t += 0.04) {
        const candidate = mixColor(base, '#FFFFFF', t)
        if (isSurfaceSeparated(canvas, candidate)) return { canvas, visual: candidate, adjusted: true }
      }
      base = mixColor(base, '#FFFFFF', 0.32)
      if (!locks.canvas) {
        for (let s = 0.08; s <= 0.4; s += 0.08) {
          const candidate = mixColor(canvas, '#000000', s)
          if (isSurfaceSeparated(candidate, base)) return { canvas: candidate, visual: base, adjusted: true }
        }
      }
      return { canvas, visual: base, adjusted: true }
    }
    // Visual locked: deepen the canvas below the card.
    for (let s = 0.08; s <= 0.4; s += 0.08) {
      const candidate = mixColor(canvas, '#000000', s)
      if (isSurfaceSeparated(candidate, visual)) return { canvas: candidate, visual, adjusted: true }
    }
    return { canvas: mixColor(canvas, '#000000', 0.4), visual, adjusted: true }
  }

  // Light mode: "paper on a desk" — lift the card toward white first.
  if (!locks.visual) {
    for (let t = 0.2; t <= 1.001; t += 0.2) {
      const candidate = mixColor(visual, '#FFFFFF', t)
      if (isSurfaceSeparated(canvas, candidate)) return { canvas, visual: candidate, adjusted: true }
    }
  }
  // Card is (or must stay) near-white and so is the canvas → deepen the canvas
  // with a slate desk-tint carrying the palette hue.
  const liftedVisual = locks.visual ? visual : '#FFFFFF'
  if (!locks.canvas) {
    const deskShade = mixColor('#94A3B8', primary, 0.3)
    for (let s = 0.06; s <= 0.3; s += 0.06) {
      const candidate = mixColor(canvas, deskShade, s)
      if (isSurfaceSeparated(candidate, liftedVisual)) return { canvas: candidate, visual: liftedVisual, adjusted: true }
    }
    return { canvas: mixColor(canvas, deskShade, 0.3), visual: liftedVisual, adjusted: true }
  }
  return { canvas, visual: liftedVisual, adjusted: true }
}

/** Step text toward the readable pole until it clears the contrast minimum. */
function ensureReadableText(color: string, background: string, minContrast: number): { color: string; adjusted: boolean } {
  if (getContrastRatio(color, background) >= minContrast) return { color, adjusted: false }
  const pole = isDarkSurface(background) ? '#F8FAFC' : '#0F172A'
  let current = color
  for (let i = 0; i < 7; i++) {
    current = mixColor(current, pole, 0.22)
    if (getContrastRatio(current, background) >= minContrast) return { color: current, adjusted: true }
  }
  return { color: pole, adjusted: true }
}

/**
 * Hue-preserving strengthening of a single accent/chart colour so it reads
 * clearly on the card surface. Pastels become richer mid-tones; near-black
 * colours on dark cards are lifted. Achromatic greys stay grey.
 */
function strengthenColor(color: string, background: string, target: number): { color: string; adjusted: boolean } {
  if (getContrastRatio(color, background) >= CHART_VISIBILITY_FLOOR) {
    // Strong enough — only temper true neon (full-saturation mid-lightness glare).
    const [h, s, l] = toHsl(color)
    if (s > 0.97 && l >= 0.45 && l <= 0.62) return { color: hslToHex(h, 0.9, l), adjusted: true }
    return { color, adjusted: false }
  }
  const dark = isDarkSurface(background)
  let [h, s, l] = toHsl(color)
  let current = color
  for (let i = 0; i < 9 && getContrastRatio(current, background) < target; i++) {
    l = dark ? Math.min(0.82, l + 0.06) : Math.max(0.16, l - 0.06)
    if (s >= 0.1) s = Math.min(0.88, s + 0.05)
    current = hslToHex(h, s, l)
  }
  return { color: current, adjusted: true }
}

/* ── Chart colours ──────────────────────────────────────────────── */

export interface RefinedChartColors {
  colors: string[]
  /** How many input colours had to be strengthened or separated. */
  adjustedCount: number
}

/**
 * Rule 5+10: keep strong palettes untouched; strengthen washed-out colours
 * (saturation/lightness toward readable, hue preserved); temper neon; nudge
 * near-duplicate neighbours apart so charts always have distinct series.
 */
export function refineChartColors(colors: readonly string[], visualBackground: string): RefinedChartColors {
  const background = normalizeHexColor(visualBackground, '#FFFFFF')
  let adjustedCount = 0
  const out = colors.map((raw) => {
    const color = normalizeHexColor(raw, '#0D9488')
    const result = strengthenColor(color, background, CHART_VISIBILITY_TARGET)
    if (result.adjusted) adjustedCount++
    return result.color
  })

  // Distinctness pass: same-hue near-duplicates get a lightness nudge.
  const dark = isDarkSurface(background)
  let fixes = 0
  for (let i = 0; i < Math.min(out.length, 6) && fixes < 3; i++) {
    for (let j = i + 1; j < Math.min(out.length, 6) && fixes < 3; j++) {
      const [hi, , li] = toHsl(out[i])
      const [hj, sj, lj] = toHsl(out[j])
      if (hueDistance(hi, hj) < 18 && getContrastRatio(out[i], out[j]) < 1.12) {
        const direction = lj >= li ? 1 : -1
        const nudged = Math.max(0.15, Math.min(0.85, lj + direction * (dark ? 0.14 : 0.12)))
        const candidate = hslToHex(hj, sj, nudged)
        if (getContrastRatio(candidate, background) >= CHART_VISIBILITY_FLOOR) {
          out[j] = candidate
          adjustedCount++
          fixes++
        }
      }
    }
  }
  return { colors: out.map((c) => normalizeHexColor(c, '#0D9488')), adjustedCount }
}

/** Strengthen a single KPI/accent colour so it stays clearly visible on the card. */
export function ensureAccentVisible(color: string | undefined, visualBackground: string, fallback: string): string {
  const base = normalizeHexColor(color, fallback)
  return normalizeHexColor(
    strengthenColor(base, normalizeHexColor(visualBackground, '#FFFFFF'), KPI_VISIBILITY_TARGET).color,
    fallback,
  )
}

/* ── Surface set resolution ─────────────────────────────────────── */

const LIGHT_KPI = { good: '#16A34A', bad: '#DC2626', neutral: '#F59E0B' }
const DARK_KPI = { good: '#22C55E', bad: '#F87171', neutral: '#FBBF24' }

/**
 * Resolve one complete validated surface set from declared values. Locked
 * fields are explicit user selections and pass through verbatim.
 */
export function resolveSurfaceSet(
  declared: DeclaredSurfaceSet,
  palette: { primary: string; accent?: string },
  locks: SurfaceLocks = {},
): ResolvedSurfaceSet {
  const adjusted: string[] = []
  const primary = normalizeHexColor(palette.primary, '#0D9488')

  /* Canvas (rule 1): near-white theme pages pick up a faint primary hue. */
  let canvas = normalizeHexColor(declared.canvasBackground, '#F8FAFC')
  if (!locks.canvasBackground && getRelativeLuminance(canvas) > 0.92) {
    canvas = mixColor(canvas, lighten(primary, 60), 0.06)
  }
  const mode: SurfaceMode = isDarkSurface(canvas) ? 'dark' : 'light'
  const dark = mode === 'dark'

  /* Visual card (rule 2): enforce clear separation from the canvas. */
  const declaredVisual = normalizeHexColor(
    declared.visualBackground,
    dark ? mixColor(canvas, '#FFFFFF', 0.08) : '#FFFFFF',
  )
  const separation = ensureSurfaceSeparation(canvas, declaredVisual, primary, {
    canvas: Boolean(locks.canvasBackground),
    visual: Boolean(locks.visualBackground),
  })
  canvas = separation.canvas
  let visual = separation.visual
  if (separation.adjusted) adjusted.push('canvas/visual separation')

  /* Rule 3: a theme-sourced pure-white card still carries a faint primary wash
     (so the card visibly belongs to the palette) — but only when the tint does
     not eat the separation we just guaranteed. */
  if (!locks.visualBackground && !dark && getRelativeLuminance(visual) > 0.985) {
    for (const tint of [0.035, 0.02]) {
      const tinted = mixColor(visual, primary, tint)
      if (isSurfaceSeparated(canvas, tinted)) {
        visual = tinted
        break
      }
    }
  }

  /* Title background (rule 4): match the card unless intentionally distinct.
     A declared header equal to the OLD card surface follows the card. */
  let titleBackground = normalizeHexColor(declared.titleBackground, visual)
  if (!locks.titleBackground && getContrastRatio(titleBackground, declaredVisual) < 1.02) {
    titleBackground = visual
  }

  /* Border (rule 5): soft, visible card outline. */
  let borderColor = normalizeHexColor(declared.borderColor, '')
  const borderOk = declared.borderColor
    && getContrastRatio(borderColor, visual) >= 1.08
    && getContrastRatio(borderColor, visual) <= 3.2
  if (!locks.borderColor && !borderOk) {
    borderColor = mixColor(mixColor(visual, dark ? '#F8FAFC' : '#334155', dark ? 0.22 : 0.15), primary, 0.12)
    adjusted.push('borderColor')
  }

  /* Gridline: subtler than the border. */
  let gridlineColor = normalizeHexColor(declared.gridlineColor, '')
  const gridOk = declared.gridlineColor
    && getContrastRatio(gridlineColor, visual) >= 1.03
    && getContrastRatio(gridlineColor, visual) <= 2.4
  if (!locks.gridlineColor && !gridOk) {
    gridlineColor = mixColor(borderColor, visual, 0.45)
    if (declared.gridlineColor) adjusted.push('gridlineColor')
  }

  /* Table header: needs its own presence vs the card. */
  let tableHeaderBackground = normalizeHexColor(declared.tableHeaderBackground, '')
  const headerOk = declared.tableHeaderBackground && getContrastRatio(tableHeaderBackground, visual) >= 1.06
  if (!locks.tableHeaderBackground && !headerOk) {
    tableHeaderBackground = mixColor(visual, primary, dark ? 0.25 : 0.12)
    if (declared.tableHeaderBackground) adjusted.push('tableHeaderBackground')
  }

  /* Table alternating row: a visible-but-subtle zebra tint. */
  let tableRowAlt = normalizeHexColor(declared.tableRowAlt, '')
  const rowAltOk = declared.tableRowAlt && getContrastRatio(tableRowAlt, visual) >= 1.01
  if (!locks.tableRowAlt && !rowAltOk) {
    tableRowAlt = dark ? mixColor(visual, '#FFFFFF', 0.05) : mixColor(visual, '#000000', 0.035)
    if (declared.tableRowAlt) adjusted.push('tableRowAlt')
  }

  /* Text (rule 9): readable on the card. */
  const fallbackText = dark ? '#F8FAFC' : '#0F172A'
  const fallbackLabel = dark ? '#CBD5E1' : '#475569'
  const fg = ensureReadableText(normalizeHexColor(declared.foreground, fallbackText), visual, TITLE_CONTRAST_MIN)
  const foreground = locks.foreground ? normalizeHexColor(declared.foreground, fallbackText) : fg.color
  if (!locks.foreground && fg.adjusted) adjusted.push('foreground')
  const tc = ensureReadableText(normalizeHexColor(declared.titleColor, foreground), titleBackground, TITLE_CONTRAST_MIN)
  const titleColor = locks.titleColor ? normalizeHexColor(declared.titleColor, foreground) : tc.color
  if (!locks.titleColor && tc.adjusted) adjusted.push('titleColor')
  const lc = ensureReadableText(normalizeHexColor(declared.labelColor, fallbackLabel), visual, LABEL_CONTRAST_MIN)
  const labelColor = locks.labelColor ? normalizeHexColor(declared.labelColor, fallbackLabel) : lc.color
  if (!locks.labelColor && lc.adjusted) adjusted.push('labelColor')

  /* KPI semaphore colours: always clearly visible on the card. */
  const kpiDefaults = dark ? DARK_KPI : LIGHT_KPI
  const kpiGood = ensureAccentVisible(declared.kpiGood, visual, kpiDefaults.good)
  const kpiBad = ensureAccentVisible(declared.kpiBad, visual, kpiDefaults.bad)
  const kpiNeutral = ensureAccentVisible(declared.kpiNeutral, visual, kpiDefaults.neutral)

  return {
    mode,
    canvasBackground: normalizeHexColor(canvas, '#F8FAFC'),
    visualBackground: normalizeHexColor(visual, '#FFFFFF'),
    titleBackground: normalizeHexColor(titleBackground, visual),
    borderColor: normalizeHexColor(borderColor, '#E2E8F0'),
    gridlineColor: normalizeHexColor(gridlineColor, borderColor),
    tableHeaderBackground: normalizeHexColor(tableHeaderBackground, visual),
    tableRowAlt: normalizeHexColor(tableRowAlt, visual),
    foreground: normalizeHexColor(foreground, fallbackText),
    titleColor: normalizeHexColor(titleColor, foreground),
    labelColor: normalizeHexColor(labelColor, fallbackLabel),
    kpiGood,
    kpiBad,
    kpiNeutral,
    adjusted,
  }
}

/* ── Quality scoring ────────────────────────────────────────────── */

export interface SurfaceQuality {
  score: number
  warnings: string[]
}

export function scoreSurfaceQuality(surfaces: ResolvedSurfaceSet, dataColors: readonly string[]): SurfaceQuality {
  const warnings: string[] = []
  let score = 0

  // Canvas vs card separation (25)
  const gap = Math.abs(getRelativeLuminance(surfaces.canvasBackground) - getRelativeLuminance(surfaces.visualBackground))
  const ratio = getContrastRatio(surfaces.canvasBackground, surfaces.visualBackground)
  const sepScore = Math.min(1, Math.max(gap / LUM_GAP_MIN, (ratio - 1) / (RATIO_MIN - 1)))
  score += sepScore * 25
  if (sepScore < 1) warnings.push('Canvas and visual background separation is below target.')

  // Title + label readability (35)
  const titleRatio = getContrastRatio(surfaces.titleColor, surfaces.titleBackground)
  score += Math.min(1, titleRatio / TITLE_CONTRAST_MIN) * 20
  if (titleRatio < TITLE_CONTRAST_MIN) warnings.push('Title text contrast is below 4.5:1.')
  const labelRatio = getContrastRatio(surfaces.labelColor, surfaces.visualBackground)
  score += Math.min(1, labelRatio / LABEL_CONTRAST_MIN) * 15
  if (labelRatio < LABEL_CONTRAST_MIN) warnings.push('Label text contrast is below 3.5:1.')

  // Chart colours visible on the card (25)
  const visible = dataColors.filter((c) => getContrastRatio(c, surfaces.visualBackground) >= CHART_VISIBILITY_FLOOR)
  score += (dataColors.length ? visible.length / dataColors.length : 0) * 25
  if (visible.length < Math.min(3, dataColors.length)) {
    warnings.push(`Only ${visible.length} chart colour(s) are clearly visible on the visual background.`)
  }

  // Distinctness of leading colours (15)
  const lead = dataColors.slice(0, 6)
  let distinctPairs = 0
  let pairs = 0
  for (let i = 0; i < lead.length; i++) {
    for (let j = i + 1; j < lead.length; j++) {
      pairs++
      const [hi] = toHsl(lead[i])
      const [hj] = toHsl(lead[j])
      if (hueDistance(hi, hj) >= 18 || getContrastRatio(lead[i], lead[j]) >= 1.12) distinctPairs++
    }
  }
  score += (pairs ? distinctPairs / pairs : 1) * 15
  if (pairs && distinctPairs < pairs) warnings.push('Some chart colours are hard to tell apart.')

  return { score: Math.round(Math.min(100, score)), warnings }
}

/* ── Full dual-mode formula ─────────────────────────────────────── */

/** Synthesize a missing mode's declared surfaces from the palette. */
function synthesizeDeclared(mode: SurfaceMode, primary: string): DeclaredSurfaceSet {
  return mode === 'dark'
    ? { canvasBackground: mixColor('#0F172A', primary, 0.08) }
    : { canvasBackground: mixColor('#F8FAFC', primary, 0.04) }
}

export function resolveSurfaceFormula(input: SurfaceFormulaInput): SurfaceFormulaResult {
  const sourceColors = input.dataColors.length ? input.dataColors : (input.paletteColors ?? [])
  const primary = normalizeHexColor(input.primary, sourceColors[0] ?? '#0D9488')
  const palette = { primary, accent: input.accent }

  const declaredLight = input.light ?? synthesizeDeclared('light', primary)
  const declaredDark = input.dark ?? synthesizeDeclared('dark', primary)
  const light = resolveSurfaceSet(declaredLight, palette)
  const dark = resolveSurfaceSet(declaredDark, palette)

  const mode: SurfaceMode = input.activeMode
    ?? (input.light ? 'light' : input.dark ? 'dark' : 'light')
  const surfaces = mode === 'dark' ? dark : light

  const refined = refineChartColors(sourceColors, surfaces.visualBackground)
  const quality = scoreSurfaceQuality(surfaces, refined.colors)

  const warnings = [...quality.warnings]
  if (surfaces.adjusted.length) {
    warnings.unshift(`Corrected: ${surfaces.adjusted.join(', ')}.`)
  }
  if (refined.adjustedCount > 0) {
    warnings.unshift(`Strengthened ${refined.adjustedCount} chart colour(s) for readability.`)
  }

  return {
    mode,
    light,
    dark,
    surfaces,
    dataColors: refined.colors,
    contrastScore: quality.score,
    warnings,
  }
}
