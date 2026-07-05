'use client'

import type { LayoutState, ReportPage, Zone, ZoneType } from "@/lib/layout-builder/types/layout";
import {
  computeKpiIconPlacement,
  computeTitleIconPlacement,
  type KpiIconAssignment,
} from "@/lib/layout-builder/iconIntegration";
import { getVisualLabel } from "@/lib/layout-builder/visualCatalog";
import { CanvasZoomBar } from "./CanvasZoomBar";
import { useCanvasZoom } from "./useCanvasZoom";

interface CanvasPreviewProps {
  state: LayoutState;
  zones: Zone[];
  selectedZoneId: string | null;
  selectedZoneIds: string[];
  kpiIcons?: Record<string, KpiIconAssignment>;
  titleIcon?: ReportPage["titleIcon"];
  iconThumbUrl: (iconId: string) => string;
  onSelectZone: (id: string | null) => void;
  onCtrlSelectZone: (id: string) => void;
}

const zoneTheme: Record<ZoneType, { border: string; fill: string }> = {
  title: { border: "rgba(109,40,217,0.45)", fill: "rgba(109,40,217,0.05)" },
  kpi: { border: "rgba(0,113,227,0.45)", fill: "rgba(0,113,227,0.05)" },
  slicer: { border: "rgba(5,150,105,0.45)", fill: "rgba(5,150,105,0.05)" },
  chart: { border: "rgba(180,83,9,0.45)", fill: "rgba(180,83,9,0.05)" },
  logo: { border: "rgba(190,24,93,0.45)", fill: "rgba(190,24,93,0.05)" },
};

export function CanvasPreview({
  state,
  zones,
  selectedZoneId,
  selectedZoneIds,
  kpiIcons,
  titleIcon,
  iconThumbUrl,
  onSelectZone,
  onCtrlSelectZone,
}: CanvasPreviewProps) {
  // Zoom affects only this preview — never the layout model or exports.
  const zoomCtl = useCanvasZoom({
    canvasWidth: state.canvasWidth,
    canvasHeight: state.canvasHeight,
  });
  const zoom = zoomCtl.scale;
  /** Assigned KPI/title icon for a zone, with its icon box + adjusted content box. */
  const assignedIconFor = (
    zone: Zone,
  ): { iconId: string; box: { x: number; y: number; w: number; h: number }; hostBox: { x: number; y: number; w: number; h: number } } | null => {
    if (zone.type === "kpi") {
      const assignment = kpiIcons?.[zone.id];
      if (assignment) {
        const placement = computeKpiIconPlacement(zone, assignment);
        return { iconId: assignment.iconId, box: placement.iconBox, hostBox: placement.hostBox };
      }
    }
    if (zone.type === "title" && titleIcon?.iconId) {
      const placement = computeTitleIconPlacement(zone, titleIcon);
      return { iconId: titleIcon.iconId, box: placement.iconBox, hostBox: placement.hostBox };
    }
    return null;
  };
  return (
    <main className="canvas-area">
      <div className="canvas-toolbar">
        <span className="canvas-info">
          Canvas: <strong>{state.canvasWidth}x{state.canvasHeight}</strong>
        </span>
        <span className="canvas-info">
          Zones: <strong>{zones.length}</strong>
        </span>
        <CanvasZoomBar zoom={zoomCtl} />
      </div>
      <div className="canvas-viewport" ref={zoomCtl.viewportRef}>
        <div
          className="canvas-el"
          style={{ width: state.canvasWidth * zoom, height: state.canvasHeight * zoom }}
          onClick={() => onSelectZone(null)}
        >
          {zones.map((zone) => {
            const theme = zoneTheme[zone.type] || zoneTheme.chart;
            const isSelected = zone.id === selectedZoneId;
            const isMultiSelected = selectedZoneIds.includes(zone.id);
            const left = Math.round(zone.x * zoom);
            const top = Math.round(zone.y * zoom);
            const right = Math.round((zone.x + zone.w) * zoom);
            const bottom = Math.round((zone.y + zone.h) * zoom);
            const assigned = assignedIconFor(zone);
            // Keep the zone label inside the content area so it never sits
            // under an assigned icon (works for both left and right placement).
            const labelStyle = assigned
              ? {
                  left: Math.round((assigned.hostBox.x - zone.x) * zoom) + 6,
                  maxWidth: Math.max(24, Math.round(assigned.hostBox.w * zoom) - 12),
                }
              : undefined;
            return (
              <button
                aria-label={`${zone.type} zone`}
                className="zone"
                key={zone.id}
                style={{
                  left,
                  top,
                  width: Math.max(1, right - left),
                  height: Math.max(1, bottom - top),
                  borderRadius: Math.max(3, 8 * zoom),
                  background: isMultiSelected && !isSelected
                    ? theme.fill.replace("0.05", "0.11")
                    : theme.fill,
                  border: isSelected
                    ? `2px solid ${theme.border.replace("0.45", "0.95")}`
                    : isMultiSelected
                      ? `2px dashed ${theme.border.replace("0.45", "0.80")}`
                      : `1.5px solid ${theme.border}`,
                  boxShadow: isSelected
                    ? `0 0 0 3px ${theme.border.replace("0.45", "0.18")}`
                    : isMultiSelected
                      ? `0 0 0 2px ${theme.border.replace("0.45", "0.12")}`
                      : "none",
                }}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (event.ctrlKey || event.metaKey) {
                    onCtrlSelectZone(zone.id);
                  } else {
                    onSelectZone(zone.id);
                  }
                }}
              >
                {zone.iconId ? (
                  // Generated icon-page zone: show the actual icon artwork.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={zone.label || zone.iconId}
                    draggable={false}
                    src={iconThumbUrl(zone.iconId)}
                    style={{
                      width: Math.max(10, Math.min(zone.w, zone.h) * zoom * 0.7),
                      height: Math.max(10, Math.min(zone.w, zone.h) * zoom * 0.7),
                      objectFit: "contain",
                      pointerEvents: "none",
                    }}
                  />
                ) : (
                  <span className="zone-label" style={labelStyle}>
                    <span>{zone.type}</span>
                    <strong>{zone.type === "title" ? zone.label || "Report Title" : getVisualLabel(zone.visualType)}</strong>
                  </span>
                )}
                {assigned && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    draggable={false}
                    src={iconThumbUrl(assigned.iconId)}
                    style={{
                      position: "absolute",
                      left: Math.round((assigned.box.x - zone.x) * zoom),
                      top: Math.round((assigned.box.y - zone.y) * zoom),
                      width: Math.max(8, Math.round(assigned.box.w * zoom)),
                      height: Math.max(8, Math.round(assigned.box.h * zoom)),
                      objectFit: "contain",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}