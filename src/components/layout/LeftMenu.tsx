'use client'

import { useState } from 'react'
import {
  SwatchBook, Droplets, Type, BarChart3,
  LayoutDashboard, Download, Settings, Shapes,
} from 'lucide-react'
import { LeftPanelThemes }     from '@/components/left-menu/LeftPanelThemes'
import { LeftPanelColors }     from '@/components/left-menu/LeftPanelColors'
import { LeftPanelTypography } from '@/components/left-menu/LeftPanelTypography'
import { LeftPanelVisuals }    from '@/components/left-menu/LeftPanelVisuals'
import { LeftPanelIcons }      from '@/components/left-menu/LeftPanelIcons'
import { LeftPanelLayout }     from '@/components/left-menu/LeftPanelLayout'
import { LeftPanelExport }     from '@/components/left-menu/LeftPanelExport'
import { LeftPanelSettings }   from '@/components/left-menu/LeftPanelSettings'
type MenuSection = 'themes' | 'colors' | 'typography' | 'icons' | 'visuals' | 'layout' | 'export' | 'settings'

interface MenuItem {
  id: MenuSection
  label: string
  icon: React.ReactNode
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'themes',     label: 'Themes',   icon: <SwatchBook    size={16} strokeWidth={1.8} /> },
  { id: 'colors',     label: 'Colors',   icon: <Droplets      size={16} strokeWidth={1.8} /> },
  { id: 'typography', label: 'Type',     icon: <Type          size={16} strokeWidth={1.8} /> },
  { id: 'icons',      label: 'Icons',    icon: <Shapes        size={16} strokeWidth={1.8} /> },
  { id: 'visuals',    label: 'Visuals',  icon: <BarChart3     size={16} strokeWidth={1.8} /> },
  { id: 'layout',     label: 'Layout',   icon: <LayoutDashboard size={16} strokeWidth={1.8} /> },
  { id: 'export',     label: 'Export',   icon: <Download      size={16} strokeWidth={1.8} /> },
  { id: 'settings',   label: 'Settings', icon: <Settings      size={16} strokeWidth={1.8} /> },
]

const PANEL_LABELS: Record<MenuSection, string> = {
  themes:     'Preset Themes',
  colors:     'Colors',
  typography: 'Typography',
  icons:      'Icon Library',
  visuals:    'Visuals',
  layout:     'Layout',
  export:     'Export',
  settings:   'Settings',
}

function PanelBody({ section }: { section: MenuSection }) {
  switch (section) {
    case 'themes':     return <LeftPanelThemes />
    case 'colors':     return <LeftPanelColors />
    case 'typography': return <LeftPanelTypography />
    case 'icons':      return <LeftPanelIcons />
    case 'visuals':    return <LeftPanelVisuals />
    case 'layout':     return <LeftPanelLayout />
    case 'export':     return <LeftPanelExport />
    case 'settings':   return <LeftPanelSettings />
  }
}

export function LeftMenu() {
  const [active, setActive] = useState<MenuSection>('themes')

  return (
    <div className="left-menu">
      {/* ── Icon Rail ── */}
      <nav className="left-rail" aria-label="Left menu">
        {MENU_ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              aria-label={item.label}
              className={`left-rail-item${isActive ? ' active' : ''}`}
              onClick={() => setActive(item.id)}
            >
              <span className="left-rail-icon">{item.icon}</span>
              <span className="left-rail-label">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ── Dynamic Content Panel ── */}
      <div className="left-panel">
        {/* Panel header */}
        <div className="left-panel-header">
          <span className="left-panel-title">{PANEL_LABELS[active]}</span>
        </div>

        {/* Scrollable body */}
        <div className="left-panel-body">
          <PanelBody section={active} />
        </div>
      </div>
    </div>
  )
}
