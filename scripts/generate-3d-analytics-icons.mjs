/**
 * 3D Analytics icon generator (Phase 2F).
 *
 * Composes 30 curated isometric analytics icons from shared vector primitives
 * (isometric boxes, cylinders, panels, ribbons, spheres) and writes them to
 * src/data/icon-library/analytics3d.ts as fixed-color IconConcepts.
 *
 * Constraints honoured:
 *  - pure standalone SVG: no images/fonts/scripts/foreignObject/filters
 *  - controlled linear gradients with per-icon unique ids
 *  - soft highlights + shadows via simple transparent vector layers
 *  - curated accessible palette (no random colors)
 *  - readable at 24/32/48/64 px (bold silhouettes, 64×64 viewBox)
 *
 * Run: node scripts/generate-3d-analytics-icons.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ─── color helpers ───────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}
/** f > 0 lightens toward white, f < 0 darkens toward black (fraction 0..1). */
function shade(hex, f) {
  const [r, g, b] = hexToRgb(hex)
  return f >= 0
    ? rgbToHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f)
    : rgbToHex(r * (1 + f), g * (1 + f), b * (1 + f))
}

// Curated accessible palette — indigo / teal / orange / purple / cyan / red /
// slate / gold. Face shading is derived, never random.
const C = {
  indigo: '#4C6EF5',
  teal: '#0CA678',
  orange: '#F08C00',
  purple: '#7048E8',
  cyan: '#1098AD',
  red: '#E03131',
  slate: '#64748B',
  gold: '#F59F00',
  ink: '#1E293B',
  paper: '#E9EEF5',
}

// ─── isometric primitives ────────────────────────────────────────────────────

const K = 0.866
/** World → screen: x runs right-down, y runs left-down, z runs up. */
function proj(ox, oy) {
  return (x, y, z) => [ox + (x - y) * K, oy + (x + y) * 0.5 - z]
}
const f2 = (n) => (Math.round(n * 100) / 100).toString()
const pts = (list) => list.map(([x, y]) => `${f2(x)},${f2(y)}`).join(' ')

function polygon(points, fill, extra = '') {
  return `<polygon points="${pts(points)}" fill="${fill}"${extra}/>`
}

/**
 * Isometric cuboid at world origin (ox,oy screen), size w(x)×d(y)×h(z).
 * Visible faces: left (y=d plane, base color), right (x=w plane, darker),
 * top (z=h, lighter or gradient fill).
 */
function box(ox, oy, w, d, h, color, topFill = null) {
  const P = proj(ox, oy)
  const left = [P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)]
  const right = [P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)]
  const top = [P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)]
  return (
    polygon(left, color) +
    polygon(right, shade(color, -0.28)) +
    polygon(top, topFill ?? shade(color, 0.24))
  )
}

/** Soft elliptical ground shadow. */
function shadow(cx, cy, rx, ry, opacity = 0.1) {
  return `<ellipse cx="${f2(cx)}" cy="${f2(cy)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="#0F172A" opacity="${opacity}"/>`
}

/** Soft white highlight sliver on a top-left corner. */
function highlight(points, opacity = 0.22) {
  return `<polygon points="${pts(points)}" fill="#FFFFFF" opacity="${opacity}"/>`
}

/** Squat cylinder (database platter / coin): side wall + top ellipse. */
function cylinder(cx, cy, rx, ry, h, color, topFill = null) {
  const side = `<path d="M ${f2(cx - rx)} ${f2(cy - h)} v ${f2(h)} a ${f2(rx)} ${f2(ry)} 0 0 0 ${f2(rx * 2)} 0 v ${f2(-h)}" fill="${color}"/>`
  const darkEdge = `<path d="M ${f2(cx - rx)} ${f2(cy)} a ${f2(rx)} ${f2(ry)} 0 0 0 ${f2(rx * 2)} 0" fill="none" stroke="${shade(color, -0.3)}" stroke-width="0.8"/>`
  const top = `<ellipse cx="${f2(cx)}" cy="${f2(cy - h)}" rx="${f2(rx)}" ry="${f2(ry)}" fill="${topFill ?? shade(color, 0.24)}"/>`
  return side + darkEdge + top
}

/** Standard ground platform all scenes sit on. */
function platform(gid) {
  const ox = 32
  const oy = 38
  return (
    shadow(32, 55, 26, 6, 0.1) +
    box(ox, oy, 30, 30, 3, C.slate, `url(#${gid})`)
  )
}
function platformDefs(gid) {
  return `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(C.slate, 0.62)}"/><stop offset="1" stop-color="${shade(C.slate, 0.4)}"/></linearGradient>`
}

/** Points on the platform top surface (z = 3). */
function onPlatform(x, y, z = 0) {
  return proj(32, 38)(x, y, z + 3)
}

function gradient(id, c1, c2, vertical = true) {
  const dir = vertical ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="0"'
  return `<linearGradient id="${id}" ${dir}><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`
}

/** Sphere with static highlight (no filters). */
function sphere(cx, cy, r, color) {
  return (
    `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="${color}"/>` +
    `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="none" stroke="${shade(color, -0.25)}" stroke-width="0.6"/>` +
    `<circle cx="${f2(cx - r * 0.32)}" cy="${f2(cy - r * 0.35)}" r="${f2(r * 0.3)}" fill="#FFFFFF" opacity="0.35"/>`
  )
}

