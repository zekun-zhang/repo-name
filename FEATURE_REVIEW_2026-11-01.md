# Habit Garden — Feature Review & Execution Plan (2026-11-01)

**Automated review** | Supersedes all prior planning documents

---

## Codebase Snapshot

| Metric | Value |
|--------|-------|
| Source files | 11 (4 components, 1 hook, 1 utils, 1 types, 1 API client, 2 server files) |
| Lines of code | ~960 |
| Working features | Create (daily/weekly), 14-day toggle grid, streaks, archive, delete |
| Stack | React 19 + TypeScript + Vite 8 / Express + JSON file |
| Planning docs | **22** (including this one) |
| Feature proposals to date | **105+** (series A through P) |
| Features shipped | **0** |
| Planning-to-code ratio | **~11:1** |

### Architectural Observations

1. **No edit endpoint.** The server supports create, archive, delete, and toggle — but not update. Every feature that adds an editable field (anchor text, routine assignment, effort level) is blocked by this 15-line omission.
2. **API calls never check `res.ok`.** A 500 response silently corrupts client state. This is a data-loss bug.
3. **Orphaned CSS.** `index.css` defines a full light/dark design system that `App.css` overrides entirely with a hardcoded dark theme. One file is dead code.
4. **No data migration.** Adding any field to `Habit` requires defensive defaults on read. A `migrateData()` function would unblock the entire roadmap.
5. **Test data in production.** `data.json` contains 8 test habits named "test" and "123" with no real log history.

---

## What 105 Proposals All Share (Still)

Prior reviews identified five blind spots (L-series). Subsequent reviews (M, N, P series) added physical UX, resilience, and forward-projection. But six dimensions remain untouched:

1. **The app is write-only.** You put data in; nothing meaningful comes back out. No export, no summary email, no shareable view.
2. **Every action is permanent and instant.** No undo for toggle, archive, or any operation. The only safety net is a confirm dialog on delete.
3. **The app has no concept of planned absence.** Vacation, illness, rest days — the streak counter treats all misses as failure. Grace days (reactive) and comeback mode (after-the-fact) are proposed, but proactive planned off-days are not.
4. **Habits have no measured duration.** The app knows *whether* you did something, never *how long* it took. You can't discover that meditation actually takes you 8 minutes, not the 20 you imagined.
5. **There is no self-competition.** Streaks show current state. No feature shows personal records: longest streak ever, best week, or "3 more to beat your record."
6. **Two habits can't be compared.** 105 proposals analyze individual habits. None reveals correlations: "On days you exercise, you're 85% more likely to also meditate."

---

## R-Series: 6 Novel Features (Dimensions 106–111)

Each targets a blind spot untouched by all 105 prior proposals. Verified against the full A-through-P series.

### R1. Streak Freeze (Planned Off-Days)

**Dimension 106: Proactive absence management**

Every existing proposal treats missed days as something to recover from: grace days forgive after the fact, comeback mode welcomes you back, decay sparklines show the damage. None lets you plan ahead.

**What it does:** Before leaving for vacation (or any expected absence), mark specific future dates as "frozen." Those dates don't count against your streak and show as a snowflake icon in the grid instead of an empty cell.

```
Exercise 30 min    streak: 14 days
  ✓ ✓ ✓ ✓ ❄ ❄ ✓ ✓ ✓ ○ ○ ○ ○ ○
              ^vacation^
```

**Key decisions:**
- Maximum 3 freeze-days per habit per month (prevents abuse without being stingy)
- Freezes must be set before midnight on the frozen day (proactive, not retroactive)
- Frozen days are visually distinct — not a gap, not a completion, a planned pause
- Freeze count resets monthly; unused days don't roll over

**Why it's different:** Comeback Mode (K2) triggers after you've already failed. Grace Days (G3) forgive retroactively. Streak Freeze is the only proposal that lets you *plan* around life without breaking momentum. It mirrors Duolingo's most-loved feature (streak freeze) but with calendar-based planning instead of a purchasable item.

**Data model:** Add `freezes: { [habitId]: string[] }` to the data store (array of YYYY-MM-DD strings). One new endpoint: `POST /api/habits/:id/freeze` with `{ date }`.

**Effort:** ~25 min

---

### R2. Today Bar (Persistent Quick Check-In)

**Dimension 107: Ambient progress without mode-switching**

