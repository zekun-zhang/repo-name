# Habit Garden — Feature Plan v8: Patterns, Signals & Quick Wins

**Date:** 2026-10-04
**Supersedes:** FEATURES_v7.md and all prior planning documents
**Status:** Feature exploration + implementation-ready backlog

---

## The Score

**Commits:** 18. **Planning documents:** 7. **Features shipped:** 0.
**Lines of planning markdown:** ~3,600. **Lines of application code:** ~960.

Prior documents (v3-v7) mapped 28 behavioral dimensions with rigorous
behavioral science citations. The analysis is genuinely excellent. This
document adds 5 novel features targeting dimensions outside that map, plus
3 "quick wins" that could each ship in under 45 minutes of coding.

---

## Part 1: What's Been Covered (The Complete Map)

28 dimensions across all prior documents. Any new proposal must target
something outside this list.

| # | Dimension | Key Features | Docs |
|---|-----------|-------------|------|
| 1 | Streak preservation | Grace Days, Phantom Streaks, Planned Rest | v3-v6 |
| 2 | Energy/capacity input | Energy Check-In, Daily Calibration | v3, v5 |
| 3 | Visual identity | Living Garden, Heartbeat, Seasonal Rhythms | v2, v4 |
| 4 | Celebration/reward | Completion Sparks, Milestones, Echoes | v3-v5 |
| 5 | Forward planning | Weekly Compass, Intentions | v2 |
| 6 | Failure (abandoned) | Autopsy, Weather Forecast | v3 |
| 7 | Failure (active) | Miss Fingerprinting | v6 |
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
| 24 | Life context / temporal framing | Life Chapters | v7 |
| 25 | Post-completion outcome | Ripple Effects | v7 |
| 26 | Per-habit pattern shape | Habit DNA | v7 |
| 27 | Recovery meta-skill | Recovery Velocity | v7 |
| 28 | Intentional suspension | Pause Protocol | v7 |

---

## Part 2: New Feature Proposals (Dimensions 29-33)

### L1. Rhythm Detection (Day-of-Week Temporal Patterns)

**What:** The app automatically detects and surfaces day-of-week completion
patterns for each habit. No user input required — the analysis runs over
existing log data whenever 3+ weeks of history exist.

```
Exercise — Weekly Rhythm:
  Mon ████████ 92%     ← your best day
  Tue ██████░░ 75%
  Wed ████████ 88%
  Thu ██████░░ 71%
  Fri ████░░░░ 50%     ← consistent drop
  Sat ██░░░░░░ 25%     ← critical gap
  Sun ███░░░░░ 33%

Pattern: Strong weekday, weak weekend.
Suggestion: Consider making Exercise a weekday-only habit,
or anchor your weekend exercise to a specific cue (e.g., after coffee).
```

The rhythm view is a small bar chart per habit — 7 bars, one per day of
the week, showing historical completion rate. It appears in a habit detail
view (tapping a habit name expands its detail card).

When patterns are strong (coefficient of variation > 0.3 across days), the
app surfaces a one-line insight: "You almost never [habit] on Fridays" or
"[Habit] is a weekday habit — consider making it official."

**Why this is genuinely novel:** Ritual Windows (H6, dimension 17) structures
time-of-DAY — morning, afternoon, evening. No feature addresses which DAYS
of the week a habit naturally clusters on. This is a different temporal axis
entirely.

The distinction matters because most people have two fundamentally different
routines: weekday and weekend. A "daily" habit with 75% overall completion
might be 95% on weekdays and 20% on weekends — but the current app can't
show this. The user sees "75%" and doesn't know where to intervene.

Rhythm detection transforms vague percentage data into actionable temporal
intelligence. "Your Exercise completion drops 67 percentage points on
weekends" is a specific problem with specific solutions. "Your completion
rate is 75%" is just a number.

**Behavioral science:** Habit cue theory (Duhigg, Wood & Neal): habits fire
in response to contextual cues, and day-of-week is one of the strongest
cues because it dictates the entire structure of a person's day (work vs.
rest, commute vs. home, routine vs. unstructured). Detecting which days
a habit fires on reveals its cue dependencies.