/** Pie/donut wedge on an ellipse (top view), angles in degrees (0 = +x, CW screen). */
function wedge(cx, cy, rx, ry, a1, a2, fill, innerRatio = 0) {
  const rad = (a) => (a * Math.PI) / 180
  const px = (a, sx = 1) => cx + rx * sx * Math.cos(rad(a))
  const py = (a, sy = 1) => cy + ry * sy * Math.sin(rad(a))
  const large = a2 - a1 > 180 ? 1 : 0
  if (innerRatio <= 0) {
    return `<path d="M ${f2(cx)} ${f2(cy)} L ${f2(px(a1))} ${f2(py(a1))} A ${f2(rx)} ${f2(ry)} 0 ${large} 1 ${f2(px(a2))} ${f2(py(a2))} Z" fill="${fill}"/>`
  }
  const ir = innerRatio
  return `<path d="M ${f2(px(a1, ir))} ${f2(py(a1, ir))} L ${f2(px(a1))} ${f2(py(a1))} A ${f2(rx)} ${f2(ry)} 0 ${large} 1 ${f2(px(a2))} ${f2(py(a2))} L ${f2(px(a2, ir))} ${f2(py(a2, ir))} A ${f2(rx * ir)} ${f2(ry * ir)} 0 ${large} 0 ${f2(px(a1, ir))} ${f2(py(a1, ir))} Z" fill="${fill}"/>`
}

/** Cylinder side band below the front-facing part of an ellipse (0..180°). */
function ellipseWall(cx, cy, rx, ry, h, color) {
  return `<path d="M ${f2(cx - rx)} ${f2(cy)} a ${f2(rx)} ${f2(ry)} 0 0 0 ${f2(rx * 2)} 0 v ${f2(h)} a ${f2(rx)} ${f2(ry)} 0 0 1 ${f2(-rx * 2)} 0 Z" fill="${color}"/>`
}

/** Flat isometric tile (parallelogram) on the platform surface. */
function tile(x, y, w, d, fill, z = 0) {
  return polygon([onPlatform(x, y, z), onPlatform(x + w, y, z), onPlatform(x + w, y + d, z), onPlatform(x, y + d, z)], fill)
}

/** Simple straight arrow polygon between two screen points. */
function arrow(x1, y1, x2, y2, width, fill) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const headLen = Math.min(7, len * 0.45)
  const bx = x2 - ux * headLen
  const by = y2 - uy * headLen
  const w2 = width / 2
  return polygon(
    [
      [x1 + nx * w2, y1 + ny * w2],
      [bx + nx * w2, by + ny * w2],
      [bx + nx * w2 * 2.2, by + ny * w2 * 2.2],
      [x2, y2],
      [bx - nx * w2 * 2.2, by - ny * w2 * 2.2],
      [bx - nx * w2, by - ny * w2],
      [x1 - nx * w2, y1 - ny * w2],
    ],
    fill,
  )
}

/** Column standing on the platform at tile position (x,y) with footprint s×s. */
function column(x, y, s, h, color, topFill = null) {
  const [ox, oy] = onPlatform(x, y)
  // box() projects from its own origin; feed it the platform-top screen origin.
  return box(ox, oy, s, s, h, color, topFill)
}

// ─── scenes ──────────────────────────────────────────────────────────────────

const ICONS = []
function icon(slug, name, keywords, description, build) {
  const g = (n) => `d3-${slug}-${n}`
  const { defs = '', body } = build(g)
  const svg = (defs ? `<defs>${defs}</defs>` : '') + body
  ICONS.push({ slug, name, keywords, description, svg })
}

// 1 — Dashboard: upright panel with KPI tiles and mini bars.
icon('dashboard', '3D Dashboard', ['dashboard', 'overview', 'tiles', 'kpi', 'report page'],
  'Isometric dashboard panel with KPI tiles and mini chart bars.', (g) => ({
    defs: platformDefs(g(1)) + gradient(g(2), shade(C.indigo, 0.15), shade(C.indigo, -0.1)),
    body:
      platform(g(1)) +
      box(20, 32, 26, 4, 26, C.indigo, `url(#${g(2)})`) +
      // screen face tiles (on the left face of the panel, plane y=d)
      polygon([[9.5, 21], [20, 27], [20, 33], [9.5, 27]], shade(C.paper, 0)) +
      polygon([[22, 28.2], [31, 33.4], [31, 39.4], [22, 34.2]], C.teal) +
      polygon([[9.5, 29.5], [14, 32.1], [14, 40.1], [9.5, 37.5]], C.orange) +
      polygon([[15.5, 33], [19.5, 35.3], [19.5, 41.3], [15.5, 39]], C.gold) +
      highlight([[6.9, 16.4], [29.4, 29.4], [29.4, 31.4], [6.9, 18.4]], 0.16),
  }))

// 2 — Bar chart: horizontal isometric bars of differing lengths.
icon('bar-chart', '3D Bar Chart', ['bar', 'horizontal bars', 'ranking', 'comparison'],
  'Isometric horizontal bar chart with three stacked depth bars.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      (() => {
        const [ox1, oy1] = onPlatform(2, 4)
        const [ox2, oy2] = onPlatform(2, 13)
        const [ox3, oy3] = onPlatform(2, 22)
        return (
          box(ox1, oy1, 26, 6, 6, C.indigo) +
          box(ox2, oy2, 18, 6, 6, C.teal) +
          box(ox3, oy3, 11, 6, 6, C.orange)
        )
      })(),
  }))

