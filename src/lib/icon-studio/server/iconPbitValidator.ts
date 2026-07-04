import type { IconExportSource } from "./iconPbitService";

const MAX_ICONS = 2000;
const MAX_SVG_LENGTH = 200_000;
const FORBIDDEN_SVG_PATTERN = /<script|javascript:|<!ENTITY|xlink:href\s*=\s*["']https?:/i;

export function normalizeIconExportPayload(payload: unknown): IconExportSource[] {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid request body: expected a JSON object.");
  }

  const body = payload as Record<string, unknown>;
  if (!Array.isArray(body.icons)) {
    throw new Error("Invalid request body: icons must be an array.");
  }

  if (body.icons.length === 0) {
    throw new Error("No icons selected for Power BI template export.");
  }

  if (body.icons.length > MAX_ICONS) {
    throw new Error(`Invalid request body: maximum ${MAX_ICONS} icons allowed.`);
  }

  return body.icons.map((rawIcon: unknown, index: number) => normalizeIcon(rawIcon, index));
}

function normalizeIcon(rawIcon: unknown, index: number): IconExportSource {
  if (!rawIcon || typeof rawIcon !== "object") {
    throw new Error(`Invalid request body: icon ${index + 1} is not an object.`);
  }

  const icon = rawIcon as Record<string, unknown>;
  const id = typeof icon.id === "string" ? icon.id.trim() : "";
  const name = typeof icon.name === "string" ? icon.name.trim() : "";
  const svg = typeof icon.svg === "string" ? icon.svg.trim() : "";

  if (!id) throw new Error(`Invalid request body: icon ${index + 1} is missing an id.`);
  if (!name) throw new Error(`Invalid request body: icon ${index + 1} is missing a name.`);
  if (!svg) throw new Error(`Invalid request body: icon ${index + 1} is missing rendered SVG content.`);
  if (svg.length > MAX_SVG_LENGTH) {
    throw new Error(`Invalid request body: icon ${index + 1} SVG content is too large.`);
  }
  if (!/^<svg[\s>]/i.test(svg)) {
    throw new Error(`Invalid request body: icon ${index + 1} is not a valid inline <svg> element.`);
  }
  if (FORBIDDEN_SVG_PATTERN.test(svg)) {
    throw new Error(`Invalid request body: icon ${index + 1} contains a disallowed script or external reference.`);
  }

  return { id, name, svg };
}
