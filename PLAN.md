# Habit Garden — Master Plan

> **This document is the single source of truth.** It supersedes FEATURES.md,
> NEW_FEATURES.md, BACKLOG.md, FEATURE_PLAN.md, FEATURE_PLAN_v3.md,
> FEATURE_PROPOSALS.md, ROADMAP.md, CREATIVE_FEATURES.md, and
> IMPLEMENTATION_PLAN.md. Those files are preserved as historical reference
> but should not be consulted for planning.
>
> **Honest state of the project:** ~600 lines of shipped code, ~4,000 lines
> of planning across 8 documents, 65+ feature proposals, 0 features shipped
> post-MVP. This plan makes hard cuts and adds only what the existing 65+
> proposals genuinely miss.
>
> Created: 2026-05-20

---

## What We Have (Shipped MVP)

| Capability | Status |
|------------|--------|
| Create habits (name, frequency, color) | Working |
| Toggle daily completion (14-day grid) | Working |
| Streak calculation (daily + weekly) | Working |
| Archive / delete habits | Working |
| Dark theme, responsive layout | Working |
| Optimistic updates, toast notifications | Working |
| JSON file persistence with async mutex | Working |
| 17 backend integration tests | Passing |
| 7 API endpoints | Stable |

**What's missing from the MVP that users hit daily:** Can't edit habits.
Archived habits vanish. No onboarding. Mobile grid overflows. These are
bugs, not features — they're fixed in Sprint 0 below.

---

## Part 1: New Feature Proposals

These 6 features fill gaps that all 65+ existing proposals miss. Each
addresses a dimension no prior document covers.

---

### V1: Rolling Frequency Windows

**What:** Habits with flexible targets like "3 times per week" or "every 3
days" or "4 times in any 10-day window." The user sets a target count and
a window size. The app tracks whether the target is met within the rolling
window, regardless of which specific days.

**Why every existing proposal misses this:**
The app currently supports only `daily` and `weekly`. Smart Rest Days (F5
from NEW_FEATURES) proposes fixed-day scheduling (Mon/Wed/Fri) — which is
different. Many real habits don't fit fixed schedules:

- "Gym 3x/week" — doesn't matter which days
- "Call Mom" — at least once every 3 days
- "Deep clean" — once per 10 days
- "Social event" — 2x/month

Rolling windows don't care about WHICH days, only that the count is met
within the window. This is a fundamentally different scheduling model from
fixed-day selection.

**Why it matters:**
The daily/weekly binary forces users to either (a) track something daily
when they don't do it daily, leading to misleading low completion rates, or
(b) track it weekly, losing granularity. Rolling windows match how people
actually think about many habits.

**Implementation:**
- Schema: Extend frequency to support `{ type: 'rolling', target: number, windowDays: number }`
- Backend: Accept the new frequency format in POST/PATCH
- Utils: `isOnTrackForWindow(logs, target, windowDays, today)` — check if
  target completions exist in the last N days
- Utils: Update streak calculation for rolling habits — streak = consecutive
  windows where target was met
- Frontend: Frequency selector in HabitForm adds "Custom" option with
  target/window inputs
- Frontend: Progress indicator shows "2 of 3 this week" instead of a daily checkbox

**Effort:** Medium | **Dependencies:** None

---

### V2: Habit Autopilot Mode

**What:** When a habit reaches high maturity (67+ days, 90%+ completion rate),
offer to put it in "autopilot" — it disappears from the daily check-in view
and only resurfaces if the user MISSES it. The habit is still tracked, still
earns streaks, and still appears in analytics. It just stops occupying daily
attention.

Autopilot habits appear in a collapsed "On Autopilot" section at the bottom.
Missing an autopilot habit immediately promotes it back to the active list
with an amber indicator: "Exercise fell off autopilot — it needs attention."

**Why every existing proposal misses this:**
Momentum Stages (N3) labels habits by maturity but doesn't change the UI.
Today View (N1) strips the UI to today but shows ALL habits. No proposal
addresses the fact that a habit at day 200 shouldn't need the same daily
attention as a habit at day 5.

This is the logical endpoint of the "garden" metaphor: a mature tree doesn't
need daily watering. It only needs attention when it starts to wilt.

