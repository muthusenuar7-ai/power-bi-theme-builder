export type ZoneType = "title" | "kpi" | "slicer" | "chart" | "logo";

export type SplitType =
  | "none"
  | "equal"
  | "prop-50-25-25"
  | "prop-25-50-25"
  | "prop-25-25-50"
  | "prop-50-50"
  | "prop-25-75"
  | "prop-75-25"
  | "three-columns"
  | "three-rows"
  | "two-columns"
  | "two-rows"
  | "four-grid"
  | "large-left-two-small"
  | "two-small-large-right"
  | "large-top-two-small-bottom"
  | "two-small-top-large-bottom"
  | "prop-40-30-30"
  | "prop-30-40-30"
  | "prop-30-30-40"
  | "four-rows"
  | "four-columns"
  | "five-rows"
  | "five-columns"
  | "six-rows"
  | "six-columns"
  | "seven-rows"
  | "seven-columns"
  | "eight-rows"
  | "eight-columns"
  | "nine-rows"
  | "nine-columns"
  | "ten-rows"
  | "ten-columns"
  | "eleven-rows"
  | "eleven-columns"
  | "twelve-rows"
  | "twelve-columns";

/** Used internally by layoutEngine for bounds calculations. */
export interface SplitBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * One split operation stored as a recipe.
 * Recipes are replayed in `order` sequence when resolving the visible zone list.
 *
 * Key: sourceZoneId can be a base layout zone OR a zone produced by an earlier
 * recipe (enabling nested splits). The replay algorithm finds the source by id
 * in the current pool after all earlier recipes have run.
 */
export interface SplitRecipe {
  /** Unique id for this recipe entry. */
  recipeId: string;
  /** ID of the zone being split (base zone or split child). */
  sourceZoneId: string;
  splitType: SplitType;
  /** Ascending order for replay — lower numbers run first. */
  order: number;
}

export type VisualType =
  | "pageTitle"
  | "card"
  | "kpi"
  | "multiRowCard"
  | "gauge"
  | "slicer"
  | "slicerDropdown"
  | "slicerVerticalList"
  | "buttonSlicer"
  | "barChart"
  | "columnChart"
  | "clusteredBarChart"
  | "clusteredColumnChart"
  | "stackedBarChart"
  | "stackedColumnChart"
  | "lineChart"
  | "areaChart"
  | "stackedAreaChart"
  | "hundredPercentStackedAreaChart"
  | "comboChart"
  | "lineAndStackedComboChart"
  | "lineAndClusteredColumnChart"
  | "lineAndStackedColumnChart"
  | "ribbonChart"
  | "waterfallChart"
  | "scatterChart"
  | "pieChart"
  | "donutChart"
  | "treemap"
  | "funnelChart"
  | "table"
  | "matrix"
  | "shape"
  | "textBox"
  | "rectangleShape"
  | "image";

/** Top-row arrangement when the title is at the top:
 *  full = title spans the width (existing behaviour);
 *  title-kpis / title-slicers = title takes the leading ~32%, KPI cards or
 *  slicers share the remaining width of the same top row. */
export type TitleLayout = "full" | "title-kpis" | "title-slicers";

export interface LayoutState {
  canvasWidth: number;
  canvasHeight: number;
  reportName: string;
  titlePos: "top" | "left" | "right" | "none";
  /** Only honoured when titlePos is "top"; other positions fall back to full. */
  titleLayout?: TitleLayout;
  titleHeight: number;
  titleWidth: number;
  /** Font size (pt) for the title text box. Default: 28. */
  titleFontSize: number;
  kpiCount: number;
  kpiArrangement: "auto" | "single-row" | "two-rows" | "left-stack" | "right-stack";
  slicerCount: number;
  slicerPos: "left" | "top" | "right";
  slicerAboveKpi: boolean;
  /** Height of top-positioned slicer zones in pixels. Default: 54. */
  slicerTopHeight: number;
  /** Reserved width of left/right slicer columns in pixels. Default: 200. */
  slicerSideWidth: number;
  chartCount: number;
  chartLayout: string;
  logo: boolean;
  logoPos: "top-left" | "top-right";
  /** Gap between zones in pixels. Default: 10. */
  zoneGap: number;
  /** Height of horizontally-placed KPI card zones in pixels. Default: 110. */
  kpiHeight: number;
}

export interface Zone {
  id: string;
  type: ZoneType;
  visualType: VisualType;
  visualId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fields: string[];
  label?: string;
  /** Set on split children — the id of the recipe source zone that produced them. */
  parentZoneId?: string;
  /** The split type applied to produce this child. */
  splitType?: SplitType;
  /** True when this zone is a child produced by a split recipe. */
  isChildZone?: boolean;
  /** 0-based position within the split group. */
  childIndex?: number;
  /** Equals parentZoneId — kept for export compatibility. */
  splitGroupId?: string;
  /** True when this zone was created by Merge Selected Zones. */
  isMergedZone?: boolean;
  /** Source zone IDs used to dynamically recompute a merged zone's bounds. */
  mergeSourceZoneIds?: string[];
  /** Resolver order at which the merged zone should be materialized. */
  mergeOrder?: number;
  /** Icon Studio icon rendered by this zone (image zones on generated icon
   *  pages and exported KPI/title icon visuals). */
  iconId?: string;
}

export interface LayoutExport {
  canvasWidth: number;
  canvasHeight: number;
  reportName: string;
  generatedAt: string;
  zones: Array<{
    id: string;
    type: ZoneType;
    visualType: VisualType;
    parentZoneId?: string;
    splitType?: SplitType;
    isChildZone?: boolean;
    childIndex?: number;
    isMergedZone?: boolean;
    mergeSourceZoneIds?: string[];
    text?: string;
    titleFontSize?: number;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    fields: string[];
  }>;
}

// ─── Multi-page types ──────────────────────────────────────────────────────

export interface ReportPage {
  id: string;
  name: string;
  layoutState: LayoutState;
  /** Visual placeholder assignment per zone id. */
  visualAssignments: Record<string, VisualType>;
  /** Set on pages auto-generated from the Icon Studio bundle. */
  generated?: "icon-library";
  /** Stable bundle hash the generated icon page was built from. */
  iconBundleHash?: string;
  /** Optional per-KPI-zone icon assignments (zone id → assignment). */
  kpiIcons?: Record<string, import("../iconIntegration").KpiIconAssignment>;
  /** Optional title-zone icon assignment. */
  titleIcon?: import("../iconIntegration").TitleIconAssignment | null;
  /**
   * Ordered list of split recipes. Replayed in `order` sequence by
   * resolveZonesForPage to produce the final visible zone list.
   * Spacing changes automatically recalculate all children because
   * computeSplitChildren is called fresh on each render with the live spacing.
   */
  splitRecipes: SplitRecipe[];
  /**
   * Zones that have been detached from the recipe system.
   * Their positions are frozen — they do not move when layout settings change.
   * They CAN be split further (a new recipe with sourceZoneId = frozenZone.id).
   */
  frozenZones: Zone[];
  /**
   * Zone IDs suppressed from the visible pool.
   * Used to hide source zones whose slot has been taken by frozen children.
   * Applied after each recipe step so recipe-created zones can also be hidden.
   */
  hiddenZoneIds: string[];
}

export interface ReportState {
  pages: ReportPage[];
  activePageId: string;
}

export interface MultiPageExport {
  generatedAt: string;
  pages: Array<{
    pageIndex: number;
    pageName: string;
    canvasWidth: number;
    canvasHeight: number;
    zones: LayoutExport["zones"];
  }>;
}
