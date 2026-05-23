'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionSectionProps {
  title: string
  icon?: ReactNode
  badge?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function AccordionSection({ title, icon, badge, defaultOpen = false, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`acc${open ? ' open' : ''}`}>
      <button type="button" className="acc-head" onClick={() => setOpen((current) => !current)}>
        <ChevronDown size={14} strokeWidth={2} className="acc-chevron" />
        {icon && <span style={{ display: 'inline-flex', color: 'var(--text-3)' }}>{icon}</span>}
        <span className="acc-label">{title}</span>
        {badge && <span className="acc-badge">{badge}</span>}
      </button>
      <div className="acc-body">
        <div className="acc-body-inner">{children}</div>
      </div>
    </div>
  )
}
