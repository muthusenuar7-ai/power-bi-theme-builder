export type SkillLevel     = 'basic' | 'intermediate' | 'advanced'
export type FormatTab      = 'visual' | 'general'
export type SlicerPosition = 'top' | 'left' | 'right'
export type ZoomLevel      = 'fit' | 0.25 | 0.5 | 0.75 | 1
export type FormatValue    = string | number | boolean

export interface PageSizeDef {
  key:   string
  label: string
  w:     number
  h:     number
}

export interface PresetTheme {
  cat:    string
  name:   string
  colors: string[]
  bg:     string
  fg:     string
}

export interface ChartDefinition {
  id:    string
  title: string
  sub:   string
}

export interface SlicerDef {
  title:  string
  type:   'list' | 'buttons' | 'dropdown' | 'slider'
  items?: string[]
  sel?:   number[]
  min?:   number
  max?:   number
}

export interface KpiDef {
  lbl:   string
  val:   string
  trend: 'up' | 'down'
  delta: string
  icon:  string
}

export interface LayoutConfig {
  numSlicers: number
  slicerPos:  SlicerPosition
  numKpis:    number
}

export interface LayoutPlan {
  pageSizeKey:   string
  cols:          number
  rows:          number
  chartsPerPage: number
  totalCharts:   number
  totalPages:    number
  pageWidth:     number
  pageHeight:    number
}

export interface PropDef {
  id:       string
  label:    string
  type:     'toggle' | 'color' | 'slider' | 'select' | 'segments' | 'number'
  level:    SkillLevel
  default:  string | number | boolean
  min?:     number
  max?:     number
  options?: string[]
}

export interface SectionDef {
  label: string
  props: PropDef[]
}

export interface QualityMetrics {
  overall:       number
  contrast:      number
  readability:   number
  consistency:   number
  accessibility: number
}

export interface ThemeImportPatch {
  themeName?:    string
  dataColors?:   string[]
  primary?:      string
  accent?:       string
  bg?:           string
  fg?:           string
  tableAccent?:  string
  good?:         string
  neutral?:      string
  bad?:          string
  warnings?:     string[]
}

export interface ValidationResult {
  isValid:  boolean
  errors:   string[]
  warnings: string[]
}

export interface PowerBIColorObject {
  solid: {
    color: string
  }
}

export interface PowerBITheme {
  name:        string
  dataColors:  string[]
  background:  string
  foreground:  string
  tableAccent: string
  good:        string
  neutral:     string
  bad:         string
  textClasses: {
    callout: Record<string, string | number>
    title:   Record<string, string | number>
    header:  Record<string, string | number>
    label:   Record<string, string | number>
  }
  visualStyles: Record<string, Record<string, Record<string, Array<Record<string, unknown>>>>>
}

export interface ThemeState {
  dataColors:      string[]
  primary:         string
  accent:          string
  bg:              string
  fg:              string
  good:            string
  neutral:         string
  bad:             string
  tableAccent:     string
  pageSize:        string
  zoom:            ZoomLevel
  spacing:         number
  layout:          LayoutConfig
  currentPage:     number
  focusVisual:     string | null
  skillLevel:      SkillLevel
  activeFormatTab: FormatTab
  formatProps:     Record<string, FormatValue>
  selectedVisual:  string | null
  themeName:       string
  visualTitles:    Record<string, string>
}

export interface ThemeActions {
  setDataColor:    (index: number, hex: string) => void
  setDataColors:   (colors: string[]) => void
  setPrimary:      (hex: string) => void
  setAccent:       (hex: string) => void
  setBg:           (hex: string) => void
  setFg:           (hex: string) => void
  setGood:         (hex: string) => void
  setNeutral:      (hex: string) => void
  setBad:          (hex: string) => void
  setTableAccent:  (hex: string) => void
  applyImportedTheme: (patch: ThemeImportPatch) => void
  applyPreset:     (preset: PresetTheme) => void
  setPageSize:     (key: string) => void
  setZoom:         (level: ZoomLevel) => void
  setSpacing:      (px: number) => void
  setLayout:       (config: Partial<LayoutConfig>) => void
  setCurrentPage:  (page: number) => void
  setFocusVisual:  (vid: string | null) => void
  setSkillLevel:   (level: SkillLevel) => void
  setFormatTab:    (tab: FormatTab) => void
  setProp:         (key: string, value: FormatValue) => void
  updateGeneralFormat: (path: string, value: FormatValue) => void
  updateVisualFormat:  (visualId: string, path: string, value: FormatValue) => void
  resetGeneralSection: (sectionId: string) => void
  resetVisualSection:  (visualId: string, sectionId: string) => void
  resetVisualFormat:   (visualId: string) => void
  setSelectedVisual: (vid: string | null) => void
  setThemeName:    (name: string) => void
  setVisualTitle:  (visualId: string, title: string) => void
}
