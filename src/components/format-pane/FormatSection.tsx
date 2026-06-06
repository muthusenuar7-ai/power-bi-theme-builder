'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PropertyRow } from './PropertyRow'
import { ToggleControl } from './controls/ToggleControl'
import { resolveEffectiveFormat } from '@/lib/effectiveFormatResolver'
import { useThemeStore } from '@/store/themeStore'
import type {
  FormatControlValue,
  FormatToggleRef,
  VisualFormatCard,
  VisualFormatControl,
  VisualFormatSchema,
  VisualFormatSection,
} from '@/lib/visualFormatSchema'

interface FormatSectionProps {
  schema: VisualFormatSchema
  section: VisualFormatSection
}

function formatBoolean(value: FormatControlValue | undefined, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function controlKey(schema: VisualFormatSchema, section: VisualFormatSection, card: VisualFormatCard, control: VisualFormatControl): string {
  return control.stateKey ?? `${schema.stateScope}.${section.id}.${card.id}.${control.id}`
}

function toggleKey(schema: VisualFormatSchema, section: VisualFormatSection, card: VisualFormatCard | null, toggle: FormatToggleRef): string {
  return toggle.stateKey ?? `${schema.stateScope}.${section.id}${card ? `.${card.id}` : ''}.show`
}

function collectControlDefaults(
  schema: VisualFormatSchema,
  section: VisualFormatSection,
  card: VisualFormatCard,
  control: VisualFormatControl,
): Array<[string, FormatControlValue]> {
  const baseKey = controlKey(schema, section, card, control)

  if (control.type === 'font') {
    return [
      [control.fontKey ?? `${baseKey}.family`, control.defaultFont ?? 'Segoe UI'],
      [control.sizeKey ?? `${baseKey}.size`, control.defaultSize ?? 9],
    ]
  }

  if (control.type === 'fontStyle') {
    return [
      [control.boldKey ?? `${baseKey}.bold`, control.defaultBold ?? false],
      [control.italicKey ?? `${baseKey}.italic`, control.defaultItalic ?? false],
      [control.underlineKey ?? `${baseKey}.underline`, control.defaultUnderline ?? false],
    ]
  }

  if (control.type === 'note') return []
  if (control.defaultValue === undefined) return []

  return [[baseKey, control.defaultValue]]
}

export function FormatSection({ schema, section }: FormatSectionProps) {
  const [open, setOpen] = useState(section.defaultOpen ?? false)
  const formatProps = useThemeStore((s) => s.formatProps)
  const setProp = useThemeStore((s) => s.setProp)
  const resetGeneralSection = useThemeStore((s) => s.resetGeneralSection)
  // Effective theme colours — shown in the General tab when the user has NOT
  // set an explicit override, so the panel reflects the inherited theme value
  // (e.g. the visual background follows the selected preset) instead of a flat
  // white/default swatch. These are read-only fallbacks; editing a control
  // still writes an explicit override via setProp.
  const themeVisualBackground = useThemeStore((s) => s.visualBackground)
  const themeCardBackground = useThemeStore((s) => s.cardBackground)
  const dataColors = useThemeStore((s) => s.dataColors)
  const paletteSize = useThemeStore((s) => s.paletteSize)
  const bg = useThemeStore((s) => s.bg)
  const customCanvasBackground = useThemeStore((s) => s.customCanvasBackground)
  const canvasBackgroundMode = useThemeStore((s) => s.canvasBackgroundMode)
  const themeBorderColor = useThemeStore((s) => s.borderColor)
  const themeTitleColor = useThemeStore((s) => s.titleColor)
  const themeLabelColor = useThemeStore((s) => s.labelColor)
  const visualBackgroundMode = useThemeStore((s) => s.visualBackgroundMode)
  const fg = useThemeStore((s) => s.fg)
  const primary = useThemeStore((s) => s.primary)
  const accent = useThemeStore((s) => s.accent)
  const good = useThemeStore((s) => s.good)
  const neutral = useThemeStore((s) => s.neutral)
  const bad = useThemeStore((s) => s.bad)
  const tableAccent = useThemeStore((s) => s.tableAccent)
  const gridlineColor = useThemeStore((s) => s.gridlineColor)
  const dividerColor = useThemeStore((s) => s.dividerColor)
  const highlight = useThemeStore((s) => s.highlight)
  const tooltipBackground = useThemeStore((s) => s.tooltipBackground)
  const tableHeaderBackground = useThemeStore((s) => s.tableHeaderBackground)
  const tableRowAlt = useThemeStore((s) => s.tableRowAlt)

  const effectiveVisual = resolveEffectiveFormat({
    dataColors,
    paletteSize,
    fg,
    bg,
    customCanvasBackground,
    visualBackground: themeVisualBackground,
    cardBackground: themeCardBackground,
    borderColor: themeBorderColor,
    titleColor: themeTitleColor,
    labelColor: themeLabelColor,
    tableAccent,
    gridlineColor,
    dividerColor,
    highlight,
    tooltipBackground,
    tableHeaderBackground,
    tableRowAlt,
    primary,
    accent,
    good,
    neutral,
    bad,
    canvasBackgroundMode,
    visualBackgroundMode,
    formatProps,
  })

  const effectiveThemeFallbacks: Record<string, FormatControlValue> =
    schema.stateScope === 'general'
      ? {
          'general.background.color': effectiveVisual.visualBackgroundColor,
          'general.title.background': effectiveVisual.titleBackgroundColor,
          'general.border.color': effectiveVisual.borderColor,
          'general.title.fontColor': effectiveVisual.titleColor,
          'general.subtitle.fontColor': effectiveVisual.subtitleColor,
          'general.title.subtitle.fontColor': effectiveVisual.subtitleColor,
          'general.label.fontColor': effectiveVisual.labelColor,
          'general.title.divider.color': effectiveVisual.dividerColor,
        }
      : {}

  const getValue = (key: string, fallback: FormatControlValue): FormatControlValue => {
    const inherited = effectiveThemeFallbacks[key] ?? fallback
    const stored = formatProps[key]

    if (key === 'general.background.color' && visualBackgroundMode === 'theme') return inherited
    if (key === 'general.title.background' && stored === '#FFFFFF') return inherited

    return stored ?? inherited
  }
  const setValue = (key: string, value: FormatControlValue) => setProp(key, value)

  const renderToggle = (toggle: FormatToggleRef, card: VisualFormatCard | null = null) => {
    const key = toggleKey(schema, section, card, toggle)
    const value = formatBoolean(formatProps[key], toggle.defaultValue)

    return (
      <ToggleControl
        value={value}
        disabled={section.disabled || card?.disabled || toggle.disabled}
        onChange={(next) => setProp(key, next)}
      />
    )
  }

  function resetSection() {
    if (schema.stateScope === 'general' && section.id === 'title') {
      resetGeneralSection('title')
      resetGeneralSection('subtitle')
      return
    }

    if (schema.stateScope === 'general' && section.id === 'effects') {
      resetGeneralSection('background')
      resetGeneralSection('border')
      resetGeneralSection('shadow')
      return
    }

    if (section.toggle) {
      setProp(toggleKey(schema, section, null, section.toggle), section.toggle.defaultValue)
    }

    section.cards?.forEach((formatCard) => {
      if (formatCard.toggle) {
        setProp(toggleKey(schema, section, formatCard, formatCard.toggle), formatCard.toggle.defaultValue)
      }

      formatCard.controls?.forEach((formatControl) => {
        collectControlDefaults(schema, section, formatCard, formatControl).forEach(([key, value]) => setProp(key, value))
      })
    })
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border-ui)' }}>
      {/* Section header — flex row; expand-button and toggle are siblings, never nested */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 36,
          background: 'var(--surface)',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          style={{
            flex: 1,
            minHeight: 36,
            border: 'none',
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '0 14px',
            paddingRight: section.toggle ? 4 : 14,
            color: section.disabled ? 'var(--text-3)' : 'var(--text-2)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <ChevronDown
            size={13}
            strokeWidth={2}
            style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .15s ease', color: 'var(--text-3)', flexShrink: 0 }}
          />
          <span style={{ flex: 1, textAlign: 'left', fontSize: 11, fontWeight: 800 }}>
            {section.title}
            {section.warning && <span style={{ marginLeft: 5, color: '#A16207' }}>!</span>}
          </span>
        </button>
        {section.toggle && (
          <span style={{ paddingRight: 14, display: 'flex', alignItems: 'center' }}>
            {renderToggle(section.toggle)}
          </span>
        )}
      </div>

      {open && (
        <div style={{ padding: '4px 10px 10px' }}>
          {section.note && (
            <div style={{ padding: '8px 9px', fontSize: 10.4, lineHeight: 1.45, color: 'var(--text-3)' }}>{section.note}</div>
          )}

          {section.cards?.map((formatCard) => (
            <div
              key={formatCard.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-ui)',
                borderRadius: 6,
                boxShadow: '0 1px 4px rgba(15,23,42,.06)',
                padding: '9px 10px 10px',
                marginBottom: 9,
                opacity: section.disabled || formatCard.disabled ? 0.72 : 1,
              }}
            >
              {(formatCard.title || formatCard.toggle || formatCard.warning) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: formatCard.controls?.length ? 6 : 0 }}>
                  {formatCard.title && (
                    <div style={{ flex: 1, fontSize: 11.2, fontWeight: 800, color: formatCard.disabled ? 'var(--text-3)' : 'var(--text-2)' }}>
                      {formatCard.title}
                      {formatCard.warning && <span style={{ marginLeft: 5, color: '#A16207' }}>!</span>}
                    </div>
                  )}
                  {!formatCard.title && <div style={{ flex: 1 }} />}
                  {formatCard.toggle && renderToggle(formatCard.toggle, formatCard)}
                </div>
              )}

              {formatCard.note && (
                <div style={{ marginBottom: 6, fontSize: 10.4, color: 'var(--text-3)', lineHeight: 1.45 }}>{formatCard.note}</div>
              )}

              {schema.stateScope === 'general' && formatCard.id === 'background' && (
                <div style={{ marginBottom: 6, fontSize: 9.8, fontWeight: 750, color: 'var(--text-3)', letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  Source: {effectiveVisual.source.visualBackground === 'custom' ? 'Custom' : 'Theme'}
                </div>
              )}

              {formatCard.controls?.map((formatControl) => (
                <PropertyRow
                  key={formatControl.id}
                  control={formatControl}
                  stateKey={controlKey(schema, section, formatCard, formatControl)}
                  disabled={section.disabled || formatCard.disabled}
                  getValue={getValue}
                  setValue={setValue}
                />
              ))}
            </div>
          ))}

          {section.showReset && (
            <button
              type="button"
              onClick={resetSection}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-3)',
                fontSize: 10,
                fontWeight: 750,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '3px 2px',
              }}
            >
              Reset to default
            </button>
          )}
        </div>
      )}
    </div>
  )
}
