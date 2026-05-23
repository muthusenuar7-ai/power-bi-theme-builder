export type FormatControlValue = string | number | boolean

export type FormatControlType =
  | 'toggle'
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'slider'
  | 'color'
  | 'colorFx'
  | 'font'
  | 'fontStyle'
  | 'alignment'
  | 'fieldSelector'
  | 'browse'
  | 'button'
  | 'note'

export interface FormatToggleRef {
  stateKey?: string
  defaultValue: boolean
  disabled?: boolean
}

export interface VisualFormatControl {
  id: string
  label?: string
  type: FormatControlType
  defaultValue?: FormatControlValue
  options?: string[]
  min?: number
  max?: number
  unit?: string
  disabled?: boolean
  warning?: boolean
  stateKey?: string
  fx?: boolean
  buttonLabel?: string
  placeholder?: string
  note?: string
  fontKey?: string
  sizeKey?: string
  defaultFont?: string
  defaultSize?: number
  boldKey?: string
  italicKey?: string
  underlineKey?: string
  defaultBold?: boolean
  defaultItalic?: boolean
  defaultUnderline?: boolean
}

export interface VisualFormatCard {
  id: string
  title?: string
  toggle?: FormatToggleRef
  disabled?: boolean
  warning?: boolean
  note?: string
  controls?: VisualFormatControl[]
}

export interface VisualFormatSection {
  id: string
  title: string
  defaultOpen?: boolean
  toggle?: FormatToggleRef
  disabled?: boolean
  warning?: boolean
  note?: string
  cards?: VisualFormatCard[]
  showReset?: boolean
}

export interface VisualFormatSchema {
  id: string
  label: string
  stateScope: string
  sections: VisualFormatSection[]
}

export const FORMAT_FONT_OPTIONS = ['Segoe UI', 'Arial', 'Calibri', 'DIN']

const LEGEND_POSITIONS = [
  'Top left',
  'Top center',
  'Top right',
  'Top left stacked',
  'Top right stacked',
  'Center left',
  'Center right',
  'Bottom left',
  'Bottom center',
  'Bottom right',
]

const DISPLAY_UNITS = ['Auto', 'None', 'Thousands', 'Millions', 'Billions', 'Trillions']
const LINE_STYLES = ['Solid', 'Dashed', 'Dotted', 'Custom']
const LABEL_POSITIONS = ['Auto', 'Inside end', 'Outside end', 'Inside center', 'Inside base']
const LABEL_POSITIONS_100 = ['Auto', 'Inside end', 'Inside center', 'Inside base']
const AXIS_TITLE_STYLES = ['Show title only']

function control(
  id: string,
  label: string | undefined,
  type: FormatControlType,
  defaultValue?: FormatControlValue,
  extra: Partial<VisualFormatControl> = {},
): VisualFormatControl {
  return { id, label, type, defaultValue, ...extra }
}

function toggle(id: string, label: string, defaultValue = false, extra: Partial<VisualFormatControl> = {}) {
  return control(id, label, 'toggle', defaultValue, extra)
}

function select(id: string, label: string, defaultValue: string, options: string[], extra: Partial<VisualFormatControl> = {}) {
  return control(id, label, 'select', defaultValue, { options, ...extra })
}

function text(id: string, label: string, defaultValue: string, extra: Partial<VisualFormatControl> = {}) {
  return control(id, label, 'text', defaultValue, extra)
}

function number(id: string, label: string, defaultValue: number, extra: Partial<VisualFormatControl> = {}) {
  return control(id, label, 'number', defaultValue, extra)
}

function slider(id: string, label: string, defaultValue: number, unit: string, extra: Partial<VisualFormatControl> = {}) {
  return control(id, label, 'slider', defaultValue, { min: 0, max: 100, unit, ...extra })
}

function color(id: string, label: string, defaultValue = '#000000', extra: Partial<VisualFormatControl> = {}) {
  return control(id, label, extra.fx ? 'colorFx' : 'color', defaultValue, extra)
}

function font(
  id: string,
  label = 'Font',
  defaultFont = 'Segoe UI',
  defaultSize = 9,
  extra: Partial<VisualFormatControl> = {},
) {
  return control(id, label, 'font', undefined, { defaultFont, defaultSize, ...extra })
}

function fontStyle(id = 'fontStyle', extra: Partial<VisualFormatControl> = {}) {
  return control(id, undefined, 'fontStyle', undefined, extra)
}

function alignment(id: string, label = 'Horizontal alignment', defaultValue = 'Left', extra: Partial<VisualFormatControl> = {}) {
  return control(id, label, 'alignment', defaultValue, {
    options: ['Left', 'Center', 'Right'],
    ...extra,
  })
}

function field(id: string, label: string, buttonLabel: string, extra: Partial<VisualFormatControl> = {}) {
  return control(id, label, 'fieldSelector', buttonLabel, {
    buttonLabel,
    disabled: true,
    ...extra,
  })
}

function browse(id = 'browse') {
  return control(id, undefined, 'browse', 'Browse...', {
    buttonLabel: 'Browse...',
    disabled: true,
  })
}

function note(textValue: string): VisualFormatControl {
  return control('note', undefined, 'note', undefined, { note: textValue })
}

