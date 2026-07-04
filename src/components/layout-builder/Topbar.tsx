'use client'

import Link from "next/link";
import { Home, ImagePlus, Wand2 } from "lucide-react";

export type Theme = "light" | "soft" | "dark-navy";

const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  soft: "Soft",
  "dark-navy": "Dark Navy",
};

interface TopbarProps {
  canvasWidth: number;
  canvasHeight: number;
  zoneCount: number;
  pageCount: number;
  iconCount: number;
  zoom: number;
  exportingPbit: boolean;
  canUndo: boolean;
  canRedo: boolean;
  theme: Theme;
  onZoomChange: (zoom: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddIcons: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportPbit: () => void;
  onThemeChange: (theme: Theme) => void;
}

export function Topbar({
  canvasWidth,
  canvasHeight,
  zoneCount,
  pageCount,
  iconCount,
  zoom,
  exportingPbit,
  canUndo,
  canRedo,
  theme,
  onZoomChange,
  onUndo,
  onRedo,
  onAddIcons,
  onExportJson,
  onExportCsv,
  onExportPbit,
  onThemeChange,
}: TopbarProps) {
  return (
    <div className="topbar">
      <Link href="/" className="topbar-logo" title="Back to home" style={{ textDecoration: "none" }}>
        {/* Real Datacense brand mark — same asset the Theme Studio header uses. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/datacense-logo.jpg"
          alt="Datacense"
          style={{ height: 26, width: "auto", borderRadius: 4, objectFit: "contain", flexShrink: 0 }}
        />
        <span className="topbar-title">Power BI Layout Builder</span>
        <span className="topbar-badge">PRO</span>
      </Link>
      <div className="topbar-divider" />
      <span className="topbar-section">
        {canvasWidth} x {canvasHeight} · {zoneCount} zones · {pageCount} {pageCount === 1 ? "page" : "pages"}
      </span>
      <div className="topbar-divider" />
      <div className="mode-tabs" aria-label="Canvas zoom">
        {[0.6, 0.75, 1].map((value) => (
          <button
            className={`mode-tab ${zoom === value ? "sel" : ""}`}
            key={value}
            onClick={() => onZoomChange(value)}
            type="button"
          >
            {Math.round(value * 100)}%
          </button>
        ))}
      </div>
      <div className="topbar-divider" />
      <div className="topbar-history" aria-label="Undo / Redo">
        <button
          className="topbar-history-btn"
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          type="button"
          onClick={onUndo}
        >
          ↩
        </button>
        <button
          className="topbar-history-btn"
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          type="button"
          onClick={onRedo}
        >
          ↪
        </button>
      </div>
      <div className="topbar-divider" />
      {/* ── Theme switcher ──────────────────────────────────────── */}
      <div className="theme-switcher" role="group" aria-label="UI Theme">
        <span className="theme-switcher-label">Theme</span>
        {(["light", "soft", "dark-navy"] as Theme[]).map((t) => (
          <button
            key={t}
            className={`theme-opt${theme === t ? " sel" : ""}`}
            title={THEME_LABELS[t]}
            type="button"
            onClick={() => onThemeChange(t)}
          >
            <span className={`theme-dot theme-dot-${t}`} />
          </button>
        ))}
      </div>
      <div className="topbar-actions">
        <button className="btn btn-sm" type="button" onClick={onAddIcons} title="Send icons from Icon Studio to this layout">
          <ImagePlus size={13} strokeWidth={2} /> {iconCount > 0 ? "Change Icons" : "Add Icons"}
        </button>
        <button className="btn btn-sm" type="button" onClick={onExportJson}>
          Export JSON
        </button>
        <button className="btn btn-sm btn-gold" type="button" onClick={onExportCsv}>
          Export CSV
        </button>
        <button className="btn btn-sm btn-accent" type="button" onClick={onExportPbit} disabled={exportingPbit}>
          {exportingPbit ? "Exporting..." : "Export Layout.pbit"}
        </button>
        <Link className="btn btn-sm" href="/editor" title="Open the Theme Builder" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <Wand2 size={13} strokeWidth={2} /> Theme Builder
        </Link>
        <Link className="btn btn-sm" href="/" title="Back to home" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <Home size={13} strokeWidth={2} /> Home
        </Link>
      </div>
    </div>
  );
}