// 3 — Column chart: four vertical columns.
icon('column-chart', '3D Column Chart', ['column', 'vertical bars', 'growth', 'chart'],
  'Isometric column chart with four rising columns.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      column(21, 3, 6, 10, C.slate) +
      column(14, 9, 6, 15, C.cyan) +
      column(7, 15, 6, 20, C.teal) +
      column(0, 21, 6, 26, C.indigo),
  }))

// 4 — Line chart: ribbon wall following a trend line with markers.
icon('line-chart', '3D Line Chart', ['line', 'trend', 'time series'],
  'Isometric trend wall with polyline ridge and data markers.', (g) => {
    const xs = [2, 10, 18, 27]
    const zs = [8, 16, 10, 22]
    const topPts = xs.map((x, i) => onPlatform(x, 14, zs[i]))
    const basePts = xs.map((x) => onPlatform(x, 14, 0))
    return {
      defs: platformDefs(g(1)) + gradient(g(2), 'rgba(76,110,245,0.85)', 'rgba(76,110,245,0.25)'),
      body:
        platform(g(1)) +
        polygon([...topPts, ...[...basePts].reverse()], `url(#${g(2)})`) +
        `<polyline points="${pts(topPts)}" fill="none" stroke="${C.indigo}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
        topPts.map(([x, y]) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="1.9" fill="${C.orange}"/>`).join(''),
    }
  })

// 5 — Area chart: two layered gradient area walls.
icon('area-chart', '3D Area Chart', ['area', 'layers', 'volume', 'trend'],
  'Isometric layered area chart with two translucent gradient walls.', (g) => {
    const wall = (y, zs, gid) => {
      const xs = [1, 10, 19, 28]
      const top = xs.map((x, i) => onPlatform(x, y, zs[i]))
      const base = xs.map((x) => onPlatform(x, y, 0))
      return polygon([...top, ...[...base].reverse()], `url(#${gid})`)
    }
    return {
      defs:
        platformDefs(g(1)) +
        gradient(g(2), 'rgba(12,166,120,0.95)', 'rgba(12,166,120,0.35)') +
        gradient(g(3), 'rgba(76,110,245,0.9)', 'rgba(76,110,245,0.3)'),
      body: platform(g(1)) + wall(6, [10, 18, 13, 23], g(2)) + wall(20, [6, 11, 8, 15], g(3)),
    }
  })

// 6 — Pie chart: squat pie cylinder with an exploded slice.
icon('pie-chart', '3D Pie Chart', ['pie', 'share', 'proportion', 'parts'],
  'Isometric pie with a lifted, exploded orange slice.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      ellipseWall(30, 30, 16, 8.5, 7, shade(C.indigo, -0.2)) +
      wedge(30, 30, 16, 8.5, 0, 360, shade(C.indigo, 0.16)) +
      wedge(30, 30, 16, 8.5, 115, 245, shade(C.teal, 0.1)) +
      // exploded slice, shifted out along its bisector and slightly up
      ellipseWall(38.5, 24.6, 0.01, 0.01, 0, 'none') +
      `<g>` +
      `<path d="M ${f2(38.5)} ${f2(24.6)} L ${f2(38.5 + 16 * Math.cos(-1.13))} ${f2(24.6 + 8.5 * Math.sin(-1.13))} A 16 8.5 0 0 1 ${f2(38.5 + 16 * Math.cos(0.17))} ${f2(24.6 + 8.5 * Math.sin(0.17))} Z" fill="${shade(C.orange, 0.08)}"/>` +
      `<path d="M ${f2(38.5 + 16 * Math.cos(0.17))} ${f2(24.6 + 8.5 * Math.sin(0.17))} v 5 " stroke="${shade(C.orange, -0.25)}" stroke-width="1.4" fill="none"/>` +
      `</g>`,
  }))

// 7 — Donut chart: ring cylinder with two-tone top.
icon('donut-chart', '3D Donut Chart', ['donut', 'ring', 'share', 'kpi'],
  'Isometric donut ring with contrasting segment arcs.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      ellipseWall(32, 29, 17, 9, 7, shade(C.teal, -0.22)) +
      wedge(32, 29, 17, 9, 0, 360, shade(C.teal, 0.12), 0.52) +
      wedge(32, 29, 17, 9, 200, 335, shade(C.indigo, 0.1), 0.52) +
      wedge(32, 29, 17, 9, 335, 360, shade(C.orange, 0.06), 0.52) +
      `<ellipse cx="32" cy="29" rx="${f2(17 * 0.52)}" ry="${f2(9 * 0.52)}" fill="${shade(C.slate, 0.58)}"/>`,
  }))

// 8 — Treemap: isometric mosaic of proportional tiles.
icon('treemap', '3D Treemap', ['treemap', 'mosaic', 'hierarchy', 'proportion'],
  'Isometric treemap mosaic of raised proportional tiles.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      (() => {
        const [o1x, o1y] = onPlatform(1, 1)
        const [o2x, o2y] = onPlatform(17, 1)
        const [o3x, o3y] = onPlatform(17, 16)
        const [o4x, o4y] = onPlatform(1, 20)
        const [o5x, o5y] = onPlatform(24, 16)
        return (
          box(o1x, o1y, 15, 18, 4, C.indigo) +
          box(o2x, o2y, 12, 14, 4, C.teal) +
          box(o3x, o3y, 6, 13, 4, C.orange) +
          box(o4x, o4y, 15, 8, 4, C.cyan) +
          box(o5x, o5y, 5, 13, 4, C.gold)
        )
      })(),
  }))