function section(id: string, title: string, cards: VisualFormatCard[], extra: Partial<VisualFormatSection> = {}): VisualFormatSection {
  return { id, title, cards, showReset: true, ...extra }
}

function card(id: string, title: string | undefined, controls: VisualFormatControl[], extra: Partial<VisualFormatCard> = {}): VisualFormatCard {
  return { id, title, controls, ...extra }
}

function legendSection(scope: string, titleText: string, defaultPosition = 'Top left', expanded = true): VisualFormatSection {
  return section(
    'legend',
    'Legend',
    [
      card('options', 'Options', [
        select('position', 'Position', defaultPosition, LEGEND_POSITIONS, { stateKey: `${scope}.legend.position` }),
      ]),
      card('text', 'Text', [
        font('font', 'Font', 'Segoe UI', 10),
        fontStyle(),
        color('color', 'Color', '#666666', { fx: true }),
      ]),
      card('title', 'Title', [
        text('titleText', 'Title text', titleText, { stateKey: `${scope}.legend.titleText` }),
      ], { toggle: { stateKey: `${scope}.legend.title.show`, defaultValue: true } }),
    ],
    {
      defaultOpen: expanded,
      toggle: { stateKey: `${scope}.legend.show`, defaultValue: true },
    },
  )
}

function disabledPlaceholderSection(id: string, title: string, message?: string, toggle?: FormatToggleRef): VisualFormatSection {
  return {
    id,
    title,
    disabled: true,
    toggle,
    cards: message ? [card('reference', undefined, [note(message)])] : undefined,
  }
}

function detailLabelsSection(scope: 'pie' | 'donut'): VisualFormatSection {
  return section(
    'detailLabels',
    'Detail labels',
    [
      card('options', 'Options', [
        select('position', 'Position', 'Outside', ['Outside', 'Inside', 'Prefer outside', 'Prefer inside'], {
          stateKey: `${scope}.detailLabels.position`,
        }),
        toggle('overflowText', 'Overflow text', true, { disabled: true }),
        select(
          'labelContents',
          'Label contents',
          'Data value, percent of total',
          ['Category', 'Data value', 'Percent of total', 'Category, data value', 'Category, percent of total', 'Data value, percent of total', 'All detail labels'],
          { stateKey: `${scope}.detailLabels.labelStyle` },
        ),
      ]),
      card('values', 'Values', [
        font('font', 'Font', 'Segoe UI', 9),
        fontStyle(),
        color('color', 'Color', '#000000', { fx: true, stateKey: `${scope}.detailLabels.color` }),
        select('background', 'Background', 'Auto', ['Auto'], { disabled: true }),
        select('displayUnits', 'Display units', 'Auto', ['Auto']),
        select('valueDecimals', 'Value decimal places', 'Auto', ['Auto']),
        select('percentDecimals', 'Percentage decimal places', 'Auto', ['Auto']),
      ]),
    ],
    {
      toggle: { stateKey: `${scope}.detailLabels.show`, defaultValue: true },
    },
  )
}

function pieDonutSchema(id: 'pie' | 'donut', label: string, includeInnerRadius: boolean): VisualFormatSchema {
  return {
    id,
    label,
    stateScope: id,
    sections: [
      legendSection(id, 'Discount Band', 'Center right'),
      section('slices', 'Slices', [
        card('applyTo', 'Apply settings to', [
          select('series', 'Series', 'All', ['All', 'Medium', 'High', 'Low', 'None']),
        ]),
        card('color', 'Color', [
          color('fill', 'Color', '#FFFFFF'),
          slider('transparency', 'Transparency', 0, '%'),
        ]),
        card('border', 'Border', [
          toggle('matchFillColor', 'Match fill color', false),
          color('color', 'Color', '#666666'),
          slider('transparency', 'Transparency', 0, '%'),
          number('width', 'Width', 1),
          toggle('hideInnerBorders', 'Hide inner borders', false),
        ], { toggle: { stateKey: `${id}.slices.stroke`, defaultValue: true } }),
        ...(includeInnerRadius
          ? [card('spacing', 'Spacing', [
              slider('innerRadius', 'Inner radius', 60, '%', {
                min: 20,
                max: 90,
                stateKey: `${id}.donutShape.innerRadius`,
              }),
            ])]
          : []),
      ]),
      detailLabelsSection(id),
      section('rotation', 'Rotation', [
        card('rotation', undefined, [
          slider('rotation', 'Rotation', 0, 'deg', { min: 0, max: 360, stateKey: `${id}.slices.rotation` }),
        ]),
      ], { showReset: false }),
    ],
  }
}

