import type { PowerBIColorObject, PowerBITheme, ThemeImportPatch, ThemeState, ValidationResult } from '@/types'

const FALLBACK_COLORS = [
  '#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#10B981', '#F97316', '#EC4899',
]

const HEX_3 = /^#?([0-9a-fA-F]{3})$/
const HEX_6 = /^#?([0-9a-fA-F]{6})$/
const ALLOWED_TEXT_CLASSES = new Set(['callout', 'title', 'header', 'label'])

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && (HEX_3.test(value.trim()) || HEX_6.test(value.trim()))
}

function isValidPowerBIHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-F]{6}$/i.test(value.trim())
}

function normalizeHex(value: unknown, fallback = '#000000'): string {
  if (typeof value !== 'string') return fallback

  const raw = value.trim()
  const shortMatch = raw.match(HEX_3)
  if (shortMatch) {
    return `#${shortMatch[1].split('').map((char) => char + char).join('')}`.toUpperCase()
  }

  const longMatch = raw.match(HEX_6)
  if (longMatch) return `#${longMatch[1]}`.toUpperCase()

  return fallback
}

function solidColor(color: string): PowerBIColorObject {
  return { solid: { color: normalizeHex(color) } }
}

function fontSize(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function getFormatValue(state: ThemeState, key: string): unknown {
  return state.formatProps[key]
}

function formatBoolean(state: ThemeState, key: string, fallback: boolean): boolean {
  return booleanValue(getFormatValue(state, key), fallback)
}

function formatNumber(state: ThemeState, key: string, fallback: number): number {
  return fontSize(getFormatValue(state, key), fallback)
}

function formatColor(state: ThemeState, key: string, fallback: string): string {
  return normalizeHex(getFormatValue(state, key), fallback)
}

function formatFirstColor(state: ThemeState, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = getFormatValue(state, key)
    if (typeof value === 'string' && value.trim()) return normalizeHex(value, fallback)
  }
  return fallback
}

function formatFirstNumber(state: ThemeState, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = fontSize(getFormatValue(state, key), Number.NaN)
    if (Number.isFinite(value)) return value
  }
  return fallback
}

function formatString(state: ThemeState, key: string, fallback: string): string {
  return stringValue(getFormatValue(state, key), fallback)
}

function alignmentValue(value: unknown): string {
  const normalized = stringValue(value, 'Left').toLowerCase()
  return ['left', 'center', 'right'].includes(normalized) ? normalized : 'left'
}

function themeColors(state: ThemeState): string[] {
  const sanitized = state.dataColors
    .map((color, index) => normalizeHex(color, FALLBACK_COLORS[index] ?? FALLBACK_COLORS[0]))
    .filter((color) => isValidHex(color))

  return [...sanitized, ...FALLBACK_COLORS].slice(0, 8)
}

type VisualStyleCards = Record<string, Array<Record<string, unknown>>>

function mergeVisualStyleCards(target: VisualStyleCards, source: VisualStyleCards): VisualStyleCards {
  return { ...target, ...source }
}

