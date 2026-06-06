'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { cv, f, AX } from './chartUtils'
import { useElementSize } from '@/hooks/useElementSize'
import {
  buildPieDonutModel,
  formatDisplayValue,
  formatPercent,
  sliceStartLine,
  truncateLegendLabel,
} from '@/lib/pbi-mimic'

type PieDonutVariant = 'pie' | 'donut'

interface PieDonutSlice {
  label: string
  value: number
}

interface PieDonutMimicVisualProps extends ChartVisualProps {
  variant: PieDonutVariant
  /** Optional injected slices; falls back to the embedded sample when omitted. */
  data?: PieDonutSlice[]
}

const DATA: PieDonutSlice[] = [
  { label: 'Still Water', value: 96 },
  { label: 'Accessories', value: 46 },
  { label: 'Sparkling Water', value: 16 },
  { label: 'Coolers', value: 7 },
  { label: 'Flavoured Water', value: 1 },
]

const COLORS = [cv(1), cv(2), cv(3), cv(4), cv(5)]

function truncateLabel(value: string, maxChars = 13): string {
  return value.length > maxChars ? `${value.slice(0, maxChars - 1)}...` : value
}

function renderLegendTextY(fontSize: number): number {
  return fontSize * 0.88
}

function labelLines(
  label: string,
  value: number,
  total: number,
  labelStyle: string,
  displayUnits: string,
  decimals: string,
): string[] {
  const style = labelStyle.toLowerCase().replace(/\+/g, ',')
  const valueText = formatDisplayValue(value, displayUnits, decimals)
  const percentText = formatPercent(value / total, 0)

  if (style === 'category') return [label]
  if (style === 'data value' || style === 'value') return [valueText]
  if (style === 'percentage' || style === 'percent of total') return [percentText]
  if (style.includes('all detail')) return [label, `${valueText} (${percentText})`]
  if (style.includes('category') && style.includes('data value')) return [label, valueText]
  if (style.includes('category') && style.includes('percent')) return [label, percentText]
  if (style.includes('data value') && style.includes('percent')) return [valueText, percentText]

  return [valueText, percentText]
}

