'use client'

import { Layers, Link2Off, Palette, Sparkles } from 'lucide-react'

interface IntegrationBarProps {
  iconCount: number;
  iconPageCount: number;
  themeName: string | null;
  includeTheme: boolean;
  layoutPageCount: number;
  exportingCombined: boolean;
  onChangeIcons: () => void;
  onClearIcons: () => void;
  onToggleIncludeTheme: () => void;
  onSelectTheme: () => void;
  onExportCombinedPbit: () => void;
}

/**
 * Compact status row for the Theme Builder / Icon Studio handoff — kept
 * separate from the main Topbar so that toolbar does not get overcrowded.
 * Always visible (shows "No icons selected" / "No Theme Selected" when
 * nothing has been handed off yet) so the affordance is discoverable.
 */
export function IntegrationBar({
  iconCount,
  iconPageCount,
  themeName,
  includeTheme,
  layoutPageCount,
  exportingCombined,
  onChangeIcons,
  onClearIcons,
  onToggleIncludeTheme,
  onSelectTheme,
  onExportCombinedPbit,
}: IntegrationBarProps) {
  return (
    <div className="integration-bar" aria-label="Theme and icon integration">
      <span className="integration-chip">
        <Layers size={13} strokeWidth={2} />
        {iconCount > 0 ? `${iconCount} icon${iconCount === 1 ? '' : 's'} included · ${iconPageCount} page${iconPageCount === 1 ? '' : 's'}` : 'No icons selected'}
      </span>
      <button type="button" className="btn btn-sm" onClick={onChangeIcons}>
        {iconCount > 0 ? 'Change Icons' : 'Add Icons'}
      </button>
      {iconCount > 0 && (
        <button type="button" className="btn btn-sm" onClick={onClearIcons} title="Remove icons from this export">
          <Link2Off size={12} strokeWidth={2} /> Clear Icons
        </button>
      )}

      <div className="topbar-divider" />

      <span className="integration-chip">
        <Palette size={13} strokeWidth={2} />
        {themeName ? `Theme: ${themeName}` : 'No Theme Selected'}
      </span>
      {themeName ? (
        <>
          <label className="integration-toggle">
            <input type="checkbox" checked={includeTheme} onChange={onToggleIncludeTheme} />
            Include Current Theme in PBIT
          </label>
          <button type="button" className="btn btn-sm" onClick={onSelectTheme}>Change Theme</button>
        </>
      ) : (
        <button type="button" className="btn btn-sm" onClick={onSelectTheme}>
          <Sparkles size={12} strokeWidth={2} /> Select Theme
        </button>
      )}

      <div style={{ flex: 1 }} />

      <button
        type="button"
        className="btn btn-sm btn-accent"
        disabled={iconCount === 0 || exportingCombined}
        title={iconCount === 0 ? 'Select icons first (Add Icons) to enable the combined export' : `${layoutPageCount} layout page${layoutPageCount === 1 ? '' : 's'} + ${iconPageCount} icon page${iconPageCount === 1 ? '' : 's'}`}
        onClick={onExportCombinedPbit}
      >
        {exportingCombined ? 'Building combined template…' : 'Export Layout + Icons.pbit'}
      </button>
    </div>
  )
}
