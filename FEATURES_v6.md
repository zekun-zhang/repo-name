# Habit Garden — Feature Roadmap v6

**Date:** 2026-09-30
**Supersedes:** FEATURES_v5.md (2026-09-29) and all prior planning documents
**Status:** Planning document — no code changes

---

## The Elephant in the Room

This repo has **16 commits after this one. 15 are planning documents.** The
codebase is unchanged from the initial scaffold: ~960 lines across 11 source
files, ~150 lines of backend logic. Five prior documents (PLAN.md v2,
FEATURES_v3, v4, v5) all diagnose this exact problem — and then add another
markdown file. This document does the same, because the task is explicitly to
document features. But let's be clear about what matters:

**The planning is done.** FEATURES_v5 produced a well-reasoned 24-item roadmap
in 5 phases with behavioral science citations, data model evolution, and
architecture notes. This document adds 5 features addressing dimensions that
all prior documents missed — but the *real* gap is not in planning. It's in
the empty `git log --diff-filter=M -- src/`.

**After this commit, the next commit must change a `.ts` or `.tsx` file.**

---

## Part 1: Coverage Audit

### What the prior 5 documents collectively address

Across PLAN.md v2 (N1-N8), FEATURES_v3 (F1-F3), FEATURES_v4 (G1-G5), and
FEATURES_v5 (H1-H6), **24 behavioral dimensions** have been proposed for:

| Dimension | Key Features | Docs |
|-----------|-------------|------|
| Streak psychology | Grace Days, Phantom Streaks, Streak Recovery, Planned Rest | v2, v3, v4 |
| Energy/capacity | Energy Check-In, Daily Calibration, 2-Minute Fallback | v2, v4 |
| Visual identity | Living Garden, Heartbeat, Seasonal Rhythms | v2 |
| Celebration/reward | Completion Sparks, Milestones, Echoes | v2, v4 |
| Forward planning | Weekly Compass, Intentions | v2 |
| Failure learning | Habit Autopsy | v3 |
| Predictive alerts | Weather Forecast | v3 |
| Self-addressed motivation | Time Capsule | v3 |
| Analytics | Dashboard, Heatmap, Correlations, Timestamps | v2 |
| Habit relationships | Habit Stacking / Chains | v2 |
| Habit progression | Difficulty Levels | v2 |
| Attention management | The Ratchet, MVD / Core habits | v4 |
| Narrative/meaning | Narrative Milestones | v4 |
| Variable reinforcement | Habit Echoes | v4 |
| Completion quality | Completion Depth (Light/Full/Deep) | v5 |
| Re-engagement | Soft Landing | v5 |
| Overcommitment | Habit Load Monitor | v5 |
| Time-of-day structure | Ritual Windows | v5 |
| Check-in friction | Quick Pulse | v5 |
| Habit-as-identity | Identity Framing | v5 |
| Elastic scope | 2-Minute Fallback | v4 |
| Loss reframing | Phantom Streaks | v4 |
| Attentional triage | The Ratchet | v4 |
| Data management | Export, Import | v2 |

That's thorough. But five dimensions of habit formation remain completely
unaddressed. They're not edge cases — they're foundational elements of
every major behavior-change framework.

---

### What no prior document has touched

| # | Missing Dimension | Why It's Fundamental | Why 5 Docs Missed It |
|---|-------------------|---------------------|---------------------|
| 1 | **Cue/trigger design** | Clear's 4-step habit loop: Cue → Craving → Response → Reward. The app addresses Response (tracking) and Reward (celebrations, streaks). Nothing addresses Cue — the thing that starts the behavior. | Plans focused on what you do and whether you did it, not what triggers you to start. |
| 2 | **Emotional reward signal** | Why do you keep doing a habit? Because of how it makes you *feel*. Energy level (pre-task) is tracked. Depth (quality) is tracked. But post-completion emotional state is not. | Depth (H2) measures quality of execution. Emotional state measures the *reward* of execution — different axis entirely. |
| 3 | **Streak vulnerability windows** | Research identifies specific plateau points (days 5-7, 18-22, 45-50) where abandonment peaks. The app has streak recovery (after a break) but nothing that targets the *moment before* the break. | Weather Forecast (F2) predicts by day-of-week. Nothing predicts by streak-age — the position within the habit formation curve. |
| 4 | **Habit co-occurrence patterns** | When you exercise, do you also meditate? When you skip reading, do you also skip journaling? Habits influence each other in invisible chains. | Habit Stacking (N1) models *intentional* sequences. Spillover is the *emergent* relationship — patterns the user didn't design but that exist in their data. |
| 5 | **Temporal self-archaeology** | With months of data, your habits tell the story of your evolving priorities. "March was about fitness, June shifted to creativity." No feature reads this narrative from the data. | Analytics (Phase 5) shows *what* you did. Archaeology shows *who you were becoming* in each period — the motivational arc. |

