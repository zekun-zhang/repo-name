# Habit Garden — Master Plan v2

**Date:** 2026-09-26  
**Supersedes:** PLAN.md v1 and all prior planning documents

---

## Current State

A React 19 + TypeScript + Vite habit tracker with an Express/JSON-file backend.

**What works:** Create habits (name, frequency, color), toggle daily completions
for the past 14 days, view streaks (daily and weekly), archive, delete. Optimistic
UI with rollback. Dark-themed responsive layout. 17 API tests. ~960 lines of
application code across 11 source files.

**What's missing from the basics:** Edit habit, unarchive, undo, theme toggle,
mobile-optimized grid, history beyond 14 days, proper HTTP error handling in
the API client.

---

## New Creative Features (v2 Additions)

These are features not present in any prior planning document. Each addresses a
distinct psychological or UX gap, grounded in behavior-science research.

---

### N1. Habit Stacking (Chain Builder)

**What:** Users link habits into ordered chains: "After I [habit A], I do
[habit B]." The UI renders chains as connected sequences with visual arrows.
Completing habit A highlights habit B as "next up." Chains can be named
("Morning Routine", "Evening Wind-Down").

A chain is an ordered list of habit IDs with a display name. Chains don't
enforce completion order — they suggest it. The visual prompt is the feature.

**Why this matters:** James Clear's *Atomic Habits* identifies "habit stacking"
as the #1 technique for building new habits. The core insight: new habits
succeed when anchored to existing ones. Every habit app tracks *what* you do;
none tracks the *sequence* in which you do it. Sequence is where behavior
design happens.

**Why no prior plan included it:** All 11 planning documents treated habits as
independent items. Not one modeled relationships between habits. But habits
don't exist in isolation — they exist in routines, and routines have order.

**Data model change:** New `Chain` type: `{ id, name, habitIds: string[], createdAt }`.
New API endpoint: CRUD for chains. Frontend: `ChainView` component, chain
assignment in habit creation/edit.

**Effort:** Medium. New data model, new endpoint, new UI component.

---

### N2. Streak Insurance (Grace Days)

**What:** Users configure 1-3 "grace days" per month — pre-planned days where
missing a habit doesn't break the streak. The calendar shows grace days with a
distinct visual (a small umbrella icon over the garden plant, or a shield on
the day cell). Grace days are declared in advance (by end of previous day),
not retroactively.

**Why this matters:** The #1 reason people abandon habit trackers: one missed
day destroys a 30-day streak, and the psychological devastation causes a
spiral of missed days. Research on "what-the-hell effect" (Polivy & Herman)
shows that a single lapse triggers abandonment when people frame progress as
all-or-nothing. Grace days break the binary: you planned to miss, so your
streak is intact.

The advance-declaration requirement is critical. Retroactive grace days would
just be cheating. Declaring tomorrow as a grace day *today* is intentional
rest planning — a skill worth building.

**Why no prior plan included it:** Prior docs proposed "Streak Recovery Mode"
(softening the reset) and "Habit Half-Life" (continuous decay instead of
binary). Both address the *aftermath* of a broken streak. Grace days prevent
the break in the first place. Prevention > recovery.

**Data model change:** Add `graceDaysPerMonth: number` to Habit (default 0,
max 3). New log type or flag to mark a day as "grace" vs "completed" vs
"missed." Grace day declaration endpoint.

**Effort:** Small-Medium. One new field, declaration UI, streak calculation
update.

---

### N3. Energy-Aware Check-In

**What:** At the start of each day (or on first open), a quick 1-tap energy
rating: Low / Medium / High (three icons: battery-low, battery-half,
battery-full). Based on the rating, the app adjusts its presentation:

- **Low energy:** Shows only "core" habits (the Minimum Viable Day set from
  feature #9). Non-core habits are dimmed with the message "Focus on what
  matters today." No streak penalty for skipping non-core habits on low-energy
  days.
- **Medium energy:** Shows all habits normally.
- **High energy:** Shows all habits plus a "stretch goal" suggestion if one is
  defined (e.g., "High energy today — try doubling your reading time?").

Over time, the app learns patterns: "You tend to have low energy on Mondays
and high energy on Wednesdays" (pure client-side stats, not ML).

**Why this matters:** Every habit tracker treats every day the same. But human
energy fluctuates — by sleep, stress, health, day of week. Forcing the same
expectations on a sick day as a great day is a design failure. Energy-aware
check-in respects the user's actual state and adjusts expectations, which
increases completion rates on hard days (because the bar is lower) and
ambition on good days (because the bar is higher).

**Why no prior plan included it:** Prior plans focused on *what* habits to
track, not *how the user feels today*. The daily emotional/physical state is
a missing input that changes the entire UX.

**Data model change:** New `DailyState` record: `{ date, energyLevel: 'low' | 'medium' | 'high' }`.
Stored alongside logs. No server changes needed if stored client-side.

**Effort:** Small. Three-button picker, conditional rendering, localStorage.

---

### N4. Weekly Compass (Intention Setting)

**What:** Every Sunday evening (or configurable day), the app presents a
"Weekly Compass" screen:

1. **Reflection:** "Last week: 78% completion. Your strongest habit was
   Meditation (7/7). Your most-skipped was Exercise (2/7)."
2. **Intention:** "This week, I commit to focusing on: [user selects 3-5
   habits from their full list]." Selected habits get a star/compass icon
   for the week.
3. **Challenge (optional):** "Stretch goal: Complete Exercise 5/7 days this
   week." Auto-suggested based on the weakest habit.

At week's end, the compass view shows whether intentions were met.

