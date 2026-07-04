'use client'

import dynamic from 'next/dynamic'

/**
 * The migrated Layout Builder reads localStorage and the DOM during initial
 * render (theme persistence, keyboard shortcuts), so it must run client-only.
 * Loading it with ssr:false skips server prerendering entirely — avoiding the
 * "localStorage is not defined" build error and any hydration mismatch — while
 * keeping the source component's behavior untouched.
 */
const LayoutBuilderApp = dynamic(() => import('./LayoutBuilderApp'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        color: '#64748b',
        fontSize: 14,
      }}
    >
      Loading Layout Builder…
    </div>
  ),
})

export default function LayoutBuilderClient() {
  return <LayoutBuilderApp />
}
