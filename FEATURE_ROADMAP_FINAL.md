# Habit Garden — Feature Roadmap (Consolidated)

**Date:** 2026-09-22  
**Replaces:** FEATURES.md, NEW_FEATURES.md, BACKLOG.md, FEATURE_PROPOSALS.md, FEATURE_PLAN.md, FEATURE_PLAN_v3.md, ROADMAP.md, CREATIVE_FEATURES.md, IMPLEMENTATION_PLAN.md

---

## Part 1: Current State Assessment

### What Exists (Shipped Code, ~960 Lines)

| Capability | Details |
|---|---|
| **Habit CRUD** | Create with name/frequency/color. Archive. Delete with confirm. **No edit.** |
| **Completion Tracking** | Toggle any day in a 14-day window. Binary yes/no. |
| **Streak Calculation** | Daily (consecutive days from today) and weekly (consecutive ISO weeks). |
| **14-Day Grid** | Table view with habit rows × date columns. Today column highlighted. |
| **Backend** | Express + JSON file storage with async mutex. 5 REST endpoints. |
| **Frontend** | React 19 + TypeScript + Vite. 4 components, 1 custom hook. |
| **Error Handling** | Optimistic updates with rollback. Toast notifications. Retry on load fail. |
| **Theme** | Hardcoded dark. CSS variables for light exist in `index.css` but are overridden by `App.css`. |
| **Tests** | 17 backend integration tests covering all endpoints. Zero frontend tests. |

### What's Missing (Foundation Gaps)

These are not features — they're basic expectations users have of any CRUD app:

1. **Cannot edit a habit after creation** (change name, color, or frequency)
2. **Cannot view or restore archived habits** (archive is a one-way door)
3. **No theme toggle** (dark is hardcoded despite light CSS vars existing)
4. **No undo** (accidental toggles require re-toggling, accidental archives are unrecoverable from the UI)
5. **No way to see history beyond 14 days** (data exists server-side but the grid is fixed)
6. **No onboarding** (empty state says "No habits yet" with no guidance)
7. **No stats or feedback** (only the streak number; no completion rates, trends, or insights)

### Meta-Observation: The Planning Trap

This project has accumulated **10 planning documents** proposing **65+ features** across 9 commits since the initial MVP. Zero lines of application code have been written. The planning-to-code ratio is approximately 4:1.

Previous docs identified this problem. ROADMAP.md stated it explicitly: *"The bottleneck is not ideas. It's building."* Yet the next 3 commits added more planning documents.

**This document is the last planning document.** Everything below is organized to be picked up and built, one feature at a time. No feature depends on planning another feature first.

---

## Part 2: New Feature Proposals (Novel — Not Previously Proposed)

These 5 features have not appeared in any of the 10 prior planning documents. Each addresses a gap that the existing 65+ proposals missed.

### N1. Habit Half-Life (Continuous Strength Model)

**The Problem:** Binary streaks are psychologically fragile. A 90-day meditation streak that breaks on day 91 shows "Streak: 0 days" — identical to someone who has never meditated. This punishes consistency and discourages re-engagement after a miss.

**The Idea:** Model each habit's "strength" as a continuous value (0–100) using exponential decay. Completing the habit charges strength toward 100. Each day without completion, strength decays by a configurable half-life (default: 7 days). A 90-day habit that misses one day drops from ~100 to ~90, not to zero.

**Why It's Novel:** Prior proposals addressed streak fragility with bolt-on mechanics (shields, savings banks, grace periods, freeze). Those preserve the binary streak model and add exceptions. Half-life replaces the model itself. Strength is always a gradient, never a cliff.

**Data Model Change:**
- Add `halfLifeDays: number` to `Habit` (default 7)
- Strength is computed client-side from log history + half-life, not stored
- Display alongside or instead of the existing streak number

**Reasoning:** Research on habit formation (Lally et al., 2010) shows habits form on a continuous curve, not a binary switch. The half-life model mirrors the actual neuroscience: neural pathways weaken gradually without reinforcement, not instantaneously.

---

### N2. Completion Confidence Levels

**The Problem:** Habit completion is currently binary — you either did it or you didn't. But real life has nuance. You planned to run 5K but walked 1K. You meditated for 3 minutes instead of 20. You read 2 pages instead of a chapter. Binary tracking discards this signal.

**The Idea:** Allow optional partial completions: 25%, 50%, 75%, 100%. The default tap/click still toggles 100% (frictionless for users who don't want granularity). Long-press or right-click opens a 4-level selector. Partial completions appear as partially-filled cells in the grid (quarter, half, three-quarter fills using the habit's color).

**Why It's Novel:** Prior proposals covered difficulty tiers (how hard the habit is to do), warmup ramps (easing into new habits), and adaptive scaling (auto-adjusting targets). None addressed the completion signal itself. This is about recording what actually happened, not prescribing what should happen.

**Data Model Change:**
- `HabitLog` changes from `{ [habitId]: string[] }` to `{ [habitId]: Array<{ date: string, level: 25 | 50 | 75 | 100 }> }`
- Backward compatible: existing string-array entries are treated as `{ date, level: 100 }`

