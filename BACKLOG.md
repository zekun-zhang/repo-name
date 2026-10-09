# Habit Garden — Feature Backlog & New Proposals

**Date:** 2026-10-09
**Purpose:** Actionable backlog with new feature proposals. Replaces all prior planning documents as the single source of truth for what to build.

---

## State of the Project

| | |
|---|---|
| **App code** | ~960 lines across 11 files |
| **Working features** | Create habit, toggle completions (14-day grid), streaks, archive, delete |
| **Missing basics** | Edit habit, unarchive, API error handling, theme toggle |
| **Planning docs** | 10 documents, ~6,200 lines, 49 proposed dimensions, 0 shipped |

---

## New Feature Proposals (Not in Any Prior Document)

The 49 existing dimensions cover streaks, daily state, temporal patterns, habit relationships, evolution, analytics, reflection, life context, UX, identity, data management, failure patterns, environmental cues, cross-domain balance, automaticity, and merit-based protection.

The following five features address conceptual gaps that none of those 49 dimensions touch.

### C1. Compound Progress Tracker

**Gap:** Every existing dimension measures *consistency* (did you do it?) or *quality* (how well?). None translates micro-actions into tangible cumulative outcomes.

**What:** Each habit can have an optional "unit" and "amount per completion" — e.g., Meditation: 10 minutes, Reading: 20 pages, Running: 3 km. The app continuously tallies cumulative output from log data and displays it:

```
Reading       20 pages/day × 147 completions = 2,940 pages (~10 books)
Meditation    10 min/day × 203 completions = 33.8 hours
Running       3 km/day × 89 completions = 267 km (NYC → Boston)
```

The insight is concrete and motivating: "I've run the distance from NYC to Boston" is more emotionally powerful than "89-day streak." Milestones trigger automatically when meaningful thresholds are crossed (1,000 pages, 100 km, 24 hours of meditation).

