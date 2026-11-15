# Habit Garden — Final Feature Plan & Backlog

**Date:** 2026-10-20
**Status:** 5 novel features (I1-I5) + consolidated execution backlog
**Replaces:** FEATURES_v3-v16, PLAN.md, BACKLOG.md (16 documents, ~8,400 lines, 78 proposals, 0 shipped)

---

## Audit Summary

### What the App Does Today

| Component | Details |
|-----------|---------|
| **Frontend** | React 19 + TypeScript + Vite. ~960 lines across 11 files |
| **Backend** | Express server with flat-file JSON storage (`data.json`) |
| **Features** | Create habit (name, frequency, color), toggle completions on 14-day grid, daily/weekly streaks, archive, delete |
| **UX** | Optimistic UI with rollback, toast notifications, dark theme, responsive 2-column layout |
| **Data model** | `Habit { id, name, frequency, color, createdAt, archived }` + `HabitLog { [habitId]: string[] }` |

### What's Broken or Missing (Basics)

1. **No API error handling** — `api.ts` never checks `res.ok`; server errors are silently swallowed
2. **No edit habit** — users must delete and recreate to change a habit's name or settings
3. **No unarchive** — archived habits are invisible with no way to restore them
4. **No input validation on frontend** — empty or whitespace-only names submit without warning

### Architectural Observations

- Server uses a file-based JSON store with an async mutex — adequate for single-user, will need migration for multi-user
- No test files found in the frontend; server `app.js` exports a factory function suggesting test infrastructure exists elsewhere
- CSS is split between `index.css` (generic Vite template styles, mostly unused) and `App.css` (actual app styles) — `index.css` should be cleaned up
- The `index.css` `:root` variables define a light theme that's entirely overridden by `App.css` body styles — dead code

---

## New Feature Proposals (I1-I5)

After reviewing all 78 prior proposals across 16 documents, these five features address genuinely untouched dimensions. Each targets a behavioral or UX gap that no prior proposal covers.

### I1. Silent Streaks (Per-Habit Streak Visibility Toggle)

**The gap:** Every habit tracker displays streaks prominently. Every prior proposal (Streak Insurance, Grace Days, Recovery Mode, Transfer, Shields, 2-Day Rule) tries to *soften* streak mechanics. None questions whether showing the streak at all is the right choice for every habit.

**The problem it solves:** For creative, therapeutic, or exploratory habits (journaling, meditation, art practice), streak visibility creates performance pressure that undermines the habit's purpose. A writer who journals "because I'll lose my 47-day streak" isn't journaling — they're streak-maintaining. The motivation has shifted from intrinsic to extrinsic, which research shows degrades the quality and durability of the behavior.

**What it does:**
- Each habit gets a toggle: "Show streak" (default: on)
- When off, the streak pill disappears from that habit's row
- The streak still calculates in the background (for milestones, analytics, etc.)
- At milestones (30, 90, 365 days), a one-time gentle reveal: "By the way — you've journaled for 90 days straight"
- The milestone reveal is warm, not urgent — it doesn't ask you to "keep it going"

```
Exercise 30 min     48 days    [✓ ✓ ✓ ✓ _ ✓ ✓ ✓ ...]    ← streak visible
Journal             Daily      [✓ ✓ ✓ _ ✓ ✓ ✓ ✓ ...]    ← streak hidden
Meditation          Daily      [✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ...]    ← streak hidden
```

**Why it's different from everything prior:**
- Streak Insurance/Grace Days/Shields all *protect* streaks. Silent Streaks *hides* them. Different axis entirely — visibility vs. fragility.
- Anchor Statement (C3) adds motivation text. Silent Streaks removes a motivation signal. Complementary, not overlapping.
- No prior proposal acknowledges that streak visibility itself can be harmful for certain habit types.

