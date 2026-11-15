# Habit Garden — Feature Plan v10: Novel Dimensions & Actionable Backlog

**Date:** 2026-10-07
**Supersedes:** FEATURES_v9.md and all prior planning documents
**Status:** New feature proposals (dimensions 39-44) + consolidated backlog

---

## Honest Status

| Metric | Value |
|--------|-------|
| Planning documents created | 9 (PLAN.md, v3-v9) |
| Features shipped | 0 |
| Application source files | 11 |
| Application code lines | ~960 |
| Planning markdown lines | ~5,500+ |
| Planning-to-code ratio | ~5.7:1 |

The codebase is a functional but minimal habit tracker: create habits
(name, frequency, color), toggle completions over a 14-day grid, view
streaks, archive, delete. Optimistic UI with rollback. Dark-themed
responsive layout. Express backend with JSON file storage.

Missing basics: no edit, no unarchive, no undo, no error handling in
API client, no history beyond 14 days, no mobile-optimized grid.

Prior documents mapped 38 behavioral dimensions with extensive citations.
This document adds 6 new dimensions (39-44) that none of those covered,
then consolidates everything into one prioritized backlog.

---

## Part 1: Covered Dimensions (1-38)

Dimensions 1-28 across PLAN.md and v3-v7. Dimensions 29-33 in v8.
Dimensions 34-38 in v9. All new proposals below target dimensions
outside this set.

---

## Part 2: New Feature Proposals

### F1. Habit Displacement Tracker (What You Traded)

**Dimension 39: Behavioral substitution / opportunity cost**

**What:** Each habit has an optional "instead of" field — what the user
stopped doing to make room for this habit.

```
┌─────────────────────────────────────────────┐
│ Meditate 10 min          🔥 12 day streak   │
│ instead of: scrolling social media          │
│                                             │
│ Read 20 pages            🔥 8 day streak    │
│ instead of: watching TV after dinner        │
│                                             │
│ Exercise 30 min          🔥 5 day streak    │
│ instead of: extra sleep                     │
└─────────────────────────────────────────────┘
```

The "instead of" text is a single optional string field on the Habit
model, set at creation or via edit. It serves as a constant reminder
of the trade the user made — reinforcing the habit by making the
alternative visible.

On days where the user misses the habit, a subtle prompt appears:
"Did you [instead-of activity] today instead?" This isn't tracked
formally — it's a reflective nudge that makes the cost of skipping
concrete.

**Why this is novel:** Every feature proposed in dims 1-38 treats
habits in isolation — as things to do. None addresses what the habit
*replaces*. But behavior change is fundamentally about substitution:
you don't just add a behavior, you trade one for another. Making the
trade visible leverages loss aversion — "I'm about to trade my reading
time for TV" is more motivating than "I should read."

**Behavioral science:** Substitution principle (Rachlin, 2000): lasting
behavior change works through replacement, not addition. The brain
doesn't create behavioral vacuums; it fills them. Making the
substitution explicit gives the user a concrete "if tempted, remember
what you traded" anchor.

**Data model:**
```typescript
type Habit = {
  // ...existing fields
  insteadOf?: string  // max 100 chars
}
```

**Effort:** Tiny. One optional string field. One line in the form. One
line of display in HabitRow. No new endpoints — rides the existing
create and the forthcoming edit endpoint.

---

### F2. Tomorrow Confidence Score

**Dimension 40: Predictive self-assessment / forward-looking risk**

**What:** After completing all habits for the day (or at end-of-day),
the app shows a quick prompt for each completed habit:

```
How likely are you to do this tomorrow?

Exercise      [Unlikely] [Maybe] [Likely] [Certain]
Meditate      [Unlikely] [Maybe] [Likely] [Certain]
Read          [Unlikely] [Maybe] [Likely] [Certain]
```

This takes 3-5 seconds. The scores (1-4) are stored per habit per day.
Over time, the app calculates a "confidence trend" per habit — a
rolling average that predicts which habits are at risk of breaking
*before they actually break*.

```
Exercise          🔥 14 day streak
                  Confidence: trending down ↘ (avg 3.2 → 2.1 over 5 days)
                  ⚠ At risk — consider reducing scope
```

The key insight: the user knows their own future better than any
algorithm. A person who completed their exercise today but rates
tomorrow as "unlikely" is telling you something that no historical
pattern can detect. This is human-in-the-loop prediction.

