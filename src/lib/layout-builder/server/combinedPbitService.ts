/**
 * Combined "Layout + Icons" PBIT export.
 *
 * Reuses the exact proven Layout Builder methodology (adm-zip load/modify/
 * save against the genuine Power BI-authored base_visual_library.pbit, deep
 * cloning real visual containers instead of hand-authoring visual JSON,
 * auto-detected Report/Layout encoding, SecurityBindings removal after
 * mutation) for BOTH the layout pages and the appended icon pages — see
 * src/lib/layout-builder/server/pbitService.ts, whose internals this module
 * imports rather than duplicates.
 *
 * Icon pages clone a genuine Image visual found directly in
 * base_visual_library.pbit (confirmed present — 81 real Image visuals) rather
 * than the Icon Studio's own separate base template, since the combined
 * export works from a single base package throughout. That base's Image
 * visuals reference PNG resources via the `general.imageUrl` property path;
 * this exporter instead registers SVG resources (reusing the same
 * iconRenderer.buildSingleSvg renderer Icon Studio's own SVG/PNG/PBIT exports
 * use, so customization is pixel-identical everywhere) and declares the
 * `svg` extension in [Content_Types].xml — the same Default-extension pattern
 * already proven to work in the Icon Studio's own validated base template.
 * The visual's JSON property path itself is untouched/genuine; only the
 * resource bytes/extension it points at differ, with the content type
 * correctly declared, per Part 4's explicit allowance.
 */
import AdmZip from "adm-zip";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getFlagIcons, isFlagIcon } from "@/lib/flagLibrary";
import { getV2ConceptById } from "@/lib/icon-library/registry";
import { outlineDataUri } from "@/lib/icon-library/variantRenderer";
import { buildSingleSvg, rgbaFromHex, type BgShape, type IconStyle, type IconWeight, type SheetOptions } from "@/lib/iconRenderer";
import { cellPosition, computeGridGeometry } from "@/lib/icon-studio/server/iconPbitService";
import {
  applyTitleText,
  buildPageSection,
  cleanMultiPageLayoutConfig,
  createClonedVisual,
  deepClone,
  encodeLayoutText,
  getTargetReportSection,
  getVisualLibraryTemplatePath,
  InvalidBasePbitError,
  makePageSectionName,
  readLayout,
  removeStaleSecurityBindings,
  resolveTemplateForZone,
  scanVisualTemplateLibrary,
  REPORT_LAYOUT_PATH,
} from "./pbitService";
import type { NormalizedPage } from "./types";

const REGISTERED_RESOURCES_DIR = "Report/StaticResources/RegisteredResources/";
const CONTENT_TYPES_PATH = "[Content_Types].xml";
const CUSTOM_THEME_PART_PATH = "Report/StaticResources/CustomTheme.json";

const ICON_GRID_COLS = 13;
const ICON_GRID_ROWS = 7;
export const ICON_PAGE_CAPACITY = ICON_GRID_COLS * ICON_GRID_ROWS; // 91
const ICON_MARGIN = 20;
const ICON_GUTTER = 8;


export class IconRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IconRenderError";
  }
}

export interface CombinedIconCustomization {
  iconColor: string;
  weight: IconWeight;
  style: IconStyle;
  backgroundMode: "solid" | "gradient" | "none";
  solidBackgroundColor: string;
  bgOpacity: number;
  bgShape: BgShape;
  gradient: { code: string; name: string; stops: string[] } | null;
  padding: number;
  size: number;
  /** Optional colour mode (mono when omitted). Legacy persisted payloads may
   *  still send "duotone"/"tritone" — those coerce to mono; only "multicolor"
   *  selects the reference's ORIGINAL multicolor geometry. */
  colorMode?: "mono" | "duotone" | "tritone" | "multicolor";
}

export interface CombinedIconBundle {
  iconIds: string[];
  customization: CombinedIconCustomization;
  perIconOverrides?: Record<string, Partial<CombinedIconCustomization>>;
}

export interface BuildCombinedPbitInput {
  pages: NormalizedPage[];
  iconBundle?: CombinedIconBundle;
  themeJSON?: unknown;
}