// 9 — Waterfall: floating step boxes with connectors.
icon('waterfall', '3D Waterfall', ['waterfall', 'bridge', 'variance', 'steps'],
  'Isometric waterfall bridge with floating step columns.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      (() => {
        const step = (x, zBase, h, color) => {
          const [ox, oy] = onPlatform(x, 13, zBase)
          return box(ox, oy, 5.6, 6, h, color)
        }
        const link = (x1, z1, x2, z2) => {
          const [ax, ay] = onPlatform(x1, 13, z1)
          const [bx, by] = onPlatform(x2, 13, z2)
          return `<line x1="${f2(ax)}" y1="${f2(ay)}" x2="${f2(bx)}" y2="${f2(by)}" stroke="${C.slate}" stroke-width="1" stroke-dasharray="2 1.6"/>`
        }
        return (
          step(0, 0, 10, C.indigo) +
          link(5.6, 10, 7.6, 10) +
          step(7.6, 10, 6, C.teal) +
          link(13.2, 16, 15.2, 16) +
          step(15.2, 16, 6, C.teal) +
          link(20.8, 16, 22.8, 16) +
          step(22.8, 8, 8, C.red) +
          step(29, 0, 0.01, 'none')
        )
      })(),
  }))

// 10 — Scatter plot: spheres of varying size above the platform.
icon('scatter-plot', '3D Scatter Plot', ['scatter', 'bubbles', 'correlation', 'points'],
  'Isometric scatter of gradient spheres at varied heights.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      shadow(...onPlatform(7, 7), 4, 1.6, 0.14) +
      shadow(...onPlatform(20, 10), 3, 1.3, 0.14) +
      shadow(...onPlatform(13, 21), 3.4, 1.4, 0.14) +
      sphere(...onPlatform(7, 7, 12), 5.4, C.indigo) +
      sphere(...onPlatform(20, 10, 18), 3.6, C.teal) +
      sphere(...onPlatform(13, 21, 8), 4.4, C.orange) +
      sphere(...onPlatform(24, 22, 13), 2.8, C.purple),
  }))

// 11 — KPI card: raised card with big value bar and delta arrow.
icon('kpi-card', '3D KPI Card', ['kpi', 'card', 'metric', 'value'],
  'Isometric KPI card with metric bar and rising delta arrow.', (g) => ({
    defs: platformDefs(g(1)) + gradient(g(2), '#FFFFFF', shade(C.paper, -0.05)),
    body:
      platform(g(1)) +
      (() => {
        const [ox, oy] = onPlatform(2, 4)
        return box(ox, oy, 24, 16, 5, shade(C.paper, -0.18), `url(#${g(2)})`)
      })() +
      tile(5, 7, 10, 3.2, C.indigo, 5.06) +
      tile(5, 12.4, 14, 2.2, shade(C.slate, 0.25), 5.06) +
      tile(5, 16.2, 8, 2.2, shade(C.slate, 0.4), 5.06) +
      arrow(...onPlatform(21, 17, 5.2), ...onPlatform(25.5, 9.5, 12), 2.6, C.teal),
  }))

// 12 — Gauge: half-ring dial with needle on a puck.
icon('gauge', '3D Gauge', ['gauge', 'dial', 'speed', 'utilization'],
  'Isometric gauge puck with tri-color arc and needle.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      ellipseWall(32, 30, 17, 9, 6, shade(C.slate, 0.05)) +
      wedge(32, 30, 17, 9, 0, 360, shade(C.paper, 0.05)) +
      wedge(32, 30, 17, 9, 150, 260, C.teal, 0.62) +
      wedge(32, 30, 17, 9, 260, 330, C.gold, 0.62) +
      wedge(32, 30, 17, 9, 330, 390, C.red, 0.62) +
      polygon([[31, 31.2], [33, 31.2], [40.4, 22.6], [31.6, 28.6]], C.ink) +
      `<ellipse cx="32" cy="30" rx="2.6" ry="1.5" fill="${C.ink}"/>`,
  }))

// 13 — Target: concentric rings with a landed dart pin.
icon('target', '3D Target', ['target', 'goal', 'objective', 'bullseye'],
  'Isometric bullseye rings with a landed goal pin.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      ellipseWall(32, 29, 18, 9.4, 5, shade(C.red, -0.2)) +
      `<ellipse cx="32" cy="29" rx="18" ry="9.4" fill="${shade(C.red, 0.06)}"/>` +
      `<ellipse cx="32" cy="29" rx="12.6" ry="6.6" fill="#FFFFFF"/>` +
      `<ellipse cx="32" cy="29" rx="7.6" ry="4" fill="${shade(C.red, 0.06)}"/>` +
      `<ellipse cx="32" cy="29" rx="3" ry="1.6" fill="#FFFFFF"/>` +
      `<line x1="32" y1="29" x2="43" y2="12" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>` +
      polygon([[43, 12], [48.5, 9.4], [45.4, 14.6]], C.gold) +
      polygon([[43, 12], [45.4, 14.6], [41.2, 15.6]], shade(C.gold, -0.22)),
  }))

// 14 — Trend up: ascending steps with a bold climb arrow.
icon('trend-up', '3D Trend Up', ['growth', 'increase', 'up', 'positive'],
  'Isometric ascending steps with a bold upward arrow.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      column(2, 20, 7, 6, shade(C.teal, -0.08)) +
      column(9, 14, 7, 12, shade(C.teal, -0.04)) +
      column(16, 8, 7, 18, C.teal) +
      arrow(...onPlatform(4, 27, 9), ...onPlatform(26, 4, 26), 3, C.gold),
  }))

