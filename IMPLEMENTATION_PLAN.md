# Habit Garden — Implementation Plan & New Features

> **This is the definitive planning document.** It introduces 6 genuinely novel
> features, consolidates the best of 65+ prior proposals into a single prioritized
> backlog, and provides a concrete build order.
>
> **Why this document exists despite 7 prior planning docs:** Those docs diagnosed
> the problem correctly ("the bottleneck is not ideas, it's building") but then
> added more ideas. This document draws the line: 6 new features that fill
> dimensions no prior proposal touches, a clean backlog, and then we build.
>
> Created: 2026-05-17

---

## Part 1: Current State

**What's shipped (~960 lines):**
- Habit CRUD (create, archive, delete — no edit)
- Daily/weekly toggle with 14-day rolling grid
- Streak calculation (consecutive days/weeks)
- Dark theme, optimistic updates, toast notifications
- JSON file persistence with async mutex
- 17 backend integration tests

**What's not shipped:** Everything in FEATURES.md, NEW_FEATURES.md, BACKLOG.md,
FEATURE_PLAN.md, FEATURE_PLAN_v3.md, FEATURE_PROPOSALS.md, ROADMAP.md, and
CREATIVE_FEATURES.md. Zero features have been built beyond the initial MVP.

**Key code files:**
- `src/types.ts` — Habit and HabitLog types (15 lines)
- `src/utils.ts` — streak calc, date helpers (71 lines)
- `src/hooks/useHabits.ts` — all state management (107 lines)
- `src/components/` — HabitForm, HabitRow, HabitTable
- `server/app.js` — Express routes, validation, file I/O (129 lines)

---

## Part 2: New Feature Proposals (6 Features)

Each feature below addresses a dimension that **none** of the 65+ prior proposals
cover. I've verified each against every feature in FEATURES.md, NEW_FEATURES.md,
BACKLOG.md, FEATURE_PROPOSALS.md, ROADMAP.md (NEW-1 through NEW-5), and
CREATIVE_FEATURES.md (C1 through C10).

---

### P-1: Progressive Habit Slots (Intake Limiting)

**What:** New users start with a maximum of 3 active habit slots. After maintaining
70%+ completion across all habits for 14 consecutive days, a 4th slot unlocks. Then
a 5th after another 14 days at 70%+. Cap at 8 active habits.

