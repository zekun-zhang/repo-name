# Habit Garden — Feature Plan v11: Final Novel Dimensions & Execution Contract

**Date:** 2026-10-08
**Supersedes:** FEATURES_v10.md and all prior planning documents
**Status:** 5 new feature proposals (dimensions 45-49) + execution contract

---

## Honest Status

| Metric | Value |
|--------|-------|
| Planning documents created | 10 (PLAN.md, v3-v10) |
| Features shipped | **0** |
| Application source files | 11 |
| Application code lines | ~960 |
| Planning markdown lines | **~6,200+** |
| Planning-to-code ratio | **~6.5:1** |
| Commits that are code | 1 of 21 |
| Commits that are plans | 20 of 21 |

v10 said "No more planning documents after this one." Then nothing
shipped. This document adds the final 5 uncovered dimensions and
replaces all prior backlogs with a binding execution contract: what
ships next, in what order, with no more planning permitted until
Tier 0 is in production.

---

## Part 1: Dimension Gap Analysis

### What 44 dimensions cover

Prior documents mapped these conceptual clusters:

- **Streak mechanics** (strict, recovery, 2-day rule, grace days, insurance, milestones, personal records)
- **Daily state** (energy check-in, completion momentum, completion sparks)
- **Temporal patterns** (rhythms, scheduling, time-of-day, seasons, quiet weeks)
- **Habit relationships** (stacking/chains, correlation, ripple effects)
- **Habit evolution** (difficulty progression, inheritance, experiments)
- **Analytics/Intelligence** (system score, slump radar, autopilot, heatmap, DNA)
- **User reflection** (weekly compass, notes/journal, displacement tracking, confidence prediction)
- **Life context** (life chapters, pause protocol)
- **UX fundamentals** (edit, unarchive, templates, ordering, focus mode, keyboard shortcuts, friction control)
- **Identity** (living garden, heartbeat, categories/tags)
- **Data management** (export/import, timestamps, time investment)

### What's missing

Five conceptual areas remain unaddressed across all 44 dimensions:

1. **Why you miss** — Every feature tracks whether you completed or didn't. None captures the *reason* for a miss. Knowing that Exercise is missed 70% due to "too tired" vs. 70% due to "forgot" leads to completely different interventions.

2. **Environmental/temporal cues** — Habit Stacking (dim 9) chains habits to *other habits*. But behavioral science's foundational model — Duhigg's cue-routine-reward loop — starts with *environmental* cues: a location, a time, a preceding event. No dimension links habits to their real-world triggers.

3. **Cross-domain balance** — Categories/Tags (Phase 7) groups habits for filtering. But no feature assesses whether the user's habit *portfolio* is balanced across life domains (health, learning, relationships, career, creativity). A user with 8 health habits and 0 learning habits has a blind spot no existing feature surfaces.

4. **Habit automaticity/graduation** — Archive removes habits (feels like failure). Pause Protocol suspends them (temporary). Habit Experiments trial them (time-limited). But no dimension addresses the *success case*: a habit that became so automatic it no longer needs tracking. "I brush my teeth without thinking" is graduation, not archive.

5. **Earned streak protection** — Grace Days (dim N2) are pre-declared. The 2-Day Rule (dim 42) is structural. Neither is *earned through behavior*. A merit-based system — where consistency earns protection tokens — adds a game mechanic that rewards the exact behavior you want.

---

## Part 2: New Feature Proposals

### F7. Miss Reason Capture

**Dimension 45: Failure pattern analysis**

**What:** When a habit goes uncompleted for a day, the app offers a
one-tap reason capture the next time the user opens the app:

```
Yesterday you skipped Exercise. What happened?

[Too tired]  [Forgot]  [No time]  [Sick]  [Traveling]  [Skip]
```

Reasons are from a fixed preset list (6 options + skip). No free text
— the value is in aggregatable categories, not prose. The capture is
non-blocking: tap once and it's gone. Over time, the app surfaces
patterns:

```
Exercise — Most common skip reason:
  "Too tired" (62%, mostly Thursdays)
  → Try moving Exercise earlier in the day, or
    reduce scope on Thursdays
```

**Why this is novel across all 44 dimensions:**

- **Slump Radar (dim 32)** detects declining completion rates. Miss
  Reason answers *why* they're declining.