function barLikeCards(state: ThemeState, fg: string, labelSize: number): VisualStyleCards {
  const dataLabelColor = formatColor(state, 'bar.dataLabels.color', fg)
  const dataLabelSize = formatNumber(state, 'bar.dataLabels.fontSize', labelSize)
  const xAxisColor = formatColor(state, 'bar.xAxis.color', '#605E5C')
  const yAxisColor = formatColor(state, 'bar.yAxis.color', '#605E5C')
  const xAxisSize = formatFirstNumber(state, ['bar.xAxis.values.font.size'], labelSize)
  const yAxisSize = formatFirstNumber(state, ['bar.yAxis.values.font.size'], labelSize)
  const xAxisTitleColor = formatFirstColor(state, ['bar.xAxis.title.color'], xAxisColor)
  const yAxisTitleColor = formatFirstColor(state, ['bar.yAxis.title.color'], yAxisColor)
  const legendColor = formatFirstColor(state, ['bar.legend.text.color'], fg)
  const legendSize = formatFirstNumber(state, ['bar.legend.text.font.size'], labelSize)
  const gridColor = formatFirstColor(state, ['bar.plotArea.gridColor', 'bar.gridlines.horizontal.color', 'bar.gridlines.vertical.color'], '#EDEBE9')

  return {
    legend: [
      {
        show: formatBoolean(state, 'bar.legend.show', true),
        labelColor: solidColor(legendColor),
        fontSize: legendSize,
        fontFamily: formatString(state, 'bar.legend.text.font.family', stringValue(getFormatValue(state, 'general.typography.fontFace'), 'Segoe UI')),
      },
    ],
    dataLabels: [
      {
        show: formatBoolean(state, 'bar.dataLabels.show', true),
        color: solidColor(dataLabelColor),
        fontSize: dataLabelSize,
      },
    ],
    categoryAxis: [
      {
        show: formatBoolean(state, 'bar.xAxis.show', true),
        labelColor: solidColor(xAxisColor),
        titleColor: solidColor(xAxisTitleColor),
        gridlineColor: solidColor(gridColor),
        fontSize: xAxisSize,
      },
    ],
    valueAxis: [
      {
        show: formatBoolean(state, 'bar.yAxis.show', true),
        labelColor: solidColor(yAxisColor),
        titleColor: solidColor(yAxisTitleColor),
        gridlineColor: solidColor(gridColor),
        fontSize: yAxisSize,
      },
    ],
  }
}

function lineLikeCards(state: ThemeState, fg: string, labelSize: number): VisualStyleCards {
  const dataLabelColor = formatColor(state, 'line.dataLabels.color', fg)
  const dataLabelSize = formatNumber(state, 'line.dataLabels.fontSize', labelSize)
  const xAxisColor = formatColor(state, 'line.xAxis.color', '#605E5C')
  const yAxisColor = formatColor(state, 'line.yAxis.color', '#605E5C')
  const legendColor = formatFirstColor(state, ['line.legend.text.color'], fg)
  const legendSize = formatFirstNumber(state, ['line.legend.text.font.size'], labelSize)
  const xAxisSize = formatFirstNumber(state, ['line.xAxis.values.font.size'], labelSize)
  const yAxisSize = formatFirstNumber(state, ['line.yAxis.values.font.size'], labelSize)

  return {
    legend: [
      {
        show: formatBoolean(state, 'line.legend.show', true),
        labelColor: solidColor(legendColor),
        fontSize: legendSize,
      },
    ],
    dataLabels: [
      {
        show: formatBoolean(state, 'line.dataLabels.show', false),
        color: solidColor(dataLabelColor),
        fontSize: dataLabelSize,
      },
    ],
    markers: [
      {
        show: formatBoolean(state, 'line.markers.show', true),
        size: formatNumber(state, 'line.markers.size', 3),
      },
    ],
    categoryAxis: [
      {
        show: formatBoolean(state, 'line.xAxis.show', true),
        labelColor: solidColor(xAxisColor),
        titleColor: solidColor(xAxisColor),
        gridlineColor: solidColor('#EDEBE9'),
        fontSize: xAxisSize,
      },
    ],
    valueAxis: [
      {
        show: formatBoolean(state, 'line.yAxis.show', true),
        labelColor: solidColor(yAxisColor),
        titleColor: solidColor(yAxisColor),
        gridlineColor: solidColor('#EDEBE9'),
        fontSize: yAxisSize,
      },
    ],
  }
}

function pieLikeCards(state: ThemeState, fg: string, labelSize: number, prefix: 'pie' | 'donut'): VisualStyleCards {
  const legendColor = formatFirstColor(state, [`${prefix}.legend.text.color`], fg)
  const legendSize = formatFirstNumber(state, [`${prefix}.legend.text.font.size`], labelSize)
  const labelColor = formatFirstColor(state, [`${prefix}.detailLabels.color`, `${prefix}.detailLabels.values.color`], fg)
  const detailLabelSize = formatFirstNumber(state, [`${prefix}.detailLabels.values.font.size`], labelSize)

  return {
    legend: [
      {
        show: formatBoolean(state, `${prefix}.legend.show`, true),
        labelColor: solidColor(legendColor),
        fontSize: legendSize,
      },
    ],
    detailLabels: [
      {
        show: formatBoolean(state, `${prefix}.detailLabels.show`, true),
        color: solidColor(labelColor),
        fontSize: detailLabelSize,
      },
    ],
  }
}

