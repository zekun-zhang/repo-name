# Habit Garden — Feature Roadmap & New Proposals

> Builds on FEATURE_PLAN.md. This document identifies **dimensions the
> existing 41-feature backlog still misses**, proposes 10 new features to
> fill those gaps, and reorganizes the full backlog into a single
> actionable roadmap with clear reasoning.

---

## 1. Current State Summary

**What ships today (MVP):**

| Layer | What's there | What's missing |
|-------|-------------|----------------|
| **Data model** | Habits (name, frequency, color, archived), Logs (date strings per habit) | No timestamps, no metadata, no user context |
| **Frontend** | Create form, 14-day toggle grid, streak count, archive/delete, toast, dark theme | No animations, no mobile layout, no edit, no visualization beyond the grid |
| **Backend** | Express + JSON file, CRUD + toggle, mutex lock, input validation, 17 tests | No backup, no export, single-user only |
| **Motivation** | Raw streak count | Brittle — one miss resets to zero, no nuance |

**Tech stack:** React 19 + TypeScript + Vite (frontend), Express 5 + JSON file (backend). ~960 lines of source. Zero external UI libraries.

---

## 2. Gaps the Existing Backlog Misses

The consolidated FEATURE_PLAN.md addressed 6 dimensions (cue modeling,
intrinsic motivation, failure learning, tangible evidence, ambient
awareness, decision support). After auditing it against the actual user
experience, **5 more dimensions remain unaddressed:**

| # | Gap | Why it matters | What the existing backlog does instead |
|---|-----|---------------|---------------------------------------|
| **D1** | **Completion feedback / micro-delight** | The check-in *feel* determines whether users return. Currently: a checkmark appears. No animation, no sound, no satisfaction. Every successful habit app (Streaks, Habitica, Done) treats the toggle as a micro-reward moment. | Nothing. Zero proposals address how the toggle *feels*. |
| **D2** | **Forward-looking prediction** | All analysis is backward-looking: "here's your streak", "here's your health score." Nothing says "based on your pattern, Friday is risky." Proactive > reactive. | Health Alerts (P2) warn when a streak *is* dying. Nothing warns *before*. |
| **D3** | **Life context layer** | Habit data without life context is noise. A week of zeros during vacation looks identical to a week of zeros from burnout. Without context, all analytics are misleading. | Smart Rest Days (F5) handles scheduled days off. Nothing handles unplanned life events. |
| **D4** | **The garden metaphor is just a name** | The app is called "Habit Garden" but nothing grows. The metaphor is powerful (growth, patience, tending) but completely unrealized visually. | Momentum Stages (N3) assigns labels (Seedling→Evergreen) but no visual representation. |
| **D5** | **Speed of daily check-in** | The 14-day grid is great for review but slow for daily check-in. Users who open the app at 7am want to check 5 habits in 10 seconds, not scan a table. | Smart Daily View (N1+P4) simplifies the view but doesn't optimize for *speed*. |

---

## 3. New Feature Proposals (N1–N10)

Ten features targeting the 5 unaddressed dimensions plus tactical
improvements to the daily experience.

---

### N1: Completion Micro-Animations

**Dimension:** D1 — Completion feedback

**What:** When a user toggles a habit complete, the cell plays a brief,
satisfying animation:

- **Default:** Scale bounce (1.0 → 1.3 → 1.0) with color bloom from
  the habit's color
- **Streak milestone (7, 14, 30 days):** Confetti burst from the cell
- **Perfect day (all habits done):** Full-width celebration banner with
  a brief golden shimmer across the header

All animations respect `prefers-reduced-motion` (instant fill, no
motion). Animations are CSS-only — no JS animation libraries.

**Why this is the highest-ROI feature not in the backlog:**

The toggle is the single most frequent user interaction. It happens 5-15
times per day. Currently it's a silent, instant state change. Making it
*feel good* is the difference between "I should check my habits" and "I
want to check my habits." This is dopamine design 101 — variable reward
on a fixed action.

Duolingo's streak animation, GitHub's contribution graph fill, and
Apple Watch's ring closure all prove that micro-feedback on routine
actions drives retention more than any analytics feature.

