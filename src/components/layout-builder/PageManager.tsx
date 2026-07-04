'use client'

import { useEffect, useRef, useState } from "react";
import type { ReportState } from "@/lib/layout-builder/types/layout";

const SOFT_WARN_AT = 20;

interface PageManagerProps {
  reportState: ReportState;
  onSwitchPage: (pageId: string) => void;
  onAddPage: () => void;
  onDuplicatePage: (pageId: string) => void;
  onRenamePage: (pageId: string, newName: string) => void;
  onDeletePage: (pageId: string) => void;
  onResetPage: () => void;
}

export function PageManager({
  reportState,
  onSwitchPage,
  onAddPage,
  onDuplicatePage,
  onRenamePage,
  onDeletePage,
  onResetPage,
}: PageManagerProps) {
  const { pages, activePageId } = reportState;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEdit = (pageId: string, currentName: string) => {
    setEditingId(pageId);
    setEditValue(currentName);
  };

  const commitEdit = () => {
    if (editingId) {
      const trimmed = editValue.trim();
      if (trimmed) onRenamePage(editingId, trimmed);
    }
    setEditingId(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") commitEdit();
    if (event.key === "Escape") setEditingId(null);
  };

  const showSoftWarn = pages.length >= SOFT_WARN_AT;

  return (
    <div className="page-bar">
      {/* Add button is pinned to the left — always visible regardless of how many tabs exist */}
      <button className="page-add-btn" title="Add page" type="button" onClick={onAddPage}>
        +
      </button>

      {/* Scrollable tabs area — only this region scrolls horizontally */}
      <div className="page-tabs-scroll">
        <div className="page-tabs">
          {pages.map((page) => {
            const isActive = page.id === activePageId;
            return (
              <div
                key={page.id}
                className={`page-tab ${isActive ? "active" : ""}`}
                onClick={() => { if (editingId !== page.id) onSwitchPage(page.id); }}
                onDoubleClick={() => startEdit(page.id, page.name)}
              >
                {editingId === page.id ? (
                  <input
                    ref={inputRef}
                    className="page-tab-input"
                    maxLength={40}
                    value={editValue}
                    onBlur={commitEdit}
                    onChange={(e) => setEditValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={handleKeyDown}
                  />
                ) : (
                  <span className="page-tab-label">{page.name}</span>
                )}

                <div className="page-tab-actions">
                  <button
                    className="page-tab-action"
                    title={`Duplicate "${page.name}"`}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDuplicatePage(page.id); }}
                  >
                    ⧉
                  </button>
                  {pages.length > 1 && (
                    <button
                      className="page-tab-action page-tab-del"
                      title="Delete page"
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDeletePage(page.id); }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset button and page count are pinned to the right — always visible */}
      <div className="page-bar-sep" />

      <button
        className="page-reset-btn"
        title="Reset current page to default layout"
        type="button"
        onClick={onResetPage}
      >
        ↺ Reset
      </button>

      <span className="page-count-label">
        {pages.length} {pages.length === 1 ? "page" : "pages"}
      </span>

      {showSoftWarn && (
        <span className="page-count-warn" title="Many pages may slow down export">
          ⚠ performance
        </span>
      )}
    </div>
  );
}