'use client'

import { CHART_POOL } from '@/lib/chartPool'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { getGeneralPreviewStyles } from '@/lib/formatPreview'
import { useThemeStore } from '@/store/themeStore'

interface Props { chartId: string }

export function FocusView({ chartId }: Props) {
  const chart         = CHART_POOL.find((c) => c.id === chartId)
  const formatProps   = useThemeStore((s) => s.formatProps)
  const bg            = useThemeStore((s) => s.bg)
  const fg            = useThemeStore((s) => s.fg)
  const visualTitles  = useThemeStore((s) => s.visualTitles)
  const setVisualTitle = useThemeStore((s) => s.setVisualTitle)

  if (!chart) return null

  const visualTitle = visualTitles[chartId]
  const { cardStyle, titleStyle, subtitleStyle, title, subtitle, showTitle, showSubtitle } = getGeneralPreviewStyles(formatProps, {
    background: bg,
    foreground: fg,
    border: '#E5E7EB',
    title: visualTitle ?? chart.title,
    subtitle: chart.sub,
  })

  const displayTitle = visualTitle ?? title.text

  return (
    <div style={{
      position: 'absolute',
      inset: '44px 20px 20px 20px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        ...cardStyle,
        flex: 1,
        display: 'flex', flexDirection: 'column',
        minHeight: 0,
      }}>
        {showTitle && (
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
              ...titleStyle,
              fontSize: (titleStyle.fontSize as number | undefined) ?? 18,
              letterSpacing: 0,
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              cursor: 'text',
              width: '100%',
              fontFamily: 'inherit',
              padding: 0,
            }}
          />
        )}
        {showSubtitle && (
          <div style={{ ...subtitleStyle, marginTop: 2, flexShrink: 0 }}>
            {subtitle.text}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, marginTop: 14, display: 'flex', alignItems: 'stretch' }}>
          <ChartRenderer visualId={chartId} size="focus" />
        </div>
      </div>
    </div>
  )
}
