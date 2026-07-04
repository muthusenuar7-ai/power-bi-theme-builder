/**
 * Icon Studio -> Power BI template (.pbit) export, server-side.
 *
 * Mirrors the proven methodology from src/lib/layout-builder/server/pbitService.ts
 * (the Layout Builder exporter confirmed to open correctly in Power BI Desktop):
 * adm-zip load/modify/save against a genuine Power BI-authored base .pbit, deep
 * cloning real visual containers and report sections rather than hand-authoring
 * visual JSON, auto-detecting Report/Layout text encoding, and removing the
 * stale SecurityBindings part after the package is mutated.
 *
 * The base template (public/templates/icon-studio/icon-library-base.pbit) is a
 * genuine Power BI Desktop-authored .pbit containing one real "Icon Library 01"
 * page with a single real Image visual placeholder. It is only ever read here,
 * never written back to.
 */
import AdmZip from "adm-zip";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Templates ship under public/templates/icon-studio/ and are force-included
// into the serverless function via next.config `outputFileTracingIncludes`.
// process.cwd() is the Next project root in both `next dev` and on Vercel
// (/var/task), so this single path resolves correctly in every environment.
const TEMPLATES_DIR = path.resolve(process.cwd(), "public", "templates", "icon-studio");
const ICON_BASE_TEMPLATE_PATH = path.join(TEMPLATES_DIR, "icon-library-base.pbit");

const REPORT_LAYOUT_PATH = "Report/Layout";
const SECURITY_BINDINGS_PATH = "SecurityBindings";
const REGISTERED_RESOURCES_DIR = "Report/StaticResources/RegisteredResources/";

export const GRID_COLS = 13;
export const GRID_ROWS = 7;
export const PAGE_CAPACITY = GRID_COLS * GRID_ROWS; // 91

const MARGIN = 20;
const GUTTER = 8;

export class InvalidIconBasePbitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidIconBasePbitError";
  }
}

export class MissingIconBaseTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingIconBaseTemplateError";
  }
}

type TextEncoding = "utf16le" | "utf8";

export interface IconExportSource {
  id: string;
  name: string;
  /** Final rendered SVG markup, already customized by iconRenderer.buildSingleSvg. */
  svg: string;
}

export interface GridGeometry {
  cellW: number;
  cellH: number;
  boxSize: number;
}

export interface CellPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  tabOrder: number;
}

export function computeIconPageCount(iconCount: number): number {
  return Math.ceil(iconCount / PAGE_CAPACITY);
}

/**
 * Diagnostic/validation helper for Phase 8 stage 2 ("existing image visual
 * with resource replaced only"): swaps only the bytes behind the base's
 * existing RegisteredResources item, leaving Report/Layout, visual position,
 * and visual name completely untouched. Isolates whether replacing a
 * resource's content alone (no layout/visual mutation) keeps the package
 * openable in Power BI Desktop.
 */
export function buildResourceReplacedOnlyPbit(svg: string): Buffer {
  if (!fs.existsSync(ICON_BASE_TEMPLATE_PATH)) {
    throw new MissingIconBaseTemplateError(
      "Icon Studio base template not found: public/templates/icon-studio/icon-library-base.pbit",
    );
  }

  const zip = new AdmZip(ICON_BASE_TEMPLATE_PATH);
  const { layout } = readLayout(zip);
  const sourceSection = getBaseSection(layout);
  const placeholderVisual = findPlaceholderImageVisual(sourceSection);
  const config = parseVisualConfig(placeholderVisual);
  const resourceItemName: string | undefined =
    config?.singleVisual?.objects?.image?.[0]?.properties?.sourceFile?.image?.url?.expr?.ResourcePackageItem?.ItemName;

  if (!resourceItemName) {
    throw new InvalidIconBasePbitError("Invalid icon-library-base.pbit: could not resolve the placeholder's resource item name.");
  }

  zip.updateFile(`${REGISTERED_RESOURCES_DIR}${resourceItemName}`, Buffer.from(svg, "utf8"));
  removeStaleSecurityBindings(zip);

  return zip.toBuffer();
}