export interface BuildCombinedPbitResult {
  buffer: Buffer;
  layoutPageCount: number;
  iconPageCount: number;
  totalPageCount: number;
}

/**
 * Resolve an icon id to raw SVG text. Two sources only (matching the client
 * gallery): the ISO flag registry (static files under public/) and the
 * curated business-icon registry — whose SVG is produced by the SAME
 * outlineDataUri geometry the client fetches, so the server render (through
 * the shared iconRenderer pipeline below) stays byte-consistent with preview.
 */
function resolveIconSource(iconId: string): { name: string; svgText: string; isFlag: boolean } | null {
  if (isFlagIcon(iconId)) {
    const flag = getFlagIcons().find((item) => item.id === iconId);
    if (!flag) return null;
    const filePath = path.resolve(process.cwd(), "public", flag.url.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) return null;
    return { name: flag.name, svgText: fs.readFileSync(filePath, "utf8"), isFlag: true };
  }

  const concept = getV2ConceptById(iconId);
  if (!concept) return null;
  const svgText = decodeURIComponent(outlineDataUri(concept).replace("data:image/svg+xml;utf8,", ""));
  return { name: concept.name, svgText, isFlag: false };
}

function resolveCustomization(
  bundle: CombinedIconBundle,
  iconId: string,
): CombinedIconCustomization {
  const override = bundle.perIconOverrides?.[iconId];
  return override ? { ...bundle.customization, ...override } : bundle.customization;
}

function toSheetOptions(custom: CombinedIconCustomization, isFlag: boolean): SheetOptions {
  return {
    iconColor: custom.iconColor,
    weight: custom.weight,
    style: custom.style,
    isFlag,
    // Legacy duotone/tritone payloads coerce to mono — those modes no longer
    // exist; multicolor selects the ORIGINAL reference geometry.
    colorMode: custom.colorMode === "multicolor" ? "multicolor" : "mono",
    bgFill: custom.backgroundMode === "solid" ? rgbaFromHex(custom.solidBackgroundColor, custom.bgOpacity) : "transparent",
    bgShape: custom.backgroundMode === "none" ? "none" : custom.bgShape,
    // Same UI-padding -> export-box-padding conversion Icon Studio's own
    // SVG/PNG/PBIT exports use, so a 256px-box render matches everywhere.
    padding: Math.round(custom.padding * (256 / 72)),
    gradient: custom.backgroundMode === "gradient" && custom.gradient
      ? {
        code: custom.gradient.code,
        name: custom.gradient.name,
        family: "Theme",
        category: "Theme Matched",
        tone: "",
        stops: custom.gradient.stops,
        css: `linear-gradient(135deg, ${custom.gradient.stops[0]}, ${custom.gradient.stops[1] ?? custom.gradient.stops[0]})`,
        solid: custom.gradient.stops[0],
        textColor: custom.iconColor,
      }
      : null,
  };
}

function dedupePreservingOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

function findGenuineImageVisualTemplate(layout: any): any {
  let fallback: any = null;

  for (const section of layout.sections || []) {
    for (const visual of section.visualContainers || []) {
      const config = parseVisualConfig(visual);
      if (config?.singleVisual?.visualType !== "image") continue;
      fallback ||= visual;
      // Prefer a template without a page-navigation link so cloned icon
      // tiles don't all silently navigate to whatever page the original
      // template visual happened to link to.
      if (!config.singleVisual.vcObjects?.visualLink) return visual;
    }
  }

  if (!fallback) {
    throw new InvalidBasePbitError("Invalid base_visual_library.pbit: no genuine Image visual found to clone for icon pages.");
  }

  return fallback;
}

function parseVisualConfig(visual: any): any {
  if (typeof visual?.config !== "string") return null;
  try {
    return JSON.parse(visual.config);
  } catch {
    return null;
  }
}

function makeIconResourceName(iconId: string, buildSeed: string, globalIndex: number, iconName: string): string {
  const slug = iconName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "icon";
  const hash = crypto.createHash("sha1").update(`${buildSeed}:${iconId}:${globalIndex}`).digest("hex").slice(0, 12);
  return `${slug}-${hash}.svg`;
}