**Behavioral science:** Self-determination theory (Deci & Ryan, 1985) distinguishes intrinsic vs. extrinsic motivation. External metrics (streaks, scores, badges) can "crowd out" intrinsic motivation for activities that are inherently meaningful. The effect is well-documented in creativity research (Amabile, 1996): external evaluation decreases creative output. Silent Streaks lets users protect intrinsic motivation for habits where it matters most, while keeping external motivation for habits where it helps (exercise, study).

**Data model:**
```typescript
type Habit = {
  // ...existing
  showStreak?: boolean  // default: true (backward-compatible)
}
```

**Effort:** ~15 min. One optional boolean field, conditional rendering of streak pill, milestone check on toggle.

---

### I2. Retroactive Habit Recognition ("I Was Already Doing This")

**The gap:** Every proposal assumes habits start on the day the user creates them in the app. No proposal addresses the reality that people download a habit tracker *because* they already have habits — they want to formalize and track something they've been doing for weeks or months.

**The problem it solves:** A user who's been meditating for 3 months starts using Habit Garden. Their streak reads "0 days." They have zero history. This is demoralizing and factually wrong. The tracker doesn't reflect their actual behavior, which immediately undermines trust in the tool.

**What it does:**
- When creating a habit, an optional toggle: "I've already been doing this"
- If toggled, a date picker appears: "When did you start?"
- The app backfills a daily completion record from the start date to today
- The backfilled period shows as a slightly different visual in the 14-day grid (a softer checkmark or outline) to distinguish "self-reported history" from "tracked completions"
- Streak calculates from the original start date, giving the user credit for their actual consistency
- A small "tracking since [date]" note appears on the habit

```
Create a habit

Name:       Meditate 10 min
Frequency:  [Daily]
Color:      [●]
[✓] I've been doing this already
    Started: [August 15, 2026]       ← 66 days ago
    How consistent? [Most days ▾]    ← fills ~85% of days randomly

Result: Meditate 10 min    ~56 days    [░ ░ ✓ ✓ ░ ✓ ✓ ░ ✓ ✓ ✓ ✓ ✓ ✓]
                                         ^ backfilled     ^ tracked
```

The "how consistent" dropdown (Every day / Most days / A few times a week) controls backfill density so users aren't claiming perfect attendance they didn't have.

**Why it's different from everything prior:**
- Edit Habit changes metadata. Retroactive Recognition creates *history*.
- Streak Transfer (H2) copies history from one habit to another. Retroactive Recognition creates history from nothing for a brand-new habit.
- Habit Time Machine navigates past data. This *generates* past data from self-report.
- No prior proposal addresses the cold-start problem for habits the user already has.

**Behavioral science:** The "fresh start effect" (Dai, Milkman & Riis, 2014) shows people are more motivated after temporal landmarks. But there's a tension: fresh starts are motivating, but *erasing* actual progress is demotivating. Retroactive Recognition resolves this tension — you get the fresh start of tracking in a new tool while preserving the motivational weight of your existing effort. The visual distinction between backfilled and tracked days is critical: it's honest (self-reported vs. verified) while still acknowledging the user's real history.

**Data model:**
```typescript
type Habit = {
  // ...existing
  retroactiveStart?: string    // ISO date, if set means habit existed before tracking
  retroactiveConsistency?: 'every' | 'most' | 'some'  // controls backfill density
}
// Backfilled dates are stored in the regular logs array — no structural change
// A visual flag comes from comparing the date against createdAt
```

**Effort:** ~35 min. Date picker in HabitForm, backfill generation function, visual distinction in day cells (comparing date < createdAt), streak calculation adjustment.

---

### I3. Habit Debt Dashboard (What You Owe Yourself This Week)

**The gap:** Every proposal shows what you *did* (completion grids, streaks, heatmaps, sparklines). No proposal shows what you *still need to do today or this week* in a single, scannable view. The 14-day grid shows history; it doesn't show the gap between where you are and where you committed to be.

**The problem it solves:** A user with 8 daily habits opens the app at 6 PM. The current UI shows 14 days of history and a streak count. To figure out "what's left today?" they mentally scan 8 rows and check today's column. With weekly habits, it's worse — they have to mentally calculate whether they've hit their weekly target. The cognitive load of extracting "what do I still owe?" from a history grid is the wrong UX for the most common use case: "what should I do right now?"

