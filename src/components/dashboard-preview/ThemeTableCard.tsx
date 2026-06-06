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

/**
 * ThemeTableCard — compact ranked table. Header uses the theme table accent;
 * rows alternate with a faint theme-derived tint and the YoY pill uses
 * good/neutral/bad. No fixed/white backgrounds anywhere.
 */
export function ThemeTableCard({ theme, rows }: Props) {
  const headers: { key: keyof ProductRow; label: string; align: 'left' | 'right' }[] = [
    { key: 'product', label: 'Product', align: 'left' },
    { key: 'revenue', label: 'Revenue', align: 'right' },
    { key: 'margin',  label: 'Margin',  align: 'right' },
    { key: 'yoy',     label: 'YoY',     align: 'right' },
  ]

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
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
                  padding: '6px 8px',
                  borderBottom: `1px solid ${theme.borderColor}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.product} style={{ background: ri % 2 === 1 ? theme.tableRowAlt : 'transparent' }}>
              <td
                style={{
                  padding: '6px 8px',
                  color: theme.foreground,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {row.product}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: theme.foreground, whiteSpace: 'nowrap' }}>
                {row.revenue}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: theme.mutedText, whiteSpace: 'nowrap' }}>
                {row.margin}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    fontSize: Math.max(9, theme.labelFontSize - 1),
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    color: toneColor(theme, row.tone),
                    background: `color-mix(in srgb, ${toneColor(theme, row.tone)} 16%, transparent)`,
                  }}
                >
                  {row.yoy}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