function makeIconVisualName(buildSeed: string, globalIndex: number): string {
  return crypto.createHash("sha1").update(`${buildSeed}:combined-icon-visual:${globalIndex}`).digest("hex").slice(0, 20);
}

function makeIconPageSectionName(buildSeed: string, pageOrdinal: number): string {
  return "ReportSection" + crypto.createHash("sha1").update(`${buildSeed}:combined-icon-page:${pageOrdinal}`).digest("hex").slice(0, 12);
}

/** Clones the genuine Image visual, mutating only position/name/resource reference — same pattern as createClonedVisual for chart/kpi/etc. visuals. */
function cloneIconVisual(
  template: any,
  pos: { x: number; y: number; width: number; height: number; tabOrder: number },
  resourceItemName: string,
  iconLabel: string,
  buildSeed: string,
  globalIndex: number,
): any {
  const visual = deepClone(template);
  const config = parseVisualConfig(visual);

  if (!config?.singleVisual || !Array.isArray(config.layouts) || !config.layouts[0]?.position) {
    throw new InvalidBasePbitError("Invalid base_visual_library.pbit: Image visual config is malformed.");
  }

  const visualName = makeIconVisualName(buildSeed, globalIndex);

  visual.x = pos.x;
  visual.y = pos.y;
  visual.z = 0;
  visual.width = pos.width;
  visual.height = pos.height;
  if (typeof visual.name === "string") visual.name = visualName;
  config.name = visualName;

  // Strip any inherited page-navigation link — every icon tile should be a
  // plain, independently selectable image, not a navigation button.
  if (config.singleVisual.vcObjects?.visualLink) {
    delete config.singleVisual.vcObjects.visualLink;
  }

  for (const layoutEntry of config.layouts as any[]) {
    if (!layoutEntry?.position) continue;
    layoutEntry.position.x = pos.x;
    layoutEntry.position.y = pos.y;
    layoutEntry.position.z = 0;
    layoutEntry.position.width = pos.width;
    layoutEntry.position.height = pos.height;
    layoutEntry.position.tabOrder = pos.tabOrder;
  }

  // The genuine template references its resource via objects.general[0].properties.imageUrl
  // (confirmed schema for base_visual_library.pbit's own Image visuals). Re-point it at our
  // newly registered SVG resource without altering the property structure itself.
  const imageUrlProp = config.singleVisual.objects?.general?.[0]?.properties?.imageUrl;
  if (!imageUrlProp) {
    throw new InvalidBasePbitError("Invalid base_visual_library.pbit: Image visual does not use the expected general.imageUrl schema.");
  }
  imageUrlProp.expr = { ResourcePackageItem: { PackageName: "RegisteredResources", PackageType: 1, ItemName: resourceItemName } };

  visual.config = JSON.stringify(config);
  void iconLabel; // reserved for a future visible label/tooltip; not part of the genuine schema today

  return visual;
}

function ensureSvgContentType(zip: AdmZip): void {
  const entry = zip.getEntry(CONTENT_TYPES_PATH);
  if (!entry) return;
  const xml = entry.getData().toString("utf8");
  if (/Extension="svg"/i.test(xml)) return;

  const updated = xml.replace(
    "</Types>",
    '<Default Extension="svg" ContentType="" /></Types>',
  );
  zip.updateFile(CONTENT_TYPES_PATH, Buffer.from(updated, "utf8"));
}

/**
 * Builds icon page sections (13x7/91-per-page grid) cloned from the genuine
 * base_visual_library.pbit Image visual, exactly mirroring how layout pages
 * are built from chart/kpi/etc. visuals — only the visual type and resource
 * registration differ.
 */
/**
 * Renders one icon (with the bundle's customization when available) and
 * registers its SVG resource, returning the resource item name. Shared by
 * the icon-page grid AND the in-layout KPI/title icon visuals so both use
 * the identical render + registration pipeline.
 */