**Reasoning:** "Partial credit" reduces all-or-nothing thinking, the #1 psychological barrier to habit consistency (identified in James Clear's research on habit identity). Logging "I did something" on a bad day is better than logging nothing.

---

### N3. Habit Time Machine

**The Problem:** The UI shows exactly 14 days. All historical data beyond that window is invisible to the user, even though the server stores it indefinitely. Users cannot review their September progress in October, see how a habit performed during a vacation, or identify seasonal patterns.

**The Idea:** Add a date range navigator above the grid. Left/right arrows scroll the 14-day window backward and forward through time. A "jump to date" picker allows navigating to any point. A "Today" button resets to the current window. The grid, streaks, and all derived data update to reflect the selected window.

**Why It's Novel:** Prior proposals for historical data focused on derived views — heatmaps (#5), reports (#9), monthly memory lane, progress proof, time capsule snapshots. None proposed making the existing grid itself navigable through time. This is the simplest possible history feature: no new UI paradigm, just making the current grid scroll.

**Implementation Notes:**
- `generatePastNDays(14, anchorDate)` already exists — just make `anchorDate` stateful instead of hardcoded to `todayISO()`
- Streak calculation should optionally compute "streak as of date X" for historical windows
- No backend changes needed

**Reasoning:** The cheapest feature on this list. The grid component, streak logic, and data already support arbitrary date ranges. The only missing piece is UI controls to change the anchor date.

---

### N4. Today Focus Mode

**The Problem:** The full 14-day grid optimizes for review, not for the daily check-in moment. When a user opens the app to log today's habits, they see 14 columns of history, action buttons, and form fields. On mobile, this requires horizontal scrolling. The most common user action — "mark today's habits done" — is buried in a dense table.

**The Idea:** A minimal "Today" view that shows only today's habits as a vertical checklist. Each habit is a large, tappable card with the habit name, color, and a single checkbox. Tap to toggle. Swipe to dismiss. No grid, no dates, no forms. A toggle in the header switches between "Today" and "Full View." Today mode is the default on narrow viewports (< 600px).

**Why It's Novel:** Prior proposals included Quick Capture Bar (fast add), Focus Mode (hide distractions during habit execution), and Smart Day Planner (AI-scheduled day). None proposed a simplified check-in view. This is about reducing the daily interaction to 5 seconds of tapping, not adding intelligence.

**Implementation Notes:**
- New component: `TodayView.tsx` — renders `activeHabits` as cards, each with `onToggle(habit.id, todayISO())`
- App-level state: `view: 'today' | 'full'`, persisted to `localStorage`
- Auto-select 'today' on viewports under 600px

**Reasoning:** The best habit apps (Streaks, Productive) optimize for the daily moment, not the weekly review. The current grid-first UI biases toward analysis over action. Most users open the app once a day to check things off — that flow should be one tap per habit.

---

### N5. Rebuild Cost Indicator

**The Problem:** Streak mechanics typically create anxiety: "Don't break your 47-day streak!" This frames the streak as something to protect, which paradoxically makes breaking it more devastating and reduces re-engagement after a break.

**The Idea:** Instead of (or alongside) the current streak counter, show the "rebuild cost" — how many days it would take to return to the same strength level if you stopped today. A 3-day streak shows "Rebuild: 3 days." A 90-day streak shows "Rebuild: 90 days." This reframes the streak as accumulated investment rather than a fragile record.

When the user HAS broken a streak, show "X days to recover" as a countdown to their previous level, which decreases each day they complete the habit. This turns re-engagement from "start over at 0" into "you're 3 days from being back where you were."

**Why It's Novel:** Prior streak-related proposals (shields, savings banks, weather, decay warnings) all focus on preventing streak breaks or softening the blow. None reframe the streak narrative itself. Rebuild cost shifts the psychology from loss aversion ("protect what you have") to investment awareness ("look what you've built") and recovery motivation ("you're almost back").

**Implementation Notes:**
- Pure frontend computation from existing log data
- Pairs naturally with N1 (Half-Life) but works independently with the existing streak model
- Display as a secondary label on the streak pill: "47 days (90d to rebuild)"

**Reasoning:** Behavioral research shows loss framing ("don't lose your streak") increases anxiety and decreases intrinsic motivation. Investment framing ("you've built 47 days of practice") maintains motivation while making breaks feel recoverable.

---

## Part 3: Consolidated Backlog (Prioritized)

All 65+ previously proposed features, deduplicated and filtered to a realistic 18 items in 3 tiers.

### Tier 1: Foundation (Build These First)

These fix gaps in the MVP that users encounter in the first session. Each is small (< 1 day of work) and independently shippable.

| # | Feature | Effort | Reasoning |
|---|---|---|---|
| F1 | **Edit Habit** — Change name, color, frequency after creation | S | Basic CRUD. Users create test habits and can't fix typos. |
| F2 | **View & Restore Archived Habits** — Collapsible section or separate tab | S | Archive is currently a one-way door. Users archive accidentally. |
| F3 | **Undo Toast** — Toast with "Undo" button for toggle, archive, delete | S | Accidental actions are currently irreversible from the UI. |
| F4 | **Theme Toggle** — Light/dark switch; CSS vars already exist in `index.css` | S | The CSS infrastructure is built. Just needs a toggle and `data-theme` attribute. |
| F5 | **Mobile-Responsive Grid** — Horizontal scroll or card layout below 600px | S | The 14-column table breaks on phones. |

