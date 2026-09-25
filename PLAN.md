# Habit Garden — Master Plan

**Date:** 2026-09-25
**Supersedes:** All prior planning documents (FEATURES.md, NEW_FEATURES.md, BACKLOG.md,
FEATURE_PROPOSALS.md, FEATURE_PLAN.md, FEATURE_PLAN_v3.md, ROADMAP.md,
CREATIVE_FEATURES.md, IMPLEMENTATION_PLAN.md, FEATURE_ROADMAP_FINAL.md,
GEMINI.md, FEATURE_PLAN_v4.md)

---

## Current State

A React + TypeScript + Vite habit tracker with an Express/JSON-file backend.

**What works:** Create habits (name, frequency, color), toggle daily completions
for the past 14 days, view streaks (daily and weekly), archive, delete. Optimistic
UI with rollback. ~960 lines of application code across 11 source files.

**What's missing from the basics:** Edit habit, unarchive, undo, theme toggle,
mobile-optimized grid, history beyond 14 days.

---

## The Untapped Idea: The App Is Called "Habit Garden" — Act Like It

Eleven planning documents proposed 28+ features across analytics, psychology,
scheduling, and organization. Not one explored the garden metaphor that gives
the app its name. "Habit Garden" is currently a table with checkboxes. The name
promises something alive, growing, and visual. That gap is the single biggest
creative opportunity.

### G1. Living Garden View

**What:** Each habit becomes a plant in an interactive garden canvas. The plant's
growth stage reflects habit health:

| Stage | Condition |
|-------|-----------|
| Seed | Created, < 3 completions |
| Sprout | 3-6 day streak |
| Sapling | 7-13 day streak |
| Flowering | 14-29 day streak |
| Full Tree | 30+ day streak |
| Wilting | Streak broken, in recovery |

Plants use the habit's chosen color for flowers/leaves. The garden is a
supplementary view (toggle between Grid and Garden), not a replacement for the
data table.

**Why:** Visual metaphors create emotional investment that checkboxes cannot.
Watching a plant wilt because you skipped a day is more motivating than seeing
"Streak: 0." The garden metaphor also makes the app instantly recognizable —
no other habit tracker does this.

**Implementation:** SVG-based plant components with 6 visual states. Each plant is
a positioned element in a CSS grid "plot." Growth state is a pure function of
streak length — no new data model needed. Transitions between states use CSS
animations.

**Effort:** Medium. ~4-6 SVG plant variants, a GardenView component, view toggle.

---

### G2. Seasonal Rhythms

**What:** The garden's visual environment shifts with real-world seasons:
- **Spring** (Mar-May): Fresh colors, rain particles, "new growth" emphasis
- **Summer** (Jun-Aug): Bright, full bloom, peak productivity framing
- **Autumn** (Sep-Nov): Warm tones, "harvest" — celebrate milestones reached
- **Winter** (Dec-Feb): Muted palette, "rest" — reduced expectations messaging

The season also affects messaging. In winter: "Even gardens rest. Focus on your
core habits." This isn't decorative — it normalizes seasonal motivation dips
that every habit tracker ignores.

**Why:** Habit research shows motivation follows seasonal patterns. Users who
drop off in winter blame themselves. A tracker that says "winter is for rest"
retains users through the dip and earns loyalty when spring returns.

**Implementation:** Pure CSS theming by month. Season-aware copy in the header.
No data model changes.

**Effort:** Small. CSS variable overrides per season, a `getSeason()` utility.

---

### G3. Momentum Score (Garden Health)

**What:** A single 0-100 number displayed as the garden's overall health. Formula:

```
score = (consistency × 0.4) + (streakHealth × 0.3) + (recoverySpeed × 0.2) + (breadth × 0.1)

consistency   = completions in last 14 days / expected completions
streakHealth  = average(current streak / max(streak history, 7)) across habits, capped at 1
recoverySpeed = average days to restart after a break (lower = better), normalized
breadth       = habits with ≥1 completion in last 7 days / total active habits
```

Displayed as a health meter on the garden view: lush green at 80+, yellow at
50-79, dry/brown below 50.

**Why:** Users with 10+ habits need a single answer to "how am I doing?"
Individual streaks fragment attention. One score provides an at-a-glance health
check and a clear improvement target.

**Implementation:** Pure utility function from existing data. A gauge or meter
component. No API changes.

**Effort:** Small. Math utility + display component.

---

### G4. Completion Friction Control

