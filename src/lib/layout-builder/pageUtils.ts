import type { ReportPage, ReportState } from "./types/layout";
import { DEFAULT_LAYOUT_STATE } from "./layoutEngine";

let pageCounter = 0;

function generatePageId(): string {
  pageCounter += 1;
  return `page_${Date.now()}_${pageCounter}`;
}

export function createDefaultPage(name: string): ReportPage {
  return {
    id: generatePageId(),
    name,
    layoutState: { ...DEFAULT_LAYOUT_STATE, reportName: name },
    visualAssignments: {},
    splitRecipes: [],
    frozenZones: [],
    hiddenZoneIds: [],
  };
}

/**
 * Finds the highest "Page N" number in the current page list.
 * Ignores pages whose names don't match the pattern (e.g. renamed pages).
 * Returns the next logical page number.
 */
export function nextPageNumber(pages: ReportPage[]): number {
  let max = 0;
  for (const page of pages) {
    const match = /^page\s+(\d+)$/i.exec(page.name.trim());
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

/**
 * Deep-copies a page into a new page with a fresh id and the given name.
 * Copies layout settings, visual assignments, and split recipes exactly.
 */
export function duplicatePage(source: ReportPage, newName: string): ReportPage {
  return {
    id: generatePageId(),
    name: newName,
    layoutState: { ...source.layoutState, reportName: newName },
    visualAssignments: { ...source.visualAssignments },
    splitRecipes: source.splitRecipes.map((r) => ({ ...r })),
    frozenZones: source.frozenZones.map((z) => ({ ...z })),
    hiddenZoneIds: [...source.hiddenZoneIds],
  };
}

export function defaultReportState(): ReportState {
  const firstPage = createDefaultPage("Page 1");
  return {
    pages: [firstPage],
    activePageId: firstPage.id,
  };
}

export function getActivePage(reportState: ReportState): ReportPage {
  return (
    reportState.pages.find((page) => page.id === reportState.activePageId) ||
    reportState.pages[0]
  );
}
