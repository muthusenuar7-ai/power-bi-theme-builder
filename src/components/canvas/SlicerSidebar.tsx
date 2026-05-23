import { SLICER_DEFS } from '@/lib/slicerDefs'
import type { SlicerPosition } from '@/types'

interface Props { numSlicers: number; slicerPos: SlicerPosition }

export function SlicerSidebar({ numSlicers, slicerPos }: Props) {
  if (numSlicers === 0) return null
  const slicers = SLICER_DEFS.slice(0, numSlicers)
  const isTop   = slicerPos === 'top'

  return (
    <div style={{
      display: 'flex',
      flexDirection: isTop ? 'row' : 'column',
      gap: 'var(--gap, 10px)',
      height: '100%',
    }}>
      {slicers.map((sl) => (
        <div key={sl.title} style={{
          flex: 1,
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--card-border, #e4e4e4)',
          borderRadius: 'var(--card-radius, 6px)',
          padding: '8px 10px',
          display: 'flex', flexDirection: 'column', gap: 5,
          minHeight: 56, overflow: 'hidden',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-fg-muted, #605E5C)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            {sl.title}
          </div>

          {sl.type === 'slider' ? (
            <SliderSlicer min={sl.min ?? 0} max={sl.max ?? 100} />
          ) : sl.type === 'dropdown' ? (
            <DropdownSlicer items={sl.items ?? []} />
          ) : (
            <div style={{ display: 'flex', flexDirection: isTop ? 'row' : 'column', flexWrap: 'wrap', gap: isTop ? 8 : 3 }}>
              {(sl.items ?? []).map((item, j) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--theme-fg, #252423)' }}>
                  <CheckBox checked={!!sl.sel?.includes(j)} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div style={{
      width: 12, height: 12, flexShrink: 0, borderRadius: 2, position: 'relative',
      border: checked ? '1.4px solid var(--theme-primary, #0D9488)' : '1.4px solid #BBBBBB',
      background: checked ? 'var(--theme-primary, #0D9488)' : 'transparent',
    }}>
      {checked && (
        <svg viewBox="0 0 10 10" width="10" height="10" style={{ position: 'absolute', top: -1, left: 0 }}>
          <polyline points="2,5 4,7.5 8,3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}

function SliderSlicer({ min, max }: { min: number; max: number }) {
  const pct = 35
  return (
    <div style={{ padding: '2px 0' }}>
      <div style={{ height: 4, background: 'rgba(0,0,0,.08)', borderRadius: 2, position: 'relative', margin: '4px 0' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--theme-primary, #0D9488)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 10, height: 10, borderRadius: '50%', background: 'var(--theme-primary, #0D9488)', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--theme-fg-muted)' }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

function DropdownSlicer({ items }: { items: string[] }) {
  return (
    <div style={{
      height: 22, border: '1px solid rgba(0,0,0,.12)', borderRadius: 4,
      padding: '0 6px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', fontSize: 11, color: 'var(--theme-fg)',
    }}>
      <span>{items[0] ?? '—'}</span>
      <span style={{ opacity: .5, fontSize: 9 }}>▾</span>
    </div>
  )
}
