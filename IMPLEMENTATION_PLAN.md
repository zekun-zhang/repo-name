# Habit Garden — Implementation Plan

> **Purpose:** Replace 7 fragmented planning docs with one actionable plan.
> This document proposes new features, consolidates the best existing ideas,
> and defines a phased implementation order with clear reasoning.
>
> **Honest assessment:** The project has ~600 lines of shipped code and ~4,000
> lines of planning across FEATURES.md, NEW_FEATURES.md, BACKLOG.md,
> FEATURE_PLAN.md, FEATURE_PLAN_v3.md, FEATURE_PROPOSALS.md, ROADMAP.md,
> and CREATIVE_FEATURES.md. This document makes hard cuts. Features not
> included here aren't bad — they're deferred until the foundation is solid.
>
> Created: 2026-05-18

---

## Part 1: New Feature Proposals

These features are **not found in any of the 7 existing planning documents**.
Each fills a gap that 65+ prior proposals missed.

---

### NEW-1: Anti-Habit Tracking (Habits to Break)

**What:** Track behaviors you want to STOP — smoking, doomscrolling, snacking
after 9pm, nail biting. The mechanic is inverted: each day starts "clean"
and the user marks a *failure* if they slip. The streak counts days WITHOUT
the behavior. The UI uses a distinct visual language (red/amber instead of
green) to differentiate "do" habits from "don't" habits.

**Why nothing existing covers this:**
Every single feature across all 7 documents assumes habits are positive
actions to perform. But a huge portion of real behavior change is about
*stopping* harmful patterns. "Don't check phone in bed" is as valid a habit
as "Meditate 10 minutes" — yet the current app has no way to represent it.

