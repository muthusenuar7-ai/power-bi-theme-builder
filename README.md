# Datacense Power BI Theme Studio

Datacense Power BI Theme Studio is a Next.js application for designing, previewing, validating, importing, and exporting Microsoft Power BI-compatible JSON theme files. It combines a live Power BI-style dashboard canvas with theme controls, visual format controls, quality feedback, and export utilities.

## Implemented Features

- Three-column studio layout with left theme controls, center report canvas, and right format/JSON panel.
- Editable theme name, data colors, brand colors, typography, and preset themes.
- Coolors URL and palette file import for extracting color palettes.
- Power BI-style dashboard preview with slicers, KPI cards, chart grid, page navigation, visual selector, and focus view.
- Preview components for the main Power BI visual families, including stacked charts, combo charts, ribbon, treemap, decomposition tree, pie, donut, waterfall, scatter, bubble, funnel, and area visuals.
- Zustand-backed format pane with Basic, Intermediate, and Advanced property levels.
- Live JSON preview, validation panel, quality score, import JSON, and export JSON.
- Toolbar exports for PNG preview, layout JSON, and Power BI layout template HTML.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Zustand
- shadcn/ui-compatible primitives
- lucide-react
- html-to-image

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000/editor`.

The root route `/` redirects to `/editor`.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run start
```

## Main Folder Structure

```text
src/app/                  Next.js app routes and global styles
src/components/canvas/    Dashboard canvas, toolbar, visual selector, focus view
src/components/charts/    Power BI-style SVG preview visuals
src/components/format-pane/ Right-side visual/general format controls
src/components/layout/    App shell, left sidebar, right panel
src/components/right-panel/ JSON preview, validation, quality score
src/components/sidebar/   Presets, palette, brand color, typography controls
src/lib/                  Theme generation, layout engine, exporters, utilities
src/store/                Zustand theme store
src/types/                Shared TypeScript types
docs/reference/           Product, design, and Power BI visual references
```

## Export Notes

- Power BI Theme JSON export is the real theme artifact intended for Power BI Desktop import.
- All generated `visualStyles` colors use `{ solid: { color: "#RRGGBB" } }`.
- `textClasses` is limited to `callout`, `title`, `header`, and `label`.
- Layout JSON export describes the generated dashboard pages, slicer/KPI/chart zones, dimensions, and current state.
- PBI Template export is an HTML layout guide, not a real `.pbit` file. It includes theme overview, coordinates, setup steps, and a wireframe preview.
- PNG export captures the visible report canvas using `html-to-image`.

## Deployment

The project targets Vercel. Run `npm run build` locally before deployment, then deploy using the Vercel dashboard or CLI.

## Known Limitations

- The PBI Template export is a guide document and does not create a native Power BI template file.
- Format pane controls are mapped to JSON broadly, but only a practical subset is applied visually to chart previews.
- Chart previews are static SVG approximations for theme previewing; they are not connected to a real Power BI rendering engine.
- Imported JSON currently applies supported root theme values and data colors, not the full visual formatting tree.
