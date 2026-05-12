# Habit Garden — Implementation Plan

> **The definitive planning document.** Supersedes FEATURES.md, NEW_FEATURES.md,
> FEATURE_PROPOSALS.md, BACKLOG.md, FEATURE_PLAN.md, FEATURE_PLAN_v3.md, and
> ROADMAP.md. Those files are preserved as historical reference only.
>
> Created: 2026-05-12

---

## 1. Honest State of the Project

### What Exists (MVP — ~960 lines of code)

| Layer | What's Shipped |
|-------|---------------|
| **Frontend** | React 19 + TypeScript + Vite. HabitForm, HabitTable, HabitRow components. Optimistic updates with rollback. Toast notifications. Dark theme. 14-day grid with toggle. Streak calculation (daily + weekly). |
| **Backend** | Express + JSON file storage. CRUD for habits. Toggle logs. Archive. Delete. Input validation. Async mutex for concurrent writes. |
| **Tests** | 17 backend integration tests. |

### The Planning Problem

**Seven planning documents** exist containing **65+ proposed features**. Each
document critiques the previous ones, proposes new features, and attempts to
consolidate — producing more overlap. The result:

- **~12,000 words of planning** for **~960 lines of code**
- **Zero features shipped** beyond the original MVP
- **Conflicting priorities** across documents (features ranked differently in each)
- **Significant redundancy** (e.g., Today View / Contextual Check-In / Focus Mode
  all simplify the daily view in slightly different ways)

**The bottleneck is building, not planning.** This document is the last planning
document. After this, the next commit should be code.

---

## 2. New Feature Proposals

These 6 features fill gaps that none of the 65+ prior proposals address. Each
is grounded in behavioral science, practically scoped, and designed to be
built, not discussed.

---

### E1: Flexible Habit Groups (OR-Logic Goals)

**What:** A "goal group" where completing ANY member habit satisfies the
group's daily requirement:

> **Goal: "Move My Body"**
> Members: Running, Swimming, Yoga, Walking
> Rule: Complete at least 1 per day
>
> Monday: Ran → goal satisfied
> Tuesday: Swam → goal satisfied
> Wednesday: Did yoga AND walked → goal satisfied (bonus)
> Thursday: Nothing → goal missed

The group has its own streak and health score. Individual member habits
also track their own stats independently.