function funnelSchema(): VisualFormatSchema {
  return {
    id: 'funnel',
    label: 'Funnel',
    stateScope: 'funnel',
    sections: [
      section('colors', 'Colors', [
        card('default', undefined, [
          color('default', 'Default', '#000000', { fx: true }),
          toggle('showAll', 'Show all', false),
        ]),
      ], { defaultOpen: true }),
      section('dataLabels', 'Data labels', [
        card('options', 'Options', [
          select('position', 'Position', 'Inside center', ['Inside center'], { stateKey: 'bar.dataLabels.position' }),
          select('labelContents', 'Label contents', 'Data value', ['Data value']),
        ]),
        card('values', 'Values', [
          font('font', 'Font', 'Segoe UI', 9, { sizeKey: 'bar.dataLabels.fontSize' }),
          fontStyle(),
          color('color', 'Color', '#000000', { fx: true, stateKey: 'bar.dataLabels.color' }),
          select('displayUnits', 'Display units', 'Auto', ['Auto']),
          select('valueDecimals', 'Value decimal places', 'Auto', ['Auto']),
          select('percentDecimals', 'Percentage decimal places', 'Auto', ['Auto']),
        ]),
        card('background', 'Background', [
          color('color', 'Color', '#FFFFFF', { disabled: true }),
          slider('transparency', 'Transparency', 0, '%', { disabled: true }),
        ], { toggle: { defaultValue: false } }),
      ], { toggle: { stateKey: 'bar.dataLabels.show', defaultValue: true } }),
      section('categoryLabels', 'Category labels', [
        card('values', 'Values', [
          font('font', 'Font', 'Segoe UI', 9),
          fontStyle(),
          color('color', 'Color', '#000000', { fx: true }),
        ]),
      ], { toggle: { defaultValue: true } }),
      section('conversionRateLabels', 'Conversion rate labels', [
        card('values', 'Values', [
          font('font', 'Font', 'Segoe UI', 9),
          fontStyle(),
          color('color', 'Color', '#000000', { fx: true }),
        ]),
      ], { toggle: { defaultValue: true } }),
    ],
  }
}

function treemapSchema(): VisualFormatSchema {
  return {
    id: 'treemap',
    label: 'Treemap',
    stateScope: 'treemap',
    sections: [
      legendSection('treemap', 'Date Month', 'Top left'),
      section('colors', 'Colors', [
        card('advanced', undefined, [
          control('advancedControls', 'Advanced controls', 'button', 'fx', { buttonLabel: 'fx', disabled: true }),
          color('usa', 'United States of America', '#111111'),
          color('canada', 'Canada', '#222222'),
          color('france', 'France', '#454545'),
          color('germany', 'Germany', '#666666'),
          color('mexico', 'Mexico', '#777777'),
        ]),
      ]),
      section('layout', 'Layout', [
        card('layout', undefined, [
          select('tilingMethod', 'Tiling Method', 'Squarified', ['Squarified']),
          number('nodeSpacing', 'Space between all nodes', 0),
          number('groupSpacing', 'Space between groups', 0),
        ]),
      ]),
      section('dataLabels', 'Data labels', [
        card('values', 'Values', [
          font('font', 'Font', 'Segoe UI', 9),
          fontStyle(),
          color('color', 'Color', '#000000', { fx: true }),
          select('displayUnits', 'Display units', 'Auto', ['Auto']),
          select('valueDecimals', 'Value decimal places', 'Auto', ['Auto']),
        ]),
      ], { toggle: { defaultValue: true } }),
      section('categoryLabels', 'Category labels', [
        card('values', 'Values', [
          font('font', 'Font', 'Segoe UI', 9),
          fontStyle(),
          color('color', 'Color', '#000000', { fx: true }),
        ]),
      ], { toggle: { defaultValue: true } }),
    ],
  }
}

function horizontalAxisSection(axisId: 'xAxis' | 'yAxis', title: string, isValueAxis: boolean): VisualFormatSection {
  const isX = axisId === 'xAxis'
  return section(axisId, title, [
    ...(isValueAxis
      ? [
          card('range', 'Range', [
            select('minimum', 'Minimum', 'Auto', ['Auto'], { fx: true }),
            select('maximum', 'Maximum', 'Auto', ['Auto'], { fx: true }),
            toggle('logScale', 'Logarithmic scale', false, { disabled: !isX }),
            toggle('invertRange', 'Invert range', false),
          ]),
        ]
      : []),
    card('values', 'Values', [
      font('font', 'Font', 'Segoe UI', 9),
      fontStyle(),
      color('color', 'Color', '#666666', { fx: true, stateKey: `bar.${axisId}.color` }),
      ...(isValueAxis
        ? [
            select('displayUnits', 'Display units', 'Auto', DISPLAY_UNITS),
            select('valueDecimals', 'Value decimal places', 'Auto', ['Auto']),
          ]
        : [
            slider('maximumWidth', 'Maximum width', 25, '%'),
            toggle('switchAxisPosition', 'Switch axis position', false),
            toggle('concatenateLabels', 'Concatenate labels', false),
          ]),
    ], { toggle: { stateKey: `bar.${axisId}.show`, defaultValue: true } }),
    card('title', 'Title', [
      text('titleText', 'Title text', 'Auto', { stateKey: `bar.${axisId}.titleText` }),
      select('style', 'Style', 'Show title only', AXIS_TITLE_STYLES),
      font('font', 'Font', 'DIN', 12),
      fontStyle(),
      color('color', 'Color', '#000000', { fx: true }),
    ], { toggle: { stateKey: `bar.${axisId}.title.show`, defaultValue: true } }),
    ...(!isValueAxis
      ? [card('layout', 'Layout', [
          slider('minimumCategoryHeight', 'Minimum category height', 20, 'px', { min: 0, max: 80 }),
        ])]
      : []),
  ])
}

