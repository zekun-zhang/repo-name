# Habit Garden — Feature Review (2026-11-11)

**Automated review** | Supersedes all 32 prior planning documents

---

## Hard Truth

This repository has **32 planning documents** totaling ~6,500 lines and **~560 lines of application code**. 120+ feature proposals exist across series A through X. None have been implemented. Each review adds more proposals and more documentation. This document breaks that cycle by (a) proposing only features that all 120+ prior proposals genuinely missed, (b) consolidating the backlog into one definitive list, and (c) being the last planning document — the next session implements.

---

## Current Application (as of 2026-11-11)

| Layer | Tech | Lines |
|-------|------|-------|
| Frontend | React 19 + Vite 8 + TypeScript | ~350 |
| Backend | Express 5 + JSON file storage | ~180 |
| Tests | Jest + Supertest (18 integration tests) | ~230 |

**Working features:** Create habits (name, daily/weekly, color), 14-day toggle grid, daily+weekly streak calculation, inline editing, archive/unarchive, delete with confirm, optimistic UI with error toasts, CORS-enabled API with async write mutex.

**Known defects (from prior reviews, still unfixed):**
1. `src/index.css` duplicates resets already in `App.css` — dead code
2. No test coverage for `PUT /api/habits/:id` (edit)
3. No test coverage for `POST /api/habits/:id/unarchive`
4. No `manifest.json` or PWA metadata

---

## Y-Series: 4 Novel Proposals

These target behavioral-science gaps that all 120+ prior proposals missed. Each is grounded in research and scoped to ship in a single session.

### Y1. Streak Forgiveness (Skip Days)

**The problem no prior proposal addresses:** The current streak model is all-or-nothing. Miss one day and a 45-day streak becomes 0. This is the #1 reason people abandon habit trackers — research from BJ Fogg ("Tiny Habits") and James Clear ("Atomic Habits") converges on the finding that punishing imperfect consistency destroys motivation faster than anything else.

**What it is:** Users can mark a day as "skipped" (tap-and-hold or a dedicated button). Skipped days don't count for or against the streak — they're transparent. A 10-day streak with 2 skip days in the middle is still a 10-day streak.

**Data model change:**
- Add `skips: { [habitId]: string[] }` to the data store (parallel to `logs`)
- Add `POST /api/skips/toggle` endpoint (mirrors `/api/logs/toggle`)
- Modify `calculateStreak` to treat skip days as "pass-through" rather than "break"

**UI change:** In the 14-day grid, a skipped day shows a distinct marker (e.g., a diagonal line or "—") instead of empty or checked. The streak pill shows "12d (2 rest)" when skip days exist.

**Why this is different from every prior proposal:** Prior proposals addressed streak *display* (best streak, completion rates, heatmaps) but never questioned the streak *model* itself. This fixes the model.

**Scope:** ~80 lines across 4 files (types, utils, server/app, HabitRow). New API endpoint + modified streak logic.

---

### Y2. Habit Stacking (Routine Chains)

**The problem:** "After I [current habit], I will [new habit]" is the most effective habit formation technique in behavioral science literature, yet no habit tracker — including the 120+ proposals for this one — implements it.

**What it is:** Users can group habits into ordered "routines" (e.g., "Morning routine: meditate → journal → stretch"). A routine is displayed as a visually connected group in the habit table. A "Start routine" button walks through each habit sequentially, checking off one at a time.

**Data model change:**
- Add optional `routineId: string` and `routineOrder: number` to `Habit`
- Add a `routines` array to the data store: `{ id, name, habitIds[] }`
- New endpoints: `POST /api/routines`, `PUT /api/routines/:id`, `DELETE /api/routines/:id`

