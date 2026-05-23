Act as a senior full-stack architect and UI migration lead.

Before implementation, read:
- AGENTS.md
- REFERENCE_DECISION.md
- docs/reference/claude-design/Datacense Power BI Theme Studio.html
- docs/reference/claude-design/styles.css
- docs/reference/claude-design/src/*.js
- docs/reference/claude-design/data/*.js
- docs/reference/original-prompt.md
- docs/reference/pbi-theme-studio-reference.html

Confirm the migration strategy:
1. Claude Design modular ZIP is the primary UI/UX and behavior reference.
2. Original prompt is the canonical product and Power BI JSON spec.
3. Older single HTML is secondary fallback only.

Then continue phase-by-phase without copying vanilla JS directly into React.