The current check-in flow: scroll to the habit table → find the right row → find today's column → click the cell. For a daily check-in of 6 habits, that's 6 rounds of visual search. Now Mode (L5) solves this by replacing the entire view, but it's a mode switch — you lose the overview.

**What it does:** A sticky bar at the top of the page showing today's uncompleted habits as colored dots. Tap a dot to complete it. The bar empties through the day.

```
┌──────────────────────────────────────────────────┐
│ Today: ● ● ● ○ ○ ○  (3/6)   [Expand ▾]         │
│        Med  Jrnl Ex  Read H2O  Span              │
└──────────────────────────────────────────────────┘
```

Tapping "Expand" shows habit names. Tapping a dot toggles it and plays a micro-animation (scale + color fill). The bar shows live progress: "3/6" updates instantly.

**Key decisions:**
- Always visible (sticky top), even while scrolling the main grid
- Dots use each habit's assigned color
- Completed dots stay visible (filled) — they're progress, not clutter
- Mobile: dots wrap to two lines if needed; names hidden by default

**Why it's different:** Now Mode (L5) replaces the view entirely — it's for "I can't decide, guide me." Today Bar augments the existing view — it's for "I know what I did, let me check it off fast." Habit Debt Dashboard (I3) shows a list of remaining items. Today Bar is a single-tap interaction surface, not an information display.

**Data model:** No changes. Reads from existing habits + logs. Pure rendering.

**Effort:** ~20 min

---

### R3. Habit Timer (Duration Tracking)

**Dimension 108: How long habits actually take**

Every proposal treats habit completion as binary: done or not done. But a user who budgets "Exercise 30 min" might actually take 45 minutes or 15 minutes. Without duration data, the user can never calibrate expectations or discover that a habit takes less time than they fear.

**What it does:** Each uncompleted habit in the grid shows an optional "Start" button. Tapping it starts a live timer on that row. Tapping "Done" stops the timer and records both the completion and the duration. The duration appears as a subtle annotation below the check mark.

```
Exercise 30 min    streak: 14 days
  ✓  ✓  ✓  ✓  ✓   [▶ Start]
  28m 33m 25m 41m 30m
```

Over time, this reveals:
- Average actual duration per habit
- Whether duration is trending up or down (is exercise getting easier?)
- Which habits are faster than expected (reducing friction to start)

**Key decisions:**
- Timer is always optional — tapping the day cell directly still works as a simple toggle
- Duration stored per-log-entry (not per-habit-average); raw data is more useful
- Timer runs in the browser; closing the tab loses the running timer (simple, no background tracking)
- Durations shown only when available; habits without timer data look the same as today

**Why it's different:** Effort Budget (J1) asks the user to *estimate* cost. Habit Timer *measures* actual cost. Estimates are notoriously wrong; measurements reveal truth. No prior proposal captures time data.

**Data model:** Extend logs from `string[]` (date strings) to support optional duration:
```typescript
type HabitLog = {
  [habitId: string]: Array<string | { date: string; durationMin?: number }>
}
```
Backward-compatible: existing string entries still work.

**Effort:** ~35 min

---

### R4. Personal Records (Self-Competition)

**Dimension 109: Gamification through self-competition**

Streaks show current state. Celebrations (M1) fire at fixed milestones (7, 30, 100 days). But no feature shows *personal* records or near-records. "Your longest streak ever was 21 days — you're at 19 now" is far more motivating than "streak: 19 days."

**What it does:** Each habit tracks personal bests:
- **Longest streak ever** — shown when current streak approaches or exceeds it
- **Best week** — highest 7-day completion count (e.g., "Best week: 7/7 — current: 5/7, 2 more to tie!")
- **Total completions** — lifetime count, shown at round-number milestones

```
Exercise 30 min    streak: 19 days
                   🏆 2 away from your record (21 days)

Meditate           streak: 45 days
                   🏆 New personal best! (previous: 38 days)
```

**Key decisions:**
- Records are computed from existing log data — no new storage needed
- Only shown when relevant: near a record, or just set one. Hidden otherwise.
- No comparison to other people. This is self-competition only.
- "Best week" uses a sliding 7-day window, not calendar weeks (more forgiving)

**Why it's different:** Celebration animations (M1) are momentary and at fixed milestones. Personal Records create *ongoing* tension: "I'm close to my best." This is the mechanic that makes fitness apps addictive — beating your own score. No prior proposal tracks personal bests.