function verticalAxisSection(axisId: 'xAxis' | 'yAxis', title: string, isValueAxis: boolean): VisualFormatSection {
  return section(axisId, title, [
    ...(isValueAxis
      ? [
          card('range', 'Range', [
            select('minimum', 'Minimum', 'Auto', ['Auto'], { fx: true }),
            select('maximum', 'Maximum', 'Auto', ['Auto'], { fx: true }),
            toggle('logScale', 'Logarithmic scale', false),
            toggle('invertRange', 'Invert range', false),
          ]),
        ]
      : []),
    card('values', 'Values', [
      font('font', 'Font', 'Segoe UI', 9),
      fontStyle(),
      color('color', 'Color', '#666666', { fx: true, stateKey: `bar.${axisId}.color` }),
      ...(isValueAxis
        ? [
            select('displayUnits', 'Display units', 'Auto', DISPLAY_UNITS),
            select('valueDecimals', 'Value decimal places', 'Auto', ['Auto']),
            toggle('switchAxisPosition', 'Switch axis position', false),
          ]
        : [
            slider('maximumHeight', 'Maximum height', 25, '%'),
            toggle('concatenateLabels', 'Concatenate labels', false),
          ]),
    ], { toggle: { stateKey: `bar.${axisId}.show`, defaultValue: true } }),
    card('title', 'Title', [
      text('titleText', 'Title text', 'Auto', { stateKey: `bar.${axisId}.titleText` }),
      select('style', 'Style', 'Show title only', AXIS_TITLE_STYLES),
      font('font', 'Font', 'DIN', 12),
      fontStyle(),
      color('color', 'Color', '#000000', { fx: true }),
    ], { toggle: { stateKey: `bar.${axisId}.title.show`, defaultValue: true } }),
    ...(!isValueAxis
      ? [card('layout', 'Layout', [
          slider('minimumCategoryWidth', 'Minimum category width', 20, 'px', { min: 0, max: 80 }),
        ])]
      : []),
  ])
}

function gridlinesSection(direction: 'Vertical' | 'Horizontal'): VisualFormatSection {
  return section('gridlines', 'Gridlines', [
    card(direction.toLowerCase(), direction, [
      color('color', 'Color', '#D9D9D9', { fx: true, stateKey: 'bar.plotArea.gridColor' }),
      slider('transparency', 'Transparency', 0, '%'),
      select('lineStyle', 'Line style', 'Dotted', LINE_STYLES),
      toggle('scaleByWidth', 'Scale by width', false),
      text('width', 'Width', '1 px'),
    ], { toggle: { defaultValue: true } }),
  ])
}

function zoomSliderSection(axisLabel: 'X-axis' | 'Y-axis', defaultValue = true): VisualFormatSection {
  return section('zoomSlider', 'Zoom slider', [
    card('options', undefined, [
      toggle(axisLabel === 'X-axis' ? 'xAxis' : 'yAxis', axisLabel, true),
      toggle('sliderLabels', 'Slider labels', false),
      toggle('sliderTooltips', 'Slider tooltips', false),
    ]),
  ], { toggle: { defaultValue } })
}

function barShapeSection(kind: 'Bars' | 'Columns', variant: 'full' | 'captured-only' | 'disabled-layout', colorValue = '#228BE6'): VisualFormatSection {
  const id = kind === 'Bars' ? 'bars' : 'columns'
  if (variant === 'captured-only') {
    return section(id, kind, [
      card('reference', undefined, [
        note(`The ${kind} section is present in the captured format pane. Expanded sub-properties were not shown, so this section is preserved without inventing unsupported controls.`),
      ]),
    ], { showReset: false })
  }

  return section(id, kind, [
    card('applyTo', undefined, [
      control('applySettingsTo', 'Apply settings to', 'note', undefined, { note: 'Apply settings to' }),
      select('series', kind === 'Bars' ? 'Categories' : 'Series', variant === 'disabled-layout' ? 'Government' : 'All', variant === 'disabled-layout' ? ['Government', 'All'] : ['All']),
    ]),
    card('color', 'Color', [
      color('color', 'Color', colorValue, { fx: kind === 'Bars' }),
      slider('transparency', 'Transparency', 0, '%'),
    ]),
    card('border', 'Border', [
      toggle(kind === 'Bars' ? 'matchBarColor' : 'matchColumnColor', kind === 'Bars' ? 'Match bar color' : 'Match column color', variant !== 'disabled-layout'),
      color('color', 'Color', variant !== 'disabled-layout' ? colorValue : '#666666'),
      slider('transparency', 'Transparency', 0, '%'),
      text('width', 'Width', '1 px'),
      ...(kind === 'Bars' ? [toggle('hideInnerBorders', 'Hide inner borders', false, { disabled: true })] : []),
    ], { toggle: { defaultValue: true } }),
    variant === 'disabled-layout'
      ? card('layout', 'Layout', [
          note(`Layout is shown as unavailable/disabled in the supplied ${kind === 'Bars' ? 'bar' : 'column'} capture.`),
        ], { disabled: true })
      : card('layout', 'Layout', [
          toggle('reverseOrder', 'Reverse order', false, { disabled: kind === 'Bars' }),
          toggle('sortByValue', 'Sort by value', false, { disabled: kind === 'Bars' }),
          slider('spaceBetweenCategories', 'Space between categories', 20, '%'),
          slider('spaceBetweenSeries', 'Space between series', 0, kind === 'Bars' ? 'px' : '%', { disabled: kind === 'Bars' }),
          ...(kind === 'Columns'
            ? [
                toggle('overlap', 'Overlap', false),
                toggle('flipOverlap', 'Flip overlap', false, { disabled: true }),
              ]
            : []),
        ]),
  ])
}

