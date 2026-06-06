'use client'

import Link from 'next/link'
import { Home, Wand2, Shapes } from 'lucide-react'

interface PageTopNavProps {
  title: string
  subtitle?: string
  /** Extra link shown on the right (e.g. Icon Library), beside Home + Theme Builder. */
  showIconsLink?: boolean
}

/**
 * PageTopNav — the dark navy top bar reused by the standalone feature pages
 * (`/icons`, `/layout-builder`). The brand mark and an explicit "Home" button
 * both navigate back to `/`, satisfying the Home/Back navigation requirement.
 * Sticky so it stays visible while the page scrolls.
 */
export function PageTopNav({ title, subtitle, showIconsLink }: PageTopNavProps) {
  return (
    <header className="top-nav" style={{ position: 'sticky', top: 0 }}>
      {/* Brand mark — links back to the landing page */}
      <Link href="/" className="nav-brand" title="Back to home" style={{ textDecoration: 'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/datacense-logo.jpg"
          alt="Datacense"
          style={{ height: 28, width: 'auto', borderRadius: 4, objectFit: 'contain', flexShrink: 0 }}
        />
        <div>
          <div className="nav-title">{title}</div>
          <div className="nav-sub">{subtitle ?? 'Datacense'}</div>
        </div>
      </Link>

      <div className="nav-divider" />
      <div style={{ flex: 1 }} />

      <div className="nav-actions">
        <Link className="nav-btn" href="/" title="Back to home">
          <Home size={13} strokeWidth={2} />
          Home
        </Link>
        {showIconsLink && (
          <Link className="nav-btn" href="/icons" title="Open Icon Library">
            <Shapes size={13} strokeWidth={2} />
            Icon Library
          </Link>
        )}
        <Link className="nav-btn" href="/editor" title="Open Theme Builder">
          <Wand2 size={13} strokeWidth={2} />
          Theme Builder
        </Link>
      </div>
    </header>
  )
}
