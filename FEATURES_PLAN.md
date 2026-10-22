# Habit Garden — Feature Plan K

**Date:** 2026-10-22
**Purpose:** Five genuinely novel feature proposals + actionable execution plan
**Status:** Complements ROADMAP.md (the execution backlog); adds features that 88 prior proposals missed

---

## The Elephant in the Room

| Metric | Value |
|--------|-------|
| Application code | ~960 lines, 11 source files |
| Planning documents | **18** (including this one) |
| Total features proposed | **93** (88 prior + 5 here) |
| Features shipped | **0** |
| Planning-to-code ratio | ~10:1 |

This document exists because the scheduled task asked for it. But the honest assessment: **this project does not need more feature proposals.** It needs its first shipped feature. ROADMAP.md's Tier 0 (bug fixes, ~45 min) has been the correct next step for months.

That said, the five proposals below genuinely address dimensions that none of the prior 88 proposals touch. Each targets a structural assumption baked into every prior proposal.

---

## Prior Proposal Coverage Map

Before proposing anything, here is what the 88 prior proposals already cover:

| Theme | Sample Proposals | Count |
|-------|-----------------|-------|
| More metrics/visualizations | Heatmaps, sparklines, radar charts, compound tallies | ~18 |
| Softer streak mechanics | 2-day rule, shields, grace days, flexible counting | ~8 |
| Completion metadata | Friction logs, miss reasons, context tags, timestamps | ~10 |
| Scheduling flexibility | Custom days (Mon/Wed/Fri), time-of-day patterns | ~5 |
| Engagement/emotional | Narratives, conversations, sparks, time capsules, anchors | ~12 |
| Prioritization/energy | Effort budget, minimum viable day, energy check-in | ~6 |
| Habit lifecycle | Maturity detection, graduation, sunset gallery | ~7 |
| Reflection/review | Weekly compass, rhythm scores, weekly summaries | ~6 |
| Relationships | Habit stacking, ripple effects, cross-habit influence | ~4 |
| Identity/gamification | Garden view, badges, system scores, identity statements | ~7 |
| Infrastructure | PWA, offline, export, analytics dashboard | ~5 |

**Shared assumption across all 88:** Every proposal treats habit completion as **binary** (done/not done), habits as **open-ended** (no planned end date), and each attempt as **isolated** (no learning from past attempts at the same habit).

---

## New Feature Proposals (K1–K5)

### Design Principle

These five proposals each challenge one of the structural assumptions listed above. They don't add more data to the same paradigm — they change the paradigm itself.

---

### K1. Habit Experiments (Time-Boxed Trials)

**Structural assumption challenged:** Habits are open-ended commitments.

Every prior proposal — including Habit Sunset (J3), which addresses endings — assumes that when you create a habit, you're committing indefinitely. The user's only options are "maintain forever" or "give up." This creates commitment anxiety that prevents people from even starting.

**What it does:**

When creating a habit, the user chooses a mode:

```
Create a habit

Name:       Morning meditation
Frequency:  [Daily]
Mode:       ○ Ongoing (track indefinitely)
            ● Experiment (try for a set period)

Experiment length:  [21 days]  [30 days]  [60 days]
```

An experiment habit works identically to a regular habit but has three key differences:

1. **A visible countdown.** "Day 14 of 21" appears on the habit row. This creates positive anticipation instead of the dread of "forever."

2. **A built-in decision gate.** When the experiment ends, the app presents a structured review:

```
┌─────────────────────────────────────────────────────┐
│  Experiment Complete: Morning Meditation (21 days)   │
│                                                      │
│  Results:                                            │
│    Completed: 17 of 21 days (81%)                    │
│    Longest streak: 9 days                            │
│    Average difficulty: Easy (if friction data exists) │
│                                                      │
│  What would you like to do?                          │
│                                                      │
│  [ Keep as ongoing habit ]                           │
│  [ Run another experiment (30 days) ]                │
│  [ Archive — learned what I needed ]                 │
│  [ Drop — not for me ]                               │
│                                                      │
│  Optional: What did you learn?                       │
│  ┌──────────────────────────────────────────┐        │
│  │ Meditation works for me but 10 minutes   │        │
│  │ is too long. 5 minutes is sustainable.   │        │
│  └──────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

3. **An experiment history.** Past experiments are preserved with their results and learnings. When the user creates "Meditation" again six months later, they see: "You tried this before (Jul 2026, 21 days, 81%). Your note: '5 minutes is sustainable.'" This connects to K3 (Habit Archaeology).

**Why none of the 88 proposals cover this:**
- Habit Sunset (J3) addresses endings but only after the user has committed to an ongoing habit and wants to exit. Experiments never *start* as open-ended.
- Habit Maturity & Graduation (dim 48) auto-detects when a habit is automated. Experiments are user-directed and time-bounded from creation.
- Weekly Compass (N4) is periodic reflection. Experiments are a one-time structured evaluation at a predefined endpoint.

**Behavioral science:** "Commitment devices" research (Bryan et al., 2010) shows that bounded commitments have higher follow-through than unbounded ones. "I'll meditate every day" is intimidating. "I'll try meditating for 21 days" is approachable. The decision gate at the end addresses "escalation of commitment" bias (Staw, 1976) — without a forcing function, people either abandon habits silently (guilt) or maintain them past usefulness (inertia). The experiment frame also leverages "growth mindset" (Dweck, 2006) — you're not failing at meditation, you're running a personal experiment.

**Data model:**
```typescript
type Habit = {
  // ...existing
  mode?: 'ongoing' | 'experiment'
  experimentDays?: number       // 21, 30, 60
  experimentStartDate?: string  // ISO date
  experimentNote?: string       // learning captured at review
}
```

**Effort:** ~35 min. Mode selector on create form, countdown display on habit row, review modal at experiment end, experiment history query.

---

### K2. Partial Completions (Spectrum Mode)

**Structural assumption challenged:** Completion is binary (done/not done).

Every single one of the 88 proposals operates on the binary completion model inherited from the original design. Friction Log (C5) captures *difficulty* but still records the day as done or not done. Effort Budget (J1) prioritizes which habits to attempt but doesn't model partial effort. The only states are checked and unchecked.

**What it does:**

Each habit can opt into "spectrum mode" where completion is a range:

```
Exercise 30 min
  ○ Skip    ◐ Partial (did some)    ● Full
```

Tapping the day cell cycles through three states instead of two:
- **Empty** (didn't attempt) — gray cell, as today
- **Partial** (did some but not the full target) — half-filled cell with habit color at 50% opacity
- **Full** (completed as intended) — fully filled cell, as today

The 14-day grid gains a richer visual texture:

```
Exercise   ● ● ◐ ● ○ ● ● ◐ ○ ● ● ● ◐ ●
           Full completions: 10  Partials: 3  Skips: 1
```

Key design decisions:
- **Partial counts toward streaks at reduced weight.** A partial day doesn't break a streak but counts as 0.5 toward streak-dependent features. This is configurable per habit.
- **The option is per-habit, not global.** "Drink 8 glasses of water" stays binary. "Exercise 30 min" gains a spectrum. The user decides which habits benefit from nuance.
- **No free-text amounts.** The user doesn't enter "15 minutes" — just taps partial or full. This keeps the interaction fast. The granularity is in the *acknowledgment* of partial effort, not in precise measurement.
- **Partial is always better than skip.** The app never punishes partial completion or suggests it's insufficient. The message is: "You showed up. That counts."

**Why none of the 88 proposals cover this:**
- Compound Progress (C1) tracks cumulative output but still per binary completion. 1 completion = 20 pages. There's no "I read 10 pages."
- Friction Log (C5) captures difficulty post-completion. It doesn't change the completion model itself.
- Difficulty Progression (N5) adjusts what "full" means over time. Partial Completions acknowledges that some days you can't hit "full" and that's okay.
- 2-Day Rule (dim 42) softens streak breakage. Partial Completions softens *daily* assessment.

**Behavioral science:** "All-or-nothing" thinking is the #1 predictor of habit abandonment (Marlatt & Gordon, 1985). The binary model reinforces it: you either checked the box or you didn't. Spectrum mode breaks the false dichotomy. BJ Fogg's Tiny Habits research shows that "doing a scaled-down version" of a habit maintains the neural pathway even when full execution isn't possible. A 10-minute walk when you planned 30 minutes of exercise isn't failure — it's the minimum effective dose. By making partial visible and valued, the app aligns with how sustainable habits actually work: imperfectly.

**Data model:**
```typescript
type Habit = {
  // ...existing
  spectrumMode?: boolean  // opt-in per habit
  partialStreakWeight?: number  // 0-1, default 0.5
}

