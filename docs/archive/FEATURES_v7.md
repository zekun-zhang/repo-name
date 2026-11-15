# Habit Garden — Feature Plan v7: Novel Dimensions & Implementation Reset

**Date:** 2026-10-02
**Supersedes:** FEATURES_v6.md and all prior planning documents
**Status:** Final feature exploration + implementation-ready backlog

---

## The Honest Assessment

**Commits:** 16. **Planning documents:** 15. **Features shipped:** 0.

Six planning documents (PLAN.md, FEATURES_v3 through v6) have proposed 60+
features across 23 behavioral dimensions with rigorous behavioral science
citations. The analysis is excellent. The problem is that analysis has become
the product.

Every prior document ends with some variation of "stop planning, start coding."
This document will not pretend to be different. It is another planning document.
But it exists because the task explicitly requests feature exploration and
documentation. So: here are 5 genuinely novel features targeting dimensions
that all prior documents missed, followed by a hard reset on the backlog.

---

## Part 1: What Prior Plans Actually Covered (The Full Map)

Before proposing anything new, here is the complete map of every dimension
addressed across all documents. Any new proposal must fall outside this map.

| # | Dimension | Coverage | Documents |
|---|-----------|----------|-----------|
| 1 | Streak preservation | Grace Days, Phantom Streaks, Planned Rest | v3-v6 |
| 2 | Energy/capacity input | Energy Check-In, Daily Calibration | v3, v5 |
| 3 | Visual identity | Living Garden, Heartbeat, Seasonal Rhythms | v2, v4 |
| 4 | Celebration/reward | Completion Sparks, Milestones, Echoes | v3-v5 |
| 5 | Forward planning | Weekly Compass, Intentions | v2 |
| 6 | Failure (abandoned habits) | Autopsy, Weather Forecast | v3 |
| 7 | Failure (active habits) | Miss Fingerprinting | v6 |
| 8 | Analytics/data viz | Dashboard, Heatmap, Correlations | v2 |
| 9 | Habit relationships | Habit Stacking / Chains | v2 |
| 10 | Habit progression | Difficulty Levels | v2 |
| 11 | Attention management | The Ratchet, MVD / Core habits | v4, v5 |
| 12 | Narrative/meaning | Narrative Milestones, Time Capsule | v3, v4 |
| 13 | Data management | Export, Import | v2 |
| 14 | Completion quality | Completion Depth (Light/Full/Deep) | v5 |
| 15 | Re-engagement | Soft Landing | v5 |
| 16 | Overcommitment | Habit Load Monitor | v5 |
| 17 | Time-of-day structure | Ritual Windows | v5 |
| 18 | Identity framing | "I am a reader" declarations | v5 |
| 19 | Check-in friction | Quick Pulse | v5 |
| 20 | Behavioral maturity | Lifecycle Stages (Seedling→Rooted) | v6 |
| 21 | Rate of change | Momentum Velocity (↑↓→ arrows) | v6 |
| 22 | Habit interdependencies | Resonance Map, Keystone detection | v6 |
| 23 | Real-time streak protection | Forgiveness Window (evening countdown) | v6 |

That is thorough. The following 5 features target dimensions genuinely
outside this map.

---

## Part 2: New Feature Proposals

### K1. Life Chapters (Personal Context Framing)

**What:** Users can declare named "chapters" of their life — short periods
with a label and optional date range:

```
Chapter: "Training for Half Marathon"   Aug 12 – Oct 15
Chapter: "New Job First 90 Days"        Started Sep 1
Chapter: "Recovery Week"                Oct 5 – Oct 12
```

Chapters are ambient context, not functional constraints. They appear as a
subtle banner at the top of the app. When a chapter is active, the app
records which habits were active during it. When a chapter ends (manually
or by date), the app generates a chapter summary:

> *Chapter: "Training for Half Marathon" (65 days)*
> *Active habits: 8. Habits added during chapter: 2 (Stretching, Sleep by 10).*
> *Best habit: Exercise (97%). Most improved: Stretching (45% → 82%).*
> *Habits that suffered: Reading (dropped from 78% to 41%).*
> *You completed 74% of all habits during this chapter vs. 69% before it.*

Chapters nest the daily grind in a larger narrative. They answer: "What was
I focused on during that period, and how did it affect everything else?"

