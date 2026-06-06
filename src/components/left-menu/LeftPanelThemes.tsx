'use client'

import { PresetThemes } from '@/components/sidebar/PresetThemes'

export function LeftPanelThemes() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <PresetThemes />
    </div>
  )
}
