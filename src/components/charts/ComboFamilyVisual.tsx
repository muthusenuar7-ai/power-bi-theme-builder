'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { useElementSize } from '@/hooks/useElementSize'
import { f, categoryLabelParts, truncateCategoryLabel } from './chartUtils'
import {
  buildComboModel,
  formatDisplayValue,
  truncateLegendLabel,
} from '@/lib/pbi-mimic'
import type {
  ComboColumnMode,
  ComboModelOptions,
  ComboLegendItem,
} from '@/lib/pbi-mimic'
import type { Point } from '@/lib/pbi-mimic'
import type { ResolvedAxisPreviewStyle } from '@/lib/formatPreview'

const FONT = "var(--preview-font-family, 'Segoe UI', sans-serif)"

/** Default geometry not exposed by the format resolver (see QA doc). */
const LINE_STROKE_WIDTH = 1.8
const MARKER_RADIUS = 2.3

export interface ComboFamilyVisualProps extends ChartVisualProps {
  columnMode: ComboColumnMode
  categories: string[]
  columnSeries: { name: string; color: string }[]
  columnValues: number[][]
  lineSeries: { name: string; color: string }[]
  lineValues: number[][]
}

function axisTitleText(axis: ResolvedAxisPreviewStyle | undefined): string {
  if (!axis?.visible || !axis.titleVisible) return ''
  const text = axis.titleText?.trim()
  if (!text || text.toLowerCase() === 'auto') return ''
  return text
}

function polyPoints(points: Point[]): string {
  return points.map((p) => `${f(p.x)},${f(p.y)}`).join(' ')
}