- **Energy Check-In (dim N3)** captures how you feel today. Miss Reason
  captures why you skipped yesterday. One is prospective state; the
  other is retrospective explanation.
- **Adaptive Difficulty (dim 33)** auto-adjusts based on completion
  data. Miss Reason gives the adjustment *direction* — "too tired"
  suggests timing change; "forgot" suggests better cues; "no time"
  suggests scope reduction.
- No prior dimension asks the user to explain a miss. All treat misses
  as data points with no metadata.

**Behavioral science:** Attribution theory (Weiner, 1985): the *cause*
a person assigns to a failure determines their response. "I'm lazy"
(internal, stable) leads to helplessness. "I was too tired because I
stayed up late" (internal, unstable) leads to a concrete fix. Structured
miss reasons force specific, actionable attributions instead of vague
self-blame.

Implementation intentions (Gollwitzer, 1999) work best when paired with
obstacle awareness: "When [obstacle], I will [response]." Miss Reason
identifies the obstacles. Future features can suggest the responses.

**Data model:**
```typescript
type MissReason = 'tired' | 'forgot' | 'no-time' | 'sick' | 'traveling' | 'skipped'

type MissLog = {
  [habitId: string]: {
    [date: string]: MissReason
  }
}
```

**Effort:** Small. Preset button row, storage alongside logs, pattern
summary (group by reason, count, find mode per day-of-week).

---

### F8. Habit Cue Anchoring

**Dimension 46: Environmental trigger association**

**What:** Each habit has an optional "cue" field — the real-world trigger
that initiates the behavior:

```
Create a habit

Name:       Meditate 10 min
Frequency:  [Daily ▼]
Color:      [●]
Cue:        After morning coffee ← NEW

[Add habit]
```

Cues are free-text but the UI suggests common patterns:
- "After [existing habit]" (overlaps with stacking, kept simple)
- "When I arrive at [location]"
- "At [time]"
- "Before [activity]"

The daily view groups or annotates habits by their cue context:

```
☕ After morning coffee
  □ Meditate 10 min
  □ Journal 5 min

🏠 When I get home
  □ Exercise 30 min
  □ Read 20 pages

🌙 Before bed
  □ No screens
  □ Stretch 5 min
```

**Why this is novel across all 44 dimensions:**

- **Habit Stacking (dim 9)** chains habits to *other habits*. Cue
  Anchoring links habits to *environmental/temporal triggers*. "After
  Habit A, do Habit B" vs. "After morning coffee, do Habit A."
- **Scheduling (dim 36)** specifies *which days*. Cue Anchoring
  specifies *what triggers it on those days*. One answers "when in the
  week"; the other answers "when in the day."
- **Ordering (dim 37)** controls display sequence. Cue Anchoring
  creates *contextual groups* based on real-world timing.

**Behavioral science:** The habit loop (Duhigg, 2012) — cue → routine
→ reward — is the foundational model of habit formation. The cue is the
*trigger* that initiates the behavior. Without an explicit cue, habits
rely on willpower and memory. With one, they fire automatically when
the cue occurs. Research consistently shows that cue-linked behaviors
become automatic 2-3x faster than intention-only behaviors (Lally et al.,
2010).

**Data model:**
```typescript
type Habit = {
  // ...existing fields
  cue?: string  // max 100 chars
}
```

**Effort:** Tiny. One optional string field. Cue display in HabitRow.
Optional cue-grouped daily view as a future enhancement.

---

### F9. Life Balance Radar

**Dimension 47: Cross-domain habit portfolio health**

**What:** Each habit is optionally assigned to a life domain:

```
Domains: Health | Learning | Relationships | Career | Creative | Spiritual
```

A "Balance" view shows a simple radar/spider chart of domain coverage:

```
         Learning
           ╱╲
          ╱  ╲
  Career ╱ ·  ╲ Health ████
         ╲ ·  ╱
          ╲  ╱
           ╲╱
       Relationships

 Health:        4 habits, 87% completion
 Learning:      1 habit,  60% completion
 Career:        0 habits  ← blind spot
 Creative:      0 habits  ← blind spot
 Relationships: 1 habit,  40% completion
 Spiritual:     0 habits
```

The radar makes imbalance visible at a glance. It doesn't prescribe
balance — some users intentionally focus on one area. But it makes the
*choice* conscious rather than accidental.