type HabitLog = {
  [habitId: string]: string[]  // existing: full completions
}

type PartialLog = {
  [habitId: string]: string[]  // new: partial completion dates
}
```

Two separate arrays keep backward compatibility — existing code reads `HabitLog` unchanged, and `PartialLog` is additive.

**Effort:** ~40 min. Spectrum toggle on habit form, three-state day cell, partial log storage, adjusted streak calculation, visual styling for partial state.

---

### K3. Habit Archaeology (Learn From Past Attempts)

**Structural assumption challenged:** Each habit attempt is isolated.

When a user deletes "Exercise" and creates it again three months later, the new habit starts from zero. All prior proposals treat this as correct — a fresh start. But the user's relationship with exercise didn't reset. They have experience, patterns, and learnings from the previous attempt(s) that could inform this one. No proposal connects past and present attempts at the same behavior.

**What it does:**

When creating a habit, the app checks for similar past habits (by name similarity — fuzzy match on "Exercise", "Work out", "Gym", etc., and exact match on archived/deleted habits with the same name). If found:

```
┌─────────────────────────────────────────────────────┐
│  You've tracked something similar before:            │
│                                                      │
│  "Exercise 30 min" — Jan 15 to Mar 22, 2026         │
│    Duration: 67 days                                 │
│    Best streak: 14 days                              │
│    Completion rate: 61%                              │
│    Pattern: Strong Mon-Wed, dropped off Thu-Sat      │
│    Ended: Archived (no sunset note)                  │
│                                                      │
│  "Morning run" — Jun 3 to Jun 28, 2026              │
│    Duration: 25 days                                 │
│    Best streak: 8 days                               │
│    Completion rate: 48%                              │
│    Pattern: Skipped rainy days consistently          │
│    Experiment note: "Running outside doesn't work    │
│    for me in summer heat"                            │
│                                                      │
│  Suggestions based on your history:                  │
│  • Your best days were Mon-Wed. Consider scheduling  │
│    for those days instead of daily.                  │
│  • Your previous attempts lasted 25-67 days. An     │
│    experiment of 30 days matches your natural cycle. │
│                                                      │
│  [ Start fresh ]  [ Continue from last attempt ]     │
│  [ Apply suggestions ]                               │
└─────────────────────────────────────────────────────┘
```

"Continue from last attempt" restores the previous habit's accumulated data (total completions, experiment notes) and adds it to the new habit's history. The streak resets (you haven't been doing it), but the *lifetime relationship* with this behavior is preserved.

The key insight: **people don't fail at habits; they iterate.** Attempt #3 at exercise isn't a failure — it's a refinement. Archaeology reframes the narrative from "I keep failing at exercise" to "I'm on my third iteration of exercise, and each time I learn something."

To make this work, deleted/archived habits are soft-retained (their metadata and aggregate stats persist even when the habit is removed from the active view). This is already partially true — `data.json` stores logs even after deletion, they just aren't cleaned up.

**Why none of the 88 proposals cover this:**
- Retroactive Recognition (I2) finds habits you were doing *before* you started tracking. Archaeology finds habits you *previously tracked and stopped*.
- Habit Sunset Gallery (J3) preserves retired habits. But it doesn't surface that data when you create a new, similar habit.
- Habit Maturity (dim 48) detects when a habit is automated. Archaeology detects when a habit is being *reattempted*.

**Behavioral science:** "Iterative goal pursuit" (Carver & Scheier, 1998) — people who frame goal abandonment as "iteration" rather than "failure" are significantly more likely to re-engage. By showing history from previous attempts, the app normalizes iteration. "Desirable difficulty" theory (Bjork, 1994) — learning is deeper when it involves retrieval of prior experience. Seeing "your best days were Mon-Wed" retrieved from past data is more persuasive than a generic tip because it's *your own* evidence.

**Data model:**
```typescript
type HabitArchive = {
  id: string
  name: string
  frequency: Frequency
  startDate: string
  endDate: string
  totalCompletions: number
  bestStreak: number
  completionRate: number
  dayOfWeekPattern: { [day: string]: number }  // completion % per day
  experimentNote?: string
  sunsetReason?: string
}

