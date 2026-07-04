import type { FormatValue, PresetTheme, ThemeTypographyDefaults } from '@/types'

const BASELINE: ThemeTypographyDefaults = {
  fontFamily: 'Segoe UI',
  titleFontSize: 14,
  subtitleFontSize: 10,
  headerFontSize: 11,
  labelFontSize: 10,
  dataLabelFontSize: 10,
  calloutFontSize: 36,
  titleFontBold: true,
  titleFontItalic: false,
  titleFontUnderline: false,
  subtitleFontBold: false,
  subtitleFontItalic: false,
  subtitleFontUnderline: false,
}

export const APP_TYPOGRAPHY_BASELINE: ThemeTypographyDefaults = { ...BASELINE }

export const TYPOGRAPHY_FORMAT_KEYS = [
  'general.typography.fontFace',
  'general.title.fontFamily',
  'general.title.fontSize',
  'general.subtitle.fontSize',
  'general.title.subtitle.font.size',
  'general.title.subtitle.fontSize',
  'general.header.fontSize',
  'general.label.fontSize',
  'general.dataLabels.fontSize',
  'general.dataLabel.fontSize',
  'general.callout.fontSize',
  'general.title.fontBold',
  'general.title.fontItalic',
  'general.title.fontUnderline',
  'general.subtitle.fontBold',
  'general.subtitle.fontItalic',
  'general.subtitle.fontUnderline',
  'general.title.subtitle.fontStyle.bold',
  'general.title.subtitle.fontStyle.italic',
  'general.title.subtitle.fontStyle.underline',
] as const

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function textClass(value: unknown): UnknownRecord | undefined {
  return isRecord(value) ? value : undefined
}

export function typographyDefaultsToFormatProps(defaults: ThemeTypographyDefaults): Record<string, FormatValue> {
  return {
    'general.typography.fontFace': defaults.fontFamily,
    'general.title.fontSize': defaults.titleFontSize,
    'general.subtitle.fontSize': defaults.subtitleFontSize,
    'general.header.fontSize': defaults.headerFontSize,
    'general.label.fontSize': defaults.labelFontSize,
    'general.dataLabels.fontSize': defaults.dataLabelFontSize,
    'general.callout.fontSize': defaults.calloutFontSize,
    'general.title.fontBold': defaults.titleFontBold,
    'general.title.fontItalic': defaults.titleFontItalic,
    'general.title.fontUnderline': defaults.titleFontUnderline,
    'general.subtitle.fontBold': defaults.subtitleFontBold,
    'general.subtitle.fontItalic': defaults.subtitleFontItalic,
    'general.subtitle.fontUnderline': defaults.subtitleFontUnderline,
  }
}

export function removeTypographyFormatProps(props: Record<string, FormatValue>): Record<string, FormatValue> {
  const blocked = new Set<string>(TYPOGRAPHY_FORMAT_KEYS)
  return Object.fromEntries(Object.entries(props).filter(([key]) => !blocked.has(key)))
}

export function typographyDefaultsFromPreset(preset: PresetTheme): ThemeTypographyDefaults {
  const fontFamily = preset.fontFamily || BASELINE.fontFamily
  const titleFontSize = preset.titleFontSize ?? BASELINE.titleFontSize
  const labelFontSize = preset.labelFontSize ?? BASELINE.labelFontSize
  return {
    ...BASELINE,
    fontFamily,
    titleFontSize,
    labelFontSize,
    dataLabelFontSize: labelFontSize,
  }
}

export function typographyDefaultsFromTextClasses(textClasses: unknown): ThemeTypographyDefaults | undefined {
  if (!isRecord(textClasses)) return undefined

  const title = textClass(textClasses.title)
  const label = textClass(textClasses.label)
  const header = textClass(textClasses.header)
  const callout = textClass(textClasses.callout)
  const fontFamily =
    stringValue(title?.fontFace) ??
    stringValue(label?.fontFace) ??
    stringValue(header?.fontFace) ??
    stringValue(callout?.fontFace) ??
    BASELINE.fontFamily
  const labelFontSize = numberValue(label?.fontSize) ?? BASELINE.labelFontSize

  return {
    ...BASELINE,
    fontFamily,
    titleFontSize: numberValue(title?.fontSize) ?? BASELINE.titleFontSize,
    subtitleFontSize: labelFontSize,
    headerFontSize: numberValue(header?.fontSize) ?? BASELINE.headerFontSize,
    labelFontSize,
    dataLabelFontSize: labelFontSize,
    calloutFontSize: numberValue(callout?.fontSize) ?? BASELINE.calloutFontSize,
  }
}
