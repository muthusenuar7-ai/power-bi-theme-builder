'use client'

interface SelectControlProps {
  value: string
  options: string[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function SelectControl({ value, options, onChange, disabled = false }: SelectControlProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: 116,
        height: 26,
        border: '1px solid var(--border-ui)',
        borderRadius: 5,
        background: 'var(--surface)',
        color: 'var(--text)',
        padding: '0 6px',
        fontSize: 10.5,
        fontFamily: 'inherit',
        opacity: disabled ? 0.58 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  )
}