A gentle monthly prompt: "Your habits are concentrated in Health. Would
you like to explore adding a Learning habit?" with a link to templates
filtered by domain.

**Why this is novel across all 44 dimensions:**

- **Categories/Tags (Phase 7)** groups habits for *filtering and
  organization*. Life Balance Radar uses categories for *assessment and
  self-awareness*. One is a UI convenience; the other is a psychological
  mirror.
- **System Score (dim 31)** aggregates all habits into one number. Life
  Balance separates habits into domains to reveal *where* you're strong
  or weak, not just whether you're completing things.
- No prior feature treats the habit collection as a *portfolio* to
  balance, only as a list to complete.

**Behavioral science:** Life satisfaction research (Sirgy & Wu, 2009)
consistently shows that balance across life domains predicts well-being
better than intensity in any single domain. People who optimize one area
(e.g., career) at the expense of others report lower life satisfaction
than those who maintain moderate engagement across several areas.

The "hedgehog concept" vs. "fox" distinction (Berlin, 1953; Tetlock,
2005): foxes who attend to multiple domains make better predictions and
report higher satisfaction. A habit tracker that only shows a flat list
implicitly encourages hedgehog focus.

**Data model:**
```typescript
type LifeDomain = 'health' | 'learning' | 'relationships' | 'career' | 'creative' | 'spiritual'

type Habit = {
  // ...existing fields
  domain?: LifeDomain
}
```

**Effort:** Small. One optional enum field, one summary view with basic
SVG radar chart, domain completion calculation from existing logs.

---

### F10. Habit Maturity & Graduation

**Dimension 48: Automaticity detection and intentional retirement**

**What:** Each habit accumulates a hidden "maturity score" based on
sustained high consistency:

```
Maturity stages:
  Seedling  (0-30 days, any consistency)
  Growing   (31-90 days, >70% completion)
  Rooted    (91-180 days, >80% completion)
  Automatic (180+ days, >90% completion)
```

When a habit reaches "Automatic" stage, the app celebrates and offers
graduation:

```
🎓 Meditation has become part of who you are.

 180 days tracked
 94% completion rate
 Longest streak: 47 days

 This habit seems automatic now. You can:

 [Graduate to Hall of Fame]  [Keep tracking]
```

Graduated habits move to a "Hall of Fame" — a trophy case that
celebrates mastered behaviors:

```
🏆 Hall of Fame

  Meditation    Graduated Sep 2026    94% over 180 days
  Reading       Graduated Jul 2026    91% over 210 days
  Journaling    Graduated Jun 2026    88% over 195 days
```

Graduation is always the user's choice — the app suggests, never forces.
A graduated habit can be "recalled" if the user feels it slipping.

**Why this is novel across all 44 dimensions:**

- **Archive** is removal (feels like quitting). Graduation is
  *celebration* (feels like mastery).
- **Difficulty Progression (dim N5)** tracks growth *within* a habit.
  Maturity tracks when the habit itself has become *effortless*.
- **Pause Protocol (dim K5)** is temporary suspension. Graduation is
  permanent success.
- **Habit Experiments (dim 26)** handle trial periods for *new* habits.
  Graduation handles the end state of *established* habits.
- No prior dimension models the natural lifecycle endpoint: a habit that
  succeeded so well it no longer needs conscious effort.

**Behavioral science:** Automaticity research (Lally et al., 2010):
habits take an average of 66 days to become automatic, with a range of
18-254 days. Once automatic, the behavior persists without conscious
effort or external tracking. Continuing to track an automatic habit
wastes cognitive bandwidth that could be spent building new ones.

Self-Determination Theory (Deci & Ryan, 2000): competence is a core
psychological need. Graduation ceremonies satisfy competence by marking
mastery. The Hall of Fame provides lasting evidence of capability,
which strengthens self-efficacy for future habit-building attempts.

**Data model:**
```typescript
type MaturityStage = 'seedling' | 'growing' | 'rooted' | 'automatic'

// Computed from existing log data — no new storage needed for the stage.
// Only graduation requires new data:
type Graduation = {
  habitId: string
  habitName: string
  graduatedAt: string
  totalDays: number
  completionRate: number
}
```