// 15 — Trend down: descending steps with a decline arrow.
icon('trend-down', '3D Trend Down', ['decline', 'decrease', 'down', 'negative'],
  'Isometric descending steps with a downward arrow.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      column(2, 8, 7, 18, C.red) +
      column(9, 14, 7, 12, shade(C.red, 0.12)) +
      column(16, 20, 7, 6, shade(C.red, 0.24)) +
      arrow(...onPlatform(2, 2, 26), ...onPlatform(27, 26, 6), 3, C.ink),
  }))

// 16 — Forecast: solid history wall + dashed projected ridge.
icon('forecast', '3D Forecast', ['forecast', 'projection', 'prediction', 'future'],
  'Isometric history wall with dashed forecast projection.', (g) => {
    const xs = [1, 9, 16]
    const zs = [7, 14, 11]
    const top = xs.map((x, i) => onPlatform(x, 14, zs[i]))
    const base = xs.map((x) => onPlatform(x, 14, 0))
    const p1 = onPlatform(16, 14, 11)
    const p2 = onPlatform(23, 14, 18)
    const p3 = onPlatform(29, 14, 24)
    return {
      defs: platformDefs(g(1)) + gradient(g(2), 'rgba(112,72,232,0.85)', 'rgba(112,72,232,0.25)'),
      body:
        platform(g(1)) +
        polygon([...top, ...[...base].reverse()], `url(#${g(2)})`) +
        `<polyline points="${pts(top)}" fill="none" stroke="${C.purple}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<polyline points="${pts([p1, p2, p3])}" fill="none" stroke="${C.purple}" stroke-width="2.2" stroke-dasharray="3 2.4" stroke-linecap="round"/>` +
        sphere(p3[0], p3[1], 2.6, C.gold),
    }
  })

// 17 — Data cube: large gridded cube.
icon('data-cube', '3D Data Cube', ['cube', 'olap', 'multidimensional', 'model'],
  'Isometric OLAP data cube with cell grid on every face.', (g) => {
    const ox = 32
    const oy = 40
    const s = 20
    const P = proj(ox, oy)
    const gridLines = () => {
      let out = ''
      for (let i = 1; i < 3; i++) {
        const t = (s / 3) * i
        out += `<line x1="${f2(P(t, s, 0)[0])}" y1="${f2(P(t, s, 0)[1])}" x2="${f2(P(t, s, s)[0])}" y2="${f2(P(t, s, s)[1])}" stroke="${shade(C.indigo, -0.35)}" stroke-width="0.7"/>`
        out += `<line x1="${f2(P(0, s, t)[0])}" y1="${f2(P(0, s, t)[1])}" x2="${f2(P(s, s, t)[0])}" y2="${f2(P(s, s, t)[1])}" stroke="${shade(C.indigo, -0.35)}" stroke-width="0.7"/>`
        out += `<line x1="${f2(P(s, t, 0)[0])}" y1="${f2(P(s, t, 0)[1])}" x2="${f2(P(s, t, s)[0])}" y2="${f2(P(s, t, s)[1])}" stroke="${shade(C.indigo, -0.5)}" stroke-width="0.7"/>`
        out += `<line x1="${f2(P(s, 0, t)[0])}" y1="${f2(P(s, 0, t)[1])}" x2="${f2(P(s, s, t)[0])}" y2="${f2(P(s, s, t)[1])}" stroke="${shade(C.indigo, -0.5)}" stroke-width="0.7"/>`
        out += `<line x1="${f2(P(t, 0, s)[0])}" y1="${f2(P(t, 0, s)[1])}" x2="${f2(P(t, s, s)[0])}" y2="${f2(P(t, s, s)[1])}" stroke="${shade(C.indigo, 0.4)}" stroke-width="0.7"/>`
        out += `<line x1="${f2(P(0, t, s)[0])}" y1="${f2(P(0, t, s)[1])}" x2="${f2(P(s, t, s)[0])}" y2="${f2(P(s, t, s)[1])}" stroke="${shade(C.indigo, 0.4)}" stroke-width="0.7"/>`
      }
      return out
    }
    return {
      defs: gradient(g(1), shade(C.indigo, 0.3), shade(C.indigo, 0.1)),
      body:
        shadow(32, 53, 22, 5.5, 0.12) +
        box(ox, oy, s, s, s, C.indigo, `url(#${g(1)})`) +
        gridLines(),
    }
  })

// 18 — Database: classic three-platter stack.
icon('database', '3D Database', ['database', 'storage', 'sql', 'warehouse'],
  'Isometric database stack of three gradient platters.', (g) => ({
    defs: gradient(g(1), shade(C.cyan, 0.28), shade(C.cyan, 0.05)),
    body:
      shadow(32, 54, 19, 5, 0.12) +
      cylinder(32, 51, 17, 6.5, 10, shade(C.cyan, -0.1)) +
      cylinder(32, 39, 17, 6.5, 10, C.cyan) +
      cylinder(32, 27, 17, 6.5, 10, shade(C.cyan, 0.1), `url(#${g(1)})`) +
      highlight([[17.5, 15.5], [22, 13.6], [22, 43], [17.5, 45]], 0.14),
  }))

