'use client'

import type { DashboardTheme } from '@/lib/dashboardThemeResolver'
import type { ProductRow, Tone } from '@/lib/themeDashboardData'

interface Props {
  theme: DashboardTheme
  rows: ProductRow[]
}

function toneColor(theme: DashboardTheme, tone: Tone): string {
  if (tone === 'ok') return theme.good
  if (tone === 'warn') return theme.neutral
  return theme.bad
}

function toneArrow(tone: Tone): string {
  if (tone === 'ok') return '▲'
  if (tone === 'warn') return '→'
  return '▼'
}

/**
 * ThemeTableCard — a clean Power BI matrix-style table. Every colour is theme
 * driven: header uses the theme table-header background/text with a table-accent
 * underline, rows alternate with the theme row-alt tint and a theme border
 * separator, and the YoY column uses a subtle arrow indicator coloured by the
 * theme's good/neutral/bad semantic colours (no badges, no data bars, no fixed
 * red/green). Shows exactly the rows it is given (4) — no scroll, no hidden row.
 */
export function ThemeTableCard({ theme, rows }: Props) {
  const headers: { key: keyof ProductRow; label: string; align: 'left' | 'right' }[] = [
    { key: 'product', label: 'Product', align: 'left' },
    { key: 'revenue', label: 'Revenue', align: 'right' },
    { key: 'margin',  label: 'Margin',  align: 'right' },
    { key: 'yoy',     label: 'YoY',     align: 'right' },
  ]
  const visible = rows.slice(0, 4)

  return (
    <div style={{ height: '100%', background: theme.visualBackground }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.labelFontSize, tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h.key}
                style={{
                  textAlign: h.align,
                  color: theme.tableHeaderText,
                  background: theme.tableHeaderBackground,
                  fontWeight: 700,
                  fontSize: theme.headerFontSize,
                  textTransform: 'uppercase',
                  letterSpacing: '.03em',
                  padding: '5px 8px',
                  borderBottom: `2px solid ${theme.tableAccent}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, ri) => {
            const tc = toneColor(theme, row.tone)
            const magnitude = row.yoy.replace(/^[+-]/, '')
            return (
              <tr
                key={row.product}
                style={{
                  background: ri % 2 === 1 ? theme.tableRowAlt : 'transparent',
                  borderBottom: `1px solid ${theme.borderColor}`,
                }}
              >
                <td
                  style={{
                    padding: '5px 8px',
                    color: theme.foreground,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {row.product}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', color: theme.foreground, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {row.revenue}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', color: theme.labelColor, whiteSpace: 'nowrap' }}>
                  {row.margin}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap', color: tc, fontWeight: 600 }}>
                  <span style={{ marginRight: 3 }}>{toneArrow(row.tone)}</span>
                  {magnitude}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