**Implementation:**
- CSS `@keyframes` for bounce, bloom, and shimmer
- Conditional class on `.day-cell-checked` for the animation trigger
- `confetti` effect: CSS-only radial gradient burst (or a tiny 2KB
  canvas helper for particle scatter)
- Perfect day detection: compare completed count vs. active habit count
- Zero backend changes, zero new dependencies

**Effort:** Low | **Sprint:** 1 (Foundation)

---

### N2: Predictive Streak Alerts

**Dimension:** D2 — Forward-looking prediction

**What:** The app analyzes day-of-week completion patterns and warns
users *before* historically weak days:

> "Heads up: you've missed **Exercise** on 4 of the last 5 Fridays.
> Tomorrow is Friday — any way to plan ahead?"

Alerts appear as a subtle banner in the header area, only when the
prediction confidence is high (4+ data points showing a >60% miss
rate for a specific day-of-week + habit combination).

**Why this fills a real gap:**

Health Alerts (P2+F14) are reactive: "Your streak is at risk." By the
time a streak is at risk, the miss has already happened. Predictive
alerts are proactive: "Tomorrow is your weakest day for this habit."

The insight isn't just "you might miss" — it's "here's a specific
pattern you can act on." A user who learns "I always skip Friday
workouts" can restructure their week. The alert is a catalyst for
behavior *redesign*, not just behavior *monitoring*.

This requires no external data or ML. A simple frequency count of
completions by day-of-week per habit, computed client-side from existing
log data.

**Implementation:**
- `utils.ts`: `getWeakDays(logs, habitId, threshold)` — returns
  day-of-week names where miss rate exceeds threshold over last 8 weeks
- `utils.ts`: `getPredictiveAlerts(habits, logs, tomorrow)` — checks
  if tomorrow matches any habit's weak day
- Frontend: `<PredictiveAlert />` banner component in App header
- Only shown when user has 8+ weeks of data for the habit
- Dismissible per-alert, resets weekly
- Zero backend changes

**Effort:** Low | **Sprint:** 2 (Motivation 2.0)

---

### N3: Life Context Markers

**Dimension:** D3 — Life context layer

**What:** Users can tag any day with a context label:

- Preset tags: `Vacation` `Sick` `Travel` `Holiday` `Busy` `Rest Day`
- Custom tags: free text (e.g., "Moving day", "Conference")

Tags appear as a subtle row above the date columns in the 14-day grid.
When viewing analytics, context-tagged days are visually distinct
(hatched or dimmed), and aggregate stats show "adjusted" completion
rates that exclude tagged days.

> "Your raw completion rate is 71%. Adjusted (excluding 5 vacation days
> and 2 sick days): 89%."

**Why this fills a real gap:**

Smart Rest Days (F5) handles *planned* schedule variations (weekdays
only, 3x/week). Streak Shields (F1) cushions *one-off* misses. Neither
handles *unplanned multi-day life events* — the most common reason
habits actually break.

Without context markers, a user returning from a week-long flu sees 7
days of red in their grid and a zeroed streak. The data says "you
failed." The truth is "life happened." Context markers fix the
narrative: the data now says "you were sick for a week and came back
immediately." That's a completely different emotional signal.

Context markers also make all future analytics honest. Completion rates,
health scores, and pattern detection that ignore life events are noisy
at best, misleading at worst.

**Implementation:**
- Schema: New `contextMarkers` map in data.json:
  `{ [date: string]: { label: string, preset: boolean } }`
- Backend: `POST /api/context` (set marker), `DELETE /api/context/:date`
- Frontend: Click date header in grid → popover with preset tags +
  custom input
- Frontend: Render markers as a thin colored stripe above date columns
- Utils: `adjustedCompletionRate(logs, contextMarkers, dateRange)` —
  filters out marked days from denominator

**Effort:** Medium | **Sprint:** 3 (Data Model)

---

### N4: Living Garden Visualization

**Dimension:** D4 — Making the metaphor real

**What:** Each habit has a tiny plant illustration that grows based on
its health/streak:

| Stage | Trigger | Visual |
|-------|---------|--------|
| Seed | Day 0 (just created) | Small brown seed icon |
| Sprout | 3-day streak | Green sprout, 2 tiny leaves |
| Seedling | 7-day streak | Taller stem, 4 leaves |
| Bush | 21-day streak | Full small bush, leaves fill out |
| Flowering | 45-day streak | Flowers bloom in the habit's color |
| Tree | 90-day streak | Full tree with the habit's color canopy |

**Wilting:** When a streak breaks, the plant doesn't reset — it wilts
one stage. 3 consecutive misses = wilt another stage. Recovery grows it
back. This preserves progress and adds emotional weight to misses
without the binary cruelty of streak resets.

**Garden Overview:** A new "Garden" tab shows all habits as their
plants arranged in a grid — a single-glance health dashboard that
communicates through shape and color, not numbers.

**Why this fills a real gap:**

"Habit Garden" is a powerful metaphor that the app doesn't use. The
name promises growth and patience; the UI delivers a spreadsheet. Making
the metaphor literal creates:

1. **Emotional investment** — Users don't want their plants to wilt.
   This is the Tamagotchi effect applied to self-improvement.
2. **Ambient status** — The garden overview communicates health through
   visual density and color, not numbers (complements Streak Weather C5).
3. **Long-term motivation** — A garden of mature trees after 6 months
   is a powerful visual artifact of sustained effort. Screenshots of a
   lush garden are inherently shareable.

**Implementation:**
- SVG components for 6 growth stages (can be simple geometric shapes —
  circles, triangles, curves — not illustrations)
- `getPlantStage(streak, missStreak)` utility function
- `<PlantIcon stage={stage} color={habit.color} />` component
- `<GardenView habits={habits} logs={logs} />` grid layout
- Wilt logic: track consecutive misses, decay one stage per 3 misses
- CSS transitions between stages for smooth growth/wilt
- Zero backend changes — derived from existing data

**Effort:** Medium | **Sprint:** 2 (Motivation 2.0) — high visual
impact, pairs naturally with Momentum Stages (N3+P3)

---

### N5: Quick Check-In Mode

**Dimension:** D5 — Speed of daily check-in

**What:** A streamlined overlay that shows *only* today's incomplete
habits as a vertical card stack:

```
┌─────────────────────────┐
│  Good morning! 5 habits │
│  left today.            │
│                         │
│  ○ Meditate             │
│  ○ Exercise             │
│  ○ Read 10 pages        │
│  ○ Journal              │
│  ○ Stretch              │
│                         │
│  [Done for now]         │
└─────────────────────────┘
```

Tap a habit → it animates to complete (using N1 micro-animation) and
slides away. When all habits are done, show a celebration. "Done for
now" closes the overlay and returns to the full grid view.

**Auto-trigger option:** If the user hasn't completed any habits today
and opens the app, show Quick Check-In automatically (configurable).

**Why this fills a real gap:**

The full grid is designed for *review* (seeing 14 days of history). But
the most common action is *today's check-in* (toggling 3-8 habits for
today only). These are different tasks that need different UIs.

Quick Check-In optimizes for the 7am use case: phone in one hand,
coffee in the other, 15 seconds before leaving the house. The grid
requires scanning, finding today's column, and tapping small cells.
Quick Check-In requires tapping large, obvious targets in a linear list.

This is the same insight behind Apple Watch's "just the rings" view vs.
the full Activity app, or Todoist's "Today" view vs. the full project
tree.

**Implementation:**
- Frontend: `<QuickCheckIn />` modal/overlay component
- Props: today's incomplete habits (filter from existing data)
- On toggle: call existing `onToggle(habitId, today)`, animate removal
- LocalStorage flag: `quickCheckIn.autoShow` preference
- CSS: full-viewport overlay with large touch targets (56px+ height)
- Zero backend changes

**Effort:** Low-Medium | **Sprint:** 1 (Foundation) — this dramatically
improves daily UX

---

### N6: Streak Milestone Celebrations

**Dimension:** D1 — Completion feedback (milestone variant)

**What:** At key streak thresholds, show a brief celebration card:

| Milestone | Celebration |
|-----------|-------------|
| 7 days | "One week strong!" + small confetti |
| 14 days | "Two weeks! You're building momentum." |
| 21 days | "21 days — the habit is taking root." |
| 30 days | "One month. This is becoming part of who you are." |
| 50 days | "50 days. Most people never get here." |
| 100 days | "Triple digits. Your garden is thriving." + large celebration |
| 365 days | "One year. Extraordinary." |

The card appears as a dismissible overlay after the toggle that crosses
the threshold. It includes the habit name, its plant stage (from N4),
and the milestone message.

**Why this is distinct from Momentum Stages (N3+P3):**

Momentum Stages assign ongoing labels (Seedling, Growing, etc.).
Milestone Celebrations are *point-in-time events* — a moment of
recognition that happens once and creates a memory. Stages are status;
milestones are occasions.

The messages are carefully written to shift from *external validation*
("one week strong!") to *identity reinforcement* ("this is becoming part
of who you are") — mirroring the psychological progression from
extrinsic to intrinsic motivation described by Deci & Ryan.

**Implementation:**
- `utils.ts`: `checkMilestone(prevStreak, newStreak)` — returns
  milestone level if a threshold was just crossed
- Frontend: `<MilestoneCelebration habit={habit} milestone={level} />`
- Triggered inside the `toggle` function in `useHabits` when the new
  log creates a streak that crosses a threshold
- Dismissed on click or after 5 seconds
- LocalStorage tracks shown milestones to avoid re-showing on page
  reload
- Zero backend changes

**Effort:** Low | **Sprint:** 2 (Motivation 2.0)

---

### N7: Habit Velocity Indicator

**Dimension:** D2 — Forward-looking analysis (trend variant)

**What:** A tiny trend arrow next to each habit's streak showing whether
completion rate is accelerating, stable, or decelerating:

| Arrow | Meaning | Calculation |
|-------|---------|-------------|
| ↑ | Strong improvement | Last 7 days > 30-day avg by 20%+ |
| ↗ | Slight improvement | Last 7 days > 30-day avg by 5-20% |
| → | Stable | Within 5% of 30-day avg |
| ↘ | Slight decline | Last 7 days < 30-day avg by 5-20% |
| ↓ | Strong decline | Last 7 days < 30-day avg by 20%+ |

Displayed as a subtle colored arrow next to the streak pill:
`7 days ↗` (green) or `3 days ↘` (amber).

**Why this fills a real gap:**

Streaks are binary (going or broken). Health Scores (F2) are composite
but static. Velocity answers a different question: "Is this habit
getting *easier* or *harder* for me right now?"

A habit with a 5-day streak and ↑ velocity feels very different from
a 5-day streak with ↓ velocity. The first is recovering; the second is
about to break. Velocity catches *trends* that absolute numbers miss.

This is particularly powerful when combined with Health Alerts — a
declining velocity triggers a warning days before the streak actually
breaks.

**Implementation:**
- `utils.ts`: `getVelocity(dates, today)` — compares 7-day completion
  rate against 30-day average, returns one of 5 states
- Frontend: Arrow icon + color class in `HabitRow` next to streak pill
- Only shown when habit has 14+ days of history (not meaningful before)
- Zero backend changes

**Effort:** Low | **Sprint:** 2 (Motivation 2.0)

---

### N8: Weekly Rhythm View

**Dimension:** Pattern visibility

**What:** A secondary view (tab or toggle) that shows habits in a
Mon–Sun grid instead of the chronological 14-day grid:

```
           Mon   Tue   Wed   Thu   Fri   Sat   Sun
Exercise   95%   90%   88%   92%   45%   30%   60%
Meditate   100%  95%   98%   95%   90%   85%   80%
Read       80%   75%   70%   72%   65%   90%   95%
```

Each cell shows the completion rate for that day-of-week over the last
8 weeks, with color intensity mapping to the percentage (heat-style).

A summary row at the bottom shows overall completion rate per day.

**Why this is different from Heatmap (#5):**

The heatmap shows *every day* on a calendar — good for seeing clusters
and gaps over months. The Weekly Rhythm View aggregates by *day-of-week*
— good for seeing the weekly pattern: "I'm great on weekdays and
terrible on weekends" or "Wednesday is my worst day across all habits."

This view surfaces the **structural** problems in a user's week that the
chronological grid buries in noise. Seeing "Friday Exercise: 45%" in
isolation is more actionable than scanning 8 Fridays across a 14-day
or 60-day grid.

**Implementation:**
- `utils.ts`: `getWeeklyRhythm(logs, habitId, weeks)` — groups
  completions by day-of-week, returns 7 rates
- Frontend: `<WeeklyRhythmView />` component, toggled from table header
- Reuses existing grid styling with 7 fixed columns
- Zero backend changes

**Effort:** Low-Medium | **Sprint:** 4 (Engagement)

---

### N9: "One Thing" Focus Mode

**Dimension:** D5 — Overwhelm reduction

**What:** A button in the header: "Focus." Activates a minimal UI
showing only the single most important habit:

1. **User-designated:** Any habit can be starred as the "one thing"
2. **Auto-selected (fallback):** The habit with the longest active
   streak (most to lose) or the most-at-risk habit (lowest recent
   completion)

The UI becomes a single large card with the habit name, its plant
(N4), today's toggle (large button), and the streak. Everything else
is hidden. A "Back to all" link exits focus mode.

**Why this fills a real gap:**

When a user has 8+ habits and feels overwhelmed ("I've already missed
3 today, why bother?"), the natural response is to close the app. Focus
Mode says: "Forget the rest. Just do this one."

This is based on Gary Keller's "ONE Thing" principle and BJ Fogg's
"Tiny Habits" research: doing one thing is infinitely better than doing
nothing. The psychological barrier isn't any individual habit — it's the
*aggregate* perceived load.

Minimum Viable Day (P10) designates 2-3 "must do" habits. Focus Mode
goes further: it designates ONE and hides everything else. It's the
emergency brake for overwhelm.

**Implementation:**
- Schema: Add `starred: boolean` to Habit (optional, default false)
- Frontend: `<FocusMode />` component — single habit display
- Frontend: Star toggle on HabitRow for "one thing" designation
- Frontend: Header button to enter/exit focus mode
- Backend: Persist `starred` field on habit
- Could also work as a localStorage-only preference (no backend change)

**Effort:** Low | **Sprint:** 1 (Foundation) — directly reduces
abandonment from overwhelm

---

### N10: Personalized Coaching Nudges

**Dimension:** Active guidance (advisor role)

**What:** Rule-based nudges that surface contextual advice derived from
the user's own data patterns. Displayed as a dismissible card in the
dashboard area, max one per day:

**Example nudges:**

| Pattern detected | Nudge |
|-----------------|-------|
| 8+ daily habits, <60% avg completion | "You have 8 daily habits but average 5 completions. Consider archiving your 2 lowest-performing habits to focus on what matters." |
| One day-of-week consistently low | "Your Saturday completion rate is 38% — your lowest day. Would a lighter Saturday routine work better?" |
| 100% for 3+ consecutive days | "Three perfect days in a row! If you've been thinking about adding a habit, now is a great time." |
| New habit dropping fast (first 7 days <40%) | "**New habit** has a 30% completion rate in its first week. Consider making it smaller — what's the 2-minute version?" |
| Habit at 50+ day streak, never missed | "**Meditate** at 52 days and counting. This one might be ready to graduate to autopilot (C8)." |
| Completion rate dropped after adding a new habit | "Since adding **Yoga**, your overall rate dropped from 85% to 68%. It might be competing with existing habits." |

**Why this fills a real gap:**

The Compatibility Advisor (C6) gives guidance *when adding* a habit.
Coaching Nudges give guidance *continuously*. Every other feature
answers "what happened?" — nudges answer "what should I do about it?"

The key constraint: nudges are **deterministic rules**, not AI. Each
nudge has a clear trigger condition, a clear data threshold, and a clear
message. Users can inspect why any nudge appeared. This makes the system
trustworthy and debuggable.

**Implementation:**
- `utils.ts`: `generateNudge(habits, logs, today)` — evaluates a
  priority-ordered list of rule functions, returns the first matching
  nudge (or null)
- Each rule: `{ id, condition: (habits, logs) => boolean, message: string }`
- Frontend: `<CoachingNudge />` component in App, shown above the table
- LocalStorage: track dismissed nudge IDs + last-shown date (max 1/day)
- Rules added incrementally — start with 3-4, expand over time
- Zero backend changes

**Effort:** Medium | **Sprint:** 3 (Data Model) — needs enough user
history to be meaningful

---

## 4. Reorganized Full Backlog

Integrating the 10 new features with the existing 41 from FEATURE_PLAN.md.
Features are re-sequenced based on user impact and dependency.

### Phase 1: Foundation & Feel (Weeks 1-2)

**Goal:** Fix UX gaps AND make the app delightful. The "feel" features
are cheap and dramatically change retention.

| # | Feature | Source | Effort | Why now |
|---|---------|--------|--------|---------|
| 1 | G1: Edit Habit | Existing | Small | Basic usability hole |
| 2 | G2: View/Restore Archived | Existing | Small | Basic usability hole |
| 3 | G3: Onboarding / Empty State | Existing | Small | First impression |
| 4 | #3: Undo Toast | Existing | Small | UX standard |
| 5 | **N1: Completion Micro-Animations** | **New** | Low | Highest-ROI feel improvement |
| 6 | **N5: Quick Check-In Mode** | **New** | Low-Med | Daily experience optimization |
| 7 | **N9: "One Thing" Focus Mode** | **New** | Low | Reduces abandonment |
| 8 | #14: Theme Toggle | Existing | Small | Polish |
| 9 | N7: Auto-Backup | Existing | Small | Data safety |

**Deliverable:** The app has no embarrassing gaps, the daily check-in
is fast and satisfying, and overwhelmed users have an escape valve.

---

### Phase 2: Motivation Engine (Weeks 3-5)

**Goal:** Replace raw streaks with a rich, forgiving, visually
expressive motivation system.

| # | Feature | Source | Effort | Why now |
|---|---------|--------|--------|---------|
| 10 | F2: Health Score | Existing | Low | Foundation for all motivation features |
| 11 | **N4: Living Garden Visualization** | **New** | Medium | Makes the app's metaphor real |
| 12 | **N6: Streak Milestone Celebrations** | **New** | Low | Point-in-time delight |
| 13 | **N7: Habit Velocity Indicator** | **New** | Low | Trend visibility at a glance |
| 14 | N3+P3: Momentum Stages + Identity | Existing | Low-Med | Lifecycle model |
| 15 | F4+N10: Failure Recovery + Records | Existing | Low | Streak break isn't the end |
| 16 | P2+F14: Habit Health Alerts | Existing | Low | Reactive warnings |
| 17 | **N2: Predictive Streak Alerts** | **New** | Low | Proactive warnings |
| 18 | P10: Minimum Viable Day | Existing | Low | Overwhelm reduction |
| 19 | C5: Streak Weather | Existing | Low-Med | Ambient atmosphere |

**Deliverable:** Habits feel alive (growing plants), milestones feel
special, trends are visible, and the app warns you before — not after —
problems develop.

---

### Phase 3: Data & Daily Experience (Weeks 6-8)

**Goal:** Enrich the data model and make the daily experience smarter.

| # | Feature | Source | Effort | Why now |
|---|---------|--------|--------|---------|
| 20 | N2: Completion Timestamps | Existing | Medium | Infrastructure for time-based features |
| 21 | F5: Smart Rest Days | Existing | Medium | Fixes frequency model |
| 22 | N1+P4: Smart Daily View | Existing | Medium | Context-aware check-in |
| 23 | C1: Habit Cue Mapping | Existing | Low | Behavior design, not just tracking |
| 24 | C2: "Why I Started" Capsule | Existing | Low | Intrinsic motivation at key moments |
| 25 | **N3: Life Context Markers** | **New** | Medium | Makes all analytics honest |
| 26 | **N10: Personalized Coaching Nudges** | **New** | Medium | Active guidance |
| 27 | #1: Dashboard Stats | Existing | Low | Summary numbers |
| 28 | #4: Data Export | Existing | Low | Data ownership |
| 29 | G4: Mobile Responsive | Existing | Medium | Mobile is primary use case |

**Deliverable:** The data model is rich enough for real insights, daily
check-in is context-aware, and the app gives proactive guidance.

---

### Phase 4: Depth & Organization (Weeks 9-11)

**Goal:** Add richness for engaged users.

| # | Feature | Source | Effort | Why now |
|---|---------|--------|--------|---------|
| 30 | #5: Heatmap | Existing | Medium | Most-requested visualization |
| 31 | **N8: Weekly Rhythm View** | **New** | Low-Med | Structural pattern visibility |
| 32 | F3: Habit Stacking / Routines | Existing | Medium | Organization at scale |
| 33 | F1: Streak Shields / Vacation | Existing | Medium | Earned forgiveness |
| 34 | C7: Ritual Builder | Existing | Medium | Reduces startup friction |
| 35 | P1: Difficulty Tiers | Existing | Low | Effort-weighted scoring |
| 36 | #8: Drag & Drop Reorder | Existing | Medium | UX standard |
| 37 | F11: Keyboard Shortcuts | Existing | Low-Med | Power user essential |

**Deliverable:** Rich organizational and visualization tools. Habits
have depth (difficulty, rituals, routines, visual history).

---

### Phase 5: Insight & Reflection (Weeks 12-14)

**Goal:** Turn accumulated data into actionable self-knowledge.

| # | Feature | Source | Effort | Why now |
|---|---------|--------|--------|---------|
| 38 | C4: Progress Proof Gallery | Existing | Medium | Tangible evidence of change |
| 39 | C3: Habit Autopsy | Existing | Medium | Learn from failure |
| 40 | F8+N5: Insights Engine | Existing | Med-High | Pattern detection |
| 41 | F10+P6: Weekly Review | Existing | Medium | Guided reflection |
| 42 | #9: Reports Page | Existing | Medium | Summary analytics |
| 43 | N4: Streak DNA Visualization | Existing | Medium | Inline history |
| 44 | C6: Compatibility Advisor | Existing | Medium | Smart guidance on new habits |

**Deliverable:** The app is an insight engine. Patterns, proof, and
reflection.

---

### Phase 6: Maturity & Scale (Week 15+)

| # | Feature | Source | Effort | Why now |
|---|---------|--------|--------|---------|
| 45 | C8: Autopilot Detection | Existing | Low-Med | Graduate stable habits |
| 46 | N6: Adaptive Scaling | Existing | Low-Med | Growth prompts |
| 47 | #13: Goals & Milestones | Existing | Medium | Target-based motivation |
| 48 | #12: Templates | Existing | Small | Onboarding acceleration |
| 49 | N8: Time Budgeting | Existing | Low | Daily time awareness |
| 50 | #2: Categories/Tags | Existing | Medium | Organization at scale |
| 51 | P8: Anti-Habit Tracking | Existing | Medium | New use case |

**Deferred indefinitely:** Auth, DB migration, PWA, social features,
iCal, import, reminders, micro-habits/partial completion.

---

## 5. New Feature Reasoning Summary

| Feature | Gap it fills | Why no existing proposal covers it | Behavioral science basis |
|---------|-------------|-----------------------------------|--------------------------|
| **N1: Micro-Animations** | Completion feels hollow | All 41 features address *what* happens. None address *how it feels*. | Variable reward theory (Nir Eyal); dopamine response to completion cues |
| **N2: Predictive Alerts** | All analysis is backward-looking | Health Alerts warn reactively. Nothing warns proactively based on pattern. | Implementation intentions (Gollwitzer): planning for specific obstacles increases follow-through by 2-3x |
| **N3: Life Context Markers** | Analytics ignore real life | Smart Rest Days handles scheduled gaps. Nothing handles unplanned life events. | Attribution theory (Weiner): misattributing failure to self vs. circumstances determines whether people persist |
| **N4: Living Garden** | The metaphor is just a name | Momentum Stages assigns labels but no visuals. The garden isn't real. | Virtual pet effect (Tamagotchi studies): emotional attachment to digital entities drives consistent engagement |
| **N5: Quick Check-In** | Daily check-in is too slow | Smart Daily View simplifies but doesn't minimize. No proposal optimizes for speed. | Fogg Behavior Model: reducing friction (making behavior easier) is more effective than increasing motivation |
| **N6: Milestone Celebrations** | Streaks pass silently | No feature marks the *moment* of crossing a threshold. | Peak-end rule (Kahneman): experiences are remembered by peaks and endings. Milestones create peaks. |
| **N7: Velocity Indicator** | Streaks are binary, scores are static | Nothing shows the *direction* of change — whether a habit is strengthening or weakening. | Trend awareness reduces "what-the-hell effect" (Polivy & Herman): seeing improvement-in-progress motivates continuation |
| **N8: Weekly Rhythm** | Structural patterns are invisible | The heatmap shows calendar time. Nothing aggregates by day-of-week to reveal structural patterns. | Environmental design (B.J. Fogg): changing context is more effective than changing motivation |
| **N9: One Thing Focus** | Overwhelm causes abandonment | Minimum Viable Day reduces load to 2-3 habits. Nothing reduces to ONE. | Paradox of choice (Schwartz): too many options → paralysis. One clear action → movement. |
| **N10: Coaching Nudges** | The app is a passive recorder | Compatibility Advisor guides new habit creation. Nothing guides ongoing behavior. | Just-in-time adaptive interventions (JITAI): the right message at the right moment based on user state |

---

## 6. Priority Rationale

**Why "feel" features (N1, N5, N6) are in Phase 1-2, not later:**

Most feature backlogs prioritize "functionality" (what the app *does*)
and defer "feel" (how the app *feels*). This is backwards for habit
apps. A habit tracker's #1 job is to make users *come back tomorrow*.
Analytics, organization, and insight features serve users who are
already retained. Micro-animations, quick check-in, and milestone
celebrations serve users who might not return.

The data supports this: Duolingo's retention improvements come primarily
from feel/gamification features, not from learning-quality features.
Streaks (visual), hearts (scarcity), celebration animations
(feedback) — these are what keep users opening the app.

**Why Living Garden (N4) is Phase 2, not Phase 5:**

The garden visualization might seem like a "nice to have." But it's
the app's *identity*. An app called "Habit Garden" with no garden is a
broken promise. Delivering the garden early:
1. Creates emotional investment that retains users through the
   less-exciting infrastructure sprints (Phase 3)
2. Provides a visual framework that later features (autopilot, stages)
   can hook into
3. Differentiates the app from every other habit tracker on the market

**Why Predictive Alerts (N2) before Coaching Nudges (N10):**

Predictive Alerts are simple (one rule: day-of-week weakness) and
immediately actionable. Coaching Nudges require a rules engine with
multiple conditions and careful message design. Alerts prove the
concept; nudges scale it.

---

## 7. Implementation Quick-Start (Phase 1, Features 1-9)

For each Phase 1 feature, here's the minimal first step:

| Feature | First file to touch | First function to write |
|---------|--------------------|-----------------------|
| G1: Edit Habit | `server/app.js` | `app.patch('/api/habits/:id', ...)` |
| G2: View Archived | `src/hooks/useHabits.ts` | Export `archivedHabits` from hook |
| G3: Onboarding | `src/components/HabitTable.tsx` | Enhance empty state with template starters |
| #3: Undo Toast | `src/hooks/useHabits.ts` | Add undo callback to toast state |
| **N1: Micro-Animations** | `src/App.css` | `@keyframes habit-complete-bounce` |
| **N5: Quick Check-In** | `src/components/QuickCheckIn.tsx` | New component, `incompleteToday` filter |
| **N9: Focus Mode** | `src/components/FocusMode.tsx` | New component, single-habit display |
| #14: Theme Toggle | `src/App.tsx` | `useTheme()` hook with localStorage |
| N7: Auto-Backup | `server/app.js` | `fs.copyFile` before `writeData()` |