// 19 — Data table: platform grid with colored header row.
icon('data-table', '3D Data Table', ['table', 'grid', 'rows', 'columns'],
  'Isometric data table slab with header band and cell grid.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      (() => {
        const [ox, oy] = onPlatform(2, 3)
        let out = box(ox, oy, 26, 22, 4, shade(C.paper, -0.16), '#FFFFFF')
        out += tile(2, 3, 26, 5.4, C.indigo, 4.05)
        for (let r = 1; r <= 3; r++) {
          const y = 3 + 5.4 * r
          out += `<line x1="${f2(onPlatform(2, y, 4.1)[0])}" y1="${f2(onPlatform(2, y, 4.1)[1])}" x2="${f2(onPlatform(28, y, 4.1)[0])}" y2="${f2(onPlatform(28, y, 4.1)[1])}" stroke="${shade(C.slate, 0.35)}" stroke-width="0.8"/>`
        }
        for (let ci = 1; ci <= 2; ci++) {
          const x = 2 + (26 / 3) * ci
          out += `<line x1="${f2(onPlatform(x, 3, 4.1)[0])}" y1="${f2(onPlatform(x, 3, 4.1)[1])}" x2="${f2(onPlatform(x, 25, 4.1)[0])}" y2="${f2(onPlatform(x, 25, 4.1)[1])}" stroke="${shade(C.slate, 0.35)}" stroke-width="0.8"/>`
        }
        return out
      })(),
  }))

// 20 — Report: standing page with folded corner and mini chart.
icon('report', '3D Report', ['report', 'document', 'page', 'summary'],
  'Isometric report page with folded corner and chart blocks.', (g) => ({
    defs: platformDefs(g(1)) + gradient(g(2), '#FFFFFF', shade(C.paper, -0.03)),
    body:
      platform(g(1)) +
      box(24, 33, 20, 3, 28, shade(C.paper, -0.2), `url(#${g(2)})`) +
      // page face (left face, plane y=3): from world (0,3,z) to (20,3,z)
      polygon([[15, 22.5], [24, 27.7], [24, 34.7], [15, 29.5]], `url(#${g(2)})`) +
      polygon([[16.6, 26.2], [22.4, 29.5], [22.4, 31], [16.6, 27.7]], C.indigo) +
      polygon([[16.6, 29.2], [20.4, 31.4], [20.4, 32.6], [16.6, 30.4]], C.teal) +
      polygon([[16.6, 32], [21.4, 34.7], [21.4, 35.9], [16.6, 33.2]], C.orange) +
      polygon([[24, 6.9], [26.5, 8.3], [24, 9.8]], shade(C.paper, -0.32)),
  }))

// 21 — Insights: bars examined through a lens.
icon('insights', '3D Insights', ['insight', 'discovery', 'magnifier', 'explore'],
  'Isometric bars examined through a translucent magnifier lens.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      column(3, 6, 6, 9, C.slate) +
      column(10, 12, 6, 14, C.cyan) +
      column(17, 18, 6, 19, C.indigo) +
      `<circle cx="40" cy="22" r="9.5" fill="rgba(255,255,255,0.28)" stroke="${C.ink}" stroke-width="2.4"/>` +
      `<line x1="46.8" y1="28.8" x2="53.5" y2="35.5" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round"/>`,
  }))

// 22 — AI analytics: processor cube with circuit traces.
icon('ai-analytics', '3D AI Analytics', ['ai', 'machine learning', 'chip', 'intelligence'],
  'Isometric AI processor cube with glowing circuit traces.', (g) => {
    const ox = 32
    const oy = 39
    const s = 17
    const P = proj(ox, oy)
    const trace = (a, b, color) =>
      `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" stroke="${color}" stroke-width="1.1" stroke-linecap="round"/>`
    const node = (p, color) => `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="1.5" fill="${color}"/>`
    return {
      defs: gradient(g(1), shade(C.purple, 0.28), shade(C.purple, 0.05)),
      body:
        shadow(32, 51.5, 21, 5.2, 0.12) +
        box(ox, oy, s, s, s, C.purple, `url(#${g(1)})`) +
        trace(P(4, 4, s), P(13, 4, s), shade(C.gold, 0.1)) + node(P(13, 4, s), C.gold) +
        trace(P(4, 4, s), P(4, 13, s), shade(C.gold, 0.1)) + node(P(4, 13, s), C.gold) +
        trace(P(8.5, 8.5, s), P(13, 13, s), '#FFFFFF') + node(P(8.5, 8.5, s), '#FFFFFF') +
        trace(P(s, 5, 12), P(s, 12, 12), 'rgba(255,255,255,0.75)') + node(P(s, 12, 12), '#FFFFFF') +
        trace(P(s, 5, 12), P(s, 5, 5), 'rgba(255,255,255,0.75)') + node(P(s, 5, 5), '#FFFFFF') +
        trace(P(5, s, 10), P(12, s, 10), 'rgba(255,255,255,0.6)') + node(P(12, s, 10), 'rgba(255,255,255,0.9)'),
    }
  })

// 23 — Cloud analytics: cloud volume hovering over columns.
icon('cloud-analytics', '3D Cloud Analytics', ['cloud', 'saas', 'hosted', 'analytics'],
  'Isometric cloud volume hovering above analytics columns.', (g) => ({
    defs: platformDefs(g(1)) + gradient(g(2), '#FFFFFF', shade(C.cyan, 0.55)),
    body:
      platform(g(1)) +
      column(4, 8, 6, 8, C.cyan) +
      column(12, 14, 6, 12, C.indigo) +
      column(19, 20, 6, 7, C.teal) +
      `<g><ellipse cx="27" cy="13" rx="9" ry="5.6" fill="url(#${g(2)})"/>` +
      `<ellipse cx="36.5" cy="11.5" rx="7.6" ry="5" fill="url(#${g(2)})"/>` +
      `<ellipse cx="44" cy="14" rx="6.6" ry="4.4" fill="url(#${g(2)})"/>` +
      `<rect x="22" y="12.5" width="27" height="5.4" rx="2.7" fill="url(#${g(2)})"/></g>` +
      `<ellipse cx="35" cy="18.6" rx="13" ry="1.6" fill="${shade(C.cyan, -0.05)}" opacity="0.35"/>`,
  }))

