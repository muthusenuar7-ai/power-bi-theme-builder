import type { LayoutState, SplitBounds, SplitType, Zone } from "./types/layout";
import { getDefaultVisualType } from "./visualCatalog";

const DEFAULT_GAP = 10;
export const DEFAULT_SLICER_TOP_HEIGHT = 54;
export const DEFAULT_SLICER_SIDE_WIDTH = 200;

export const DEFAULT_LAYOUT_STATE: LayoutState = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  reportName: "Executive Dashboard",
  titlePos: "top",
  titleLayout: "full",
  titleHeight: 64,
  titleWidth: 180,
  titleFontSize: 28,
  kpiCount: 4,
  kpiArrangement: "auto",
  slicerCount: 3,
  slicerPos: "left",
  slicerAboveKpi: false,
  slicerTopHeight: DEFAULT_SLICER_TOP_HEIGHT,
  slicerSideWidth: DEFAULT_SLICER_SIDE_WIDTH,
  chartCount: 4,
  chartLayout: "2+2",
  logo: false,
  logoPos: "top-left",
  zoneGap: 10,
  kpiHeight: 110,
};

export const SPLIT_OPTIONS: Array<{ value: SplitType; label: string }> = [
  { value: "none", label: "No Split" },
  { value: "equal", label: "Equal Split" },
  { value: "prop-50-25-25", label: "50 / 25 / 25" },
  { value: "prop-25-50-25", label: "25 / 50 / 25" },
  { value: "prop-25-25-50", label: "25 / 25 / 50" },
  { value: "prop-50-50", label: "50 / 50" },
  { value: "prop-25-75", label: "25 / 75" },
  { value: "prop-75-25", label: "75 / 25" },
  { value: "three-columns", label: "3 Equal Columns" },
  { value: "three-rows", label: "3 Equal Rows" },
  { value: "two-columns", label: "2 Columns" },
  { value: "two-rows", label: "2 Rows" },
  { value: "four-grid", label: "4 Equal Grid" },
  { value: "large-left-two-small", label: "Large L + 2 Small" },
  { value: "two-small-large-right", label: "2 Small + Large R" },
  { value: "large-top-two-small-bottom", label: "Large Top + 2 Small" },
  { value: "two-small-top-large-bottom", label: "2 Small + Large Bottom" },
  { value: "prop-40-30-30", label: "40 / 30 / 30" },
  { value: "prop-30-40-30", label: "30 / 40 / 30" },
  { value: "prop-30-30-40", label: "30 / 30 / 40" },
];

/** Minimum title height for a given font size (font + vertical padding). */
export function minTitleHeightForFontSize(fontSize: number): number {
  return fontSize + 36;
}

// ─── Arrangement options ───────────────────────────────────────────────────

export function getArrangementOptions(n: number): Array<{ value: string; label: string }> {
  const count = Math.max(1, n);
  const options: Array<{ value: string; label: string }> = [{ value: "auto", label: "Auto Grid" }];

  if (count === 1) return [{ value: "1", label: "1 Full" }, ...options];

  options.unshift({ value: String(count), label: `${count} in a Row` });
  options.push({ value: repeatRows([1], count), label: `${count} Stacked` });

  for (let rows = 2; rows <= Math.min(4, count); rows += 1) {
    const pattern = balancedPattern(count, rows);
    options.push({ value: pattern.join("+"), label: `${pattern.join(" + ")} Rows` });
  }

  if (count >= 5) {
    const firstHeavy = splitPattern(count, Math.ceil(count / 2));
    const secondHeavy = [...firstHeavy].reverse();
    options.push({ value: firstHeavy.join("+"), label: `${firstHeavy.join(" + ")} Rows` });
    options.push({ value: secondHeavy.join("+"), label: `${secondHeavy.join(" + ")} Rows` });
  }

  // ── Count-specific advanced arrangements ───────────────────────────────

  if (count === 2) {
    options.push({ value: "prop:60:40", label: "60/40" });
    options.push({ value: "prop:40:60", label: "40/60" });
  }

  if (count === 3) {
    options.push({ value: "prop:50:25:25", label: "50/25/25" });
    options.push({ value: "prop:25:25:50", label: "25/25/50" });
    options.push({ value: "prop:25:50:25", label: "25/50/25" });
    options.push({ value: "tall:1+2", label: "1 Large + 2 Small" });
    options.push({ value: "tall:2+1", label: "2 Small + 1 Large" });
  }

  if (count === 4) {
    options.push({ value: "grid:2x2", label: "2×2 Grid" });
    options.push({ value: "tall:1+3", label: "1 Large + 3 Small" });
    options.push({ value: "tall:3+1", label: "3 Small + 1 Large" });
  }

  if (count === 6) {
    options.push({ value: "grid:3x2", label: "3×2 Grid" });
    options.push({ value: "grid:2x3", label: "2×3 Grid" });
  }

  return uniqueOptions(options);
}

// ─── Zone computation ──────────────────────────────────────────────────────