**Why this is novel:**
- **Slump Radar (dim 32)** uses historical completion data to predict
  decline. Confidence Score uses the user's own forward assessment.
  One is backward-looking inference; the other is forward-looking
  self-report. They complement but don't overlap.
- **Energy-Aware Check-In (dim N3)** assesses today's state. Confidence
  Score assesses tomorrow's likelihood. Different temporal direction.
- **Adaptive Difficulty (dim 33)** responds to measured decline.
  Confidence Score acts on predicted decline before it happens.

**Behavioral science:** Prospective monitoring (Meichenbaum & Turk,
1987): asking people to predict their own future compliance improves
actual compliance. The act of rating "unlikely" creates cognitive
dissonance that often increases follow-through. Additionally,
confidence trends are a form of self-generated feedback that's more
personally meaningful than algorithmic predictions.

**Data model:**
```typescript
type ConfidenceLog = {
  [habitId: string]: {
    [date: string]: 1 | 2 | 3 | 4  // 1=unlikely, 4=certain
  }
}
```

**Effort:** Small. New data store alongside logs, a quick rating UI
that appears contextually, trend calculation (rolling average of last
7 scores), a warning indicator in HabitRow.

---

### F3. Habit Inheritance (Evolution Chains)

**Dimension 41: Habit identity continuity across transformation**

**What:** When a habit evolves — "Walk 15 min" becomes "Jog 20 min,"
or "Meditate 5 min" becomes "Meditate 20 min" — the user can "evolve"
the habit rather than archiving the old one and creating a new one.

```
Evolve "Walk 15 min"?

New name:  Jog 20 min
New freq:  [Daily ▼]

☑ Carry forward streak (14 days)
☑ Keep completion history

[Evolve]  [Cancel]
```

The evolved habit retains its ID, completion history, and streak. A
small "evolution badge" shows the lineage:

```
Jog 20 min            🔥 38 day streak
  evolved from "Walk 15 min" on Sep 15
  evolved from "Walk 10 min" on Aug 1
```

The evolution history creates a narrative of growth that streaks alone
cannot tell. "I started with 10-minute walks and now I jog for 20
minutes" is a powerful identity story.

Habits can also *split*: "Exercise" becomes "Run" and "Yoga," each
inheriting a portion of the parent's history. Splits are less common
but important for users whose habits naturally specialize over time.

**Why this is novel:**
- **Difficulty Progression (dim N5/38)** adds levels within a single
  habit. Evolution *transforms* the habit's identity. Leveling up
  "Meditate" from Level 1 (5 min) to Level 4 (20 min) keeps the same
  name. Evolving "Walk" into "Jog" changes what the habit IS.
- **Edit Habit (QW1)** lets you rename. But renaming is cosmetic —
  there's no record that the habit changed. Evolution creates an
  explicit lineage.
- No prior dimension addresses what happens when a habit outgrows its
  original definition.

**Behavioral science:** Identity-based habits (Clear, 2018): "I'm a
runner" is more powerful than "I run." Evolution chains show the user
how their behavioral identity transformed over time — from "person who
walks" to "person who jogs." This identity narrative strengthens
commitment to the current form.

Narrative identity theory (McAdams, 2001): people maintain psychological
coherence through self-narratives. An evolution chain IS a self-narrative
— "I started small and grew." Without it, archiving "Walk" and creating
"Jog" fragments the story into disconnected pieces.

**Data model:**
```typescript
type Habit = {
  // ...existing fields
  evolvedFrom?: {
    habitId: string
    name: string
    date: string
  }
}
```

The evolution is implemented as an edit (change name/frequency) plus
a historical record of the transformation. No new entities — just a
metadata field on the existing Habit type.

**Effort:** Small. One metadata field, UI for "Evolve" action (reuses
edit form), evolution badge display. Backend: update habit with
evolution metadata. Depends on Edit Habit (QW1).

---

### F4. The 2-Day Rule (Streak Safety Net)

**Dimension 42: Binary-streak alternative / consecutive-miss threshold**

**What:** A toggle-able streak mode that uses the "never miss twice"
rule instead of the standard "consecutive days" streak. Under this
mode:

- Missing one day does NOT break the streak.
- Missing two *consecutive* days breaks the streak.
- The streak counter shows both: "🔥 23 days (1 miss allowed)"

```
Standard mode:    ✓ ✓ ✓ ✗ ✓ ✓ ✓   → Streak: 3 days
2-Day Rule mode:  ✓ ✓ ✓ ✗ ✓ ✓ ✓   → Streak: 7 days (1 miss absorbed)
```