**What:** Per-habit setting for how much effort it takes to mark complete:
- **Instant** (default): Single tap toggles. Current behavior.
- **Mindful** (500ms hold): Press and hold to complete. Prevents mindless
  checking-off of habits you didn't actually do.
- **Verify**: Brief confirmation ("Did you actually meditate today?"). For
  habits where honesty matters.

**Why:** A common criticism of habit trackers: "I just check everything off at
night without doing half of it." Friction control lets users self-calibrate
honesty. The mindful hold is especially powerful — the half-second pause forces
a moment of truth.

**Data model change:** Add optional `confirmMode: 'instant' | 'mindful' | 'verify'`
to Habit (default: 'instant').

**Effort:** Small. Long-press handler, confirmation modal, one new field.

---

### G5. Time Investment Tracking

**What:** Optional duration field per habit (e.g., "Meditate: 15 min,"
"Exercise: 45 min," "Read: 30 min"). On completion, the logged duration
rolls up into daily/weekly totals: "You invested 1h 25min in yourself today."

Not a timer — just a declared duration. The insight is the aggregate: "This
week: 8.5 hours invested" provides a powerful reframe. Users aren't just
checking boxes; they're investing time in growth.

**Why:** Duration transforms habits from binary (done/not done) into quantified
investment. "I invested 12 hours this week in my health" is profoundly more
motivating than "I completed 18 of 21 checkboxes."

**Data model change:** Add optional `durationMinutes: number | null` to Habit.
Aggregation is pure frontend math.

**Effort:** Small. Number input on form, sum display in header/dashboard.

---

### G6. Accountability Snapshot

**What:** A "Share My Week" button generates a styled image card showing:
- Garden health score
- Habit completion grid for the past 7 days (names + colored dots)
- Best streak of the week
- One-line micro-journal entry (if the journal feature exists)

The card is rendered as a downloadable PNG via canvas API. No sharing
infrastructure needed — the user saves it and shares however they want
(text, social media, accountability partner).

**Why:** Social accountability is the #1 predictor of habit success, but
building social features into a single-user app is premature. A shareable
image bridges the gap: the user gets accountability without the app needing
auth, friends lists, or feeds.

**Implementation:** HTML-to-canvas rendering (html2canvas or manual canvas draw).
A modal with preview and download button.

**Effort:** Medium. Canvas rendering, styled card layout, download logic.

---

### G7. Adaptive Suggestions

**What:** The app notices patterns and makes gentle suggestions:
- Consistently hitting 100% for 30 days → "You've mastered this rhythm.
  Consider adding a new challenge."
- Struggling (< 30% completion for 2 weeks) → "This habit seems tough right
  now. Would you like to reduce it to 3x/week while you rebuild?"
- Never completing on weekends → "You tend to skip weekends. Want to set
  Sat/Sun as planned rest days?"
- Experiment trial ending → "Your 30-day trial of Yoga ends tomorrow.
  Keep, extend, or retire?"

Suggestions appear as dismissible cards. All logic is client-side pattern
matching on existing log data. No ML.

**Why:** Most trackers are passive scoreboards. Adaptive suggestions make the
app an active partner. The user feels understood, and the app earns trust by
not nagging — suggestions appear only when data supports them.

**Implementation:** A `generateSuggestions(habits, logs)` utility that runs daily
and returns an array of suggestion objects. A `SuggestionCard` component.
No API changes.

**Effort:** Small-Medium. Pattern detection rules + card UI.

---

## Consolidated Backlog

Everything from all prior documents, deduplicated. Features are ordered by
implementation dependency and user impact.

### Phase 1: Fix the Basics (Ship These First)

| # | Feature | What | Effort |
|---|---------|------|--------|
| 1 | Edit Habit | Change name, color, frequency after creation | S |
| 2 | View & Restore Archives | Collapsible section, unarchive button | S |
| 3 | Undo Toast | "Undo" button on toggle/archive/delete toasts | S |
| 4 | Theme Toggle | Light/dark switch, persist to localStorage | S |
| 5 | Mobile Grid | Responsive table or card layout below 600px | S |

**Goal:** The app feels complete for daily single-user use.

### Phase 2: Daily Experience

