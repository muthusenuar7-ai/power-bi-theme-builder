'use client'

import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { getReadableTextColor } from '@/lib/colorUtils'
import type { DashboardTheme } from '@/lib/dashboardThemeResolver'
import type { ComboPoint, DonutSlice, TreemapDatum, StackedBarData, ClusteredColumnData } from '@/lib/themeDashboardData'

const FONT = "var(--preview-font-family, 'Segoe UI', sans-serif)"

type ChartProps =
  | { theme: DashboardTheme; type: 'comboLineColumn'; data: ComboPoint[] }
  | { theme: DashboardTheme; type: 'donut'; data: DonutSlice[] }
  | { theme: DashboardTheme; type: 'treemap'; data: TreemapDatum[] }
  | { theme: DashboardTheme; type: 'stackedBar'; data: StackedBarData }
  | { theme: DashboardTheme; type: 'clusteredColumn'; data: ClusteredColumnData }

/**
 * ThemeMiniChart — dashboard-only, theme-driven SVG visuals.
 *
 * These are intentionally simplified (preview-only): they obey theme colours,
 * the active data palette and the chart-spacing rules, but not every detailed
 * visual-level property (that stays in the Visuals section). Each chart measures
 * its own pixel box so it fills the card with balanced margins — no empty plot
 * areas, no isolated columns, no oversized donut.
 */
export function ThemeMiniChart(props: ChartProps) {
  const [ref, size] = useMeasure<HTMLDivElement>()
  const w = Math.max(120, size.width)
  const h = Math.max(80, size.height)

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 0 }}>
      {props.type === 'comboLineColumn' && <ComboLineColumn theme={props.theme} data={props.data} w={w} h={h} />}
      {props.type === 'donut' && <Donut theme={props.theme} data={props.data} w={w} h={h} />}
      {props.type === 'treemap' && <Treemap theme={props.theme} data={props.data} w={w} h={h} />}
      {props.type === 'stackedBar' && <StackedBar theme={props.theme} data={props.data} w={w} h={h} />}
      {props.type === 'clusteredColumn' && <ClusteredColumn theme={props.theme} data={props.data} w={w} h={h} />}
    </div>
  )
}

// ─── shared helpers ──────────────────────────────────────────────────────────────

interface ChartBox<T> {
  theme: DashboardTheme
  data: T
  w: number
  h: number
}

function useMeasure<T extends HTMLElement>(): [React.RefObject<T | null>, { width: number; height: number }] {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  // Guard against SSR mismatch flashes.
  useEffect(() => {}, [])
  return [ref, size]
}

/** Round a value up to a clean axis maximum. */
function niceCeil(v: number): number {
  if (v <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / pow
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nf * pow
}

function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i)
}

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return Number.isInteger(n) ? String(n) : n.toFixed(0)
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function paletteColor(theme: DashboardTheme, i: number): string {
  return theme.dataColors[i % theme.dataColors.length] ?? theme.primary
}

function font(theme: DashboardTheme): string {
  return theme.fontFamily || FONT
}

function labelSize(theme: DashboardTheme): number {
  return Math.max(7, theme.labelFontSize)
}

function dataLabelSize(theme: DashboardTheme): number {
  return Math.max(7, theme.dataLabelFontSize)
}

