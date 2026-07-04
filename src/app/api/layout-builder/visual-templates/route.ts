import { NextResponse } from 'next/server'
import { getAvailableVisualTemplates } from '@/lib/layout-builder/server/pbitService'

// Scans the base visual-library PBIT (adm-zip + node:fs) so the picker knows
// which Power BI visual types can actually be cloned. Node runtime required.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  try {
    return NextResponse.json(getAvailableVisualTemplates())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to scan visual templates.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
