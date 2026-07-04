/**
 * Power BI visual icons for the Layout Builder picker.
 *
 * Source used Vite's `import.meta.glob` to bundle the PNGs. In Next.js the same
 * assets live under public/layout-builder/powerbi-icons/ and are referenced by
 * their public URL — no bundler glob, no per-file import.
 */

const ICON_BASE = "/layout-builder/powerbi-icons";

function icon(filename: string): string {
  return `${ICON_BASE}/${filename}`;
}

function svgIcon(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

const TEXT_BOX_ICON = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
    <rect x="2.5" y="2.5" width="27" height="27" rx="3" stroke="#5f6368" stroke-width="2"/>
    <text x="16" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#5f6368">T</text>
  </svg>`,
);

const RECTANGLE_SHAPE_ICON = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
    <rect x="4.5" y="8.5" width="23" height="15" rx="2" stroke="#5f6368" stroke-width="2"/>
  </svg>`,
);

export const VISUAL_ICON_MAP: Record<string, string> = {
  card: icon("single-card.png"),
  kpi: icon("kpi.png"),
  multiRowCard: icon("multi-card.png"),
  gauge: icon("gauge-chart.png"),

  slicer: icon("slicer.png"),
  slicerDropdown: icon("slicer.png"),
  slicerVerticalList: icon("slicer.png"),
  buttonSlicer: icon("button-slicer.png"),

  barChart: icon("stacked-bar-chart.png"),
  columnChart: icon("stacked-column-chart.png"),
  clusteredBarChart: icon("clustered-bar-chart.png"),
  clusteredColumnChart: icon("clustered-column-chart.png"),
  stackedBarChart: icon("hundred-percent-stacked-bar-chart.png"),
  stackedColumnChart: icon("hundred-percent-stacked-column-chart.png"),

  lineChart: icon("line-chart.png"),
  areaChart: icon("area-chart.png"),
  stackedAreaChart: icon("stacked-area-chart.png"),
  hundredPercentStackedAreaChart: icon("hundred-percent-stacked-area-chart.png"),

  lineAndClusteredColumnChart: icon("line-and-clustered-column-chart.png"),
  lineAndStackedColumnChart: icon("line-and-stacked-column-chart.png"),
  comboChart: icon("line-and-clustered-column-chart.png"),
  lineAndStackedComboChart: icon("line-and-stacked-column-chart.png"),
  ribbonChart: icon("ribbon-chart.png"),
  waterfallChart: icon("waterfall-chart.png"),

  scatterChart: icon("scatter-plot.png"),
  pieChart: icon("pie-chart.png"),
  donutChart: icon("donut-chart.png"),

  treemap: icon("treemap.png"),
  funnelChart: icon("funnel.png"),
  table: icon("table.png"),
  matrix: icon("matrix.png"),

  shape: RECTANGLE_SHAPE_ICON,
  textBox: TEXT_BOX_ICON,
  rectangleShape: RECTANGLE_SHAPE_ICON,
};
