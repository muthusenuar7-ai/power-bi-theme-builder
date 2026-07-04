import { NextResponse } from 'next/server'
import { buildCombinedPbit } from '@/lib/layout-builder/server/combinedPbitService'
import { normalizeCombinedPayload } from '@/lib/layout-builder/server/combinedPbitValidator'
import { InvalidBasePbitError } from '@/lib/layout-builder/server/pbitService'

// adm-zip + node:fs require the Node.js runtime (not Edge). Force dynamic so the
// PBIT is generated per-request, and allow up to 30s for large combined builds.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function timestampedFilename(): string {
  const now = new Date()
  const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}`
  return `datacense-layout-theme-icons-${stamp}.pbit`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const normalized = normalizeCombinedPayload(body)
    const result = buildCombinedPbit(normalized)

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${timestampedFilename()}"`,
        'Content-Length': String(result.buffer.length),
        'X-Layout-Page-Count': String(result.layoutPageCount),
        'X-Icon-Page-Count': String(result.iconPageCount),
        'X-Total-Page-Count': String(result.totalPageCount),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export the combined .pbit.'
    const status = error instanceof InvalidBasePbitError ? 500 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
