'use client'

import type { IconLibraryCategoryFilter } from '@/lib/iconLibrary'
import { ICON_LIBRARY_CATEGORIES } from '@/lib/iconLibrary'

interface IconCategoryFilterProps {
  value: IconLibraryCategoryFilter
  onChange: (category: IconLibraryCategoryFilter) => void
}

export function IconCategoryFilter({ value, onChange }: IconCategoryFilterProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: 'var(--text-3)',
        letterSpacing: '.07em',
        textTransform: 'uppercase',
      }}>
        Category
      </div>
      <div className="preset-cat-scroll" role="listbox" aria-label="Icon category filter">
        {ICON_LIBRARY_CATEGORIES.map((category) => {
          const active = category === value
          return (
            <button
              key={category}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onChange(category)}
              style={{
                height: 26,
                padding: '0 10px',
                borderRadius: 999,
                border: active ? '1px solid var(--accent-ui)' : '1px solid var(--border-ui)',
                background: active ? 'var(--accent-ui)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--text-2)',
                fontSize: 10.5,
                fontWeight: 700,
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {category}
            </button>
          )
        })}
      </div>
    </div>
  )
}
