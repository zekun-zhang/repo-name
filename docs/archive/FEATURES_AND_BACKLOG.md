# Habit Garden — Features & Execution Plan

**Date:** 2026-10-24
**Status:** Consolidates and replaces all prior planning documents (PLAN.md, ROADMAP.md, BACKLOG.md, FEATURES_v3–v16, FEATURES_FINAL, FEATURES_NEW)

---

## Project State

| Metric | Value |
|--------|-------|
| Application code | ~960 lines, 11 source files |
| Working features | Create, toggle (14-day grid), streaks (daily/weekly), archive, delete |
| Known defects | 5 (API error handling, no edit, no unarchive, dead CSS, test data) |
| Planning documents | **18** files, ~10,000+ lines |
| Features proposed to date | **93+** across series C, D, E, F, G, H, I, J, K |
| Features shipped | **0** |
| Planning-to-code ratio | ~10.4:1 |

### What Exists Today

**Frontend:** React 19 + TypeScript + Vite. Dark-themed two-column layout. HabitForm (left) creates habits with name, frequency (daily/weekly), and color. HabitTable (right) shows a 14-day completion grid with streaks, archive, and delete actions.

**Backend:** Express + flat JSON file (`data.json`) with async mutex. CRUD endpoints for habits plus a toggle endpoint for daily logs.

**Data model:**
```typescript
type Habit = { id, name, frequency: 'daily'|'weekly', color, createdAt, archived }
type HabitLog = { [habitId: string]: string[] }  // arrays of date strings
```

---

## New Feature Proposals (L1–L5)

### What 93 Prior Proposals All Share

After auditing every proposal (C1–C5, D1–D5, E1–E5, F1–F5, G1–G5, H1–H4, I1–I5, J1–J5, K1–K5), five assumptions persist across all of them:

1. **The user already has habits in mind.** No proposal addresses the blank-slate problem: a new user opens the app and must invent habits from scratch.
2. **Each habit exists in isolation from daily life.** Proposals add metadata to habits (effort, friction, anchors, cues) but none models the environment the habit lives in — what time, what location, what preceding activity.
3. **Information density is always good.** Every proposal adds more data to the view. None addresses the progressive information overload as the habit list grows past 5–6 items.
4. **The app is a mirror (shows what happened).** No proposal makes the app a compass (shows what to do next, right now, in this moment).
5. **Struggle is abnormal.** Proposals address failure compassionately (grace days, comeback mode, friction logs) but none normalizes it — none tells the user "this is the hard part, and it's expected."

L1–L5 each targets one of these blind spots.

---

### L1. Habit Starter Packs (Onboarding Templates)

**Blind spot addressed:** Every proposal assumes the user already knows what habits to track. The blank "Create a habit" form is the first screen a new user sees, and it's the highest-friction moment in the entire app. No proposal reduces the activation energy of getting started.

**What it does:**

When the habit list is empty (or via a "Browse templates" button), the app offers curated starter packs — pre-configured habit bundles organized by goal:

```
What are you working toward?

  Morning Routine               Health & Fitness
  ├─ Meditate 5 min            ├─ Exercise 30 min
  ├─ Journal 1 page            ├─ Drink 8 glasses of water
  └─ Make bed                  ├─ Sleep by 11pm
                               └─ Eat vegetables

  Learning & Growth             Mindfulness
  ├─ Read 20 pages             ├─ Meditate 10 min
  ├─ Practice language 15 min  ├─ Gratitude journal
  └─ Write 500 words           └─ Digital sunset (no screens after 9pm)

  Or create your own →
```

Each template habit comes with:
- A sensible frequency (daily/weekly)
- A suggested color (so the grid looks coherent)
- An optional anchor statement ("why this matters")
- A suggested micro tier label (for integration with K1 Habit Scaling)

The user selects a pack, removes or edits any habits they don't want, and hits "Start." All selected habits are created at once.