function ribbonsSection(disabledBorder = false): VisualFormatSection {
  return section('ribbons', 'Ribbons', [
    card('applyTo', undefined, [
      control('applySettingsTo', 'Apply settings to', 'note', undefined, { note: 'Apply settings to' }),
      select('series', 'Series', 'All', ['All', 'Sum of Sales']),
    ]),
    card('color', 'Color', [
      toggle('matchSeriesColor', 'Match series color', true),
      color('color', 'Color', '#228BE6', { disabled: true }),
      slider('transparency', 'Transparency', 30, '%'),
    ]),
    card('border', 'Border', disabledBorder
      ? []
      : [
          toggle('matchRibbonColor', 'Match ribbon color', false),
          color('color', 'Color', '#666666'),
          slider('transparency', 'Transparency', 0, '%'),
          text('width', 'Width', '1 px'),
        ], { toggle: { defaultValue: !disabledBorder } }),
    card('layout', 'Layout', [
      slider('spaceBetweenRibbonsAndBars', 'Space between ribbons and bars', 0, '%'),
    ]),
  ], { toggle: { defaultValue: true } })
}

function dataLabelsSection(options: {
  orientation?: boolean
  percentDetail?: boolean
  layout?: 'single' | 'multi'
  warning?: boolean
} = {}): VisualFormatSection {
  const positions = options.percentDetail ? LABEL_POSITIONS_100 : LABEL_POSITIONS
  return section('dataLabels', 'Data labels', [
    card('applyTo', undefined, [
      control('applySettingsTo', 'Apply settings to', 'note', undefined, { note: 'Apply settings to' }),
      select('series', 'Series', 'All', ['All']),
      toggle('showForSeries', 'Show for this series', true, { disabled: true }),
    ]),
    card('options', 'Options', [
      ...(options.orientation ? [select('orientation', 'Orientation', 'Horizontal', ['Vertical', 'Horizontal'])] : []),
      select('position', 'Position', 'Auto', positions, { stateKey: 'bar.dataLabels.position' }),
      toggle('overflowText', 'Overflow text', false),
      toggle('optimizeLabelDisplay', 'Optimize label display', false),
    ]),
    card('title', 'Title', [
      select('content', 'Content', 'Series name', options.percentDetail ? ['Series name', 'Custom'] : ['Series name']),
      font('font', 'Font', 'Segoe UI', 9),
      fontStyle(),
      color('color', 'Color', '#666666', { fx: true }),
      slider('transparency', 'Transparency', 0, '%'),
      text('showBlankAs', 'Show blank as', '0'),
    ], { toggle: { defaultValue: true } }),
    card('value', 'Value', [
      field('field', 'Field', options.orientation ? '+Add data' : 'Sum of Sales'),
      font('font', 'Font', 'Segoe UI', 9, { sizeKey: 'bar.dataLabels.fontSize' }),
      fontStyle(),
      color('color', 'Color', '#666666', { fx: true, stateKey: 'bar.dataLabels.color' }),
      slider('transparency', 'Transparency', 0, '%'),
      ...(!options.percentDetail ? [select('displayUnits', 'Display units', 'Auto', DISPLAY_UNITS)] : []),
      select('valueDecimals', 'Value decimal places', 'Auto', ['Auto']),
      text('showBlankAs', 'Show blank as', '0'),
    ], { toggle: { defaultValue: true } }),
    card('detail', 'Detail', [
      options.percentDetail
        ? select('content', 'Content', 'Percent of total', ['Percent of total'])
        : field('data', 'Data', '+Add data'),
      font('font', 'Font', 'Segoe UI', 9),
      fontStyle(),
      color('color', 'Color', '#666666', { fx: true }),
      slider('transparency', 'Transparency', 0, '%'),
      ...(!options.percentDetail ? [select('displayUnits', 'Display units', 'Auto', ['Auto'])] : []),
      select('valueDecimals', 'Value decimal places', 'Auto', ['Auto']),
      text('showBlankAs', 'Show blank as', '0'),
    ], { toggle: { defaultValue: true } }),
    card('background', 'Background', [
      color('color', 'Color', options.layout === 'single' ? '#111111' : '#FFFFFF', { disabled: options.layout !== 'single' }),
      slider('transparency', 'Transparency', options.layout === 'single' ? 90 : 50, '%', { disabled: options.layout !== 'single' }),
    ], { toggle: { defaultValue: options.layout === 'single' } }),
    card('layout', 'Layout', [
      select('layout', 'Layout', options.layout === 'multi' ? 'Multi-line' : 'Single line', [options.layout === 'multi' ? 'Multi-line' : 'Single line']),
      ...(options.layout === 'multi' ? [alignment('horizontalAlignment', 'Horizontal alignment', 'Left')] : []),
    ]),
  ], { toggle: { stateKey: 'bar.dataLabels.show', defaultValue: true }, warning: options.warning })
}