### Tier 2: Core Value (Differentiating Features)

These make Habit Garden useful beyond the first week. Each is a meaningful feature (1–3 days).

| # | Feature | Effort | Reasoning |
|---|---|---|---|
| F6 | **Dashboard Statistics** — Completion rate, best day, total completions, trend arrows | M | Users need feedback beyond streak count. |
| F7 | **Heatmap View** — GitHub-style contribution grid showing completion density over months | M | Visual proof of consistency. The most-requested feature in habit tracker reviews. |
| F8 | **Data Export** — Download habits + logs as JSON or CSV | S | Data portability. Users won't invest in a tool that traps their data. |
| F9 | **Keyboard Shortcuts** — `n` new habit, `t` toggle today, arrow keys navigate grid | S | Power users expect keyboard-driven interaction. |
| F10 | **Habit Notes** — Optional text note on any completion (visible on hover/tap) | M | Context for future self: "Did 20 pushups" vs. just a checkmark. |
| F11 | **Habit Time Machine** (N3 above) — Navigate the grid through history | S | All data exists; just need date controls. Cheapest high-impact feature. |
| F12 | **Today Focus Mode** (N4 above) — Minimal daily check-in view | M | Optimizes the most common user action. |

### Tier 3: Advanced (Differentiators for Retention)

These make Habit Garden stand out from other trackers. Each is a medium-to-large feature (2–5 days).

| # | Feature | Effort | Reasoning |
|---|---|---|---|
| F13 | **Habit Half-Life** (N1 above) — Continuous strength model | M | Psychologically healthier than binary streaks. |
| F14 | **Completion Confidence** (N2 above) — Partial completion levels | M | Captures nuance that binary tracking misses. |
| F15 | **Rebuild Cost Indicator** (N5 above) — Investment-framed streak display | S | Reframes streak psychology from anxiety to motivation. |
| F16 | **Streak Milestones** — Celebrate 7, 30, 90, 365-day milestones with visual markers | S | Positive reinforcement at psychologically meaningful thresholds. |
| F17 | **Categories / Tags** — Group habits by area (health, work, personal) | M | Organization becomes critical at 8+ habits. |
| F18 | **PWA / Offline Support** — Service worker for offline toggle, app installability | L | Habit tracking must work without connectivity (gym, airplane, subway). |

### Explicitly Deferred (Not on Roadmap)

These appeared in prior docs but are premature for a single-user JSON-backed app:

- **User Authentication** — No multi-user need yet
- **Database Migration (SQLite/Postgres)** — JSON file is fine for single-user
- **Social / Accountability** — Requires auth first
- **AI/ML features** (Smart Day Planner, Insights Engine, Autopilot Detection) — Need data volume that doesn't exist yet
- **Reminders / Notifications** — Requires PWA or native wrapper first
- **All "streak variant" mechanics** (shields, savings bank, weather, freeze, etc.) — N1 (Half-Life) replaces these with a better model

---

## Part 4: Implementation Roadmap

### Sprint 1: Foundation (F1–F5)

**Goal:** Make the MVP feel complete. Fix the gaps users hit in session one.

**Exit Criteria:** A user can create, edit, archive, restore, and delete habits. They can undo mistakes. The app works on mobile. They can switch themes.

**Estimated Effort:** 3–5 days total.

### Sprint 2: Value (F6, F7, F8, F11)

**Goal:** Give users a reason to keep using the app after week one.

**Exit Criteria:** Users can see their progress (dashboard + heatmap), navigate their full history (time machine), and export their data.

**Estimated Effort:** 5–8 days total.

### Sprint 3: Daily Experience (F9, F10, F12)

**Goal:** Optimize the daily interaction.

**Exit Criteria:** The app has a fast check-in mode, keyboard navigation, and completion notes.

**Estimated Effort:** 4–6 days total.

### Sprint 4: Psychology (F13, F14, F15, F16)

**Goal:** Make Habit Garden's tracking model psychologically healthier than competitors.

**Exit Criteria:** Habits have continuous strength (half-life), partial completions, rebuild cost framing, and milestone celebrations.

**Estimated Effort:** 5–8 days total.

### Sprint 5: Organization & Reach (F17, F18)

**Goal:** Scale to power users and offline use.

**Exit Criteria:** Habits can be categorized. App installs as PWA and works offline.

**Estimated Effort:** 5–8 days total.

---

## Part 5: Recommendation

**Build F1 (Edit Habit) today.** It's the smallest feature, the most obvious gap, and it proves this project can ship code, not just plans.

Then ship F2–F5 in the same week. The foundation sprint is 5 small features, each independently deployable, each fixing a real usability gap.

The previous 10 documents agreed on this priority. The difference this time should be execution.
