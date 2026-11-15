# Habit Garden — Definitive Feature Plan v6

**Date:** 2026-10-01
**Supersedes:** FEATURES_v5.md, FEATURES_v4.md, FEATURES_v3.md, PLAN.md v2
**Status:** Final planning document before implementation

---

## The State of Things

**Codebase:** React 19 + TypeScript + Vite frontend, Express/JSON-file backend.
11 source files, ~960 lines. Working features: create habits (name, frequency,
color), toggle daily completions on a 14-day grid, view daily/weekly streaks,
archive, delete. Optimistic UI with rollback.

**Planning debt:** 15 commits. 14 are planning documents. Four separate feature
docs (PLAN.md, FEATURES_v3-v5) with overlapping proposals, conflicting numbering
schemes (N1-N8, F1-F3, G1-G5, H1-H6), and no single source of truth. This
document consolidates everything into one place and introduces one numbering
system.

**What's been well-covered by prior plans (18 dimensions):**

| # | Dimension | Key Proposals |
|---|-----------|---------------|
| 1 | Streak psychology | Grace Days, Phantom Streaks, Streak Recovery, Planned Rest |
| 2 | Energy/capacity | Energy Check-In, Daily Calibration, 2-Minute Fallback |
| 3 | Visual identity | Living Garden, Heartbeat, Seasonal Rhythms |
| 4 | Celebration/reward | Completion Sparks, Milestones, Echoes |
| 5 | Forward planning | Weekly Compass, Intentions |
| 6 | Failure handling (abandonment) | Autopsy, Weather Forecast |
| 7 | Analytics | Dashboard, Heatmap, Correlations, Timestamps |
| 8 | Habit relationships | Habit Stacking / Chains |
| 9 | Habit progression | Difficulty Levels |
| 10 | Attention management | The Ratchet, MVD / Core habits |
| 11 | Narrative/meaning | Narrative Milestones, Time Capsule |
| 12 | Data management | Export, Import |
| 13 | Completion quality | Completion Depth (Light/Full/Deep) |
| 14 | Re-engagement | Soft Landing |
| 15 | Overcommitment | Habit Load Monitor |
| 16 | Time-of-day structure | Ritual Windows |
| 17 | Identity framing | "I am a reader" declarations |
| 18 | Check-in friction | Quick Pulse |

That is comprehensive. The prior plans did excellent analytical work. What
follows targets the gaps they left.

---

## Part 1: New Feature Proposals

Five features addressing five dimensions untouched by any prior document.

---

### J1. Miss Fingerprinting (Failure Attribution on Active Habits)