**Why this is genuinely novel:** Every feature in every prior plan operates
at one of two time scales: the day (check-ins, calibration, forgiveness
window) or the long term (streaks, lifecycle stages, narrative milestones).
No feature operates at the *medium* time scale — the weeks-to-months period
that defines a life phase.

Lifecycle Stages (J2) are automatic and habit-specific (Seedling→Rooted for
one habit). Chapters are user-declared and cross-cutting (a context that
affects all habits). Narrative Milestones (G3) tell the story of one habit.
Chapters tell the story of a life period across all habits.

Real people don't live in an undifferentiated stream of days. They live in
chapters: a semester, a project, a recovery, a season of ambition. A habit
tracker that recognizes chapters reflects how life actually works.

**Behavioral science:** Temporal landmarks (Dai, Milkman & Riis, 2014):
people use temporal boundaries (new year, new job, Monday) to segment their
lives and motivate fresh starts. Chapters formalize this — the user declares
their own temporal landmarks. Episodic memory (Tulving): humans store
experiences in episodes, not continuous streams. A chapter-framed summary
is stored and recalled more effectively than a year of daily data points.

**Data model:**
```typescript
type Chapter = {
  id: string
  name: string           // max 60 chars
  startDate: string      // YYYY-MM-DD
  endDate?: string       // YYYY-MM-DD or null if ongoing
  note?: string          // max 200 chars, optional context
}
```

New top-level key `chapters` in data.json. One active chapter at a time
(simplicity). Chapter summary is computed, not stored.

**Effort:** Small-Medium. Chapter CRUD (reuses existing patterns), banner
component, summary computation over existing log data.

**Depends on:** Nothing. Enhanced by Narrative Milestones (chapter context
enriches milestone stories).

---

### K2. Ripple Effects (Post-Completion Outcome Tracking)

**What:** After completing a habit, a subtle, optional two-icon prompt
appears for 3 seconds:

```
  ✓ Exercise    [⚡+] [⚡-]     ← "How do you feel after?"
```

Two taps: energy-up or energy-down. (Could also be mood-up/mood-down, but
energy is more actionable and less subjective.) No tap = neutral. The prompt
auto-dismisses instantly and never blocks the check-in flow.

Over time, Ripple Effects reveal which habits are net-positive vs. draining:

```
Ripple Report (last 30 days):
  Exercise        → ⚡+ 85% of the time    ← energizing
  Meditate        → ⚡+ 60%                 ← moderately positive
  Deep Work       → ⚡- 70%                 ← draining (but valuable?)
  Networking      → ⚡- 90%                 ← consistently draining
```

The insight is powerful: a habit with 95% completion and 90% energy-drain
might be worth restructuring (different time of day, shorter duration, or
replaced entirely). Conversely, a habit with 60% completion but 100%
energy-up is worth protecting and expanding.

Ripple Effects also feeds into Daily Calibration: if the user completed
3 draining habits already today, the app could note: "You've done 3
energy-draining habits today — consider doing [energizing habit] next."

**Why this is genuinely novel:** Daily Calibration and Energy Check-In
track how you feel BEFORE doing habits (input state). Completion Depth
tracks HOW WELL you did the habit (execution quality). Nothing tracks
how you feel AFTER the habit (output state).

This is the missing feedback loop. Input → Execution → **Outcome**. The
outcome is the reinforcement signal that determines whether a habit sticks.
If exercise consistently makes you feel great afterward, that association
strengthens the habit. If it consistently drains you, something is wrong
with the implementation (wrong time, wrong intensity, wrong type), not the
habit itself.

**Behavioral science:** Operant conditioning (Skinner): the consequence of a
behavior determines its future frequency. Positive reinforcement (feeling
good after) strengthens habits; punishment (feeling drained after) weakens
them. Tracking the reinforcement signal makes this loop visible.

Affective forecasting (Wilson & Gilbert): people are poor at predicting
how they'll feel after an activity. Actual post-completion data corrects
these miscalibrations. Users may discover that habits they dread (exercise)
consistently produce positive outcomes, while habits they enjoy (social media
tracking) consistently drain them.

**Data model:**
```typescript
type RippleLog = {
  [habitId: string]: {
    [date: string]: 'up' | 'down'  // only stored when tapped
  }
}
```

