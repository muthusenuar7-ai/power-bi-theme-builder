'use client'

import Link from 'next/link'
import { ArrowUpRight, Shapes } from 'lucide-react'
import { ICON_LIBRARY_COUNT } from '@/lib/iconLibrary'

/**
 * LeftPanelIcons - the editor keeps Theme Builder focused on themes and visual
 * formatting, so the full Icon Studio now lives on its own page at `/icons`.
 * This panel is a compact launcher that opens it in a new tab.
 */
export function LeftPanelIcons() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          border: '1px solid var(--border-ui)',
          borderRadius: 10,
          background: 'var(--surface-2)',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--accent-soft)',
              color: 'var(--accent-ui)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Shapes size={18} strokeWidth={1.8} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)' }}>Icon Studio</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>
              {ICON_LIBRARY_COUNT.toLocaleString()}+ Power BI-ready icons
            </div>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-2)' }}>
          Search by name, category, or tag, recolor any icon, and copy its relative or full URL. Icon Studio opens on its own page.
        </p>

        <Link
          href="/icons"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            height: 34,
            borderRadius: 8,
            background: 'var(--accent-ui)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            textDecoration: 'none',
          }}
        >
          Open Icon Studio
          <ArrowUpRight size={14} strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}
