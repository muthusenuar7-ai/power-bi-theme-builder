'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { getLayoutPlan } from '@/lib/layoutEngine'

export function PageNavigator() {
  const pageSize    = useThemeStore((s) => s.pageSize)
  const currentPage = useThemeStore((s) => s.currentPage)
  const setPage     = useThemeStore((s) => s.setCurrentPage)

  const { totalPages } = getLayoutPlan(pageSize)
  const pages = Array.from({ length: totalPages }, (_, i) => i)

  const btnStyle: React.CSSProperties = {
    width: 24, height: 24, border: 'none', background: 'transparent',
    borderRadius: '50%', display: 'grid', placeItems: 'center',
    cursor: 'pointer', color: '#64748B', padding: 0,
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 12px', background: '#FFFFFF',
      border: '1px solid #E2E8F0', borderRadius: 999,
      boxShadow: '0 1px 3px rgba(15,23,42,.06)',
      flexShrink: 0,
    }}>
      <button
        style={{ ...btnStyle, opacity: currentPage === 0 ? .3 : 1, cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
        disabled={currentPage === 0}
        onClick={() => setPage(Math.max(0, currentPage - 1))}
        aria-label="Previous page"
      >
        <ChevronLeft size={14} strokeWidth={2} />
      </button>

      <div style={{ display: 'flex', gap: 5 }}>
        {pages.map((i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            aria-label={`Page ${i + 1}`}
            style={{
              width: 7, height: 7, borderRadius: '50%', border: 'none', padding: 0,
              background: i === currentPage ? 'var(--accent-ui, #0D9488)' : '#CBD5E1',
              cursor: 'pointer',
              transform: i === currentPage ? 'scale(1.25)' : 'scale(1)',
              transition: 'background .12s, transform .12s',
            }}
          />
        ))}
      </div>

      <button
        style={{ ...btnStyle, opacity: currentPage === totalPages - 1 ? .3 : 1, cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer' }}
        disabled={currentPage === totalPages - 1}
        onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
        aria-label="Next page"
      >
        <ChevronRight size={14} strokeWidth={2} />
      </button>

      <span style={{ fontSize: 10.5, color: '#475569', whiteSpace: 'nowrap' }}>
        Page {currentPage + 1} of {totalPages}
      </span>
    </div>
  )
}