The inversion matters mechanically:
- Normal habit: start unchecked, mark done → green
- Anti-habit: start clean, mark slip → red. Streak = consecutive clean days.
- Missing a toggle on a normal habit = missed. Missing a toggle on an
  anti-habit = success (you didn't slip).

**Why it works psychologically:**
- Reframes "I'm trying to quit X" into a measurable, streak-able goal
- The default-success model is empowering: you wake up already winning
- Slips become data points, not moral failures ("I slipped on 3 Fridays →
  Fridays are my trigger")
- Combined with regular habits, gives a complete behavior-change picture

**Implementation:**
- Schema: Add `type: 'build' | 'break'` to Habit (default: 'build')
- Frontend: Type selector in HabitForm ("I want to..." Build / Break)
- Frontend: Inverted toggle logic in HabitRow for 'break' type
- Frontend: Distinct color scheme (amber/red palette for break habits)
- Utils: Inverted streak calculation — count consecutive days WITHOUT log entry
- Backend: No new endpoints, just accept and persist the `type` field

**Effort:** Low | **Dependencies:** None

---

### NEW-2: Habit Difficulty Pulse

**What:** After toggling a habit complete, an optional single-tap micro-survey
appears: "How hard was this today?" with three options — Easy (😌), Normal
(😐), Hard (😤). Over time, plot a difficulty trendline per habit.

The key insight this unlocks: **a habit becoming easier is the real measure
of habit formation**, not just whether you did it. A user who exercises
daily but rates it "Hard" every time is white-knuckling — they're one bad
week from quitting. A user who rates "Easy" has internalized the habit.

**Why nothing existing covers this:**
- Mood/Energy Correlation (NEW_FEATURES F6) correlates habits with general
  mood. Difficulty Pulse measures the *habit itself*, not the person's state.
- Confidence Calibration (CREATIVE C5) predicts before. Difficulty Pulse
  measures after. They're complementary, not overlapping.
- No existing proposal captures the subjective effort of habit execution.

The difficulty trend is one of the strongest leading indicators of habit
durability. A completion rate of 100% with rising difficulty is a red flag.
A completion rate of 80% with falling difficulty is a green flag.

**Data model:**
```
difficulty: { [habitId]: { [date]: 'easy' | 'normal' | 'hard' } }
```

**Visualization:**
- Inline sparkline in HabitRow showing difficulty trend (last 30 days)
- Color gradient: green (easy) → yellow (normal) → red (hard)
- Dashboard stat: "3 habits getting easier, 1 getting harder"

**Effort:** Low | **Dependencies:** None

---

### NEW-3: Quick Command Bar

**What:** Press `/` anywhere to open a command palette (like VS Code's Cmd+K
or Raycast). Type to fuzzy-search habits and actions:

- `exe` → "Toggle Exercise for today" (one Enter to confirm)
- `exe yesterday` → "Toggle Exercise for 2026-05-17"
- `new Morning Run daily` → Creates habit in one line
- `archive med` → Archives Meditation
- `stats` → Jump to dashboard
- `today` → Switch to Today View

Single-letter aliases auto-assigned: first letter of each habit name (with
disambiguation when collisions occur). Power users check in all habits
in under 5 seconds: `/` `e` `Enter` `/` `r` `Enter` `/` `m` `Enter`.

**Why nothing existing covers this:**
Keyboard Shortcuts (NEW_FEATURES F12) proposes hotkeys for navigation.
The command bar is fundamentally different — it's a **text-driven interface
for every action in the app**. It turns Habit Garden into a tool that
keyboard-centric users (developers, power users) can operate without
touching the mouse.

The speed matters. Habit check-in competes with friction: the faster it is,
the more likely users do it. A command bar reduces 3 clicks (find habit →
find today → click toggle) to 3 keystrokes.

**Implementation:**
- Frontend: `<CommandBar />` overlay component (modal with search input)
- Frontend: Fuzzy match library (lightweight, e.g., fuse.js or custom)
- Frontend: Action registry pattern — each command maps to an existing
  hook function (toggle, addHabit, archive, etc.)
- Frontend: Global keydown listener for `/` key
- No backend changes

**Effort:** Medium | **Dependencies:** None

---

### NEW-4: Streak Autopsy

**What:** When a streak of 7+ days breaks, automatically generate a "streak
autopsy" — a mini-report analyzing what went wrong:

- **When:** "Your 23-day Exercise streak broke on Friday, May 16."
- **Pattern:** "3 of your last 4 streak breaks happened on Fridays."
- **Context:** "On the day it broke, you also missed Reading and Meditation
  (0/5 habits completed — unusual for you)."
- **Correlation:** "Your Exercise streak has broken 3 times. Each time,
  you had completed 0 other habits that day, suggesting a full-day disruption
  rather than habit-specific resistance."
- **Recovery:** "Your average recovery time after a break is 2.1 days.
  Check in today to start rebuilding."

The autopsy is shown as a dismissable card in the UI, not a modal.

**Why nothing existing covers this:**
- Insights Engine (NEW_FEATURES F8) generates pattern insights proactively.
  The autopsy is *reactive* — triggered specifically by a break event.
- Failure Recovery Dashboard (NEW_FEATURES F4) shows post-break stats.
  The autopsy explains the *cause*, not just the recovery metrics.
- Habit Pair Correlation (BACKLOG N5) shows general correlations.
  The autopsy correlates specifically at the moment of failure.

The autopsy transforms a demoralizing moment ("I broke my streak") into a
learning moment ("Here's exactly why, and here's what to do"). It's the
difference between "Streak: 0" and "Your 23-day streak broke because
Friday is your weak day — not because you lack discipline."

**Implementation:**
- Utils: `generateAutopsy(habitId, logs, allHabits)` — analyze break context
- Frontend: `<StreakAutopsy />` card component (shown when streak resets)
- Frontend: Stores dismissed autopsies in localStorage
- Analysis: Day-of-week frequency, co-break correlation, recovery time avg
- No backend changes — all derived from existing log data

**Effort:** Medium | **Dependencies:** Benefits from Completion Timestamps (N2)

---

### NEW-5: Ritual Builder (Habit Sequencing)

**What:** Group habits into ordered "rituals" — named sequences that
represent a routine:

```
Morning Ritual (6:30 AM)
  1. ☐ Drink water
  2. ☐ Meditate (10 min)
  3. ☐ Exercise (30 min)
  4. ☐ Journal

Evening Ritual (9:00 PM)
  1. ☐ Read (20 min)
  2. ☐ Plan tomorrow
  3. ☐ Gratitude log
```

In Today View, rituals display as sequential checklists. Completing one
habit auto-highlights the next. A ritual is "done" when all habits in the
sequence are checked. The ritual itself has a streak and completion rate.

**Why this is different from Habit Stacking (NEW_FEATURES F3):**
Habit Stacking (F3) links pairs of habits with "after X, do Y" cues —
it's a behavioral science technique about associative triggers. Ritual
Builder groups habits into named, ordered, timed routines with their own
metrics. Stacking is a cue mechanism. Rituals are a UI organization layer.

Think of it as the difference between "after I brush my teeth, I floss"
(stacking) vs. "my Morning Routine is: wake up → water → meditate →
exercise → journal, and I want to track this routine as a unit" (ritual).

**Why it matters:**
Most real-world habit practitioners think in routines, not individual
habits. "My morning routine" is a single mental unit even if it contains
5 actions. The app should match this mental model. A ritual that's 4/5
complete feels better than 4 individual habits checked + 1 missed.

**Implementation:**
- Schema: New `rituals` collection: `{ id, name, habitIds: string[], time?: string }`
- Frontend: `<RitualBuilder />` — drag habits into named groups
- Frontend: `<RitualCard />` in Today View — sequential checklist UI
- Frontend: Ritual-level streak and completion stats
- Backend: CRUD endpoints for rituals (`/api/rituals`)
- Utils: `calculateRitualCompletion(ritual, logs, date)` — % and streak

**Effort:** Medium-High | **Dependencies:** Today View (N1)

---

### NEW-6: Personal Record Board

**What:** A dedicated "Records" section that tracks and celebrates personal
bests across multiple dimensions — automatically detected, never manually set:

| Record | Value | Set On |
|--------|-------|--------|
| Longest streak (any habit) | 47 days (Exercise) | 2026-04-28 |
| Most habits completed in one day | 8/8 (100%) | 2026-03-22 |
| Longest perfect week | 3 consecutive weeks | 2026-04-14 |
| Most consecutive days with 100% | 12 days | 2026-05-01 |
| Fastest growing habit | Reading (difficulty: Hard→Easy in 21 days) | — |
| Longest break-free month | April 2026 (0 streak breaks) | — |

Records are never lost — even if a streak breaks, the record stands.
When a new record is set, a celebratory notification appears: "New personal
record! 🏆 Longest streak ever: 48 days (Exercise)."

**Why nothing existing covers this:**
- Goals & Milestones (FEATURES P2-13) are user-set targets. Records are
  auto-detected achievements from actual behavior.
- Gamification (CREATIVE_FEATURES mentions badges/levels) is about
  artificial reward mechanics. Records are about real, personal data.
- Streaks measure current state. Records measure lifetime peaks.

The distinction matters psychologically: streaks reset to zero and that's
painful. Records never reset — they're a permanent, growing trophy case.
"My best streak was 47 days" is motivating even after a break, because
the next goal is clear: beat 47.

**Implementation:**
- Utils: `calculateRecords(habits, logs)` — scan all data for personal bests
- Frontend: `<RecordBoard />` component (table or card grid)
- Frontend: "New Record!" toast when a best is beaten
- No schema changes — all computed from existing data
- No backend changes

**Effort:** Low-Medium | **Dependencies:** None

---

### NEW-7: Contextual Micro-Rewards

**What:** Instead of gamification (points, XP, badges), use contextual,
habit-specific micro-copy rewards that change based on behavior:

**After first check-in of a new habit:**
> "Day 1. Most people never start. You did."

**After 7 consecutive days:**
> "One week. Your brain is starting to notice this pattern."

**After checking in before 8 AM:**
> "Early bird. Exercise before 8 AM — you're in the top 15% of your own history."

**After recovering from a broken streak within 1 day:**
> "Bounce back. Missing one day doesn't erase 23. You proved that today."

**After completing all habits for the day:**
> "Clean sweep. 6/6 today. That's happened 12 times this month."

**After difficulty drops from Hard to Easy:**
> "This used to be hard. Now it's easy. That's not luck — that's you."

These are NOT generic motivational quotes. Every message is computed from
the user's actual data and references specific numbers, dates, and habits.
They appear briefly in the toast area and are never repeated.

**Why this is different from existing gamification proposals:**
Gamification (badges, levels, XP) creates extrinsic motivation that can
undermine intrinsic motivation (well-documented "overjustification effect").
Micro-rewards are *observational* — they don't add a game layer, they
reflect reality back to the user with timing and framing that amplifies
natural satisfaction.

The key design principle: every micro-reward must contain at least one
number from the user's real data. "Great job!" is empty. "Day 23. This is
now your 3rd longest streak ever." is powerful because it's TRUE.

**Implementation:**
- Utils: `generateMicroReward(event, habits, logs)` — pattern-matched
  reward generation based on trigger event type
- Events: first_checkin, streak_milestone, early_checkin, bounce_back,
  clean_sweep, difficulty_drop, new_record
- Frontend: Enhanced toast system with reward-styled variant
- Content: ~30-40 templates with data interpolation slots
- No backend changes

**Effort:** Medium | **Dependencies:** Benefits from Difficulty Pulse (NEW-2),
Records (NEW-6), Completion Timestamps (BACKLOG N2)

---

## Part 2: Consolidated Implementation Roadmap

This roadmap cherry-picks the highest-impact features from ALL documents
(7 existing + the new proposals above) and sequences them by dependency
and effort. Features not listed here are deferred — not rejected.

### Selection Criteria

Each feature was evaluated on:
1. **User impact:** Does it make the daily check-in better?
2. **Technical leverage:** Does it enable or enhance other features?
3. **Effort:** Can it ship in 1-2 focused sessions?
4. **Foundation:** Does the app need this before anything fancy?

---

### Sprint 0: Fix the Foundation (Before ANY new feature)

These are the UX gaps from BACKLOG.md Part 1. They're not features —
they're bugs in the user experience. Ship them first.

| ID | Feature | Source | Effort | Why First |
|----|---------|--------|--------|-----------|
| G1 | Edit Habit After Creation | BACKLOG | Small | Can't rename = data loss. Blocks habit evolution. |
| G2 | View & Restore Archived Habits | BACKLOG | Small | Archived habits vanish. Users can't undo mistakes. |
| G3 | Empty State & Onboarding | BACKLOG | Small | New users get zero guidance. First impression matters. |
| G4 | Responsive Mobile Experience | BACKLOG | Medium | 14-day grid breaks on mobile. Most habit check-ins are on phone. |

**API work:**
- `PATCH /api/habits/:id` — partial update (name, color, frequency)
- `POST /api/habits/:id/unarchive` — restore archived habit

**Estimated effort:** 1-2 days total

---

### Sprint 1: Daily Experience (Make check-in faster and richer)

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| N1 | Today View / Focus Mode | BACKLOG | Low | Core UX: <15 second daily check-in. Everything else is noise. |
| NEW-1 | Anti-Habit Tracking | NEW | Low | Expands what users can track. Simple schema addition. |
| P0-3 | Undo Toast for Toggles | FEATURES | Low | Mis-taps on mobile are frustrating. Quick win. |
| N2 | Completion Timestamps | BACKLOG | Medium | Invisible infrastructure. Every day without timestamps = lost data. |

**Why this sprint:**
These four features collectively transform the daily check-in from "open
app → scan 14-day grid → find today → toggle" to "open app → see today's
habits → toggle → done in 10 seconds." Timestamps are infrastructure that
unlocks future analytics.

**Estimated effort:** 2-3 days total

---

### Sprint 2: Insight & Motivation (Give users reasons to come back)

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| P0-1 | Dashboard Statistics | FEATURES | Low | Answers "am I on track?" at a glance. Pure frontend. |
| N3 | Momentum Stages | BACKLOG | Low | Garden metaphor: Seedling → Growing → Rooted → Evergreen. |
| NEW-2 | Difficulty Pulse | NEW | Low | Leading indicator of habit durability. Simple micro-survey. |
| NEW-6 | Personal Record Board | NEW | Low-Med | Records never reset. Permanent motivation even after breaks. |

**Why this sprint:**
Sprint 1 optimized the INPUT (check-in). Sprint 2 optimizes the OUTPUT
(feedback). Users now see aggregate stats, growth stages, difficulty trends,
and lifetime records — transforming raw checkmarks into a meaningful story.

**Estimated effort:** 2-3 days total

---

### Sprint 3: Resilience (Help users survive setbacks)

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| C1 | Warmup Ramp | CREATIVE | Low | New habits start easy, scale up. Reduces week-1 failure. |
| NEW-4 | Streak Autopsy | NEW | Medium | Turns streak breaks into learning moments, not just "Streak: 0". |
| NEW-7 | Contextual Micro-Rewards | NEW | Medium | Data-driven encouragement at the right moments. |
| C4 | Environmental Cue Tracker | CREATIVE | Low | Bridges digital tracking to physical world. |

**Why this sprint:**
The #1 reason people abandon habit trackers is a bad week. Sprint 3
builds resilience features: graduated starts prevent early failure,
autopsies reframe breaks as data, micro-rewards celebrate recovery,
and environmental cues address root causes.

**Estimated effort:** 3-4 days total

---

### Sprint 4: Organization & Power Use

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| P0-2 | Categories / Tags | FEATURES | Medium | Habits grow beyond 7. Users need structure. |
| P1-8 | Habit Reordering | FEATURES | Medium | Manual priority ordering. Drag and drop. |
| NEW-3 | Quick Command Bar | NEW | Medium | Power-user speed. Keyboard-driven check-in. |
| P0-4 | Data Export (JSON/CSV) | FEATURES | Low | Users own their data. Manual backup until DB migration. |

**Why this sprint:**
By Sprint 4, engaged users have 10+ habits and weeks of data. They need
organizational tools (tags, reordering), power-user efficiency (command bar),
and data safety (export). These are retention features for users who've
survived the first month.

**Estimated effort:** 3-4 days total

---

### Sprint 5: Visualization & Analysis

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| P1-5 | Completion Heatmap | FEATURES | Medium | GitHub-style calendar. Long-term pattern visibility. |
| N4 | Streak DNA Visualization | BACKLOG | Medium | Inline history barcode per habit. Data-dense, glanceable. |
| N5 | Habit Pair Correlation Map | BACKLOG | Medium | "Which habits support each other?" Auto-detected. |
| P1-9 | Weekly/Monthly Summary | FEATURES | Medium | Periodic reflection page with charts. |

**Why this sprint:**
By now users have 2+ months of data. Visualization features need data
density to be meaningful — shipping them earlier would show empty charts.
The heatmap, DNA strips, and correlation map transform raw logs into
visual patterns that surprise and motivate.

**Estimated effort:** 4-5 days total

---

### Sprint 6: Advanced Behavioral Features

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| NEW-5 | Ritual Builder | NEW | Med-High | Group habits into routines. Matches mental model. |
| C2 | Habit A/B Testing | CREATIVE | Medium | Compare variants: "morning run vs evening run." |
| C5 | Confidence Calibration | CREATIVE | Medium | Predict → do → learn. Forward-looking engagement. |
| C3 | Streak Savings Bank | CREATIVE | Low-Med | Extra effort becomes streak insurance. |

**Why this sprint:**
These are the "advanced" behavioral science features that differentiate
Habit Garden from every other tracker. They require a mature user who
understands their habits well enough to benefit from A/B testing,
prediction calibration, and ritual grouping. Shipping them too early
would overwhelm new users.

**Estimated effort:** 4-5 days total

---

### Backlog (Defer until foundation is proven)

These features are important but require significant infrastructure work
or are only justified at scale. Build them when the core experience is
validated.

| ID | Feature | Source | Why Deferred |
|----|---------|--------|-------------|
| P2-10 | User Auth & Multi-User | FEATURES | Large scope. Only needed for public deployment. |
| P2-11 | SQLite/PostgreSQL Migration | FEATURES | JSON works for single user. Migrate when auth ships. |
| P2-15 | PWA / Offline Support | FEATURES | Meaningful only after mobile UX is polished (Sprint 0). |
| C6 | Life Phase Modes | CREATIVE | Complex UX. Users need basics first. |
| P1-6 | Habit Notes / Journal | FEATURES | Nice-to-have. Doesn't block any other feature. |
| P1-7 | Reminders / Notifications | FEATURES | Requires Notification API permission UX. Medium effort, low urgency. |
| P2-16 | Social / Accountability | FEATURES | Requires auth. Large scope. |
| N6 | Adaptive Scaling Prompts | BACKLOG | Requires Momentum Stages (Sprint 2) + Edit Habit (Sprint 0). |
| N7 | Data Integrity & Backup | BACKLOG | Nice safety net. Less urgent than export (Sprint 4). |
| P2-14 | Dark/Light Theme Toggle | FEATURES | Cosmetic. Low priority. CSS variables already set up. |
| P2-12 | Habit Templates / Presets | FEATURES | Part of onboarding (Sprint 0). Can expand later. |
| P2-13 | Habit Goals & Milestones | FEATURES | Partially covered by Records (Sprint 2) and Stages (Sprint 2). |

---

## Part 3: Architecture Decisions

### When to migrate from JSON to SQLite

**Trigger:** When ANY of these become true:
1. User auth ships (need per-user data isolation)
2. Heatmap queries become slow (>100ms for date-range lookups)
3. Data file exceeds 1MB
4. Concurrent access is needed (multi-tab, multi-device)

**Until then:** JSON file + mutex is fine. Don't over-engineer storage
for a single-user app with <100 habits.

### Frontend state management

**Current (useHabits hook):** Sufficient through Sprint 4. The custom hook
pattern scales well for a single-page app with one data domain.

**Migrate to context/reducer when:**
- Multiple independent views need shared state (Today View + Table + Dashboard)
- Undo/redo requires action history (useReducer is a natural fit)
- Command bar needs access to all actions from a non-component context

Recommended: Extract `useHabits` into a `useReducer` + React Context in
Sprint 1 when Today View ships. This is a refactor, not a rewrite.

### Component library

**Stay vanilla CSS through Sprint 3.** The app's dark-theme aesthetic is
distinctive and custom. Adding a component library (shadcn, Radix) makes
sense only when building complex UI like drag-and-drop, command palette,
or modals — which arrive in Sprint 4.

Recommended: Add Radix UI primitives (Dialog, DropdownMenu, Command) in
Sprint 4 for the command bar and reordering. Don't adopt a full design
system.

---

## Part 4: What This Plan Cuts

Being explicit about what's NOT in this plan and why:

| Cut Feature | Why |
|------------|-----|
| Buddy System / Social | Requires auth infrastructure. Build the solo experience first. |
| Voice / Smart Home Integration | Niche. High effort, low user base. |
| Habit Fusion (combine habits) | Confusing UX. Rituals (NEW-5) solve the grouping problem better. |
| Temporal Pattern Analysis | Covered by Streak Autopsy (NEW-4) and Correlation Map (N5). |
| Email Reports | Zero infrastructure for email. In-app reports are sufficient. |
| Gamification (XP, Levels, Badges) | Risks undermining intrinsic motivation. Micro-rewards (NEW-7) are better. |
| Calendar Season Modes | Life Phases (C6, deferred) is more useful. Seasons are arbitrary. |

---

## Summary

**7 new features proposed:** Anti-Habits, Difficulty Pulse, Command Bar,
Streak Autopsy, Ritual Builder, Personal Records, Contextual Micro-Rewards.

**6 sprints defined:** Foundation → Daily Experience → Insight → Resilience →
Organization → Visualization → Advanced.

**~28 features total** across 6 sprints (from a pool of 65+).
**~12 features deferred** to backlog with reasoning.

The plan front-loads features that improve daily check-in speed and
resilience, because those determine whether users come back tomorrow.
Visualization and advanced behavioral features come later, when users
have enough data to benefit from them.

**The next step is Sprint 0: Fix the Foundation.**
