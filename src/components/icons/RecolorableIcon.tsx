'use client'

import type { CSSProperties } from 'react'

interface RecolorableIconProps {
  url:    string
  color:  string
  size?:  number
  title?: string
  style?: CSSProperties
}

export function RecolorableIcon({ url, color, size = 24, title, style }: RecolorableIconProps) {
  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      title={title}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        flexShrink: 0,
        backgroundColor: color,
        WebkitMask: `url("${url}") center / contain no-repeat`,
        mask: `url("${url}") center / contain no-repeat`,
        ...style,
      }}
    />
  )
}
