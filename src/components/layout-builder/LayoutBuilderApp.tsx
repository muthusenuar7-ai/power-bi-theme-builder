'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CanvasPreview } from "./CanvasPreview";
import { IntegrationBar } from "./IntegrationBar";
import { LayoutControls } from "./LayoutControls";
import { PageManager } from "./PageManager";
import { Topbar } from "./Topbar";
import type { Theme } from "./Topbar";
import { VisualPickerPanel } from "./VisualPickerPanel";
import type {
  LayoutState,
  ReportPage,
  ReportState,
  SplitRecipe,
  SplitType,
  VisualType,
  Zone,
} from "@/lib/layout-builder/types/layout";
import {
  buildMultiPageCsv,
  buildMultiPageExport,
  downloadBlob,
  exportCombinedPbit,
  exportMultiPagePbit,
} from "@/lib/layout-builder/exporters";
import {
  computeSplitChildren,
  computeZones,
  DEFAULT_LAYOUT_STATE,
  getArrangementOptions,
  getSplitChildId,
  validateMergeRectangle,
} from "@/lib/layout-builder/layoutEngine";
import {
  createDefaultPage,
  defaultReportState,
  duplicatePage,
  getActivePage,
  nextPageNumber,
} from "@/lib/layout-builder/pageUtils";
import { canAssignVisual, getDefaultVisualType, getSafeVisualType } from "@/lib/layout-builder/visualCatalog";
import { consumeLayoutSessionSnapshot, saveLayoutSessionSnapshot } from "@/lib/layout-builder/layoutSessionAdapter";
import {
  DEFAULT_KPI_ICON_GAP,
  DEFAULT_KPI_ICON_SIZE,
  ICON_PAGE_CAPACITY,
  dedupePreservingOrder,
  expandZonesWithIcons,
  iconThumbnailUrl,
  reconcileIconPages,
  type KpiIconAssignment,
} from "@/lib/layout-builder/iconIntegration";
import { findIconById, loadGeneratedIconLibrary } from "@/lib/iconLibrary";
import type { IconLibraryItem } from "@/types";
import { useIntegrationWorkspaceStore } from "@/store/integrationWorkspaceStore";

interface VisualTemplatesResponse {
  availableFrontendVisualTypes?: string[];
}

// ─── Local types ─────────────────────────────────────────────────────────────

/** Fields that can be patched on the active page in a single updateActivePage call. */
type PagePatch = Partial<{
  layoutState: LayoutState;
  visualAssignments: Record<string, VisualType>;
  splitRecipes: SplitRecipe[];
  frozenZones: Zone[];
  hiddenZoneIds: string[];
  kpiIcons: Record<string, KpiIconAssignment>;
  titleIcon: ReportPage["titleIcon"];
}>;