**Key design decisions:**
- **Curated, not generated.** 6–8 packs, each with 3–4 habits. Enough choice to feel personal; not so much it becomes browsing.
- **Editable before creation.** Templates are starting points, not prescriptions. The user modifies any field before committing.
- **Packs are suggestions, not programs.** No sequencing, no dependencies, no "Week 1/Week 2" structure. Each habit stands alone.
- **Disappears after use.** Once the user has 1+ habits, the starter packs move to a secondary "Browse templates" link. The main UI stays clean.

**Why it's different from everything proposed:**
- "Habit Stacking" chains habits together. Starter Packs group them by goal but each remains independent.
- "Difficulty Progression" (N5) and "Habit Scaling" (K1) change how a single habit works over time. Starter Packs solve the _which habits to pick_ problem that comes before any tracking.
- No prior proposal addresses the onboarding funnel. All 93 proposals improve the experience for users who already have habits.

**Behavioral science:** "Choice overload" (Iyengar & Lepper, 2000) — when people face too many options with no default, they often choose nothing. The blank habit creation form is a pure choice-overload scenario. Pre-curated packs reduce cognitive load by converting an open-ended generation task ("think of habits") into a selection task ("pick what fits"). Selection is cognitively cheaper and has higher conversion rates. The "default effect" (Johnson & Goldstein, 2003) means users often keep template habits as-is, which means the templates' quality directly shapes habit outcomes.

**Data model:** No schema changes. Templates are static data (a JSON array in the frontend or a `/api/templates` endpoint). Creating from a template uses the existing `POST /api/habits` endpoint for each habit.

**Effort:** ~30 min. Template data (hardcoded or small JSON), template browser component, multi-select UI, batch creation. No server schema changes.

---

### L2. Context Routines (Time + Place Anchoring)

**Blind spot addressed:** Every proposal treats habits as abstract items on a list. In reality, habits are deeply contextual — they happen at specific times, in specific places, after specific triggers. The app knows _what_ you do but not _when/where_ you do it. This makes it impossible to give timely, relevant prompts.

**What it does:**

Each habit can optionally belong to a "routine" — a time-of-day context:

```
Your routines:

  Morning (6–9am)          Afternoon (12–2pm)       Evening (7–10pm)
  ├─ Meditate 5 min        ├─ Walk 20 min           ├─ Read 20 pages
  ├─ Journal               └─ Stretch               ├─ Gratitude journal
  └─ Exercise                                       └─ No screens

  Anytime
  ├─ Drink water
  └─ Take vitamins
```

The main view groups habits by routine instead of a flat list. When the user opens the app:
- **Morning:** Morning routine is expanded, others are collapsed.
- **Afternoon:** Morning is collapsed (with a summary: "3/3 done"), afternoon is expanded.
- **Evening:** Evening is expanded; completed routines show a green summary line.

This creates a natural daily rhythm:

```
Morning  ✓ 3/3                     [expand]
─────────────────────────────────
Afternoon                          [2 habits]
  ○ Walk 20 min        ░░░░░░░░░░░░░░
  ○ Stretch            ░░░░░░░░░░░░░░
─────────────────────────────────
Evening                            [3 habits, later today]
```

**Key design decisions:**
- **Routines are optional.** Habits without a routine appear in "Anytime." Users who prefer a flat list ignore routines entirely.
- **Time ranges are user-defined, not rigid.** "Morning" might be 5am–8am for one user and 8am–11am for another.
- **Routines auto-collapse when completed.** This progressively simplifies the view through the day — by evening, only uncompleted habits remain visible.
- **No notifications.** Routines set visual context, not alarms. The app stays pull-based, not push-based.

**Why it's different from everything proposed:**
- "Custom Scheduling" (G1, 2.1) handles _which days_ (Mon/Wed/Fri). Routines handle _which time of day_ — a different axis entirely.
- "Effort Budget" (J1) prioritizes by energy level. Routines organize by temporal context — they answer "what should I do now?" not "what can I handle today?"
- "Cue Anchoring" (dim 46) stores a text description of the trigger. Routines create a structural grouping that changes the UI itself.
- "Habit Stacking" chains habits in sequence. Routines group habits by time window without imposing order.

