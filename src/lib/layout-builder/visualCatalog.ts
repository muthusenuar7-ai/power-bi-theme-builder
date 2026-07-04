import type { VisualType, ZoneType } from "./types/layout";

export interface VisualCatalogItem {
  type: VisualType;
  label: string;
}

/** All visual types that can be assigned to chart zones. */
export const CHART_VISUAL_TYPES: VisualType[] = [
  "barChart",
  "columnChart",
  "clusteredBarChart",
  "clusteredColumnChart",
  "stackedBarChart",
  "stackedColumnChart",
  "lineChart",
  "areaChart",
  "stackedAreaChart",
  "hundredPercentStackedAreaChart",
  "lineAndClusteredColumnChart",
  "lineAndStackedColumnChart",
  "ribbonChart",
  "waterfallChart",
  "scatterChart",
  "pieChart",
  "donutChart",
  "treemap",
  "funnelChart",
  "table",
  "matrix",
  "kpi",
  "multiRowCard",
  "gauge",
];

/** Visual types that are universal placeholders (available for any assignable zone). */
export const UNIVERSAL_PLACEHOLDER_TYPES: VisualType[] = ["shape", "textBox"];

/** Full picker set, excluding page title/logo internals. */
export const ASSIGNABLE_PLACEHOLDER_TYPES: VisualType[] = [
  "card",
  "kpi",
  "multiRowCard",
  "gauge",
  "slicer",
  "buttonSlicer",
  ...CHART_VISUAL_TYPES.filter(
    (visualType) => !["kpi", "multiRowCard", "gauge"].includes(visualType),
  ),
  ...UNIVERSAL_PLACEHOLDER_TYPES,
];

/** Full ordered list of picker items. */
export const VISUAL_PICKER_ITEMS: VisualCatalogItem[] = [
  // Cards / KPI
  { type: "card",                        label: "Card" },
  { type: "kpi",                         label: "KPI" },
  { type: "multiRowCard",                label: "Multi-row Card" },
  { type: "gauge",                       label: "Gauge Chart" },

  // Slicers
  { type: "slicer",                      label: "Slicer" },
  { type: "buttonSlicer",                label: "Button Slicer" },

  // Bar charts
  { type: "clusteredBarChart",           label: "Clustered Bar Chart" },
  { type: "barChart",                    label: "Stacked Bar Chart" },
  { type: "stackedBarChart",             label: "100% Stacked Bar Chart" },

  // Column charts
  { type: "clusteredColumnChart",        label: "Clustered Column Chart" },
  { type: "columnChart",                 label: "Stacked Column Chart" },
  { type: "stackedColumnChart",          label: "100% Stacked Column Chart" },

  // Line / Area
  { type: "lineChart",                   label: "Line Chart" },
  { type: "areaChart",                   label: "Area Chart" },
  { type: "stackedAreaChart",            label: "Stacked Area Chart" },
  { type: "hundredPercentStackedAreaChart", label: "100% Stacked Area Chart" },

  // Combo / Ribbon / Waterfall
  { type: "lineAndClusteredColumnChart", label: "Line and Clustered Column Chart" },
  { type: "lineAndStackedColumnChart",   label: "Line and Stacked Column Chart" },
  { type: "ribbonChart",                 label: "Ribbon Chart" },
  { type: "waterfallChart",              label: "Waterfall Chart" },

  // Scatter
  { type: "scatterChart",                label: "Scatter Chart" },

  // Round charts
  { type: "pieChart",                    label: "Pie Chart" },
  { type: "donutChart",                  label: "Donut Chart" },

  // Other data visuals
  { type: "treemap",                     label: "Treemap" },
  { type: "funnelChart",                 label: "Funnel Chart" },
  { type: "table",                       label: "Table" },
  { type: "matrix",                      label: "Matrix" },

  // Universal placeholders
  { type: "shape",                       label: "Shape" },
  { type: "textBox",                     label: "Text Box" },
];

const VISUAL_LABELS = new Map<VisualType, string>([
  ["pageTitle", "Page Title"],
  ["slicerDropdown", "Slicer"],
  ["slicerVerticalList", "Slicer"],
  ["rectangleShape", "Shape"],
  ["comboChart", "Line and Clustered Column Chart"],
  ["lineAndStackedComboChart", "Line and Stacked Column Chart"],
  ["image", "Image"],
  ...VISUAL_PICKER_ITEMS.map((item) => [item.type, item.label] as const),
]);

