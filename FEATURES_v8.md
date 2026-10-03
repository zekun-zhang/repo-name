# Habit Garden — Feature Plan v8: Implementation-First Reset

**Date:** 2026-10-03
**Supersedes:** All prior planning documents for prioritization decisions
**Status:** Active backlog — every item has a session estimate

---

## Preamble: The Real Situation

The codebase has **~960 lines of application code** and **~3,800 lines of
planning markdown** across 7 documents. 35 features have been proposed. Zero
have shipped. The planning is excellent — 28 behavioral dimensions, rigorous
citations, clear data models. But the ratio of documentation to
implementation is approximately 4:1.

This document takes a different approach:

1. **Five new features** targeting angles no prior document covered
2. **Every feature described in build terms**, not research terms
3. **Consolidated backlog** with hour estimates, not phase labels
4. **No behavioral science citations** — the prior docs have enough for a thesis

---

## Part 1: Five Novel Feature Proposals

### L1. Habit Experiments (Self-A/B Testing)

**The idea:** Declare a 14-day experiment on any habit. You state a
hypothesis ("What if I exercise before breakfast instead of after?"), the
app marks a 14-day experiment window, and at the end it compares your
completion rate during the experiment vs. the 14 days before it.

```
EXPERIMENT: Exercise — "Morning vs. evening"
Hypothesis: "I'll be more consistent if I exercise at 6am"
Period: Oct 3 – Oct 16 (14 days)
Baseline (Sep 19 – Oct 2): 9/14 = 64%
Experiment so far: 5/5 = 100%  ← Day 5
```

At the end of 14 days, the app shows a simple verdict:

```
RESULT: Exercise — "Morning vs. evening"
Baseline: 64%    Experiment: 86%    Change: +22%
Verdict: The experiment worked. Make it permanent?
[Keep Change]  [Revert]  [Try Again]
```

**Why this is novel:** No prior document addresses *experimentation as a
first-class concept*. Every proposed feature treats habits as fixed
entities that you track, analyze, or decorate. Experiments treat habits
as *hypotheses to test*. This is the scientific method applied to personal
behavior — and it's the mindset that actually produces lasting change.

The closest prior features are Completion Depth (how well you did it) and
Miss Fingerprinting (why you missed). Neither frames a deliberate change
as a structured test with a before/after comparison.

**Data model:**
```typescript
type Experiment = {
  id: string
  habitId: string
  hypothesis: string       // max 120 chars
  startDate: string        // YYYY-MM-DD
  endDate: string          // YYYY-MM-DD (always startDate + 13)
  baselineStart: string    // startDate - 14
  status: 'active' | 'completed' | 'abandoned'
}
```

New top-level key `experiments` in data.json. One active experiment per
habit. Verdict computed from existing log data.

**Build estimate:** ~3 hours. Experiment CRUD endpoint, small form modal,
banner component showing active experiment, verdict computation utility.

---

### L2. Streak Graveyard (Honoring Past Effort)

**The idea:** A view showing every broken streak as a dignified record.
Instead of hiding failed streaks, display them:

```
STREAK GRAVEYARD

Exercise
  ████████████████████████  23 days   Mar 5 – Mar 28
  ████████████             12 days   Apr 18 – Apr 30
  ██████████████████████████████████████████████  45 days   May 3 – Jun 17
  Current: 31 days and counting

Meditate
  ███████                   7 days   Feb 1 – Feb 8
  ██████████████████████████████████████████████████████████  58 days   Feb 15 – Apr 14
  Current: 12 days and counting

Personal Record: Exercise — 45 days (May 3 – Jun 17)
```

Each bar is proportional to the streak length. The current active streak
is shown at the bottom, growing toward the personal record.

**Why this is novel:** Prior features address failure in these ways:
- Habit Autopsy (F1): analyzes *why* a habit was abandoned (post-mortem)
- Phantom Streaks (G2): reframes the *display* of near-misses (52/55)
- Soft Landing (H3): smooths the *moment of return* after a break
- Recovery Velocity (K4): measures *how fast* you recover

