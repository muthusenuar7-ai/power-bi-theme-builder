# Live Power BI Preview — Plan & QA Guide

**Date:** 2026-05-28  
**Build:** Next.js 16.2.6 (Turbopack) — ✅ 0 TypeScript errors

---

## Purpose

The Live Power BI Preview feature embeds a real Power BI visual directly inside the
Theme Studio editor, next to the existing SVG-based Studio Preview. This allows
developers and designers to see how their theme changes look in an actual Power BI
visual — not just an approximation.

---

## Difference Between Studio Preview and Live Preview

| Feature | Studio Preview | Live Power BI Preview |
|---|---|---|
| Rendering | Custom SVG/React components | Real Power BI iframe embed |
| Token required | No | Yes (embed token) |
| Offline support | Yes | No |
| Accuracy | Approximate | Pixel-perfect PBI rendering |
| Theme apply speed | Instant (reactive state) | On "Apply Theme" button click |
| Chart types supported | All 24 selector visuals | 27 (mapped from report) |
| Zoom/scale | Configurable | Fills available panel |

---

## Report Details

| Field | Value |
|---|---|
| Report ID | `4fb25784-f84a-4ccc-82c4-876b338e8cd1` |
| Embed URL | `https://app.powerbi.com/reportEmbed?reportId=4fb25784-f84a-4ccc-82c4-876b338e8cd1&autoAuth=true&embeddedDemo=true` |
| Embed type | `visual` (single visual, not full report) |
| Token type | `TokenType.Embed` |

---

## Mapping File

**Source:** `powerbi-visual-mapping.json` (project root, UTF-16 LE encoded)  
**Compiled to:** `src/lib/powerBiVisualMap.ts`

The mapping file was decoded and converted to a typed TypeScript constant
(`POWERBI_VISUAL_MAP`). It maps every Theme Studio visual ID (e.g. `stackedbar`)
to a `{ pageName, visualName, displayName, pbiType }` object.

### Mapped visuals (27 total)

| Studio ID | Display Name | PBI Type |
|---|---|---|
| `bar` / `stackedbar` | Stacked Bar Chart | barChart |
| `clusteredbar` | Clustered Bar Chart | clusteredBarChart |
| `hundredstackedbar` | 100% Stacked Bar Chart | hundredPercentStackedBarChart |
| `column` / `stackedcol` | Stacked Column Chart | columnChart |
| `clusteredcol` | Clustered Column Chart | clusteredColumnChart |
| `hundredstackedcol` | 100% Stacked Column Chart | hundredPercentStackedColumnChart |
| `lineclustered` | Line & Clustered Column | lineClusteredColumnComboChart |
| `linestacked` | Line & Stacked Column | lineStackedColumnComboChart |
| `line` | Line Chart | lineChart |
| `area` | Area Chart | stackedAreaChart |
| `stackedarea` | Stacked Area Chart | stackedAreaChart |
| `hundredstackedarea` | 100% Stacked Area Chart | hundredPercentStackedAreaChart |
| `pie` | Pie Chart | pieChart |
| `donut` | Donut Chart | donutChart |
| `funnel` | Funnel Chart | funnel |
| `treemap` | Treemap | treemap |
| `waterfall` | Waterfall Chart | waterfallChart |
| `ribbon` | Ribbon Chart | ribbonChart |
| `scatter` | Scatter Chart | scatterChart |
| `table` | Table | tableEx |
| `matrix` | Matrix | pivotTable |
| `cardCurrent` | Card | cardVisual |
| `slicerStandard` | Slicer | slicer |
| `buttonSlicer` | Button Slicer | advancedSlicerVisual |
| `gauge` | Gauge Chart | gauge |

### Not mapped (no page in reference report)
- `bubble`, `decompositiontree`, `cardLegacy`, `multirowcard`, `kpi`, `listSlicer`, `tileSlicer`

---

## Security Warning — Access Tokens

⚠ **This is critical.** The Power BI embed token grants access to the report.

Rules:
1. Never hardcode a token in source code.
2. Never commit a token to version control — even in a private repository.
3. The `NEXT_PUBLIC_POWERBI_DEMO_ACCESS_TOKEN` env var is for **local development only**.
4. In production, generate short-lived tokens server-side via the Power BI REST API
   (`GenerateToken` endpoint) and deliver them to the client through a secured API route.
