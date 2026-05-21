# Habit Garden — Definitive Plan

> **This document replaces all prior planning documents.** It consolidates
> 80+ feature proposals from 9 separate files, adds 6 genuinely new features,
> and defines a single executable roadmap.
>
> Prior documents (FEATURES.md, NEW_FEATURES.md, BACKLOG.md, FEATURE_PLAN.md,
> FEATURE_PLAN_v3.md, FEATURE_PROPOSALS.md, ROADMAP.md, CREATIVE_FEATURES.md,
> IMPLEMENTATION_PLAN.md) remain as historical reference only.
>
> **The hard truth:** This project has ~680 lines of shipped code and ~9,000
> lines of planning. The ratio is 13:1 planning-to-code. Every new planning
> document has correctly diagnosed "stop planning, start building" and then
> added more planning. This document breaks that cycle by being the LAST
> planning document, with the smallest viable scope per phase.
>
> Created: 2026-05-21

---

## Part 1: New Feature Proposals

These 6 features fill gaps that every prior document — including the 80+
existing proposals — misses entirely.

---

### NEW-A: Flexible Day Scheduling (Replace Daily/Weekly Binary)

**What:** Replace the rigid `frequency: 'daily' | 'weekly'` with a flexible
scheduling model:

| Schedule Type | Example | How Streak Works |
|---------------|---------|------------------|
| Every day | Default | Must complete every day |
| Specific days | Mon/Wed/Fri | Only counts on selected days |
| X times per week | 4x per week | Any 4 of 7 days counts |
| Weekdays only | Mon-Fri | Weekends are automatic rest |

**Why 80+ features missed this:**

Smart Rest Days (F5) was proposed in NEW_FEATURES.md but framed as a "Tier 2"
feature deferred to Sprint 2-3 across every roadmap. But this isn't a feature
— it's a **bug fix in the data model**. The daily/weekly binary is the single
most common complaint about habit trackers. A user who exercises Mon/Wed/Fri
sees their streak break every Tuesday. The app actively punishes correct
behavior.

Every existing roadmap places this after "quick wins" like theme toggles and
undo toasts. That's backwards. A user whose streaks break incorrectly 3 times
per week will churn before they ever notice the theme toggle.

**Why it matters beyond scheduling:**