**Why it's different from existing proposals:**
- Difficulty Progression (dim N5) tracks *levels* within a habit. Compound Progress tracks *accumulated real-world output*.
- System Score (dim 31) collapses everything into one number. Compound Progress expands each habit into its concrete, domain-specific result.
- Time Investment (Phase 5, #33) tracks duration. Compound Progress tracks *outcome* in the habit's native unit — pages, kilometers, reps, not just minutes.

**Behavioral science:** "Small gains" research (Amabile & Kramer, 2011) — progress on meaningful work is the single strongest motivator. But "progress" must be *perceptible*. Daily micro-actions feel invisible; cumulative tallies make them visible. The distance/book equivalences leverage "concrete construal" (Trope & Liberman, 2010) — abstract numbers gain motivational force when mapped to tangible objects.

**Data model:**
```typescript
type Habit = {
  // ...existing
  unit?: string           // "pages", "km", "minutes", "reps"
  amountPerCompletion?: number  // 20, 3, 10, 50
}
```

**Effort:** Small. Two optional fields, multiplication against completion count from existing logs, milestone threshold list.

---

### C2. Habit Momentum Decay Visualization

**Gap:** Every streak mechanism is binary — you either broke it or you didn't. No dimension visualizes the *rate of decay* when you start slipping, which is the critical early-warning window.

**What:** Each habit shows a tiny inline sparkline (or bar) of its trailing 7-day completion density. The visual uses color temperature:

```
Exercise   ▓▓▓▓░▓▓  (6/7 — warm, green)
Reading    ▓▓░░▓░▓  (4/7 — cooling, yellow)
Journaling ░░▓░░░░  (1/7 — cold, red)
```

The key insight: the transition from green → yellow is the *actionable moment*. By the time a streak breaks, motivation has already cratered. The decay sparkline shows the trend *before* the break, when intervention is cheapest.

A subtle pulse or glow on habits whose 7-day density just dropped below their 30-day average creates a "catch it early" signal without alarmism.

**Why it's different:**
- Slump Radar (dim 32) detects slumps and alerts. Decay Visualization is *ambient* — always visible, no notification required. You see the cooling happen in real time.
- Streak display is a single number. Decay Visualization is a *shape* — the pattern of recent days tells a story a number can't.
- Habit Heartbeat (dim N6) is a global health pulse. Decay Visualization is per-habit and shows *direction*, not just current state.

**Behavioral science:** "Boiling frog" phenomenon — gradual decline is harder to notice than sudden failure. Sparklines externalize the gradient so the user sees the cooling trend before it becomes a freeze. Pre-attentive processing research (Healey & Enns, 2012) shows color temperature shifts are detected in under 200ms — faster than reading any number.

**Data model:** None. Pure visualization of existing log data.

**Effort:** Tiny. 7 small colored blocks per habit row, derived from existing completion dates.

---

### C3. Habit Anchor Statement

**Gap:** No dimension captures the user's *reason* for starting a habit — the "why" that motivated day one. Miss Reason (dim 45) captures why you *skip*. Cue Anchoring (dim 46) captures what *triggers* the behavior. Neither captures the deeper motivation that sustains it through hard weeks.

**What:** When creating a habit, the user can write a one-line anchor statement — a personal reason that the app surfaces during critical moments:

```
Create a habit

Name:       Exercise 30 min
Frequency:  [Daily]
Color:      [●]
Anchor:     "So my kids see a parent who takes care of themselves"  ← NEW
```

The anchor statement appears:
- When the habit's streak breaks (replacing guilt with purpose)
- When the habit hits a milestone (connecting the achievement to meaning)
- In the weekly review (reconnecting daily action to long-term why)
- On demand (tap the habit name to see its anchor)

It's never shown during normal daily check-in — only when emotional context would help.

**Why it's different:**
- Cue Anchoring (dim 46) is about *when/where* to do it. Anchor Statement is about *why* you do it.
- Miss Reason (dim 45) is retrospective failure analysis. Anchor Statement is prospective motivation.
- Habit Notes (M2) is a running journal. Anchor Statement is a single, enduring declaration.

**Behavioral science:** Self-concordance theory (Sheldon & Elliot, 1999) — habits aligned with personal values persist 2-3x longer than habits driven by external pressure or vague self-improvement. Writing down a reason makes implicit motivation explicit, which strengthens commitment (Cialdini's consistency principle). The key design choice: surfacing the anchor *only* at emotional inflection points prevents habituation and preserves its motivational punch.

**Data model:**
```typescript
type Habit = {
  // ...existing
  anchor?: string  // max 200 chars
}
```

**Effort:** Tiny. One optional text field, conditional display in 3-4 spots.

---

### C4. Weekly Rhythm Score

**Gap:** All existing metrics measure *how much* you complete. None measures *how consistently your week-to-week pattern holds*. A user who completes 5/7 days every week for 3 months has exceptional rhythm even if their daily streak is only 5. No dimension captures this.

**What:** A "rhythm" percentage shown per habit and globally:

```
Exercise     Rhythm: 92%   (completed 5+ days in 11 of 12 weeks)
Reading      Rhythm: 75%   (completed 3+ days in 9 of 12 weeks)
Overall      Rhythm: 83%
```

Rhythm is calculated as: (weeks meeting the habit's weekly target) / (total weeks tracked). For daily habits, the weekly target defaults to 5/7 (adjustable). For weekly habits, it's 1/week.

Rhythm is more forgiving than streaks and more honest than completion percentage. It answers: "Am I showing up *most* weeks?" — which is what sustainable habit-building actually looks like.

A weekly history bar chart shows rhythm visually:

```
Weeks:  ■ ■ ■ ■ □ ■ ■ ■ □ ■ ■ ■
        ^^^^^^^^^^          ^^^^^^
        Met target          Met target
```

**Why it's different:**
- Streaks measure *consecutive* completions. Rhythm measures *consistent weekly showing up*. One missed day kills a streak; it barely dents rhythm.
- 2-Day Rule (dim 42) softens streak math. Rhythm replaces the streak lens entirely with a different, healthier question.
- Weekly Compass (dim N4) is intention-setting. Rhythm Score is a measurement of the pattern that emerges.
- System Score (dim 31) is a global aggregate. Rhythm Score is per-habit and measures a specific quality (consistency of weekly patterns), not overall health.

**Behavioral science:** "Don't break the chain" (Seinfeld method) works for some personalities but creates devastating all-or-nothing framing for others. Rhythm reframes consistency as "most weeks" rather than "every day" — which matches how real habits work in real lives. Research on "flexible restraint" vs. "rigid restraint" (Westenhoefer, 1991) shows flexible approaches produce better long-term outcomes across domains from dieting to exercise to study habits.

**Data model:** None. Computed from existing log data.

**Effort:** Small. Weekly bucketing of existing completion dates, percentage calculation, simple bar visualization.

---

### C5. Start Friction Log

**Gap:** Miss Reason (dim 45) captures why you *didn't* do a habit. But it only fires after a miss. No dimension captures the friction that makes habits hard to *start* on days you DO complete them — the resistance you overcame.

**What:** After completing a habit, the user can optionally log a quick friction rating: Easy / Pushed Through / Really Hard (one tap, dismissable, never required). Over time, this reveals:

```
Exercise — Friction Pattern:
  Mon: Usually "Easy" (72%)
  Thu: Usually "Pushed Through" (64%)
  Fri: Usually "Really Hard" (58%)

  → Consider moving Exercise to Mon/Tue when motivation is natural,
    or reducing scope on Fridays.
```

The friction log captures a signal that completion data alone cannot: *effort required*. Two identical "completed" checkmarks might represent wildly different experiences. A habit that's consistently "Really Hard" on Fridays is a scheduling problem, not a motivation problem — but without friction data, the user can't see it.

**Why it's different:**
- Miss Reason (dim 45) captures post-failure data. Friction Log captures post-success data. Both are metadata on the completion event, but they measure opposite signals.
- Energy Check-In (dim N3) captures how you *feel* at the start of the day. Friction Log captures how hard a *specific habit* was. One is global daily state; the other is per-habit per-completion resistance.
- Difficulty Progression (dim N5) tracks increasing challenge over time. Friction Log tracks varying resistance on the same difficulty level.

**Behavioral science:** Behavior = Motivation - Friction (BJ Fogg's Behavior Model). Most habit advice focuses on motivation. Friction Log focuses on the other variable — the one the user can actually redesign. Identifying high-friction patterns leads to environmental design solutions (prep gym bag the night before, move books to the couch) that are more durable than willpower. "Effort heuristic" (Kruger et al., 2004): people value outcomes more when they're aware of the effort invested. Seeing "Pushed Through" in your log makes the completion feel more meaningful.

**Data model:**
```typescript
type FrictionLevel = 'easy' | 'pushed' | 'hard'

// Stored alongside existing logs:
type FrictionLog = {
  [habitId: string]: {
    [date: string]: FrictionLevel
  }
}
```

**Effort:** Small. One-tap post-completion prompt (dismissable), friction data stored alongside logs, day-of-week aggregation for pattern display.

---

## Consolidated Execution Backlog

Ranked by: (1) dependency — foundations before features, (2) effort — quick wins first, (3) impact — daily-use improvements over analytics.

### NOW: Ship the Foundations

These are bugs and missing basics, not features. Combined estimate: ~90 minutes.

| # | Feature | What | Est. |
|---|---------|------|------|
| 1 | API Error Handling | Check `res.ok` in all `api.ts` functions, throw on failure | 15 min |
| 2 | Edit Habit | PUT `/api/habits/:id` + inline edit UI in HabitRow | 40 min |
| 3 | Unarchive | POST `/api/habits/:id/unarchive` + archived habits section in UI | 30 min |

**Done means:** Create, edit, archive, unarchive, delete all work. API failures surface to the user.

### NEXT: Daily Experience Improvements

Small additions that change how the app feels to use every day.

| # | Feature | What | Est. | Source |
|---|---------|------|------|--------|
| 4 | Cue Anchoring | Optional `cue` text field on habit creation/edit | 10 min | v11 dim 46 |
| 5 | Anchor Statement | Optional `anchor` text field ("why I do this") | 10 min | **NEW C3** |
| 6 | Compound Progress | Optional unit + amount fields, cumulative tally display | 30 min | **NEW C1** |
| 7 | Momentum Decay Sparkline | 7-day colored density blocks per habit row | 25 min | **NEW C2** |
| 8 | Completion Sparks | Context-aware micro-celebrations on completion | 45 min | PLAN.md N8 |
| 9 | Habit Ordering | Up/down arrows or drag to reorder habits | 35 min | v9 |

### THEN: Streak & Consistency Improvements

Features that make the streak system healthier and more motivating.

| # | Feature | What | Est. | Source |
|---|---------|------|------|--------|
| 10 | 2-Day Rule | Alternative streak mode: never-miss-twice | 35 min | v10 |
| 11 | Weekly Rhythm Score | Per-habit weekly consistency percentage | 30 min | **NEW C4** |
| 12 | Inline 30-Day Heatmap | Expand habit row to show 30-day color grid | 35 min | v10 |
| 13 | Streak Milestones | Celebrate 7/30/90/365 with badge + animation | 50 min | v9 |
| 14 | Earned Streak Shields | Consistency earns shield tokens to protect streaks | 45 min | v11 dim 49 |

### LATER: Depth & Intelligence

Features that require accumulated usage data to be meaningful.

| # | Feature | What | Est. | Source |
|---|---------|------|------|--------|
| 15 | Miss Reason Capture | One-tap reason after a missed day | 40 min | v11 dim 45 |
| 16 | Start Friction Log | One-tap difficulty after completing a habit | 30 min | **NEW C5** |
| 17 | Habit Maturity & Graduation | Automaticity detection + Hall of Fame | 55 min | v11 dim 48 |
| 18 | Life Balance Radar | Domain assignment + spider chart of coverage | 50 min | v11 dim 47 |
| 19 | Weekly Compass | Weekly intention-setting and reflection view | 80 min | PLAN.md N4 |
| 20 | Habit Scheduling | Mon/Wed/Fri patterns, dimmed rest days | 75 min | v9 |

### PARKED: Valid but Not Now

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | High effort, the differentiator — build when basics are solid |
| Energy-Aware Check-In | Needs Minimum Viable Day concept first |
| Habit Stacking / Chains | Complex data model, wait for simpler features to ship |
| Quiet Weeks / Grace Days | Needs scheduling and streak improvements first |
| Theme Toggle | Nice-to-have, doesn't affect habit tracking |
| Dashboard / Analytics | Needs months of real usage data |
| PWA / Offline | Large effort, separate project |
| Data Export/Import | Important eventually, not now |

---

## New vs. Existing Feature Summary

| ID | Feature | What's New About It | Gap Filled |
|----|---------|-------------------|-----------|
| C1 | Compound Progress | Translates daily actions into tangible real-world outcomes | No dimension shows cumulative output in native units |
| C2 | Momentum Decay | Ambient per-habit trend visualization before a streak breaks | No dimension shows the cooling trend, only the break |
| C3 | Anchor Statement | Surfaces the user's personal "why" at emotional inflection points | No dimension captures or leverages the founding motivation |
| C4 | Weekly Rhythm Score | Measures consistent weekly showing-up, not consecutive days | No dimension offers a forgiving consistency metric beyond streaks |
| C5 | Start Friction Log | Captures difficulty of completions, not just misses | No dimension has post-success metadata about effort required |

---

## Architecture Notes

All five new features (C1-C5) follow the project's existing patterns:

- **C1, C3:** Add optional fields to the `Habit` type. No new endpoints — extend existing POST/PUT.
- **C2, C4:** Pure computation on existing log data. No data model changes. No server changes.
- **C5:** New lightweight data structure alongside existing `logs`. One new API endpoint or extension of the toggle endpoint.

No breaking changes. No migrations. All features are additive and backward-compatible with existing `data.json`.

---

## What Makes This Backlog Different

This project has 10 planning documents. The problem was never lack of ideas — it was lack of execution. This document is structured differently:

1. **No phases with exit criteria.** Phases create psychological gates that block progress. Items are ranked, not gated.
2. **No time estimates over 80 minutes.** Anything larger should be broken down, not estimated optimistically.
3. **No features that require other features.** Every item in NOW and NEXT can be built independently, in any order.
4. **Five new features, not forty-nine.** Diminishing returns on ideation kicked in long ago. These five fill real gaps; more would be noise.

The next commit after this document should be code.