export function PieDonutMimicVisual({
  variant,
  showLegend = true,
  showDataLabels = true,
  format,
  data: injectedData,
}: PieDonutMimicVisualProps) {
  const { ref, width, height } = useElementSize({ width: 420, height: 260 })
  const baseData = injectedData && injectedData.length > 0 ? injectedData : DATA
  const data = baseData.map((datum, index) => ({ ...datum, color: COLORS[index % COLORS.length] }))
  const legendFontSize = format?.legend.fontSize ?? 8
  const legendTitleFontSize = format?.legend.titleFontSize ?? legendFontSize
  const legendTitleHeight = format?.legend.titleShow ? Math.max(10, legendTitleFontSize + 4) : 0
  const legendTextShow = format?.legend.textShow ?? true
  const legendTitleShow = Boolean(format?.legend.titleShow && format.legend.titleText)
  const legendVisible = showLegend && (legendTextShow || legendTitleShow)
  const labelFontSize = format?.dataLabels.fontSize ?? 8
  const labelColor = format?.dataLabels.color ?? '#252423'
  const model = buildPieDonutModel({
    width,
    height,
    data,
    isDonut: variant === 'donut',
    showLegend: legendVisible,
    legendPosition: format?.legend.position ?? 'Center right',
    legendFontSize,
    legendTextVisible: legendTextShow,
    legendTitleVisible: legendTitleShow,
    legendTitleHeight,
    showDataLabels,
    innerRadiusRatio: format?.shape.innerRadiusRatio ?? 0.5,
    startAngleDeg: format?.shape.rotationDeg ?? 0,
  })
  const labelBySlice = new Map(model.labelPoints.map((point) => [point.sliceIdx, point]))
  const labelLineHeight = labelFontSize * 1.12

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        role="img"
        aria-label={variant === 'donut' ? 'Donut chart preview' : 'Pie chart preview'}
        style={{ display: 'block', fontFamily: AX.font, overflow: 'hidden' }}
      >
        {model.slices.map((slice) => (
          <path
            key={slice.label}
            d={slice.path}
            fill={slice.color}
            fillOpacity="var(--preview-shape-opacity,1)"
            stroke="var(--preview-shape-border-color,none)"
            strokeWidth="var(--preview-shape-border-width,0)"
          />
        ))}

        {model.slices.map((slice) => {
          const seam = sliceStartLine(
            model.cx,
            model.cy,
            model.outerRadius,
            model.isDonut ? model.innerRadius : 0,
            slice.startDeg,
          )

          return (
            <line
              key={`seam-${slice.label}`}
              x1={seam.x1}
              y1={seam.y1}
              x2={seam.x2}
              y2={seam.y2}
              stroke="var(--card-bg,#FFFFFF)"
              strokeWidth={Math.max(0.8, model.outerRadius * 0.012)}
            />
          )
        })}

        {model.isDonut && (
          <circle
            cx={model.cx}
            cy={model.cy}
            r={model.innerRadius}
            fill="var(--card-bg,#FFFFFF)"
          />
        )}

        {showDataLabels && model.slices.map((slice) => {
          const point = labelBySlice.get(slice.index)
          if (!point) return null
          const lines = labelLines(
            truncateLabel(slice.label),
            slice.value,
            model.total,
            format?.dataLabels.labelStyle ?? 'Data value, percent of total',
            format?.dataLabels.displayUnits ?? 'Auto',
            format?.dataLabels.decimals ?? 'Auto',
          )
          const startY = f(point.textY - ((lines.length - 1) * labelLineHeight) / 2)

          return (
            <g key={`label-${slice.label}`}>
              <polyline
                points={`${point.edgeX},${point.edgeY} ${point.bendX},${point.bendY} ${point.lineEndX},${point.bendY}`}
                fill="none"
                stroke="#C8C6C4"
                strokeWidth={0.65}
              />
              <text
                x={point.textX}
                y={startY}
                textAnchor={point.anchor}
                fontSize={labelFontSize}
                fill={labelColor}
                fontWeight={format?.dataLabels.fontWeight ?? 600}
                fontStyle={format?.dataLabels.fontStyle ?? 'normal'}
                textDecoration={format?.dataLabels.textDecoration ?? 'none'}
                fontFamily={format?.dataLabels.fontFamily ?? "var(--preview-font-family,'Segoe UI',sans-serif)"}
              >
                {lines.map((line, index) => (
                  <tspan key={`${slice.label}-${index}`} x={point.textX} dy={index === 0 ? 0 : labelLineHeight}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}

        {showLegend && model.legend.visible && (
          <g transform={`translate(${f(model.legend.legendRect.x)} ${f(model.legend.legendRect.y)})`}>
            {legendTitleShow && (
              <text
                x={0}
                y={renderLegendTextY(legendTitleFontSize)}
                fontSize={legendTitleFontSize}
                fill={format?.legend.titleColor ?? 'var(--preview-legend-color,#605E5C)'}
                fontFamily={format?.legend.titleFontFamily ?? "var(--preview-font-family,'Segoe UI',sans-serif)"}
                fontWeight={format?.legend.titleFontWeight ?? 700}
                fontStyle={format?.legend.titleFontStyle ?? 'normal'}
                textDecoration={format?.legend.titleTextDecoration ?? 'none'}
              >
                {format?.legend.titleText}
              </text>
            )}
            {legendTextShow && model.legendItems.map((item, index) => {
              const horizontal = model.legend.direction === 'horizontal'
              const row = horizontal ? Math.floor(index / model.legend.itemsPerRow) : index
              const col = horizontal ? index % model.legend.itemsPerRow : 0
              const itemWidth = horizontal ? model.legend.itemWidth : model.legend.itemWidth
              const label = truncateLegendLabel(item.label, itemWidth)

              return (
                <g
                  key={`legend-${item.label}`}
                  transform={`translate(${f(col * model.legend.itemWidth)} ${legendTitleHeight + row * model.legend.itemHeight})`}
                >
                  <circle
                    cx={legendFontSize * 0.45}
                    cy={legendFontSize * 0.45}
                    r={legendFontSize * 0.42}
                    fill={item.color}
                  />
                  <text
                    x={legendFontSize * 1.1}
                    y={renderLegendTextY(legendFontSize)}
                    fontSize={legendFontSize}
                    fill="var(--preview-legend-color,#605E5C)"
                    fontFamily={format?.legend.fontFamily ?? "var(--preview-font-family,'Segoe UI',sans-serif)"}
                    fontWeight={format?.legend.fontWeight ?? 400}
                    fontStyle={format?.legend.fontStyle ?? 'normal'}
                    textDecoration={format?.legend.textDecoration ?? 'none'}
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