function treemapCards(state: ThemeState, fg: string, labelSize: number): VisualStyleCards {
  const legendColor = formatFirstColor(state, ['treemap.legend.text.color'], fg)
  const legendSize = formatFirstNumber(state, ['treemap.legend.text.font.size'], labelSize)
  const dataLabelColor = formatFirstColor(state, ['treemap.dataLabels.values.color'], fg)
  const dataLabelSize = formatFirstNumber(state, ['treemap.dataLabels.values.font.size'], labelSize)
  const categoryLabelColor = formatFirstColor(state, ['treemap.categoryLabels.values.color'], fg)
  const categoryLabelSize = formatFirstNumber(state, ['treemap.categoryLabels.values.font.size'], labelSize)

  return {
    legend: [
      {
        show: formatBoolean(state, 'treemap.legend.show', true),
        labelColor: solidColor(legendColor),
        fontSize: legendSize,
      },
    ],
    dataLabels: [
      {
        show: formatBoolean(state, 'treemap.dataLabels.show', true),
        color: solidColor(dataLabelColor),
        fontSize: dataLabelSize,
      },
    ],
    categoryLabels: [
      {
        show: formatBoolean(state, 'treemap.categoryLabels.show', true),
        color: solidColor(categoryLabelColor),
        fontSize: categoryLabelSize,
      },
    ],
  }
}

function tableCards(state: ThemeState, fg: string, bg: string, tableAccent: string, labelSize: number, prefix: 'table' | 'matrix'): VisualStyleCards {
  const headerBg = formatColor(state, `${prefix}.columnHeaders.background`, tableAccent)
  const headerColor = formatColor(state, `${prefix}.columnHeaders.fontColor`, '#FFFFFF')
  const gridColor = formatColor(state, `${prefix}.grid.color`, '#EDEBE9')

  return {
    grid: [
      {
        gridVertical: formatBoolean(state, `${prefix}.grid.vertical`, false),
        gridHorizontal: formatBoolean(state, `${prefix}.grid.horizontal`, true),
        outlineColor: solidColor(gridColor),
        textSize: labelSize,
      },
    ],
    columnHeaders: [
      {
        fontColor: solidColor(headerColor),
        backColor: solidColor(headerBg),
        fontFamily: stringValue(getFormatValue(state, 'general.typography.fontFace'), 'Segoe UI'),
      },
    ],
    values: [
      {
        fontColorPrimary: solidColor(fg),
        backColorPrimary: solidColor(bg),
        fontSize: formatNumber(state, `${prefix}.values.fontSize`, labelSize),
      },
    ],
  }
}