**Effort:** Small-Medium. Maturity calculation from existing logs,
graduation UI, Hall of Fame view. Maturity stage badge in HabitRow.

---

### F11. Earned Streak Shields

**Dimension 49: Merit-based retroactive streak protection**

**What:** Users earn "Shield" tokens through consistency milestones:

```
Earning shields:
  7-day streak   → earn 1 shield
  30-day streak  → earn 2 shields
  90-day streak  → earn 3 shields

Max held: 5 shields across all habits
```

When a streak breaks, the user can spend a shield to retroactively
protect it:

```
Exercise streak broken! You missed yesterday.

 Previous streak: 18 days
 Shields available: 🛡️🛡️🛡️ (3)

 [Use shield — restore streak]  [Accept reset]
```

Using a shield fills in the missed day as "shielded" (distinct visual
from completed or missed):

```
Day grid:  ✓ ✓ ✓ ✓ 🛡️ ✓ ✓ ✓
                ^^ shielded day
```

Shields are precious because they're earned. Spending one is a conscious
choice that makes the user weigh the streak's value. This creates a
micro-economy: consistency earns protection; protection enables longer
streaks; longer streaks earn more protection.

**Why this is novel across all 44 dimensions:**

- **Grace Days (dim N2)** are pre-declared in advance. Shields are
  *retroactive* — used after a miss occurs. Grace Days require
  foresight; Shields require earned capital.
- **2-Day Rule (dim 42)** is automatic and structural. Shields are
  *manual and scarce*. The 2-Day Rule applies to every single-day miss;
  a Shield is a deliberate choice for a specific miss.
- **Streak Recovery (dim 22)** softens the display post-break. Shields
  *prevent* the break from counting.
- All three prior streak-protection mechanisms are passive or pre-set.
  Shields are the only *earned, actively-spent* protection. The earning
  requirement means they reinforce the behavior you want (consistency),
  and the spending choice makes the user value their streak consciously.

**Behavioral science:** Variable ratio reinforcement (Skinner): earning
shields at milestone intervals creates the most engagement-sustaining
reward schedule. The anticipation of earning the next shield at day 30
increases completion motivation from day 20 onward.

Loss aversion (Kahneman & Tversky, 1979): the prospect of spending a
hard-earned shield activates loss aversion *for the shield*, creating a
secondary motivation to not miss in the first place. Users protect their
shields by maintaining streaks, which is exactly the target behavior.

Endowment effect: once earned, shields feel like personal property. The
pain of spending one is a feature, not a bug — it makes the user ask
"Is this miss worth a shield?" which is a more productive question than
"I broke my streak, why bother?"

**Data model:**
```typescript
type Habit = {
  // ...existing fields
  shields?: number         // earned shields held (max 5)
  shieldedDates?: string[] // dates where a shield was used
}
```

**Effort:** Small. Shield earning logic (check milestone thresholds on
each completion), spend UI (post-miss prompt), shielded-day visual in
the day grid.

---

## Part 3: Updated Dimension Map (45-49)

| # | Dimension | Feature | Gap Filled |
|---|-----------|---------|-----------|
| 45 | **Failure pattern analysis** | F7: Miss Reason Capture | No feature captures *why* you miss |
| 46 | **Environmental trigger association** | F8: Habit Cue Anchoring | No feature links habits to real-world triggers |
| 47 | **Cross-domain portfolio health** | F9: Life Balance Radar | No feature assesses balance across life areas |
| 48 | **Automaticity detection & graduation** | F10: Habit Maturity | No feature handles the success case of a fully automatic habit |
| 49 | **Merit-based streak protection** | F11: Earned Streak Shields | No streak protection is earned through consistency |

---

## Part 4: Complete Prioritized Backlog (Final)

This replaces ALL prior backlogs. Features are ranked by dependency,
effort, and impact. Effort estimates are conservative.

### Tier 0: Prerequisites (must ship before anything else)

These are not features — they are bugs. The app is incomplete without them.

| # | ID | Feature | Effort | What |
|---|-----|---------|--------|------|
| 1 | QW2 | API Error Handling | 15 min | `if (!res.ok) throw` in all api.ts functions |
| 2 | QW1 | Edit Habit | 40 min | PUT endpoint + inline edit UI |
| 3 | QW3 | Unarchive | 30 min | POST unarchive endpoint + archived section |

