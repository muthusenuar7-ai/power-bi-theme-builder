import type { LayoutPayload, NormalizedMultiPage, NormalizedPage, NormalizedZone } from "./types";

export function normalizeLayoutPayload(payload: unknown): {
  canvasWidth: number;
  canvasHeight: number;
  reportName: string;
  zones: NormalizedZone[];
} {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid layout payload: expected JSON object.");
  }

  const layout = payload as Partial<LayoutPayload>;
  const canvasWidth = Number(layout.canvasWidth);
  const canvasHeight = Number(layout.canvasHeight);
  const reportName = typeof layout.reportName === "string" ? layout.reportName.trim() : "";

  if (!Number.isFinite(canvasWidth) || canvasWidth <= 0) {
    throw new Error("Invalid layout payload: canvasWidth must be a positive number.");
  }

  if (!Number.isFinite(canvasHeight) || canvasHeight <= 0) {
    throw new Error("Invalid layout payload: canvasHeight must be a positive number.");
  }

  if (!Array.isArray(layout.zones)) {
    throw new Error("Invalid layout payload: zones must be an array.");
  }

  const zones = layout.zones.map((zone, index) => normalizeZone(zone, index));

  return { canvasWidth, canvasHeight, reportName, zones };
}

export function isMultiPagePayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  return Array.isArray((payload as Record<string, unknown>).pages);
}

export function normalizeMultiPagePayload(payload: unknown): NormalizedMultiPage {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid multi-page payload: expected JSON object.");
  }

  const body = payload as Record<string, unknown>;

  if (!Array.isArray(body.pages) || body.pages.length === 0) {
    throw new Error("Invalid multi-page payload: pages must be a non-empty array.");
  }

  if (body.pages.length > 50) {
    throw new Error("Invalid multi-page payload: maximum 50 pages allowed.");
  }

  const pages: NormalizedPage[] = body.pages.map((rawPage: unknown, pageIdx: number) => {
    if (!rawPage || typeof rawPage !== "object") {
      throw new Error(`Invalid multi-page payload: page ${pageIdx + 1} is not an object.`);
    }

    const page = rawPage as Record<string, unknown>;
    const pageIndex = Number.isFinite(Number(page.pageIndex)) ? Number(page.pageIndex) : pageIdx;
    const pageName = typeof page.pageName === "string" && page.pageName.trim()
      ? page.pageName.trim()
      : `Page ${pageIdx + 1}`;

    const canvasWidth = Number(page.canvasWidth);
    const canvasHeight = Number(page.canvasHeight);

    if (!Number.isFinite(canvasWidth) || canvasWidth <= 0) {
      throw new Error(`Invalid multi-page payload: page ${pageIdx + 1} has invalid canvasWidth.`);
    }
    if (!Number.isFinite(canvasHeight) || canvasHeight <= 0) {
      throw new Error(`Invalid multi-page payload: page ${pageIdx + 1} has invalid canvasHeight.`);
    }

    if (!Array.isArray(page.zones)) {
      throw new Error(`Invalid multi-page payload: page ${pageIdx + 1} zones must be an array.`);
    }

    const zones: NormalizedZone[] = page.zones.map((zone: unknown, zoneIdx: number) =>
      normalizeZone(zone, zoneIdx),
    );

    return { pageIndex, pageName, canvasWidth, canvasHeight, zones };
  });

  return { pages };
}

function normalizeZone(zone: unknown, index: number): NormalizedZone {
  if (!zone || typeof zone !== "object") {
    throw new Error(`Invalid layout payload: zone ${index + 1} is not an object.`);
  }

  const z = zone as Record<string, unknown>;
  const position = z.position as Record<string, unknown> | undefined;

  const x = Number(position?.x ?? z.x);
  const y = Number(position?.y ?? z.y);
  const width = Number(position?.width ?? z.width);
  const height = Number(position?.height ?? z.height);

  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    throw new Error(`Invalid layout payload: zone ${index + 1} has invalid position values.`);
  }

  const titleFontSize =
    typeof z.titleFontSize === "number" && Number.isFinite(z.titleFontSize) && z.titleFontSize > 0
      ? z.titleFontSize
      : undefined;

  return {
    id: String(z.id || `zone_${index + 1}`),
    type: String(z.type || "chart"),
    visualType: typeof z.visualType === "string" ? z.visualType : undefined,
    iconId: typeof z.iconId === "string" && z.iconId ? z.iconId : undefined,
    text: typeof z.text === "string" ? z.text : undefined,
    titleFontSize,
    x,
    y,
    width,
    height,
  };
}