The visual grid shows absorbed misses differently — a dimmed/outlined
cell instead of empty, indicating "missed but forgiven."

This can be set per-habit. Some habits deserve strict streaks (the user
wants the pressure). Others benefit from the safety net (the user wants
consistency without anxiety).

**Why this is novel:**
- **Grace Days (dim N2)** require advance declaration. The 2-Day Rule
  is automatic — no planning needed. Grace Days are intentional rest.
  The 2-Day Rule is automatic forgiveness for unplanned misses.
- **Streak Insurance** is a monthly budget of pre-declared days. The
  2-Day Rule is a structural change to how streaks are calculated —
  no budgets, no declarations, just "one miss is okay."
- **Streak Recovery (dim 22)** softens the display after a break
  ("Recovering: 3/7 days"). The 2-Day Rule prevents the break from
  registering in the first place.
- No prior dimension proposes an alternative streak calculation model.
  All assume consecutive-day streaks are the only valid measure.

**Behavioral science:** This is directly from Matt D'Avella's popular
"Two Day Rule" — a widely adopted technique in the habit-building
community. The psychological insight: one missed day is a rest; two
consecutive missed days is the start of a new (bad) habit. The rule
operationalizes James Clear's "never miss twice" maxim.

Research on "fresh start effect" (Dai, Milkman & Riis, 2014): a single
miss can be reframed as a pause rather than a failure. But two
consecutive misses cross a psychological threshold where the behavior
feels "broken." The 2-Day Rule aligns the tracker with this natural
threshold.

**Data model:**
```typescript
type Habit = {
  // ...existing fields
  streakMode?: 'strict' | 'two-day'  // default: 'strict'
}
```

One optional field. Streak calculation adds a branch: if mode is
'two-day', skip single-day gaps.

**Effort:** Small. One field, streak calculation variant, visual
distinction for absorbed misses. Estimated: 30-45 minutes.

---

### F5. Habit Health Heatmap (Micro-Visualization per Habit)

**Dimension 43: Per-habit temporal density visualization**

**What:** Each habit row gets a tiny inline heatmap — a row of 30 small
colored squares (one per day for the past month) showing completion
density at a glance, similar to GitHub's contribution graph but
per-habit and inline.

```
Exercise    🔥 8 days   ░░█░█░██░█░█░██░░█░█░██░█░█░██░█
Meditate    🔥 14 days  ░░████████████████████████████████
Read        🔥 3 days   ░░░░░░░░░░░░░░░░░░░░░░░░░░░██░██
```

Colors: filled squares use the habit's color at varying opacity (recent
days are more opaque). Empty squares are dim. The heatmap replaces or
supplements the 14-day grid — it shows the same data but at a longer
time horizon (30 days) in less space.

Hovering/tapping a square shows the date and any note (if F2 Habit
Notes is implemented). This makes the heatmap a navigation tool, not
just a visualization.

**Why this is novel:**
- **Dashboard / Heatmap (PLAN.md Phase 5)** proposes a GitHub-style
  yearly heatmap as a separate view. This is an *inline* per-habit
  mini-heatmap that lives in the main table. Different scope (one habit
  vs. all), different time frame (30 days vs. 365), different location
  (inline vs. separate page).
- **Habit DNA (dim K3/v7)** is an SVG pattern visualization showing
  rhythm shapes. The heatmap is simpler: just completion density over
  time. DNA shows patterns; the heatmap shows raw history.
- **The 14-day grid** already shows recent history, but it's
  interactive (toggle-able) and space-intensive. The heatmap is
  read-only, compact, and shows 2x more history.
- No prior feature puts extended history directly in the main habit
  list view.

**Behavioral science:** The "don't break the chain" visual (attributed
to Jerry Seinfeld) is one of the most effective habit maintenance
tools. A visible chain of completions creates psychological momentum
— you don't want to introduce a gap. The inline heatmap makes this
chain immediately visible without navigating away from the main view.

Pre-attentive processing (Healey & Enns, 2012): color density
differences are perceived in under 200ms, before conscious attention
engages. A quick glance at the heatmap row tells the user "this habit
is strong" or "this habit is fading" faster than reading a number.

**Data model:** None. Pure visualization of existing log data. The logs
already contain all completion dates — the heatmap just renders them
differently.

**Effort:** Small. One component (~40 lines) that maps the last 30
days of a habit's log dates to colored squares. No backend changes.
Estimated: 30-40 minutes.

