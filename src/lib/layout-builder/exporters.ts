import type { LayoutExport, LayoutState, MultiPageExport, ReportState, Zone } from "./types/layout";
import type { IconBundle } from "@/store/integrationWorkspaceStore";

/**
 * Same-origin Next.js API route for PBIT generation (replaces the source
 * project's Express `/api/export/pbit`). Single- and multi-page payloads both
 * POST here; the route distinguishes them by shape.
 */
const PBIT_EXPORT_ENDPOINT = "/api/layout-builder/export/pbit";
const COMBINED_PBIT_EXPORT_ENDPOINT = "/api/layout-builder/export/combined-pbit";

export function buildLayoutExport(state: LayoutState, zones: Zone[]): LayoutExport {
  return {
    canvasWidth: state.canvasWidth,
    canvasHeight: state.canvasHeight,
    reportName: state.reportName,
    generatedAt: new Date().toISOString(),
    zones: zones.map((zone) => ({
      id: zone.id,
      type: zone.type,
      visualType: zone.visualType,
      parentZoneId: zone.parentZoneId,
      splitType: zone.splitType,
      isChildZone: zone.isChildZone,
      childIndex: zone.childIndex,
      text: zone.type === "title" ? zone.label || state.reportName : undefined,
      titleFontSize: zone.type === "title" ? (state.titleFontSize ?? 28) : undefined,
      position: {
        x: zone.x,
        y: zone.y,
        width: zone.w,
        height: zone.h,
      },
      fields: zone.fields || [],
    })),
  };
}

export function buildMultiPageExport(
  reportState: ReportState,
  resolvedZonesPerPage: Array<{ pageId: string; zones: Zone[] }>,
): MultiPageExport {
  const generatedAt = new Date().toISOString();
  return {
    generatedAt,
    pages: reportState.pages.map((page, pageIndex) => {
      const entry = resolvedZonesPerPage.find((e) => e.pageId === page.id);
      const zones = entry?.zones ?? [];
      return {
        pageIndex,
        pageName: page.name,
        canvasWidth: page.layoutState.canvasWidth,
        canvasHeight: page.layoutState.canvasHeight,
        zones: zones.map((zone) => ({
          id: zone.id,
          type: zone.type,
          visualType: zone.visualType,
          parentZoneId: zone.parentZoneId,
          splitType: zone.splitType,
          isChildZone: zone.isChildZone,
          childIndex: zone.childIndex,
          text: zone.type === "title" ? zone.label || page.name : undefined,
          titleFontSize: zone.type === "title" ? (page.layoutState.titleFontSize ?? 28) : undefined,
          position: { x: zone.x, y: zone.y, width: zone.w, height: zone.h },
          fields: zone.fields || [],
        })),
      };
    }),
  };
}

export function buildCsv(zones: Zone[]): string {
  return [
    "Zone,Type,X,Y,Width,Height",
    ...zones.map((zone) =>
      [
        csvCell(zone.id),
        csvCell(zone.type),
        zone.x,
        zone.y,
        zone.w,
        zone.h,
      ].join(","),
    ),
  ].join("\r\n");
}

export function buildMultiPageCsv(
  reportState: ReportState,
  resolvedZonesPerPage: Array<{ pageId: string; zones: Zone[] }>,
): string {
  const rows: string[] = ["Page,PageName,Zone,Type,VisualType,X,Y,Width,Height"];
  reportState.pages.forEach((page, pageIndex) => {
    const entry = resolvedZonesPerPage.find((e) => e.pageId === page.id);
    const zones = entry?.zones ?? [];
    for (const zone of zones) {
      rows.push(
        [
          pageIndex + 1,
          csvCell(page.name),
          csvCell(zone.id),
          csvCell(zone.type),
          csvCell(zone.visualType),
          zone.x,
          zone.y,
          zone.w,
          zone.h,
        ].join(","),
      );
    }
  });
  return rows.join("\r\n");
}

export function downloadBlob(data: BlobPart, filename: string, type: string): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.error || `Export failed with HTTP ${response.status}.`;
  } catch {
    return `Export failed with HTTP ${response.status}.`;
  }
}

export async function exportPbit(layout: LayoutExport): Promise<void> {
  const response = await fetch(PBIT_EXPORT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(layout),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const blob = await response.blob();
  downloadBlob(blob, "Layout.pbit", "application/octet-stream");
}

export async function exportMultiPagePbit(
  reportState: ReportState,
  resolvedZonesPerPage: Array<{ pageId: string; zones: Zone[] }>,
): Promise<void> {
  const payload = {
    pages: reportState.pages.map((page, pageIndex) => {
      const entry = resolvedZonesPerPage.find((e) => e.pageId === page.id);
      const zones = entry?.zones ?? [];
      return {
        pageIndex,
        pageName: page.name,
        canvasWidth: page.layoutState.canvasWidth,
        canvasHeight: page.layoutState.canvasHeight,
        zones: zones.map((zone) => ({
          id: zone.id,
          type: zone.type,
          visualType: zone.visualType,
          parentZoneId: zone.parentZoneId,
          splitType: zone.splitType,
          isChildZone: zone.isChildZone,
          childIndex: zone.childIndex,
          text: zone.type === "title" ? zone.label || page.name : undefined,
          titleFontSize: zone.type === "title" ? (page.layoutState.titleFontSize ?? 28) : undefined,
          position: { x: zone.x, y: zone.y, width: zone.w, height: zone.h },
          fields: zone.fields || [],
        })),
      };
    }),
  };

  const response = await fetch(PBIT_EXPORT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const blob = await response.blob();
  downloadBlob(blob, "Layout.pbit", "application/octet-stream");
}

/**
 * Combined "Layout + Icons" export — same Layout Builder pages payload as
 * exportMultiPagePbit, plus an optional icon bundle and theme JSON. Returns
 * the total page count (layout pages + appended icon pages) reported by the
 * server, for the caller's confirmation toast.
 */
export async function exportCombinedPbit(
  reportState: ReportState,
  resolvedZonesPerPage: Array<{ pageId: string; zones: Zone[] }>,
  options: { iconBundle: IconBundle; themeJSON?: object },
): Promise<number> {
  const pages = reportState.pages.map((page, pageIndex) => {
    const entry = resolvedZonesPerPage.find((e) => e.pageId === page.id);
    const zones = entry?.zones ?? [];
    return {
      pageIndex,
      pageName: page.name,
      canvasWidth: page.layoutState.canvasWidth,
      canvasHeight: page.layoutState.canvasHeight,
      zones: zones.map((zone) => ({
        id: zone.id,
        type: zone.type,
        visualType: zone.visualType,
        parentZoneId: zone.parentZoneId,
        splitType: zone.splitType,
        isChildZone: zone.isChildZone,
        childIndex: zone.childIndex,
        iconId: zone.iconId,
        text: zone.type === "title" ? zone.label || page.name : undefined,
        titleFontSize: zone.type === "title" ? (page.layoutState.titleFontSize ?? 28) : undefined,
        position: { x: zone.x, y: zone.y, width: zone.w, height: zone.h },
        fields: zone.fields || [],
      })),
    };
  });

  const response = await fetch(COMBINED_PBIT_EXPORT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pages,
      iconBundle: options.iconBundle,
      themeJSON: options.themeJSON,
      options: { includeIcons: true, includeTheme: Boolean(options.themeJSON) },
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const totalPages = Number(response.headers.get("X-Total-Page-Count")) || reportState.pages.length;
  const blob = await response.blob();
  downloadBlob(blob, "Layout-Theme-Icons.pbit", "application/octet-stream");
  return totalPages;
}

function csvCell(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