This change is foundational infrastructure. It unlocks:
- Correct streak calculation (the current one is wrong for non-daily habits)
- Meaningful health scores (can't score "consistency" if the model is wrong)
- Accurate heatmaps (rest days shouldn't show as "missed")
- Useful insights (day-of-week analysis requires knowing which days are expected)

**Schema change:**
```typescript
// Before:
frequency: 'daily' | 'weekly'

// After:
schedule: {
  type: 'daily' | 'specific_days' | 'times_per_week' | 'weekdays'
  days?: number[]       // 0=Sun..6=Sat, for 'specific_days'
  timesPerWeek?: number // for 'times_per_week'
}
```

Backward compatible: existing `'daily'` maps to `{ type: 'daily' }`,
existing `'weekly'` maps to `{ type: 'times_per_week', timesPerWeek: 1 }`.

**Effort:** Medium | **Impact:** Critical
**Dependencies:** Requires streak calculation refactor

---

### NEW-B: Habit Evolution (Progressive Overload Without Losing History)

**What:** When a habit naturally evolves — "Walk 10 min" becomes "Jog 20 min"
becomes "Run 5K" — users can "evolve" the habit instead of archiving and
recreating. Evolution preserves the full history with a visible timeline:

```
Exercise Timeline:
  Walk 10 min ──(21 days)──> Jog 20 min ──(45 days)──> Run 5K ──(current)
  Jan 15              Feb 5              Mar 22
```

The streak continues across evolutions. The history shows what the habit
was called on each past date. The evolution event is logged and celebrated.

**Why nothing in 80+ features covers this:**

- Adaptive Scaling Prompts (N6) suggests the *app* recommend scaling up.
  Evolution lets the *user* decide when and how, with the critical addition
  of preserved history.
- Warmup Ramp (C1) handles the first 7 days. Evolution handles month 2+.
- Edit Habit (G1) lets you rename, but loses the historical context.
  "Run 5K" with logs from January makes no sense unless you know it was
  "Walk 10 min" back then.

The key insight: **habits that survive are habits that grow.** Every other
tracker treats habit modification as destruction (archive) + creation (new
habit). Evolution models the reality that habits are living, changing things.

**Schema change:**
```typescript
// Add to Habit:
evolutions?: Array<{
  name: string           // what it was called
  changedAt: string      // ISO timestamp of the evolution
}>
```

When evolving, the current name is pushed to `evolutions[]` before the name
is updated. History display uses the evolution timeline to show the correct
name for each date range.

**Effort:** Low-Medium | **Impact:** High
**Dependencies:** Edit Habit (G1)

---

### NEW-C: Weekly Rhythm Heatmap (Day-of-Week Pattern View)

**What:** A compact 7-column grid showing aggregated completion rates by
day of week, across all time:

```
         Mon   Tue   Wed   Thu   Fri   Sat   Sun
Exercise  92%   88%   45%   91%   85%   30%   20%
Meditate  95%   90%   93%   88%   80%   60%   55%
Reading   70%   75%   80%   72%   65%   90%   95%
──────────────────────────────────────────────────
Average   86%   84%   73%   84%   77%   60%   57%
```

Cells are color-coded: dark green (>80%) to red (<40%). Instantly reveals
"I never exercise on Wednesdays" or "Weekends are my weak point."

**Why this is different from everything proposed:**

- The chronological heatmap (#5) shows *when* over time (Jan-May).
  The rhythm heatmap shows *which day of week*, collapsed across all time.
- Streak DNA (N4) shows per-habit chronological patterns.
  The rhythm view is cross-habit, day-of-week aggregated.
- Insights Engine (F8) could generate text about day-of-week patterns.
  The rhythm view *shows* it visually in 2 seconds.

This is the single most actionable visualization possible: it directly
answers "which days do I need to fix?" and "which habits struggle on
which days?" in one glance.

**Why it matters:**

Human behavior is deeply rhythmic. Most habit failures have weekly patterns
(weekend drops, Wednesday slumps, Friday fatigue). But no existing proposal
visualizes this directly. The chronological heatmap buries weekly patterns
in 6 months of data. The rhythm view extracts and amplifies them.

**Implementation:**
- Utils: `calculateWeeklyRhythm(habits, logs)` — aggregate completion
  rates per habit per day-of-week
- Frontend: `<WeeklyRhythm />` component — 7-column grid with color coding
- No backend changes — derived from existing log data
- Could be a tab alongside the 14-day grid, or part of a future dashboard

**Effort:** Low | **Impact:** Medium-High
**Dependencies:** None (better with 30+ days of data)

---

### NEW-D: Streak Grace Period (Compassionate Streak Preservation)

**What:** For habits with streaks of 14+ days, if the user misses a single
day, the streak doesn't instantly break. Instead, it enters a 24-hour
"grace period." If the user completes the habit the next day, the streak
is preserved with a visible "saved" marker on the missed date.

Rules:
- Only activates for streaks >= 14 days (earned, not free)
- Only ONE grace period per streak (can't chain grace days)
- The missed day shows as a distinct "grace" marker (amber dot, not green)
- The grace is consumed — the next miss within the same streak breaks it

**Why this is different from every streak protection proposal:**

| Feature | Mechanic | Source |
|---------|----------|--------|
| Streak Shields (F1) | Earned tokens, manually activated | NEW_FEATURES |
| Streak Savings Bank (C3) | Over-performance credits | CREATIVE_FEATURES |
| Vacation Mode (F1) | Pre-planned date ranges | NEW_FEATURES |
| **Grace Period** | Automatic, conditional, one-time | **NEW** |

Every existing streak protection requires *user action* — earn shields,
bank savings, or activate vacation mode. The grace period is *automatic*
and *conditional*: it only exists for long streaks, only once, and only
if you bounce back the next day.

**Why it matters:**

The #1 moment of habit tracker abandonment is waking up to "Streak: 0"
after a single missed day on a long streak. The miss might have been
unavoidable (sick, emergency, forgot). The emotional response is
disproportionate: 47 days of effort feel erased by 1 day of failure.

A grace period doesn't excuse the miss — the amber marker is visible
forever. But it preserves the streak long enough for the user to recover,
which is all that matters. Research on "abstinence violation effect"
(Marlatt & Gordon) shows that how a person interprets a single lapse
determines whether it becomes a full relapse.

**Implementation:**
- Utils: Modify `calculateStreak()` — if the immediately previous day is
  missing AND the day before that was completed AND current streak >= 14,
  count as grace day (don't break streak). Max 1 grace per streak.
- Frontend: Grace day indicator (amber dot with tooltip "Grace day — streak
  preserved")
- Frontend: "Grace used" flag in streak display
- No schema changes — derived from existing log data
- No backend changes

**Effort:** Low | **Impact:** High
**Dependencies:** None

---

### NEW-E: Habit Snapshot Comparison (Then vs Now)

**What:** A one-screen comparison showing your habit state at two points in
time. Pick any two dates (default: 30 days ago vs today) and see:

```
                    April 21          May 21          Change
────────────────────────────────────────────────────────────
Active habits       4                 7               +3
Avg completion      52%               78%             +26%
Longest streak      11 days           34 days         +23 days
Total check-ins     146               412             +266
Best day ever       4/4 (Apr 8)       7/7 (May 15)    improved
Habits added        —                 +5 (May only)
Habits archived     —                 +2 (May only)
────────────────────────────────────────────────────────────
```

Plus per-habit rows showing streak and completion rate at each date.

**Why nothing existing covers this:**

- Monthly Memory Lane (C7) generates a narrative for one month. Snapshot
  comparison is a *side-by-side quantitative diff* between two dates.
- Reports (#9) show current stats over a time range. Snapshots show
  the *state at a specific past date* vs today.
- Time Capsule (P7) proposes auto-captured monthly snapshots stored on
  disk. This feature computes the comparison on-the-fly from existing
  log data — no snapshots need to be captured or stored.

**Why it matters:**

Daily habit tracking creates a "treadmill" feeling: you're always looking
at today's checkboxes, never at the bigger picture. Users who've been
tracking for 3 months genuinely don't realize how much they've improved
because the change was gradual.

The snapshot comparison is the "before/after photo" for habits. It creates
the "look how far I've come" moment that is the single strongest driver
of long-term retention. And it computes it from existing data with zero
storage overhead.

**Implementation:**
- Utils: `computeSnapshotAt(habits, logs, date)` — reconstruct habit state
  at a past date (which habits existed, their streak at that date, completion
  rate up to that date)
- Utils: `compareSnapshots(snapshot1, snapshot2)` — diff computation
- Frontend: `<SnapshotComparison />` component with date pickers and
  comparison table
- No backend changes — all computed from existing data

**Effort:** Medium | **Impact:** High
**Dependencies:** None (better with 30+ days of data)

---

### NEW-F: Momentum Battery (Real-Time Daily Progress)

**What:** A visual battery/progress bar at the top of the screen showing
today's completion state in real-time:

```
Today: ████████░░░░ 5/8 habits (62%)  ⚡ 3 remaining
```

The battery fills as habits are completed. Color shifts from red (0%) to
amber (50%) to green (80%+). At 100%, a brief celebration animation plays.

Additionally, the battery has a time-aware urgency component:
- Morning: battery is full-width, relaxed state
- After 6 PM: remaining habits pulse gently (amber)
- After 9 PM: remaining habits pulse urgently (red)
- Midnight: the day is over, battery resets

**Why this isn't covered by existing proposals:**

- Dashboard Stats (#1) shows aggregated stats over time. The battery is
  about TODAY, RIGHT NOW.
- Health Score (F2) is a 30-day rolling metric. The battery is a 1-day
  real-time metric.
- Streak Decay Warnings (P2) warn about *individual* habits at risk.
  The battery shows *overall daily progress* as a single visual.
- Completion Combos (C10) reward hitting thresholds. The battery *shows*
  progress toward the threshold in real-time.

**Why it matters:**

The current UI has no sense of "how am I doing today?" You have to scan
every habit row, mentally count checks, and assess whether you're on track.
The battery does this instantly.

The time-aware urgency is different from notifications: it's passive and
embedded in the UI. You see it when you open the app, without opting in
to anything. It creates healthy urgency without nagging.

The battery also creates a "game loop" for the daily check-in: open app →
see battery at 40% → complete a few habits → see battery jump to 75% →
feel motivated to finish → hit 100% → celebration. This loop doesn't
exist in the current UI where each toggle is an isolated event.

**Implementation:**
- Frontend: `<MomentumBattery />` component (CSS progress bar + time logic)
- Frontend: Time-of-day urgency via `new Date().getHours()`
- Frontend: 100% completion celebration (CSS animation or canvas-confetti)
- Utils: Simple count: `completedToday / totalActive * 100`
- No backend changes

**Effort:** Low | **Impact:** High
**Dependencies:** None

---

## Part 2: Consolidated Feature Registry

Every feature from every document, deduplicated, with a single canonical
ID and status. Features that were proposed multiple times are listed once.

### Foundation (Must ship before anything else)

| ID | Feature | Description | Effort | Source |
|----|---------|-------------|--------|--------|
| F-01 | Edit Habit | PATCH endpoint + edit UI for name, color, schedule | Small | BACKLOG G1 |
| F-02 | View/Restore Archived | Archived section + unarchive endpoint | Small | BACKLOG G2 |
| F-03 | Undo Toast | 5-second undo for toggles (re-toggle on undo) | Small | FEATURES #3 |
| F-04 | Empty State / Onboarding | Guidance card for zero-habit state | Small | BACKLOG G3 |
| F-05 | **Flexible Scheduling** | Replace daily/weekly with day-of-week selection | Medium | **NEW-A** |
| F-06 | Mobile Responsive Fix | 7-day mobile grid, 44px tap targets | Medium | BACKLOG G4 |

### Daily Experience (Make the daily check-in fast and satisfying)

| ID | Feature | Description | Effort | Source |
|----|---------|-------------|--------|--------|
| F-07 | Today View / Focus Mode | Stripped-down today-only checklist | Low | BACKLOG N1 |
| F-08 | **Momentum Battery** | Real-time daily progress bar with time urgency | Low | **NEW-F** |
| F-09 | Anti-Habit Tracking | Track behaviors to stop (inverted logic) | Medium | IMPL NEW-1, PROPOSALS P8 |
| F-10 | **Streak Grace Period** | Auto 24hr save for 14+ day streaks | Low | **NEW-D** |
| F-11 | Streak Decay Warnings | Amber/red visual alerts before streak breaks | Low | PROPOSALS P2 |
| F-12 | Completion Timestamps | Store full ISO timestamp alongside date | Medium | BACKLOG N2 |

### Motivation & Insight (Give users reasons to return)

| ID | Feature | Description | Effort | Source |
|----|---------|-------------|--------|--------|
| F-13 | Dashboard Statistics | Today's %, active count, longest streak, weekly % | Low | FEATURES #1 |
| F-14 | Health Score | 30-day rolling consistency index (0-100) | Low | NEW_FEATURES F2 |
| F-15 | Momentum Stages | Seedling/Growing/Rooted/Evergreen lifecycle | Low-Med | BACKLOG N3 |
| F-16 | Personal Records Board | Lifetime bests: longest streak, best day, etc. | Low-Med | IMPL NEW-6, BACKLOG N10 |
| F-17 | Failure Recovery Dashboard | Post-break recovery panel with bounce-back rate | Low | NEW_FEATURES F4 |
| F-18 | **Weekly Rhythm Heatmap** | Day-of-week aggregated completion grid | Low | **NEW-C** |
| F-19 | Difficulty Pulse | Post-completion "how hard?" micro-survey + trend | Low | IMPL NEW-2 |
| F-20 | **Snapshot Comparison** | Side-by-side then-vs-now habit state diff | Medium | **NEW-E** |

### Depth & Organization (For users with 30+ days of data)

| ID | Feature | Description | Effort | Source |
|----|---------|-------------|--------|--------|
| F-21 | Categories / Tags | User-defined tags with filter UI | Medium | FEATURES #2 |
| F-22 | Habit Reordering | Drag-and-drop with persisted sort order | Medium | FEATURES #8 |
| F-23 | **Habit Evolution** | Progressive overload with preserved history | Low-Med | **NEW-B** |
| F-24 | Environmental Cue Tracker | Physical-world trigger text per habit | Low | CREATIVE C4 |
| F-25 | Warmup Ramp | 7-day graduated start for new habits | Low | CREATIVE C1 |
| F-26 | Completion Combos | Cross-habit daily threshold rewards | Low | CREATIVE C10 |
| F-27 | Data Export (JSON/CSV) | Download all data | Low | FEATURES #4 |
| F-28 | Auto-Backup | Timestamped file backups on each write | Low | BACKLOG N7 |

### Advanced Behavioral (For power users and long-term engagement)

| ID | Feature | Description | Effort | Source |
|----|---------|-------------|--------|--------|
| F-29 | Streak Autopsy | Auto-analysis when a 7+ day streak breaks | Medium | IMPL NEW-4 |
| F-30 | Contextual Micro-Rewards | Data-driven encouragement messages | Medium | IMPL NEW-7 |
| F-31 | Quick Command Bar | `/` keyboard command palette | Medium | IMPL NEW-3 |
| F-32 | Ritual Builder | Named ordered routine groups | Med-High | IMPL NEW-5 |
| F-33 | Confidence Calibration | Daily prediction vs outcome tracking | Medium | CREATIVE C5 |
| F-34 | Monthly Memory Lane | Narrative monthly recap card | Medium | CREATIVE C7 |
| F-35 | Habit A/B Testing | Compare two habit variants head-to-head | Medium | CREATIVE C2 |
| F-36 | Habit Stacking / Chains | Routines and sequential dependencies | Medium | NEW_FEATURES F3, PROPOSALS P5 |

### Visualization (Requires data density to be meaningful)

| ID | Feature | Description | Effort | Source |
|----|---------|-------------|--------|--------|
| F-37 | Chronological Heatmap | GitHub-style 3-6 month calendar | Medium | FEATURES #5 |
| F-38 | Streak DNA | Inline barcode history per habit | Medium | BACKLOG N4 |
| F-39 | Correlation Map | Auto-detected habit pair relationships | Medium | BACKLOG N5 |
| F-40 | Effort-Reward Quadrant | 2D scatter plot: effort vs perceived value | Low-Med | CREATIVE C9 |

### Infrastructure (Only when the solo experience is validated)

| ID | Feature | Description | Effort | Source |
|----|---------|-------------|--------|--------|
| F-41 | Theme Toggle (Dark/Light) | CSS variable swap + localStorage | Small | FEATURES #14 |
| F-42 | SQLite Migration | Replace JSON file with proper DB | Large | FEATURES #11 |
| F-43 | Authentication | User accounts + data isolation | Large | FEATURES #10 |
| F-44 | PWA / Offline | Service worker + IndexedDB sync | Large | FEATURES #15 |

### Deferred (Not in any planned sprint)

| ID | Feature | Source | Why Deferred |
|----|---------|--------|-------------|
| D-01 | Social / Accountability | FEATURES #16 | Requires auth. Build solo experience first. |
| D-02 | Reminders / Notifications | FEATURES #7 | Notification API permission UX is complex. Decay warnings (F-11) cover the core need. |
| D-03 | Habit Notes / Journal | FEATURES #6 | Nice-to-have. Doesn't block anything. |
| D-04 | Weekly Review Wizard | NEW_FEATURES F10 | High effort. Monthly Memory Lane (F-34) provides lighter version. |
| D-05 | Mood & Energy Correlation | NEW_FEATURES F6 | Requires new daily check-in flow. High effort for uncertain payoff. |
| D-06 | Micro-Habits / Partial Completion | NEW_FEATURES F9 | Breaking schema change. Log format rewrite. |
| D-07 | iCal Export | NEW_FEATURES F12 | Niche. Requires stable URLs + auth. |
| D-08 | Import from Other Trackers | NEW_FEATURES F15 | Small audience. Data export (F-27) is sufficient for v1. |
| D-09 | Natural Language Input | BACKLOG N9 | Depends on flexible scheduling. Parser complexity. |
| D-10 | Life Phase Modes | CREATIVE C6 | Complex UX. Archiving individual habits covers 80% of this need. |
| D-11 | Smart Day Planner | CREATIVE C8 | Synthesis feature that needs many other features first. |
| D-12 | Gamification (XP/Levels/Badges) | Various | Risks extrinsic motivation undermining intrinsic. Micro-rewards (F-30) are better. |
| D-13 | Voice Memos | Not proposed | Requires media storage. Out of scope for JSON-based app. |
| D-14 | Email Reports | Not proposed | Zero email infrastructure. In-app reports suffice. |
| D-15 | Habit Goals / Milestones | FEATURES #13 | Covered by Personal Records (F-16) and Momentum Stages (F-15). |
| D-16 | Habit Templates / Presets | FEATURES #12 | Part of onboarding (F-04). Can expand later. |

---

## Part 3: Implementation Roadmap

### Principles

1. **Each phase is shippable.** No phase depends on a future phase.
2. **Schema changes are batched.** Phase 1 has the big schema change
   (flexible scheduling). Phase 2+ are additive fields only.
3. **Frontend-first where possible.** Most motivation features need no
   backend changes.
4. **No phase has more than 8 features.** Scope discipline.

---

### Phase 1: Fix the Foundation (Week 1-2)

**Goal:** Make the MVP not embarrassing. Fix the data model.

| ID | Feature | Effort | Backend? | Why |
|----|---------|--------|----------|-----|
| F-01 | Edit Habit | Small | PATCH endpoint | Can't rename = data loss |
| F-02 | View/Restore Archived | Small | Unarchive endpoint | Archived habits vanish forever |
| F-03 | Undo Toast | Small | No | Accidental toggles are frustrating |
| F-04 | Empty State / Onboarding | Small | No | New users get zero guidance |
| F-05 | **Flexible Scheduling** | Medium | Validate new format | The daily/weekly binary is fundamentally broken |
| F-06 | Mobile Responsive | Medium | No | Most habit check-ins happen on phones |

**New API endpoints:**
- `PATCH /api/habits/:id` — partial update (name, color, schedule)
- `POST /api/habits/:id/unarchive` — restore archived habit

**Schema change:** `frequency` field replaced with `schedule` object.
Migration: map `'daily'` → `{ type: 'daily' }`, `'weekly'` → `{ type: 'times_per_week', timesPerWeek: 1 }`.

**Exit criteria:** Users can create, edit, archive, unarchive, and delete
habits. Habits can have flexible schedules. Mobile is usable. Streaks
calculate correctly for all schedule types.

**Estimated effort:** 3-5 days

---

### Phase 2: Daily Experience (Week 3-4)

**Goal:** Make the daily check-in take <15 seconds and feel rewarding.

| ID | Feature | Effort | Backend? | Why |
|----|---------|--------|----------|-----|
| F-07 | Today View / Focus Mode | Low | No | Daily check-in needs a fast path |
| F-08 | **Momentum Battery** | Low | No | Real-time progress creates a completion loop |
| F-09 | Anti-Habit Tracking | Medium | Accept `type` field | Opens a whole new use case |
| F-10 | **Streak Grace Period** | Low | No | Prevents the #1 abandonment moment |
| F-11 | Streak Decay Warnings | Low | No | Prevention > reaction |
| F-26 | Completion Combos | Low | No | Cross-habit daily motivation |

**Schema change:** Add `type: 'build' | 'break'` to Habit (default: 'build').

**Exit criteria:** Users open app → see Today View → complete habits with
real-time battery feedback → combos reward breadth → grace period and decay
warnings prevent unnecessary streak breaks.

**Estimated effort:** 3-4 days

---

### Phase 3: Insight & Motivation (Week 5-6)

**Goal:** Transform raw checkmarks into a meaningful story.

| ID | Feature | Effort | Backend? | Why |
|----|---------|--------|----------|-----|
| F-13 | Dashboard Statistics | Low | No | "Am I on track?" at a glance |
| F-14 | Health Score | Low | No | Consistency > perfection |
| F-15 | Momentum Stages | Low-Med | No | Garden metaphor: habits grow |
| F-16 | Personal Records Board | Low-Med | No | Records never reset — permanent motivation |
| F-17 | Failure Recovery Dashboard | Low | No | Reframes streak breaks as recovery opportunities |
| F-18 | **Weekly Rhythm Heatmap** | Low | No | Reveals day-of-week patterns instantly |

**Schema change:** None. All derived from existing data.

**Exit criteria:** Users see health scores, momentum stages, personal records,
recovery metrics, and day-of-week patterns — all computed from existing logs.

**Estimated effort:** 3-5 days

---

### Phase 4: Depth (Week 7-9)

**Goal:** Add richness for engaged users with 30+ days of data.

| ID | Feature | Effort | Backend? | Why |
|----|---------|--------|----------|-----|
| F-12 | Completion Timestamps | Medium | Log format update | Every day without timestamps = lost data |
| F-19 | Difficulty Pulse | Low | Store difficulty data | Leading indicator of habit durability |
| F-23 | **Habit Evolution** | Low-Med | Uses PATCH endpoint | Preserve history across habit growth |
| F-24 | Environmental Cue Tracker | Low | Accept `cue` field | Bridge digital tracking to physical world |
| F-25 | Warmup Ramp | Low | Accept `warmup` field | Reduce first-week failure rate |
| F-27 | Data Export (JSON/CSV) | Low | New GET endpoint | Users own their data |
| F-28 | Auto-Backup | Low | Backup on write | Protect data before it gets more valuable |

**Schema additions:** `cue: string | null`, `warmup: object | null`,
`evolutions: array`, `difficulty` collection.

**New API endpoint:** `GET /api/export?format=json|csv`

**Exit criteria:** Timestamps captured, habits can evolve, physical cues
tracked, data exportable and backed up automatically.

**Estimated effort:** 4-6 days

---

### Phase 5: Power Features (Week 10-12)

**Goal:** Differentiate from every other habit tracker.

| ID | Feature | Effort | Backend? | Why |
|----|---------|--------|----------|-----|
| F-20 | **Snapshot Comparison** | Medium | No | "Before/after photo" for habits |
| F-29 | Streak Autopsy | Medium | No | Turns breaks into learning moments |
| F-30 | Contextual Micro-Rewards | Medium | No | Data-driven encouragement |
| F-31 | Quick Command Bar | Medium | No | Power-user speed |
| F-21 | Categories / Tags | Medium | New field + filter | Organization for 10+ habits |
| F-22 | Habit Reordering | Medium | Sort order endpoint | Manual priority control |

**Schema additions:** `tags: string[]`, `sortOrder: number`

**Exit criteria:** App has snapshot comparisons, streak autopsies, smart
micro-rewards, keyboard-driven command bar, tags, and drag-and-drop reordering.

**Estimated effort:** 5-7 days

---

### Phase 6: Visualization & Analysis (Week 13-15)

**Goal:** Make months of data visually compelling.

| ID | Feature | Effort | Backend? | Why |
|----|---------|--------|----------|-----|
| F-37 | Chronological Heatmap | Medium | No | GitHub-style long-term view |
| F-38 | Streak DNA | Medium | No | Inline compact history barcode |
| F-39 | Correlation Map | Medium | No | "Which habits support each other?" |
| F-40 | Effort-Reward Quadrant | Low-Med | Accept fields | Strategic habit analysis |
| F-34 | Monthly Memory Lane | Medium | Store recaps | Shareable narrative monthly card |

**Exit criteria:** Users can visualize their habit data through heatmaps,
DNA strips, correlation graphs, effort-reward analysis, and monthly narratives.

**Estimated effort:** 5-7 days

---

### Phase 7: Advanced Behavioral (Week 16+)

**Goal:** Features that need mature users and accumulated data.

| ID | Feature | Effort | Backend? | Why |
|----|---------|--------|----------|-----|
| F-32 | Ritual Builder | Med-High | CRUD endpoints | Group habits into named routines |
| F-33 | Confidence Calibration | Medium | Optional endpoint | Forward-looking engagement |
| F-35 | Habit A/B Testing | Medium | No | Compare variants scientifically |
| F-36 | Habit Stacking / Chains | Medium | Accept chain fields | Model sequential dependencies |
| F-41 | Theme Toggle | Small | No | Light theme for bright environments |

**Exit criteria:** Full-featured behavioral science toolkit with rituals,
predictions, A/B testing, chains, and theme options.

**Estimated effort:** 5-7 days

---

### Phase 8: Infrastructure (When ready for multi-user)

| ID | Feature | Effort | Trigger |
|----|---------|--------|---------|
| F-42 | SQLite Migration | Large | When data.json > 1MB or auth needed |
| F-43 | Authentication | Large | When deploying publicly |
| F-44 | PWA / Offline | Large | After mobile UX is polished |

**These are not scheduled.** Build them when a specific trigger condition is met.

---

## Part 4: What's New vs What's Consolidated

### 6 Genuinely New Features (not in any prior document)

| ID | Feature | Key Insight |
|----|---------|-------------|
| NEW-A | Flexible Scheduling | The daily/weekly binary is a data model bug, not a feature gap |
| NEW-B | Habit Evolution | Habits that survive are habits that grow — model the growth |
| NEW-C | Weekly Rhythm Heatmap | Day-of-week patterns are the most actionable insight |
| NEW-D | Streak Grace Period | Automatic, conditional, one-time — no user action needed |
| NEW-E | Snapshot Comparison | "Before/after photos" for habits, computed on-the-fly |
| NEW-F | Momentum Battery | Real-time daily progress creates a completion game loop |

### Key Decisions Made in This Consolidation

| Decision | Rationale |
|----------|-----------|
| Flexible scheduling in Phase 1, not Phase 2-3 | It's a data model bug. Fix it before building analytics on a broken model. |
| Grace period over streak shields as first streak protection | Shields require earning/activating. Grace is automatic. Lower friction = more impact. |
| Snapshot comparison over monthly memory lane (earlier) | Snapshots compute from existing data. Memory lane requires stored recaps. Less infrastructure. |
| Momentum battery over dashboard stats (same phase) | Battery is TODAY. Dashboard is aggregate. Daily experience > retrospective analysis. |
| Evolution over adaptive scaling prompts (earlier) | User-initiated evolution > app-initiated suggestion. Lower complexity, higher agency. |
| Deferred: mood correlation, micro-habits, social | High effort, uncertain payoff, or infrastructure dependencies. Build the solo experience first. |

---

## Part 5: Feature Count Summary

| Category | Count | Earliest Phase |
|----------|-------|---------------|
| Foundation fixes | 6 | Phase 1 |
| Daily experience | 6 | Phase 2 |
| Insight & motivation | 6 | Phase 3 |
| Depth & organization | 7 | Phase 4 |
| Power features | 6 | Phase 5 |
| Visualization | 5 | Phase 6 |
| Advanced behavioral | 5 | Phase 7 |
| Infrastructure | 3 | Phase 8 |
| **Total planned** | **44** | |
| Deferred | 16 | Not scheduled |
| **Grand total** | **60** | |

From 80+ overlapping proposals across 9 documents → 44 deduplicated,
sequenced features + 16 explicitly deferred with reasoning.

---

## Part 6: Immediate Next Steps

**The next action is Phase 1, Feature F-01: Edit Habit.**

Do not create another planning document. Do not reorganize the backlog.
Do not debate feature priority.

Open `server/app.js`. Add `PATCH /api/habits/:id`. Write the test. Ship it.

Then F-02. Then F-03. One feature at a time. The plan is done.