---

### F6. Completion Streaks Across Habits (Cross-Habit Consistency)

**Dimension 44: System-level behavioral consistency / all-habits streaks**

**What:** A "Perfect Day Streak" counter in the app header that tracks
how many consecutive days the user completed ALL active habits (or all
"core" habits if Minimum Viable Day is implemented).

```
┌──────────────────────────────────────────────────────┐
│  Habit Garden                         Oct 7, 2026    │
│  Grow tiny daily habits               Perfect days:  │
│  into big changes.                    🔥 5 in a row  │
│                                       Best: 12 days  │
└──────────────────────────────────────────────────────┘
```

Below the header, a weekly summary shows which days were perfect:

```
This week:  Mon ✓  Tue ✓  Wed ✓  Thu ✓  Fri ✓  Sat ·  Sun ·
Last week:  Mon ✓  Tue ✓  Wed ·  Thu ✓  Fri ✓  Sat ✓  Sun ✓
```

A "perfect day" is computed from existing log data — it checks whether
every active, non-archived, scheduled-for-that-day habit has a
completion entry. No new data is needed.

**Why this is novel:**
- **Individual streaks** track one habit at a time. Perfect Day Streak
  tracks the system — all habits together. It answers "Am I showing up
  fully?" not "Am I doing this one thing?"
- **System Score (dim L3)** is a composite 0-100 health metric.
  Perfect Day Streak is binary — either everything was done or it
  wasn't. Simpler, more motivating, zero computation ambiguity.
- **Completion Momentum (dim L2)** tracks "3 of 7 done" within a day.
  Perfect Day Streak tracks across days. One is intra-day progress;
  the other is inter-day consistency.
- No prior feature tracks the user's consistency across ALL habits
  over time as a streak.

**Behavioral science:** "All-or-nothing" thinking is usually harmful
in habit psychology, but a Perfect Day counter channels it
constructively. The user isn't punished for imperfect days — they
still have individual habit streaks. The Perfect Day streak is a
bonus tier that creates an additional motivational target for high-
performing days.

Mastery experiences (Bandura, 1997): completing ALL habits in a day
is a mastery experience — evidence of self-efficacy that strengthens
belief in one's ability to maintain the full system. Tracking these
experiences makes them visible and cumulative.

**Data model:** None. Computed entirely from existing habits and logs.
A function that, for each day, checks whether every active habit's
log includes that date.

**Effort:** Small. One computation function, one display component
in the header. Estimated: 30-40 minutes.

---

## Part 3: Dimension Map Update (39-44)

| # | Dimension | Feature | Gap Filled |
|---|-----------|---------|-----------|
| 39 | **Behavioral substitution / opportunity cost** | F1: Displacement Tracker | No feature addresses what habits replace |
| 40 | **Predictive self-assessment** | F2: Tomorrow Confidence | No feature uses the user's own forward prediction |
| 41 | **Identity continuity across transformation** | F3: Habit Inheritance | No feature handles habits outgrowing their definition |
| 42 | **Binary-streak alternative** | F4: The 2-Day Rule | No feature offers alternative streak models |
| 43 | **Per-habit temporal density visualization** | F5: Inline Heatmap | No feature puts extended history in the main view |
| 44 | **System-level consistency tracking** | F6: Perfect Day Streak | No feature tracks all-habits-done as its own streak |

---

## Part 4: Complete Prioritized Backlog

One list. Every feature from every document (v3-v10), ranked by
impact and dependency. This replaces all prior backlogs.

### Tier 0: Prerequisites (must ship before any feature)

| # | ID | Feature | Effort | Why First |
|---|-----|---------|--------|-----------|
| 1 | QW2 | API Error Handling | 15 min | Silent failures corrupt state |
| 2 | QW1 | Edit Habit | 35 min | Prerequisite for 10+ features |
| 3 | QW3 | Unarchive | 35 min | Archive is a one-way door |

**Combined: ~85 minutes.**

### Tier 1: Core UX (what makes this a usable habit tracker)

| # | ID | Feature | Effort | Source |
|---|-----|---------|--------|--------|
| 4 | M3 | Habit Scheduling (Mon/Wed/Fri) | 75 min | v9 dim 36 |
| 5 | F4 | The 2-Day Rule (streak safety net) | 35 min | **v10 dim 42** |
| 6 | M5 | Streak Milestones + Personal Records | 50 min | v9 dim 38 |
| 7 | M1 | Habit Templates (onboarding) | 35 min | v9 dim 34 |
| 8 | M4 | Habit Ordering (v1: arrow buttons) | 35 min | v9 dim 37 |
| 9 | F1 | Displacement Tracker ("instead of") | 10 min | **v10 dim 39** |