type Data = {
  // ...existing
  archive?: HabitArchive[]
}
```

When a habit is deleted or archived, its summary is written to the archive array. The full log data can be pruned; only aggregate stats are needed for archaeology.

**Effort:** ~45 min. Archive-on-delete logic, fuzzy name matching, archaeology modal on create, aggregate stat computation from existing logs.

---

### K4. Habit Versioning (Evolve Without Losing Identity)

**Structural assumption challenged:** A habit's definition is fixed at creation.

"Read 10 pages" evolves to "Read 20 pages." "Meditate 5 min" becomes "Meditate 15 min." "Walk 10 min" becomes "Run 3 km." In the current app (and in all 88 proposals), the user must delete the old habit and create a new one, losing all history, streak, and continuity. Or they edit the name and lose the record of what the habit used to be.

**What it does:**

A "Version" action on a habit that creates a new version while preserving the full history:

```
Exercise: Walk 10 min  →  [Evolve this habit]

┌─────────────────────────────────────────────────────┐
│  Evolve: Walk 10 min                                 │
│                                                      │
│  New version:                                        │
│  Name:  [Run 20 min                           ]     │
│                                                      │
│  What's changing?                                    │
│  ○ Increasing difficulty (natural progression)       │
│  ○ Changing approach (same goal, different method)   │
│  ○ Expanding scope (adding to the habit)             │
│  ○ Narrowing scope (making it more focused)          │
│                                                      │
│  [ Evolve ]    [ Cancel ]                            │
└─────────────────────────────────────────────────────┘
```

After evolving:
- The habit row shows the new name and a small version indicator: "Run 20 min (v2)"
- The 14-day grid shows both eras: pre-evolution days in a slightly different shade
- The streak continues (the behavior evolved, not restarted)
- An expandable "History" shows the evolution timeline:

```
Run 20 min (v2) — since Oct 15, 2026
  ↑ Evolved from "Walk 10 min" (increasing difficulty)
Walk 10 min (v1) — Jul 3 to Oct 14, 2026 (104 days, 89 completions)
```

This preserves the *identity* of the habit — "my exercise habit" — while acknowledging that its implementation changes. It's the difference between "I stopped walking and started running" (two disconnected events) and "My exercise habit evolved from walking to running" (one continuous narrative).

**Why none of the 88 proposals cover this:**
- Edit Habit (Tier 0 bug fix) changes the name/metadata but doesn't create a version boundary. The old name is lost.
- Difficulty Progression (N5) tracks levels (beginner/intermediate/advanced) within a fixed habit definition. Versioning handles arbitrary definition changes.
- Habit Sunset + Recreation is the current workaround, but it breaks continuity.

**Behavioral science:** "Identity-based habits" (James Clear, 2018) — the most durable habits are tied to identity ("I'm a runner") not behavior ("I run 3x/week"). Versioning preserves the identity while letting the behavior change. "Self-continuity" research (Chandler et al., 2003) — people who feel connected to their past selves make better decisions. Seeing "v1: walking → v2: running" creates a narrative of *growth*, which is more motivating than starting a new streak from zero.

**Data model:**
```typescript
type HabitVersion = {
  version: number
  name: string
  startDate: string
  endDate?: string
  changeType?: 'difficulty' | 'approach' | 'expand' | 'narrow'
}