export function buildIconLibraryPbit(sourceIcons: IconExportSource[]): Buffer {
  const icons = dedupePreservingOrder(sourceIcons);
  if (icons.length === 0) {
    throw new Error("No icons selected for Power BI template export.");
  }

  if (!fs.existsSync(ICON_BASE_TEMPLATE_PATH)) {
    throw new MissingIconBaseTemplateError(
      "Icon Studio base template not found: public/templates/icon-studio/icon-library-base.pbit",
    );
  }

  const zip = new AdmZip(ICON_BASE_TEMPLATE_PATH);
  const { layout, encoding } = readLayout(zip);
  const sourceSection = getBaseSection(layout);
  const placeholderVisual = findPlaceholderImageVisual(sourceSection);
  const sharedResourcesPkg = (layout.resourcePackages || []).find(
    (pkg: any) => pkg?.resourcePackage?.name === "SharedResources",
  );

  const pageWidth = Number(sourceSection.width) || 1280;
  const pageHeight = Number(sourceSection.height) || 720;
  const geometry = computeGridGeometry(pageWidth, pageHeight);
  const buildSeed = crypto.randomBytes(8).toString("hex");

  const resourceItems: Array<{ type: number; path: string; name: string }> = [];
  const newResourceEntries: Array<{ name: string; data: Buffer }> = [];
  const finalSections: any[] = [];

  icons.forEach((icon, globalIndex) => {
    const pageIndex = Math.floor(globalIndex / PAGE_CAPACITY);
    const indexOnPage = globalIndex % PAGE_CAPACITY;

    let section = finalSections[pageIndex];
    if (!section) {
      section = buildPageSection(sourceSection, pageIndex, buildSeed);
      finalSections[pageIndex] = section;
    }

    const resourceItemName = makeResourceItemName(icon, buildSeed, globalIndex);
    resourceItems.push({ type: 100, path: resourceItemName, name: resourceItemName });
    newResourceEntries.push({
      name: `${REGISTERED_RESOURCES_DIR}${resourceItemName}`,
      data: Buffer.from(icon.svg, "utf8"),
    });

    const pos = cellPosition(indexOnPage, geometry);
    const visual = createClonedImageVisual(placeholderVisual, pos, icon, resourceItemName, buildSeed, globalIndex);
    section.visualContainers.push(visual);
  });

  layout.sections = finalSections;
  layout.resourcePackages = [
    ...(sharedResourcesPkg ? [sharedResourcesPkg] : []),
    { resourcePackage: { name: "RegisteredResources", type: 1, items: resourceItems, disabled: false } },
  ];
  cleanLayoutConfig(layout);

  const updatedLayout = JSON.stringify(layout);
  zip.updateFile(REPORT_LAYOUT_PATH, encodeLayoutText(updatedLayout, encoding));

  // The base's own placeholder resource is no longer referenced by anything in
  // the rebuilt layout, so drop it before adding the newly rendered resources.
  removeOldRegisteredResources(zip);
  for (const entry of newResourceEntries) {
    zip.addFile(entry.name, entry.data);
  }

  removeStaleSecurityBindings(zip);

  return zip.toBuffer();
}

function dedupePreservingOrder(sourceIcons: IconExportSource[]): IconExportSource[] {
  const seen = new Set<string>();
  const result: IconExportSource[] = [];
  for (const icon of sourceIcons) {
    if (seen.has(icon.id)) continue;
    seen.add(icon.id);
    result.push(icon);
  }
  return result;
}

function readLayout(zip: AdmZip): { layout: any; encoding: TextEncoding } {
  const layoutEntry = zip.getEntry(REPORT_LAYOUT_PATH);
  if (!layoutEntry) {
    throw new InvalidIconBasePbitError("Invalid icon-library-base.pbit: Report/Layout not found.");
  }

  const { text, encoding } = decodeLayoutText(layoutEntry.getData());

  try {
    return { layout: JSON.parse(text), encoding };
  } catch {
    throw new InvalidIconBasePbitError("Invalid icon-library-base.pbit: Report/Layout could not be parsed.");
  }
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
  const text = buffer.toString(encoding).replace(/^﻿/, "");

  return { text, encoding };
}

function encodeLayoutText(text: string, encoding: TextEncoding): Buffer {
  return Buffer.from(text, encoding);
}

function getBaseSection(layout: any): any {
  if (!Array.isArray(layout?.sections) || layout.sections.length === 0) {
    throw new InvalidIconBasePbitError("Invalid icon-library-base.pbit: Report/Layout has no report page.");
  }

  const section = layout.sections[0];
  if (!Array.isArray(section.visualContainers)) {
    throw new InvalidIconBasePbitError("Invalid icon-library-base.pbit: base page has no visualContainers array.");
  }

  return section;
}

function findPlaceholderImageVisual(section: any): any {
  for (const visual of section.visualContainers || []) {
    const config = parseVisualConfig(visual);
    if (config?.singleVisual?.visualType === "image") return visual;
  }

  throw new InvalidIconBasePbitError("Invalid icon-library-base.pbit: no genuine Image visual placeholder found.");
}

function parseVisualConfig(visual: any): any {
  if (typeof visual?.config !== "string") return null;
  try {
    return JSON.parse(visual.config);
  } catch {
    return null;
  }
}

/** Derives uniform square icon tiles from the page size, 13x7 grid and outer
 *  margin — every tile is centred within its grid cell so spacing stays even
 *  in both directions even when the page isn't a perfect 13:7 ratio. */
export function computeGridGeometry(pageWidth: number, pageHeight: number): GridGeometry {
  const usableW = pageWidth - MARGIN * 2;
  const usableH = pageHeight - MARGIN * 2;
  const cellW = usableW / GRID_COLS;
  const cellH = usableH / GRID_ROWS;
  const boxSize = Math.max(8, Math.min(cellW, cellH) - GUTTER);
  return { cellW, cellH, boxSize };
}

