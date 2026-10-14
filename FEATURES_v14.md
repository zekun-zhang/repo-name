# Habit Garden — Feature Plan v14: Novel Dimensions & Reorganized Execution Plan

**Date:** 2026-10-14
**Status:** 5 new feature proposals (F1-F5) targeting gaps untouched by all 64 prior proposals, plus a reorganized execution backlog
**Supersedes:** All prior documents for backlog purposes

---

## Meta-Analysis: The Planning Debt Crisis

| Metric | Value |
|--------|-------|
| Planning documents | 14 (including this one) |
| Planning lines | ~8,000+ |
| Application code lines | ~960 |
| Features proposed across all docs | 64 (dims 1-49, C1-C5, D1-D5, E1-E5) |
| Features shipped | **0** |
| Planning-to-code ratio | **~8.5:1** |
| Commits containing TypeScript | **0 since initial scaffold** |

Every document since v10 has said "this is the last plan." This one makes a different promise: it identifies what the 64 proposals *collectively* missed, then provides a reorganized execution plan that prioritizes ruthlessly.

---

## Systematic Gap Analysis: What 64 Proposals Collectively Miss

All 64 prior proposals were audited across 14 conceptual axes. Five axes have zero coverage:

| Gap | Description | Why It Matters |
|-----|-------------|----------------|
| **Avoidance behaviors** | Every proposal models habits as positive actions to START. None models behaviors to STOP. | Half of meaningful behavior change is elimination — no sugar, no phone in bed, no late-night snacking. The psychology differs fundamentally (approach vs. avoidance motivation). |
| **Time-of-day** | Completions store dates (YYYY-MM-DD). No proposal captures WHEN during the day a habit was completed. | Time-of-day consistency is one of the strongest predictors of habit automaticity (Wood & Neal, 2007). A habit done at the same time daily is 3x more likely to persist. |
| **Capacity management** | No proposal warns about over-commitment. Users can add unlimited habits with no friction. | Over-commitment is the #1 killer of habit systems. Planning fallacy (Kahneman & Tversky, 1979) ensures people systematically underestimate how much time habits require. |
| **Meta-level streaks** | Every streak is per-habit. No proposal measures "did I complete ALL my habits today?" | The "perfect day" is a powerful motivational unit. It shifts identity from "person doing habits" to "person who shows up fully." |
| **Action reversal** | Toggle is instant and irreversible within a session. No undo mechanism exists. | Misclicks on a 14-day grid of tiny cells are inevitable, especially on mobile. Every major app has undo. |

---

## New Feature Proposals

### F1. Anti-Habits (Avoidance Tracking)

**Gap filled:** Every one of 64 proposals assumes habits are things you DO. None addresses things you want to STOP doing.

**What:** A new habit type — "avoid" — alongside daily and weekly. When you create an anti-habit, the completion logic inverts: you mark days you SUCCESSFULLY AVOIDED the behavior.

```
Create a habit

Name:       No social media after 9pm
Type:       [Avoid ▼]      ← NEW option alongside Daily / Weekly
Color:      [●]
```

In the grid, anti-habits display differently:

```
No social media after 9pm    🛡️ 12 days    ■ ■ ■ ■ □ ■ ■ ■ ■ ■ ■ □ ■ ■
No sugar                     🛡️  5 days    ■ ■ □ ■ ■ ■ ■ □ □ ■ ■ ■ ■ ■
```

Key differences from regular habits:
- Streak label uses a shield icon (🛡️) instead of fire (🔥) — defense, not offense
- Empty cells represent FAILURES (you did the thing you wanted to avoid)
- Default state each day is "succeeded" — you only need to mark failures
- This means anti-habits auto-complete: the toggle marks a LAPSE, not a completion

The auto-complete inversion is the critical design choice. For avoidance habits, the goal is NOT doing something — so the default should be success, and the user taps only when they lapse. This reduces friction on good days to zero.

