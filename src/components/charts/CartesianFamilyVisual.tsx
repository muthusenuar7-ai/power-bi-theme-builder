'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { useElementSize } from '@/hooks/useElementSize'
import { f, categoryLabelParts, truncateCategoryLabel } from './chartUtils'
import {
  buildCartesianModel,
  formatDisplayValue,
  truncateLegendLabel,
} from '@/lib/pbi-mimic'
import type {
  CartesianMode,
  CartesianModelOptions,
  CartesianOrientation,
  CartesianSegment,
} from '@/lib/pbi-mimic'
import type { ResolvedAxisPreviewStyle } from '@/lib/formatPreview'

const FONT = "var(--preview-font-family, 'Segoe UI', sans-serif)"

export interface CartesianFamilyVisualProps extends ChartVisualProps {
  orientation: CartesianOrientation
  mode: CartesianMode
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

export function CartesianFamilyVisual({
  orientation,
  mode,
  categories,
  series,
  values,
  showLegend = true,
  showDataLabels = true,
  format,
}: CartesianFamilyVisualProps) {
  const { ref, width, height } = useElementSize({ width: 420, height: 260 })
  const isVertical = orientation === 'vertical'

  // Axis role mapping: column → x=category / y=value; bar → y=category / x=value.
  const categoryAxisFmt = isVertical ? format?.xAxis : format?.yAxis
  const valueAxisFmt = isVertical ? format?.yAxis : format?.xAxis

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

  const modelOptions: CartesianModelOptions = {
    width,
    height,
    orientation,
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
    categorySize: categoryAxisFmt?.categorySize ?? 20,
    categoryMaxWidthPct: categoryAxisFmt?.maxWidthPct ?? 25,
    categoryMaxHeightPct: categoryAxisFmt?.maxHeightPct ?? 25,
  }

  const model = buildCartesianModel(modelOptions)
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

  const stacked = mode === 'stacked' || mode === 'hundredPercent'

  function labelText(seg: CartesianSegment): string {
    if (model.valueIsPercent) return `${Math.round(seg.value)}%`
    return formatDisplayValue(seg.rawValue, labelUnits, labelDecimals, { alreadyScaled: true })
  }

  /* ── Value-axis labels ── */
  const valueLabelColor = valueAxisFmt?.labelVisible ? valueAxisFmt.color : 'transparent'
  const valueLabelSize = valueAxisFmt?.fontSize ?? 7.5
  const catLabelColor = categoryAxisFmt?.labelVisible ? categoryAxisFmt.color : 'transparent'
  const catLabelSize = categoryAxisFmt?.fontSize ?? 7.5

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        role="img"
        aria-label={`${orientation === 'vertical' ? 'Column' : 'Bar'} chart preview`}
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
          if (isVertical) {
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
          }
          return (
            <g key={`vt-${tick.value}`}>
              <line
                x1={f(tick.pos)} y1={f(innerPlot.y)} x2={f(tick.pos)} y2={f(innerPlot.y + innerPlot.h)}
                stroke={isZero ? axisLineColor : gridColor}
                strokeWidth={isZero ? 0.8 : gridWidth}
                strokeDasharray={isZero ? '0' : gridDash}
                strokeOpacity={isZero ? 1 : gridOpacity}
              />
              <text
                x={f(tick.pos)}
                y={f(model.valueAxisSwitched ? innerPlot.y - 3 : innerPlot.y + innerPlot.h + valueLabelSize + 2)}
                textAnchor="middle"
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
          if (isVertical) {
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
          }
          const labelX = model.categoryAxisSwitched ? innerPlot.x + innerPlot.w + 5 : innerPlot.x - 5
          const startY = band.center - ((parts.length - 1) * lineHeight) / 2
          return (
            <text
              key={`cat-${band.categoryIdx}`}
              x={f(labelX)} y={f(startY + catLabelSize * 0.32)}
              textAnchor={model.categoryAxisSwitched ? 'start' : 'end'}
              fontSize={catLabelSize} fill={catLabelColor} fontFamily={FONT}
              fontWeight={categoryAxisFmt?.fontWeight ?? 400}
              fontStyle={categoryAxisFmt?.fontStyle ?? 'normal'}
              textDecoration={categoryAxisFmt?.textDecoration ?? 'none'}
            >
              {parts.map((p, i) => (
                <tspan key={i} x={f(labelX)} dy={i === 0 ? 0 : lineHeight}>{p}</tspan>
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
          // Plot-relative anchors so a left/right legend never overlaps the
          // rotated axis title, and so title space stays distinct from labels.
          const leftTitleX = model.valueAxisRect.x + valTitleSize * 0.55
          const rightTitleX = model.valueAxisRect.x + model.valueAxisRect.w - valTitleSize * 0.55
          const catLeftTitleX = model.categoryAxisRect.x + catTitleSize * 0.55
          const catRightTitleX = model.categoryAxisRect.x + model.categoryAxisRect.w - catTitleSize * 0.55
          const bottomTitleY = model.categoryAxisRect.y + model.categoryAxisRect.h - 1
          return (
            <>
              {valTitle && (isVertical ? (
                <text
                  transform={`translate(${f(model.valueAxisSwitched ? rightTitleX : leftTitleX)} ${f(innerPlot.y + innerPlot.h / 2)}) rotate(-90)`}
                  textAnchor="middle" fontSize={valTitleSize} fill={valTitleColor}
                  fontWeight={valueAxisFmt?.titleFontWeight ?? 700}
                  fontStyle={valueAxisFmt?.titleFontStyle ?? 'normal'}
                  textDecoration={valueAxisFmt?.titleTextDecoration ?? 'none'}
                  fontFamily={FONT}
                >{valTitle}</text>
              ) : (
                <text
                  x={f(innerPlot.x + innerPlot.w / 2)} y={f(bottomTitleY)} textAnchor="middle"
                  fontSize={valTitleSize} fill={valTitleColor}
                  fontWeight={valueAxisFmt?.titleFontWeight ?? 700}
                  fontStyle={valueAxisFmt?.titleFontStyle ?? 'normal'}
                  textDecoration={valueAxisFmt?.titleTextDecoration ?? 'none'}
                  fontFamily={FONT}
                >{valTitle}</text>
              ))}
              {catTitle && (isVertical ? (
                <text
                  x={f(innerPlot.x + innerPlot.w / 2)} y={f(bottomTitleY)} textAnchor="middle"
                  fontSize={catTitleSize} fill={catTitleColor}
                  fontWeight={categoryAxisFmt?.titleFontWeight ?? 700}
                  fontStyle={categoryAxisFmt?.titleFontStyle ?? 'normal'}
                  textDecoration={categoryAxisFmt?.titleTextDecoration ?? 'none'}
                  fontFamily={FONT}
                >{catTitle}</text>
              ) : (
                <text
                  transform={`translate(${f(model.categoryAxisSwitched ? catRightTitleX : catLeftTitleX)} ${f(innerPlot.y + innerPlot.h / 2)}) rotate(-90)`}
                  textAnchor="middle" fontSize={catTitleSize} fill={catTitleColor}
                  fontWeight={categoryAxisFmt?.titleFontWeight ?? 700}
                  fontStyle={categoryAxisFmt?.titleFontStyle ?? 'normal'}
                  textDecoration={categoryAxisFmt?.titleTextDecoration ?? 'none'}
                  fontFamily={FONT}
                >{catTitle}</text>
              ))}
            </>
          )
        })()}

        {/* Segments */}
        {model.segments.map((seg) => (
          <rect
            key={`seg-${seg.categoryIdx}-${seg.seriesIdx}`}
            x={f(seg.x)} y={f(seg.y)} width={f(seg.w)} height={f(seg.h)}
            fill={seg.color} fillOpacity={shapeOpacity}
            stroke={borderColor} strokeWidth={borderWidth}
          />
        ))}

        {/* Data labels */}
        {showDataLabels && model.segments.map((seg) => {
          const text = labelText(seg)
          if (stacked) {
            const fits = isVertical ? seg.h > labelFontSize + 3 : seg.w > text.length * labelFontSize * 0.55
            if (!fits) return null
            return (
              <text
                key={`lab-${seg.categoryIdx}-${seg.seriesIdx}`}
                x={f(seg.x + seg.w / 2)} y={f(seg.y + seg.h / 2 + labelFontSize * 0.34)}
                textAnchor="middle" fontSize={labelFontSize} fill="#FFFFFF"
                fontWeight={labelWeight} fontStyle={labelStyle} textDecoration={labelDecoration} fontFamily={FONT}
              >{text}</text>
            )
          }
          // single / clustered — label at the value end of the bar
          if (isVertical) {
            return (
              <text
                key={`lab-${seg.categoryIdx}-${seg.seriesIdx}`}
                x={f(seg.x + seg.w / 2)} y={f(seg.y - 2)} textAnchor="middle"
                fontSize={labelFontSize} fill={labelColor}
                fontWeight={labelWeight} fontStyle={labelStyle} textDecoration={labelDecoration} fontFamily={FONT}
              >{text}</text>
            )
          }
          return (
            <text
              key={`lab-${seg.categoryIdx}-${seg.seriesIdx}`}
              x={f(seg.x + seg.w + 3)} y={f(seg.y + seg.h / 2 + labelFontSize * 0.34)} textAnchor="start"
              fontSize={labelFontSize} fill={labelColor}
              fontWeight={labelWeight} fontStyle={labelStyle} textDecoration={labelDecoration} fontFamily={FONT}
            >{text}</text>
          )
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
              return (
                <g
                  key={`leg-${item.label}`}
                  transform={`translate(${f(col * model.legend.itemWidth)} ${f(legendTitleHeight + row * model.legend.itemHeight)})`}
                >
                  <rect x={0} y={legendFontSize * 0.15} width={legendFontSize * 0.7} height={legendFontSize * 0.7} fill={item.color} />
                  <text
                    x={legendFontSize * 1.05} y={legendFontSize * 0.88}
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