**What:** When a daily habit goes uncompleted at the end of the day (or when
the user opens the app the next morning with yesterday's gap), a subtle,
one-tap attribution prompt appears inline on that habit's row:

```
Yesterday: Exercise  [Forgot]  [Too busy]  [Chose to skip]  [Unwell]
```

One tap, then it disappears. No tap required — it auto-dismisses after the
user interacts with anything else. The attribution is stored alongside the
log data.

Over time, miss fingerprints reveal actionable patterns that no other feature
can surface:

- "8 of your last 10 Exercise misses were 'Too busy.' This isn't a motivation
  problem — it's a scheduling problem. Consider a different ritual window."
- "You've marked 'Chose to skip' for Reading 6 times this month. That's a
  signal — do you still want this habit, or is it time for an autopsy?"
- "'Forgot' clusters on Wednesdays for Meditation. Your Wednesday routine
  may not have a natural anchor point."
- "'Unwell' misses correlate across all habits on the same days — your
  Planned Rest feature should auto-suggest grace days when you mark one
  habit as 'Unwell.'"

**Why this is genuinely novel:** Prior plans address failure at two extremes:
Habit Autopsy (F1) handles *abandoned* habits — complete failure. Habit Weather
Forecast (F2) *predicts* which days are risky. But neither captures the most
valuable data point: *why you missed a specific day on an active habit*.

The distinction matters: a habit with 80% completion and 20% "Forgot" misses
needs a different intervention (better cue/anchor) than one with 80% completion
and 20% "Chose to skip" misses (waning motivation). Binary miss data can't
distinguish these. Miss Fingerprinting can.

Every existing and proposed feature treats a miss as a single category: "not
done." Miss Fingerprinting decomposes the miss into its cause, which is where
the actionable insight lives.

**Behavioral science:** Attribution theory (Weiner): how people explain their
failures determines their future behavior. External attributions ("too busy")
preserve self-efficacy; internal ones ("chose to skip") can either build
honest self-awareness or trigger learned helplessness depending on framing.
The app should use attributions to suggest structural fixes (external causes)
or prompt reflection (internal causes), not to judge.

**Data model:** New parallel structure alongside HabitLog:

```typescript
type MissLog = {
  [habitId: string]: {
    [date: string]: 'forgot' | 'busy' | 'skipped' | 'unwell'
  }
}
```

Additive. Existing data unaffected. Misses without attribution are treated
as unattributed — no backfill needed.

**Effort:** Small. One inline component (4 buttons), one data structure, one
localStorage fallback for offline. Pattern detection is a pure function over
the miss log.

**Depends on:** Nothing. Enhanced by Weather Forecast (F2) and Ritual Windows
(H6) for pattern-based suggestions.

---

### J2. Habit Lifecycle Stages (Automatic Phase Recognition)

**What:** Each habit automatically progresses through lifecycle stages based on
its age and recent completion rate. The app recognizes four stages:

| Stage | Duration | Completion Rate | App Behavior |
|-------|----------|-----------------|--------------|
| **Seedling** | Days 1-7 | Any | Extra encouragement. "Your first week — every day counts." Spark messages are warmer. The garden plant (if built) is a tiny sprout. |
| **Sprout** | Days 8-21 | >60% | Building momentum. "Two weeks in — you're past the hardest part." Streak display becomes more prominent. |
| **Growing** | Days 22-66 | >50% | The critical window. Research (Lally et al.) says 66 days is the median for automaticity. "Day 45 — you're in the habit-forming zone." |
| **Rooted** | Day 67+ | >70% over last 30 days | Established. Lighter messaging. "This one's part of you now." Eligible for Ratchet locking. |

Stage is computed, never stored — derived from `createdAt`, current date, and
recent completion rate. If a Rooted habit's completion drops below 50% for
14 days, it reverts to Growing with a gentle message: "Exercise needs some
attention — it's slipping from your routine."

Lifecycle stage is displayed as a small label or icon on each habit row:
a seed icon, a sprout, a leaf, a tree. It's ambient information — visible at
a glance but not demanding attention.

**Why this is genuinely novel:** Prior plans treat habits as either "active"
or "archived" — a binary. The Ratchet (G4) adds "locked" as a third state,
but it's manually toggled, not automatically recognized. No feature acknowledges
that a day-3 habit and a day-300 habit are in fundamentally different
psychological phases.

Every habit goes through a lifecycle. Early habits need encouragement and
low expectations. Mid-lifecycle habits need structure and accountability.
Established habits need maintenance, not cheerleading. Treating them all
the same is like coaching a beginner and an expert identically.

Lifecycle Stages is different from Difficulty Progression (N5), which tracks
how hard the habit's content gets (5 min → 20 min meditation). Lifecycle
is about the habit's *behavioral maturity* — how automatic it has become —
regardless of difficulty level.

**Behavioral science:** Lally et al. (2010) found habit formation takes
18-254 days (median 66). The "21-day myth" is wrong, and most people quit
in the 3-6 week range — the "Valley" between novelty motivation and
automaticity. Lifecycle Stages makes this science visible: "You're on day
28 — the valley is normal. Keep going."

Transtheoretical model (Prochaska & DiClemente): behavior change proceeds
through stages (precontemplation → contemplation → preparation → action →
maintenance). Lifecycle Stages maps loosely to action → maintenance, giving
the user a sense of progression even when the habit itself hasn't changed.

**Data model:** None. Pure computation over existing `createdAt` and log data.
One utility function, one small display component.

**Effort:** Small. Stage calculation function (~20 lines), icon/label
rendering in HabitRow, stage-aware message templates for Completion Sparks.

**Depends on:** Nothing. Enhances Completion Sparks (stage-aware messages),
The Ratchet (auto-suggestion for locking at Rooted stage), and Soft Landing
(shows lifecycle stage on return).

---

### J3. Momentum Velocity (Rate-of-Change Indicator)

**What:** A small directional arrow next to each habit's streak pill showing
whether the habit's completion rate is trending up, down, or stable:

```
Exercise    23 days ↑     ← completion rate rising over last 4 weeks
Meditate    12 days →     ← stable
Read         3 days ↓     ← declining
```

The arrow is computed by comparing the completion rate of the last 14 days
against the 14 days before that:

- **↑ Rising** (green): Rate increased by 15%+ (e.g., 60% → 80%)
- **→ Stable** (neutral): Rate changed by less than 15%
- **↓ Declining** (amber): Rate decreased by 15%+ (e.g., 80% → 60%)

For new habits (< 28 days old), velocity is hidden — not enough data.

An optional app-level velocity indicator in the header shows the overall
trend: "Your habits are ↑ trending up this fortnight." This single sentence
replaces the need to study each habit individually.

**Why this is genuinely novel:** Every metric in every prior plan is about
*absolute position*: streak length, completion percentage, momentum score,
completion depth, load ratio. None captures *direction of change*.

Position tells you where you are. Velocity tells you where you're going.
A person with a 40% completion rate and rising velocity is in a better
position than someone at 80% and falling. The first is building; the second
is losing ground. No proposed feature distinguishes between these situations.

Velocity is also the earliest warning signal. A streak is a lagging indicator
— by the time it breaks, the decline already happened. A declining velocity
arrow appears days before the streak breaks, giving the user (and features
like Weather Forecast) time to intervene.

**Behavioral science:** Goal gradient effect (Kivetz, Urminsky & Zheng):
people accelerate effort as they perceive progress toward a goal. A rising
velocity arrow *shows* acceleration, which reinforces it. Conversely,
visible deceleration triggers corrective action before failure occurs.

Prospect theory (Kahneman & Tversky): losses loom larger than gains. A
declining arrow is a mild loss signal that motivates course correction
without the devastation of a broken streak. It's the "check engine light"
before the breakdown.

**Data model:** None. Pure computation over existing log dates. One utility
function comparing two 14-day windows.

**Effort:** Small. One utility function (~15 lines), one arrow icon in
HabitRow, one optional header summary. No backend changes.

**Depends on:** Nothing. Enhanced by Weather Forecast (velocity as a forecast
input) and Habit Load Monitor (declining velocity as an overcommitment signal).

---

### J4. Habit Resonance Map (Co-occurrence Intelligence)

**What:** After 30+ days of data, the app silently computes which habits tend
to succeed or fail together. It surfaces this as a "Resonance Map" — a simple,
non-interactive visualization accessible from the header:

```
Resonance Map

Strong pairs (succeed together):
  Exercise ←→ Meditate     87% co-completion
  Read ←→ Journal          79% co-completion

Risk pairs (fail together):
  Exercise ←→ Cook          When you skip Exercise, 72% chance you skip Cook
  Read ←→ Journal           When you skip Read, 68% chance you skip Journal

Your keystone habit:
  Exercise — when you complete this, your other habits are 34% more likely
  to be completed. Protect this one.
```

The "keystone habit" insight is the most actionable: it identifies the single
habit whose completion most strongly predicts completion of others. This is the
habit to never skip, the one to protect with Grace Days, the one to set as
a morning ritual.

The map updates weekly (not daily — correlations need stability). It's a
read-only view; it doesn't change the check-in experience.

**Why this is genuinely novel:** Habit Correlation (#31 in PLAN.md, merged into
Insights Tab) was proposed as a passive analytics view — one tab among many
in a dashboard. Resonance Map extracts the single most useful insight
(keystone identification) and makes it a first-class feature, not buried
in analytics.

More importantly, no prior plan proposes *acting on* correlations. The
Resonance Map doesn't just show correlations — it identifies the keystone
and integrates with other features: the keystone gets a special icon,
Weather Forecast considers keystone misses as higher-risk events, and
the Habit Load Monitor weights keystone habits more heavily in its
capacity calculation.

Habit Stacking (N1) models *designed* relationships (user-declared chains).
Resonance Map discovers *emergent* relationships (data-driven co-occurrence).
These are complementary: you might stack habits you think go together, but
the data might reveal a different natural grouping.

**Behavioral science:** Keystone habits (Duhigg, "The Power of Habit"):
certain habits create cascade effects that spill over into other areas.
Exercise is the classic example — people who exercise consistently also
tend to eat better, sleep more, and be more productive. Identifying a
user's personal keystone from their own data is more actionable than the
generic advice to "exercise more."

Network science: habits form a behavioral network where nodes (habits) have
varying centrality. The keystone habit is the highest-centrality node —
removing it destabilizes the network. Protecting it stabilizes everything else.

**Data model:** None. Pure computation over existing log data. Co-occurrence
is calculated as: for each pair of habits, the percentage of days where both
were completed (or both missed) vs. days where only one was. Keystone is the
habit with the highest average lift across all other habits.

Computation is memoized and recalculated weekly. Results cached in
localStorage.

**Effort:** Small-Medium. Co-occurrence calculation (~40 lines), keystone
detection (~20 lines), one display component, localStorage cache. No backend
changes.

**Depends on:** Needs 30+ days of data with 3+ habits. Enhanced by Weather
Forecast (keystone-aware predictions) and Habit Load Monitor (keystone
weighting).

---

### J5. Streak Forgiveness Window (Real-Time Save Mechanic)

**What:** When a daily habit is not yet completed and it's past 8 PM (or a
user-configured "evening hour"), the habit enters a "forgiveness window."
Instead of silently failing at midnight, the app shows a gentle real-time
indicator:

