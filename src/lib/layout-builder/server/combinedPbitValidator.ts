import { normalizeMultiPagePayload } from "./layoutValidator";
import type { CombinedIconBundle, CombinedIconCustomization } from "./combinedPbitService";
import type { NormalizedPage } from "./types";

export interface NormalizedCombinedPayload {
  pages: NormalizedPage[];
  iconBundle?: CombinedIconBundle;
  themeJSON?: unknown;
}

const WEIGHTS = ["thin", "regular", "medium", "bold"];
const COLOR_MODES = ["mono", "duotone", "tritone", "multicolor"];
const STYLES = ["precision", "softline", "framework", "heritage"];
const BG_MODES = ["solid", "gradient", "none"];
const BG_SHAPES = ["none", "softtile", "rounded", "capsule", "circle"];
const MAX_ICONS = 2000;

export function normalizeCombinedPayload(payload: unknown): NormalizedCombinedPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid request body: expected a JSON object.");
  }

  const body = payload as Record<string, unknown>;
  if (!Array.isArray(body.pages) || body.pages.length === 0) {
    throw new Error("Invalid request body: pages must be a non-empty array.");
  }

  const { pages } = normalizeMultiPagePayload({ pages: body.pages });

  const options = body.options && typeof body.options === "object" ? (body.options as Record<string, unknown>) : {};
  const includeIcons = options.includeIcons !== false;
  const includeTheme = options.includeTheme !== false;

  let iconBundle: CombinedIconBundle | undefined;
  if (includeIcons && body.iconBundle && typeof body.iconBundle === "object") {
    iconBundle = normalizeIconBundle(body.iconBundle as Record<string, unknown>);
  }

  const themeJSON = includeTheme && body.themeJSON && typeof body.themeJSON === "object" ? body.themeJSON : undefined;

  return { pages, iconBundle, themeJSON };
}

function normalizeIconBundle(raw: Record<string, unknown>): CombinedIconBundle {
  if (!Array.isArray(raw.iconIds) || raw.iconIds.some((id) => typeof id !== "string")) {
    throw new Error("Invalid request body: iconBundle.iconIds must be an array of strings.");
  }
  if (raw.iconIds.length === 0) {
    throw new Error("Invalid request body: iconBundle.iconIds must not be empty.");
  }
  if (raw.iconIds.length > MAX_ICONS) {
    throw new Error(`Invalid request body: maximum ${MAX_ICONS} icons allowed.`);
  }

  const customization = normalizeCustomization(raw.customization, "iconBundle.customization", false) as CombinedIconCustomization;

  let perIconOverrides: Record<string, Partial<CombinedIconCustomization>> | undefined;
  if (raw.perIconOverrides && typeof raw.perIconOverrides === "object") {
    perIconOverrides = {};
    for (const [iconId, override] of Object.entries(raw.perIconOverrides as Record<string, unknown>)) {
      if (override && typeof override === "object") {
        perIconOverrides[iconId] = normalizeCustomization(override, `perIconOverrides.${iconId}`, true);
      }
    }
  }

  return { iconIds: raw.iconIds as string[], customization, perIconOverrides };
}

function normalizeCustomization(raw: unknown, label: string, partial: boolean): Partial<CombinedIconCustomization> {
  if (!raw || typeof raw !== "object") {
    if (partial) return {};
    throw new Error(`Invalid request body: ${label} is required.`);
  }

  const c = raw as Record<string, unknown>;
  const result: Partial<CombinedIconCustomization> = {};

  if (c.iconColor !== undefined) {
    if (typeof c.iconColor !== "string") throw new Error(`Invalid request body: ${label}.iconColor must be a string.`);
    result.iconColor = c.iconColor;
  } else if (!partial) result.iconColor = "#0D9488";

  if (c.weight !== undefined) {
    if (!WEIGHTS.includes(c.weight as string)) throw new Error(`Invalid request body: ${label}.weight must be one of ${WEIGHTS.join(", ")}.`);
    result.weight = c.weight as CombinedIconCustomization["weight"];
  } else if (!partial) result.weight = "regular";

  if (c.style !== undefined) {
    if (!STYLES.includes(c.style as string)) throw new Error(`Invalid request body: ${label}.style must be one of ${STYLES.join(", ")}.`);
    result.style = c.style as CombinedIconCustomization["style"];
  } else if (!partial) result.style = "framework";

  if (c.backgroundMode !== undefined) {
    if (!BG_MODES.includes(c.backgroundMode as string)) {
      throw new Error(`Invalid request body: ${label}.backgroundMode must be one of ${BG_MODES.join(", ")}.`);
    }
    result.backgroundMode = c.backgroundMode as CombinedIconCustomization["backgroundMode"];
  } else if (!partial) result.backgroundMode = "none";

  if (c.solidBackgroundColor !== undefined) {
    if (typeof c.solidBackgroundColor !== "string") throw new Error(`Invalid request body: ${label}.solidBackgroundColor must be a string.`);
    result.solidBackgroundColor = c.solidBackgroundColor;
  } else if (!partial) result.solidBackgroundColor = "#FFFFFF";

  if (c.bgOpacity !== undefined) {
    if (typeof c.bgOpacity !== "number" || !Number.isFinite(c.bgOpacity)) throw new Error(`Invalid request body: ${label}.bgOpacity must be a number.`);
    result.bgOpacity = c.bgOpacity;
  } else if (!partial) result.bgOpacity = 100;

  if (c.bgShape !== undefined) {
    if (!BG_SHAPES.includes(c.bgShape as string)) throw new Error(`Invalid request body: ${label}.bgShape must be one of ${BG_SHAPES.join(", ")}.`);
    result.bgShape = c.bgShape as CombinedIconCustomization["bgShape"];
  } else if (!partial) result.bgShape = "rounded";

  if (c.gradient !== undefined) {
    if (c.gradient !== null) {
      const g = c.gradient as Record<string, unknown>;
      if (
        typeof g?.code !== "string" ||
        typeof g?.name !== "string" ||
        !Array.isArray(g.stops) ||
        g.stops.length === 0 ||
        g.stops.some((stop) => typeof stop !== "string")
      ) {
        throw new Error(`Invalid request body: ${label}.gradient is malformed.`);
      }
    }
    result.gradient = c.gradient as CombinedIconCustomization["gradient"];
  } else if (!partial) result.gradient = null;

  if (c.padding !== undefined) {
    if (typeof c.padding !== "number" || !Number.isFinite(c.padding)) throw new Error(`Invalid request body: ${label}.padding must be a number.`);
    result.padding = c.padding;
  } else if (!partial) result.padding = 10;

  if (c.size !== undefined) {
    if (typeof c.size !== "number" || !Number.isFinite(c.size)) throw new Error(`Invalid request body: ${label}.size must be a number.`);
    result.size = c.size;
  } else if (!partial) result.size = 28;

  if (c.colorMode !== undefined) {
    if (!COLOR_MODES.includes(c.colorMode as string)) {
      throw new Error(`Invalid request body: ${label}.colorMode must be one of ${COLOR_MODES.join(", ")}.`);
    }
    result.colorMode = c.colorMode as CombinedIconCustomization["colorMode"];
  }

  // Legacy payloads may still include colorSlots — the color-slot engine was
  // removed (final color-mode decision), so the field is silently ignored.

  return result;
}