export function generateThemeJSON(state: ThemeState): PowerBITheme {
  const colors = themeColors(state)
  const bg = normalizeHex(state.bg, '#FFFFFF')
  const fg = normalizeHex(state.fg, '#252423')
  const primary = normalizeHex(state.primary, colors[0])
  const accent = normalizeHex(state.accent, colors[1])
  const tableAccent = normalizeHex(state.tableAccent, primary)
  const good = normalizeHex(state.good, '#10B981')
  const neutral = normalizeHex(state.neutral, '#F59E0B')
  const bad = normalizeHex(state.bad, '#EF4444')
  const fontFace = stringValue(
    getFormatValue(state, 'general.typography.fontFace'),
    stringValue(getFormatValue(state, 'general.title.fontFamily'), 'Segoe UI'),
  )

  const titleSize = formatNumber(state, 'general.title.fontSize', 12)
  const headerSize = formatNumber(state, 'general.header.fontSize', 11)
  const labelSize = formatNumber(state, 'general.label.fontSize', 9)
  const calloutSize = formatNumber(state, 'general.callout.fontSize', 36)
  const titleColor = formatColor(state, 'general.title.fontColor', fg)
  const titleBackground = formatColor(state, 'general.title.background', bg)
  const titleTransparency = formatNumber(state, 'general.title.transparency', 100)
  const titleAlignment = alignmentValue(getFormatValue(state, 'general.title.alignment'))
  const titleBold = formatBoolean(state, 'general.title.fontBold', true)
  const visualBg = formatColor(state, 'general.background.color', bg)
  const backgroundTransparency = formatNumber(state, 'general.background.transparency', 0)
  const borderColor = formatColor(state, 'general.border.color', '#E2E8F0')
  const borderRadius = formatNumber(state, 'general.border.radius', 2)
  const borderWidth = formatNumber(state, 'general.border.width', 1)
  const showTitle = formatBoolean(state, 'general.title.show', true)
  const showBackground = formatBoolean(state, 'general.background.show', true)
  const showBorder = formatBoolean(state, 'general.border.show', false)
  const showShadow = formatBoolean(state, 'general.shadow.show', false)
  const shadowColor = formatColor(state, 'general.shadow.color', '#000000')
  const shadowTransparency = formatNumber(state, 'general.shadow.transparency', 80)
  const shadowBlur = formatNumber(state, 'general.shadow.blur', 6)
  const shadowOffsetX = formatNumber(state, 'general.shadow.offsetX', 0)
  const shadowOffsetY = formatNumber(state, 'general.shadow.offsetY', 2)
  const paddingTop = formatNumber(state, 'general.padding.top', 8)
  const paddingRight = formatNumber(state, 'general.padding.right', 8)
  const paddingBottom = formatNumber(state, 'general.padding.bottom', 8)
  const paddingLeft = formatNumber(state, 'general.padding.left', 8)
  const baseCards: VisualStyleCards = {
    '*': [
      {
        fontFamily: fontFace,
        fontSize: labelSize,
        color: solidColor(fg),
      },
    ],
    background: [
      {
        show: showBackground,
        color: solidColor(visualBg),
        transparency: backgroundTransparency,
      },
    ],
    title: [
      {
        show: showTitle,
        fontColor: solidColor(titleColor),
        backgroundColor: solidColor(titleBackground),
        transparency: titleTransparency,
        fontSize: titleSize,
        fontFamily: fontFace,
        bold: titleBold,
        alignment: titleAlignment,
      },
    ],
    legend: [
      {
        show: true,
        labelColor: solidColor(fg),
        fontSize: labelSize,
        fontFamily: fontFace,
      },
    ],
    dataLabels: [
      {
        show: true,
        color: solidColor(fg),
        fontSize: labelSize,
        fontFamily: fontFace,
      },
    ],
    categoryAxis: [
      {
        show: true,
        labelColor: solidColor(fg),
        titleColor: solidColor(fg),
        gridlineColor: solidColor('#EDEBE9'),
        fontSize: labelSize,
      },
    ],
    valueAxis: [
      {
        show: true,
        labelColor: solidColor(fg),
        titleColor: solidColor(fg),
        gridlineColor: solidColor('#EDEBE9'),
        fontSize: labelSize,
      },
    ],
    visualHeader: [
      {
        show: true,
        foreground: solidColor(fg),
        background: solidColor(bg),
        border: solidColor(accent),
      },
    ],
    border: [
      {
        show: showBorder,
        color: solidColor(borderColor),
        radius: borderRadius,
        width: borderWidth,
      },
    ],
    dropShadow: [
      {
        show: showShadow,
        color: solidColor(shadowColor),
        transparency: shadowTransparency,
        blur: shadowBlur,
        offsetX: shadowOffsetX,
        offsetY: shadowOffsetY,
      },
    ],
    padding: [
      {
        top: paddingTop,
        right: paddingRight,
        bottom: paddingBottom,
        left: paddingLeft,
      },
    ],
  }
  const barCards = mergeVisualStyleCards(baseCards, barLikeCards(state, fg, labelSize))
  const lineCards = mergeVisualStyleCards(baseCards, lineLikeCards(state, fg, labelSize))
  const pieCards = mergeVisualStyleCards(baseCards, pieLikeCards(state, fg, labelSize, 'pie'))
  const donutCards = mergeVisualStyleCards(baseCards, pieLikeCards(state, fg, labelSize, 'donut'))
  const treemapStyleCards = mergeVisualStyleCards(baseCards, treemapCards(state, fg, labelSize))
  const tableStyleCards = tableCards(state, fg, bg, tableAccent, labelSize, 'table')
  const matrixStyleCards = tableCards(state, fg, bg, tableAccent, labelSize, 'matrix')

  return {
    name: state.themeName.trim() || 'Datacense Power BI Theme',
    dataColors: colors,
    background: bg,
    foreground: fg,
    tableAccent,
    good,
    neutral,
    bad,
    textClasses: {
      callout: { fontFace, fontSize: calloutSize, color: fg },
      title:   { fontFace, fontSize: titleSize,   color: titleColor },
      header:  { fontFace, fontSize: headerSize,  color: fg },
      label:   { fontFace, fontSize: labelSize,   color: fg },
    },
    visualStyles: {
      '*': {
        '*': baseCards,
      },
      barChart: {
        '*': barCards,
      },
      clusteredBarChart: {
        '*': barCards,
      },
      hundredPercentStackedBarChart: {
        '*': barCards,
      },
      columnChart: {
        '*': barCards,
      },
      clusteredColumnChart: {
        '*': barCards,
      },
      hundredPercentStackedColumnChart: {
        '*': barCards,
      },
      waterfallChart: {
        '*': barCards,
      },
      funnel: {
        '*': barCards,
      },
      lineChart: {
        '*': lineCards,
      },
      areaChart: {
        '*': lineCards,
      },
      lineClusteredColumnComboChart: {
        '*': mergeVisualStyleCards(lineCards, barLikeCards(state, fg, labelSize)),
      },
      lineStackedColumnComboChart: {
        '*': mergeVisualStyleCards(lineCards, barLikeCards(state, fg, labelSize)),
      },
      ribbonChart: {
        '*': lineCards,
      },
      scatterChart: {
        '*': lineCards,
      },
      pieChart: {
        '*': pieCards,
      },
      donutChart: {
        '*': donutCards,
      },
      treemap: {
        '*': treemapStyleCards,
      },
      card: {
        '*': mergeVisualStyleCards(baseCards, {
          calloutValue: [
            {
              color: solidColor(primary),
              fontSize: calloutSize,
              fontFamily: fontFace,
            },
          ],
          categoryLabels: [
            {
              color: solidColor(fg),
              fontSize: labelSize,
              fontFamily: fontFace,
            },
          ],
        }),
      },
      tableEx: {
        '*': mergeVisualStyleCards(baseCards, tableStyleCards),
      },
      pivotTable: {
        '*': mergeVisualStyleCards(baseCards, matrixStyleCards),
      },
    },
  }
}

