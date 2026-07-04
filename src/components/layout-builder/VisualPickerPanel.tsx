'use client'

import { useState, useEffect } from "react";
import type { ReportPage, SplitType, VisualType, Zone } from "@/lib/layout-builder/types/layout";
import type { KpiIconAssignment } from "@/lib/layout-builder/iconIntegration";
import { canAssignVisual, getAssignableVisuals, getVisualLabel } from "@/lib/layout-builder/visualCatalog";
import { VISUAL_ICON_MAP } from "@/lib/layout-builder/visualIcons";
import type { IconLibraryItem } from "@/types";

interface VisualPickerPanelProps {
  selectedZone: Zone | null;
  availableVisualTypes: Set<string> | null;
  loadingTemplates: boolean;
  selectedSplitType: SplitType;
  canDetach: boolean;
  canMerge: boolean;
  selectedZoneIds: string[];
  mergeValidationError: string | null;
  onAssignVisual: (zoneId: string, visualType: VisualType) => void;
  onSplitZone: (zoneId: string, splitType: SplitType) => void;
  onDetachSplitZones: () => void;
  onMergeSplitGroup: () => void;
  onMergeSelectedZones: () => void;
  /* ── Icons (Phase 3C/3D + 4C/E) ── */
  bundleIcons: IconLibraryItem[];
  activeIconId: string | null;
  iconThumbUrl: (iconId: string) => string;
  activePage: ReportPage;
  onSelectActiveIcon: (iconId: string) => void;
  onClearIcons: () => void;
  onChangeIcons: () => void;
  onPlaceKpiIcon: (zoneId: string, placement: "left" | "right") => void;
  onRemoveKpiIcon: (zoneId: string) => void;
  onKpiIconOption: (zoneId: string, patch: Partial<Pick<KpiIconAssignment, "size" | "gap">>) => void;
  onAssignIconsSequentially: () => void;
  onApplyActiveIconToAllKpis: () => void;
  onClearKpiIcons: () => void;
  onSetTitleIcon: (placement: "leading" | "trailing") => void;
  onRemoveTitleIcon: () => void;
}

type SplitOrientation = "rows" | "columns";
const MAX_SPLIT_PARTS = 12;

/** Map parts + orientation to a SplitType. */
function toSplitType(parts: number, orientation: SplitOrientation): SplitType {
  if (orientation === "rows") {
    switch (parts) {
      case 2:  return "two-rows";
      case 3:  return "three-rows";
      case 4:  return "four-rows";
      case 5:  return "five-rows";
      case 6:  return "six-rows";
      case 7:  return "seven-rows";
      case 8:  return "eight-rows";
      case 9:  return "nine-rows";
      case 10: return "ten-rows";
      case 11: return "eleven-rows";
      default: return "twelve-rows";
    }
  }
  switch (parts) {
    case 2:  return "two-columns";
    case 3:  return "three-columns";
    case 4:  return "four-columns";
    case 5:  return "five-columns";
    case 6:  return "six-columns";
    case 7:  return "seven-columns";
    case 8:  return "eight-columns";
    case 9:  return "nine-columns";
    case 10: return "ten-columns";
    case 11: return "eleven-columns";
    default: return "twelve-columns";
  }
}

/** Map an existing SplitType back to parts + orientation for display. */
function fromSplitType(splitType: SplitType): { parts: number; orientation: SplitOrientation } {
  switch (splitType) {
    case "two-rows":      return { parts: 2,  orientation: "rows" };
    case "three-rows":    return { parts: 3,  orientation: "rows" };
    case "four-rows":     return { parts: 4,  orientation: "rows" };
    case "five-rows":     return { parts: 5,  orientation: "rows" };
    case "six-rows":      return { parts: 6,  orientation: "rows" };
    case "seven-rows":    return { parts: 7,  orientation: "rows" };
    case "eight-rows":    return { parts: 8,  orientation: "rows" };
    case "nine-rows":     return { parts: 9,  orientation: "rows" };
    case "ten-rows":      return { parts: 10, orientation: "rows" };
    case "eleven-rows":   return { parts: 11, orientation: "rows" };
    case "twelve-rows":   return { parts: 12, orientation: "rows" };
    case "two-columns":
    case "prop-50-50":    return { parts: 2,  orientation: "columns" };
    case "three-columns": return { parts: 3,  orientation: "columns" };
    case "four-columns":  return { parts: 4,  orientation: "columns" };
    case "five-columns":  return { parts: 5,  orientation: "columns" };
    case "six-columns":   return { parts: 6,  orientation: "columns" };
    case "seven-columns": return { parts: 7,  orientation: "columns" };
    case "eight-columns": return { parts: 8,  orientation: "columns" };
    case "nine-columns":  return { parts: 9,  orientation: "columns" };
    case "ten-columns":   return { parts: 10, orientation: "columns" };
    case "eleven-columns":return { parts: 11, orientation: "columns" };
    case "twelve-columns":return { parts: 12, orientation: "columns" };
    default:              return { parts: 2,  orientation: "columns" };
  }
}

