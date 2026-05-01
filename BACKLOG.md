# Habit Garden — Unified Feature Backlog

> Single source of truth for all planned work. Supersedes the per-feature lists
> in `FEATURES.md` and `NEW_FEATURES.md`, which remain as historical reference.

---

## Current State (as of 2026-05-01)

**Shipped:** Habit CRUD, daily/weekly toggle, 14-day grid, streaks, dark theme,
optimistic updates, toasts, JSON persistence w/ mutex, 17 backend tests.

**Not shipped:** Everything below.

---

## Part 1 — Critical UX Gaps

These aren't "features" — they're missing basics that hurt usability today.
Fix them before adding new capabilities.

### G1: Edit Habit After Creation

**Problem:** Users cannot change a habit's name, color, or frequency once
created. The only option is delete-and-recreate, which destroys log history.
This is a data-loss footgun.

**Fix:** Add `PATCH /api/habits/:id` accepting partial updates (`name`,
`color`, `frequency`). Frontend: inline edit or an edit modal triggered from
the row actions.

**Effort:** Small — 1-2 hours. Schema unchanged (just mutation of existing
fields).

---

### G2: View & Restore Archived Habits

**Problem:** Archiving a habit makes it vanish permanently from the UI. Users
can't review what they've archived, compare old vs. new habits, or un-archive
a habit they want to resume.

**Fix:** Add a collapsible "Archived" section below the active table (or a
toggle/tab). Each archived row shows the habit with its historical stats and
an "Unarchive" button (`POST /api/habits/:id/unarchive`).

**Effort:** Small — new endpoint + conditional render in HabitTable.

---

### G3: Empty State & Onboarding

**Problem:** A new user sees "No habits yet" with no guidance. The form is
positioned in a left sidebar which may not be obvious on mobile.

**Fix:** When there are zero habits, show a centered onboarding card: brief
explanation + prominent "Create your first habit" CTA that either scrolls to
the form or opens a modal. Optionally include 3-4 quick-start templates
(Water, Exercise, Reading, Meditate) as one-click starters.

**Effort:** Small — pure frontend.

---

### G4: Responsive Mobile Experience

**Problem:** The 14-day grid overflows on small screens. Day-cell buttons
are tiny (~24px), making toggling on mobile frustrating. The two-column
layout stacks but the table itself doesn't adapt.

**Fix:** On mobile (<600px): collapse the grid to 7 days, increase cell
size to 44px (Apple HIG minimum tap target), show habit name + today's
toggle as the primary row with an expand-to-see-history interaction.

**Effort:** Medium — CSS + conditional rendering.

---

## Part 2 — New Feature Proposals

Features below are genuinely new — not duplicated from `FEATURES.md` or
`NEW_FEATURES.md`. Each addresses a gap those documents miss.

---

### N1: Today View / Focus Mode

**What:** A second view mode (toggle in the header) that strips the UI down
to a checklist of today's habits only. Each habit is a large tappable card
showing: name, color, and a single big checkbox. No history grid, no
streaks, no dates — just "did you do it today?"

**Why this matters:**
The daily habit check-in should take <15 seconds. The current 14-day grid
is great for review, but it's visual noise during the check-in moment.
Users open the app once a day to mark things done — that interaction needs
to be as friction-free as pulling a lever.

Every successful habit app (Streaks, Done, Productive) has a "today" mode
because the research is clear: reducing the number of decisions at the
moment of action increases follow-through. Showing 14 columns of history
during check-in invites retrospective thinking ("I missed Monday...") which
triggers the "what-the-hell" effect and reduces motivation.

**Scope:**
- Frontend only: new `<TodayView />` component
- Reads from the same `habits` and `logs` state
- View toggle persisted in localStorage
- Filter: only shows habits where today is an active day
  (becomes more powerful once Smart Rest Days [F5] ships)

**Effort:** Low | **Dependencies:** None

---

### N2: Completion Timestamps