### Tier 2: Daily Experience (make check-ins fast and rewarding)

| # | ID | Feature | Effort | Source |
|---|-----|---------|--------|--------|
| 10 | F5 | Inline Heatmap (30-day mini-graph) | 35 min | **v10 dim 43** |
| 11 | F6 | Perfect Day Streak | 35 min | **v10 dim 44** |
| 12 | L2 | Completion Momentum ("3 of 7 done") | 40 min | v8 dim 30 |
| 13 | N8 | Completion Sparks (micro-celebrations) | 45 min | PLAN.md |
| 14 | M2 | Habit Notes (per-completion journal) | 55 min | v9 dim 35 |
| 15 | F2 | Tomorrow Confidence Score | 45 min | **v10 dim 40** |

### Tier 3: Behavioral Intelligence (needs accumulated data)

| # | ID | Feature | Effort | Source |
|---|-----|---------|--------|--------|
| 16 | L3 | System Score (0-100 header metric) | 60 min | v8 dim 31 |
| 17 | L1 | Rhythm Detection (day-of-week patterns) | 50 min | v8 dim 29 |
| 18 | L4 | Slump Radar (multi-habit decline warning) | 45 min | v8 dim 32 |
| 19 | L5 | Effort Autopilot (auto-downshift) | 75 min | v8 dim 33 |
| 20 | K3 | Habit DNA (per-habit SVG pattern) | 50 min | v7 |

### Tier 4: Depth & Resilience

| # | ID | Feature | Effort | Source |
|---|-----|---------|--------|--------|
| 21 | N2 | Streak Insurance / Grace Days | 55 min | PLAN.md |
| 22 | N3 | Energy-Aware Check-In | 40 min | PLAN.md |
| 23 | F3 | Habit Inheritance (evolution chains) | 45 min | **v10 dim 41** |
| 24 | K5 | Pause Protocol (intentional suspension) | 55 min | v7 |
| 25 | K2 | Ripple Effects (post-completion tracking) | 45 min | v7 |
| 26 | K4 | Recovery Velocity | 45 min | v7 |

### Tier 5: Aspirational

| # | ID | Feature | Effort | Source |
|---|-----|---------|--------|--------|
| 27 | N1 | Habit Stacking / Chains | 90 min | PLAN.md |
| 28 | N4 | Weekly Compass (intention setting) | 80 min | PLAN.md |
| 29 | N5 | Difficulty Progression (levels) | 65 min | PLAN.md |
| 30 | K1 | Life Chapters (temporal context) | 65 min | v7 |
| 31 | M4+ | Drag-and-Drop Reorder | 60 min | v9 |

### Parked (valid ideas, wrong time)

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | High effort, cosmetic. Build when core UX is solid. |
| Habit Heartbeat | Needs System Score first. |
| Seasonal Rhythms | Cosmetic. Low user impact. |
| Data Export/Import | Important later. Not urgent until real data exists. |
| PWA / Offline | Large effort. Ship when the app earns offline use. |
| Categories / Tags | Useful at 15+ habits. Most users won't reach that soon. |
| Dashboard / Heatmap (full page) | Inline heatmap (F5) covers the need earlier. |
| Anti-Habits | Niche. |
| Accountability Snapshot | Needs social context. |

---

## Part 5: Why v10's Features Are Different

### Compared to v9 (dims 34-38):

v9 proposed practical UX improvements: templates, notes, scheduling,
ordering, milestones. All are "features you'd expect in a habit tracker."

v10's features are conceptually different:

1. **F1 (Displacement)** reframes habits as *trades*, not additions.
   No habit tracker shows what you gave up. This is a perspective
   shift, not a feature addition.

2. **F2 (Confidence)** uses human prediction instead of algorithmic
   inference. The user IS the prediction model. This inverts the
   typical "analyze past data" approach.

3. **F3 (Inheritance)** treats habits as living, evolving entities
   with lineage. No tracker preserves the continuity when a habit
   transforms.

4. **F4 (2-Day Rule)** challenges the fundamental assumption that
   streaks must be consecutive. It offers a structural alternative,
   not a patch on the existing model.

5. **F5 (Heatmap)** puts the most motivating visualization (the
   chain) directly in the main view instead of hiding it on a
   separate page.

