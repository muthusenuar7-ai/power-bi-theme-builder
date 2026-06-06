'use client'

import { getVisualFormatSchema, sharedGeneralFormatSchema } from '@/lib/visualFormatSchema'
import { useThemeStore } from '@/store/themeStore'
import { FormatSection } from './FormatSection'

export function FormatPane() {
  const selectedVisual = useThemeStore((s) => s.selectedVisual)
  const focusVisual = useThemeStore((s) => s.focusVisual)
  const activeFormatTab = useThemeStore((s) => s.activeFormatTab)

  const activeVisualId = selectedVisual ?? focusVisual
  const schema = activeFormatTab === 'general'
    ? sharedGeneralFormatSchema
    : getVisualFormatSchema(activeVisualId)

  if (!schema) return null

  return (
    <div>
      {activeFormatTab === 'visual' && !activeVisualId && (
        <div className="placeholder-msg" style={{ padding: '16px 14px' }}>
          <strong>No visual selected</strong>
          <span>Pick a visual from the toolbar or canvas to edit visual properties.</span>
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
              borderBottom: '1px solid var(--border-ui)',
              paddingTop: 10,
              paddingBottom: 8,
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
