'use client'

import type { DashboardTheme } from '@/lib/dashboardThemeResolver'
import type { KpiDatum } from '@/lib/themeDashboardData'

interface Props {
  theme: DashboardTheme
  kpi: KpiDatum
  /** Index into the active palette, drives the accent bar colour. */
  index: number
}

/**
 * ThemeKpiCard — a single KPI tile. The background paints the resolved
 * `cardBackground` (theme-driven, readable on the canvas — never hardcoded
 * white); the left accent bar cycles the active data palette (so palette size is
 * visible here too) and delta colour uses good/bad.
 */
export function ThemeKpiCard({ theme, kpi, index }: Props) {
  const accent = theme.dataColors[index % theme.dataColors.length] ?? theme.primary
  const deltaColor = kpi.positive ? theme.good : theme.bad

  return (
    <div
      style={{
        // Theme-driven card background (not hardcoded white, not transparent).
        background: theme.cardBackground,
        border: theme.borderEnabled ? `${theme.borderWidth}px solid ${theme.borderColor}` : '1px solid transparent',
        borderRadius: theme.borderRadius,
        boxShadow: theme.shadow,
        padding: '10px 12px 10px 14px',
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
      <div
        style={{
          fontSize: theme.labelFontSize,
          color: theme.labelColor,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {kpi.label}
      </div>
      <div
        style={{
          fontSize: theme.calloutFontSize,
          fontWeight: 700,
          color: theme.titleColor,
          letterSpacing: '-.02em',
          lineHeight: 1.1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {kpi.value}
      </div>
      <div style={{ fontSize: Math.max(9, theme.labelFontSize - 1), color: theme.mutedText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span style={{ color: deltaColor, fontWeight: 700 }}>
          {kpi.positive ? '▲' : '▼'} {kpi.delta}
        </span>
        {'  ·  '}
        {kpi.caption}
      </div>
    </div>
  )
}