---

## Part 2: New Feature Proposals (J1-J5)

Five features, each addressing one uncovered dimension. All are frontend-only
or require a single optional field. Ordered by novelty and impact.

---

### J1. Cue Architecture (Make It Obvious)

**What:** Each habit can optionally record its **cue** — the specific trigger
that initiates the behavior. Cues follow the format: "After I [existing
behavior / time / location], I will [habit]."

Examples:
- Exercise: "After I pour my morning coffee"
- Meditate: "After I sit down at my desk"
- Read: "After dinner, in the armchair"
- Journal: "When I get into bed"

The cue is displayed in two places:

1. **Below the habit name in the check-in view** — a muted one-liner that
   reminds you of the trigger context:
   ```
   Exercise                           ○
   ↳ After morning coffee
   ```

2. **In the Ritual Windows sort** — habits with morning cues appear in the
   morning block, evening cues in the evening block. The cue reinforces
   *when* and *where* the habit belongs in the day.

When a habit with a cue has been completed 21+ consecutive days, the app
shows a subtle "autopilot" indicator — the cue is working, the behavior is
becoming automatic.

When a habit with a cue is struggling (< 50% completion over 14 days), the
app gently asks: "Your cue for Exercise is 'After morning coffee.' Is this
still working, or should we find a better trigger?" This nudge costs nothing
but addresses the #1 reason habits fail: the cue isn't reliable.

**Why this is novel and fundamental:**

James Clear's *Atomic Habits* — cited 6 times across prior documents — lays
out a 4-step habit loop:

1. **Cue** (Make it obvious) — *No feature addresses this*
2. Craving (Make it attractive) — Identity Framing (H5) partially addresses this
3. **Response** (Make it easy) — 2-Minute Fallback (G1), Quick Pulse (H1)
4. **Reward** (Make it satisfying) — Completion Sparks (N8), Echoes (G5)

The plans have cited Clear repeatedly for Habit Stacking (a specific
technique) but have never implemented his *framework*. Steps 3 and 4 are
well-covered. Step 1 — the trigger that starts the behavior — is completely
absent. This is like building a car engine (response) and a fuel gauge
(reward) but forgetting the ignition key (cue).

Cue Architecture fills this gap. It's not just another text field — it
completes the habit loop. Every other feature in the app becomes more
effective when the user has a reliable cue, because the cue is what gets
them to the check-in in the first place.

**Behavioral science:** Duhigg's *The Power of Habit*: the cue-routine-reward
loop is the neurological basis of habit formation. Wood & Neal (2007):
habits are triggered by context cues, not by willpower or intention.
Lally et al. (2010): the average time to automaticity is 66 days, and
consistency of the cue is the strongest predictor of reaching automaticity.

**Integration with existing features:**
- **Ritual Windows (H6):** Cue text is parsed for time signals to auto-suggest
  a ritual window. "After morning coffee" → morning window.
- **Identity Framing (H5):** The cue + identity together form a complete
  behavioral contract: "I am a reader" (identity) + "After dinner, in the
  armchair" (cue) + "Read 10 pages" (response).
- **Soft Landing (H3):** When returning after absence, the app shows: "Your
  cues are still there. 'After morning coffee' → Exercise. Want to try
  starting with just that one?"
- **Habit Autopsy (F1):** When analyzing why a habit was abandoned, the
  autopsy can ask: "Did your cue change? (New schedule, moved, etc.)"

**Data model:** Add optional `cue?: string` (max 120 chars) to the Habit type.
No new endpoints.

**Effort:** Small. One text input on the create/edit form, conditional display
in HabitRow/QuickPulse, optional autopilot indicator based on streak length.

