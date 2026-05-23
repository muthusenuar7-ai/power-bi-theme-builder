'use client'

import { useThemeStore } from '@/store/themeStore'
import type { SkillLevel } from '@/types'

const LEVELS: SkillLevel[] = ['basic', 'intermediate', 'advanced']

export function SkillToggle() {
  const skillLevel = useThemeStore((s) => s.skillLevel)
  const setSkillLevel = useThemeStore((s) => s.setSkillLevel)

  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-ui)' }}>
      <div className="skill-toggle">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={`skill-btn${skillLevel === level ? ' active' : ''}`}
            onClick={() => setSkillLevel(level)}
          >
            {level[0].toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}
