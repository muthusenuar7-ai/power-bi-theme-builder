'use client'

import { Blend, CaseSensitive, Layers3, Palette, SlidersHorizontal, SwatchBook } from 'lucide-react'
import { AccordionSection } from '@/components/sidebar/AccordionSection'
import { BrandColors } from '@/components/sidebar/BrandColors'
import { ColorPalette } from '@/components/sidebar/ColorPalette'
import { CoolorsImport } from '@/components/sidebar/CoolorsImport'
import { PresetThemes } from '@/components/sidebar/PresetThemes'
import { Typography } from '@/components/sidebar/Typography'
import { PRESETS } from '@/lib/presets'

export function LeftSidebar() {
  return (
    <aside className="left-sidebar">
      <div className="sidebar-scroll">
        <AccordionSection title="Preset Themes" icon={<SwatchBook size={13} strokeWidth={2} />} badge={`${PRESETS.length}`} defaultOpen>
          <PresetThemes />
        </AccordionSection>

        <AccordionSection title="Coolors Import" icon={<Blend size={13} strokeWidth={2} />}>
          <CoolorsImport />
        </AccordionSection>

        <AccordionSection title="Brand Colors" icon={<Palette size={13} strokeWidth={2} />} defaultOpen>
          <BrandColors />
        </AccordionSection>

        <AccordionSection title="Color Palette" icon={<Layers3 size={13} strokeWidth={2} />} defaultOpen>
          <ColorPalette />
        </AccordionSection>

        <AccordionSection title="Typography" icon={<CaseSensitive size={13} strokeWidth={2} />}>
          <Typography />
        </AccordionSection>

        <AccordionSection title="Advanced" icon={<SlidersHorizontal size={13} strokeWidth={2} />}>
          <div className="placeholder-msg" style={{ padding: 10 }}>
            <span>Advanced canvas-level controls are queued for the next pass.</span>
          </div>
        </AccordionSection>
      </div>
    </aside>
  )
}
