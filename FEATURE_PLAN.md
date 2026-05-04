# Habit Garden — Feature Plan & Unified Backlog v2

> Supersedes FEATURES.md, NEW_FEATURES.md, FEATURE_PROPOSALS.md, and BACKLOG.md.
> Single source of truth for all feature work.

---

## 1. Codebase Audit & Current State

**Shipped (MVP):** Habit CRUD, daily/weekly toggle, 14-day grid, streaks,
dark theme, optimistic updates, toasts, JSON persistence with mutex, 17
backend tests. ~960 lines of source code across React frontend + Express
backend.

**Prior Planning Documents:** 4 documents containing 55+ proposed features
and 4 UX gap fixes. This document consolidates, de-duplicates, critiques,
and extends them.

### Problems with the Prior Planning

| Issue | Detail |
|-------|--------|
| **Fragmentation** | 4 separate docs (FEATURES.md, NEW_FEATURES.md, FEATURE_PROPOSALS.md, BACKLOG.md) with overlapping features and conflicting priority rankings. No single source of truth. |
| **Redundancy** | Several features overlap significantly: Identity Statements (P3) + Momentum Stages (N3) both model habit maturity. Failure Recovery (F4) + Personal Records (N10) both address post-streak-break psychology. Today View (N1) + Contextual Check-In (P4) both simplify the daily view. |
| **Missing the Habit Loop** | Every existing proposal focuses on *tracking* (the routine). Zero features model the **cue** (what triggers the habit) or the **reward** (what you get from doing it). These are 2 of the 3 pillars of habit science (Duhigg's Habit Loop, Clear's 4 Laws). |
| **No learning from failure** | Features detect decline (Sunset Prompts, Decay Warnings) and cushion failure (Streak Shields, Failure Recovery) — but none help users *understand* why they fail or apply that learning to future habits. |
| **No tangible evidence** | All tracking is abstract (checkmarks, numbers, scores). No feature captures *proof* of progress (photos, measurements, outputs) that make change feel real. |
| **Ambient awareness gap** | Every visualization requires reading (numbers, charts, grids). No feature communicates habit health through ambient/peripheral cues (color, mood, atmosphere). |
| **Feature count exceeds realistic scope** | 55+ features for a ~960-line app with a 2-person-or-less team is aspirational to the point of being unusable as a planning tool. Features need ruthless triage. |

---

## 2. New Feature Proposals

These 8 features address the **6 dimensions no prior document covers**.
Each is grounded in behavioral science, implementable without external
APIs or AI, and designed to complement (not duplicate) existing proposals.

---

### C1: Habit Cue Mapping (Completing the Habit Loop)

**What:** Each habit has an optional "cue" field — a short phrase
describing what triggers it:

- "After I pour my morning coffee" → Meditate
- "When I sit down at my desk" → Plan today's tasks
- "When my 9 PM alarm rings" → Read

The cue displays as a subtle prefix in the habit row: `☕ → Meditate`.
In Today View, cues become the primary organizing principle: habits
sorted by their natural trigger sequence rather than creation order.

**Why this fills a real gap:**
The habit loop (Cue → Routine → Reward) is the foundational model of
behavioral science. Every existing feature models the *routine* (track
the habit) and its *outcome* (streak, health score). Zero features model
the *cue*. This is like building a car without a starter — you have the
engine but no ignition.