| # | Feature | What | Effort |
|---|---------|------|--------|
| 6 | Habit Time Machine | Arrow-key navigation through history beyond 14 days | S |
| 7 | Today Focus Mode | Minimal daily checklist with large tappable cards | M |
| 8 | Keyboard Shortcuts | n=new, t=toggle today, arrows navigate, ?=help | S |
| 9 | Minimum Viable Day | Star-toggle marks "core" habits; all-core-done = day complete | S |
| 10 | Rest Day Patterns | Flexible scheduling: X/week, specific days, dimmed rest days | M |
| 11 | Habit Experiments | Optional trial durations with graduation/retire prompts | S-M |
| 12 | Anti-Habits | Avoidance tracking with inverted completion logic | S |
| 13 | Completion Friction | Instant/mindful-hold/verify modes per habit | S |

**Goal:** The daily check-in is fast, flexible, and psychologically smart.

### Phase 3: The Garden

| # | Feature | What | Effort |
|---|---------|------|--------|
| 14 | Living Garden View | SVG plant visualization reflecting habit health | M |
| 15 | Momentum Score | Single 0-100 garden health metric | S |
| 16 | Seasonal Rhythms | CSS theming by real-world season | S |

**Goal:** The app earns its name. Visual identity unlike any competitor.

### Phase 4: Data & Insights

| # | Feature | What | Effort |
|---|---------|------|--------|
| 17 | Dashboard Statistics | Completion rate, best day, trends | M |
| 18 | Heatmap View | GitHub-style yearly contribution grid | M |
| 19 | Completion Timestamps | Silent time-of-day recording, "best window" insights | S |
| 20 | Habit Correlation | Co-occurrence patterns from log data | S |
| 21 | Daily Micro-Journal | One-line per-day text entry | S-M |
| 22 | Time Investment | Optional duration per habit, daily/weekly totals | S |
| 23 | Data Export | JSON/CSV download | S |

**Goal:** Raw data becomes self-knowledge.

### Phase 5: Psychology & Retention

| # | Feature | What | Effort |
|---|---------|------|--------|
| 24 | Streak Recovery Mode | "Recovering: 3/7 days" instead of "Streak: 0" | S |
| 25 | Habit Half-Life | Continuous 0-100 strength with exponential decay | M |
| 26 | Streak Milestones | Celebrate 7/30/90/365 with badges and animation | S |
| 27 | Adaptive Suggestions | Pattern-based gentle nudges | S-M |
| 28 | Accountability Snapshot | Shareable weekly summary image card | M |

**Goal:** Habit Garden's tracking model is psychologically healthier than competitors.

### Phase 6: Power Features

| # | Feature | What | Effort |
|---|---------|------|--------|
| 29 | Categories / Tags | Group habits by area with filter tabs | M |
| 30 | Drag-and-Drop Reorder | Manual sort order persisted server-side | M |
| 31 | Data Import | Import from Habitica, Loop, or CSV | M |
| 32 | PWA / Offline | Service worker, offline sync, install manifest | L |

**Goal:** Scales to power users and works everywhere.

### Deferred (Not On Roadmap)

- Authentication / multi-user (no use case yet)
- Database migration (JSON is fine at this scale)
- Social features (requires auth)
- AI/ML features (need data volume)
- Push notifications (requires PWA or native)
- Gamification systems (complexity without proven value)

---

## New Feature Reasoning Summary

| Feature | Why It's Novel | Core Insight |
|---------|---------------|--------------|
| Living Garden View | No prior doc explored the app's own name metaphor | Visual emotional investment > checkbox motivation |
| Seasonal Rhythms | Normalizes motivation dips instead of punishing them | Habit science shows seasonal patterns; apps ignore this |
| Momentum Score | One number replaces fragmented streak anxiety | Users need "am I OK?" not "what's each streak?" |
| Friction Control | Prevents the #1 tracker failure: mindless checking | Configurable honesty via interaction design |
| Time Investment | Reframes habits as investment, not obligation | "12 hours this week" > "18/21 boxes checked" |
| Accountability Snapshot | Social accountability without social features | Shareable image bridges single-user and social |
| Adaptive Suggestions | Active partner, not passive scoreboard | Data-driven nudges earn trust |

---

## What to Build Next

1. **F1: Edit Habit** — smallest gap, proves the project ships code
2. **F9: Minimum Viable Day** — one boolean, one star icon, high psychological impact
3. **F14: Living Garden View** — the feature that makes this app unique

The garden view is the differentiator. Every other habit tracker has streaks,
statistics, and scheduling. None has a living garden that grows with your habits.
Build the table features (Phase 1-2) for utility, then build the garden
(Phase 3) for identity.
