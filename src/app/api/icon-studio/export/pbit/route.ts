import { NextResponse } from 'next/server'
import {
  buildIconLibraryPbit,
  InvalidIconBasePbitError,
  MissingIconBaseTemplateError,
} from '@/lib/icon-studio/server/iconPbitService'
import { normalizeIconExportPayload } from '@/lib/icon-studio/server/iconPbitValidator'

// adm-zip + node:fs require the Node.js runtime (not Edge). Force dynamic so the
// PBIT is generated per-request.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function timestampedFilename(): string {
  const now = new Date()
  const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}`
  return `datacense-icon-library-${stamp}.pbit`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const icons = normalizeIconExportPayload(body)
    const pbit: Buffer = buildIconLibraryPbit(icons)

    return new NextResponse(new Uint8Array(pbit), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${timestampedFilename()}"`,
        'Content-Length': String(pbit.length),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export the Power BI icon library template.'
    const status = error instanceof InvalidIconBasePbitError || error instanceof MissingIconBaseTemplateError ? 500 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
