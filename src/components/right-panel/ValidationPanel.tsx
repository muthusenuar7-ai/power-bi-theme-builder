'use client'

import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { generateThemeJSON, validateThemeJSON } from '@/lib/themeGenerator'
import { useThemeStore } from '@/store/themeStore'

type StatusKind = 'valid' | 'warning' | 'invalid'

function colorFor(kind: StatusKind): string {
  if (kind === 'valid') return '#10B981'
  if (kind === 'warning') return '#F59E0B'
  return '#EF4444'
}

function StatusRow({ label, detail, kind }: { label: string; detail: string; kind: StatusKind }) {
  const color = colorFor(kind)
  const Icon = kind === 'valid' ? CheckCircle2 : kind === 'warning' ? AlertTriangle : XCircle

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <Icon size={14} strokeWidth={2.1} color={color} style={{ marginTop: 1, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{detail}</div>
      </div>
    </div>
  )
}

export function ValidationPanel() {
  const state = useThemeStore()
  const validation = useMemo(() => validateThemeJSON(generateThemeJSON(state)), [state])

  const hexErrors = validation.errors.filter((error) => error.toLowerCase().includes('color'))
  const structureErrors = validation.errors.filter((error) => !error.toLowerCase().includes('color'))

  return (
    <div style={{ margin: '0 14px 14px' }}>
      <div
        style={{
          padding: 12,
          borderRadius: 'var(--r-md)',
          background: 'var(--surface)',
          border: '1px solid var(--border-ui)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 11,
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--text-3)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}
          >
            Validation
          </div>
          <span
            style={{
              borderRadius: 999,
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 800,
              color: validation.isValid ? '#065F46' : '#991B1B',
              background: validation.isValid ? '#D1FAE5' : '#FEE2E2',
            }}
          >
            {validation.isValid ? 'Valid' : 'Invalid'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <StatusRow
            label="JSON Valid"
            detail="Generated JSON can be serialized and parsed."
            kind="valid"
          />
          <StatusRow
            label="Power BI Theme Structure"
            detail={structureErrors.length === 0 ? 'Required root fields, textClasses, and visualStyles are present.' : structureErrors[0]}
            kind={structureErrors.length === 0 ? 'valid' : 'invalid'}
          />
          <StatusRow
            label="Color HEX Status"
            detail={hexErrors.length === 0 ? 'Root colors and visualStyles color objects use valid #RRGGBB values.' : hexErrors[0]}
            kind={hexErrors.length === 0 ? 'valid' : 'invalid'}
          />

          {validation.warnings.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-ui)', paddingTop: 9 }}>
              {validation.warnings.slice(0, 3).map((warning) => (
                <div key={warning} style={{ fontSize: 10.5, color: '#92400E', lineHeight: 1.45 }}>
                  {warning}
                </div>
              ))}
            </div>
          )}

          {validation.errors.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-ui)', paddingTop: 9 }}>
              {validation.errors.slice(0, 4).map((error) => (
                <div key={error} style={{ fontSize: 10.5, color: '#991B1B', lineHeight: 1.45 }}>
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