/** Per-page undo/redo history stored by page ID. */
interface PageHistoryEntry {
  past: ReportPage[];
  future: ReportPage[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeAvailableVisualTypes(values: string[] = []): Set<string> {
  const normalized = new Set(values);

  if (normalized.has("comboChart")) normalized.add("lineAndClusteredColumnChart");
  if (normalized.has("lineAndStackedComboChart")) normalized.add("lineAndStackedColumnChart");
  if (normalized.has("rectangleShape")) normalized.add("shape");
  if (normalized.has("slicerDropdown") || normalized.has("slicerVerticalList")) normalized.add("slicer");

  return normalized;
}

/**
 * Returns true when only the zoneGap field changed between two layout states.
 * Used to avoid clearing selection during spacing slider drags.
 */
function isSpacingOnlyChange(previous: LayoutState, next: LayoutState): boolean {
  return Object.keys(previous).every((key) => {
    const field = key as keyof LayoutState;
    return field === "zoneGap" || previous[field] === next[field];
  });
}

/**
 * Returns true when a layout change would alter zone IDs (zone count, arrangement,
 * title position, etc.). Used to clear split recipes when the layout structure
 * changes, since stale recipes would reference IDs that no longer exist.
 */
function isStructuralChange(previous: LayoutState, next: LayoutState): boolean {
  const structural: Array<keyof LayoutState> = [
    "titlePos",
    "titleLayout",
    "kpiCount",
    "kpiArrangement",
    "slicerCount",
    "slicerPos",
    "slicerAboveKpi",
    "chartCount",
    "chartLayout",
    "logo",
    "logoPos",
  ];
  return structural.some((f) => previous[f] !== next[f]);
}

/** Generate a unique recipe ID. */
let recipeCounter = 0;
function newRecipeId(): string {
  recipeCounter += 1;
  return `recipe_${Date.now()}_${recipeCounter}`;
}

/** Generate a unique frozen-zone ID prefix. */
let frozenCounter = 0;
function newFrozenId(): string {
  frozenCounter += 1;
  return `frozen_${Date.now()}_${frozenCounter}`;
}

/** Generate a unique merged-zone ID. */
let mergedCounter = 0;
function newMergedId(): string {
  mergedCounter += 1;
  return `merged_${Date.now()}_${mergedCounter}`;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // Consumed exactly once per mount (lazy initial state) — restores state
  // after a round trip to Icon Studio / Theme Builder via the integration
  // handoff (Part 4/5).
  const [restoredSession] = useState(() => consumeLayoutSessionSnapshot());

  const [reportState, setReportState] = useState<ReportState>(
    () => restoredSession?.reportState ?? defaultReportState(),
  );
  const [zoom, setZoom] = useState(0.6);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(
    () => restoredSession?.selectedZoneId ?? null,
  );
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>(
    () => restoredSession?.selectedZoneIds ?? [],
  );
  const [includeTheme, setIncludeTheme] = useState(() => restoredSession?.includeTheme ?? false);
  const [availableVisualTypes, setAvailableVisualTypes] = useState<Set<string> | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [exportingPbit, setExportingPbit] = useState(false);
  const [exportingCombinedPbit, setExportingCombinedPbit] = useState(false);

  const router = useRouter();
  const iconBundle = useIntegrationWorkspaceStore((s) => s.iconBundle);
  const themeSnapshot = useIntegrationWorkspaceStore((s) => s.themeSnapshot);
  const clearIconBundle = useIntegrationWorkspaceStore((s) => s.clearIconBundle);
  const setIntegrationSourceModule = useIntegrationWorkspaceStore((s) => s.setSourceModule);
  const setIntegrationReturnRoute = useIntegrationWorkspaceStore((s) => s.setReturnRoute);

  const iconCount = iconBundle?.iconIds.length ?? 0;
  const iconPageCount = iconCount > 0 ? Math.ceil(iconCount / ICON_PAGE_CAPACITY) : 0;

  // ─── Icon bundle → in-builder integration (Phase 3) ──────────────────────

  // Resolved gallery items for the bundled icon ids (names + thumbnails).
  const [bundleIcons, setBundleIcons] = useState<IconLibraryItem[]>([]);
  const [activeIconId, setActiveIconId] = useState<string | null>(null);

  useEffect(() => {
    if (!iconBundle || iconBundle.iconIds.length === 0) {
      setBundleIcons([]);
      setActiveIconId(null);
      return;
    }
    let cancelled = false;
    loadGeneratedIconLibrary()
      .then((all) => {
        if (cancelled) return;
        const ids = dedupePreservingOrder(iconBundle.iconIds);
        const items = ids
          .map((id) => findIconById(all, id))
          .filter((x): x is IconLibraryItem => Boolean(x));
        setBundleIcons(items);
        setActiveIconId((prev) => (prev && items.some((i) => i.id === prev) ? prev : items[0]?.id ?? null));
      })
      .catch(() => { if (!cancelled) setBundleIcons([]); });
    return () => { cancelled = true; };
  }, [iconBundle]);

  // Generated "Icons NN" pages track the bundle: same bundle hash → reuse,
  // changed bundle → replace only the generated pages, cleared → remove.
  useEffect(() => {
    const iconNames = Object.fromEntries(bundleIcons.map((i) => [i.id, i.name]));
    setReportState((current) => reconcileIconPages(current, iconBundle, iconNames));
  }, [iconBundle, bundleIcons]);

  const iconThumbUrl = useCallback(
    (iconId: string) => iconThumbnailUrl(iconId, iconBundle),
    [iconBundle],
  );

  // ─── Theme ───────────────────────────────────────────────────────────────

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("pbi-theme") as Theme) ?? "light",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pbi-theme", theme);
  }, [theme]);

  // Lock document scrolling while the Layout Builder is mounted (same
  // body.app-locked mechanism the Theme Builder uses), and clear the
  // data-theme attribute on unmount so its token overrides can't affect
  // other pages after navigating away.
  useEffect(() => {
    document.body.classList.add("app-locked");
    return () => {
      document.body.classList.remove("app-locked");
      document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  // Per-page undo/redo history stacks (keyed by page id)
  const [pageHistory, setPageHistory] = useState<Record<string, PageHistoryEntry>>({});

  // ─── Template scan ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadVisualTemplates() {
      setLoadingTemplates(true);
      try {
        const response = await fetch("/api/layout-builder/visual-templates");
        if (!response.ok) throw new Error(`Template scan failed with HTTP ${response.status}.`);
        const body = (await response.json()) as VisualTemplatesResponse;
        if (!cancelled) setAvailableVisualTypes(normalizeAvailableVisualTypes(body.availableFrontendVisualTypes));
      } catch (error) {
        if (!cancelled) {
          setAvailableVisualTypes(new Set());
          showToast(error instanceof Error ? error.message : "Failed to load visual templates.", true);
        }
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    }

    loadVisualTemplates();
    return () => { cancelled = true; };
  }, []);

  // ─── Active page helpers ──────────────────────────────────────────────────

  const activePage = useMemo(() => getActivePage(reportState), [reportState]);

  const normalizedState = useMemo(() => {
    const state = activePage.layoutState;
    const options = getArrangementOptions(state.chartCount);
    if (options.some((o) => o.value === state.chartLayout)) return state;
    return { ...state, chartLayout: options[0].value };
  }, [activePage]);

  // ─── Zone derivation ──────────────────────────────────────────────────────
  //
  // Single source of truth: resolveZonesForPage.
  //
  // Algorithm:
  //   1. Start with base zones from computeZones(layoutState), filter hiddenZoneIds.
  //   2. Add frozenZones (detached children with position-fixed coordinates).
  //   3. Replay splitRecipes in ascending `order`:
  //      a. Find source zone in the current pool.
  //      b. Compute children from source zone's CURRENT bounds + current spacing.
  //      c. Replace source with children in the pool.
  //      d. Filter hiddenZoneIds again (to suppress recipe-created zones too).
  //   4. Apply visual assignments.
  //
  // Spacing changes automatically reflow all children: computeSplitChildren is
  // called fresh on every render with the live zoneGap value. No stale coords.

  const resolveZonesForPage = useCallback(
    (page: ReportPage): Zone[] => {
      // Normalize chart layout
      const rawState = page.layoutState;
      const options = getArrangementOptions(rawState.chartCount);
      const state = options.some((o) => o.value === rawState.chartLayout)
        ? rawState
        : { ...rawState, chartLayout: options[0].value };

      const spacing = state.zoneGap ?? DEFAULT_LAYOUT_STATE.zoneGap;
      const hiddenIds = new Set(page.hiddenZoneIds);

      // Apply visual assignment + safe-type fallback to a zone.
      const applyVisual = (zone: Zone): Zone => {
        // Icon zones (generated icon pages) are fixed Image visuals — never
        // re-typed by placeholder assignment or template-availability checks.
        if (zone.iconId) return zone;
        const assigned = page.visualAssignments[zone.id];
        const candidate = assigned && canAssignVisual(zone.type) ? assigned : zone.visualType;
        const safe = getSafeVisualType(zone.type, candidate, availableVisualTypes);
        return { ...zone, visualType: safe, visualId: safe };
      };

      // 1. Base zones plus fixed detached zones. Hidden IDs are filtered after
      // recipe replay so merged zones can rederive bounds from hidden sources.
      const isDynamicMergedZone = (zone: Zone) =>
        Boolean(zone.isMergedZone && zone.mergeSourceZoneIds?.length);

      const dynamicMergedZones = page.frozenZones
        .filter(isDynamicMergedZone)
        .sort((a, b) => (a.mergeOrder ?? Number.MAX_SAFE_INTEGER) - (b.mergeOrder ?? Number.MAX_SAFE_INTEGER));

      const materializedMergedZoneIds = new Set<string>();

      let pool: Zone[] = [
        ...computeZones(state),
        ...page.frozenZones.filter((z) => !isDynamicMergedZone(z)),
      ];

      const materializeMergedZones = (upToOrder: number) => {
        for (const mergedZone of dynamicMergedZones) {
          if (materializedMergedZoneIds.has(mergedZone.id)) continue;
          const mergeOrder = mergedZone.mergeOrder ?? Number.MAX_SAFE_INTEGER;
          if (mergeOrder > upToOrder) continue;

          const sourceIds = mergedZone.mergeSourceZoneIds ?? [];
          const sources = sourceIds
            .map((id) => pool.find((zone) => zone.id === id))
            .filter((zone): zone is Zone => Boolean(zone));

          if (sources.length !== sourceIds.length) continue;

          const xMin = Math.min(...sources.map((z) => z.x));
          const yMin = Math.min(...sources.map((z) => z.y));
          const xMax = Math.max(...sources.map((z) => z.x + z.w));
          const yMax = Math.max(...sources.map((z) => z.y + z.h));

          pool = [
            ...pool.filter((zone) => zone.id !== mergedZone.id),
            {
              ...mergedZone,
              x: xMin,
              y: yMin,
              w: xMax - xMin,
              h: yMax - yMin,
            },
          ];
          materializedMergedZoneIds.add(mergedZone.id);
        }
      };

      // 2. Replay split recipes in order.
      const recipes = [...page.splitRecipes].sort((a, b) => a.order - b.order);

      for (const recipe of recipes) {
        materializeMergedZones(recipe.order);

        const srcIdx = pool.findIndex((z) => z.id === recipe.sourceZoneId);
        if (srcIdx < 0) continue; // source not in pool — skip

        const src = pool[srcIdx];
        const children = computeSplitChildren(
          { x: src.x, y: src.y, w: src.w, h: src.h },
          recipe.splitType,
          spacing,
          recipe.sourceZoneId, // splitGroupId — child IDs derive from this
        );

        // Replace source with children, preserving pool order at that position.
        pool = [
          ...pool.slice(0, srcIdx),
          ...children,
          ...pool.slice(srcIdx + 1),
        ];

      }

      materializeMergedZones(Number.MAX_SAFE_INTEGER);
      pool = pool.filter((z) => !hiddenIds.has(z.id));

      return pool.map(applyVisual);
    },
    [availableVisualTypes],
  );

  const zones = useMemo(
    () => resolveZonesForPage(activePage),
    [activePage, resolveZonesForPage],
  );

  const resolvedZonesPerPage = useMemo(
    () => reportState.pages.map((page) => ({ pageId: page.id, zones: resolveZonesForPage(page) })),
    [reportState.pages, resolveZonesForPage],
  );

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) || null,
    [zones, selectedZoneId],
  );

  // ─── Undo / Redo ──────────────────────────────────────────────────────────

  const activeHistory = useMemo(
    () => pageHistory[activePage.id] || { past: [], future: [] },
    [pageHistory, activePage.id],
  );
  const canUndo = activeHistory.past.length > 0;
  const canRedo = activeHistory.future.length > 0;

  /** Push a snapshot of the page to its undo stack and clear the redo stack. */
  const pushToHistory = (pageId: string, snapshot: ReportPage) => {
    setPageHistory((prev) => {
      const existing = prev[pageId] || { past: [], future: [] };
      return {
        ...prev,
        [pageId]: {
          past: [...existing.past.slice(-29), snapshot],
          future: [],
        },
      };
    });
  };

  const handleUndo = () => {
    const history = pageHistory[activePage.id];
    if (!history || history.past.length === 0) return;

    const previousPage = history.past[history.past.length - 1];
    const currentPage = activePage;

    setPageHistory((prev) => ({
      ...prev,
      [activePage.id]: {
        past: history.past.slice(0, -1),
        future: [currentPage, ...(history.future || []).slice(0, 29)],
      },
    }));
    setReportState((current) => ({
      ...current,
      pages: current.pages.map((p) => (p.id === current.activePageId ? previousPage : p)),
    }));
    setSelectedZoneId(null);
    setSelectedZoneIds([]);
  };

  const handleRedo = () => {
    const history = pageHistory[activePage.id];
    if (!history || history.future.length === 0) return;

    const nextPage = history.future[0];
    const currentPage = activePage;

    setPageHistory((prev) => ({
      ...prev,
      [activePage.id]: {
        past: [...(history.past || []).slice(-29), currentPage],
        future: history.future.slice(1),
      },
    }));
    setReportState((current) => ({
      ...current,
      pages: current.pages.map((p) => (p.id === current.activePageId ? nextPage : p)),
    }));
    setSelectedZoneId(null);
    setSelectedZoneIds([]);
  };

  // Use refs so the keyboard handler doesn't need to be recreated on every render.
  const handleUndoRef = useRef(handleUndo);
  const handleRedoRef = useRef(handleRedo);
  useEffect(() => { handleUndoRef.current = handleUndo; });
  useEffect(() => { handleRedoRef.current = handleRedo; });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndoRef.current();
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        handleRedoRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ─── State helpers ────────────────────────────────────────────────────────

  const showToast = (text: string, error = false) => {
    setToast({ text, error });
    window.setTimeout(() => setToast(null), 2400);
  };

  const updateActivePage = (
    patch: PagePatch,
    { skipHistory = false }: { skipHistory?: boolean } = {},
  ) => {
    if (!skipHistory) {
      pushToHistory(reportState.activePageId, activePage);
    }
    setReportState((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === current.activePageId ? { ...page, ...patch } : page,
      ),
    }));
  };

  // ─── Page management ──────────────────────────────────────────────────────

  const handleSwitchPage = (pageId: string) => {
    setSelectedZoneId(null);
    setSelectedZoneIds([]);
    setReportState((current) => ({ ...current, activePageId: pageId }));
  };

  const handleAddPage = () => {
    const nextNum = nextPageNumber(reportState.pages);
    const newPage = createDefaultPage(`Page ${nextNum}`);
    setReportState((current) => ({
      pages: [...current.pages, newPage],
      activePageId: newPage.id,
    }));
    setSelectedZoneId(null);
    setSelectedZoneIds([]);
  };

  const handleDuplicatePage = (pageId: string) => {
    const source = reportState.pages.find((p) => p.id === pageId);
    if (!source) return;
    const newName = `Duplicate ${source.name}`;
    const newPage = duplicatePage(source, newName);
    setReportState((current) => ({
      pages: [...current.pages, newPage],
      activePageId: newPage.id,
    }));
    setSelectedZoneId(null);
    setSelectedZoneIds([]);
    showToast(`Duplicated "${source.name}"`);
  };

  const handleRenamePage = (pageId: string, newName: string) => {
    setReportState((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === pageId
          ? { ...page, name: newName, layoutState: { ...page.layoutState, reportName: newName } }
          : page,
      ),
    }));
  };

  const handleDeletePage = (pageId: string) => {
    if (reportState.pages.length <= 1) return;
    setReportState((current) => {
      const remaining = current.pages.filter((p) => p.id !== pageId);
      const newActiveId =
        current.activePageId === pageId
          ? (remaining[remaining.length - 1]?.id ?? remaining[0].id)
          : current.activePageId;
      return { pages: remaining, activePageId: newActiveId };
    });
    setSelectedZoneId(null);
    setSelectedZoneIds([]);
  };

  const handleResetPage = () => {
    updateActivePage({
      layoutState: { ...DEFAULT_LAYOUT_STATE, reportName: activePage.name },
      visualAssignments: {},
      splitRecipes: [],
      frozenZones: [],
      hiddenZoneIds: [],
    });
    setSelectedZoneId(null);
    setSelectedZoneIds([]);
    showToast(`"${activePage.name}" reset to defaults`);
  };

  // ─── Layout / visual changes ──────────────────────────────────────────────

  const handleLayoutChange = (next: LayoutState) => {
    if (isSpacingOnlyChange(normalizedState, next)) {
      // Spacing-only: keep split recipes — children recalculate automatically
      // because computeSplitChildren is called fresh with the live zoneGap.
      updateActivePage({ layoutState: next });
      return;
    }

    if (isStructuralChange(normalizedState, next)) {
      // Structural change alters zone IDs — clear all split state to avoid
      // stale recipes referencing zones that no longer exist.
      setSelectedZoneId(null);
      setSelectedZoneIds([]);
      updateActivePage({
        layoutState: next,
        splitRecipes: [],
        frozenZones: [],
        hiddenZoneIds: [],
      });
      return;
    }

    // Non-structural, non-spacing change (e.g. canvas size, title height):
    // keep split state but clear selection.
    setSelectedZoneId(null);
    setSelectedZoneIds([]);
    updateActivePage({ layoutState: next });
  };

  const handleAssignVisual = (zoneId: string, visualType: VisualType) => {
    updateActivePage({
      visualAssignments: { ...activePage.visualAssignments, [zoneId]: visualType },
    });
  };

  // ─── KPI / title icon assignment (Phase 4C/E) ─────────────────────────────

  const makeKpiAssignment = (iconId: string, placement: "left" | "right", existing?: KpiIconAssignment): KpiIconAssignment => ({
    iconId,
    placement,
    size: existing?.size ?? DEFAULT_KPI_ICON_SIZE,
    gap: existing?.gap ?? DEFAULT_KPI_ICON_GAP,
    customizationSnapshot: iconBundle ? { ...iconBundle.customization } : undefined,
  });

  const handlePlaceKpiIcon = (zoneId: string, placement: "left" | "right") => {
    if (!activeIconId) return;
    const existing = activePage.kpiIcons?.[zoneId];
    updateActivePage({
      kpiIcons: { ...(activePage.kpiIcons ?? {}), [zoneId]: makeKpiAssignment(activeIconId, placement, existing) },
    });
  };

  const handleRemoveKpiIcon = (zoneId: string) => {
    const next = { ...(activePage.kpiIcons ?? {}) };
    delete next[zoneId];
    updateActivePage({ kpiIcons: next });
  };

  const handleKpiIconOption = (zoneId: string, patch: Partial<Pick<KpiIconAssignment, "size" | "gap">>) => {
    const existing = activePage.kpiIcons?.[zoneId];
    if (!existing) return;
    updateActivePage({ kpiIcons: { ...(activePage.kpiIcons ?? {}), [zoneId]: { ...existing, ...patch } } });
  };

  /** First selected icon → first KPI, second → second, in order; stops (does
   *  not silently repeat) when the icons run out. */
  const handleAssignIconsSequentially = () => {
    const kpiZones = zones.filter((z) => z.type === "kpi");
    if (kpiZones.length === 0 || bundleIcons.length === 0) return;
    const next = { ...(activePage.kpiIcons ?? {}) };
    const count = Math.min(kpiZones.length, bundleIcons.length);
    for (let i = 0; i < count; i++) {
      next[kpiZones[i].id] = makeKpiAssignment(bundleIcons[i].id, next[kpiZones[i].id]?.placement ?? "left", next[kpiZones[i].id]);
    }
    updateActivePage({ kpiIcons: next });
    showToast(count < kpiZones.length
      ? `Assigned ${count} icon${count === 1 ? "" : "s"} — ${kpiZones.length - count} KPI card(s) left without icons`
      : `Assigned ${count} icon${count === 1 ? "" : "s"} sequentially`);
  };

  const handleApplyActiveIconToAllKpis = () => {
    if (!activeIconId) return;
    const kpiZones = zones.filter((z) => z.type === "kpi");
    if (kpiZones.length === 0) return;
    const next = { ...(activePage.kpiIcons ?? {}) };
    for (const zone of kpiZones) {
      next[zone.id] = makeKpiAssignment(activeIconId, next[zone.id]?.placement ?? "left", next[zone.id]);
    }
    updateActivePage({ kpiIcons: next });
    showToast(`Applied the active icon to ${kpiZones.length} KPI card${kpiZones.length === 1 ? "" : "s"}`);
  };

  const handleClearKpiIcons = () => {
    updateActivePage({ kpiIcons: {} });
    showToast("KPI icons cleared");
  };

  const handleSetTitleIcon = (placement: "leading" | "trailing") => {
    if (!activeIconId) return;
    updateActivePage({ titleIcon: { iconId: activeIconId, placement } });
  };

  const handleRemoveTitleIcon = () => {
    updateActivePage({ titleIcon: null });
  };

  // ─── Split zones ──────────────────────────────────────────────────────────
  //
  // handleSplitZone always targets the SELECTED zone, never its parent.
  // This is the key fix: splitting a child zone splits THAT child, not the group.
  //
  // For nested splits to work:
  //   - Recipe 1: sourceZoneId = "chart_3", splitType = "two-columns"
  //     → creates chart_3_split_1, chart_3_split_2 in the pool
  //   - Recipe 2: sourceZoneId = "chart_3_split_1", splitType = "three-rows"
  //     → finds chart_3_split_1 in pool (put there by Recipe 1), splits it
  //     → creates chart_3_split_1_split_1, chart_3_split_1_split_2, chart_3_split_1_split_3
  //
  // When spacing changes, both recipes replay with the new spacing value,
  // so all child dimensions recalculate from scratch. No stale coordinates.

  const handleSplitZone = (zoneId: string, splitType: SplitType) => {
    let nextRecipes = [...activePage.splitRecipes];
    const nextVisualAssignments = { ...activePage.visualAssignments };

    // Helper: remove nested recipes and visual assignments for all descendants
    // of zoneId (IDs that start with "zoneId_split_").
    const clearDescendants = (parentId: string) => {
      const prefix = `${parentId}_split_`;
      nextRecipes = nextRecipes.filter((r) => !r.sourceZoneId.startsWith(prefix));
      for (const key of Object.keys(nextVisualAssignments)) {
        if (key.startsWith(prefix)) delete nextVisualAssignments[key];
      }
    };

    if (splitType === "none") {
      // Remove this zone's recipe (restores the zone as an unsplit zone).
      // Also remove any nested recipes for its descendants.
      clearDescendants(zoneId);
      nextRecipes = nextRecipes.filter((r) => r.sourceZoneId !== zoneId);
      setSelectedZoneId(zoneId); // re-select the zone (now unsplit)
    } else {
      const existingIdx = nextRecipes.findIndex((r) => r.sourceZoneId === zoneId);

      if (existingIdx >= 0) {
        const old = nextRecipes[existingIdx];
        if (old.splitType !== splitType) {
          // Split type changed — clear old descendants (they won't exist anymore).
          clearDescendants(zoneId);
        }
        // Update split type in place, preserving order.
        nextRecipes = nextRecipes.map((r, i) =>
          i === existingIdx ? { ...r, splitType } : r,
        );
      } else {
        // New split — append at end with the next order number.
        const maxRecipeOrder = nextRecipes.reduce((m, r) => Math.max(m, r.order), -1);
        const maxMergeOrder = activePage.frozenZones.reduce((m, z) => Math.max(m, z.mergeOrder ?? -1), -1);
        const maxOrder = Math.max(maxRecipeOrder, maxMergeOrder);
        nextRecipes = [
          ...nextRecipes,
          {
            recipeId: newRecipeId(),
            sourceZoneId: zoneId,
            splitType,
            order: maxOrder + 1,
          },
        ];
      }

      setSelectedZoneId(getSplitChildId(zoneId, 0));
      setSelectedZoneIds([]);
    }

    updateActivePage({
      splitRecipes: nextRecipes,
      visualAssignments: nextVisualAssignments,
    });
  };

  // ─── Detach split zones ───────────────────────────────────────────────────
  //
  // Detach converts a split group into independent frozen zones:
  //   1. Identify the parent recipe (the recipe that produced the selected child).
  //   2. Collect ALL leaf-node descendants of that group from the current zone pool.
  //   3. Assign new stable IDs to the frozen copies (avoids conflicts if the
  //      original parent is re-split later).
  //   4. Remove the parent recipe (and any nested recipes for its children).
  //   5. Add the parent zone ID to hiddenZoneIds so it doesn't reappear.
  //   6. Store frozen copies in frozenZones — they are independent zones from now on.
  //
  // After detach: frozen zones can be split independently. Selecting a frozen
  // zone and clicking a split type creates a new recipe with sourceZoneId =
  // frozenZone.id. Spacing changes do NOT move frozen zones (their positions
  // are fixed), but child dimensions within a frozen zone DO recalculate when
  // their own recipe reruns with the new spacing.

  const handleDetachSplitZones = () => {
    if (!selectedZone) return;

    // The group parent is identified via the selected zone's parentZoneId.
    const groupParentId = selectedZone.parentZoneId;
    if (!groupParentId) return; // selected zone is not a child — nothing to detach

    const recipe = activePage.splitRecipes.find((r) => r.sourceZoneId === groupParentId);
    if (!recipe) return; // no recipe for this parent

    // Collect ALL visible leaf nodes that belong to this group.
    // A zone is a descendant of groupParentId if its ID starts with
    // "${groupParentId}_split_" (works for any nesting depth).
    const groupPrefix = `${groupParentId}_split_`;
    const descendants = zones.filter(
      (z) => z.id === groupParentId || z.id.startsWith(groupPrefix),
    );

    // Use the leaf zones (zones whose ID is not a prefix of another zone in the pool).
    const zoneIds = new Set(zones.map((z) => z.id));
    const leaves = descendants.filter((z) => {
      // A zone is a leaf if no other zone in the pool has it as parentZoneId.
      return !zones.some((other) => other.parentZoneId === z.id);
    });

    if (leaves.length === 0) return;

    const nextVisualAssignments = { ...activePage.visualAssignments };

    // Create frozen copies with new IDs (avoids conflicts with future splits).
    const frozenChildren: Zone[] = leaves.map((child) => {
      const newId = newFrozenId();
      // Migrate visual assignment to new ID.
      if (nextVisualAssignments[child.id]) {
        nextVisualAssignments[newId] = nextVisualAssignments[child.id];
        delete nextVisualAssignments[child.id];
      }
      return {
        ...child,
        id: newId,
        parentZoneId: undefined,
        splitType: undefined,
        isChildZone: false,
        childIndex: undefined,
        splitGroupId: undefined,
      };
    });

    // Remove the group recipe and all nested recipes for its descendants.
    let nextRecipes = activePage.splitRecipes.filter(
      (r) => r.sourceZoneId !== groupParentId && !r.sourceZoneId.startsWith(groupPrefix),
    );

    // Hide the group parent so it doesn't reappear in the base layout or
    // recipe output after its recipe is removed.
    const nextHiddenIds = [...new Set([...activePage.hiddenZoneIds, groupParentId])];

    // Also hide any recipe-generated zones for old descendants that may still
    // appear in the pool (belt-and-suspenders guard).
    for (const z of descendants) {
      nextHiddenIds.push(z.id);
    }
    const dedupedHiddenIds = [...new Set(nextHiddenIds)];

    updateActivePage({
      splitRecipes: nextRecipes,
      frozenZones: [...activePage.frozenZones, ...frozenChildren],
      hiddenZoneIds: dedupedHiddenIds,
      visualAssignments: nextVisualAssignments,
    });

    setSelectedZoneId(frozenChildren[0]?.id || null);
    setSelectedZoneIds([]);
    showToast("Zones detached — now independent");
  };

  // ─── Merge split group ────────────────────────────────────────────────────
  //
  // Merge is the inverse of split: remove the recipe that produced the selected
  // zone's parent group. The parent zone naturally reappears because it was never
  // added to hiddenZoneIds by a split recipe (only by Detach).

  const handleMergeSplitGroup = () => {
    if (!selectedZone?.parentZoneId) return;

    const groupParentId = selectedZone.parentZoneId;
    const recipe = activePage.splitRecipes.find((r) => r.sourceZoneId === groupParentId);
    if (!recipe) return;

    const groupPrefix = `${groupParentId}_split_`;

    // Remove the group recipe and any nested recipes for its descendants.
    const nextRecipes = activePage.splitRecipes.filter(
      (r) => r.sourceZoneId !== groupParentId && !r.sourceZoneId.startsWith(groupPrefix),
    );

    // Clear visual assignments for child zones only (preserve parent's assignment).
    const nextVisualAssignments = { ...activePage.visualAssignments };
    for (const key of Object.keys(nextVisualAssignments)) {
      if (key.startsWith(groupPrefix)) {
        delete nextVisualAssignments[key];
      }
    }

    updateActivePage({ splitRecipes: nextRecipes, visualAssignments: nextVisualAssignments });
    setSelectedZoneId(groupParentId);
    setSelectedZoneIds([]);
    showToast("Split group merged");
  };

  // ─── Multi-select + Merge Selected Zones ─────────────────────────────────

  const handleCtrlSelectZone = useCallback(
    (id: string) => {
      const isAlreadySelected = selectedZoneIds.includes(id);
      if (isAlreadySelected) {
        // Remove from multi-select; keep primary selection unchanged
        setSelectedZoneIds((prev) => prev.filter((x) => x !== id));
      } else {
        // Bootstrap multi-select from single-select when starting a new group
        if (selectedZoneIds.length === 0 && selectedZoneId && selectedZoneId !== id) {
          setSelectedZoneIds([selectedZoneId, id]);
        } else {
          setSelectedZoneIds((prev) => [...prev, id]);
        }
        setSelectedZoneId(id);
      }
    },
    [selectedZoneIds, selectedZoneId],
  );

  const handleMergeSelectedZones = () => {
    const selected = zones.filter((z) => selectedZoneIds.includes(z.id));
    if (selected.length < 2) return;

    const error = validateMergeRectangle(selected, zones);
    if (error) {
      showToast(error, true);
      return;
    }

    const xMin = Math.min(...selected.map((z) => z.x));
    const yMin = Math.min(...selected.map((z) => z.y));
    const xMax = Math.max(...selected.map((z) => z.x + z.w));
    const yMax = Math.max(...selected.map((z) => z.y + z.h));

    const selectedSourceIds = selected.map((z) => z.id);
    const maxRecipeOrder = activePage.splitRecipes.reduce((m, r) => Math.max(m, r.order), -1);
    const maxMergeOrder = activePage.frozenZones.reduce((m, z) => Math.max(m, z.mergeOrder ?? -1), -1);
    const newId = newMergedId();
    const mergedZone: Zone = {
      id: newId,
      type: "chart",
      visualType: getDefaultVisualType("chart"),
      visualId: getDefaultVisualType("chart"),
      x: xMin,
      y: yMin,
      w: xMax - xMin,
      h: yMax - yMin,
      fields: [],
      isMergedZone: true,
      mergeSourceZoneIds: selectedSourceIds,
      mergeOrder: Math.max(maxRecipeOrder, maxMergeOrder) + 1,
    };

    const selectedIdsSet = new Set(selectedSourceIds);

    // Keep source frozen zones available for future dynamic bound resolution;
    // hiddenZoneIds suppresses them from the final visible pool.
    const nextFrozenZones = [
      ...activePage.frozenZones,
      mergedZone,
    ];

    // Hide selected source zones after the merged zone has recomputed from them.
    const nextHiddenIds = [...new Set([...activePage.hiddenZoneIds, ...selectedSourceIds])];

    // Remove recipes where sourceZoneId is a selected zone or its descendant
    const nextRecipes = activePage.splitRecipes.filter((r) => {
      return !selectedIdsSet.has(r.sourceZoneId) &&
        !selectedSourceIds.some((id) => r.sourceZoneId.startsWith(`${id}_split_`));
    });

    // Clean visual assignments for all selected zones
    const nextVisualAssignments = { ...activePage.visualAssignments };
    for (const id of selectedZoneIds) {
      delete nextVisualAssignments[id];
    }

    updateActivePage({
      frozenZones: nextFrozenZones,
      hiddenZoneIds: nextHiddenIds,
      splitRecipes: nextRecipes,
      visualAssignments: nextVisualAssignments,
    });

    setSelectedZoneIds([]);
    setSelectedZoneId(newId);
    showToast(`${selected.length} zones merged`);
  };

  const mergeValidationError = useMemo(() => {
    if (selectedZoneIds.length < 2) return null;
    const selected = zones.filter((z) => selectedZoneIds.includes(z.id));
    return validateMergeRectangle(selected, zones);
  }, [selectedZoneIds, zones]);

  // ─── Exports ──────────────────────────────────────────────────────────────

  const handleExportJson = () => {
    const data = buildMultiPageExport(reportState, resolvedZonesPerPage);
    downloadBlob(JSON.stringify(data, null, 2), "pbi_layout.json", "application/json");
    showToast("Downloaded pbi_layout.json");
  };

  const handleExportCsv = () => {
    downloadBlob(
      buildMultiPageCsv(reportState, resolvedZonesPerPage),
      "zone_coordinates.csv",
      "text/csv;charset=utf-8",
    );
    showToast("Downloaded zone_coordinates.csv");
  };

  const handleExportPbit = async () => {
    setExportingPbit(true);
    try {
      // Layout-only export: user-created pages only, without icon-image
      // zones — generated icon pages and assigned icons ship via the
      // combined export, which registers the required image resources.
      const userPages = reportState.pages.filter((p) => p.generated !== "icon-library");
      const userState = { ...reportState, pages: userPages };
      const userResolved = resolvedZonesPerPage.filter((e) => userPages.some((p) => p.id === e.pageId));
      await exportMultiPagePbit(userState, userResolved);
      showToast(
        `Downloaded Layout.pbit (${userPages.length} page${userPages.length > 1 ? "s" : ""})`,
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to export Layout.pbit.", true);
    } finally {
      setExportingPbit(false);
    }
  };

  // ─── Cross-module integration (Theme Builder / Icon Studio handoff) ───────
  //
  // Navigating away unmounts this component, so its local useState (pages,
  // zones, selection) is parked in sessionStorage first and restored via the
  // lazy initializers above when the user comes back.

  const persistSessionForHandoff = () => {
    saveLayoutSessionSnapshot({ reportState, selectedZoneId, selectedZoneIds, includeTheme });
  };

  const handleAddIcons = () => {
    persistSessionForHandoff();
    setIntegrationSourceModule("layout-builder");
    setIntegrationReturnRoute("/layout-builder");
    router.push("/icons?returnTo=/layout-builder");
  };

  const handleClearIcons = () => {
    clearIconBundle();
    showToast("Icons cleared from this export");
  };

  const handleSelectTheme = () => {
    persistSessionForHandoff();
    setIntegrationSourceModule("layout-builder");
    setIntegrationReturnRoute("/layout-builder");
    router.push("/editor?returnTo=/layout-builder");
  };

  const handleToggleIncludeTheme = () => setIncludeTheme((current) => !current);

  const handleExportCombinedPbit = async () => {
    if (iconCount === 0 || !iconBundle) {
      showToast("Select icons first (Add Icons) to use the combined export.", true);
      return;
    }
    setExportingCombinedPbit(true);
    try {
      // Combined export: user pages (with KPI/title icon assignments expanded
      // into independent Image visual zones) + server-generated icon pages
      // from the bundle. Generated in-builder icon pages are excluded so the
      // server does not append a duplicate set.
      const userPages = reportState.pages.filter((p) => p.generated !== "icon-library");
      const userState = { ...reportState, pages: userPages };
      const expandedResolved = resolvedZonesPerPage
        .filter((e) => userPages.some((p) => p.id === e.pageId))
        .map((e) => {
          const page = userPages.find((p) => p.id === e.pageId)!;
          return { pageId: e.pageId, zones: expandZonesWithIcons(e.zones, page) };
        });
      const pageCount = await exportCombinedPbit(userState, expandedResolved, {
        iconBundle,
        themeJSON: includeTheme ? themeSnapshot?.powerBIThemeJSON : undefined,
      });
      showToast(`Downloaded combined .pbit (${pageCount} page${pageCount > 1 ? "s" : ""})`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to export the combined .pbit.", true);
    } finally {
      setExportingCombinedPbit(false);
    }
  };

  // ─── Derived UI values ────────────────────────────────────────────────────

  // The split type applied to the SELECTED zone itself (not its group parent).
  // This is what the split panel highlights. Clicking a split option splits
  // the selected zone, not its parent.
  const selectedSplitType: SplitType =
    selectedZone?.type === "chart"
      ? (activePage.splitRecipes.find((r) => r.sourceZoneId === selectedZone.id)?.splitType ?? "none")
      : "none";

  // Detach / Merge are both available when the selected zone is a split child
  // and its parent recipe still exists in the recipe system.
  const canDetach = Boolean(
    selectedZone?.parentZoneId &&
    activePage.splitRecipes.some((r) => r.sourceZoneId === selectedZone.parentZoneId),
  );

  const canMerge = canDetach;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="lb-shell">
      <Topbar
        canvasHeight={normalizedState.canvasHeight}
        canvasWidth={normalizedState.canvasWidth}
        canRedo={canRedo}
        canUndo={canUndo}
        exportingPbit={exportingPbit}
        iconCount={iconCount}
        pageCount={reportState.pages.length}
        theme={theme}
        zoneCount={zones.length}
        zoom={zoom}
        onAddIcons={handleAddIcons}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onExportPbit={handleExportPbit}
        onRedo={handleRedo}
        onThemeChange={setTheme}
        onUndo={handleUndo}
        onZoomChange={setZoom}
      />
      <IntegrationBar
        exportingCombined={exportingCombinedPbit}
        iconCount={iconCount}
        iconPageCount={iconPageCount}
        includeTheme={includeTheme}
        layoutPageCount={reportState.pages.length}
        themeName={themeSnapshot?.themeName ?? null}
        onChangeIcons={handleAddIcons}
        onClearIcons={handleClearIcons}
        onExportCombinedPbit={handleExportCombinedPbit}
        onSelectTheme={handleSelectTheme}
        onToggleIncludeTheme={handleToggleIncludeTheme}
      />
      <div className="app-body">
        <LayoutControls state={normalizedState} onChange={handleLayoutChange} />
        <div className="canvas-column">
          <CanvasPreview
            iconThumbUrl={iconThumbUrl}
            kpiIcons={activePage.kpiIcons}
            selectedZoneId={selectedZoneId}
            selectedZoneIds={selectedZoneIds}
            state={normalizedState}
            titleIcon={activePage.titleIcon}
            zones={zones}
            zoom={zoom}
            onCtrlSelectZone={handleCtrlSelectZone}
            onSelectZone={(id) => { setSelectedZoneId(id); if (id === null) setSelectedZoneIds([]); }}
          />
          <PageManager
            reportState={reportState}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
            onDuplicatePage={handleDuplicatePage}
            onRenamePage={handleRenamePage}
            onResetPage={handleResetPage}
            onSwitchPage={handleSwitchPage}
          />
        </div>
        <VisualPickerPanel
          activeIconId={activeIconId}
          activePage={activePage}
          availableVisualTypes={availableVisualTypes}
          bundleIcons={bundleIcons}
          canDetach={canDetach}
          canMerge={canMerge}
          iconThumbUrl={iconThumbUrl}
          loadingTemplates={loadingTemplates}
          mergeValidationError={mergeValidationError}
          selectedZone={selectedZone}
          selectedZoneIds={selectedZoneIds}
          selectedSplitType={selectedSplitType}
          onApplyActiveIconToAllKpis={handleApplyActiveIconToAllKpis}
          onAssignIconsSequentially={handleAssignIconsSequentially}
          onAssignVisual={handleAssignVisual}
          onChangeIcons={handleAddIcons}
          onClearIcons={handleClearIcons}
          onClearKpiIcons={handleClearKpiIcons}
          onDetachSplitZones={handleDetachSplitZones}
          onKpiIconOption={handleKpiIconOption}
          onMergeSplitGroup={handleMergeSplitGroup}
          onMergeSelectedZones={handleMergeSelectedZones}
          onPlaceKpiIcon={handlePlaceKpiIcon}
          onRemoveKpiIcon={handleRemoveKpiIcon}
          onRemoveTitleIcon={handleRemoveTitleIcon}
          onSelectActiveIcon={setActiveIconId}
          onSetTitleIcon={handleSetTitleIcon}
          onSplitZone={handleSplitZone}
        />
      </div>
      <div aria-hidden className="lb-footer" />
      {toast && <div className={`toast ${toast.error ? "toast-error" : ""}`}>{toast.text}</div>}
    </div>
  );
}