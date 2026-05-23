'use client'

interface ToggleControlProps {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function ToggleControl({ value, onChange, disabled = false }: ToggleControlProps) {
  return (
    <button
      type="button"
      aria-pressed={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      style={{
        width: 34,
        height: 18,
        border: 'none',
        borderRadius: 999,
        padding: 2,
        background: value ? 'var(--accent-ui)' : 'var(--border-strong)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        justifyContent: value ? 'flex-end' : 'flex-start',
        transition: 'all .15s ease',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,.22)' }} />
    </button>
  )
}