function LegendRow({
  theme, items, x, y, lineFor,
}: {
  theme: DashboardTheme
  items: { label: string; color: string }[]
  x: number
  y: number
  lineFor?: number
}) {
  const size = labelSize(theme)
  return (
    <g>
      {items.map((item, i) => {
        const cursor = x + items.slice(0, i).reduce((sum, previous) => sum + 22 + previous.label.length * size * 0.62, 0)
        return (
          <g key={item.label} transform={`translate(${cursor}, ${y})`}>
            {lineFor === i ? (
              <line x1={0} y1={0} x2={12} y2={0} stroke={item.color} strokeWidth={2.4} strokeLinecap="round" />
            ) : (
              <rect x={0} y={-5} width={11} height={11} rx={2.5} fill={item.color} />
            )}
            <text x={16} y={size * 0.34} fontSize={size} fontFamily={font(theme)} fill={theme.legendColor}>
              {item.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// ─── combo: columns (actual) + line (target) ──────────────────────────────────────

function ComboLineColumn({ theme, data, w, h }: ChartBox<ComboPoint[]>) {
  const mTop = 22
  const mBottom = 20
  const mLeft = 32
  const mRight = 10
  const plotW = w - mLeft - mRight
  const plotH = h - mTop - mBottom
  const max = niceCeil(Math.max(...data.map((d) => Math.max(d.actual, d.target))))
  const band = plotW / data.length
  const colW = Math.min(26, band * 0.5)
  // Power BI series-order behaviour: first series (columns) takes the first theme
  // colour, second series (line) takes the second. Fall back to the resolved
  // primary/secondary only when the palette is missing that slot.
  const colColor = theme.dataColors[0] ?? theme.primary
  const lineColor = theme.dataColors[1] ?? theme.secondary
  const yOf = (v: number) => mTop + plotH * (1 - v / max)

  const linePts = data.map((d, i) => `${(mLeft + band * i + band / 2).toFixed(1)},${yOf(d.target).toFixed(1)}`).join(' ')

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <LegendRow theme={theme} x={mLeft} y={10} items={[{ label: 'Actual', color: colColor }, { label: 'Target', color: lineColor }]} lineFor={1} />
      {ticks(max).map((t, i) => {
        const y = yOf(t)
        return (
          <g key={i}>
            <line x1={mLeft} y1={y} x2={w - mRight} y2={y} stroke={theme.gridlineColor} strokeWidth={1} />
            <text x={mLeft - 5} y={y + labelSize(theme) * 0.34} textAnchor="end" fontSize={labelSize(theme)} fontFamily={font(theme)} fill={theme.axisLabelColor}>
              {fmtNum(t)}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const x = mLeft + band * i + (band - colW) / 2
        const y = yOf(d.actual)
        return <rect key={i} x={x} y={y} width={colW} height={Math.max(0, mTop + plotH - y)} rx={2} fill={colColor} />
      })}
      <polyline points={linePts} fill="none" stroke={lineColor} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={mLeft + band * i + band / 2} cy={yOf(d.target)} r={2.4} fill={lineColor} />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={mLeft + band * i + band / 2}
          y={h - 7}
          textAnchor="middle"
          fontSize={labelSize(theme)}
          fontFamily={font(theme)}
          fill={theme.axisLabelColor}
        >
          {d.month}
        </text>
      ))}
    </svg>
  )
}

// ─── donut: compact, with compact legend on the right ──────────────────────────────

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180
  const x1 = cx + rOuter * Math.cos(toRad(startDeg))
  const y1 = cy + rOuter * Math.sin(toRad(startDeg))
  const x2 = cx + rOuter * Math.cos(toRad(endDeg))
  const y2 = cy + rOuter * Math.sin(toRad(endDeg))
  const x3 = cx + rInner * Math.cos(toRad(endDeg))
  const y3 = cy + rInner * Math.sin(toRad(endDeg))
  const x4 = cx + rInner * Math.cos(toRad(startDeg))
  const y4 = cy + rInner * Math.sin(toRad(startDeg))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join(' ')
}

function Donut({ theme, data, w, h }: ChartBox<DonutSlice[]>) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const donutSize = Math.min(h - 6, w * 0.5, 168)
  const cx = donutSize / 2 + 4
  const cy = h / 2
  const rOuter = donutSize / 2 - 2
  const rInner = rOuter * 0.62
  const top = [...data].sort((a, b) => b.value - a.value)[0]
  const slices = data.map((slice) => (slice.value / total) * 360)
  const legendX = donutSize + 18
  const legendGap = Math.min(26, (h - 8) / data.length)
  const legendTop = cy - (legendGap * (data.length - 1)) / 2

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {data.map((slice, i) => {
        const startAngle = slices.slice(0, i).reduce((sum, sweep) => sum + sweep, 0)
        const sweep = slices[i]
        const path = arcPath(cx, cy, rOuter, rInner, startAngle, startAngle + sweep - 1.2)
        return <path key={slice.label} d={path} fill={paletteColor(theme, i)} />
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={Math.max(14, theme.headerFontSize + 5)} fontWeight={700} fontFamily={font(theme)} fill={theme.titleColor}>
        {Math.round((top.value / total) * 100)}%
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize={labelSize(theme)} fontFamily={font(theme)} fill={theme.labelColor}>
        {truncate(top.label, 12)}
      </text>
      {data.map((slice, i) => {
        const y = legendTop + legendGap * i
        return (
          <g key={slice.label} transform={`translate(${legendX}, ${y})`}>
            <rect x={0} y={-5} width={10} height={10} rx={2.5} fill={paletteColor(theme, i)} />
            <text x={15} y={labelSize(theme) * 0.34} fontSize={labelSize(theme)} fontFamily={font(theme)} fill={theme.legendColor}>
              {truncate(slice.label, 10)}
            </text>
            <text x={w - donutSize - 24} y={dataLabelSize(theme) * 0.34} textAnchor="end" fontSize={dataLabelSize(theme)} fontWeight={700} fontFamily={font(theme)} fill={theme.dataLabelColor}>
              {Math.round((slice.value / total) * 100)}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── treemap: slice-and-dice tiles, one theme palette colour per tile ───────────────

interface TreemapTile {
  label: string
  value: number
  index: number
  x: number
  y: number
  w: number
  h: number
}

/** Simple recursive slice-and-dice layout: place the largest remaining item on
 *  the long edge of the remaining rectangle. Deterministic, well-proportioned
 *  for the 4–6 tiles the preview uses (no full squarify needed). */
function layoutTreemap(data: TreemapDatum[], x: number, y: number, w: number, h: number): TreemapTile[] {
  const items = data.map((d, index) => ({ ...d, index })).sort((a, b) => b.value - a.value)
  const tiles: TreemapTile[] = []
  let rect = { x, y, w, h }
  let remaining = items.reduce((sum, d) => sum + d.value, 0) || 1
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (i === items.length - 1) {
      tiles.push({ label: item.label, value: item.value, index: item.index, ...rect })
      break
    }
    const share = item.value / remaining
    if (rect.w >= rect.h) {
      const tw = rect.w * share
      tiles.push({ label: item.label, value: item.value, index: item.index, x: rect.x, y: rect.y, w: tw, h: rect.h })
      rect = { x: rect.x + tw, y: rect.y, w: rect.w - tw, h: rect.h }
    } else {
      const th = rect.h * share
      tiles.push({ label: item.label, value: item.value, index: item.index, x: rect.x, y: rect.y, w: rect.w, h: th })
      rect = { x: rect.x, y: rect.y + th, w: rect.w, h: rect.h - th }
    }
    remaining -= item.value
  }
  return tiles
}

function Treemap({ theme, data, w, h }: ChartBox<TreemapDatum[]>) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const tiles = layoutTreemap(data, 2, 2, w - 4, h - 4)
  const ls = labelSize(theme)
  const ds = dataLabelSize(theme)

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {tiles.map((tile) => {
        // Sequential theme palette colour per tile (Power BI treemap behaviour).
        const color = paletteColor(theme, tile.index)
        const text = getReadableTextColor(color)
        const pct = Math.round((tile.value / total) * 100)
        const fitsLabel = tile.w > ls * 5.4 && tile.h > ls * 2.6
        const fitsValue = tile.w > ds * 4 && tile.h > ls * 2.6 + ds * 1.6
        return (
          <g key={tile.label}>
            <rect
              x={tile.x}
              y={tile.y}
              width={Math.max(0, tile.w - 2)}
              height={Math.max(0, tile.h - 2)}
              rx={3}
              fill={color}
              stroke={theme.visualBackground}
              strokeWidth={1}
            />
            {fitsLabel && (
              <text x={tile.x + 7} y={tile.y + ls + 6} fontSize={ls} fontWeight={600} fontFamily={font(theme)} fill={text}>
                {truncate(tile.label, Math.floor(tile.w / (ls * 0.62)))}
              </text>
            )}
            {fitsValue && (
              <text x={tile.x + 7} y={tile.y + ls + 6 + ds + 4} fontSize={ds} fontFamily={font(theme)} fill={text} opacity={0.88}>
                ${fmtNum(tile.value)}M · {pct}%
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── stacked bar (horizontal) ──────────────────────────────────────────────────────

function StackedBar({ theme, data, w, h }: ChartBox<StackedBarData>) {
  const mTop = 22
  const mBottom = 8
  const mLeft = 58
  const mRight = 36
  const plotW = w - mLeft - mRight
  const plotH = h - mTop - mBottom
  const totals = data.values.map((row) => row.reduce((a, b) => a + b, 0))
  const max = niceCeil(Math.max(...totals))
  const band = plotH / data.categories.length
  const barH = Math.min(28, band * 0.62)

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <LegendRow
        theme={theme}
        x={mLeft}
        y={10}
        items={data.segments.map((label, i) => ({ label, color: paletteColor(theme, i) }))}
      />
      {data.categories.map((cat, ri) => {
        const y = mTop + band * ri + (band - barH) / 2
        let x = mLeft
        return (
          <g key={cat}>
            <text x={mLeft - 6} y={y + barH / 2 + labelSize(theme) * 0.34} textAnchor="end" fontSize={labelSize(theme)} fontFamily={font(theme)} fill={theme.axisLabelColor}>
              {truncate(cat, 9)}
            </text>
            {data.values[ri].map((val, si) => {
              const segW = (val / max) * plotW
              const rect = <rect key={si} x={x} y={y} width={Math.max(0, segW)} height={barH} fill={paletteColor(theme, si)} />
              x += segW
              return rect
            })}
            <text x={x + 5} y={y + barH / 2 + dataLabelSize(theme) * 0.34} fontSize={dataLabelSize(theme)} fontWeight={700} fontFamily={font(theme)} fill={theme.dataLabelColor}>
              {fmtNum(totals[ri])}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── clustered column ──────────────────────────────────────────────────────────────

function ClusteredColumn({ theme, data, w, h }: ChartBox<ClusteredColumnData>) {
  const mTop = 22
  const mBottom = 24
  const mLeft = 30
  const mRight = 8
  const plotW = w - mLeft - mRight
  const plotH = h - mTop - mBottom
  const max = niceCeil(Math.max(...data.values.flat()))
  const band = plotW / data.groups.length
  const seriesCount = data.series.length
  const groupW = band * 0.66
  const barW = groupW / seriesCount
  const yOf = (v: number) => mTop + plotH * (1 - v / max)

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <LegendRow
        theme={theme}
        x={mLeft}
        y={10}
        items={data.series.map((label, i) => ({ label, color: paletteColor(theme, i) }))}
      />
      {ticks(max).map((t, i) => {
        const y = yOf(t)
        return (
          <g key={i}>
            <line x1={mLeft} y1={y} x2={w - mRight} y2={y} stroke={theme.gridlineColor} strokeWidth={1} />
            <text x={mLeft - 4} y={y + labelSize(theme) * 0.34} textAnchor="end" fontSize={labelSize(theme)} fontFamily={font(theme)} fill={theme.axisLabelColor}>
              {fmtNum(t)}
            </text>
          </g>
        )
      })}
      {data.groups.map((group, gi) => {
        const groupX = mLeft + band * gi + (band - groupW) / 2
        return (
          <g key={group}>
            {data.values[gi].map((val, si) => {
              const x = groupX + barW * si
              const y = yOf(val)
              return <rect key={si} x={x + 1} y={y} width={Math.max(0, barW - 2)} height={Math.max(0, mTop + plotH - y)} rx={1.5} fill={paletteColor(theme, si)} />
            })}
            <text x={mLeft + band * gi + band / 2} y={h - 8} textAnchor="middle" fontSize={labelSize(theme)} fontFamily={font(theme)} fill={theme.axisLabelColor}>
              {truncate(group, 9)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