export function cellPosition(indexOnPage: number, geo: GridGeometry): CellPosition {
  const col = indexOnPage % GRID_COLS;
  const row = Math.floor(indexOnPage / GRID_COLS);
  const x = MARGIN + col * geo.cellW + (geo.cellW - geo.boxSize) / 2;
  const y = MARGIN + row * geo.cellH + (geo.cellH - geo.boxSize) / 2;
  return {
    x: round2(x),
    y: round2(y),
    width: round2(geo.boxSize),
    height: round2(geo.boxSize),
    tabOrder: indexOnPage,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildPageSection(sourceSection: any, pageIndex: number, buildSeed: string): any {
  const section = deepClone(sourceSection);
  const pageNumber = pageIndex + 1;

  section.name = makePageSectionName(buildSeed, pageIndex);
  section.displayName = `Icon Library ${String(pageNumber).padStart(2, "0")}`;
  section.ordinal = pageIndex;
  section.visualContainers = [];

  return section;
}

function makePageSectionName(buildSeed: string, pageIndex: number): string {
  return (
    "ReportSection" +
    crypto.createHash("sha1").update(`${buildSeed}:icon-page:${pageIndex}`).digest("hex").slice(0, 12)
  );
}

function makeResourceItemName(icon: IconExportSource, buildSeed: string, globalIndex: number): string {
  const slug = slugifyForFile(icon.name);
  const hash = crypto.createHash("sha1").update(`${buildSeed}:${icon.id}:${globalIndex}`).digest("hex").slice(0, 12);
  return `${slug}-${hash}.svg`;
}

function slugifyForFile(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "icon";
}

/**
 * Deep-clones the base's genuine Image visual container and only mutates the
 * fields needed for this slot: position/size/tab order, the visual's unique
 * name, and the image resource reference. Every other property the real
 * Power BI-authored visual carries (revision metadata, vcObjects, etc.) is
 * preserved untouched, matching createClonedVisual in the Layout Builder
 * exporter.
 */
function createClonedImageVisual(
  template: any,
  pos: CellPosition,
  icon: IconExportSource,
  resourceItemName: string,
  buildSeed: string,
  globalIndex: number,
): any {
  const visual = deepClone(template);
  const config = parseVisualConfig(visual);

  if (!config?.singleVisual || !Array.isArray(config.layouts) || !config.layouts[0]?.position) {
    throw new InvalidIconBasePbitError("Invalid icon-library-base.pbit: placeholder visual config is malformed.");
  }

  const visualName = makeVisualName(buildSeed, globalIndex);

  visual.x = pos.x;
  visual.y = pos.y;
  visual.z = 0;
  visual.width = pos.width;
  visual.height = pos.height;

  if (typeof visual.name === "string") {
    visual.name = visualName;
  }

  config.name = visualName;

  for (const layoutEntry of config.layouts as any[]) {
    if (!layoutEntry?.position) continue;
    layoutEntry.position.x = pos.x;
    layoutEntry.position.y = pos.y;
    layoutEntry.position.z = 0;
    layoutEntry.position.width = pos.width;
    layoutEntry.position.height = pos.height;
    layoutEntry.position.tabOrder = pos.tabOrder;
  }

  const sourceImage = config.singleVisual.objects?.image?.[0]?.properties?.sourceFile?.image;
  if (sourceImage) {
    sourceImage.name = { expr: { Literal: { Value: `'${icon.name.replace(/'/g, "\\'")}.svg'` } } };
    sourceImage.url = {
      expr: { ResourcePackageItem: { PackageName: "RegisteredResources", PackageType: 1, ItemName: resourceItemName } },
    };
  } else {
    throw new InvalidIconBasePbitError(
      "Invalid icon-library-base.pbit: placeholder visual does not use the expected image.sourceFile.image schema.",
    );
  }

  visual.config = JSON.stringify(config);

  return visual;
}

function makeVisualName(buildSeed: string, globalIndex: number): string {
  return crypto.createHash("sha1").update(`${buildSeed}:icon-visual:${globalIndex}`).digest("hex").slice(0, 20);
}

function removeOldRegisteredResources(zip: AdmZip): void {
  const entries = zip.getEntries().filter((entry) => entry.entryName.startsWith(REGISTERED_RESOURCES_DIR));
  for (const entry of entries) {
    zip.deleteFile(entry.entryName);
  }
}

function removeStaleSecurityBindings(zip: AdmZip): void {
  const securityBindings = zip.getEntry(SECURITY_BINDINGS_PATH);
  if (!securityBindings) return;
  zip.deleteFile(SECURITY_BINDINGS_PATH);
}

function cleanLayoutConfig(layout: any): void {
  if (typeof layout?.config !== "string") return;

  try {
    const config = JSON.parse(layout.config);
    config.activeSectionIndex = 0;
    if (Array.isArray(config.bookmarks)) {
      delete config.bookmarks;
    }
    layout.config = JSON.stringify(config);
  } catch {
    // Non-fatal: leave the original config string untouched if it can't be parsed.
  }
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