export function computeZones(state: LayoutState): Zone[] {
  const W = state.canvasWidth;
  const H = state.canvasHeight;
  const gap = state.zoneGap ?? DEFAULT_GAP;
  // Outer edge padding tracks the same value as inner gap so the spacing
  // control pushes zones away from all canvas edges AND from each other.
  const pad = gap;
  const newZones: Zone[] = [];
  let zIdx = 0;
  let yOff = pad;
  let xOff = pad;
  let rightReserve = 0;

  const uid = (prefix: string) => `${prefix}_${zIdx++}`;
  const addZone = (zone: Omit<Zone, "id" | "fields"> & { idPrefix: string }) => {
    newZones.push({
      id: uid(zone.idPrefix),
      type: zone.type,
      visualType: zone.visualType,
      visualId: zone.visualId,
      x: Math.round(zone.x),
      y: Math.round(zone.y),
      w: Math.max(1, Math.round(zone.w)),
      h: Math.max(1, Math.round(zone.h)),
      fields: [],
      label: zone.label,
    });
  };

  // Shared top-row modes only apply when the title is at the top; Left/Right/
  // None title positions safely fall back to full-width behaviour.
  const titleLayout = state.titlePos === "top" ? (state.titleLayout ?? "full") : "full";
  const titleShareKpis = titleLayout === "title-kpis" && state.kpiCount > 0;
  const titleShareSlicers = titleLayout === "title-slicers" && state.slicerCount > 0;
  const titleShared = titleShareKpis || titleShareSlicers;

  if (state.titlePos === "top") {
    const titleH = state.titleHeight ?? 64;
    // Recommended leading share ≈ 32% of the available width when sharing.
    const fullW = W - pad * 2;
    const titleW = titleShared ? Math.round(fullW * 0.32) : fullW;
    addZone({
      idPrefix: "title",
      type: "title",
      visualType: getDefaultVisualType("title"),
      visualId: "pageTitle",
      x: xOff,
      y: yOff,
      w: titleW,
      h: titleH,
      label: state.reportName || "Dashboard",
    });

    if (titleShared) {
      // Remaining top-row width is evenly distributed to KPI cards or slicers.
      const rowX = xOff + titleW + gap;
      const rowW = fullW - titleW - gap;
      const count = titleShareKpis ? state.kpiCount : state.slicerCount;
      const itemW = Math.floor((rowW - (count - 1) * gap) / count);
      for (let i = 0; i < count; i += 1) {
        addZone({
          idPrefix: titleShareKpis ? "card" : "slicer",
          type: titleShareKpis ? "kpi" : "slicer",
          visualType: getDefaultVisualType(titleShareKpis ? "kpi" : "slicer"),
          visualId: titleShareKpis ? "card" : "slicer",
          x: rowX + i * (itemW + gap),
          y: yOff,
          w: itemW,
          h: titleH,
        });
      }
    }
    yOff += titleH + gap;
  } else if (state.titlePos === "left") {
    const titleW = state.titleWidth ?? 180;
    addZone({
      idPrefix: "title",
      type: "title",
      visualType: getDefaultVisualType("title"),
      visualId: "pageTitle",
      x: xOff,
      y: yOff,
      w: titleW - gap,
      h: H - pad * 2,
      label: state.reportName || "Dashboard",
    });
    xOff += titleW;
  } else if (state.titlePos === "right") {
    const titleW = state.titleWidth ?? 180;
    addZone({
      idPrefix: "title",
      type: "title",
      visualType: getDefaultVisualType("title"),
      visualId: "pageTitle",
      x: W - pad - (titleW - gap),
      y: yOff,
      w: titleW - gap,
      h: H - pad * 2,
      label: state.reportName || "Dashboard",
    });
    rightReserve = titleW;
  }

  const content = {
    x: xOff,
    y: yOff,
    w: W - xOff - pad - rightReserve,
    h: H - yOff - pad,
  };

  // KPIs/slicers already consumed by the shared top row are not placed again.
  const sideKpi = !titleShareKpis && state.kpiCount > 0 && ["left-stack", "right-stack"].includes(state.kpiArrangement);
  const sideSlicer = !titleShareSlicers && state.slicerCount > 0 && (state.slicerPos === "left" || state.slicerPos === "right");
  const leftBlocks: Array<"kpi" | "slicer"> = [];
  const rightBlocks: Array<"kpi" | "slicer"> = [];

  if (sideSlicer && state.slicerPos === "left") leftBlocks.push("slicer");
  if (sideSlicer && state.slicerPos === "right") rightBlocks.push("slicer");
  if (sideKpi && state.kpiArrangement === "left-stack") leftBlocks.push("kpi");
  if (sideKpi && state.kpiArrangement === "right-stack") rightBlocks.push("kpi");

  let chartX = content.x;
  let chartY = content.y;
  let chartW = content.w;
  let chartH = content.h;

  const kpiCardH = state.kpiHeight ?? 110;

  if (state.kpiCount > 0 && !titleShareKpis && !sideKpi && state.slicerPos !== "top") {
    const usedH = placeKpis(chartX, chartY, chartW, state.kpiCount, state.kpiArrangement, addZone, gap, kpiCardH);
    chartY += usedH + gap;
    chartH -= usedH + gap;
  }

  if (leftBlocks.length > 0) {
    const blockW = sideColumnWidth(leftBlocks, state);
    placeSideBlocks(leftBlocks, content.x, chartY, blockW, chartH, state, addZone, true, gap);
    chartX += blockW;
    chartW -= blockW;
  }

  if (rightBlocks.length > 0) {
    const blockW = sideColumnWidth(rightBlocks, state);
    placeSideBlocks(rightBlocks, content.x + content.w - blockW, chartY, blockW, chartH, state, addZone, false, gap);
    chartW -= blockW + gap;
  }

  const topBlocks: Array<"kpi" | "slicer"> =
    state.slicerPos === "top" && state.slicerCount > 0 && !titleShareSlicers
      ? state.slicerAboveKpi
        ? ["slicer", "kpi"]
        : ["kpi", "slicer"]
      : titleShareSlicers && state.slicerPos === "top" && state.kpiCount > 0 && !sideKpi && !titleShareKpis
        ? ["kpi"] // slicers moved inline with the title; KPI row still renders
        : [];

  for (const block of topBlocks) {
    if (block === "kpi" && state.kpiCount > 0 && !sideKpi && !titleShareKpis) {
      const usedH = placeKpis(chartX, chartY, chartW, state.kpiCount, state.kpiArrangement, addZone, gap, kpiCardH);
      chartY += usedH + gap;
      chartH -= usedH + gap;
    }

    if (block === "slicer" && state.slicerCount > 0 && state.slicerPos === "top") {
      const usedH = placeTopSlicers(
        chartX,
        chartY,
        chartW,
        state.slicerCount,
        state.slicerTopHeight ?? DEFAULT_SLICER_TOP_HEIGHT,
        addZone,
        gap,
      );
      chartY += usedH + gap;
      chartH -= usedH + gap;
    }
  }

  if (state.logo) {
    const logoW = 80;
    const logoH = 40;
    addZone({
      idPrefix: "logo",
      type: "logo",
      visualType: getDefaultVisualType("logo"),
      visualId: "image",
      x: state.logoPos === "top-right" ? W - pad - logoW : xOff + 4,
      y: content.y > pad ? pad + 4 : content.y + 4,
      w: logoW,
      h: logoH,
    });
  }

  const chartZones = computeChartZones(chartX, chartY, chartW, chartH, state.chartCount, state.chartLayout, zIdx, gap);
  newZones.push(...chartZones);

  return newZones;
}

