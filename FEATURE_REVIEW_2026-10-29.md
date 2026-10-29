# Habit Garden — Feature Review (2026-10-29)

**Automated review** | Builds on FEATURE_PLAN.md (Oct 25)

---

## State of the Project

| Metric | Value |
|--------|-------|
| Source files | 11 |
| Lines of code | ~960 |
| Working features | Create, toggle (14-day grid), daily/weekly streaks, archive, delete |
| Planning documents | 19 (PLAN, ROADMAP, BACKLOG, FEATURES_v3-v16, FEATURES_FINAL/NEW/AND_BACKLOG, FEATURE_PLAN) |
| Total feature proposals across all docs | 93+ (series A through M) |
| Features shipped from any proposal | **0** |
| Days since last planning doc (FEATURE_PLAN.md) | 4 |

### The Core Problem

This project has a planning-to-execution ratio of infinity. 19 documents, ~10,000 lines of planning prose, zero lines shipped. Each planning session discovers the previous plan, declares it superseded, then generates more plans. **The next high-value action is implementation, not ideation.**

That said, this review was requested, so below are 6 genuinely novel dimensions that all 93+ prior proposals (including the M-series) overlooked, followed by a consolidated priority recommendation.

---

## N-Series: 6 Features Targeting Psychological & Interaction Gaps

### N1. Forgiveness Streak (Resilient Core Metric)

**The problem:** The streak counter resets to 0 on a single missed day. This is psychologically devastating and is the #1 reason people abandon habit trackers. A 45-day streak going to 0 feels like starting over, even though the user completed 45/46 days (97.7%).

**Why 93+ proposals missed it:** Prior proposals (Difficulty Curve, Comeback Mode, Yesterday Recovery) treat missed days as *events to handle*. None questions whether the streak metric itself is flawed. The streak is assumed; it shouldn't be.

**What it does:**
- Adds a "forgiveness" mode per habit: allows 1 miss per 7 days without breaking the streak
- Streak pill shows: `12 days (1 grace used)` — honest but not punishing
- User chooses per habit: strict streak or forgiving streak
- When grace is used, the missed day shows as a hollow circle (not empty, not checked) — "I know you missed it, it's OK"

**Why it matters:** This changes the emotional relationship with the tracker from fear ("don't break it") to confidence ("keep going"). It's the difference between a coach and a drill sergeant.

**Data model change:**
```typescript
type Habit = {
  // ...existing
  forgiveness: 0 | 1 | 2  // grace days per 7-day window, default 0 (strict)
}
```

**Effort:** ~30 min (streak calc change + UI for setting + display)

---

### N2. Undo Toast (Replace Confirm Dialogs)

**The problem:** Delete uses `window.confirm()` — a blocking, ugly browser dialog that interrupts flow. Archive has no confirmation at all. Toggling a wrong day requires re-toggling. Every destructive action is either jarring (confirm dialog) or irreversible (no confirmation).

**Why 93+ proposals missed it:** Every proposal adds new features. None examines the interaction pattern of existing actions. The confirm dialog is invisible because it's "standard."

**What it does:**
- All destructive actions (delete, archive, uncheck) execute immediately
- A toast appears: `"Exercise" deleted · [Undo]` with a 5-second countdown
- Clicking Undo reverses the action (optimistic state is already in memory)
- Replaces the existing `window.confirm` on delete
- The existing toast system (`showToast` in useHabits) gets extended with an action button

**Why it matters:** Undo-toast is both faster AND safer than confirm dialogs. Gmail, Slack, and every modern app uses this pattern. It removes friction from the happy path (user meant to delete) while protecting the unhappy path (user clicked wrong button).

**Data model:** No changes. Uses existing optimistic update pattern — the "previous state" variables (`prevHabits`, `prevLogs`) already exist in useHabits.ts.

**Effort:** ~20 min

---

### N3. Habit Heatmap (Year-at-a-Glance)

**The problem:** The 14-day grid shows recent activity. The streak is a single number. Neither gives the user a visceral sense of long-term progress. "I've been exercising for 4 months" *feels* different when you can see 120 green cells in a grid.

