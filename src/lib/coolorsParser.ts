import { sanitizeHex } from './colorUtils'

export function parseCoolorsUrl(url: string): string[] {
  try {
    const match = url.match(/coolors\.co\/([0-9a-fA-F-]+)/)
    if (!match) return []
    return match[1]
      .split('-')
      .filter((s) => /^[0-9a-fA-F]{6}$/.test(s))
      .map((s) => '#' + s.toLowerCase())
      .slice(0, 10)
  } catch {
    return []
  }
}

export function parseCoolorsFile(text: string): string[] {
  const hexPattern = /#?([0-9a-fA-F]{6})\b/g
  const found: string[] = []
  let m: RegExpExecArray | null
  while ((m = hexPattern.exec(text)) !== null) {
    const hex = sanitizeHex(m[1])
    if (!found.includes(hex)) found.push(hex)
    if (found.length >= 10) break
  }
  return found
}