```
  ⏳ Exercise     Not yet today — 3h 42m to keep your streak
```

The countdown is not a notification — it appears only when the user opens the
app. The visual treatment is calm (a soft amber glow, not a red alarm). The
message is encouraging, not pressuring:

- At 8 PM: "Still time for Exercise tonight."
- At 10 PM: "Exercise streak at risk — even a 2-minute fallback counts."
  (Integrates with 2-Minute Fallback if configured.)
- At 11 PM: "Last hour. Your 23-day streak is worth protecting."

If the habit has a ritual window (H6) of "Morning" and it's now evening, the
message adapts: "Exercise was planned for morning. Want to do a quick version
now, or declare today a grace day?" (Integrates with Planned Rest if available.)

The next morning, if the habit was missed, the app shows a brief, single-line
acknowledgment: "Exercise streak ended at 23 days. Your record was 31." No
guilt, just facts. Then the Miss Fingerprinting prompt (J1) appears.

**Why this is genuinely novel:** Every streak-related feature operates in one
of two time frames: *before the miss* (Grace Days prevent it, Weather predicts
it) or *after the miss* (Phantom Streaks reframe it, Streak Recovery softens
it, Soft Landing welcomes you back). No feature operates *during the day the
miss is about to happen*.

The Forgiveness Window is the only feature that exists in real-time — in the
window between "I haven't done it yet" and "the day is over." This is the
highest-leverage moment for behavior change: the user has opened the app,
they can see the streak at risk, and there's still time to act. Every other
feature is either too early (planning) or too late (recovery).