New top-level key `ripples` in data.json, parallel to `logs`. No entries
for neutral (no tap). Fully additive, backward-compatible.

**Effort:** Small. Two-icon inline prompt (same pattern as Completion Depth),
one data structure, one analysis utility. No backend model changes beyond
accepting the new key.

**Depends on:** Nothing. Enhanced by Daily Calibration (ripple-aware
ordering), Resonance Map (which habits energize vs. drain together).

---

### K3. Habit DNA (Unique Pattern Visualization)

**What:** Each habit develops a unique visual "DNA strand" — a compact,
abstract visualization of its completion pattern over time. The DNA is a
thin horizontal strip (about 6px tall, full width) rendered as an inline
SVG below the habit name:

```
Exercise    ████░████░████████░░████████████████░░████████
            ▲ steady pattern with regular rest gaps

Meditate    ████████████░░░░░░░░░░████████████████████████
            ▲ bursty: long runs separated by long gaps

Read        ██░██░█░░██░█░██░░█░█░██░░█░░░█░░░█░░░█░░░█░
            ▲ scattered: declining, no rhythm
```

Each filled segment represents a completed day; each gap represents a miss.
The strip covers the last 90 days (configurable). Color intensity can map
to Completion Depth if available (light=faded, full=solid, deep=bright).

The DNA visualization communicates something no number can: the *texture*
of a habit. Two habits with identical 70% completion rates can have
radically different DNA patterns — one is steady with small gaps (healthy),
the other is bursty with long runs and long breaks (fragile). The steady
pattern is resilient; the bursty pattern is at risk of permanent collapse.

An optional "DNA comparison" view shows all habits stacked vertically,
revealing at a glance which habits have healthy patterns and which don't.

