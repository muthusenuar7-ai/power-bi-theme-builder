'use client'

import { getVisualFormatSchema, sharedGeneralFormatSchema } from '@/lib/visualFormatSchema'
import { useThemeStore } from '@/store/themeStore'
import type { FormatTab } from '@/types'
import { FormatSection } from './FormatSection'

const TABS: FormatTab[] = ['visual', 'general']

export function FormatPane() {
  const selectedVisual = useThemeStore((s) => s.selectedVisual)
  const focusVisual = useThemeStore((s) => s.focusVisual)
  const activeFormatTab = useThemeStore((s) => s.activeFormatTab)
  const setFormatTab = useThemeStore((s) => s.setFormatTab)
  const activeVisualId = selectedVisual ?? focusVisual
  const schema = activeFormatTab === 'general'
    ? sharedGeneralFormatSchema
    : getVisualFormatSchema(activeVisualId)

  return (
    <div style={{ borderBottom: '1px solid var(--border-ui)' }}>
      <div style={{ padding: '10px 14px 8px' }}>
        <div style={{ display: 'flex', border: '1px solid var(--border-ui)', borderRadius: 6, padding: 2, background: 'var(--surface-2)' }}>
          {TABS.map((tab) => {
            const active = activeFormatTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFormatTab(tab)}
                style={{
                  flex: 1,
                  height: 25,
                  border: 'none',
                  borderRadius: 4,
                  background: active ? 'var(--accent-ui)' : 'transparent',
                  color: active ? 'white' : 'var(--text-3)',
                  fontSize: 10.8,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {activeFormatTab === 'visual' && !activeVisualId && (
        <div className="placeholder-msg" style={{ padding: '16px 14px' }}>
          <strong>No visual selected</strong>
          <span>Pick a visual from the selector or canvas to edit visual properties.</span>
        </div>
      )}

      {schema && (
        <div>
          <div
            style={{
              padding: '0 14px 8px',
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
            }}
          >
            {schema.label}
          </div>
          {schema.sections.map((section) => (
            <FormatSection key={`${schema.id}.${section.id}`} schema={schema} section={section} />
          ))}
        </div>
      )}
    </div>
  )
}
