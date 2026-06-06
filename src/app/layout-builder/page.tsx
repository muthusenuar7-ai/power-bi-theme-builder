import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTopNav } from '@/components/layout/PageTopNav'

export const metadata: Metadata = {
  title: 'Layout Builder | Datacense Power BI Theme Studio',
  description: 'Design report layouts visually and download them directly for Power BI. Coming soon.',
}

/**
 * /layout-builder — placeholder destination for the landing page "Join the
 * Waitlist" CTAs. The feature is marketed as "Coming soon"; this page exists so
 * those links resolve instead of 404-ing, and so users can navigate back Home
 * or into the Theme Builder.
 */
export default function LayoutBuilderPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <PageTopNav title="Layout Builder" subtitle="Datacense" showIconsLink />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 640,
          margin: '0 auto',
          padding: '64px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-ui)',
            background: 'var(--accent-soft)',
            borderRadius: 999,
            padding: '5px 14px',
          }}
        >
          Coming soon
        </span>

        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          Power BI Layout Builder
        </h1>

        <p style={{ margin: 0, maxWidth: 520, fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)' }}>
          Design report layouts visually and download them directly for Power BI. We&apos;re putting the finishing
          touches on the drag-and-drop layout canvas, pre-built containers, and downloadable layouts.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          <Link
            href="/editor"
            style={{
              height: 42,
              padding: '0 22px',
              borderRadius: 10,
              background: 'var(--accent-ui)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            Open Theme Builder
          </Link>
          <Link
            href="/"
            style={{
              height: 42,
              padding: '0 22px',
              borderRadius: 10,
              border: '1px solid var(--border-strong)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 14,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
