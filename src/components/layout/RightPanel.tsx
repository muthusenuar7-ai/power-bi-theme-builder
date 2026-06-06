'use client'

import {
  BarChart2, LineChart, AreaChart, PieChart,
  ScatterChart, Table2, Filter, BarChart3, GitBranch,
} from 'lucide-react'
import { FormatPane } from '@/components/format-pane/FormatPane'
import { CHART_POOL } from '@/lib/chartPool'
import { useThemeStore } from '@/store/themeStore'
import type { FormatTab } from '@/types'

const FORMAT_TABS: { id: FormatTab; label: string }[] = [
  { id: 'visual',  label: 'Visual'  },
  { id: 'general', label: 'General' },
]

function getVisualIcon(id: string) {
  const props = { size: 14, strokeWidth: 1.8 }
  if (['bar', 'stackedbar', 'clusteredbar', 'hundredstackedbar'].includes(id))
    return <BarChart2 {...props} style={{ transform: 'rotate(90deg)' }} />
  if (['column', 'stackedcol', 'clusteredcol', 'hundredstackedcol', 'waterfall'].includes(id))
    return <BarChart2 {...props} />
  if (['line', 'lineclustered', 'linestacked', 'ribbon'].includes(id))
    return <LineChart {...props} />
  if (['area', 'stackedarea'].includes(id))
    return <AreaChart {...props} />
  if (['pie', 'donut'].includes(id))
    return <PieChart {...props} />
  if (['scatter', 'bubble'].includes(id))
    return <ScatterChart {...props} />
  if (['table', 'matrix'].includes(id))
    return <Table2 {...props} />
  if (id === 'funnel')
    return <Filter {...props} />
  if (id === 'decompositiontree')
    return <GitBranch {...props} />
  return <BarChart3 {...props} />
}

export function RightPanel() {
  const selectedVisual  = useThemeStore((s) => s.selectedVisual)
  const focusVisual     = useThemeStore((s) => s.focusVisual)
  const activeFormatTab = useThemeStore((s) => s.activeFormatTab)
  const setFormatTab    = useThemeStore((s) => s.setFormatTab)

  const activeVisualId = selectedVisual ?? focusVisual
  const activeVisual   = CHART_POOL.find((v) => v.id === activeVisualId)

  return (
    <aside className="right-panel">
      {/* ── Selected Visual Row ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px',
          borderBottom: '1px solid var(--border-ui)',
          background: 'var(--surface-2)',
          minHeight: 44,
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: activeVisual ? 'var(--accent-soft)' : 'var(--surface)',
          border: '1px solid var(--border-ui)',
          display: 'grid', placeItems: 'center',
          color: activeVisual ? 'var(--accent-ui)' : 'var(--text-3)',
        }}>
          {activeVisual ? getVisualIcon(activeVisual.id) : <BarChart3 size={14} strokeWidth={1.8} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {activeVisual ? activeVisual.title : 'No visual selected'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
            {activeVisual ? activeVisual.sub : 'Click a chart or use the toolbar'}
          </div>
        </div>
      </div>

      {/* ── 3-Tab Row ── */}
      <div className="right-tab-row">
        {FORMAT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`right-tab-btn${activeFormatTab === tab.id ? ' active' : ''}`}
            onClick={() => setFormatTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Scrollable Content ── */}
      <div className="right-scroll">
        <FormatPane />
      </div>
    </aside>
  )
}
