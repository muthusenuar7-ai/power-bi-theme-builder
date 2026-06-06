'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { useElementSize } from '@/hooks/useElementSize'
import { f, categoryLabelParts, truncateCategoryLabel } from './chartUtils'
import {
  buildLineAreaModel,
  formatDisplayValue,
  truncateLegendLabel,
} from '@/lib/pbi-mimic'
import type {
  LineAreaMode,
  LineAreaModelOptions,
  LineAreaDataPoint,
} from '@/lib/pbi-mimic'
import type { Point } from '@/lib/pbi-mimic'
import type { ResolvedAxisPreviewStyle } from '@/lib/formatPreview'

const FONT = "var(--preview-font-family, 'Segoe UI', sans-serif)"

/** Default geometry not exposed by the format resolver (see QA doc). */
const LINE_STROKE_WIDTH = 1.8
const MARKER_RADIUS = 2.2

/** Base fill opacity per mode — scaled by the resolved shape opacity. */
const BASE_FILL_OPACITY: Record<LineAreaMode, number> = {
  line: 0,
  area: 0.22,
  stackedArea: 0.55,
  hundredPercentArea: 0.6,
}

export interface LineAreaFamilyVisualProps extends ChartVisualProps {
  mode: LineAreaMode
  categories: string[]
  series: { name: string; color: string }[]
  values: number[][]
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

export function LineAreaFamilyVisual({
  mode,
  categories,
  series,
  values,
  showLegend = true,
  showDataLabels = true,
  showMarkers = true,
  format,
}: LineAreaFamilyVisualProps) {
  const { ref, width, height } = useElementSize({ width: 420, height: 260 })

  // Vertical orientation: X = category/time, Y = value.
  const categoryAxisFmt = format?.xAxis
  const valueAxisFmt = format?.yAxis

  const concatenate = categoryAxisFmt?.concatenateLabels ?? false
  const categoryLineParts = categories.map((c) => categoryLabelParts(c, concatenate))
  const categoryMaxLines = Math.max(1, ...categoryLineParts.map((l) => l.length))

  const seriesColors = series.map((s) => s.color)
  const legendItems = series.map((s) => ({ label: s.name, color: s.color }))

  const legend = format?.legend
  const legendTextShow = legend?.textShow ?? true
  const legendTitleShow = Boolean(legend?.titleShow && legend.titleText)
  const legendFontSize = legend?.fontSize ?? 7.5
  const legendTitleFontSize = legend?.titleFontSize ?? legendFontSize
  const legendTitleHeight = legendTitleShow ? Math.max(10, legendTitleFontSize + 4) : 0
  const legendVisible = showLegend && (legendTextShow || legendTitleShow)

  const modelOptions: LineAreaModelOptions = {
    width,
    height,
    mode,
    categories,
    seriesColors,
    values,
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

  const model = buildLineAreaModel(modelOptions)
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
  const fillOpacity = BASE_FILL_OPACITY[mode] * shapeOpacity
  const hasFill = mode !== 'line'

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

  function labelText(dp: LineAreaDataPoint): string {
    if (model.valueIsPercent) return `${Math.round(dp.value)}%`
    return formatDisplayValue(dp.rawValue, labelUnits, labelDecimals, { alreadyScaled: true })
  }

  // Only label the top-most series in stacked/100 % modes to avoid clutter.
  const labelSeriesIdx = model.series.length - 1

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        role="img"
        aria-label={`${mode} chart preview`}
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
          return (
            <>
              {valTitle && (
                <text
                  transform={`translate(${f(model.valueAxisSwitched ? width - 3 : 7)} ${f(innerPlot.y + innerPlot.h / 2)}) rotate(-90)`}
                  textAnchor="middle" fontSize={valTitleSize} fill={valTitleColor} fontWeight={700} fontFamily={FONT}
                >{valTitle}</text>
              )}
              {catTitle && (
                <text
                  x={f(innerPlot.x + innerPlot.w / 2)} y={f(height - 2)} textAnchor="middle"
                  fontSize={catTitleSize} fill={catTitleColor} fontWeight={700} fontFamily={FONT}
                >{catTitle}</text>
              )}
            </>
          )
        })()}

        {/* Area fills (back-to-front so the first series sits on top) */}
        {hasFill && [...model.series].reverse().map((s) => {
          const polygon = [...s.linePoints, ...[...s.basePoints].reverse()]
          return (
            <polygon
              key={`area-${s.seriesIdx}`}
              points={polyPoints(polygon)}
              fill={s.color} fillOpacity={fillOpacity}
            />
          )
        })}

        {/* Lines */}
        {model.series.map((s) => (
          <polyline
            key={`line-${s.seriesIdx}`}
            points={polyPoints(s.linePoints)}
            fill="none" stroke={s.color}
            strokeWidth={LINE_STROKE_WIDTH}
            strokeLinejoin="round" strokeLinecap="round"
            strokeOpacity={hasFill ? 0.9 : 1}
          />
        ))}

        {/* Markers */}
        {showMarkers && model.series.map((s) =>
          s.markers.map((m, i) => (
            <circle key={`mk-${s.seriesIdx}-${i}`} cx={f(m.x)} cy={f(m.y)} r={MARKER_RADIUS} fill={s.color} />
          )),
        )}

        {/* Data labels */}
        {showDataLabels && model.series.map((s) => {
          if (model.series.length > 1 && s.seriesIdx !== labelSeriesIdx) return null
          return s.dataPoints.map((dp) => (
            <text
              key={`lab-${s.seriesIdx}-${dp.categoryIdx}`}
              x={f(dp.x)} y={f(dp.y - 5)} textAnchor="middle"
              fontSize={labelFontSize} fill={labelColor}
              fontWeight={labelWeight} fontStyle={labelStyle} textDecoration={labelDecoration} fontFamily={FONT}
            >{labelText(dp)}</text>
          ))
        })}

        {/* Legend */}
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
                  <line x1={0} y1={cy} x2={legendFontSize * 0.9} y2={cy} stroke={item.color} strokeWidth={1.6} />
                  {showMarkers && <circle cx={legendFontSize * 0.45} cy={cy} r={legendFontSize * 0.28} fill={item.color} />}
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
