'use client'

import type { ReactNode } from 'react'
import type { DashboardTheme } from '@/lib/dashboardThemeResolver'

interface Props {
  theme: DashboardTheme
  title: string
  subtitle?: string
  tag?: string
  children: ReactNode
}

/**
 * ThemeVisualCard — the shell every preview visual sits in.
 *
 * The card paints the resolved `visualBackground` (Power BI "visual background"),
 * so it reads as a layered surface on the themed report canvas. On light themes
 * this is a bright/white card on a faint-grey page; on dark themes it is a
 * slightly-lighter-than-canvas dark surface — both derived for readability by
 * the resolver. Border, title and label colours also come from the resolved
 * DashboardTheme (inline styles → deterministic). The body fills the remaining
 * height so charts can size to the card.
 */
export function ThemeVisualCard({ theme, title, subtitle, tag, children }: Props) {
  const titleOverflow = theme.titleWrap
    ? { whiteSpace: 'normal' as const, overflowWrap: 'anywhere' as const }
    : { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const }
  const subtitleOverflow = theme.subtitleWrap
    ? { whiteSpace: 'normal' as const, overflowWrap: 'anywhere' as const }
    : { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const }
  const bodyPadding = `${theme.titleAreaSpacing}px ${theme.titlePaddingRight}px ${theme.titlePaddingBottom}px ${theme.titlePaddingLeft}px`

  return (
    <div
      style={{
        // Theme-driven visual background (not hardcoded white, not transparent).
        background: theme.visualBackground,
        border: theme.borderEnabled ? `${theme.borderWidth}px solid ${theme.borderColor}` : '1px solid transparent',
        borderRadius: theme.borderRadius,
        boxShadow: theme.shadow,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {theme.titleEnabled && (
        <div
          style={{
            background: theme.titleBackground,
            padding: `${theme.titlePaddingTop}px ${theme.titlePaddingRight}px ${theme.titlePaddingBottom}px ${theme.titlePaddingLeft}px`,
            minHeight: theme.titleHeaderHeight || undefined,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: theme.titleFontSize,
                  fontWeight: theme.titleFontWeight,
                  fontStyle: theme.titleFontStyle,
                  textDecoration: theme.titleTextDecoration,
                  color: theme.titleColor,
                  letterSpacing: 0,
                  lineHeight: 1.18,
                  textAlign: theme.titleAlignment,
                  ...titleOverflow,
                }}
              >
                {title}
              </div>
              {theme.subtitleEnabled && subtitle && (
                <div
                  style={{
                    fontSize: theme.subtitleFontSize,
                    fontWeight: theme.subtitleFontWeight,
                    fontStyle: theme.subtitleFontStyle,
                    textDecoration: theme.subtitleTextDecoration,
                    color: theme.subtitleColor,
                    marginTop: theme.titleSubtitleGap,
                    lineHeight: 1.22,
                    textAlign: theme.subtitleAlignment,
                    ...subtitleOverflow,
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
            {tag && (
              <span
                style={{
                  fontSize: Math.max(9, theme.headerFontSize - 1),
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                  flexShrink: 0,
                  color: theme.primary,
                  background: theme.chipBackground,
                }}
              >
                {tag}
              </span>
            )}
          </div>
          {theme.dividerEnabled && theme.dividerWidth > 0 && (
            <div
              aria-hidden="true"
              style={{
                marginTop: theme.subtitleDividerGap,
                borderTop: `${theme.dividerWidth}px ${theme.dividerStyle} ${theme.dividerColor}`,
              }}
            />
          )}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, padding: theme.titleEnabled ? bodyPadding : `${theme.titlePaddingTop}px ${theme.titlePaddingRight}px ${theme.titlePaddingBottom}px ${theme.titlePaddingLeft}px` }}>{children}</div>
    </div>
  )
}
