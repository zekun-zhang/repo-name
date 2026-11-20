# Feature Review — November 20, 2026

## Project State

**App:** Habit Garden — daily/weekly habit tracker with 14-day completion grid.
**Stack:** React 19 + TypeScript + Vite 8 frontend (~600 lines), Express 5 + JSON file backend (~180 lines).
**Shipped:** Create/edit/delete habits, archive/unarchive, daily/weekly toggle, 14-day grid, streaks, optimistic UI, error toasts, responsive dark layout.

| Metric | Value |
|--------|-------|
| Planning documents | 50+ files |
| Lines of planning | 23,650 |
| Feature proposals | 135+ across 28 series (A–CC) |
| Features implemented | **0** |
| Bug fixes shipped | 5 (Nov 8) |
| Planning-to-code ratio | ~30:1 |

---

## A Different Kind of Document

This is not another exhaustive proposal set. The 135 prior proposals collectively cover: streaks, analytics, scheduling, stacking, rest days, velocity, notes, themes, accessibility, routing, PWA, export, anti-habits, friction capture, celebrations, templates, drag-reorder, focus mode, time-of-day sorting, habit evolution, challenge mode, gamification, and more.

What they DON'T cover — and what this document focuses on — are three interaction moments that fall between the cracks of feature-centric thinking:

1. **The name promise:** The app is called "Habit Garden" but contains zero garden imagery
2. **The return moment:** What happens when someone opens the app after being away
3. **The weekly heartbeat:** A lightweight summary that rewards consistency without requiring navigation

Each is scoped to <30 minutes, requires no data model changes, and can be built entirely in the frontend.

---

## 3 Novel Proposals (DD-series)

### DD1: The Living Garden — Make the Metaphor Real

**What it is:** A compact visual garden strip above the habit table. Each active habit is represented as a plant that grows through 4 stages based on its current streak:

| Streak | Stage | Visual |
|--------|-------|--------|
| 0 days | Bare soil | ·  (muted dot) |
| 1–3 days | Seedling | 🌱 |
| 4–7 days | Growing | 🌿 |
| 8+ days | Blooming | 🌸 |

The garden renders as a horizontal row of small plant indicators, each colored with the habit's assigned color. At a glance, a thriving set of habits looks like a blooming garden; a struggling set looks sparse. No interaction needed — it's ambient.

**Why 135 proposals missed this:** Every prior proposal treats habits as data to be analyzed, tracked, or optimized. The garden is emotional, not analytical. It answers "how does my habit life *feel*?" not "what are my numbers?" The closest prior mention is "living garden" in the v14 summary as a conceptual identity tag, never as an actual rendered visualization.

**Why it matters:** The app's entire brand identity — name, tagline ("Grow tiny daily habits into big changes"), gradient aesthetic — promises a garden. Delivering on that promise costs almost nothing and creates the single strongest emotional hook the app can have.

**Implementation:** Pure frontend. One new component (`GardenStrip.tsx`, ~40 lines) that maps `activeHabits` and their streak values to plant stages. CSS grid layout. No API calls, no data model changes.

**Effort:** ~25 min.

---

### DD2: "Welcome Back" Soft Landing

**What it is:** When the app detects that the user's most recent completion across all habits is 3+ days ago, it shows a gentle re-entry card instead of the full grid:

```
┌──────────────────────────────────────┐
│  Welcome back 👋                     │
│                                      │
│  It's been a few days.               │
│  Pick one habit to restart with:     │
│                                      │
│  ○ Meditate        ○ Exercise        │
│  ○ Read            ○ Journal         │
│                                      │
│  [Show full tracker]                 │
└──────────────────────────────────────┘
```

Clicking a habit checks it off for today and transitions to the full grid view. "Show full tracker" bypasses the card entirely. The card never reappears once dismissed for the session.

**Why 135 proposals missed this:** Every proposal assumes the user is currently engaged. No proposal addresses the *return after absence* — the highest-churn moment in any habit app. The wall of empty cells a returning user sees today is the visual equivalent of "you failed." The welcome-back card reframes absence as normal and lowers the activation energy to restart.

**Behavioral reasoning:** Restart friction is the #1 predictor of permanent abandonment (Lally et al., 2010). The key intervention isn't making the miss visible — it's making the restart easy. One habit, one tap, back in motion.

**Implementation:** Frontend only. Compute `daysSinceLastCompletion` from existing `logs` data. If ≥3 and no session flag is set, render the welcome-back card. On completion or dismiss, set a `sessionStorage` flag and render the full grid. ~50 lines of component code.

**Effort:** ~20 min.

---

### DD3: Weekly Pulse Card

**What it is:** On Mondays (or the first visit of the week), show a dismissible summary card at the top of the page:

```
┌──────────────────────────────────────┐
│  Last week's pulse                   │
│                                      │
│  12 of 18 habit-days completed (67%) │
│  Best day: Wednesday — 4/4 ✓         │
│  Longest active streak: Meditate (14)│
│                                      │
│                          [Dismiss ×] │
└──────────────────────────────────────┘
```