**What it does:**
A collapsible "Today" panel at the top of the habit list:

```
Today — October 20                    4 of 8 done
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Still to do:
  ○ Exercise 30 min
  ○ Read 20 pages
  ○ Meditate 10 min
  ○ Journal

Done today:
  ✓ Drink water         ✓ Practice guitar
  ✓ Study Spanish       ✓ Walk the dog

Weekly habits — this week: 2 of 3 target
  ○ Deep clean (0/1 this week)
  ✓ Meal prep (1/1 this week)
  ○ Review finances (0/1 this week)
```

Key design choices:
- "Still to do" is the primary section — it's what you came here for
- "Done today" is collapsed/secondary — satisfying to see but not the point
- Weekly habits show progress toward their weekly target, not just today
- Tapping any item toggles it (same as the grid)
- The panel auto-collapses when all items are done, showing "All done!" with the completed count

**Why it's different from everything prior:**
- Today Dashboard (D3) was described as filtering habits — showing a subset. Habit Debt shows *all* habits with explicit done/remaining partitioning and weekly target progress.
- Focus Spotlight (F2) highlights one habit. Debt Dashboard shows the full picture of what's owed.
- Minimum Viable Day marks "core" habits. Debt Dashboard shows remaining work for *all* habits, core or not.
- The 14-day grid is backward-looking. The Debt Dashboard is forward-looking: "what's left?"

**Behavioral science:** The Zeigarnik Effect (1927) — incomplete tasks occupy more mental space than completed ones. A visible list of remaining items creates productive tension (motivation to close the loop) while removing the cognitive burden of extracting that information from a history grid. Implementation intention research (Gollwitzer & Sheeran, 2006) shows that specificity increases follow-through: "I still need to exercise, read, meditate, and journal" is more actionable than "I've done 4 of 8."

**Data model:** None. Pure UI component computed from existing habits and today's logs.

**Effort:** ~30 min. New component that filters habits by today's completion status, weekly target calculation for weekly habits, collapsible sections. No server changes.

---

### I4. Habit Ripple Effects (Cross-Habit Influence Tracking)

**The gap:** Habit Pair Discovery (D4) proposes finding *correlations* between habits — "when you exercise, you're more likely to meditate." That's a statistical observation. No proposal lets users *declare and track* the causal relationships they experience: "Exercise makes journaling easier" or "Skipping sleep ruins everything tomorrow."

**The problem it solves:** Users intuitively know which habits reinforce or undermine each other, but this knowledge stays in their heads. When they're deciding which habit to prioritize on a low-energy day, they can't see which one has the biggest downstream impact. The result: they pick the easiest habit, not the most impactful one.

**What it does:**
- Each habit can have optional "ripple" connections to other habits
- A ripple is directional and typed: "Exercise → Meditation (makes easier)" or "Poor Sleep → Exercise (makes harder)"
- When a habit with downstream ripples is completed, the downstream habits get a subtle visual cue:

```
✓ Exercise 30 min    48 days
  ↳ Usually makes these easier today: Meditation, Journaling

○ Meditation 10 min  (ripple: boosted by Exercise ✓)
○ Journaling         (ripple: boosted by Exercise ✓)
```

- Over time, the app validates ripples against actual data: "You said Exercise makes Meditation easier. Data confirms: you complete Meditation 89% of the time on days you exercise, vs. 54% on days you don't."
- A "Ripple Map" view shows the web of connections between habits

```
Ripple Map:

Sleep ──→ Exercise ──→ Meditation
  │                        │
  └──→ Reading             └──→ Journaling
```

**Why it's different from everything prior:**
- Habit Pair Discovery (D4) finds correlations automatically from data. Ripple Effects starts with *user-declared* causation, then validates it. Different starting point: user knowledge vs. statistical pattern.
- Habit Stacking (N1) models *sequence* (do A then B). Ripple Effects models *influence* (doing A makes B easier/harder). Sequence is about order; influence is about impact.
- No prior proposal lets users articulate or visualize how their habits affect each other.

