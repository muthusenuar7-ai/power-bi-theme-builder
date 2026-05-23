import type { SectionDef } from '@/types'

export const FONT_OPTIONS = [
  'Segoe UI',
  'Segoe UI Semibold',
  'Segoe UI Light',
  'Arial',
  'Arial Narrow',
  'Calibri',
  'Cambria',
  'Verdana',
  'Tahoma',
  'Times New Roman',
  'Georgia',
  'Trebuchet MS',
  'Courier New',
  'Lucida Console',
  'DM Sans',
  'Inter',
  'Roboto',
  'Lato',
  'Open Sans',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito',
  'Outfit',
  'Plus Jakarta Sans',
  'Work Sans',
]

export const GENERAL_SECTIONS: Record<string, SectionDef> = {
  title: {
    label: 'Title',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true },
      { id: 'fontColor', label: 'Font color', type: 'color', level: 'basic', default: '#0F172A' },
      { id: 'fontSize', label: 'Font size', type: 'slider', level: 'basic', min: 8, max: 32, default: 14 },
      { id: 'fontFamily', label: 'Font family', type: 'select', level: 'basic', options: FONT_OPTIONS, default: 'Segoe UI' },
      { id: 'fontBold', label: 'Bold', type: 'toggle', level: 'basic', default: true },
      { id: 'alignment', label: 'Alignment', type: 'segments', level: 'intermediate', options: ['Left', 'Center', 'Right'], default: 'Left' },
      { id: 'background', label: 'Background', type: 'color', level: 'intermediate', default: '#FFFFFF' },
      { id: 'transparency', label: 'Transparency', type: 'slider', level: 'advanced', min: 0, max: 100, default: 100 },
    ],
  },
  background: {
    label: 'Background',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true },
      { id: 'color', label: 'Color', type: 'color', level: 'basic', default: '#FFFFFF' },
      { id: 'transparency', label: 'Transparency', type: 'slider', level: 'intermediate', min: 0, max: 100, default: 0 },
    ],
  },
  border: {
    label: 'Border',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: false },
      { id: 'color', label: 'Color', type: 'color', level: 'basic', default: '#E2E8F0' },
      { id: 'width', label: 'Width', type: 'slider', level: 'intermediate', min: 0, max: 8, default: 1 },
      { id: 'radius', label: 'Radius', type: 'slider', level: 'intermediate', min: 0, max: 32, default: 0 },
    ],
  },
  shadow: {
    label: 'Shadow',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'intermediate', default: false },
      { id: 'color', label: 'Color', type: 'color', level: 'advanced', default: '#000000' },
      { id: 'transparency', label: 'Transparency', type: 'slider', level: 'advanced', min: 0, max: 100, default: 80 },
      { id: 'blur', label: 'Blur', type: 'slider', level: 'advanced', min: 0, max: 20, default: 6 },
      { id: 'offsetX', label: 'Offset X', type: 'slider', level: 'advanced', min: -20, max: 20, default: 0 },
      { id: 'offsetY', label: 'Offset Y', type: 'slider', level: 'advanced', min: -20, max: 20, default: 2 },
    ],
  },
  padding: {
    label: 'Padding',
    props: [
      { id: 'top', label: 'Top', type: 'slider', level: 'intermediate', min: 0, max: 40, default: 8 },
      { id: 'right', label: 'Right', type: 'slider', level: 'intermediate', min: 0, max: 40, default: 8 },
      { id: 'bottom', label: 'Bottom', type: 'slider', level: 'intermediate', min: 0, max: 40, default: 8 },
      { id: 'left', label: 'Left', type: 'slider', level: 'intermediate', min: 0, max: 40, default: 8 },
    ],
  },
  headerIcons: {
    label: 'Header icons',
    props: [
      { id: 'show', label: 'Show icons', type: 'toggle', level: 'basic', default: true },
      { id: 'color', label: 'Icon color', type: 'color', level: 'intermediate', default: '#605E5C' },
      { id: 'background', label: 'Background', type: 'color', level: 'advanced', default: '#FFFFFF' },
    ],
  },
  tooltip: {
    label: 'Tooltip',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true },
      { id: 'style', label: 'Style', type: 'select', level: 'intermediate', options: ['Default', 'Card', 'Report page'], default: 'Default' },
      { id: 'fontSize', label: 'Font size', type: 'number', level: 'advanced', min: 8, max: 18, default: 10 },
    ],
  },
}

