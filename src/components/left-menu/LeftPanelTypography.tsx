'use client'

import { Typography } from '@/components/sidebar/Typography'

export function LeftPanelTypography() {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>
        Set the global font and text sizes for all report visuals.
      </p>
      <Typography />
    </div>
  )
}
