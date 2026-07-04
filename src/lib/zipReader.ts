/**
 * zipReader — minimal ZIP/OPC reader, the read-side counterpart to zipWriter.
 * Used to open the base Power BI template (.pbit) so its parts (Report/Layout,
 * theme resources, etc.) can be read and selectively replaced before
 * re-packaging. Parses the Central Directory (authoritative entry sizes/
 * offsets, robust to streamed "data descriptor" local headers) and decompresses
 * DEFLATE entries with the platform's DecompressionStream — no external
 * zip/inflate library is added to the project.
 */

export interface ZipReadEntry {
  name: string
  data: Uint8Array
}

function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, true)
}
function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, true)
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new DecompressionStream('deflate-raw')
  const writer = stream.writable.getWriter()
  void writer.write(data as unknown as BufferSource)
  void writer.close()
  const out = await new Response(stream.readable).arrayBuffer()
  return new Uint8Array(out)
}

/** Reads every part of a ZIP/OPC archive into name -> decompressed bytes. */
export async function readZipEntries(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)

  // Locate the End Of Central Directory record (PK\x05\x06), scanning back
  // from the end (it may be preceded by a short, usually empty, comment).
  const EOCD_SIG = 0x06054b50
  let eocdOffset = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (readU32(view, i) === EOCD_SIG) { eocdOffset = i; break }
  }
  if (eocdOffset < 0) throw new Error('Not a valid ZIP/PBIT file: End Of Central Directory record not found.')

  const totalEntries = readU16(view, eocdOffset + 10)
  const centralDirOffset = readU32(view, eocdOffset + 16)

  const entries: ZipReadEntry[] = []
  let cdPos = centralDirOffset
  const CD_SIG = 0x02014b50
  const LOCAL_SIG = 0x04034b50

  for (let i = 0; i < totalEntries; i++) {
    if (readU32(view, cdPos) !== CD_SIG) throw new Error(`Corrupt ZIP central directory at entry ${i}.`)
    const method = readU16(view, cdPos + 10)
    const compressedSize = readU32(view, cdPos + 20)
    const nameLen = readU16(view, cdPos + 28)
    const extraLen = readU16(view, cdPos + 30)
    const commentLen = readU16(view, cdPos + 32)
    const localHeaderOffset = readU32(view, cdPos + 42)
    const name = new TextDecoder('utf-8').decode(bytes.subarray(cdPos + 46, cdPos + 46 + nameLen))

    if (readU32(view, localHeaderOffset) !== LOCAL_SIG) throw new Error(`Corrupt ZIP local header for "${name}".`)
    const localNameLen = readU16(view, localHeaderOffset + 26)
    const localExtraLen = readU16(view, localHeaderOffset + 28)
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
    const compressed = bytes.slice(dataStart, dataStart + compressedSize)

    entries.push({ name, data: method === 8 ? await inflateRaw(compressed) : compressed })
    cdPos += 46 + nameLen + extraLen + commentLen
  }

  return new Map(entries.map((e) => [e.name, e.data]))
}

/** UTF-16LE (no BOM) is how Power BI stores Report/Layout text content. */
export function decodeUtf16le(bytes: Uint8Array): string {
  const codeUnits = new Uint16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
  let out = ''
  for (let i = 0; i < codeUnits.length; i++) out += String.fromCharCode(codeUnits[i])
  return out
}

export function encodeUtf16le(text: string): Uint8Array {
  const codeUnits = new Uint16Array(text.length)
  for (let i = 0; i < text.length; i++) codeUnits[i] = text.charCodeAt(i)
  return new Uint8Array(codeUnits.buffer)
}
