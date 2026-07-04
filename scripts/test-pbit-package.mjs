/**
 * Package-integrity tests for the faithful PBIT repackager (src/lib/pbitZip.ts).
 * Pure Node — no Power BI / PowerShell required. Verifies:
 *   - exact binary copy hash matches the source
 *   - unmodified round-trip is byte-identical and per-entry equal
 *   - Report/Layout original encoding (UTF-16LE, no BOM) and valid JSON
 *   - re-encode round-trips without replacement / null corruption
 *   - resource references in Layout resolve to real package entries
 *   - [Content_Types].xml is valid and covers every part
 *   - no duplicate package entries
 *   - the base template on disk is never modified
 * Run: node scripts/test-pbit-package.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import Module from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = Module.createRequire(import.meta.url)
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const base = path.join(rootDir, 'src', request.slice(2))
    for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`]) if (fs.existsSync(c)) return c
  }
  return originalResolve.call(this, request, parent, isMain, options)
}
require.extensions['.ts'] = function (module, filename) {
  const out = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  }).outputText
  module._compile(out, filename)
}

const { readRawZip, writeRawZip, replaceEntryDeflated, crc32 } = require('@/lib/pbitZip.ts')
const { decodeUtf16le, encodeUtf16le } = require('@/lib/zipReader.ts')
const { detectTextEncoding, decodePreservingEncoding, encodePreservingEncoding, hasReplacementChar } = require('@/lib/textEncoding.ts')

const MASHUP_MODEL_PARTS = ['DataModelSchema', 'DataMashup', 'Connections', 'DiagramLayout', 'QueryGroups', 'Settings', 'Metadata', 'Version']

const BASE = path.join(rootDir, 'public', 'templates', 'pbit', 'icon-library-base.pbit')
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex')
const toAB = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)

let failures = 0
function check(label, cond, detail = '') {
  if (cond) { console.log(`  ok   ${label}`) }
  else { failures++; console.log(`  FAIL ${label}${detail ? ' — ' + detail : ''}`) }
}

const baseBuf = fs.readFileSync(BASE)
const hashBefore = sha256(baseBuf)
const archive = readRawZip(toAB(baseBuf))

console.log('1. Exact binary copy')
const copy = Buffer.from(baseBuf)
check('byte copy SHA-256 matches source', sha256(copy) === hashBefore)

console.log('2. Unmodified round-trip')
const rt = Buffer.from(writeRawZip(archive))
check('round-trip is byte-identical to source', sha256(rt) === hashBefore)
const rtArchive = readRawZip(toAB(rt))
check('round-trip entry count equal', rtArchive.entries.length === archive.entries.length)
check('round-trip entry order preserved', rtArchive.entries.map((e) => e.name).join('|') === archive.entries.map((e) => e.name).join('|'))
const fieldsEqual = archive.entries.every((e, i) => {
  const r = rtArchive.entries[i]
  return e.method === r.method && e.crc === r.crc && e.compressedSize === r.compressedSize
    && e.uncompressedSize === r.uncompressedSize && e.versionMadeBy === r.versionMadeBy
    && e.versionNeeded === r.versionNeeded && e.flags === r.flags && e.localExtra.length === r.localExtra.length
})
check('round-trip per-entry metadata equal (method/crc/size/version/flags/extra)', fieldsEqual)
check('all DEFLATE entries preserved (no STORE downgrade)', rtArchive.entries.every((e) => e.method === 8))

console.log('3. Report/Layout encoding + JSON')
const layoutEntry = archive.entries.find((e) => e.name === 'Report/Layout')
const layoutBytes = layoutEntry.method === 8 ? new Uint8Array(zlib.inflateRawSync(Buffer.from(layoutEntry.data))) : layoutEntry.data
check('Layout has no BOM', !(layoutBytes[0] === 0xff && layoutBytes[1] === 0xfe) && !(layoutBytes[0] === 0xef))
check('Layout is UTF-16LE (NUL high bytes)', layoutBytes[1] === 0 && layoutBytes[3] === 0)
const layoutText = decodeUtf16le(layoutBytes)
let layoutJson = null
try { layoutJson = JSON.parse(layoutText); check('Layout parses as JSON', true) }
catch (e) { check('Layout parses as JSON', false, e.message) }
check('no replacement characters in decoded Layout', !layoutText.includes('�'))
const reEncoded = encodeUtf16le(layoutText)
check('re-encoded Layout byte-identical to original', Buffer.compare(Buffer.from(reEncoded), Buffer.from(layoutBytes)) === 0)
check('re-decoded Layout matches', decodeUtf16le(reEncoded) === layoutText)

console.log('4. Resource references resolve')
const names = new Set(archive.entries.map((e) => e.name))
const registered = layoutJson.resourcePackages
  .find((p) => p.resourcePackage.name === 'RegisteredResources')?.resourcePackage.items ?? []
const allResolve = registered.every((it) => names.has(`Report/StaticResources/RegisteredResources/${it.path}`))
check('every RegisteredResources item exists as a package entry', allResolve)

console.log('5. [Content_Types].xml validity')
const ctEntry = archive.entries.find((e) => e.name === '[Content_Types].xml')
const ctBytes = ctEntry.method === 8 ? zlib.inflateRawSync(Buffer.from(ctEntry.data)) : Buffer.from(ctEntry.data)
const ctText = ctBytes.toString('utf8')
check('Content_Types declares svg Default extension', ctText.includes('Extension="svg"'))
check('Content_Types declares json Default extension', ctText.includes('Extension="json"'))
const overrideParts = [...ctText.matchAll(/PartName="(\/[^"]+)"/g)].map((m) => m[1])
const overridesPresent = overrideParts.every((p) => names.has(p.replace(/^\//, '')))
check('every Content_Types Override points to a present part', overridesPresent, overrideParts.join(','))

console.log('6. No duplicate entries')
check('no duplicate entry names', names.size === archive.entries.length)

console.log('7. CRC integrity')
check('every entry CRC recomputes correctly', archive.entries.every((e) => {
  const data = e.method === 8 ? new Uint8Array(zlib.inflateRawSync(Buffer.from(e.data))) : e.data
  return crc32(data) === e.crc
}))

console.log('8. Resource replacement preserves package validity')
const svgName = 'Report/StaticResources/RegisteredResources/currency-dollar2196608282320912.svg'
const patched = { comment: archive.comment, entries: archive.entries.map((e) => ({ ...e })) }
const newSvg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#0D9488"/></svg>')
const idx = patched.entries.findIndex((e) => e.name === svgName)
const deflated = new Uint8Array(zlib.deflateRawSync(Buffer.from(newSvg), { level: 9 }))
patched.entries[idx] = replaceEntryDeflated(patched.entries[idx], newSvg, deflated)
const patchedBuf = Buffer.from(writeRawZip(patched))
const patchedArchive = readRawZip(toAB(patchedBuf))
const patchedEntry = patchedArchive.entries.find((e) => e.name === svgName)
const patchedInflated = new Uint8Array(zlib.inflateRawSync(Buffer.from(patchedEntry.data)))
check('replaced resource round-trips to exact new bytes', Buffer.compare(Buffer.from(patchedInflated), Buffer.from(newSvg)) === 0)
check('replaced resource CRC valid', crc32(patchedInflated) === patchedEntry.crc)
check('replaced resource keeps DEFLATE method', patchedEntry.method === 8)
check('untouched entries unchanged after patch', patchedArchive.entries.filter((e) => e.name !== svgName)
  .every((e) => { const o = archive.entries.find((x) => x.name === e.name); return o && o.crc === e.crc && o.method === e.method }))

console.log('9. Encoding helpers preserve Layout (detect/decode/encode)')
const detected = detectTextEncoding(layoutBytes)
check('detectTextEncoding => utf-16le, no BOM', detected.encoding === 'utf-16le' && detected.bom === false, JSON.stringify(detected))
const decoded = decodePreservingEncoding(layoutBytes, detected)
check('decodePreservingEncoding matches manual UTF-16LE decode', decoded === decodeUtf16le(layoutBytes))
check('no replacement char via helper', !hasReplacementChar(decoded))
const reSerializedHelper = JSON.stringify(JSON.parse(decoded))
const reEncodedHelper = encodePreservingEncoding(reSerializedHelper, detected)
check('encodePreservingEncoding has no BOM for no-BOM source', !(reEncodedHelper[0] === 0xff && reEncodedHelper[1] === 0xfe))
check('encode->decode round-trips losslessly', decodePreservingEncoding(reEncodedHelper, detected) === reSerializedHelper)
// Round-trip the ORIGINAL text (not re-serialized) must be byte-identical.
const exactReencode = encodePreservingEncoding(decoded, detected)
check('original Layout text re-encodes byte-identical', Buffer.compare(Buffer.from(exactReencode), Buffer.from(layoutBytes)) === 0)

console.log('10. Layout re-serialized variant keeps model/mashup byte-identical')
const layoutIdx = archive.entries.findIndex((e) => e.name === 'Report/Layout')
const reLayout = { comment: archive.comment, entries: archive.entries.map((e) => ({ ...e })) }
reLayout.entries[layoutIdx] = replaceEntryDeflated(reLayout.entries[layoutIdx], reEncodedHelper, new Uint8Array(zlib.deflateRawSync(Buffer.from(reEncodedHelper), { level: 9 })))
const reLayoutArchive = readRawZip(toAB(Buffer.from(writeRawZip(reLayout))))
function partSha(arc, name) {
  const e = arc.entries.find((x) => x.name === name)
  if (!e) return 'absent'
  const data = e.method === 8 ? new Uint8Array(zlib.inflateRawSync(Buffer.from(e.data))) : e.data
  return sha256(Buffer.from(data))
}
for (const part of MASHUP_MODEL_PARTS) {
  const before = partSha(archive, part)
  check(`${part} byte-identical after Layout re-serialize`, partSha(reLayoutArchive, part) === before, before === 'absent' ? '(absent in base)' : '')
}
// And after a resource replacement.
for (const part of MASHUP_MODEL_PARTS) {
  check(`${part} byte-identical after resource replacement`, partSha(patchedArchive, part) === partSha(archive, part))
}

console.log('11. Entry-set integrity after a patch (no missing/extra/duplicate)')
check('patched archive has same entry count', patchedArchive.entries.length === archive.entries.length)
check('patched archive entry order preserved', patchedArchive.entries.map((e) => e.name).join('|') === archive.entries.map((e) => e.name).join('|'))
check('patched archive has no duplicate paths', new Set(patchedArchive.entries.map((e) => e.name)).size === patchedArchive.entries.length)

console.log('12. Base template has no DataMashup (documents the MashupValidationError context)')
check('base has DataModelSchema (stub model)', names.has('DataModelSchema'))
check('base has NO DataMashup part', !names.has('DataMashup'))

console.log('13. Base template unchanged on disk')
check('base .pbit SHA-256 unchanged', sha256(fs.readFileSync(BASE)) === hashBefore)

console.log(`\n${failures === 0 ? 'All' : failures} PBIT package-integrity checks ${failures === 0 ? 'PASSED' : 'FAILED'}`)
if (failures > 0) process.exit(1)
