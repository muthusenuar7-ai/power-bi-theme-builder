'use client'

import { useThemeStore } from '@/store/themeStore'

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: '10px 12px', borderBottom: '1px solid var(--border-ui)',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-ui)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px', fontSize: 10, fontWeight: 700,
        color: 'var(--text-3)', letterSpacing: '.06em', textTransform: 'uppercase',
        background: 'var(--surface-2)', borderBottom: '1px solid var(--border-ui)',
      }}>
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function LeftPanelSettings() {
  const themeName    = useThemeStore((s) => s.themeName)
  const setThemeName = useThemeStore((s) => s.setThemeName)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <SettingsSection title="Theme">
        <SettingsRow label="Theme name">
          <input
            type="text"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            onBlur={() => { if (!themeName.trim()) setThemeName('My PBI Theme') }}
            spellCheck={false}
            placeholder="My PBI Theme"
            style={{
              height: 30, border: '1px solid var(--border-ui)', borderRadius: 6,
              padding: '0 8px', fontSize: 12, color: 'var(--text)',
              background: 'var(--surface)', fontFamily: 'inherit', outline: 'none',
            }}
          />
          <span style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.4 }}>
            This name is embedded in the exported JSON and shown in Power BI.
          </span>
        </SettingsRow>
      </SettingsSection>


    </div>
  )
}