**Data model:** No schema changes. All records are computed from the existing `logs` array (sort dates, find longest consecutive run, count per-week completions). Can be memoized.

**Effort:** ~20 min

---

### R5. Habit Pairs (Correlation Discovery)

**Dimension 110: Cross-habit intelligence**

105 proposals analyze habits individually. But habits don't exist in isolation — they influence each other. A user might not realize that on days they exercise, they almost always meditate too, but on days they skip exercise, meditation drops to 30%. Surfacing these correlations helps users understand their actual behavior system.

**What it does:** After 14+ days of data, the app computes pairwise completion correlations. High-correlation pairs are surfaced in a "Connections" section:

```
Habit Connections
  Exercise ↔ Meditate     87% co-occurrence
  Journal ↔ Read           72% co-occurrence
  Exercise → Water          When you exercise, you drink water 91% of the time
```

Tapping a pair shows a small Venn-style overlap count: "Both done: 12 days / Only Exercise: 2 / Only Meditate: 3 / Neither: 4."

**Key decisions:**
- Only show correlations above 65% (below that, it's noise)
- Requires 14+ days of overlap data before computing (avoids spurious early signals)
- Read-only / informational — no actions attached. The insight is the value.
- Negative correlations hidden (showing "when you do X, you skip Y" is discouraging)

**Why it's different:** Habit Stacking (parked) chains habits in sequence by user design. Habit Pairs discovers natural associations from actual data. Narrative View (J2) tells a story from data. Habit Pairs reveals a specific, actionable structural insight: these habits support each other, protect that link.

**Data model:** No changes. Correlation is computed client-side from the logs object (count co-occurrence days for each pair). O(n²) over habits, O(d) over dates — trivial for typical habit counts (<20 habits, <365 days).

**Effort:** ~30 min

---

### R6. Weekly Digest (Outbound Summary)

**Dimension 111: The app reaches out to you**

The app is entirely pull-based: you open it, you see your data, you close it. If you forget to open it, nothing happens. No proposal generates an outbound summary — a periodic "here's how your week went" view that you encounter without opening the habit tracker.

**What it does:** A "Weekly Summary" view (accessible via a tab or auto-shown on Mondays) shows:

```
Week of Oct 21–27

Completion rate: 34/42 (81%) — up from 74% last week
Best day: Tuesday (6/6)
Hardest habit: Spanish (3/7)
Most consistent: Meditate (7/7) — 4th perfect week in a row

Your streaks:
  Meditate    45 days (personal best!)
  Exercise    19 days (2 away from record)
  Journal     12 days
```

**Key decisions:**
- Shown as an in-app view first (no email infrastructure needed)
- Auto-surfaces on Monday — if you open the app, you see the summary before the grid
- Past summaries are browsable (week picker)
- No judgment language — "hardest habit" is neutral, not "you failed at Spanish"
- Combines well with Personal Records (R4) — streaks section shows records

**Why it's different:** Narrative View (J2) generates prose from data. Weekly Digest is a structured, periodic snapshot with specific numbers. Full Analytics Dashboard (parked) is an always-available deep-dive. Weekly Digest is a scheduled, glanceable summary optimized for "how did I do?" not "show me everything."

**Data model:** No changes. Computed from existing logs. The week picker needs only the current date to calculate windows.

**Effort:** ~30 min

---

## Novelty Matrix

| ID | Feature | Blind Spot | Prior Coverage |
|----|---------|-----------|---------------|
| R1 | Streak Freeze | Planned absence | Grace days are reactive; Comeback Mode is after-the-fact; Freeze is proactive |
| R2 | Today Bar | Quick check-in | Now Mode replaces the view; Today Bar augments it without mode-switching |
| R3 | Habit Timer | Duration tracking | Effort Budget estimates cost; Timer measures it |
| R4 | Personal Records | Self-competition | Celebrations are momentary at fixed milestones; Records are ongoing personal bests |
| R5 | Habit Pairs | Cross-habit analysis | All 105 proposals analyze habits individually |
| R6 | Weekly Digest | Outbound summary | All proposals are pull-based; Digest pushes a periodic snapshot |

---

## Consolidated Execution Backlog

Draws from the best of 105+ proposals (A through R), re-ranked by impact and dependency.

### Tier 0 — Fix What's Broken (~30 min)

These are bugs, not features. Ship before anything else.

| # | Item | Why | Est. |
|---|------|-----|------|
| 0.1 | API error handling (`if (!res.ok) throw` in api.ts) | Data-loss bug: server errors silently corrupt state | 10 min |
| 0.2 | Add PUT /api/habits/:id (edit endpoint) | Blocks every feature that adds editable fields | 10 min |
| 0.3 | Data migration function | Fill missing fields with defaults on server read | 5 min |
| 0.4 | Remove orphaned index.css | Dead code that conflicts with App.css | 2 min |
| 0.5 | Reset data.json to empty | Test data shouldn't ship | 1 min |

### Tier 1 — Daily Delight (~60 min, pick 3)

Small features that make the app feel alive. Each is independent.

| # | Feature | Est. | Source | Impact |
|---|---------|------|--------|--------|
| 1.1 | **Today Bar** | 20 min | **R2** | Every daily session starts faster |
| 1.2 | **Personal Records** | 20 min | **R4** | Ongoing motivation without any new UI complexity |
| 1.3 | **Completion Celebrations** | 25 min | M1 | Core interaction feels rewarding |
| 1.4 | **Streak Freeze** | 25 min | **R1** | Vacation doesn't destroy progress |
| 1.5 | **Anchor Statements** | 10 min | C3 | One optional text field, big emotional payoff |

### Tier 2 — Structural Depth (~90 min, pick 3)

Features that change the app's capabilities.

| # | Feature | Est. | Source | Impact |
|---|---------|------|--------|--------|
| 2.1 | **Habit Zones** | 35 min | L3 | Adapts the view to what needs attention |
| 2.2 | **Starter Packs** | 30 min | L1 | New users get started in 30 seconds |
| 2.3 | **Difficulty Curve** | 25 min | L4 | Normalizes struggle; reduces early dropout |
| 2.4 | **Now Mode** | 35 min | L5 | Single-action focus for overwhelmed moments |
| 2.5 | **Drag-to-Reorder** | 25 min | M2 | Basic UX: put important habits first |

### Tier 3 — Intelligence (~80 min, pick 2)

Features that make the app smarter over time. Need 2+ weeks of data.

| # | Feature | Est. | Source | Impact |
|---|---------|------|--------|--------|
| 3.1 | **Weekly Digest** | 30 min | **R6** | Periodic summary gives meaning to daily tracking |
| 3.2 | **Habit Pairs** | 30 min | **R5** | Reveals hidden connections between habits |
| 3.3 | **Habit Timer** | 35 min | **R3** | Measures actual duration; calibrates expectations |
| 3.4 | **Context Routines** | 45 min | L2 | Time-of-day structure; "what should I do now?" |
| 3.5 | **Comeback Mode** | 30 min | K2 | Warm re-entry after a gap |

### Tier 4 — Differentiation (~120 min)

Ship when core UX is solid.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 4.1 | Living Garden View | 60 min | Parked (app's namesake) |
| 4.2 | Habit Scaling (micro/standard/stretch) | 45 min | K1 |
| 4.3 | Habit Conversations | 55 min | J4 |
| 4.4 | Anti-Habits | 55 min | K4 |

### Parked

| Feature | Reason |
|---------|--------|
| PWA / Offline / Export | Infrastructure, not a feature |
| Social / Sharing | Separate scope; the app is personal-first |
| Full Analytics Dashboard | Needs months of data; premature |
| Custom Scheduling (Mon/Wed/Fri) | Routines (L2) handle the more common need |

---

## Recommended First Session

**Time budget: 60 minutes. Goal: the app goes from "demo" to "usable."**

1. **Tier 0 (all 5 items)** — 28 min. The app becomes correct.
2. **Today Bar (R2)** — 20 min. Daily check-in becomes a one-tap flow.
3. **Anchor Statements (C3)** — 10 min. Each habit gains a "why."

After this session: the app handles errors properly, has an edit endpoint for future features, and adds two user-facing improvements that make daily usage noticeably better.

---

## What This Replaces

All 21 prior planning documents:
PLAN.md, ROADMAP.md, BACKLOG.md, FEATURES_v3–v16, FEATURES_FINAL.md, FEATURES_NEW.md, FEATURES_AND_BACKLOG.md, FEATURE_PLAN.md, FEATURE_REVIEW_2026-10-29.md, FEATURE_REVIEW_2026-10-30.md

**The planning-to-code ratio is 11:1 and climbing. The next step after reading this document is to open api.ts and add error handling — Tier 0.1. Not another plan.**
