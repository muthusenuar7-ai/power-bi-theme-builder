'use client'

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { LayoutState } from "@/lib/layout-builder/types/layout";
import {
  DEFAULT_SLICER_SIDE_WIDTH,
  DEFAULT_SLICER_TOP_HEIGHT,
  getArrangementOptions,
  minTitleHeightForFontSize,
} from "@/lib/layout-builder/layoutEngine";

interface LayoutControlsProps {
  state: LayoutState;
  onChange: (next: LayoutState) => void;
}

const canvasPresets = [
  { label: "Full HD", width: 1920, height: 1080 },
  { label: "16:9 HD", width: 1280, height: 720 },
  { label: "1366x768", width: 1366, height: 768 },
];

const TITLE_SIZE_PRESETS = [
  { label: "Small",  value: 22 },
  { label: "Medium", value: 28 },
  { label: "Large",  value: 36 },
] as const;

const KPI_SIZE_PRESETS = [
  { label: "Small",  value: 80 },
  { label: "Medium", value: 110 },
  { label: "Large",  value: 140 },
] as const;

const SLICER_HEIGHT_PRESETS = [
  { label: "Small",  value: 40 },
  { label: "Medium", value: DEFAULT_SLICER_TOP_HEIGHT },
  { label: "Large",  value: 72 },
] as const;

const SLICER_WIDTH_PRESETS = [
  { label: "Small",  value: 160 },
  { label: "Medium", value: DEFAULT_SLICER_SIDE_WIDTH },
  { label: "Large",  value: 260 },
] as const;

const SLICER_HEIGHT_MIN = 32;
const SLICER_HEIGHT_MAX = 180;
const SLICER_WIDTH_MIN = 120;
const SLICER_WIDTH_MAX = 360;
const TITLE_HEIGHT_MIN = 8;