function totalLabelsSection(enabled = true): VisualFormatSection {
  if (!enabled) {
    return disabledPlaceholderSection('totalLabels', 'Total labels', undefined, { defaultValue: false, disabled: true })
  }

  return section('totalLabels', 'Total labels', [
    card('values', 'Values', [
      font('font', 'Font', 'Segoe UI', 9),
      fontStyle(),
      color('color', 'Color', '#666666', { fx: true }),
      select('displayUnits', 'Display units', 'Auto', DISPLAY_UNITS),
      select('valueDecimals', 'Value decimal places', 'Auto', ['Auto']),
      toggle('splitPositiveNegative', 'Split positive and negative', false),
    ]),
    card('background', 'Background', [
      color('color', 'Color', '#111111'),
      slider('transparency', 'Transparency', 90, '%'),
    ], { toggle: { defaultValue: true } }),
  ], { toggle: { defaultValue: true } })
}

function plotAreaBackgroundSection(): VisualFormatSection {
  return section('plotAreaBackground', 'Plot area background', [
    card('image', undefined, [
      browse(),
      select('imageFit', 'Image fit', 'Fit', ['Fit']),
      slider('transparency', 'Transparency', 0, '%'),
    ]),
  ])
}

function barStackedSchema(id: string, label: string): VisualFormatSchema {
  return {
    id,
    label,
    stateScope: 'bar',
    sections: [
      horizontalAxisSection('yAxis', 'Y-axis', false),
      horizontalAxisSection('xAxis', 'X-axis', true),
      disabledPlaceholderSection('legend', 'Legend', undefined, { stateKey: 'bar.legend.show', defaultValue: false, disabled: true }),
      disabledPlaceholderSection('smallMultiples', 'Small multiples'),
      gridlinesSection('Vertical'),
      zoomSliderSection('X-axis', true),
      barShapeSection('Bars', 'full'),
      ribbonsSection(true),
      dataLabelsSection({ layout: 'single' }),
      totalLabelsSection(false),
      plotAreaBackgroundSection(),
    ],
  }
}

function clusteredBarSchema(): VisualFormatSchema {
  return {
    id: 'clusteredbar',
    label: 'Clustered Bar',
    stateScope: 'bar',
    sections: [
      horizontalAxisSection('yAxis', 'Y-axis', false),
      horizontalAxisSection('xAxis', 'X-axis', true),
      legendSection('bar', 'Year', 'Top left'),
      disabledPlaceholderSection('smallMultiples', 'Small multiples'),
      gridlinesSection('Vertical'),
      zoomSliderSection('X-axis', false),
      barShapeSection('Bars', 'captured-only'),
      dataLabelsSection({ layout: 'single' }),
      plotAreaBackgroundSection(),
    ],
  }
}

function clusteredColumnSchema(): VisualFormatSchema {
  return {
    id: 'clusteredcol',
    label: 'Clustered Column',
    stateScope: 'bar',
    sections: [
      verticalAxisSection('xAxis', 'X-axis', false),
      verticalAxisSection('yAxis', 'Y-axis', true),
      section('legend', 'Legend', [
        card('reference', undefined, [
          note('Legend section is captured as available and enabled. Inner legend sub-options were not expanded in the supplied screenshots, so the section is preserved without inventing extra controls.'),
        ]),
      ], { toggle: { stateKey: 'bar.legend.show', defaultValue: true }, showReset: false }),
      disabledPlaceholderSection('smallMultiples', 'Small multiples'),
      gridlinesSection('Horizontal'),
      zoomSliderSection('Y-axis', true),
      barShapeSection('Columns', 'full'),
      dataLabelsSection({ orientation: true, layout: 'multi' }),
      plotAreaBackgroundSection(),
    ],
  }
}

function columnStackedSchema(id: string, label: string): VisualFormatSchema {
  return {
    id,
    label,
    stateScope: 'bar',
    sections: [
      verticalAxisSection('xAxis', 'X-axis', false),
      verticalAxisSection('yAxis', 'Y-axis', true),
      legendSection('bar', 'Segment', 'Top left'),
      disabledPlaceholderSection('smallMultiples', 'Small multiples'),
      gridlinesSection('Horizontal'),
      zoomSliderSection('Y-axis', false),
      barShapeSection('Columns', 'disabled-layout', '#DF6F34'),
      ribbonsSection(false),
      dataLabelsSection({ orientation: true, layout: 'multi' }),
      totalLabelsSection(true),
      plotAreaBackgroundSection(),
    ],
  }
}

function hundredStackedBarSchema(): VisualFormatSchema {
  return {
    id: 'hundredstackedbar',
    label: '100% Stacked Bar',
    stateScope: 'bar',
    sections: [
      horizontalAxisSection('yAxis', 'Y-axis', false),
      horizontalAxisSection('xAxis', 'X-axis', true),
      legendSection('bar', 'Segment', 'Top left'),
      disabledPlaceholderSection('smallMultiples', 'Small multiples'),
      gridlinesSection('Vertical'),
      zoomSliderSection('X-axis', true),
      barShapeSection('Bars', 'disabled-layout', '#DF6F34'),
      ribbonsSection(false),
      dataLabelsSection({ percentDetail: true, layout: 'single' }),
      plotAreaBackgroundSection(),
    ],
  }
}