export function getVisualLabel(type: VisualType | string): string {
  return VISUAL_LABELS.get(type as VisualType) || type;
}

export function getDefaultVisualType(zoneType: ZoneType): VisualType {
  if (zoneType === "title") return "pageTitle";
  if (zoneType === "kpi") return "card";
  if (zoneType === "slicer") return "slicer";
  if (zoneType === "logo") return "image";
  return "barChart";
}

export function canAssignVisual(zoneType: ZoneType): boolean {
  return zoneType === "chart" || zoneType === "slicer" || zoneType === "kpi" || zoneType === "title" || zoneType === "logo";
}

export function getAssignableVisuals(
  zoneType: ZoneType,
  availableVisualTypes: Set<string> | null,
): VisualCatalogItem[] {
  if (!availableVisualTypes) return [];

  const universalItems = VISUAL_PICKER_ITEMS.filter(
    (item) => UNIVERSAL_PLACEHOLDER_TYPES.includes(item.type) && availableVisualTypes.has(item.type),
  );

  if (zoneType === "title" || zoneType === "logo") {
    return universalItems;
  }

  if (zoneType === "kpi") {
    const kpiItems = VISUAL_PICKER_ITEMS.filter(
      (item) =>
        (item.type === "card" || item.type === "kpi" || item.type === "multiRowCard" || item.type === "gauge") &&
        availableVisualTypes.has(item.type),
    );
    return [...kpiItems, ...universalItems];
  }

  if (zoneType === "slicer") {
    const slicerItems = VISUAL_PICKER_ITEMS.filter(
      (item) =>
        (item.type === "slicer" ||
          item.type === "buttonSlicer" ||
          item.type === "card") &&
        availableVisualTypes.has(item.type),
    );
    return [...slicerItems, ...universalItems];
  }

  if (zoneType === "chart") {
    return VISUAL_PICKER_ITEMS.filter(
      (item) =>
        ASSIGNABLE_PLACEHOLDER_TYPES.includes(item.type) &&
        availableVisualTypes.has(item.type),
    );
  }

  return [];
}

export function getSafeVisualType(
  zoneType: ZoneType,
  currentVisualType: VisualType,
  availableVisualTypes: Set<string> | null,
): VisualType {
  if (!availableVisualTypes) return currentVisualType;

  // Universal placeholders are valid for any assignable zone
  if (UNIVERSAL_PLACEHOLDER_TYPES.includes(currentVisualType)) {
    if (availableVisualTypes.has(currentVisualType)) return currentVisualType;
  }
  if (currentVisualType === "rectangleShape") {
    if (availableVisualTypes.has("shape")) return "shape";
  }

  if (zoneType === "title") return "pageTitle";
  if (zoneType === "logo") return "image";

  if (zoneType === "kpi") {
    if (availableVisualTypes.has(currentVisualType)) return currentVisualType;
    return availableVisualTypes.has("card") ? "card" : currentVisualType;
  }

  if (zoneType === "slicer") {
    if (currentVisualType === "slicerDropdown" || currentVisualType === "slicerVerticalList") {
      return availableVisualTypes.has("slicer") ? "slicer" : currentVisualType;
    }
    if (availableVisualTypes.has(currentVisualType)) return currentVisualType;
    if (availableVisualTypes.has("slicer")) return "slicer";
    if (availableVisualTypes.has("buttonSlicer")) return "buttonSlicer";
    if (availableVisualTypes.has("card")) return "card";
    return currentVisualType;
  }

  if (zoneType === "chart") {
    if (currentVisualType === "comboChart") {
      if (availableVisualTypes.has("lineAndClusteredColumnChart")) return "lineAndClusteredColumnChart";
      if (availableVisualTypes.has("comboChart")) return "comboChart";
    }
    if (currentVisualType === "lineAndStackedComboChart") {
      if (availableVisualTypes.has("lineAndStackedColumnChart")) return "lineAndStackedColumnChart";
      if (availableVisualTypes.has("lineAndStackedComboChart")) return "lineAndStackedComboChart";
    }
    if (availableVisualTypes.has(currentVisualType) && ASSIGNABLE_PLACEHOLDER_TYPES.includes(currentVisualType)) {
      return currentVisualType;
    }
    return CHART_VISUAL_TYPES.find((visualType) => availableVisualTypes.has(visualType)) || currentVisualType;
  }

  return currentVisualType;
}