If completion drops below 50% for 7 days, the app suggests (doesn't force) reducing
back to fewer habits: "You're at 40% this week. Want to focus on your top 3 for now?"

**Why no prior doc covers this:**
Every document proposes *warnings* about overcommitment — Time Budgeting (N8) shows
total minutes, Sunset Prompts (F14) suggest dropping stale habits, Habit Warmup (C1)
eases individual habits in. But none of them *structurally limit intake*. They all
assume users will self-regulate after seeing data. They won't.

The research is clear: habit tracker abandonment is driven primarily by adding too
many habits before any are established. Apps like Duolingo, Wordle, and Streaks
(Apple Design Award winner, hard cap of 12) succeed partly because they constrain
scope.

**Why it works:**
- The constraint is *motivating*, not restrictive ("I earned my 4th slot!")
- Prevents the #1 failure mode (overcommitment) at the structural level
- Creates a natural progression arc for the app itself
- The slot unlock is a milestone that feeds Trophy Wall (NEW-4)

**Implementation:**
- Frontend: `maxSlots(habits, logs)` — calculate unlocked slots from completion history
- Frontend: "Slot locked" indicator on the create form when at capacity
- Frontend: Unlock celebration when a new slot opens
- No backend changes — derived from existing data
- Config: allow power users to disable the limit in a settings toggle

**Effort:** Low | **Dependencies:** None

---

### P-2: Weekly Rhythm Fingerprint

**What:** A radar/spider chart showing completion rate by day of the week:

```
         Mon (92%)
        /         \
  Sun  /           \ Tue
 (60%)|             |(88%)
       \           /
  Sat   \         / Wed
  (55%)  \       / (85%)
          Thu---Fri
         (78%) (42%)
```

Reveals your weekly rhythm at a glance: "You're strongest on Mondays and weakest
on Fridays." Actionable insight: reschedule hard habits away from weak days, or
investigate what makes Fridays different.

**Why no prior doc covers this:**
- Heatmap (#5): calendar view — shows *dates*, not *day-of-week patterns*
- Streak DNA (N4): sequential barcode — shows *continuity*, not *cyclical rhythm*
- Insights Engine (F8): text-based analysis — this is a specific *visual* tool
- Dashboard Stats (#1): aggregate numbers — no day-level breakdown
- Smart Rest Days (F5): custom frequency — lets you *set* which days, but doesn't
  *discover* which days actually work

The weekly cycle is the most fundamental rhythm in human habit behavior (work vs.
weekend, Monday motivation vs. Friday fatigue) and no proposal visualizes it.

**Implementation:**
- Utils: `weekdayCompletionRates(logs, habits)` — 7 percentages from log dates
- Frontend: `<WeeklyRhythm />` — SVG radar chart (no library needed, 7-point polygon)
- Shows in dashboard or as an expandable panel in the habit table header
- No backend changes

**Effort:** Low | **Dependencies:** None (needs 2+ weeks of data to be meaningful)

---

### P-3: Completion Context Tags (1-Tap Micro-Sentiment)

**What:** After toggling a habit complete, an optional 1-second interaction appears:
three small emoji buttons — "💪 Easy" / "😤 Hard" / "🔄 Modified". One tap, then
it disappears. No typing required.

Over time, this builds a difficulty profile per habit:
- "Exercise: 60% Hard, 30% Easy, 10% Modified"
- "Meditation: 85% Easy, 15% Hard"

This data surfaces as: "Exercise is consistently hard for you. Consider scaling it
down or moving it to your strongest day (Monday, per your Rhythm Fingerprint)."

**Why no prior doc covers this:**
- Effort-Reward Map (C9): static 1-5 rating set once per habit — doesn't change
- Journal (NEW-5): free-text, day-level, requires typing
- Habit Notes (#6): free-text, habit-level, requires typing
- Confidence Calibration (C5): prediction before the day — not reflection after
- Difficulty Tiers (P1 in PROPOSALS): static category assignment

None capture *per-instance, dynamic* difficulty. The same habit is easy on Monday
and hard on Friday. Static ratings miss this entirely. The 1-tap interaction has
near-zero friction — it adds ~1 second to the toggle action.

**Implementation:**
- Schema: Extend log entries from `string[]` to allow optional tag:
  `logs[habitId] = ["2026-05-17", { date: "2026-05-16", tag: "hard" }]`
  (backward-compatible: strings are tagless, objects have tags)
- Frontend: Brief tag picker that appears after toggle, auto-dismisses in 3s
- Frontend: Difficulty breakdown in habit detail/expand view
- Backend: Accept extended log format in toggle endpoint
- Utils: `difficultyProfile(logs)` — aggregate tags per habit

**Effort:** Low-Medium | **Dependencies:** None

---

### P-4: Habit Sunrise/Sunset (Planned Lifecycle)

**What:** Habits can have a planned start date ("sunrise") and/or end date
("sunset"). Use cases:

- "30-day yoga challenge" → May 1 to May 30
- "Study for exam" → starts June 1, ends June 15
- "No alcohol in January" → Jan 1 to Jan 31
- "Start running" → sunrise June 1 (appears on that date, not before)

When a sunset date passes, the habit auto-completes with a summary: "30-day yoga
challenge: complete! 27/30 days (90%). This habit has been retired."

Sunrise habits appear in a "Coming Soon" section before their start date.

**Why no prior doc covers this:**
- Seasons (NEW-2): *recurring annual* cycles (May-Sep every year). Sunrise/Sunset
  is a *one-time* planned window.
- Experiments (F7): a 30-day trial with intent to decide keep/drop. Sunrise/Sunset
  has no "should I keep it?" question — the end is planned from the start.
- Archive: manual, reactive — user decides to stop. Sunset is proactive, planned.
- Freeze (D8): temporary pause with intent to resume. Sunset is permanent completion.

Finite commitments are a major category of real habits (challenges, training plans,
seasonal goals, pre-event preparation) and the current model treats everything as
indefinite. Users who complete a 30-day challenge have to *archive* it, which feels
like quitting rather than finishing.

**Implementation:**
- Schema: Add `sunrise: string | null` and `sunset: string | null` (YYYY-MM-DD) to Habit
- Frontend: Optional date pickers in HabitForm (collapsed by default)
- Frontend: "Coming Soon" section for pre-sunrise habits
- Frontend: Auto-retirement with completion summary when sunset passes
- Frontend: Countdown badge ("12 days left") during final week
- Backend: Accept and persist the fields, filter pre-sunrise from active view
- Utils: `habitLifecycleStatus(habit, today)` — pending / active / completed

**Effort:** Low-Medium | **Dependencies:** None

---

### P-5: Streak Break Reflection Prompts

**What:** When a user opens the app and a streak has broken since their last visit,
show a brief, non-judgmental reflection card instead of silently resetting to
"Streak: 0":

> **Exercise streak paused at 12 days.**
> That's still 12 days of consistency.
> "What would make today easier?"
> [Restart] [Take a rest day] [Dismiss]

The prompts rotate from a curated set:
- "Was yesterday unusual, or is this a pattern?"
- "What's the smallest version of this habit you could do today?"
- "Your best streak was 23 days. You were 11 days from beating it."
- "You've restarted this habit 3 times before and built it back each time."

**Why no prior doc covers this:**
- Failure Recovery (F4): a *dashboard* showing recovery metrics. That's a place
  you navigate to. This is an *interstitial* that appears at the exact moment the
  streak breaks — it intercepts the "I failed" emotional response in real-time.
- Momentum Stages (N3): labels the phase ("Seedling needs watering") but doesn't
  prompt reflection or offer actionable next steps.
- Warmup Ramp (C1): helps new habits start easy — doesn't address established
  habits that break.

The streak break moment is the single highest-risk moment for habit abandonment.
Research on the "what-the-hell effect" (Polivy & Herman) shows that perceived
failure triggers giving up entirely. An immediate, compassionate reframe at that
exact moment is the most valuable intervention the app can make.

**Implementation:**
- Frontend: `<StreakBreakCard />` — shown when a habit's streak was >3 and is now 0
- Frontend: Track last-seen streak per habit in localStorage to detect breaks
- Frontend: Curated prompt list (10-15 prompts, randomly selected)
- Frontend: "Restart" button triggers today's toggle, "Rest day" logs a planned miss
- No backend changes — purely frontend state detection

**Effort:** Low | **Dependencies:** None

---

### P-6: Habit Replay (Animated History Playback)

**What:** A "Play" button that animates your entire habit history as a time-lapse:
each day lights up in sequence across all habits, streaks build and break, completion
counts tick upward. The 30-60 second animation shows your journey from day 1 to today.

If the Garden visualization (NEW-1) exists, Replay shows plants growing from seeds
to trees in fast-forward. Without the garden, it animates the habit grid filling in
day by day.

The animation is *shareable* — a "Save as GIF" or "Copy to clipboard" option
captures it as an image sequence.

**Why no prior doc covers this:**
- Monthly Memory Lane (C7): static narrative card for one month
- Streak DNA (N4): static barcode visualization
- Heatmap (#5): static calendar view
- Reports (#9): static analytics page
- Personal Records (N10): static number display

None of these are *animated*. The time dimension is flattened into a static view in
every case. But watching your habits build up over time is fundamentally different
from viewing a snapshot — it creates an emotional "look how far I've come" response
that no static view can match. GitHub's contribution graph animation, Spotify
Wrapped's timeline, and Strava's year-in-review all demonstrate that animated
recaps drive sharing and retention far more than static equivalents.

**Implementation:**
- Frontend: `<HabitReplay />` — canvas-based animation stepping through dates
- Frontend: Playback controls (play/pause, speed 1x/2x/4x)
- Frontend: Uses existing log data — iterates `generatePastNDays(totalDays)` and
  renders each frame by checking which habits were completed on that date
- Frontend: Optional "Save" button using canvas.toBlob() for GIF/image export
  (or html2canvas for simpler implementation)
- No backend changes

**Effort:** Medium | **Dependencies:** Enhanced by Garden (NEW-1) but works standalone

---

## Part 3: Why These 6 (And Not More)

| Feature | Dimension It Fills | Why 65+ Prior Proposals Miss It |
|---------|-------------------|-------------------------------|
| **P-1: Habit Slots** | Structural intake limiting | All docs *warn* about overcommitment. None *prevent* it. Warnings don't change behavior; constraints do. |
| **P-2: Weekly Rhythm** | Cyclical pattern discovery | Heatmaps show dates. DNA shows sequence. Nothing isolates the 7-day cycle — the most fundamental rhythm in habit behavior. |
| **P-3: Context Tags** | Dynamic per-instance difficulty | Effort-Reward (C9) is static. Journal (NEW-5) requires typing. No proposal captures "this was hard today" in 1 tap. |
| **P-4: Sunrise/Sunset** | Planned finite commitments | Seasons are recurring. Experiments are trials. Nothing models "I'm doing this for exactly 30 days, and that's the plan." |
| **P-5: Streak Break Prompts** | Real-time failure interception | Failure Recovery (F4) is a dashboard. This is an *interstitial* at the exact moment it matters — the highest-risk moment for abandonment. |
| **P-6: Habit Replay** | Animated temporal experience | Every visualization is static. Animation creates an emotional response that screenshots and charts cannot. |

**Design principles behind these choices:**
1. Each fills a dimension, not just a feature gap — they address *types of interaction* no prior proposal includes (structural limits, cyclical views, micro-sentiment, finite lifecycles, real-time interstitials, temporal animation).
2. Four of six require zero backend changes — they derive from existing data.
3. None require external dependencies, AI, or multi-user infrastructure.
4. All work on day 1 with existing data (except P-2, which needs ~2 weeks).

---

## Part 4: Consolidated Backlog (All Documents + New)

Every feature from all 8 prior documents + 6 new proposals, organized into a single
build sequence. Features that appear in multiple documents are listed once under the
most complete specification.

### Tier 1: Fix the Basics (Week 1-2)

Zero schema changes. Zero new dependencies. Make the MVP usable.

| # | ID | Feature | Source | Est. Hours | Why First |
|---|-----|---------|--------|------------|-----------|
| 1 | G1 | **Edit Habit** (name, color, frequency) | BACKLOG | 2-3 | Can't change anything without delete+recreate. Data loss. |
| 2 | G2 | **View/Restore Archived** habits | BACKLOG | 2-3 | Archived habits vanish forever. No review, no undo. |
| 3 | #3 | **Undo Toast** (5s window for accidental toggles) | FEATURES | 2-3 | One mis-tap destroys a streak. UX standard. |
| 4 | N7 | **Auto-Backup** on every write | BACKLOG | 2-3 | Single JSON file = single point of failure. Protect data. |
| 5 | #14 | **Theme Toggle** (dark/light) | FEATURES | 1-2 | CSS vars already exist. Trivial, high-polish perception. |
| 6 | G3 | **Onboarding / Empty State** | BACKLOG | 2-3 | New users see nothing helpful. |

**Exit criteria:** Users can create, edit, archive, unarchive, and delete habits.
Accidental toggles undoable. Data auto-backed up. Light theme available. Empty state
guides new users.

**Total estimate:** 12-17 hours

---

### Tier 2: Motivation & Daily Experience (Week 3-5)

No schema changes. All features derived from existing data. Transform the daily
check-in from a spreadsheet into an engaging experience.

| # | ID | Feature | Source | Est. Hours | Why Now |
|---|-----|---------|--------|------------|---------|
| 7 | P-5 | **Streak Break Prompts** | NEW | 2-3 | Highest-impact, lowest-effort intervention. Intercepts abandonment at the critical moment. |
| 8 | F2 | **Health Score** (composite 0-100) | NEW_FEATURES | 3-4 | Replaces fragile streak-only motivation with a resilient metric. |
| 9 | F4 | **Failure Recovery** dashboard | NEW_FEATURES | 2-3 | Reframes streak breaks as recoveries, not failures. |
| 10 | C10 | **Completion Combos** (daily cross-habit) | CREATIVE | 2-3 | Zero schema changes. Immediate daily motivation. |
| 11 | #1 | **Dashboard Stats** panel | FEATURES | 3-4 | Aggregated view: completion rate, active habits, best streak. |
| 12 | NEW-3 | **Quick Capture Bar** (persistent toggle) | ROADMAP | 3-4 | Daily toggle in 5 seconds without scrolling the grid. |
| 13 | N10 | **Personal Records** board | BACKLOG | 3-4 | "Streak broke" becomes "42 days from your record" — reframes failure as challenge. |
| 14 | P-1 | **Progressive Habit Slots** | NEW | 2-3 | Prevents overcommitment structurally. Creates app-level progression. |

**Exit criteria:** Daily check-in is fast (quick capture bar), streak breaks are
handled gracefully (prompts + recovery dashboard), cross-habit motivation exists
(combos), and there's a composite score that's more forgiving than raw streaks.

**Total estimate:** 22-28 hours

---

### Tier 3: Visual Identity & Insight (Week 6-8)

The app gets its visual identity. Light schema additions.

| # | ID | Feature | Source | Est. Hours | Why Now |
|---|-----|---------|--------|------------|---------|
| 15 | NEW-1 | **Living Garden** visualization (v1) | ROADMAP | 6-8 | The app is called "Habit Garden" but has no garden. This IS the product identity. |
| 16 | P-2 | **Weekly Rhythm Fingerprint** | NEW | 3-4 | Actionable insight with zero schema changes. Reveals when you're strong/weak. |
| 17 | N3 | **Momentum Stages** (Seedling→Evergreen) | BACKLOG | 3-4 | Gives habits a lifecycle arc. Maps directly to garden metaphor. |
| 18 | NEW-4 | **Trophy Wall / Milestones** | ROADMAP | 4-6 | Permanent record of achievements. Milestones persist after streaks break. |
| 19 | #4 | **Data Export** (JSON/CSV) | FEATURES | 2-3 | User data ownership. Ship before schema gets more complex. |
| 20 | P-4 | **Habit Sunrise/Sunset** | NEW | 3-4 | Planned finite commitments (challenges, training plans). Small schema addition. |
| 21 | G4 | **Mobile Responsive** fix | BACKLOG | 4-6 | 14-day grid overflows on mobile. Tap targets too small. |

**Exit criteria:** The app looks and feels unique (garden + momentum stages + trophies),
reveals weekly patterns (rhythm fingerprint), supports planned commitments (sunrise/
sunset), works on mobile, and data is exportable.

**Total estimate:** 25-35 hours

---

### Tier 4: Depth & Personalization (Week 9-12)

Schema enrichments that make the habit model smarter.

| # | ID | Feature | Source | Est. Hours | Why Now |
|---|-----|---------|--------|------------|---------|
| 22 | F5 | **Smart Rest Days** (custom frequency) | NEW_FEATURES | 6-8 | "3x/week" and "weekdays only" — the biggest gap in the habit model. |
| 23 | NEW-5 | **Habit Journal** (daily one-liner) | ROADMAP | 3-4 | Day-level context. Explains "why was that week red?" six months later. |
| 24 | C1 | **Warmup Ramp** (graduated start) | CREATIVE | 3-4 | Addresses the #1 failure point: first-week dropout. |
| 25 | C4 | **Environmental Cue** tracker | CREATIVE | 2-3 | Bridges digital and physical. Core Atomic Habits strategy. |
| 26 | P-3 | **Completion Context Tags** | NEW | 3-4 | 1-tap micro-sentiment builds dynamic difficulty profiles. |
| 27 | C3 | **Streak Savings Bank** | CREATIVE | 3-4 | Over-performance earns streak protection. Novel mechanic. |
| 28 | N2 | **Completion Timestamps** | BACKLOG | 4-5 | Infrastructure: enables time-of-day insights, duration tracking. Every day without it is lost data. |
| 29 | NEW-2 | **Habit Seasons** (cyclical habits) | ROADMAP | 4-5 | Swimming in summer, skiing in winter. Automatic lifecycle management. |

**Exit criteria:** Habits support custom schedules, warmup periods, environmental cues,
seasonal cycles, and context tags. Journal captures daily context. Timestamps enable
future time analytics. The habit model is now expressive enough for real life.

**Total estimate:** 30-37 hours

---

### Tier 5: Engagement & Delight (Week 13-16)

Features that create emotional connection and shareability.

| # | ID | Feature | Source | Est. Hours | Why Now |
|---|-----|---------|--------|------------|---------|
| 30 | C7 | **Monthly Memory Lane** (narrative recap) | CREATIVE | 5-6 | Only shareable content the app produces. Retention driver. |
| 31 | #5 | **Heatmap** (GitHub-style) | FEATURES | 5-6 | Most-requested long-term visualization. |
| 32 | P-6 | **Habit Replay** (animated history) | NEW | 5-6 | Emotional "look how far I've come." Shareable. |
| 33 | C5 | **Confidence Calibration** (predict→do→learn) | CREATIVE | 5-6 | Only forward-looking feature. Builds genuine self-knowledge. |
| 34 | C9 | **Effort-Reward Mapping** (quadrant chart) | CREATIVE | 3-4 | Strategic self-awareness: which habits are "gems" vs. "traps"? |
| 35 | F3 | **Habit Stacking** (chain routines) | NEW_FEATURES | 5-6 | Core Atomic Habits concept. Groups habits into routines. |
| 36 | F1 | **Streak Shields** (earned protection) | NEW_FEATURES | 4-5 | Duolingo-proven retention mechanic. |
| 37 | F11 | **Keyboard Shortcuts** | NEW_FEATURES | 3-4 | Power-user essential for daily-use app. |

**Exit criteria:** The app produces shareable content (recaps, replay), has rich
visualizations (heatmap), forward-looking engagement (calibration), strategic tools
(effort-reward, stacking), and power-user features (keyboard shortcuts).

**Total estimate:** 37-43 hours

---

### Tier 6: Intelligence & Advanced (Week 17+)

Features that synthesize accumulated data or require significant infrastructure.

| # | ID | Feature | Source | Est. Hours |
|---|-----|---------|--------|------------|
| 38 | C6 | Life Phase Modes | CREATIVE | 5-6 |
| 39 | C2 | A/B Habit Testing | CREATIVE | 5-6 |
| 40 | C8 | Smart Day Planner | CREATIVE | 5-6 |
| 41 | F8 | Insights Engine | NEW_FEATURES | 6-8 |
| 42 | N4 | Streak DNA Visualization | BACKLOG | 4-5 |
| 43 | N5 | Habit Pair Correlations | BACKLOG | 5-6 |
| 44 | N6 | Adaptive Scaling Prompts | BACKLOG | 3-4 |
| 45 | F7 | Habit Experiments (30-day trial) | NEW_FEATURES | 4-5 |
| 46 | F10 | Weekly Review Wizard | NEW_FEATURES | 5-6 |
| 47 | N1 | Today View / Focus Mode | BACKLOG | 3-4 |

---

### Tier 7: Infrastructure & Scale (Deferred Until Core Is Complete)

| # | ID | Feature | Source | Est. Hours |
|---|-----|---------|--------|------------|
| — | #11 | Database Migration (SQLite) | FEATURES | 16-24 |
| — | #10 | Authentication | FEATURES | 16-24 |
| — | #15 | PWA / Offline Support | FEATURES | 12-16 |
| — | #7 | Reminders / Notifications | FEATURES | 4-6 |
| — | #8 | Drag & Drop Reorder | FEATURES | 4-5 |
| — | #12 | Habit Templates | FEATURES | 2-3 |
| — | #2 | Categories / Tags | FEATURES | 4-6 |
| — | N8 | Time Budgeting | BACKLOG | 3-4 |
| — | N9 | Natural Language Input | BACKLOG | 5-6 |
| — | P8 | Anti-Habit Tracking | PROPOSALS | 4-6 |
| — | F6 | Mood Correlation | NEW_FEATURES | 6-8 |
| — | F9 | Micro-Habits | NEW_FEATURES | 8-10 |
| — | F12 | iCal Export | NEW_FEATURES | 4-5 |
| — | F15 | Import from Trackers | NEW_FEATURES | 5-6 |
| — | #16 | Social / Accountability | FEATURES | 12-16 |
| — | F13 | Best/Worst Day Markers | NEW_FEATURES | 2-3 |
| — | F14 | Habit Sunset Prompts | NEW_FEATURES | 2-3 |
| — | P3 | Identity Statements | PROPOSALS | 2-3 |
| — | P6 | Weekly Intentions | PROPOSALS | 4-5 |
| — | P5 | Habit Chains | PROPOSALS | 5-6 |
| — | P7 | Time Capsule Snapshots | PROPOSALS | 5-6 |
| — | P9 | Power Hours | PROPOSALS | 4-5 |
| — | #6 | Habit Notes (per-habit) | FEATURES | 3-4 |
| — | #9 | Reports Page | FEATURES | 6-8 |
| — | #13 | Goals & Milestones | FEATURES | 4-5 |

---

## Part 5: Recommended Build Order — "If You Only Build 5 Things"

If the project can only ship 5 features in the next month, build these:

| Priority | Feature | Hours | Why This Over Everything Else |
|----------|---------|-------|------------------------------|
| 1 | **G1: Edit Habit** | 2-3 | Without this, a typo requires delete + recreate + lose history. Every user hits this. |
| 2 | **G2: View/Restore Archived** | 2-3 | Archived habits are irrecoverable. Users need to see what they've archived and bring it back. |
| 3 | **#3: Undo Toast** | 2-3 | One accidental tap destroys a streak. This is table stakes for a daily-use app. |
| 4 | **P-5: Streak Break Prompts** | 2-3 | The highest-leverage behavioral intervention. Zero backend changes, 2 hours of work, prevents the #1 cause of app abandonment. |
| 5 | **NEW-1: Living Garden (v1)** | 6-8 | The app's name promises a garden. Delivering it transforms the product from "another habit table" into something memorable and differentiated. Start with CSS circles that grow with streak length. |

**Total: ~15-20 hours for a product that's materially better in every dimension.**

---

## Part 6: What NOT to Build (And Why)

| Don't Build | Why |
|-------------|-----|
| More planning documents | This is the 9th. The ratio of planning words to code lines is ~10:1. Ship code. |
| Authentication or database | No users exist yet. Build the experience, then the infrastructure. |
| AI-powered features | Deterministic logic is explainable, fast, and free. |
| Social/accountability | Requires auth, multi-user, and infrastructure. Defer entirely. |
| Features requiring 60+ days of data | Correlation maps, insights engines, and adaptive scaling are great — after users exist. |
| Any feature that adds planning overhead | No "weekly review wizards" or "intention setting" until the daily experience is nailed. |

---

## Part 7: Document Hierarchy

After this document, the project should have this planning structure:

| Document | Status | Purpose |
|----------|--------|---------|
| **IMPLEMENTATION_PLAN.md** (this file) | **Active** | Single source of truth for what to build and when. |
| ROADMAP.md | Historical | Good diagnosis, good features (NEW-1 through NEW-5). Referenced above. |
| CREATIVE_FEATURES.md | Historical | Good behavioral science analysis (C1-C10). Referenced above. |
| BACKLOG.md | Historical | Good UX gap analysis (G1-G4, N1-N10). Referenced above. |
| FEATURES.md | Historical | Original P0/P1/P2 priorities. Referenced above. |
| NEW_FEATURES.md | Historical | 15 original proposals. Referenced above. |
| FEATURE_PROPOSALS.md | Historical | Additional proposals. Referenced above. |
| FEATURE_PLAN.md, FEATURE_PLAN_v3.md | Historical | Earlier consolidation attempts. |

**Rule: No new planning documents after this one.** If new feature ideas arise,
add them to the Tier 7 backlog in this file. The next thing that should be created
is a pull request, not a markdown file.

---

## Part 8: New Feature Reasoning — Deep Dive

### Why intake limiting (P-1) is the most underrated missing feature

Every habit app lets you add unlimited habits. Every habit app has high churn.
These facts are related.

The academic literature on "choice overload" (Iyengar & Lepper, 2000) and
"goal dilution" (Zhang et al., 2007) shows that having more goals simultaneously
reduces commitment and follow-through for each one. Streaks (12 habits) and
Wordle (1 puzzle) succeed partly because they constrain scope.

Progressive slots turn the constraint into a reward. "You've earned your 4th habit
slot" is a milestone that:
- Validates the user's consistency
- Creates anticipation (what will my next habit be?)
- Forces prioritization (I can only pick 3, so which 3 matter most?)

No other habit app does this. It's a genuine product differentiator.

### Why streak break prompts (P-5) should be built immediately

The streak break moment has the worst user-experience-to-code-effort ratio in the
app. Currently: user opens app → sees "Streak: 0" → feels bad → closes app → never
comes back. Two hours of code can insert a compassionate, actionable interstitial
that reframes the moment from "I failed" to "what's next?"

The "what-the-hell effect" (Polivy & Herman, 1985) shows that perceived failure
triggers total abandonment: "I already broke the streak, so why bother?" A single
reframe at that moment ("12 days is still 12 days of consistency") can interrupt the
spiral. This is the highest-leverage 2-hour investment in the entire backlog.

### Why the weekly rhythm (P-2) is more actionable than a heatmap

A heatmap shows you *that* you missed days. A weekly rhythm fingerprint shows you
*which days* you consistently miss. The first is descriptive ("last Tuesday was
empty"). The second is prescriptive ("Fridays are your weak day — what's different
about Fridays?").

The 7-day cycle is so fundamental to habit behavior that it's surprising no habit
tracker surfaces it explicitly. Work/rest patterns, social obligations, energy
levels, and routine structures all follow a weekly rhythm. Making this visible is
the shortest path from data to actionable behavior change.

### Why planned lifecycles (P-4) fill a real modeling gap

The current habit model is: habits exist indefinitely until manually archived. But
many real commitments are finite by design:
- 30-day challenges
- Training plans (8-week marathon prep)
- Exam study periods
- Seasonal goals ("daily sunscreen May-September")
- Habit experiments ("try cold showers for 2 weeks")

These are not "habits that failed" — they're "commitments that completed." The
current app treats completion the same as abandonment (both end with archiving).
Sunrise/Sunset separates these: a completed challenge gets a victory lap, not a
gravestone.

### Why context tags (P-3) are better than journaling for most users

Journaling requires typing. Even a 140-character micro-journal (NEW-5) requires
15-30 seconds and a keyboard. Context tags require one tap and capture 80% of the
useful signal: was this easy or hard?

The per-instance difficulty data is uniquely valuable because it reveals patterns
invisible to any static rating:
- "Exercise is always hard on Mondays" → reschedule or adjust Monday's version
- "Meditation was easy 90% of the time this month" → ready to scale up
- "Reading was hard every day this week" → something changed in your environment

This is self-knowledge acquired passively through 1-second interactions.

### Why animated replay (P-6) drives retention differently than static views

Static visualizations inform. Animations move. The difference is emotional, not
informational — a heatmap contains the same data as a replay, but watching your
garden grow from nothing to full bloom in 30 seconds creates an attachment that a
colored grid cannot.

Spotify Wrapped's success (2B+ social impressions per year) proves that animated
personal recaps are the highest-sharing-potential feature category. This is
especially valuable for Habit Garden because the garden metaphor is inherently
visual and temporal — plants growing is a *natural animation*, not a forced one.