function hundredStackedColumnSchema(): VisualFormatSchema {
  return {
    id: 'hundredstackedcol',
    label: '100% Stacked Column',
    stateScope: 'bar',
    sections: [
      verticalAxisSection('xAxis', 'X-axis', false),
      verticalAxisSection('yAxis', 'Y-axis', true),
      legendSection('bar', 'Segment', 'Top left'),
      disabledPlaceholderSection('smallMultiples', 'Small multiples'),
      gridlinesSection('Horizontal'),
      zoomSliderSection('Y-axis', true),
      barShapeSection('Columns', 'disabled-layout', '#DF6F34'),
      ribbonsSection(true),
      dataLabelsSection({ orientation: true, percentDetail: true, layout: 'multi', warning: true }),
      plotAreaBackgroundSection(),
    ],
  }
}

export const sharedGeneralFormatSchema: VisualFormatSchema = {
  id: 'general',
  label: 'General',
  stateScope: 'general',
  sections: [
    section('properties', 'Properties', [
      card('size', 'Size', [
        number('height', 'Height', 280),
        number('width', 'Width', 370),
        toggle('lockAspectRatio', 'Lock aspect ratio', true),
      ]),
      card('position', 'Position', [
        number('horizontal', 'Horizontal', 752),
        number('vertical', 'Vertical', 87),
      ]),
      card('padding', 'Padding', [
        number('top', 'Top', 8, { stateKey: 'general.padding.top' }),
        number('left', 'Left', 8, { stateKey: 'general.padding.left' }),
        number('right', 'Right', 8, { stateKey: 'general.padding.right' }),
        number('bottom', 'Bottom', 8, { stateKey: 'general.padding.bottom' }),
      ]),
      card('advancedOptions', 'Advanced options', [
        toggle('responsive', 'Responsive', false, { disabled: true }),
        toggle('maintainLayerOrder', 'Maintain layer order', true),
      ]),
    ]),
    section('title', 'Title', [
      card('title', 'Title', [
        text('text', 'Text', 'Sum of Sales', { stateKey: 'general.title.text', fx: true }),
        select('heading', 'Heading', 'Heading 3', ['Heading 1', 'Heading 2', 'Heading 3', 'Heading 4']),
        font('font', 'Font', 'Segoe UI', 12, {
          fontKey: 'general.title.fontFamily',
          sizeKey: 'general.title.fontSize',
        }),
        fontStyle('fontStyle', {
          boldKey: 'general.title.fontBold',
          italicKey: 'general.title.fontItalic',
          underlineKey: 'general.title.fontUnderline',
          defaultBold: true,
        }),
        color('fontColor', 'Text color', '#000000', { fx: true, stateKey: 'general.title.fontColor' }),
        color('background', 'Background color', '#FFFFFF', { fx: true, stateKey: 'general.title.background' }),
        alignment('alignment', 'Horizontal alignment', 'Left', { stateKey: 'general.title.alignment' }),
        toggle('textWrap', 'Text wrap', true),
      ]),
      card('subtitle', 'Subtitle', [
        text('text', 'Text', 'by Discount Band', { stateKey: 'general.subtitle.text', fx: true }),
        select('heading', 'Heading', 'Heading 4', ['Heading 1', 'Heading 2', 'Heading 3', 'Heading 4']),
        font('font', 'Font', 'Segoe UI', 9),
        fontStyle(),
        color('fontColor', 'Text color', '#000000', { fx: true }),
        alignment('alignment', 'Horizontal alignment', 'Left'),
        toggle('textWrap', 'Text wrap', true),
      ], { toggle: { stateKey: 'general.subtitle.show', defaultValue: true } }),
      card('divider', 'Divider', [
        color('color', 'Color', '#000000', { fx: true }),
        select('lineStyle', 'Line style', 'Solid', ['Solid', 'Dashed', 'Dotted']),
        text('width', 'Width', '1 px'),
        toggle('ignorePadding', 'Ignore padding', true),
      ], { toggle: { defaultValue: true } }),
      card('spacing', 'Spacing', [
        toggle('customizeSpacing', 'Customize spacing', true),
        text('spaceBelowTitle', 'Space below title', '5 px'),
        text('spaceBelowSubtitle', 'Space below subtitle', '5 px'),
        text('spaceBelowTitleArea', 'Space below title area', '5 px'),
      ]),
    ], { toggle: { stateKey: 'general.title.show', defaultValue: true } }),
    section('effects', 'Effects', [
      card('background', 'Background', [
        color('color', 'Color', '#FFFFFF', { fx: true, stateKey: 'general.background.color' }),
        slider('transparency', 'Transparency', 0, '%', { stateKey: 'general.background.transparency' }),
      ], { toggle: { stateKey: 'general.background.show', defaultValue: true } }),
      card('visualBorder', 'Visual border', [
        color('color', 'Color', '#FFFFFF', { fx: true, stateKey: 'general.border.color' }),
        slider('roundedCorners', 'Rounded corners', 2, 'px', { max: 32, stateKey: 'general.border.radius' }),
        number('width', 'Width', 1, { stateKey: 'general.border.width' }),
      ], { toggle: { stateKey: 'general.border.show', defaultValue: true } }),
      card('shadow', 'Shadow', [
        color('color', 'Color', '#000000', { fx: true, stateKey: 'general.shadow.color' }),
        select('offset', 'Offset', 'Outside', ['Outside', 'Inside']),
        select('position', 'Position', 'Bottom right', ['Bottom right', 'Bottom', 'Bottom left', 'Right', 'Center', 'Left', 'Top right', 'Top', 'Top left', 'Custom']),
      ], { toggle: { stateKey: 'general.shadow.show', defaultValue: true } }),
    ]),
    section('dataFormat', 'Data format', [
      card('applyTo', undefined, [
        select('field', 'Apply settings to', 'Discount Band', ['Discount Band', 'Sum of Sales']),
      ]),
      card('formatOptions', 'Format options', [
        select('format', 'Format', '', ['', 'Currency', 'Number', 'Percentage']),
      ]),
    ]),
    section('headerIcons', 'Header icons', [
      card('colors', 'Colors', [
        color('background', 'Background', '#FFFFFF', { stateKey: 'general.headerIcons.background' }),
        color('border', 'Border', '#000000'),
        color('icon', 'Icon', '#000000', { stateKey: 'general.headerIcons.color' }),
        slider('transparency', 'Transparency', 0, '%'),
      ]),
      card('icons', 'Icons', [
        toggle('visualInformation', 'Visual information', true),
        toggle('visualWarning', 'Visual warning', true),
        toggle('visualError', 'Visual error', true),
        toggle('drillOnDropdown', 'Drill on dropdown', true),
        toggle('drillUp', 'Drill up', true),
        toggle('drillDown', 'Drill down', true),
        toggle('showNextLevel', 'Show next level', true),
        toggle('expandToNextLevel', 'Expand to next level', true),
        toggle('pin', 'Pin', true),
        toggle('focusMode', 'Focus mode', true),
        toggle('seeDataLayout', 'See data layout', true),
        toggle('moreOptions', 'More options', true),
        toggle('filter', 'Filter', true),
        toggle('helpTooltip', 'Help tooltip', false),
        toggle('smartNarrative', 'Smart narrative', false),
      ]),
    ], { toggle: { stateKey: 'general.headerIcons.show', defaultValue: true } }),
    section('tooltip', 'Tooltips', [
      card('options', 'Options', [
        select('style', 'Type', 'Report page', ['Default', 'Report page'], { stateKey: 'general.tooltip.style' }),
        select('page', 'Page', 'Auto', ['Auto']),
      ]),
      card('text', 'Text', [
        font('font', 'Font', 'Segoe UI', 9, { sizeKey: 'general.tooltip.fontSize' }),
        fontStyle(),
        color('labelColor', 'Label color', '#000000'),
        color('valueColor', 'Value color', '#000000'),
        color('drillTextColor', 'Drill text and icon color', '#000000'),
      ]),
      card('background', 'Background', [
        color('color', 'Color', '#FFFFFF'),
        slider('transparency', 'Transparency', 0, '%'),
      ]),
      card('actions', undefined, [
        toggle('actions', 'Actions', true),
      ]),
    ], { toggle: { stateKey: 'general.tooltip.show', defaultValue: true } }),
    section('altText', 'Alt text', [
      card('altText', undefined, [
        control('text', 'Alt text', 'textarea', 'Enter a description that will be read by a screen reader on selecting the visual.', { fx: true }),
      ]),
    ]),
  ],
}

