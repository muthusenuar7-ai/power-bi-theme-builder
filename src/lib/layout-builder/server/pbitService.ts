import AdmZip from "adm-zip";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { NormalizedMultiPage, NormalizedPage, NormalizedZone } from "./types";

// Templates ship under public/templates/layout-builder/ and are force-included
// into the serverless function via next.config `outputFileTracingIncludes`.
// process.cwd() is the Next project root in both `next dev` and on Vercel
// (/var/task), so this single path resolves correctly in every environment.
const TEMPLATES_DIR = path.resolve(process.cwd(), "public", "templates", "layout-builder");
const SHAPE_TEMPLATE_PATH = path.join(TEMPLATES_DIR, "base.pbit");
const VISUAL_LIBRARY_TEMPLATE_PATH = path.join(TEMPLATES_DIR, "base_visual_library.pbit");

/** Path to the genuine Power BI-authored visual library base, for callers (e.g. the combined exporter) that need to open it themselves. */
export function getVisualLibraryTemplatePath(): string {
  return VISUAL_LIBRARY_TEMPLATE_PATH;
}
const DEBUG_EXPORT_DIR = path.resolve(process.cwd(), "exports");
const DEBUG_LAYOUT_PATH = path.join(DEBUG_EXPORT_DIR, "debug-layout.json");
const DEBUG_VISUAL_LIBRARY_LAYOUT_PATH = path.join(DEBUG_EXPORT_DIR, "debug-layout-visual-library.json");
const DEBUG_FINAL_SINGLE_PAGE_LAYOUT_PATH = path.join(DEBUG_EXPORT_DIR, "debug-final-single-page-layout.json");
const AVAILABLE_VISUAL_TEMPLATES_PATH = path.join(DEBUG_EXPORT_DIR, "available-visual-templates.json");
const TEXTBOX_TEMPLATE_CANDIDATES_PATH = path.join(DEBUG_EXPORT_DIR, "textbox-template-candidates.json");
const DEBUG_CLONED_VISUAL_SIZES_PATH = path.join(DEBUG_EXPORT_DIR, "debug-cloned-visual-sizes.json");
export const REPORT_LAYOUT_PATH = "Report/Layout";
export const SECURITY_BINDINGS_PATH = "SecurityBindings";

export class InvalidBasePbitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBasePbitError";
  }
}

class VisualTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisualTemplateError";
  }
}

class MissingVisualTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingVisualTemplateError";
  }
}

type TextEncoding = "utf16le" | "utf8";

interface BuildPbitInput {
  canvasWidth: number;
  canvasHeight: number;
  reportName: string;
  zones: NormalizedZone[];
}

export interface VisualTemplateLibrary {
  templates: Map<string, any>;
  pageTitleTemplate: any | null;
  fallbackTextboxTemplate: any | null;
  foundVisualTypes: string[];
  frontendTemplateMappings: Record<string, VisualTemplateMapping | null>;
}

interface VisualTemplateDiagnostic {
  templateFileUsed: string;
  reportLayoutEncoding: TextEncoding;
  pagesScanned: PageSummary[];
  visualTypesFound: string[];
  visualTemplates: Record<string, Array<Record<string, unknown>>>;
  availableFrontendVisualTypes: string[];
  frontendTemplateMappings: Record<string, VisualTemplateMapping | null>;
  cardTemplateExists: boolean;
  slicerTemplateExists: boolean;
  pieChartDetected: boolean;
  donutChartDetected: boolean;
  slicerDropdownDetected: boolean;
  slicerVerticalListDetected: boolean;
  chartTemplateExists: Record<string, boolean>;
  missingVisualTemplates: string[];
}

interface VisualTemplateMapping {
  frontendVisualType: string;
  powerBiVisualType: string;
  pageName: string;
  pageDisplayName: string;
  visualIndex: number;
  visualContainerName: string | null;
  displayLabels: string[];
}

const VISUAL_TYPE_CANDIDATES: Record<string, string[]> = {
  card: ["card"],
  slicer: ["slicer", "slicerDropdown"],
  slicerDropdown: ["slicerDropdown", "slicer"],
  slicerVerticalList: ["slicerVerticalList", "slicer"],
  buttonSlicer: ["buttonSlicer", "advancedSlicerVisual"],
  barChart: ["barChart"],
  columnChart: ["columnChart"],
  clusteredBarChart: ["clusteredBarChart"],
  clusteredColumnChart: ["clusteredColumnChart"],
  stackedBarChart: ["hundredPercentStackedBarChart", "barChart"],
  stackedColumnChart: ["hundredPercentStackedColumnChart", "columnChart"],
  lineChart: ["lineChart"],
  areaChart: ["areaChart"],
  stackedAreaChart: ["stackedAreaChart"],
  hundredPercentStackedAreaChart: ["hundredPercentStackedAreaChart"],
  lineAndClusteredColumnChart: ["lineClusteredColumnComboChart"],
  lineAndStackedColumnChart: ["lineStackedColumnComboChart"],
  comboChart: ["lineClusteredColumnComboChart", "lineStackedColumnComboChart"],
  lineAndStackedComboChart: ["lineStackedColumnComboChart", "lineClusteredColumnComboChart"],
  ribbonChart: ["ribbonChart"],
  waterfallChart: ["waterfallChart"],
  scatterChart: ["scatterChart"],
  pieChart: ["pieChart"],
  donutChart: ["donutChart"],
  treemap: ["treemap"],
  funnel: ["funnel"],
  funnelChart: ["funnel"],
  table: ["tableEx", "table"],
  matrix: ["pivotTable", "matrix"],
  image: ["image"],
  // Extended visual types
  kpi: ["kpiVisual", "kpi"],
  multiRowCard: ["multiRowCard"],
  gauge: ["gauge"],
  // Universal placeholders are set through page-aware aliases so Home/header
  // textbox and banner shape visuals are not exposed as selectable templates.
  shape: ["shape"],
  textBox: ["textBox", "textbox"],
  rectangleShape: ["shape", "rectangleShape"],
};

interface PreferredTemplateSpec {
  frontendVisualType: string;
  pageDisplayNames: string[];
  powerBiVisualTypes: string[];
}