**Behavioral science:** "Keystone habits" (Duhigg, 2012) — some habits trigger cascading positive changes. But which habits are keystone for *this specific user* is highly individual. Ripple Effects lets users discover their own keystone habits through declared relationships + data validation. The visual "boost" cue on downstream habits leverages the hot-hand fallacy constructively: seeing "boosted by Exercise" creates expectation of success, which increases actual completion (self-fulfilling prophecy via expectancy theory, Vroom 1964).

**Data model:**
```typescript
type Ripple = {
  fromHabitId: string
  toHabitId: string
  effect: 'easier' | 'harder'
}

// Stored at the top level of data.json alongside habits and logs
type Data = {
  habits: Habit[]
  logs: HabitLog
  ripples?: Ripple[]
}
```

**Effort:** ~50 min. Ripple creation UI in habit edit/creation, visual cues in HabitRow, validation calculation from log data, optional ripple map visualization. New server collection.

---

### I5. Completion Contexts (Where/With Whom/How)

**The gap:** Friction Log (C5) captures how *hard* a completion was. Completion Timestamps (F1/H3) capture *when*. No proposal captures the *context* of a completion — where you were, who you were with, or what method you used. Context is the richest behavioral data and the most actionable for habit design.

**The problem it solves:** A user completes "Read 20 pages" but the app doesn't know if they read on the bus, at a cafe, or in bed. Over a month, the pattern might reveal: "You read most pages at cafes. You almost never read in bed even though you try." That's actionable: stop trying to read in bed, go to the cafe. Without context data, the user can't see these patterns.

**What it does:**
- After completing a habit, an optional one-tap context tag (dismissable, never required):

```
  ✓ Read 20 pages

  Quick context (optional):
  [Home] [Commute] [Gym] [Cafe] [Office] [Park] [+ Custom]
```

- Context tags are user-created and reusable across habits
- After 2+ weeks of data, a per-habit context breakdown appears:

```
Read 20 pages — Where you succeed:
  Cafe:      12 completions (38%)  ← your best spot
  Commute:    9 completions (29%)
  Home:       6 completions (19%)  ← usually at night
  Bed:        2 completions (6%)   ← almost never works
  Other:      2 completions (6%)

Exercise — How you do it:
  Gym:       18 completions (60%)
  Home:       8 completions (27%)  ← rainy days
  Park:       4 completions (13%)  ← weekends only
```

- Optional "with whom" tags: Alone / Partner / Friend / Group
- A global view shows which contexts correlate with highest completion rates across all habits

**Why it's different from everything prior:**
- Friction Log (C5) captures effort level (easy/hard). Context captures environmental circumstances. Orthogonal dimensions.
- Cue Anchoring (dim 46) is a *planned* trigger ("after coffee, I meditate"). Context is *recorded* circumstance after the fact. One is prescriptive, the other descriptive.
- Completion Timestamps (F1) capture time. Context captures place/people/method. Different metadata.
- Miss Reason (dim 45) explains failures. Context explains *successes* — equally valuable but rarely captured.

**Behavioral science:** BJ Fogg's Behavior Model identifies three elements: Motivation, Ability, and Prompt. Context data reveals which environments maximize Ability (the cafe has fewer distractions for reading) and which provide natural Prompts (the gym bag in the car). This is the core of "environment design" — the most durable behavior-change strategy because it doesn't rely on willpower. Knowing *where* you succeed lets you engineer your environment instead of your motivation.

**Data model:**
```typescript
type ContextTag = {
  id: string
  label: string  // "Cafe", "Gym", "Home", etc.
  type: 'place' | 'social' | 'custom'
}

type ContextLog = {
  [habitId: string]: {
    [date: string]: string[]  // array of context tag IDs
  }
}

type Data = {
  habits: Habit[]
  logs: HabitLog
  contextTags?: ContextTag[]
  contextLogs?: ContextLog
}
```

