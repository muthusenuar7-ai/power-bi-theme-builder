'use client'

import { CHART_POOL } from '@/lib/chartPool'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { resolveEffectiveFormat } from '@/lib/effectiveFormatResolver'
import { getDashboardTemplate } from '@/lib/dashboardTemplates'
import type { DashboardTheme } from '@/lib/dashboardThemeResolver'
import { useThemeStore } from '@/store/themeStore'

interface Props {
  chartId: string
  theme?: DashboardTheme
}

export function FocusView({ chartId, theme }: Props) {
  const chart = CHART_POOL.find((c) => c.id === chartId)
  const formatProps = useThemeStore((s) => s.formatProps)
  const dataColors = useThemeStore((s) => s.dataColors)
  const paletteSize = useThemeStore((s) => s.paletteSize)
  const bg = useThemeStore((s) => s.bg)
  const customCanvasBackground = useThemeStore((s) => s.customCanvasBackground)
  const canvasBackgroundMode = useThemeStore((s) => s.canvasBackgroundMode)
  const fg = useThemeStore((s) => s.fg)
  const visualBackground = useThemeStore((s) => s.visualBackground)
  const cardBackground = useThemeStore((s) => s.cardBackground)
  const borderColor = useThemeStore((s) => s.borderColor)
  const titleColor = useThemeStore((s) => s.titleColor)
  const labelColor = useThemeStore((s) => s.labelColor)
  const visualBackgroundMode = useThemeStore((s) => s.visualBackgroundMode)
  const primary = useThemeStore((s) => s.primary)
  const accent = useThemeStore((s) => s.accent)
  const good = useThemeStore((s) => s.good)
  const neutral = useThemeStore((s) => s.neutral)
  const bad = useThemeStore((s) => s.bad)
  const tableAccent = useThemeStore((s) => s.tableAccent)
  const gridlineColor = useThemeStore((s) => s.gridlineColor)
  const dividerColor = useThemeStore((s) => s.dividerColor)
  const highlight = useThemeStore((s) => s.highlight)
  const tooltipBackground = useThemeStore((s) => s.tooltipBackground)
  const tableHeaderBackground = useThemeStore((s) => s.tableHeaderBackground)
  const tableRowAlt = useThemeStore((s) => s.tableRowAlt)
  const domain = useThemeStore((s) => s.dashboardDomain)
  const visualTitles = useThemeStore((s) => s.visualTitles)
  const setVisualTitle = useThemeStore((s) => s.setVisualTitle)

  const effective = resolveEffectiveFormat({
    dataColors,
    paletteSize,
    fg,
    bg,
    customCanvasBackground,
    visualBackground,
    cardBackground,
    borderColor,
    titleColor,
    labelColor,
    tableAccent,
    gridlineColor,
    dividerColor,
    highlight,
    tooltipBackground,
    tableHeaderBackground,
    tableRowAlt,
    primary,
    accent,
    good,
    neutral,
    bad,
    canvasBackgroundMode,
    visualBackgroundMode,
    formatProps,
  }, chartId)

  const dataset = getDashboardTemplate(domain).visuals.find((v) => v.id === chartId)?.dataset

  if (!chart) return null

  const visualTitle = visualTitles[chartId]
  const displayTitle = visualTitle ?? chart.title
  const subtitleText = chart.sub
  const titleOverflow = effective.titleWrap
    ? { whiteSpace: 'normal' as const, overflowWrap: 'anywhere' as const }
    : { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const }
  const subtitleOverflow = effective.subtitleWrap
    ? { whiteSpace: 'normal' as const, overflowWrap: 'anywhere' as const }
    : { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const }

  return (
    <div
      style={{
        position: 'absolute',
        inset: '44px 20px 20px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: theme?.visualBackground ?? effective.visualBackground,
          border: effective.borderEnabled ? `${effective.borderWidth}px solid ${effective.borderColor}` : '1px solid transparent',
          borderRadius: effective.borderRadius,
          boxShadow: effective.shadowCss,
          width: '100%',
          maxWidth: 920,
          height: '100%',
          maxHeight: 560,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {effective.titleEnabled && (
          <div
            style={{
              background: effective.titleBackground,
              padding: `${effective.titlePaddingTop}px ${effective.titlePaddingRight}px ${effective.titlePaddingBottom}px ${effective.titlePaddingLeft}px`,
              minHeight: effective.titleHeaderHeight || undefined,
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              value={displayTitle}
              onChange={(e) => setVisualTitle(chartId, e.target.value)}
              onBlur={(e) => {
                if (!e.target.value.trim()) setVisualTitle(chartId, chart.title)
              }}
              onFocus={(e) => e.target.select()}
              title="Click to edit visual title"
              style={{
                fontSize: effective.titleFontSize,
                fontWeight: effective.titleFontWeight,
                fontStyle: effective.titleFontStyle,
                textDecoration: effective.titleTextDecoration,
                color: effective.titleColor,
                letterSpacing: 0,
                lineHeight: 1.18,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                cursor: 'text',
                width: '100%',
                fontFamily: effective.fontFamily,
                textAlign: effective.titleAlignment,
                padding: 0,
                ...titleOverflow,
              }}
            />

            {effective.subtitleEnabled && subtitleText && (
              <div
                style={{
                  fontSize: effective.subtitleFontSize,
                  fontWeight: effective.subtitleFontWeight,
                  fontStyle: effective.subtitleFontStyle,
                  textDecoration: effective.subtitleTextDecoration,
                  color: effective.subtitleColor,
                  marginTop: effective.titleSubtitleGap,
                  lineHeight: 1.22,
                  textAlign: effective.subtitleAlignment,
                  fontFamily: effective.fontFamily,
                  ...subtitleOverflow,
                }}
              >
                {subtitleText}
              </div>
            )}

            {effective.dividerEnabled && effective.dividerWidth > 0 && (
              <div
                aria-hidden="true"
                style={{
                  marginTop: effective.subtitleDividerGap,
                  borderTop: `${effective.dividerWidth}px ${effective.dividerStyle} ${effective.dividerColor}`,
                }}
              />
            )}
          </div>
        )}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            padding: effective.titleEnabled
              ? `${effective.titleAreaSpacing}px ${effective.titlePaddingRight}px ${effective.titlePaddingBottom}px ${effective.titlePaddingLeft}px`
              : `${effective.titlePaddingTop}px ${effective.titlePaddingRight}px ${effective.titlePaddingBottom}px ${effective.titlePaddingLeft}px`,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <ChartRenderer visualId={chartId} size="focus" dataset={dataset} />
        </div>
      </div>
    </div>
  )
}
