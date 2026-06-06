'use client'

import { calculateQualityScore, getContrastRatio, meetsWCAG_AA } from '@/lib/colorUtils'
import { useThemeStore } from '@/store/themeStore'

type Metric = {
  label: string
  score: number
}

function metricColor(score: number): string {
  if (score >= 75) return '#10B981'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

export function QualityScore() {
  const dataColors = useThemeStore((s) => s.dataColors)
  const bg = useThemeStore((s) => s.bg)
  const fg = useThemeStore((s) => s.fg)
  const activeColors = dataColors.length ? dataColors : ['#0D9488']
  const overall = calculateQualityScore(activeColors, bg, fg)
  const contrastRatio = getContrastRatio(fg, bg)
  const readableColors = activeColors.filter((color) => meetsWCAG_AA(color, bg)).length
  const uniqueColors = new Set(activeColors.map((color) => color.toUpperCase())).size

  const metrics: Metric[] = [
    { label: 'Contrast', score: Math.min(100, Math.round((contrastRatio / 7) * 100)) },
    { label: 'Readability', score: Math.round((readableColors / Math.max(1, activeColors.length)) * 100) },
    { label: 'Consistency', score: Math.round((uniqueColors / Math.max(1, activeColors.length)) * 100) },
    { label: 'Accessibility', score: Math.min(100, Math.round((contrastRatio / 4.5) * 82)) },
  ]

  const circumference = 2 * Math.PI * 26
  const overallColor = metricColor(overall)

  return (
    <div style={{ margin: '0 14px 14px' }}>
      <div
        style={{
          padding: 12,
          borderRadius: 'var(--r-md)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-ui)',
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--text-3)',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Quality Score
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" aria-label={`Quality score: ${overall}`}>
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border-ui)" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke={overallColor}
                strokeWidth="5"
                strokeDasharray={`${circumference * (overall / 100)} ${circumference}`}
                strokeDashoffset={circumference * 0.25}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
              <text x="32" y="36" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)" fontFamily="inherit">
                {overall}
              </text>
            </svg>
          </div>

          {metrics.map((metric) => {
            const color = metricColor(metric.score)
            return (
              <div key={metric.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 72, fontSize: 10.5, color: 'var(--text-2)', flexShrink: 0 }}>{metric.label}</div>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border-ui)', overflow: 'hidden' }}>
                  <div style={{ width: `${metric.score}%`, height: '100%', borderRadius: 2, background: color }} />
                </div>
                <div style={{ width: 24, textAlign: 'right', fontSize: 10, fontWeight: 600, color, flexShrink: 0 }}>
                  {metric.score}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