**Effort:** ~45 min. Tag creation/management, post-completion tag selector (dismissable), per-habit context breakdown component, new server collections.

---

## Novelty Matrix

| ID | Feature | Novel Dimension | Why 78 Prior Proposals Missed It |
|----|---------|----------------|----------------------------------|
| I1 | Silent Streaks | Streak *visibility* control (not fragility or protection) | All streak proposals assume visibility is good. None questions whether the metric itself should be shown. |
| I2 | Retroactive Recognition | Pre-tracking history acknowledgment | All proposals assume habits start at creation time. Real habits predate the app. |
| I3 | Habit Debt Dashboard | Forward-looking remaining-work view | All displays are backward-looking (what you did). None shows what you still owe today/this week. |
| I4 | Ripple Effects | User-declared cross-habit causal influence | Pair Discovery finds correlations. Stacking models sequence. Neither models user-known causation. |
| I5 | Completion Contexts | Environmental/social circumstance of completions | Friction captures effort. Timestamps capture time. Neither captures where/with whom/how. |

---

## Consolidated Execution Backlog

This is the final, authoritative backlog. It draws the best items from 78 prior proposals plus I1-I5, ranked by impact-to-effort ratio. Every item is independently implementable.

### Tier 0: Fix What's Broken (~45 min total)

These are bugs, not features. They should be the next code commit.

| # | Item | What Exactly | Est. | Why First |
|---|------|-------------|------|-----------|
| 0.1 | **API error handling** | Add `if (!res.ok) throw new Error(...)` in all 5 `api.ts` functions | 10 min | Silent failures make every other feature unreliable |
| 0.2 | **Edit habit** | `PUT /api/habits/:id` endpoint + edit button in HabitRow that toggles inline inputs | 30 min | Users can't fix typos without delete-and-recreate |
| 0.3 | **Unarchive** | `POST /api/habits/:id/unarchive` + collapsible "Archived" section below active habits | 20 min | Archive is a one-way door right now |
| 0.4 | **Clean up index.css** | Remove unused Vite template styles; keep only the dark-mode `:root` variables that `App.css` uses | 5 min | Dead code that confuses future development |

### Tier 1: Transform Daily Use (~80 min total, any order)

Small features that change how the app *feels* every day.

| # | Feature | Est. | Source | One-Line Justification |
|---|---------|------|--------|----------------------|
| 1.1 | **Habit Debt Dashboard** | 30 min | **I3** | Answers the #1 question users have: "What's left today?" |
| 1.2 | **Momentum Decay Sparkline** | 25 min | C2 | 7-day colored blocks per row — ambient trend with zero interaction cost |
| 1.3 | **Anchor Statement** | 10 min | C3 | One text field, highest psychological impact-to-effort ratio in the entire backlog |
| 1.4 | **Silent Streaks** | 15 min | **I1** | Protects intrinsic motivation for habits where streak pressure is counterproductive |

### Tier 2: Expand What a Habit Can Be (~130 min total, any order)

Each feature adds a new dimension to the habit model.

| # | Feature | Est. | Source | What It Unlocks |
|---|---------|------|--------|----------------|
| 2.1 | **Custom Scheduling** (Mon/Wed/Fri) | 45 min | G1 | Accurate streaks for non-daily habits; stops punishing rest days |
| 2.2 | **Time-of-Day Sorting** | 20 min | H1 | Habit list auto-sorts by relevance to current time of day |
| 2.3 | **Retroactive Recognition** | 35 min | **I2** | New users get credit for habits they already have |
| 2.4 | **Habit Vacation Mode** | 25 min | H4 | Per-habit pause with return date — prevents archive-and-never-return |
| 2.5 | **Quantitative Habits** (6/8 glasses) | 50 min | G2 | Partial progress, increment buttons, precise compound tracking |

### Tier 3: Engagement & Intelligence (~145 min total)

