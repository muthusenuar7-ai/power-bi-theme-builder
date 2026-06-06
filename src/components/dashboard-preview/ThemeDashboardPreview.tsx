'use client'

import type { DashboardTheme } from '@/lib/dashboardThemeResolver'
import type { InsightDatum, Tone } from '@/lib/themeDashboardData'
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

function toneColor(theme: DashboardTheme, tone: Tone): string {
  if (tone === 'ok') return theme.good
  if (tone === 'warn') return theme.neutral
  return theme.bad
}

function InsightPanel({ theme, items }: { theme: DashboardTheme; items: InsightDatum[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 7 }}>
      {items.map((item) => {
        const color = toneColor(theme, item.tone)
        return (
          <div
            key={item.label}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '7px 9px 7px 12px',
              borderRadius: 8,
              background: theme.visualBackgroundAlt,
              border: `1px solid ${theme.borderColor}`,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: color }} />
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                color,
                background: `color-mix(in srgb, ${color} 14%, transparent)`,
                border: `1px solid color-mix(in srgb, ${color} 42%, transparent)`,
                fontSize: Math.max(9, theme.labelFontSize - 1),
                fontWeight: 900,
              }}
            >
              {item.tone === 'ok' ? '+' : item.tone === 'warn' ? '!' : '-'}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: Math.max(9, theme.headerFontSize - 1),
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  color: theme.labelColor,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: Math.max(theme.labelFontSize + 1, theme.headerFontSize),
                  fontWeight: 700,
                  color: theme.titleColor,
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.value}
              </div>
            </div>
            <div style={{ fontSize: Math.max(9, theme.labelFontSize - 1), color: theme.mutedText, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {item.sub}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VisualBody({ theme, visual }: { theme: DashboardTheme; visual: VisualSpec }) {
  switch (visual.type) {
    case 'comboLineColumn':
      return <ThemeMiniChart theme={theme} type="comboLineColumn" data={visual.data} />
    case 'donut':
      return <ThemeMiniChart theme={theme} type="donut" data={visual.data} />
    case 'stackedBar':
      return <ThemeMiniChart theme={theme} type="stackedBar" data={visual.data} />
    case 'clusteredColumn':
      return <ThemeMiniChart theme={theme} type="clusteredColumn" data={visual.data} />
    case 'table':
      return <ThemeTableCard theme={theme} rows={visual.data} />
    case 'insight':
      return <InsightPanel theme={theme} items={visual.data} />
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
        <span
          style={{
            fontSize: theme.headerFontSize,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            padding: '5px 11px',
            borderRadius: 999,
            flexShrink: 0,
            color: theme.chipActiveText,
            background: theme.chipActiveBackground,
          }}
        >
          {template.name}
        </span>
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
