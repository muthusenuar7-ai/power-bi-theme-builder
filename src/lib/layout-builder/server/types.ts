export type ZoneType = "title" | "kpi" | "slicer" | "chart" | "logo" | string;

export interface LayoutZone {
  id: string;
  type: ZoneType;
  visualType?: string;
  text?: string;
  titleFontSize?: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fields?: string[];
}

export interface LayoutPayload {
  canvasWidth: number;
  canvasHeight: number;
  reportName?: string;
  generatedAt?: string;
  zones: LayoutZone[];
}

export interface NormalizedZone {
  id: string;
  type: ZoneType;
  visualType?: string;
  /** Icon Studio icon id for image zones (KPI/title icon visuals). */
  iconId?: string;
  text?: string;
  /** Font size (pt) for the title textbox. Only present on title zones. */
  titleFontSize?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Multi-page types ──────────────────────────────────────────────────────

export interface NormalizedPage {
  pageIndex: number;
  pageName: string;
  canvasWidth: number;
  canvasHeight: number;
  zones: NormalizedZone[];
}

export interface NormalizedMultiPage {
  pages: NormalizedPage[];
}