None of these *honors the streak that was*. The graveyard treats a 23-day
streak as 23 days of real effort, not as a failure because day 24 was
missed. It also creates a natural "beat your personal record" dynamic
without any gamification machinery.

**Data model:** None. Pure computation over existing log data — scan for
consecutive completion runs, record start/end dates and lengths.

**Build estimate:** ~2 hours. One utility function to extract streak
history from log dates, one view component with proportional bars (inline
divs or SVG).

---

### L3. The Daily Snapshot (One-Glance Dashboard)

**The idea:** A single card that answers "How am I doing right now?" in
5 seconds. No table, no grid, no scrolling:

```
┌──────────────────────────────────────────┐
│  TODAY: 3 of 7 done                      │
│  ██████████░░░░░░░   43%                 │
│                                          │
│  STREAK HERO:  Exercise — 31 days        │
│  NEEDS LOVE:   Meditate — missed 4 of 7  │
│  THIS WEEK:    68% overall (↑ from 61%)  │
│  BEST DAY:     Tuesday (89% avg)         │
└──────────────────────────────────────────┘
```

Four stats, each answering a different question:
- **Streak Hero:** Your most consistent habit right now (pride)
- **Needs Love:** The habit most at risk this week (attention)
- **This Week:** Your overall 7-day rate with trend arrow (momentum)
- **Best Day:** Which weekday you're historically strongest (pattern)

