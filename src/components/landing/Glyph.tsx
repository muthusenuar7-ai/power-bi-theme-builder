// components/landing/Glyph.tsx
// Small inline-SVG glyph set used by the landing page.
// All paths use `currentColor` so color is controlled via CSS `color`,
// matching your icon-library recoloring approach (currentColor / CSS mask).
//
// NOTE: These are decorative UI glyphs for the marketing page only.
// Your real searchable icons live in /public/icon-library and are rendered
// by your existing Icon components — this file does not replace those.

import React from "react";

type GlyphProps = React.SVGProps<SVGSVGElement> & { size?: number };

function base(size = 24, props: GlyphProps) {
  return {
    width: props.size ?? size,
    height: props.size ?? size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const CheckGlyph = (p: GlyphProps) => (
  <svg {...base(16, { ...p, strokeWidth: 2.5 })}><path d="M20 6 9 17l-5-5" /></svg>
);

export const IconsGlyph = (p: GlyphProps) => (
  <svg {...base(26, p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <circle cx="17.5" cy="17.5" r="3.5" />
  </svg>
);

export const ThemeGlyph = (p: GlyphProps) => (
  <svg {...base(26, p)}>
    <circle cx="13.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="10.5" r="2.5" />
    <circle cx="8.5" cy="7.5" r="2.5" />
    <circle cx="6.5" cy="12.5" r="2.5" />
    <path d="M12 22a9 9 0 0 1 0-18" />
  </svg>
);

export const LayoutGlyph = (p: GlyphProps) => (
  <svg {...base(26, p)}>
    <rect x="3" y="3" width="18" height="14" rx="2" />
    <path d="M3 9h18M9 17v4M15 17v4M7 21h10" />
  </svg>
);

export const LogoGlyph = (p: GlyphProps) => (
  <svg {...base(18, { ...p, strokeWidth: 2.2 })}><path d="M4 6h16M4 12h10M4 18h7" /></svg>
);

export const productGlyph: Record<string, (p: GlyphProps) => React.JSX.Element> = {
  icons: IconsGlyph,
  theme: ThemeGlyph,
  layout: LayoutGlyph,
};

// Social glyphs (filled)
export const LinkedInGlyph = (p: GlyphProps) => (
  <svg width={p.size ?? 17} height={p.size ?? 17} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 17V9.74H6.06V17h2.28zM7.2 8.73a1.32 1.32 0 1 0 0-2.64 1.32 1.32 0 0 0 0 2.64zM18 17v-3.98c0-2.13-1.14-3.12-2.66-3.12-1.23 0-1.78.67-2.08 1.15v-.99h-2.28V17h2.28v-4.05c0-.21.02-.43.08-.58.17-.43.56-.87 1.21-.87.85 0 1.19.65 1.19 1.6V17H18z" />
  </svg>
);
export const YouTubeGlyph = (p: GlyphProps) => (
  <svg width={p.size ?? 17} height={p.size ?? 17} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M19.6 3H4.4C3.6 3 3 3.6 3 4.4v15.2c0 .8.6 1.4 1.4 1.4h15.2c.8 0 1.4-.6 1.4-1.4V4.4c0-.8-.6-1.4-1.4-1.4zM10 16.5v-9l6 4.5-6 4.5z" />
  </svg>
);
