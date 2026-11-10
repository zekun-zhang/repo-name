# Habit Garden — Feature Review & Execution Plan (2026-11-10)

**Automated review** | Supersedes all 31 prior planning documents

---

## The Problem With This Repository

This project has **31 planning documents** and **~560 lines of application code**. Prior reviews have cataloged 120+ feature proposals across series A through W. **Zero features have been implemented.** Each new review session adds more proposals and more documentation, widening the gap between planning and execution.

This review takes a different approach: **fewer proposals, deeper reasoning, and each feature scoped to be shippable in a single focused session.**

---

## Current State (2026-11-10)

### What Works

| Capability | Implementation |
|-----------|---------------|
| Create habits | Name + daily/weekly frequency + custom color |
| 14-day toggle grid | Click any cell in the last 14 days to mark complete |
| Streak calculation | Counts consecutive days (daily) or weeks (weekly) from today backward |
| Edit habits | Inline row editing for name, frequency, color |
| Archive / Unarchive | Move habits out of active view and restore them |
| Delete habits | With browser confirm dialog, removes habit + logs |
| Optimistic UI | All mutations update locally first, revert on server failure |
| Error toasts | 3-second red toast on failed server operations |
| Server persistence | Express API with JSON file storage, async mutex for write safety |
| Tests | 18 supertest integration tests covering all API routes |

### What's Missing (the user experience gaps)

1. **No sense of progress over time.** Streaks only tell you "how long since you last missed." They don't tell you "how well am I doing overall?" A user with a 0-day streak who completed 25/30 days feels like a failure.
2. **No reason to come back.** The app is purely functional — check in, see grid. There's no reward, no milestone, no acknowledgment that you've been consistent.
3. **No data beyond 14 days.** The grid shows 2 weeks. Everything before that is invisible. Months of dedication look the same as a fresh start.
4. **Rigid frequency model.** "Daily" and "weekly" cover most habits but miss common patterns: 3x/week gym visits, weekday-only meditation, bi-weekly reviews.
5. **Desktop-only feel.** No responsive optimization for mobile, no PWA capability. Habit tracking is fundamentally a mobile-first activity — you check in from bed, from the gym, from the bus.
6. **Single-user, single-device.** JSON file on one server. No way to use it from two devices, no way to share accountability with someone else.

---

## X-Series: 5 Feature Proposals

These features were selected by cross-referencing the 6 gaps above against implementation effort. Each targets a gap that prior proposals either ignored or over-engineered. Each is scoped to ship in one session.

### X1. Monthly Completion Rate Bar

**Gap addressed:** #1 (No sense of progress over time)

**What it is:** A simple horizontal bar under each habit row showing "X/Y days completed this month" with a fill percentage. For weekly habits, "X/Y weeks completed this month." No charts library, no external dependencies — just a styled `<div>` with a width percentage.

