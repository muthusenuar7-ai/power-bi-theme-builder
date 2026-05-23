Build a complete, production-ready web application called 
"Datacense Power BI Theme Studio". This is a professional 
tool for designing and exporting Microsoft Power BI 
compatible .json theme files.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Framework  : Next.js 14 (App Router)
Language   : TypeScript (strict mode)
Styling    : Tailwind CSS + CSS custom properties
Components : Shadcn/ui
State      : Zustand
Icons      : Lucide React
Fonts      : Outfit (UI) + JetBrains Mono (code)
Deploy     : Vercel ready

Run these commands to bootstrap:
npx create-next-app@latest pbi-studio --typescript --tailwind --app --src-dir --import-alias "@/*"
cd pbi-studio
npm install zustand lucide-react clsx tailwind-merge
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label select slider tabs card badge tooltip scroll-area dropdown-menu popover separator toast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  (redirect to /editor)
│   ├── globals.css
│   └── editor/
│       └── page.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── LeftSidebar.tsx
│   │   └── RightPanel.tsx
│   │
│   ├── sidebar/
│   │   ├── AccordionSection.tsx
│   │   ├── PresetThemes.tsx
│   │   ├── CoolorsImport.tsx
│   │   ├── ColorPalette.tsx
│   │   ├── BrandColors.tsx
│   │   └── Typography.tsx
│   │
│   ├── canvas/
│   │   ├── CanvasToolbar.tsx
│   │   ├── VisualSelectorBar.tsx
│   │   ├── DashboardCanvas.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── FocusView.tsx
│   │   ├── KpiStrip.tsx
│   │   ├── SlicerSidebar.tsx
│   │   ├── ChartGrid.tsx
│   │   ├── ChartCard.tsx
│   │   └── PageNavigator.tsx
│   │
│   ├── charts/
│   │   ├── ClusteredColumn.tsx
│   │   ├── HorizontalBar.tsx
│   │   ├── LineChart.tsx
│   │   ├── StackedColumn.tsx
│   │   ├── ClusteredBar.tsx
│   │   ├── StackedBar.tsx
│   │   ├── DonutChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── AreaChart.tsx
│   │   ├── ScatterChart.tsx
│   │   ├── TreemapChart.tsx
│   │   ├── FunnelChart.tsx
│   │   ├── LineColumnCombo.tsx
│   │   ├── LineStackedCombo.tsx
│   │   ├── GaugeChart.tsx
│   │   ├── TableVisual.tsx
│   │   ├── MatrixVisual.tsx
│   │   ├── MapVisual.tsx
│   │   └── SlicerVisual.tsx
│   │
│   ├── format-pane/
│   │   ├── FormatPane.tsx
│   │   ├── SkillToggle.tsx
│   │   ├── FormatSection.tsx
│   │   ├── PropertyRow.tsx
│   │   └── controls/
│   │       ├── ToggleControl.tsx
│   │       ├── ColorControl.tsx
│   │       ├── SliderControl.tsx
│   │       ├── SelectControl.tsx
│   │       ├── SegmentControl.tsx
│   │       └── NumberControl.tsx
│   │
│   └── right-panel/
│       ├── VisualDetail.tsx
│       ├── QualityScore.tsx
│       ├── ValidationPanel.tsx
│       └── JsonPreview.tsx
│
├── lib/
│   ├── presets.ts
│   ├── chartPool.ts
│   ├── pageSizes.ts
│   ├── slicerDefs.ts
│   ├── kpiDefs.ts
│   ├── formatProps.ts
│   ├── layoutEngine.ts
│   ├── colorUtils.ts
│   ├── themeGenerator.ts
│   └── coolorsParser.ts
│
├── store/
│   └── themeStore.ts
│
└── types/
    └── index.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPESCRIPT TYPES  (src/types/index.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type SkillLevel = 'basic' | 'intermediate' | 'advanced'
export type FormatTab = 'visual' | 'general'
export type SlicerPosition = 'top' | 'left' | 'right'
export type ZoomLevel = 'fit' | 0.25 | 0.5 | 0.75 | 1

export interface PageSizeDef {
  key: string
  label: string
  w: number
  h: number
}

export interface PresetTheme {
  cat: string
  name: string
  colors: string[]   // exactly 8 hex strings
  bg: string
  fg: string
}

export interface ChartDefinition {
  id: string
  title: string
  sub: string
}

export interface SlicerDef {
  title: string
  type: 'list' | 'buttons' | 'dropdown' | 'slider'
  items?: string[]
  sel?: number[]
  min?: number
  max?: number
}

export interface KpiDef {
  lbl: string
  val: string
  trend: 'up' | 'down'
  delta: string
  icon: string
}

export interface LayoutConfig {
  numSlicers: number
  slicerPos: SlicerPosition
  numKpis: number
}

export interface LayoutPlan {
  cols: number
  rows: number
  perPage: number
}

export interface PropDef {
  id: string
  label: string
  type: 'toggle' | 'color' | 'slider' | 'select' | 'segments' | 'number'
  level: SkillLevel
  default: string | number | boolean
  min?: number
  max?: number
  options?: string[]
}

export interface SectionDef {
  label: string
  props: PropDef[]
}

export interface QualityMetrics {
  overall: number
  contrast: number
  readability: number
  consistency: number
  accessibility: number
}

export interface ThemeState {
  dataColors: string[]
  primary: string
  accent: string
  bg: string
  fg: string
  good: string
  neutral: string
  bad: string
  tableAccent: string
  pageSize: string
  zoom: ZoomLevel
  spacing: number
  layout: LayoutConfig
  currentPage: number
  focusVisual: string | null
  skillLevel: SkillLevel
  activeFormatTab: FormatTab
  formatProps: Record<string, string | number | boolean>
  selectedVisual: string | null
  themeName: string
}

export interface ThemeActions {
  setDataColor: (index: number, hex: string) => void
  setDataColors: (colors: string[]) => void
  setPrimary: (hex: string) => void
  setAccent: (hex: string) => void
  setBg: (hex: string) => void
  setFg: (hex: string) => void
  setGood: (hex: string) => void
  setNeutral: (hex: string) => void
  setBad: (hex: string) => void
  applyPreset: (preset: PresetTheme) => void
  setPageSize: (key: string) => void
  setZoom: (level: ZoomLevel) => void
  setSpacing: (px: number) => void
  setLayout: (config: Partial<LayoutConfig>) => void
  setCurrentPage: (page: number) => void
  setFocusVisual: (vid: string | null) => void
  setSkillLevel: (level: SkillLevel) => void
  setFormatTab: (tab: FormatTab) => void
  setProp: (key: string, value: string | number | boolean) => void
  setSelectedVisual: (vid: string | null) => void
  setThemeName: (name: string) => void
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZUSTAND STORE  (src/store/themeStore.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create the Zustand store with this initial state:

dataColors : ['#0D9488','#3B82F6','#8B5CF6','#F59E0B',
              '#EF4444','#10B981','#F97316','#EC4899']
primary    : '#0D9488'
accent     : '#3B82F6'
bg         : '#FFFFFF'
fg         : '#0F172A'
good       : '#10B981'
neutral    : '#F59E0B'
bad        : '#EF4444'
tableAccent: '#0D9488'
pageSize   : '16:9'
zoom       : 'fit'
spacing    : 10
layout     : { numSlicers: 2, slicerPos: 'left', numKpis: 4 }
currentPage: 0
focusVisual: null
skillLevel : 'basic'
activeFormatTab: 'visual'
formatProps: {}
selectedVisual: null
themeName  : 'My PBI Theme'

applyPreset action must:
  1. Set dataColors to preset.colors
  2. Set primary to preset.colors[0]
  3. Set accent to preset.colors[1]
  4. Set bg and fg from preset
  5. Reset currentPage to 0

Also export a useCSSSync() hook that calls
useEffect to sync store colors to CSS custom properties:
  --c1 through --c8 = dataColors[0..7]
  --primary = primary
  --accent = accent
  --pbi-bg = bg
  --pbi-fg = fg
  --good = good
  --neutral = neutral
  --bad = bad
Call document.documentElement.style.setProperty for each.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE SIZES  (src/lib/pageSizes.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PAGE_SIZES: Record<string, PageSizeDef> = {
  '16:9'   : { key:'16:9',    label:'16:9 HD',      w:1280, h:720  },
  'fhd'    : { key:'fhd',     label:'Full HD',       w:1920, h:1080 },
  'qhd'    : { key:'qhd',     label:'QHD',           w:2560, h:1440 },
  '4:3'    : { key:'4:3',     label:'4:3',           w:1024, h:768  },
  'letter' : { key:'letter',  label:'Letter',        w:816,  h:1056 },
  'a4l'    : { key:'a4l',     label:'A4 Landscape',  w:1123, h:794  },
  'a4p'    : { key:'a4p',     label:'A4 Portrait',   w:794,  h:1123 },
  'tooltip': { key:'tooltip', label:'Tooltip',       w:320,  h:240  },
  'mobile' : { key:'mobile',  label:'Mobile',        w:414,  h:896  },
  'square' : { key:'square',  label:'Square',        w:1080, h:1080 },
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT ENGINE  (src/lib/layoutEngine.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

getLayoutPlan(pageSizeKey: string): LayoutPlan
  w < 700  → cols 1, rows 3
  w < 1000 → cols 2, rows 2
  w < 1700 → cols 2, rows 2   (16:9 HD = 4 charts)
  w < 2300 → cols 3, rows 2   (Full HD = 6 charts)
  else     → cols 4, rows 2   (QHD = 8 charts)

getTotalPages(pageSizeKey: string): number
  Math.ceil(CHART_POOL.length / getLayoutPlan(pageSizeKey).perPage)

getChartsForPage(pageSizeKey: string, page: number): ChartDefinition[]
  const { perPage } = getLayoutPlan(pageSizeKey)
  return CHART_POOL.slice(page * perPage, (page + 1) * perPage)

getSlicerWidth(pageWidth: number): number
  pageWidth < 700 ? 120 : pageWidth < 1000 ? 140 : 170

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHART POOL  (src/lib/chartPool.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CHART_POOL: ChartDefinition[] = [
  { id:'clusteredcol',  title:'Budget vs Actual',         sub:'Clustered Column'     },
  { id:'bar',           title:'Sales by Category',        sub:'Horizontal Bar'       },
  { id:'line',          title:'Revenue Trend',            sub:'Line Chart'           },
  { id:'stackedcol',    title:'Regional Sales Mix',       sub:'Stacked Column'       },
  { id:'clusteredbar',  title:'Team Performance',         sub:'Clustered Bar'        },
  { id:'stackedbar',    title:'Category Mix by Region',   sub:'Stacked Bar'          },
  { id:'donut',         title:'Revenue by Category',      sub:'Donut Chart'          },
  { id:'pie',           title:'Market Share',             sub:'Pie Chart'            },
  { id:'area',          title:'Growth Trend',             sub:'Area Chart'           },
  { id:'scatter',       title:'Revenue vs Profit',        sub:'Scatter Plot'         },
  { id:'treemap',       title:'Product Performance',      sub:'Treemap'              },
  { id:'funnel',        title:'Sales Funnel',             sub:'Funnel Chart'         },
  { id:'linecolumn',    title:'Revenue and Units Sold',   sub:'Line + Column Combo'  },
  { id:'linestacked',   title:'Sales Mix and Growth',     sub:'Line + Stacked Combo' },
  { id:'gauge',         title:'Target Achievement',       sub:'Gauge Chart'          },
  { id:'table',         title:'Top Products Table',       sub:'Table'                },
  { id:'matrix',        title:'Regional Matrix',          sub:'Matrix'               },
  { id:'map',           title:'Sales by Location',        sub:'Map Visual'           },
  { id:'slicer',        title:'Filter Panel',             sub:'Slicer'               },
]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KPI DEFINITIONS  (src/lib/kpiDefs.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const KPI_DEFS: KpiDef[] = [
  { lbl:'Total Sales',       val:'₹48.6L',  trend:'up',   delta:'12.4%', icon:'currency' },
  { lbl:'Total Orders',      val:'3,842',   trend:'up',   delta:'8.7%',  icon:'cart'     },
  { lbl:'Avg Order Value',   val:'₹12,650', trend:'up',   delta:'3.2%',  icon:'card'     },
  { lbl:'Profit Margin',     val:'24.8%',   trend:'down', delta:'1.1%',  icon:'pulse'    },
  { lbl:'Active Customers',  val:'18,420',  trend:'up',   delta:'15.6%', icon:'users'    },
  { lbl:'Conversion Rate',   val:'4.2%',    trend:'up',   delta:'0.8%',  icon:'trend'    },
  { lbl:'Returns Rate',      val:'2.1%',    trend:'down', delta:'0.4%',  icon:'return'   },
  { lbl:'Customer LTV',      val:'₹62K',    trend:'up',   delta:'9.3%',  icon:'star'     },
]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLICER DEFINITIONS  (src/lib/slicerDefs.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SLICER_DEFS: SlicerDef[] = [
  {
    title: 'Date Range',
    type: 'list',
    items: ['Today','This Week','This Month','This Quarter','YTD'],
    sel: [0, 2]
  },
  {
    title: 'Region',
    type: 'buttons',
    items: ['North','South','East','West'],
    sel: [0, 2]
  },
  {
    title: 'Category',
    type: 'list',
    items: ['Electronics','Clothing','Food','Sports','Home'],
    sel: [0, 1, 3]
  },
  {
    title: 'Year',
    type: 'dropdown',
    items: ['FY24-25','FY23-24','FY22-23','FY21-22']
  },
  {
    title: 'Sales Range',
    type: 'slider',
    min: 0,
    max: 100
  },
]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRESET THEMES  (src/lib/presets.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create PRESETS array with at least 10 entries per category.
Categories: Modern, Corporate, Dark, Light, Finance,
Healthcare, Vibrant, Nature, Minimal

Exact format for each entry:
{ cat: string, name: string, colors: string[8], bg: string, fg: string }

Include these specific presets as a starting point and
add more to reach 10+ per category:

MODERN:
{ cat:'Modern', name:'Teal Pro', colors:['#0D9488','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#10B981','#F97316','#EC4899'], bg:'#FFFFFF', fg:'#0F172A' }
{ cat:'Modern', name:'Violet Dream', colors:['#7C3AED','#8B5CF6','#A78BFA','#C4B5FD','#6D28D9','#EC4899','#F472B6','#FCA5A5'], bg:'#F5F3FF', fg:'#2E1065' }
{ cat:'Modern', name:'Sapphire', colors:['#1E3A8A','#2563EB','#60A5FA','#93C5FD','#0D9488','#14B8A6','#F59E0B','#EF4444'], bg:'#EFF6FF', fg:'#1E3A8A' }
{ cat:'Modern', name:'Cyan Spark', colors:['#06B6D4','#0EA5E9','#3B82F6','#8B5CF6','#EC4899','#F43F5E','#F97316','#EAB308'], bg:'#F0FDFF', fg:'#083344' }
{ cat:'Modern', name:'Mint Fresh', colors:['#10B981','#34D399','#6EE7B7','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#EC4899'], bg:'#ECFDF5', fg:'#064E3B' }

CORPORATE:
{ cat:'Corporate', name:'Corporate Blue', colors:['#1E40AF','#1D4ED8','#2563EB','#60A5FA','#93C5FD','#BFDBFE','#475569','#94A3B8'], bg:'#FFFFFF', fg:'#1E293B' }
{ cat:'Corporate', name:'Executive Navy', colors:['#1E3A5F','#2C5282','#3182CE','#4299E1','#63B3ED','#90CDF4','#BEE3F8','#2D3748'], bg:'#FFFFFF', fg:'#1A202C' }
{ cat:'Corporate', name:'McKinsey Blue', colors:['#1E3F5A','#154360','#2E86C1','#5DADE2','#AED6F1','#1E8449','#F4D03F','#E74C3C'], bg:'#EBF5FB', fg:'#154360' }
{ cat:'Corporate', name:'Deloitte Green', colors:['#046A38','#00A550','#57B848','#A8D08D','#005587','#0076A8','#7BC4E2','#C8E6C9'], bg:'#F1FFF5', fg:'#014D2A' }
{ cat:'Corporate', name:'Steel Pro', colors:['#1C2B3A','#2C3E50','#5D6D7E','#85929E','#1A5276','#2E86C1','#AED6F1','#D5D8DC'], bg:'#F8F9FA', fg:'#1C2B3A' }

DARK:
{ cat:'Dark', name:'Ocean Deep', colors:['#0EA5E9','#6366F1','#22D3EE','#38BDF8','#818CF8','#34D399','#FB923C','#A78BFA'], bg:'#0F172A', fg:'#E2E8F0' }
{ cat:'Dark', name:'Midnight', colors:['#6366F1','#8B5CF6','#EC4899','#F43F5E','#F97316','#FBBF24','#34D399','#22D3EE'], bg:'#0F0F1A', fg:'#F1F5F9' }
{ cat:'Dark', name:'Dracula', colors:['#FF79C6','#BD93F9','#50FA7B','#F1FA8C','#FFB86C','#8BE9FD','#FF5555','#6272A4'], bg:'#282A36', fg:'#F8F8F2' }
{ cat:'Dark', name:'Tokyo Night', colors:['#7AA2F7','#9ECE6A','#E0AF68','#F7768E','#BB9AF7','#7DCFFF','#B4F9F8','#FF9E64'], bg:'#1A1B2E', fg:'#C0CAF5' }
{ cat:'Dark', name:'Nord Dark', colors:['#88C0D0','#81A1C1','#5E81AC','#A3BE8C','#EBCB8B','#D08770','#BF616A','#B48EAD'], bg:'#2E3440', fg:'#ECEFF4' }

LIGHT:
{ cat:'Light', name:'Snow Clean', colors:['#3B82F6','#0D9488','#8B5CF6','#F59E0B','#EF4444','#10B981','#F97316','#EC4899'], bg:'#F8FAFC', fg:'#0F172A' }
{ cat:'Light', name:'Morning Sky', colors:['#3B82F6','#2563EB','#1D4ED8','#1E40AF','#0D9488','#059669','#F59E0B','#EF4444'], bg:'#EFF6FF', fg:'#1E3A8A' }
{ cat:'Light', name:'Sage Meadow', colors:['#4ADE80','#22C55E','#16A34A','#15803D','#0D9488','#3B82F6','#F59E0B','#EF4444'], bg:'#F0FDF4', fg:'#14532D' }
{ cat:'Light', name:'Lavender Haze', colors:['#A855F7','#9333EA','#7E22CE','#6B21A8','#EC4899','#DB2777','#3B82F6','#0D9488'], bg:'#FAF5FF', fg:'#3B0764' }
{ cat:'Light', name:'Cream Latte', colors:['#F59E0B','#D97706','#92400E','#78350F','#3B82F6','#10B981','#EF4444','#8B5CF6'], bg:'#FFFBEB', fg:'#451A03' }

FINANCE:
{ cat:'Finance', name:'Financial Green', colors:['#065F46','#059669','#10B981','#34D399','#6EE7B7','#F59E0B','#EF4444','#3B82F6'], bg:'#F0FDF4', fg:'#064E3B' }
{ cat:'Finance', name:'Gold Standard', colors:['#92400E','#B45309','#D97706','#F59E0B','#FBBF24','#FCD34D','#1E40AF','#1D4ED8'], bg:'#FFFBEB', fg:'#451A03' }
{ cat:'Finance', name:'Bloomberg Dark', colors:['#FF6600','#FFAA00','#00CC44','#0088FF','#FF4444','#CCCC00','#00AAFF','#FF8800'], bg:'#1A1A1A', fg:'#F0F0F0' }
{ cat:'Finance', name:'Treasury Blue', colors:['#0A2342','#1B3A5C','#2E5E8E','#4281B7','#72A8D4','#EFDD8D','#D4A833','#A07830'], bg:'#EBF3FB', fg:'#0A2342' }
{ cat:'Finance', name:'Wall Street', colors:['#F39C12','#F1C40F','#E67E22','#27AE60','#E74C3C','#3498DB','#9B59B6','#1ABC9C'], bg:'#1C2833', fg:'#ECF0F1' }

HEALTHCARE:
{ cat:'Healthcare', name:'Healthcare Blue', colors:['#1D4ED8','#2563EB','#3B82F6','#60A5FA','#10B981','#34D399','#F59E0B','#EF4444'], bg:'#EFF6FF', fg:'#1E3A5F' }
{ cat:'Healthcare', name:'Medical Green', colors:['#047857','#059669','#10B981','#6EE7B7','#0EA5E9','#38BDF8','#F59E0B','#EF4444'], bg:'#ECFDF5', fg:'#064E3B' }
{ cat:'Healthcare', name:'Wellness Teal', colors:['#004D40','#00695C','#00897B','#26A69A','#4DB6AC','#80CBC4','#FF7043','#FFA000'], bg:'#E0F2F1', fg:'#004D40' }
{ cat:'Healthcare', name:'Pharma Purple', colors:['#7B1FA2','#8E24AA','#AB47BC','#CE93D8','#4A148C','#6A1B9A','#42A5F5','#26C6DA'], bg:'#F8F0FD', fg:'#4A148C' }
{ cat:'Healthcare', name:'Clinical White', colors:['#0288D1','#0277BD','#01579B','#00695C','#00897B','#26A69A','#EF5350','#FFA726'], bg:'#FAFAFA', fg:'#212121' }

VIBRANT:
{ cat:'Vibrant', name:'Sunset', colors:['#F97316','#EF4444','#EC4899','#F59E0B','#DC2626','#FCD34D','#C026D3','#7C3AED'], bg:'#FFF7ED', fg:'#431407' }
{ cat:'Vibrant', name:'Electric', colors:['#E040FB','#7C4DFF','#448AFF','#18FFFF','#69FF47','#FFFF00','#FF6D00','#FF1744'], bg:'#1A1A2E', fg:'#F8F9FA' }
{ cat:'Vibrant', name:'Bollywood', colors:['#FF1744','#FF6D00','#FFD600','#00C853','#2979FF','#AA00FF','#F50057','#00BFA5'], bg:'#FFFAF0', fg:'#1A0010' }
{ cat:'Vibrant', name:'Carnival', colors:['#FFD700','#FF4500','#FF1493','#00CED1','#7B68EE','#32CD32','#FF69B4','#FF6347'], bg:'#FFF9E6', fg:'#1A1A1A' }
{ cat:'Vibrant', name:'Pop Art', colors:['#FFBE0B','#FB5607','#FF006E','#8338EC','#3A86FF','#38B000','#FF9F1C','#6A4C93'], bg:'#FFFEF5', fg:'#1A1A1A' }

NATURE:
{ cat:'Nature', name:'Forest', colors:['#16A34A','#15803D','#4ADE80','#86EFAC','#FEF08A','#FACC15','#FB923C','#6B7280'], bg:'#F0FDF4', fg:'#14532D' }
{ cat:'Nature', name:'Ocean Breeze', colors:['#006994','#0099CC','#00BFFF','#87CEEB','#4A90D9','#228B22','#3CB371','#90EE90'], bg:'#EFF9FF', fg:'#003D5C' }
{ cat:'Nature', name:'Earth Tones', colors:['#92400E','#78350F','#B45309','#A16207','#4D7C0F','#166534','#0F766E','#0E7490'], bg:'#FEFCE8', fg:'#3B1A08' }
{ cat:'Nature', name:'Cherry Blossom', colors:['#FFB7C5','#FF91A8','#FF6B8A','#FF4D6D','#C9184A','#A4133C','#800F2F','#590D22'], bg:'#FFF0F3', fg:'#590D22' }
{ cat:'Nature', name:'Autumn Gold', colors:['#8B2500','#B5451B','#CE5C00','#E9721E','#F6A64A','#F8CB7C','#FAEAAB','#C0392B'], bg:'#FFF8F0', fg:'#4A1300' }

MINIMAL:
{ cat:'Minimal', name:'Clean White', colors:['#3B82F6','#0D9488','#8B5CF6','#F59E0B','#EF4444','#10B981','#F97316','#EC4899'], bg:'#F8FAFC', fg:'#0F172A' }
{ cat:'Minimal', name:'Scandinavian', colors:['#2563EB','#DC2626','#16A34A','#D97706','#7C3AED','#0D9488','#DB2777','#374151'], bg:'#FAFAFA', fg:'#111827' }
{ cat:'Minimal', name:'Swiss Grid', colors:['#F44336','#2196F3','#4CAF50','#FF9800','#9C27B0','#009688','#FF5722','#607D8B'], bg:'#FFFFFF', fg:'#000000' }
{ cat:'Minimal', name:'Soft Pastels', colors:['#93C5FD','#A78BFA','#F9A8D4','#6EE7B7','#FDE68A','#FDBA74','#A5F3FC','#D9F99D'], bg:'#F8FAFC', fg:'#1E293B' }
{ cat:'Minimal', name:'Ink Paper', colors:['#1F2937','#374151','#4B5563','#6B7280','#3B82F6','#10B981','#F59E0B','#EF4444'], bg:'#FEFCE8', fg:'#111827' }

Also export:
const PRESET_CATEGORIES = ['All', 'Modern', 'Corporate', 'Dark',
  'Light', 'Finance', 'Healthcare', 'Vibrant', 'Nature', 'Minimal']

function getPresetsByCategory(cat: string): PresetTheme[]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLOR UTILITIES  (src/lib/colorUtils.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implement these functions with complete TypeScript types:

sanitizeHex(hex: string): string
  Ensures valid 6-char #RRGGBB.
  Handles 3-char shorthand, missing #, invalid → '#000000'

hexToRgb(hex: string): { r: number; g: number; b: number } | null

getRelativeLuminance(hex: string): number
  WCAG 2.1 relative luminance formula

getContrastRatio(hex1: string, hex2: string): number
  Returns contrast ratio from 1 to 21

meetsWCAG_AA(fg: string, bg: string): boolean
  contrast >= 4.5:1

darken(hex: string, amount: number): string
lighten(hex: string, amount: number): string
addAlpha(hex: string, alpha: number): string
  Returns rgba() string

extractColorsFromImage(file: File, count: number): Promise<string[]>
  Use canvas context to sample pixels from image
  Return most dominant unique colors

calculateQualityScore(
  colors: string[],
  bg: string,
  fg: string
): QualityMetrics
  contrast     : avg WCAG contrast of each dataColor vs bg (0-100)
  readability  : fg vs bg contrast score (0-100)
  consistency  : color harmony via hue variance analysis (0-100)
  accessibility: % of colors meeting AA on bg and white (0-100)
  overall      : weighted average of all 4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COOLORS PARSER  (src/lib/coolorsParser.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

parseCoolorsUrl(url: string): string[] | null
  Supports:
    https://coolors.co/HEX-HEX-HEX
    https://coolors.co/palette/HEX-HEX-HEX
  Returns array of #HEX strings or null if invalid

parseCoolorsFile(content: string): string[]
  Extracts all valid 6-char hex codes from any text
  Returns array of unique #HEX strings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT PROPERTIES  (src/lib/formatProps.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FONT_OPTIONS: string[] = [
  'Segoe UI', 'Segoe UI Semibold', 'Segoe UI Light',
  'Arial', 'Arial Narrow', 'Calibri', 'Cambria',
  'Verdana', 'Tahoma', 'Times New Roman', 'Georgia',
  'Trebuchet MS', 'Courier New', 'Lucida Console',
  'DM Sans', 'Inter', 'Roboto', 'Lato', 'Open Sans',
  'Montserrat', 'Poppins', 'Raleway', 'Nunito',
  'Outfit', 'Plus Jakarta Sans', 'Work Sans'
]

GENERAL_SECTIONS: Record<string, SectionDef>
  Sections: title, background, border, shadow, padding,
            headerIcons, tooltip

  title section props:
    show        toggle   basic   default:true
    fontColor   color    basic   default:'#0F172A'
    fontSize    slider   basic   min:8  max:32  default:14
    fontFamily  select   basic   options:FONT_OPTIONS
    fontBold    toggle   basic   default:true
    alignment   segments intermediate options:['Left','Center','Right']
    background  color    intermediate default:'#FFFFFF'
    transparency slider  advanced min:0 max:100 default:100

  background section props:
    show         toggle  basic        default:true
    color        color   basic        default:'#FFFFFF'
    transparency slider  intermediate min:0 max:100 default:0

  border section props:
    show    toggle  basic        default:false
    color   color   basic        default:'#E2E8F0'
    width   slider  intermediate min:0 max:8  default:1
    radius  slider  intermediate min:0 max:32 default:0

  shadow section props:
    show         toggle  intermediate default:false
    color        color   advanced     default:'#000000'
    transparency slider  advanced     min:0 max:100 default:80
    blur         slider  advanced     min:0 max:20  default:6
    offsetX      slider  advanced     min:-20 max:20 default:0
    offsetY      slider  advanced     min:-20 max:20 default:2

  padding section props:
    top    slider  intermediate  min:0 max:40 default:8
    right  slider  intermediate  min:0 max:40 default:8
    bottom slider  intermediate  min:0 max:40 default:8
    left   slider  intermediate  min:0 max:40 default:8

VISUAL_SECTIONS: Record<string, Record<string, SectionDef>>
  Keys: bar, line, pie, donut, table, matrix, card, slicer, gauge

  bar sections: dataLabels, xAxis, yAxis, legend, plotArea, bars
  line sections: lines, markers, dataLabels, xAxis, yAxis, legend
  pie sections: detailLabels, slices, legend
  donut sections: donutShape, detailLabels, slices
  table sections: columnHeaders, values, total, grid
  matrix sections: rowHeaders, columnHeaders, values, subtotals
  card sections: callout, category, wordWrap
  slicer sections: header, items, style
  gauge sections: callout, targetLine

  Define all props for each section following the same
  PropDef pattern shown for general sections above.

VISUAL_ALIAS: Record<string, string>
  bar/stackedbar/clusteredbar/column/stackedcol/clusteredcol/funnel → 'bar'
  line/area/linecolumn/linestacked/scatter → 'line'
  pie/treemap → 'pie'
  donut → 'donut'
  table → 'table'
  matrix → 'matrix'
  card/newcard/kpi/map → 'card'
  slicer → 'slicer'
  gauge → 'gauge'

Export getVisualSections(vid: string): Record<string, SectionDef>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THEME GENERATOR  (src/lib/themeGenerator.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL RULE: ALL colors inside visualStyles must use
{ solid: { color: "#RRGGBB" } } format. Never plain strings.

CRITICAL RULE: textClasses accepts ONLY these 4 keys:
callout, title, header, label. No other keys.

generateThemeJSON(state: ThemeState): object
  Returns complete valid Power BI theme object.

downloadThemeJSON(state: ThemeState): void
  Triggers .json file download.

downloadLayoutJSON(state: ThemeState): void
  Exports layout structure as JSON:
  {
    themeName, pageSize, spacing, slicerPosition,
    numSlicers, numKpis, totalPages,
    pages: [{ pageNumber, slicers, kpiCards, charts }]
  }

downloadPBITemplate(state: ThemeState): void
  Generates HTML background template.
  Shows pixel-perfect placeholder boxes for:
    header area, slicer sidebar, KPI cards, chart grid
  Includes:
    - Step by step Power BI Desktop usage instructions
    - Spec table with exact pixel dimensions for every zone
    - Theme color reference strip
  Opens as downloadable HTML file.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHART COMPONENTS — POWER BI AUTHENTIC SVG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every chart component receives: { colors: string[] }
colors comes from useThemeStore (dataColors array).

UNIVERSAL RULES for all 19 charts:
- SVG: viewBox="0 0 380 185" width="100%" height="100%"
  preserveAspectRatio="xMidYMid meet"
- Font: fontFamily="'Segoe UI', sans-serif"
- Axis labels: fontSize 10, fill #595959
- Gridlines: stroke #E8E8E8, strokeWidth 0.6
- Axis line: stroke #C0C0C0, strokeWidth 1
- Bar/column corners: rx={2}
- NO gradients, NO shadows on data shapes
- NO rainbow bars on single-series charts

SINGLE-SERIES RULE:
  ClusteredColumn, HorizontalBar, AreaChart, GaugeChart,
  FunnelChart, SlicerVisual, TableVisual, MatrixVisual
  → ALL data shapes use colors[0] only

MULTI-COLOR RULE:
  DonutChart, PieChart, TreemapChart → each slice/block
  uses colors[0], colors[1], colors[2]... in order

MULTI-SERIES RULE:
  LineChart, StackedColumn, ClusteredBar, StackedBar,
  LineColumnCombo, LineStackedCombo, ScatterChart
  → each series uses colors[0], colors[1], colors[2]...

Implement each chart:

ClusteredColumn:
  Data: Jan-Jun sales [12.4, 9.8, 14.6, 11.2, 16.8, 13.4] ₹L
  All bars: colors[0]
  Y-axis: 4 gridlines with K/L labels
  X-axis: month labels below bars
  Margins: left 42, right 8, top 8, bottom 28

HorizontalBar:
  Data: 6 categories with horizontal bars
  All bars: colors[0]
  Category labels: right-aligned on left
  Value labels: appear to the right of each bar in colors[0]
  Margins: left 80, right 30, top 8, bottom 24

LineChart:
  3 series: Revenue (colors[0] solid), Target (colors[1] dashed),
            Last Year (colors[2] solid)
  Hollow circle dots at each point (r=3.5, fill white)
  Legend at top with colored rectangles + labels
  Margins: left 40, right 8, top 22, bottom 28

StackedColumn:
  4 categories, 3 segments per bar
  Segments: colors[0], colors[1], colors[2]
  Legend at top
  Flat stacking, no gaps between segments

ClusteredBar:
  4 categories, 2 series side by side horizontal
  Series: colors[0], colors[1]
  Legend at top

StackedBar:
  5 categories, 3 segments horizontal
  Segments: colors[0], colors[1], colors[2]
  Legend at top

DonutChart:
  5 slices using colors[0..4]
  Inner radius = 60% of outer
  White stroke between slices (strokeWidth 1.5)
  Center: total value large text + small label below
  Right side: legend with color rectangles + name + %

PieChart:
  5 slices using colors[0..4]
  % labels on slices (hide if slice < 8%)
  Right side: legend

AreaChart:
  12 months single series, colors[0]
  Gradient fill below line (opacity 0.25 top → 0.02 bottom)
  Line: strokeWidth 2
  Hollow dots only at first and last point

ScatterChart:
  3 groups using colors[0..2]
  5 dots per group, semi-transparent (opacity 0.75)
  Both axes with gridlines
  Legend at top

TreemapChart:
  7 blocks, different sizes, using colors[0..6]
  White text labels inside (name + value)
  No gaps between blocks (1px stroke white separator)

FunnelChart:
  5 stages, each stage uses colors[0..4]
  Bars decrease in width by stage percentage
  % label inside bar (if wide enough)
  Stage name on left, value on right

LineColumnCombo:
  4 columns using colors[0]
  Line overlay using colors[1]
  Left Y for columns, right Y for line
  Legend at top

LineStackedCombo:
  3-segment stacked columns using colors[0..2]
  Line overlay using colors[3]
  Legend at top

GaugeChart:
  Semicircular arc (180°)
  3 color zones: #EF4444 (0-60%), #F59E0B (60-80%), #10B981 (80-100%)
  Current value needle: dark line from center
  Target: dashed indicator line in gray
  Center callout: current % value large + "Achievement" label
  Min/Max labels at arc ends

TableVisual:
  5 rows × 5 columns (Region, Sales, Growth, Orders, Margin)
  Header: colors[0] at 12% opacity background, bold Segoe UI
  Alternating rows: white / #F8FAFC
  Growth positive: #10B981, negative: #EF4444
  Total row at bottom with distinct background
  Row separator: #E8E8E8

MatrixVisual:
  3-level hierarchy with stepped indentation (10px per level)
  Expand arrows on parent rows
  Row headers on left, column headers on top
  Subtotal rows with distinct background

MapVisual:
  India SVG outline (simplified path)
  8 city bubble markers, sized by sales value
  Each bubble: colors[i % 8]
  Semi-transparent (opacity 0.75), white stroke
  Top 3 cities in right legend panel

SlicerVisual:
  Search box at top (border, placeholder text)
  Select All checkbox below search
  5 list items with PBI-style checkboxes
  Checked: colors[0] filled checkbox with white checkmark
  Unchecked: white with light gray border
  Selected item text: bold, #1F2937

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI COMPONENTS — CANVAS AREA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DashboardCanvas:
  Reads pageSize, zoom, spacing from store.
  Inner canvas: fixed pixel width/height from PAGE_SIZES.
  Transform scale applied to canvas element.
  Canvas wrapper takes scaled dimensions for layout.
  bg-white or state.bg as background.
  Large box-shadow, rounded corners.
  Shows FocusView when focusVisual is not null.
  Shows DashboardLayout when focusVisual is null.
  Calls useCSSSync on mount and color changes.

DashboardLayout:
  Full dashboard with Power BI-style layout.
  Header strip: title + subtitle + filter pills
    (All Q1 Q2 Q3 Q4, first pill has accent background).
  Left slicer sidebar if slicerPos === 'left'.
  Main content: KPI strip + chart grid.
  Right slicer sidebar if slicerPos === 'right'.
  Top slicer strip if slicerPos === 'top'.
  All gaps controlled by state.spacing.

KpiStrip:
  N cards in a CSS grid (max 4 per row).
  Each card:
    3px left border in colors[i]
    Icon in top right (small bg circle in colors[i] at 10%)
    Label: 9.5px gray text
    Value: 20px bold in colors[i]
    Trend: ▲ green or ▼ red + delta text

SlicerSidebar:
  Stacked vertical slicer cards.
  Each slicer rendered as HTML (not SVG).
  List type: checkboxes with colors[0] fill when checked.
  Button type: pill buttons with selected using colors[0].
  Dropdown type: select box appearance.
  Slider type: range track with colors[0] fill.

ChartGrid:
  CSS grid with cols from getLayoutPlan.
  Gap from state.spacing.
  Renders ChartCard for each chart in current page.

ChartCard:
  Header: title + subtitle + ellipsis menu.
  Chart area: flex-1, renders correct chart component.
  Click: calls setFocusVisual(chart.id).
  Hover: translateY(-1px) + deeper shadow.

FocusView:
  Single chart fills full canvas height.
  Header: chart title, subtitle, filter pills.
  Canvas page tag shows "Focus Mode" + Exit button.
  Exit button calls setFocusVisual(null).
  Chart renders at maximum available size.

CanvasToolbar:
  Horizontal toolbar above visual selector.
  Controls:
    Page size Select (all 10 PAGE_SIZES options)
    Zoom buttons: Fit | 25% | 50% | 75% | 100%
      Active zoom button has accent background
    Slicers count Select (0, 1, 2, 3, 4, 5)
    Slicers position Select (Top | Left | Right)
    KPIs count Select (0, 2, 3, 4, 5, 6, 8)
    Spacing range input (4-28, shows px value)
    PNG button: download current canvas as image
    Layout JSON button: downloadLayoutJSON()
    PBI Template button: downloadPBITemplate()

VisualSelectorBar:
  Horizontal row.
  [⊞ Dashboard] button: highlighted when focusVisual is null.
    Click: setFocusVisual(null)
  Thin separator.
  Scrollable row of 19 visual icon buttons.
    Each: small SVG icon + label text below.
    Click: setFocusVisual(vid) + setSelectedVisual(vid)
    Active icon (matches focusVisual): accent border + bg.
    scrollbar-width: none to hide scrollbar.

PageNavigator:
  Fixed bar below canvas.
  [← Prev] button: disabled on page 0
  Dot per page: active dot wider + accent color
    Click dot: setCurrentPage(i)
  [Next →] button: disabled on last page
  "Page X of Y" text using JetBrains Mono font

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI COMPONENTS — LEFT SIDEBAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AccordionSection:
  Props: title, icon (ReactNode), defaultOpen, children
  Default: closed. Click header to toggle.
  Chevron rotates 180° when open.
  Smooth max-height transition.
  Header hover: subtle bg change + accent title color.

PresetThemes:
  Category filter pills (scrollable horizontal row).
  Active category: accent background.
  Scrollable 2-column grid (max-height 240px).
  Each card: 5 swatches + name + category tag.
  Click: applyPreset(preset).
  Active preset: accent border ring.
  Hover: lift + shadow.

CoolorsImport:
  URL input + Go button.
  Calls parseCoolorsUrl, shows extracted swatches.
  File upload (.txt, .csv).
  Calls parseCoolorsFile, shows swatches.
  Apply button: setDataColors(extractedColors).

ColorPalette:
  8 swatch buttons in 2 rows of 4.
  Click swatch: open color picker input.
  Color picker onChange: setDataColor(index, hex).
  Each swatch shows current color as background.

BrandColors:
  Primary, Accent, Background, Foreground pickers.
  Each: colored swatch + label + hex text input.
  Update store on change.

Typography:
  Font family: Select with 26 options in 2 optgroups.
  Callout size: number input.
  Title size: number input.
  Header size: number input.
  Label size: number input.
  These update formatProps in store.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI COMPONENTS — RIGHT PANEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SkillToggle:
  Three buttons: Basic | Intermediate | Advanced
  Grouped toggle style (pill group).
  Active button: accent background + white text.
  Updates store.skillLevel.

FormatPane:
  Two tabs: Visual | General.
  Visual tab: sections from getVisualSections(selectedVisual)
    Shows message if no visual selected.
  General tab: sections from GENERAL_SECTIONS.
  Each tab renders FormatSection per section.

FormatSection:
  Collapsible, default closed.
  Header: label, click to toggle.
  Filters props by skillLevel:
    basic: show props where level === 'basic'
    intermediate: show props where level !== 'advanced'
    advanced: show all props
  Renders PropertyRow per visible prop.

PropertyRow:
  Label + control side by side.
  Control chosen by prop.type:
    toggle   → ToggleControl
    color    → ColorControl
    slider   → SliderControl
    select   → SelectControl
    segments → SegmentControl
    number   → NumberControl
  onChange calls: store.setProp(propKey, value)
    propKey format: "scope.vid.section.id"
    e.g. "general.title.fontColor" or "bar.dataLabels.show"

ToggleControl:
  iOS-style switch. colors[0] when checked.

ColorControl:
  Small colored swatch + hex text input.
  Click swatch: open hidden color picker input.
  Swatch border: 1px solid #E2E8F0.

SliderControl:
  Range input + value badge.
  Track: accent color fill to current value.

SelectControl:
  Use shadcn Select component.
  Small font size to fit panel width.

SegmentControl:
  Grouped buttons (Left / Center / Right).
  Active: accent bg + white text.

QualityScore:
  Calls calculateQualityScore on color changes.
  Shows overall score as circular SVG arc.
  4 metric rows: label + colored bar + number.
  Colors: green > 75, yellow > 50, red otherwise.

ValidationPanel:
  JSON Validity badge: green check or red error.
  PBI Desktop badge, PBI Service badge.
  Mobile badge, Embedded badge.
  All show as colored pill badges.

JsonPreview:
  Shows syntax-highlighted JSON.
  Uses pre element with colored spans.
    Keys: #7C3AED
    Strings: #059669
    Numbers: #D97706
    Booleans: #DC2626
    Null: #6B7280
  [Copy] and [Export JSON] buttons.
  Updates whenever store changes (useMemo).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL STYLES  (src/app/globals.css)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

:root {
  --c1: #0D9488;
  --c2: #3B82F6;
  --c3: #8B5CF6;
  --c4: #F59E0B;
  --c5: #EF4444;
  --c6: #10B981;
  --c7: #F97316;
  --c8: #EC4899;
  --primary: #0D9488;
  --accent: #3B82F6;
  --pbi-bg: #FFFFFF;
  --pbi-fg: #0F172A;
  --good: #10B981;
  --neutral: #F59E0B;
  --bad: #EF4444;
  --app-bg: #F1F5F9;
  --surface: #FFFFFF;
  --surface-2: #F8FAFC;
  --border: #E2E8F0;
  --border-light: #F1F5F9;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --font: 'Outfit', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --r-sm: 6px;
  --r-md: 10px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.06);
  --shadow-md: 0 4px 16px rgba(0,0,0,.08);
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT — EDITOR PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

App layout: full viewport, no scroll on body.
3 columns: sidebar (258px) + center (flex-1) + right (255px).
All columns: full height, independent vertical scroll.

Top nav (52px height, above 3 columns):
  Left: "DC" logo mark (teal square) + "Theme Studio" text
  Center: theme name input (inline editable)
  Right: [Import JSON] [Export JSON] [PBI Template] buttons
         [Undo] [Redo] icon buttons

Left sidebar:
  Width 258px. Bg white. Right border.
  Vertically scrollable.
  Contains:
    1. PresetThemes accordion (default open)
    2. CoolorsImport accordion
    3. BrandColors accordion
    4. ColorPalette accordion
    5. Typography accordion
    6. Advanced accordion (padding, global border, shadow)

Center column:
  Flex-1. Bg #F1F5F9. Overflow hidden.
  Contains (top to bottom):
    CanvasToolbar (fixed height)
    VisualSelectorBar (fixed height)
    Scrollable area: DashboardCanvas (centered)
    PageNavigator (fixed height)

Right panel:
  Width 255px. Bg white. Left border.
  Vertically scrollable.
  Contains:
    VisualDetail (always visible)
    SkillToggle (always visible)
    FormatPane (Visual + General tabs)
    QualityScore (collapsible, closed by default)
    ValidationPanel (collapsible, closed by default)
    JsonPreview (collapsible, open by default)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. COLOR REACTIVITY
   When any color changes in store, CSS vars update
   immediately. All SVG charts use var(--c1) etc so
   they recolor without re-rendering their JS logic.
   React key prop on chart containers forces re-render
   when colors change.

2. FOCUS MODE
   Click visual icon → focusVisual = that id
     Canvas shows single chart full size
     Icon gets accent highlight
     Dashboard button loses highlight
   Click different icon while in focus → swap chart
   Click Dashboard button → focusVisual = null
     Canvas shows full dashboard
     All icon highlights clear

3. PAGINATION
   Charts from CHART_POOL paginated by getLayoutPlan.
   16:9 → 2×2 = 4 charts per page.
   FHD → 3×2 = 6 charts per page.
   All pages same structure: slicers + KPIs + chart grid.
   PageNavigator shows prev/next + dot indicators.

4. SPACING
   Single spacing value from store.
   Applied as gap in: chart grid, KPI strip, slicer sidebar,
   body padding, all internal gaps.
   Range: 4px to 28px.

5. PRESET APPLICATION
   Applying preset updates colors instantly.
   CSS vars sync immediately.
   Canvas re-renders with new theme.
   JSON preview updates.
   Quality score recalculates.

6. FORMAT PANE LIVE EFFECTS
   These changes update the canvas immediately:
     general.title.fontColor → update .cc-title color
     general.title.fontSize → update .cc-title font-size
     general.background.color → update .cc background
     general.border.color + width → update .cc border
     general.shadow.* → update .cc box-shadow
   Other format prop changes: update JSON only.

7. IMPORT JSON
   Accept Power BI .json file via file input.
   Extract: name, dataColors, background, foreground,
   tableAccent, good, neutral, bad.
   Apply to store via applyPreset-style action.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN TOKENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

App shell background: #F1F5F9
Sidebar/panel background: #FFFFFF
Canvas background: #FFFFFF (or state.bg)
Border color: #E2E8F0
Accent: #0D9488 (teal)
Hover elevation: translateY(-1px) + deeper shadow
Active ring: 0 0 0 2px #0D948840
Font: Outfit for UI, JetBrains Mono for code/hex values
Border radius: 6px (sm), 10px (md), 14px (lg)

Accordion sections:
  Header height: 40px
  Padding: 0 14px
  Hover: #F8FAFC background
  Open indicator: chevron rotates 180°

Chart cards:
  Background: white
  Border: 1px solid #E2E8F0
  Border radius: 6px
  Header: 36px height, title 11px semibold, sub 9.5px muted
  Hover: border-color accent + translateY(-1px)

KPI cards:
  Background: white
  Left border: 3px solid colors[i]
  Border radius: 6px
  Padding: 10px 12px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Write ALL files completely. No TODO comments.
   No placeholder text like "add chart here".

2. All TypeScript types must be correct.
   Run tsc and fix any errors before finishing.

3. Every button must do something functional.

4. The exported theme JSON must import without errors
   in Power BI Desktop. Test by verifying:
   - All colors are #RRGGBB format
   - textClasses uses only: callout, title, header, label
   - visualStyles colors use { solid: { color: "#HEX" } }

5. App must be deployable with: npm run build
   Fix all build errors before considering done.

6. Run: npm run dev
   App should open at localhost:3000
   Canvas should show dashboard with 4 charts.
   Changing any color should update all charts instantly.

Start by creating the file structure, then implement
each file in this order:
types → store → lib files → chart components →
canvas components → sidebar components →
right panel components → layout → editor page → 
polish and verify build passes.