const PREFERRED_TEMPLATE_SPECS: PreferredTemplateSpec[] = [
  { frontendVisualType: "barChart", pageDisplayNames: ["Stacked Bar Chart"], powerBiVisualTypes: ["barChart"] },
  { frontendVisualType: "columnChart", pageDisplayNames: ["Stacked Column chart"], powerBiVisualTypes: ["columnChart"] },
  { frontendVisualType: "clusteredBarChart", pageDisplayNames: ["Clustered Bar chart"], powerBiVisualTypes: ["clusteredBarChart"] },
  { frontendVisualType: "clusteredColumnChart", pageDisplayNames: ["Clustered Column chart"], powerBiVisualTypes: ["clusteredColumnChart"] },
  { frontendVisualType: "stackedBarChart", pageDisplayNames: ["100% Stacked Bar Chart"], powerBiVisualTypes: ["hundredPercentStackedBarChart"] },
  { frontendVisualType: "stackedColumnChart", pageDisplayNames: ["100% Stacked Column chart"], powerBiVisualTypes: ["hundredPercentStackedColumnChart"] },
  { frontendVisualType: "lineChart", pageDisplayNames: ["Line Chart"], powerBiVisualTypes: ["lineChart"] },
  { frontendVisualType: "areaChart", pageDisplayNames: ["Area Chart"], powerBiVisualTypes: ["areaChart", "stackedAreaChart"] },
  { frontendVisualType: "stackedAreaChart", pageDisplayNames: ["Stacked Area Chart"], powerBiVisualTypes: ["stackedAreaChart"] },
  { frontendVisualType: "hundredPercentStackedAreaChart", pageDisplayNames: ["100% Stacked Area Chart"], powerBiVisualTypes: ["hundredPercentStackedAreaChart"] },
  { frontendVisualType: "lineAndClusteredColumnChart", pageDisplayNames: ["Line and Clustered Column Chart"], powerBiVisualTypes: ["lineClusteredColumnComboChart"] },
  { frontendVisualType: "lineAndStackedColumnChart", pageDisplayNames: ["Line and Stacked Column Chart"], powerBiVisualTypes: ["lineStackedColumnComboChart"] },
  { frontendVisualType: "comboChart", pageDisplayNames: ["Line and Clustered Column Chart"], powerBiVisualTypes: ["lineClusteredColumnComboChart"] },
  { frontendVisualType: "lineAndStackedComboChart", pageDisplayNames: ["Line and Stacked Column Chart"], powerBiVisualTypes: ["lineStackedColumnComboChart"] },
  { frontendVisualType: "ribbonChart", pageDisplayNames: ["Ribbon Chart"], powerBiVisualTypes: ["ribbonChart"] },
  { frontendVisualType: "waterfallChart", pageDisplayNames: ["Waterfall Chart"], powerBiVisualTypes: ["waterfallChart"] },
  { frontendVisualType: "scatterChart", pageDisplayNames: ["Scattered Chart", "Scatter Chart"], powerBiVisualTypes: ["scatterChart"] },
  { frontendVisualType: "pieChart", pageDisplayNames: ["Pie", "Pie Chart"], powerBiVisualTypes: ["pieChart"] },
  { frontendVisualType: "donutChart", pageDisplayNames: ["Donut", "Donut Chart"], powerBiVisualTypes: ["donutChart"] },
  { frontendVisualType: "card", pageDisplayNames: ["Card"], powerBiVisualTypes: ["card"] },
  { frontendVisualType: "slicer", pageDisplayNames: ["Slicer"], powerBiVisualTypes: ["slicer"] },
  { frontendVisualType: "slicerDropdown", pageDisplayNames: ["Slicer"], powerBiVisualTypes: ["slicer"] },
  { frontendVisualType: "slicerVerticalList", pageDisplayNames: ["Slicer1", "Slicer 1"], powerBiVisualTypes: ["slicer"] },
  { frontendVisualType: "buttonSlicer", pageDisplayNames: ["Button Slicer"], powerBiVisualTypes: ["advancedSlicerVisual", "slicer"] },
  { frontendVisualType: "treemap", pageDisplayNames: ["Treemap"], powerBiVisualTypes: ["treemap"] },
  { frontendVisualType: "funnelChart", pageDisplayNames: ["Funnel Chart"], powerBiVisualTypes: ["funnel"] },
  { frontendVisualType: "gauge", pageDisplayNames: ["Gauge Chart"], powerBiVisualTypes: ["gauge"] },
  { frontendVisualType: "table", pageDisplayNames: ["Table"], powerBiVisualTypes: ["tableEx", "table"] },
  { frontendVisualType: "matrix", pageDisplayNames: ["Matrix"], powerBiVisualTypes: ["pivotTable", "matrix"] },
  { frontendVisualType: "shape", pageDisplayNames: ["Shape"], powerBiVisualTypes: ["shape"] },
  { frontendVisualType: "rectangleShape", pageDisplayNames: ["Shape"], powerBiVisualTypes: ["shape"] },
  { frontendVisualType: "textBox", pageDisplayNames: ["Text box", "Text Box"], powerBiVisualTypes: ["textbox"] },
];

const FRONTEND_VISUAL_ORDER = [
  "card",
  "kpi",
  "multiRowCard",
  "gauge",
  "slicer",
  "buttonSlicer",
  "clusteredBarChart",
  "barChart",
  "stackedBarChart",
  "clusteredColumnChart",
  "columnChart",
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
  // Universal placeholders
  "shape",
  "textBox",
];

const CHART_VISUAL_ORDER = FRONTEND_VISUAL_ORDER.filter(
  (visualType) => ![
    "card", "kpi", "multiRowCard", "gauge",
    "slicer", "buttonSlicer",
    "shape", "textBox", "rectangleShape",
  ].includes(visualType),
);

interface PageSummary {
  name: string;
  displayName: string;
  ordinal: number;
}

