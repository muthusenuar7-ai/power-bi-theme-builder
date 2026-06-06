import type { PaletteSize } from '@/types'

export const PALETTE_SIZES: readonly PaletteSize[] = [3, 5, 7, 10]

const DEFAULT_PALETTE = [
  '#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#10B981', '#F97316', '#EC4899', '#2563EB', '#64748B',
] as const

const HEX_3 = /^#?([0-9a-fA-F]{3})$/
const HEX_6 = /^#?([0-9a-fA-F]{6})$/

function isPaletteSize(value: number): value is PaletteSize {
  return value === 3 || value === 5 || value === 7 || value === 10
}

export function normalizePaletteSize(value: unknown, fallback: PaletteSize = 10): PaletteSize {
  if (typeof value === 'number' && isPaletteSize(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (isPaletteSize(parsed)) return parsed
  }
  return fallback
}

export function normalizeHexColor(color: unknown, fallback = '#000000'): string {
  if (typeof color !== 'string') return normalizeHexColor(fallback, '#000000')

  const raw = color.trim()
  const shortMatch = raw.match(HEX_3)
  if (shortMatch) {
    return `#${shortMatch[1].split('').map((char) => char + char).join('')}`.toUpperCase()
  }

  const longMatch = raw.match(HEX_6)
  if (longMatch) return `#${longMatch[1]}`.toUpperCase()

  return normalizeHexColor(fallback, '#000000')
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = normalizeHexColor(hex).slice(1)
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)))
  return `#${[clamp(r), clamp(g), clamp(b)].map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta === 0) return [0, 0, lightness]

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0
  if (max === rn) hue = ((gn - bn) / delta) % 6
  else if (max === gn) hue = (bn - rn) / delta + 2
  else hue = (rn - gn) / delta + 4

  return [((hue * 60) + 360) % 360, saturation, lightness]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const huePrime = h / 60
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1))
  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (huePrime >= 0 && huePrime < 1) [r1, g1, b1] = [chroma, x, 0]
  else if (huePrime < 2) [r1, g1, b1] = [x, chroma, 0]
  else if (huePrime < 3) [r1, g1, b1] = [0, chroma, x]
  else if (huePrime < 4) [r1, g1, b1] = [0, x, chroma]
  else if (huePrime < 5) [r1, g1, b1] = [x, 0, chroma]
  else [r1, g1, b1] = [chroma, 0, x]

  const m = l - chroma / 2
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255]
}

function deriveColor(source: string, index: number): string {
  const [r, g, b] = hexToRgb(source)
  const [h, s, l] = rgbToHsl(r, g, b)
  const rotations = [28, -34, 52, -58, 76, -82, 104]
  const round = Math.floor(index / Math.max(1, DEFAULT_PALETTE.length))
  const hue = (h + rotations[index % rotations.length] + round * 18 + 360) % 360
  const saturation = Math.max(0.28, Math.min(0.74, s * (s > 0.76 ? 0.78 : 1.04)))
  const lightnessShift = index % 2 === 0 ? 0.1 : -0.11
  const lightness = Math.max(0.25, Math.min(0.76, l + lightnessShift))
  const [nr, ng, nb] = hslToRgb(hue, saturation, lightness)
  return rgbToHex(nr, ng, nb)
}

export function extendPalette(colors: readonly string[], size: PaletteSize | number): string[] {
  const targetSize = normalizePaletteSize(size, 10)
  const base = colors.length > 0 ? colors : DEFAULT_PALETTE
  const result = base.map((color, index) => normalizeHexColor(color, DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]))

  let cursor = 0
  while (result.length < targetSize) {
    const source = result[cursor % result.length] ?? DEFAULT_PALETTE[cursor % DEFAULT_PALETTE.length]
    const next = deriveColor(source, cursor + result.length)
    result.push(next)
    cursor += 1
  }

  return result.slice(0, targetSize)
}

export function getPaletteBySize(colors: readonly string[], size: PaletteSize): string[] {
  return extendPalette(colors, size).slice(0, size)
}

export function cyclePalette(colors: readonly string[], index: number): string {
  const palette = colors.length > 0 ? colors.map((color, i) => normalizeHexColor(color, DEFAULT_PALETTE[i % DEFAULT_PALETTE.length])) : [...DEFAULT_PALETTE]
  return palette[Math.abs(index) % palette.length] ?? DEFAULT_PALETTE[0]
}

export function inferPaletteSizeFromDataColors(colors: readonly string[]): PaletteSize {
  const count = colors.length
  if (count <= 3) return 3
  if (count <= 5) return 5
  if (count <= 7) return 7
  return 10
}
