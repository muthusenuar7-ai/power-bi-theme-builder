'use client'

import { FormatPane } from '@/components/format-pane/FormatPane'
import { SkillToggle } from '@/components/format-pane/SkillToggle'
import { JsonPreview } from '@/components/right-panel/JsonPreview'
import { QualityScore } from '@/components/right-panel/QualityScore'
import { ValidationPanel } from '@/components/right-panel/ValidationPanel'
import { CHART_POOL } from '@/lib/chartPool'
import { useThemeStore } from '@/store/themeStore'

export function RightPanel() {
  const selectedVisual = useThemeStore((s) => s.selectedVisual)
  const focusVisual = useThemeStore((s) => s.focusVisual)
  const visualTitles = useThemeStore((s) => s.visualTitles)
  const setVisualTitle = useThemeStore((s) => s.setVisualTitle)
  const activeVisualId = selectedVisual ?? focusVisual
  const activeVisual = CHART_POOL.find((visual) => visual.id === activeVisualId)
  const activeTitle = activeVisual ? visualTitles[activeVisual.id] ?? activeVisual.title : ''

  return (
    <aside className="right-panel">
      <div className="panel-section-header">Format Panel</div>

      <div className="right-scroll">
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-ui)',
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--text-3)',
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              marginBottom: 5,
            }}
          >
            Selected Visual
          </div>
          <div style={{ fontSize: 12, color: activeVisual ? 'var(--text)' : 'var(--text-2)', fontWeight: activeVisual ? 700 : 400 }}>
            {activeVisual ? activeTitle : 'No visual selected'}
          </div>
          {activeVisual && (
            <>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
                {activeVisual.sub}
              </div>
              <label
                style={{
                  display: 'block',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-3)',
                  marginTop: 10,
                  marginBottom: 4,
                }}
              >
                Title text
              </label>
              <input
                type="text"
                value={activeTitle}
                onChange={(event) => setVisualTitle(activeVisual.id, event.target.value)}
                onBlur={(event) => {
                  if (!event.target.value.trim()) setVisualTitle(activeVisual.id, activeVisual.title)
                }}
                spellCheck={false}
                style={{
                  width: '100%',
                  height: 27,
                  border: '1px solid var(--border-ui)',
                  borderRadius: 5,
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 11,
                  fontFamily: 'inherit',
                  padding: '0 8px',
                  outline: 'none',
                }}
              />
            </>
          )}
          {!activeVisual && (
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>
              Select a chart on the canvas or use the visual selector to edit its formatting.
            </div>
          )}
        </div>

        <SkillToggle />
        <FormatPane />
        <QualityScore />
        <ValidationPanel />
        <JsonPreview />
      </div>
    </aside>
  )
}