// 24 — Data pipeline: staged cubes linked by flow arrows.
icon('data-pipeline', '3D Data Pipeline', ['pipeline', 'etl', 'flow', 'integration'],
  'Isometric ETL pipeline of staged cubes with flow arrows.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      (() => {
        const c1 = onPlatform(1, 22)
        const c2 = onPlatform(11, 12)
        const c3 = onPlatform(21, 2)
        return (
          box(c1[0], c1[1], 7, 7, 7, C.teal) +
          box(c2[0], c2[1], 7, 7, 7, C.indigo) +
          box(c3[0], c3[1], 7, 7, 7, C.purple) +
          arrow(...onPlatform(9, 24, 4), ...onPlatform(13.4, 20.2, 4), 2, C.ink) +
          arrow(...onPlatform(19, 14, 4), ...onPlatform(23.4, 10.2, 4), 2, C.ink)
        )
      })(),
  }))

// 25 — Geographic analytics: hemisphere globe with meridians and pin.
icon('geographic-analytics', '3D Geographic Analytics', ['map', 'geo', 'regions', 'location'],
  'Isometric globe dome with meridians and a location pin.', (g) => ({
    defs: platformDefs(g(1)) + gradient(g(2), shade(C.cyan, 0.35), shade(C.cyan, -0.02)),
    body:
      platform(g(1)) +
      `<path d="M 15 31 a 17 17 0 0 1 34 0 a 17 8.5 0 0 1 -34 0 Z" fill="url(#${g(2)})"/>` +
      `<ellipse cx="32" cy="31" rx="17" ry="8.5" fill="${shade(C.cyan, 0.12)}" opacity="0.5"/>` +
      `<path d="M 32 14 a 9.5 17 0 0 0 0 25.4 a 17 8.5 0 0 0 0 -25.4 Z" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="0.9"/>` +
      `<path d="M 17.5 25.5 a 21 7.5 0 0 0 29 0" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="0.9"/>` +
      `<path d="M 41 8 a 5.2 5.2 0 0 0 -5.2 5.2 c 0 3.8 5.2 9.3 5.2 9.3 s 5.2 -5.5 5.2 -9.3 A 5.2 5.2 0 0 0 41 8 Z" fill="${C.red}"/>` +
      `<circle cx="41" cy="13.2" r="2.1" fill="#FFFFFF"/>`,
  }))

// 26 — Revenue: gold coin stacks with rising arrow.
icon('revenue', '3D Revenue', ['revenue', 'income', 'money', 'coins'],
  'Isometric gold coin stacks with an upward revenue arrow.', (g) => ({
    defs: platformDefs(g(1)) + gradient(g(2), shade(C.gold, 0.4), shade(C.gold, 0.08)),
    body:
      platform(g(1)) +
      cylinder(18, 47, 9, 4.4, 7, shade(C.gold, -0.08), `url(#${g(2)})`) +
      cylinder(18, 39, 9, 4.4, 7, shade(C.gold, -0.02), `url(#${g(2)})`) +
      cylinder(36, 45, 9, 4.4, 7, shade(C.gold, -0.08), `url(#${g(2)})`) +
      cylinder(36, 37, 9, 4.4, 7, shade(C.gold, -0.02), `url(#${g(2)})`) +
      cylinder(36, 29, 9, 4.4, 7, shade(C.gold, 0.06), `url(#${g(2)})`) +
      arrow(14, 26, 44, 8, 3, C.teal),
  }))

// 27 — Profit: ascending margin bars with a crowned coin.
icon('profit', '3D Profit', ['profit', 'margin', 'earnings', 'gain'],
  'Isometric margin bars crowned by a floating gold coin.', (g) => ({
    defs: platformDefs(g(1)) + gradient(g(2), shade(C.gold, 0.42), shade(C.gold, 0.1)),
    body:
      platform(g(1)) +
      column(2, 18, 7, 8, shade(C.teal, 0.16)) +
      column(10, 12, 7, 13, shade(C.teal, 0.04)) +
      column(18, 6, 7, 18, C.teal) +
      shadow(...onPlatform(21.5, 9.5, 18.1), 6, 2.2, 0.16) +
      cylinder(...onPlatform(21.5, 9.5, 25), 7, 3.4, 4.6, shade(C.gold, -0.05), `url(#${g(2)})`) +
      `<ellipse cx="${f2(onPlatform(21.5, 9.5, 25)[0])}" cy="${f2(onPlatform(21.5, 9.5, 25)[1] - 4.6)}" rx="4.4" ry="2.1" fill="none" stroke="${shade(C.gold, -0.3)}" stroke-width="1"/>`,
  }))

// 28 — Performance: winners podium with a star.
icon('performance', '3D Performance', ['performance', 'podium', 'ranking', 'winner'],
  'Isometric winners podium with a floating gold star.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      column(1, 5, 9, 11, C.cyan) +
      column(11, 11, 9, 17, C.indigo) +
      column(21, 17, 9, 7, C.teal) +
      (() => {
        const [cx, cy] = onPlatform(15.5, 15.5, 27)
        const starPts = []
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? 5.6 : 2.4
          const a = -Math.PI / 2 + (i * Math.PI) / 5
          starPts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
        }
        return polygon(starPts, C.gold) + polygon(starPts.map(([x, y]) => [x + 0.001, y]), 'none', ` stroke="${shade(C.gold, -0.25)}" stroke-width="0.8"`)
      })(),
  }))