5. NEXT_PUBLIC_ variables are embedded in the JavaScript bundle. Anyone with browser
   DevTools can read them. Use only for low-sensitivity demo tokens.

---

## Required Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_POWERBI_REPORT_ID=4fb25784-f84a-4ccc-82c4-876b338e8cd1
NEXT_PUBLIC_POWERBI_EMBED_URL=https://app.powerbi.com/reportEmbed?reportId=4fb25784-f84a-4ccc-82c4-876b338e8cd1&autoAuth=true&embeddedDemo=true
NEXT_PUBLIC_POWERBI_TOKEN_TYPE=Embed
NEXT_PUBLIC_POWERBI_DEMO_ACCESS_TOKEN=<your-short-lived-embed-token>
```

If `NEXT_PUBLIC_POWERBI_DEMO_ACCESS_TOKEN` is empty, the Live Preview tab shows a
configuration message and no embed is attempted. Studio Preview continues to work
without any env vars.

---

## Architecture

```
DashboardCanvas.tsx
├── Preview mode toggle strip (Studio | Live Power BI)
├── if studio:
│   ├── canvas-workspace (dot grid, scaled canvas)
│   │   └── DashboardLayout | FocusView (SVG components)
│   └── canvas-footer (PageNavigator)
└── if live:
    └── PowerBiSingleVisualPreview.tsx
        ├── No visual selected → prompt
        ├── Visual not mapped → fallback message
        ├── Token missing → config instructions
        └── Token present:
            ├── Visual info bar + "Apply Theme to Preview" button
            ├── Loading overlay (while embed initialises)
            ├── Error state (on embed failure)
            └── Embed container (powerbi-client injects iframe here)
```

### Key files
| File | Purpose |
|---|---|
| `src/lib/powerBiVisualMap.ts` | Maps Studio visual IDs to pageName/visualName |
| `src/components/powerbi/PowerBiSingleVisualPreview.tsx` | Embed + apply-theme component |
| `src/components/canvas/DashboardCanvas.tsx` | Mode toggle, conditionally renders live or studio |
| `.env.example` | Token placeholder documentation |

---

## How to Test

### Prerequisites
1. Obtain an embed token for report `4fb25784-f84a-4ccc-82c4-876b338e8cd1`.
   - Via [Power BI Embedded Playground](https://playground.powerbi.com/) or REST API.
2. Set the token in `.env.local` (`NEXT_PUBLIC_POWERBI_DEMO_ACCESS_TOKEN=<token>`).
3. Run `npm run dev`.

### Test steps
1. Open `http://localhost:3000/editor`.
2. Click **Visuals** in the left rail.
3. Click a visual (e.g. **Stacked Bar**).
4. In the center canvas area, click **Live Power BI** in the toggle strip.
5. The embed container should show the loading state, then the visual.
6. Click **Apply Theme to Preview** — the current theme should be sent to PBI.
7. Switch back to **Studio** — the SVG preview should still be correct.
8. Export JSON — should still download the theme file correctly.
9. Select a non-mapped visual (e.g. Bubble) → friendly fallback message shown.
10. If token is empty → configuration instructions shown, no crash.

---

## Known Limitations

1. **Token expiry**: Embed tokens expire (typically 1 hour). The live preview will stop
   working after expiry. The component shows the error state; refresh the page with a
   new token to restore it.

2. **Theme apply on visual embeds**: `powerbi-client` does not expose `applyTheme` on
   the `Visual` embed type (only on `Report` embeds). The "Apply Theme to Preview"
   button attempts the call and shows a friendly message if unsupported. Use
   **Export JSON → Import in Power BI Desktop** as the reliable theme-apply path.

3. **No server-side token**: This implementation uses a NEXT_PUBLIC env var which is
   visible in the browser bundle. Production must use a secured server-side token
   endpoint (`/api/pbi-token`) that calls the Power BI REST API with service principal
   credentials.

4. **Bubble / Decomposition Tree**: No page exists in the reference report for these
   visuals. The live preview shows a "not mapped" fallback for them.

5. **Report-level filters**: The embedded visual shows data from the reference report.
   Report-level filters cannot be changed from the Theme Studio UI.

6. **CORS / iframe policies**: Corporate network policies may block the Power BI embed
   endpoint. The error state will surface this with the error message from the SDK.