export function VisualPickerPanel({
  selectedZone,
  availableVisualTypes,
  loadingTemplates,
  selectedSplitType,
  canDetach,
  canMerge,
  selectedZoneIds,
  mergeValidationError,
  onAssignVisual,
  onSplitZone,
  onDetachSplitZones,
  onMergeSplitGroup,
  onMergeSelectedZones,
  bundleIcons,
  activeIconId,
  iconThumbUrl,
  activePage,
  onSelectActiveIcon,
  onClearIcons,
  onChangeIcons,
  onPlaceKpiIcon,
  onRemoveKpiIcon,
  onKpiIconOption,
  onAssignIconsSequentially,
  onApplyActiveIconToAllKpis,
  onClearKpiIcons,
  onSetTitleIcon,
  onRemoveTitleIcon,
}: VisualPickerPanelProps) {
  const [iconSearch, setIconSearch] = useState("");
  const filteredIcons = iconSearch.trim()
    ? bundleIcons.filter((i) => i.name.toLowerCase().includes(iconSearch.trim().toLowerCase()))
    : bundleIcons;
  const selectedKpiAssignment = selectedZone?.type === "kpi" ? activePage.kpiIcons?.[selectedZone.id] : undefined;
  const canAssign = selectedZone ? canAssignVisual(selectedZone.type) : false;
  const options = selectedZone ? getAssignableVisuals(selectedZone.type, availableVisualTypes) : [];
  const utilityTypes = new Set<VisualType>(["shape", "textBox"]);
  const visualOptions = options.filter((item) => !utilityTypes.has(item.type));
  const utilityOptions = options.filter((item) => utilityTypes.has(item.type));
  const splitTargetZoneId = selectedZone?.id || "";
  const showSplitOptions = Boolean(selectedZone && selectedZone.type === "chart");

  // Multi-select mode active
  const isMultiSelect = selectedZoneIds.length >= 2;

  // Local split selector state
  const [splitParts, setSplitParts] = useState<number>(2);
  const [splitOrientation, setSplitOrientation] = useState<SplitOrientation>("columns");

  // Sync parts/orientation when the selected zone changes or its split type changes
  useEffect(() => {
    if (selectedSplitType && selectedSplitType !== "none") {
      const parsed = fromSplitType(selectedSplitType);
      setSplitParts(parsed.parts);
      setSplitOrientation(parsed.orientation);
    }
  }, [selectedSplitType, selectedZone?.id]);

  const handleApplySplit = () => {
    if (!splitTargetZoneId) return;
    const splitType = toSplitType(splitParts, splitOrientation);
    onSplitZone(splitTargetZoneId, splitType);
  };

  const handleRemoveSplit = () => {
    if (!splitTargetZoneId) return;
    onSplitZone(splitTargetZoneId, "none");
  };

  const renderOptions = (items: typeof options) => (
    <div className="visual-icon-grid">
      {items.map((item) => {
        const iconUrl = VISUAL_ICON_MAP[item.type];
        const isSelected = selectedZone?.visualType === item.type;
        return (
          <button
            className={`visual-icon-btn ${isSelected ? "sel" : ""}`}
            key={item.type}
            title={item.label}
            type="button"
            onClick={() => selectedZone && onAssignVisual(selectedZone.id, item.type)}
          >
            {iconUrl ? (
              <img
                alt={item.label}
                className="visual-icon-img"
                draggable={false}
                src={iconUrl}
              />
            ) : (
              <span className="visual-icon-fallback">{item.label.slice(0, 2)}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderTextOptions = (items: typeof options) => (
    <div className="shape-text-options">
      {items.map((item) => {
        const isSelected = selectedZone?.visualType === item.type;
        return (
          <button
            className={`shape-text-btn ${isSelected ? "sel" : ""}`}
            key={item.type}
            title={item.label}
            type="button"
            onClick={() => selectedZone && onAssignVisual(selectedZone.id, item.type)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="right-panel">
      <div className="panel-title">Visuals</div>
      <div className="panel-content">

        {/* ── Selected zone ────────────────────────────────────────────── */}
        <section className="panel-section selected-zone-section">
          <div className="section-label">Selected Zone</div>
          {selectedZone ? (
            <div className="selected-zone-card">
              <span className="selected-zone-type">{selectedZone.type}</span>
              <strong>{selectedZone.id}</strong>
              <span>{getVisualLabel(selectedZone.visualType)}</span>
            </div>
          ) : (
            <div className="empty-state">Select a canvas zone</div>
          )}
        </section>

        {/* ── Placeholder picker ───────────────────────────────────────── */}
        <section className="panel-section visual-picker-section">
          <div className="section-label">Placeholder</div>
          {selectedZone && !canAssign && (
            <div className="empty-state">
              {selectedZone.type === "title"
                ? "Title zones use the page title template."
                : selectedZone.type === "kpi"
                  ? "KPI zones use the Card template."
                : "Logo zones are ignored by visual export."}
            </div>
          )}

          {selectedZone && canAssign && (
            <>
              {loadingTemplates && <div className="empty-state">Scanning visual templates...</div>}
              {!loadingTemplates && options.length === 0 && (
                <div className="empty-state">No available templates for this zone type.</div>
              )}
              {!loadingTemplates && options.length > 0 && (
                <div className="visual-picker-body">
                  {visualOptions.length > 0 && (
                    <div className="visual-picker-group">
                      <div className="placeholder-subsection-label">Visuals</div>
                      {renderOptions(visualOptions)}
                    </div>
                  )}
                  {utilityOptions.length > 0 && (
                    <div className="visual-picker-group">
                      <div className="placeholder-subsection-label">Shape &amp; Text</div>
                      {renderTextOptions(utilityOptions)}
                    </div>
                  )}

                  {showSplitOptions && (
                    <div className="split-zone-section">
                      <div className="placeholder-subsection-label">Split Zone</div>

                      {/* Parts stepper */}
                      <div className="split-simple-row">
                        <span className="split-simple-label">Parts</span>
                        <div className="split-parts-stepper">
                          <button
                            className="split-step-btn"
                            disabled={splitParts <= 2}
                            type="button"
                            onClick={() => setSplitParts(Math.max(2, splitParts - 1))}
                          >
                            −
                          </button>
                          <span className="split-parts-value">{splitParts}</span>
                          <button
                            className="split-step-btn"
                            disabled={splitParts >= MAX_SPLIT_PARTS}
                            type="button"
                            onClick={() => setSplitParts(Math.min(MAX_SPLIT_PARTS, splitParts + 1))}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Orientation selector */}
                      <div className="split-simple-row">
                        <span className="split-simple-label">Direction</span>
                        <div className="chip-group">
                          <button
                            className={`chip ${splitOrientation === "columns" ? "sel" : ""}`}
                            type="button"
                            onClick={() => setSplitOrientation("columns")}
                          >
                            Columns
                          </button>
                          <button
                            className={`chip ${splitOrientation === "rows" ? "sel" : ""}`}
                            type="button"
                            onClick={() => setSplitOrientation("rows")}
                          >
                            Rows
                          </button>
                        </div>
                      </div>

                      {/* Apply / Remove buttons */}
                      <div className="split-action-row">
                        <button
                          className="apply-split-btn"
                          type="button"
                          onClick={handleApplySplit}
                        >
                          Apply Split
                        </button>
                        {selectedSplitType !== "none" && (
                          <button
                            className="remove-split-btn"
                            title="Remove split on this zone"
                            type="button"
                            onClick={handleRemoveSplit}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {canMerge && (
                        <button
                          className="merge-split-btn"
                          title="Recombine this split group into a single zone"
                          type="button"
                          onClick={onMergeSplitGroup}
                        >
                          ⊞ Merge Split Group
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!selectedZone && <div className="empty-state">Visual options appear after selection.</div>}
        </section>

        {/* ── Icon placement for the selected KPI / Title zone ─────────── */}
        {selectedZone && (selectedZone.type === "kpi" || selectedZone.type === "title") && bundleIcons.length > 0 && (
          <section className="panel-section icon-placement-section">
            <div className="section-label">
              {selectedZone.type === "kpi" ? "KPI Icon" : "Title Icon"}
            </div>
            {selectedZone.type === "kpi" ? (
              <>
                <div className="chip-group">
                  <button className="chip" disabled={!activeIconId} type="button" onClick={() => onPlaceKpiIcon(selectedZone.id, "left")}>
                    Place Icon Left
                  </button>
                  <button className="chip" disabled={!activeIconId} type="button" onClick={() => onPlaceKpiIcon(selectedZone.id, "right")}>
                    Place Icon Right
                  </button>
                  {selectedKpiAssignment && (
                    <button className="chip" type="button" onClick={() => onRemoveKpiIcon(selectedZone.id)}>
                      Remove Icon
                    </button>
                  )}
                </div>
                {selectedKpiAssignment && (
                  <>
                    <label className="form-row">
                      <span className="form-label">Icon Size ({selectedKpiAssignment.size}px)</span>
                      <input
                        max={72}
                        min={16}
                        type="range"
                        value={selectedKpiAssignment.size}
                        onChange={(e) => onKpiIconOption(selectedZone.id, { size: Number(e.target.value) })}
                      />
                    </label>
                    <label className="form-row">
                      <span className="form-label">Icon Gap ({selectedKpiAssignment.gap}px)</span>
                      <input
                        max={32}
                        min={0}
                        type="range"
                        value={selectedKpiAssignment.gap}
                        onChange={(e) => onKpiIconOption(selectedZone.id, { gap: Number(e.target.value) })}
                      />
                    </label>
                  </>
                )}
              </>
            ) : (
              <div className="chip-group">
                <button className="chip" disabled={!activeIconId} type="button" onClick={() => onSetTitleIcon("leading")}>
                  Leading Icon
                </button>
                <button className="chip" disabled={!activeIconId} type="button" onClick={() => onSetTitleIcon("trailing")}>
                  Trailing Icon
                </button>
                {activePage.titleIcon && (
                  <button className="chip" type="button" onClick={onRemoveTitleIcon}>
                    Remove Title Icon
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── ICONS — selected Icon Studio bundle ──────────────────────── */}
        <section className="panel-section icons-section">
          <div className="section-label">Icons</div>
          {bundleIcons.length === 0 ? (
            <div className="empty-state">
              No icons selected yet.
              <button className="chip" style={{ marginTop: 6 }} type="button" onClick={onChangeIcons}>
                Add Icons from Icon Studio
              </button>
            </div>
          ) : (
            <>
              {bundleIcons.length > 12 && (
                <input
                  className="ctrl"
                  placeholder="Search icons…"
                  type="search"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                />
              )}
              <div className="lb-icon-grid">
                {filteredIcons.map((icon) => (
                  <button
                    className={`lb-icon-tile ${activeIconId === icon.id ? "sel" : ""}`}
                    key={icon.id}
                    title={`${icon.name}${icon.fixedColors ? " · fixed colors" : ""}`}
                    type="button"
                    onClick={() => onSelectActiveIcon(icon.id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={icon.name} className="lb-icon-tile-img" src={iconThumbUrl(icon.id)} />
                    <span className="lb-icon-tile-name">{icon.name}</span>
                  </button>
                ))}
              </div>
              <div className="chip-group" style={{ marginTop: 8 }}>
                <button className="chip" type="button" onClick={onAssignIconsSequentially}>
                  Assign Sequentially to KPIs
                </button>
                <button className="chip" disabled={!activeIconId} type="button" onClick={onApplyActiveIconToAllKpis}>
                  Apply Active to All KPIs
                </button>
                <button className="chip" type="button" onClick={onClearKpiIcons}>
                  Clear KPI Icons
                </button>
              </div>
              <div className="chip-group" style={{ marginTop: 6 }}>
                <button className="chip" type="button" onClick={onChangeIcons}>
                  Change Icons
                </button>
                <button className="chip" type="button" onClick={onClearIcons}>
                  Clear Icons
                </button>
              </div>
            </>
          )}
        </section>

        {isMultiSelect && (
          <section className="panel-section multi-select-section">
            <div className="section-label">Multi-Select</div>
            <div className="multi-select-info">
              <span className="multi-select-count">{selectedZoneIds.length} zones selected</span>
              <span className="multi-select-hint">Ctrl+Click to toggle selection</span>
            </div>
            <button
              className="merge-selected-btn"
              disabled={!!mergeValidationError}
              title={mergeValidationError ?? "Merge selected zones into one"}
              type="button"
              onClick={onMergeSelectedZones}
            >
              ⊞ Merge Selected Zones
            </button>
            {mergeValidationError && (
              <div className="merge-error">{mergeValidationError}</div>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}