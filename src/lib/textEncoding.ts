/**
 * Encoding-preserving text helpers for Power BI package parts.
 *
 * Power BI stores Report/Layout (and DataModelSchema/Settings/Metadata) as
 * UTF-16LE WITHOUT a BOM, while [Content_Types].xml is UTF-8 WITH a BOM. A
 * naive `TextEncoder().encode()` always emits UTF-8 and would silently corrupt
 * the UTF-16LE parts. These helpers detect the original encoding and reproduce
 * it byte-for-byte on the way back out, so a decode -> edit -> encode pass
 * changes only the characters we intend to change.
 */

export type TextEncodingName = 'utf-8' | 'utf-16le' | 'utf-16be'

export interface TextEncodingInfo {
  encoding: TextEncodingName
  /** Whether a byte-order mark was present at the start of the original bytes. */
  bom: boolean
}

const BOM_UTF8 = [0xef, 0xbb, 0xbf]
const BOM_UTF16LE = [0xff, 0xfe]
const BOM_UTF16BE = [0xfe, 0xff]

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false
  for (let i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return false
  return true
}

/**
 * Detects the text encoding + BOM of a byte buffer. Uses BOMs when present,
 * otherwise a NUL-distribution heuristic (UTF-16LE text has NULs in the high
 * byte of ASCII code units; UTF-16BE in the low byte).
 */
export function detectTextEncoding(bytes: Uint8Array): TextEncodingInfo {
  if (startsWith(bytes, BOM_UTF8)) return { encoding: 'utf-8', bom: true }
  if (startsWith(bytes, BOM_UTF16LE)) return { encoding: 'utf-16le', bom: true }
  if (startsWith(bytes, BOM_UTF16BE)) return { encoding: 'utf-16be', bom: true }

  // No BOM — sample the first bytes for interleaved NULs.
  const sample = Math.min(bytes.length, 512)
  let evenNul = 0 // NUL at even index -> high byte of LE pairs is at odd index, so this counts BE
  let oddNul = 0  // NUL at odd index  -> UTF-16LE ASCII
  for (let i = 0; i + 1 < sample; i += 2) {
    if (bytes[i] === 0) evenNul++
    if (bytes[i + 1] === 0) oddNul++
  }
  const pairs = Math.max(1, Math.floor(sample / 2))
  if (oddNul / pairs > 0.3) return { encoding: 'utf-16le', bom: false }
  if (evenNul / pairs > 0.3) return { encoding: 'utf-16be', bom: false }
  return { encoding: 'utf-8', bom: false }
}

/** Decodes bytes to a string honouring the detected encoding (BOM stripped). */
export function decodePreservingEncoding(bytes: Uint8Array, info?: TextEncodingInfo): string {
  const enc = info ?? detectTextEncoding(bytes)
  let body = bytes
  if (enc.bom) {
    const skip = enc.encoding === 'utf-8' ? 3 : 2
    body = bytes.subarray(skip)
  }
  if (enc.encoding === 'utf-8') return new TextDecoder('utf-8').decode(body)

  // UTF-16: assemble code units manually so we never depend on TextEncoder.
  let out = ''
  if (enc.encoding === 'utf-16le') {
    for (let i = 0; i + 1 < body.length; i += 2) out += String.fromCharCode(body[i] | (body[i + 1] << 8))
  } else {
    for (let i = 0; i + 1 < body.length; i += 2) out += String.fromCharCode((body[i] << 8) | body[i + 1])
  }
  return out
}

/**
 * Encodes text back into the exact original encoding + BOM behaviour.
 * Critically does NOT use TextEncoder for UTF-16 (that only emits UTF-8).
 */
export function encodePreservingEncoding(text: string, info: TextEncodingInfo): Uint8Array {
  if (info.encoding === 'utf-8') {
    const body = new TextEncoder().encode(text)
    if (!info.bom) return body
    const out = new Uint8Array(body.length + 3)
    out.set(BOM_UTF8, 0)
    out.set(body, 3)
    return out
  }

  const bomLen = info.bom ? 2 : 0
  const out = new Uint8Array(bomLen + text.length * 2)
  if (info.bom) out.set(info.encoding === 'utf-16le' ? BOM_UTF16LE : BOM_UTF16BE, 0)
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    const pos = bomLen + i * 2
    if (info.encoding === 'utf-16le') { out[pos] = code & 0xff; out[pos + 1] = (code >> 8) & 0xff }
    else { out[pos] = (code >> 8) & 0xff; out[pos + 1] = code & 0xff }
  }
  return out
}

/** True if a decoded string contains the U+FFFD replacement character. */
export function hasReplacementChar(text: string): boolean {
  return text.includes('�')
}