Temporal pattern learning (Reber): humans implicitly learn temporal
patterns but are poor at explicitly articulating them. Making the implicit
pattern visible (the bar chart) enables deliberate intervention on specific
weak days rather than global "try harder" strategies.

**Data model:** None. Pure computation over existing `logs` data. For each
habit, group completion dates by day-of-week, compute rate per day.
Memoize in component state.

**Effort:** Small. One utility function (~25 lines: group dates by
`getDay()`, compute rate per group), one bar chart component (7 inline
divs with percentage-width backgrounds), conditional rendering when
3+ weeks of data exist.

**Depends on:** Nothing. Enhanced by Ritual Windows (time-of-day +
day-of-week = full temporal map).

---

### L2. Completion Momentum (Within-Day Sequential Acceleration)

**What:** The app tracks how many habits the user has completed today and
surfaces a subtle, growing momentum indicator:

```
Today: ●●●○○○○   3 of 7 done
       ↑ momentum building
```

The momentum indicator is a row of dots (filled for done, empty for
remaining) shown at the top of the habit list. As more habits are completed,
the indicator grows and the remaining habits subtly brighten or shift
position to feel more "reachable."

The key behavioral insight: the momentum indicator reframes the remaining
habits not as "things you haven't done" but as "the next one in your
streak." It shifts the mental model from a to-do list (obligation) to a
streak within the day (game).

After completing all habits for the day, the app shows a brief "Perfect
Day" acknowledgment (one line, auto-dismisses in 3 seconds, no fanfare):

```
✓ Perfect Day — all 7 habits complete.
```

Over time, the app tracks Perfect Day frequency and shows it in a monthly
summary: "You had 12 Perfect Days this month (up from 8 last month)."

**Why this is genuinely novel:** Every prior metric operates at the
between-day level: streaks measure consecutive DAYS, velocity measures
change across DAYS, lifecycle stages accumulate over DAYS. Nothing measures
or leverages what happens WITHIN a single day as you move from habit 1 to
habit 7.

Completion Sparks (N8, dimension 4) celebrates individual completions.
But celebrations are isolated moments — one per habit. Momentum is
cumulative — each completion makes the next one feel easier because the
running count is visible.

Daily Calibration (N3, dimension 2) adjusts which habits appear based on
energy. Momentum works on any configuration — it doesn't change what
appears, it changes how progress toward the day's total is experienced.

**Behavioral science:** Behavioral momentum theory (Nevin, 1988): a history
of reinforcement in a context increases resistance to disruption. Within
a daily check-in, each completed habit reinforces the check-in behavior
itself, making the next completion more likely. The visible momentum counter
makes this psychological effect tangible.

Goal gradient effect (Kivetz, Urminsky & Zheng, 2006): effort accelerates
as people approach a goal. "5 of 7 done" triggers the goal gradient —
the last 2 feel closer than the first 2 did. The dot indicator makes
the goal gradient visible.

Endowed progress effect (Nunes & Drèze, 2006): people are more motivated
to complete a task when they feel they've already made progress. The filled
dots at the start of each session (from habits completed earlier today)
are endowed progress.

**Data model:** None. Computed from existing `logs` data filtered to today.
Perfect Day count computed from logs (days where all active habits were
completed).

**Effort:** Small. One progress bar component in the header area (~20
lines), one Perfect Day counter utility. Monthly summary is optional
enhancement.

**Depends on:** Nothing. Enhanced by Completion Sparks (the momentum
counter could visually pulse on each spark), Quick Pulse view (natural
home for the momentum indicator).

---

### L3. Habit System Score (Composite Health Index)

**What:** A single number from 0-100 that represents the overall health of
the user's entire habit system. Displayed prominently in the header,
updated daily.

```
Habit Garden Health: 73 ▲
```

The score is computed from four equally weighted components:

1. **Completion Rate (25%):** Average completion rate across all active
   habits over the last 14 days.

2. **Consistency (25%):** Inverse of day-to-day completion variance. A user
   who does 5 of 7 habits every day scores higher than one who does 7 one
   day and 3 the next, even if the averages are identical. Consistency
   rewards reliability over heroic effort.