**Why 93+ proposals missed it:** Momentum Sparkline (C2) is a line chart. Narrative View (J2) is text. Weekly Rhythm Score (C4) is a pattern analyzer. None provides the *spatial* sense of time passing that a heatmap gives. The GitHub contribution graph is one of the most psychologically effective progress visualizations ever designed, and no proposal borrows it.

**What it does:**
- Expandable section per habit (or a combined "all habits" view)
- 52 columns × 7 rows grid, one cell per day, colored by completion
- Empty = dark, completed = habit color at full opacity
- Today highlighted with a border
- Hovering a cell shows the date (and any note, if N4 is implemented)
- Toggle between "last 6 months" and "last year"

**Data model:** No changes. Reads existing logs. Needs a `GET /api/logs/:habitId?from=YYYY-MM-DD` endpoint for efficiency (currently all logs load at once — fine for 14 days, wasteful for 365).

**Effort:** ~40 min (CSS grid is trivial; the visual design and responsive behavior need care)

---

### N4. Check-in Notes (Micro-Journal)

**The problem:** When you check off "Exercise," the tracker records a boolean: done or not done. But *what* you did matters. "Ran 5k" vs "10 pushups because I was tired" are both checked, but they tell very different stories. Over months, this context is lost.

**Why 93+ proposals missed it:** Anchor Statement (C3/L-series) adds a static "why" per habit. Narrative View (J2) generates AI summaries. Neither captures per-day context from the user. The check-in is treated as a toggle, never as a moment to capture a thought.

**What it does:**
- After checking a day cell, a small text input appears below it (or as a tooltip)
- Optional — just pressing Enter or clicking away saves without a note
- Notes appear on hover over completed day cells
- In the heatmap (N3), notes appear in the tooltip
- Maximum 140 characters — this is a micro-note, not a journal entry

**Data model change:**
```typescript
type HabitLog = {
  [habitId: string]: Array<{ date: string; note?: string }>
  // Migration: existing string[] converted to { date, note? }[]
}
```

Server: modify toggle endpoint to accept optional `note` field.

**Effort:** ~35 min (includes data migration for existing logs)

---

### N5. Scheduled Rest Days

**The problem:** "Exercise daily" doesn't mean 7 days a week for most people. But "Exercise weekly" (at least once) is too loose. The real intent is "Exercise 5 days, rest on Sunday and Wednesday." The app has no way to express this, so daily habits with planned rest days show false negatives — the streak breaks on a day you *chose* to rest.

**Why 93+ proposals missed it:** Custom Scheduling (Mon/Wed/Fri) was proposed and parked as "Routines cover the common need." But Routines (L2) are about *context* (morning/evening), not *cadence*. A user who exercises Mon-Fri and rests Sat-Sun needs neither a context routine nor a weekly frequency — they need a daily habit with exceptions.

**What it does:**
- When creating/editing a daily habit, optionally select "active days" (default: all 7)
- Rest days show as a distinct visual in the grid: small dash or neutral color
- Rest days do not count against streaks or completion rates
- The streak label becomes: `12 active days` (not "12 days" — acknowledges the schedule)

**Data model change:**
```typescript
type Habit = {
  // ...existing
  activeDays?: number[]  // 0=Sun, 1=Mon, ..., 6=Sat. undefined = all days
}
```

**Effort:** ~25 min

---

### N6. Completion Rate Badge

**The problem:** Streaks are binary — one miss resets everything. Users with 6/7 days completed see "Streak: 0" if they missed today. This is mathematically accurate and psychologically destructive. A completion rate (86% this week, 92% this month) gives credit for *consistency* rather than *perfection*.

**Why 93+ proposals missed it:** Weekly Rhythm Score (C4) analyzes which *days of the week* are strong/weak — it's a pattern tool. Difficulty Curve (L4) predicts expected difficulty. Neither provides a simple, persistent metric that complements the streak. The streak is treated as the only metric; it shouldn't be.