export function buildLayoutPbit(input: BuildPbitInput): Buffer {
  try {
    return buildVisualLibraryPbit(input);
  } catch (error) {
    if (error instanceof MissingVisualTemplateError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown visual library export error.";
    console.warn(`[pbit] visual library export unavailable; falling back to base.pbit. ${message}`);
    return buildShapeOnlyPbit(input);
  }
}

export function getAvailableVisualTemplates(): VisualTemplateDiagnostic {
  if (!fs.existsSync(VISUAL_LIBRARY_TEMPLATE_PATH)) {
    throw new VisualTemplateError("public/templates/layout-builder/base_visual_library.pbit not found.");
  }

  const zip = new AdmZip(VISUAL_LIBRARY_TEMPLATE_PATH);
  const { layout, encoding } = readLayout(zip, "base_visual_library.pbit");
  const diagnostic = buildVisualTemplateDiagnostic(layout, encoding);
  writeDebugLayout(diagnostic, AVAILABLE_VISUAL_TEMPLATES_PATH);
  writeTextboxTemplateCandidatesDiagnostic(layout);

  return diagnostic;
}

function buildVisualLibraryPbit(input: BuildPbitInput): Buffer {
  if (!fs.existsSync(VISUAL_LIBRARY_TEMPLATE_PATH)) {
    throw new VisualTemplateError("public/templates/layout-builder/base_visual_library.pbit not found.");
  }

  console.log(`[pbit] using visual library template: ${VISUAL_LIBRARY_TEMPLATE_PATH}`);
  const zip = new AdmZip(VISUAL_LIBRARY_TEMPLATE_PATH);
  const { layout, encoding } = readLayout(zip, "base_visual_library.pbit");
  const diagnostic = buildVisualTemplateDiagnostic(layout, encoding);
  writeDebugLayout(diagnostic, AVAILABLE_VISUAL_TEMPLATES_PATH);
  const library = scanVisualTemplateLibrary(layout);
  const section = getTargetReportSection(layout);
  const originalPages = getPageSummaries(layout);

  console.log(`[pbit] visual-library section count: ${Array.isArray(layout.sections) ? layout.sections.length : 0}`);
  console.log(
    `[pbit] visual-library pages: ${originalPages
      .map((page) => `${page.ordinal}:${page.displayName || page.name}`)
      .join(" | ")}`,
  );
  console.log(`[pbit] visual-library template types: ${Array.from(library.templates.keys()).sort().join(", ")}`);
  console.log(`[pbit] target section: ${section.name || section.displayName || "first page"}`);

  const visualContainers: any[] = [];
  const clonedVisualSizes: any[] = [];

  for (const zone of input.zones) {
    const template = resolveTemplateForZone(zone, library);
    if (!template) continue;

    const requestedVisualType = getRequestedVisualType(zone);
    const clonedVisual = createClonedVisual(template, zone, visualContainers.length + 1);
    if (zone.type === "title") {
      applyTitleText(clonedVisual, zone.text || input.reportName, zone.titleFontSize);
    }

    // Collect debug info for each cloned visual
    const clonedConfig = parseVisualConfig(clonedVisual);
    const clonedPos = clonedConfig?.layouts?.[0]?.position ?? {};
    clonedVisualSizes.push({
      zoneId: zone.id,
      zoneType: zone.type,
      visualType: getVisualType(clonedVisual) || getVisualType(template) || requestedVisualType,
      zone: { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
      outerContainer: { x: clonedVisual.x, y: clonedVisual.y, width: clonedVisual.width, height: clonedVisual.height },
      configLayoutPosition: { x: clonedPos.x, y: clonedPos.y, width: clonedPos.width, height: clonedPos.height, z: clonedPos.z },
      sizeMatch: clonedVisual.width === zone.width && clonedVisual.height === zone.height && clonedPos.width === zone.width && clonedPos.height === zone.height,
    });

    console.log(
      `[pbit] zone ${zone.id}: requested=${requestedVisualType}, cloned=${getVisualType(template) || "unknown"}`,
    );
    visualContainers.push(clonedVisual);
  }

  writeDebugLayout(
    { canvasWidth: input.canvasWidth, canvasHeight: input.canvasHeight, totalVisuals: clonedVisualSizes.length, visuals: clonedVisualSizes },
    DEBUG_CLONED_VISUAL_SIZES_PATH,
  );

  finalizeSinglePageLayout(layout, section, visualContainers, input.reportName, input.canvasWidth, input.canvasHeight, originalPages);
  console.log(`[pbit] final section count: ${layout.sections.length}`);
  console.log(`[pbit] final page: ${layout.sections[0]?.name || ""} / ${layout.sections[0]?.displayName || ""}`);
  console.log(`[pbit] final visualContainers count: ${layout.sections[0]?.visualContainers?.length || 0}`);

  const updatedLayout = JSON.stringify(layout);
  writeDebugLayout(layout, DEBUG_VISUAL_LIBRARY_LAYOUT_PATH);
  writeDebugLayout(layout, DEBUG_FINAL_SINGLE_PAGE_LAYOUT_PATH);
  zip.updateFile(REPORT_LAYOUT_PATH, encodeLayoutText(updatedLayout, encoding));
  removeStaleSecurityBindings(zip);

  return zip.toBuffer();
}

function buildShapeOnlyPbit(input: BuildPbitInput): Buffer {
  if (!fs.existsSync(SHAPE_TEMPLATE_PATH)) {
    throw new InvalidBasePbitError("Invalid base.pbit: public/templates/layout-builder/base.pbit not found.");
  }

  const zip = new AdmZip(SHAPE_TEMPLATE_PATH);
  const { layout, encoding } = readLayout(zip, "base.pbit");
  const section = getTargetReportSection(layout);
  const sampleShape = findSampleShapeVisual(layout);

  section.visualContainers = input.zones.map((zone, index) => createClonedVisual(sampleShape, zone, index + 1));
  section.width = input.canvasWidth;
  section.height = input.canvasHeight;
  console.log(`[pbit] fallback section canvas: ${input.canvasWidth}x${input.canvasHeight}`);
  console.log(`[pbit] fallback generated shape visualContainers count: ${section.visualContainers.length}`);

  const updatedLayout = JSON.stringify(layout);
  writeDebugLayout(layout, DEBUG_LAYOUT_PATH);
  zip.updateFile(REPORT_LAYOUT_PATH, encodeLayoutText(updatedLayout, encoding));
  removeStaleSecurityBindings(zip);

  return zip.toBuffer();
}

export function readLayout(zip: AdmZip, templateName: string): { layout: any; encoding: TextEncoding } {
  const layoutEntry = zip.getEntry(REPORT_LAYOUT_PATH);
  console.log(`[pbit] ${templateName} ${REPORT_LAYOUT_PATH} exists: ${Boolean(layoutEntry)}`);

  if (!layoutEntry) {
    throw new InvalidBasePbitError(`Invalid ${templateName}: Report/Layout not found.`);
  }

  const layoutBuffer = layoutEntry.getData();
  const { text, encoding } = decodeLayoutText(layoutBuffer);
  console.log(`[pbit] ${templateName} ${REPORT_LAYOUT_PATH} encoding: ${encoding}`);

  return { layout: parseLayoutJson(text, templateName), encoding };
}

export function removeStaleSecurityBindings(zip: AdmZip): void {
  const securityBindings = zip.getEntry(SECURITY_BINDINGS_PATH);
  if (!securityBindings) {
    console.log("[pbit] SecurityBindings entry not present.");
    return;
  }

  zip.deleteFile(SECURITY_BINDINGS_PATH);
  console.log("[pbit] removed stale SecurityBindings entry after Report/Layout mutation.");
}

function decodeLayoutText(buffer: Buffer): { text: string; encoding: TextEncoding } {
  const hasUtf16Bom = buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe;
  const sampleLength = Math.min(buffer.length, 200);
  let nullOddBytes = 0;

  for (let index = 1; index < sampleLength; index += 2) {
    if (buffer[index] === 0) nullOddBytes += 1;
  }

  const likelyUtf16 = hasUtf16Bom || nullOddBytes > sampleLength / 8;
  const encoding: TextEncoding = likelyUtf16 ? "utf16le" : "utf8";
  const text = buffer.toString(encoding).replace(/^\uFEFF/, "");

  return { text, encoding };
}

export function encodeLayoutText(text: string, encoding: TextEncoding): Buffer {
  return Buffer.from(text, encoding);
}

function parseLayoutJson(text: string, templateName: string): any {
  try {
    return JSON.parse(text);
  } catch {
    throw new InvalidBasePbitError(`Invalid ${templateName}: Report/Layout could not be parsed.`);
  }
}

export function getTargetReportSection(layout: any): any {
  if (!Array.isArray(layout?.sections) || layout.sections.length === 0) {
    throw new InvalidBasePbitError("Invalid PBIT: Report/Layout does not contain a report page.");
  }

  const bookmarkedSectionName = getDefaultBookmarkedSectionName(layout);
  const bookmarkedSection = bookmarkedSectionName
    ? layout.sections.find((section: any) => section?.name === bookmarkedSectionName)
    : null;
  const targetSection = bookmarkedSection || layout.sections[0];

  if (!Array.isArray(targetSection.visualContainers)) {
    throw new InvalidBasePbitError("Invalid PBIT: target report page has no visualContainers array.");
  }

  return targetSection;
}

function getDefaultBookmarkedSectionName(layout: any): string | null {
  if (typeof layout?.config !== "string") return null;

  try {
    const config = JSON.parse(layout.config);
    const activeSection = config?.bookmarks?.[0]?.explorationState?.activeSection;
    return typeof activeSection === "string" ? activeSection : null;
  } catch {
    return null;
  }
}

function getPageSummaries(layout: any): PageSummary[] {
  return (layout.sections || []).map((section: any, index: number) => ({
    name: String(section?.name || `section_${index}`),
    displayName: String(section?.displayName || section?.name || `Section ${index + 1}`),
    ordinal: Number.isFinite(Number(section?.ordinal)) ? Number(section.ordinal) : index,
  }));
}

function finalizeSinglePageLayout(
  layout: any,
  sourceSection: any,
  visualContainers: any[],
  reportName: string,
  canvasWidth: number,
  canvasHeight: number,
  originalPages: PageSummary[],
): void {
  const finalSection = deepClone(sourceSection);
  const finalDisplayName = getSafePageDisplayName(reportName, sourceSection);

  finalSection.displayName = finalDisplayName;
  finalSection.ordinal = 0;
  finalSection.visualContainers = visualContainers;

  // CRITICAL: set the page canvas size from the user's layout, not from the template.
  // If this is not set, Power BI opens a canvas the size of the template page while
  // visuals are positioned for the user's chosen canvas → visuals overflow and overlap.
  finalSection.width = canvasWidth;
  finalSection.height = canvasHeight;
  console.log(`[pbit] final section canvas: ${canvasWidth}x${canvasHeight}`);

  layout.sections = [finalSection];
  cleanSinglePageLayoutConfig(layout, finalSection.name);

  const removedPages = originalPages.map((page) => page.displayName || page.name);
  console.log(`[pbit] removed template pages: ${removedPages.join(" | ")}`);
}

function getSafePageDisplayName(reportName: string, sourceSection: any): string {
  const trimmed = reportName.trim();
  if (trimmed) return trimmed;

  return String(sourceSection?.displayName || "Layout");
}

function cleanSinglePageLayoutConfig(layout: any, finalSectionName: string): void {
  if (typeof layout?.config !== "string") return;

  try {
    const config = JSON.parse(layout.config);
    const bookmarkCount = Array.isArray(config.bookmarks) ? config.bookmarks.length : 0;

    config.activeSectionIndex = 0;
    if (Array.isArray(config.bookmarks)) {
      delete config.bookmarks;
    }

    layout.config = JSON.stringify(config);
    console.log(
      `[pbit] cleaned layout config: activeSectionIndex=0, removed bookmarks=${bookmarkCount}, finalSection=${finalSectionName}`,
    );
  } catch {
    console.warn("[pbit] layout config could not be parsed; bookmark cleanup skipped.");
  }
}

export function scanVisualTemplateLibrary(layout: any): VisualTemplateLibrary {
  const templates = new Map<string, any>();
  const slicerTemplates: any[] = [];
  let pageTitleTemplate: any | null = null;
  let fallbackTextboxTemplate: any | null = null;

  for (const section of layout.sections || []) {
    for (const visual of section.visualContainers || []) {
      const config = parseVisualConfig(visual);
      const visualType = config?.singleVisual?.visualType;
      if (typeof visualType !== "string") continue;

      if (!templates.has(visualType)) {
        templates.set(visualType, visual);
      }

      if (visualType === "slicer") {
        slicerTemplates.push(visual);
      }

      if (visualType === "textbox") {
        fallbackTextboxTemplate ||= visual;
        if (!pageTitleTemplate && isPageTitleTextbox(visual)) {
          pageTitleTemplate = visual;
        }
      }
    }
  }

  const slicerMapping = classifySlicerTemplates(slicerTemplates);
  if (slicerMapping.dropdown) templates.set("slicerDropdown", slicerMapping.dropdown);
  if (slicerMapping.verticalList) templates.set("slicerVerticalList", slicerMapping.verticalList);
  if (slicerMapping.buttonSlicer) templates.set("buttonSlicer", slicerMapping.buttonSlicer);
  if (slicerMapping.dropdown) templates.set("slicer", slicerMapping.dropdown);
  applyPreferredTemplateAliases(layout, templates);

  const frontendTemplateMappings = buildFrontendTemplateMappings(layout, templates);
  writeTextboxTemplateCandidatesDiagnostic(layout, pageTitleTemplate || fallbackTextboxTemplate);

  return {
    templates,
    pageTitleTemplate,
    fallbackTextboxTemplate,
    foundVisualTypes: Array.from(templates.keys()).sort(),
    frontendTemplateMappings,
  };
}

function buildVisualTemplateDiagnostic(layout: any, encoding: TextEncoding): VisualTemplateDiagnostic {
  const pagesScanned = getPageSummaries(layout);
  const visualTemplates: VisualTemplateDiagnostic["visualTemplates"] = {};
  const rawTemplates = new Map<string, any>();
  const slicerTemplates: any[] = [];

  for (const [sectionIndex, section] of (layout.sections || []).entries()) {
    for (const [visualIndex, visual] of (section.visualContainers || []).entries()) {
      const config = parseVisualConfig(visual);
      const visualType = config?.singleVisual?.visualType;
      if (typeof visualType !== "string") continue;
      if (!rawTemplates.has(visualType)) rawTemplates.set(visualType, visual);
      if (visualType === "slicer") slicerTemplates.push(visual);

      if (!visualTemplates[visualType]) visualTemplates[visualType] = [];
      visualTemplates[visualType].push({
        sectionIndex,
        pageName: section?.name || "",
        pageDisplayName: section?.displayName || "",
        visualIndex,
        visualContainerId: visual?.id ?? null,
        visualContainerName: config?.name || null,
        displayLabels: extractDisplayLabels(config),
        x: visual?.x,
        y: visual?.y,
        width: visual?.width,
        height: visual?.height,
      });
    }
  }

  const slicerMapping = classifySlicerTemplates(slicerTemplates);
  if (slicerMapping.dropdown) rawTemplates.set("slicerDropdown", slicerMapping.dropdown);
  if (slicerMapping.verticalList) rawTemplates.set("slicerVerticalList", slicerMapping.verticalList);
  if (slicerMapping.buttonSlicer) rawTemplates.set("buttonSlicer", slicerMapping.buttonSlicer);
  if (slicerMapping.dropdown) rawTemplates.set("slicer", slicerMapping.dropdown);
  applyPreferredTemplateAliases(layout, rawTemplates);

  const visualTypesFound = Object.keys(visualTemplates).sort();
  const frontendTemplateMappings = buildFrontendTemplateMappings(layout, rawTemplates);
  const chartTemplateExists: Record<string, boolean> = {};
  for (const frontendVisualType of FRONTEND_VISUAL_ORDER) {
    chartTemplateExists[frontendVisualType] = Boolean(frontendTemplateMappings[frontendVisualType]);
  }

  const availableFrontendVisualTypes = FRONTEND_VISUAL_ORDER.filter((frontendVisualType) =>
    Boolean(frontendTemplateMappings[frontendVisualType]),
  );
  const missingVisualTemplates = FRONTEND_VISUAL_ORDER.filter((frontendVisualType) => !frontendTemplateMappings[frontendVisualType]);

  return {
    templateFileUsed: VISUAL_LIBRARY_TEMPLATE_PATH,
    reportLayoutEncoding: encoding,
    pagesScanned,
    visualTypesFound,
    visualTemplates: Object.fromEntries(
      Object.entries(visualTemplates).sort(([left], [right]) => left.localeCompare(right)),
    ),
    availableFrontendVisualTypes,
    frontendTemplateMappings,
    cardTemplateExists: Boolean(frontendTemplateMappings.card),
    slicerTemplateExists: Boolean(frontendTemplateMappings.slicer),
    pieChartDetected: Boolean(frontendTemplateMappings.pieChart),
    donutChartDetected: Boolean(frontendTemplateMappings.donutChart),
    slicerDropdownDetected: Boolean(frontendTemplateMappings.slicer),
    slicerVerticalListDetected: false,
    chartTemplateExists,
    missingVisualTemplates,
  };
}

function applyPreferredTemplateAliases(layout: any, templates: Map<string, any>): void {
  for (const spec of PREFERRED_TEMPLATE_SPECS) {
    const template = findPreferredTemplate(layout, spec);
    if (template) {
      templates.set(spec.frontendVisualType, template);
    }
  }
}

function findPreferredTemplate(layout: any, spec: PreferredTemplateSpec): any | null {
  const expectedPageNames = new Set(spec.pageDisplayNames.map(normalizeTemplateName));
  const expectedVisualTypes = new Set(spec.powerBiVisualTypes);

  for (const section of layout.sections || []) {
    const pageDisplayName = String(section?.displayName || "");
    const pageName = String(section?.name || "");
    if (!expectedPageNames.has(normalizeTemplateName(pageDisplayName)) && !expectedPageNames.has(normalizeTemplateName(pageName))) {
      continue;
    }

    const candidates = (section.visualContainers || []).filter((visual: any) => {
      const visualType = parseVisualConfig(visual)?.singleVisual?.visualType;
      return typeof visualType === "string" && expectedVisualTypes.has(visualType);
    });

    if (candidates.length === 0) continue;

    return candidates.find((visual: any) => Number(visual?.y) > 70) || candidates[0];
  }

  return null;
}

function normalizeTemplateName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function classifySlicerTemplates(slicers: any[]): {
  dropdown: any | null;
  verticalList: any | null;
  buttonSlicer: any | null;
} {
  const dropdown = slicers.find((visual) => getSlicerMode(visual) === "Dropdown") || null;
  const resolvedDropdown = dropdown || slicers[0] || null;
  const verticalList =
    slicers.find((visual) => {
      const mode = getSlicerMode(visual);
      return mode === "Basic" || mode === "List";
    }) || null;
  // Button Slicer uses Tile mode (sometimes also shown as Between or Button)
  const buttonSlicer =
    slicers.find((visual) => {
      const mode = getSlicerMode(visual);
      return mode === "Tile" || mode === "Between" || mode === "Button";
    }) || null;

  return {
    dropdown: resolvedDropdown,
    verticalList: verticalList || slicers.find((visual) => visual !== resolvedDropdown) || null,
    buttonSlicer: buttonSlicer || null,
  };
}

function getSlicerMode(visual: any): string | null {
  const config = parseVisualConfig(visual);
  const modeValue = config?.singleVisual?.objects?.data?.[0]?.properties?.mode?.expr?.Literal?.Value;
  return typeof modeValue === "string" ? modeValue.replace(/^'|'$/g, "") : null;
}

function buildFrontendTemplateMappings(layout: any, templates: Map<string, any>): Record<string, VisualTemplateMapping | null> {
  const mappings: Record<string, VisualTemplateMapping | null> = {};

  for (const frontendVisualType of FRONTEND_VISUAL_ORDER) {
    const template = findTemplateInMap(frontendVisualType, templates);
    mappings[frontendVisualType] = template ? describeTemplate(layout, frontendVisualType, template) : null;
  }

  return mappings;
}

function findTemplateInMap(frontendVisualType: string, templates: Map<string, any>): any | null {
  const candidates = VISUAL_TYPE_CANDIDATES[frontendVisualType] || [frontendVisualType];

  for (const candidate of candidates) {
    const template = templates.get(candidate);
    if (template) return template;
  }

  return null;
}

function describeTemplate(layout: any, frontendVisualType: string, template: any): VisualTemplateMapping {
  const config = parseVisualConfig(template);
  const location = findTemplateLocation(layout, template);

  return {
    frontendVisualType,
    powerBiVisualType: config?.singleVisual?.visualType || "",
    pageName: location?.pageName || "",
    pageDisplayName: location?.pageDisplayName || "",
    visualIndex: location?.visualIndex ?? -1,
    visualContainerName: config?.name || null,
    displayLabels: extractDisplayLabels(config),
  };
}

function findTemplateLocation(layout: any, template: any): { pageName: string; pageDisplayName: string; visualIndex: number } | null {
  const templateConfigName = parseVisualConfig(template)?.name;

  for (const section of layout.sections || []) {
    for (const [visualIndex, visual] of (section.visualContainers || []).entries()) {
      const config = parseVisualConfig(visual);
      if (templateConfigName && config?.name === templateConfigName) {
        return {
          pageName: section?.name || "",
          pageDisplayName: section?.displayName || "",
          visualIndex,
        };
      }
    }
  }

  return null;
}

function extractDisplayLabels(config: any): string[] {
  const labels = new Set<string>();
  const paragraphs = config?.singleVisual?.objects?.general?.[0]?.properties?.paragraphs;
  const textRunValue = paragraphs?.[0]?.textRuns?.[0]?.value;
  if (typeof textRunValue === "string" && textRunValue.trim()) labels.add(textRunValue.trim());

  const titleLiteral = config?.singleVisual?.vcObjects?.title?.[0]?.properties?.text?.expr?.Literal?.Value;
  if (typeof titleLiteral === "string") {
    const cleaned = titleLiteral.replace(/^'|'$/g, "").trim();
    if (cleaned) labels.add(cleaned);
  }

  return Array.from(labels);
}

function isPageTitleTextbox(visual: any): boolean {
  const y = Number(visual?.y);
  const height = Number(visual?.height);
  const width = Number(visual?.width);

  return Number.isFinite(y) && y <= 20 && Number.isFinite(height) && height <= 100 && Number.isFinite(width) && width >= 250;
}

function writeTextboxTemplateCandidatesDiagnostic(layout: any, selectedTemplate?: any | null): void {
  const selectedConfigName = selectedTemplate ? parseVisualConfig(selectedTemplate)?.name : getSelectedPageTitleTextboxName(layout);
  const candidates: Array<Record<string, unknown>> = [];

  for (const [pageIndex, section] of (layout.sections || []).entries()) {
    for (const visual of section.visualContainers || []) {
      const config = parseVisualConfig(visual);
      const visualType = config?.singleVisual?.visualType;
      if (visualType !== "textbox") continue;

      const visualContainerName = config?.name || null;
      candidates.push({
        pageIndex,
        pageName: section?.name || "",
        pageDisplayName: section?.displayName || "",
        visualContainerName,
        visualType,
        x: visual?.x,
        y: visual?.y,
        width: visual?.width,
        height: visual?.height,
        passedIsPageTitleTextbox: isPageTitleTextbox(visual),
        selectedAsFinalPageTitleTemplate: Boolean(selectedConfigName && visualContainerName === selectedConfigName),
        textPreview: getTextboxTextPreview(config),
      });
    }
  }

  const selected = candidates.find((candidate) => candidate.selectedAsFinalPageTitleTemplate);
  writeDebugLayout(
    {
      templateFileUsed: VISUAL_LIBRARY_TEMPLATE_PATH,
      totalTextboxVisualsFound: candidates.length,
      selectedPageTitleTextbox: selected || null,
      candidates,
    },
    TEXTBOX_TEMPLATE_CANDIDATES_PATH,
  );

  console.log(`[pbit] textbox visuals found: ${candidates.length}`);
  if (selected) {
    console.log(
      `[pbit] pageTitle textbox selected: ${selected.visualContainerName} from page ${selected.pageIndex} / ${selected.pageDisplayName || selected.pageName}`,
    );
  } else {
    console.log("[pbit] pageTitle textbox selected: none");
  }
}

function getSelectedPageTitleTextboxName(layout: any): string | null {
  let fallbackTextboxName: string | null = null;

  for (const section of layout.sections || []) {
    for (const visual of section.visualContainers || []) {
      const config = parseVisualConfig(visual);
      if (config?.singleVisual?.visualType !== "textbox") continue;

      fallbackTextboxName ||= config?.name || null;
      if (isPageTitleTextbox(visual)) {
        return config?.name || null;
      }
    }
  }

  return fallbackTextboxName;
}

function getTextboxTextPreview(config: any): string {
  const paragraphs = config?.singleVisual?.objects?.general?.[0]?.properties?.paragraphs;
  const textRuns = Array.isArray(paragraphs?.[0]?.textRuns) ? paragraphs[0].textRuns : [];
  const preview = textRuns
    .map((run: any) => (typeof run?.value === "string" ? run.value : ""))
    .join("")
    .trim();

  return preview.slice(0, 160);
}

export function resolveTemplateForZone(zone: NormalizedZone, library: VisualTemplateLibrary): any | null {
  const requestedVisualType = getRequestedVisualType(zone);
  console.log(`[pbit] zone ${zone.id}: type=${zone.type} requested visualType=${requestedVisualType}`);

  // Universal placeholders override normal zone handling and are available for any selected zone.
  if (requestedVisualType === "textBox") {
    const tbTemplate = findTemplate("textBox", library) || library.fallbackTextboxTemplate;
    if (tbTemplate) {
      console.log(`[pbit] zone ${zone.id}: using textbox template for textBox placeholder.`);
      return tbTemplate;
    }
    console.warn(`[pbit] zone ${zone.id}: textBox requested but no textbox template found; falling through.`);
    // Fall through to normal zone handling
  }

  if (requestedVisualType === "shape" || requestedVisualType === "rectangleShape") {
    const shapeTemplate = findTemplate("shape", library) || findTemplate("rectangleShape", library);
    if (shapeTemplate) {
      console.log(`[pbit] zone ${zone.id}: using shape template for shape placeholder.`);
      return shapeTemplate;
    }
    console.warn(`[pbit] zone ${zone.id}: shape requested but no shape template found; falling through.`);
    // Fall through to normal zone handling
  }

  if (zone.type === "logo") {
    console.warn(`[pbit] logo zone ${zone.id} ignored for visual-library export.`);
    return null;
  }

  if (zone.type === "title") {
    const titleTemplate = library.pageTitleTemplate || library.fallbackTextboxTemplate;
    if (!titleTemplate) {
      throw new MissingVisualTemplateError("Page title/header textbox template not found in base_visual_library.pbit.");
    }
    return titleTemplate;
  }

  if (zone.type === "kpi") {
    // Allow kpi, multiRowCard, gauge as alternatives to card
    const kpiTemplate = findTemplate(requestedVisualType, library);
    if (kpiTemplate) return kpiTemplate;

    // Fallback to card
    const cardTemplate = findTemplate("card", library);
    if (cardTemplate) {
      console.warn(`[pbit] zone ${zone.id}: ${requestedVisualType} not found; falling back to card.`);
      return cardTemplate;
    }

    throw new MissingVisualTemplateError("Card template not found in base_visual_library.pbit.");
  }

  if (zone.type === "slicer") {
    const slicerTemplate = findTemplate(requestedVisualType, library);
    if (slicerTemplate) return slicerTemplate;

    throw new MissingVisualTemplateError(`Slicer template not found for ${requestedVisualType} in base_visual_library.pbit.`);
  }

  // Chart zone (default): look up requested type, fallback to first available chart
  const template = findTemplate(requestedVisualType, library);
  if (template) return template;

  const safeDefaultVisualType = getFirstAvailableChartVisualType(library);
  if (safeDefaultVisualType) {
    console.warn(
      `[pbit] template visual not found for ${requestedVisualType}; zone ${zone.id} reset to ${safeDefaultVisualType} safe default.`,
    );
    return findTemplate(safeDefaultVisualType, library);
  }

  throw new MissingVisualTemplateError(
    `Template visual not found for ${requestedVisualType}, and no chart safe default exists in base_visual_library.pbit.`,
  );
}

function findTemplate(visualType: string, library: VisualTemplateLibrary): any | null {
  const candidates = VISUAL_TYPE_CANDIDATES[visualType] || [visualType];

  for (const candidate of candidates) {
    const template = library.templates.get(candidate);
    if (template) return template;
  }

  return null;
}

function getFirstAvailableChartVisualType(library: VisualTemplateLibrary): string | null {
  for (const visualType of CHART_VISUAL_ORDER) {
    if (findTemplate(visualType, library)) return visualType;
  }

  return null;
}

/** Universal placeholder types that override normal zone handling. */
const UNIVERSAL_PLACEHOLDER_TYPES = new Set(["textBox", "shape", "rectangleShape"]);

function getRequestedVisualType(zone: NormalizedZone): string {
  // Universal placeholders pass through regardless of zone type
  if (zone.visualType && UNIVERSAL_PLACEHOLDER_TYPES.has(zone.visualType)) {
    return zone.visualType;
  }

  if (zone.type === "title") return "pageTitle";

  if (zone.type === "kpi") {
    // Allow kpi, multiRowCard, gauge; default to card
    return zone.visualType && ["kpi", "multiRowCard", "gauge"].includes(zone.visualType)
      ? zone.visualType
      : "card";
  }
  if (zone.type === "slicer") {
    if (zone.visualType === "slicerDropdown" || zone.visualType === "slicerVerticalList") return "slicer";
    return zone.visualType || "slicer";
  }
  if (zone.type === "chart") return zone.visualType || "barChart";
  return zone.visualType || zone.type;
}

function getVisualType(visual: any): string | null {
  return parseVisualConfig(visual)?.singleVisual?.visualType || null;
}

function findSampleShapeVisual(layout: any): any {
  for (const section of layout.sections || []) {
    for (const visual of section.visualContainers || []) {
      const config = parseVisualConfig(visual);
      if (config?.singleVisual?.visualType === "shape") {
        return visual;
      }
    }
  }

  throw new InvalidBasePbitError("Invalid base.pbit: sample shape visual not found.");
}

function parseVisualConfig(visual: any): any {
  if (typeof visual?.config !== "string") return null;

  try {
    return JSON.parse(visual.config);
  } catch {
    return null;
  }
}

export function createClonedVisual(template: any, zone: NormalizedZone, zOrder: number): any {
  const visual = deepClone(template);
  const config = parseVisualConfig(visual);

  if (!config?.singleVisual || !Array.isArray(config.layouts) || !config.layouts[0]?.position) {
    throw new InvalidBasePbitError("Invalid PBIT: template visual config is malformed.");
  }

  const name = makeVisualName(zone, zOrder);

  visual.x = zone.x;
  visual.y = zone.y;
  visual.z = zOrder;
  visual.width = zone.width;
  visual.height = zone.height;
  visual.tabOrder = zOrder;

  if (typeof visual.name === "string") {
    visual.name = name;
  }

  config.name = name;

  // Update every layout entry (Power BI may have multiple layouts for different display modes).
  // Previously only layouts[0] was updated; layouts[1+] retained stale template positions.
  for (const layoutEntry of config.layouts as any[]) {
    if (!layoutEntry?.position) continue;
    layoutEntry.position.x = zone.x;
    layoutEntry.position.y = zone.y;
    layoutEntry.position.z = zOrder;
    layoutEntry.position.width = zone.width;
    layoutEntry.position.height = zone.height;
    layoutEntry.position.tabOrder = zOrder;
  }

  visual.config = JSON.stringify(config);

  return visual;
}

export function applyTitleText(visual: any, title: string, fontSize?: number): void {
  const safeTitle = title.trim();
  if (!safeTitle && !fontSize) return;

  const config = parseVisualConfig(visual);
  const paragraphs = config?.singleVisual?.objects?.general?.[0]?.properties?.paragraphs;
  const firstParagraph = paragraphs?.[0];
  const firstTextRun = firstParagraph?.textRuns?.[0];

  if (!firstTextRun || typeof firstTextRun.value !== "string") {
    console.warn("[pbit] title textbox text structure not recognized; title text was not changed.");
    return;
  }

  if (safeTitle) {
    firstTextRun.value = safeTitle;
    console.log(`[pbit] title textbox text set to "${safeTitle}".`);
  }

  // Apply font size if provided (Power BI stores font size as "Xpt" strings)
  if (fontSize && Number.isFinite(fontSize) && fontSize > 0) {
    if (!firstTextRun.textStyle) {
      firstTextRun.textStyle = {};
    }
    firstTextRun.textStyle.fontSize = `${fontSize}pt`;
    console.log(`[pbit] title textbox font size set to ${fontSize}pt.`);
  }

  visual.config = JSON.stringify(config);
}

function makeVisualName(zone: NormalizedZone, zOrder: number): string {
  return crypto
    .createHash("sha1")
    .update(`${zone.id}:${zone.type}:${zone.visualType || "default"}:${zOrder}`)
    .digest("hex")
    .slice(0, 20);
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// ─── Multi-page export ────────────────────────────────────────────────────────

export function buildMultiPagePbit(input: NormalizedMultiPage): Buffer {
  if (!fs.existsSync(VISUAL_LIBRARY_TEMPLATE_PATH)) {
    throw new VisualTemplateError("public/templates/layout-builder/base_visual_library.pbit not found.");
  }

  console.log(`[pbit:multi] building ${input.pages.length}-page PBIT`);
  const zip = new AdmZip(VISUAL_LIBRARY_TEMPLATE_PATH);
  const { layout, encoding } = readLayout(zip, "base_visual_library.pbit");

  // Scan visual template library once and reuse across all pages
  const library = scanVisualTemplateLibrary(layout);
  const sourceSection = getTargetReportSection(layout);

  // Generate a stable build seed so section names are deterministic per export call
  const buildSeed = crypto.randomBytes(8).toString("hex");

  const finalSections: any[] = [];

  for (const page of input.pages) {
    const visualContainers: any[] = [];

    for (const zone of page.zones) {
      const template = resolveTemplateForZone(zone, library);
      if (!template) continue;

      const cloned = createClonedVisual(template, zone, visualContainers.length + 1);
      if (zone.type === "title") {
        applyTitleText(cloned, zone.text || page.pageName, zone.titleFontSize);
      }

      console.log(
        `[pbit:multi] page ${page.pageIndex + 1} zone ${zone.id}: type=${zone.type} visual=${zone.visualType || "default"}`,
      );
      visualContainers.push(cloned);
    }

    const section = buildPageSection(sourceSection, page, buildSeed, finalSections.length);
    section.visualContainers = visualContainers;
    finalSections.push(section);

    console.log(
      `[pbit:multi] page ${page.pageIndex + 1} "${page.pageName}": ${visualContainers.length} visuals, canvas ${page.canvasWidth}x${page.canvasHeight}`,
    );
  }

  layout.sections = finalSections;
  cleanMultiPageLayoutConfig(layout);

  const updatedLayout = JSON.stringify(layout);
  zip.updateFile(REPORT_LAYOUT_PATH, encodeLayoutText(updatedLayout, encoding));
  removeStaleSecurityBindings(zip);

  console.log(`[pbit:multi] final section count: ${finalSections.length}`);
  return zip.toBuffer();
}

export function buildPageSection(sourceSection: any, page: NormalizedPage, buildSeed: string, ordinal: number): any {
  const section = deepClone(sourceSection);
  section.displayName = page.pageName.trim() || `Page ${ordinal + 1}`;
  section.ordinal = ordinal;
  section.width = page.canvasWidth;
  section.height = page.canvasHeight;
  // Generate a unique stable name for this page so Power BI treats them as distinct pages
  section.name = makePageSectionName(buildSeed, ordinal);
  return section;
}

export function makePageSectionName(buildSeed: string, ordinal: number): string {
  return (
    "ReportSection" +
    crypto
      .createHash("sha1")
      .update(`${buildSeed}:${ordinal}`)
      .digest("hex")
      .slice(0, 12)
  );
}

export function cleanMultiPageLayoutConfig(layout: any): void {
  if (typeof layout?.config !== "string") return;

  try {
    const config = JSON.parse(layout.config);
    config.activeSectionIndex = 0;
    if (Array.isArray(config.bookmarks)) {
      delete config.bookmarks;
    }
    layout.config = JSON.stringify(config);
    console.log("[pbit:multi] cleaned layout config: activeSectionIndex=0, removed bookmarks");
  } catch {
    console.warn("[pbit:multi] layout config could not be parsed; cleanup skipped.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function writeDebugLayout(layout: any, outputPath: string): void {
  // Debug JSON dumps are opt-in (set PBIT_DEBUG=1). They are skipped by default
  // so the serverless function never touches a read-only filesystem on Vercel
  // and the repo is not littered during `next dev`. Export logic is unaffected.
  if (!process.env.PBIT_DEBUG || process.env.VERCEL) {
    return;
  }

  try {
    fs.mkdirSync(DEBUG_EXPORT_DIR, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(layout, null, 2), "utf8");
    console.log(`[pbit] wrote debug layout JSON: ${outputPath}`);
  } catch (error) {
    // Never crash the export because of a debug write failure.
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[pbit] debug write failed (non-fatal): ${outputPath} — ${message}`);
  }
}
