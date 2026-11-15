# Habit Garden — Feature Plan v14: Fresh Perspective & Consolidated Backlog

**Date:** 2026-10-16
**Status:** 5 new feature proposals (F1-F5) + restructured execution backlog
**Supersedes:** All prior documents for backlog purposes

---

## Honest Assessment

| Metric | Value |
|--------|-------|
| **App code** | ~960 lines across 11 source files |
| **Planning docs** | 14 documents (including this one), ~8,000+ lines |
| **Features proposed** | 69 (59 dimensions + C1-C5 + D1-D5 + E1-E5 + this doc) |
| **Features shipped** | **0** |
| **Planning-to-code ratio** | ~8:1 |

The prior 13 documents are well-researched and thorough. The problem isn't the quality of the plans — it's that planning has become the project's primary activity. This document exists because the scheduled task requested it, but it should be the last planning document before code ships.

### What 64 Prior Proposals Cover (Condensed)

Streaks (strict, recovery, 2-day rule, grace, shields, milestones) · Completion metadata (friction, miss reasons, displacement) · Temporal patterns (rhythms, scheduling, time-of-day, seasons) · Habit relationships (stacking, correlation, pair discovery) · Habit evolution (difficulty, inheritance, experiments, maturity) · Analytics (system score, slump radar, heatmaps, momentum decay) · User reflection (weekly compass, notes, confidence, anchor statements) · Life context (chapters, pause, balance radar) · UX (edit, unarchive, templates, ordering, focus mode, shortcuts, command bar) · Identity (living garden, heartbeat, categories) · Consistency (weekly rhythm) · Data (export/import, timestamps) · Views (today dashboard, year graph, 30-day heatmap) · De-escalation (micro-habit fallback) · Social (accountability snapshot) · Goals (challenge mode) · Failure analysis (miss pattern map) · Intelligence (smart priority queue) · Text interaction (quick command bar)

### Five Gaps That Remain

Despite 64 proposals, these dimensions are genuinely unaddressed:

1. **No temporal resolution below "day."** Every log entry is a date. The app knows *that* you exercised on Oct 15, but not *when* — 6am or 11pm. Time-of-day data is an entirely untapped signal.
2. **No habit evolution path.** A habit is created, exists, and is eventually archived or deleted. There's no way to grow a habit ("Jog 10 min" → "Run 5K") while preserving its history. Difficulty Progression (N5) proposes escalating difficulty, but that's algorithmically-driven levels, not user-driven natural evolution.
3. **No forward-looking projection.** Every feature analyzes the past. Nothing says "you have 3 days left this week and need 2 more completions to stay on pace" — actionable present-tense guidance.
4. **No narrative output.** Every visualization is numeric or graphical. No feature translates data into a human-readable story: "This was your strongest week for Exercise since August."
5. **No intentional focus declaration.** Smart Priority (E4) algorithmically ranks habits. But users often know which habit needs attention — they just can't tell the app "this week, center everything around Meditation."

---

## New Feature Proposals

### F1. Completion Timestamps

**Gap:** No temporal resolution below "day."

**What:** When a habit is toggled complete, the app silently records the current time alongside the date. The log model changes from `string[]` (dates) to entries that carry an optional time:

```
Existing:  logs["exercise"] = ["2026-10-14", "2026-10-15"]
Proposed:  logs["exercise"] = [
  { date: "2026-10-14", time: "06:32" },
  { date: "2026-10-15", time: "07:15" }
]
```

The timestamp is captured automatically — no extra UI. The toggle button works exactly the same; the time is just metadata.

**What it unlocks (immediately):**

A small "Best time" indicator per habit:
```
Exercise 30 min    Streak: 12 days    Usually completed at 6:45 AM
Reading 20 pages   Streak: 5 days     Usually completed at 9:30 PM
```

**What it unlocks (later):**
- Time-of-day heatmaps (when are you most productive?)
- "You complete Meditation 90% of the time when you do it before 8am vs. 55% after 6pm"
- Correlation between completion time and next-day follow-through
- Natural scheduling suggestions based on your actual behavior