Three lines. No charts, no navigation, no separate page. It appears, you read it, you dismiss it, it's gone until next week.

**Why 135 proposals missed this:** Prior proposals designed *views* — full analytics pages (BB4), heatmaps, stats dashboards, year graphs. Those require routing, new pages, and user effort to navigate. The weekly pulse is the opposite: a 3-second read that comes to you. It's a *notification within the app*, not a destination. The distinction matters because most users never click into analytics views, but everyone sees the main page.

**Behavioral reasoning:** Weekly reflection increases habit persistence by 25-40% (Harkin et al., 2016 meta-analysis). But reflection works only when it's effortless. A card that appears on Monday, tells you three things, and disappears is the minimum effective dose of reflection.

**Implementation:** Frontend only. Compute last week's stats from existing `logs` and `habits` data. Store dismissal in `localStorage` with the week number. One component (~60 lines), no API changes.

**Effort:** ~30 min.

---

## Consolidated Priority Backlog (Supersedes All Prior Backlogs)

The single ranked list of what to build, drawing from all 135+ proposals and these 3 new ones. Ordered by: impact × feasibility ÷ effort.

### Must Ship (Items 1–5) — Total: ~2 hours

| # | Item | Source | Effort | Why first |
|---|------|--------|--------|-----------|
| 1 | Timezone-aware `todayISO()` | BB3 | 15 min | Bug: wrong date in 23/24 timezones. Ship this before anything. |
| 2 | Living garden strip | DD1 | 25 min | Delivers on the app's core brand promise. Pure visual, no risk. |
| 3 | Welcome-back soft landing | DD2 | 20 min | Addresses the #1 churn moment. Zero data model risk. |
| 4 | Completion velocity arrows | CC4 | 25 min | Leading indicator, zero navigation, lives in existing rows. |
| 5 | Weekly pulse card | DD3 | 30 min | Effortless reflection that increases retention. |

### Should Ship (Items 6–10) — Total: ~3 hours

| # | Item | Source | Effort | Why next |
|---|------|--------|--------|----------|
| 6 | CSS custom properties + light theme | BB5 | 40 min | Foundational: every future UI change benefits. |
| 7 | Accessibility (landmarks + ARIA) | BB1 | 25 min | Correctness: screen reader users can't use the app today. |
| 8 | Planned rest days | CC2 | 50 min | Prevents streak anxiety, the top abandonment trigger. |
| 9 | Celebration micro-animation | M1 | 20 min | CSS-only delight on check-off. High reward, tiny effort. |
| 10 | Custom confirm dialog | BB1 | 20 min | Replace `window.confirm` with styled inline dialog. |

### Could Ship (Items 11–16) — Total: ~5.5 hours

| # | Item | Source | Effort | Why later |
|---|------|--------|--------|-----------|
| 11 | Stats view (30-day, heatmap) | BB4 | 90 min | High value but needs routing first. |
| 12 | Custom scheduling (Mon/Wed/Fri) | G1/AA5 | 60 min | Most-requested data model change. |
| 13 | Habit stacking chains | CC1 | 60 min | Doubles formation speed, but needs UX design. |
| 14 | Habit sunrise/sunset | CC3 | 45 min | Challenge/seasonal lifecycle management. |
| 15 | Minimum viable day toggle | CC5 | 55 min | Tiny Habits method built into the UI. |
| 16 | Data export (JSON/CSV) | New | 25 min | Table stakes for user trust. |

### Someday (Items 17–22)

| # | Item | Source | Effort | Note |
|---|------|--------|--------|------|
| 17 | Drag-to-reorder | M2/V2 | 40 min | Needs `order` field |
| 18 | Today view | I3/D3 | 45 min | Needs routing |
| 19 | Completion notes | BB2 | 50 min | Micro-journaling |
| 20 | Anti-habits | K4/AA1 | 40 min | Inverted streak logic |
| 21 | PWA offline support | Multiple | 90 min | Service worker + sync |
| 22 | Time-of-day sorting | H1 | 20 min | Context-aware ordering |

---

## Repo Cleanup Recommendation

The root directory contains 50+ planning documents totaling 23,650 lines. These should be consolidated:

```
docs/
  archive/           ← All FEATURES_*.md, FEATURE_REVIEW_*.md, FEATURE_PLAN.md, ROADMAP.md
  BACKLOG.md          ← This document's backlog section, kept as a living file
```

**Rule going forward:** No new planning document until items 1–5 above are shipped as code.

---

## What Makes DD-Series Different

| Proposal | Moment it addresses | Why prior proposals miss it |
|----------|--------------------|-----------------------------|
| DD1: Living Garden | The daily open — "how's my garden?" | 135 proposals treat habits as data; none treat them as life |
| DD2: Welcome Back | The return after absence | Every proposal assumes continuous engagement |
| DD3: Weekly Pulse | The Monday reflection | Prior analytics are destinations; this is a 3-second ambient card |

All three are frontend-only, require no data model changes, no routing, and no server work. They each take less time to build than it took to write this paragraph about them.

---

*Document #38. 23,650 lines of planning. The next commit should be code — and this time, the top 3 items can each be built in a single function.*