const BAR_SECTIONS: Record<string, SectionDef> = {
  dataLabels: {
    label: 'Data labels',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true },
      { id: 'color', label: 'Color', type: 'color', level: 'basic', default: '#252423' },
      { id: 'fontSize', label: 'Text size', type: 'slider', level: 'basic', min: 7, max: 16, default: 9 },
      { id: 'position', label: 'Position', type: 'select', level: 'intermediate', options: ['Auto', 'Inside end', 'Outside end'], default: 'Auto' },
    ],
  },
  xAxis: {
    label: 'X axis',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true },
      { id: 'color', label: 'Color', type: 'color', level: 'basic', default: '#605E5C' },
      { id: 'gridlines', label: 'Gridlines', type: 'toggle', level: 'intermediate', default: true },
    ],
  },
  yAxis: {
    label: 'Y axis',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true },
      { id: 'color', label: 'Color', type: 'color', level: 'intermediate', default: '#605E5C' },
    ],
  },
  legend: {
    label: 'Legend',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true },
      { id: 'position', label: 'Position', type: 'select', level: 'intermediate', options: ['Top', 'Right', 'Bottom', 'Left'], default: 'Top' },
    ],
  },
  plotArea: {
    label: 'Plot area',
    props: [
      { id: 'gridColor', label: 'Grid color', type: 'color', level: 'advanced', default: '#EDEBE9' },
      { id: 'referenceLine', label: 'Reference line', type: 'toggle', level: 'advanced', default: false },
    ],
  },
  bars: {
    label: 'Bars',
    props: [
      { id: 'cornerRadius', label: 'Corner radius', type: 'slider', level: 'intermediate', min: 0, max: 12, default: 0 },
      { id: 'innerPadding', label: 'Inner padding', type: 'slider', level: 'intermediate', min: 0, max: 80, default: 30 },
    ],
  },
}

const LINE_SECTIONS: Record<string, SectionDef> = {
  lines: {
    label: 'Lines',
    props: [
      { id: 'thickness', label: 'Thickness', type: 'slider', level: 'basic', min: 1, max: 6, default: 2 },
      { id: 'smooth', label: 'Smooth', type: 'toggle', level: 'intermediate', default: false },
      { id: 'color', label: 'Color', type: 'color', level: 'advanced', default: '#0D9488' },
    ],
  },
  markers: {
    label: 'Markers',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true },
      { id: 'size', label: 'Size', type: 'slider', level: 'basic', min: 1, max: 10, default: 3 },
    ],
  },
  dataLabels: BAR_SECTIONS.dataLabels,
  xAxis: BAR_SECTIONS.xAxis,
  yAxis: BAR_SECTIONS.yAxis,
  legend: BAR_SECTIONS.legend,
}

const PIE_SECTIONS: Record<string, SectionDef> = {
  detailLabels: {
    label: 'Detail labels',
    props: [
      { id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true },
      { id: 'position', label: 'Position', type: 'select', level: 'basic', options: ['Outside', 'Inside', 'Both'], default: 'Outside' },
      { id: 'labelStyle', label: 'Label style', type: 'select', level: 'intermediate', options: ['Category', 'Value', 'Category, value'], default: 'Category, value' },
    ],
  },
  slices: {
    label: 'Slices',
    props: [
      { id: 'stroke', label: 'Show stroke', type: 'toggle', level: 'basic', default: true },
      { id: 'rotation', label: 'Start angle', type: 'slider', level: 'advanced', min: 0, max: 360, default: 0 },
    ],
  },
  legend: BAR_SECTIONS.legend,
}