**Why this is novel:** Prior proposals include:
- Quick Pulse (H1): a *check-in mode* for fast toggling (interaction)
- Insights Tab (#27): a *detailed analytics page* (deep dive)
- Habit Heartbeat (N6): an *aggregate pulse animation* (metaphor)

The Daily Snapshot is none of these. It's a *status dashboard* — read-only,
no interaction, no animation, no drill-down. It surfaces the four most
actionable pieces of information in the smallest possible space. It's
what you see when you open the app and need a 5-second orientation before
deciding what to do.

**Data model:** None. Pure computation over existing habits and logs.

**Build estimate:** ~1.5 hours. One component with four computed stats.
The computations (best streak, worst habit, weekly rate, best day) are
each ~10 lines.

---

### L4. Habit Duels (Internal Competition)

**The idea:** Pick any two of your habits and see a head-to-head
comparison over the last 30 days:

```
DUEL: Exercise vs. Meditation (last 30 days)

Exercise:   ████████████████████████  24/30 = 80%
Meditation: ██████████████████        18/30 = 60%

Exercise leads by 20%

Longest streak:  Exercise 14d  vs.  Meditation 8d
Best week:       Exercise 7/7  vs.  Meditation 5/7
Consistency:     Exercise ████████░░  vs.  Meditation ███░░░████
                 (steady)                  (bursty)
```

The duel creates internal competition without any social features. It
highlights relative gaps and encourages you to level up your weaker
habits. The consistency comparison (steady vs. bursty pattern) gives
qualitative insight beyond raw percentages.

**Why this is novel:** Every prior comparison feature looks at habits in
isolation (per-habit analytics) or in aggregate (overall completion rate,
habit load). No feature lets you *pit two habits against each other*.
This is a fundamentally different frame: instead of "How is Exercise
doing?" it asks "Am I as consistent with Meditation as I am with
Exercise?" The relative comparison reveals gaps that absolute metrics
hide.

Resonance Map (J4) shows *correlations* between habits (do they rise
and fall together?). Duels show *relative performance* (which one am I
better at?). Correlation and comparison are different analyses.

**Data model:** None. Pure computation over existing log data for two
selected habits.

**Build estimate:** ~2 hours. A select-two-habits UI, comparison
computation utility, and a visual comparison component.

---

### L5. Micro-Surprise Milestones (Mathematical Celebrations)

**The idea:** Instead of predictable milestones at 7, 30, 100 days,
celebrate streaks at *mathematically interesting* numbers:

- **Prime numbers:** 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47...
- **Fibonacci:** 1, 2, 3, 5, 8, 13, 21, 34, 55, 89...
- **Perfect squares:** 4, 9, 16, 25, 36, 49, 64...
- **Firsts:** "First Tuesday!", "First time completing all habits!"

The celebration is a brief, whimsical message that acknowledges the
number itself:

```
Day 23 — a prime number! Only 1 and 23 divide it, just like your
commitment to Exercise.

Day 34 — Fibonacci! Like the spiral, your habit is growing in a
natural pattern.

Day 49 — 7 squared! Seven weeks of seven days each, perfectly squared.
```

**Why this is novel:** Completion Sparks (N8) are momentary celebrations
on *every* completion — they're frequent but generic. Narrative Milestones
(G3) tell *stories* at major milestones — they're infrequent but deep.
Habit Echoes (G5) remind you of past achievements — they're retrospective.

Micro-Surprise Milestones are *frequent, specific, and forward-looking*.
They fire at unpredictable intervals (you don't know when the next prime
is), reference the specific number (creating a learning moment), and
are lightweight enough to happen often without being annoying.

The surprise element is critical. Predictable milestones (7, 30, 100) lose
their motivational power because you see them coming. Variable-ratio
reinforcement (unpredictable rewards) is the most powerful schedule for
maintaining behavior — it's why slot machines work. Prime numbers create
a natural variable-ratio schedule that's denser early (2, 3, 5, 7, 11)
when motivation is fragile and sparser later (89, 97, 101, 103) when
the habit is established.

**Data model:** None. Pure client-side computation — `isPrime(n)`,
`isFibonacci(n)`, `isPerfectSquare(n)` are trivial functions.

**Build estimate:** ~1.5 hours. Math utilities (~15 lines), message
templates (a map of number-type to message pattern), a milestone toast
component triggered in the toggle handler.

---

## Part 2: Why These 5 (The Uncovered Angles)

| # | Feature | Uncovered Angle | Prior Coverage Gap |
|---|---------|----------------|-------------------|
| 29 | L1: Experiments | Deliberate change testing | All features treat habits as static entities to track. None frames a change as a structured test with before/after comparison. |
| 30 | L2: Streak Graveyard | Historical effort preservation | Autopsy analyzes failure causes. Phantom Streaks reframe display. Neither *preserves and honors* the effort of past streaks as a record. |
| 31 | L3: Daily Snapshot | Instant orientation dashboard | Quick Pulse is a check-in mode. Insights is a deep dive. Neither is a 5-second read-only status card. |
| 32 | L4: Habit Duels | Relative comparison between habits | All analytics are per-habit or aggregate. None compares two habits head-to-head. |
| 33 | L5: Micro-Surprises | Variable-interval celebration | Sparks are per-completion (constant). Narrative Milestones are at fixed intervals. Neither uses mathematical patterns for unpredictable, frequent celebrations. |

---

## Part 3: Consolidated Master Backlog

Every feature ever proposed, organized by implementation priority.
Hour estimates assume a developer familiar with the codebase.

### Tier 1: Foundation (must ship first, enables everything else)

These are not features — they are bugs and gaps in the current MVP.

| # | Feature | Hours | What |
|---|---------|-------|------|
| 1 | Edit Habit | 2h | PUT endpoint + inline edit form |
| 2 | API Error Handling | 1h | Check `res.ok` in every `api.ts` function, surface errors |
| 3 | View & Restore Archives | 2h | Unarchive endpoint + collapsible archived section |
| 4 | Theme Toggle | 2h | CSS variables + localStorage + system preference |

**Total: ~7 hours. One weekend.**

### Tier 2: Core Experience (makes the app genuinely useful)

| # | Feature | Hours | What |
|---|---------|-------|------|
| 5 | Quick Pulse Check-In (H1) | 2h | Vertical one-tap list for today's habits |
| 6 | L3: Daily Snapshot | 1.5h | Read-only status card with 4 computed stats |
| 7 | L5: Micro-Surprise Milestones | 1.5h | Math-based celebrations on toggle |
| 8 | Habit Time Machine (#10) | 2h | Navigate beyond 14-day window |
| 9 | Completion Sparks (N8) | 1.5h | Brief animation/message on completion |
| 10 | Flexible Frequency | 3h | Support "3x/week", "weekdays", "every other day" |

**Total: ~11.5 hours. A second weekend.**

### Tier 3: Depth (makes the app compelling)

| # | Feature | Hours | What |
|---|---------|-------|------|
| 11 | L2: Streak Graveyard | 2h | Historical streak visualization |
| 12 | K3: Habit DNA | 2h | Per-habit 90-day pattern SVG strip |
| 13 | K5: Pause Protocol | 3h | Paused state + resume date + streak freeze |
| 14 | L4: Habit Duels | 2h | Head-to-head habit comparison |
| 15 | Daily Calibration (#6) | 2.5h | Energy picker + core habit flag |
| 16 | Momentum Velocity (J3) | 1.5h | Trend arrows on each habit |
| 17 | Phantom Streaks (G2) | 1.5h | "52 of 55 days" reframing |

**Total: ~16.5 hours. Two weekends.**

### Tier 4: Intelligence (makes the app smart)

| # | Feature | Hours | What |
|---|---------|-------|------|
| 18 | L1: Habit Experiments | 3h | A/B test framework for habit changes |
| 19 | K2: Ripple Effects | 2h | Post-completion energy up/down tracking |
| 20 | K4: Recovery Velocity | 2h | Bounce-back speed measurement |
| 21 | Miss Fingerprinting (J1) | 2.5h | Pattern analysis on missed days |
| 22 | Habit Load Monitor (H4) | 2h | Overcommitment detection |
| 23 | Lifecycle Stages (J2) | 2h | Seedling → Rooted progression |
| 24 | Forgiveness Window (J5) | 2h | Evening countdown for at-risk streaks |

**Total: ~15.5 hours. Two weekends.**

### Tier 5: Polish & Richness (makes the app delightful)

| # | Feature | Hours | What |
|---|---------|-------|------|
| 25 | Soft Landing (H3) | 2h | Welcome-back screen after absence |
| 26 | 2-Minute Fallback (G1) | 1.5h | Reduced version of a habit |
| 27 | Habit Stacking (N1) | 3h | Chain habits together |
| 28 | Insights Tab (#27) | 4h | Full analytics page |
| 29 | K1: Life Chapters | 3h | Named life periods with summaries |
| 30 | Data Export (#30) | 1.5h | JSON/CSV download |

**Total: ~15 hours. Two weekends.**

### Tier 6: Deferred (nice-to-have, build when ready)

| Feature | Hours | Notes |
|---------|-------|-------|
| Living Garden View (#22) | 6h+ | Significant visual work |
| Weekly Compass (N4) | 2h | After flexible frequency ships |
| Narrative Milestones (G3) | 3h | Needs months of data |
| Identity Framing (H5) | 1.5h | "I am a reader" declarations |
| Habit Weather Forecast (F2) | 3h | Predictive, needs data |
| The Ratchet (G4) | 2h | Established habits recede |
| Habit Echoes (G5) | 1.5h | Past achievement reminders |
| Resonance Map (J4) | 3h | Inter-habit correlations |
| Habit Autopsy (F1) | 2h | Why habits failed |
| Planned Rest (N2+N7) | 2.5h | Schedule rest weeks |
| Ritual Windows (H6) | 2.5h | Time-of-day structure |
| Completion Depth (H2) | 1.5h | Light/Full/Deep toggle |
| Categories/Tags (#37) | 2h | Needed at 15+ habits |
| PWA/Offline (#40) | 6h+ | Large effort |
| Keyboard Shortcuts (#12) | 1h | Ship whenever |
| Difficulty Progression (N5) | 2h | After months of use |
| Time Capsule (v3 F3) | 2h | Fun but low priority |
| Seasonal Rhythms (#18) | 2h | Visual polish |
| Drag-and-Drop Reorder (#38) | 2h | After categories |

---

## Part 4: The Implementation Contract

### What to build next (in order)

```
Session 1 (2h):  #1 Edit Habit + #2 API Error Handling
Session 2 (2h):  #3 View Archives + #4 Theme Toggle
Session 3 (2h):  #5 Quick Pulse + #6 Daily Snapshot
Session 4 (2h):  #7 Micro-Surprises + #9 Completion Sparks
Session 5 (2h):  #8 Time Machine + #10 Flexible Frequency (start)
Session 6 (2h):  #10 Flexible Frequency (finish) + #11 Streak Graveyard
```

Six sessions. Twelve hours. Sixteen features shipped.

After session 6, the app will have:
- Full habit CRUD (create, read, update, delete, archive, restore)
- Proper error handling
- Light/dark theme
- Two check-in modes (table + quick pulse)
- A status dashboard
- Mathematical celebrations
- Historical streak visualization
- Navigation beyond 14 days
- Flexible habit scheduling
- Completion animations

That's a real product. Everything after that is iteration.

---

## Part 5: New Features — Reasoning Summary

### L1: Habit Experiments
- **Gap filled:** No feature treats habit changes as testable hypotheses
- **User value:** Answers "should I change how I do this habit?" with data
- **Unique angle:** Scientific method applied to personal behavior
- **Priority:** Tier 4 — needs stable core first, but high differentiation

### L2: Streak Graveyard
- **Gap filled:** Past streaks are invisible once broken
- **User value:** Shows that broken streaks were still valuable effort
- **Unique angle:** Honors history instead of analyzing failure
- **Priority:** Tier 3 — low effort, high emotional impact

### L3: Daily Snapshot
- **Gap filled:** No instant-orientation view exists
- **User value:** 5-second answer to "how am I doing?"
- **Unique angle:** Read-only dashboard vs. interactive check-in or deep analytics
- **Priority:** Tier 2 — improves daily experience immediately

### L4: Habit Duels
- **Gap filled:** No relative comparison between two habits
- **User value:** Reveals gaps hidden by absolute metrics
- **Unique angle:** Competition frame without social features
- **Priority:** Tier 3 — engaging but not essential

### L5: Micro-Surprise Milestones
- **Gap filled:** Celebrations are either constant or at fixed intervals
- **User value:** Unpredictable delight that's denser when motivation is fragile
- **Unique angle:** Mathematical patterns create natural variable-ratio reinforcement
- **Priority:** Tier 2 — tiny effort, disproportionate engagement impact

---

## Part 6: Feature ID Cross-Reference (Complete)

All 52 features ever proposed, with source document and current status.

| # | Feature | Source | Tier | Status |
|---|---------|--------|------|--------|
| 1 | Edit Habit | PLAN v2 | 1 | Not started |
| 2 | API Error Handling | PLAN v2 | 1 | Not started |
| 3 | View & Restore Archives | PLAN v2 | 1 | Not started |
| 4 | Theme Toggle | PLAN v2 | 1 | Not started |
| 5 | Quick Pulse Check-In | v5 H1 | 2 | Not started |
| 6 | Daily Snapshot | **v8 L3** | 2 | Not started |
| 7 | Micro-Surprise Milestones | **v8 L5** | 2 | Not started |
| 8 | Habit Time Machine | PLAN v2 | 2 | Not started |
| 9 | Completion Sparks | v4 N8 | 2 | Not started |
| 10 | Flexible Frequency | **v8** | 2 | Not started |
| 11 | Streak Graveyard | **v8 L2** | 3 | Not started |
| 12 | Habit DNA | v7 K3 | 3 | Not started |
| 13 | Pause Protocol | v7 K5 | 3 | Not started |
| 14 | Habit Duels | **v8 L4** | 3 | Not started |
| 15 | Daily Calibration | v4 N3 | 3 | Not started |
| 16 | Momentum Velocity | v6 J3 | 3 | Not started |
| 17 | Phantom Streaks | v4 G2 | 3 | Not started |
| 18 | Habit Experiments | **v8 L1** | 4 | Not started |
| 19 | Ripple Effects | v7 K2 | 4 | Not started |
| 20 | Recovery Velocity | v7 K4 | 4 | Not started |
| 21 | Miss Fingerprinting | v6 J1 | 4 | Not started |
| 22 | Habit Load Monitor | v5 H4 | 4 | Not started |
| 23 | Lifecycle Stages | v6 J2 | 4 | Not started |
| 24 | Forgiveness Window | v6 J5 | 4 | Not started |
| 25 | Soft Landing | v5 H3 | 5 | Not started |
| 26 | 2-Minute Fallback | v4 G1 | 5 | Not started |
| 27 | Habit Stacking | PLAN v2 | 5 | Not started |
| 28 | Insights Tab | PLAN v2 | 5 | Not started |
| 29 | Life Chapters | v7 K1 | 5 | Not started |
| 30 | Data Export | PLAN v2 | 5 | Not started |
| 31 | Living Garden View | PLAN v2 | 6 | Deferred |
| 32 | Weekly Compass | PLAN v2 | 6 | Deferred |
| 33 | Narrative Milestones | v4 G3 | 6 | Deferred |
| 34 | Identity Framing | v5 H5 | 6 | Deferred |
| 35 | Weather Forecast | v3 F2 | 6 | Deferred |
| 36 | The Ratchet | v4 G4 | 6 | Deferred |
| 37 | Habit Echoes | v4 G5 | 6 | Deferred |
| 38 | Resonance Map | v6 J4 | 6 | Deferred |
| 39 | Habit Autopsy | v3 F1 | 6 | Deferred |
| 40 | Planned Rest | PLAN v2 | 6 | Deferred |
| 41 | Ritual Windows | v5 H6 | 6 | Deferred |
| 42 | Completion Depth | v5 H2 | 6 | Deferred |
| 43 | Categories/Tags | PLAN v2 | 6 | Deferred |
| 44 | PWA/Offline | PLAN v2 | 6 | Deferred |
| 45 | Keyboard Shortcuts | PLAN v2 | 6 | Deferred |
| 46 | Difficulty Progression | PLAN v2 | 6 | Deferred |
| 47 | Time Capsule | v3 F3 | 6 | Deferred |
| 48 | Seasonal Rhythms | PLAN v2 | 6 | Deferred |
| 49 | Drag-and-Drop Reorder | PLAN v2 | 6 | Deferred |
| 50 | Energy Check-In | v3/v5 | 6 | Deferred (absorbed into #15) |
| 51 | Habit Heartbeat | PLAN v2 | 6 | Deferred |
| 52 | Grace Days | v3 | 6 | Deferred (absorbed into #13) |

---

## Part 7: Dimension Coverage After v8

33 behavioral dimensions now covered across all planning documents:

| # | Dimension | Feature(s) |
|---|-----------|-----------|
| 1–28 | (See FEATURES_v7.md Part 1) | K1–K5 + all prior |
| 29 | Deliberate change testing | L1: Habit Experiments |
| 30 | Historical effort preservation | L2: Streak Graveyard |
| 31 | Instant orientation | L3: Daily Snapshot |
| 32 | Relative habit comparison | L4: Habit Duels |
| 33 | Variable-interval reinforcement | L5: Micro-Surprise Milestones |

---

*This document is planning document #8. The codebase still has 5 features.
The next commit should be code, not markdown.*