**What:** When a user toggles a habit on, store the ISO timestamp (not just
the date). The date-only format (`YYYY-MM-DD`) is preserved for streak logic,
but the full timestamp is stored alongside for analytics.

**Why this matters:**
This is invisible infrastructure that unlocks three future capabilities:
1. **Time-of-day insights** — "You meditate at 7am on weekdays but 11am on
   weekends" (feeds into Insights Engine [F8])
2. **Duration tracking** — With a start + end timestamp, users can track
   how long they spent (e.g., "Studied for 45 min")
3. **Completion velocity** — "You check off 5 habits in 3 minutes every
   morning" vs. "Exercise gets checked at 9pm — is it actually happening?"

The current log model (`habitId → string[]`) loses this data permanently.
Every day that passes without timestamps is historical data we can never
recover. This should ship early.

**Schema change:**
```typescript
// Current:   logs[habitId] = ["2026-05-01", "2026-04-30"]
// Proposed:  logs[habitId] = [
//   { date: "2026-05-01", completedAt: "2026-05-01T07:23:00Z" },
//   { date: "2026-04-30", completedAt: "2026-04-30T19:45:00Z" }
// ]
// Backward compat: if entry is a string, treat as date-only (legacy)
```

**Effort:** Medium | **Dependencies:** Migration script for existing data

---

### N3: Habit Momentum Stages