**Why this is genuinely novel:** Every prior visualization proposal
operates at a different abstraction level:
- Heatmap (#29): calendar grid showing ALL habits, daily resolution
- Heartbeat (N6): single pulsing line showing aggregate health
- Living Garden (#15): metaphorical representation of overall state
- Momentum Velocity (J3): directional arrow (↑↓→), a single symbol
- Streak pill: a single number

None shows the *shape* of an individual habit's pattern over time. DNA is
the only per-habit, pattern-level visualization. It answers "What does my
relationship with this habit look like?" in a way that a number (streak:
23), a percentage (78%), or a direction (↑) cannot.

**Behavioral science:** Pattern recognition is pre-attentive — the brain
processes visual patterns faster than numbers (Healey & Enns, 2012). A
declining DNA strand communicates "this habit is fading" before the user
consciously processes their streak count. Bursty patterns trigger
different interventions than steady-decline patterns: bursty needs
consistency strategies; declining needs motivation or restructuring.

Gestalt psychology: visual continuity (an unbroken run) communicates
strength; fragmentation communicates instability. The DNA leverages
these perceptual primitives.

**Data model:** None. Pure SVG rendering over existing log data.

**Effort:** Small. One SVG rendering utility (~30 lines to map dates to
rectangles), one inline component in HabitRow. Optional tooltip showing
the date on hover. No backend changes.

**Depends on:** Nothing. Enhanced by Completion Depth (depth maps to
color intensity in the DNA strip).

---

### K4. Recovery Velocity (Bounce-Back Measurement)

**What:** After a streak break or extended absence, the app tracks how
quickly the user recovers — specifically, how many days it takes to return
to their prior completion rate for each habit.

The metric is simple: after a break of 3+ days, count the days until the
habit reaches 80% completion over a rolling 7-day window again. That
number is the "recovery velocity."

The app tracks this across all breaks and surfaces it as a trend:

```
Recovery History — Exercise:
  Break 1 (Mar 5, streak: 23):     Recovered in 4 days
  Break 2 (Apr 18, streak: 12):    Recovered in 2 days
  Break 3 (Jul 3, streak: 45):     Recovered in 6 days
  Break 4 (Sep 20, streak: 31):    Recovered in 3 days

Trend: Your recovery is getting faster. Average: 3.8 days.
Most recent: 3 days. You bounce back.
```

The recovery velocity serves three purposes:

1. **Reframes breaks as temporary.** "Your last 4 breaks averaged 3.8 days
   to recover" tells the user that breaks are not permanent — they have
   a track record of bouncing back.

2. **Reveals hidden resilience.** A user might see a 31-day streak end and
   feel devastated. But their recovery history shows they always come back
   within a week. That's resilience, and it's invisible without this metric.

3. **Provides a recovery goal.** "Last time it took 4 days. Can you do it
   in 3?" This turns recovery itself into a mini-challenge.

**Why this is genuinely novel:** Every recovery feature in prior plans
addresses the *moment of return* (Soft Landing's welcome screen) or the
*display during recovery* (Phantom Streaks' "52/55" framing). None measures
the *speed of recovery* across multiple breaks, and none reveals the
*trend in recovery speed*.

Recovery velocity is a second-order metric — it measures not performance,
but the meta-skill of recovering from lapses. This meta-skill is arguably
more important than any individual streak. A user who always recovers in
3 days is more resilient than a user with one long streak who hasn't
been tested.

**Behavioral science:** Self-efficacy theory (Bandura): believing you CAN
recover predicts whether you WILL recover. Recovery velocity provides
evidence of past recovery, which builds self-efficacy for future recovery.
This is the behavioral science version of "You've done this before."

Resilience research (Masten & Reed): psychological resilience is not the
absence of setbacks but the speed of recovery. Measuring recovery velocity
directly measures resilience, which is more meaningful than measuring
streak length (which measures the absence of adversity, not the ability
to handle it).

**Data model:** None. Pure computation over existing log data. The algorithm:
scan the log for gaps ≥3 days, then for each gap, count days until 80%
rolling-7-day completion. Memoize results in localStorage.

**Effort:** Small. One utility function (~40 lines), one display component
(a small card or section in the habit detail view), localStorage cache.

**Depends on:** Needs 60+ days of data with at least one break. Enhanced
by Soft Landing (show recovery velocity on the welcome-back screen:
"Last time, you recovered in 3 days").

---

### K5. The Pause Protocol (Intentional Temporary Suspension)

**What:** A third state between "active" and "archived": **paused**. A
paused habit:

- Is visible but grayed out in the habit list
- Has its streak frozen (neither growing nor breaking)
- Does not count toward Habit Load or daily completion percentage
- Has a declared resume date (required, max 30 days from pause date)
- Shows a countdown: "Paused — resumes in 8 days"

When the resume date arrives, the habit automatically reactivates with a
gentle nudge: "Stretching is back from pause. Your streak was 14 days —
pick up where you left off."

Pausing requires a one-line reason (max 100 chars): "Knee injury — can't
run for 3 weeks" or "Traveling, no gym access" or "Deprioritizing to
focus on work habits." The reason is stored and visible, serving as
self-documentation.

If a paused habit's resume date passes without the user manually
reactivating it (i.e., they ignore the nudge for 3+ days), the app
gently asks: "Stretching has been paused for 33 days. Resume, extend
the pause, or archive it?" This prevents indefinite pause as a form of
avoidance.

**Why this is genuinely novel:** The current data model has two habit
states: `archived: false` (active) and `archived: true` (hidden).
Prior plans add a third state via The Ratchet ("locked" — established
habits recede visually) but that's about attention management, not
suspension.

The gap this fills:

- **Active** = "I'm doing this every day"
- **Paused** = "I'm intentionally not doing this for a defined period"
- **Archived** = "I'm done with this, possibly permanently"

Currently, when someone goes on vacation or gets injured, their options
are: (a) keep the habit active and watch their streak break (demoralizing),
(b) archive it and lose the streak entirely, or (c) use Grace Days, which
are limited to a few per month and don't cover multi-week absences.

Planned Rest (N2+N7) addresses week-level pauses but applies to ALL
non-core habits at once. Pause Protocol is habit-specific — you might
pause Exercise during a knee injury while keeping Meditate and Read
fully active.

The key design choice: pause requires a resume date and a reason. This
prevents the "I'll get back to it eventually" pattern that kills habits.
Indefinite pause is just archive with extra steps. A declared resume date
is a commitment to future self.

**Behavioral science:** Implementation intentions (Gollwitzer): specifying
WHEN you will resume a suspended behavior dramatically increases the
probability of resumption. The pause protocol requires this specification.

Temporal construal theory (Trope & Liberman): concrete near-future dates
("resume Oct 25") feel more real and actionable than abstract intentions
("I'll get back to it"). The countdown makes the resume date tangible.

Planned behavior theory (Ajzen): perceived behavioral control — the
belief that you CAN resume — predicts actual resumption. A paused habit
with a clear resume date and a stated reason communicates control. An
abandoned habit communicates defeat.

**Data model:**
```typescript
// Extend existing Habit type
type Habit = {
  // ... existing fields ...
  paused?: boolean
  pausedAt?: string      // YYYY-MM-DD
  resumeDate?: string    // YYYY-MM-DD
  pauseReason?: string   // max 100 chars
}
```

Additive fields. Active habits have `paused` unset or false. Streak
calculation skips paused days. One new endpoint or extend the existing
archive endpoint to handle pause/unpause.

**Effort:** Small-Medium. Three-state logic in useHabits filter (active,
paused, archived), pause modal with date picker and reason field,
countdown rendering, auto-resume nudge logic, streak calculation update
to skip paused periods.

**Depends on:** Edit Habit (#1). Enhanced by Soft Landing (paused habits
are shown with context on return) and Habit Load Monitor (paused habits
excluded from load calculation).

---

## Part 3: Why These 5 Features (And Not Others)

### The dimension map, updated

| # | Dimension | Feature | Prior Coverage |
|---|-----------|---------|----------------|
| 24 | **Life context / temporal framing** | K1: Life Chapters | None — all features operate at day or lifetime scale, never at the weeks-to-months life-phase scale |
| 25 | **Post-completion outcome** | K2: Ripple Effects | None — Energy Check-In measures INPUT state; Completion Depth measures EXECUTION quality; nothing measures OUTPUT state |
| 26 | **Per-habit pattern shape** | K3: Habit DNA | None — all visualizations are either aggregate (Garden, Heartbeat) or point-in-time (streak count, velocity arrow). None shows the texture of a habit's pattern |
| 27 | **Recovery meta-skill** | K4: Recovery Velocity | None — Soft Landing addresses the MOMENT of return; Phantom Streaks reframe the DISPLAY. Neither measures the SPEED or TREND of recovery across multiple breaks |
| 28 | **Intentional habit-specific suspension** | K5: Pause Protocol | Partial — Grace Days (day-level), Quiet Weeks (all-habit), Archive (permanent). None is habit-specific + time-bound + streak-preserving |

### Features considered and rejected

| Concept | Why Rejected |
|---------|-------------|
| Habit Cost Tracking (time/money per habit) | Time Investment (#33) already proposed in PLAN.md v2. Adding monetary cost is scope creep. |
| Micro-Habit Decomposition (sub-steps) | Increases complexity dramatically. Habit Stacking (N1) covers multi-habit sequences. Sub-step tracking turns habits into project management. |
| Social Accountability Devices | Requires auth, external integrations. Against the app's "private self-improvement" philosophy. |
| Contextual Anchors (location/who) | Interesting but requires location awareness or manual input that adds friction. Ritual Windows (H6) partially covers temporal context. |
| Anti-Habits with Substitution | Niche use case. Anti-Habits (#27) was already deferred in PLAN.md v2. Adding substitution logic doesn't change the cost/benefit. |

---

## Part 4: Consolidated Master Backlog (Reset)

The v6 roadmap has 30 items across 6 phases. This backlog does not change
the 30-item plan. Instead, it adds the 5 new features (K1-K5) to the
deferred list and establishes the implementation sequence that should
actually happen.

### The Next 5 Implementation Sessions

This is not a roadmap — it's a to-do list. Each session is 1-2 hours of
coding.

**Session 1: Edit Habit + API Error Handling (Features #1 + #2)**
- Add `PUT /api/habits/:id` endpoint with same validation as POST
- Check `res.ok` in every function in `api.ts`
- Add inline edit form (reuse HabitForm with pre-filled values)
- Add optimistic update for edit in `useHabits`
- Write tests for PUT endpoint

**Session 2: View & Restore Archives + Theme Toggle (Features #3 + #4)**
- Add `POST /api/habits/:id/unarchive` endpoint
- Add collapsible "Archived" section below habit table
- Reconcile index.css variables with App.css hardcoded colors
- Add theme toggle (system preference + manual override in localStorage)

**Session 3: Quick Pulse Check-In (Feature #5)**
- Add `QuickPulse` component: vertical list of today's habits, one-tap
- Add view toggle in header (`useState<'pulse' | 'table'>`, persisted)
- Quick Pulse as default view; table as "Full View"
- Show completion count ("3 of 7 done")

**Session 4: Completion Sparks + Streak Forgiveness Window (Features #7 + #9)**
- Context-aware micro-celebrations on habit completion
- Forgiveness Window: evening countdown for at-risk streaks
- Both are pure frontend, no backend changes

**Session 5: Daily Calibration + Habit Time Machine (Features #6 + #10)**
- Core habit flag (star toggle) on each habit
- Energy picker in header (Low/Medium/High, localStorage)
- Arrow navigation beyond 14-day window

### Where the K-features sit in the roadmap

| Feature | Recommended Phase | Reasoning |
|---------|------------------|-----------|
| K3: Habit DNA | Phase 3 (Honesty) | Zero-backend visualization. Ships alongside Momentum Velocity and Phantom Streaks. Pattern-level insight complements point-level metrics. |
| K5: Pause Protocol | Phase 4 (Resilience) | Ships alongside Soft Landing and Planned Rest. Completes the "handle life disruptions" feature set. |
| K2: Ripple Effects | Phase 4 (Resilience) | Outcome tracking enriches Daily Calibration. Ships after core check-in features are solid. |
| K4: Recovery Velocity | Phase 5 (Depth) | Needs 60+ days of data with breaks. Ships alongside Insights Tab and analytics. |
| K1: Life Chapters | Phase 5 (Depth) | Cross-cutting narrative feature. Benefits from Narrative Milestones existing first. |

### Updated deferred list (from v6 + new K-features)

| Feature | Source | Priority for Promotion |
|---------|--------|----------------------|
| **K3: Habit DNA** | New v7 | High — small effort, unique visual, no backend |
| **K5: Pause Protocol** | New v7 | High — fills a real gap between active and archived |
| **K2: Ripple Effects** | New v7 | Medium — novel but needs core check-in to be fast first |
| **K4: Recovery Velocity** | New v7 | Medium — needs data accumulation period |
| **K1: Life Chapters** | New v7 | Medium — compelling but highest-effort of the 5 |
| Habit Stacking / Chains | PLAN v2 N1 | Low — medium effort, new data model |
| Difficulty Progression | PLAN v2 N5 | Low — useful after months of use |
| Time Capsule | v3 F3 | Low — high novelty, low urgency |
| Habit Heartbeat | PLAN v2 N6 | Low — build after Garden exists |
| Categories / Tags | PLAN v2 #37 | Low — needed at 15+ habits |
| Drag-and-Drop Reorder | PLAN v2 #38 | Low — Ritual Windows handles smart ordering |
| PWA / Offline | PLAN v2 #40 | Low — large effort |
| Keyboard Shortcuts | PLAN v2 #12 | Low — ship whenever |
| Seasonal Rhythms | PLAN v2 #18 | Low — nice visual touch |

---

## Part 5: Cross-Reference of All Feature IDs

Every feature ever proposed, with its canonical number from v6's roadmap
and the document of origin.

| v6 # | Prior IDs | Feature Name | Status |
|-------|-----------|-------------|--------|
| 1 | Plan #1 | Edit Habit | Not started |
| 2 | Plan #6 | API Error Handling | Not started |
| 3 | Plan #2 | View & Restore Archives | Not started |
| 4 | Plan #4 | Theme Toggle | Not started |
| 5 | H1 | Quick Pulse Check-In | Not started |
| 6 | N3 + #7 | Daily Calibration | Not started |
| 7 | N8 | Completion Sparks | Not started |
| 8 | H6 | Ritual Windows | Not started |
| 9 | J5 | Streak Forgiveness Window | Not started |
| 10 | Plan #14 | Habit Time Machine | Not started |
| 11 | H2 | Completion Depth | Not started |
| 12 | J1 | Miss Fingerprinting | Not started |
| 13 | G2 | Phantom Streaks | Not started |
| 14 | J3 | Momentum Velocity | Not started |
| 15 | H4 | Habit Load Monitor | Not started |
| 16 | J2 | Habit Lifecycle Stages | Not started |
| 17 | H3 | Soft Landing | Not started |
| 18 | G1 | 2-Minute Fallback | Not started |
| 19 | N2 + N7 | Planned Rest | Not started |
| 20 | F1 | Habit Autopsy | Not started |
| 21 | H5 | Identity Framing | Not started |
| 22 | Plan #15 | Living Garden View | Not started |
| 23 | G3 | Narrative Milestones | Not started |
| 24 | G4 | The Ratchet | Not started |
| 25 | G5 | Habit Echoes | Not started |
| 26 | J4 | Habit Resonance Map | Not started |
| 27 | #28-31 | Insights Tab | Not started |
| 28 | F2 | Habit Weather Forecast | Not started |
| 29 | N4 | Weekly Compass | Not started |
| 30 | #34 | Data Export | Not started |
| — | K1 | Life Chapters | Not started (deferred) |
| — | K2 | Ripple Effects | Not started (deferred) |
| — | K3 | Habit DNA | Not started (deferred) |
| — | K4 | Recovery Velocity | Not started (deferred) |
| — | K5 | Pause Protocol | Not started (deferred) |

**Every single feature has the status "Not started."** That is the only
metric that matters right now.

---

## Part 6: New Feature Reasoning Matrix

### Why each K-feature fills a unique gap

| Feature | Uncovered Dimension | Core Question | How It Differs from Closest Existing |
|---------|--------------------|--------------|------------------------------------|
| K1: Life Chapters | Medium-term life context | "What period of my life am I in, and how does it affect my habits?" | Lifecycle Stages (J2) = per-habit maturity. Chapters = cross-cutting life context. Different scope entirely. |
| K2: Ripple Effects | Post-completion outcome | "How does doing this habit make me FEEL?" | Energy Check-In = how I feel BEFORE. Completion Depth = how WELL I did it. Ripple = how I feel AFTER. Three different data points. |
| K3: Habit DNA | Per-habit pattern shape | "What does my relationship with this habit LOOK like over time?" | Heatmap = all habits on calendar. Heartbeat = aggregate pulse. DNA = individual habit's pattern texture. Only per-habit pattern viz. |
| K4: Recovery Velocity | Recovery meta-skill | "Am I getting better at bouncing back?" | Soft Landing = moment of return. Phantom Streaks = reframed display. Recovery Velocity = measured trend across all breaks. |
| K5: Pause Protocol | Intentional habit-specific suspension | "How do I handle a temporary life disruption for ONE habit?" | Grace Days = day-level. Quiet Weeks = all habits. Archive = permanent. Pause = habit-specific + time-bound + streak-preserving. |

### The input → execution → outcome model

This framing shows how the K-features (particularly K2) complete a loop
that prior plans left open:

```
BEFORE the habit          DURING the habit         AFTER the habit
─────────────────         ──────────────────       ─────────────────
Energy Check-In (N3)      Completion toggle        Ripple Effects (K2) ← NEW
Daily Calibration (#6)    Completion Depth (H2)    Recovery Velocity (K4) ← NEW
Ritual Windows (H6)       2-Minute Fallback (G1)   Narrative Milestones (G3)
Forgiveness Window (J5)   Miss Fingerprinting(J1)  Soft Landing (H3)
Weather Forecast (F2)                              Phantom Streaks (G2)
```

The "AFTER" column was sparse — mostly about recovery from breaks. K2 adds
the crucial "how did this make me feel?" signal that closes the
reinforcement loop.

---

## Part 7: Meta-Observation

This is the 7th planning document. The repo now has more words about
features than lines of code (FEATURES_v3-v7 + PLAN.md ≈ 3,400 lines of
markdown vs. ~960 lines of application code). The behavioral science
citations alone could fill a research paper.

The planning is genuinely good. The feature ideas are creative, well-
reasoned, and differentiated. The problem has never been ideation.

The 5 features proposed here (K1-K5) round out the map to 28 behavioral
dimensions — a coverage that rivals academic habit-formation frameworks.
But the framework exists only on paper. The app that users interact with
has exactly 5 features: create, toggle, streak, archive, delete.

The gap between the plan and the product is the only thing that matters
now.
