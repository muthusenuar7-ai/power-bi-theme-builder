import type { ValidationResult } from '@/types'

const POWER_BI_HEX = /^#[0-9A-F]{6}$/i
const HEX_LIKE = /^#?[0-9A-F]{3}(?:[0-9A-F]{3})?$/i
const FORBIDDEN_COLOR_FORMS = /\b(rgba?|hsla?)\s*\(/i
const ALLOWED_TEXT_CLASSES = new Set(['callout', 'title', 'header', 'label'])
const VALID_DROP_SHADOW_POSITIONS = new Set(['Outer', 'Inner'])
const VALID_GRIDLINE_STYLES = new Set(['solid', 'dashed', 'dotted', 'custom'])
const VALID_PIE_LABEL_POSITIONS = new Set(['outside', 'inside', 'preferOutside', 'preferInside'])
const VALID_TREEMAP_TILING_METHODS = new Set(['stableSquarified', 'binary', 'alternating'])
const REQUIRED_BACKGROUND_VISUALS = [
  '*',
  'barChart',
  'clusteredBarChart',
  'columnChart',
  'clusteredColumnChart',
  'lineChart',
  'areaChart',
  'pieChart',
  'donutChart',
  'treemap',
  'waterfallChart',
  'scatterChart',
  'funnel',
  'card',
  'cardVisual',
  'tableEx',
  'pivotTable',
  'slicer',
] as const
const ROOT_COLOR_KEYS = [
  'background',
  'foreground',
  'tableAccent',
  'good',
  'neutral',
  'bad',
  'firstLevelElements',
  'secondLevelElements',
  'thirdLevelElements',
  'fourthLevelElements',
  'secondaryBackground',
  'maximum',
  'center',
  'minimum',
  'null',
] as const

const APP_ONLY_FIELDS = new Set([
  'paletteSize',
  'dataColorsFull',
  'dashboardDomain',
  'execDomain',
  'execPage',
  'formatProps',
  'selectedVisual',
  'selectedIconId',
  'selectedIconUrl',
  'selectedIconColor',
  'recentIcons',
  'visualTitles',
  'layout',
  'pageSize',
  'zoom',
  'spacing',
  'currentPage',
  'focusVisual',
  'skillLevel',
  'activeFormatTab',
])

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isColorLikeKey(key: string): boolean {
  const normalized = key.toLowerCase()
  return (
    normalized.includes('color') ||
    normalized.includes('foreground') ||
    normalized.includes('background') ||
    normalized.includes('border') ||
    normalized.includes('fill') ||
    normalized.includes('outlinecolor') ||
    normalized === 'barcolor'
  )
}

function validateNoNullUndefinedOrRgba(value: unknown, path: string, errors: string[]): void {
  if (value === null || typeof value === 'undefined') {
    errors.push(`${path} must not be null or undefined.`)
    return
  }

  if (typeof value === 'string') {
    if (FORBIDDEN_COLOR_FORMS.test(value)) errors.push(`${path} uses rgba/rgb/hsl, which is not valid in a Power BI theme export.`)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoNullUndefinedOrRgba(item, `${path}[${index}]`, errors))
    return
  }

  if (isRecord(value)) {
    Object.entries(value).forEach(([key, child]) => validateNoNullUndefinedOrRgba(child, `${path}.${key}`, errors))
  }
}