Features that make the app smarter with use. Most benefit from 2+ weeks of data.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 3.1 | **Completion Sparks** (micro-celebrations) | 45 min | N8 |
| 3.2 | **Weekly Rhythm Score** | 30 min | C4 |
| 3.3 | **Compound Progress** (pages, km tallies) | 30 min | C1 |
| 3.4 | **Streak Transfer** | 30 min | H2 |
| 3.5 | **Completion Contexts** | 45 min | **I5** |

### Tier 4: Deep Analytics & Visualization (~175 min total)

Require 1+ months of data to be meaningful.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 4.1 | **Hour Heatmap** (when you do things) | 40 min | H3 |
| 4.2 | **Miss Pattern Map** | 45 min | E3 |
| 4.3 | **30-Day Inline Heatmap** | 35 min | v10 |
| 4.4 | **Habit Ripple Effects** | 50 min | **I4** |
| 4.5 | **Streak Milestones** (7/30/90/365 celebrations) | 50 min | v9 |

### Tier 5: Structural & Power Features

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 5.1 | **Tags & Categories** | 40 min | G4 |
| 5.2 | **Quit/Avoidance Mode** (days since) | 35 min | G3 |
| 5.3 | **Habit Templates** (pre-filled library) | 25 min | G5 |
| 5.4 | **Weekly Compass** (intention + review) | 80 min | N4 |
| 5.5 | **Friction Log** | 30 min | C5 |

### Parked (valid ideas, build later)

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | The differentiator, but high effort — build when daily use is solid |
| Habit Stacking / Chains | Complex data model; needs simpler features first |
| Energy-Aware Check-In | Needs Minimum Viable Day concept as prerequisite |
| Difficulty Progression | Nice-to-have after quantitative habits exist |
| Streak Insurance / Grace Days | Nice-to-have streak variation |
| PWA / Offline / Data Export | Separate project scope |
| Dashboard / Full Analytics | Needs months of real data |
| Habit Heartbeat Pulse | Cool visualization but low utility vs. effort |
| Year-at-a-Glance Heatmap | Needs a year of data to be useful |

---

## Recommended Implementation Path

### Session 1: Ship the Basics (Tier 0)

Estimated: ~45 min. Commit message: "Fix API errors, add edit/unarchive, clean up dead CSS."

This is not glamorous work. It's the work that makes every future feature reliable.

### Session 2: Make It Feel Different (Tier 1)

Estimated: ~80 min. Pick 2-3 items. Suggested start: Habit Debt Dashboard (I3) + Anchor Statement (C3).

The Debt Dashboard changes the app's fundamental UX from "review history" to "act on what's remaining." The Anchor Statement adds emotional depth with 10 minutes of work.

### Session 3+: Pick From Tiers 2-5

After Tier 0-1, the app has fixed its basics and has a unique daily UX. From here, priorities depend on what the actual user (you) wants from the tool. Custom Scheduling (2.1) is the highest-impact Tier 2 item because it fixes streak math for non-daily habits — a real correctness issue.

---

## The Numbers

| Metric | Value |
|--------|-------|
| Prior planning documents | 16 |
| Prior planning lines | ~8,400 |
| Features ever proposed (prior) | 78 |
| New features in this document | 5 (I1-I5) |
| Total proposals to date | 83 |
| **Features shipped** | **0** |
| Backlog items in this document | 28 (curated from 83) |
| Tier 0 estimate | ~45 min |
| Tier 0+1 estimate | ~125 min (~2 hours) |
| Full backlog estimate (Tiers 0-4) | ~575 min (~9.5 hours) |

---

## Why This Document Exists (and Why It Should Be the Last)

This project's ratio of planning-to-implementation is approximately infinity (8,400 lines of planning / 0 features shipped). Each prior document acknowledges this problem, then adds another 400-800 lines of planning.

This document consolidates 16 scattered documents into one reference with a clean backlog. The 5 new features (I1-I5) fill genuine gaps. The backlog is ranked, sized, and dependency-free.

**The next commit should be Tier 0 code. Not FEATURES_FINAL_v2.md.**
