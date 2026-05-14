# Habit Garden — Consolidated Feature Plan

> **This is the single source of truth.** It supersedes ROADMAP.md, BACKLOG.md,
> NEW_FEATURES.md, FEATURES.md, FEATURE_PLAN.md, FEATURE_PLAN_v3.md,
> FEATURE_PROPOSALS.md, and GEMINI.md. Those files are preserved as historical
> reference only.
>
> Created: 2026-05-14

---

## Current State

**What's built (~960 lines):** Habit CRUD, daily/weekly toggle, 14-day
grid, streak calculation (daily + weekly), dark theme, optimistic updates
with rollback, toast notifications, JSON file persistence with async
mutex, 17 backend integration tests.

**What's not built:** Everything below. Seven prior documents proposed
55+ features. Zero shipped beyond the MVP.

---

## Part 1 — New Creative Features

These 8 features are **not covered by any prior planning document**. Each
fills a blind spot in the existing 55+ proposals.

---

### C1: Habit Difficulty Pulse

**What:** After toggling a habit complete, an optional single-tap
difficulty rating appears: Easy / Normal / Hard. Default is Normal if
the user ignores it (no extra friction). The rating is stored alongside
the completion date.

Over time, this produces a "difficulty trend" per habit:
- Difficulty trending down → the habit is becoming automatic
- Difficulty trending up → burnout risk, suggest scaling back
- Consistently "Hard" → might be too ambitious, prompt a downscale

**Why none of the 55+ proposals cover this:**
Mood & Energy (F6) tracks global daily state. Micro-Habits (F9) tracks
partial completion levels. Neither captures **per-habit subjective
resistance** — how hard it *felt* to do this specific thing today.

This is the most actionable behavioral signal the app can collect. A
streak of 30 days that was "Easy" for the last 10 is a fundamentally
different achievement than 30 days that were "Hard" every day. The
former is a formed habit; the latter is willpower on life support.

**Why it matters for the Garden metaphor:**
Plants that are "Easy" to maintain are thriving. Plants that are
consistently "Hard" are struggling even if the streak is intact. This
adds a health dimension to garden plants beyond just streak length.

**Implementation:**
- Schema: Extend log entries from `string[]` to support optional metadata:
  `{ date: string, difficulty?: 'easy' | 'normal' | 'hard' }`
  Backward compatible — bare strings treated as 'normal'.
- Frontend: After toggle-on, show a 3-button inline rating that auto-dismisses
  after 3 seconds (defaults to 'normal'). CSS transition, no modal.
- Frontend: `<DifficultyTrend />` sparkline in the habit row (tiny 30-day
  line chart, ~60px wide, using CSS gradients or inline SVG).
- Backend: Accept optional `difficulty` field on toggle endpoint.
- Utils: `difficultyTrend(logs)` → 'easing' | 'stable' | 'hardening'

**Effort:** Low-Medium | **Dependencies:** None

---

### C2: "Good Enough" Day Threshold

**What:** The user sets a daily minimum — e.g., "completing 3 out of 5
habits counts as a good day." The header shows today's status as a
progress ring: 2/3 (amber), 3/3 (green), 5/5 (gold star).

The threshold creates a per-day win condition. Days that hit the
threshold accumulate into a "Good Day Streak" — a meta-streak across
all habits that's far more forgiving than individual habit streaks.

**Why this is genuinely new:**
All 55+ existing proposals model motivation at the *per-habit* level
(streaks, health scores, badges). None model motivation at the
*per-day* level. But users experience their day as a whole — "today was
a good day" or "today was off." A per-day threshold matches that mental
model.

Health Score (F2) measures per-habit consistency over 30 days. This
measures per-day achievement in real time. They complement each other:
F2 says "your meditation habit is 85% healthy." C2 says "you've had a
good day 6 days running."

**Why it matters psychologically:**
On a low-energy day, knowing you only need 3 of 5 habits gives you
permission to prioritize. Without a threshold, the only win condition is
100% — which means 80% feels like failure. A threshold turns 60% into a
win, which keeps users coming back.

**Implementation:**
- Storage: `goodDayThreshold: number` in a `settings` object in data.json
  (default: ceil(activeHabits.length * 0.6))
- Frontend: `<DayProgress />` component in the header — circular SVG ring
  showing today's count vs. threshold