// 29 — Comparison: two facing bar groups with opposing arrows.
icon('comparison', '3D Comparison', ['comparison', 'versus', 'benchmark', 'ab'],
  'Isometric A/B bar groups with opposing comparison arrows.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      column(2, 4, 7, 16, C.indigo) +
      column(10, 4, 7, 10, shade(C.indigo, 0.2)) +
      column(2, 19, 7, 9, shade(C.orange, 0.08)) +
      column(10, 19, 7, 14, C.orange) +
      arrow(38, 22, 50, 22, 2.4, C.indigo) +
      arrow(50, 28, 38, 28, 2.4, C.orange),
  }))

// 30 — Segmentation: pie exploded into three separated wedges.
icon('segmentation', '3D Segmentation', ['segments', 'clusters', 'split', 'groups'],
  'Isometric pie exploded into three separated segment wedges.', (g) => ({
    defs: platformDefs(g(1)),
    body:
      platform(g(1)) +
      // three wedges pushed out from center (32, 28)
      ellipseWall(27.4, 25.4, 0.01, 0.01, 0, 'none') +
      `<path d="M 28.4 25.6 L 12.7 25.6 A 15.5 8 0 0 1 24 18.3 Z" fill="${shade(C.indigo, 0.05)}"/>` +
      `<path d="M 28.4 25.6 L 24 18.3 A 15.5 8 0 0 1 43 20.9 Z" fill="${shade(C.indigo, 0.22)}"/>` +
      `<path d="M 36.2 30.6 L 51.5 27.4 A 15.5 8 0 0 1 33 38.4 Z" fill="${shade(C.teal, 0.08)}"/>` +
      `<path d="M 36.2 30.6 L 33 38.4 A 15.5 8 0 0 1 22.2 34.9 L 30 28.4 Z" fill="${shade(C.orange, 0.05)}"/>` +
      `<path d="M 12.7 25.6 h 15.7 v 4.6 h -15.7 Z" fill="${shade(C.indigo, -0.18)}" opacity="0.85"/>` +
      `<path d="M 22.2 34.9 L 30 28.4 v 4.6 l -7.8 6.5 Z" fill="${shade(C.orange, -0.2)}" opacity="0.85"/>` +
      `<path d="M 33 38.4 v 4.6 a 15.5 8 0 0 0 18.5 -11 v -4.6" fill="${shade(C.teal, -0.2)}" opacity="0.5"/>`,
  }))

// ─── mono silhouettes + emit ─────────────────────────────────────────────────

/** Fallback monochrome silhouette: same geometry, all paint → currentColor.
 *  Fixed 3D icons always render in multicolor; this exists only to satisfy
 *  the IconConcept contract and mono-only pipelines. */
function toSilhouette(svg) {
  return svg
    .replace(/<defs>[\s\S]*?<\/defs>/g, '')
    .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
    .replace(/stroke="(?!none)[^"]*"/g, 'stroke="currentColor"')
    .replace(/\sopacity="[^"]*"/g, '')
}

const concepts = ICONS.map(({ slug, name, keywords, description, svg }) => ({
  id: `v2-3d-${slug}`,
  name,
  primaryCategory: 'analytics-3d',
  keywords: [...new Set(['3d', 'isometric', 'analytics', ...keywords])],
  aliases: [],
  description,
  recommendedUses: ['Dashboard hero headers', 'Landing and cover pages', 'Navigation tiles'],
  viewBox: '0 0 64 64',
  monochromeSvg: toSilhouette(svg),
  multicolorSvg: svg,
  fixedColors: true,
  source: 'authored',
}))

const banner = `// GENERATED by scripts/generate-3d-analytics-icons.mjs — do not edit by hand.
// Curated fixed-color 3D Analytics icons (isometric, layered vector geometry,
// controlled gradients, no external assets). These are ORIGINAL MULTICOLOR
// icons with fixedColors: true — never recolored, no color controls.
import type { IconConcept } from '@/lib/icon-library/types'

export const ANALYTICS_3D_CONCEPTS: IconConcept[] = `

const outFile = path.join(rootDir, 'src', 'data', 'icon-library', 'analytics3d.ts')
fs.writeFileSync(outFile, banner + JSON.stringify(concepts, null, 2) + '\n')
console.log(`Wrote ${concepts.length} 3D Analytics concepts → ${path.relative(rootDir, outFile)}`)

// Sanity: unique gradient ids per icon, no unsafe elements.
let failed = false
for (const c of concepts) {
  if (/<(script|image|text|foreignObject|filter|use)\b/i.test(c.multicolorSvg)) {
    console.error(`UNSAFE element in ${c.id}`)
    failed = true
  }
  const ids = [...c.multicolorSvg.matchAll(/id="([^"]+)"/g)].map((m) => m[1])
  if (new Set(ids).size !== ids.length) {
    console.error(`Duplicate gradient ids in ${c.id}`)
    failed = true
  }
  for (const other of concepts) {
    if (other === c) continue
    const otherIds = new Set([...other.multicolorSvg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]))
    for (const id of ids) if (otherIds.has(id)) { console.error(`Gradient id "${id}" shared by ${c.id} and ${other.id}`); failed = true }
  }
}
if (failed) process.exitCode = 1