export function createSplitChildZones(parent: Zone, splitType: SplitType, spacing: number): Zone[] {
  if (splitType === "none") return [parent];

  return computeSplitChildren(
    { x: parent.x, y: parent.y, w: parent.w, h: parent.h },
    splitType,
    spacing,
    parent.id,
  );
}

export function computeSplitChildren(
  bounds: SplitBounds,
  splitType: SplitType,
  spacing: number,
  splitGroupId: string,
): Zone[] {
  if (splitType === "none") return [];

  const gap = getSafeSplitGap(bounds, splitType, spacing);
  // inner = the full parent boundary; gap is used ONLY as the internal spacing
  // between children. The parent zone's position already accounts for outer spacing
  // from the main layout — no additional outer inset is applied here.
  const inner = {
    x: bounds.x,
    y: bounds.y,
    w: bounds.w,
    h: bounds.h,
  };

  const makeZone = (index: number, x: number, y: number, w: number, h: number): Zone => ({
    id: getSplitChildId(splitGroupId, index),
    type: "chart",
    visualType: getDefaultVisualType("chart"),
    visualId: getDefaultVisualType("chart"),
    x: Math.round(x),
    y: Math.round(y),
    w: Math.max(1, Math.round(w)),
    h: Math.max(1, Math.round(h)),
    fields: [],
    parentZoneId: splitGroupId,
    splitType,
    splitGroupId,
    isChildZone: true,
    childIndex: index,
  });

  const childZones = (() => {
    switch (splitType) {
    case "equal":
    case "four-grid":
      return splitGrid(inner, 2, 2, gap, makeZone);
    case "prop-50-25-25":
      return splitColumns(inner, [50, 25, 25], gap, makeZone);
    case "prop-25-50-25":
      return splitColumns(inner, [25, 50, 25], gap, makeZone);
    case "prop-25-25-50":
      return splitColumns(inner, [25, 25, 50], gap, makeZone);
    case "prop-50-50":
    case "two-columns":
      return splitColumns(inner, [50, 50], gap, makeZone);
    case "prop-25-75":
      return splitColumns(inner, [25, 75], gap, makeZone);
    case "prop-75-25":
      return splitColumns(inner, [75, 25], gap, makeZone);
    case "prop-40-30-30":
      return splitColumns(inner, [40, 30, 30], gap, makeZone);
    case "prop-30-40-30":
      return splitColumns(inner, [30, 40, 30], gap, makeZone);
    case "prop-30-30-40":
      return splitColumns(inner, [30, 30, 40], gap, makeZone);
    case "three-columns":
      return splitColumns(inner, [1, 1, 1], gap, makeZone);
    case "three-rows":
      return splitRows(inner, [1, 1, 1], gap, makeZone);
    case "two-rows":
      return splitRows(inner, [1, 1], gap, makeZone);
    case "four-rows":
      return splitRows(inner, [1, 1, 1, 1], gap, makeZone);
    case "four-columns":
      return splitColumns(inner, [1, 1, 1, 1], gap, makeZone);
    case "five-rows":
      return splitRows(inner, [1, 1, 1, 1, 1], gap, makeZone);
    case "five-columns":
      return splitColumns(inner, [1, 1, 1, 1, 1], gap, makeZone);
    case "six-rows":
      return splitRows(inner, [1, 1, 1, 1, 1, 1], gap, makeZone);
    case "six-columns":
      return splitColumns(inner, [1, 1, 1, 1, 1, 1], gap, makeZone);
    case "seven-rows":
      return splitRows(inner, [1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "seven-columns":
      return splitColumns(inner, [1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "eight-rows":
      return splitRows(inner, [1, 1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "eight-columns":
      return splitColumns(inner, [1, 1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "nine-rows":
      return splitRows(inner, [1, 1, 1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "nine-columns":
      return splitColumns(inner, [1, 1, 1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "ten-rows":
      return splitRows(inner, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "ten-columns":
      return splitColumns(inner, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "eleven-rows":
      return splitRows(inner, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "eleven-columns":
      return splitColumns(inner, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "twelve-rows":
      return splitRows(inner, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "twelve-columns":
      return splitColumns(inner, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], gap, makeZone);
    case "large-left-two-small":
      return splitLargeSmall(inner, gap, makeZone, "left");
    case "two-small-large-right":
      return splitLargeSmall(inner, gap, makeZone, "right");
    case "large-top-two-small-bottom":
      return splitLargeSmallRows(inner, gap, makeZone, "top");
    case "two-small-top-large-bottom":
      return splitLargeSmallRows(inner, gap, makeZone, "bottom");
    default:
      return [];
    }
  })();

  return clampSplitChildZones(childZones, bounds);
}

// ─── Placement helpers ─────────────────────────────────────────────────────

type SplitTrack = { start: number; size: number };
type SplitZoneFactory = (index: number, x: number, y: number, w: number, h: number) => Zone;

export function getSplitChildId(splitGroupId: string, childIndex: number): string {
  return `${splitGroupId}_split_${childIndex + 1}`;
}

function getSafeSplitGap(bounds: SplitBounds, splitType: SplitType, spacing: number): number {
  const requestedGap = Math.max(0, Math.round(spacing));
  if (requestedGap === 0) return 0;

  const { cols, rows } = getSplitTrackCounts(splitType);
  // There are (cols - 1) internal horizontal gaps and (rows - 1) internal vertical gaps.
  // Each child must be at least 1px wide/tall, so:
  //   gap * (cols - 1) <= parent.w - cols  →  gap <= (parent.w - cols) / (cols - 1)
  // When there is only 1 column/row, no gap applies in that direction.
  const maxWidthGap  = cols <= 1 ? Number.MAX_SAFE_INTEGER : Math.floor((bounds.w - cols) / (cols - 1));
  const maxHeightGap = rows <= 1 ? Number.MAX_SAFE_INTEGER : Math.floor((bounds.h - rows) / (rows - 1));
  const maxGap = Math.max(0, Math.min(maxWidthGap, maxHeightGap));

  return Math.min(requestedGap, maxGap);
}

function getSplitTrackCounts(splitType: SplitType): { cols: number; rows: number } {
  switch (splitType) {
    case "prop-50-25-25":
    case "prop-25-50-25":
    case "prop-25-25-50":
    case "prop-40-30-30":
    case "prop-30-40-30":
    case "prop-30-30-40":
    case "three-columns":
      return { cols: 3, rows: 1 };
    case "three-rows":
      return { cols: 1, rows: 3 };
    case "two-rows":
      return { cols: 1, rows: 2 };
    case "equal":
    case "four-grid":
    case "large-left-two-small":
    case "two-small-large-right":
    case "large-top-two-small-bottom":
    case "two-small-top-large-bottom":
      return { cols: 2, rows: 2 };
    case "four-rows":
      return { cols: 1, rows: 4 };
    case "four-columns":
      return { cols: 4, rows: 1 };
    case "five-rows":
      return { cols: 1, rows: 5 };
    case "five-columns":
      return { cols: 5, rows: 1 };
    case "six-rows":
      return { cols: 1, rows: 6 };
    case "six-columns":
      return { cols: 6, rows: 1 };
    case "seven-rows":
      return { cols: 1, rows: 7 };
    case "seven-columns":
      return { cols: 7, rows: 1 };
    case "eight-rows":
      return { cols: 1, rows: 8 };
    case "eight-columns":
      return { cols: 8, rows: 1 };
    case "nine-rows":
      return { cols: 1, rows: 9 };
    case "nine-columns":
      return { cols: 9, rows: 1 };
    case "ten-rows":
      return { cols: 1, rows: 10 };
    case "ten-columns":
      return { cols: 10, rows: 1 };
    case "eleven-rows":
      return { cols: 1, rows: 11 };
    case "eleven-columns":
      return { cols: 11, rows: 1 };
    case "twelve-rows":
      return { cols: 1, rows: 12 };
    case "twelve-columns":
      return { cols: 12, rows: 1 };
    case "prop-50-50":
    case "prop-25-75":
    case "prop-75-25":
    case "two-columns":
    default:
      return { cols: 2, rows: 1 };
  }
}

function splitColumns(bounds: SplitBounds, weights: number[], gap: number, makeZone: SplitZoneFactory): Zone[] {
  return weightedTracks(bounds.x, bounds.w, weights, gap).map((track, index) =>
    makeZone(index, track.start, bounds.y, track.size, bounds.h),
  );
}

function splitRows(bounds: SplitBounds, weights: number[], gap: number, makeZone: SplitZoneFactory): Zone[] {
  return weightedTracks(bounds.y, bounds.h, weights, gap).map((track, index) =>
    makeZone(index, bounds.x, track.start, bounds.w, track.size),
  );
}

function splitGrid(
  bounds: SplitBounds,
  rows: number,
  cols: number,
  gap: number,
  makeZone: SplitZoneFactory,
): Zone[] {
  const rowTracks = weightedTracks(bounds.y, bounds.h, Array(rows).fill(1), gap);
  const colTracks = weightedTracks(bounds.x, bounds.w, Array(cols).fill(1), gap);
  const zones: Zone[] = [];
  let index = 0;

  rowTracks.forEach((rowTrack) => {
    colTracks.forEach((colTrack) => {
      zones.push(makeZone(index, colTrack.start, rowTrack.start, colTrack.size, rowTrack.size));
      index += 1;
    });
  });

  return zones;
}

function splitLargeSmall(
  bounds: SplitBounds,
  gap: number,
  makeZone: SplitZoneFactory,
  largeSide: "left" | "right",
): Zone[] {
  const colTracks = weightedTracks(bounds.x, bounds.w, [62, 38], gap);
  const rowTracks = weightedTracks(bounds.y, bounds.h, [1, 1], gap);
  const [leftCol, rightCol] = colTracks;
  const [topRow, bottomRow] = rowTracks;

  if (largeSide === "left") {
    return [
      makeZone(0, leftCol.start, bounds.y, leftCol.size, bounds.h),
      makeZone(1, rightCol.start, topRow.start, rightCol.size, topRow.size),
      makeZone(2, rightCol.start, bottomRow.start, rightCol.size, bottomRow.size),
    ];
  }

  return [
    makeZone(0, leftCol.start, topRow.start, leftCol.size, topRow.size),
    makeZone(1, leftCol.start, bottomRow.start, leftCol.size, bottomRow.size),
    makeZone(2, rightCol.start, bounds.y, rightCol.size, bounds.h),
  ];
}

function splitLargeSmallRows(
  bounds: SplitBounds,
  gap: number,
  makeZone: SplitZoneFactory,
  largeSide: "top" | "bottom",
): Zone[] {
  const rowTracks = weightedTracks(bounds.y, bounds.h, [62, 38], gap);
  const colTracks = weightedTracks(bounds.x, bounds.w, [1, 1], gap);
  const [topRow, bottomRow] = rowTracks;
  const [leftCol, rightCol] = colTracks;

  if (largeSide === "top") {
    return [
      makeZone(0, bounds.x, topRow.start, bounds.w, topRow.size),
      makeZone(1, leftCol.start, bottomRow.start, leftCol.size, bottomRow.size),
      makeZone(2, rightCol.start, bottomRow.start, rightCol.size, bottomRow.size),
    ];
  }

  return [
    makeZone(0, leftCol.start, topRow.start, leftCol.size, topRow.size),
    makeZone(1, rightCol.start, topRow.start, rightCol.size, topRow.size),
    makeZone(2, bounds.x, bottomRow.start, bounds.w, bottomRow.size),
  ];
}

function weightedTracks(start: number, size: number, weights: number[], gap: number): SplitTrack[] {
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  if (weights.length === 0 || totalWeight <= 0) return [];

  const trackCount = weights.length;
  const roundedStart = Math.round(start);
  const roundedSize = Math.max(trackCount, Math.round(size));
  const roundedGap = Math.max(0, Math.round(gap));
  const availableSize = Math.max(trackCount, roundedSize - roundedGap * (trackCount - 1));
  const extraSize = availableSize - trackCount;

  const rawExtras = weights.map((weight) => extraSize * (weight / totalWeight));
  const sizes = rawExtras.map((raw) => 1 + Math.floor(raw));
  const assignedSize = sizes.reduce((sum, value) => sum + value, 0);
  let remainingPixels = availableSize - assignedSize;

  const fractionalOrder = rawExtras
    .map((raw, index) => ({ index, fraction: raw - Math.floor(raw) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; remainingPixels > 0 && fractionalOrder.length > 0; i += 1) {
    sizes[fractionalOrder[i % fractionalOrder.length].index] += 1;
    remainingPixels -= 1;
  }

  const tracks: SplitTrack[] = [];
  let cursor = roundedStart;
  sizes.forEach((trackSize) => {
    tracks.push({ start: cursor, size: trackSize });
    cursor += trackSize + roundedGap;
  });

  return tracks;
}

function clampSplitChildZones(zones: Zone[], bounds: SplitBounds): Zone[] {
  const parentRight = bounds.x + bounds.w;
  const parentBottom = bounds.y + bounds.h;

  return zones.map((zone) => {
    if (!zone.isChildZone) return zone;

    const x = clampNumber(zone.x, bounds.x, parentRight - 1);
    const y = clampNumber(zone.y, bounds.y, parentBottom - 1);
    const w = clampNumber(zone.w, 1, parentRight - x);
    const h = clampNumber(zone.h, 1, parentBottom - y);

    return { ...zone, x, y, w, h };
  });
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function placeKpis(
  x: number,
  y: number,
  w: number,
  count: number,
  arrangement: LayoutState["kpiArrangement"],
  addZone: (zone: Omit<Zone, "id" | "fields"> & { idPrefix: string }) => void,
  gap: number,
  cardHeight = 110,
): number {
  if (count <= 0) return 0;

  const rows = arrangement === "two-rows" || (arrangement === "auto" && count > 4) ? 2 : 1;
  const pattern = balancedPattern(count, rows);
  const cardH = cardHeight;

  pattern.forEach((cardsInRow, rowIndex) => {
    const cardW = Math.floor((w - (cardsInRow - 1) * gap) / cardsInRow);
    for (let i = 0; i < cardsInRow; i += 1) {
      addZone({
        idPrefix: "card",
        type: "kpi",
        visualType: getDefaultVisualType("kpi"),
        visualId: "card",
        x: x + i * (cardW + gap),
        y: y + rowIndex * (cardH + gap),
        w: cardW,
        h: cardH,
      });
    }
  });

  return pattern.length * cardH + (pattern.length - 1) * gap;
}

function placeTopSlicers(
  x: number,
  y: number,
  w: number,
  count: number,
  height: number,
  addZone: (zone: Omit<Zone, "id" | "fields"> & { idPrefix: string }) => void,
  gap: number,
): number {
  const slicerH = Math.max(1, Math.round(height));
  const slicerW = Math.floor((w - (count - 1) * gap) / count);

  for (let i = 0; i < count; i += 1) {
    addZone({
      idPrefix: "slicer",
      type: "slicer",
      visualType: getDefaultVisualType("slicer"),
      visualId: "slicer",
      x: x + i * (slicerW + gap),
      y,
      w: slicerW,
      h: slicerH,
    });
  }

  return slicerH;
}

function placeSideBlocks(
  blocks: Array<"kpi" | "slicer">,
  x: number,
  y: number,
  w: number,
  h: number,
  state: LayoutState,
  addZone: (zone: Omit<Zone, "id" | "fields"> & { idPrefix: string }) => void,
  insetRightEdge = true,
  gap: number,
) {
  const availableH = h - Math.max(0, blocks.length - 1) * gap;
  const blockH = Math.floor(availableH / blocks.length);

  blocks.forEach((block, index) => {
    const by = y + index * (blockH + gap);
    if (block === "slicer") {
      placeVerticalSlicers(x, by, insetRightEdge ? w - gap : w, blockH, state.slicerCount, addZone, gap);
    } else {
      placeVerticalKpis(x, by, insetRightEdge ? w - gap : w, blockH, state.kpiCount, addZone, gap);
    }
  });
}

function placeVerticalSlicers(
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
  addZone: (zone: Omit<Zone, "id" | "fields"> & { idPrefix: string }) => void,
  gap: number,
) {
  const slicerH = Math.floor((h - (count - 1) * gap) / count);
  for (let i = 0; i < count; i += 1) {
    addZone({
      idPrefix: "slicer",
      type: "slicer",
      visualType: getDefaultVisualType("slicer"),
      visualId: "slicer",
      x,
      y: y + i * (slicerH + gap),
      w,
      h: slicerH,
    });
  }
}

function placeVerticalKpis(
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
  addZone: (zone: Omit<Zone, "id" | "fields"> & { idPrefix: string }) => void,
  gap: number,
) {
  const cardH = Math.floor((h - (count - 1) * gap) / count);
  for (let i = 0; i < count; i += 1) {
    addZone({
      idPrefix: "card",
      type: "kpi",
      visualType: getDefaultVisualType("kpi"),
      visualId: "card",
      x,
      y: y + i * (cardH + gap),
      w,
      h: cardH,
    });
  }
}

// ─── Chart zone computation ────────────────────────────────────────────────

function computeChartZones(
  x: number,
  y: number,
  w: number,
  h: number,
  n: number,
  layout: string,
  startIdx: number,
  gap: number,
): Zone[] {
  const count = Math.max(1, n);

  // ── Advanced layout patterns ─────────────────────────────────────────

  // Proportional single-row: "prop:60:40" or "prop:50:25:25" etc.
  if (layout.startsWith("prop:")) {
    return computeProportionalRow(x, y, w, h, layout, count, startIdx, gap);
  }

  // Tall/short rows: "tall:1+2", "tall:2+1", "tall:1+3", "tall:3+1"
  if (layout.startsWith("tall:")) {
    return computeTallLayout(x, y, w, h, layout, count, startIdx, gap);
  }

  // Grid: "grid:2x2", "grid:3x2", "grid:2x3"
  if (layout.startsWith("grid:")) {
    return computeGridLayout(x, y, w, h, layout, count, startIdx, gap);
  }

  // ── Existing equal-size row patterns ─────────────────────────────────
  const charts: Zone[] = [];
  let idx = 0;
  const uid = () => `chart_${startIdx + idx++}`;
  const pattern = layout === "auto" ? autoPattern(count) : parsePattern(layout, count);
  const rowH = Math.floor((h - (pattern.length - 1) * gap) / pattern.length);

  pattern.forEach((chartsInRow, rowIndex) => {
    const chartW = Math.floor((w - (chartsInRow - 1) * gap) / chartsInRow);
    for (let i = 0; i < chartsInRow && charts.length < count; i += 1) {
      charts.push({
        id: uid(),
        type: "chart",
        visualType: getDefaultVisualType("chart"),
        visualId: "barChart",
        x: Math.round(x + i * (chartW + gap)),
        y: Math.round(y + rowIndex * (rowH + gap)),
        w: Math.max(1, Math.round(chartW)),
        h: Math.max(1, Math.round(rowH)),
        fields: [],
      });
    }
  });

  return charts.slice(0, count);
}

/**
 * Proportional single-row layout.
 * Format: "prop:60:40" or "prop:50:25:25" (proportions must sum to 100).
 * All charts share the full height h.
 */
function computeProportionalRow(
  x: number,
  y: number,
  w: number,
  h: number,
  layout: string,
  count: number,
  startIdx: number,
  gap: number,
): Zone[] {
  const parts = layout.replace("prop:", "").split(":").map(Number);
  const total = parts.reduce((s, v) => s + v, 0);
  if (parts.length === 0 || total === 0) {
    // Fallback to equal split
    return computeChartZones(x, y, w, h, count, String(count), startIdx, gap);
  }

  const charts: Zone[] = [];
  let idx = 0;
  const uid = () => `chart_${startIdx + idx++}`;
  const usableW = w - (parts.length - 1) * gap;
  let currentX = x;

  const numCharts = Math.min(count, parts.length);
  for (let i = 0; i < numCharts; i += 1) {
    const proportion = parts[i] / total;
    const chartW = Math.round(usableW * proportion);
    charts.push({
      id: uid(),
      type: "chart",
      visualType: getDefaultVisualType("chart"),
      visualId: "barChart",
      x: Math.round(currentX),
      y: Math.round(y),
      w: Math.max(1, chartW),
      h: Math.max(1, Math.round(h)),
      fields: [],
    });
    currentX += chartW + gap;
  }

  return charts;
}

/**
 * Tall+short two-row layout.
 * Format: "tall:1+2" = 1 large (60% height) + 2 small (40% height)
 *         "tall:2+1" = 2 small (40% height) + 1 large (60% height)
 *         "tall:1+3" = 1 large (60% height) + 3 small (40% height)
 *         "tall:3+1" = 3 small (40% height) + 1 large (60% height)
 */
function computeTallLayout(
  x: number,
  y: number,
  w: number,
  h: number,
  layout: string,
  count: number,
  startIdx: number,
  gap: number,
): Zone[] {
  const spec = layout.replace("tall:", "");
  const rowParts = spec.split("+").map(Number);
  if (rowParts.length !== 2 || rowParts.some(Number.isNaN)) {
    return computeChartZones(x, y, w, h, count, "auto", startIdx, gap);
  }

  const [topCount, botCount] = rowParts;
  const largeIsTop = topCount < botCount; // 1+2: top is large; 2+1: bottom is large

  // Large row gets 60%, small row gets 40%
  const largeH = Math.round((h - gap) * 0.60);
  const smallH = h - gap - largeH;

  const topH = largeIsTop ? largeH : smallH;
  const botH = largeIsTop ? smallH : largeH;
  const topY = y;
  const botY = y + topH + gap;

  const charts: Zone[] = [];
  let idx = 0;
  const uid = () => `chart_${startIdx + idx++}`;

  // Top row
  const topW = Math.floor((w - (topCount - 1) * gap) / topCount);
  for (let i = 0; i < topCount; i += 1) {
    charts.push({
      id: uid(),
      type: "chart",
      visualType: getDefaultVisualType("chart"),
      visualId: "barChart",
      x: Math.round(x + i * (topW + gap)),
      y: Math.round(topY),
      w: Math.max(1, topW),
      h: Math.max(1, topH),
      fields: [],
    });
  }

  // Bottom row
  const botW = Math.floor((w - (botCount - 1) * gap) / botCount);
  for (let i = 0; i < botCount; i += 1) {
    charts.push({
      id: uid(),
      type: "chart",
      visualType: getDefaultVisualType("chart"),
      visualId: "barChart",
      x: Math.round(x + i * (botW + gap)),
      y: Math.round(botY),
      w: Math.max(1, botW),
      h: Math.max(1, botH),
      fields: [],
    });
  }

  return charts.slice(0, count);
}

/**
 * Grid layout.
 * Format: "grid:2x2" = 2 rows × 2 cols, "grid:3x2" = 3 rows × 2 cols, "grid:2x3" = 2 rows × 3 cols
 */
function computeGridLayout(
  x: number,
  y: number,
  w: number,
  h: number,
  layout: string,
  count: number,
  startIdx: number,
  gap: number,
): Zone[] {
  const spec = layout.replace("grid:", "");
  const [rowsStr, colsStr] = spec.split("x");
  const rows = parseInt(rowsStr, 10);
  const cols = parseInt(colsStr, 10);

  if (!Number.isFinite(rows) || !Number.isFinite(cols) || rows < 1 || cols < 1) {
    return computeChartZones(x, y, w, h, count, "auto", startIdx, gap);
  }

  const charts: Zone[] = [];
  let idx = 0;
  const uid = () => `chart_${startIdx + idx++}`;
  const rowH = Math.floor((h - (rows - 1) * gap) / rows);
  const colW = Math.floor((w - (cols - 1) * gap) / cols);

  outer: for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (charts.length >= count) break outer;
      charts.push({
        id: uid(),
        type: "chart",
        visualType: getDefaultVisualType("chart"),
        visualId: "barChart",
        x: Math.round(x + c * (colW + gap)),
        y: Math.round(y + r * (rowH + gap)),
        w: Math.max(1, colW),
        h: Math.max(1, rowH),
        fields: [],
      });
    }
  }

  return charts;
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function sideColumnWidth(blocks: Array<"kpi" | "slicer">, state: LayoutState): number {
  if (blocks.includes("kpi") && blocks.includes("slicer")) {
    return Math.max(1, Math.round(state.slicerSideWidth ?? DEFAULT_SLICER_SIDE_WIDTH));
  }
  if (blocks.includes("kpi")) return 190;
  return Math.max(1, Math.round(state.slicerSideWidth ?? DEFAULT_SLICER_SIDE_WIDTH));
}

function autoPattern(count: number): number[] {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  return balancedPattern(count, rows);
}

function balancedPattern(count: number, rows: number): number[] {
  const safeRows = Math.max(1, Math.min(rows, count));
  const base = Math.floor(count / safeRows);
  let remainder = count % safeRows;

  return Array.from({ length: safeRows }, () => {
    const value = base + (remainder > 0 ? 1 : 0);
    remainder -= 1;
    return value;
  });
}

function splitPattern(count: number, firstRow: number): number[] {
  const first = Math.max(1, Math.min(firstRow, count - 1));
  return [first, count - first];
}

function repeatRows(pattern: number[], count: number): string {
  const rows: number[] = [];
  let remaining = count;
  while (remaining > 0) {
    const value = Math.min(pattern[0], remaining);
    rows.push(value);
    remaining -= value;
  }
  return rows.join("+");
}

function parsePattern(layout: string, count: number): number[] {
  const parsed = layout
    .split("+")
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (parsed.length === 0) return autoPattern(count);

  const total = parsed.reduce((sum, value) => sum + value, 0);
  if (total === count) return parsed;

  return autoPattern(count);
}

function uniqueOptions(options: Array<{ value: string; label: string }>) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

// ─── Merge validation ──────────────────────────────────────────────────────

/**
 * Validates that selected zones form one continuous rectangular area.
 * Checks that no unselected visible zone overlaps with the bounding box of the selection.
 * Returns null when valid, or an error message string when invalid.
 */
export function validateMergeRectangle(
  selected: Array<{ id: string; x: number; y: number; w: number; h: number }>,
  allZones: Array<{ id: string; x: number; y: number; w: number; h: number }>,
): string | null {
  if (selected.length < 2) return "Select at least 2 zones to merge.";

  const selectedIds = new Set(selected.map((z) => z.id));
  const xMin = Math.min(...selected.map((z) => z.x));
  const yMin = Math.min(...selected.map((z) => z.y));
  const xMax = Math.max(...selected.map((z) => z.x + z.w));
  const yMax = Math.max(...selected.map((z) => z.y + z.h));

  const blocking = allZones.find((z) => {
    if (selectedIds.has(z.id)) return false;
    // Strict overlap: zone must penetrate the interior of the bounding box
    return z.x < xMax && z.x + z.w > xMin && z.y < yMax && z.y + z.h > yMin;
  });

  if (blocking) return "Selected zones must form one continuous rectangular area.";
  return null;
}
