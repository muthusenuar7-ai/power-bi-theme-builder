'use client'

import { useEffect, useRef, useState } from 'react'

interface Size {
  width:  number
  height: number
}

/**
 * useElementSize — measures a DOM element's rendered pixel dimensions.
 *
 * Attach the returned `ref` to a container element. `width` and `height`
 * are in CSS pixels (device-independent). The hook uses ResizeObserver so
 * it reacts automatically to flex/grid layout changes, window resizes, and
 * focus-mode transitions without any manual wiring.
 *
 * Fallback values (default 420 × 260) are returned until the first
 * ResizeObserver callback fires. Choosing a fallback close to the expected
 * card size minimises any first-frame layout shift.
 *
 * Usage:
 *   const { ref, width, height } = useElementSize()
 *   return (
 *     <div ref={ref} style={{ width: '100%', height: '100%' }}>
 *       <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">…</svg>
 *     </div>
 *   )
 */
export function useElementSize(
  fallback: Size = { width: 420, height: 260 },
) {
  const ref  = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size>(fallback)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const apply = (w: number, h: number) => {
      const rw = Math.round(w)
      const rh = Math.round(h)
      if (rw < 10 || rh < 10) return
      setSize((prev) => (prev.width === rw && prev.height === rh ? prev : { width: rw, height: rh }))
    }

    // Snapshot immediately — ResizeObserver fires asynchronously so we
    // grab the initial size now to avoid a blank/wrong first frame.
    const rect = el.getBoundingClientRect()
    apply(rect.width, rect.height)

    const ro = new ResizeObserver(([entry]) => {
      apply(entry.contentRect.width, entry.contentRect.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return { ref, width: size.width, height: size.height }
}