function validateVisualStyleColors(value: unknown, path: string, errors: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateVisualStyleColors(item, `${path}[${index}]`, errors))
    return
  }

  if (!isRecord(value)) {
    if (typeof value === 'string' && HEX_LIKE.test(value.trim())) {
      errors.push(`${path} uses a plain color string inside visualStyles. Use { solid: { color: "#RRGGBB" } }.`)
    }
    return
  }

  if ('solid' in value) {
    const solid = value.solid
    if (!isRecord(solid) || typeof solid.color !== 'string' || !POWER_BI_HEX.test(solid.color)) {
      errors.push(`${path}.solid.color must be a valid #RRGGBB value.`)
    }
    return
  }

  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`
    if (typeof child === 'string' && isColorLikeKey(key)) {
      errors.push(`${childPath} must use { solid: { color: "#RRGGBB" } }, not a plain string.`)
      return
    }
    validateVisualStyleColors(child, childPath, errors)
  })
}

function validateVisualStyleSchemaValues(value: unknown, path: string, errors: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateVisualStyleSchemaValues(item, `${path}[${index}]`, errors))
    return
  }

  if (!isRecord(value)) return

  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`

    if (key === 'position' && path.includes('.dropShadow[')) {
      if (typeof child !== 'string' || !VALID_DROP_SHADOW_POSITIONS.has(child)) {
        errors.push(`${childPath} must be "Outer" or "Inner".`)
      }
    }

    if (key === 'gridlineStyle') {
      if (typeof child !== 'string' || !VALID_GRIDLINE_STYLES.has(child)) {
        errors.push(`${childPath} must be one of solid, dashed, dotted, or custom.`)
      }
    }

    if (
      key === 'position' &&
      path.includes('.labels[') &&
      (path.includes('visualStyles.pieChart.') || path.includes('visualStyles.donutChart.'))
    ) {
      if (typeof child !== 'string' || !VALID_PIE_LABEL_POSITIONS.has(child)) {
        errors.push(`${childPath} must be one of outside, inside, preferOutside, or preferInside.`)
      }
    }

    if (key === 'innerRadiusRatio') {
      if (typeof child !== 'number' || !Number.isInteger(child)) {
        errors.push(`${childPath} must be an integer.`)
      }
    }

    if (key === 'tilingMethod') {
      if (typeof child !== 'string' || !VALID_TREEMAP_TILING_METHODS.has(child)) {
        errors.push(`${childPath} must be one of stableSquarified, binary, or alternating.`)
      }
    }

    if (key === 'outlineStyle') {
      if (typeof child !== 'number' || !Number.isInteger(child)) {
        errors.push(`${childPath} must be an integer.`)
      }
    }

    validateVisualStyleSchemaValues(child, childPath, errors)
  })
}

function validateTextClasses(value: unknown, errors: string[], warnings: string[]): void {
  if (!isRecord(value)) {
    errors.push('textClasses must be an object.')
    return
  }

  Object.entries(value).forEach(([key, child]) => {
    if (!ALLOWED_TEXT_CLASSES.has(key)) {
      errors.push(`Unsupported textClasses key "${key}". Allowed keys are callout, title, header, and label.`)
    }
    if (!isRecord(child) || Array.isArray(child)) {
      errors.push(`textClasses.${key} must be an object.`)
      return
    }
    const color = child.color
    if (typeof color !== 'undefined' && (typeof color !== 'string' || !POWER_BI_HEX.test(color))) {
      errors.push(`textClasses.${key}.color must be a #RRGGBB string.`)
    }
  })

  ;['callout', 'title', 'header', 'label'].forEach((key) => {
    if (!(key in value)) warnings.push(`textClasses.${key} is missing.`)
  })
}

function isSolidColorObject(value: unknown): boolean {
  return isRecord(value) &&
    isRecord(value.solid) &&
    typeof value.solid.color === 'string' &&
    POWER_BI_HEX.test(value.solid.color)
}

function validateBackgroundCard(card: unknown, path: string, errors: string[], options: { requireShow?: boolean } = {}): void {
  if (!isRecord(card)) {
    errors.push(`${path} must be an object.`)
    return
  }

  if (options.requireShow && card.show !== true) {
    errors.push(`${path}.show must be true for exported visual background defaults.`)
  }

  if (!isSolidColorObject(card.color)) {
    errors.push(`${path}.color must use { solid: { color: "#RRGGBB" } }.`)
  }

  if (card.transparency !== 0) {
    errors.push(`${path}.transparency must be 0 for exported background defaults.`)
  }
}

function validateBorderCard(card: unknown, path: string, errors: string[]): void {
  if (!isRecord(card)) {
    errors.push(`${path} must be an object.`)
    return
  }

  if (typeof card.show !== 'boolean') {
    errors.push(`${path}.show must be a boolean.`)
  }

  if (!isSolidColorObject(card.color)) {
    errors.push(`${path}.color must use { solid: { color: "#RRGGBB" } }.`)
  }
}

function visualCards(visualStyles: UnknownRecord, visualType: string): UnknownRecord | undefined {
  const visual = visualStyles[visualType]
  if (!isRecord(visual)) return undefined
  const wildcard = visual['*']
  return isRecord(wildcard) ? wildcard : undefined
}