**Why it's different from everything prior:**
- Time Investment (Phase 5, #33) tracks *duration*. Timestamps track *when you started*, which is a scheduling signal, not an effort signal.
- No existing proposal captures this data. Without it, every future time-based analysis requires a data model migration anyway. Capturing timestamps now is infrastructure that makes later features free.

**Data model:**
```typescript
// Backward-compatible: accept both formats
type LogEntry = string | { date: string; time?: string }
type HabitLog = { [habitId: string]: LogEntry[] }
```

The server normalizes old `string` entries on read. No migration needed — old data works as-is.

**Effort:** Small (~25 min). Modify toggle endpoint to include `new Date().toLocaleTimeString()`, update log normalization, display "Usually at X" from median time. Frontend toggle unchanged.

---

### F2. Focus Spotlight

**Gap:** No intentional focus declaration.

**What:** The user picks one habit to "spotlight" for a chosen period (this week, next 7 days, or until dismissed). The spotlighted habit gets:

```
┌──────────────────────────────────────────────────┐
│  🎯 SPOTLIGHT: Meditation                         │
│                                                    │
│  Day 4 of 7 spotlight    ■ ■ ■ □ · · ·            │
│  This spotlight: 3/4 days (75%)                    │
│  Your anchor: "Five minutes of calm changes my     │
│               whole day"                           │
│                                                    │
│  [End Spotlight]                                   │
└──────────────────────────────────────────────────┘
```

- A prominent card above the habit grid
- The spotlighted habit is pinned to the top of the table
- Its stats (streak, completion rate) are shown in larger format
- If an anchor statement exists (C3), it's displayed prominently

All other habits remain fully functional — Spotlight is additive focus, not subtraction. Only one habit can be spotlighted at a time.

**Why it's different from Smart Priority (E4):**
Smart Priority is algorithmic and changes daily based on risk signals. Spotlight is a *user declaration* — "I know what I need to focus on." The user's judgment and the algorithm's recommendation serve different needs. Smart Priority says "your Exercise streak is at risk." Spotlight says "I've decided this is my Meditation week."

**Why it's different from Focus Mode (v11 UX list):**
Focus Mode *hides* other habits. Spotlight *elevates* one habit without hiding anything. Hiding creates anxiety about unseen obligations; elevation creates clarity without loss.

**Behavioral science:** "Goal shielding" (Shah et al., 2002) — actively prioritizing one goal makes it more resistant to competing goals. Simply declaring a habit as the week's focus creates a commitment device. The spotlight card serves as a persistent visual reminder of that commitment, which research on "implementation intentions" shows increases follow-through by 2-3x.

**Data model:**
```typescript
// Stored in data.json alongside habits and logs
type Spotlight = {
  habitId: string
  startDate: string   // ISO date
  endDate: string     // ISO date
} | null
```

**Effort:** Small (~30 min). One new data field, spotlight card component, pin-to-top sort logic. One new endpoint: PUT `/api/spotlight`.

---

### F3. Habit Evolution (Morph)

**Gap:** No path for a habit to grow without losing its history.

**What:** A "Morph" action on a habit lets the user change its name, frequency, or parameters while preserving its full completion history:

```
Exercise → Edit → [Morph this habit]

Name:       Run 5K           (was: Exercise 30 min)
Frequency:  [Daily]          (unchanged)
Effective:  2026-10-16       (changes apply from today)

History preserved:
  "Exercise 30 min" — Sept 1 to Oct 15 (45 days, 38 completions)
  "Run 5K" — Oct 16 onward
```

The habit retains its ID, logs, and streak. A `history` array records each evolution:

```
Meditation Journey:
  v1: "Meditate 5 min"     Sep 1 – Sep 30    (28/30 days)
  v2: "Meditate 10 min"    Oct 1 – Oct 31    (25/31 days)
  v3: "Meditate 20 min"    Nov 1 – present   (streak: 8 days)
```

This creates a visible growth narrative. The user can see their habit evolve from a small seed to a substantial practice — which IS the story of habit building.

**Why it's different from Edit (Tier 0):**
Edit changes a habit's current properties. Morph creates a *versioned evolution* — the old name and the date of change are preserved as a record. Edit is correction; Morph is growth.

**Why it's different from Difficulty Progression (N5):**
Difficulty Progression proposes algorithmic levels (Easy → Medium → Hard) decided by the app. Morph is user-initiated, free-form, and preserves the specific history of what changed and when.

**Why it's different from Archive + New Habit:**
Archive + new habit breaks the streak, loses the visual continuity, and psychologically frames the change as "giving up on X and starting Y" rather than "growing X into Y." The emotional framing matters enormously for long-term adherence.

**Data model:**
```typescript
type HabitVersion = {
  name: string
  frequency: Frequency
  startDate: string
}

type Habit = {
  // ...existing
  history?: HabitVersion[]  // populated on first morph
}
```

**Effort:** Medium (~40 min). New "Morph" button on HabitRow, morph modal/form, history array push on morph, timeline display in an expandable section. Extend PUT endpoint.

---

### F4. Weekly Story

**Gap:** No narrative output. All insights are numeric.

**What:** Every Monday (or on demand), the app generates a one-paragraph natural-language summary of the past week:

```
┌──────────────────────────────────────────────────┐
│  📖 Your Week: Oct 7 – Oct 13                     │
│                                                    │
│  Strong week overall (82% completion).             │
│  Exercise was your most consistent habit — 7 for   │
│  7, extending your streak to 34 days (a personal   │
│  best). Reading dipped to 3/7, the lowest in 4     │
│  weeks — Fridays and weekends were the gap.         │
│  Meditation held steady at 6/7. You completed      │
│  the most habits on Tuesday and Wednesday.          │
│                                                    │
│  [Dismiss]  [Show last week]                       │
└──────────────────────────────────────────────────┘
```

The narrative is generated entirely from local data using template-based text generation — no AI/LLM calls. The templates follow a simple structure:

1. **Overall verdict:** completion percentage + comparison to prior week
2. **Standout habit:** highest completion rate, streak milestones
3. **Struggling habit:** lowest completion rate, trend direction
4. **Pattern observation:** best/worst day of week

The templates are designed to feel like a coach's weekly check-in, not a dashboard readout. They use complete sentences and comparative language ("the lowest in 4 weeks", "a personal best").

**Why it's different from every prior visualization:**
Every prior proposal produces numbers, charts, or grids. Weekly Story produces *prose*. Humans process narrative differently from data — stories create emotional connection and memory formation that graphs don't (Bruner, 1991). A sentence like "Reading dipped to 3/7, the lowest in 4 weeks" carries more emotional weight than a red bar on a chart.

**Why it's different from Weekly Compass (N4):**
Weekly Compass is *prospective* — setting intentions for the coming week. Weekly Story is *retrospective* — making sense of what happened. They're complementary (and could eventually be combined into a single weekly ritual view).

**Data model:** None. Pure computation from existing logs. Optionally store dismissed story dates to avoid re-showing.

**Effort:** Medium (~45 min). Template engine with ~10-15 sentence templates, data analysis functions (best/worst habit, best/worst day, streak records, week-over-week comparison), dismissable card component. No server changes.

---

### F5. Pace Tracker (Forward Projection)

**Gap:** No forward-looking guidance. All features analyze the past.

**What:** For each habit, a subtle inline indicator shows whether the user is on pace for their weekly target:

```
Exercise      ■ ■ ■ □ · · ·    3/5 by Wed — on pace ✓
Reading       ■ □ □ □ · · ·    1/5 by Wed — behind (need 4 in 4 days)
Meditation    ■ ■ ■ ■ · · ·    4/5 by Wed — ahead 🎯
Journal       □ □ □ □ · · ·    0/5 by Wed — at risk ⚠
```

The calculation is simple: `(completions so far this week) / (expected completions by this day of the week)`.

- **Ahead:** completed more than expected by now → subtle green
- **On pace:** on track → neutral
- **Behind:** fewer than expected → subtle yellow with "need X in Y days"
- **At risk:** mathematically impossible to meet weekly target → red warning

For daily habits, the weekly target defaults to 5/7 (configurable). For weekly habits, it's 1/1.

The "need X in Y days" message is the key feature — it transforms a passive observation ("I've only read once this week") into an actionable plan ("I need to read 4 more times in 4 days").

**Why it's different from Weekly Rhythm Score (C4):**
Rhythm Score looks backward — "you've met your target 11 of 12 weeks." Pace Tracker looks at *this week right now* — "you're behind and here's what it takes to catch up." Rhythm is a report card; Pace is a GPS.

**Why it's different from Smart Priority (E4):**
Smart Priority ranks habits by urgency. Pace Tracker gives specific, quantitative guidance: "need 4 in 4 days." Priority says "this matters most"; Pace says "here's what it will take."

**Why it's different from Momentum Decay (C2):**
Momentum Decay shows a trailing 7-day sparkline of completions — a rearview mirror. Pace Tracker projects forward through the remaining week — a windshield.

**Behavioral science:** "Goal gradient effect" (Kivetz et al., 2006) — motivation increases as you approach a goal. "3/5 by Wednesday" creates a concrete near-term goal that "5/7 this week" doesn't. The "need X in Y days" framing activates loss aversion (Kahneman & Tversky, 1979) — the user sees exactly what they'll lose by not acting, in specific, countable terms.

**Data model:** None. Computed from logs + current day of week.

**Effort:** Small (~25 min). Pace calculation function, inline status text in HabitRow, color-coded indicator. No server changes.

---

## Why F1-F5 Are Different From All 64 Prior Proposals

| ID | Feature | Dimension | Why It's Novel |
|----|---------|-----------|---------------|
| F1 | Completion Timestamps | Temporal resolution | First proposal to capture *when* during the day, not just *which* day. Enables an entire category of future analysis. |
| F2 | Focus Spotlight | Intentional prioritization | Only user-declared focus mechanism. Smart Priority is algorithmic; this is a commitment device. |
| F3 | Habit Evolution | Growth narrative | First proposal to preserve history across habit changes. Creates a visible growth story. |
| F4 | Weekly Story | Narrative output | First proposal to generate prose, not numbers or charts. Different cognitive processing pathway. |
| F5 | Pace Tracker | Forward projection | Only forward-looking feature. Every other proposal analyzes what already happened. |

---

## Restructured Execution Backlog

This replaces all prior backlogs. Three tiers, no tier gates. Each item is independent.

### Tier 0: Non-Negotiable Basics

Ship all three before any other feature. Combined: ~85 min.

| # | Feature | What | Est. | Why First |
|---|---------|------|------|-----------|
| 1 | API error handling | Check `res.ok` in all `api.ts` fetch calls, throw on non-OK | 15 min | The app silently swallows server errors. This is a bug, not a feature. |
| 2 | Edit habit | PUT `/api/habits/:id` + inline edit in HabitRow | 40 min | Users can create but can't fix a typo. |
| 3 | Unarchive | POST `/api/habits/:id/unarchive` + archived section in UI | 30 min | Archive is a one-way door with no return. |

### Tier 1: High-Impact, Low-Effort (pick any order)

These measurably improve daily use. Each stands alone.

| # | Feature | Est. | Source | One-Line Rationale |
|---|---------|------|--------|--------------------|
| 4 | Pace Tracker | 25 min | **NEW F5** | "Need 3 in 4 days" — the only forward-looking guidance |
| 5 | Completion Timestamps | 25 min | **NEW F1** | Silent data capture that unlocks future time-of-day insights |
| 6 | Cue anchoring | 10 min | v11 | "After morning coffee" — where/when trigger per habit |
| 7 | Anchor statement | 10 min | C3 | "Why I do this" — surfaced at streak breaks and milestones |
| 8 | Focus Spotlight | 30 min | **NEW F2** | "This is my Meditation week" — user-declared priority |
| 9 | Today Dashboard | 35 min | D3 | Simple checklist view for daily check-in |
| 10 | Momentum sparkline | 25 min | C2 | 7-day colored density blocks per row — ambient trend |
| 11 | Habit ordering | 35 min | v9 | Up/down reorder, persisted server-side |

### Tier 2: Depth Features (pick any order)

These add psychological depth and richer data.

| # | Feature | Est. | Source | One-Line Rationale |
|---|---------|------|--------|--------------------|
| 12 | Challenge Mode | 40 min | E2 | "30 days of cold showers" — finite goals with trophy case |
| 13 | Weekly Story | 45 min | **NEW F4** | "Strong week — Exercise hit a personal best" — narrative recap |
| 14 | Habit Evolution | 40 min | **NEW F3** | Morph "Jog 10 min" → "Run 5K" without losing history |
| 15 | Accountability Snapshot | 50 min | E1 | Shareable progress card — copy/download PNG |
| 16 | Quick Command Bar | 45 min | E5 | Ctrl+K → "done exercise" — sub-second check-in |
| 17 | Smart Priority Queue | 30 min | E4 | Data-driven ordering with transparent "why" labels |
| 18 | Streak milestones | 50 min | v9 | Celebrate 7/30/90/365 with visual badge |
| 19 | Compound progress | 30 min | C1 | "You've run 267 km" — cumulative output in real units |

### Tier 3: Analytics (need 30+ days of data)

| # | Feature | Est. | Source | One-Line Rationale |
|---|---------|------|--------|--------------------|
| 20 | Miss Pattern Map | 45 min | E3 | "72% of misses happen Fri-Sun" — failure structure |
| 21 | Year-at-a-Glance | 45 min | D1 | 365-day contribution grid per habit |
| 22 | Weekly Rhythm Score | 30 min | C4 | Per-habit weekly consistency % — more forgiving than streaks |
| 23 | Habit Pair Discovery | 50 min | D4 | Which habits co-occur? Find keystone habits |
| 24 | 30-Day Heatmap | 35 min | v10 | Expandable per-habit color grid |
| 25 | Habit Maturity | 55 min | v11 | Automaticity detection + Hall of Fame |

### Parked

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | The differentiator — build when daily experience is solid |
| Habit Stacking / Chains | Complex data model, premature |
| Life Balance Radar | Needs categories system |
| Streak Shields / Grace Days | Needs simpler streak improvements first |
| Data Export/Import | Important eventually, not a daily-experience improvement |
| PWA / Offline | Separate project |
| Theme Toggle | Cosmetic, not blocking |

---

## Key Architectural Observations

Before implementing any features, these code-level issues are worth noting:

1. **No `res.ok` checks in `api.ts`** — Every API call silently accepts non-2xx responses. `fetchHabits()` calls `res.json()` even on 500s. This will cause confusing errors as features grow.

2. **No frontend tests** — The server has 17 Jest tests. The frontend has zero. As the component count grows, regressions will be invisible.

3. **Log format migration** — Feature F1 (timestamps) changes the log format. The server should handle both `string` and `{date, time}` entries. This is the only breaking change in the entire backlog and it's minor.

4. **No habit `position` field** — Habit ordering (item #11) requires a sortable field. Without it, habits display in insertion order. Adding `position: number` to the Habit type should happen with or before the ordering feature.

5. **JSON file scaling** — The flat-file storage works for a single user. If multi-user or sync is ever needed, this is the migration point. For now, it's fine.

---

## Recommendation

The single highest-value action is **not** implementing a new feature. It's shipping Tier 0 (items 1-3): API error handling, edit, and unarchive. These are bugs and missing basics, not features. Combined estimate: 85 minutes.

After Tier 0, the highest-impact feature for the lowest effort is **F5: Pace Tracker** (25 min). It adds genuine utility that no other habit app provides, requires no data model changes, and is purely a frontend computation on existing data.

The measure of this document's success is whether the next commit contains TypeScript, not whether the plan is good.