6. **F6 (Perfect Day)** tracks the *system*, not individual habits.
   It answers "Am I showing up?" at the life level.

### Compared to all prior docs (dims 1-38):

Prior dimensions fall into clusters:
- **Streak management** (1, 22, 38, 42): streaks, recovery, records, 2-day rule
- **Temporal patterns** (29, 30, 36): rhythms, within-day, scheduling
- **Motivation/celebration** (4, 38): sparks, milestones
- **Analytics** (31, 32, 33): system score, slump radar, autopilot
- **User state** (3, 23): energy, life context
- **Habit relationships** (9, 21): stacking, interdependencies
- **Onboarding** (34): templates
- **Qualitative data** (35): notes
- **Spatial layout** (37): ordering

v10 adds:
- **Substitution psychology** (39) — new cluster
- **Self-prediction** (40) — new cluster
- **Identity continuity** (41) — new cluster
- **Alternative streak model** (42) — extends streak cluster in a new direction
- **Inline visualization** (43) — new cluster
- **Cross-habit consistency** (44) — new cluster

---

## Part 6: Implementation Sessions

### Session 1: Ship the Basics (~90 min)

| Step | What | Time |
|------|------|------|
| 1 | QW2: Add `if (!res.ok) throw` to all 5 api.ts functions | 15 min |
| 2 | QW1: PUT /api/habits/:id endpoint + inline edit UI | 40 min |
| 3 | QW3: POST /api/habits/:id/unarchive + archived section | 25 min |
| 4 | Manual test: create, edit, archive, unarchive, error states | 10 min |

### Session 2: Streaks That Don't Punish (~80 min)

| Step | What | Time |
|------|------|------|
| 1 | F4: Add streakMode to Habit type, implement 2-Day Rule calc | 25 min |
| 2 | M5: Add personalRecord/milestones, PR display, milestone toast | 45 min |
| 3 | Test: verify streaks, break a streak, check PR display | 10 min |

### Session 3: Scheduling + Quick Wins (~90 min)

| Step | What | Time |
|------|------|------|
| 1 | M3: scheduledDays field, 7 day-toggle buttons, adjusted streaks | 60 min |
| 2 | F1: "instead of" field in create/edit form + display | 10 min |
| 3 | F5: Inline 30-day heatmap component in HabitRow | 20 min |

### Session 4: Onboarding + Ordering (~70 min)

| Step | What | Time |
|------|------|------|
| 1 | M1: Template data + TemplatePicker component | 35 min |
| 2 | M4: sortOrder field, up/down arrows, reorder endpoint | 35 min |

### After Session 4: Pick next from ranked list.

---

## Part 7: Feature Interaction Map

```
F1 Displacement ──── context ────→ F2 Confidence
    │                                 │
    │ ("instead of" reminds you       │ (low confidence for a habit
    │  what you'd be giving up)       │  you have a clear substitute
    │                                 │  for → higher risk signal)
    │                                 │
    ▼                                 ▼
M3 Scheduling ←──── adjusts ────── F4 Two-Day Rule
    │                                 │
    │ (scheduled days define when     │ (2-day rule only counts
    │  the 2-day rule applies)        │  scheduled days as "real" misses)
    │                                 │
    ▼                                 ▼
F5 Heatmap ────── visualizes ──── M5 Milestones
    │                                 │
    │ (30-day inline view shows       │ (milestone badges appear on
    │  the density that earned        │  the heatmap as markers)
    │  milestones)                    │
    │                                 │
    ▼                                 ▼
F6 Perfect Day ←── composed of ── F3 Inheritance
    │                                 │
    │ (perfect day calc respects      │ (evolved habits carry their
    │  evolved habits, not double-    │  streak into the perfect day
    │  counting parent + child)       │  calculation seamlessly)
    │                                 │
    ▼                                 ▼
L2 Momentum ───── feeds ────────→ L3 System Score
```

---

## Part 8: Key Principles for Execution

1. **No more planning documents after this one.** The next 4 commits
   should be code, shipping Tiers 0-1.

2. **Each session ships something.** A session that produces only a
   plan is a failure.

3. **Small features first.** F1 (Displacement) is 10 minutes of work.
   F5 (Heatmap) is 30 minutes. Ship these to build momentum.

4. **Test by using.** After each session, use the app to track a real
   habit for the rest of the day.

5. **The backlog is a menu, not a contract.** Pick what's next based
   on what feels most impactful, not what's ranked highest.