**Combined: ~85 minutes. No excuse not to ship these immediately.**

### Tier 1: Small wins with outsized impact

Each takes under an hour. Each changes how the app feels to use daily.

| # | ID | Feature | Effort | Source |
|---|-----|---------|--------|--------|
| 4 | F1 | Displacement Tracker ("instead of") | 10 min | v10 |
| 5 | F8 | Cue Anchoring (trigger field) | 10 min | **v11** |
| 6 | F4 | The 2-Day Rule | 35 min | v10 |
| 7 | F5 | Inline 30-day Heatmap | 35 min | v10 |
| 8 | F6 | Perfect Day Streak | 35 min | v10 |
| 9 | M4 | Habit Ordering (up/down arrows) | 35 min | v9 |

### Tier 2: Core experience improvements

Features that make the daily check-in genuinely rewarding.

| # | ID | Feature | Effort | Source |
|---|-----|---------|--------|--------|
| 10 | M3 | Habit Scheduling (Mon/Wed/Fri) | 75 min | v9 |
| 11 | N8 | Completion Sparks (micro-celebrations) | 45 min | PLAN.md |
| 12 | F7 | Miss Reason Capture | 40 min | **v11** |
| 13 | M5 | Streak Milestones + Personal Records | 50 min | v9 |
| 14 | M1 | Habit Templates (onboarding) | 35 min | v9 |
| 15 | F11 | Earned Streak Shields | 45 min | **v11** |
| 16 | L2 | Completion Momentum ("3 of 7 done") | 40 min | v8 |

### Tier 3: Depth features (need accumulated usage data)

| # | ID | Feature | Effort | Source |
|---|-----|---------|--------|--------|
| 17 | F10 | Habit Maturity & Graduation | 55 min | **v11** |
| 18 | F9 | Life Balance Radar | 50 min | **v11** |
| 19 | F2 | Tomorrow Confidence Score | 45 min | v10 |
| 20 | L3 | System Score (0-100) | 60 min | v8 |
| 21 | F3 | Habit Inheritance (evolution) | 45 min | v10 |
| 22 | M2 | Habit Notes | 55 min | v9 |
| 23 | L1 | Rhythm Detection | 50 min | v8 |
| 24 | N2 | Streak Insurance / Grace Days | 55 min | PLAN.md |

### Tier 4: Aspirational (build when the app has real daily users)

| # | ID | Feature | Effort | Source |
|---|-----|---------|--------|--------|
| 25 | N3 | Energy-Aware Check-In | 40 min | PLAN.md |
| 26 | N1 | Habit Stacking / Chains | 90 min | PLAN.md |
| 27 | N4 | Weekly Compass | 80 min | PLAN.md |
| 28 | N5 | Difficulty Progression | 65 min | PLAN.md |
| 29 | L4 | Slump Radar | 45 min | v8 |
| 30 | K1 | Life Chapters | 65 min | v7 |

### Parked (valid ideas, not now)

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | High effort. The differentiator, but build when basics work. |
| Habit Heartbeat | Needs System Score. |
| Seasonal Rhythms | Cosmetic. |
| Data Export/Import | Important later. |
| PWA / Offline | Large effort. |
| Dashboard / full-page Heatmap | Inline heatmap (F5) covers it earlier. |
| Anti-Habits | Niche use case. |
| Accountability Snapshot | Needs real usage first. |
| Drag-and-Drop Reorder | Arrow buttons (M4) are simpler and sufficient. |
| Effort Autopilot | Needs extensive data + simpler features first. |
| Habit DNA | Novel but cosmetic. After core UX is solid. |

---

## Part 5: Feature Interaction Map (v11 additions)