**Behavioral science:** "Implementation intentions" (Gollwitzer, 1999) — the most robust finding in habit research is that specifying _when_ and _where_ you will perform a behavior increases follow-through by 2–3x compared to motivation alone. "I will exercise" has a ~30% success rate. "I will exercise at 7am in the living room" has a ~60% success rate. Routines encode implementation intentions directly into the app's structure, making them ambient rather than requiring the user to remember them. The auto-collapse mechanic leverages "completion closure" (Zeigarnik, 1927 inverted) — collapsing finished routines gives a sense of progress and reduces visual clutter, which lowers decision fatigue for remaining habits.

**Data model:**
```typescript
type Routine = {
  id: string
  name: string        // "Morning", "Evening", custom
  startTime?: string  // "06:00" — optional, used for auto-expand
  endTime?: string    // "09:00"
  order: number       // display sort
}

type Habit = {
  // ...existing
  routineId?: string  // null = "Anytime"
}

type Data = {
  // ...existing
  routines?: Routine[]
}
```

**Effort:** ~45 min. Routine CRUD (simple name + time range), habit-to-routine assignment, grouped rendering with auto-collapse logic, time-based expansion. One new small server collection.

---

### L3. Habit Zones (Adaptive Visibility)

**Blind spot addressed:** Every proposal adds more information to every habit row — sparklines, decay indicators, friction ratings, momentum scores, rhythm percentages. After implementing even 3–4 of these, the habit table becomes a wall of data. No proposal addresses information architecture as the habit list grows. The current flat list treats a 200-day-old habit the same as a 3-day-old one, but they need fundamentally different levels of attention.

**What it does:**

Habits are automatically categorized into three visibility zones based on their tracking data:

```
Focus Zone (needs your attention)
  ○ Exercise 30 min       ▓▓░░░▓░  4/7 — declining
  ○ Journal               ▓░░░░░░  1/7 — at risk

Cruise Zone (on autopilot)
  ✓ Meditate 5 min        ▓▓▓▓▓▓▓  streak: 34 days
  ✓ Read 20 pages         ▓▓▓▓▓▓▓  streak: 21 days
  ✓ Make bed              [collapsed — 45 day streak]

Growing Zone (still building)
  ○ Learn Spanish          Created 4 days ago — building momentum
  ○ Cold shower            Created 1 day ago — give it time
```

**Zone logic:**
- **Focus:** 7-day completion rate dropped below 70% OR below the habit's own 30-day average. These are the habits that need attention right now.
- **Cruise:** Streak of 14+ days AND 7-day completion rate above 85%. These habits are on autopilot — they still show in the grid but with reduced visual weight. After 30+ days in Cruise, the row auto-collapses to a single summary line.
- **Growing:** Created within the last 14 days. These get encouraging framing ("building momentum") instead of being judged by metrics that don't have enough data yet.

**Key design decisions:**
- **Automatic but overridable.** The app sorts habits into zones based on data, but the user can pin any habit to Focus regardless of its metrics.
- **Zone changes are gradual, not alarming.** A habit slides from Cruise to Focus over 2–3 days of declining density, not a sudden jump.
- **Cruise habits are still trackable.** They're not hidden — just visually de-emphasized. One tap expands the full row.
- **Growing habits are judgment-free.** No streak count, no decay sparkline, no rhythm score during the first 14 days. Just "day 5 of building this habit."

**Why it's different from everything proposed:**
- "Silent Streaks" (I1, 1.4) lets users hide streak numbers. Zones restructure the entire view based on what needs attention.
- "Habit Maturity & Graduation" (dim 48) detects when a habit is automatic and suggests sunsetting. Zones create a middle ground — Cruise zone acknowledges automation without ending the habit.
- "Effort Budget" (J1) prioritizes by energy. Zones prioritize by attention need — which habits deserve your limited focus today?
- "Minimum Viable Day" marks habits as core/optional. Zones are dynamic and data-driven, not user-labeled.