**What it does:**
- Below each habit's streak pill, a small "78% / 30d" label
- Calculated as: (completed active days) / (total active days) over a rolling window
- Window options: 7d, 30d, 90d (user preference, stored locally)
- Color-coded: green >80%, yellow 50-80%, red <50%
- Works with rest days (N5): rest days excluded from both numerator and denominator

**Data model:** No changes. Computed from existing log data.

**Effort:** ~15 min

---

## Novelty Matrix: N-Series vs. All Prior Proposals

| ID | Feature | Dimension | What's Different |
|----|---------|-----------|-----------------|
| N1 | Forgiveness Streak | Core metric redesign | Prior proposals handle missed days as events. This questions whether the metric itself is wrong. |
| N2 | Undo Toast | Interaction safety pattern | Prior proposals add features. This fixes the pattern of existing destructive actions. |
| N3 | Habit Heatmap | Spatial time visualization | Prior proposals add line charts and text. This adds the most proven progress visualization (GitHub graph). |
| N4 | Check-in Notes | Per-day user context | Prior proposals add static metadata. This captures the user's voice at the moment of completion. |
| N5 | Scheduled Rest Days | Cadence precision | Prior proposals add contexts and routines. This lets daily habits have planned exceptions. |
| N6 | Completion Rate | Resilient secondary metric | Prior proposals analyze patterns. This adds a simple number that doesn't punish single misses. |

---

## Updated Priority Recommendation

The FEATURE_PLAN.md (Oct 25) Tier 0-4 structure is sound. The N-series slots in as follows:

### Immediate (Tier 0 — fix what's broken)
*No change from FEATURE_PLAN.md:* API error handling, edit habit, unarchive, clean CSS, clean test data, name uniqueness. ~50 min.

### Tier 1 — Daily Experience (pick 4)
| # | Feature | Source | Est. | Rationale |
|---|---------|--------|------|-----------|
| 1.1 | **Undo Toast** | **N2** | 20 min | Replaces confirm dialogs, improves every destructive action |
| 1.2 | Completion Celebration | M1 | 25 min | Core interaction should feel good |
| 1.3 | Yesterday Recovery | M4 | 20 min | #1 daily friction point |
| 1.4 | **Completion Rate Badge** | **N6** | 15 min | Second metric that doesn't punish single misses |
| 1.5 | Keyboard Quick-Log | M6 | 20 min | Speed up the daily ritual |

**Why N2 and N6 belong in Tier 1:** Undo Toast improves an action users take every day. Completion Rate reframes the entire tracking psychology. Both are small (20 min, 15 min) and change how the app feels more than any information feature.

### Tier 2 — Expand (pick 3)
| # | Feature | Source | Est. |
|---|---------|--------|------|
| 2.1 | Mobile-Responsive View | M3 | 45 min |
| 2.2 | **Forgiveness Streak** | **N1** | 30 min |
| 2.3 | **Scheduled Rest Days** | **N5** | 25 min |
| 2.4 | Drag-to-Reorder | M2 | 30 min |
| 2.5 | Starter Packs | L1 | 30 min |

### Tier 3 — Depth (after real usage)
| # | Feature | Source | Est. |
|---|---------|--------|------|
| 3.1 | **Habit Heatmap** | **N3** | 40 min |
| 3.2 | **Check-in Notes** | **N4** | 35 min |
| 3.3 | Now Mode | L5 | 35 min |
| 3.4 | Difficulty Curve | L4 | 25 min |
| 3.5 | Habit Zones | L3 | 35 min |

---

## Critical Observation

**This is the 20th planning document for a 960-line app that has shipped 0 features from 19 prior plans.** The backlog is not the bottleneck — execution is. Every feature in Tier 0 and Tier 1 is under 25 minutes of work. The entire Tier 0 is 50 minutes.

**Recommendation:** Stop planning. Start with Tier 0.1 (API error handling in api.ts — 5 lines of code). Then 0.2 (edit habit). Ship them. The next planning session should happen after Tier 0 is complete, not before.

---

*This document supplements FEATURE_PLAN.md. It does not replace it — the tier structure and M-series features remain valid. The N-series fills gaps the M-series left.*