type Habit = {
  // ...existing
  currentVersion?: number
  versions?: HabitVersion[]
}
```

Logs remain keyed by habit ID, so all completions across versions are naturally aggregated. The version boundaries are metadata only.

**Effort:** ~30 min. Evolve modal, version history display, version indicator on habit row, server-side version array on habit.

---

### K5. Recovery Ramps (Structured Re-Entry)

**Structural assumption challenged:** After a lapse, you should jump back to full intensity.

When a user misses 5 days of exercise, every prior proposal either punishes them (streak = 0), consoles them (anchor statement, conversation), or protects them (grace days, shields). No proposal helps them *get back on track* with a structured plan. The assumption is that the user should simply resume at full intensity, as if the gap didn't happen.

**What it does:**

When the app detects a lapse (N consecutive missed days for a habit, where N is configurable, default 3), it offers a recovery ramp:

```
┌─────────────────────────────────────────────────────┐
│  Welcome back to Exercise.                           │
│                                                      │
│  You've been away for 5 days. That's okay — breaks   │
│  happen. Want a gentle ramp back?                    │
│                                                      │
│  Suggested recovery (3 days):                        │
│                                                      │
│  Day 1: Reduced scope                                │
│    "Do 10 min instead of 30"                         │
│    Completing this counts as ◐ Partial               │
│                                                      │
│  Day 2: Half scope                                   │
│    "Do 15 min"                                       │
│    Completing this counts as ◐ Partial               │
│                                                      │
│  Day 3: Full scope                                   │
│    "Back to 30 min"                                  │
│    Completing this counts as ● Full                  │
│                                                      │
│  [ Start ramp ]  [ Jump back to full ]  [ Dismiss ]  │
└─────────────────────────────────────────────────────┘
```

During a recovery ramp:
- The habit row shows a subtle progress bar: "Recovery: Day 2 of 3"
- Each ramp day is marked with a special indicator (not full, not partial, but "recovery")
- Completing a ramp day *does not break the streak count* — recovery days bridge the gap between the last completion and the new streak
- The ramp is dismissable at any time (user can jump to full)
- Recovery ramp data is stored so the app can track how the user recovers: "You usually bounce back within 2 days of starting a ramp"

The ramp can integrate with Partial Completions (K2): ramp days are explicitly partial-credit days where reduced effort is the target.

**Why none of the 88 proposals cover this:**
- Grace Days / Streak Insurance protects streaks during absence. Recovery Ramps helps *after* the absence, when resuming.
- Miss Pattern Map (E3) identifies when lapses happen. Recovery Ramps addresses what to do about them.
- Habit Conversation (J4) might say "Will you do it tonight?" — but that's a single question, not a multi-day structured plan.
- Effort Budget (J1) adjusts daily load. Recovery Ramps adjusts load *specifically in the re-engagement window*.
- 2-Day Rule softens the streak math. Recovery Ramps softens the *behavior expectation*.

**Behavioral science:** "Abstinence violation effect" (Marlatt & Gordon, 1985) — after a lapse, the biggest predictor of permanent relapse is the psychological impact of breaking the streak, not the lapse itself. The most dangerous moment is *the day after* a miss, when the user thinks "I already broke it, why bother?" Recovery Ramps addresses exactly this moment with a structured, lower-barrier re-entry. "Graded exposure" (Wolpe, 1958) — clinical psychology has known for decades that the way back to a behavior after disruption is graduated, not sudden. Physical rehabilitation uses ramps. Therapy uses ramps. Habits should too.

**Data model:**
```typescript
type RecoveryRamp = {
  habitId: string
  startDate: string
  totalDays: number
  currentDay: number
  completed: boolean
}