**What:** Model each habit through four formation stages based on behavioral
science research (Phillippa Lally's 66-day automaticity study):

| Stage | Days | Visual | Behavior |
|-------|------|--------|----------|
| **Seedling** | 0-7 | 🌱 sprout icon | Fragile. Extra encouragement on misses. |
| **Growing** | 8-21 | 🌿 plant icon | Building. "You're past the hardest part." |
| **Rooted** | 22-66 | 🌳 tree icon | Established. Streak shields earned here. |
| **Evergreen** | 67+ | 🏔 mountain icon | Automatic. Show lifetime stats instead of streak. |

**Why this matters:**
Raw streak numbers are psychologically flat — "day 5" and "day 50" feel
the same in the UI. But behaviorally they're completely different: a day-5
habit is fragile and needs protection; a day-50 habit is resilient and
needs recognition.

Momentum stages give users a progression arc with *qualitative* milestones,
not just quantitative ones. "My meditation is Rooted" is more meaningful
than "my streak is 34." It also naturally maps to the app's "garden"
metaphor — habits literally grow from seedlings to trees.

The stages also enable differentiated UX: a Seedling that breaks doesn't
show a scary "Streak: 0" — it shows "Seedling needs watering." An
Evergreen that breaks barely registers — because at that point the habit
is automatic and a single miss doesn't matter.

**Scope:**
- Frontend only: new `<MomentumBadge />` component
- Utils: `getHabitStage(createdAt, logs)` — compute stage from log density
  since creation (not just streak, so a 90-day-old habit with 80%
  completion can still reach Evergreen even with some misses)
- Garden-themed icons/animations per stage
- No backend changes

**Effort:** Low-Medium | **Dependencies:** None, but pairs beautifully
with Failure Recovery [F4]

---

### N4: Streak DNA Visualization

**What:** Generate a unique visual "fingerprint" for each habit's entire
history — a compact horizontal barcode where each column is one day,
colored by completion (filled = done, hollow = missed, gray = rest day).
The result looks like a DNA strand or barcode and encodes months of
behavior into a single glanceable strip.

**Why this matters:**
The 14-day grid limits visibility. A heatmap (FEATURES.md #5) solves this
with a calendar view, but it requires a dedicated page and interpretation.
A DNA strip is *inline* — it sits right in the habit row and tells the
full story at a glance:

- Dense fill = consistent habit
- Regular gaps = weekend pattern
- Trailing gap = recent drop-off
- Solid tail + broken head = streak just broke

This is a data-dense visualization that rewards long-term users: the
longer you track, the more interesting your DNA becomes. It creates
emotional attachment to the data itself — "I don't want to break my
pattern."

**Scope:**
- Frontend: new `<StreakDNA />` component (canvas or SVG, ~100px wide)
- Renders in the habit row, replacing or supplementing the 14-day grid
  on certain screen sizes
- All data derived from existing logs — no backend changes

**Effort:** Medium | **Dependencies:** None

---

### N5: Habit Pair Correlation Map

**What:** Automatically detect which habits are statistically correlated
(completed together or inversely) and visualize the relationships as a
small network graph or simple list:

- "Exercise ↔ Healthy Eating: 87% co-occurrence"
- "Late Night Screen ↔ Morning Meditation: -62% (inverse)"
- "Reading → Journaling: 73% (Reading usually comes first)"

**Why this matters:**
This is different from the Insights Engine [F8] which generates text
descriptions. The correlation map is a *visual* tool that reveals the
*structure* of a user's habit ecosystem. It answers "which habits support
each other?" and "which habits compete?"

This has practical value: if Exercise and Healthy Eating are strongly
correlated, the user knows that protecting their exercise habit also
protects their diet. If two habits are inversely correlated, they might
be competing for the same time slot.

No existing habit tracker does this well. Most just show individual habit
stats in isolation, ignoring that habits form an interconnected system.

**Scope:**
- Utils: `calculateCorrelations(logs)` — pairwise Jaccard similarity on
  completion dates, filtered to pairs with >0.3 absolute correlation
- Frontend: `<CorrelationMap />` — either a force-directed graph
  (d3-force) or a simple ranked list of correlated pairs
- No backend changes

**Effort:** Medium | **Dependencies:** Needs 30+ days of multi-habit data

---

### N6: Adaptive Scaling Prompts

**What:** When a habit reaches the "Rooted" stage (or 30+ days of >90%
completion), prompt the user: "You've been consistent with [Read 10 min]
for 30 days. Ready to level up? Try [Read 20 min]." The user can accept
(which renames the habit and resets the momentum stage to Growing), snooze,
or dismiss permanently.

**Why this matters:**
Habit formation has two failure modes: (1) never starting, and (2) stagnating.
Most trackers address #1 but ignore #2. A user who checks "Exercise" every
day for 6 months might still be doing the same 10-minute walk — the habit
is maintained but not growing.

Adaptive scaling is the bridge between habit *maintenance* and habit
*improvement*. It operationalizes the "1% better every day" philosophy
from Atomic Habits without requiring the user to track it manually.

The prompt is opt-in and gentle — it celebrates the consistency first,
then invites growth. Users who decline aren't penalized.

**Scope:**
- Frontend: `<ScaleUpPrompt />` modal, triggered when a habit crosses the
  consistency threshold
- Stores dismissal state in localStorage (or a `scalingDismissed` flag
  on the habit)
- Accepting creates a note/marker in the log history ("scaled up on
  2026-05-01") for future reference
- Minimal backend: optional `PATCH /api/habits/:id` for rename

**Effort:** Low-Medium | **Dependencies:** Benefits from Momentum Stages
[N3], requires Edit Habit [G1]

---

### N7: Data Integrity & Auto-Backup

**What:** The server automatically creates a timestamped backup of
`data.json` before every write (kept for 7 days, max 50 backups). Add a
`GET /api/backup/list` endpoint and a `POST /api/backup/restore/:filename`
endpoint. Surface a "Backups" section in settings.

**Why this matters:**
The app stores all user data in a single JSON file with no redundancy.
A bug, a disk issue, or even a malformed write can destroy months of
habit history. Users don't think about backups until it's too late.

Auto-backup costs nearly zero (a file copy on each write, pruned by age)
and converts a catastrophic data-loss scenario into a minor inconvenience.
This is basic operational hygiene that should ship before any feature
that makes the data more valuable (heatmaps, insights, etc.).

**Scope:**
- Backend: `backupData()` function called inside `writeData()`, writes
  to `server/backups/data-{ISO-timestamp}.json`
- Backend: cleanup function that prunes backups older than 7 days
- Backend: two new endpoints for listing and restoring
- Frontend: simple backup list in a settings panel (optional — even
  without UI, the backups exist and can be manually restored)

**Effort:** Low | **Dependencies:** None

---

### N8: Habit Time Budgeting

**What:** Each habit gets an optional `estimatedMinutes` field. The
dashboard shows a daily time budget: "Today's habits: ~45 min total."
When users create or edit habits, they see how the new habit affects
their total daily commitment.

**Why this matters:**
One of the top reasons habits fail is overcommitment — users add 10
habits without realizing they've committed to 2 hours of daily effort.
A time budget makes the invisible cost visible.

This reframes habit creation from "what do I want to do?" to "what can
I afford to do?" — a subtle shift that produces more realistic habit
lists and higher completion rates.

It also enables a future "time allocation" view: "You spend 40% of
habit time on health, 30% on learning, 30% on productivity."

**Scope:**
- Schema: Add `estimatedMinutes: number | null` to Habit
- Frontend: optional field in HabitForm, time budget widget in header
  or dashboard
- Backend: accept and persist the new field

**Effort:** Low | **Dependencies:** None, pairs well with Dashboard [#1]
and Categories [#2]

---

### N9: Natural Language Habit Creation

**What:** Replace or augment the structured form with a single text input
that parses natural language:

- "Meditate 10 min every morning" → name: "Meditate 10 min", frequency:
  daily, estimatedMinutes: 10
- "Exercise 3x per week" → name: "Exercise", frequency: custom (3x/week)
- "Read before bed on weekdays" → name: "Read before bed", frequency:
  custom (Mon-Fri)

**Why this matters:**
Form fields create friction. Power users especially find dropdowns and
color pickers tedious for something they can express in one sentence.
A natural language input with parsed preview ("Here's what I understood:
...") combines speed with accuracy.

This is also a differentiator — very few habit trackers offer NL input.
It makes the app feel modern and intelligent.

**Scope:**
- Frontend: regex-based parser (no AI needed) that extracts frequency
  keywords ("daily", "weekly", "weekdays", "3x per week", "Mon/Wed/Fri"),
  time estimates ("10 min", "1 hour"), and treats the rest as the name
- Show parsed result as a preview card below the input
- User can correct before submitting
- Falls back to structured form if parsing fails

**Effort:** Medium | **Dependencies:** Smart Rest Days [F5] for custom
frequencies, Time Budgeting [N8] for estimated minutes

---

### N10: Habit Streaks Leaderboard (Personal)

**What:** A "Personal Records" panel showing:
- Longest streak ever (per habit and overall)
- Best single day (most habits completed)
- Best week ever
- Current vs. personal best comparison
- "Days until you beat your record" countdown

**Why this matters:**
This differs from Best/Worst Day Markers [F13] which annotates the
calendar. The leaderboard is a *permanent scoreboard against yourself*.

Competing against your past self is one of the healthiest forms of
motivation — it's intrinsic, personalized, and always achievable
(you only need one more day). The "days until you beat your record"
countdown creates a natural goal without the user having to set one.

It also solves the "what happens after a long streak breaks" problem:
the streak is gone, but the record still stands. "Streak: 3 days.
Personal best: 45 days. You'll beat it in 43 days." The record gives
the streak break context and the countdown gives it direction.

**Scope:**
- Utils: `calculatePersonalRecords(habits, logs)` — scan all log data
  for max streaks, max completion days, etc.
- Frontend: `<PersonalRecords />` panel on dashboard or dedicated tab
- No backend changes

**Effort:** Low | **Dependencies:** None

---

## Part 3 — Unified Priority Matrix

All features from all three documents (`FEATURES.md`, `NEW_FEATURES.md`,
and this file), ranked by a single priority score.

**Scoring:** Impact (1-5) × Effort Inverse (5=trivial, 1=huge) = Priority Score.
Ties broken by dependency count (fewer deps = higher).

### Tier A — Do First (Score ≥ 15)

| ID | Feature | Impact | Effort Inv. | Score | Source |
|----|---------|--------|-------------|-------|--------|
| G1 | Edit Habit | 5 | 5 | 25 | New |
| G2 | View/Restore Archived | 4 | 5 | 20 | New |
| G3 | Onboarding / Empty State | 4 | 5 | 20 | New |
| F2 | Habit Health Score | 5 | 4 | 20 | NEW_FEATURES |
| F4 | Failure Recovery | 5 | 4 | 20 | NEW_FEATURES |
| #3 | Undo Toast | 4 | 5 | 20 | FEATURES |
| N1 | Today View / Focus Mode | 5 | 4 | 20 | New |
| #14 | Theme Toggle | 3 | 5 | 15 | FEATURES |
| N7 | Auto-Backup | 4 | 4 | 16 | New |
| #1 | Dashboard Stats | 4 | 4 | 16 | FEATURES |
| F13 | Best/Worst Day Markers | 3 | 5 | 15 | NEW_FEATURES |
| F14 | Habit Sunset Prompts | 4 | 4 | 16 | NEW_FEATURES |
| N10 | Personal Records Board | 4 | 4 | 16 | New |

### Tier B — Do Second (Score 10-14)

| ID | Feature | Impact | Effort Inv. | Score | Source |
|----|---------|--------|-------------|-------|--------|
| #4 | Data Export | 4 | 3 | 12 | FEATURES |
| N2 | Completion Timestamps | 4 | 3 | 12 | New |
| N3 | Momentum Stages | 4 | 3 | 12 | New |
| #12 | Habit Templates | 3 | 4 | 12 | FEATURES |
| F1 | Streak Shields | 4 | 3 | 12 | NEW_FEATURES |
| F5 | Smart Rest Days | 5 | 2 | 10 | NEW_FEATURES |
| F11 | Keyboard Shortcuts | 3 | 3 | 9→10* | NEW_FEATURES |
| #2 | Categories / Tags | 4 | 3 | 12 | FEATURES |
| N8 | Time Budgeting | 3 | 4 | 12 | New |
| G4 | Mobile Responsive Fix | 4 | 3 | 12 | New |

### Tier C — Do Third (Score 6-9)

| ID | Feature | Impact | Effort Inv. | Score | Source |
|----|---------|--------|-------------|-------|--------|
| #5 | Heatmap | 4 | 2 | 8 | FEATURES |
| F3 | Habit Stacking | 4 | 2 | 8 | NEW_FEATURES |
| #8 | Drag & Drop Reorder | 3 | 3 | 9 | FEATURES |
| #6 | Habit Notes | 3 | 3 | 9 | FEATURES |
| F7 | Habit Experiments | 4 | 2 | 8 | NEW_FEATURES |
| F10 | Weekly Review Wizard | 4 | 2 | 8 | NEW_FEATURES |
| N4 | Streak DNA Viz | 3 | 3 | 9 | New |
| N6 | Adaptive Scaling | 4 | 3 | 12→8* | New |
| N5 | Correlation Map | 4 | 2 | 8 | New |
| #13 | Goals & Milestones | 4 | 2 | 8 | FEATURES |

*Adjusted for dependency chain

### Tier D — Do Later (Score ≤ 5 or heavy dependencies)

| ID | Feature | Impact | Effort Inv. | Score | Source |
|----|---------|--------|-------------|-------|--------|
| #9 | Reports Page | 4 | 2 | 8→6* | FEATURES |
| #7 | Reminders | 3 | 2 | 6 | FEATURES |
| F6 | Mood Correlation | 4 | 2 | 8→5* | NEW_FEATURES |
| F8 | Insights Engine | 5 | 2 | 10→5* | NEW_FEATURES |
| N9 | Natural Language Input | 3 | 2 | 6 | New |
| F9 | Micro-Habits | 4 | 1 | 4 | NEW_FEATURES |
| F12 | iCal Export | 3 | 2 | 6 | NEW_FEATURES |
| F15 | Import from Trackers | 3 | 2 | 6 | NEW_FEATURES |
| #10 | Authentication | 5 | 1 | 5 | FEATURES |
| #11 | Database Migration | 5 | 1 | 5 | FEATURES |
| #15 | PWA / Offline | 4 | 1 | 4 | FEATURES |
| #16 | Social / Accountability | 3 | 1 | 3 | FEATURES |

*Adjusted: requires significant data accumulation or infrastructure

---

## Part 4 — Execution Roadmap

### Sprint 1: Foundation & Quick Wins (1-2 weeks)

**Theme:** Fix the basics, add high-value derived-state features that
require zero schema changes.

```
Must-do                          Should-do
───────                          ─────────
G1  Edit Habit                   #14 Theme Toggle
G2  View/Restore Archived        F13 Best/Worst Day Markers
G3  Onboarding / Empty State     N10 Personal Records Board
#3  Undo Toast
N7  Auto-Backup
```

**Why this order:** G1-G3 are embarrassing gaps. Undo toast is a UX
standard. Auto-backup protects data before we make it more valuable.
Theme toggle and records are pure frontend — zero risk, quick polish.

**Zero schema changes. Zero new dependencies.**

---

### Sprint 2: Motivation & Resilience (1-2 weeks)

**Theme:** Replace the fragile streak-only motivation system with a
richer, more forgiving model.

```
Must-do                          Should-do
───────                          ─────────
F2  Habit Health Score            N1  Today View / Focus Mode
F4  Failure Recovery Dashboard    #1  Dashboard Stats
N3  Habit Momentum Stages         F14 Habit Sunset Prompts
```

**Why this order:** Health Score + Failure Recovery + Momentum form a
coherent "motivation 2.0" package. Today View makes the daily check-in
faster. Dashboard Stats gives an overview. Sunset prompts clean up
abandoned habits.

**Schema changes: None. All derived from existing log data.**

---

### Sprint 3: Data Model Improvements (2 weeks)

**Theme:** Invest in schema changes that unlock future features.

```
Must-do                          Should-do
───────                          ─────────
N2  Completion Timestamps         #12 Habit Templates
F5  Smart Rest Days               N8  Time Budgeting
#4  Data Export                    G4  Mobile Responsive
#2  Categories / Tags
```

**Why this order:** Timestamps and Smart Rest Days are schema changes
that need to happen before we build analytics on top of them. Export
ships here because it's the last chance before the data model gets more
complex. Tags and templates are quick, complementary additions.

**Schema changes: frequency model, log entry format, tags field,
estimatedMinutes field.**

---

### Sprint 4: Engagement Features (2-3 weeks)

**Theme:** Add depth — visualizations, stacking, experiments, shortcuts.

```
Must-do                          Should-do
───────                          ─────────
#5  Heatmap                       N4  Streak DNA Viz
F3  Habit Stacking / Routines     F7  Habit Experiments
F1  Streak Shields / Vacation     F11 Keyboard Shortcuts
#8  Drag & Drop Reorder
```

**Why this order:** Heatmap is the most-requested visualization type.
Stacking introduces routine-level interaction. Streak shields pair
naturally with the motivation improvements from Sprint 2. Drag-and-drop
and keyboard shortcuts are usability improvements that compound.

**New dependency: drag-and-drop library or native DnD.**

---

### Sprint 5: Intelligence & Reflection (2-3 weeks)

**Theme:** Make the app smarter — surface insights the user didn't ask for.

```
Must-do                          Should-do
───────                          ─────────
F8  Insights Engine               N5  Habit Pair Correlations
F10 Weekly Review Wizard          N6  Adaptive Scaling Prompts
#6  Habit Notes / Journal         F6  Mood & Energy Correlation
#9  Reports Page
```

**Why this order:** The insights engine is the capstone feature that
makes all accumulated data useful. Weekly review creates a reflection
ritual. Notes add qualitative data. Correlations and mood tracking are
analytical features that benefit from months of accumulated data.

---

### Sprint 6: Infrastructure & Scale (3+ weeks)

**Theme:** Prepare for multi-user deployment and platform expansion.

```
Must-do                          Should-do
───────                          ─────────
#11 Database Migration (SQLite)   F9  Micro-Habits (schema change)
#10 Authentication                F12 iCal Export
#15 PWA / Offline Support         F15 Import from Other Trackers
#13 Goals & Milestones            N9  Natural Language Input
#7  Reminders                     #16 Social / Accountability
```

**Why this order:** DB migration must precede auth. Auth must precede
social features. PWA enables mobile. This is the "public launch" sprint.

---

## Part 5 — New Feature Reasoning Summary

Why these 10 new proposals and not others:

| Feature | Gap it fills |
|---------|-------------|
| **G1-G4 (UX Gaps)** | Basic usability issues that existing docs ignored because they're not "features." But users hit these every day. |
| **N1 Today View** | The app's primary use case (30-second daily check-in) has no optimized interface. Every session forces users through a 14-day grid. |
| **N2 Timestamps** | Invisible infrastructure. Every day without it is lost data. Enables three future features (time insights, duration, velocity). |
| **N3 Momentum Stages** | Bridges the gap between raw streaks and the "garden" metaphor. Gives habits a lifecycle arc instead of just a number. |
| **N4 Streak DNA** | Inline history visualization that the heatmap proposal doesn't cover. Shows the full story without navigating away. |
| **N5 Correlation Map** | Habits are a system, not isolated items. No existing proposal models inter-habit relationships. |
| **N6 Adaptive Scaling** | Addresses habit *stagnation* — the failure mode that occurs *after* the habit is established. Existing proposals only address formation. |
| **N7 Auto-Backup** | The only safeguard against catastrophic data loss. Should exist before any feature that increases data value. |
| **N8 Time Budgeting** | Makes the invisible cost of habits visible. Prevents overcommitment, which is the #1 cause of tracker abandonment. |
| **N9 NL Input** | Power-user speed feature. Differentiator vs. other trackers. Low-risk because it falls back to the structured form. |
| **N10 Personal Records** | Solves the "streak broke, now what?" problem differently than Failure Recovery [F4]. Records persist forever; streaks don't. |

---

## Part 6 — Decision Log

| Decision | Rationale |
|----------|-----------|
| Fix UX gaps (G1-G4) before new features | Users who can't edit habits or see archived ones will churn before they ever experience a heatmap. |
| Timestamps [N2] in Sprint 3, not Sprint 1 | It requires a schema migration. Sprint 1 should be zero-risk. But don't defer past Sprint 3 — every day without it is lost data. |
| Momentum Stages [N3] over gamification (XP/levels) | Stages are grounded in behavioral science (Lally's 66-day study). XP/levels are arbitrary game mechanics that risk replacing intrinsic motivation. |
| Streak DNA [N4] complements heatmap, doesn't replace it | DNA is inline/compact, heatmap is full-page/detailed. Different tools for different contexts. |
| Auto-backup [N7] before insights [F8] | If insights make users care more about their data, a data-loss event is more painful. Protect the data first. |
| Natural language input [N9] deferred to Sprint 6 | Depends on Smart Rest Days for custom frequencies. The structured form works fine until then. |
| No AI/ML for any feature | Every feature uses deterministic statistics. Keeps the app explainable, fast, and free of API dependencies. |
| Single consolidated backlog over multiple docs | Three feature documents with overlapping content creates confusion about priority and status. One source of truth. |
