export function sanitizeHex(raw: string): string {
  const h = raw.replace(/[^0-9a-fA-F]/g, '')
  if (h.length === 3) return '#' + h.split('').map((c) => c + c).join('')
  if (h.length === 6) return '#' + h
  return '#000000'
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = sanitizeHex(hex).slice(1)
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}

function linearize(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1)
  const l2 = getRelativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsWCAG_AA(fg: string, bg: string, large = false): boolean {
  const ratio = getContrastRatio(fg, bg)
  return large ? ratio >= 3 : ratio >= 4.5
}

export function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const factor = 1 - Math.min(1, Math.max(0, amount / 100))
  return rgbToHex(r * factor, g * factor, b * factor)
}

export function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const factor = Math.min(1, Math.max(0, amount / 100))
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor)
}

export function addAlpha(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex)
  const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
  return '#' + [r, g, b, a].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export function extractColorsFromImage(imageDataUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 64
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve([])
      ctx.drawImage(img, 0, 0, size, size)
      const data = ctx.getImageData(0, 0, size, size).data
      const buckets = new Map<string, number>()
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 32) * 32
        const g = Math.round(data[i + 1] / 32) * 32
        const b = Math.round(data[i + 2] / 32) * 32
        const key = rgbToHex(r, g, b)
        buckets.set(key, (buckets.get(key) ?? 0) + 1)
      }
      const sorted = [...buckets.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k)
        .filter((c) => {
          const [r, g, b] = hexToRgb(c)
          const lum = getRelativeLuminance(c)
          return lum > 0.02 && lum < 0.95 && !(r === g && g === b)
        })
      resolve(sorted.slice(0, 8))
    }
    img.onerror = () => resolve([])
    img.src = imageDataUrl
  })
}

export function calculateQualityScore(colors: string[], bg: string, fg: string): number {
  let score = 0

  // Contrast of fg on bg (max 30)
  const fgContrast = getContrastRatio(fg, bg)
  score += Math.min(30, (fgContrast / 21) * 30)

  // Data color distinctiveness (max 30)
  let distinctScore = 0
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const ratio = getContrastRatio(colors[i], colors[j])
      distinctScore += Math.min(1, (ratio - 1) / 4)
    }
  }
  const pairs = (colors.length * (colors.length - 1)) / 2
  score += pairs > 0 ? (distinctScore / pairs) * 30 : 0

  // Each data color on bg (max 25)
  let readableCount = 0
  for (const c of colors) {
    if (meetsWCAG_AA(c, bg)) readableCount++
  }
  score += (readableCount / colors.length) * 25

  // Color variety — hue spread (max 15)
  const hues = colors.map((c) => {
    const [r, g, b] = hexToRgb(c).map((v) => v / 255)
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    if (d === 0) return 0
    if (max === r) return (((g - b) / d) % 6) * 60
    if (max === g) return ((b - r) / d + 2) * 60
    return ((r - g) / d + 4) * 60
  }).map((h) => (h + 360) % 360).sort((a, b) => a - b)
  const spread = hues.length > 1 ? hues[hues.length - 1] - hues[0] : 0
  score += Math.min(15, (spread / 300) * 15)

  return Math.round(Math.min(100, score))
}
