# Datacense Theme Studio — Landing Page Module

Drop-in landing page for the existing **Next.js + React + TypeScript** app.
Fully data-driven, no standalone HTML, no iframe, no Power BI embed, no token logic.

## File map (place into your project)

| This file | Put it at |
|---|---|
| `types/landing.ts` | `src/types/landing.ts` |
| `content/landingContent.ts` | `src/content/landingContent.ts` |
| `components/Landing.module.css` | `src/components/landing/Landing.module.css` |
| `components/Glyph.tsx` | `src/components/landing/Glyph.tsx` |
| `components/LandingPage.tsx` | `src/components/landing/LandingPage.tsx` |
| `app-page.tsx` | `src/app/page.tsx` (App Router) **or** `pages/index.tsx` (Pages Router) |

> Adjust the `@/` import alias to match your `tsconfig.json` `paths`. If the CSS/Glyph
> imports move folders, fix the two relative imports inside `LandingPage.tsx`
> (`./Landing.module.css`, `./Glyph`).

## What is the "JSON"?

`content/landingContent.ts` is the structured content object (typed by `types/landing.ts`).
**All copy, links, products, comparison rows, theme presets, roadmap, and footer live there.**
Edit that file to change anything on the page — you should never need to touch the JSX.

If you specifically need a pure `.json` file instead of a `.ts` export, copy the object
literal (everything assigned to `landingContent`) into `landingContent.json` and replace the
import with `import landingContent from "@/content/landingContent.json"`. The `.ts` version is
recommended because it is type-checked.

## How it connects to your existing modules

- **Routes** — product/footer links use `/icons`, `/theme-builder`, `/layout-builder`,
  `/pricing`, etc. Change these in `landingContent.ts` to match your real routes.
- **Theme presets ↔ Zustand store** — `ThemePreset.palette` is an ordered hex array
  (dark → light) using the same shape your Theme Builder uses. Pass `onApplyPreset` from
  the page (see `app-page.tsx`) to call your store, e.g.
  `useThemeStore.getState().applyPreset(preset)`. The hero mockup live-updates to the
  selected preset, demonstrating the link visually.
- **Icons** — the marketing glyphs in `Glyph.tsx` are decorative UI only and use
  `currentColor`/CSS so they recolor via the `color` property — consistent with your
  `/public/icon-library` approach. They do **not** replace your real searchable icon
  components; the "Explore Icons" CTA should route to your existing Icons Library page.
- **Newsletter** — wire `onSubscribe(email)` to your API route.

## Styling

`Landing.module.css` is a CSS Module (locally scoped, zero global leakage). Brand tokens
are CSS variables at the top of `.page`. If you already expose global font tokens, the
module reads `--font-display` and `--font-body` with sensible fallbacks (Outfit / Plus
Jakarta Sans). Add those fonts via `next/font` or your existing font setup if you want an
exact match; otherwise system fallbacks apply.

## Future Layout Studio

Build it inside this same app as a new module/route (e.g. `/layout-builder`) that shares
the same theme state, presets (`landingContent.themePresets.presets`), icon library, export
system, and UI shell. The landing page already references it as "coming soon"; flip the
`status` from `"soon"` to `"live"` in `landingContent.ts` (products + comparison column)
when it ships.

## Notes for an AI coding agent (Codex)

- Single source of truth for content is `content/landingContent.ts`.
- No business logic lives in the components — they are pure render functions over the
  content object plus two optional callbacks.
- Do not introduce a standalone HTML file, iframe, or Power BI embedding to render this.
- Keep everything within the existing Next.js + React + TS app.
