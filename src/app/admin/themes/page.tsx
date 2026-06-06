'use client'

import { useMemo, useState } from 'react'
import {
  dedupeThemePresets,
  getAllThemePresets,
  validateThemePresetImport,
  type ThemePresetImportResult,
} from '@/lib/themePresetRegistry'
import { getPaletteBySize } from '@/lib/paletteUtils'
import type { PresetTheme } from '@/types'

function PaletteStrip({ colors }: { colors: string[] }) {
  return (
    <div
      style={{
        display: 'flex',
        height: 18,
        borderRadius: 7,
        overflow: 'hidden',
        border: '1px solid rgba(15,23,42,.14)',
      }}
    >
      {getPaletteBySize(colors, 10).map((color, index) => (
        <span
          key={`${color}-${index}`}
          style={{
            flex: 1,
            minWidth: 0,
            background: color,
            borderRight: index === 9 ? 0 : '1px solid rgba(255,255,255,.32)',
          }}
        />
      ))}
    </div>
  )
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function AdminThemeImportPage() {
  const [result, setResult] = useState<ThemePresetImportResult | null>(null)
  const [managedPresets, setManagedPresets] = useState<PresetTheme[]>([])
  const [error, setError] = useState<string | null>(null)

  const mergedPresets = useMemo(
    () => dedupeThemePresets([...getAllThemePresets(), ...managedPresets]),
    [managedPresets],
  )

  const handleFile = async (file: File | null) => {
    setError(null)
    setResult(null)
    if (!file) return

    try {
      const parsed = JSON.parse(await file.text()) as unknown
      setResult(validateThemePresetImport(parsed))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to parse uploaded JSON.')
    }
  }

  const importIntoSession = () => {
    if (!result) return
    setManagedPresets(result.presets)
  }

  const exportMerged = () => {
    downloadJson('themePresets.generated.json', {
      version: 'generated-1.0',
      generatedAt: new Date().toISOString(),
      count: mergedPresets.length,
      categories: Array.from(new Set(mergedPresets.flatMap((preset) => preset.categories ?? [preset.category]))).sort(),
      presets: mergedPresets,
    })
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', padding: 28, fontFamily: 'Segoe UI, sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 800, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Admin Utility
          </p>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0 }}>Premium Theme Preset Import</h1>
          <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 14, maxWidth: 760 }}>
            Upload a premium palette JSON file, validate it, preview the first valid themes, then download a merged generated preset bundle. This page does not persist data on the server.
          </p>
        </div>

        <div style={{ border: '1px solid #D7DEE8', borderRadius: 10, background: '#FFFFFF', padding: 18, display: 'grid', gap: 14 }}>
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
            style={{ fontSize: 14 }}
          />
          {error && (
            <div style={{ border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: 10, fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        {result && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10 }}>
              {[
                ['Total', result.report.total],
                ['Valid', result.report.valid],
                ['Duplicate', result.report.duplicate],
                ['Invalid', result.report.invalid],
                ['Categories', result.report.categories.length],
                ['Palette Size', result.report.paletteSize ?? 'Mixed'],
              ].map(([label, value]) => (
                <div key={label} style={{ border: '1px solid #D7DEE8', borderRadius: 9, background: '#FFFFFF', padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{label}</div>
                  <div style={{ marginTop: 4, fontSize: 20, fontWeight: 850 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ border: '1px solid #D7DEE8', borderRadius: 10, background: '#FFFFFF', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16 }}>Valid Theme Preview</h2>
                  <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 12 }}>First 20 valid palettes after upload validation.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={importIntoSession}
                    disabled={!result.presets.length}
                    style={{
                      height: 34,
                      border: 0,
                      borderRadius: 7,
                      padding: '0 12px',
                      background: result.presets.length ? '#0D9488' : '#CBD5E1',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      cursor: result.presets.length ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Import / Merge
                  </button>
                  <button
                    type="button"
                    onClick={exportMerged}
                    style={{
                      height: 34,
                      border: '1px solid #CBD5E1',
                      borderRadius: 7,
                      padding: '0 12px',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Export Merged JSON
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                {result.presets.slice(0, 20).map((preset) => (
                  <div key={preset.id} style={{ border: '1px solid #E2E8F0', borderRadius: 9, padding: 10, display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.name}</strong>
                      <span style={{ fontSize: 10, color: '#64748B', flexShrink: 0 }}>{preset.category}</span>
                    </div>
                    <PaletteStrip colors={preset.dataColorsFull} />
                    <div style={{ display: 'flex', gap: 6, fontSize: 10.5, color: '#64748B' }}>
                      {[preset.harmony, preset.hue, preset.profile, preset.theme].filter(Boolean).join(' / ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.report.issues.length > 0 && (
              <div style={{ border: '1px solid #FCD34D', borderRadius: 10, background: '#FFFBEB', padding: 16 }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>Invalid Entries</h2>
                <div style={{ marginTop: 10, display: 'grid', gap: 8, maxHeight: 260, overflow: 'auto' }}>
                  {result.report.issues.slice(0, 50).map((issue) => (
                    <div key={`${issue.index}-${issue.id ?? 'unknown'}`} style={{ fontSize: 12, color: '#92400E' }}>
                      <strong>#{issue.index + 1} {issue.name ?? issue.id ?? 'Unnamed'}:</strong> {issue.errors.join(' ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
