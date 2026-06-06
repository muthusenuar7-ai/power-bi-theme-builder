'use client'

import { Fragment } from 'react'
import type { CSSProperties } from 'react'

interface CityRow {
  city: string
  sales15: number
  profit15: number
  sales16: number
  profit16: number
}

interface TerritoryGroup {
  territory: string
  expanded: boolean
  children: CityRow[]
  subtotal: CityRow
}

const GROUPS: TerritoryGroup[] = [
  {
    territory: 'Saudi',
    expanded: true,
    children: [
      { city: 'Riyadh', sales15: 142, profit15: 27, sales16: 156, profit16: 31 },
      { city: 'Jeddah', sales15: 118, profit15: 22, sales16: 124, profit16: 25 },
      { city: 'Dammam', sales15: 95, profit15: 18, sales16: 102, profit16: 21 },
    ],
    subtotal: { city: 'Saudi Total', sales15: 355, profit15: 67, sales16: 382, profit16: 77 },
  },
  {
    territory: 'UAE',
    expanded: true,
    children: [
      { city: 'Dubai', sales15: 132, profit15: 24, sales16: 148, profit16: 29 },
      { city: 'Abu Dhabi', sales15: 101, profit15: 18, sales16: 113, profit16: 22 },
    ],
    subtotal: { city: 'UAE Total', sales15: 233, profit15: 42, sales16: 261, profit16: 51 },
  },
  {
    territory: 'Oman',
    expanded: false,
    children: [
      { city: 'Muscat', sales15: 63, profit15: 11, sales16: 71, profit16: 13 },
    ],
    subtotal: { city: 'Oman Total', sales15: 63, profit15: 11, sales16: 71, profit16: 13 },
  },
]

const GRAND = {
  sales15: GROUPS.reduce((sum, group) => sum + group.subtotal.sales15, 0),
  profit15: GROUPS.reduce((sum, group) => sum + group.subtotal.profit15, 0),
  sales16: GROUPS.reduce((sum, group) => sum + group.subtotal.sales16, 0),
  profit16: GROUPS.reduce((sum, group) => sum + group.subtotal.profit16, 0),
}

function fmtK(n: number): string {
  return `${n}K`
}

export function MatrixVisual() {
  const grid = '#EDEBE9'
  const headerLine = '#C8C6C4'
  const yearDivider = '2px solid #D8D5D0'
  const previewFont = 'var(--preview-font-family, "Segoe UI", sans-serif)'

  const base: CSSProperties = {
    padding: '3px 7px',
    fontSize: 'var(--preview-label-size, 9.6px)',
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
  const groupHeader: CSSProperties = {
    ...base,
    background: '#F3F2F1',
    borderBottom: `1px solid ${headerLine}`,
    textAlign: 'center',
    fontWeight: 700,
    fontSize: 'var(--preview-header-size, 9.6px)',
  }
  const measureHeader: CSSProperties = {
    ...base,
    background: '#F8F8F8',
    borderBottom: `1px solid ${headerLine}`,
    textAlign: 'right',
    fontWeight: 700,
    fontSize: 'var(--preview-header-size, 9.2px)',
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
        aria-label="Regional performance matrix"
        style={{
          width: '100%',
          minWidth: 500,
          borderCollapse: 'collapse',
          borderTop: '2px solid var(--table-accent, var(--theme-primary, #0D9488))',
        }}
      >
        <thead>
          <tr>
            <th style={{ ...groupHeader, textAlign: 'left', minWidth: 136 }} rowSpan={2}>Territory / City</th>
            <th style={groupHeader} colSpan={2}>2015</th>
            <th style={{ ...groupHeader, borderLeft: yearDivider }} colSpan={2}>2016</th>
          </tr>
          <tr>
            <th style={measureHeader}>TotalSales</th>
            <th style={measureHeader}>Gross Profit</th>
            <th style={{ ...measureHeader, borderLeft: yearDivider }}>TotalSales</th>
            <th style={measureHeader}>Gross Profit</th>
          </tr>
        </thead>
        <tbody>
          {GROUPS.map((group, groupIndex) => (
            <Fragment key={group.territory}>
              <tr style={{ background: '#FFFFFF' }}>
                <td style={{ ...base, fontWeight: 750 }}>
                  <span style={{ display: 'inline-block', width: 11, color: '#605E5C' }}>{group.expanded ? 'v' : '>'}</span>
                  {group.territory}
                </td>
                <td style={{ ...num, fontWeight: 750 }}>{fmtK(group.subtotal.sales15)}</td>
                <td style={{ ...num, fontWeight: 750 }}>{fmtK(group.subtotal.profit15)}</td>
                <td style={{ ...num, borderLeft: yearDivider, fontWeight: 750 }}>{fmtK(group.subtotal.sales16)}</td>
                <td style={{ ...num, fontWeight: 750 }}>{fmtK(group.subtotal.profit16)}</td>
              </tr>
              {group.expanded &&
                group.children.map((child, childIndex) => (
                  <tr
                    key={`${group.territory}-${child.city}`}
                    style={{ background: (groupIndex + childIndex) % 2 === 0 ? '#FAFAFA' : 'var(--card-bg, #FFFFFF)' }}
                  >
                    <td style={{ ...base, paddingLeft: 24, color: '#3B3A39' }}>{child.city}</td>
                    <td style={num}>{fmtK(child.sales15)}</td>
                    <td style={num}>{fmtK(child.profit15)}</td>
                    <td style={{ ...num, borderLeft: yearDivider }}>{fmtK(child.sales16)}</td>
                    <td style={num}>{fmtK(child.profit16)}</td>
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#F8F8F8', borderTop: `2px solid ${headerLine}` }}>
            <td style={{ ...base, fontWeight: 800 }}>Total</td>
            <td style={{ ...num, fontWeight: 800 }}>{fmtK(GRAND.sales15)}</td>
            <td style={{ ...num, fontWeight: 800 }}>{fmtK(GRAND.profit15)}</td>
            <td style={{ ...num, borderLeft: yearDivider, fontWeight: 800 }}>{fmtK(GRAND.sales16)}</td>
            <td style={{ ...num, fontWeight: 800 }}>{fmtK(GRAND.profit16)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
