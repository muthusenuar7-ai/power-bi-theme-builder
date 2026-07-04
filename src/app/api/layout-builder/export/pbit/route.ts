import { NextResponse } from 'next/server'
import {
  buildLayoutPbit,
  buildMultiPagePbit,
  InvalidBasePbitError,
} from '@/lib/layout-builder/server/pbitService'
import {
  isMultiPagePayload,
  normalizeLayoutPayload,
  normalizeMultiPagePayload,
} from '@/lib/layout-builder/server/layoutValidator'

// adm-zip + node:fs require the Node.js runtime (not Edge). Force dynamic so the
// PBIT is generated per-request, and allow up to 30s for large multi-page builds.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const pbit: Buffer = isMultiPagePayload(body)
      ? buildMultiPagePbit(normalizeMultiPagePayload(body))
      : buildLayoutPbit(normalizeLayoutPayload(body))

    return new NextResponse(new Uint8Array(pbit), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="Layout.pbit"',
        'Content-Length': String(pbit.length),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export Layout.pbit.'
    const status = error instanceof InvalidBasePbitError ? 500 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
