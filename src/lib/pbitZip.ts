/**
 * pbitZip — package-preserving ZIP/OPC reader & writer for Power BI templates.
 *
 * Power BI's .pbit is an OPC (Open Packaging Conventions) ZIP, written by
 * .NET's System.IO.Packaging. That writer emits DEFLATE entries, per-entry
 * version fields (madeBy 45 / needed 20), real DOS timestamps and a 0xA220
 * "growth hint" extra field in every local header. A naive STORE-only rebuild
 * that drops those details produces a structurally-valid ZIP that Power BI
 * nonetheless rejects as "corrupted or an unrecognized version".
 *
 * This module therefore reads every entry's RAW bytes and full metadata, and
 * rebuilds the archive preserving them verbatim — only relocating offsets.
 * Untouched entries are reproduced byte-for-byte (compression, CRC, flags,
 * timestamps, extra fields all intact); a replaced entry keeps its header
 * shape (method, version, timestamps, extra) while swapping in freshly
 * compressed content, new CRC and sizes. Compression itself is injected by the
 * caller (Node `zlib` in scripts, `CompressionStream` in the browser) so this
 * file stays dependency- and environment-free.
 */

export interface RawZipEntry {
  name: string
  versionMadeBy: number
  versionNeeded: number
  flags: number
  method: number
  dosTime: number
  dosDate: number
  crc: number
  compressedSize: number
  uncompressedSize: number
  internalAttrs: number
  externalAttrs: number
  localExtra: Uint8Array
  centralExtra: Uint8Array
  comment: Uint8Array
  /** Raw on-disk bytes for this entry (DEFLATE-compressed when method === 8). */
  data: Uint8Array
}

export interface RawZipArchive {
  entries: RawZipEntry[]
  /** EOCD archive comment, preserved verbatim. */
  comment: Uint8Array
}

const LOCAL_SIG = 0x04034b50
const CD_SIG = 0x02014b50
const EOCD_SIG = 0x06054b50

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function u16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff])
}
function u32(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])
}
function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of parts) { out.set(p, pos); pos += p.length }
  return out
}

/** Parse a ZIP/OPC archive into raw, fully-preserved entry records. */
export function readRawZip(buffer: ArrayBuffer): RawZipArchive {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  const r16 = (o: number) => view.getUint16(o, true)
  const r32 = (o: number) => view.getUint32(o, true)

  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (r32(i) === EOCD_SIG) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('Not a valid ZIP/PBIT file: EOCD not found.')

  const total = r16(eocd + 10)
  const cdOffset = r32(eocd + 16)
  const commentLen = r16(eocd + 20)
  const comment = bytes.slice(eocd + 22, eocd + 22 + commentLen)

  const entries: RawZipEntry[] = []
  let p = cdOffset
  for (let i = 0; i < total; i++) {
    if (r32(p) !== CD_SIG) throw new Error(`Corrupt central directory at entry ${i}.`)
    const versionMadeBy = r16(p + 4)
    const versionNeeded = r16(p + 6)
    const flags = r16(p + 8)
    const method = r16(p + 10)
    const dosTime = r16(p + 12)
    const dosDate = r16(p + 14)
    const crc = r32(p + 16)
    const compressedSize = r32(p + 20)
    const uncompressedSize = r32(p + 24)
    const nameLen = r16(p + 28)
    const centralExtraLen = r16(p + 30)
    const commentLen2 = r16(p + 32)
    const internalAttrs = r16(p + 36)
    const externalAttrs = r32(p + 38)
    const localHeaderOffset = r32(p + 42)
    const name = new TextDecoder('utf-8').decode(bytes.subarray(p + 46, p + 46 + nameLen))
    const centralExtra = bytes.slice(p + 46 + nameLen, p + 46 + nameLen + centralExtraLen)
    const comment2 = bytes.slice(p + 46 + nameLen + centralExtraLen, p + 46 + nameLen + centralExtraLen + commentLen2)

    if (r32(localHeaderOffset) !== LOCAL_SIG) throw new Error(`Corrupt local header for "${name}".`)
    const localNameLen = r16(localHeaderOffset + 26)
    const localExtraLen = r16(localHeaderOffset + 28)
    const localExtra = bytes.slice(localHeaderOffset + 30 + localNameLen, localHeaderOffset + 30 + localNameLen + localExtraLen)
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
    const data = bytes.slice(dataStart, dataStart + compressedSize)

    entries.push({
      name, versionMadeBy, versionNeeded, flags, method, dosTime, dosDate,
      crc, compressedSize, uncompressedSize, internalAttrs, externalAttrs,
      localExtra, centralExtra, comment: comment2, data,
    })
    p += 46 + nameLen + centralExtraLen + commentLen2
  }

  return { entries, comment }
}

/** Rebuild a ZIP/OPC archive from raw entries, preserving every field; only
 *  byte offsets are recomputed. Entry order is preserved exactly. */
export function writeRawZip(archive: RawZipArchive): Uint8Array {
  const nameEncoder = new TextEncoder()
  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  let offset = 0

  for (const e of archive.entries) {
    const nameBytes = nameEncoder.encode(e.name)
    const local = concat([
      u32(LOCAL_SIG), u16(e.versionNeeded), u16(e.flags), u16(e.method),
      u16(e.dosTime), u16(e.dosDate), u32(e.crc), u32(e.compressedSize), u32(e.uncompressedSize),
      u16(nameBytes.length), u16(e.localExtra.length), nameBytes, e.localExtra, e.data,
    ])
    const central = concat([
      u32(CD_SIG), u16(e.versionMadeBy), u16(e.versionNeeded), u16(e.flags), u16(e.method),
      u16(e.dosTime), u16(e.dosDate), u32(e.crc), u32(e.compressedSize), u32(e.uncompressedSize),
      u16(nameBytes.length), u16(e.centralExtra.length), u16(e.comment.length),
      u16(0), u16(e.internalAttrs), u32(e.externalAttrs), u32(offset),
      nameBytes, e.centralExtra, e.comment,
    ])
    localChunks.push(local)
    centralChunks.push(central)
    offset += local.length
  }

  const centralStart = offset
  const centralBytes = concat(centralChunks)
  const eocd = concat([
    u32(EOCD_SIG), u16(0), u16(0), u16(archive.entries.length), u16(archive.entries.length),
    u32(centralBytes.length), u32(centralStart), u16(archive.comment.length), archive.comment,
  ])

  return concat([...localChunks, centralBytes, eocd])
}

/**
 * Replace a single entry's content while preserving its header shape (method,
 * version, flags, timestamps, extra fields). The caller supplies the already
 * DEFLATE-raw-compressed bytes plus the original uncompressed bytes (for CRC).
 * Keeps method === 8 to match every other Power BI part.
 */
export function replaceEntryDeflated(
  entry: RawZipEntry,
  uncompressed: Uint8Array,
  deflated: Uint8Array,
): RawZipEntry {
  return {
    ...entry,
    method: 8,
    crc: crc32(uncompressed),
    compressedSize: deflated.length,
    uncompressedSize: uncompressed.length,
    data: deflated,
  }
}
