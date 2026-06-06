'use client'

import type { IconLibraryItem } from '@/types'
import { RecolorableIcon } from './RecolorableIcon'

interface IconPickerProps {
  icons: IconLibraryItem[]
  selectedIconId: string | null
  iconColor: string
  onSelect: (icon: IconLibraryItem) => void
}

export function IconPicker({ icons, selectedIconId, iconColor, onSelect }: IconPickerProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 6,
      }}
    >
      {icons.map((icon) => {
        const active = icon.id === selectedIconId
        return (
          <button
            key={icon.id}
            type="button"
            title={icon.name}
            aria-label={icon.name}
            onClick={() => onSelect(icon)}
            style={{
              height: 50,
              borderRadius: 8,
              border: active ? '1px solid var(--accent-ui)' : '1px solid var(--border-ui)',
              background: active ? 'var(--accent-soft)' : 'var(--surface)',
              color: active ? 'var(--accent-ui)' : 'var(--text-2)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              transition: 'border-color .12s, background .12s, transform .12s',
            }}
          >
            <RecolorableIcon url={icon.url} color={active ? iconColor : 'currentColor'} size={22} title={icon.name} />
          </button>
        )
      })}
    </div>
  )
}
