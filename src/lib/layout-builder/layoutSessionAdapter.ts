import type { ReportState } from './types/layout'

/**
 * Consume-once sessionStorage snapshot so the Layout Builder's local useState
 * (pages, zones, selection) survives a round trip to Icon Studio or Theme
 * Builder. This is intentionally NOT part of the main Theme Studio store —
 * Layout Builder keeps owning its own state; this is just a temporary parking
 * spot for it during navigation.
 */
const SESSION_KEY = 'dc-layout-builder-session'

/**
 * v1 (implicit, unversioned): pages without titleLayout / kpiIcons / titleIcon.
 * v2 (2026-07-04): titleLayout ('full' default), per-page kpiIcons ({} = none)
 * and titleIcon (null = none). Old snapshots migrate on consume — existing
 * page ids, zone ids and visual assignments are never altered.
 */
export const LAYOUT_SESSION_SCHEMA_VERSION = 2

interface LayoutSessionSnapshot {
  schemaVersion?: number
  reportState: ReportState
  selectedZoneId: string | null
  selectedZoneIds: string[]
  includeTheme: boolean
}

/** Backfills v2 defaults on any snapshot (idempotent for current snapshots). */
function migrateSnapshot(snapshot: LayoutSessionSnapshot): LayoutSessionSnapshot {
  if ((snapshot.schemaVersion ?? 1) >= LAYOUT_SESSION_SCHEMA_VERSION) return snapshot
  return {
    ...snapshot,
    schemaVersion: LAYOUT_SESSION_SCHEMA_VERSION,
    reportState: {
      ...snapshot.reportState,
      pages: snapshot.reportState.pages.map((page) => ({
        ...page,
        layoutState: { titleLayout: 'full', ...page.layoutState },
        kpiIcons: page.kpiIcons ?? {},
        titleIcon: page.titleIcon ?? null,
      })),
    },
  }
}

export function saveLayoutSessionSnapshot(snapshot: Omit<LayoutSessionSnapshot, 'schemaVersion'>): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...snapshot, schemaVersion: LAYOUT_SESSION_SCHEMA_VERSION }),
    )
  } catch {
    /* sessionStorage unavailable — navigation still works, just without restore */
  }
}

/** Reads and removes the pending snapshot — restores at most once per round trip. */
export function consumeLayoutSessionSnapshot(): LayoutSessionSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    window.sessionStorage.removeItem(SESSION_KEY)
    return migrateSnapshot(JSON.parse(raw) as LayoutSessionSnapshot)
  } catch {
    return null
  }
}
