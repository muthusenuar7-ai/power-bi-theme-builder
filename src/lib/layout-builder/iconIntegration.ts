/**
 * Icon Studio → Layout Builder integration (Phase 3/4).
 *
 * - Stable icon-bundle hashing (same bundle → generated icon pages are reused,
 *   changed bundle → only previously generated icon pages are replaced).
 * - Generated "Icons NN" pages: 13×7 grid, max 91 icons/page, each icon an
 *   independent image zone (mirrors the combined PBIT exporter's grid).
 * - KPI/title icon assignment geometry: given a KPI zone and its icon
 *   assignment, computes the inner icon box + the adjusted KPI visual box.
 *   The KPI zone's OUTER bounds are never altered — only the internal visual
 *   is narrowed to make room for the independent Image visual.
 */
import type { IconBundle } from "@/store/integrationWorkspaceStore";
import type { ReportPage, ReportState, Zone } from "./types/layout";
import { DEFAULT_LAYOUT_STATE } from "./layoutEngine";

export const ICON_GRID_COLS = 13;
export const ICON_GRID_ROWS = 7;
export const ICON_PAGE_CAPACITY = ICON_GRID_COLS * ICON_GRID_ROWS; // 91
const ICON_PAGE_WIDTH = 1280;
const ICON_PAGE_HEIGHT = 720;
const ICON_MARGIN = 20;
const ICON_GUTTER = 8;

export interface KpiIconAssignment {
  iconId: string;
  placement: "left" | "right";
  /** Icon box size in canvas px. */
  size: number;
  /** Gap between icon box and KPI content in canvas px. */
  gap: number;
  customizationSnapshot?: Record<string, unknown>;
}

export interface TitleIconAssignment {
  iconId: string;
  placement: "leading" | "trailing";
}

export const DEFAULT_KPI_ICON_SIZE = 36;
export const DEFAULT_KPI_ICON_GAP = 10;
/** Share of the KPI card width reserved for the icon area (20–25% band). */
export const KPI_ICON_AREA_RATIO = 0.22;

