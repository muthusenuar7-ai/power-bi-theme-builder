'use client'

interface NumberControlProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function NumberControl({ value, min, max, onChange, disabled = false }: NumberControlProps) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      style={{
        width: 68,
        height: 26,
        border: '1px solid var(--border-ui)',
        borderRadius: 5,
        background: 'var(--surface)',
        color: 'var(--text)',
        padding: '0 6px',
        fontSize: 10.5,
        fontFamily: 'var(--font-jetbrains-mono, monospace)',
        opacity: disabled ? 0.58 : 1,
      }}
    />
  )
}