function renderAndRegisterIcon(
  iconId: string,
  bundle: CombinedIconBundle | undefined,
  buildSeed: string,
  globalIndex: number,
  resourceItems: Array<{ type: number; path: string; name: string }>,
  resourceEntries: Array<{ name: string; data: Buffer }>,
): string {
  const source = resolveIconSource(iconId);
  if (!source) {
    throw new IconRenderError(`Could not render icon "${iconId}": icon not found in the library.`);
  }
  const customization = bundle ? resolveCustomization(bundle, iconId) : null;
  let rendered: string;
  try {
    rendered = customization
      ? buildSingleSvg(source.svgText, 256, toSheetOptions(customization, source.isFlag))
      : buildSingleSvg(source.svgText, 256, {
        iconColor: "#0D9488", weight: "regular", style: "precision", isFlag: source.isFlag,
        colorMode: "multicolor", bgFill: "transparent", bgShape: "none", padding: 0, gradient: null,
      });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown render error";
    throw new IconRenderError(`Could not render icon "${source.name}" (${iconId}): ${message}`);
  }
  const resourceItemName = makeIconResourceName(iconId, buildSeed, globalIndex, source.name);
  resourceItems.push({ type: 100, path: resourceItemName, name: resourceItemName });
  resourceEntries.push({ name: `${REGISTERED_RESOURCES_DIR}${resourceItemName}`, data: Buffer.from(rendered, "utf8") });
  return resourceItemName;
}

function buildIconPageSections(
  layout: any,
  bundle: CombinedIconBundle,
  buildSeed: string,
  startingOrdinal: number,
  startingIndex: number,
): { sections: any[]; resourceItems: Array<{ type: number; path: string; name: string }>; resourceEntries: Array<{ name: string; data: Buffer }> } {
  const sourceSection = getTargetReportSection(layout);
  const imageTemplate = findGenuineImageVisualTemplate(layout);
  const pageWidth = Number(sourceSection.width) || 1280;
  const pageHeight = Number(sourceSection.height) || 720;
  const geometry = computeGridGeometry(pageWidth, pageHeight);

  const uniqueIds = dedupePreservingOrder(bundle.iconIds);
  const sections: any[] = [];
  const resourceItems: Array<{ type: number; path: string; name: string }> = [];
  const resourceEntries: Array<{ name: string; data: Buffer }> = [];

  uniqueIds.forEach((iconId, gridIndex) => {
    const globalIndex = startingIndex + gridIndex;
    const pageIndex = Math.floor(gridIndex / ICON_PAGE_CAPACITY);
    const indexOnPage = gridIndex % ICON_PAGE_CAPACITY;

    let section = sections[pageIndex];
    if (!section) {
      section = deepClone(sourceSection);
      const pageNumber = pageIndex + 1;
      section.name = makeIconPageSectionName(buildSeed, startingOrdinal + pageIndex);
      section.displayName = `Icons ${String(pageNumber).padStart(2, "0")}`;
      section.ordinal = startingOrdinal + pageIndex;
      section.width = pageWidth;
      section.height = pageHeight;
      section.visualContainers = [];
      sections[pageIndex] = section;
    }

    const resourceItemName = renderAndRegisterIcon(iconId, bundle, buildSeed, globalIndex, resourceItems, resourceEntries);
    const pos = cellPosition(indexOnPage, geometry);
    const visual = cloneIconVisual(imageTemplate, pos, resourceItemName, iconId, buildSeed, globalIndex);
    section.visualContainers.push(visual);
  });

  return { sections: sections.filter(Boolean), resourceItems, resourceEntries };
}

