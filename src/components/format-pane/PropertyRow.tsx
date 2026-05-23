'use client'

import type { ReactNode } from 'react'
import { ColorControl } from './controls/ColorControl'
import { NumberControl } from './controls/NumberControl'
import { SegmentControl } from './controls/SegmentControl'
import { SelectControl } from './controls/SelectControl'
import { SliderControl } from './controls/SliderControl'
import { ToggleControl } from './controls/ToggleControl'
import { FORMAT_FONT_OPTIONS } from '@/lib/visualFormatSchema'
import type { FormatControlValue, VisualFormatControl } from '@/lib/visualFormatSchema'

interface PropertyRowProps {
  control: VisualFormatControl
  stateKey: string
  disabled?: boolean
  getValue: (key: string, fallback: FormatControlValue) => FormatControlValue
  setValue: (key: string, value: FormatControlValue) => void
}

function numberValue(value: FormatControlValue, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function stringValue(value: FormatControlValue, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function booleanValue(value: FormatControlValue, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function defaultValue(control: VisualFormatControl): FormatControlValue {
  if (control.defaultValue !== undefined) return control.defaultValue
  if (control.type === 'toggle') return false
  if (control.type === 'number' || control.type === 'slider') return 0
  return ''
}

function StyleButton({
  active,
  disabled,
  label,
  title,
  onClick,
  fontStyle,
}: {
  active: boolean
  disabled: boolean
  label: string
  title: string
  onClick: () => void
  fontStyle?: 'italic' | 'underline'
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      style={{
        width: 27,
        height: 25,
        border: '1px solid var(--border-ui)',
        borderRight: 'none',
        background: active ? 'var(--accent-ui)' : 'var(--surface)',
        color: active ? 'white' : 'var(--text-2)',
        fontSize: 10,
        fontWeight: 800,
        fontStyle: fontStyle === 'italic' ? 'italic' : 'normal',
        textDecoration: fontStyle === 'underline' ? 'underline' : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {label}
    </button>
  )
}

export function PropertyRow({ control, stateKey, disabled = false, getValue, setValue }: PropertyRowProps) {
  const isDisabled = disabled || Boolean(control.disabled)
  const fallback = defaultValue(control)
  const value = getValue(stateKey, fallback)
  const label = control.label

  if (control.type === 'note') {
    return (
      <div
        style={{
          padding: '8px 9px',
          border: '1px dashed var(--border-ui)',
          borderRadius: 5,
          background: 'var(--surface-2)',
          color: 'var(--text-3)',
          fontSize: 10.4,
          lineHeight: 1.45,
        }}
      >
        {control.note}
      </div>
    )
  }

  const renderFx = control.fx ? (
    <button
      type="button"
      disabled
      title="Conditional formatting placeholder"
      style={{
        width: 26,
        height: 25,
        border: '1px solid var(--border-ui)',
        borderRadius: 4,
        background: 'var(--surface-2)',
        color: 'var(--text-3)',
        fontSize: 10,
        fontWeight: 800,
        opacity: 0.72,
      }}
    >
      fx
    </button>
  ) : null

  let controlNode: ReactNode

  if (control.type === 'toggle') {
    controlNode = (
      <ToggleControl
        value={booleanValue(value, Boolean(fallback))}
        disabled={isDisabled}
        onChange={(next) => setValue(stateKey, next)}
      />
    )
  } else if (control.type === 'color' || control.type === 'colorFx') {
    controlNode = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ColorControl
          value={stringValue(value, String(fallback || '#000000'))}
          disabled={isDisabled}
          onChange={(next) => setValue(stateKey, next)}
        />
        {control.type === 'colorFx' && renderFx}
      </div>
    )
  } else if (control.type === 'slider') {
    controlNode = (
      <div style={{ width: 154 }}>
        <SliderControl
          value={numberValue(value, Number(fallback))}
          min={control.min}
          max={control.max}
          disabled={isDisabled}
          onChange={(next) => setValue(stateKey, next)}
        />
        {control.unit && (
          <div style={{ marginTop: 2, textAlign: 'right', fontSize: 9.5, color: 'var(--text-3)' }}>{control.unit}</div>
        )}
      </div>
    )
  } else if (control.type === 'select') {
    controlNode = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <SelectControl
          value={stringValue(value, String(fallback))}
          options={control.options ?? []}
          disabled={isDisabled}
          onChange={(next) => setValue(stateKey, next)}
        />
        {renderFx}
      </div>
    )
  } else if (control.type === 'number') {
    controlNode = (
      <NumberControl
        value={numberValue(value, Number(fallback))}
        min={control.min}
        max={control.max}
        disabled={isDisabled}
        onChange={(next) => setValue(stateKey, next)}
      />
    )
  } else if (control.type === 'text') {
    controlNode = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="text"
          value={stringValue(value, String(fallback))}
          disabled={isDisabled}
          onChange={(event) => setValue(stateKey, event.target.value)}
          placeholder={control.placeholder}
          spellCheck={false}
          style={{
            width: 132,
            height: 26,
            border: '1px solid var(--border-ui)',
            borderRadius: 5,
            background: 'var(--surface)',
            color: 'var(--text)',
            padding: '0 7px',
            fontSize: 10.5,
            fontFamily: 'inherit',
            opacity: isDisabled ? 0.58 : 1,
          }}
        />
        {renderFx}
      </div>
    )
  } else if (control.type === 'textarea') {
    controlNode = (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <textarea
          value={stringValue(value, String(fallback))}
          disabled={isDisabled}
          onChange={(event) => setValue(stateKey, event.target.value)}
          rows={3}
          spellCheck={false}
          style={{
            width: 155,
            minHeight: 58,
            resize: 'vertical',
            border: '1px solid var(--border-ui)',
            borderRadius: 5,
            background: 'var(--surface)',
            color: 'var(--text)',
            padding: '6px 7px',
            fontSize: 10.5,
            fontFamily: 'inherit',
            lineHeight: 1.35,
            opacity: isDisabled ? 0.58 : 1,
          }}
        />
        {renderFx}
      </div>
    )
  } else if (control.type === 'font') {
    const fontKey = control.fontKey ?? `${stateKey}.family`
    const sizeKey = control.sizeKey ?? `${stateKey}.size`
    controlNode = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <SelectControl
          value={stringValue(getValue(fontKey, control.defaultFont ?? 'Segoe UI'), control.defaultFont ?? 'Segoe UI')}
          options={FORMAT_FONT_OPTIONS}
          disabled={isDisabled}
          onChange={(next) => setValue(fontKey, next)}
        />
        <NumberControl
          value={numberValue(getValue(sizeKey, control.defaultSize ?? 9), control.defaultSize ?? 9)}
          min={6}
          max={64}
          disabled={isDisabled}
          onChange={(next) => setValue(sizeKey, next)}
        />
      </div>
    )
  } else if (control.type === 'fontStyle') {
    const boldKey = control.boldKey ?? `${stateKey}.bold`
    const italicKey = control.italicKey ?? `${stateKey}.italic`
    const underlineKey = control.underlineKey ?? `${stateKey}.underline`
    const bold = booleanValue(getValue(boldKey, control.defaultBold ?? false), control.defaultBold ?? false)
    const italic = booleanValue(getValue(italicKey, control.defaultItalic ?? false), control.defaultItalic ?? false)
    const underline = booleanValue(getValue(underlineKey, control.defaultUnderline ?? false), control.defaultUnderline ?? false)

    controlNode = (
      <div style={{ display: 'flex', borderRadius: 5, overflow: 'hidden' }}>
        <StyleButton active={bold} disabled={isDisabled} label="B" title="Bold" onClick={() => setValue(boldKey, !bold)} />
        <StyleButton active={italic} disabled={isDisabled} label="I" title="Italic" fontStyle="italic" onClick={() => setValue(italicKey, !italic)} />
        <StyleButton active={underline} disabled={isDisabled} label="U" title="Underline" fontStyle="underline" onClick={() => setValue(underlineKey, !underline)} />
      </div>
    )
  } else if (control.type === 'alignment') {
    controlNode = (
      <SegmentControl
        value={stringValue(value, String(fallback || 'Left'))}
        options={control.options ?? ['Left', 'Center', 'Right']}
        disabled={isDisabled}
        onChange={(next) => setValue(stateKey, next)}
      />
    )
  } else {
    const buttonLabel = control.buttonLabel ?? stringValue(value, String(fallback || 'Select'))
    controlNode = (
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => {
          if (!isDisabled) setValue(stateKey, buttonLabel)
        }}
        style={{
          width: 132,
          minHeight: 26,
          border: '1px solid var(--border-ui)',
          borderRadius: 5,
          background: 'var(--surface)',
          color: 'var(--text-2)',
          padding: '0 7px',
          fontSize: 10.5,
          fontFamily: 'inherit',
          textAlign: 'left',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.62 : 1,
        }}
      >
        {buttonLabel}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '7px 0' }}>
      <label
        style={{
          minWidth: 0,
          flex: 1,
          fontSize: 10.8,
          color: isDisabled ? 'var(--text-3)' : 'var(--text-2)',
          fontWeight: 650,
          lineHeight: 1.25,
        }}
      >
        {label}
        {control.warning && <span style={{ marginLeft: 4, color: '#A16207' }}>!</span>}
      </label>
      <div style={{ flexShrink: 0 }}>{controlNode}</div>
    </div>
  )
}
