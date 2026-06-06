export type SkillLevel     = 'basic' | 'intermediate' | 'advanced'
export type FormatTab      = 'visual' | 'general'
export type SlicerPosition = 'top' | 'left' | 'right'
export type PaletteSize    = 3 | 5 | 7 | 10
export type ThemeColorMode = 'theme' | 'custom'
export type IconLibraryCategory =
  | 'Power BI Visuals'
  | 'Power BI Actions'
  | 'Analytics'
  | 'Metrics/KPI'
  | 'Business'
  | 'Finance'
  | 'Currency Signs'
  | 'HR'
  | 'Sales'
  | 'Marketing'
  | 'Operations'
  | 'Supply Chain'
  | 'Application'
  | 'Healthcare'
  | 'Education'
  | 'Technology'
  | 'Cloud'
  | 'Development'
  | 'Communication'
  | 'Navigation'
  | 'Directions & Arrows'
  | 'Toggle & Controls'
  | 'Shapes'
  | 'Buttons'
  | 'Files'
  | 'Security'
  | 'Admin'
  | 'Alerts'
  | 'Maps'
  | 'Flags'
  | 'Countries'
  | 'Essentials'
export type ThemeCategory =
  | 'Corporate'
  | 'Technology'
  | 'Finance'
  | 'Healthcare'
  | 'Retail'
  | 'Industrial'
  | 'Premium Dark'
  | 'Minimal'
  | 'India & Gulf'
  | 'Modern'
  | 'Premium'
  | 'Vibrant'
  | 'Pastel'
  | 'Earthy'
  | 'Dark'
  | 'Monochrome'
  | 'Editorial'
export type DashboardDomain =
  | 'sales'
  | 'hr'
  | 'finance'
  | 'supplychain'
  | 'marketing'
  | 'healthcare'
/**
 * Executive Command Center preview domains. Distinct from DashboardDomain
 * (which drives the Visuals/FocusView feature) — these five mirror the
 * Executive_Dashboard_16x9 reference and own their own page navigation.
 */
export type ExecDomain =
  | 'sales'
  | 'finance'
  | 'hr'
  | 'supply'
  | 'inventory'
export type ZoomLevel      = 'fit' | 0.25 | 0.5 | 0.75 | 1
export type FormatValue    = string | number | boolean

export interface PageSizeDef {
  key:   string
  label: string
  w:     number
  h:     number
}

export interface PresetTheme {
  id:                 string
  name:               string
  category:           ThemeCategory
  description:        string
  categories?:        string[]
  collectionClass?:   string
  tags?:              string[]
  recommendedFor?:    string[]
  dataColorsFull:     string[]
  dataColors?:        string[]
  paletteSize?:       number
  background:         string
  dashboardBackground?: string
  pageBackground?:    string
  foreground:         string
  muted?:             string
  tableAccent:        string
  good:               string
  neutral:            string
  bad:                string
  visualBackground:   string
  cardBackground?:    string
  borderColor:        string
  titleColor:         string
  labelColor:         string
  primaryColor?:      string
  accentColor?:       string
  gridlineColor?:     string
  dividerColor?:      string
  highlight?:         string
  tooltipBackground?: string
  tableHeaderBackground?: string
  tableRowAlt?:       string
  gradientType?:      string
  harmony?:           string
  hue?:               string
  profile?:           string
  mode?:              string
  theme?:             string
  source?:            'built-in' | 'premium' | 'admin'
  fontFamily:         string
  titleFontSize:      number
  labelFontSize:      number
  paletteSizeDefault: PaletteSize
  /** Compatibility aliases used by older sidebar/store code paths. */
  cat:                ThemeCategory
  colors:             string[]
  bg:                 string
  fg:                 string
}

export interface ChartDefinition {
  id:    string
  title: string
  sub:   string
}

export interface ChartSeriesDef {
  name:  string
  color: string
}

/**
 * Optional data injected into a mimic chart so domain dashboards can show
 * real per-domain data instead of the generic gallery sample. When omitted,
 * each chart component falls back to its embedded representative sample, so
 * the Visuals gallery / format lab keep working unchanged.
 *
 * Cartesian + line/area use categories/series/values ([categoryIdx][seriesIdx]).
 * Combo charts use the column and line series/values pairs. Pie/donut use slices.
 */