export function buildCombinedPbit(input: BuildCombinedPbitInput): BuildCombinedPbitResult {
  if (!input.pages || input.pages.length === 0) {
    throw new Error("Invalid combined export payload: at least one layout page is required.");
  }

  const templatePath = getVisualLibraryTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new InvalidBasePbitError("public/templates/layout-builder/base_visual_library.pbit not found.");
  }

  const zip = new AdmZip(templatePath);
  const { layout, encoding } = readLayout(zip, "base_visual_library.pbit");
  const library = scanVisualTemplateLibrary(layout);
  const sourceSection = getTargetReportSection(layout);
  const buildSeed = crypto.randomBytes(8).toString("hex");

  // 1. Existing Layout Builder pages first — identical logic to buildMultiPagePbit.
  // KPI/title icon zones (visualType "image" + iconId) clone the genuine Image
  // visual and register their own rendered SVG resources, exactly like icon
  // pages do.
  const layoutSections: any[] = [];
  const inlineIconItems: Array<{ type: number; path: string; name: string }> = [];
  const inlineIconEntries: Array<{ name: string; data: Buffer }> = [];
  let inlineIconIndex = 0;
  let imageTemplateCache: any = null;

  for (const page of input.pages) {
    const visualContainers: any[] = [];

    for (const zone of page.zones) {
      if (zone.iconId && zone.visualType === "image") {
        imageTemplateCache ||= findGenuineImageVisualTemplate(layout);
        const resourceItemName = renderAndRegisterIcon(
          zone.iconId, input.iconBundle, buildSeed, 100000 + inlineIconIndex, inlineIconItems, inlineIconEntries,
        );
        const visual = cloneIconVisual(
          imageTemplateCache,
          { x: zone.x, y: zone.y, width: zone.width, height: zone.height, tabOrder: visualContainers.length + 1 },
          resourceItemName,
          zone.iconId,
          buildSeed,
          100000 + inlineIconIndex,
        );
        inlineIconIndex += 1;
        visualContainers.push(visual);
        continue;
      }

      const template = resolveTemplateForZone(zone, library);
      if (!template) continue;

      const cloned = createClonedVisual(template, zone, visualContainers.length + 1);
      if (zone.type === "title") {
        applyTitleText(cloned, zone.text || page.pageName, zone.titleFontSize);
      }
      visualContainers.push(cloned);
    }

    const section = buildPageSection(sourceSection, page, buildSeed, layoutSections.length);
    section.visualContainers = visualContainers;
    layoutSections.push(section);
  }

  // 2. Icon pages appended afterward.
  const iconResult = input.iconBundle && input.iconBundle.iconIds.length > 0
    ? buildIconPageSections(layout, input.iconBundle, buildSeed, layoutSections.length, 0)
    : { sections: [], resourceItems: [], resourceEntries: [] };

  iconResult.resourceItems.push(...inlineIconItems);
  iconResult.resourceEntries.push(...inlineIconEntries);

  layout.sections = [...layoutSections, ...iconResult.sections];
  cleanMultiPageLayoutConfig(layout);

  // Resource packages: keep SharedResources (built-in theme assets) and add
  // a RegisteredResources package for the icon SVGs, if any.
  const sharedResourcesPkg = (layout.resourcePackages || []).find((pkg: any) => pkg?.resourcePackage?.name === "SharedResources");
  const nextResourcePackages: any[] = sharedResourcesPkg ? [sharedResourcesPkg] : [];
  if (iconResult.resourceItems.length > 0) {
    nextResourcePackages.push({ resourcePackage: { name: "RegisteredResources", type: 1, items: iconResult.resourceItems, disabled: false } });
  }
  layout.resourcePackages = nextResourcePackages;

  const updatedLayout = JSON.stringify(layout);
  zip.updateFile(REPORT_LAYOUT_PATH, encodeLayoutText(updatedLayout, encoding));

  if (iconResult.resourceEntries.length > 0) {
    ensureSvgContentType(zip);
    for (const entry of iconResult.resourceEntries) {
      zip.addFile(entry.name, entry.data);
    }
  }

  // 3. Optional theme JSON: carried inside the package as an inert,
  // unreferenced resource (not yet wired as the report's active Power BI
  // theme — see module doc comment). Never alters layout/visual schema.
  if (input.themeJSON) {
    zip.addFile(CUSTOM_THEME_PART_PATH, Buffer.from(JSON.stringify(input.themeJSON), "utf8"));
  }

  removeStaleSecurityBindings(zip);

  return {
    buffer: zip.toBuffer(),
    layoutPageCount: layoutSections.length,
    iconPageCount: iconResult.sections.length,
    totalPageCount: layoutSections.length + iconResult.sections.length,
  };
}