**Behavioral science:** "Attention as a limited resource" (Kahneman, 1973) — cognitive load research consistently shows that presenting all information at equal weight leads to worse decisions than hierarchical presentation. Zones apply the "progressive disclosure" pattern from UI design to habit tracking: show what matters most, make everything else accessible but not demanding. The Growing zone specifically addresses the "fragile early days" problem: new habits are most vulnerable to abandonment in their first 2 weeks (Lally et al., 2010 found an average of 66 days to automaticity, with the highest dropout in the first 14 days). Protecting new habits from premature metric pressure reduces that dropout.

**Data model:** No schema changes. Zones are computed from existing log data (7-day and 30-day completion rates, streak length, createdAt date). Pure rendering logic.

**Effort:** ~35 min. Zone calculation utility (completion rates over windows), grouped rendering with collapsible sections, Growing zone date-based framing. No server changes.

---

### L4. The Difficulty Curve (Habit Lifecycle Normalization)

**Blind spot addressed:** Every proposal treats struggle as something to fix — with grace days, comeback modes, friction logs, effort budgets. None tells the user that struggle is _expected_ and _temporary_. Research on habit formation consistently shows a predictable emotional arc: honeymoon enthusiasm, a motivation dip around weeks 2–4, and gradual stabilization. No proposal makes this arc visible so the user can see that their struggle is normal, not personal failure.

**What it does:**

Each habit shows a small "lifecycle indicator" that maps the user's current position on the typical habit formation curve:

```
Exercise 30 min — Day 18
╭─────────────╮
│ ~~\___/~~~~ │  ← You are here (the dip)
╰─────────────╯
This is the hardest phase. Most people hit a dip
around weeks 2-4. It gets easier from here.
```

The lifecycle has four phases, each with characteristic patterns:

```
Phase 1: Spark (Days 1–7)
"Fresh energy. Enjoy the momentum — it's real, and it helps."

Phase 2: The Dip (Days 8–30)
"The novelty has worn off but the habit isn't automatic yet.
This is where most people quit. Pushing through here is the
most valuable thing you can do."

Phase 3: Settling In (Days 31–66)
"It's becoming part of your routine. Some days still feel hard,
but the pattern is taking hold."

Phase 4: Rooted (Day 67+)
"This habit has taken root. It's becoming who you are,
not just what you do."
```

The indicator is small and unobtrusive — a tiny progress bar or phase label next to the habit name. Tapping it shows the full phase description with the curve visualization.

**Key design decisions:**
- **Phase thresholds are based on research, not arbitrary.** Lally et al. (2010) found a median of 66 days to automaticity, with a range of 18–254 days. The phases map to the research while keeping the model simple.
- **Phases adjust to the user's actual data.** If a user's 7-day completion rate dips below 60% during Phase 1, The Dip messaging appears early. If they maintain 90%+ through Phase 2, Settling In appears early. The model adapts.
- **No failure messaging.** Even if the user's completion rate is low, the phase description stays encouraging and normalizing. "Most people experience this" — not "you're falling behind."
- **Lifecycle indicator is optional and minimal.** A small label ("Day 18 — The Dip") next to the habit name. Full explanation on tap. Users who don't want it can disable per-habit.

**Why it's different from everything proposed:**
- "Comeback Mode" (K2) addresses returning after a gap. The Difficulty Curve addresses struggle _during_ active tracking — the user is showing up but finding it hard.
- "Habit Maturity & Graduation" (dim 48) detects when a habit is automatic. The Difficulty Curve shows the _journey toward_ automaticity, not just the endpoint.
- "Habit Scaling" (K1) gives an easier option on hard days. The Difficulty Curve explains _why_ today feels hard — it's not about an easier version, it's about knowing the hard part is normal and temporary.
- "Narrative View" (J2) tells a story from data. The Difficulty Curve provides a _predictive framework_ — it tells the user what to expect, not just what happened.

**Behavioral science:** The habit formation curve is well-established: Lally et al. (2010) documented that automaticity follows a negatively accelerating curve — rapid initial gains, a plateau period, and gradual asymptotic approach to full automaticity. The critical finding: knowing about the curve changes behavior. Rothman (2000) showed that when people expect a dip in motivation and are told it's normal, they persist through it at significantly higher rates than people who encounter the same dip unexpectedly. This is the "inoculation effect" — exposure to a weakened version of a challenge (in this case, _knowing_ the dip is coming) builds resistance to it.

