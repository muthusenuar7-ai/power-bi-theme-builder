'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { getGeneralPreviewStyles } from '@/lib/formatPreview'
import type { ChartDefinition } from '@/types'

interface Props { chart: ChartDefinition; isSelected: boolean }

export function ChartCard({ chart, isSelected }: Props) {
  const setFocusVisual    = useThemeStore((s) => s.setFocusVisual)
  const setSelectedVisual = useThemeStore((s) => s.setSelectedVisual)
  const formatProps       = useThemeStore((s) => s.formatProps)
  const bg                = useThemeStore((s) => s.bg)
  const fg                = useThemeStore((s) => s.fg)
  const visualTitles      = useThemeStore((s) => s.visualTitles)
  const setVisualTitle    = useThemeStore((s) => s.setVisualTitle)

  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editVal,   setEditVal]   = useState('')

  const visualTitle = visualTitles[chart.id]

  const { cardStyle, titleStyle, subtitleStyle, title, subtitle, showTitle, showSubtitle } = getGeneralPreviewStyles(formatProps, {
    background: bg,
    foreground: fg,
    border: '#E5E7EB',
    title: visualTitle ?? chart.title,
    subtitle: chart.sub,
  })
  const displayTitle = visualTitle ?? title.text
  const baseShadow = cardStyle.boxShadow === 'none' ? 'var(--card-shadow)' : cardStyle.boxShadow
  const restShadow = isSelected ? `0 0 0 2px rgba(13,148,136,.18), ${baseShadow}` : baseShadow

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setEditVal(displayTitle)
    setIsEditing(true)
  }

  function commitEdit() {
    const val = editVal.trim()
    setVisualTitle(chart.id, val || chart.title)
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter')  { commitEdit(); return }
    if (e.key === 'Escape') { setIsEditing(false) }
  }

  return (
    <div
      onClick={() => { setFocusVisual(chart.id); setSelectedVisual(chart.id) }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform   = 'translateY(-1px)'
        el.style.boxShadow   = '0 6px 22px rgba(15,23,42,.12)'
        setIsHovered(true)
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ''
        el.style.boxShadow = String(restShadow)
        setIsHovered(false)
      }}
      style={{
        ...cardStyle,
        border: isSelected
          ? '1px solid var(--theme-primary, #0D9488)'
          : cardStyle.border,
        boxShadow: restShadow,
        display: 'flex', flexDirection: 'column', gap: 3,
        cursor: 'pointer', overflow: 'hidden',
        transition: 'transform .15s, box-shadow .15s',
        minWidth: 0, minHeight: 0,
      }}
    >
      {showTitle && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, minWidth: 0 }}
          onMouseEnter={() => setIsHovered(true)}
        >
          {isEditing ? (
            <input
              autoFocus
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              style={{
                ...titleStyle,
                flex: 1, minWidth: 0,
                background: 'transparent',
                border: '1px solid var(--theme-primary, #0D9488)',
                borderRadius: 3,
                padding: '1px 4px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <>
              <div style={{
                ...titleStyle,
                flex: 1, minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: 0,
                lineHeight: 1.2,
              }}>
                {displayTitle}
              </div>
              {isHovered && (
                <button
                  type="button"
                  title="Edit title"
                  onClick={startEdit}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 2, borderRadius: 3, flexShrink: 0,
                    color: 'var(--theme-primary, #0D9488)',
                    display: 'flex', alignItems: 'center',
                    opacity: 0.75,
                  }}
                >
                  <Pencil size={9} strokeWidth={2} />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {showSubtitle && (
        <div style={{ ...subtitleStyle, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subtitle.text}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, marginTop: 4 }}>
        <ChartRenderer visualId={chart.id} size="card" />
      </div>
    </div>
  )
}
