'use client'

interface SliderControlProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function SliderControl({ value, min = 0, max = 100, onChange, disabled = false }: SliderControlProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ minWidth: 0, flex: 1, accentColor: 'var(--accent-ui)', opacity: disabled ? 0.55 : 1 }}
      />
      <span
        style={{
          width: 30,
          textAlign: 'right',
          fontSize: 10,
          fontWeight: 800,
          color: 'var(--text-2)',
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
        }}
      >
        {value}
      </span>
    </div>
  )
}
