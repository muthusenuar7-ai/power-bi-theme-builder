'use client'

import { BrandColors } from '@/components/sidebar/BrandColors'
import { ColorPalette } from '@/components/sidebar/ColorPalette'
import { ColorLibrary } from '@/components/sidebar/ColorLibrary'
import { GradientPicker } from '@/components/sidebar/GradientPicker'
import { CoolorsImport } from '@/components/sidebar/CoolorsImport'

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{
      padding: '10px 0 6px',
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--text-3)',
      letterSpacing: '.07em',
      textTransform: 'uppercase',
      borderTop: '1px solid var(--border-ui)',
      marginTop: 4,
    }}>
      {label}
    </div>
  )
}

export function LeftPanelColors() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
          letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8,
        }}>Brand Colors</div>
        <BrandColors />
      </div>

      <SectionDivider label="Data Palette" />
      <ColorPalette />

      <SectionDivider label="Colour Library" />
      <ColorLibrary />

      <SectionDivider label="Gradient Library" />
      <GradientPicker />

      <SectionDivider label="Import from Coolors" />
      <CoolorsImport />
    </div>
  )
}
