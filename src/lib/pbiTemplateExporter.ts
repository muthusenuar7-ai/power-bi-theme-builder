import type { LayoutRect, ExportedChart, ExportedLayoutPage } from './layoutExporter'
import type { ThemeState } from '@/types'
import { downloadTextFile } from './exportUtils'
import { generateLayoutJSON } from './layoutExporter'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function pct(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(2)}%`
}

function rectStyle(rect: LayoutRect, pageWidth: number, pageHeight: number): string {
  return [
    `left:${pct(rect.x, pageWidth)}`,
    `top:${pct(rect.y, pageHeight)}`,
    `width:${pct(rect.width, pageWidth)}`,
    `height:${pct(rect.height, pageHeight)}`,
  ].join(';')
}

function zoneRow(label: string, rect: LayoutRect): string {
  return `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${rect.x}</td>
      <td>${rect.y}</td>
      <td>${rect.width}</td>
      <td>${rect.height}</td>
    </tr>
  `
}

function chartRows(charts: ExportedChart[]): string {
  return charts.map((chart) => zoneRow(`${chart.title} (${chart.sub})`, chart.zone)).join('')
}

function wireframe(page: ExportedLayoutPage, pageWidth: number, pageHeight: number): string {
  const slicers = page.slicers.map((slicer) => `
    <div class="box slicer" style="${rectStyle(slicer.zone, pageWidth, pageHeight)}">
      <strong>${escapeHtml(slicer.title)}</strong>
      <span>Slicer</span>
    </div>
  `).join('')

  const kpis = page.kpiCards.map((kpi) => `
    <div class="box kpi" style="${rectStyle(kpi.zone, pageWidth, pageHeight)}">
      <strong>${escapeHtml(kpi.lbl)}</strong>
      <span>${escapeHtml(kpi.val)}</span>
    </div>
  `).join('')

  const charts = page.charts.map((chart) => `
    <div class="box chart" style="${rectStyle(chart.zone, pageWidth, pageHeight)}">
      <strong>${escapeHtml(chart.title)}</strong>
      <span>${escapeHtml(chart.sub)}</span>
    </div>
  `).join('')

  return `
    <div class="wireframe" style="aspect-ratio:${pageWidth}/${pageHeight}">
      <div class="box header" style="${rectStyle(page.header, pageWidth, pageHeight)}">
        <strong>Header zone</strong>
        <span>Report title and filter pills</span>
      </div>
      ${slicers}
      ${kpis}
      ${charts}
    </div>
  `
}

export function generatePBITemplateHTML(state: ThemeState): string {
  const layout = generateLayoutJSON(state)
  const currentPage = layout.pages[Math.max(0, Math.min(layout.pages.length - 1, state.currentPage))]
  const dataColors = state.dataColors
    .map((color) => `<span class="swatch" style="background:${escapeHtml(color)}">${escapeHtml(color)}</span>`)
    .join('')
  const slicerRows = currentPage.slicers.map((slicer) => zoneRow(`Slicer: ${slicer.title}`, slicer.zone)).join('')
  const kpiRows = currentPage.kpiCards.map((kpi) => zoneRow(`KPI: ${kpi.lbl}`, kpi.zone)).join('')
  const chartSummary = layout.pages.map((page) => `
    <section class="page-block">
      <h3>Page ${page.pageNumber}</h3>
      <ul>
        ${page.charts.map((chart) => `<li>${escapeHtml(chart.title)} - ${escapeHtml(chart.sub)}</li>`).join('')}
      </ul>
    </section>
  `).join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Datacense Power BI Layout Template</title>
  <style>
    :root {
      --bg: ${escapeHtml(state.bg)};
      --fg: ${escapeHtml(state.fg)};
      --primary: ${escapeHtml(state.primary)};
      --border: #d7dde8;
      --muted: #64748b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      background: #f8fafc;
      color: #0f172a;
      font-family: "Segoe UI", Arial, sans-serif;
      line-height: 1.45;
    }
    main {
      max-width: 1120px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 16px 44px rgba(15, 23, 42, .08);
    }
    h1, h2, h3 { margin: 0; color: #0f172a; }
    h1 { font-size: 28px; }
    h2 { font-size: 17px; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 22px; }
    h3 { font-size: 14px; margin: 18px 0 8px; }
    p { color: var(--muted); margin: 8px 0 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; }
    ol { color: #334155; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
    .meta-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #fbfdff; }
    .meta-card b { display: block; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    .swatches { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .swatch { color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.35); border-radius: 999px; padding: 5px 9px; font-size: 11px; font-weight: 700; }
    .wireframe {
      position: relative;
      width: 100%;
      max-width: 980px;
      margin-top: 16px;
      background: var(--bg);
      border: 1px solid #94a3b8;
      overflow: hidden;
    }
    .box {
      position: absolute;
      border: 1px solid rgba(15,23,42,.3);
      background: rgba(255,255,255,.84);
      color: var(--fg);
      padding: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 11px;
    }
    .box strong { font-size: 12px; }
    .box span { color: #475569; }
    .header { border-color: var(--primary); background: rgba(13,148,136,.12); }
    .slicer { background: rgba(59,130,246,.11); }
    .kpi { background: rgba(245,158,11,.14); }
    .chart { background: rgba(139,92,246,.10); }
    .page-block ul { margin: 8px 0 0; padding-left: 18px; color: #475569; }
  </style>
</head>
<body>
  <main>
    <h1>Datacense Power BI Layout Template</h1>
    <p>Use this document as a practical guide for recreating the Theme Studio dashboard layout in Power BI Desktop.</p>

    <section>
      <h2>Theme Overview</h2>
      <div class="meta">
        <div class="meta-card"><b>Theme name</b>${escapeHtml(layout.themeName)}</div>
        <div class="meta-card"><b>Page size</b>${escapeHtml(layout.pageSizeLabel)} (${layout.pageWidth} x ${layout.pageHeight}px)</div>
        <div class="meta-card"><b>Background</b>${escapeHtml(state.bg)}</div>
        <div class="meta-card"><b>Foreground</b>${escapeHtml(state.fg)}</div>
      </div>
      <div class="swatches">${dataColors}</div>
    </section>

    <section>
      <h2>Current Page Wireframe</h2>
      <p>Page ${currentPage.pageNumber} coordinates are shown in source pixels relative to the top-left of the Power BI report page.</p>
      ${wireframe(currentPage, layout.pageWidth, layout.pageHeight)}
    </section>

    <section>
      <h2>Visual Layout Specification</h2>
      <table>
        <thead><tr><th>Zone</th><th>X</th><th>Y</th><th>Width</th><th>Height</th></tr></thead>
        <tbody>
          ${zoneRow('Header zone', currentPage.header)}
          ${currentPage.slicerZone ? zoneRow('Slicer zone', currentPage.slicerZone) : ''}
          ${currentPage.kpiZone ? zoneRow('KPI card zone', currentPage.kpiZone) : ''}
          ${zoneRow('Chart grid zone', currentPage.chartZone)}
          ${slicerRows}
          ${kpiRows}
          ${chartRows(currentPage.charts)}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Power BI Desktop Steps</h2>
      <ol>
        <li>Import the exported Power BI theme JSON from Theme Studio.</li>
        <li>Set the report page size to ${escapeHtml(layout.pageSizeLabel)} or custom ${layout.pageWidth} x ${layout.pageHeight}px.</li>
        <li>Add the header, slicers, KPI cards, and chart visuals shown in the layout table.</li>
        <li>Use the X, Y, Width, and Height coordinates as the placement guide.</li>
        <li>Apply the listed data colors and foreground/background values when fine-tuning visuals.</li>
      </ol>
    </section>

    <section>
      <h2>Pages and Visuals</h2>
      ${chartSummary}
    </section>
  </main>
</body>
</html>`
}

export function downloadPBITemplate(state: ThemeState): void {
  downloadTextFile(
    'datacense-power-bi-layout-template.html',
    generatePBITemplateHTML(state),
    'text/html;charset=utf-8',
  )
}
