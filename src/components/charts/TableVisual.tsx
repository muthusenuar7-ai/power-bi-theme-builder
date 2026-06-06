'use client'

import type { CSSProperties } from 'react'

type StatusLevel = 'good' | 'neutral' | 'bad'

const STATUS_COLOR: Record<StatusLevel, string> = {
  good: '#10B981',
  neutral: '#F59E0B',
  bad: '#EF4444',
}

const ROWS: Array<{
  category: string
  status: StatusLevel
  avgPrice: number
  lastYear: number
  thisYear: number
  goal: number
}> = [
  { category: 'Still Water', status: 'good', avgPrice: 45.2, lastYear: 142, thisYear: 156, goal: 160 },
  { category: 'Sparkling Water', status: 'good', avgPrice: 52.8, lastYear: 118, thisYear: 124, goal: 130 },
  { category: 'Flavoured Water', status: 'neutral', avgPrice: 38.5, lastYear: 95, thisYear: 102, goal: 110 },
  { category: 'Coolers', status: 'neutral', avgPrice: 78.1, lastYear: 87, thisYear: 88, goal: 100 },
  { category: 'Accessories', status: 'bad', avgPrice: 29.3, lastYear: 63, thisYear: 61, goal: 80 },
]

const TOTAL_LAST = ROWS.reduce((sum, row) => sum + row.lastYear, 0)
const TOTAL_THIS = ROWS.reduce((sum, row) => sum + row.thisYear, 0)
const TOTAL_GOAL = ROWS.reduce((sum, row) => sum + row.goal, 0)

function fmtK(n: number): string {
  return `${n}K`
}

function fmtPrice(n: number): string {
  return `$${n.toFixed(1)}`
}

export function TableVisual() {
  const grid = '#EDEBE9'
  const headerLine = '#C8C6C4'
  const previewFont = 'var(--preview-font-family, "Segoe UI", sans-serif)'

  const base: CSSProperties = {
    padding: '4px 7px',
    fontSize: 'var(--preview-label-size, 10px)',
    borderBottom: `1px solid ${grid}`,
    fontFamily: previewFont,
    whiteSpace: 'nowrap',
    lineHeight: 1.35,
    color: '#252423',
  }
  const num: CSSProperties = {
    ...base,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  }
  const hdr: CSSProperties = {
    ...base,
    background: '#F3F2F1',
    borderBottom: `1px solid ${headerLine}`,
    color: '#252423',
    fontWeight: 700,
    textAlign: 'left',
    fontSize: 'var(--preview-header-size, 9.5px)',
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        background: 'var(--card-bg, #FFFFFF)',
        fontFamily: previewFont,
      }}
    >
      <table
        aria-label="Sales summary table"
        style={{
          width: '100%',
          minWidth: 430,
          borderCollapse: 'collapse',
          borderTop: '2px solid var(--table-accent, var(--theme-primary, #0D9488))',
        }}
      >
        <thead>
          <tr>
            <th style={{ ...hdr, minWidth: 116 }}>Category</th>
            <th style={{ ...hdr, textAlign: 'center', width: 44 }}>Status</th>
            <th style={{ ...hdr, textAlign: 'right' }}>Avg Price</th>
            <th style={{ ...hdr, textAlign: 'right' }}>Last Year</th>
            <th style={{ ...hdr, textAlign: 'right' }}>This Year</th>
            <th style={{ ...hdr, textAlign: 'right' }}>Goal</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr key={row.category} style={{ background: i % 2 === 1 ? '#FAFAFA' : 'var(--card-bg, #FFFFFF)' }}>
              <td style={{ ...base, fontWeight: 500 }}>{row.category}</td>
              <td style={{ ...base, textAlign: 'center' }}>
                <span
                  aria-label={row.status}
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: STATUS_COLOR[row.status],
                    boxShadow: '0 0 0 1px rgba(0,0,0,.08)',
                  }}
                />
              </td>
              <td style={num}>{fmtPrice(row.avgPrice)}</td>
              <td style={num}>{fmtK(row.lastYear)}</td>
              <td style={{ ...num, color: 'var(--theme-primary, #0D9488)', fontWeight: 650 }}>{fmtK(row.thisYear)}</td>
              <td style={num}>{fmtK(row.goal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#F8F8F8', borderTop: `2px solid ${headerLine}` }}>
            <td style={{ ...base, fontWeight: 800 }}>Total</td>
            <td style={base} />
            <td style={num} />
            <td style={{ ...num, fontWeight: 800 }}>{fmtK(TOTAL_LAST)}</td>
            <td style={{ ...num, color: 'var(--theme-primary, #0D9488)', fontWeight: 800 }}>{fmtK(TOTAL_THIS)}</td>
            <td style={{ ...num, fontWeight: 800 }}>{fmtK(TOTAL_GOAL)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