3. **Trend (25%):** Is the completion rate going up, down, or holding steady?
   Computed as the slope of a 14-day rolling average. Positive trend = bonus.
   Negative trend = penalty. Flat = neutral. This means a user at 60%
   and rising scores higher than a user at 75% and declining — because
   trajectory matters more than position.

4. **Load Balance (25%):** How close is the user to their sustainable
   capacity? Too few active habits (1-2) scores low (underutilized). A
   reasonable load (3-8) scores high. Overloaded (10+) scores progressively
   lower. This component gently signals when the user has added too many
   habits or too few.

The score's purpose is NOT gamification — it's a health check. Like a
dashboard gauge that tells you whether the engine is running well without
requiring you to check every sensor individually.

The directional arrow (▲ ▼ →) shows whether the score has improved,
declined, or held steady compared to yesterday.

**Why this is genuinely novel:** Every prior metric is per-habit: streak
length, velocity, lifecycle stage, completion depth, DNA pattern. No
feature aggregates across all habits into a single system-level indicator.

The closest prior proposal is Habit Load Monitor (H4, dimension 16), which
measures overcommitment. But Load Monitor is one-dimensional — it only
measures "too many habits." The System Score combines four dimensions
(completion, consistency, trend, load) into one composite that captures
whether the user's overall habit practice is healthy.

This fills the same role that a stock index fills for a portfolio: you
can check individual positions (per-habit metrics), but sometimes you
just want to know "how's my portfolio doing today?"

**Behavioral science:** Composite indices and feedback loops (Carver &
Scheier, 1982): self-regulation operates by comparing current state to
a reference standard. A single, clear number provides the reference
standard that a collection of per-habit metrics cannot. The user can
glance at "73 ▲" and know things are on track without parsing 7 individual
streaks.

Feedback frequency and motivation (Kluger & DeNisi, 1996): feedback that
is too granular (every habit, every day) can be overwhelming. Aggregated
feedback reduces cognitive load while preserving motivational function.

Self-determination theory (Deci & Ryan): competence need satisfaction
requires evidence of effectiveness. A rising System Score is direct
evidence of overall effectiveness — more motivating than individual
streak counts because it captures the whole picture.

**Data model:** None. Pure computation over existing data. The four
components are derived from `habits` (active count) and `logs` (dates
per habit). Score is recomputed on each render (cheap: iterate active
habits, count completions per day for last 14 days).

**Effort:** Small-Medium. One utility function for score computation
(~50 lines: four sub-scores, weighted average), one header component
(number + arrow + optional tooltip showing breakdown). The main
complexity is deciding the scoring curves (linear? logarithmic? what
counts as "overloaded"?), which is a design decision, not a code problem.

