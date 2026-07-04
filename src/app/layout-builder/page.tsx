import type { Metadata } from 'next'
import LayoutBuilderClient from '@/components/layout-builder/LayoutBuilderClient'
import '@/components/layout-builder/layout-builder.css'

export const metadata: Metadata = {
  title: 'Layout Builder | Datacense Power BI Theme Studio',
  description:
    'Design Power BI report layouts visually — multi-page canvases, dynamic arrangements, split/merge zones, visual assignment, and direct Layout.pbit export.',
}

/**
 * /layout-builder — the complete Power BI Layout Builder, migrated from the
 * standalone DC_Power_BI_Layout app. The interactive builder is a client
 * component (LayoutBuilderApp); its styles are the source project's stylesheet,
 * scoped to this route by Next's per-route CSS code-splitting.
 */
export default function LayoutBuilderPage() {
  return <LayoutBuilderClient />
}