export function downloadThemeJSON(state: ThemeState): void {
  if (typeof document === 'undefined') return

  const theme = generateThemeJSON(state)
  const json = JSON.stringify(theme, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const slug = (theme.name || 'datacense-power-bi-theme')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const filenameBase = slug.endsWith('-theme') ? slug : `${slug}-theme`

  anchor.href = url
  anchor.download = `${filenameBase}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function extractColor(value: unknown): string | undefined {
  if (isValidHex(value)) return normalizeHex(value)

  if (isRecord(value) && isRecord(value.solid) && isValidHex(value.solid.color)) {
    return normalizeHex(value.solid.color)
  }

  return undefined
}

async function parseThemeInput(input: File | string | unknown): Promise<unknown> {
  if (typeof File !== 'undefined' && input instanceof File) {
    return JSON.parse(await input.text()) as unknown
  }

  if (typeof input === 'string') {
    return JSON.parse(input) as unknown
  }

  return input
}

export async function parseImportedThemeJSON(input: File | string | unknown): Promise<ThemeImportPatch> {
  const parsed = await parseThemeInput(input)
  if (!isRecord(parsed)) throw new Error('Imported theme JSON must be an object.')

  const patch: ThemeImportPatch = {}
  const warnings: string[] = []

  if (typeof parsed.name === 'string' && parsed.name.trim()) patch.themeName = parsed.name.trim()

  if (Array.isArray(parsed.dataColors)) {
    const dataColors = parsed.dataColors.map(extractColor).filter((color): color is string => Boolean(color)).slice(0, 8)
    if (dataColors.length > 0) {
      patch.dataColors = dataColors
      patch.primary = dataColors[0]
      patch.accent = dataColors[1] ?? dataColors[0]
    } else {
      warnings.push('No valid dataColors were found.')
    }
  }

  const background = extractColor(parsed.background)
  const foreground = extractColor(parsed.foreground)
  const tableAccent = extractColor(parsed.tableAccent)
  const good = extractColor(parsed.good)
  const neutral = extractColor(parsed.neutral)
  const bad = extractColor(parsed.bad)

  if (background) patch.bg = background
  if (foreground) patch.fg = foreground
  if (tableAccent) patch.tableAccent = tableAccent
  if (good) patch.good = good
  if (neutral) patch.neutral = neutral
  if (bad) patch.bad = bad

  if (Object.keys(patch).length === 0) {
    warnings.push('The file was valid JSON, but no supported Power BI theme values were found.')
  }

  if (warnings.length) patch.warnings = warnings
  return patch
}

function validateRootColor(theme: UnknownRecord, key: string, errors: string[]): void {
  if (!(key in theme)) {
    errors.push(`Missing required root color: ${key}.`)
    return
  }

  if (!isValidPowerBIHex(theme[key])) errors.push(`${key} must be a valid #RRGGBB color string.`)
}

function validateVisualStylesColorObjects(value: unknown, path: string, errors: string[]): void {
  if (value === null || typeof value === 'undefined') {
    errors.push(`${path} must not be null or undefined inside visualStyles.`)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateVisualStylesColorObjects(entry, `${path}[${index}]`, errors))
    return
  }

  if (!isRecord(value)) {
    if (isValidHex(value)) errors.push(`${path} uses a plain color string inside visualStyles.`)
    return
  }

  if ('solid' in value) {
    if (!isRecord(value.solid) || !isValidPowerBIHex(value.solid.color)) {
      errors.push(`${path}.solid.color must be a valid #RRGGBB color.`)
    }
    return
  }

  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`
    const isColorLikeKey = key.toLowerCase().includes('color') || ['foreground', 'background', 'border', 'backColor', 'fontColor'].includes(key)

    if (typeof child === 'string' && isColorLikeKey) {
      errors.push(`${childPath} must use { solid: { color: "#RRGGBB" } }, not a plain string.`)
      return
    }

    validateVisualStylesColorObjects(child, childPath, errors)
  })
}

export function validateThemeJSON(themeObject: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isRecord(themeObject)) {
    return {
      isValid: false,
      errors: ['Theme JSON must be an object.'],
      warnings,
    }
  }

  if (typeof themeObject.name !== 'string' || !themeObject.name.trim()) {
    warnings.push('Theme name is empty or missing.')
  }

  if (!Array.isArray(themeObject.dataColors) || themeObject.dataColors.length === 0) {
    errors.push('dataColors must be a non-empty array.')
  } else {
    themeObject.dataColors.forEach((color, index) => {
      if (!isValidPowerBIHex(color)) errors.push(`dataColors[${index}] must be a valid #RRGGBB color.`)
    })
  }

  ;['background', 'foreground', 'tableAccent', 'good', 'neutral', 'bad'].forEach((key) =>
    validateRootColor(themeObject, key, errors),
  )

  if (!isRecord(themeObject.textClasses)) {
    errors.push('textClasses must be an object.')
  } else {
    const textClasses = themeObject.textClasses

    Object.keys(textClasses).forEach((key) => {
      if (!ALLOWED_TEXT_CLASSES.has(key)) {
        errors.push(`Unsupported textClasses key "${key}". Allowed keys: callout, title, header, label.`)
      }
    })

    ;['callout', 'title', 'header', 'label'].forEach((key) => {
      if (!(key in textClasses)) {
        warnings.push(`textClasses.${key} is missing.`)
      } else if (Array.isArray(textClasses[key])) {
        errors.push(`textClasses.${key} must be an object, not an array.`)
      } else if (!isRecord(textClasses[key])) {
        errors.push(`textClasses.${key} must be an object.`)
      }
    })
  }

  if (!isRecord(themeObject.visualStyles)) {
    errors.push('visualStyles must be an object.')
  } else {
    validateVisualStylesColorObjects(themeObject.visualStyles, 'visualStyles', errors)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