function firstCard(cards: UnknownRecord, objectName: string): unknown {
  const value = cards[objectName]
  return Array.isArray(value) ? value[0] : undefined
}

function validateBackgroundAndBorderDefaults(visualStyles: UnknownRecord, errors: string[]): void {
  const pageCards = visualCards(visualStyles, 'page')
  if (!pageCards) {
    errors.push('visualStyles.page.* is required for page background defaults.')
  } else {
    validateBackgroundCard(firstCard(pageCards, 'background'), 'visualStyles.page.*.background[0]', errors)
    validateBackgroundCard(firstCard(pageCards, 'outspace'), 'visualStyles.page.*.outspace[0]', errors)
  }

  REQUIRED_BACKGROUND_VISUALS.forEach((visualType) => {
    const cards = visualCards(visualStyles, visualType)
    if (!cards) {
      errors.push(`visualStyles.${visualType}.* is required for visual background defaults.`)
      return
    }

    validateBackgroundCard(firstCard(cards, 'background'), `visualStyles.${visualType}.*.background[0]`, errors, { requireShow: true })
    validateBorderCard(firstCard(cards, 'border'), `visualStyles.${visualType}.*.border[0]`, errors)
  })
}

function validatePieDonutPaletteSafety(theme: UnknownRecord, errors: string[]): void {
  if (!isRecord(theme.visualStyles)) return

  ;['*', 'pieChart', 'donutChart'].forEach((visualType) => {
    const cards = visualCards(theme.visualStyles as UnknownRecord, visualType)
    const dataPointCards = cards?.dataPoint
    if (!Array.isArray(dataPointCards)) return

    dataPointCards.forEach((card, index) => {
      if (!isRecord(card)) return
      if ('defaultColor' in card) {
        errors.push(`visualStyles.${visualType}.*.dataPoint[${index}].defaultColor must not be exported for pie/donut palette cycling.`)
      }
      if ('fill' in card) {
        errors.push(`visualStyles.${visualType}.*.dataPoint[${index}].fill must not be exported for pie/donut palette cycling.`)
      }
    })
  })
}

function solidColorValue(card: unknown): string | undefined {
  if (!isRecord(card) || !isSolidColorObject(card.color)) return undefined
  const color = card.color as { solid: { color: string } }
  return color.solid.color.toUpperCase()
}

function solidFillValue(value: unknown): string | undefined {
  if (!isSolidColorObject(value)) return undefined
  const fill = value as { solid: { color: string } }
  return fill.solid.color.toUpperCase()
}

function validateExpectedBackgrounds(
  theme: UnknownRecord,
  options: { expectedCanvasBackground?: string; expectedOutspaceBackground?: string; expectedVisualBackground?: string; expectedTitleBackground?: string },
  errors: string[],
): void {
  if (!isRecord(theme.visualStyles)) return

  const expectedCanvas = typeof options.expectedCanvasBackground === 'string'
    ? options.expectedCanvasBackground.toUpperCase()
    : undefined
  const expectedVisual = typeof options.expectedVisualBackground === 'string'
    ? options.expectedVisualBackground.toUpperCase()
    : undefined
  const expectedOutspace = typeof options.expectedOutspaceBackground === 'string'
    ? options.expectedOutspaceBackground.toUpperCase()
    : undefined
  const expectedTitleBackground = typeof options.expectedTitleBackground === 'string'
    ? options.expectedTitleBackground.toUpperCase()
    : undefined

  if (expectedCanvas) {
    if (typeof theme.background === 'string' && theme.background.toUpperCase() !== expectedCanvas) {
      errors.push(`background ${theme.background} does not match effective canvas background ${expectedCanvas}.`)
    }

    const pageCards = visualCards(theme.visualStyles, 'page')
    const pageBackground = solidColorValue(firstCard(pageCards ?? {}, 'background'))
    if (pageBackground && pageBackground !== expectedCanvas) {
      errors.push(`visualStyles.page.*.background[0].color ${pageBackground} does not match effective canvas background ${expectedCanvas}.`)
    }
  }

  if (expectedOutspace) {
    const pageCards = visualCards(theme.visualStyles, 'page')
    const pageOutspace = solidColorValue(firstCard(pageCards ?? {}, 'outspace'))
    if (pageOutspace && pageOutspace !== expectedOutspace) {
      errors.push(`visualStyles.page.*.outspace[0].color ${pageOutspace} does not match effective outspace background ${expectedOutspace}.`)
    }
  }

  if (expectedVisual) {
    const commonCards = visualCards(theme.visualStyles, '*')
    const commonBackground = solidColorValue(firstCard(commonCards ?? {}, 'background'))
    if (commonBackground && commonBackground !== expectedVisual) {
      errors.push(`visualStyles.*.*.background[0].color ${commonBackground} does not match effective visual background ${expectedVisual}.`)
    }

    const commonTitle = firstCard(commonCards ?? {}, 'title')
    const commonTitleBackground = isRecord(commonTitle) ? solidFillValue(commonTitle.background) : undefined
    if (expectedTitleBackground && commonTitleBackground && commonTitleBackground !== expectedTitleBackground) {
      errors.push(`visualStyles.*.*.title[0].background ${commonTitleBackground} does not match effective title background ${expectedTitleBackground}.`)
    }

    ;['barChart', 'columnChart', 'card', 'tableEx', 'slicer'].forEach((visualType) => {
      const cards = visualCards(theme.visualStyles as UnknownRecord, visualType)
      const color = solidColorValue(firstCard(cards ?? {}, 'background'))
      if (color && color !== expectedVisual) {
        errors.push(`visualStyles.${visualType}.*.background[0].color ${color} does not match effective visual background ${expectedVisual}.`)
      }
    })
  }
}