**Why it's different from every existing proposal:**
- **Miss Reason (dim 45)** captures why you missed a positive habit. Anti-habits track negative behaviors as first-class entities.
- **Habit Experiments (dim N5 area)** time-boxes any habit. Anti-habits are a distinct *type* of behavior, not a time constraint.
- **Micro-Habit Fallback (D2)** reduces the scope of a positive habit on hard days. Anti-habits operate on a fundamentally different motivational axis — avoidance, not approach.
- No proposal in v3-v13 uses the word "avoid," "stop," "quit," "abstain," or "negative habit."

**Behavioral science:** Approach motivation ("I want to exercise") and avoidance motivation ("I want to stop eating sugar") activate different neural circuits (Elliot & Covington, 2001). They require different reinforcement: approach habits reward completion; avoidance habits reward restraint. Treating them identically (as all 64 proposals do) is a category error.

"Abstinence violation effect" (Marlatt & Gordon, 1985): a single lapse in an avoidance behavior triggers catastrophic thinking ("I already failed, might as well keep going"). The auto-complete-with-lapse-marking design directly counters this: your streak is intact by default. You have to actively CHOOSE to record a lapse. The friction is on the failure side, not the success side.

**Data model:**
```typescript
export type Frequency = 'daily' | 'weekly' | 'avoid'

// No other changes needed. For 'avoid' habits:
// - Dates in the log represent LAPSES, not completions
// - Streak = consecutive days with NO entry in the log
// - Display inverts: logged = failure, not-logged = success
```

**Implementation:**
- Add `'avoid'` to the `Frequency` type
- In HabitRow: if `frequency === 'avoid'`, invert cell display logic (filled = no log entry, empty = log entry)
- In `calculateStreak`: for avoid habits, count consecutive days WITHOUT an entry
- In HabitForm: add "Avoid" option to frequency dropdown, with helper text
- Shield icon instead of fire for avoid streaks
- Different cell color scheme (blue/teal for avoid vs. green for approach)

**Effort:** Small (~25 min). Mostly display logic inversion in existing components. One extra enum value.

---

### F2. Habit Capacity Budget

**Gap filled:** No proposal addresses over-commitment — the silent killer of every habit system. Users can add unlimited habits with zero friction and zero feedback about total load.

**What:** Each habit can optionally specify an estimated time-per-completion (in minutes). The app shows a running total:

```
┌─────────────────────────────────────────┐
│  Daily Time Budget                      │
│                                         │
│  Exercise 30 min       30 min           │
│  Read 20 pages         25 min           │
│  Meditate              10 min           │
│  Journal                5 min           │
│  Cold shower            5 min           │
│  ──────────────────────────────         │
│  Total:          75 min / day           │
│                  (7.8% of waking hours) │
│                                         │
│  ⚡ Sustainable range: 30-90 min/day    │
└─────────────────────────────────────────┘
```

When total exceeds 120 minutes, a gentle warning appears:

```
⚠ Your habits need ~140 min/day. That's ambitious.
  Consider which 1-2 habits matter most this month.
```

This is NOT a hard limit — it's information. The user decides. But making the time cost visible prevents the "just one more habit" spiral that kills most habit systems.