**Why it matters:**
Power users accumulate 10+ habits over months. Scrolling past 8 established
habits to find the 2 new ones they're working on creates noise that
discourages check-in. Autopilot solves this by automatically managing
the active/background split based on data, not manual organization.

It also reinforces the psychological message: "This habit is so established
that you don't need to think about it anymore." That's the ultimate
validation of habit formation.

**Implementation:**
- Schema: Add `autopilot: boolean` to Habit (default false)
- Frontend: Auto-suggest autopilot when habit meets threshold (67+ days, 90%+)
- Frontend: Collapsed "On Autopilot" section in HabitTable (expandable)
- Frontend: Auto-promote back to active list on miss (with visual indicator)
- Backend: Accept the flag in PATCH
- Utils: `shouldSuggestAutopilot(habit, logs)` — maturity check

**Effort:** Low-Medium | **Dependencies:** Benefits from Momentum Stages (N3)
but works standalone

---

### V3: Consistency Score (Streak-Free Mode)

**What:** An opt-in alternative to streak counting. Instead of "23-day streak"
(which resets catastrophically to 0 on one miss), show a rolling consistency
percentage: "94% consistent (last 30 days)."

The consistency score uses a weighted rolling average:
- Last 7 days: weighted 3x (recent performance matters most)
- Last 8-14 days: weighted 2x
- Last 15-30 days: weighted 1x

A single miss drops the score by ~3-5 points, not to zero. Recovery is
proportional to the damage — one miss after 29 good days barely registers.

Users toggle between "Streak Mode" and "Consistency Mode" per habit.

**Why every existing proposal misses this:**
- Health Score (F2) is a composite metric combining streaks, completion rate,
  and recent trend. It sits alongside streaks, not replacing them.
- Streak Shields (F1), Savings Bank (C3), and Autopsy (NEW-4) all try to
  soften streak breaks. But they're patches on a fundamentally fragile model.

Consistency Score replaces the model itself. The insight: streaks are binary
(perfect or broken) while real behavior is continuous. A user who completes
a habit 27 out of 30 days is doing great — but the streak says "3 days"
because they missed Day 28. The consistency score says "90%" which is both
more accurate and more motivating.

**Why it matters:**
The "streak anxiety → streak break → abandonment" cycle is the #1 killer of
habit tracker engagement. Research (Renfree et al., 2016) shows that streak-
dependent users are MORE likely to quit entirely after a break than users
who track consistency rates. The all-or-nothing framing of streaks creates
perfectionism, and perfectionism creates fragility.

Offering both modes lets users choose: competitive streak-chasers keep their
streaks, while users prone to perfectionism-driven abandonment get a gentler
metric that rewards sustained effort without punishing imperfection.

**Implementation:**
- Schema: Add `trackingMode: 'streak' | 'consistency'` to Habit (default 'streak')
- Utils: `calculateConsistency(logs, today, windowDays)` — weighted rolling average
- Frontend: Toggle in HabitRow or edit modal to switch modes
- Frontend: Consistency pill replaces streak pill when in consistency mode
  (shows percentage with color gradient: green >80%, yellow 50-80%, red <50%)
- Frontend: Trend arrow (↑↗→↘↓) showing 7-day vs prior 7-day change
- Backend: Accept the field in PATCH
- No effect on any other feature — streak-based features still work for
  habits in streak mode

**Effort:** Medium | **Dependencies:** None

---

### V4: Accountability Share Link

**What:** Generate a unique, unguessable URL (e.g., `/share/abc123def456`)
that shows a read-only view of the user's habit dashboard. Share it with a
friend, partner, coach, or accountability buddy. The viewer sees:

- Habit names and today's completion status
- Streak/consistency scores
- A message from the user (optional: "Hold me accountable!")
- Last updated timestamp

The viewer cannot modify anything. The link can be revoked at any time.
No authentication required for either party.