/** Stable hash of the bundle content (ids in order + shared customization). */
export function computeIconBundleHash(bundle: IconBundle): string {
  const uniqueIds = dedupePreservingOrder(bundle.iconIds);
  const source = JSON.stringify({ ids: uniqueIds, customization: bundle.customization });
  let h = 5381;
  for (let i = 0; i < source.length; i++) h = ((h << 5) + h + source.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function dedupePreservingOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

/** Relative render-endpoint URL for an icon with the bundle's customization —
 *  used for in-builder thumbnails (the endpoint preserves fixed colors). */
export function iconThumbnailUrl(iconId: string, bundle: IconBundle | null): string {
  const params = new URLSearchParams();
  const c = bundle?.customization;
  if (c) {
    if (c.colorMode === "mono") {
      params.set("mode", "mono");
      params.set("color", c.iconColor);
      params.set("weight", c.weight);
    }
    if (c.backgroundMode === "solid" && c.solidBackgroundColor !== "transparent") {
      params.set("bg", "solid");
      params.set("bgColor", c.solidBackgroundColor);
      params.set("bgOpacity", String(c.bgOpacity));
      params.set("shape", c.bgShape);
    }
  }
  const query = params.toString();
  return `/api/icons/render/${encodeURIComponent(iconId)}.svg${query ? `?${query}` : ""}`;
}

// ─── Generated icon pages ────────────────────────────────────────────────────

let iconPageCounter = 0;
function generateIconPageId(): string {
  iconPageCounter += 1;
  return `iconpage_${Date.now()}_${iconPageCounter}`;
}

function iconCellPosition(indexOnPage: number): { x: number; y: number; w: number; h: number } {
  const cellW = Math.floor((ICON_PAGE_WIDTH - ICON_MARGIN * 2 - ICON_GUTTER * (ICON_GRID_COLS - 1)) / ICON_GRID_COLS);
  const cellH = Math.floor((ICON_PAGE_HEIGHT - ICON_MARGIN * 2 - ICON_GUTTER * (ICON_GRID_ROWS - 1)) / ICON_GRID_ROWS);
  const col = indexOnPage % ICON_GRID_COLS;
  const row = Math.floor(indexOnPage / ICON_GRID_COLS);
  return {
    x: ICON_MARGIN + col * (cellW + ICON_GUTTER),
    y: ICON_MARGIN + row * (cellH + ICON_GUTTER),
    w: cellW,
    h: cellH,
  };
}

function buildIconPages(
  bundle: IconBundle,
  hash: string,
  iconNames: Record<string, string>,
): ReportPage[] {
  const uniqueIds = dedupePreservingOrder(bundle.iconIds);
  const pageCount = Math.max(1, Math.ceil(uniqueIds.length / ICON_PAGE_CAPACITY));
  const pages: ReportPage[] = [];

  for (let p = 0; p < pageCount; p++) {
    const name = `Icons ${String(p + 1).padStart(2, "0")}`;
    const idsOnPage = uniqueIds.slice(p * ICON_PAGE_CAPACITY, (p + 1) * ICON_PAGE_CAPACITY);
    const frozenZones: Zone[] = idsOnPage.map((iconId, i) => {
      const cell = iconCellPosition(i);
      return {
        id: `iconzone_${p + 1}_${i + 1}`,
        type: "chart",
        visualType: "image",
        visualId: "image",
        x: cell.x,
        y: cell.y,
        w: cell.w,
        h: cell.h,
        fields: [],
        label: iconNames[iconId] ?? iconId,
        iconId,
      };
    });

    pages.push({
      id: generateIconPageId(),
      name,
      layoutState: {
        ...DEFAULT_LAYOUT_STATE,
        canvasWidth: ICON_PAGE_WIDTH,
        canvasHeight: ICON_PAGE_HEIGHT,
        reportName: name,
        titlePos: "none",
        kpiCount: 0,
        slicerCount: 0,
        chartCount: 1,
        logo: false,
      },
      visualAssignments: {},
      splitRecipes: [],
      frozenZones,
      // Hide the single base chart zone the minimal layoutState produces.
      hiddenZoneIds: ["chart_0"],
      generated: "icon-library",
      iconBundleHash: hash,
    });
  }
  return pages;
}

/**
 * Reconciles generated icon pages against the current bundle:
 *  - no bundle → generated pages are removed
 *  - same bundle hash → state returned unchanged (no duplicate pages)
 *  - changed bundle → ONLY previously generated icon pages are replaced;
 *    user-created pages, their configuration and assignments are untouched.
 * New icon pages are appended after all existing pages.
 */
export function reconcileIconPages(
  state: ReportState,
  bundle: IconBundle | null,
  iconNames: Record<string, string>,
): ReportState {
  const generatedPages = state.pages.filter((p) => p.generated === "icon-library");
  const userPages = state.pages.filter((p) => p.generated !== "icon-library");

  if (!bundle || bundle.iconIds.length === 0) {
    if (generatedPages.length === 0) return state;
    const activeRemoved = generatedPages.some((p) => p.id === state.activePageId);
    return {
      pages: userPages,
      activePageId: activeRemoved ? (userPages[0]?.id ?? state.activePageId) : state.activePageId,
    };
  }

  const hash = computeIconBundleHash(bundle);
  if (generatedPages.length > 0 && generatedPages.every((p) => p.iconBundleHash === hash)) {
    return state; // same bundle — do not add duplicate pages
  }

  const newIconPages = buildIconPages(bundle, hash, iconNames);
  const activeRemoved = generatedPages.some((p) => p.id === state.activePageId);
  return {
    pages: [...userPages, ...newIconPages],
    activePageId: activeRemoved ? newIconPages[0].id : state.activePageId,
  };
}

// ─── KPI / title icon geometry ───────────────────────────────────────────────

export interface IconZonePlacement {
  /** Independent Image visual box (inside the host zone). */
  iconBox: { x: number; y: number; w: number; h: number };
  /** Adjusted host visual box (narrowed to make room; outer zone unchanged). */
  hostBox: { x: number; y: number; w: number; h: number };
}

/**
 * Computes the icon box + adjusted KPI visual box for a KPI icon assignment.
 * The card is split horizontally: a dedicated icon area (~22% of the card
 * width, see KPI_ICON_AREA_RATIO) on the chosen side, an internal gap, and
 * the KPI content area (~75–80%). The icon is centered inside its area and
 * auto-shrinks on narrow or short cards so it can never reach the content.
 */
export function computeKpiIconPlacement(zone: Zone, assignment: KpiIconAssignment): IconZonePlacement {
  const pad = 8;
  const iconAreaW = Math.max(24, Math.round(zone.w * KPI_ICON_AREA_RATIO));
  const gap = Math.max(4, Math.min(assignment.gap, Math.floor(zone.w * 0.1)));
  const maxByHeight = zone.h - pad * 2;
  const maxByArea = iconAreaW - pad;
  const size = Math.max(12, Math.min(assignment.size, maxByHeight, maxByArea));
  const y = zone.y + Math.round((zone.h - size) / 2);

  if (assignment.placement === "left") {
    const iconBox = { x: zone.x + Math.round((iconAreaW - size) / 2), y, w: size, h: size };
    const hostX = zone.x + iconAreaW + gap;
    return { iconBox, hostBox: { x: hostX, y: zone.y, w: zone.x + zone.w - hostX, h: zone.h } };
  }
  const iconAreaX = zone.x + zone.w - iconAreaW;
  const iconBox = { x: iconAreaX + Math.round((iconAreaW - size) / 2), y, w: size, h: size };
  return { iconBox, hostBox: { x: zone.x, y: zone.y, w: iconAreaX - gap - zone.x, h: zone.h } };
}

/** Title icons: a square box on the leading/trailing edge, sized to the bar. */
export function computeTitleIconPlacement(zone: Zone, assignment: TitleIconAssignment): IconZonePlacement {
  const pad = 10;
  const size = Math.max(16, Math.min(zone.h - pad * 2, 48));
  const y = zone.y + Math.round((zone.h - size) / 2);
  if (assignment.placement === "leading") {
    const iconBox = { x: zone.x + pad, y, w: size, h: size };
    const hostX = iconBox.x + size + pad;
    return { iconBox, hostBox: { x: hostX, y: zone.y, w: zone.x + zone.w - hostX, h: zone.h } };
  }
  const iconBox = { x: zone.x + zone.w - pad - size, y, w: size, h: size };
  return { iconBox, hostBox: { x: zone.x, y: zone.y, w: iconBox.x - pad - zone.x, h: zone.h } };
}

/**
 * Export-time zone expansion: replaces KPI/title zones carrying icon
 * assignments with (adjusted host zone + independent image zone). Zones
 * without assignments pass through untouched. Used by the combined PBIT
 * payload and the canvas preview so both stay in lock-step.
 */
export function expandZonesWithIcons(
  zones: Zone[],
  page: Pick<ReportPage, "kpiIcons" | "titleIcon">,
): Zone[] {
  const out: Zone[] = [];
  for (const zone of zones) {
    const kpiIcon = zone.type === "kpi" ? page.kpiIcons?.[zone.id] : undefined;
    const titleIcon = zone.type === "title" ? page.titleIcon : undefined;

    if (kpiIcon) {
      const { iconBox, hostBox } = computeKpiIconPlacement(zone, kpiIcon);
      out.push({ ...zone, x: hostBox.x, y: hostBox.y, w: Math.max(1, hostBox.w), h: hostBox.h });
      out.push({
        id: `${zone.id}_icon`,
        type: "chart",
        visualType: "image",
        visualId: "image",
        x: iconBox.x,
        y: iconBox.y,
        w: iconBox.w,
        h: iconBox.h,
        fields: [],
        iconId: kpiIcon.iconId,
      });
      continue;
    }

    if (titleIcon?.iconId) {
      const { iconBox, hostBox } = computeTitleIconPlacement(zone, titleIcon);
      out.push({ ...zone, x: hostBox.x, y: hostBox.y, w: Math.max(1, hostBox.w), h: hostBox.h });
      out.push({
        id: `${zone.id}_icon`,
        type: "chart",
        visualType: "image",
        visualId: "image",
        x: iconBox.x,
        y: iconBox.y,
        w: iconBox.w,
        h: iconBox.h,
        fields: [],
        iconId: titleIcon.iconId,
      });
      continue;
    }

    out.push(zone);
  }
  return out;
}