**Data model:** No schema changes. Phases are computed from `createdAt` and completion rate patterns. Pure rendering logic.

**Effort:** ~25 min. Phase calculation from createdAt + completion patterns, small phase label component, expandable phase description, simple curve visualization (SVG or CSS). No server changes.

---

### L5. Now Mode (Single-Action Focus)

**Blind spot addressed:** Every proposal keeps the full habit list visible. Even with zones, routines, and narratives, the primary view is always a _list of things to do_. Lists create cognitive load — you see everything at once and must choose. No proposal offers a mode where the app shows exactly one thing: the single most important habit to do _right now_.

**What it does:**

A "Now" button in the header switches to a full-screen, single-habit focus view:

```
┌─────────────────────────────────────────────┐
│                                              │
│                                              │
│            ╭───────────────────╮              │
│            │                   │              │
│            │    Meditate       │              │
│            │    5 minutes      │              │
│            │                   │              │
│            │   "So I can be    │              │
│            │    present with   │              │
│            │    my kids."      │              │
│            │                   │              │
│            │   [ Done ]        │              │
│            │                   │              │
│            ╰───────────────────╯              │
│                                              │
│         Day 34 — Settling In                 │
│         Streak: 12 days                      │
│                                              │
│              [ Skip → Next ]                 │
│                                              │
└─────────────────────────────────────────────┘
```

**The algorithm picks the one habit that matters most right now:**

1. Uncompleted habits only.
2. Prioritized by: routine time window (current time of day first), then zone (Focus > Growing > Cruise), then effort cost (cheapest first — quick wins build momentum).
3. After completing or skipping, the next habit slides in. When all are done: a completion screen.

**Key design decisions:**
- **Now Mode is opt-in.** The default view remains the grid/table. Now Mode is for moments when the user feels overwhelmed by choices and just wants to be told "do this."
- **Anchor statement is prominent.** In the list view, the "why" is hidden. In Now Mode, it's front and center — this is the moment it matters most.
- **Skip is always available.** Now Mode is guidance, not a requirement. Skipping moves to the next habit without judgment.
- **Lifecycle phase appears.** "Day 34 — Settling In" provides context without the full grid's data density.
- **Completion screen is a moment.** When the last habit is done (or skipped), the screen shows a simple, warm completion message, not statistics.

**Why it's different from everything proposed:**
- "Focus Spotlight" (prior) highlights one habit within the list view. Now Mode replaces the entire view with a single-action interface — it's a mode shift, not a highlight.
- "Effort Budget" (J1) tells you which habits fit today's energy. Now Mode goes further: it tells you which _one_ to do _right now_, in order.
- "Habit Conversation" (J4) asks you a question. Now Mode gives you an answer — the next action, no question asked.
- "Habit Debt Dashboard" (I3) shows what's remaining today. Now Mode eliminates the dashboard entirely and feeds you one action at a time.

**Behavioral science:** "Decision fatigue" (Baumeister et al., 2011) — every choice depletes the same limited resource used for self-control. A habit tracker that presents 8 habits simultaneously forces 8 micro-decisions ("which one do I do first?") that consume the very willpower needed to actually do them. Now Mode eliminates decision fatigue by making the choice for you. This maps to the "one-thing" principle from behavioral design: when you reduce an interface to a single action, completion rates rise dramatically. Duhigg (2012) found that the most successful habit programs reduce the behavioral prompt to a single, clear, immediate action — not a menu of possibilities.

**Data model:** No schema changes. Habit ordering in Now Mode is computed from existing data: routine times, zone calculations, effort cost (if J1 is implemented, otherwise treated as equal). Pure rendering logic.

**Effort:** ~35 min. Now Mode component (full-screen single-habit card), priority algorithm, transition animations between habits, completion screen. No server changes.

---

## Novelty Matrix