**Depends on:** Nothing. Enhanced by Habit Load Monitor (Load Balance
component could reuse Load Monitor's capacity detection), Trend
Velocity (Trend component could reuse velocity computation).

---

### L4. Slump Radar (Predictive System-Wide Decline Detection)

**What:** The app detects early signs of a system-wide slump — a period
where completion rates decline simultaneously across multiple habits — and
alerts the user BEFORE the slump becomes a full break.

Detection algorithm (simple, no ML required):

1. Compute the user's baseline: average daily completion count over the
   last 30 days (or all available history if less).
2. Track the current 3-day rolling average of daily completions.
3. If the 3-day average drops more than 30% below the 30-day baseline
   AND at least 2 habits contributed to the decline, trigger the alert.

The alert is a gentle, non-alarmist inline banner:

```
Your completion has dropped 35% over the last 3 days,
affecting Exercise, Reading, and Meditation.

This pattern has preceded longer breaks before.
[Take it easy today] [I've got this]
```

"Take it easy today" could reduce the visible habit list to core habits
only (if core habits are flagged via Daily Calibration). "I've got this"
dismisses the banner for 3 days.

The innovation is **system-wide** pattern detection. Weather Forecast (F2)
predicts which individual habits are at risk based on their own history.
Slump Radar detects when MULTIPLE habits decline simultaneously — which
is a different and more serious signal. A single habit declining might be
a scheduling issue. Three habits declining together is a life event
(stress, illness, travel, burnout).

**Why this is genuinely novel:** Weather Forecast (F2, dimension 6)
predicts per-habit risk. Miss Fingerprinting (J1, dimension 7) attributes
individual misses. Soft Landing (H3, dimension 15) re-engages after an
absence. None detects the EARLY stage of a system-wide decline while
it's still happening and before it becomes a full absence.

The timing gap is critical:
- Day 1-2 of a slump: still recoverable with awareness (Slump Radar)
- Day 5-10: the slump has solidified into a break
- Day 14+: Soft Landing territory, now a re-engagement problem

Slump Radar operates in the Day 1-2 window. No other feature does.

**Behavioral science:** Relapse prevention model (Marlatt & Gordon):
the "abstinence violation effect" — one lapse leads to full relapse
because the person interprets the lapse as evidence of failure. Early
detection interrupts this cascade. "Your last 3 days have been lower"
normalizes the dip as a pattern (not a failure) and suggests a response
(not a judgment).

Self-monitoring and behavior change (Michie et al., 2011): self-monitoring
is most effective when it includes deviation detection — not just tracking
what happened, but flagging when what happened deviates from the norm.
Slump Radar is automated deviation detection.

**Data model:** None. Pure computation over existing `logs` data. The 30-day
baseline and 3-day rolling average are computed on each app load
(inexpensive: iterate logs for all active habits, count per day). Alert
dismissal timestamp stored in `localStorage`.

**Effort:** Small. One detection utility (~30 lines: compute baseline,
compute rolling average, compare), one banner component, one
`localStorage` timestamp for dismissal. No backend changes.

**Depends on:** 14+ days of data. Enhanced by Daily Calibration
("Take it easy" could auto-switch to low-energy mode), Soft Landing
(if slump detection fails and the user fully disengages, Soft Landing
catches them on return).

---

### L5. Effort Autopilot (Adaptive Difficulty Downshift)

**What:** When a habit consistently fails (completion rate drops below 40%
over a rolling 14-day window), the app suggests a simplified version:

```
You've completed "Meditate 20 min" only 3 of the last 14 days.

This might be too ambitious right now.
Would you like to temporarily scale down?
  [Meditate 10 min]  [Meditate 5 min]  [Keep as is]
```

The user can accept a scaled-down version, which:
- Updates the habit name (adding " (scaled)" or similar)
- Resets the streak counter (fresh start, no demoralization from the
  low-completion streak)
- Tracks separately so the original goal is preserved
- After 14 consecutive days at the scaled level, offers to scale back up:
  "You've done Meditate 5 min for 14 days straight. Ready to try
  Meditate 10 min?"

The key design insight: the app doesn't just detect failure — it proposes
a concrete, easier alternative. It's not "try harder" (motivational) or
"here's why you missed" (diagnostic). It's "here's a smaller version
that you might actually do" (adaptive).

**Why this is genuinely novel:** Difficulty Progression (N5, dimension 10)
adds difficulty LEVELS that the user manually selects. 2-Minute Fallback
(G1, dimension 2) offers a minimal version on low-energy days but applies
to all habits generically ("Just do 2 minutes of anything").

Effort Autopilot differs in two critical ways:

1. **It's habit-specific.** The suggestion is "Meditate 10 min" → "Meditate
   5 min," not a generic "do less." The scaled version preserves the
   habit's identity while reducing its scope.

2. **It's trigger-based.** It activates only when a specific habit is
   consistently failing — not when the user declares low energy (that's
   Daily Calibration) and not when the user manually chooses a difficulty
   level (that's Difficulty Progression). It's an automatic safety valve
   that activates based on performance data.

3. **It includes a scale-back-UP mechanism.** The 14-day escalation prompt
   ensures that downshifting doesn't become permanent stagnation. The user
   is gently nudged back toward their original goal once the simplified
   version is established.

**Behavioral science:** Shaping (Skinner): complex behaviors are built
by reinforcing successive approximations. A user who can't sustain 20-minute
meditation but can sustain 5-minute meditation is being shaped toward the
target behavior. The alternative to shaping is extinction — the habit dies.

Self-efficacy and mastery experiences (Bandura): self-efficacy is built by
successfully completing manageable tasks. A 14-day streak at "Meditate
5 min" builds more self-efficacy than 3 completions in 14 days at
"Meditate 20 min." The smaller success is a genuine mastery experience;
the repeated failure is a self-efficacy killer.

Goldilocks zone (Csikszentmihalyi, flow theory): activities are most
engaging when difficulty matches skill. A consistently-failing habit is
outside the Goldilocks zone. Downshifting brings it back.

**Data model:**
```typescript
type Habit = {
  // ... existing fields ...
  originalName?: string      // preserved when scaled
  scaledFrom?: string        // original habit ID if this is a scaled version
  scaledAt?: string          // YYYY-MM-DD when downshift happened
}
```

Minimal additions. The scaled habit is the same habit with a modified name
and optional metadata linking it to the original version. No new data
structures required.

**Effort:** Medium. Detection logic (~20 lines: 14-day rolling completion
rate check), suggestion modal, name update + metadata fields, scale-up
prompt after 14 consecutive days. Requires Edit Habit (Feature #1) to
exist first, since scaling modifies the habit name.

**Depends on:** Edit Habit (#1). Enhanced by Difficulty Progression
(discrete levels could replace free-text name editing), Daily Calibration
(low-energy days could temporarily display the scaled version).

---

## Part 3: Quick Wins (Ship in Under 45 Minutes Each)

These are not behavioral science innovations. They are obvious usability
fixes that should have shipped in the first 3 sessions. They are listed
here because they are prerequisites for everything else and because
shipping them would break the 18-commit, 0-feature drought.

### QW1. Edit Habit

**What:** Tap a habit name to edit it inline. Change name, frequency, color.
Backend: `PUT /api/habits/:id` with same validation as POST. Frontend:
toggle `HabitRow` into edit mode, reuse `HabitForm` fields.

**Why:** Edit is a prerequisite for 8+ planned features (Effort Autopilot,
Difficulty Progression, Pause Protocol, and anything that modifies a habit
after creation). It is also the #1 thing a user expects to exist.

**Effort:** 30-40 minutes. One endpoint, one UI state toggle, reuse
existing validation and form components.

### QW2. API Error Handling

**What:** Check `res.ok` in every function in `api.ts`. Currently, all 5
API functions silently accept non-OK responses and try to parse them as
success. A 500 error returns `undefined` and silently corrupts state.

```typescript
// Current (broken):
const res = await fetch(...)
return res.json()

// Fixed:
const res = await fetch(...)
if (!res.ok) throw new Error(`API error: ${res.status}`)
return res.json()
```

**Why:** This is a bug, not a feature. Every API call in the app can
silently fail and corrupt the UI state. It should have been fixed in
the first commit after the initial implementation.

**Effort:** 15 minutes. Add 5 `if (!res.ok)` checks. The existing
`.catch()` handlers in `useHabits` already handle thrown errors correctly.

### QW3. Unarchive (View & Restore Archived Habits)

**What:** Show archived habits in a collapsible section below the main
table. Each has an "Unarchive" button. Backend: `POST /api/habits/:id/unarchive`
(same pattern as archive, sets `archived: false`). Frontend: filter
`habits` into active and archived in `useHabits`, render archived section.

**Why:** Currently archiving is a one-way door. The user cannot undo it
or even see which habits they've archived. This is a data integrity issue —
users will avoid archiving (and use delete instead) because archive is
irreversible.

**Effort:** 30-40 minutes. One endpoint (mirrors archive), one UI section
with filtered list, one button per archived habit.

---

## Part 4: Why These 5 Features (Dimension Map Update)

| # | Dimension | Feature | Gap Filled |
|---|-----------|---------|-----------|
| 29 | **Day-of-week temporal patterns** | L1: Rhythm Detection | Ritual Windows = time-of-DAY. Nothing addresses which DAYS habits cluster on. Different temporal axis entirely. |
| 30 | **Within-day completion dynamics** | L2: Completion Momentum | All metrics are between-day (streaks, velocity). Nothing measures the within-day experience of completing habits sequentially. |
| 31 | **System-level health composite** | L3: System Score | All metrics are per-habit. No aggregate "portfolio health" indicator across the entire habit system. |
| 32 | **Predictive system-wide decline** | L4: Slump Radar | Weather Forecast = per-habit risk prediction. Nothing detects multi-habit simultaneous decline as an early warning. |
| 33 | **Adaptive difficulty response** | L5: Effort Autopilot | Difficulty Progression = user-declared levels. 2-Minute Fallback = generic reduction. Nothing auto-detects failure and suggests a specific, habit-appropriate downshift. |

### Interaction model: Layers of temporal awareness

The L-features complete a temporal and systemic model that prior features
left incomplete:

```
Within a DAY:                    Within a WEEK:
L2: Completion Momentum          L1: Rhythm Detection
    (sequential acceleration)         (day-of-week patterns)

Across DAYS:                     Across the SYSTEM:
v6-v7 features                   L3: System Score (health)
(streaks, velocity, DNA,         L4: Slump Radar (early warning)
 lifecycle, recovery)            L5: Effort Autopilot (adaptation)
```

Prior plans covered "Across DAYS" exhaustively. L1-L5 fill the other three
quadrants.

---

## Part 5: Consolidated Implementation Priority

### Tier 1: Ship Now (prerequisite for everything)

These are bugs and missing basics. No behavioral science needed.

| # | Feature | Effort | Why First |
|---|---------|--------|-----------|
| QW2 | API Error Handling | 15 min | It's a bug. Fix bugs before building features. |
| QW1 | Edit Habit | 30-40 min | Prerequisite for 8+ features. Users expect it. |
| QW3 | Unarchive | 30-40 min | Archive is currently destructive. Fix the data model before building on it. |

### Tier 2: First Real Features (high impact, low effort)

| # | Feature | Effort | Depends On |
|---|---------|--------|-----------|
| L2 | Completion Momentum | Small | Nothing. Pure frontend, no data model changes. |
| L3 | System Score | Small-Med | Nothing. Pure computation over existing data. |
| L1 | Rhythm Detection | Small | Nothing. Needs 3+ weeks of data. |

### Tier 3: Behavioral Intelligence

| # | Feature | Effort | Depends On |
|---|---------|--------|-----------|
| L4 | Slump Radar | Small | 14+ days of data. |
| L5 | Effort Autopilot | Medium | Edit Habit (QW1). |
| K3 | Habit DNA (v7) | Small | Nothing. Pure SVG over existing data. |
| K5 | Pause Protocol (v7) | Small-Med | Edit Habit (QW1). |

### Tier 4: Depth Features (from v6-v7, best of the backlog)

| # | Feature | Effort | Depends On |
|---|---------|--------|-----------|
| K2 | Ripple Effects (v7) | Small | Nothing. |
| K4 | Recovery Velocity (v7) | Small | 60+ days of data with breaks. |
| K1 | Life Chapters (v7) | Small-Med | Nothing, but benefits from existing features. |

### Features Not Prioritized (park, don't delete)

| Feature | Reasoning |
|---------|-----------|
| Living Garden View | High effort, purely cosmetic. Ship after core features exist. |
| Habit Stacking / Chains | Medium effort, new data model. Ship after edit + unarchive are solid. |
| Weekly Compass | Nice-to-have. No other feature depends on it. |
| Data Export | Important but not urgent until users have meaningful data. |
| PWA / Offline | Large effort. Ship when the app is worth using offline. |
| Narrative Milestones | Needs months of data. Ship in v2. |
| Seasonal Rhythms | Cosmetic. Low priority. |

---

## Part 6: The Next 3 Implementation Sessions

Concrete. No phases. No sprints. Just what to code.

**Session 1: Fix the Bugs + Edit (QW1, QW2, QW3)**
- [ ] Add `if (!res.ok)` checks to all 5 functions in `api.ts`
- [ ] Add `PUT /api/habits/:id` endpoint in `server/app.js`
- [ ] Add `POST /api/habits/:id/unarchive` endpoint
- [ ] Add inline edit toggle in `HabitRow`
- [ ] Add collapsed "Archived" section below main table
- [ ] Return `activeHabits` and `archivedHabits` from `useHabits`

**Session 2: Momentum + System Score (L2, L3)**
- [ ] Add today's completion count to header: "3 of 7 done"
- [ ] Add dot-progress indicator component
- [ ] Add "Perfect Day" detection and counter
- [ ] Compute System Score (4 components, weighted average)
- [ ] Display score in header with directional arrow

**Session 3: Rhythm Detection (L1)**
- [ ] Utility: group log dates by day-of-week per habit
- [ ] Compute completion rate per weekday per habit
- [ ] Habit detail view (expand row on click)
- [ ] 7-bar rhythm chart in detail view
- [ ] One-line insight when coefficient of variation > 0.3

---

## Part 7: Feature-Feature Interaction Map

How the L-features enhance each other and connect to the best v6/v7
features:

```
L1 Rhythm Detection
  ├── enhances → Ritual Windows (H6): day + time = full temporal picture
  └── feeds into → Slump Radar (L4): weekday patterns help distinguish
                    "normal weekend dip" from "actual slump"

L2 Completion Momentum
  ├── enhances → Quick Pulse (H1): momentum dots are the natural header
  │              for the pulse check-in view
  ├── enhances → Completion Sparks (N8): sparks fire on each momentum
  │              step, not just individual completions
  └── feeds into → System Score (L3): Perfect Day count is a component

L3 System Score
  ├── enhances → Soft Landing (H3): show score change during absence
  │              ("Your score dropped from 78 to 45 while you were away")
  └── feeds into → Slump Radar (L4): rapid score decline is a slump signal

L4 Slump Radar
  ├── enhances → Daily Calibration (N3): auto-trigger low-energy mode
  └── feeds into → Effort Autopilot (L5): system-wide slump may trigger
                    multiple habit downshifts

L5 Effort Autopilot
  ├── enhances → Recovery Velocity (K4): downshifted habit may recover
  │              faster, improving recovery velocity
  └── feeds into → Lifecycle Stages (J2): downshift could reset a habit
                    to "Seedling" stage
```

---

## Part 8: Reasoning Behind the Tier Ordering

### Why Quick Wins come first (Tier 1)

The codebase has two bugs (silent API failures, irreversible archive) and
one missing fundamental (edit). Building behavioral intelligence features
on a foundation with silent data corruption is engineering malpractice.
Fix the foundation first.

Also: shipping QW1-QW3 would be the first time this project ships ANY
feature after the initial implementation. The psychological impact of
breaking the 0-feature drought matters as much as the features themselves.

### Why Momentum and System Score come second (Tier 2)

L2 (Completion Momentum) and L3 (System Score) are the highest-impact,
lowest-effort features in the entire backlog because:

1. **Zero backend changes.** Both are pure frontend computations over
   existing data. No new endpoints, no data model changes, no migration.

2. **Visible immediately.** Both appear in the header area, so every user
   sees them on every visit. Unlike features that require specific
   conditions (breaks, slumps, 60 days of data), these work from day 1.

3. **They change the app's identity.** The current app is a check-in
   grid. Adding momentum and a system score transforms it from "a table
   where I check boxes" to "a system that understands my habits." That's
   the value proposition shift the app needs.

### Why Rhythm Detection comes third (Tier 2, session 3)

L1 requires 3+ weeks of data to produce meaningful patterns, so it
ships slightly later than L2/L3. But it's still Tier 2 because it's
purely frontend, requires no new data model, and provides the kind of
insight that makes users say "I didn't know that about myself." That
discovery moment is the hook that converts a casual user into a
committed one.

### Why Slump Radar and Effort Autopilot are Tier 3

Both require accumulated data (14+ days for slump detection, enough
failure history for downshift triggers). They also benefit from Tier 1-2
features existing: Slump Radar's "Take it easy" action benefits from
Daily Calibration, and Effort Autopilot requires Edit Habit.

---

## Part 9: What's Different About This Document

Every prior document (v3-v7) ended with some version of "stop planning,
start coding." This document doesn't pretend to be different — it IS
another planning document. But it differs in three structural ways:

1. **Quick Wins.** No prior document identified tiny, shippable fixes
   as distinct from behavioral science features. The implicit assumption
   was always "we need to design something clever first." QW1-QW3 need
   no design — they need 90 minutes of coding.

2. **Session-level granularity.** Prior documents used phases and sprints.
   This document uses sessions with checklists. A session is 1-2 hours.
   You can finish one tonight.

3. **No more than 3 sessions planned.** After Session 3, the backlog
   exists but the plan doesn't prescribe the order. Pick what's
   interesting. Ship it. Repeat. The era of 30-item roadmaps is over.
