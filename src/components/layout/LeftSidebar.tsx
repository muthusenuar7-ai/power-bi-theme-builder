'use client'

import { useState } from 'react'
import { Blend, CaseSensitive, Layers3, Palette, SwatchBook } from 'lucide-react'
import { AccordionSection } from '@/components/sidebar/AccordionSection'
import { BrandColors } from '@/components/sidebar/BrandColors'
import { ColorPalette } from '@/components/sidebar/ColorPalette'
import { CoolorsImport } from '@/components/sidebar/CoolorsImport'
import { PresetThemes } from '@/components/sidebar/PresetThemes'
import { Typography } from '@/components/sidebar/Typography'
import { getAllThemePresets } from '@/lib/themePresetRegistry'

type SidebarTab = 'styles' | 'typography'

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('styles')
  const presetCount = getAllThemePresets().length

  return (
    <aside className="left-sidebar">
      {/* 2-Tab Row */}
      <div className="sidebar-tab-row">
        <button
          type="button"
          className={`sidebar-tab-btn${activeTab === 'styles' ? ' active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          <Palette size={12} strokeWidth={2} />
          Styles
        </button>
        <button
          type="button"
          className={`sidebar-tab-btn${activeTab === 'typography' ? ' active' : ''}`}
          onClick={() => setActiveTab('typography')}
        >
          <CaseSensitive size={12} strokeWidth={2} />
          Typography
        </button>
      </div>

      <div className="sidebar-scroll">
        {activeTab === 'styles' && (
          <>
            <AccordionSection title="Preset Themes" icon={<SwatchBook size={13} strokeWidth={2} />} badge={`${presetCount}`} defaultOpen>
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
          </>
        )}

        {activeTab === 'typography' && (
          <AccordionSection title="Typography" icon={<CaseSensitive size={13} strokeWidth={2} />} defaultOpen>
            <Typography />
          </AccordionSection>
        )}
      </div>
    </aside>
  )
}