**UI change:** Routines are collapsible groups in the habit table with an indented, connected appearance (left border using the routine's color). The "Start routine" button opens a focused sequential check-in.

**Why this matters:** Habit stacking exploits the brain's existing neural pathways — an established habit becomes the cue for the next one. Tracking them as isolated items misses the mechanism that makes habits actually stick.

**Scope:** ~200 lines across 6 files. This is the largest Y-series proposal; it could be split into "grouping only" (session 1) and "sequential check-in" (session 2).

---

### Y3. Today-Focused Quick Check-In

**The problem:** The primary view is a 14-column data grid. For the most common action — "check off what I did today" — the user is scanning past a wall of historical data. Every prior proposal keeps this grid as the primary interface and adds *more* data to it (completion bars, heatmaps, notes). None simplify the daily check-in path.

**What it is:** A "Today" tab/mode at the top of the habits card. When active, it shows only: habit name, color dot, and a large today-toggle button, one per row. No grid, no streak, no actions. Just the list and today's status. One tap per habit, done.

**Data model change:** None. Pure frontend.

**UI change:**
- Add a tab bar to the habits card header: "Today" | "History" (the current 14-day grid)
- "Today" view renders a simplified list with large tap targets (48px minimum for mobile)
- Active tab persisted in localStorage so returning users land on their preferred view

**Why this matters:** Reducing friction at the point of daily use is the highest-ROI UX improvement possible. A user who checks in daily for 6 months will use the daily view ~180 times and the history view maybe 10 times. The interface should optimize for the 180, not the 10.

**Scope:** ~60 lines of TSX + ~30 lines of CSS. No backend changes. No new dependencies.

---

### Y4. Weekly Pulse Summary

**The problem:** Prior proposals addressed long-term progress visibility with completion rate bars (X1), heatmaps (Tier 4), and yearly contribution graphs. All require either new dependencies or significant UI complexity. None answer the simplest question: "How did my week go?"

**What it is:** A collapsible "Last 7 days" summary section above the habit table showing, for each habit: `Habit name: 5/7 ●●●●●○○`. The filled/empty dots use the habit's own color. Below the per-habit lines, a single overall score: "Overall: 78% (27/35 check-ins)".

**Data model change:** None. Computed from existing `logs`.

**UI change:** A collapsible `<details>` section with a clean, scannable layout. Collapsed by default to avoid clutter; open state persisted in localStorage.

**Why this is different from X1 (completion rate bar):** X1 proposed a per-habit monthly bar *inside* each habit row, adding visual noise to an already dense table. Y4 is a separate summary section that gives a bird's-eye view without touching the existing row layout. They're complementary, not redundant.

**Scope:** ~50 lines of TSX + ~20 lines of CSS. No backend changes.

---

## Definitive Consolidated Backlog

Every actionable item from 32 documents, deduplicated, with Y-series integrated. This is the single source of truth.

### Tier 0: Defect Cleanup (do first, < 1 hour)

| # | Item | Est. | Files |
|---|------|------|-------|
| 0.1 | Remove dead `src/index.css` | 2 min | `index.css`, `main.tsx` |
| 0.2 | Add `PUT /api/habits/:id` test coverage | 15 min | `api.test.js` |
| 0.3 | Add `POST /api/habits/:id/unarchive` test coverage | 10 min | `api.test.js` |
| 0.4 | Add `manifest.json` + PWA meta tags | 20 min | `public/`, `index.html` |

### Tier 1: Ship Next (1-2 hours each, highest impact)

| # | Feature | Est. | Origin |
|---|---------|------|--------|
| 1.1 | **Y3: Today-focused quick check-in** | 1 hr | Novel — daily friction reduction |
| 1.2 | **Y4: Weekly pulse summary** | 1 hr | Novel — simplest progress metric |
| 1.3 | **Y1: Streak forgiveness (skip days)** | 1.5 hr | Novel — fixes broken streak model |
| 1.4 | Monthly completion rate bar (per habit) | 1 hr | X1 — progress visibility |
| 1.5 | Best streak & personal records | 1 hr | X3 — self-competition motivation |

### Tier 2: High Value, Moderate Effort (2-3 hours each)

| # | Feature | Est. | Origin |
|---|---------|------|--------|
| 2.1 | Mobile-first responsive overhaul | 2 hr | X5 — phone usability |
| 2.2 | Data export/import (JSON download) | 1.5 hr | X4 — data ownership |
| 2.3 | Keyboard shortcuts (j/k/space) | 1.5 hr | Backlog — power users |
| 2.4 | Habit ordering (drag or up/down) | 2 hr | Backlog — personalization |
| 2.5 | Flexible frequency (N-times/week) | 3 hr | X2 — covers gym/weekday patterns |

### Tier 3: Larger Initiatives (half-day+)

| # | Feature | Est. | Origin |
|---|---------|------|--------|
| 3.1 | **Y2: Habit stacking / routine chains** | 4 hr | Novel — behavioral science core |
| 3.2 | Extended history view (scrollable calendar) | 3 hr | Backlog — long-term visibility |
| 3.3 | Dark/light theme toggle | 2 hr | Backlog — accessibility |
| 3.4 | PWA with service worker + offline | 4 hr | Backlog — mobile experience |
| 3.5 | GitHub-style yearly contribution heatmap | 4 hr | Backlog — long-term motivation |

### Tier 4: Foundation Changes (multi-session)

| # | Feature | Est. | Origin |
|---|---------|------|--------|
| 4.1 | SQLite migration from JSON file | 5 hr | Backlog — data reliability |
| 4.2 | Multi-user auth (email + token) | 6 hr | Backlog — multi-device |
| 4.3 | Notes/mood per completion | 2.5 hr | Backlog — tracking depth |
| 4.4 | Habit categories/tags | 4 hr | Backlog — organization at scale |

---

## Recommended Execution Plan

**Session 1:** Tier 0 defect cleanup + Y3 (today check-in) + Y4 (weekly summary)
*Rationale:* Fix defects, then ship the two simplest features. Both are frontend-only, independently valuable, and immediately visible to users.

**Session 2:** Y1 (streak forgiveness)
*Rationale:* This fixes the most psychologically damaging aspect of the app. Requires both frontend and backend changes — give it a full session.

**Session 3:** Mobile responsive (2.1) + completion rate bar (1.4)
*Rationale:* Make the app usable on phones, then add the most requested progress indicator.

**Session 4:** Data export (2.2) + best streak (1.5)
*Rationale:* Data safety before adding more features. Best streak is small enough to pair.

**Session 5:** Flexible frequency (2.5)
*Rationale:* The most complex Tier 2 item. Needs careful type changes across the stack.

---

## On Planning Documents

This is the **33rd planning document** in a repository with 560 lines of code. The ratio is absurd. The next session should:

1. **Implement Tier 0 + features Y3 + Y4** (code, not prose)
2. **Delete or archive the 32 prior planning documents** into a single `docs/archive/` folder
3. **Not create any new .md files** unless documenting an API change

Prior documents preserved only for reference: `FEATURES_v3.md` through `FEATURES_v16.md`, `FEATURES_NEW.md`, `FEATURES_FINAL.md`, `FEATURES_AND_BACKLOG.md`, `ROADMAP.md`, `FEATURE_PLAN.md`, `PLAN.md`, `FEATURE_REVIEW_2026-10-29.md` through `FEATURE_REVIEW_2026-11-10.md`.