This is different from push notifications (which are invasive, require PWA,
and interrupt the user externally). The Forgiveness Window is visible only
when the user voluntarily opens the app — it's a pull mechanic, not a push.

**Behavioral science:** Present bias (O'Donoghue & Rabin): people overweight
immediate costs vs. future benefits. A countdown makes the future cost (losing
the streak) feel immediate. Loss aversion (Kahneman): "3 hours to keep your
23-day streak" frames the decision as avoiding a loss, which is a stronger
motivator than "complete Exercise today" (pursuing a gain).

Temporal landmarks (Dai, Milkman & Riis): the transition from "today" to
"tomorrow" is a psychological boundary. The Forgiveness Window makes that
boundary visible and actionable, turning "I'll do it later" into "I have
3 hours, not forever."

**Data model:** None. Pure UI computed from current time, today's completion
status, and existing streak data. One localStorage preference for the
"evening hour" threshold (default 8 PM).

**Effort:** Small. Time comparison logic, conditional rendering in HabitRow
(or Quick Pulse view), countdown formatting. No backend changes.

**Depends on:** Nothing. Enhanced by 2-Minute Fallback (offer the fallback
during the window), Ritual Windows (context-aware messaging), and Planned
Rest (offer grace day declaration as an alternative).

---

## Part 2: Consolidated Master Roadmap

This replaces all prior roadmaps. One numbering system. One source of truth.

### Numbering Convention

All features use a flat sequential number (1-30). Prior identifiers (N1, F2,
G3, H4, J5) are listed in parentheses for cross-reference only.

### Design Principles

1. **Ship basics before creativity.** CRUD must work before psychology features.
2. **Reduce friction before adding features.** Quick Pulse ships early.
3. **Frontend-only features first.** No-backend features ship faster.
4. **Each phase has a testable thesis.** Not just a feature list.
5. **Lifecycle-aware ordering.** Features that improve with data ship early so
   data accumulates. Features that need data ship later.

---

### Phase 1: Foundation (Must Ship First)

**Thesis:** A user can fully manage their habits without hitting bugs or dead
ends.

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| 1 | **Edit Habit** | S | PUT endpoint + inline edit form. Unblocks all features that add fields. |
| 2 | **API Error Handling** | S | Check `res.ok` in api.ts. Prevent silent failures. 10-line fix. |
| 3 | **View & Restore Archives** | S | Unarchive endpoint + collapsible section. Complete the CRUD story. |
| 4 | **Theme Toggle** | S | Reconcile index.css variables with App.css. Add manual toggle + system preference. |

**Exit criteria:** Full CRUD works. Errors surface. Both themes render correctly.

---

### Phase 2: Daily Experience (Make Check-In Fast and Rewarding)

**Thesis:** Checking in on 10+ habits takes under 15 seconds. The app adapts
to the user's state and celebrates appropriately.

| # | Feature | Effort | Origin | Description |
|---|---------|--------|--------|-------------|
| 5 | **Quick Pulse Check-In** | S | H1 | Minimal today-only view as default. Full table is opt-in depth. |
| 6 | **Daily Calibration** | S | N3+MVD | Core habit flag + energy picker. Low energy dims non-core habits. |
| 7 | **Completion Sparks** | S | N8 | Context-aware micro-celebrations. Stage-aware messages. |
| 8 | **Ritual Windows** | S | H6 | Time-of-day habit ordering. Morning habits first in morning. |
| 9 | **Streak Forgiveness Window** | S | **New J5** | Evening countdown for at-risk streaks. Real-time save mechanic. |
| 10 | **Habit Time Machine** | S | #14 | Arrow navigation beyond 14-day window. |

**Exit criteria:** A user opens the app, sees a clean list sorted by time
relevance, taps each habit with a celebration, and is done in 15 seconds. At
risk streaks have a real-time safety net.

---

### Phase 3: Honesty and Intelligence (Tell the Truth About Habits)

**Thesis:** The app tells the user not just *whether* they showed up, but
*how well*, *why they didn't*, and *which direction they're heading*.

| # | Feature | Effort | Origin | Description |
|---|---------|--------|--------|-------------|
| 11 | **Completion Depth** | S | H2 | Light/Full/Deep optional quality rating. Auto-dismisses. |
| 12 | **Miss Fingerprinting** | S | **New J1** | One-tap miss attribution (Forgot/Busy/Skipped/Unwell). |
| 13 | **Phantom Streaks** | S | G2 | "52/55 days (95%)" instead of "Streak: 3." Positive reframing. |
| 14 | **Momentum Velocity** | S | **New J3** | ↑↓→ trend arrows per habit. Earliest warning signal for decline. |
| 15 | **Habit Load Monitor** | S | H4 | Overcommitment detection. "You have 10 habits but complete 7." |
| 16 | **Habit Lifecycle Stages** | S | **New J2** | Auto-computed Seedling → Sprout → Growing → Rooted phases. |

**Exit criteria:** A user who is overcommitted gets warned. A declining habit
shows ↓ before the streak breaks. Misses are attributed to causes. Habits
display their maturity stage.

---

### Phase 4: Resilience and Safety Nets (Keep Users Through Hard Times)

**Thesis:** The app catches you when you fall, helps you right-size your
ambitions, and turns failure into learning.

| # | Feature | Effort | Origin | Description |
|---|---------|--------|--------|-------------|
| 17 | **Soft Landing** | S-M | H3 | Re-engagement screen after 7+ days absence. Anti-guilt welcome. |
| 18 | **2-Minute Fallback** | S | G1 | Elastic habit scope for low-energy days. "Put on shoes and step outside." |
| 19 | **Planned Rest** | S-M | N2+N7 | Pre-declared grace days + quiet weeks. Streak preserved. |
| 20 | **Habit Autopsy** | S | F1 | Structured reflection when habits are abandoned. Failure → data. |
| 21 | **Identity Framing** | S | H5 | "I am a reader." Reflected on streaks, breaks, and returns. |

**Exit criteria:** A user who overcommits gets helped. A user who returns
after absence is welcomed. A user who abandons a habit learns from it.
Identity persists through setbacks.

---

### Phase 5: Depth and Meaning (Make It Yours)

**Thesis:** The app reflects who you are, tells your story, and reveals
patterns you can't see on your own.

| # | Feature | Effort | Origin | Description |
|---|---------|--------|--------|-------------|
| 22 | **Living Garden View** | M | #15 | SVG plants reflecting habit health. The product's visual soul. |
| 23 | **Narrative Milestones** | S-M | G3 | Template-generated stories at 7/30/90/365 days. |
| 24 | **The Ratchet** | S-M | G4 | Established habits recede. Developing habits get attention. |
| 25 | **Habit Echoes** | S | G5 | Random surfacing of forgotten past achievements. |
| 26 | **Habit Resonance Map** | S-M | **New J4** | Co-occurrence intelligence. Keystone habit identification. |

**Exit criteria:** A user with 3+ months of data sees their habits as a living
garden with a story. They know which habit is their keystone. Established
habits fade while new ones get focus.

---

### Phase 6: Advanced Analytics and Planning

**Thesis:** The app is an active partner — it predicts, reflects, and coaches.

| # | Feature | Effort | Origin | Description |
|---|---------|--------|--------|-------------|
| 27 | **Insights Tab** | M | #28-31 | Tabbed analytics: dashboard, heatmap, depth analytics, correlations. |
| 28 | **Habit Weather Forecast** | S | F2 | Day-of-week risk prediction icons. |
| 29 | **Weekly Compass** | M | N4 | Weekly intention-setting and reflection. |
| 30 | **Data Export** | S | #34 | JSON/CSV download. Table stakes for long-term users. |

**Exit criteria:** A user with months of data can answer "What are my patterns?"
and set intentional weekly goals.

---

### Deferred (Promote When the 30 Above Are Shipped)

| Feature | Origin | Why Deferred |
|---------|--------|-------------|
| Habit Stacking / Chains | N1 | Medium effort, new data model. Cool but not core. |
| Difficulty Progression | N5 | Useful after months of use. Lifecycle Stages covers the phase-awareness gap. |
| Time Capsule | F3 | High novelty, low urgency. Shines after Garden is built. |
| Habit Heartbeat | N6 | Visualizes momentum score. Build after Garden exists. |
| Categories / Tags | #37 | Power feature. Needed at 15+ habits, not before. |
| Drag-and-Drop Reorder | #38 | Nice-to-have. Ritual Windows handles smart ordering. |
| PWA / Offline | #40 | Large effort. Defer until daily use is proven. |
| Keyboard Shortcuts | #12 | Small, independent. Ship whenever. |
| Seasonal Rhythms | #18 | Nice visual touch. Not a priority. |

---

## Part 3: New Feature Reasoning Matrix

### Why each new feature (J1-J5) exists

| Feature | Uncovered Dimension | Core Question It Answers | Why All Prior Plans Missed It |
|---------|--------------------|--------------------------|-----------------------------|
| J1: Miss Fingerprinting | Failure attribution on active habits | "WHY did I miss today?" | Plans addressed abandoned habits (Autopsy) and predicted risky days (Weather), but never asked why a specific active miss happened. Misses were treated as a single category. |
| J2: Lifecycle Stages | Habit behavioral maturity | "Is this habit new, developing, or established?" | Plans treated habits as binary (active/archived). The Ratchet was manual. No feature recognized that a day-3 habit needs different treatment than a day-300 habit. |
| J3: Momentum Velocity | Rate of change | "Am I getting better or worse at this?" | Every metric (streaks, scores, rates) is about absolute position. None captured direction. A 40% rate trending up is better than 80% trending down. |
| J4: Resonance Map | Habit interdependencies | "Which habits rise and fall together?" | Stacking (N1) models designed relationships. Correlation (#31) was buried in analytics. Neither identified keystone habits or acted on co-occurrence patterns. |
| J5: Forgiveness Window | Real-time streak protection | "My streak is about to break — is there still time?" | Every streak feature is before-the-miss (planning) or after-the-miss (recovery). None exists during the day, in the window between "not yet done" and "too late." |

### New features vs. closest existing proposals

| New Feature | Closest Existing | How They Differ |
|-------------|-----------------|-----------------|
| J1: Miss Fingerprinting | Habit Autopsy (F1) | Autopsy is for *abandoned* habits. Fingerprinting is for *active* habits with occasional misses. Different frequency, different data, different intervention. |
| J2: Lifecycle Stages | The Ratchet (G4) | Ratchet is manual locking of established habits. Lifecycle is automatic phase recognition that affects messaging and UX across all phases, not just the established one. |
| J3: Momentum Velocity | Momentum Score (#16) | Score is absolute position (0-100). Velocity is the first derivative — direction of change. Same underlying data, fundamentally different insight. |
| J4: Resonance Map | Habit Correlation (#31) | Correlation was a passive analytics tab. Resonance Map extracts the actionable insight (keystone identification) and integrates with other features. |
| J5: Forgiveness Window | Grace Days (N2) / Phantom Streaks (G2) | Grace Days are pre-declared (planning). Phantom Streaks are post-hoc (recovery). Forgiveness Window is real-time (intervention). Three different time frames. |

---

## Part 4: Data Model Evolution

### Current types (unchanged since initial commit)

```typescript
type Frequency = 'daily' | 'weekly'

type Habit = {
  id: string
  name: string
  frequency: Frequency
  color: string
  createdAt: string
  archived: boolean
}

type HabitLog = {
  [habitId: string]: string[]  // array of date strings
}
```

### Target types (all additions optional, fully backward-compatible)

```typescript
type Frequency = 'daily' | 'weekly'

type RitualWindow = 'morning' | 'afternoon' | 'evening'
type DepthLevel = 'light' | 'full' | 'deep'
type MissReason = 'forgot' | 'busy' | 'skipped' | 'unwell'

type Habit = {
  id: string
  name: string
  frequency: Frequency
  color: string
  createdAt: string
  archived: boolean
  // Phase 1: (no changes)
  // Phase 2:
  isCore?: boolean               // Daily Calibration (#6)
  ritualWindow?: RitualWindow    // Ritual Windows (#8)
  // Phase 3: (no habit-level changes)
  // Phase 4:
  fallback?: string              // 2-Minute Fallback (#18)
  identity?: string              // Identity Framing (#21)
  // Phase 5:
  locked?: boolean               // The Ratchet (#24)
  lockedAt?: string              // The Ratchet (#24)
  autopsy?: {                    // Habit Autopsy (#20)
    reason: string
    note?: string
    date: string
  }
}

// Existing — unchanged
type HabitLog = {
  [habitId: string]: string[]
}

// New — parallel structures, additive
type DepthLog = {
  [habitId: string]: {
    [date: string]: DepthLevel
  }
}

type MissLog = {
  [habitId: string]: {
    [date: string]: MissReason
  }
}
```

All new structures are parallel to HabitLog — existing data.json files work
without migration. Habits without new fields use sensible defaults. DepthLog
and MissLog are new top-level keys in data.json alongside `habits` and `logs`.

### What stays client-side only (localStorage)

| Data | Used By |
|------|---------|
| `viewMode: 'pulse' \| 'table'` | Quick Pulse (#5) |
| `energyLevel: 'low' \| 'medium' \| 'high'` | Daily Calibration (#6) |
| `energyDate: string` | Daily Calibration (#6) — reset daily |
| `lastVisit: string` | Soft Landing (#17) |
| `lastEchoDate: string` | Habit Echoes (#25) |
| `eveningHour: number` | Forgiveness Window (#9) — default 20 |
| `resonanceCache: object` | Resonance Map (#26) — weekly refresh |

---

## Part 5: Implementation Recommendations

### Architecture prep (before Phase 2)

1. **CSS custom properties.** Extract App.css hardcoded colors into `:root`
   variables. Required for Theme Toggle, benefits all visual features. ~30 min.

2. **View state management.** Quick Pulse and the full table need
   `useState<'pulse' | 'table'>` in App.tsx with localStorage persistence.
   Don't over-engineer — it's two views, not a router.

3. **Optional Habit fields.** Add all optional fields to the Habit type and
   server validation at once, even if UI features ship separately. Prevents
   repeated type changes.

4. **`useLocalState` hook.** Thin wrapper around localStorage with try/catch
   for private browsing. Used by Daily Calibration, Echoes, Weather, Sparks,
   Forgiveness Window, and Resonance Map.

### The first three implementation commits

**Commit 1:** Edit Habit + API Error Handling (features #1 + #2)
**Commit 2:** View & Restore Archives + Theme Toggle (features #3 + #4)
**Commit 3:** Quick Pulse Check-In + Daily Calibration (features #5 + #6)

### What NOT to build

| Temptation | Why Not |
|-----------|---------|
| Authentication / multi-user | No user base. 500+ lines for zero users. |
| SQLite migration | JSON is fine at this scale. |
| Push notifications | Requires PWA + permissions. Forgiveness Window (#9) solves the same problem without the invasion. |
| AI-generated insights | Template narratives (G3) deliver 80% of value at 5% of cost. |
| Gamification (XP, badges) | Extrinsic rewards undermine intrinsic motivation. |
| Social features | Requires auth, moderation, real-time sync. Out of scope. |

---

## Part 6: Document Hygiene

### This document replaces

- `PLAN.md` — original 40-item plan with N1-N8
- `FEATURES_v3.md` — proposals F1-F3 and backlog audit
- `FEATURES_v4.md` — proposals G1-G5 and 20-item roadmap
- `FEATURES_v5.md` — proposals H1-H6 and 24-item roadmap

All prior feature identifiers (N1-N8, F1-F3, G1-G5, H1-H6) are preserved
in the "Origin" column of the roadmap for traceability. The canonical
reference is now the flat number (1-30).

### Cross-reference table

| New # | Prior ID | Feature Name |
|-------|----------|-------------|
| 1 | Plan #1 | Edit Habit |
| 2 | Plan #6 | API Error Handling |
| 3 | Plan #2 | View & Restore Archives |
| 4 | Plan #4 | Theme Toggle |
| 5 | H1 | Quick Pulse Check-In |
| 6 | N3 + #7 | Daily Calibration |
| 7 | N8 | Completion Sparks |
| 8 | H6 | Ritual Windows |
| 9 | **J5** | Streak Forgiveness Window |
| 10 | Plan #14 | Habit Time Machine |
| 11 | H2 | Completion Depth |
| 12 | **J1** | Miss Fingerprinting |
| 13 | G2 | Phantom Streaks |
| 14 | **J3** | Momentum Velocity |
| 15 | H4 | Habit Load Monitor |
| 16 | **J2** | Habit Lifecycle Stages |
| 17 | H3 | Soft Landing |
| 18 | G1 | 2-Minute Fallback |
| 19 | N2 + N7 | Planned Rest |
| 20 | F1 | Habit Autopsy |
| 21 | H5 | Identity Framing |
| 22 | Plan #15 | Living Garden View |
| 23 | G3 | Narrative Milestones |
| 24 | G4 | The Ratchet |
| 25 | G5 | Habit Echoes |
| 26 | **J4** | Habit Resonance Map |
| 27 | #28-31 | Insights Tab |
| 28 | F2 | Habit Weather Forecast |
| 29 | N4 | Weekly Compass |
| 30 | #34 | Data Export |

---

## The Bottom Line

This is the fifth planning document. It will be the last. The 30-item roadmap
is here. The 5 new features (J1-J5) target the 5 dimensions that 60+ prior
proposals across 4 documents never touched. The data model evolution is
mapped. The implementation sequence is clear.

The next commit changes code, not markdown.