const pieSchema = pieDonutSchema('pie', 'Pie', false)
const donutSchema = pieDonutSchema('donut', 'Donut', true)
const funnel = funnelSchema()
const treemap = treemapSchema()
const clusteredBar = clusteredBarSchema()
const clusteredColumn = clusteredColumnSchema()
const hundredBar = hundredStackedBarSchema()
const hundredColumn = hundredStackedColumnSchema()

export const visualFormatSchemas: Record<string, VisualFormatSchema> = {
  donut: donutSchema,
  pie: pieSchema,
  funnel,
  treemap,
  bar: barStackedSchema('bar', 'Bar / Stacked Bar'),
  stackedbar: barStackedSchema('stackedbar', 'Bar / Stacked Bar'),
  clusteredbar: clusteredBar,
  clusteredcol: clusteredColumn,
  column: columnStackedSchema('column', 'Column / Stacked Column'),
  stackedcol: columnStackedSchema('stackedcol', 'Column / Stacked Column'),
  hundredstackedbar: hundredBar,
  hundredstackedcol: hundredColumn,
}

export const fallbackVisualFormatSchema: VisualFormatSchema = {
  id: 'unsupported',
  label: 'Format reference pending',
  stateScope: 'visual',
  sections: [
    {
      id: 'referencePending',
      title: 'Visual properties',
      defaultOpen: true,
      cards: [
        card('pending', undefined, [
          note('This visual is outside the current Batch 1 master format-pane reference. Select a Batch 1 visual to edit captured Power BI properties.'),
        ]),
      ],
    },
  ],
}

export function getVisualFormatSchema(visualId: string | null | undefined): VisualFormatSchema | null {
  if (!visualId) return null
  return visualFormatSchemas[visualId] ?? fallbackVisualFormatSchema
}