type Data = {
  // ...existing
  recoveryRamps?: RecoveryRamp[]
}
```

**Effort:** ~40 min. Lapse detection logic, ramp proposal modal, ramp progress indicator on habit row, ramp day handling in toggle logic, server-side ramp storage.

---

## Novelty Matrix

| ID | Feature | Structural Assumption Challenged | Why 88 Prior Proposals Missed It |
|----|---------|----------------------------------|----------------------------------|
| K1 | Habit Experiments | Habits are open-ended | All proposals assume indefinite commitment. None models time-bounded trials. |
| K2 | Partial Completions | Completion is binary | All proposals (including metadata proposals) operate on done/not-done. None allows "some." |
| K3 | Habit Archaeology | Each attempt is isolated | All proposals treat habit creation as a fresh start. None connects past and present attempts. |
| K4 | Habit Versioning | Definition is fixed | All proposals assume a habit's name/scope is permanent. None models evolution with continuity. |
| K5 | Recovery Ramps | Resume at full intensity | All proposals address streaks, grace, or consolation. None provides structured re-entry after lapse. |

---

## How K1–K5 Interact

These five features form a coherent lifecycle model:

```
Create → Experiment (K1)
           ↓ (after 21 days)
         Evaluate → Keep as ongoing, iterate, or drop
           ↓ (ongoing)
         Track (binary or spectrum via K2)
           ↓ (habit evolves)
         Version (K4) — "Walk" → "Run", streak preserved
           ↓ (lapse happens)
         Recovery Ramp (K5) — gentle re-entry
           ↓ (abandoned or repeated)
         Archaeology (K3) — learn from past attempts on next try
```

No prior set of proposals formed a coherent lifecycle. They were independent additions. K1–K5 model the complete habit journey: experiment → commit → evolve → lapse → recover → reattempt.

---

## Consolidated Execution Recommendation

### What to do next (in order)

**1. Ship Tier 0 from ROADMAP.md (~45 min)**

| Item | Detail |
|------|--------|
| API error handling | `if (!res.ok) throw` in all `api.ts` functions |
| Edit habit | `PUT /api/habits/:id` + inline edit in HabitRow |
| Unarchive | `POST /api/habits/:id/unarchive` + archived section |
| Clean dead CSS | Remove unused `index.css` |
| Clean test data | Reset `data.json` to `{ "habits": [], "logs": {} }` |

**2. Ship one high-impact, low-effort feature (~30 min)**

Pick ONE from:
- Anchor Statement (C3, ~10 min) — one text field, huge emotional value
- Momentum Decay Sparkline (C2, ~20 min) — pure rendering, no data model changes
- Habit Versioning (K4, ~30 min) — small data model change, big UX win

**3. Ship one paradigm-changing feature (~40 min)**

Pick ONE from:
- Habit Experiments (K1, ~35 min) — changes the commitment model
- Partial Completions (K2, ~40 min) — changes the completion model

**4. Everything else is Tier 2+ in ROADMAP.md**

The full backlog (ROADMAP.md Tiers 1–4 plus K1–K5) represents ~12 hours of work. It should be executed in focused sessions of 1–2 features each, not planned further.

---

## Summary

| | |
|---|---|
| New features proposed | 5 (K1–K5) |
| Structural assumptions challenged | 5 (open-ended, binary, isolated, fixed, full-intensity) |
| Total project proposals to date | 93 |
| Features shipped to date | 0 |
| Recommended next action | **Code Tier 0, not another plan** |
| Estimated Tier 0 time | ~45 min |
| Estimated K1–K5 time (all five) | ~190 min (~3.2 hours) |
