# Habit Garden — Feature Plan v3

> Supersedes all prior planning documents (FEATURES.md, NEW_FEATURES.md,
> FEATURE_PROPOSALS.md, BACKLOG.md, FEATURE_PLAN.md). Single source of truth.

---

## 1. Current State

**Shipped (MVP):** Habit CRUD, daily/weekly toggle, 14-day grid, streaks,
dark theme, optimistic updates, toasts, JSON persistence with mutex,
17 backend tests. ~960 lines of source across React + Express.

**Tech stack:** React 19 + TypeScript + Vite (frontend), Express + JSON
file storage (backend). No database. No auth. Single-user.

**Prior planning:** 5 documents containing 55+ proposals. Each successive
doc critiques the previous ones, proposes new features, and attempts to
consolidate — but the net result is 5 overlapping docs with conflicting
priorities. This document replaces all of them.

---

## 2. Audit: What 55+ Prior Proposals All Miss

Each prior doc identified gaps in earlier docs. But across ALL documents
combined, these dimensions remain completely unaddressed:

| Blind Spot | Why It Matters |
|------------|----------------|
| **The Return Experience** | What happens when a user hasn't opened the app in 2+ weeks? No feature handles re-engagement after absence. Failure Recovery (F4) handles a streak breaking *while the user is active*. But the #1 cause of permanent churn is the guilt of returning after absence. |
| **Systemic Overload Detection** | Individual habit features (Health Score, Decay Warnings, Sunset Prompts) treat each habit in isolation. But when 4 habits decline simultaneously, the problem isn't 4 individual failures — it's *system overload*. No feature detects or responds to portfolio-level decline. |
| **Resource Competition Model** | Correlation Map (N5) detects statistical co-occurrence. It can't explain *why* habits interact. Habits compete for finite resources (time, energy, willpower). Modeling this explains which habit pairs are sustainable and which will cannibalize each other. |
| **Confidence Calibration** | Users create habits with zero self-assessment. No feature asks "How confident are you that you can do this?" — which self-efficacy research (Bandura) shows is the strongest predictor of actual follow-through. |
| **Stealth/Anxiety-Free Mode** | Every feature adds *more* metrics, more visualizations, more data. But for some users, metric-watching creates performance anxiety that undermines the behavior. No feature offers *less* information as a deliberate choice. |
| **The Narrative Arc** | Reports (#9) show charts. Snapshots (P7) show comparisons. Insights (F8) detect patterns. But none tell the *story* of a user's habit journey as a human-readable narrative. |
| **Delayed Reward Visibility** | The Habit Loop covers cue and routine — but the *reward* for most habits is invisible and delayed. Exercise today doesn't feel better today; it feels better *tomorrow*. No feature connects today's effort to tomorrow's benefit. |
| **Selective Freezing** | Vacation Mode (F1) pauses one habit. Quiet Mode doesn't exist. There's no way to say "I'm in exam week — freeze everything except Study and Sleep" without archiving (which destroys state). |

---

## 3. New Feature Proposals

Eight features targeting the 8 blind spots above. Each is implementable
without external APIs, AI, or breaking schema changes.

---

### D1: Comeback Engine (Re-engagement After Absence)

**What:** When a user opens the app after 3+ days of inactivity, replace
the normal dashboard with a tailored re-engagement screen:

**Phase 1 (Day 1 back):**
> "Welcome back! You've been away 12 days. That's fine — let's ease in.
> Here are your 3 most important habits. Just do one today."

- Show only MVD habits (or top 3 by streak length if MVD isn't set)
- Hide all broken streak counts — show them as "Paused"
- Single large CTA: "Start with [habit name]"

**Phase 2 (Day 2-3 back):**
> "Day 2 back. Yesterday you did [Meditation]. Today, try adding one
> more."

- Gradually reveal more habits (add 2-3 per day)
- Show recovery progress: "Back on track: 2/7 habits active"

**Phase 3 (Day 4+ back):**
- Full dashboard restored
- Brief summary: "Recovery complete. You reactivated 7 habits in 4 days."
- Broken streaks now visible with Failure Recovery framing

**Why this fills a real gap:**
Every existing feature assumes the user is *actively using the app*.
But real-world usage has gaps — vacations, illness, life events. The
moment of return is the highest-leverage moment for retention: a user
who comes back and sees 6 broken streaks + a wall of red will close the
app and never return. A user who sees "Welcome back, start with one
thing" will stay.

This is based on app retention research: re-engagement UX has 3-5x more
impact on long-term retention than any in-session feature. Duolingo,
Headspace, and Strava all have dedicated return flows for this reason.

**Implementation:**
- Frontend: `<ComebackScreen />` component shown when `daysSinceLastVisit > 3`
- Storage: `lastVisitDate` in localStorage, updated on each app open
- Frontend: Progressive habit reveal over 3 sessions (state in localStorage)
- No backend changes — uses existing habits + logs

**Effort:** Low-Medium | **Dependencies:** Enhanced by MVD (P10)

---

### D2: System Health Monitor (Portfolio-Level Overload Detection)

**What:** Track overall completion rate with a 7-day rolling average. When
the rate drops below a configurable threshold (default 60%) for 3+
consecutive days, surface a rebalancing prompt:

> "Your overall completion dropped from 87% to 54% this week. That
> usually means your habit load is too high — not that you're failing.
>
> Suggestions:
> - Pause your lowest-priority habit for 2 weeks
> - Switch [Exercise daily] to 3x/week
> - Activate a 3-day rest period"

Also show a "System Load" indicator in the header — a simple gauge
(green/amber/red) reflecting the gap between active habits and recent
completion capacity.

**Why this fills a real gap:**
Decay Warnings (P2), Sunset Prompts (F14), and Health Alerts all operate
on individual habits. If one habit declines, they respond. But when 4
habits decline together, the problem is *systemic* — the user is
overcommitted, stressed, or going through a life change. Responding
habit-by-habit (4 separate warnings) is noise. Responding at the
portfolio level ("your load is too high") is signal.

This is the difference between a doctor treating symptoms (individual
fevers) and diagnosing the illness (an infection). System Health Monitor
is the diagnostic layer.

**Implementation:**
- Utils: `calculateSystemHealth(habits, logs, days)` — 7-day rolling
  completion rate across all active habits
- Frontend: `<SystemHealthIndicator />` in header (gauge or traffic light)
- Frontend: `<RebalancePrompt />` triggered when 3+ consecutive days below threshold
- Storage: Threshold preference in localStorage (default 60%)
- No backend changes

**Effort:** Low | **Dependencies:** None

---

### D3: Habit Resource Map (Competition Model)

**What:** Each habit has three optional resource costs (1-5 scale):

| Resource | What It Measures | Example |
|----------|-----------------|---------|
| **Time** | Duration commitment | 30-min workout = 4, drink water = 1 |
| **Energy** | Physical/mental effort | Cold shower = 5, read 10 pages = 2 |
| **Willpower** | Resistance to start | Exercise = 4, enjoyable hobby = 1 |

The Resource Map shows:
- **Daily resource budget**: Total Time/Energy/Willpower allocated
- **Competition pairs**: Habits sharing the same high-cost resource
  ("Exercise and Cold Shower both cost 4+ willpower — they compete")
- **Sustainable pairs**: Habits with complementary costs ("Exercise
  [high energy, low willpower] + Meditation [low energy, high willpower]
  — they don't compete for the same resource")

**Why this fills a real gap:**
Correlation Map (N5) tells you "Exercise and Healthy Eating co-occur
87% of the time" but not *why*. Time Budgeting (N8) counts minutes but
ignores that a 5-minute cold shower costs more than a 30-minute walk.
Difficulty Tiers (P1) collapse three dimensions into one number.

The Resource Map models the *underlying mechanism* of habit interaction.
It explains why some habit combinations work and others don't — and it
does so *before* the user has 30 days of data (which Correlation needs).

**Implementation:**
- Schema: Add `resourceCosts: { time: 1-5, energy: 1-5, willpower: 1-5 } | null`
  to Habit (optional, with sensible defaults)
- Frontend: Resource sliders in HabitForm (optional section, collapsed by default)
- Frontend: `<ResourceMap />` dashboard widget showing daily totals
  per resource and flagging competition pairs
- No new endpoints — persisted with existing habit data

**Effort:** Medium | **Dependencies:** None (enhanced by Compatibility Advisor C6)

---

### D4: Confidence Calibration

**What:** When creating a habit, ask one question:

> "How confident are you (1-10) that you can do this for 30 days?"

If confidence < 7, show a gentle suggestion:
> "Research shows that confidence below 7 predicts dropout. Try making
> it easier: [Exercise daily → Exercise 3x/week] or [Run 30 min →
> Run 10 min]."

After 30 days, compare predicted vs. actual:
> "You rated your confidence 6/10. You completed 91%. You underestimated
> yourself!" (builds self-efficacy)

Or:
> "You rated your confidence 9/10. You completed 45%. What got in the
> way? [structured reflection]" (calibrates future predictions)

Over time, track calibration accuracy:
> "Your confidence predictions are 78% accurate. You tend to
> overestimate by 1.5 points on high-difficulty habits."

**Why this fills a real gap:**
Self-efficacy (Bandura, 1977) is the single strongest predictor of
behavior change — stronger than motivation, streaks, or social
accountability. No existing feature measures or develops it.

The pre-commitment question also creates a psychological contract.
A user who says "8 out of 10" has made a public (to themselves)
prediction, which research shows increases follow-through by 20-30%.

The calibration feedback loop is unique: it makes users *better at
predicting their own behavior*, which is a meta-skill that improves
all future habit creation.

**Implementation:**
- Schema: Add `confidence: number | null` and `confidenceDate: string | null`
  to Habit
- Frontend: Confidence slider in HabitForm (1-10, with emoji scale)
- Frontend: 30-day milestone notification comparing prediction vs. actual
- Storage: `calibrationHistory` in localStorage (predicted vs. actual pairs)
- Frontend: `<CalibrationScore />` widget showing accuracy trend
- Backend: Persist confidence with habit

**Effort:** Low-Medium | **Dependencies:** None

---

### D5: Focus Mode (Anxiety-Free Tracking)

**What:** A toggle (in settings or header) that hides ALL metrics:

**Normal Mode:**
> Meditation | Streak: 34 days | Health: 92 | [14-day grid with checks]

**Focus Mode:**
> Meditation | [single large checkbox for today]

No streaks. No health scores. No history grid. No completion rates.
No decline warnings. Just: "Did you do it today? Yes/No."

Everything still records normally — the user can switch back to full
mode anytime and see all their data. Focus Mode is a *view filter*,
not a data change.

**Why this fills a real gap:**
Every single feature in all 5 planning documents adds *more*
information to the UI. This is the first feature that deliberately
shows *less*. And for good reason:

Metric-watching creates two failure modes:
1. **Performance anxiety** — "My health score is 78, it was 85 last
   week, I'm declining" → stress → avoidance → stop opening the app
2. **The what-the-hell effect** — "My streak broke, everything is
   ruined" → give up entirely

Focus Mode breaks this cycle. It turns the app from an *evaluation
tool* ("how am I doing?") into a pure *action tool* ("what should I
do now?"). Some days, not knowing your streak is healthier than knowing.

This pairs with Today View (N1) but is philosophically different: Today
View simplifies *which habits* you see. Focus Mode simplifies *what you
see about each habit*.

**Implementation:**
- Storage: `focusMode: boolean` in localStorage
- Frontend: Toggle in header/settings
- Frontend: Conditional rendering in HabitRow — hide streak, health, grid
  when focus mode is active. Show only habit name + today's toggle.
- Reuses existing HabitRow component (conditional CSS/render)
- No backend changes

**Effort:** Low | **Dependencies:** None

---

### D6: Progress Narrative

**What:** A "My Story" section that generates a human-readable narrative
of the user's habit journey from their data:

> "You started Habit Garden on March 15 with 2 habits: Exercise and
> Meditation. For the first two weeks, you were 100% consistent.
>
> On March 28, you added Reading and Journaling. Your consistency
> dipped to 75% that week as you adjusted to the new load — then
> recovered to 88% by April 5.
>
> April 12 was your toughest day — you completed 0 of 4 habits. But
> you bounced back the next day and haven't missed a full day since.
>
> Your longest streak is Meditation at 45 days. Exercise had a rough
> patch in late April (3 misses in 5 days) but you've since rebuilt
> it to 12 days.
>
> Today you track 4 habits with an average health of 85%. Your most
> consistent day is Tuesday (96%). Your weakest is Sunday (62%)."

**Why this fills a real gap:**
Reports show charts. Insights detect patterns. Snapshots compare
months. But none of these tell a *story*. Humans remember stories,
not data points. A narrative creates emotional connection to progress
that no chart can match.

The narrative also surfaces things that charts hide: the sequence of
events, the cause-and-effect relationships, the resilience moments.
"You bounced back the next day" is more motivating than any green bar.

**Implementation:**
- Utils: `generateNarrative(habits, logs)` — template-based text
  generation (no AI needed). Identifies key events:
  - First habit date, habit additions/removals
  - Streak records and breaks
  - Consistency trend changes
  - Best/worst days and weeks
  - Day-of-week patterns
- Frontend: `<MyStory />` page/modal, regenerated on each view
- Output: ~200-400 words of structured narrative
- No backend changes

**Effort:** Medium | **Dependencies:** Better with 30+ days of data

---

### D7: Habit Echo (Delayed Reward Visibility)

**What:** An optional end-of-day micro-check-in (1 minute, 2 questions):

> 1. "Rate your day: energy (1-5), mood (1-5)"
> 2. "What helped most today?" → auto-suggest yesterday's completed habits

After 2+ weeks, surface delayed-reward connections:

> "On days after you Exercise, your energy averages 4.1 (vs. 3.2 on
> days after you skip). Exercise has a +0.9 energy echo."
>
> "On days after you Read before bed, your mood averages 3.8 (vs. 3.3).
> Reading has a +0.5 mood echo."

Show "echo scores" as small badges on each habit: `Exercise +0.9E`
(+0.9 energy next day).

**Why this fills a real gap:**
Mood & Energy Correlation (F6) was cut for requiring daily mood logging.
Habit Echo is different in two critical ways:

1. **It measures *delayed* effects** — not "mood when you exercise" but
   "mood the day *after* you exercise." This is the actual reward loop
   for most habits: exercise doesn't feel good during; it feels good after.
2. **The check-in is 15 seconds** — just two taps (energy + mood on a
   5-point scale). No freeform journaling. No separate "mood tracker"
   section. It's a quick pulse embedded in the existing daily flow.

The echo score makes invisible rewards visible. "I don't feel like
exercising" is countered by concrete data: "But every time you do,
you feel 0.9 points better tomorrow." That's not an abstract belief —
it's your own measured experience.

**Why this isn't just Mood Correlation (F6) renamed:**
F6 proposes a separate mood tracker with elaborate correlation analysis.
Echo is narrower and more focused: (1) it only measures delayed effects
(next-day), not same-day; (2) the check-in is two taps, not a separate
workflow; (3) it produces a single actionable number per habit (the
echo score), not a page of charts.

**Implementation:**
- Schema: New `dailyPulse` array: `{ date, energy: 1-5, mood: 1-5 }`
- Backend: `POST /api/pulse` (create), `GET /api/pulse?days=30` (read)
- Frontend: `<DailyPulse />` — small widget shown once daily (dismissable)
- Utils: `calculateEchoScores(habits, logs, pulses)` — compare avg
  energy/mood on days following completion vs. non-completion
- Frontend: Echo badge on HabitRow (e.g., `+0.9E +0.5M`)
- Needs 14+ days of pulse data to show meaningful results

**Effort:** Medium | **Dependencies:** None

---

### D8: Habit Freeze (Selective Pause Without Archiving)

**What:** Individual habits can be "frozen" — visible but not tracked:

**Active habit:** Full row, streak counting, part of completion rate
**Frozen habit:** Grayed-out row, streak paused (not broken), excluded
from completion rate, no decay warnings, "Frozen" badge

Freeze reasons (optional): `Exam week` | `Injury` | `Traveling` |
`Seasonal` | `Taking a break` | `Other`

Freeze can be indefinite or time-limited ("Freeze for 7 days" →
auto-unfreezes). When unfreezing, streak resumes from where it was:

> "Exercise was frozen for 12 days. Streak resumed at 23 days."

**Bulk freeze:** "Freeze all except..." — select 2-3 habits to keep
active, freeze everything else. For exam week, sick days, etc.

**Why this fills a real gap:**
Current options for "I need a break from this habit" are:
- **Archive** → Habit disappears. Can be restored (G2) but loses streak.
- **Vacation Mode (F1)** → Streak shields / date ranges, but the habit
  still appears active and counts in completion rates.
- **Just don't do it** → Streak breaks, health score drops, decay
  warnings fire. The app *punishes* a conscious, healthy decision.

Freeze is the missing middle ground: "I'm not doing this right now, and
that's OK. Don't penalize me, but keep my place." It's like pausing a
game vs. quitting.

The bulk freeze is particularly valuable for life events (illness, travel,
exams) where the right answer is "focus on 2-3 essentials, pause
everything else" — exactly the MVD (P10) philosophy applied as a
system-level action.

**Implementation:**
- Schema: Add `frozen: boolean`, `frozenAt: string | null`,
  `frozenUntil: string | null` to Habit
- Backend: `POST /api/habits/:id/freeze` (with optional `until` date)
- Backend: `POST /api/habits/:id/unfreeze`
- Backend: Auto-unfreeze check on app load (if `frozenUntil` has passed)
- Frontend: Freeze/unfreeze buttons in row actions
- Frontend: Grayed-out visual treatment for frozen habits
- Frontend: Bulk freeze modal ("Freeze all except...")
- Utils: Update streak calculation to skip frozen date ranges
- Utils: Exclude frozen habits from completion rate calculations

**Effort:** Medium | **Dependencies:** None

---

## 4. Validated Features from Prior Documents

After reviewing all 55+ proposals across 5 documents, these survive
the consolidation. Features are kept if they: (a) address a real user
need, (b) don't substantially overlap with another kept feature, and
(c) are implementable within the current architecture.

### Critical UX Gaps (Must-Fix)

| ID | Feature | Source | Why It's Critical |
|----|---------|--------|-------------------|
| G1 | Edit Habit After Creation | BACKLOG | Can't change name, color, or frequency without delete-and-recreate. Data-loss footgun. |
| G2 | View/Restore Archived Habits | BACKLOG | Archived habits vanish. No review, no undo. |
| G3 | Onboarding / Empty State | BACKLOG | New users see "No habits yet" with zero guidance. |
| G4 | Mobile Responsive | BACKLOG | 14-day grid overflows. Day cells too small for touch. |

### Validated Existing Proposals

| ID | Feature | Source | One-Line Justification |
|----|---------|--------|----------------------|
| #1 | Dashboard Stats | FEATURES | Aggregated view answers "Am I on track?" |
| #2 | Categories / Tags | FEATURES | Needed when habits grow past 7+. |
| #3 | Undo Toast | FEATURES | UX standard. Prevents toggle mis-taps. |
| #4 | Data Export (JSON/CSV) | FEATURES | Data ownership. Manual backup. |
| #5 | Heatmap | FEATURES | Most-requested long-term visualization. |
| #8 | Drag & Drop Reorder | FEATURES | Users want control over habit order. |
| #12 | Habit Templates | FEATURES | Reduces new-user friction. |
| #13 | Goals & Milestones | FEATURES | Finite targets are more motivating than open-ended streaks. |
| #14 | Theme Toggle | FEATURES | Light/dark preference. Trivial with CSS vars. |
| F1 | Streak Shields / Vacation | NEW_FEATURES | Proven retention mechanic (Duolingo model). |
| F2 | Habit Health Score | NEW_FEATURES | Consistency metric > binary streak. |
| F3 | Habit Stacking / Routines | NEW_FEATURES | Core Atomic Habits concept. Batch completion. |
| F5 | Smart Rest Days | NEW_FEATURES | Fixes the fundamental frequency model flaw. |
| F11 | Keyboard Shortcuts | NEW_FEATURES | Power-user essential for daily-use app. |
| N2 | Completion Timestamps | BACKLOG | Invisible infra. Unlocks time-of-day analytics. |
| N3 | Momentum Stages | BACKLOG | Habit lifecycle arc (Seedling→Evergreen). |
| N7 | Auto-Backup | BACKLOG | Data protection before data becomes more valuable. |
| P1 | Difficulty Tiers | PROPOSALS | Effort-weighted scoring. Not all habits are equal. |
| P10 | Minimum Viable Day | PROPOSALS | Permission structure for bad days. Reduces abandonment. |
| C1 | Habit Cue Mapping | PLAN | Models the trigger (missing from the Habit Loop). |
| C3 | Habit Autopsy | PLAN | Learn from failure, not just recover from it. |
| C5 | Streak Weather | PLAN | Ambient status without reading numbers. |
| C7 | Ritual Builder | PLAN | Reduces startup friction for complex habits. |
| C8 | Autopilot Detection | PLAN | Graduation for truly automatic habits. |

### Merged Features

| Merged Feature | Absorbs | Reasoning |
|----------------|---------|-----------|
| **F4+N10: Failure Recovery + Personal Records** | F4, N10 | Both address post-streak-break psychology. Personal best + comeback tracking = one dashboard. |
| **N3+P3: Momentum Stages + Identity** | N3, P3 | Both model habit maturity. Identity statements surface at stage transitions. |
| **N1+P4: Smart Daily View** | N1, P4 | Both simplify "what's relevant now." Merged: checklist filtered by time-of-day. |
| **P2+F14: Health Alerts** | P2, F14 | Both are early warnings at different timescales. Unified: at-risk → declining → inactive. |

### Cut or Deferred Indefinitely

| ID | Feature | Verdict | Reasoning |
|----|---------|---------|-----------|
| F6 | Mood & Energy Correlation | Replaced by D7 | Echo is lighter (2 taps vs. separate workflow) and measures delayed effects. |
| F7 | Habit Experiments | Defer | Users can mentally frame any habit as a 30-day trial. |
| F9 | Micro-Habits / Partial Completion | Defer | Breaking schema change. Ritual Builder (C7) addresses the same anxiety. |
| F10 | Weekly Review Wizard | Defer | Valuable but heavy. Comeback Engine (D1) + Autopsy (C3) cover the reflection need. |
| F12 | iCal Export | Defer | Niche. |
| F15 | Import from Trackers | Defer | No users to import yet. |
| N4 | Streak DNA | Defer | Nice visualization but lower priority than functional features. |
| N5 | Correlation Map | Replaced by D3 | Resource Map explains *why* habits interact, not just *that* they do. |
| N6 | Adaptive Scaling | Defer | Interesting but depends on many other features. |
| N8 | Time Budgeting | Replaced by D3 | Resource Map is a superset (time + energy + willpower). |
| N9 | Natural Language Input | Cut | Regex parsers for NL create more frustration than forms. |
| P5 | Habit Chains | Cut | Cue Mapping (C1) + Stacking (F3) cover this more simply. |
| P7 | Time Capsule Snapshots | Defer | Needs months of data. D6 (Narrative) delivers the same insight sooner. |
| P8 | Anti-Habit Tracking | Defer | New use case. Not critical path. |
| P9 | Power Hours | Defer | Blocked by Timestamps (N2) + data accumulation. |
| C2 | "Why I Started" Capsule | Merged into C1 | Cue + Motivation can be one expanded field per habit. |
| C4 | Progress Proof Gallery | Defer | Medium effort, niche audience. Habit Notes (#6) is simpler. |
| C6 | Compatibility Advisor | Replaced by D2+D3 | System Health Monitor + Resource Map provide better decision support. |
| #6 | Habit Notes | Defer | Lower priority than structural features. |
| #7 | Reminders | Defer | Browser notifications get denied. Health Alerts (P2+F14) are passive. |
| #9 | Reports Page | Defer | D6 (Narrative) delivers insight without building a chart library. |
| #10 | Authentication | Defer | Single-user app. |
| #11 | Database Migration | Defer | JSON works until auth is needed. |
| #15 | PWA / Offline | Defer | Large effort. Ship when targeting mobile. |
| #16 | Social / Accountability | Defer | Requires auth. |

---

## 5. Unified Backlog (32 Features, 6 Sprints)

**Scoring:** Impact (1-5) x Effort Inverse (5=trivial, 1=huge).
Dependency chains break ties.

### Sprint 1: Fix the Foundation (Week 1-2)

**Goal:** Eliminate embarrassing UX gaps. Zero schema changes. Zero deps.

| # | Feature | Type | Effort | Impact |
|---|---------|------|--------|--------|
| 1 | G1: Edit Habit | UX Gap | Small | Critical |
| 2 | G2: View/Restore Archived | UX Gap | Small | Critical |
| 3 | G3: Onboarding / Empty State | UX Gap | Small | Critical |
| 4 | #3: Undo Toast | UX Standard | Small | High |
| 5 | N7: Auto-Backup | Safety | Small | High |
| 6 | #14: Theme Toggle | Polish | Small | Medium |

**Why this order:** You can't retain users who can't edit habits or
recover archived ones. Undo is table-stakes UX. Auto-backup protects
data before we make it more valuable. Theme toggle is trivial polish.

**Deliverable:** The app is no longer embarrassingly incomplete. Data is
protected. The basics work properly.

---

### Sprint 2: Motivation & Resilience (Week 3-4)

**Goal:** Replace fragile streak-only motivation with a forgiving,
multi-dimensional system. All frontend-only.

| # | Feature | Type | Effort | Impact |
|---|---------|------|--------|--------|
| 7 | F2: Health Score | Core | Low | Very High |
| 8 | F4+N10: Failure Recovery + Records | Core | Low | Very High |
| 9 | N3+P3: Momentum Stages + Identity | Core | Low-Med | High |
| 10 | P2+F14: Health Alerts | Core | Low | High |
| 11 | P10: Minimum Viable Day | Core | Low | High |
| 12 | **D5: Focus Mode** | **New** | **Low** | **High** |

**Why Focus Mode here:** It's the philosophical counterbalance to all
the metrics we just added. Users who feel overwhelmed by Health Scores,
Momentum Stages, and Alerts can toggle Focus Mode and see only checkboxes.
Offering *more* and *less* in the same sprint shows respect for different
user psychologies.

**Deliverable:** Motivation system is resilient, forgiving, and has an
escape hatch for metric-anxious users.

---

### Sprint 3: Data Model & Daily Experience (Week 5-7)

**Goal:** Schema investments that unlock future features + optimize the
daily check-in.

| # | Feature | Type | Effort | Impact |
|---|---------|------|--------|--------|
| 13 | N2: Completion Timestamps | Infra | Medium | High (future) |
| 14 | F5: Smart Rest Days | Core | Medium | Very High |
| 15 | N1+P4: Smart Daily View | Core | Medium | High |
| 16 | C1: Habit Cue Mapping | New | Low | Medium |
| 17 | #1: Dashboard Stats | Core | Low | High |
| 18 | #4: Data Export | Core | Low | High |
| 19 | G4: Mobile Responsive | UX Gap | Medium | High |
| 20 | **D4: Confidence Calibration** | **New** | **Low-Med** | **High** |

**Why Confidence here:** It's a schema addition that should ship alongside
other schema changes. Adding it later means existing habits have no
confidence data. Including it now means every habit created going forward
has a confidence prediction to validate at 30 days.

**Deliverable:** The data model supports real scheduling, the daily view
is optimized, and we're capturing confidence + cue data from day one.

---

### Sprint 4: Engagement & Organization (Week 8-10)

**Goal:** Visualizations, grouping, and organizational tools.

| # | Feature | Type | Effort | Impact |
|---|---------|------|--------|--------|
| 21 | #5: Heatmap | Visualization | Medium | High |
| 22 | F3: Habit Stacking / Routines | Core | Medium | High |
| 23 | F1: Streak Shields / Vacation | Core | Medium | High |
| 24 | P1: Difficulty Tiers | Enhancement | Low | Medium |
| 25 | C7: Ritual Builder | New | Medium | Medium |
| 26 | #8: Drag & Drop Reorder | UX | Medium | Medium |
| 27 | F11: Keyboard Shortcuts | UX | Low-Med | Medium |
| 28 | **D8: Habit Freeze** | **New** | **Medium** | **High** |

**Why Freeze here:** By Sprint 4, users have enough habits to need
selective pausing. Freeze complements Streak Shields (same sprint) —
Shields handle single-day misses, Freeze handles multi-day pauses.
Together they form a complete "life happens" toolkit.

**Deliverable:** Rich organizational tools. Habits have difficulty,
sub-steps, routines, visual history, and flexible pause options.

---

### Sprint 5: Intelligence & Reflection (Week 11-13)

**Goal:** Make accumulated data useful. Surface patterns and stories.

| # | Feature | Type | Effort | Impact |
|---|---------|------|--------|--------|
| 29 | **D6: Progress Narrative** | **New** | **Medium** | **High** |
| 30 | C3: Habit Autopsy | New | Medium | High |
| 31 | **D7: Habit Echo** | **New** | **Medium** | **High** |
| 32 | C5: Streak Weather | New | Low-Med | Medium |
| 33 | **D3: Habit Resource Map** | **New** | **Medium** | **Medium** |
| 34 | #13: Goals & Milestones | Core | Medium | Medium |

**Why Narrative + Echo here:** By Sprint 5, users have 2-3 months of
data — enough for the narrative to be meaningful and for echo scores
to be statistically useful. Both features are "data payoff" — they
reward users for months of consistent tracking with insights they
couldn't get any other way.

**Deliverable:** The app tells your story, reveals hidden reward loops,
and learns from your failures.

---

### Sprint 6: Growth & Polish (Week 14+)

**Goal:** Features for mature usage and long-term engagement.

| # | Feature | Type | Effort | Impact |
|---|---------|------|--------|--------|
| 35 | **D1: Comeback Engine** | **New** | **Low-Med** | **Very High** |
| 36 | **D2: System Health Monitor** | **New** | **Low** | **High** |
| 37 | C8: Autopilot Detection | New | Low-Med | Medium |
| 38 | #12: Habit Templates | Polish | Small | Medium |
| 39 | #2: Categories / Tags | Organization | Medium | Medium |

**Why Comeback Engine in Sprint 6, not Sprint 1:** It needs other
features to exist (MVD, Focus Mode, Health Alerts) to construct a
good re-engagement experience. It also needs users to have *left and
returned* — which is more likely after months of use. But its impact
on retention is very high, so it's a Sprint 6 must-do.

**Deliverable:** The app handles absence gracefully, detects systemic
issues, and graduates mature habits.

---

## 6. New Feature Reasoning Summary

| Feature | Blind Spot It Fills | Why 55+ Prior Proposals Missed It |
|---------|--------------------|---------------------------------|
| **D1: Comeback Engine** | Return after absence | All features assume active daily use. Real users have gaps. |
| **D2: System Health Monitor** | Portfolio-level overload | All warnings/alerts operate per-habit. Systemic decline needs a systemic response. |
| **D3: Habit Resource Map** | Why habits compete | Correlation detects co-occurrence. Resource Map explains the mechanism (time/energy/willpower competition). |
| **D4: Confidence Calibration** | Self-efficacy measurement | Strongest predictor of behavior change. Zero features measure or develop it. |
| **D5: Focus Mode** | Metric anxiety | Every feature adds information. Some users need less. First feature that deliberately hides data. |
| **D6: Progress Narrative** | The story of your journey | Reports show charts, insights detect patterns. Neither tells a human story. |
| **D7: Habit Echo** | Delayed reward visibility | Habits reward tomorrow, not today. No feature connects today's effort to tomorrow's benefit. |
| **D8: Habit Freeze** | Selective pause without penalty | Archive destroys state. Vacation Mode is per-day. No way to say "pause this for a week" without consequences. |

---

## 7. Architecture Notes

### Schema Changes by Sprint

| Sprint | Schema Additions |
|--------|-----------------|
| 1 | None |
| 2 | `isMVD: boolean` on Habit |
| 3 | `confidence: number`, `cue: string`, `completedAt` in log entries, frequency model change |
| 4 | `difficulty: 1-5`, `ritual: string[]`, `frozen: boolean`, `frozenAt/Until: string` |
| 5 | `dailyPulse` collection, `autopsies` collection, `resourceCosts` on Habit |
| 6 | No new schema (Comeback uses localStorage, System Health is derived) |

### Principles

| Principle | Rationale |
|-----------|-----------|
| No AI/ML | Deterministic logic is explainable, fast, and free of API costs. |
| No external dependencies for core features | The app should work offline-capable. |
| Opt-in complexity | Every feature is optional. Progressive disclosure. |
| Frontend-first | Most features compute derived state from existing data. |
| Protect data before enriching it | Auto-backup (Sprint 1) before analytics (Sprint 5). |
| Offer both more AND less | Focus Mode balances the information density of other features. |

---

## 8. Decision Log

| Decision | Rationale |
|----------|-----------|
| Consolidate 5 docs into 1 | Five overlapping docs with conflicting priorities is unusable. One source of truth. |
| Cut count from 55+ to 32 active | A realistic backlog is more useful than an aspirational one. |
| 4 feature merges | Failure Recovery+Records, Momentum+Identity, Today+Contextual, Decay+Sunset are natural pairs. |
| Add Focus Mode in motivation sprint | The sprint adds 5 new metrics. Offering an "off switch" respects different user psychologies. |
| Comeback Engine in Sprint 6, not 1 | Needs MVD, Focus Mode, and Health Alerts to construct a good return experience. |
| Resource Map replaces Time Budgeting + Correlation Map | Three-axis resource model (time/energy/willpower) is a superset of both. |
| Habit Echo replaces Mood Correlation | Lighter (2 taps), measures delayed effects, produces one actionable number per habit. |
| Progress Narrative replaces Reports Page + Snapshots | Stories > charts for emotional connection. Can always add charts later. |
| Confidence Calibration in Sprint 3 with other schema changes | Batch schema additions. Data captured from day one is more valuable than data captured later. |
| Freeze in Sprint 4 with Streak Shields | Together they form a complete "life happens" toolkit (single-day shields + multi-day freeze). |
