'use client'

import type { DashboardTheme } from '@/lib/dashboardThemeResolver'
import { getDashboardTemplate, type VisualSpec } from '@/lib/themeDashboardTemplates'
import { ThemeSlicerBar } from './ThemeSlicerBar'
import { ThemeKpiCard } from './ThemeKpiCard'
import { ThemeVisualCard } from './ThemeVisualCard'
import { ThemeMiniChart } from './ThemeMiniChart'
import { ThemeTableCard } from './ThemeTableCard'

interface Props {
  theme: DashboardTheme
  spacing: number
}

const FONT = "var(--preview-font-family, 'Segoe UI', sans-serif)"

function VisualBody({ theme, visual }: { theme: DashboardTheme; visual: VisualSpec }) {
  switch (visual.type) {
    case 'comboLineColumn':
      return <ThemeMiniChart theme={theme} type="comboLineColumn" data={visual.data} />
    case 'donut':
      return <ThemeMiniChart theme={theme} type="donut" data={visual.data} />
    case 'treemap':
      return <ThemeMiniChart theme={theme} type="treemap" data={visual.data} />
    case 'stackedBar':
      return <ThemeMiniChart theme={theme} type="stackedBar" data={visual.data} />
    case 'clusteredColumn':
      return <ThemeMiniChart theme={theme} type="clusteredColumn" data={visual.data} />
    case 'table':
      return <ThemeTableCard theme={theme} rows={visual.data} />
  }
}

export function ThemeDashboardPreview({ theme, spacing }: Props) {
  const template = getDashboardTemplate('sales')
  const gap = Math.max(8, Math.min(spacing, 16))

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap,
        color: theme.foreground,
        fontFamily: theme.fontFamily || FONT,
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: Math.max(theme.titleFontSize + 8, 18),
              fontWeight: 750,
              letterSpacing: 0,
              color: theme.titleColor,
              background: theme.titleBackground,
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {template.title}
          </div>
          <div style={{ fontSize: theme.subtitleFontSize, color: theme.subtitleColor, marginTop: 2, whiteSpace: 'nowrap' }}>
            {template.subtitle}
          </div>
        </div>
      </div>

      <ThemeSlicerBar theme={theme} slicers={template.slicers} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${template.kpis.length}, 1fr)`,
          gap,
          flexShrink: 0,
        }}
      >
        {template.kpis.map((kpi, i) => (
          <ThemeKpiCard key={kpi.label} theme={theme} kpi={kpi} index={i} />
        ))}
      </div>

      {template.rows.map((row, ri) => (
        <div
          key={ri}
          style={{
            display: 'grid',
            gridTemplateColumns: row.columns,
            gap,
            flex: ri === 0 ? 1.08 : 1,
            minHeight: 0,
          }}
        >
          {row.visuals.map((visual) => (
            <ThemeVisualCard
              key={visual.id}
              theme={theme}
              title={visual.title}
              subtitle={visual.subtitle}
              tag={visual.tag}
            >
              <VisualBody theme={theme} visual={visual} />
            </ThemeVisualCard>
          ))}
        </div>
      ))}
    </div>
  )
}