- Frontend: Settings panel to adjust threshold (simple number input)
- Frontend: "Good Day Streak" counter next to the progress ring
- Backend: New `settings` field in data.json, `GET/PATCH /api/settings`
- Utils: `isGoodDay(habits, logs, threshold, date)` and
  `calculateGoodDayStreak(habits, logs, threshold)`

**Effort:** Low | **Dependencies:** None

---

### C3: Weekly Rhythm Heatmap

**What:** A compact 7-column (Mon–Sun) × N-row (one per habit) grid
where each cell's color intensity shows the *aggregate* completion rate
for that day-of-week over the past 8 weeks.

```
         Mon  Tue  Wed  Thu  Fri  Sat  Sun
Exercise  ██   ██   ▓▓   ██   ██   ░░   ░░
Reading   ██   ██   ██   ██   ██   ██   ▓▓
Meditate  ▓▓   ██   ▓▓   ██   ▓▓   ░░   ░░
```

Dark = consistently done (>80%), Medium = sometimes (40-80%), Light =
rarely (<40%).

**Why this differs from the heatmap (#5) and insights engine (F8):**
- Heatmap (#5) is a full calendar — months of data on one page. Answers
  "what happened on March 15th?"
- Insights Engine (F8) is text — "You exercise more on weekdays." Requires
  reading and interpretation.
- Weekly Rhythm is a *pattern detector you can read in 2 seconds*. It
  answers "which days am I weakest?" at a glance. It's always visible
  (not a separate page) and always current (rolling 8 weeks).

**Why it matters:**
Most habit failures have a day-of-week pattern. "I always skip Wednesday
exercise" or "Weekends destroy my reading habit." The 14-day grid shows
this only if you squint. The rhythm heatmap makes the pattern unmissable,
which is the first step to fixing it.

**Implementation:**
- Frontend only: `<WeeklyRhythm />` component, ~100 lines
- Utils: `calculateWeeklyPattern(logs, habitId, weeksBack)` → 7 percentages
- Render as a small inline grid below the main habit table
- Color scale: CSS opacity mapping (0.2 → 1.0) on the habit's color
- No backend changes — derived from existing log data

**Effort:** Low | **Dependencies:** None

---

### C4: Context-Aware Time Grouping

**What:** Each habit gets an optional time-of-day tag: Morning,
Afternoon, Evening, Night. The habit table groups by time slot with
subtle section headers. The current time slot is expanded by default;
other slots are collapsed.

At 7am, you see your Morning habits prominently with Afternoon/Evening
collapsed. At 6pm, Evening habits are front and center. No manual
mode-switching — the app adapts to the clock.

**Why this differs from Categories (#2) and Today View (N1):**
- Categories (#2) are user-defined organizational labels (Health, Work,
  Personal). They answer "what kind of habit is this?"
- Today View (N1) strips the UI to today's checkboxes. It's a
  *different view mode* you switch to.
- Context-Aware Grouping answers "what should I focus on right now?"
  without any mode-switching. The table itself reorganizes based on
  the time of day.

**Why it matters:**
Habit trackers show all habits equally, but habits aren't equally
relevant all day. Seeing "Evening Journaling" at 8am is noise. Grouping
by time slot reduces cognitive load and naturally prioritizes what's
actionable *right now*. This is especially valuable for users with 8+
habits who feel overwhelmed by a long flat list.

**Implementation:**
- Schema: Add `timeSlot?: 'morning' | 'afternoon' | 'evening' | 'night'`
  to Habit. Default: null (ungrouped, shown in all slots).
- Frontend: `<TimeGroup />` wrapper in HabitTable that sorts habits by
  slot and auto-expands the current slot based on `new Date().getHours()`
- Frontend: Time slot selector in HabitForm (4 icon buttons, optional)
- Backend: Accept and persist the new field
- Time ranges: Morning (5-12), Afternoon (12-17), Evening (17-21),
  Night (21-5). Configurable later.

**Effort:** Low-Medium | **Dependencies:** None

---

### C5: Streak Recovery Challenge

**What:** When a streak of 7+ days breaks, instead of just showing
"Streak: 0" (or even the Failure Recovery dashboard from F4), offer a
structured 3-day "Comeback Challenge":

- **Day 1:** "Just show up. Do the minimum version for 2 minutes."
- **Day 2:** "Do it at the same time as yesterday."
- **Day 3:** "Full habit. You're back."

The challenge appears as a small card overlay on the habit row. Each day
completed checks off a step. Completing all 3 days earns a "Comeback"
badge (feeds into Trophy Wall, NEW-4).

**Why this differs from Failure Recovery (F4):**
F4 is *informational* — it shows stats about your previous streak and
recovery rate. C5 is *actionable* — it gives you a specific plan to
follow for the next 3 days. F4 reframes the narrative ("you're
recovering, not failing"). C5 gives you the *actions* to actually
recover.

**Why it matters (behavioral science):**
The "abstinence violation effect" research shows that what happens in the
48 hours after a lapse determines whether it becomes a relapse. Most
people either (a) give up entirely or (b) try to immediately return to
full intensity — both of which fail. A graduated 3-day ramp-up is the
proven intervention: it's low enough commitment to start, but structured
enough to rebuild momentum.

**Implementation:**
- Schema: Add `activeChallenge?: { type: 'comeback', startDate: string,
  habitId: string, daysCompleted: number }` to data.json
- Frontend: `<ComebackChallenge />` card component, overlays the habit row
  when a challenge is active
- Frontend: Trigger prompt when toggle detects streak broke (compare
  current streak vs. last-known streak)
- Backend: Store/retrieve active challenges
- Integrates with Trophy Wall (NEW-4) — completing a comeback earns a badge

**Effort:** Medium | **Dependencies:** None (enhanced by F4 and NEW-4)

---

### C6: Accountability Snapshot

**What:** A "Share" button that generates a designed PNG image card
showing your weekly or monthly stats:

```
┌─────────────────────────────┐
│  🌱 My Habit Garden         │
│  Week of May 12, 2026       │
│                              │
│  ██ Exercise    7/7  🔥 23d  │
│  ██ Reading     5/7  📚 12d  │
│  ██ Meditate    6/7  🧘 45d  │
│                              │
│  Good Days: 6/7 ✓            │
│  Overall: 86% consistency    │
└─────────────────────────────┘
```

The image uses the app's dark theme aesthetic, the user's habit colors,
and is sized for sharing on social media or texting to a friend.

**Why this differs from Data Export (#4) and Social Features (#16):**
- Data Export (#4) is raw JSON/CSV for backup and portability.
- Social Features (#16) is a full accountability system with shared
  habits, comments, and feeds. It's deferred because it needs auth,
  database, and multi-user infrastructure.
- Accountability Snapshot requires *none of that*. It's a local image
  generation that works today. The "social" part happens entirely outside
  the app — via iMessage, WhatsApp, Instagram stories, whatever.

**Why it matters:**
External accountability is the #1 predictor of habit adherence (Gollwitzer
& Sheeran, 2006). But building social features requires massive
infrastructure. A shareable image card gets 80% of the accountability
benefit with 1% of the engineering cost. Users text their snapshot to a
friend or post it — instant accountability without login systems.

**Implementation:**
- Frontend: `<SnapshotGenerator />` component using HTML Canvas API
  or `html2canvas` library to render a styled card
- Frontend: "Share" button in header or dashboard
- Pure client-side — no backend changes, no external services
- Render habit names, colors, weekly completion counts, and streaks
- Download as PNG or copy to clipboard (navigator.clipboard API)

**Effort:** Medium | **Dependencies:** None

---

### C7: Habit Warm-Up Period

**What:** New habits start with a 7-day warm-up period where the
expected frequency is reduced:

- **Days 1-3:** 50% frequency (e.g., daily habit only expected 2 of 3 days)
- **Days 4-7:** 75% frequency
- **Day 8+:** Full frequency

During warm-up, the streak calculation uses the reduced expectation.
The UI shows a "warming up" indicator with a small progress bar toward
full frequency. Missing a day during warm-up doesn't display as failure —
it shows "rest day (warm-up period)."

**Why this is genuinely new:**
Every existing proposal treats habits as full-intensity from day 1. But
behavioral science (BJ Fogg's Tiny Habits) is explicit: new habits
should start absurdly small and scale up. None of the 55+ proposals
model this ramp-up period.

Habit Experiments (F7) addresses commitment length (30-day trial) but
not intensity scaling. Adaptive Scaling (N6) addresses scaling *up* after
a habit is established, but not the initial ramp. Warm-Up fills the gap
at the beginning of the habit lifecycle.

**Why it matters:**
The first week is when most habits die. A user adds "Exercise daily" and
misses day 2 — streak shows 0, they feel like they already failed, and
they archive the habit. With warm-up, missing day 2 is expected and
shown as such. The habit survives the critical fragile period.

**Implementation:**
- Schema: Add `warmUpDays?: number` to Habit (default: 7, configurable 0-14)
- Frontend: "Warming Up" badge on habits in their first N days
- Frontend: Progress bar showing warm-up completion
- Utils: Update `calculateStreak` to use reduced expectations during
  warm-up. `isWarmUpDay(habit, date)` → boolean,
  `expectedCompletionRate(habit, date)` → 0.5 | 0.75 | 1.0
- Backend: Accept and persist the new field

**Effort:** Low-Medium | **Dependencies:** None

---

### C8: Habit Relationship Map (Triggers & Conflicts)

**What:** Users can manually link habits with two relationship types:
- **Triggers:** "Morning Walk → triggers → Post-Walk Stretching"
  (doing A makes B easier)
- **Conflicts:** "Late Night Screen ⚡ Early Morning Wake-Up"
  (doing A makes B harder)

The UI shows these as subtle connection lines between habit rows. When
you complete a trigger habit, its linked habit briefly highlights
("Morning Walk done — time for stretching?"). When you complete a
conflicting habit, its linked habit shows a warning ("Late night
screen time may affect tomorrow's wake-up").

**Why this differs from Habit Stacking (F3) and Correlation Map (N5):**
- Habit Stacking (F3) is about *grouping* habits into routines with
  a "Complete All" action. It's organizational.
- Correlation Map (N5) *auto-detects* statistical correlations from
  log data. It requires 30+ days and is retrospective.
- Relationship Map is *user-declared* and *prospective*. The user
  tells the app which habits are connected. It works from day 1 and
  captures causal relationships that statistics can't detect (like
  "reading before bed helps me sleep" — which isn't visible in
  completion data).

**Why it matters:**
Habits don't exist in isolation — they form a system. Successful
habit-builders think in terms of chains and conflicts: "If I protect
my morning routine, everything else follows." This feature makes that
systems-thinking explicit and actionable within the UI.

**Implementation:**
- Schema: New `relationships` array in data.json:
  `[{ from: habitId, to: habitId, type: 'triggers' | 'conflicts' }]`
- Backend: CRUD endpoints for relationships
- Frontend: `<RelationshipMap />` lightweight visualization
  (CSS lines between rows, or a simple list view)
- Frontend: Highlight/warning nudges on toggle
- Manageable via a simple "Link Habits" modal

**Effort:** Medium | **Dependencies:** None, but enhanced by
Correlation Map (N5) which can *suggest* relationships

---

## Part 2 — Consolidated Backlog

All features from all 8 prior documents + the 8 new proposals above,
deduplicated and organized into tiers.

### Tier 0 — Fix Embarrassing Gaps (Sprint 1)

These aren't features — they're missing basics.

| ID | Feature | What | Effort |
|----|---------|------|--------|
| G1 | **Edit Habit** | PATCH endpoint + edit modal. Can't change name/color without deleting. | Small |
| G2 | **View/Restore Archived** | Collapsible archived section + unarchive endpoint. | Small |
| G3 | **Onboarding Empty State** | Centered CTA when zero habits. Quick-start templates. | Small |
| #3 | **Undo Toast** | 5-second undo window for accidental toggles. UX standard. | Small |
| N7 | **Auto-Backup** | Timestamped backup on every write. 7-day retention. | Small |
| #14 | **Theme Toggle** | Light/dark switch. CSS vars already exist. | Trivial |

### Tier 1 — Core Experience (Sprint 2)

Make the daily check-in fast, the motivation system resilient, and the
app visually distinct.

| ID | Feature | What | Effort |
|----|---------|------|--------|
| NEW-1 | **The Garden** | SVG/CSS plant visualization. The app's identity feature. | Medium |
| NEW-3 | **Quick Capture Bar** | Persistent bottom bar for today's uncompleted habits. | Low-Med |
| F2 | **Health Score** | 0-100 consistency index replacing raw streak emphasis. | Low |
| F4 | **Failure Recovery** | Recovery dashboard after streak breaks. | Low |
| C2 | **Good Enough Day** | Per-day threshold + Good Day Streak. | Low |
| #1 | **Dashboard Stats** | Completion rate, active count, best streak. | Low-Med |
| C3 | **Weekly Rhythm** | 7-day pattern heatmap. Spot weak days at a glance. | Low |

### Tier 2 — Depth & Intelligence (Sprint 3)

Schema improvements + features that make the app smarter than a
spreadsheet.

| ID | Feature | What | Effort |
|----|---------|------|--------|
| F5 | **Smart Rest Days** | Custom frequencies (weekdays, 3x/week, MWF). | Medium |
| NEW-5 | **Habit Journal** | Daily 140-char one-liner. Context for historical data. | Low-Med |
| NEW-2 | **Habit Seasons** | Cyclical habits with auto-hibernate. | Low-Med |
| C4 | **Time Grouping** | Group habits by Morning/Afternoon/Evening. Auto-expand current. | Low-Med |
| C1 | **Difficulty Pulse** | Per-toggle difficulty rating + trend sparkline. | Low-Med |
| C7 | **Warm-Up Period** | Reduced expectations for first 7 days of new habits. | Low-Med |
| #4 | **Data Export** | JSON/CSV download. Ship before schema gets complex. | Low |

### Tier 3 — Engagement & Retention (Sprint 4)

Keep users coming back. Celebrate wins. Handle setbacks.

| ID | Feature | What | Effort |
|----|---------|------|--------|
| NEW-4 | **Trophy Wall** | Milestone badges (7d, 21d, 30d, 66d, 100d, 365d). | Medium |
| C5 | **Streak Recovery Challenge** | 3-day structured comeback after streak breaks. | Medium |
| C6 | **Accountability Snapshot** | Shareable PNG stats card. Social without infrastructure. | Medium |
| F1 | **Streak Shields** | Earned free misses. Duolingo-proven retention mechanic. | Medium |
| G4 | **Mobile Responsive** | 7-day grid, 44px tap targets, expand-to-see-history. | Medium |
| F11 | **Keyboard Shortcuts** | j/k navigation, space to toggle, / for command palette. | Low-Med |

### Tier 4 — Power Features (Sprint 5)

For users with 30+ days of data and strong engagement.

| ID | Feature | What | Effort |
|----|---------|------|--------|
| #5 | **Heatmap** | Full calendar visualization (GitHub-contribution style). | Medium |
| F3 | **Habit Stacking** | Named routines with "Complete All" batch toggle. | Medium |
| F7 | **Habit Experiments** | 30-day trial mode with keep/drop reflection. | Medium |
| C8 | **Relationship Map** | User-declared trigger/conflict links between habits. | Medium |
| N2 | **Completion Timestamps** | Store full ISO timestamp for time-of-day analytics. | Medium |
| F10 | **Weekly Review Wizard** | Guided weekly reflection with auto-filled data. | Medium |

### Tier 5 — Deferred (Don't build until Tiers 0-4 ship)

| Feature | Why Deferred |
|---------|-------------|
| Authentication & multi-user | Premature — single-user JSON works fine for now |
| Database migration (SQLite/Postgres) | Only needed when auth ships |
| PWA / offline support | Significant complexity; mobile responsive first |
| Social / accountability features | C6 (Snapshot) gets 80% of the value at 1% cost |
| Reminders / notifications | Requires PWA or native. Not a web app's job yet. |
| Insights Engine (F8) | Needs 60+ days of data. Ship data-collection features first. |
| Mood & Energy Correlation (F6) | Same — needs months of data to be meaningful |
| Micro-Habits / Partial Completion (F9) | Breaking schema change. C1 (Difficulty Pulse) captures most of the value without the migration cost. |
| Natural Language Input (N9) | Nice-to-have. The form works. |
| iCal Export (F12) | Needs stable URLs + auth tokens |
| Import from Other Trackers (F15) | Build retention before acquisition |
| Habit Pair Correlation (N5) | Auto-detection needs data; C8 (Relationship Map) works from day 1 |
| Adaptive Scaling (N6) | Cool but needs Edit Habit (G1) + Momentum Stages + 30d data |
| Streak DNA Visualization (N4) | Nice polish; heatmap is higher priority |
| Reports Page (#9) | Dashboard + heatmap cover most of the use cases |

---

## Part 3 — Execution Roadmap

### Sprint 1: Make It Usable (1-2 weeks)

**Goal:** Fix the gaps that make the app embarrassing to recommend.

```
Backend                              Frontend
──────                               ────────
PATCH /api/habits/:id  (G1)          Edit habit modal (G1)
POST /api/habits/:id/unarchive (G2)  Archived habits section (G2)
Auto-backup on write (N7)            Undo toast with 5s window (#3)
                                     Theme toggle (#14)
                                     Onboarding empty state (G3)
```

**Schema changes:** None
**Definition of done:** A user can create, edit, archive, unarchive,
and delete habits. Accidental toggles can be undone. Data is backed up.
Light/dark theme works. New users get a helpful first-run experience.

---

### Sprint 2: Make It Motivating (1-2 weeks)

**Goal:** Replace streak-only motivation with a richer system. Add the
garden visualization. Make the daily check-in faster.

```
Backend                              Frontend
──────                               ────────
GET /api/settings (C2)               Garden visualization v1 (NEW-1)
PATCH /api/settings (C2)             Quick Capture bar (NEW-3)
                                     Health Score badges (F2)
                                     Failure Recovery dashboard (F4)
                                     Good Enough Day threshold (C2)
                                     Dashboard stats panel (#1)
                                     Weekly Rhythm heatmap (C3)
```

**Schema changes:** New `settings` object in data.json (threshold only).
**Definition of done:** The app has a garden visualization, a health
score, a recovery dashboard, a quick toggle bar, a "good day" system,
and weekly pattern visibility. It looks and feels like a unique product.

---

### Sprint 3: Make It Smart (2-3 weeks)

**Goal:** Schema improvements that make the app understand habits better
than the user does.

```
Backend                              Frontend
──────                               ────────
Frequency model change (F5)          Smart Rest Days UI (F5)
POST /api/journal (NEW-5)            Daily journal one-liner (NEW-5)
Season field on habits (NEW-2)       Seasonal habits UI (NEW-2)
TimeSlot field on habits (C4)        Time-of-day grouping (C4)
Difficulty field on toggle (C1)      Difficulty rating + trend (C1)
WarmUp field on habits (C7)          Warm-up period indicator (C7)
GET /api/export (JSON/CSV) (#4)      Data export button (#4)
```

**Schema changes:** Frequency model (daily/weekly → custom), journal
collection, season field, timeSlot field, difficulty on log entries,
warmUpDays on habits.
**Definition of done:** Habits support custom schedules, time grouping,
warm-up periods, and seasonal hibernation. Users can rate difficulty,
jot daily notes, and export their data.

---

### Sprint 4: Make It Sticky (2 weeks)

**Goal:** Keep users engaged long-term. Celebrate wins. Handle setbacks
gracefully. Make the mobile experience work.

```
Backend                              Frontend
──────                               ────────
Milestone storage (NEW-4)            Trophy Wall page (NEW-4)
Challenge storage (C5)               Streak Recovery Challenge (C5)
                                     Accountability Snapshot (C6)
                                     Streak Shields (F1)
                                     Mobile responsive (G4)
                                     Keyboard shortcuts (F11)
```

**Schema changes:** Milestones array, active challenges.
**Definition of done:** Users earn trophies, get structured recovery
help after setbacks, can share stats as images, and have earned streak
protection. Mobile is usable. Power users have keyboard shortcuts.

---

### Sprint 5: Make It Deep (2-3 weeks)

**Goal:** Add depth for committed users with weeks/months of data.

```
Backend                              Frontend
──────                               ────────
Stack CRUD (F3)                      Heatmap calendar (#5)
Relationship CRUD (C8)               Habit Stacking UI (F3)
Timestamp migration (N2)             Experiment mode (F7)
POST /api/reviews (F10)              Relationship Map (C8)
                                     Weekly Review Wizard (F10)
```

**Schema changes:** Stacks, relationships, log timestamp format,
weekly reviews.
**Definition of done:** Power users can organize habits into routines,
visualize their full history, run 30-day experiments, declare habit
relationships, and do guided weekly reflections.

---

## Part 4 — New Feature Reasoning Summary

| Feature | Gap It Fills | Why 55+ Prior Proposals Missed It |
|---------|-------------|-----------------------------------|
| **C1: Difficulty Pulse** | Per-habit subjective resistance | All proposals track *what* you did, not *how hard it felt*. Difficulty is the leading signal for burnout and automaticity. |
| **C2: Good Enough Day** | Per-day win condition | All motivation is modeled per-habit. No proposal considers the *day* as a unit of achievement. Users think in days, not habits. |
| **C3: Weekly Rhythm** | Day-of-week pattern detection | Heatmap (#5) shows calendar history. Insights Engine (F8) shows text. Neither gives an instant visual pattern of weekly weak spots. |
| **C4: Time Grouping** | "What should I do now?" | Categories (#2) organize by type. Today View (N1) is a mode switch. Time Grouping reorganizes the default view by the clock — zero friction. |
| **C5: Recovery Challenge** | Actionable comeback plan | Failure Recovery (F4) *informs* — shows stats. Recovery Challenge *acts* — gives a 3-day plan. Information vs. intervention. |
| **C6: Accountability Snapshot** | Social without infrastructure | Social features (#16) need auth, database, multi-user. A shareable PNG gets 80% of the accountability benefit with no infrastructure. |
| **C7: Warm-Up Period** | Fragile first week | Every proposal treats habits as full-intensity from day 1. The first week has the highest dropout rate and gets zero protection. |
| **C8: Relationship Map** | Habits as a system | Stacking (F3) groups habits. Correlation (N5) auto-detects after 30d. Relationship Map lets users *declare* connections from day 1 — triggers and conflicts. |

---

## Part 5 — Design Principles (Extracted from Analysis)

These are the principles that guided feature selection and should guide
implementation.

1. **The Garden is the product.** The app is called Habit Garden. The
   garden visualization (NEW-1) isn't a feature — it's the identity.
   Every visual decision should reinforce the living-garden metaphor.

2. **Forgiveness over perfection.** Health Score > raw streaks. Recovery
   Challenges > "Streak: 0". Warm-Up periods > immediate full intensity.
   Good Enough Days > 100%-or-nothing. The app should make it hard to
   feel like you failed.

3. **Zero-friction daily loop.** The check-in takes 10 seconds: open →
   Quick Capture bar → tap tap tap → done. Everything else (review,
   journal, trophies) is optional depth. Never make the core action
   slower.

4. **Derived over stored.** Prefer computing values from existing log
   data over adding new data to collect. Health Score, Weekly Rhythm,
   Dashboard Stats, Trophy detection — all derived. Fewer things to
   store = fewer things to break.

5. **No AI/ML.** Every feature uses deterministic statistics. Keeps the
   app explainable, fast, and free of API dependencies. A simple
   percentage is more trustworthy than a black-box prediction.

6. **Ship before you plan.** This is planning document #8. The next
   document should be a commit message.

---

## Part 6 — Decision Log

| Decision | Rationale |
|----------|-----------|
| 8 new features (C1-C8) complement, don't replace, ROADMAP.md's 5 (NEW-1 to NEW-5) | The ROADMAP proposals are strong. These fill the remaining blind spots. |
| Difficulty Pulse (C1) over Micro-Habits (F9) | Both capture "how much." Difficulty captures it with zero schema migration cost — one optional field vs. a breaking format change. |
| Good Enough Day (C2) as Tier 1 | Per-day win condition is more impactful than per-habit improvements. Trivial to implement (derived state + one setting). |
| Weekly Rhythm (C3) over Streak DNA (N4) | Rhythm is actionable ("fix Wednesdays"). DNA is aesthetic ("look at my pattern"). Actionable first. |
| Time Grouping (C4) over full Categories (#2) | Time slots are a natural grouping that requires zero user effort to maintain. Categories require ongoing curation. |
| Recovery Challenge (C5) pairs with Failure Recovery (F4) | F4 provides the data context. C5 provides the action plan. Together they handle the highest-risk moment in habit formation. |
| Accountability Snapshot (C6) over Social Features (#16) | 1% of the engineering cost for 80% of the accountability benefit. No auth, no database, no multi-user. |
| Warm-Up (C7) in Sprint 3 (not Sprint 1) | Requires schema change. Sprint 1 is zero-schema-change by policy. But it's the first schema feature to build because it protects new habits. |
| Relationship Map (C8) in Sprint 5 | Powerful but niche. Most users won't link habits until they have 5+ established ones. Build it when they need it. |
| 5 sprints, strict ordering | Each sprint ships a usable product. No sprint depends on a later sprint. Users get value at every stage. |
| Consolidated single document | 7 prior docs with overlapping proposals created paralysis. One document, one backlog, one roadmap. |