**Why every existing proposal misses this:**
Social/Accountability (#16) requires full authentication infrastructure and
multi-user support — it's a Phase 6 feature. But social proof is one of the
most powerful behavior change tools, and users want it NOW, not after a
database migration.

The share link gives 80% of the social benefit with 0% of the infrastructure
cost. It's one of the most powerful ideas in this plan specifically because
it's simple.

**Why it matters:**
Research (Harkin et al., 2016, meta-analysis of 138 studies) found that
sharing progress with others increases goal attainment by 20-30%. The
effect is strongest when the other person can passively monitor (vs.
actively nagging). A read-only share link is exactly this: passive
monitoring that creates accountability through visibility alone.

The "someone might be watching" effect is disproportionately powerful
relative to how often the accountability partner actually checks.

**Implementation:**
- Backend: `POST /api/share` — generates a random 24-char token, stores in data.json
  as `shareLinks: [{ token, createdAt, message?, active: boolean }]`
- Backend: `GET /api/share/:token` — returns read-only habit data (public endpoint)
- Backend: `DELETE /api/share/:token` — revokes the link
- Frontend: "Share" button in settings/header → generates link → copy to clipboard
- Frontend: `<SharedDashboard />` — read-only view (separate route or page)
- Frontend: Optional custom message ("Hold me accountable for these habits!")

**Effort:** Medium | **Dependencies:** None

---

### V5: Habit Velocity Indicator

**What:** A simple directional arrow next to each habit showing whether
consistency is improving, stable, or declining:

| Arrow | Meaning | Calculation |
|-------|---------|-------------|
| ↑ | Strongly improving | Last 7 days > prior 7 days by 20%+ |
| ↗ | Slightly improving | Last 7 days > prior 7 days by 5-20% |
| → | Stable | Within 5% |
| ↘ | Slightly declining | Last 7 days < prior 7 days by 5-20% |
| ↓ | Strongly declining | Last 7 days < prior 7 days by 20%+ |

Color-coded: green for ↑/↗, gray for →, amber for ↘, red for ↓.

**Why every existing proposal misses this:**
Every metric in the 65+ proposals measures ABSOLUTE state: streak length,
completion rate, health score, consistency percentage. None measure the
RATE OF CHANGE. But rate of change is the most actionable signal:

- 90% consistency + ↓ declining = red flag (habit starting to slip)
- 50% consistency + ↑ improving = green flag (habit recovering)
- 100% streak + → stable = expected (no news)

A declining habit at 85% is MORE urgent than a stable habit at 60%, because
the 85% habit is heading for a break while the 60% habit has found its
equilibrium. No existing proposal captures this.

**Why it matters:**
Velocity is a leading indicator. Streaks, consistency rates, and health
scores are all lagging indicators — they tell you what already happened.
Velocity tells you what's ABOUT to happen. A habit showing ↘ for two
consecutive weeks is going to break soon, even if the absolute numbers
still look fine. Early intervention (an environmental cue refresh, a warmup
reset, a scaling-down) can prevent the break.

**Implementation:**
- Utils: `calculateVelocity(logs, today)` — compare last-7 vs prior-7
  completion rates, return direction and magnitude
- Frontend: Arrow icon component with 5 states and color coding
- Frontend: Display inline next to streak/consistency pill in HabitRow
- No schema changes — purely derived from existing log data
- No backend changes

**Effort:** Low | **Dependencies:** None

---

### V6: Focus Timer Integration

**What:** For habits with a time component (meditation, reading, exercise),
offer a built-in countdown timer. Click "Start" next to "Meditate 10 min"
and a minimal timer appears. When it completes, the habit auto-toggles to
done. Users can also mark done manually without using the timer.

The timer is minimal: a circular countdown ring that works in a browser tab
(with a tab title showing remaining time, e.g., "⏱ 4:32 — Habit Garden").
Optional browser notification when complete.

**Why every existing proposal misses this:**
Completion Timestamps (N2) passively records WHEN something was done. Time
Budgeting (N8) shows estimated total time per day. Neither actively engages
the user in the DOING of the habit. The Focus Timer is the only feature that
bridges "I should do this" and "I'm doing this right now."

No existing proposal addresses the gap between intention and action. Every
feature either operates before the moment (planning, predictions, warmups)
or after (tracking, analysis, celebration). The timer operates DURING the
habit itself, making the app useful while the habit is being performed.

**Why it matters:**
The Pomodoro technique is proven to increase follow-through for time-based
tasks. Having the timer inside the habit tracker means the user doesn't need
to context-switch to a separate timer app. The auto-completion removes one
more friction point: you don't even need to remember to check it off.

It also creates a new data stream: actual time spent vs. estimated time.
"You budgeted 10 min for meditation but consistently spend 14 min" is a
valuable insight that no other feature can surface.

**Implementation:**
- Schema: Add `estimatedMinutes: number | null` to Habit (optional)
- Frontend: `<FocusTimer />` component — circular SVG countdown with
  start/pause/reset controls
- Frontend: Timer appears inline in HabitRow when "Start" is clicked
- Frontend: Tab title updates with countdown ("⏱ 4:32 — Habit Garden")
- Frontend: Optional Notification API alert on completion
- Frontend: Auto-toggle habit to complete when timer reaches zero
- Frontend: Timer state stored in component state (ephemeral, not persisted)
- Backend: Accept `estimatedMinutes` in POST/PATCH (shared with Time
  Budgeting [N8] if that ships later)

**Effort:** Medium | **Dependencies:** None

---

## Part 2: Consolidated Backlog

Every feature below is cherry-picked from the 65+ proposals across all 8
prior documents, plus the 6 new proposals above. Features not listed here
are explicitly deferred — not lost, just not prioritized.

**Selection criteria:**
1. Does it fix something broken in the current experience?
2. Does it make the daily check-in faster or more motivating?
3. Can it ship in 1-3 focused coding sessions?
4. Does it create leverage for future features?

---

### Sprint 0: Fix the Foundation

**Goal:** Make the MVP not embarrassing. Zero schema changes, zero risk.

| ID | Feature | Source | Effort | What It Fixes |
|----|---------|--------|--------|---------------|
| G1 | Edit Habit (name, color, frequency) | BACKLOG | 2h | Can't rename = data loss |
| G2 | View & Restore Archived Habits | BACKLOG | 2h | Archived habits vanish forever |
| G3 | Empty State & Onboarding | BACKLOG | 2h | New users get zero guidance |
| U1 | Undo Toast for Toggles | FEATURES | 2h | Mis-taps can't be reversed |
| B1 | Auto-Backup on Write | BACKLOG | 2h | Single point of data failure |

**API additions:**
- `PATCH /api/habits/:id` — partial update (name, color, frequency)
- `POST /api/habits/:id/unarchive` — restore archived habit

**Total estimate:** 1-2 days
**Exit criteria:** Users can create, edit, archive, unarchive, delete.
Undo works. Backups happen automatically.

---

### Sprint 1: Better Daily Experience

**Goal:** Make the daily check-in faster and richer. Open the app, toggle
habits, feel good, close the app — under 30 seconds.

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| N1 | Today View / Focus Mode | BACKLOG | 4h | Core UX: strip to today's checklist only |
| V5 | Velocity Indicator (↑→↓) | **NEW** | 2h | Leading indicator, zero schema changes |
| C10 | Completion Combos (Spark/Flow/Perfect) | CREATIVE | 3h | Cross-habit daily motivation |
| P10 | Minimum Viable Day | PROPOSALS | 2h | Permission to be imperfect on bad days |
| P2 | Streak Decay Warnings | PROPOSALS | 2h | Amber/red indicators before streak breaks |

**Total estimate:** 2-3 days
**Exit criteria:** Users have a fast Today View, see velocity trends, get
combo motivation, know their MVD, and get warned before streaks break.

---

### Sprint 2: Richer Habit Model

**Goal:** First schema changes. Make habits smarter without adding UI
complexity.

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| V1 | Rolling Frequency Windows | **NEW** | 6h | "3x/week" habits finally work |
| NEW-1 | Anti-Habit Tracking (habits to break) | IMPL_PLAN | 4h | Opens entire "quitting" use case |
| C1 | Warmup Ramp (graduated start) | CREATIVE | 4h | Fixes first-week failure rate |
| C4 | Environmental Cue Tracker | CREATIVE | 2h | Bridges digital and physical |
| V3 | Consistency Score (opt-in) | **NEW** | 4h | Alternative to fragile streaks |

**Total estimate:** 3-4 days
**Exit criteria:** Habits support rolling windows, anti-habits, warmup
periods, physical cues, and an alternative to streaks.

---

### Sprint 3: Motivation & Insight

**Goal:** Give users reasons to come back. Transform raw checkmarks into
a meaningful story.

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| D1 | Dashboard Statistics | FEATURES | 4h | "Am I on track?" at a glance |
| N3 | Momentum Stages (Seedling→Evergreen) | BACKLOG | 4h | Garden metaphor comes alive |
| NEW-6 | Personal Record Board | IMPL_PLAN | 3h | Records never reset, streaks do |
| NEW-2 | Difficulty Pulse (post-completion) | IMPL_PLAN | 3h | "Is this getting easier?" |
| V5b | Weekend/Weekday Split in Dashboard | **NEW** | 2h | "Your Exercise is 95% weekdays, 40% weekends" |

**Total estimate:** 3-4 days
**Exit criteria:** Users see dashboard stats, growth stages, personal
records, difficulty trends, and weekday/weekend splits.

---

### Sprint 4: Resilience & Recovery

**Goal:** Help users survive bad weeks instead of quitting.

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| NEW-4 | Streak Autopsy | IMPL_PLAN | 5h | Streak breaks become learning moments |
| NEW-7 | Contextual Micro-Rewards | IMPL_PLAN | 5h | Data-driven encouragement at right moments |
| F4 | Failure Recovery Dashboard | NEW_FEATURES | 4h | Post-break support, not just "Streak: 0" |
| P3 | Identity Statements | PROPOSALS | 2h | "I am a runner" > "Run 3x/week" |

**Total estimate:** 3-4 days
**Exit criteria:** Breaking a streak triggers an autopsy, micro-rewards
celebrate recovery, and identity statements reinforce motivation.

---

### Sprint 5: Power Features

**Goal:** Reward engaged users who've been tracking for 1+ months.

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| V2 | Habit Autopilot Mode | **NEW** | 4h | Established habits stop cluttering the view |
| V6 | Focus Timer Integration | **NEW** | 5h | Bridge intention and action for timed habits |
| V4 | Accountability Share Link | **NEW** | 5h | Zero-auth social proof |
| NEW-3 | Quick Command Bar | IMPL_PLAN | 5h | Keyboard-driven check-in for power users |
| D4 | Data Export (JSON/CSV) | FEATURES | 3h | Users own their data |

**Total estimate:** 4-5 days
**Exit criteria:** Mature habits auto-hide, timed habits have timers,
users can share progress and export data, and power users have a command bar.

---

### Sprint 6: Visualization & Analysis

**Goal:** Rich data visualizations for users with 2+ months of history.

| ID | Feature | Source | Effort | Why Now |
|----|---------|--------|--------|---------|
| H1 | Completion Heatmap | FEATURES | 5h | GitHub-style calendar view |
| N4 | Streak DNA Visualization | BACKLOG | 5h | Inline history barcode per habit |
| C7 | Monthly Memory Lane (narrative recap) | CREATIVE | 5h | Shareable monthly summary card |
| N5 | Habit Pair Correlation Map | BACKLOG | 5h | "Which habits support each other?" |

**Total estimate:** 4-5 days
**Exit criteria:** Users can see heatmaps, DNA strips, monthly narratives,
and inter-habit correlations.

---

### Deferred Backlog (Build After Sprints 0-6)

These are important but either require significant infrastructure or are
only justified once the core experience is validated.

| Feature | Source | Why Deferred |
|---------|--------|-------------|
| User Auth & Multi-User | FEATURES | Large scope. Build solo experience first. |
| SQLite/PostgreSQL Migration | FEATURES | JSON works for single user. Migrate with auth. |
| PWA / Offline Support | FEATURES | Needs polished mobile UX first. |
| Ritual Builder (habit grouping) | IMPL_PLAN | Medium-high effort. Sprints 0-3 first. |
| A/B Habit Testing | CREATIVE | Cool differentiator but niche use case. |
| Life Phase Modes | CREATIVE | Complex UX. Users need basics first. |
| Smart Day Planner | CREATIVE | Synthesis feature. Needs data from earlier sprints. |
| Confidence Calibration | CREATIVE | Forward-looking but medium effort. After Sprint 4. |
| Habit Chains / Stacking | PROPOSALS+NEW_FEATURES | Moderate effort, dependency on edit. |
| Weekly Review Wizard | NEW_FEATURES | Needs accumulated data. Sprint 7+. |
| Insights Engine | NEW_FEATURES | Capstone feature. Needs all analytics infra. |
| Reminders / Notifications | FEATURES | Requires Notification API permission UX. |
| Categories / Tags | FEATURES | Organizational tool for 10+ habits. |
| Drag & Drop Reorder | FEATURES | Nice UX, requires DnD library. |
| Natural Language Input | BACKLOG | Depends on flexible frequency model. |
| Streak Savings Bank | CREATIVE | Nice complement to rolling windows. |
| Habit Notes / Journal | FEATURES | Nice-to-have, doesn't block anything. |
| Responsive Mobile Overhaul | BACKLOG | Important but large CSS refactor. |
| Theme Toggle (Dark/Light) | FEATURES | Cosmetic. CSS variables already set up. |
| Adaptive Scaling Prompts | BACKLOG | After Momentum Stages ship. |
| Streak Shields / Vacation Mode | NEW_FEATURES | After consistency score ships. |
| Time Budgeting | BACKLOG | After estimatedMinutes field ships with Focus Timer. |
| Effort-Reward Quadrant | CREATIVE | After difficulty ratings exist. |

---

## Part 3: Why These 6 New Features (And Not More)

| Feature | Gap It Fills | Why 65+ Proposals Missed It |
|---------|-------------|---------------------------|
| **V1: Rolling Windows** | Flexible scheduling | All proposals assume daily/weekly. Smart Rest Days (F5) does fixed-day selection, not rolling targets. |
| **V2: Autopilot Mode** | Noise reduction for power users | Momentum Stages labels maturity but doesn't change the UI. No proposal removes established habits from view. |
| **V3: Consistency Score** | Streak fragility | Health Score (F2) sits alongside streaks. Shields/Savings/Autopsy patch streaks. Nothing replaces the model itself. |
| **V4: Share Link** | Social proof without auth | Social (#16) requires full multi-user infra. No proposal offers zero-auth sharing. |
| **V5: Velocity Indicator** | Rate of change | Every metric is absolute (streak, %, score). Nothing measures whether habits are TRENDING up or down. |
| **V6: Focus Timer** | During-habit engagement | Every feature operates before (planning) or after (tracking). Nothing operates DURING the habit. |

---

## Part 4: Architecture Notes

### When to migrate from JSON to SQLite
**Trigger:** When auth ships, or data.json exceeds 1MB, or queries take >100ms.
Until then, JSON + mutex is fine for a single-user app.

### Frontend state management
**Current (useHabits hook):** Sufficient through Sprint 3. Extract to
`useReducer` + React Context when Today View ships (Sprint 1) since multiple
views need shared state.

### Component library
**Stay vanilla CSS through Sprint 4.** Add Radix UI primitives in Sprint 5
for command bar, modals, and timer components.

### Design principle
**No AI/ML in any feature.** Everything uses deterministic statistics. Keeps
the app fast, explainable, and free of API dependencies.

---

## Part 5: What This Plan Cuts (And Why)

| Cut | Reason |
|-----|--------|
| More planning documents | 8 is enough. Build now. |
| XP / Levels / Badges | Extrinsic gamification undermines intrinsic motivation. Micro-rewards (Sprint 4) are better. |
| Voice / Smart Home integration | Niche, high effort, low user base. |
| Email reports | Zero email infrastructure. In-app reports are sufficient. |
| iCal export | Low value relative to effort. JSON/CSV export covers data portability. |
| Social features requiring auth | Build the solo experience first. Share Link (V4) gives 80% of the social benefit. |
| Habit Fusion (combining habits) | Confusing UX. Rituals (deferred) solve grouping better. |
| Import from other trackers | Nice-to-have but blocks no one from starting. |

---

## Part 6: Recommended Next Step

**Build Sprint 0.** It's 5 features, ~10 hours of work, zero schema changes,
and it transforms the MVP from "demo" to "usable." Every subsequent sprint
depends on the foundation being solid.

The order within Sprint 0:
1. `G1: Edit Habit` — unblocks habit evolution
2. `G2: View & Restore Archived` — unblocks archive confidence
3. `U1: Undo Toast` — unblocks toggle confidence
4. `B1: Auto-Backup` — protects data before we make it more valuable
5. `G3: Onboarding` — first impression for new users

After Sprint 0, start Sprint 1. The plan is sequential — each sprint builds
on the previous one's capabilities.

**Stop planning. Start building.**