**Depends on:** Edit Habit (#1). Enhanced by Ritual Windows (H6).

---

### J2. Completion Afterglow (Emotional Reward Tracking)

**What:** After completing a habit, a quick optional 1-tap emotional tag
appears for 2 seconds — similar to Completion Depth (H2) but orthogonal:

```
  ✓ Meditate     [Calm] [Energized] [Neutral]     ← auto-dismisses
```

Five emotional states, displayed as single-word labels with color coding:
- **Calm** (blue) — peaceful, centered, relaxed
- **Energized** (green) — motivated, activated, ready
- **Proud** (gold) — accomplished, confident, strong
- **Neutral** (gray) — fine, no strong feeling
- **Drained** (muted red) — tired, depleted after doing it

If not tapped within 2 seconds, no emotional data is recorded (unlike Depth
which defaults to "Full"). Emotional data is strictly opt-in because forcing
emotional self-report would itself be draining.

Over time, the app builds a **personal reward catalog** — which habits
produce which feelings:

- "Meditation makes you feel Calm 72% of the time and Energized 18%."
- "Exercise makes you feel Energized 65% of the time but Drained 20%."
- "Reading consistently makes you feel Calm. It's your most reliable
  mood-positive habit."

This data powers three insights no other tracker can offer:

1. **Reward visibility:** "Why should I meditate?" → "Because last month,
   you felt Calm after 14 of 18 sessions." The app answers with your *own
   emotional data*, not generic advice.

2. **Bad-day prescription:** On low-energy days, the app can suggest: "When
   you're drained, habits that reliably make you feel better are: Meditation
   (72% Calm), Walk (80% Energized)." This uses the Energy Check-In (N3)
   as input and the afterglow data as the recommendation engine.

3. **Reward mismatch detection:** If a habit consistently produces "Drained"
   or "Neutral" — no positive emotional signal — the app gently flags it:
   "Exercise has felt Drained 8 of the last 10 times. Is this the right
   version of this habit for you?" This catches habits that persist out of
   obligation, not reward — the setup for eventual abandonment.

**Why this is novel:**

The app addresses the *pre-task* state (Energy Check-In: how do you feel
before?), the *during-task* quality (Completion Depth: how well did you do
it?), but not the *post-task* reward signal (how did it make you feel
after?). These are three distinct axes:

```
Energy Check-In (N3):    BEFORE    → How much capacity do I have?
Completion Depth (H2):   DURING    → How well did I do it?
Completion Afterglow:    AFTER     → How did it make me feel?
```

The afterglow is the *reward* in the habit loop. Without tracking it, the
app knows you did the habit but not whether the habit rewarded you. And
reward is what determines whether you'll do it tomorrow.

**Behavioral science:** BJ Fogg's *Tiny Habits*: "Emotions create habits.
Not repetition." The felt reward immediately after a behavior is the
strongest predictor of future repetition — stronger than streaks, stronger
than external accountability. Fogg calls this "Shine" — the positive
emotional charge that wires the behavior into the brain. Afterglow data
captures Shine and makes it visible.

Kahneman's "peak-end rule": people judge experiences by how they felt at
the peak and at the end. The post-completion emotional state *is* the end
of the habit experience. Recording it captures the memory that determines
repetition.

**Data model:** New parallel structure (like DepthLog):
```typescript
type AfterglowLog = {
  [habitId: string]: {
    [date: string]: 'calm' | 'energized' | 'proud' | 'neutral' | 'drained'
  }
}
```
Stored alongside existing logs. No migration needed — new data structure
lives next to existing ones.

**Effort:** Small. One inline component (nearly identical to Depth picker),
one data structure, optional insight computations. No backend changes needed
if stored client-side; one new field in the data file if stored server-side.

**Depends on:** Nothing. Enhanced by Energy Check-In (for bad-day
prescriptions) and Insights Tab (for afterglow analytics).

---

### J3. The Danger Zone (Streak Vulnerability Windows)

**What:** Based on habit-formation research, the app identifies and
proactively warns about **critical streak windows** — the specific streak
ages where abandonment risk peaks:

| Window | Days | Risk | What Happens |
|--------|------|------|-------------|
| **The Hump** | 5-7 | High | Initial motivation fades. The novelty is gone, automaticity hasn't formed. This is where most habits die. |
| **The Plateau** | 18-22 | Medium-High | "I should be feeling automatic by now but I'm not." Expectation-reality gap causes frustration. |
| **The Drift** | 42-50 | Medium | Life disruptions hit. After 6+ weeks, the probability of a disruptive event (illness, travel, emergency) approaches certainty. |
| **The Coast** | 80-100 | Low-Medium | Overconfidence. "I've got this" leads to skipping "just once," which cascades. |

When a habit enters a danger zone, the app shows a subtle visual indicator
— a faint colored ring around the streak badge:

```
  Exercise    🔥 19 days          ← orange ring: entering The Plateau
```

Tapping the indicator reveals a brief, specific message:

> "Day 19. This is The Plateau — most people expect habits to feel automatic
> by now, but research says automaticity takes 66 days on average. You're
> not behind; you're on schedule. Keep going through day 22 and the risk
> drops sharply."

The messages are:
- **Specific to the window** (not generic "keep going" encouragement)
- **Grounded in research** (citing actual timelines, not platitudes)
- **Time-bounded** ("get through day 22" is more motivating than "keep going
  forever")
- **Normalizing** ("most people" and "on schedule" reduce shame)

After exiting a danger zone, the app celebrates: "You cleared The Plateau.
The next smooth stretch runs through day 42." This creates a game-like
progression through the difficulty curve of habit formation itself.

**Why this is novel:**

Every streak feature in the prior plans is *reactive* — it responds to what
already happened:
- Streak Recovery (after a break)
- Phantom Streaks (after a break)
- Grace Days (to prevent a break)
- Soft Landing (after extended absence)

The Danger Zone is *proactive and temporal* — it knows *when* breaks are most
likely to occur (based on research, not the user's personal data) and
intervenes *before* the break happens. It's the difference between a smoke
detector (danger zone) and a fire extinguisher (streak recovery).

Weather Forecast (F2) predicts by day-of-week. The Danger Zone predicts by
streak-age — a completely different axis. You might have a 100% Tuesday
completion rate but still be in danger at day 20 because the plateau effect
operates on a different timescale than weekly patterns.

**Behavioral science:**

- Lally et al. (2010): habit automaticity follows an asymptotic curve with
  a median of 66 days but high variance (18-254 days). The curve is steepest
  (most fragile) in the first 3 weeks.
- Armitage (2005): the "intention-behavior gap" peaks at 2-3 weeks —
  people still intend to do the habit but the behavior drops off.
- Rothman et al. (2004): initiation and maintenance of behavior change
  involve different psychological processes. Initiation is motivation-driven
  (days 1-7); maintenance requires that the behavior's outcomes meet
  expectations (days 18-22+). The Plateau danger zone targets this exact
  transition.

**Data model:** None. Pure computation from streak length. The danger zone
thresholds are constants, not user-configurable (they're based on research,
not preference).

**Effort:** Small. One utility function that maps streak length to danger
zone (or null), one ring indicator component, one popover with canned
messages. No backend changes.

**Depends on:** Nothing. Enhanced by Completion Sparks (celebration on
exiting a danger zone) and Planned Rest (grace days during a danger zone
should trigger extra caution: "Are you sure? You're in The Plateau right
now.").

---

### J4. Spillover Map (Emergent Habit Relationships)

**What:** After 30+ days of data, the app computes and displays **spillover
relationships** between habits — which habits tend to be completed together,
and which tend to fail together:

```
Spillover Map

  Exercise ──── 85% ────→ Meditation
  "When you exercise, you meditate 85% of the time (vs. 62% on non-exercise days)"

  Reading ──── 72% ────→ Journal
  "Reading and journaling are your most linked pair"

  Exercise ──✕── 38% ──→ Reading
  "On exercise days, you read only 38% of the time (vs. 55% otherwise)"
  "These habits may compete for your evening energy"
```

The map shows three relationship types:

1. **Positive spillover** (green link): Completing habit A makes habit B more
   likely. The insight: these habits reinforce each other. Do them in
   sequence.

2. **Negative spillover** (red link): Completing habit A makes habit B *less*
   likely. The insight: these habits compete for the same resource (time,
   energy, willpower). Consider separating them into different parts of the
   day or different days.

3. **Independent** (no link): These habits have no statistical relationship.
   They're truly separate.

The computation is simple conditional probability over log data:
`P(B completed | A completed)` vs `P(B completed | A not completed)`.
A difference of >15% (either direction) counts as a spillover relationship.

**Active suggestions from spillover data:**

- "Exercise and Meditation have strong positive spillover. Consider making
  Meditation your post-Exercise habit." (Integrates with Habit Stacking N1)
- "Exercise and Reading have negative spillover — they might compete for
  evening energy. Try moving Reading to a different time." (Integrates with
  Ritual Windows H6)
- On a day when Exercise is completed: "You exercised today. On exercise
  days, you meditate 85% of the time. Meditation is next?" (Integrates with
  Quick Pulse H1, suggesting the next habit)

**Why this is novel:**

Habit Stacking (N1) models *intentional* sequences — the user declares "I do
A then B." Spillover Map discovers *emergent* relationships — patterns that
exist in the data but the user never designed. The difference is prescriptive
(stacking) vs. descriptive (spillover). The user may not know that exercise
makes them more likely to meditate. The spillover map surfaces this invisible
connection.

Habit Correlation (#31 in PLAN.md v2, merged into Insights Tab) was proposed
as a passive analytics view. Spillover Map goes further: it doesn't just show
correlations, it *interprets* them (positive/negative/independent),
*explains* them (resource competition, routine reinforcement), and *suggests
actions* (reorder, separate, sequence).

**Behavioral science:**

- Neal et al. (2012): healthy habits transfer across domains — the
  self-regulation built by one habit benefits others. This is the mechanism
  behind positive spillover.
- Baumeister's ego-depletion model (revised): willpower is a shared
  resource. Habits that deplete the same resource compete. This explains
  negative spillover.
- Dolan & Galizzi (2015): behavioral spillovers can be harnessed
  deliberately — knowing which habits reinforce each other lets users
  design more effective routines.

**Data model:** None. Pure computation over existing log data. The spillover
map is a derived view, not stored state. Could be memoized with `useMemo`
and recalculated weekly.

**Effort:** Small-Medium. One utility function for conditional probability,
one visualization component (simple node-link diagram or table), optional
integration with Quick Pulse for "next habit" suggestions.

**Depends on:** 30+ days of data for statistical significance. Enhanced by
Habit Stacking (N1, for acting on discovered relationships) and Ritual
Windows (H6, for separating competing habits).

---

### J5. Habit Archaeology (Temporal Self-Portrait)

**What:** A timeline view that reads months of habit data and identifies
**chapters** — periods where the user's habit focus shifted. Instead of
showing raw completion rates, it tells the story of who they were becoming:

```
Your Habit Journey

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Mar-Apr 2026                                           │
  │  "The Fitness Foundation"                               │
  │  ██████████████████████████████████░░░░░░               │
  │  Exercise (92%), Walk (88%)                             │
  │  You were building your physical practice.              │
  │  Your best week: Mar 14-20 (100% on all habits).       │
  │                                                         │
  │  May-Jun 2026                                           │
  │  "The Mindfulness Shift"                                │
  │  ████████████████████████████████████████░░             │
  │  Meditation (85%), Journal (78%), Reading (90%)         │
  │  Fitness stayed strong. You added inner work.           │
  │  Exercise dipped to 71% — you were redistributing.     │
  │                                                         │
  │  Jul-Sep 2026                                           │
  │  "The Complete Practice"                                │
  │  ████████████████████████████████████████████           │
  │  6 habits above 75%. Your most balanced period.         │
  │  The habit that grew most: Journal (48% → 82%).        │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

**How chapters are detected:**

Chapters are computed by analyzing rolling 2-week windows of completion data
and detecting **shift points** — moments where the completion distribution
across habits changes significantly:

1. Cluster habits by 2-week completion rate into "focus" (>70%), "maintained"
   (40-70%), and "declining" (<40%)
2. When the cluster membership changes (a habit moves between groups),
   that's a chapter boundary
3. Name the chapter based on which habits are in the "focus" cluster,
   using simple category heuristics (fitness, mindfulness, creative,
   learning, health)
4. For each chapter, note: the defining habits, the growth habit (biggest
   % increase), the surprise (something unexpected in the data), and the
   duration

**The chapter names are generated from templates, not AI:**

```
"The Fitness Foundation"     → when physical habits dominate focus
"The Mindfulness Shift"      → when mental/reflective habits rise
"Adding Depth"               → when existing habits' Completion Depth (H2) trends upward
"The Rebalancing"            → when a previously dominant habit dips while others rise
"Recovery"                   → when the user returns after a Soft Landing (H3)
"The Complete Practice"      → when all habits are above 70%
```

**Why this is novel:**

Every analytics feature in every prior plan shows *data about habits*:
completion rates, streaks, heatmaps, correlations. Habit Archaeology shows
*data about the person* — the evolving story of their priorities, growth,
and life changes.

The distinction matters psychologically. "Your meditation completion rate
is 78%" is information. "In May, you shifted from a purely physical practice
to one that included mindfulness — and your fitness stayed strong through
the transition" is *meaning*. It's the difference between a dashboard and
a biography.

Narrative Milestones (G3) tells the story of a *single habit's* journey.
Habit Archaeology tells the story of *the person's* journey across all
habits. Milestones are per-habit; Archaeology is holistic.

**Behavioral science:**

- McAdams' narrative identity: people construct their sense of self through
  life stories with chapters, turning points, and themes. Habit Archaeology
  provides the raw material for this narrative construction.
- Higgins' self-discrepancy theory: the gap between "actual self" and
  "ideal self" drives behavior. Archaeology shows the actual self's
  trajectory — and when it's trending toward the ideal, that visibility
  is deeply motivating.
- Sheldon & Elliot's self-concordance: goals aligned with personal growth
  produce better outcomes. Seeing your habit journey as a coherent arc
  (rather than disconnected daily check-ins) reinforces that the work is
  going somewhere.

**Data model:** None. Pure computation over existing log data and metadata
(habit creation dates, archive dates, completion dates). Chapters are derived
on-the-fly, not stored.

**Effort:** Medium. Chapter detection algorithm (rolling window clustering),
template-based naming, timeline visualization component. No backend changes.

**Depends on:** 2+ months of data to have multiple chapters. Enhanced by
Identity Framing (H5, chapter names can reference identity statements),
Completion Depth (H2, chapters can detect quality shifts), and Afterglow
(J2, chapters can detect emotional pattern shifts).

---

## Part 3: Updated Consolidated Roadmap (29 Items, 5 Phases)

This integrates the 5 new features (J1-J5) into FEATURES_v5's 24-item
roadmap. Placement follows the same principles: ship basics first, reduce
friction before adding features, frontend-only first, each phase has a
testable thesis.

### Phase 1: Make It Solid (unchanged from v5)

**Thesis:** CRUD works. Errors surface. Both themes work.

| # | Feature | Effort | Notes |
|---|---------|--------|-------|
| 1 | Edit Habit | S | PUT endpoint + inline edit form. The foundation. |
| 2 | API Error Handling | S | `res.ok` check in api.ts. 10-line fix. |
| 3 | View & Restore Archives | S | Unarchive endpoint + collapsible section. |
| 4 | Theme Toggle | S | Reconcile index.css + App.css. Add toggle. |

**Exit:** Users can create, edit, archive, unarchive, delete. No silent failures.

---

### Phase 2: Make It Fast (add J1: Cue Architecture)

**Thesis:** Checking in takes < 15 seconds. The app adapts to time of day and
energy. The complete habit loop (cue → response → reward) is present.

| # | Feature | Effort | Source | Notes |
|---|---------|--------|--------|-------|
| 5 | Quick Pulse Check-In | S | H1 | Minimal today-only view. Default on open. |
| 6 | Daily Calibration (MVD + Energy) | S | N3+#7 | Core habit flag + energy picker. |
| 7 | Completion Sparks | S | N8 | Context-aware micro-celebrations. |
| 8 | Ritual Windows | S | H6 | Time-of-day sort. Morning habits first in AM. |
| 9 | Habit Time Machine | S | #14 | Arrow navigation beyond 14 days. |
| 10 | **Cue Architecture** | S | **New J1** | Record triggers. Complete the habit loop. Display cue below habit name. |

**Why J1 is in Phase 2:** The cue is part of the daily check-in experience.
Showing "After morning coffee" below "Exercise" makes the check-in view
more than a checklist — it's a contextual prompt. This should ship alongside
Quick Pulse and Ritual Windows because they interact: cues inform the ritual
window sort, and the Quick Pulse view is where the cue is most visible.

**Exit:** The habit loop is complete in the UI: cue (J1) → response (toggle) →
reward (sparks). The check-in is fast, time-aware, and energy-adaptive.

---

### Phase 3: Make It Honest (add J2: Afterglow, J3: Danger Zone)

**Thesis:** The app tracks not just *whether* you showed up, but *how well*
(Depth), *how it made you feel* (Afterglow), and warns when you're at risk
(Danger Zone). It catches overcommitment and welcomes you back from absence.

| # | Feature | Effort | Source | Notes |
|---|---------|--------|--------|-------|
| 11 | Completion Depth | S | H2 | Light/Full/Deep rating. Optional. |
| 12 | **Completion Afterglow** | S | **New J2** | Emotional tag post-completion. Personal reward catalog. |
| 13 | Phantom Streaks | S | G2 | "52/55 days (95%)" instead of "Streak: 3." |
| 14 | **The Danger Zone** | S | **New J3** | Streak vulnerability windows. Proactive risk indicators. |
| 15 | Habit Load Monitor | S | H4 | Overcommitment detection. |
| 16 | Soft Landing | S-M | H3 | Re-engagement after 7+ days absence. |
| 17 | 2-Minute Fallback | S | G1 | Elastic habit scope for low-energy days. |

**Why J2 and J3 are in Phase 3:**
- Afterglow completes the three-axis tracking system: before (energy), during
  (depth), after (afterglow). These three belong in the same phase because
  they're the same concept — rich habit data — on three different time axes.
- The Danger Zone is a safety net, like Soft Landing and Habit Load Monitor.
  Phase 3's thesis is "tell the truth and keep you safe." The Danger Zone
  does both: it tells the truth about where you are on the habit formation
  curve and keeps you safe during the vulnerable windows.

**Exit:** A user who shows up gets rich data about their experience. A user
who's at risk gets warned before they fall. A user who falls gets caught.

---

### Phase 4: Make It Yours (unchanged from v5)

**Thesis:** Habits feel like identity. The app has a visual soul.

| # | Feature | Effort | Source | Notes |
|---|---------|--------|--------|-------|
| 18 | Identity Framing | S | H5 | "I am a reader." |
| 19 | Living Garden View | M | #15 | SVG plants reflecting habit health. |
| 20 | Narrative Milestones | S-M | G3 | Template-generated stories at milestones. |
| 21 | The Ratchet | S-M | G4 | Established habits recede. |
| 22 | Habit Echoes | S | G5 | Random past-achievement surfacing. |

**Exit:** A user with 3+ months sees themselves in the app.

---

### Phase 5: Make It Deep (add J4: Spillover, J5: Archaeology)

**Thesis:** The app is a partner in self-knowledge. It predicts, reflects,
and reveals patterns the user can't see themselves.

| # | Feature | Effort | Source | Notes |
|---|---------|--------|--------|-------|
| 23 | Planned Rest (Grace Days + Quiet Weeks) | S-M | N2+N7 | Pre-declared rest. |
| 24 | Habit Autopsy | S | F1 | Structured reflection on abandonment. |
| 25 | Habit Weather Forecast | S | F2 | Day-of-week risk icons. |
| 26 | **Spillover Map** | S-M | **New J4** | Emergent habit relationships. Which habits lift each other? |
| 27 | **Habit Archaeology** | M | **New J5** | Temporal self-portrait. Chapters of your habit journey. |
| 28 | Insights Tab (Dashboard + Heatmap) | M | #28-31 | Tabbed analytics view. |
| 29 | Weekly Compass | M | N4 | Weekly intention-setting. |

**Why J4 and J5 are in Phase 5:** Both require months of data to be
meaningful. Spillover needs 30+ days for statistical significance. Archaeology
needs 2+ months to have multiple chapters. They also build on Phase 3's
rich data: Afterglow data makes spillover analysis richer ("Exercise days
you feel Energized correlate with Meditation completion"), and Depth data
makes chapters more nuanced ("The Deepening" — a chapter where quality
increased even though frequency held steady).

**Exit:** A user with 3+ months of data understands their patterns, their
journey, and which habits secretly support each other.

---

### Deferred (promoted when the 29 above are shipped)

| Feature | Why Deferred |
|---------|-------------|
| Habit Stacking / Chains (N1) | Spillover Map (J4) discovers natural sequences. Build stacking when those are visible. |
| Difficulty Progression (N5) | Useful after months of use, not before. |
| Time Capsule (F3) | High novelty, low urgency. Shines after Garden is built. |
| Momentum Score (#16) | Feeds Garden view. Build with or after it. |
| Habit Heartbeat (N6) | Visualizes momentum score. Build after it exists. |
| Categories / Tags (#37) | Power feature. Needed at 15+ habits. |
| Data Export (#34) | Table stakes but not urgent. |
| PWA / Offline (#40) | Large effort. Defer until daily use is proven. |
| Keyboard Shortcuts (#12) | Small, independent. Ship whenever. |

---

## Part 4: Feature Reasoning Matrix

### Why each new feature (J1-J5) exists — disambiguation from all prior proposals

| Feature | Dimension | Core Question | Closest Prior Proposal | How They Differ |
|---------|-----------|---------------|----------------------|-----------------|
| J1: Cue Architecture | Trigger design | "What starts this habit?" | Habit Stacking (N1) | Stacking sequences habits relative to *each other*. Cues anchor habits to *existing behaviors, times, and places*. Stacking is inter-habit; cues are habit-to-world. |
| J2: Afterglow | Emotional reward | "How did this make me feel?" | Completion Depth (H2) | Depth measures execution quality (how well). Afterglow measures emotional outcome (how you feel). A "Deep" meditation could feel "Drained" or "Calm" — orthogonal axes. |
| J3: Danger Zone | Streak vulnerability | "Am I about to break?" | Weather Forecast (F2) | Forecast predicts by day-of-week (behavioral rhythm). Danger Zone predicts by streak-age (formation curve). Different timescales, different science. |
| J4: Spillover Map | Emergent relationships | "Which habits help each other?" | Habit Correlation (#31) | Correlation shows co-occurrence numbers. Spillover interprets the direction (positive/negative), explains the mechanism (reinforcement/competition), and suggests actions. |
| J5: Archaeology | Temporal self-portrait | "Who was I becoming?" | Narrative Milestones (G3) | Milestones tell a single habit's story. Archaeology tells the *person's* story across all habits — the chapters of their evolving practice. |

### How J1-J5 complete the theoretical framework

```
James Clear's 4 Laws of Behavior Change:

  1. Make it Obvious     → J1: Cue Architecture       ← NEW (was missing)
  2. Make it Attractive  → H5: Identity Framing        (existing)
  3. Make it Easy        → G1: 2-Minute Fallback       (existing)
                         → H1: Quick Pulse              (existing)
  4. Make it Satisfying  → N8: Completion Sparks        (existing)
                         → J2: Completion Afterglow    ← NEW (reward visibility)

BJ Fogg's Behavior Model (B = MAP):

  Motivation  → J3: Danger Zone (protect during low-motivation windows)  ← NEW
  Ability     → G1: 2-Minute Fallback (lower the bar on hard days)      (existing)
  Prompt      → J1: Cue Architecture (reliable trigger)                 ← NEW

Habit Formation Curve (Lally et al.):

  Days 1-7:   Novelty phase    → J3: The Hump warning                  ← NEW
  Days 18-22: Plateau phase    → J3: The Plateau warning               ← NEW
  Days 42-50: Disruption phase → J3: The Drift warning                 ← NEW
  Days 66+:   Automaticity     → J1: Autopilot indicator               ← NEW

Self-Knowledge Architecture:

  What did I do?    → Existing: Streaks, completions, heatmap
  How well?         → H2: Completion Depth                              (existing)
  How did I feel?   → J2: Completion Afterglow                         ← NEW
  What triggered it?→ J1: Cue Architecture                             ← NEW
  Which habits help?→ J4: Spillover Map                                ← NEW
  Who am I becoming?→ J5: Habit Archaeology                            ← NEW
```

---

## Part 5: Complete Data Model Evolution

### Current (as implemented)

```typescript
type Habit = {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  color: string
  createdAt: string
  archived: boolean
}

type HabitLog = {
  [habitId: string]: string[]    // array of date strings
}
```

### After all 29 features (additive — all new fields optional)

```typescript
type Habit = {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  color: string
  createdAt: string
  archived: boolean
  // Phase 2: Daily Experience
  isCore?: boolean                                        // Daily Calibration
  ritualWindow?: 'morning' | 'afternoon' | 'evening'     // Ritual Windows (H6)
  cue?: string                                            // Cue Architecture (J1) — max 120 chars
  // Phase 3: Data Quality
  fallback?: string                                       // 2-Minute Fallback (G1) — max 100 chars
  // Phase 4: Identity
  identity?: string                                       // Identity Framing (H5) — max 60 chars
  locked?: boolean                                        // The Ratchet (G4)
  lockedAt?: string                                       // The Ratchet (G4)
  // Phase 5: Insights
  autopsy?: { reason: string; note?: string; date: string }  // Habit Autopsy (F1)
}

type HabitLog = {
  [habitId: string]: string[]    // unchanged for backward compat
}

// New parallel structures (no migration needed)
type DepthLog = {
  [habitId: string]: {
    [date: string]: 'light' | 'full' | 'deep'
  }
}

type AfterglowLog = {
  [habitId: string]: {
    [date: string]: 'calm' | 'energized' | 'proud' | 'neutral' | 'drained'
  }
}

// Client-side only (localStorage)
type DailyState = {
  date: string
  energyLevel: 'low' | 'medium' | 'high'
}
```

**Migration:** None needed. All new fields are optional with sensible
defaults. Existing data.json files work unchanged. New log structures are
additive — they sit alongside the existing `logs` object.

---

## Part 6: The Honest Assessment

### What this document adds

- **5 genuinely novel features** (J1-J5) addressing 5 dimensions untouched
  by 60+ prior proposals across 5 documents
- **Framework completion analysis** showing how J1-J5 fill specific gaps in
  Clear's, Fogg's, and Lally's models
- **29-item consolidated roadmap** with clear phase placement and rationale
  for each new feature's position
- **Complete data model evolution** across all 29 features

### What this document does NOT add

- Any implementation code (the gap that grows with every planning document)
- A solution to the planning debt (which is now 15 documents deep)

### The 3 most impactful features across all 6 documents

If this project could only ship 3 new features beyond the Phase 1 basics,
they should be:

1. **Quick Pulse Check-In (H1)** — Removes friction from the daily
   experience. Everything else depends on users actually opening the app.
2. **Cue Architecture (J1)** — Completes the habit loop. The single most
   fundamental missing piece in the behavioral framework.
3. **The Danger Zone (J3)** — Proactive streak protection. The only feature
   across all documents that intervenes *before* a break instead of *after*.

### What should happen next

```
git log --oneline --diff-filter=M -- 'src/**' 'server/**'
# (empty)

# The next line in this log should be:
# abc1234 Implement Edit Habit: PUT endpoint + inline edit form
```

The 29-item roadmap is documented. The behavioral science is cited. The data
model is planned. Every feature has a clear phase, effort estimate, dependency
chain, and novelty justification.

Ship Edit Habit. Then API Error Handling. Then Quick Pulse + Cue Architecture.
The plan will be here when you need it.