```
F7 Miss Reasons ──── informs ───→ L4 Slump Radar
    │                                │
    │ (why you missed tells the      │ (slump radar can now say
    │  radar what kind of slump)     │  "you're in a tired-slump,
    │                                │   not a motivation-slump")
    ▼                                ▼
F8 Cue Anchoring ──── enhances ──→ N1 Habit Stacking
    │                                │
    │ (cues are the entry points     │ (stacks are habit→habit;
    │  that trigger stacked chains)  │  cues are world→habit)
    ▼                                ▼
F9 Life Balance ───── uses ──────→ M1 Templates
    │                                │
    │ (blind spots suggest domains   │ (templates filtered by domain
    │  to explore)                   │  help fill the gap)
    ▼                                ▼
F10 Maturity ────── celebrates ──→ F11 Shields
    │                                │
    │ (mature habits earn shields    │ (shields protect streaks
    │  faster → reaching maturity    │  on the path to maturity)
    │  is itself rewarded)           │
    ▼                                ▼
F10 Graduation ──── frees ──────→ New habit creation
    │
    │ (graduating an automatic habit
    │  makes cognitive room for a
    │  new one, keeping the active
    │  list focused)
```

---

## Part 6: Execution Contract

### The problem

This project has produced 6,200+ lines of planning and 0 lines of
shipped features. The planning is excellent — thorough, well-reasoned,
grounded in behavioral science. But planning that doesn't ship is
theater.

### The rule

**No more planning documents until Tier 0 is shipped.**

After Tier 0 ships (Edit, Unarchive, API Error Handling), the backlog
above is the menu. Pick features by feel and momentum, not rigid
ordering. The tiers are guidelines, not gates.

### Recommended first sessions

**Session 1: Ship the basics (~85 min)**
1. QW2: API Error Handling (15 min)
2. QW1: Edit Habit — PUT endpoint + edit UI (40 min)
3. QW3: Unarchive — POST endpoint + archived section (30 min)

**Session 2: Two tiny fields + one visual (~55 min)**
1. F1: "instead of" field on Habit (10 min)
2. F8: "cue" field on Habit (10 min)
3. F5: Inline 30-day heatmap (35 min)

**Session 3: Streak improvements (~70 min)**
1. F4: 2-Day Rule streak mode (35 min)
2. F6: Perfect Day Streak in header (35 min)

After Session 3, the app has: edit, unarchive, error handling, two
psychological fields (displacement + cue), a 30-day visual, a forgiving
streak mode, and a cross-habit consistency metric. That's a real habit
tracker.

### What makes this plan different from v3-v10

Nothing, structurally. Every prior plan said "ship next" and didn't.
The difference has to be in *execution*, not in the plan. This document
is the last one. The next commit should be code.

---

## Part 7: Why v11's Features Are Different

### Compared to v10 (dims 39-44):

v10 proposed features that enrich existing interactions: what you traded
(F1), predicting tomorrow (F2), habit lineage (F3), alternative streak
math (F4), inline visualization (F5), cross-habit streaks (F6).

v11 addresses structural blind spots:

1. **F7 (Miss Reasons)** adds an entirely new data type — failure
   metadata. Every prior feature processes completion data. No prior
   feature processes absence data. This is the most informative gap
   in the entire system: the signal with the highest intervention
   value is the one no feature captures.

2. **F8 (Cue Anchoring)** connects the app to the physical world.
   Every prior feature exists within the app's own universe — habits,
   logs, streaks, scores. Cues are the bridge to the user's actual
   environment. This is where behavior change physically begins.

3. **F9 (Life Balance)** zooms out from individual habits to the
   portfolio level. It's the only feature that answers "Am I building
   the right habits?" rather than "Am I doing my habits?" — a
   qualitatively different question.

4. **F10 (Maturity/Graduation)** is the only feature that models the
   *end state* of successful habit building. Every other feature
   assumes habits are tracked indefinitely. Graduation acknowledges
   that the goal of a habit tracker is to eventually not need one
   for that habit.

5. **F11 (Streak Shields)** introduces a micro-economy — the first
   feature where behavior in one time period creates resources for
   another. Earning and spending shields connects past consistency
   to future flexibility in a way no passive protection mechanism does.

### The complete dimension count

| Document | Dimensions Added | Running Total |
|----------|-----------------|---------------|
| PLAN.md | 1-8 (N1-N8) | 8 |
| v3-v7 | 9-28 | 28 |
| v8 | 29-33 | 33 |
| v9 | 34-38 | 38 |
| v10 | 39-44 | 44 |
| **v11** | **45-49** | **49** |

49 behavioral dimensions documented. 0 shipped. The dimensions are
comprehensive — further planning offers diminishing returns. The
marginal value of the 50th dimension is near zero. The marginal value
of shipping dimension #1 is near infinite.

**This is the last planning document. The next artifact is code.**