Cue design is the #1 recommendation in Atomic Habits ("make it obvious"),
Tiny Habits ("anchor to existing behavior"), and Power of Habit ("identify
the cue"). By modeling cues explicitly, the app moves from a *tracking
tool* to a *behavior design tool*.

Practical benefit: when a habit is struggling, the cue field surfaces the
question "Is your trigger reliable?" — which is often the real problem,
not willpower.

**Implementation:**
- Schema: Add `cue: string | null` to Habit
- Frontend: Optional text field in HabitForm with placeholder suggestions
- Frontend: Cue prefix display in HabitRow (`cue → habitName`)
- Frontend: In Today View, group/sort habits by cue (habits with no cue go last)
- Backend: Accept and persist the field (trivial)

**Effort:** Low | **Dependencies:** None (enhanced by Today View [N1])

---

### C2: "Why I Started" Motivation Capsule

**What:** When creating a habit, users write an optional private note
explaining *why* this habit matters to them:

- "I want to be the kind of parent who reads to their kids"
- "My doctor said my blood pressure is too high"
- "I want to finish a novel before I turn 30"

This note is **hidden during normal use**. It surfaces only at three
critical moments:

1. **Streak decay warning** (P2) — "Remember why you started: ..."
2. **Archive/delete confirmation** — "Before you stop, you wrote: ..."
3. **Monthly snapshot** (P7) — "One month ago, you started this because: ..."

**Why this fills a real gap:**
Existing features handle *what* (tracking), *how well* (health score,
streaks), and *when* (time-of-day, smart rest days). None handle *why*.

The most powerful motivation is intrinsic — connecting a daily behavior
to a personally meaningful reason. But intrinsic motivation fades over
time; we forget why we started. The motivation capsule is a "letter from
your past self" that arrives exactly when it's needed most.

This is based on research by Deci & Ryan (Self-Determination Theory):
autonomous motivation (doing something because it aligns with your values)
is 3x more durable than controlled motivation (doing it because you
"should"). The capsule reinforces autonomous motivation at the moments
when controlled motivation would take over ("I should keep going because
my streak...").

**Implementation:**
- Schema: Add `motivation: string | null` to Habit
- Frontend: Optional textarea in HabitForm, character limit 280
- Frontend: Conditionally render motivation text in Streak Decay
  Warning UI, archive confirmation modal, and snapshot comparisons
- Backend: Accept and persist the field
- No new endpoints

**Effort:** Low | **Dependencies:** None (amplified by Streak Decay [P2], Snapshots [P7])

---

### C3: Habit Autopsy & Failure Pattern Learning

**What:** When a user archives or deletes a habit, show a brief
structured reflection:

**Step 1 — Reason:**
Pick one: `Too hard` | `Got boring` | `Not enough time` |
`Achieved my goal` | `Replaced by another habit` |
`Doesn't fit my life` | `Other`

**Step 2 — Freeform (optional):**
"What would you do differently if you tried this again?"

**Step 3 — Pattern Report (after 3+ autopsies):**
"You've archived 4 habits. Pattern: 3 of 4 were dropped for 'Too hard'
within the first 14 days. Consider starting with smaller versions of
new habits."

**Why this fills a real gap:**
Every existing proposal treats habit failure as something to *recover
from* (Failure Recovery, Streak Shields) or *prevent* (Decay Warnings,
Sunset Prompts). None treat it as something to *learn from*.

Failure is data. A user who drops 5 habits for being "too hard" has a
clear, actionable pattern: they're overcommitting on difficulty. A user
who drops habits after exactly 3 weeks has a clear timing pattern. But
without structured capture, this data is lost — users make the same
mistakes with the next habit.

The pattern report transforms individual failures into systemic
self-knowledge. It closes the learning loop that all other features
leave open.

**Implementation:**
- Schema: New `autopsies` array in data.json:
  `{ habitName, reason, note?, archivedAt, daysTracked, completionRate }`
- Backend: Autopsy data saved as part of archive/delete flow
- Frontend: `<HabitAutopsy />` modal shown on archive/delete action
- Frontend: `<FailurePatterns />` panel (in settings or dashboard)
  visible after 3+ autopsies
- Utils: `analyzeFailurePatterns(autopsies)` — reason frequency, avg
  duration before drop, completion rate at time of drop

**Effort:** Medium | **Dependencies:** None

---

### C4: Progress Proof Gallery

**What:** Habits can optionally capture "proof" entries — quantitative
measurements or qualitative notes attached to specific completions:

**Quantitative mode** (for measurable habits):
- Exercise → "Ran 3.2 miles", "Benched 135 lbs", "Did 25 pushups"
- Weight → "178.5 lbs"
- Reading → "Pages 145-180 of Dune"

**Qualitative mode** (for experiential habits):
- Meditation → "Mind was racing but settled after 10 min"
- Cooking → "Made pasta from scratch, turned out great"

The proof gallery shows a timeline of entries per habit, with trends
for quantitative data (auto-detected numbers plotted on a mini chart).

**Why this is different from Habit Notes (FEATURES.md #6):**
Notes are *reflections about the day*. Proof entries are *evidence of
the habit's output*. A note says "good workout today." A proof entry
says "Deadlift: 225 lbs (up from 205 last month)." Notes are
subjective; proof is objective.

**Why this fills a real gap:**
Abstract tracking (checkmarks) eventually feels hollow. After 60 days
of checking "Exercise", what has actually changed? The proof gallery
provides tangible evidence: "Day 1: 10 pushups. Day 60: 35 pushups."
This is concretely motivating in a way that streaks and health scores
can never be.

The mini trend chart for quantitative entries also enables a form of
progress tracking that no other feature provides — it answers "Am I
getting *better* at this habit, not just *doing* it?"

**Implementation:**
- Schema: New `proofEntries` collection:
  `{ habitId, date, value: string, numericValue?: number }`
- Backend: `POST /api/proof` (create entry), `GET /api/proof/:habitId`
- Frontend: Optional input on toggle (or expandable row detail)
- Frontend: `<ProofGallery />` per-habit view with timeline + mini chart
- Utils: `extractNumericValue(text)` — regex to parse numbers from
  entries for auto-plotting

**Effort:** Medium | **Dependencies:** None (enhanced by Heatmap [#5])

---

### C5: Streak Weather (Ambient Status Visualization)

**What:** The app header/background subtly reflects overall habit health
through an ambient weather metaphor:

| Overall Health | Visual | Description |
|---------------|--------|-------------|
| All habits healthy (>80% today) | Clear sky gradient | Calm blue, slight sun glow |
| Most habits on track (60-80%) | Partly cloudy | Softer gradient, subtle cloud shapes |
| Several at risk (40-60%) | Overcast | Gray-blue gradient, muted colors |
| Multiple streaks breaking (<40%) | Storm | Darker gradient, subtle rain animation |
| Perfect day (100% complete) | Golden hour | Warm amber gradient, celebration glow |

The weather is purely ambient — it sits in the background gradient and
header area. It never blocks content or requires interaction.

**Why this fills a real gap:**
Every existing visualization requires *reading*: numbers, percentages,
charts, badges. Streak Weather communicates status through *peripheral
awareness* — the way you know it's raining outside without checking the
forecast, just by the light in the room.

This matters because habit trackers are opened briefly, often while
distracted. A user who opens the app and sees a storm doesn't need to
scan every row to know "today isn't going well." The emotional tone is
set before they read a single number.

It also creates a subtle emotional reward loop: maintaining a clear sky
becomes intrinsically satisfying. You don't want to "make it rain" —
not because of a score or streak, but because the app *feels* different.

This leverages the existing dark theme's CSS variable system — weather
states are just gradient and opacity changes on existing elements.

**Implementation:**
- Frontend: `getWeatherState(habits, logs, today)` utility returning
  one of 5 states
- Frontend: CSS classes for each weather state applied to `<body>` or
  app container — gradient color shifts, optional subtle CSS animations
- Frontend: Small weather icon in the header as a non-intrusive indicator
- No backend changes — derived from existing data
- Degrades gracefully: if prefers-reduced-motion, show only gradient
  changes (no animation)

**Effort:** Low-Medium | **Dependencies:** None

---

### C6: Habit Compatibility Advisor

**What:** When a user creates a new habit, the app analyzes their
existing habits and shows a brief compatibility assessment:

> "You currently have 5 morning habits (~40 min). Adding **Yoga 20min**
> brings your morning to ~60 min. Your morning completion rate is 88% —
> historically, adding a 6th morning habit has correlated with a 15%
> drop in completion for similar users."

For the single-user version (no "similar users" data), base this on
the user's own history:

> "Your current daily commitment: 7 habits, ~55 min.
> After your last increase (from 5 to 6), your completion rate dropped
> from 91% to 74% for 2 weeks before recovering. Expect an adjustment
> period."

**Why this fills a real gap:**
Every existing feature helps users *track* habits. None help users
*decide whether to add one*. Habit overcommitment is the #1 cause of
tracker abandonment (more habits → lower completion rate → guilt →
stop using app). Currently the app is a passive recorder; this makes
it an active advisor.

Time Budgeting (N8) shows raw time cost. The Compatibility Advisor
contextualizes it: "Here's what happened *last time* you added a habit
to this time slot." That's a fundamentally different and more useful
signal.

**Implementation:**
- Frontend: `<CompatibilityAdvisor />` component in HabitForm,
  shown after frequency and time-of-day are selected
- Utils: `assessCompatibility(newHabit, existingHabits, logs)` —
  counts habits in the same time slot, calculates current load,
  checks historical completion rate changes around habit-addition dates
- No backend changes
- Only shown when user has 3+ existing habits (not useful for new users)

**Effort:** Medium | **Dependencies:** Contextual Check-In (P4) for
time-of-day data. Works without it but less precise.

---

### C7: Ritual Builder (Micro-Step Breakdown)

**What:** Any habit can optionally have a "ritual" — a sequence of
2-5 tiny steps that break down the activation barrier:

**Example: "Exercise"**
1. Put on workout clothes
2. Fill water bottle
3. Walk to gym (or open workout app)
4. Warm up 5 min
5. Full workout

The user can either check off the whole habit (normal toggle) or
expand to see the ritual and check off individual steps. Completing
step 1 automatically begins a visual cascade that encourages steps
2-5.

**Why this is different from Micro-Habits (F9):**
Micro-Habits (F9) changes the *completion model* (25%/50%/75%/100%).
The Ritual Builder changes the *activation model* — it reduces the
perceived size of the habit by showing the tiny first step.

**Why this is different from Habit Stacking (F3):**
Stacking groups *different* habits into a routine. A ritual breaks
*one* habit into sub-steps. "Morning Routine" (stack) contains
"Exercise" (habit) which contains "Put on shoes → Walk to gym →
Work out" (ritual).

**Why this fills a real gap:**
The biggest barrier to habit execution isn't the habit itself — it's
*starting*. BJ Fogg's research shows that the "starter step" (the
first physical action) determines whether the full behavior happens.
"Do 50 pushups" is daunting. "Put on workout clothes" is trivial.
Once you're dressed, momentum carries you.

No existing feature models this startup friction. The Ritual Builder
makes the path from "I should" to "I'm doing it" visible and concrete.

**Implementation:**
- Schema: Add `ritual: string[] | null` to Habit (array of step labels)
- Frontend: Optional ritual editor in HabitForm (add/remove/reorder steps)
- Frontend: Expandable row in HabitRow — click to reveal step checklist
- Frontend: Steps are ephemeral (not persisted) — they reset daily. Only
  the top-level habit completion is stored.
- Backend: Accept and persist the `ritual` array

**Effort:** Medium | **Dependencies:** None

---

### C8: Habit Autopilot Detection & Graduation

**What:** When a habit reaches a high consistency threshold (90%+ for
60+ days), the app suggests "graduating" it from active tracking:

> "**Meditation** has been at 95% for 78 days. It looks automatic —
> you might not need to track it anymore. Graduate it?"

Graduated habits move to a "Habits on Autopilot" section. They're
still tracked passively (the user can still toggle them), but they're
visually de-emphasized — smaller rows, no streak display, no health
score. If completion drops below 70% for a week, they automatically
"un-graduate" with a notification.

**Why this fills a real gap:**
Every feature assumes habits need *more* attention. But the goal of
habit formation is *automaticity* — doing it without thinking. A truly
successful habit shouldn't need a prominent row in the tracker; that
space should go to habits still being formed.

Adaptive Scaling (N6) prompts users to level up. Graduation is the
opposite — it prompts users to *let go* of the tracking itself. This
is the natural end-state of the garden metaphor: a fully grown tree
doesn't need daily watering.

This also solves the "too many habits" problem differently from
categories, stacking, or focus mode. It doesn't hide habits — it
acknowledges that some have *succeeded* and deserve a different status.

The auto-un-graduation safety net means users won't lose a habit by
graduating it too early.

**Implementation:**
- Schema: Add `graduated: boolean` to Habit (default false)
- Frontend: `<GraduationPrompt />` shown when habit crosses threshold
- Frontend: `<AutopilotSection />` — collapsed section below active
  habits showing graduated habits in a compact format
- Frontend: Auto-un-graduation check runs on each page load
- Backend: `POST /api/habits/:id/graduate` and `/ungraduate`
- Utils: `isGraduationCandidate(logs, habit)` — 90%+ for 60+ days

**Effort:** Low-Medium | **Dependencies:** None (enhanced by Momentum
Stages [N3])

---

## 3. Existing Proposal Audit

### Features to Keep (Validated)

These features from prior docs are well-reasoned, non-redundant, and
should remain in the backlog:

| ID | Feature | Source | Verdict |
|----|---------|--------|---------|
| G1 | Edit Habit | BACKLOG | **Keep — critical** |
| G2 | View/Restore Archived | BACKLOG | **Keep — critical** |
| G3 | Onboarding / Empty State | BACKLOG | **Keep — critical** |
| G4 | Mobile Responsive | BACKLOG | **Keep — critical** |
| #1 | Dashboard Stats | FEATURES | Keep — foundational |
| #3 | Undo Toast | FEATURES | Keep — UX standard |
| #4 | Data Export | FEATURES | Keep — data ownership |
| #5 | Heatmap | FEATURES | Keep — most-requested viz |
| F1 | Streak Shields | NEW_FEATURES | Keep — proven retention mechanic |
| F2 | Health Score | NEW_FEATURES | Keep — better than raw streaks |
| F5 | Smart Rest Days | NEW_FEATURES | Keep — fixes fundamental model flaw |
| F3 | Habit Stacking | NEW_FEATURES | Keep — core Atomic Habits concept |
| N2 | Completion Timestamps | BACKLOG | Keep — invisible infrastructure |
| N7 | Auto-Backup | BACKLOG | Keep — data protection |
| #14 | Theme Toggle | FEATURES | Keep — low effort, high polish |
| #2 | Categories/Tags | FEATURES | Keep — needed at scale |
| F11 | Keyboard Shortcuts | NEW_FEATURES | Keep — power user essential |

### Features to Merge (Redundant)

| Merge Into | Absorbs | Reasoning |
|------------|---------|-----------|
| **F4: Failure Recovery** | N10: Personal Records | Both address post-streak-break psychology. Personal Records (best streak, countdown to beat it) should be *part of* the Failure Recovery Dashboard, not a separate feature. Merged feature = Failure Recovery + Personal Records. |
| **N3: Momentum Stages** | P3: Identity Statements | Both model habit maturity over time. Identity statements should surface *at* the Rooted/Evergreen stage transition — they're a *component* of Momentum Stages, not a standalone feature. Merged feature = Momentum Stages with identity reveal. |
| **N1: Today View** | P4: Contextual Check-In | Today View (simplified checklist) and Contextual Check-In (morning/evening filtering) are both "show me what's relevant right now." Merge into a single **Smart Daily View** that combines both: a simplified checklist filtered by time-of-day. |
| **P2: Streak Decay Warnings** | F14: Habit Sunset | Both are "early warning" systems at different timescales. Decay warns within a day; Sunset warns over weeks. Merge into a unified **Habit Health Alerts** system with escalating severity: At Risk (today) → Declining (this week) → Inactive (2+ weeks). |

### Features to Cut or Defer Indefinitely

| ID | Feature | Verdict | Reasoning |
|----|---------|---------|-----------|
| F6 | Mood & Energy Correlation | **Cut** | Requires daily mood logging — a second daily habit that most users won't sustain. The insight value doesn't justify the friction. If mood tracking matters, it should be a separate app that integrates. |
| F7 | Habit Experiments | **Defer** | Interesting concept but adds schema complexity for a niche use case. Users can mentally frame any habit as a 30-day trial without special UI. |
| F9 | Micro-Habits / Partial Completion | **Defer** | Breaking schema change (logs go from string[] to object[]). The Ritual Builder (C7) solves the same core problem (all-or-nothing anxiety) without a schema migration. Revisit after database migration. |
| N9 | Natural Language Input | **Cut** | Over-engineered. A regex parser that handles "3x per week" but fails on "every other day" or "twice on Mondays" creates more frustration than the form it replaces. The structured form works. |
| P9 | Power Hours | **Defer** | Blocked by Timestamps (N2). Valuable but can't ship until N2 has been live long enough to accumulate data. |
| #10 | Authentication | **Defer** | Only needed for public deployment. Keep the app single-user until there's a real deployment target. |
| #11 | Database Migration | **Defer** | JSON file works until auth is needed. Don't add infrastructure complexity to a single-user app. |
| #15 | PWA / Offline | **Defer** | Large effort, single-user app. Ship when targeting mobile users. |
| #16 | Social / Accountability | **Defer** | Requires auth, which is deferred. |
| F12 | iCal Export | **Defer** | Niche value. Calendar integration is nice but not a retention driver. |
| F15 | Import from Trackers | **Defer** | No users to import yet. Build when there's demand. |
| P5 | Habit Chains | **Cut** | Modeling dependency between habits adds complexity that Stacking (F3) + Cue Mapping (C1) already cover more elegantly. A cue like "After Meditation" + stacking them in sequence achieves the same result without a graph data structure. |
| P6 | Weekly Intentions | **Merge into F10** | The "anchor habit" concept folds naturally into the Weekly Review Wizard. |
| P7 | Time Capsule Snapshots | **Defer** | Requires months of data to be interesting. Build after the app has been in active use. |
| P8 | Anti-Habit Tracking | **Keep but deprioritize** | Opens a new use case but increases scope. Not critical path. |
| N4 | Streak DNA Visualization | **Keep** | Unique inline viz, complements heatmap. |
| N5 | Correlation Map | **Defer** | Needs 60+ days of multi-habit data. Build in the insights sprint. |
| N6 | Adaptive Scaling | **Keep** | Unique "habit growth" prompt. |
| N8 | Time Budgeting | **Keep** | Pairs well with Compatibility Advisor (C6). |
| #6 | Habit Notes | **Replaced by C4** | Progress Proof Gallery supersedes generic notes. Proof entries are notes with structure. |
| #7 | Reminders | **Defer** | Browser notifications require permission prompts that most users deny. Streak Decay Warnings (P2) solve the awareness problem passively. |
| #8 | Drag & Drop Reorder | **Keep** | Standard UX expectation. |
| #9 | Reports Page | **Keep** | Capstone analytics feature. |
| #12 | Templates | **Keep** | Low effort, good onboarding. |
| #13 | Goals & Milestones | **Keep** | Complements Momentum Stages. |
| P1 | Difficulty Tiers | **Keep** | Low effort, adds nuance. |
| P10 | Minimum Viable Day | **Keep** | Directly reduces abandonment. |

---

## 4. Unified Backlog (Trimmed & Prioritized)

After merging, cutting, and adding new features, the backlog has **30
active features** organized into 6 sprints. This is still ambitious but
more realistic than 55+.

**Scoring:** Impact (1-5) x Effort Inverse (5=trivial, 1=huge).
Dependency chains break ties.

---

### Sprint 1: Fix the Foundation (Week 1-2)

**Goal:** Fix embarrassing UX gaps. Zero schema changes. Zero new deps.

| # | Feature | Type | Effort | Notes |
|---|---------|------|--------|-------|
| 1 | **G1: Edit Habit** | UX Gap | Small | PATCH endpoint + edit modal |
| 2 | **G2: View/Restore Archived** | UX Gap | Small | Collapsible section + unarchive |
| 3 | **G3: Onboarding / Empty State** | UX Gap | Small | Centered card + template starters |
| 4 | **#3: Undo Toast** | UX Standard | Small | Re-toggle on undo, 5-second window |
| 5 | **N7: Auto-Backup** | Safety | Small | File copy on write, 7-day retention |
| 6 | **#14: Theme Toggle** | Polish | Small | CSS variable swap + localStorage |

**Deliverable:** The app no longer has basic usability holes. Data is
protected. Users can edit, unarchive, undo, and choose their theme.

---

### Sprint 2: Motivation 2.0 (Week 3-4)

**Goal:** Replace the fragile streak-only motivation system. All
frontend-only — no backend changes.

| # | Feature | Type | Effort | Notes |
|---|---------|------|--------|-------|
| 7 | **F2: Health Score** | Core | Low | Composite 0-100 score replacing raw streak emphasis |
| 8 | **F4+N10: Failure Recovery + Personal Records** | Core | Low | Recovery dashboard with personal bests and comeback tracking |
| 9 | **N3+P3: Momentum Stages + Identity** | Core | Low-Med | Seedling→Growing→Rooted→Evergreen with identity reveal |
| 10 | **P2+F14: Habit Health Alerts** | Core | Low | Unified at-risk → declining → inactive warning system |
| 11 | **P10: Minimum Viable Day** | Core | Low | Mark 2-3 habits as MVD, header status indicator |
| 12 | **C5: Streak Weather** | Polish | Low-Med | Ambient background reflecting overall health |

**Deliverable:** The app's motivation system is resilient, forgiving, and
visually expressive. Streak breaks are cushioned. Habits have lifecycle
stages. The app *feels* different based on your day.

---

### Sprint 3: Data Model & Daily Experience (Week 5-7)

**Goal:** Schema improvements that unlock future features + optimize the
daily check-in experience.

| # | Feature | Type | Effort | Notes |
|---|---------|------|--------|-------|
| 13 | **N2: Completion Timestamps** | Infra | Medium | ISO timestamps on toggle, backward-compat migration |
| 14 | **F5: Smart Rest Days** | Core | Medium | Custom frequency model (weekdays, N times/week) |
| 15 | **N1+P4: Smart Daily View** | Core | Medium | Simplified checklist filtered by time-of-day |
| 16 | **C1: Habit Cue Mapping** | New | Low | Cue field, prefix display, cue-sorted Today View |
| 17 | **C2: "Why I Started" Capsule** | New | Low | Motivation note surfaced at critical moments |
| 18 | **#1: Dashboard Stats** | Core | Low | Completion rate, active habits, longest streak |
| 19 | **#4: Data Export** | Core | Low | JSON/CSV download before model gets more complex |
| 20 | **G4: Mobile Responsive** | UX Gap | Medium | 7-day grid, 44px tap targets on mobile |

**Deliverable:** The data model supports real scheduling flexibility.
Daily check-in is fast and context-aware. Cues and motivations are
captured. Data can be exported.

---

### Sprint 4: Engagement & Organization (Week 8-10)

**Goal:** Add depth — visualizations, grouping, difficulty, and rituals.

| # | Feature | Type | Effort | Notes |
|---|---------|------|--------|-------|
| 21 | **#5: Heatmap** | Viz | Medium | GitHub-style calendar heatmap per habit |
| 22 | **F3: Habit Stacking / Routines** | Core | Medium | Collapsible groups with "Complete All" |
| 23 | **F1: Streak Shields / Vacation** | Core | Medium | Earned shields + vacation date ranges |
| 24 | **P1: Difficulty Tiers** | Enhancement | Low | 1-5 star rating, effort-weighted scoring |
| 25 | **C7: Ritual Builder** | New | Medium | Micro-step breakdown for complex habits |
| 26 | **#8: Drag & Drop Reorder** | UX | Medium | Persistent sort order |
| 27 | **F11: Keyboard Shortcuts** | UX | Low-Med | j/k navigation, space toggle, / command palette |

**Deliverable:** Rich organizational tools. Habits have difficulty,
sub-steps, routines, and visual history. Power user shortcuts.

---

### Sprint 5: Insight & Reflection (Week 11-13)

**Goal:** Make accumulated data useful. Surface patterns and proof.

| # | Feature | Type | Effort | Notes |
|---|---------|------|--------|-------|
| 28 | **C4: Progress Proof Gallery** | New | Medium | Evidence entries with trend charts |
| 29 | **C3: Habit Autopsy** | New | Medium | Structured reflection on dropped habits |
| 30 | **F8+N5: Insights Engine + Correlations** | Core | Med-High | Pattern detection + habit pair analysis |
| 31 | **F10+P6: Weekly Review + Intentions** | Core | Medium | Guided reflection wizard with anchor habits |
| 32 | **#9: Reports Page** | Core | Medium | Weekly/monthly summary with charts |
| 33 | **N4: Streak DNA Visualization** | Viz | Medium | Inline barcode history per habit |
| 34 | **C6: Compatibility Advisor** | New | Medium | Smart guidance when adding habits |

**Deliverable:** The app is an insight engine. Users understand their
patterns, learn from failures, capture proof, and reflect weekly.

---

### Sprint 6: Growth & Scale (Week 14+)

**Goal:** Features for mature usage and potential multi-user deployment.

| # | Feature | Type | Effort | Notes |
|---|---------|------|--------|-------|
| 35 | **C8: Autopilot Detection** | New | Low-Med | Graduate stable habits, auto-un-graduate on decline |
| 36 | **N6: Adaptive Scaling** | Enhancement | Low-Med | "Level up" prompts for consistent habits |
| 37 | **#13: Goals & Milestones** | Core | Medium | Target days + celebration animation |
| 38 | **#12: Templates** | Polish | Small | Preset habit library for onboarding |
| 39 | **N8: Time Budgeting** | Enhancement | Low | Estimated minutes + daily time total |
| 40 | **#2: Categories/Tags** | Org | Medium | User-defined tags with filtering |
| 41 | **P8: Anti-Habit Tracking** | New Use Case | Medium | Inverse tracking for things to stop |

**Deferred Indefinitely (build only when needed):**
Authentication, Database Migration, PWA/Offline, Social Features,
iCal Export, Import, Reminders, Micro-Habits/Partial Completion

---

## 5. Feature Dependency Graph

```
                    ┌─ Sprint 1: Foundation ─┐
                    │  G1 G2 G3 #3 N7 #14   │
                    └──────────┬─────────────┘
                               │
                    ┌──────────▼─────────────┐
                    │  Sprint 2: Motivation   │
                    │  F2 F4 N3 P2 P10 C5    │
                    └──────────┬─────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
    ┌─────────────────┐  ┌──────────┐  ┌──────────────┐
    │ Sprint 3: Model │  │ C1 cues  │  │ C2 motivation│
    │ N2 F5 G4 #1 #4  │  │ enhance  │  │ capsules     │
    │ Smart Daily View│  │ daily    │  │ at risk      │
    └────────┬────────┘  │ view     │  │ moments      │
             │           └──────────┘  └──────────────┘
    ┌────────▼────────┐
    │Sprint 4: Engage │
    │#5 F3 F1 P1      │
    │C7 #8 F11        │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │Sprint 5: Insight│──── C3 autopsies feed into
    │C4 C3 F8 F10     │     future pattern reports
    │#9 N4 C6         │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │Sprint 6: Growth │
    │C8 N6 #13 #12    │
    │N8 #2 P8         │
    └─────────────────┘
```

**Key dependency chains:**
- N2 (Timestamps) → P9 (Power Hours) → deferred
- F5 (Smart Rest Days) → Streak/Health recalculation
- G1 (Edit Habit) → unlocks changing difficulty, cues, rituals later
- F2 (Health Score) → feeds into C5 (Streak Weather), C6 (Compatibility)
- C3 (Autopsy) data → pattern learning improves over time

---

## 6. New Feature Reasoning Summary

| Feature | Dimension it fills | Why no prior proposal covers it |
|---------|-------------------|--------------------------------|
| **C1: Cue Mapping** | The habit loop (cue pillar) | All 55 prior features model the routine. Zero model the trigger. |
| **C2: Motivation Capsule** | Intrinsic motivation | Prior features track *what* and *how well*. None capture *why*. |
| **C3: Habit Autopsy** | Learning from failure | Prior features cushion failure or warn about it. None learn from it. |
| **C4: Progress Proof** | Tangible evidence | All tracking is abstract (checkmarks). None capture real output. |
| **C5: Streak Weather** | Ambient awareness | All visualizations require reading. None communicate through atmosphere. |
| **C6: Compatibility Advisor** | Decision support | All features help track habits. None help decide whether to add one. |
| **C7: Ritual Builder** | Activation energy | Prior features address completion anxiety. None address startup friction. |
| **C8: Autopilot Detection** | Habit graduation | All features assume habits need more attention. None recognize when to let go. |

---

## 7. Decision Log

| Decision | Rationale |
|----------|-----------|
| Consolidate 4 docs into 1 | Fragmented planning creates confusion. One backlog, one priority order. |
| Cut feature count from 55+ to 41 active | A realistic backlog is more useful than an aspirational one. Cut/merged 14 features. |
| Merge overlapping features (4 merges) | Failure Recovery + Personal Records, Momentum + Identity, Today View + Contextual, Decay Warnings + Sunset are natural pairs. |
| Cut Mood Correlation (F6) | Daily mood logging is a second daily habit most users won't sustain. |
| Cut Natural Language Input (N9) | Regex parsers for natural language create more frustration than they solve. |
| Cut Habit Chains (P5) | Cue Mapping (C1) + Stacking (F3) achieve the same result more simply. |
| Add 8 new features in 3 new dimensions | The habit loop (cue/reward), learning from failure, and ambient awareness were completely unaddressed. |
| Sprint 2 before Sprint 3 | Motivation improvements require zero schema changes and dramatically improve retention. Fix how the app *feels* before changing the data model. |
| Defer all infrastructure (auth, DB, PWA) | Single-user app doesn't need multi-user infra. Ship features first, scale later. |
| No AI/ML anywhere | Deterministic logic is explainable, fast, and free of API dependencies. |
| Progress Proof replaces generic Notes | Structured evidence > unstructured journaling for a habit tracker. |
| Ritual Builder over Micro-Habits | Rituals reduce startup friction without a breaking schema change. |
