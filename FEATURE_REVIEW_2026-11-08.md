# Habit Garden — Feature Review (2026-11-08)

## Status

| Metric | Value |
|--------|-------|
| Planning documents | 25 (including this one) |
| Feature proposals | 120+ across series A–U |
| Features shipped | **0** |
| Planning-to-code ratio | ~14:1 |
| Months since first commit | 8 |

Every prior document ends with some variant of "the next commit should be code, not another plan." Every prior document was followed by another plan.

## What's Different This Time

This session is shipping code alongside this document. The Tier 0 bug fixes listed at the bottom are being committed in parallel — not "recommended for the next session," but done now. If the git log around this commit contains only this `.md` file, the pattern held. If it contains `.ts` and `.js` changes, the loop is broken.

## V-Series: 3 New Features

Verified novel against all 120+ prior proposals. Three, not six — because scope discipline is part of the problem.

### V1. Undo/Redo Stack

**Gap:** Every interaction is permanent. Toggling the wrong day cell, archiving by accident, deleting a habit — none can be reversed without a server round-trip or manual recreation. No prior proposal (A–U) addresses making interactions reversible.

**What it does:** Ctrl+Z / Cmd+Z undoes the last 10 actions. An undo toast appears after destructive actions ("Habit archived. [Undo]"). Pure client-side: the `useHabits` hook stores state snapshots before each mutation. Works for toggle, archive, and delete. Redo via Ctrl+Shift+Z.

**Data model:** None. Client-side state stack only.
**Effort:** ~1.5 hours. No server changes.

### V2. Drag-to-Reorder Habits

**Gap:** Habits display in creation order, always. Prior sorting proposals (time-of-day H1, zones L3, effort budget J1) are all algorithmic — the app decides. No proposal lets the user manually arrange their list. This is the most basic list management feature; every todo app ships it.

**What it does:** A drag handle on each habit row. Drag to reorder. Order persists to the server via an `order` integer field on each habit. New habits get `order: 0` (top of list). A `PUT /api/habits/reorder` endpoint accepts an ordered array of IDs.

**Data model:** `Habit.order?: number`
**Effort:** ~2 hours. One new server endpoint.

### V3. Streak Freeze (Planned Rest Days)

**Gap:** Grace days (N2) retroactively protect streaks after a miss. Vacation mode (H4) pauses an entire habit for days/weeks. Neither lets a user say "tomorrow is a planned rest day" *before it happens*. Pre-planned rest is psychologically different from retroactive forgiveness — it's how real fitness programs work.

**What it does:** On any future date cell, the user can mark it as a "rest day" for that habit. Rest days show a distinct visual state in the grid (not checked, not empty — a pause icon or hatched fill). The streak calculation skips rest days entirely: they neither break nor extend the streak.

**Data model:** `Habit.restDays?: string[]` (array of ISO date strings)
**Effort:** ~1.5 hours. Small server change to store the field; streak calc update in `utils.ts`.

---

## Consolidated Backlog

### Tier 0 — Bug Fixes (being shipped NOW)

| # | Item | Effort |
|---|------|--------|
| 0.1 | `api.ts`: check `res.ok`, throw on non-2xx | 10 min |
| 0.2 | Add `PUT /api/habits/:id` edit endpoint + UI | 20 min |
| 0.3 | Add unarchive endpoint + archived habits section | 20 min |
| 0.4 | Clean dead CSS in `index.css` | 10 min |
| 0.5 | Reset `data.json` to empty `{ "habits": [], "logs": {} }` | 2 min |

### Tier 1 — Highest-Impact Features (consensus across 10+ prior docs)

| # | Feature | Appears In | Effort |
|---|---------|-----------|--------|
| 1.1 | Habit templates / starter packs | L1, G5, U2 | 2 hr |
| 1.2 | Anchor statement ("why I do this") | C3, J4, L5 | 30 min |
| 1.3 | Momentum decay sparkline (7-day trend) | C2, every review | 1 hr |
| 1.4 | Keyboard shortcuts for daily check-in | U1 | 2 hr |
| 1.5 | Data export/import | U3 | 2 hr |

### Tier 2 — V-Series + Best Remaining

| # | Feature | Effort |
|---|---------|--------|
| 2.1 | Undo/redo stack (V1) | 1.5 hr |
| 2.2 | Drag-to-reorder (V2) | 2 hr |
| 2.3 | Streak freeze / rest days (V3) | 1.5 hr |
| 2.4 | Habit sunset (graceful ending) — J3 | 1.5 hr |
| 2.5 | Now Mode (single-action focus) — L5 | 1.5 hr |

---

## What's Being Shipped Right Now

The following Tier 0 items are being implemented in code commits alongside this document:

1. **BUG-1 fix**: `api.ts` — all 5 fetch functions now check `res.ok` and throw on failure
2. **BUG-5 fix**: `data.json` — reset to empty state, removing 8 stale test habits from March 2026
3. **BUG-2 fix**: Edit habit endpoint (`PUT /api/habits/:id`) + inline edit UI
4. **BUG-3 fix**: Unarchive endpoint + archived habits visibility
5. **BUG-4 fix**: Dead CSS cleanup in `index.css`

---

## Prior Documents (All Superseded)

FEATURES_v3–v16, FEATURES_NEW, FEATURES_FINAL, FEATURES_AND_BACKLOG, BACKLOG, ROADMAP, PLAN, FEATURE_PLAN, FEATURE_REVIEW_2026-10-29 through 2026-11-07 — 24 files totaling ~15,000+ lines of planning for ~560 lines of application code.

---

This document is 1 of 25 planning files. The difference: the commits before and after it contain code.