export function validatePowerBITheme(
  theme: unknown,
  options: { expectedPaletteSize?: number; expectedCanvasBackground?: string; expectedOutspaceBackground?: string; expectedVisualBackground?: string; expectedTitleBackground?: string } = {},
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isRecord(theme)) {
    return { isValid: false, errors: ['Theme JSON must be an object.'], warnings }
  }

  Object.keys(theme).forEach((key) => {
    if (APP_ONLY_FIELDS.has(key)) errors.push(`App-only field "${key}" must not be exported in Power BI theme JSON.`)
  })

  if (typeof theme.name !== 'string' || !theme.name.trim()) {
    errors.push('Theme name is required.')
  }

  if (!Array.isArray(theme.dataColors) || theme.dataColors.length === 0) {
    errors.push('dataColors must be a non-empty array.')
  } else {
    if (theme.dataColors.length < 2) {
      errors.push('dataColors must contain at least two colors so pie/donut categories can use multiple theme colors.')
    }
    if (options.expectedPaletteSize && theme.dataColors.length !== options.expectedPaletteSize) {
      errors.push(`dataColors length ${theme.dataColors.length} does not match selected palette size ${options.expectedPaletteSize}.`)
    }
    const uniqueColors = new Set<string>()
    theme.dataColors.forEach((color, index) => {
      if (typeof color !== 'string' || !POWER_BI_HEX.test(color)) {
        errors.push(`dataColors[${index}] must be a valid #RRGGBB color.`)
      } else {
        uniqueColors.add(color.toUpperCase())
      }
    })
    if (uniqueColors.size < 2) {
      errors.push('dataColors must not be the same repeated color; pie/donut category colors depend on the ordered root palette.')
    }
  }

  ROOT_COLOR_KEYS.forEach((key) => {
    if (key in theme && (typeof theme[key] !== 'string' || !POWER_BI_HEX.test(theme[key]))) {
      errors.push(`${key} must be a valid #RRGGBB color string.`)
    }
  })

  ;['background', 'foreground', 'tableAccent', 'good', 'neutral', 'bad'].forEach((key) => {
    if (!(key in theme)) errors.push(`Missing required root color: ${key}.`)
  })

  validateTextClasses(theme.textClasses, errors, warnings)

  if (!isRecord(theme.visualStyles)) {
    errors.push('visualStyles must be an object.')
  } else {
    validateVisualStyleColors(theme.visualStyles, 'visualStyles', errors)
    validateVisualStyleSchemaValues(theme.visualStyles, 'visualStyles', errors)
    validateBackgroundAndBorderDefaults(theme.visualStyles, errors)
    validateExpectedBackgrounds(theme, options, errors)
    validatePieDonutPaletteSafety(theme, errors)
  }

  validateNoNullUndefinedOrRgba(theme, 'theme', errors)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