**Why this specific solution:**
- Streaks punish single misses. A completion rate rewards consistency even when imperfect. Research on habit formation (BJ Fogg's "Tiny Habits") shows that *feeling successful* matters more than *being perfect*.
- A bar is glanceable. You see red (low), yellow (medium), green (high) without reading numbers.
- It requires zero new data — all information is already in the `logs` object. This is a pure frontend feature.

**Scope:** ~40 lines of TSX + ~20 lines of CSS. No backend changes. No new dependencies.

**Implementation sketch:**
- Add a `completionRate(dates: string[], frequency: Frequency): { completed: number, total: number, pct: number }` function to `utils.ts`
- Render a `<div className="rate-bar">` below the streak pill in `HabitRow.tsx`
- Color the bar fill with the habit's own color at reduced opacity

---

### X2. Flexible Frequency: N-times-per-week

**Gap addressed:** #4 (Rigid frequency model)

**What it is:** Extend the `Frequency` type from `'daily' | 'weekly'` to include `{ type: 'per_week', target: number }`. The UI shows a dropdown: "Daily", "Weekly", or "X times per week" with a number input (2-6). Streaks for per-week habits count consecutive weeks where the target was met.

**Why this specific solution:**
- "3x/week" is the most common gym schedule worldwide. "5x/week" covers weekday-only habits. These are the #1 and #2 most-requested frequency types in every habit app's feedback forums.
- The implementation is backward-compatible: existing `'daily'` and `'weekly'` habits don't change. The new type is an object, distinguishable by `typeof frequency === 'object'`.
- Streak calculation for per-week habits reuses the existing `getISOWeek` helper — count dates per ISO week, check if count >= target, iterate backward.

**Scope:**
- `types.ts`: Extend `Frequency` type
- `utils.ts`: Add `calculatePerWeekStreak`, update `calculateStreak` dispatcher
- `HabitForm.tsx`: Conditional number input when "X times/week" selected
- `HabitRow.tsx`: Display "3/4 this week" instead of just a streak
- `server/app.js`: Update validation to accept the new frequency shape
- `server/__tests__/api.test.js`: Add validation tests for new frequency

**Scope:** ~120 lines across 6 files. Backend validation + frontend display.

---

### X3. Best Streak & Personal Records

**Gap addressed:** #2 (No reason to come back)

**What it is:** Track and display the *longest streak ever achieved* for each habit, alongside the current streak. When the current streak surpasses the best, show a brief "New record!" indicator. Store the best streak in the habit object on the server.

**Why this specific solution:**
- "Beat your personal best" is one of the most effective motivational patterns in behavioral psychology (self-determination theory: competence need). It works because it's self-referential — you're competing with your past self, not an arbitrary goal.
- The implementation is minimal: add a `bestStreak: number` field to the `Habit` type. On each toggle, if the new streak > bestStreak, update it. Display it as a small label next to the streak pill: "Best: 14d".
- No notifications, no animations, no gamification framework — just a number that quietly motivates.

**Scope:**
- `types.ts`: Add `bestStreak: number` to `Habit`
- `server/app.js`: On toggle, recalculate streak, compare to stored best, update if exceeded
- `HabitRow.tsx`: Show "Best: Xd" label when bestStreak > 0 and > currentStreak

**Scope:** ~30 lines across 3 files. Requires a one-time migration to set `bestStreak: 0` on existing habits.

---

### X4. Data Export (JSON Download)

**Gap addressed:** #3 (No data beyond 14 days) and #6 (Single-device)

**What it is:** A "Download my data" button in the header that triggers a browser download of the full `data.json` contents as a timestamped file. Optionally, a "Load data" button that reads a JSON file and merges/replaces the server state.

**Why this specific solution:**
- This is the simplest possible answer to "what if I lose my data" and "how do I move between devices." It requires no cloud sync, no auth, no database migration.
- It doubles as a primitive backup mechanism. Users of flat-file apps (Obsidian, todo.txt) expect and value local data ownership.
- Export is ~10 lines: `fetch('/api/habits')`, create a Blob, trigger download. Import is ~20 lines: read file, POST to a new `/api/import` endpoint.

**Scope:**
- `server/app.js`: Add `GET /api/export` (returns data.json contents) and `POST /api/import` (validates + replaces data)
- `App.tsx`: Add export/import buttons to header
- No new dependencies

**Scope:** ~60 lines across 2 files.

---

### X5. Mobile-First Responsive Overhaul

**Gap addressed:** #5 (Desktop-only feel)

**What it is:** Restructure the habit table for narrow screens. Below 600px: collapse the 14-day grid to show only the last 7 days. Below 400px: show only today + yesterday + a summary dot count. The habit form moves from a sidebar column to a collapsible section at top. Actions (edit/archive/delete) move to a swipe-or-long-press context menu.

**Why this specific solution:**
- The current 14-column grid is unusable on phones. Each day cell is 26px wide; 14 of them plus habit name and streak = ~500px minimum, forcing horizontal scroll on any phone.
- Habit tracking apps are used primarily on mobile (Habitica, Streaks, and Done all report 80%+ mobile usage).
- This is CSS-first: media queries to hide columns, adjust the grid layout, and stack the form. The data and logic don't change.

**Scope:**
- `App.css`: ~80 lines of media queries
- `HabitTable.tsx`: Accept a `visibleDays` prop, compute from window width
- `HabitRow.tsx`: Conditional rendering for compact mode
- `App.tsx`: Move form into a collapsible `<details>` on mobile

**Scope:** ~100 lines, mostly CSS. No backend changes.

---

## Consolidated Backlog

Organized by implementation tier. Each item includes estimated effort and which gap it addresses.

### Tier 1: Fix Before Features (< 2 hours total)

These are existing defects documented since October 2026. They should be the very first work done.

| # | Item | Effort | File(s) |
|---|------|--------|---------|
| 1 | Clean up dead `index.css` (duplicate of `App.css` reset) | 5 min | `src/index.css` |
| 2 | Add missing test coverage for `PUT /api/habits/:id` | 15 min | `server/__tests__/api.test.js` |
| 3 | Add missing test coverage for `POST /api/habits/:id/unarchive` | 10 min | `server/__tests__/api.test.js` |
| 4 | Clean stale test data from `server/data.json` | 2 min | `server/data.json` |
| 5 | Add `manifest.json` + basic PWA metadata for installability | 20 min | `public/manifest.json`, `index.html` |

### Tier 2: High-Impact, Low-Effort Features (1-2 sessions each)

| # | Feature | Effort | Gaps |
|---|---------|--------|------|
| 6 | **X1: Monthly completion rate bar** | 1 hr | Progress visibility |
| 7 | **X3: Best streak & personal records** | 1 hr | Motivation / retention |
| 8 | **X4: Data export/import** | 1.5 hr | Data portability, backup |
| 9 | **X5: Mobile responsive overhaul** | 2 hr | Mobile usability |
| 10 | Keyboard shortcuts: `j`/`k` navigate habits, `space` toggles today | 1.5 hr | Power user efficiency |

### Tier 3: Medium-Effort Features (half-day each)

| # | Feature | Effort | Gaps |
|---|---------|--------|------|
| 11 | **X2: Flexible frequency (N-times/week)** | 3 hr | Frequency flexibility |
| 12 | Habit ordering: drag-to-reorder or manual up/down buttons | 2 hr | Personalization |
| 13 | Dark/light theme toggle (the dark theme is already solid) | 2 hr | Accessibility |
| 14 | Extended history view: scrollable calendar or heatmap beyond 14 days | 3 hr | Long-term visibility |
| 15 | Notes per completion: optional short text when toggling a day | 2.5 hr | Tracking depth |

### Tier 4: Larger Initiatives (multi-session)

| # | Feature | Effort | Gaps |
|---|---------|--------|------|
| 16 | Habit categories/tags with color-coded grouping | 4 hr | Organization at scale |
| 17 | PWA with offline support (service worker + cache strategy) | 4 hr | Mobile-first experience |
| 18 | SQLite migration from JSON file (for concurrent access, querying) | 5 hr | Data reliability |
| 19 | Multi-user support with simple auth (email + token) | 6 hr | Multi-device access |
| 20 | GitHub-style yearly contribution heatmap per habit | 4 hr | Long-term motivation |

---

## Recommended Execution Order

**Session 1:** Tier 1 items 1-5 (clean up, add tests, fix defects)
**Session 2:** X1 (completion rate bar) + X3 (best streak) — both are small, frontend-heavy, and independently valuable
**Session 3:** X5 (mobile responsive) — this is the highest-impact single change for real-world usability
**Session 4:** X4 (export/import) — data safety before adding more features
**Session 5:** X2 (flexible frequency) — the most complex proposal, saved for after the foundation is solid

---

## A Note on Planning Documents

This repository contains 32 planning documents (including this one) totaling over 6,000 lines. The application code totals ~560 lines. **The next session should write code, not another plan.** If a new feature idea comes up during implementation, add it as a single line to the Tier 3 or Tier 4 table above — do not create a new document.

Prior documents preserved for reference: `FEATURES_v3.md` through `FEATURES_v16.md`, `FEATURES_NEW.md`, `FEATURES_FINAL.md`, `FEATURES_AND_BACKLOG.md`, `BACKLOG.md`, `ROADMAP.md`, `FEATURE_PLAN.md`, `PLAN.md`, `FEATURE_REVIEW_2026-10-29.md` through `FEATURE_REVIEW_2026-11-07.md`.