export function LayoutControls({ state, onChange }: LayoutControlsProps) {
  const arrangementOptions = getArrangementOptions(state.chartCount);
  const update = (patch: Partial<LayoutState>) => onChange({ ...state, ...patch });
  const titleFontSize = state.titleFontSize ?? 28;
  const titleHeight = state.titleHeight ?? 64;
  const zoneGap = state.zoneGap ?? 10;
  const slicerTopHeight = state.slicerTopHeight ?? DEFAULT_SLICER_TOP_HEIGHT;
  const slicerSideWidth = state.slicerSideWidth ?? DEFAULT_SLICER_SIDE_WIDTH;
  const [titleFontSizeDraft, setTitleFontSizeDraft] = useState(() => String(titleFontSize));
  const [titleHeightDraft, setTitleHeightDraft] = useState(() => String(titleHeight));
  const [slicerTopHeightDraft, setSlicerTopHeightDraft] = useState(() => String(slicerTopHeight));
  const [slicerSideWidthDraft, setSlicerSideWidthDraft] = useState(() => String(slicerSideWidth));

  useEffect(() => {
    setTitleFontSizeDraft(String(titleFontSize));
  }, [titleFontSize]);

  useEffect(() => {
    setTitleHeightDraft(String(titleHeight));
  }, [titleHeight]);

  useEffect(() => {
    setSlicerTopHeightDraft(String(slicerTopHeight));
  }, [slicerTopHeight]);

  useEffect(() => {
    setSlicerSideWidthDraft(String(slicerSideWidth));
  }, [slicerSideWidth]);

  const setChartCount = (chartCount: number) => {
    const bounded = clamp(chartCount, 1, 12);
    const options = getArrangementOptions(bounded);
    const stillValid = options.some((option) => option.value === state.chartLayout);
    update({ chartCount: bounded, chartLayout: stillValid ? state.chartLayout : options[0].value });
  };

  /** Change title font size and auto-increase titleHeight if needed. */
  const handleTitleFontSizeChange = (fontSize: number) => {
    const bounded = Math.max(8, Math.round(fontSize));
    const minH = minTitleHeightForFontSize(bounded);
    const newHeight = Math.max(state.titleHeight, minH);
    update({ titleFontSize: bounded, titleHeight: newHeight });
  };

  const commitTitleFontSizeDraft = () => {
    const parsed = parseDraftNumber(titleFontSizeDraft);
    if (parsed === null) {
      setTitleFontSizeDraft(String(titleFontSize));
      return;
    }

    const bounded = Math.max(8, Math.round(parsed));
    handleTitleFontSizeChange(bounded);
    setTitleFontSizeDraft(String(bounded));
  };

  const handleTitleFontSizeDraftChange = (value: string) => {
    setTitleFontSizeDraft(value);
    const parsed = parseDraftNumber(value);
    if (parsed !== null && parsed >= 8) {
      handleTitleFontSizeChange(parsed);
    }
  };

  const setTitleHeight = (height: number) => {
    update({ titleHeight: Math.max(TITLE_HEIGHT_MIN, Math.round(height)) });
  };

  const commitTitleHeightDraft = () => {
    const parsed = parseDraftNumber(titleHeightDraft);
    if (parsed === null) {
      setTitleHeightDraft(String(titleHeight));
      return;
    }

    const bounded = Math.max(TITLE_HEIGHT_MIN, Math.round(parsed));
    setTitleHeight(bounded);
    setTitleHeightDraft(String(bounded));
  };

  const handleTitleHeightDraftChange = (value: string) => {
    setTitleHeightDraft(value);
    const parsed = parseDraftNumber(value);
    if (parsed !== null && parsed >= TITLE_HEIGHT_MIN) {
      setTitleHeight(parsed);
    }
  };

  const setSlicerTopHeight = (height: number) => {
    update({ slicerTopHeight: clamp(Math.round(height), SLICER_HEIGHT_MIN, SLICER_HEIGHT_MAX) });
  };

  const setSlicerSideWidth = (width: number) => {
    update({ slicerSideWidth: clamp(Math.round(width), SLICER_WIDTH_MIN, SLICER_WIDTH_MAX) });
  };

  const commitSlicerTopHeightDraft = () => {
    commitDimensionDraft(
      slicerTopHeightDraft,
      slicerTopHeight,
      SLICER_HEIGHT_MIN,
      SLICER_HEIGHT_MAX,
      setSlicerTopHeight,
      setSlicerTopHeightDraft,
    );
  };

  const commitSlicerSideWidthDraft = () => {
    commitDimensionDraft(
      slicerSideWidthDraft,
      slicerSideWidth,
      SLICER_WIDTH_MIN,
      SLICER_WIDTH_MAX,
      setSlicerSideWidth,
      setSlicerSideWidthDraft,
    );
  };

  const handleSlicerTopHeightDraftChange = (value: string) => {
    setSlicerTopHeightDraft(value);
    const parsed = parseDraftNumber(value);
    if (parsed !== null && parsed >= SLICER_HEIGHT_MIN) {
      setSlicerTopHeight(parsed);
    }
  };

  const handleSlicerSideWidthDraftChange = (value: string) => {
    setSlicerSideWidthDraft(value);
    const parsed = parseDraftNumber(value);
    if (parsed !== null && parsed >= SLICER_WIDTH_MIN) {
      setSlicerSideWidth(parsed);
    }
  };

  return (
    <aside className="left-panel">
      <div className="panel-title">Layout</div>
      <div className="panel-content">

        {/* ── Canvas ──────────────────────────────────────────────────── */}
        <AccordionSection defaultOpen label="Canvas">
          <div className="ctrl-stack">
            <label className="form-row">
              <span className="form-label">Width (px)</span>
              <input
                className="ctrl"
                max={3840}
                min={800}
                type="number"
                value={state.canvasWidth}
                onChange={(event) => update({ canvasWidth: toNumber(event.target.value, 1280) })}
              />
            </label>
            <label className="form-row">
              <span className="form-label">Height (px)</span>
              <input
                className="ctrl"
                max={2160}
                min={400}
                type="number"
                value={state.canvasHeight}
                onChange={(event) => update({ canvasHeight: toNumber(event.target.value, 720) })}
              />
            </label>
          </div>
          <div className="form-row">
            <span className="form-label">Preset</span>
            <div className="chip-group">
              {canvasPresets.map((preset) => (
                <button
                  className={`chip ${
                    state.canvasWidth === preset.width && state.canvasHeight === preset.height ? "sel" : ""
                  }`}
                  key={preset.label}
                  onClick={() => update({ canvasWidth: preset.width, canvasHeight: preset.height })}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </AccordionSection>

        {/* ── Spacing ─────────────────────────────────────────────────── */}
        <AccordionSection defaultOpen label="Spacing">
          <label className="form-row">
            <span className="form-label">Spacing (px)</span>
            <input
              className="ctrl"
              max={40}
              min={0}
              type="number"
              value={zoneGap}
              onChange={(event) => update({ zoneGap: clamp(toNumber(event.target.value, 10), 0, 40) })}
            />
          </label>
          <div className="form-row">
            <span className="form-label">Presets</span>
            <div className="chip-group">
              {[
                { label: "Tight", value: 4 },
                { label: "Normal", value: 10 },
                { label: "Wide", value: 20 },
              ].map((preset) => (
                <button
                  className={`chip ${zoneGap === preset.value ? "sel" : ""}`}
                  key={preset.label}
                  onClick={() => update({ zoneGap: preset.value })}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </AccordionSection>

        {/* ── Title Bar ───────────────────────────────────────────────── */}
        <AccordionSection defaultOpen label="Title Bar">
          <div className="form-row">
            <div className="chip-group">
              {[
                ["top", "Top"],
                ["left", "Left"],
                ["right", "Right"],
                ["none", "None"],
              ].map(([value, label]) => (
                <button
                  className={`chip ${state.titlePos === value ? "sel" : ""}`}
                  key={value}
                  onClick={() => update({ titlePos: value as LayoutState["titlePos"] })}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {state.titlePos === "top" && (
            <div className="form-row">
              <span className="form-label">Title Layout</span>
              <div className="chip-group">
                {([
                  ["full", "Full Width"],
                  ["title-kpis", "Title + KPIs"],
                  ["title-slicers", "Title + Slicers"],
                ] as const).map(([value, label]) => (
                  <button
                    className={`chip ${(state.titleLayout ?? "full") === value ? "sel" : ""}`}
                    disabled={(value === "title-kpis" && state.kpiCount === 0) || (value === "title-slicers" && state.slicerCount === 0)}
                    key={value}
                    title={value === "title-kpis" && state.kpiCount === 0
                      ? "Add KPI cards first"
                      : value === "title-slicers" && state.slicerCount === 0
                        ? "Add slicers first"
                        : label}
                    type="button"
                    onClick={() => update({ titleLayout: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {state.titlePos !== "top" && (state.titleLayout ?? "full") !== "full" && (
            <div className="form-row">
              <span className="form-label" style={{ opacity: 0.7 }}>
                Shared top-row layouts apply only when the title is at the top — using Full Width.
              </span>
            </div>
          )}
          {state.titlePos !== "none" && (
            <>
              <label className="form-row">
                <span className="form-label">Report Name</span>
                <input
                  className="ctrl"
                  type="text"
                  value={state.reportName}
                  onChange={(event) => update({ reportName: event.target.value })}
                />
              </label>
              <label className="form-row">
                <span className="form-label">Title Size (px)</span>
                <input
                  className="ctrl"
                  min={8}
                  type="number"
                  value={titleFontSizeDraft}
                  onBlur={commitTitleFontSizeDraft}
                  onChange={(event) => handleTitleFontSizeDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                />
              </label>
              <div className="form-row">
                <span className="form-label">Size Presets</span>
                <div className="chip-group">
                  {TITLE_SIZE_PRESETS.map((preset) => (
                    <button
                      className={`chip ${titleFontSize === preset.value ? "sel" : ""}`}
                      key={preset.label}
                      type="button"
                      onClick={() => handleTitleFontSizeChange(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              {state.titlePos === "top" && (
                <label className="form-row">
                  <span className="form-label">Height (px)</span>
                  <input
                    className="ctrl"
                    min={TITLE_HEIGHT_MIN}
                    type="number"
                    value={titleHeightDraft}
                    onBlur={commitTitleHeightDraft}
                    onChange={(event) => handleTitleHeightDraftChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                  />
                </label>
              )}
              {(state.titlePos === "left" || state.titlePos === "right") && (
                <label className="form-row">
                  <span className="form-label">Width (px)</span>
                  <input
                    className="ctrl"
                    max={400}
                    min={80}
                    type="number"
                    value={state.titleWidth}
                    onChange={(event) => update({ titleWidth: toNumber(event.target.value, 180) })}
                  />
                </label>
              )}
            </>
          )}
        </AccordionSection>

        {/* ── KPI Cards ───────────────────────────────────────────────── */}
        <AccordionSection label="KPI Cards">
          <div className="form-row">
            <span className="form-label">Placement</span>
            <select
              className="ctrl"
              value={
                (state.titleLayout ?? "full") === "title-kpis" && state.titlePos === "top"
                  ? "inline"
                  : state.kpiArrangement === "left-stack"
                    ? "left"
                    : state.kpiArrangement === "right-stack"
                      ? "right"
                      : "below"
              }
              onChange={(event) => {
                const placement = event.target.value;
                if (placement === "inline") {
                  update({ titleLayout: "title-kpis", kpiArrangement: "auto" });
                } else if (placement === "left") {
                  update({ kpiArrangement: "left-stack", titleLayout: (state.titleLayout === "title-kpis" ? "full" : state.titleLayout) ?? "full" });
                } else if (placement === "right") {
                  update({ kpiArrangement: "right-stack", titleLayout: (state.titleLayout === "title-kpis" ? "full" : state.titleLayout) ?? "full" });
                } else {
                  update({ kpiArrangement: "auto", titleLayout: (state.titleLayout === "title-kpis" ? "full" : state.titleLayout) ?? "full" });
                }
              }}
            >
              <option value="below">Below Title</option>
              <option disabled={state.titlePos !== "top"} value="inline">Inline with Title</option>
              <option value="left">Left of Charts</option>
              <option value="right">Right of Charts</option>
            </select>
          </div>
          <div className="ctrl-grid2">
            <Stepper
              label="Count"
              max={10}
              min={0}
              value={state.kpiCount}
              onChange={(kpiCount) => update({ kpiCount })}
            />
            <label className="form-row">
              <span className="form-label">Arrangement</span>
              <select
                className="ctrl"
                value={state.kpiArrangement}
                onChange={(event) =>
                  update({ kpiArrangement: event.target.value as LayoutState["kpiArrangement"] })
                }
              >
                <option value="auto">Auto</option>
                <option value="single-row">Single Row</option>
                <option value="two-rows">Two Rows</option>
                <option value="left-stack">Left Stack</option>
                <option value="right-stack">Right Stack</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <span className="form-label">Card Size</span>
            <div className="chip-group">
              {KPI_SIZE_PRESETS.map((preset) => (
                <button
                  className={`chip ${(state.kpiHeight ?? 110) === preset.value ? "sel" : ""}`}
                  key={preset.label}
                  type="button"
                  onClick={() => update({ kpiHeight: preset.value })}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </AccordionSection>

        {/* ── Slicers ─────────────────────────────────────────────────── */}
        <AccordionSection label="Slicers">
          <div className="ctrl-grid2">
            <Stepper
              label="Count"
              max={10}
              min={0}
              value={state.slicerCount}
              onChange={(slicerCount) => update({ slicerCount })}
            />
            <label className="form-row">
              <span className="form-label">Position</span>
              <select
                className="ctrl"
                value={state.slicerPos}
                onChange={(event) => update({ slicerPos: event.target.value as LayoutState["slicerPos"] })}
              >
                <option value="left">Left</option>
                <option value="top">Top</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
          {state.slicerCount > 0 && state.slicerPos === "top" && (
            <>
              <div className="form-row">
                <span className="form-label">Slicer Height</span>
                <div className="chip-group">
                  {SLICER_HEIGHT_PRESETS.map((preset) => (
                    <button
                      className={`chip ${slicerTopHeight === preset.value ? "sel" : ""}`}
                      key={preset.label}
                      type="button"
                      onClick={() => setSlicerTopHeight(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="form-row">
                <span className="form-label">Height (px)</span>
                <input
                  className="ctrl"
                  max={SLICER_HEIGHT_MAX}
                  min={SLICER_HEIGHT_MIN}
                  type="number"
                  value={slicerTopHeightDraft}
                  onBlur={commitSlicerTopHeightDraft}
                  onChange={(event) => handleSlicerTopHeightDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                />
              </label>
            </>
          )}
          {state.slicerCount > 0 && state.slicerPos !== "top" && (
            <>
              <div className="form-row">
                <span className="form-label">Slicer Width</span>
                <div className="chip-group">
                  {SLICER_WIDTH_PRESETS.map((preset) => (
                    <button
                      className={`chip ${slicerSideWidth === preset.value ? "sel" : ""}`}
                      key={preset.label}
                      type="button"
                      onClick={() => setSlicerSideWidth(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="form-row">
                <span className="form-label">Width (px)</span>
                <input
                  className="ctrl"
                  max={SLICER_WIDTH_MAX}
                  min={SLICER_WIDTH_MIN}
                  type="number"
                  value={slicerSideWidthDraft}
                  onBlur={commitSlicerSideWidthDraft}
                  onChange={(event) => handleSlicerSideWidthDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                />
              </label>
            </>
          )}
          <button
            className="toggle-row"
            disabled={state.slicerPos !== "top"}
            type="button"
            onClick={() => {
              if (state.slicerPos === "top") update({ slicerAboveKpi: !state.slicerAboveKpi });
            }}
          >
            <span>
              <span className="toggle-label">Slicer Above KPI</span>
              <span className="toggle-sub">
                {state.slicerPos === "top" ? "Place slicers before KPI cards" : "Enabled when slicers are on top"}
              </span>
            </span>
            <span className={`toggle-sw ${state.slicerPos === "top" && state.slicerAboveKpi ? "on" : ""}`} />
          </button>
        </AccordionSection>

        {/* ── Charts ──────────────────────────────────────────────────── */}
        <AccordionSection label="Charts">
          <div className="ctrl-grid2">
            <Stepper label="Count" max={12} min={1} value={state.chartCount} onChange={setChartCount} />
            <label className="form-row">
              <span className="form-label">Arrangement</span>
              <select
                className="ctrl"
                value={state.chartLayout}
                onChange={(event) => update({ chartLayout: event.target.value })}
              >
                {arrangementOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </AccordionSection>

        {/* ── Extras ──────────────────────────────────────────────────── */}
        <AccordionSection label="Extras">
          <button className="toggle-row" type="button" onClick={() => update({ logo: !state.logo })}>
            <span>
              <span className="toggle-label">Company logo</span>
              <span className="toggle-sub">Reserves a placeholder zone</span>
            </span>
            <span className={`toggle-sw ${state.logo ? "on" : ""}`} />
          </button>
          {state.logo && (
            <div className="chip-group">
              {[
                ["top-left", "Top-left"],
                ["top-right", "Top-right"],
              ].map(([value, label]) => (
                <button
                  className={`chip ${state.logoPos === value ? "sel" : ""}`}
                  key={value}
                  onClick={() => update({ logoPos: value as LayoutState["logoPos"] })}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </AccordionSection>

      </div>
    </aside>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

interface AccordionSectionProps {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function AccordionSection({ label, defaultOpen = false, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`panel-section accordion-section${open ? " open" : ""}`}>
      <button
        className="accordion-header"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="accordion-label">{label}</span>
        <span className="accordion-chevron" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

interface StepperProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

function Stepper({ label, min, max, value, onChange }: StepperProps) {
  return (
    <label className="form-row">
      <span className="form-label">{label}</span>
      <span className="stepper">
        <button disabled={value <= min} onClick={() => onChange(clamp(value - 1, min, max))} type="button">
          -
        </button>
        <input
          max={max}
          min={min}
          type="number"
          value={value}
          onChange={(event) => onChange(clamp(toNumber(event.target.value, min), min, max))}
        />
        <button disabled={value >= max} onClick={() => onChange(clamp(value + 1, min, max))} type="button">
          +
        </button>
      </span>
    </label>
  );
}

function parseDraftNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function commitDimensionDraft(
  draftValue: string,
  currentValue: number,
  min: number,
  max: number,
  onCommit: (value: number) => void,
  setDraft: (value: string) => void,
) {
  const parsed = parseDraftNumber(draftValue);
  if (parsed === null) {
    setDraft(String(currentValue));
    return;
  }

  const bounded = clamp(Math.round(parsed), min, max);
  onCommit(bounded);
  setDraft(String(bounded));
}

function toNumber(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}