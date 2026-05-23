'use client'

interface SegmentControlProps {
  value: string
  options: string[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function SegmentControl({ value, options, onChange, disabled = false }: SegmentControlProps) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border-ui)', borderRadius: 5, overflow: 'hidden' }}>
      {options.map((option) => {
        const active = value === option
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option)}
            style={{
              border: 'none',
              borderRight: option === options[options.length - 1] ? 'none' : '1px solid var(--border-ui)',
              background: active ? 'var(--accent-ui)' : 'var(--surface)',
              color: active ? 'white' : 'var(--text-2)',
              height: 25,
              padding: '0 7px',
              fontSize: 10,
              fontWeight: 800,
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: disabled ? 0.55 : 1,
            }}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