export function ComboFamilyVisual({
  columnMode,
  categories,
  columnSeries,
  columnValues,
  lineSeries,
  lineValues,
  showLegend = true,
  showDataLabels = true,
  showMarkers = true,
  format,
}: ComboFamilyVisualProps) {
  const { ref, width, height } = useElementSize({ width: 420, height: 260 })

  // Vertical orientation: X = category, Y = value.
  const categoryAxisFmt = format?.xAxis
  const valueAxisFmt = format?.yAxis

  const concatenate = categoryAxisFmt?.concatenateLabels ?? false
  const categoryLineParts = categories.map((c) => categoryLabelParts(c, concatenate))
  const categoryMaxLines = Math.max(1, ...categoryLineParts.map((l) => l.length))

  const columnColors = columnSeries.map((s) => s.color)
  const lineColors = lineSeries.map((s) => s.color)

  const legendItems: ComboLegendItem[] = [
    ...columnSeries.map((s) => ({ label: s.name, color: s.color, kind: 'bar' as const })),
    ...lineSeries.map((s) => ({ label: s.name, color: s.color, kind: 'line' as const })),
  ]

  const legend = format?.legend
  const legendTextShow = legend?.textShow ?? true
  const legendTitleShow = Boolean(legend?.titleShow && legend.titleText)
  const legendFontSize = legend?.fontSize ?? 7.5
  const legendTitleFontSize = legend?.titleFontSize ?? legendFontSize
  const legendTitleHeight = legendTitleShow ? Math.max(10, legendTitleFontSize + 4) : 0
  const legendVisible = showLegend && (legendTextShow || legendTitleShow)

  const modelOptions: ComboModelOptions = {
    width,
    height,
    columnMode,
    categories,
    columnColors,
    columnValues,
    lineColors,
    lineValues,
    showLegend: legendVisible,
    legendItems,
    legendPosition: legend?.position ?? 'Top left',
    legendFontSize,
    legendTextVisible: legendTextShow,
    legendTitleVisible: legendTitleShow,
    legendTitleHeight,
    valueAxis: {
      showLabels: valueAxisFmt?.labelVisible ?? true,
      labelFontSize: valueAxisFmt?.fontSize ?? 7.5,
      showTitle: Boolean(valueAxisFmt?.titleVisible),
      titleText: axisTitleText(valueAxisFmt),
      titleFontSize: valueAxisFmt?.titleFontSize ?? 8,
      switchPosition: valueAxisFmt?.switchPosition ?? false,
    },
    valueDisplayUnits: valueAxisFmt?.displayUnits ?? 'Auto',
    valueDecimals: valueAxisFmt?.decimals ?? 'Auto',
    categoryAxis: {
      showLabels: categoryAxisFmt?.labelVisible ?? true,
      labelFontSize: categoryAxisFmt?.fontSize ?? 7.5,
      showTitle: Boolean(categoryAxisFmt?.titleVisible),
      titleText: axisTitleText(categoryAxisFmt),
      titleFontSize: categoryAxisFmt?.titleFontSize ?? 8,
      switchPosition: categoryAxisFmt?.switchPosition ?? false,
    },
    categoryMaxLines,
  }

  const model = buildComboModel(modelOptions)
  const { innerPlot } = model

  /* ── Styling tokens ── */
  const gridShow = format?.gridlines.show ?? true
  const gridColor = gridShow ? format?.gridlines.color ?? '#EDEBE9' : 'transparent'
  const gridWidth = gridShow ? Math.max(0, format?.gridlines.width ?? 0.5) : 0
  const gridOpacity = gridShow ? format?.gridlines.opacity ?? 1 : 0
  const gridDash = gridShow ? format?.gridlines.dasharray ?? '0' : '0'
  const axisLineColor = '#C8C6C4'

  const plotBg = format?.plotBackground
  const shapeOpacity = format?.shape.opacity ?? 1
  const borderColor = format?.shape.borderShow ? format.shape.borderColor : 'none'
  const borderWidth = format?.shape.borderShow ? Math.max(0, format.shape.borderWidth) : 0

  const labelColor = format?.dataLabels.color ?? '#252423'
  const labelFontSize = format?.dataLabels.fontSize ?? 7
  const labelWeight = format?.dataLabels.fontWeight ?? 600
  const labelStyle = format?.dataLabels.fontStyle ?? 'normal'
  const labelDecoration = format?.dataLabels.textDecoration ?? 'none'
  const labelUnits = format?.dataLabels.displayUnits ?? 'Auto'
  const labelDecimals = format?.dataLabels.decimals ?? 'Auto'

  const valueLabelColor = valueAxisFmt?.labelVisible ? valueAxisFmt.color : 'transparent'
  const valueLabelSize = valueAxisFmt?.fontSize ?? 7.5
  const catLabelColor = categoryAxisFmt?.labelVisible ? categoryAxisFmt.color : 'transparent'
  const catLabelSize = categoryAxisFmt?.fontSize ?? 7.5

  const stacked = columnMode === 'stacked'

  // Stacked column totals per category (for a single top-of-column label).
  const columnTotals = model.categoryBands.map((_, ci) =>
    (columnValues[ci] ?? []).reduce((sum, v) => sum + Math.max(0, v), 0),
  )

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        role="img"
        aria-label={`${stacked ? 'Stacked' : 'Clustered'} column and line combo chart preview`}
        style={{ display: 'block', fontFamily: FONT, overflow: 'hidden' }}
      >
        {/* Plot background */}
        {plotBg?.show && (
          <rect
            x={f(innerPlot.x)} y={f(innerPlot.y)} width={f(innerPlot.w)} height={f(innerPlot.h)}
            fill={plotBg.color} fillOpacity={plotBg.opacity}
          />
        )}

        {/* Gridlines + value-axis labels */}
        {model.valueTicks.map((tick) => {
          const isZero = tick.value === 0
          return (
            <g key={`vt-${tick.value}`}>
              <line
                x1={f(innerPlot.x)} y1={f(tick.pos)} x2={f(innerPlot.x + innerPlot.w)} y2={f(tick.pos)}
                stroke={isZero ? axisLineColor : gridColor}
                strokeWidth={isZero ? 0.8 : gridWidth}
                strokeDasharray={isZero ? '0' : gridDash}
                strokeOpacity={isZero ? 1 : gridOpacity}
              />
              <text
                x={f(model.valueAxisSwitched ? innerPlot.x + innerPlot.w + 4 : innerPlot.x - 4)}
                y={f(tick.pos + valueLabelSize * 0.35)}
                textAnchor={model.valueAxisSwitched ? 'start' : 'end'}
                fontSize={valueLabelSize} fill={valueLabelColor} fontFamily={FONT}
                fontWeight={valueAxisFmt?.fontWeight ?? 400}
                fontStyle={valueAxisFmt?.fontStyle ?? 'normal'}
                textDecoration={valueAxisFmt?.textDecoration ?? 'none'}
              >
                {tick.label}
              </text>
            </g>
          )
        })}

        {/* Category labels */}
        {model.categoryBands.map((band) => {
          const parts = categoryLineParts[band.categoryIdx]
            .map((p) => truncateCategoryLabel(p, categoryAxisFmt, 8))
          const lineHeight = Math.max(6.5, catLabelSize * 1.04)
          const baseY = model.categoryAxisSwitched
            ? model.categoryAxisRect.y + model.categoryAxisRect.h - (parts.length - 1) * lineHeight - 2
            : innerPlot.y + innerPlot.h + catLabelSize + 1
          return (
            <text
              key={`cat-${band.categoryIdx}`}
              x={f(band.center)} y={f(baseY)} textAnchor="middle"
              fontSize={catLabelSize} fill={catLabelColor} fontFamily={FONT}
              fontWeight={categoryAxisFmt?.fontWeight ?? 400}
              fontStyle={categoryAxisFmt?.fontStyle ?? 'normal'}
              textDecoration={categoryAxisFmt?.textDecoration ?? 'none'}
            >
              {parts.map((p, i) => (
                <tspan key={i} x={f(band.center)} dy={i === 0 ? 0 : lineHeight}>{p}</tspan>
              ))}
            </text>
          )
        })}

        {/* Axis titles */}
        {(() => {
          const valTitle = axisTitleText(valueAxisFmt)
          const catTitle = axisTitleText(categoryAxisFmt)
          const valTitleSize = valueAxisFmt?.titleFontSize ?? 8
          const catTitleSize = categoryAxisFmt?.titleFontSize ?? 8
          const valTitleColor = valueAxisFmt?.titleColor ?? '#605E5C'
          const catTitleColor = categoryAxisFmt?.titleColor ?? '#605E5C'
          const leftTitleX = model.valueAxisRect.x + valTitleSize * 0.55
          const rightTitleX = model.valueAxisRect.x + model.valueAxisRect.w - valTitleSize * 0.55
          const bottomTitleY = model.categoryAxisRect.y + model.categoryAxisRect.h - 1
          return (
            <>
              {valTitle && (
                <text
                  transform={`translate(${f(model.valueAxisSwitched ? rightTitleX : leftTitleX)} ${f(innerPlot.y + innerPlot.h / 2)}) rotate(-90)`}
                  textAnchor="middle" fontSize={valTitleSize} fill={valTitleColor}
                  fontWeight={valueAxisFmt?.titleFontWeight ?? 700}
                  fontStyle={valueAxisFmt?.titleFontStyle ?? 'normal'}
                  textDecoration={valueAxisFmt?.titleTextDecoration ?? 'none'}
                  fontFamily={FONT}
                >{valTitle}</text>
              )}
              {catTitle && (
                <text
                  x={f(innerPlot.x + innerPlot.w / 2)} y={f(bottomTitleY)} textAnchor="middle"
                  fontSize={catTitleSize} fill={catTitleColor}
                  fontWeight={categoryAxisFmt?.titleFontWeight ?? 700}
                  fontStyle={categoryAxisFmt?.titleFontStyle ?? 'normal'}
                  textDecoration={categoryAxisFmt?.titleTextDecoration ?? 'none'}
                  fontFamily={FONT}
                >{catTitle}</text>
              )}
            </>
          )
        })()}

        {/* Column segments */}
        {model.columnSegments.map((seg) => (
          <rect
            key={`seg-${seg.categoryIdx}-${seg.seriesIdx}`}
            x={f(seg.x)} y={f(seg.y)} width={f(seg.w)} height={f(seg.h)}
            fill={seg.color} fillOpacity={shapeOpacity}
            stroke={borderColor} strokeWidth={borderWidth}
          />
        ))}

        {/* Stacked column total labels */}
        {showDataLabels && stacked && model.categoryBands.map((band, ci) => {
          const total = columnTotals[ci]
          if (total <= 0) return null
          const topSeg = model.columnSegments
            .filter((s) => s.categoryIdx === ci)
            .reduce<number | null>((minY, s) => (minY === null ? s.y : Math.min(minY, s.y)), null)
          if (topSeg === null) return null
          return (
            <text
              key={`coltot-${ci}`}
              x={f(band.center)} y={f(topSeg - 3)} textAnchor="middle"
              fontSize={labelFontSize} fill={labelColor}
              fontWeight={labelWeight} fontStyle={labelStyle} textDecoration={labelDecoration} fontFamily={FONT}
            >
              {formatDisplayValue(total, labelUnits, labelDecimals, { alreadyScaled: true })}
            </text>
          )
        })}

        {/* Clustered column data labels (per segment) */}
        {showDataLabels && !stacked && model.columnSegments.map((seg) => {
          if (seg.h < labelFontSize + 2) return null
          return (
            <text
              key={`seglab-${seg.categoryIdx}-${seg.seriesIdx}`}
              x={f(seg.x + seg.w / 2)} y={f(seg.y - 2)} textAnchor="middle"
              fontSize={labelFontSize} fill={labelColor}
              fontWeight={labelWeight} fontStyle={labelStyle} textDecoration={labelDecoration} fontFamily={FONT}
            >
              {formatDisplayValue(seg.rawValue, labelUnits, labelDecimals, { alreadyScaled: true })}
            </text>
          )
        })}

        {/* Line series overlay */}
        {model.lineSeries.map((s) => (
          <polyline
            key={`line-${s.seriesIdx}`}
            points={polyPoints(s.points)}
            fill="none" stroke={s.color}
            strokeWidth={LINE_STROKE_WIDTH}
            strokeLinejoin="round" strokeLinecap="round"
          />
        ))}

        {/* Line markers */}
        {showMarkers && model.lineSeries.map((s) =>
          s.markers.map((m, i) => (
            <circle key={`mk-${s.seriesIdx}-${i}`} cx={f(m.x)} cy={f(m.y)} r={MARKER_RADIUS}
              fill={s.color} stroke="#FFFFFF" strokeWidth={0.6} />
          )),
        )}

        {/* Legend (rect for columns, line+marker for lines) */}
        {legendVisible && model.legend.visible && (
          <g transform={`translate(${f(model.legend.legendRect.x)} ${f(model.legend.legendRect.y)})`}>
            {legendTitleShow && (
              <text
                x={0} y={legendTitleFontSize * 0.88}
                fontSize={legendTitleFontSize}
                fill={legend?.titleColor ?? '#605E5C'}
                fontWeight={legend?.titleFontWeight ?? 700}
                fontStyle={legend?.titleFontStyle ?? 'normal'}
                fontFamily={FONT}
              >
                {legend?.titleText}
              </text>
            )}
            {legendTextShow && model.legendItems.map((item, index) => {
              const horizontal = model.legend.direction === 'horizontal'
              const row = horizontal ? Math.floor(index / model.legend.itemsPerRow) : index
              const col = horizontal ? index % model.legend.itemsPerRow : 0
              const label = truncateLegendLabel(item.label, model.legend.itemWidth)
              const cy = legendFontSize * 0.5
              return (
                <g
                  key={`leg-${item.label}`}
                  transform={`translate(${f(col * model.legend.itemWidth)} ${f(legendTitleHeight + row * model.legend.itemHeight)})`}
                >
                  {item.kind === 'line' ? (
                    <>
                      <line x1={0} y1={cy} x2={legendFontSize * 0.9} y2={cy} stroke={item.color} strokeWidth={1.6} />
                      {showMarkers && <circle cx={legendFontSize * 0.45} cy={cy} r={legendFontSize * 0.28} fill={item.color} />}
                    </>
                  ) : (
                    <rect x={0} y={legendFontSize * 0.15} width={legendFontSize * 0.7} height={legendFontSize * 0.7} fill={item.color} />
                  )}
                  <text
                    x={legendFontSize * 1.15} y={legendFontSize * 0.88}
                    fontSize={legendFontSize}
                    fill={legend?.color ?? '#605E5C'}
                    fontWeight={legend?.fontWeight ?? 400}
                    fontStyle={legend?.fontStyle ?? 'normal'}
                    fontFamily={FONT}
                  >
                    {label}
                  </text>
                </g>
              )
            })}
          </g>
        )}
      </svg>
    </div>
  )
}