**Why this matters:** Most habit trackers are backward-looking (streaks,
stats, history). But behavior change research (Gollwitzer's "implementation
intentions") shows that *forward-looking commitment* dramatically improves
follow-through. Declaring "this week I will focus on X" activates a different
cognitive process than passively reviewing what happened.

The weekly cadence also creates a natural rhythm. Instead of an undifferentiated
stream of days, the user's life gains a weekly structure: reflect, commit,
execute, repeat.

**Why no prior plan included it:** Prior docs proposed analytics (backward-
looking) and suggestions (passive). The Weekly Compass is *active* and
*forward-looking* — the user makes a commitment, not just observes data.

**Data model change:** New `WeeklyIntention` record: `{ weekStart, focusHabitIds, challenge?, met? }`.

**Effort:** Medium. New view, weekly state management, reflection calculation.

---

### N5. Habit Difficulty Progression

**What:** Each habit has an optional "level" that the user manually advances.
Examples:

- Meditation: Level 1 (5 min) → Level 2 (10 min) → Level 3 (15 min) → Level 4 (20 min)
- Running: Level 1 (1 km) → Level 2 (3 km) → Level 3 (5 km)
- Reading: Level 1 (10 pages) → Level 2 (20 pages) → Level 3 (30 pages)

Level names and thresholds are user-defined. The UI shows current level as a
badge. When a user levels up, the garden plant gets a visual flourish (a
flower blooming, a bird landing). A timeline view shows progression over
months.

**Why this matters:** Most trackers treat habits as static: "Meditate" is the
same checkbox on day 1 and day 300. But real habits evolve — you start small
and grow. Without progression tracking, users plateau and lose interest.
Difficulty progression answers "How far have I come?" in a way that streaks
cannot. A 90-day streak says "I didn't miss." A Level 1→Level 4 progression
says "I grew."

**Why no prior plan included it:** Prior docs discussed "Habit Experiments"
(trial durations) but not ongoing progression. Experiments are about *trying*
habits; progression is about *growing* within them. Different dimension.

**Data model change:** Add optional `levels: { name: string, current: number }[]`
and `currentLevel: number` to Habit. Level-up history in a new log type.

**Effort:** Small-Medium. Level definition UI, badge display, level-up
animation.

---

### N6. Habit Heartbeat (Pulse Visualization)

**What:** A real-time "heartbeat" visualization on the dashboard — a subtle
pulsing animation whose rhythm reflects current habit health. The heartbeat
is derived from the Momentum Score (G3):

- Score 80-100: Strong, steady pulse (healthy garden)
- Score 50-79: Slower, slightly irregular pulse (garden needs attention)
- Score 20-49: Weak, intermittent pulse (garden struggling)
- Score 0-19: Near-flatline with occasional blip (garden in critical state)

The heartbeat is a thin SVG line that runs across the top of the garden view,
similar to an ECG/heart monitor. Each "beat" corresponds to a day's completion
density. The visual is ambient — not a chart to study, but a living signal
that communicates state at a glance.

**Why this matters:** Humans process movement faster than numbers. A pulsing
garden that "breathes" faster when healthy creates an emotional connection
that a "Score: 73" number cannot. The heartbeat also gamifies without points
— you want to see a strong, steady pulse, and a weak one creates gentle
urgency.

**Why no prior plan included it:** G3 proposed the Momentum Score as a number.
The heartbeat is its *embodiment* — the score made visceral. The number tells
you "73"; the heartbeat makes you feel it.

**Data model change:** None. Pure visualization of existing data.

**Effort:** Small. SVG animation driven by the momentum score function.

---

### N7. Quiet Weeks (Planned Deload)

**What:** Users can designate a future week as a "Quiet Week" — a planned
period of reduced expectations. During a Quiet Week:

- Only "core" habits (Minimum Viable Day set) are expected
- Non-core habits show as optional with a "rest" icon
- Streaks pause for non-core habits (no penalty)
- The garden view shows a peaceful, resting state (e.g., nighttime, moonlight)
- The app header says: "Quiet Week — focus on your essentials"

Quiet Weeks must be declared at least 24 hours in advance.

**Why this matters:** Every habit tracker assumes infinite, constant effort.
But real life has vacations, illness, grief, busy seasons. Users who can't
do everything feel like failures when the tracker shows missed days. Quiet
Weeks formalize what athletes call "deloading" — planned recovery that
prevents burnout.

This is distinct from Grace Days (N2): Grace Days are individual days for
individual habits. Quiet Weeks are whole-week reductions across all habits.
Athletes don't just skip one exercise — they reduce the entire program.

**Why no prior plan included it:** Seasonal Rhythms (G2) adjusts the *app's
tone* by calendar season. Quiet Weeks let the *user* declare their own
seasons. External seasons are approximations; personal seasons are precise.

**Data model change:** New `QuietWeek` record: `{ weekStart: string, declaredAt: string }`.
Streak calculation skips non-core habits during quiet weeks.

**Effort:** Small. Declaration UI, conditional rendering, streak calc update.

---

### N8. Completion Sparks (Micro-Celebrations)

**What:** When a user completes a habit, a tiny, context-aware celebration
appears for 1.5 seconds:

- **First completion of the day:** "First one down!" with a small spark animation
- **All core habits done:** "Core complete! Everything else is bonus." with a
  warm glow effect on the garden
- **Streak milestone hit (7, 30, 90):** Confetti burst + milestone badge
- **All habits done:** "Perfect day!" with a garden bloom animation
- **Came back after a miss:** "Welcome back. One day at a time." (no fanfare,
  just warmth)

Celebrations are small, tasteful, and vary. They never repeat the same
message twice in a row. They can be disabled per-user.

**Why this matters:** Dopamine hits on completion are the mechanism behind
habit formation (Nir Eyal's Hook Model, BJ Fogg's "Shine"). Current app:
the checkmark appears silently. A 0.5-second micro-celebration costs nothing
but creates the reward loop that makes checking-in feel good. The key is
restraint — celebration fatigue kills engagement. Context-aware messages
that recognize *what just happened* feel genuine; generic confetti on every
click feels cheap.

**Why no prior plan included it:** Prior docs proposed "Streak Milestones"
(badges at 7/30/90). Completion Sparks go further: every completion is a
micro-celebration opportunity, and the celebration is context-aware, not
just threshold-based.

**Data model change:** None. Pure frontend logic. Celebration state tracked
in session memory.

**Effort:** Small. Animation components, message rotation logic, context
detection.

---

## Consolidated Backlog (v2)

Everything from v1 plus the 8 new features (N1-N8), reordered by dependency
and impact.

### Phase 1: Fix the Basics

Ship these first — the app should feel complete for daily single-user use
before adding anything creative.

| # | Feature | What | Effort | Status |
|---|---------|------|--------|--------|
| 1 | Edit Habit | Change name, color, frequency after creation | S | Not started |
| 2 | View & Restore Archives | Collapsible section, unarchive button, new API endpoint | S | Not started |
| 3 | Undo Toast | "Undo" button on toggle/archive/delete toasts (3s window) | S | Not started |
| 4 | Theme Toggle | Light/dark switch, persist to localStorage, fix vestigial index.css | S | Not started |
| 5 | Mobile Grid | Responsive card layout below 600px, swipeable days | S | Not started |
| 6 | API Error Handling | Check `res.ok` in api.ts, surface server error messages | S | Not started |

**Exit criteria:** A new user can create, edit, archive, unarchive, and
delete habits on mobile and desktop without confusion.

---

### Phase 2: Daily Experience

Make the daily check-in fast, flexible, and psychologically smart.

| # | Feature | What | Effort | New? |
|---|---------|------|--------|------|
| 7 | Minimum Viable Day | Star-toggle marks "core" habits; all-core-done = day complete | S | |
| 8 | Completion Sparks | Context-aware micro-celebrations on completion | S | N8 |
| 9 | Energy-Aware Check-In | Daily energy rating adjusts which habits are shown/expected | S | N3 |
| 10 | Habit Stacking | Chain habits into named sequences with visual flow | M | N1 |
| 11 | Today Focus Mode | Minimal daily checklist with large tappable cards | M | |
| 12 | Keyboard Shortcuts | n=new, t=toggle today, arrows navigate, ?=help | S | |
| 13 | Completion Friction | Instant/mindful-hold/verify modes per habit | S | |
| 14 | Habit Time Machine | Arrow navigation through history beyond 14 days | S | |

**Exit criteria:** The daily check-in takes under 60 seconds for 10+ habits,
feels rewarding, and adapts to the user's energy.

---

### Phase 3: The Garden

The feature set that makes this app unique. Build this before analytics —
identity before insight.

| # | Feature | What | Effort | New? |
|---|---------|------|--------|------|
| 15 | Living Garden View | SVG plant visualization reflecting habit health | M | |
| 16 | Momentum Score | Single 0-100 garden health metric | S | |
| 17 | Habit Heartbeat | Pulsing ECG-style visualization of garden health | S | N6 |
| 18 | Seasonal Rhythms | CSS theming by real-world season, seasonal messaging | S | |
| 19 | Difficulty Progression | Level system per habit with garden visual flourishes | S-M | N5 |

**Exit criteria:** A user can switch to Garden view and see their habits as
living plants whose health reflects their actual behavior. The view is
beautiful enough to screenshot.

---

### Phase 4: Resilience & Psychology

Features that keep users through the hard times — this is where retention
lives.

| # | Feature | What | Effort | New? |
|---|---------|------|--------|------|
| 20 | Streak Insurance | Pre-declared grace days that preserve streaks | S-M | N2 |
| 21 | Quiet Weeks | Planned deload periods with reduced expectations | S | N7 |
| 22 | Streak Recovery Mode | "Recovering: 3/7 days" instead of "Streak: 0" | S | |
| 23 | Weekly Compass | Weekly intention-setting and reflection view | M | N4 |
| 24 | Adaptive Suggestions | Pattern-based gentle nudges from log data | S-M | |
| 25 | Rest Day Patterns | Flexible scheduling: X/week, specific days, dimmed rest days | M | |
| 26 | Habit Experiments | Optional trial durations with graduation/retire prompts | S-M | |
| 27 | Anti-Habits | Avoidance tracking with inverted completion logic | S | |

**Exit criteria:** A user who misses a day, has a bad week, or goes on
vacation does not feel punished. The app actively helps them recover.

---

### Phase 5: Data & Insights

Raw data becomes self-knowledge.

| # | Feature | What | Effort |
|---|---------|------|--------|
| 28 | Dashboard Statistics | Completion rate, best day, trends over time | M |
| 29 | Heatmap View | GitHub-style yearly contribution grid | M |
| 30 | Completion Timestamps | Silent time-of-day recording, "best window" insights | S |
| 31 | Habit Correlation | Co-occurrence patterns between habits from log data | S |
| 32 | Daily Micro-Journal | One-line per-day text entry, searchable | S-M |
| 33 | Time Investment | Optional duration per habit, daily/weekly investment totals | S |
| 34 | Data Export | JSON/CSV download of all data | S |

**Exit criteria:** A user with 3+ months of data can answer "What are my
patterns?" without a spreadsheet.

---

### Phase 6: Social & Sharing

| # | Feature | What | Effort |
|---|---------|------|--------|
| 35 | Accountability Snapshot | Shareable weekly summary image (canvas-rendered PNG) | M |
| 36 | Streak Milestones | Celebrate 7/30/90/365 with badges and animation | S |

**Exit criteria:** A user can share their progress with an accountability
partner without creating an account.

---

### Phase 7: Power Features

| # | Feature | What | Effort |
|---|---------|------|--------|
| 37 | Categories / Tags | Group habits by life area with filter tabs | M |
| 38 | Drag-and-Drop Reorder | Manual sort order persisted server-side | M |
| 39 | Data Import | Import from Habitica, Loop, or CSV | M |
| 40 | PWA / Offline | Service worker, offline sync queue, install manifest | L |

**Exit criteria:** Power users with 20+ habits across life areas can organize,
reorder, and use the app offline.

---

### Deferred (Not On Roadmap)

- Authentication / multi-user (no use case yet)
- Database migration (JSON is fine at this scale)
- Social features beyond snapshot (requires auth)
- AI/ML features (need data volume)
- Push notifications (requires PWA first)
- Gamification systems (complexity without proven value)

---

## New Feature Reasoning Summary

### v1 Features (from prior plan)

| Feature | Core Insight |
|---------|-------------|
| Living Garden View | Visual emotional investment > checkbox motivation |
| Seasonal Rhythms | Normalizes motivation dips instead of punishing them |
| Momentum Score | One number replaces fragmented streak anxiety |
| Friction Control | Prevents the #1 tracker failure: mindless checking |
| Time Investment | Reframes habits as investment, not obligation |
| Accountability Snapshot | Social accountability without social features |
| Adaptive Suggestions | Active partner, not passive scoreboard |

### v2 Features (new in this plan)

| Feature | Why It's Novel | Core Insight | Behavioral Science |
|---------|---------------|--------------|-------------------|
| Habit Stacking (N1) | No habit app models habit *relationships* | Habits succeed when anchored to existing routines | James Clear's "habit stacking" from Atomic Habits |
| Streak Insurance (N2) | Prevents streak breaks instead of softening them | Planned rest prevents the "what-the-hell effect" | Polivy & Herman's abstinence violation research |
| Energy-Aware Check-In (N3) | No tracker adapts to daily energy state | Same expectations on sick and healthy days is a design failure | Variable difficulty = higher overall completion rates |
| Weekly Compass (N4) | Forward-looking commitment, not backward analytics | Declaring "I will" activates different cognition than reviewing "I did" | Gollwitzer's implementation intentions |
| Difficulty Progression (N5) | Tracks growth within a habit, not just consistency | "I grew from 5 to 20 minutes" > "I didn't miss a day" | Self-efficacy theory (Bandura) |
| Habit Heartbeat (N6) | Makes the momentum score visceral, not numeric | Movement communicates state faster than numbers | Pre-attentive visual processing |
| Quiet Weeks (N7) | User-declared deloading, not just seasonal themes | Athletes plan recovery; habit trackers don't | Periodization in training science |
| Completion Sparks (N8) | Every completion is a reward opportunity | Context-aware celebration > generic confetti | BJ Fogg's "Shine" + Nir Eyal's variable rewards |

---

## What to Build Next (Recommended Order)

### Immediate (next 1-2 sessions)

1. **#1: Edit Habit** — Smallest gap, proves the project ships code, unblocks
   everything that needs habit modification.
2. **#6: API Error Handling** — One-file fix (`api.ts`), prevents silent
   failures that would confuse users of new features.
3. **#7: Minimum Viable Day** — One boolean field, one star icon, high
   psychological impact. Required foundation for Energy-Aware Check-In and
   Quiet Weeks.

### Near-term (next 3-5 sessions)

4. **#8: Completion Sparks** — Pure frontend, no data model changes, immediate
   emotional impact on daily use.
5. **#4: Theme Toggle** — Clean up vestigial CSS, respect system preference,
   add manual toggle.
6. **#15: Living Garden View** — The differentiator. Every other habit tracker
   has streaks and stats. None has a living garden.

### Medium-term

7. **#20: Streak Insurance** — Paired with Minimum Viable Day, this creates a
   psychologically healthy streak system.
8. **#10: Habit Stacking** — The most novel feature. Links habits into routines,
   which is how habits actually work.
9. **#23: Weekly Compass** — Transforms the app from a scoreboard into an
   active behavior-change partner.

### The thesis

Phases 1-2 make the app *usable*. Phase 3 makes it *unique*. Phase 4 makes it
*humane*. The garden is the identity; the psychology features are the retention
engine. Build utility first, then identity, then humanity.

---

## Architecture Notes for Implementation

**Data model evolution:** Most new features add optional fields to the existing
Habit type or create new lightweight records alongside the existing `{ habits, logs }`
structure. No migration system is needed — default values handle backward
compatibility with existing data.json files.

**Frontend-first features:** N3 (Energy), N6 (Heartbeat), N8 (Sparks) need zero
server changes. They derive from existing data or use localStorage. Ship them
without touching the backend.

**Server-required features:** N1 (Stacking) needs a new `chains` collection.
N2 (Grace Days) needs log-type expansion. N4 (Weekly Compass) needs intention
storage. N7 (Quiet Weeks) needs a quiet-week record. All are simple JSON
additions to the existing flat-file store.

**No breaking changes:** Every feature is additive. Existing habits, logs, and
API contracts remain unchanged. New endpoints sit alongside existing ones.