**Why it's different from every existing proposal:**
- **Compound Progress (C1)** tracks cumulative OUTPUT (pages read, km run). Capacity Budget tracks daily INPUT (time required).
- **Time Investment (Phase 5, #33)** tracks time spent over history. Capacity Budget shows time COMMITTED going forward.
- **Focus Mode (v11 UX)** hides habits to reduce clutter. Capacity Budget surfaces the total commitment before clutter becomes a problem.
- **Life Balance Radar (dim 47)** shows distribution across domains. Capacity Budget shows total load regardless of domain.
- No proposal across v3-v13 mentions "time budget," "capacity," "over-commitment," "load," or "time per day."

**Behavioral science:** Planning fallacy (Kahneman & Tversky, 1979): people underestimate the time required for future tasks by 2-3x. Without explicit time budgeting, users who add a "10-minute meditation" don't consider that they already have 90 minutes of habits. The total is invisible until they fail.

"Decision fatigue" (Baumeister et al., 2008): more habits means more daily decisions about when/whether to do each one. The capacity budget makes the decision load visible alongside the time load.

Research on sustainable habit adoption (Lally et al., 2009): participants who adopted ONE new habit at a time had significantly higher success rates than those who adopted multiple simultaneously. The capacity budget nudges toward this naturally.

**Data model:**
```typescript
type Habit = {
  // ...existing
  minutesPerCompletion?: number  // optional, user-estimated
}
```

**Implementation:**
- Add optional `minutesPerCompletion` field to HabitForm (number input, placeholder "How many min?")
- Sum across active daily habits, display in a small budget bar above/below the habit table
- Warning threshold at 120 min
- "Waking hours" percentage assumes 16h day
- Habits without a time estimate are excluded from the total (show "X min + N unestimated")

**Effort:** Small (~20 min). One optional field, one sum calculation, one display component.

---

### F3. Completion Timestamps (Time-of-Day Patterns)

**Gap filled:** Every feature across all 64 proposals tracks WHAT DAY you completed a habit. None tracks WHAT TIME. Time-of-day is one of the most powerful signals in habit science, and the current data model throws it away.

**What:** When a habit is toggled complete, store the ISO timestamp (not just the date). Over time, this reveals time-of-day patterns:

```
Exercise — Completion Times (last 30 days)

  Morning (5-12)    ████████████████████  78%
  Afternoon (12-5)  ████                  16%
  Evening (5-10)    ██                     6%

  Avg completion time: 7:42 AM
  Most consistent window: 7-8 AM (62% of completions)
  Weekend shift: +2.3 hours later than weekdays
```

The immediate value is awareness. The deeper value is that time consistency data enables future features (smart reminders, routine detection, energy-pattern correlation) that are impossible without timestamps.

**Why it's different from every existing proposal:**
- **Temporal patterns (dim area)** refers to day-of-week rhythms and seasonal patterns. Time-of-day is a different axis entirely.
- **Scheduling (v9 backlog #20)** lets you set WHICH days. Timestamps reveal WHEN during those days.
- **Cue Anchoring (dim 46)** captures a text description of the trigger. Timestamps capture the actual behavioral data of when the habit fires.
- **Start Friction Log (C5)** captures difficulty. Timestamps capture timing. Both are per-completion metadata, but they measure orthogonal dimensions.
- No proposal uses the word "timestamp," "time-of-day," "when during the day," or "completion time."

**Behavioral science:** "Habit cue consistency" (Wood & Neal, 2007): habits performed at the same time and place each day become automatic faster. A habit done at 7am every weekday is more automated than one done "sometime in the morning." Timestamps make this consistency measurable.

"Chronotype alignment" (Horne & Ostberg, 1976): morning people and evening people have different optimal windows for willpower-intensive activities. Completion time data, correlated with success/failure patterns, could reveal each user's optimal habit windows — though that analysis is a future feature. The timestamps are the foundation.

Practical insight: a habit that slowly drifts later in the day is a leading indicator of declining motivation, weeks before a streak breaks. This drift is completely invisible without timestamps.

**Data model:**
```typescript
// Change log storage from date strings to timestamp strings
export type HabitLog = {
  [habitId: string]: string[]  // CHANGE: store ISO timestamps instead of date strings
  // e.g., "2026-10-14T07:42:00.000Z" instead of "2026-10-14"
  // For toggle/display, extract the date portion
  // For time analysis, use the full timestamp
}
```

This is a backward-compatible change: existing date strings (`"2026-10-14"`) can be treated as "no time data" and new entries store full timestamps. No migration needed — just start storing richer data.

**Implementation:**
- In `toggle` (useHabits.ts): store `new Date().toISOString()` instead of the date string
- In all date comparisons: extract date portion with `.slice(0, 10)` or `split('T')[0]`
- `calculateStreak` and grid display: compare date portions only (backward compatible)
- New utility: `getCompletionHour(timestamp)` for future time-of-day analysis
- Time-of-day visualization: a future feature that reads from the now-available timestamps

**Effort:** Tiny (~15 min). Change what gets stored on toggle. Everything else continues working via date extraction. Visualization is a separate, future feature — this just captures the data.

---

### F4. Perfect Day Streak (Meta-Streak)

**Gap filled:** Every streak is per-habit. No proposal measures the meta-question: "Did I show up for ALL my habits today?" The "perfect day" is a motivational unit that no individual habit streak can provide.

**What:** A small counter displayed prominently (header area or above the habit table) showing how many consecutive days the user has completed ALL their active daily habits:

```
┌──────────────────────────────────────────────┐
│  🌟 Perfect Days: 5                          │
│  You've completed all habits for 5 days      │
│  straight. Personal best: 12 days.           │
└──────────────────────────────────────────────┘
```

Rules:
- Only counts daily habits (weekly habits are excluded — they don't have a daily expectation)
- Anti-habits count as "complete" if no lapse was recorded
- A day with zero active habits doesn't count (prevents gaming)
- The counter resets to 0 when any habit is missed
- Personal best is tracked and displayed

The perfect day streak creates a *system-level* motivation that individual streaks can't. Breaking a single habit's streak is painful. Breaking a perfect day streak adds social proof from your other habits: "I did 4 out of 5 today, I should have done the fifth."

**Why it's different from every existing proposal:**
- **System Score (dim 31)** is a continuous percentage. Perfect Day is binary: all or nothing. The simplicity is the feature.
- **Streak Milestones (v9)** celebrate individual habit milestones. Perfect Day celebrates showing up for your whole system.
- **Today Dashboard (D3)** shows today's habits. Perfect Day adds a system-level score to that view.
- **Weekly Rhythm Score (C4)** measures per-habit weekly consistency. Perfect Day measures per-day cross-habit completeness.
- No proposal uses the phrase "perfect day," "all habits," "system streak," or "meta-streak."

**Behavioral science:** "Identity-based habits" (Clear, 2018): the most durable motivation comes from identity ("I am someone who shows up"). A perfect day streak reinforces the identity of being "someone who does all their habits," which is more powerful than being "someone who exercises."

"Complementarity effect" (Fishbach et al., 2006): completing one goal increases motivation to complete related goals. The perfect day streak formalizes this into a visible metric — each completed habit is both an end in itself and a step toward the perfect day.

"Loss aversion" (Kahneman & Tversky, 1979): the pain of losing a 5-day perfect streak creates stronger motivation than the pleasure of extending it. The meta-streak leverages loss aversion at the system level, where it's most effective.

**Data model:** None. Pure computation from existing data.

**Implementation:**
- Filter active daily habits (not archived, frequency === 'daily')
- For each day backward from today: check if ALL daily habits have a log entry
- Count consecutive "all complete" days
- Track personal best in a simple counter (can store in a new `meta` field in data.json, or compute from history each load)
- Display in header area with current streak + personal best
- Optional: subtle celebration animation when a new personal best is set

**Effort:** Small (~20 min). One computation function, one display component. No server changes if personal best is computed from history.

---

### F5. Contextual Undo

**Gap filled:** Toggle is instant and irreversible within a session. On a grid of 14 columns and N rows of 26x26px cells, misclicks are inevitable. No proposal addresses action reversal.

**What:** After any destructive or state-changing action (toggle, archive, delete), a toast appears with an "Undo" button that persists for 5 seconds:

```
┌─────────────────────────────────────────────┐
│  ✓ Marked "Exercise" complete for Oct 14    │
│                                    [Undo]   │
└─────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────┐
│  📦 Archived "Journal"                      │
│                                    [Undo]   │
└─────────────────────────────────────────────┘
```

For delete: the undo toast persists for 10 seconds, and the delete is delayed (soft-delete with timeout, not immediate API call) so undo can cancel it before data is lost.

```
┌─────────────────────────────────────────────┐
│  🗑️ Deleted "Cold shower" — undoing in 10s  │
│                                    [Undo]   │
└─────────────────────────────────────────────┘
```

Technical approach: the existing optimistic update pattern is already 80% of the way there. Optimistic updates save the previous state and roll back on failure. Undo is the same pattern triggered by user choice instead of API failure.

**Why it's different from every existing proposal:**
- The closest existing feature is optimistic rollback — but that's automatic and invisible (API failure → silent restore). Undo is user-initiated and visible.
- **Delete confirmation (window.confirm)** is a prevention mechanism. Undo is a correction mechanism. Prevention asks "are you sure?" before the action. Undo says "it's done, but you can reverse it." Research shows undo is superior: it doesn't interrupt flow and handles mistakes the user didn't anticipate at the confirmation prompt.
- No proposal uses the word "undo," "revert," "redo," or "action history."

**Behavioral science:** "Recognition over recall" (Nielsen, 1994): undo lets users explore without fear. When actions are reversible, users interact more freely. When they're not, users hesitate — adding friction to every toggle, which is exactly the wrong place for friction in a habit tracker.

"Error recovery" is one of Nielsen's 10 usability heuristics. The current app violates it: a misclick on the wrong day cell has no recovery path except clicking again (which might be confusing — "did I toggle it on or off?"). Undo resolves ambiguity.

Gmail's "Undo send," Google Drive's "Undo delete," and Slack's "Undo message" all demonstrate that undo is a fundamental UX expectation for destructive actions.

**Data model:** None. Uses existing optimistic update state.

**Implementation:**
- Extend the existing toast system: add `action` callback and "Undo" button
- On toggle/archive: store the pre-action state in a `lastAction` ref
- Undo button calls the rollback function (already exists in the optimistic pattern)
- For delete: delay the API call by 10 seconds. If undo is clicked, cancel the pending request and restore state. If the timer expires, proceed with the delete.
- Only one undo is active at a time (new action replaces the previous undo)

**Effort:** Small (~25 min). The hardest part is the delayed delete. Toggle and archive undo reuse existing rollback logic.

---

## What Makes F1-F5 Different From Everything Before

| ID | Feature | Gap | Why 64 Prior Proposals Missed It |
|----|---------|-----|----------------------------------|
| F1 | Anti-Habits | No avoidance behaviors | All 64 proposals model habits as positive actions. Avoidance is a fundamentally different motivational category. |
| F2 | Capacity Budget | No over-commitment awareness | All 64 proposals add features. None asks: "can the user handle what they already have?" |
| F3 | Completion Timestamps | No time-of-day data | All 64 proposals store dates. None stores times. This is a data capture gap, not a feature gap — but without the data, an entire class of insights is impossible. |
| F4 | Perfect Day Streak | No meta-level streak | All 64 proposals measure habits individually. None measures the system as a daily unit. |
| F5 | Contextual Undo | No action reversal | All 64 proposals add new actions. None makes existing actions reversible. |

---

## Reorganized Execution Backlog

This section synthesizes the best items from all 14 documents into a single prioritized list. Items are ranked by: (1) severity of gap, (2) effort-to-impact ratio, (3) independence from other features.

### Tier 0: Non-Negotiable Foundations

The app is missing basic CRUD. Nothing else matters until these ship. Combined: ~85 min.

| # | Feature | What | Est. | Source |
|---|---------|------|------|--------|
| 1 | API error handling | Check `res.ok` in all `api.ts` fetch calls, surface failures in toast | 15 min | Multiple docs |
| 2 | Edit habit | PUT `/api/habits/:id` + inline edit in HabitRow (name, color, frequency) | 40 min | Multiple docs |
| 3 | Unarchive | POST `/api/habits/:id/unarchive` + "Archived" section in UI | 30 min | Multiple docs |

**Exit criteria:** All five CRUD operations work (create, read, update, archive/unarchive, delete). API failures show user-visible errors.

### Tier 1: Daily Experience (pick any, build one at a time)

Features that change how the app feels to use every single day. Sorted by effort ascending.

| # | Feature | Est. | Source | What It Does |
|---|---------|------|--------|--------------|
| 4 | Cue anchoring | 10 min | v11 | Optional "when/where" text per habit |
| 5 | Anchor statement | 10 min | C3 | Optional "why I do this" text |
| 6 | Completion timestamps | 15 min | **NEW F3** | Store full timestamps, not just dates |
| 7 | Capacity budget | 20 min | **NEW F2** | Show total daily time commitment |
| 8 | Perfect day streak | 20 min | **NEW F4** | Meta-streak: consecutive days with ALL habits done |
| 9 | Anti-habits | 25 min | **NEW F1** | Track behaviors to avoid, inverted completion logic |
| 10 | Contextual undo | 25 min | **NEW F5** | Undo toggle/archive/delete with toast button |
| 11 | Momentum sparkline | 25 min | C2 | 7-day colored density blocks per habit row |
| 12 | Smart priority queue | 30 min | E4 | Sort habits by urgency (at-risk first) |
| 13 | Compound progress | 30 min | C1 | "You've read 2,940 pages" cumulative output |
| 14 | Micro-habit fallback | 30 min | D2 | Tiny version of a habit for hard days |
| 15 | Habit ordering | 35 min | v9 | Manual drag/up-down reordering |
| 16 | Today dashboard | 35 min | D3 | Focused daily checklist view |

### Tier 2: Motivation & Depth

Features that deepen engagement. Most work with existing data from day one.

| # | Feature | Est. | Source | What It Does |
|---|---------|------|--------|--------------|
| 17 | 2-Day Rule mode | 35 min | v10 | Never-miss-twice streak alternative |
| 18 | Weekly rhythm score | 30 min | C4 | Per-habit weekly consistency % |
| 19 | Inline 30-day heatmap | 35 min | v10 | Expandable 30-day color grid per habit |
| 20 | Streak recovery mode | 40 min | D5 | 3-day recovery window after a long streak breaks |
| 21 | Challenge mode | 40 min | E2 | Time-bounded goals with trophy case |
| 22 | Quick command bar | 45 min | E5 | Ctrl+K text commands for power users |
| 23 | Miss pattern map | 45 min | E3 | Day-of-week failure analysis |
| 24 | Accountability snapshot | 50 min | E1 | Shareable progress card image |
| 25 | Streak milestones | 50 min | v9 | Celebrate 7/30/90/365 with badges |

### Tier 3: Intelligence & Analytics (needs 30+ days of data)

| # | Feature | Est. | Source | What It Does |
|---|---------|------|--------|--------------|
| 26 | Miss reason capture | 40 min | v11 | One-tap reason after a missed day |
| 27 | Start friction log | 30 min | C5 | One-tap difficulty after completing |
| 28 | Year-at-a-glance graph | 45 min | D1 | 365-day contribution graph |
| 29 | Habit pair discovery | 50 min | D4 | Which habits co-occur in your data |
| 30 | Habit maturity/graduation | 55 min | v11 | Automaticity detection + Hall of Fame |

### Parked (valid, wrong time)

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | The name implies it. Build when the app has users who need delight. |
| Life Balance Radar | Needs categories/tags infrastructure first |
| Habit Stacking / Chains | Complex data model for a 960-line app |
| Data Export/Import | Important eventually, not a daily experience improvement |
| PWA / Offline | Separate project, large effort |
| Theme Toggle | Cosmetic; the dark theme works |
| Earned Streak Shields | Needs streak milestones + 2-day rule first |
| Weekly Compass | Needs simpler reflection features first |
| Difficulty Progression | Needs micro-habit fallback and maturity detection first |

---

## Feature Interaction Map (F1-F5 + Key Prior Features)

```
                    Tier 0: Foundations
          ┌──── API Errors ─── Edit ─── Unarchive ────┐
          │                                            │
          ▼                                            ▼
    F5 Undo ──────────────────────────────────── F1 Anti-Habits
    (safer interaction)                          (new habit type)
          │                                            │
          ▼                                            ▼
    F4 Perfect Day ←── Daily Habits ──→ F2 Capacity Budget
    (meta-streak)      (existing)       (total load awareness)
          │                                    │
          ▼                                    ▼
    E4 Smart Priority                   F3 Timestamps
    (urgent first)                      (time-of-day data)
          │                                    │
          ▼                                    ▼
    D3 Today Dashboard              Future: Time-of-Day Analysis
    (focused daily view)            Future: Routine Detection
```

All features are independently buildable. Arrows show enhancement relationships.

---

## Reasoning: Why These Five and Not Others

### Selection criteria

1. **Novelty:** Must address a gap that NONE of the 64 prior proposals touch. No repackaging.
2. **Effort:** Must be buildable in under 30 minutes. The project needs momentum, not ambition.
3. **Daily impact:** Must change the daily experience, not add an analytics view used monthly.
4. **Data foundation:** Prefer features that capture data enabling future features (F3 timestamps) over features that only display data.
5. **Independence:** Must work without any other feature being built first.

### Why F1 (Anti-Habits) over more streak variations

The project has 7 streak-related proposals (strict, recovery, 2-day, grace days, shields, milestones, insurance). Adding an 8th would be diminishing returns. Anti-habits expand the *category* of behaviors the app can track — a qualitative expansion, not a quantitative one.

### Why F2 (Capacity Budget) over more analytics

Every analytics proposal (system score, slump radar, momentum decay) tells you how you're doing AFTER the fact. Capacity budget intervenes BEFORE — it prevents over-commitment, which is the root cause of the system failures those analytics would detect.

### Why F3 (Timestamps) over more visualizations

Timestamps are infrastructure, not a feature. The 5 visualization proposals (heatmap, year graph, sparkline, DNA, heartbeat) all visualize existing date data from different angles. Timestamps capture a new DIMENSION of data that makes an entire class of future features possible. It's the highest-leverage change per line of code.

### Why F4 (Perfect Day) over system score

System Score (dim 31) is a weighted aggregate that requires tuning constants and explaining its formula. Perfect Day is binary: did you do everything? Yes or no. The simplicity makes it understandable at a glance and motivating without explanation.

### Why F5 (Undo) over command bar

Quick Command Bar (E5) adds a new interaction mode. Undo fixes a gap in the EXISTING interaction mode. Fixing what exists is more important than adding alternatives. And undo reuses the optimistic update pattern that's already implemented — it's a natural extension of existing architecture.

---

## Implementation Notes

All five features follow the project's existing architecture:

- **F1 (Anti-Habits):** Extends `Frequency` type, inverts display logic in HabitRow, inverts streak calculation. One new enum value, no new endpoints.
- **F2 (Capacity Budget):** One optional field on Habit type, one summing function, one display component. Extend existing POST/PUT.
- **F3 (Timestamps):** Change one line in toggle handler (store ISO timestamp instead of date string). All existing code works via `.slice(0, 10)`. Backward compatible.
- **F4 (Perfect Day):** Pure computation from existing data. New display-only component.
- **F5 (Undo):** Extends existing toast system with action callback. Reuses existing optimistic rollback state.

Total estimated effort for all five: ~105 minutes.
No breaking changes. No migrations. No new API endpoints (except extending existing PUT for F2's optional field).

---

## The Planning Loop Ends Here

This project has spent 14 sessions planning and 0 sessions building. The features list is comprehensive — 69 items across 5 tiers, covering streaks, visualization, motivation, analytics, UX, social, challenges, avoidance behaviors, and capacity management.

The constraint is not ideas. It never was. The constraint is execution.

**Recommendation for the next session:**
1. Build Tier 0 items 1-3 (~85 min). These are bugs and missing basics.
2. Pick ONE item from Tier 1. Build it. Ship it.
3. Repeat step 2 until you run out of time.
4. Do not open this file or any FEATURES file. Open a .ts or .tsx file.