export interface ChartDataset {
  categories?:   string[]
  series?:       ChartSeriesDef[]
  values?:       number[][]
  slices?:       { label: string; value: number }[]
  columnSeries?: ChartSeriesDef[]
  columnValues?: number[][]
  lineSeries?:   ChartSeriesDef[]
  lineValues?:   number[][]
}

export interface IconLibraryItem {
  id:       string
  name:     string
  primaryCategory?: IconLibraryCategory
  category: IconLibraryCategory
  source:   'tabler' | 'flag'
  url:      string
  tags:     readonly string[]
  keywords?: readonly string[]
  domain?: string
  countryName?: string
  isoCode?: string
  license:  string
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
  dashboardBackground?: string
  pageBackground?: string
  visualBackground?: string
  cardBackground?:   string
  borderColor?:      string
  titleColor?:       string
  labelColor?:       string
  gridlineColor?:    string
  dividerColor?:     string
  highlight?:        string
  tooltipBackground?: string
  tableHeaderBackground?: string
  tableRowAlt?:      string
  fg?:           string
  tableAccent?:  string
  good?:         string
  neutral?:      string
  bad?:          string
  paletteSize?:  PaletteSize
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
  firstLevelElements?:  string
  secondLevelElements?: string
  thirdLevelElements?:  string
  fourthLevelElements?: string
  secondaryBackground?: string
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
  customCanvasBackground: string | null
  visualBackground: string
  cardBackground:   string
  borderColor:      string
  titleColor:       string
  labelColor:       string
  gridlineColor:    string
  dividerColor:     string
  highlight:        string
  tooltipBackground: string
  tableHeaderBackground: string
  tableRowAlt:      string
  canvasBackgroundMode: ThemeColorMode
  visualBackgroundMode: ThemeColorMode
  fg:              string
  good:            string
  neutral:         string
  bad:             string
  tableAccent:     string
  pageSize:        string
  zoom:            ZoomLevel
  spacing:         number
  paletteSize:     PaletteSize
  layout:          LayoutConfig
  dashboardDomain: DashboardDomain
  currentPage:     number
  execDomain:      ExecDomain
  execPage:        number
  focusVisual:     string | null
  skillLevel:      SkillLevel
  activeFormatTab: FormatTab
  formatProps:     Record<string, FormatValue>
  selectedVisual:  string | null
  themeName:       string
  visualTitles:    Record<string, string>
  selectedIconId:    string | null
  selectedIconUrl:   string | null
  selectedIconColor: string
  recentIcons:       string[]
  historyPast:       ThemeHistorySnapshot[]
  historyFuture:     ThemeHistorySnapshot[]
}

export interface ThemeHistorySnapshot {
  dataColors: string[]
  primary: string
  accent: string
  bg: string
  customCanvasBackground: string | null
  visualBackground: string
  cardBackground: string
  borderColor: string
  titleColor: string
  labelColor: string
  gridlineColor: string
  dividerColor: string
  highlight: string
  tooltipBackground: string
  tableHeaderBackground: string
  tableRowAlt: string
  canvasBackgroundMode: ThemeColorMode
  visualBackgroundMode: ThemeColorMode
  fg: string
  good: string
  neutral: string
  bad: string
  tableAccent: string
  paletteSize: PaletteSize
  formatProps: Record<string, FormatValue>
  visualTitles: Record<string, string>
}

export interface ThemeActions {
  setDataColor:    (index: number, hex: string) => void
  setDataColors:   (colors: string[]) => void
  setPaletteSize:  (size: PaletteSize) => void
  setPrimary:      (hex: string) => void
  setAccent:       (hex: string) => void
  setBg:           (hex: string) => void
  resetCanvasBackground: () => void
  setVisualBackground: (hex: string) => void
  resetVisualBackground: () => void
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
  setDashboardDomain: (domain: DashboardDomain) => void
  setCurrentPage:  (page: number) => void
  setExecDomain:   (domain: ExecDomain) => void
  setExecPage:     (page: number) => void
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
  setSelectedIcon: (icon: Pick<IconLibraryItem, 'id' | 'url'>) => void
  setSelectedIconColor: (hex: string) => void
  undo: () => void
  redo: () => void
  resetAllFormatting: () => void
}