| ID | Feature | Blind Spot | Why 93 Prior Proposals Missed It |
|----|---------|-----------|----------------------------------|
| L1 | Starter Packs | Cold-start / blank-slate problem | All proposals improve the experience for users who already have habits. None addresses getting started. |
| L2 | Context Routines | Time-of-day structure | Proposals add metadata to habits but none models when/where they happen as a structural UI element. |
| L3 | Habit Zones | Information overload | Every proposal adds more data per habit. None manages the cognitive load of a growing habit list. |
| L4 | Difficulty Curve | Normalizing struggle | Proposals address failure compassionately but none tells the user their struggle is predictable and temporary. |
| L5 | Now Mode | Single-action focus | Every proposal keeps the full list visible. None offers a mode that eliminates choice entirely. |

---

## Consolidated Execution Backlog

This backlog draws from the best proposals across all 93+ features (series C through L), ranked by dependency, effort, and impact. Each tier is one focused work session.

### Tier 0 — Fix What's Broken (~45 min)

Ship these before any features. They're correctness, not enhancement.

| # | Item | Detail | Est. |
|---|------|--------|------|
| 0.1 | API error handling | `if (!res.ok) throw` in all 5 `api.ts` functions | 10 min |
| 0.2 | Edit habit | `PUT /api/habits/:id` + inline edit in HabitRow | 20 min |
| 0.3 | Unarchive | `POST /api/habits/:id/unarchive` + archived section in UI | 10 min |
| 0.4 | Clean dead CSS | Remove unused `index.css` | 2 min |
| 0.5 | Clean test data | Reset `data.json` to `{ "habits": [], "logs": {} }` | 1 min |

### Tier 1 — First Real Features (~80 min, pick 3–4)

Features that change how the app feels to use every day. Each is independent.

| # | Feature | Est. | Source | Why |
|---|---------|------|--------|-----|
| 1.1 | **Starter Packs** | 30 min | **L1** | Solves the #1 drop-off point: blank app with no habits |
| 1.2 | **Anchor Statement** | 10 min | C3 | One optional text field, huge emotional depth |
| 1.3 | **Comeback Mode** | 30 min | K2 | No data model changes, addresses the #1 abandonment moment |
| 1.4 | **Difficulty Curve** | 25 min | **L4** | Pure rendering, normalizes struggle, reduces early dropout |
| 1.5 | **Momentum Decay Sparkline** | 20 min | C2 | Ambient early-warning before streaks break |

### Tier 2 — Structural Improvements (~100 min, pick 3)

Features that add new capabilities or change the app's information architecture.

| # | Feature | Est. | Source | Why |
|---|---------|------|--------|-----|
| 2.1 | **Habit Zones** | 35 min | **L3** | Manages cognitive load as the habit list grows |
| 2.2 | **Context Routines** | 45 min | **L2** | Time-of-day structure makes the app relevant throughout the day |
| 2.3 | **Now Mode** | 35 min | **L5** | Single-action focus for overwhelmed moments |
| 2.4 | **Anti-Habits** | 55 min | K4 | Reduction tracking opens the app to an entirely new use case |
| 2.5 | **Effort Budget** | 40 min | J1 | Energy-aware daily prioritization |

### Tier 3 — Depth & Engagement (~120 min, pick 3)

Features that make the app smarter over time. Best after 2+ weeks of real usage.

| # | Feature | Est. | Source | Why |
|---|---------|------|--------|-----|
| 3.1 | **Habit Scaling** | 45 min | K1 | Micro/standard/stretch tiers eliminate all-or-nothing thinking |
| 3.2 | **Habit Sunset** | 35 min | J3 | Celebrates completion; habits aren't meant to last forever |
| 3.3 | **Habit Conversation** | 55 min | J4 | Bidirectional daily dialogue turns tracking into interaction |
| 3.4 | **Narrative View** | 50 min | J2 | Story-based alternative to the data grid |
| 3.5 | **Weekly Rhythm Score** | 30 min | C4 | Healthier consistency metric than streaks |

### Tier 4 — Intelligence & Analytics (~150 min)