**Why no prior proposal covers this:**
Every existing feature models habits as fixed, specific actions. Habit
Stacking (F3) groups habits with AND-logic — do ALL of them. Categories
(#2) organize habits visually but don't change tracking logic. Smart Rest
Days (F5) lets you skip certain days but doesn't offer alternatives.

Real behavioral goals are often flexible: "exercise" doesn't mean the same
activity every day. Forcing a single specific habit ("Run") punishes variety.
A user who swims on Monday and runs on Tuesday has exercised both days, but
the app sees two different habits with streak = 1 each.

OR-logic groups model how goals actually work: the *outcome* matters (moved
body), not the specific *method* (which exercise).

**Why it matters for retention:**
Rigid habit definitions are one of the top reasons users abandon trackers.
"I can't run today because of rain" shouldn't break a fitness streak.
Flexibility inside a goal group keeps the streak alive through variety,
which research shows increases long-term adherence (Kaushal & Rhodes, 2015).

**Implementation:**
- Schema: New `HabitGroup` type: `{ id, name, memberHabitIds: string[], minPerDay: number }`
- Backend: `POST /api/groups`, `PATCH /api/groups/:id`, `DELETE /api/groups/:id`
- Frontend: `<GoalGroup />` component wrapping member habits with shared streak/health
- Utils: `isGroupSatisfied(group, logs, date)` — check if minPerDay members completed
- Member habits can exist independently or only within a group

**Effort:** Medium | **Dependencies:** None

---

### E2: Habit Warm-Up Period (Grace Window for New Habits)

**What:** Every new habit starts with a configurable warm-up period (default:
7 days) where:

- Misses don't break the streak — the streak simply doesn't count yet
- Health score starts at a neutral 50 (not 0 or 100)
- No decay warnings or sunset prompts fire
- The UI shows a "warming up" indicator with a countdown: "Day 3 of 7 warm-up"
- After warm-up ends, tracking begins normally from that point

Users can skip the warm-up ("I'm confident, start tracking now") or extend
it ("I need more time to settle in").

**Why no prior proposal covers this:**
Momentum Stages (N3) labels habits as "Seedling" for 0-7 days, but tracking
and scoring are still active from day 1. Streak Shields (F1) protect
established streaks, not new ones. Confidence Calibration (D4) measures
self-efficacy but doesn't change tracking behavior based on it.

The warm-up period is fundamentally different: it changes the *rules* for
new habits, not just the *labels*. A habit in warm-up literally cannot fail.

**Why it matters:**
The most dangerous moment for a new habit is the first week. Research by
Armitage (2005) shows that 47% of habit attempts fail within 7 days — not
because people lack motivation, but because the new behavior hasn't found
its place in the daily routine yet. During this "placement phase," misses
are *expected* and shouldn't be penalized.

Current behavior: create habit Monday, miss Tuesday, see "Streak: 0" on
Wednesday. Psychologically: "I already failed." The warm-up reframes this:
"You're still finding your rhythm. 4 days of warm-up left."

This also solves the "afraid to add new habits" problem. Power users with
long streaks on existing habits resist adding new ones because a new habit
at 0 days drags down their dashboard stats. A warming-up habit is excluded
from aggregate stats until it's ready.

**Implementation:**
- Schema: Add `warmUpDays: number` to Habit (default 7, 0 = no warm-up)
- Frontend: "Warming up" badge in HabitRow with countdown
- Utils: `isInWarmUp(habit)` — check if `daysSinceCreation < warmUpDays`
- Utils: Exclude warm-up habits from aggregate completion rate, health alerts
- Utils: Streak calculation starts after warm-up period ends
- No new endpoints — warmUpDays persisted with existing habit creation

**Effort:** Low | **Dependencies:** None

---

### E3: Weekly Rhythm Goals (Mini-Streaks with Fresh Starts)

**What:** Instead of (or alongside) infinite streaks, habits can track
**weekly completion goals** with automatic weekly resets:

> **Exercise** — Goal: 4/7 days per week
> This week: ■ ■ ■ □ □ □ □ (3/4 so far — on track!)
> Last week: ■ ■ ■ ■ ■ □ □ (5/4 — exceeded!)
> Weekly streak: 6 weeks meeting goal

The UI shows a compact weekly progress bar that fills as the user completes
the habit each day. At week's end:
- Met goal → weekly streak increments, progress bar resets with a celebration
- Missed goal → weekly streak resets, but individual completions still count

**Why this is different from Smart Rest Days (F5):**
Smart Rest Days defines WHICH days are active (Mon/Wed/Fri). Weekly Rhythm
defines HOW MANY days, without specifying which. "Exercise 4x/week" means
any 4 days. This is more forgiving and more realistic — real schedules shift
week to week.

**Why this is different from Health Score (F2):**
Health Score is a rolling 30-day percentage that never resets. Weekly Rhythm
gives a fresh start every Monday. This is psychologically powerful: a bad
week doesn't contaminate the next month of your health score. You always
have a clean slate 7 days away.

**Why it matters:**
Infinite streaks create escalating anxiety — the longer the streak, the more
devastating the break. Weekly goals create a sustainable rhythm: ambitious
enough to build the habit, forgiving enough to survive real life. The weekly
reset is the key insight — it means every Monday is a fresh start, which
prevents the "what-the-hell effect" from a single bad day cascading into
a bad month.

The "weekly streak" (consecutive weeks meeting goal) provides the long-term
progression that infinite daily streaks offer, but with built-in resilience.
Missing one day doesn't break it — only missing the weekly target does.

**Implementation:**
- Schema: Extend frequency model: `{ type: 'daily' | 'weekly' | 'rhythm', timesPerWeek?: number }`
- Frontend: `<WeeklyRhythm />` progress bar component (7 segments, filled by completion)
- Frontend: Weekly celebration animation when goal is met
- Utils: `calculateWeeklyRhythm(logs, timesPerWeek, today)` — current week progress + weekly streak
- Utils: `getWeekBoundaries(today)` — Monday-to-Sunday week calculation
- Backend: Accept new frequency type

**Effort:** Medium | **Dependencies:** Pairs with F5 (Smart Rest Days) but independent

---

### E4: Habit Impact Score (Evidence of Real-World Change)

**What:** Each habit optionally tracks a single measurable metric that
represents its real-world impact:

| Habit | Metric | Unit |
|-------|--------|------|
| Exercise | Weight or reps | lbs or count |
| Reading | Pages read | pages |
| Meditation | Session length | minutes |
| Coding practice | Problems solved | count |
| Sleep hygiene | Hours slept | hours |

The user enters the metric value when toggling the habit (optional — they
can just check the box without entering a number). Over time, the app shows:

> **Exercise** — Impact trend:
> Week 1 avg: 15 pushups → Week 4 avg: 28 pushups (+87%)
> "Your consistency is producing real results."

A small sparkline next to the habit shows the metric trend at a glance.

**Why this is different from Progress Proof Gallery (C4):**
C4 captures free-text entries ("Ran 3.2 miles") with auto-extracted numbers.
Impact Score is structured: one metric, one unit, entered numerically. This
enables real trend analysis, not just text mining. It's the difference between
a notes field and a spreadsheet column.

**Why this is different from Micro-Habits / Partial Completion (F9):**
F9 changes the completion model (25%/50%/75%/100%). Impact Score doesn't
change completion — the habit is either done or not. The metric tracks the
*quality* of the completion independently from its existence.

**Why it matters:**
After 60 days of checking "Exercise," what has actually changed? Streaks
measure *consistency* but not *progress*. A health score measures adherence
but not impact. The Impact Score answers the question that really matters:
"Am I getting BETTER at this, not just DOING it?"

This bridges the gap between habit tracking and goal tracking. The habit is
the process; the impact metric is the outcome. Seeing "pushups: 15 → 28"
in four weeks is concretely motivating in a way that "streak: 28 days"
can never be.

**Implementation:**
- Schema: Add `impactMetric: { name: string, unit: string } | null` to Habit
- Schema: Extend log entries: `{ date: string, value?: number }` (backward compat: string entries = no value)
- Backend: Accept optional `value` in toggle endpoint
- Frontend: Optional numeric input on toggle (only shown if `impactMetric` is set)
- Frontend: `<ImpactSparkline />` — tiny inline SVG chart (last 30 data points)
- Frontend: Impact summary in expanded habit row ("Week 1 avg → Week 4 avg")

**Effort:** Medium | **Dependencies:** None

---

### E5: Habit Parking Lot (Low-Commitment Wish List)

**What:** A separate section below active habits called "Someday" — a list
of habits the user WANTS to adopt but isn't ready to commit to yet:

> **Someday:**
> - Learn guitar (added 3 weeks ago)
> - Morning journaling (added 1 week ago)
> - Cold showers (added 2 months ago)

Parked habits are not tracked, don't have streaks, and don't count toward
any metrics. They're just a visible wish list.

When the user is ready, they can "activate" a parked habit with one click,
which moves it to the active section and starts tracking (with warm-up if
E2 is implemented).

The app also gently surfaces parked habits based on capacity:

> "Your completion rate has been 92% for 3 weeks. You might be ready
> to activate one of your Someday habits. How about [Morning Journaling]?"

**Why no prior proposal covers this:**
Every feature assumes a habit either exists (active) or doesn't. There's
no concept of "I'm interested but not ready." Habit Templates (#12)
suggests preset habits from a library — but the Parking Lot is personal.
It's the user's own curated list of aspirations, not generic suggestions.

**Why it matters:**
Habit overcommitment is the #1 cause of tracker abandonment (noted in
multiple existing docs). Users add 8 habits at once, get overwhelmed,
and quit. The Parking Lot creates a pressure valve: "You don't have to
commit to everything today. Park it for later."

This also creates a natural pipeline for habit adoption. Instead of a
sudden decision ("I'll start journaling tomorrow!"), habits go through
a deliberate lifecycle: Parked → Activated → Warm-Up → Active → (someday)
Graduated. Each transition is conscious.

The capacity-aware activation prompt is the key differentiator from a
simple notes list. The app knows when you have bandwidth and suggests
pulling from the lot — making habit growth sustainable and data-driven.

**Implementation:**
- Schema: Add `status: 'active' | 'parked'` to Habit (default 'active')
- Backend: Parked habits returned with `GET /api/habits` but filtered by status
- Frontend: "Someday" section below active habits (collapsed by default)
- Frontend: "Activate" button on parked habits (starts tracking)
- Frontend: Capacity prompt when completion rate > 90% for 2+ weeks and parked habits exist
- Utils: `getActivationReadiness(habits, logs)` — checks if user has capacity

**Effort:** Low | **Dependencies:** None (enhanced by E2: Warm-Up)

---

### E6: Session Streaks (Intra-Day Momentum)

**What:** When a user completes 2+ habits in a single session (within a
10-minute window), the app recognizes it as a "session" and shows
real-time momentum:

> ✓ Meditation — Session started!
> ✓ Journaling — 2 in a row! Keep going...
> ✓ Exercise — 3-habit session! 🔥
> ✓ Reading — 4-habit session! Personal best for a morning session!

The session streak is ephemeral — it exists only during the current check-in
moment. It's not persisted or scored. It's pure in-the-moment encouragement
designed to make the daily check-in feel satisfying.

After the session ends (>10 minutes since last toggle or all habits done),
show a brief summary:

> "Morning session: 4 habits in 3 minutes. Nice momentum."

**Why no prior proposal covers this:**
Every gamification/motivation feature operates on a daily or longer
timescale (daily streaks, weekly goals, monthly milestones). None address
the micro-experience of the check-in itself. The check-in is the app's
primary interaction — it happens every day — and it currently has zero
reinforcement beyond a checkmark appearing.

**Why it matters:**
The daily check-in takes 30-60 seconds. During that time, the user's
experience is: click, click, click, done. It's functional but joyless.
Session streaks add a micro-dopamine loop to the check-in itself:
completing habit #3 feels better than habit #1 because the momentum
message escalates.

This leverages the Zeigarnik effect: once a session streak starts (2+
habits), the user feels a pull to continue it. "I've done 3, might as
well do the 4th." This nudge is ephemeral and harmless — it doesn't
create anxiety about streaks because it resets every session.

**Implementation:**
- Frontend only: `useSessionStreak()` hook tracking rapid sequential toggles
- Detects toggles within a 10-minute rolling window
- Shows escalating encouragement messages in a small banner
- Post-session summary toast
- No backend changes — no data persisted
- CSS animations for momentum messages (fade in, slight scale)

**Effort:** Low | **Dependencies:** None

---

## 3. Consolidated Feature Backlog

From the 65+ proposals across 7 documents, the best features survive here.
Features are included if they: (a) address a real user need, (b) don't
substantially overlap with another included feature, and (c) are buildable
within the current architecture.

### Tier 1: Critical UX Gaps (Must-Fix Before Anything Else)

| ID | Feature | What | Source |
|----|---------|------|--------|
| G1 | **Edit Habit** | PATCH endpoint + edit modal for name/color/frequency | BACKLOG |
| G2 | **View/Restore Archived** | Collapsible section + unarchive endpoint | BACKLOG |
| G3 | **Onboarding / Empty State** | Centered card with templates for new users | BACKLOG |
| #3 | **Undo Toast** | 5-second undo window on toggles (re-toggles to revert) | FEATURES |
| N7 | **Auto-Backup** | File copy on every write, 7-day retention, max 50 files | BACKLOG |
| #14 | **Theme Toggle** | Light/dark CSS variable swap + localStorage | FEATURES |

### Tier 2: Motivation System Upgrade (Frontend-Only, No Schema Changes)

| ID | Feature | What | Source |
|----|---------|------|--------|
| F2 | **Health Score** | Composite 0-100 consistency score (30d weighted) | NEW_FEATURES |
| F4 | **Failure Recovery + Personal Records** | Post-break dashboard with best streak + comeback tracking | NEW_FEATURES + BACKLOG |
| P10 | **Minimum Viable Day** | Mark 2-3 habits as essential; header shows MVD status | PROPOSALS |
| D5 | **Focus Mode** | Toggle to hide all metrics; show only habit names + today's checkbox | V3 |
| P2 | **Health Alerts** | Unified warning system: at-risk (today) → declining (week) → inactive (2wk) | PROPOSALS + NEW_FEATURES |

### Tier 3: Data Model & Daily Experience (Schema Changes)

| ID | Feature | What | Source |
|----|---------|------|--------|
| F5 | **Smart Rest Days** | Custom frequency: weekdays, N-times-per-week, specific days | NEW_FEATURES |
| E3 | **Weekly Rhythm Goals** | "4x per week" with weekly progress bar + weekly streak | **New** |
| N2 | **Completion Timestamps** | ISO timestamp on toggle (backward-compat migration) | BACKLOG |
| #1 | **Dashboard Stats** | Today's completion rate, active habits, longest streak | FEATURES |
| #4 | **Data Export** | JSON/CSV download before the model gets more complex | FEATURES |
| G4 | **Mobile Responsive** | 7-day grid on mobile, 44px tap targets | BACKLOG |
| E2 | **Habit Warm-Up** | 7-day grace period for new habits (no penalties) | **New** |

### Tier 4: Engagement & Organization

| ID | Feature | What | Source |
|----|---------|------|--------|
| #5 | **Heatmap** | GitHub-style calendar heatmap (per-habit or aggregate) | FEATURES |
| F3 | **Habit Stacking / Routines** | Named groups with sequence + "Complete All" | NEW_FEATURES |
| F1 | **Streak Shields** | Earned shields (1 per 14-day streak) + vacation date ranges | NEW_FEATURES |
| D8 | **Habit Freeze** | Selective pause — streak paused, excluded from stats | V3 |
| E1 | **Flexible Habit Groups** | OR-logic goals ("do any 1 of these") | **New** |
| #8 | **Drag & Drop Reorder** | Persistent sort order for habits | FEATURES |
| F11 | **Keyboard Shortcuts** | j/k navigation, space toggle, / command palette | NEW_FEATURES |

### Tier 5: Insight & Reflection

| ID | Feature | What | Source |
|----|---------|------|--------|
| E4 | **Habit Impact Score** | Track a measurable metric per habit with sparkline trend | **New** |
| C3 | **Habit Autopsy** | Structured reflection when archiving/deleting | PLAN |
| D6 | **Progress Narrative** | Template-generated story of your habit journey | V3 |
| #13 | **Goals & Milestones** | Target day count + celebration animation | FEATURES |
| C1 | **Habit Cue Mapping** | Optional trigger phrase ("After I pour coffee → Meditate") | PLAN |

### Tier 6: Polish & Delight

| ID | Feature | What | Source |
|----|---------|------|--------|
| E5 | **Habit Parking Lot** | "Someday" wish list with capacity-aware activation prompts | **New** |
| E6 | **Session Streaks** | In-the-moment encouragement during rapid check-ins | **New** |
| C5 | **Streak Weather** | Ambient background gradient reflecting overall health | PLAN |
| #12 | **Habit Templates** | Preset habit library for quick onboarding | FEATURES |
| #2 | **Categories / Tags** | User-defined tags with filtering | FEATURES |

### Explicitly Deferred (Do Not Build Until Above Is Done)

Authentication, database migration, PWA/offline, social features, iCal export,
import from trackers, browser notification reminders, micro-habits/partial
completion, natural language input, mood/energy correlation, habit chains,
habit experiments, time capsule snapshots, power hours, anti-habit tracking,
correlation map, adaptive scaling, ritual builder, compatibility advisor,
resource map, confidence calibration.

These are valid features. They are not needed yet. Some depend on features
above. Some require data accumulation. Some require infrastructure (auth, DB)
that a single-user app doesn't need.

---

## 4. Implementation Roadmap (3 Sprints)

Three sprints. Each ends with a shippable product. No sprint is
"infrastructure only" — every sprint delivers user-visible value.

### Sprint 1: Make It Usable (1-2 weeks)

**Goal:** Fix the embarrassing UX gaps. Zero schema changes. Zero new
dependencies. After this sprint, you'd recommend the app to a friend.

```
BACKEND                              FRONTEND
──────                               ────────
PATCH /api/habits/:id  (G1)          Edit habit modal (G1)
POST /api/habits/:id/unarchive (G2)  Archived habits section (G2)
Auto-backup on write (N7)            Undo toast with 5s window (#3)
                                     Onboarding empty state (G3)
                                     Theme toggle (#14)
                                     Session streaks (E6) [pure frontend delight]
```

**Why this order:** G1 and G2 are data-loss footguns. Undo is table-stakes.
Backup protects data before we enrich it. Theme toggle is trivial polish.
Session streaks are zero-effort delight — a hook + CSS, no backend.

**Definition of done:** A user can create, edit, archive, unarchive, and
delete habits. Toggles can be undone. Data is backed up. Light/dark theme
works. Check-ins feel satisfying.

---

### Sprint 2: Make It Motivating (1-2 weeks)

**Goal:** Replace fragile streak-only motivation with a richer system. Add
genuine resilience to the tracking experience. Almost entirely frontend.

```
BACKEND                              FRONTEND
──────                               ────────
GET /api/export?format=json|csv (#4) Health Score badges (F2)
                                     Failure Recovery + Personal Records (F4)
                                     Minimum Viable Day (P10) [isMVD on Habit]
                                     Focus Mode toggle (D5)
                                     Health Alerts: at-risk / declining (P2)
                                     Dashboard stats panel (#1)
                                     Habit Warm-Up badges (E2) [warmUpDays on Habit]
                                     Habit Parking Lot (E5) [status on Habit]
```

**Why this order:** Health Score + Failure Recovery reframe how users
experience setbacks. MVD gives permission for bad days. Focus Mode offers
an escape from metric anxiety. Health Alerts catch habits before they die.
Warm-Up protects new habits. Parking Lot prevents overcommitment. Data
export ships here — last chance before the data model gets complex.

**Schema changes:** `isMVD: boolean`, `warmUpDays: number`, `status: 'active' | 'parked'`
on Habit. All backward-compatible (defaults: false, 7, 'active').

**Definition of done:** Streaks still exist but are no longer the primary
motivator. The app is forgiving, encouraging, and has an anxiety escape hatch.

---

### Sprint 3: Make It Smart (2-3 weeks)

**Goal:** Schema improvements that unlock real scheduling flexibility +
features that give the app its unique identity.

```
BACKEND                              FRONTEND
──────                               ────────
Frequency model change (F5)          Smart Rest Days picker (F5)
Accept impactMetric + value (E4)     Weekly Rhythm progress bars (E3)
POST /api/groups (E1)                Impact sparklines (E4)
                                     Flexible habit groups UI (E1)
                                     Heatmap visualization (#5)
                                     Mobile responsive fix (G4)
                                     Keyboard shortcuts (F11)
```

**Schema changes:** Frequency model expanded to support custom/rhythm.
`impactMetric` field on Habit. `HabitGroup` collection. Log entries gain
optional `value` field.

**Definition of done:** Habits support real-world schedules. Users can track
measurable progress. Goals can be met through flexible activities. Long-term
history is visualized. Mobile works properly. Power users have keyboard nav.

---

## 5. New Feature Reasoning Summary

| Feature | Gap It Fills | Why 65+ Prior Proposals Missed It |
|---------|-------------|----------------------------------|
| **E1: Flexible Habit Groups** | OR-logic goals (do any 1 of N activities) | All features model habits as fixed specific actions. Stacking is AND-logic. Real goals allow variety: "exercise" doesn't mean the same thing every day. |
| **E2: Habit Warm-Up** | New habit protection | Momentum Stages labels day 1-7 as "Seedling" but still penalizes misses. Warm-up changes the rules: new habits literally cannot fail during warm-up. Addresses the 47% first-week dropout rate. |
| **E3: Weekly Rhythm Goals** | Fresh-start motivation cycle | Infinite streaks create escalating anxiety. Smart Rest Days defines which days, not how many. Weekly goals create sustainable rhythm with automatic Monday resets. |
| **E4: Habit Impact Score** | Measurable real-world progress | Every metric (streaks, health score, consistency) measures adherence. None measure whether you're actually getting BETTER at the habit. Impact Score bridges habit tracking and goal tracking. |
| **E5: Habit Parking Lot** | Low-commitment wish list | Every feature assumes habits are either active or archived. No concept of "interested but not ready." The parking lot prevents overcommitment by creating a staging area for future habits. |
| **E6: Session Streaks** | In-the-moment check-in delight | Every gamification feature operates on daily+ timescales. None address the 30-second check-in experience itself. Session streaks add micro-dopamine to the most frequent interaction. |

---

## 6. Features Merged, Cut, or Deferred (with reasoning)

### Merged (single feature absorbs multiple overlapping proposals)

| Final Feature | Absorbs | Why |
|---------------|---------|-----|
| F4: Failure Recovery | + N10: Personal Records | Both address post-streak-break psychology. Personal best + comeback count = one dashboard. |
| P2: Health Alerts | + F14: Habit Sunset | Both are early warning systems at different timescales. Unified escalation: at-risk → declining → inactive. |
| E3: Weekly Rhythm | Partially absorbs F5: Smart Rest Days | Rhythm is "how many per week" (flexible). Rest Days is "which specific days" (fixed). Both valid — they coexist as frequency options rather than separate features. |

### Cut (not worth building)

| Feature | Why Cut |
|---------|---------|
| N9: Natural Language Input | Regex parsers for natural language create more frustration than the form they replace. |
| P5: Habit Chains | Dependency modeling adds graph complexity. Cue Mapping (C1) + Stacking (F3) achieve the same thing more simply. |
| F6: Mood & Energy Correlation | Requires daily mood logging — a second daily habit most users won't sustain. D7 (Habit Echo) is lighter if needed later. |
| N5: Correlation Map | Needs 60+ days of multi-habit data to be useful. By the time users have that data, we'll know what they actually want. |

### Deferred (valid but premature)

| Feature | Why Deferred |
|---------|-------------|
| #10: Auth, #11: DB Migration, #15: PWA | Infrastructure for a single-user app. Build when deploying publicly. |
| F9: Micro-Habits (partial completion) | Breaking schema change. Warm-Up (E2) + MVD (P10) address the same "all-or-nothing anxiety" without migration. |
| N3: Momentum Stages + P3: Identity | Interesting but adds UI complexity before the basics work. Revisit after Sprint 2. |
| C7: Ritual Builder | Medium effort for a niche need. Most users don't need sub-steps. |
| D1: Comeback Engine | Needs MVD + Focus Mode + Health Alerts to exist first. Sprint 6 material. |
| D7: Habit Echo | Needs 2+ weeks of daily pulse data to produce results. Ship after core is solid. |

---

## 7. Decision Log

| Decision | Rationale |
|----------|-----------|
| 3 sprints, not 6 | A 14-week plan for a 960-line app is over-engineering the roadmap. Ship in 5-6 weeks, reassess. |
| No more than 35 features in the active backlog | 65+ was unusable as a planning tool. Trim to what's realistic for a small team over 3-6 months. |
| Session Streaks in Sprint 1 | Pure frontend, zero risk, <2 hours, makes the daily check-in feel better. High reward-to-effort ratio for sprint morale. |
| Warm-Up in Sprint 2, not Sprint 3 | It's a simple boolean + number field, not a schema restructuring. Ship early so every new habit benefits. |
| Parking Lot in Sprint 2 | Prevents overcommitment — which all existing docs identify as the #1 cause of abandonment. A status field on Habit is trivial. |
| Weekly Rhythm as a frequency option | Rather than a separate feature, it's a third option alongside "daily" and "weekly" in the frequency picker. Natural extension of the existing model. |
| Impact Score over Progress Proof Gallery | Structured numeric tracking > free-text mining. One metric per habit is the right constraint — it keeps entry fast. |
| Flexible Groups as a first-class concept | OR-logic goals are a genuinely new tracking primitive. No existing tracker does this well. It's a differentiator. |
| No AI/ML anywhere | Deterministic logic is explainable, fast, free of API costs, and works offline. |
| This is the last planning document | The next commit after this should be source code. |

---

## 8. Quick Reference: What to Build Next

If you're reading this and ready to code, here's the priority stack:

```
RIGHT NOW (Sprint 1):
  1. PATCH /api/habits/:id         — server/app.js
  2. POST /api/habits/:id/unarchive — server/app.js
  3. Edit modal component           — src/components/EditHabitModal.tsx
  4. Archived habits section         — src/components/HabitTable.tsx
  5. Undo toast logic               — src/hooks/useHabits.ts
  6. Auto-backup in writeData()     — server/app.js
  7. Theme toggle (CSS vars)        — src/App.tsx + src/index.css
  8. Onboarding empty state         — src/components/HabitTable.tsx
  9. Session streak hook            — src/hooks/useSessionStreak.ts

AFTER THAT (Sprint 2):
  10. calculateHealthScore()        — src/utils.ts
  11. Failure Recovery component    — src/components/FailureRecovery.tsx
  12. MVD flag + UI                 — types.ts + HabitRow.tsx
  13. Focus Mode toggle             — App.tsx + HabitRow.tsx
  14. Health Alerts logic           — src/utils.ts + HabitRow.tsx
  15. Dashboard stats panel         — src/components/Dashboard.tsx
  16. Warm-up period logic          — src/utils.ts + HabitRow.tsx
  17. Parking lot section           — src/components/HabitTable.tsx
  18. Data export endpoint          — server/app.js

THEN (Sprint 3):
  19. Frequency model refactor      — types.ts + server/app.js + utils.ts
  20. Weekly Rhythm UI              — src/components/WeeklyRhythm.tsx
  21. Impact metric + sparkline     — types.ts + HabitRow.tsx
  22. Flexible habit groups         — types.ts + server/app.js + components
  23. Heatmap visualization         — src/components/Heatmap.tsx
  24. Mobile responsive CSS         — src/App.css
  25. Keyboard shortcuts            — src/hooks/useKeyboard.ts
```
