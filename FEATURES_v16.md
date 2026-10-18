# Habit Garden — Feature Plan v16: Breaking the Planning Loop

**Date:** 2026-10-18
**Status:** 4 genuinely novel features (H1-H4) + final consolidated backlog
**Context:** 15 prior documents, 8,060 lines of planning, 74 proposed features, **0 shipped**

---

## The Elephant in the Room

This is the 16th planning document. The project has produced ~8x more planning text than application code. Every prior document ends with some variant of "the next commit should be code." None of them were followed by code.

This document does two things the others didn't:
1. Proposes features that genuinely don't exist in any prior document (not reframings)
2. Draws a hard line: the top 3 items in the backlog are small enough to implement in a single session

---

## What's Actually Novel After 74 Proposals

After reviewing every proposal across v3-v15, PLAN.md, and BACKLOG.md, four genuinely untouched angles remain. These aren't reframings — each addresses a capability gap no prior proposal touches.

### H1. Time-of-Day Context Sorting

**The gap:** The app shows all habits in creation order at all times of day. No proposal addresses *when* during the day a habit is relevant. Morning habits shown at 10pm (when it's too late) create guilt. Evening habits shown at 7am create noise.

**What it does:**
- Each habit gets an optional time-of-day slot: Morning / Afternoon / Evening / Anytime
- The habit list auto-sorts by relevance: morning habits first in the AM, evening habits first in the PM
- Past-slot habits get a subtle dimming (not hidden — still completable, just visually deprioritized)
- "Anytime" habits sit in the middle, always at normal prominence

```
7:30 AM view:                    9:00 PM view:
  ☀ Meditate 10 min  [today]      🌙 Journal          [today]
  ☀ Exercise 30 min  [today]      🌙 Read 20 pages     [today]
  ─ Read 20 pages    [anytime]    ─ Drink water        [anytime]
  🌙 Journal         [evening]    ☀ Meditate 10 min   [done ✓]
```

**Why it's different from everything prior:**
- Habit Scheduling (G1/v9) is about *which days*. Time-of-Day is about *which hours*.
- Today Dashboard (D3) filters habits but doesn't time-sort.
- Energy-Aware Check-In (N3) adjusts expectations by energy, not by time.
- Focus Spotlight (F2) highlights one habit. Time sorting reorders *all* habits by temporal relevance.

The insight: the most effective habit cue isn't a notification — it's seeing the right habit at the right time. Time sorting turns the habit list itself into a contextual cue system.

**Data model:**
```typescript
type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'anytime'

type Habit = {
  // ...existing
  timeSlot?: TimeSlot  // default: 'anytime'
}
```

**Effort:** ~20 min. One optional field, sort function based on current hour, subtle visual styling for past-slot items. No server logic needed beyond storing the field.

---

### H2. Streak Transfer (Carry Momentum Between Habits)

**The gap:** When a user replaces one habit with a better version (e.g., "Walk 15 min" → "Run 30 min"), they lose all streak history. The new habit starts at zero, which is psychologically devastating after building a long streak. No prior proposal addresses habit evolution that preserves momentum.

**What it does:**
- When creating a new habit, the user can optionally "transfer from" an existing habit
- The old habit is automatically archived
- The new habit inherits the old one's streak count and completion history
- The UI shows a "Previously: Walk 15 min (47 days)" note on the new habit for the first week
- In history views, the transferred streak shows as a continuous line with a marker at the transition point

```
Run 30 min    Streak: 52 days    (transferred from "Walk 15 min" on Oct 5)
├── Walk 15 min:  Oct 5 ←── Sep 10  (47 days)
└── Run 30 min:   Oct 18 ←── Oct 5  (13 days, continuing)
```

**Why it's different from everything prior:**
- Difficulty Progression (N5) adds levels within one habit. Streak Transfer is for genuinely *different* habits where the old name no longer applies.
- Edit Habit (Phase 0) changes the name in place. Transfer creates a new habit with explicit lineage, preserving both the old and new identity in history.
- Habit Evolution/Morph (F3, parked) was described as automatic detection. Transfer is explicit, intentional, user-initiated.

The behavioral science: loss aversion is the #1 reason users don't upgrade their habits. "I'll lose my 47-day streak" prevents growth. Transfer removes the penalty for evolving.

**Data model:**
```typescript
type Habit = {
  // ...existing
  transferredFrom?: {
    habitId: string
    habitName: string
    transferDate: string
    inheritedStreak: number
  }
}
```

**Effort:** ~30 min. Transfer flow in habit creation, archive of old habit, streak calculation that adds inherited count, lineage display in HabitRow.

---

### H3. Completion Heatmap by Hour (When Do You Actually Do Things?)

**The gap:** Multiple proposals track *which days* habits are completed (14-day grid, heatmap, year-at-a-glance). F1 (Completion Timestamps) records the time silently. But no proposal *visualizes* the time-of-day dimension. When you complete habits reveals powerful patterns invisible in day-level data.

**What it does:**
- Silently records completion timestamp (like F1)
- Shows a 24-hour × 7-day heatmap per habit:

```
Exercise — When you actually do it:
         Mon  Tue  Wed  Thu  Fri  Sat  Sun
  6 AM    ██   █░   ██   █░   ░░   ░░   ░░
  7 AM    ░░   ██   ░░   ██   ██   ██   ██
  8 AM    ░░   ░░   ░░   ░░   ░░   ░░   ░░
  ...
  → You exercise earlier on Mon/Wed, later on weekends.
  → Peak window: 6-7 AM weekdays, 7-8 AM weekends.
```

And a global view across all habits:

```
Your habit rhythm:
  ████ 6-8 AM:   Exercise, Meditate (14 completions/week)
  ██░░ 12-1 PM:  Read (3 completions/week)
  ████ 9-10 PM:  Journal, Read (10 completions/week)
  ░░░░ 2-6 PM:   Dead zone — no habits completed here
```

**Why it's different from everything prior:**
- Completion Timestamps (F1) records silently with "best window" insight. Heatmap by Hour is a full 2D visualization, not a single stat.
- Miss Pattern Map (E3) shows when habits are *missed*. This shows when they're *done*.
- 30-Day Heatmap (v10) is a 1D calendar heatmap (which days). This is 2D (which hours × which days).
- Start Friction Log (C5) captures difficulty. This captures timing — a different behavioral signal.

The insight: most people think they have fixed routines, but completion time varies dramatically by day-of-week. Seeing the actual pattern lets users schedule around their natural rhythm rather than against it. A "dead zone" that persists for weeks means that time slot is genuinely unavailable — stop scheduling habits there.

**Data model:**
```typescript
// Extend the log toggle to optionally record time
type HabitLog = {
  [habitId: string]: Array<string | { date: string; time: string }>
}
// Backward-compatible: existing string entries have no time data.
// New completions store { date: "2026-10-18", time: "07:23" }
```

**Effort:** ~40 min. Timestamp recording on toggle, 2D grid component, hour × day-of-week aggregation. Needs ~2 weeks of data to be useful.

---

### H4. Habit Vacation Mode (Per-Habit Pause with Return Date)

**The gap:** Quiet Weeks (N7) pauses *all non-core* habits for a week. Grace Days (N2) protects individual days. But neither handles a targeted pause: "I'm pausing Exercise for 2 weeks while my knee heals, but everything else continues." No proposal addresses per-habit temporary suspension with a scheduled return.

**What it does:**
- Any habit can be put on "vacation" with a return date
- Paused habits show in a collapsed "On Vacation" section with countdown:
  ```
  On Vacation
    Exercise 30 min — returns Oct 25 (7 days)
    Guitar practice — returns Nov 1 (14 days)
  ```
- Streak is frozen during vacation (not broken, not advancing)
- On the return date, the habit reappears in the active list with its pre-vacation streak intact
- If the user completes the habit during vacation (it's still togglable), the vacation ends early

**Why it's different from everything prior:**
- Archive hides a habit permanently until manually restored. Vacation has a return date.
- Quiet Weeks (N7) is a global week-long reduction. Vacation is per-habit and any duration.
- Grace Days (N2) preserves the streak for individual missed days. Vacation freezes the streak for a continuous period.
- The key behavioral difference: archive implies "I'm done with this." Vacation implies "I'll be back." The framing matters — users who archive during injury often never come back. A return date creates a commitment to resume.

**Data model:**
```typescript
type Habit = {
  // ...existing
  vacation?: {
    startDate: string
    returnDate: string
    preVacationStreak: number
  }
}
```

**Effort:** ~25 min. Vacation modal with date picker, streak freeze logic, "On Vacation" UI section, auto-resume on return date.

---

## Why H1-H4 Are Genuinely New

| ID | Feature | Novel Dimension | Why 74 Prior Proposals Missed It |
|----|---------|----------------|----------------------------------|
| H1 | Time-of-Day Sorting | Temporal relevance of *when today* to show each habit | All proposals treat the habit list as static-ordered. Time is addressed for scheduling (which days), not display ordering. |
| H2 | Streak Transfer | Preserving momentum across habit evolution | All proposals treat habits as either permanent or replaceable. The in-between (evolve while keeping progress) is unaddressed. |
| H3 | Hour Heatmap | 2D time visualization (hour × day-of-week) | All time analysis is 1D (which days). The hour dimension reveals a fundamentally different pattern set. |
| H4 | Habit Vacation | Per-habit temporary suspension with scheduled return | Pause mechanisms are either global (Quiet Weeks) or day-level (Grace Days). Per-habit multi-day pause with auto-resume is new. |

---

## Final Consolidated Backlog

This replaces the backlogs in all 15 prior documents. Features are drawn from the best proposals across all documents, ranked by impact-to-effort ratio.

### Tier 1: Ship Today (combined ~70 min, no dependencies)

These are bugs and missing basics. Each is independently implementable.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 1 | **API error handling** — add `if (!res.ok) throw` in all api.ts functions | 15 min | v15 0.1 |
| 2 | **Edit habit** — PUT endpoint + inline edit UI in HabitRow | 40 min | v15 0.2 |
| 3 | **Unarchive** — POST endpoint + archived habits section | 30 min | v15 0.3 |

### Tier 2: Immediate UX Wins (each independent, ~20-30 min)

Small features that transform the daily experience. Pick any, in any order.

| # | Feature | Est. | Source | Why High Priority |
|---|---------|------|--------|-------------------|
| 4 | **Time-of-Day Sorting** | 20 min | **H1** | Makes the list useful at every hour, not just creation order |
| 5 | **Momentum Decay Sparkline** — 7-day colored blocks per row | 25 min | C2 | Ambient trend signal with zero interaction cost |
| 6 | **Habit Templates** — pre-filled habit library for cold start | 25 min | G5 | Solves onboarding; demonstrates advanced habit types |
| 7 | **Anchor Statement** — optional "why I do this" text | 10 min | C3 | Tiniest effort, highest psychological impact |
| 8 | **Habit Vacation Mode** | 25 min | **H4** | Prevents archive-and-never-return during life disruptions |

### Tier 3: Data Model Expansion (~35-50 min each)

These expand what a "habit" can be. Each is independently implementable.

| # | Feature | Est. | Source | Unlocks |
|---|---------|------|--------|---------|
| 9 | **Custom Scheduling** (Mon/Wed/Fri) | 45 min | G1 | Accurate streaks for real-world schedules |
| 10 | **Quantitative Habits** (6/8 glasses) | 50 min | G2 | Partial progress, precise compound tracking |
| 11 | **Quit/Avoidance Mode** (days since) | 35 min | G3 | Entirely different motivational model |
| 12 | **Tags & Categories** | 40 min | G4 | Grouped views, per-area health scores |
| 13 | **Streak Transfer** | 30 min | **H2** | Habit evolution without losing momentum |

### Tier 4: Engagement & Intelligence (need 2+ weeks of data)

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 14 | **Completion Sparks** (micro-celebrations) | 45 min | N8 |
| 15 | **Weekly Rhythm Score** (consistency %) | 30 min | C4 |
| 16 | **Compound Progress** (pages, km tallies) | 30 min | C1 |
| 17 | **Hour Heatmap** (when you actually do things) | 40 min | **H3** |
| 18 | **Friction Log** (easy/pushed/hard per completion) | 30 min | C5 |
| 19 | **Weekly Compass** (intention setting + review) | 80 min | N4 |

### Tier 5: Depth Features (need 1+ months of data)

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 20 | **Miss Pattern Map** | 45 min | E3 |
| 21 | **Year-at-a-Glance Heatmap** | 45 min | D1 |
| 22 | **Habit Pair Discovery** (correlations) | 50 min | D4 |
| 23 | **30-Day Inline Heatmap** (expandable per habit) | 35 min | v10 |
| 24 | **Streak Milestones** (7/30/90/365 celebrations) | 50 min | v9 |

### Parked (valid, not now)

| Feature | Reason |
|---------|--------|
| Living Garden View | High effort; build when daily use is solid |
| Habit Stacking / Chains | Complex data model; needs simpler features first |
| Energy-Aware Check-In | Needs Minimum Viable Day concept |
| Difficulty Progression | Nice-to-have after quantitative habits exist |
| Streak Insurance / Grace Days | Nice-to-have streak variation |
| Earned Streak Shields | Gamification can wait |
| Quick Command Bar | Power feature for 20+ habits |
| PWA / Offline / Data Export | Separate project scope |
| Dashboard / Analytics | Needs months of real data |
| Theme Toggle | Cosmetic, not behavioral |

---

## The Total Picture

| Metric | Value |
|--------|-------|
| Planning documents (including this one) | **16** |
| Total planning lines | **~8,400** |
| App code lines | **~960** |
| Features ever proposed | **78** (74 prior + H1-H4) |
| Features shipped | **0** |
| Backlog items in this document | **24** (curated from 78) |
| Estimated total implementation (Tiers 1-4) | **~540 min (~9 hours)** |
| Estimated Tier 1 alone | **~70 min** |

---

## Recommendation

The project's problem is not insufficient planning. It's the opposite. Every scheduled run produces another document; none produces code.

**Tier 1 (items 1-3) should be the next commit.** They total ~70 minutes of implementation, fix real usability gaps, and prove the project can ship. After that, Time-of-Day Sorting (H1) and Anchor Statement (#7) are the highest-impact features relative to their size.

The backlog above is the final one. It doesn't need a v17.