export const VISUAL_SECTIONS: Record<string, Record<string, SectionDef>> = {
  bar: BAR_SECTIONS,
  line: LINE_SECTIONS,
  pie: PIE_SECTIONS,
  donut: {
    donutShape: {
      label: 'Donut shape',
      props: [
        { id: 'innerRadius', label: 'Inner radius', type: 'slider', level: 'basic', min: 20, max: 90, default: 60 },
        { id: 'stroke', label: 'Show stroke', type: 'toggle', level: 'basic', default: true },
      ],
    },
    detailLabels: PIE_SECTIONS.detailLabels,
    slices: PIE_SECTIONS.slices,
    legend: BAR_SECTIONS.legend,
  },
  table: {
    columnHeaders: {
      label: 'Column headers',
      props: [
        { id: 'background', label: 'Background', type: 'color', level: 'basic', default: '#0D9488' },
        { id: 'fontColor', label: 'Text color', type: 'color', level: 'basic', default: '#FFFFFF' },
      ],
    },
    values: {
      label: 'Values',
      props: [
        { id: 'bandedRows', label: 'Banded rows', type: 'toggle', level: 'basic', default: true },
        { id: 'fontSize', label: 'Font size', type: 'number', level: 'intermediate', min: 8, max: 16, default: 10 },
      ],
    },
    total: {
      label: 'Total',
      props: [{ id: 'show', label: 'Show', type: 'toggle', level: 'intermediate', default: true }],
    },
    grid: {
      label: 'Grid',
      props: [
        { id: 'horizontal', label: 'Horizontal', type: 'toggle', level: 'advanced', default: true },
        { id: 'vertical', label: 'Vertical', type: 'toggle', level: 'advanced', default: false },
        { id: 'color', label: 'Grid color', type: 'color', level: 'advanced', default: '#EDEBE9' },
      ],
    },
  },
  matrix: {
    rowHeaders: { label: 'Row headers', props: [{ id: 'background', label: 'Background', type: 'color', level: 'basic', default: '#FFFFFF' }] },
    columnHeaders: { label: 'Column headers', props: [{ id: 'background', label: 'Background', type: 'color', level: 'basic', default: '#0D9488' }] },
    values: { label: 'Values', props: [{ id: 'bandedRows', label: 'Banded rows', type: 'toggle', level: 'basic', default: true }] },
    subtotals: { label: 'Subtotals', props: [{ id: 'show', label: 'Show', type: 'toggle', level: 'intermediate', default: true }] },
    grid: {
      label: 'Grid',
      props: [
        { id: 'horizontal', label: 'Horizontal', type: 'toggle', level: 'advanced', default: true },
        { id: 'vertical', label: 'Vertical', type: 'toggle', level: 'advanced', default: false },
        { id: 'color', label: 'Grid color', type: 'color', level: 'advanced', default: '#EDEBE9' },
      ],
    },
  },
  card: {
    callout: {
      label: 'Callout',
      props: [
        { id: 'fontSize', label: 'Font size', type: 'slider', level: 'basic', min: 16, max: 64, default: 32 },
        { id: 'color', label: 'Color', type: 'color', level: 'basic', default: '#252423' },
      ],
    },
    category: { label: 'Category', props: [{ id: 'show', label: 'Show label', type: 'toggle', level: 'basic', default: true }] },
    wordWrap: { label: 'Word wrap', props: [{ id: 'show', label: 'Wrap', type: 'toggle', level: 'intermediate', default: true }] },
  },
  slicer: {
    header: { label: 'Header', props: [{ id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true }] },
    items: { label: 'Items', props: [{ id: 'fontColor', label: 'Text color', type: 'color', level: 'basic', default: '#252423' }] },
    style: { label: 'Style', props: [{ id: 'mode', label: 'Mode', type: 'select', level: 'intermediate', options: ['List', 'Tile', 'Dropdown', 'Between'], default: 'List' }] },
  },
  gauge: {
    callout: { label: 'Callout', props: [{ id: 'show', label: 'Show', type: 'toggle', level: 'basic', default: true }] },
    targetLine: {
      label: 'Target line',
      props: [
        { id: 'show', label: 'Show line', type: 'toggle', level: 'basic', default: true },
        { id: 'color', label: 'Color', type: 'color', level: 'intermediate', default: '#252423' },
      ],
    },
  },
}

export const VISUAL_ALIAS: Record<string, string> = {
  bar: 'bar',
  stackedbar: 'bar',
  clusteredbar: 'bar',
  column: 'bar',
  stackedcol: 'bar',
  clusteredcol: 'bar',
  hundredstackedbar: 'bar',
  hundredstackedcol: 'bar',
  funnel: 'bar',
  waterfall: 'bar',
  line: 'line',
  area: 'line',
  stackedarea: 'line',
  ribbon: 'line',
  lineclustered: 'line',
  linestacked: 'line',
  scatter: 'line',
  bubble: 'line',
  pie: 'pie',
  treemap: 'pie',
  donut: 'donut',
  table: 'table',
  matrix: 'matrix',
  card: 'card',
  newcard: 'card',
  kpi: 'card',
  map: 'card',
  decompositiontree: 'card',
  slicer: 'slicer',
  gauge: 'gauge',
}

export function getVisualAlias(visualId: string | null | undefined): string {
  if (!visualId) return 'bar'
  return VISUAL_ALIAS[visualId] ?? 'bar'
}

export function getVisualSections(visualId: string | null | undefined): Record<string, SectionDef> {
  return VISUAL_SECTIONS[getVisualAlias(visualId)] ?? VISUAL_SECTIONS.bar
}