Require 1+ month of real usage data to be meaningful.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 4.1 | Habit Experiments | 50 min | K3 |
| 4.2 | Time Capsule | 40 min | J5 |
| 4.3 | Compound Progress | 30 min | C1 |
| 4.4 | Habit Seasons | 40 min | K5 |
| 4.5 | Friction Log | 30 min | C5 |

### Parked — Valid But Not Now

| Feature | Reason |
|---------|--------|
| Living Garden View | The app's namesake, but high effort — ship when daily UX is solid |
| Custom Scheduling (Mon/Wed/Fri) | Useful but routines (L2) handle the more common need first |
| Habit Stacking / Chains | Complex dependency model; needs simpler features first |
| Social / Sharing | Separate scope; the app is personal-first |
| Full Analytics Dashboard | Needs months of data; premature optimization of insight |
| PWA / Offline / Export | Infrastructure project, not a feature |

---

## Recommended Execution Path

### Session 1: Foundation (~45 min)
Ship Tier 0 (all 5 items). The app becomes reliable.

### Session 2: First Impression (~65 min)
- **Starter Packs (L1)** — new users can get started in 30 seconds
- **Anchor Statement (C3)** — emotional depth with minimal code
- **Difficulty Curve (L4)** — new habits feel supported, not judged

After this session: the app has a smooth onboarding experience, emotional depth, and behavioral science built into the daily view.

### Session 3: Daily Experience (~65 min)
- **Comeback Mode (K2)** — returning users get a warm welcome instead of a wall of failure
- **Habit Zones (L3)** — the view adapts to what needs attention

After this session: the app handles the three critical moments — first visit, daily use, and returning after a gap — each with a designed experience.

### Session 4: Differentiation (~75 min)
- **Now Mode (L5)** — single-action focus for overwhelmed users
- **Effort Budget (J1)** — energy-aware prioritization

After this session: Habit Garden is no longer "another habit tracker." It has features no competitor offers.

---

## Feature Dependency Map

```
Tier 0 (bugs)
  └─→ Everything depends on Tier 0

Independent (can build in any order after Tier 0):
  L1 Starter Packs
  C3 Anchor Statement
  L4 Difficulty Curve
  K2 Comeback Mode
  C2 Momentum Sparkline
  L3 Habit Zones
  L5 Now Mode
  J1 Effort Budget
  J3 Habit Sunset
  K4 Anti-Habits
  C4 Weekly Rhythm

Soft dependencies (better with, but don't require):
  L5 Now Mode ← benefits from L2 Routines (time-of-day priority)
  L5 Now Mode ← benefits from J1 Effort Budget (cost-based priority)
  L5 Now Mode ← benefits from C3 Anchor Statement (shows "why")
  K1 Habit Scaling ← benefits from L5 Now Mode (tier selector in focus view)
  J4 Habit Conversation ← benefits from C3 Anchor (references it in prompts)
  J2 Narrative View ← benefits from C3 Anchor + C2 Sparkline (richer story data)
  K3 Experiments ← requires 2+ weeks of data for meaningful comparison
  J5 Time Capsule ← requires milestones to reach (meaningful only with streaks)
```

---

## What This Document Replaces

| Document | Status |
|----------|--------|
| PLAN.md | Superseded |
| ROADMAP.md | Superseded |
| BACKLOG.md | Superseded |
| FEATURES_v3 through v16 | Superseded |
| FEATURES_FINAL.md | Superseded |
| FEATURES_NEW.md | Superseded |

These files can be archived or deleted. This document is the single planning reference.

---

## The Planning Debt Problem

This project has 18 planning documents totaling ~10,000+ lines for ~960 lines of code. The planning-to-code ratio is over 10:1.

**This document does not ask for another planning document.** The next action after reading this is code:

1. `Tier 0.1` — Add `if (!res.ok)` checks to `api.ts`
2. `Tier 0.5` — Reset `data.json` to empty
3. Continue through Tier 0

Every feature in this backlog has:
- A concrete data model (or explicitly "no changes needed")
- An effort estimate under 60 minutes
- No dependency on any other feature (except Tier 0)
- A clear "done" state

Ship code. Not another plan.
