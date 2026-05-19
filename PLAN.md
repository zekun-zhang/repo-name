# Habit Garden — The Definitive Plan

> **This document supersedes ALL prior planning docs.** The 9 files below
> are preserved as historical reference — do not add to them.
>
> Superseded: FEATURES.md, NEW_FEATURES.md, BACKLOG.md, ROADMAP.md,
> CREATIVE_FEATURES.md, FEATURE_PROPOSALS.md, FEATURE_PLAN.md,
> FEATURE_PLAN_v3.md, IMPLEMENTATION_PLAN.md
>
> Created: 2026-05-19

---

## 1. Honest Assessment

### What's Shipped (MVP)

~480 lines of working code across 4 React components, 1 custom hook,
7 utility functions, and 5 Express endpoints:

- Habit CRUD (create, archive, hard-delete)
- Daily & weekly toggle with optimistic updates
- 14-day visual history grid
- Streak calculation (daily and weekly)
- Dark theme, toast notifications
- JSON file persistence with async mutex
- 17 backend integration tests

### The Planning Problem

| Metric | Value |
|--------|-------|
| Planning documents | 9 files |
| Proposed features (total) | 80+ |
| Unique features (after dedup) | ~45 |
| Lines of planning text | ~4,500+ |
| Lines of shipped code | ~480 |
| Features shipped beyond MVP | 0 |

Each doc critiques the previous ones, merges some features, adds new ones,
and declares itself the "single source of truth." The result is 9 sources
of truth — which means zero.

**This document takes a different approach:** fewer features, harder cuts,
and an emphasis on what the 9 prior docs genuinely missed.

---

## 2. New Feature Proposals

After auditing all 80+ features across 9 documents, these dimensions
remain **completely unaddressed**:

| Gap | What's Missing | Prior Coverage |
|-----|---------------|----------------|
| **Spaced repetition** | Not every habit needs daily practice. Skill-building habits follow learning curves. | All docs assume fixed frequency (daily/weekly/custom days). |
| **Progressive complexity** | 80+ features proposed but no plan for revealing complexity gradually to users. | Every doc lists features; none discuss UX progressive disclosure. |
| **Accessibility** | Zero mentions of a11y across 9 docs. | No screen reader support, no ARIA, no focus management discussed. |
| **Integration hooks** | The app is a closed system. No way for external tools to interact. | iCal export proposed but passive. No inbound integration. |
| **Behavioral momentum physics** | Difficulty tiers and health scores exist, but no model captures both effort AND consistency as one metric. | Difficulty (P1), Health Score (F2), and Effort-Reward (C9) are all separate dimensions. |
| **Context snapback after disruption** | Life Phases (C6) lets you downshift. Nothing helps you upshift back. | Life Phases model the disruption, not the recovery ramp. |

### NEW-1: Spaced Repetition Scheduling

**What:** A third frequency mode beyond "daily" and "weekly": **spaced**.
Spaced habits follow an expanding interval schedule optimized for
skill retention:

```
Day 1 → Day 2 → Day 4 → Day 7 → Day 14 → Day 30 → Day 60
```

The app shows the next scheduled date and dims the habit on off-days.
Completing on-schedule advances to the next interval. Missing resets
to a shorter interval (not day 1 — one step back).

**Use cases:**
- "Practice guitar scales" — daily is overkill once learned, but weekly
  isn't enough to retain. Spaced repetition is optimal.
- "Review financial budget" — needs regular attention but not daily.
- "Call parents" — a relationship habit that benefits from structured
  but not daily scheduling.
- "Practice a new language" — classic spaced repetition domain.

**Why this fills a real gap:**
Every frequency model in every prior doc assumes habits are either
daily rituals or weekly commitments. But skill-building habits follow
a learning curve where the optimal practice interval increases as
mastery improves. This is well-established science (Ebbinghaus
forgetting curve, Leitner system, Pimsleur method).

Spaced scheduling is the only frequency model that **adapts to the
user's progress**. Daily frequency treats day 1 and day 100 the same.
Spaced frequency says: "You've proven you can do this — you don't
need to practice every day anymore."

**Implementation:**
- Schema: Extend frequency to include `'spaced'` type with
  `currentInterval` (days) and `nextDueDate` fields
- Utils: `calculateNextSpacedDate(lastCompleted, currentInterval)`
  — advance interval on success, step back on miss
- Frontend: Show "Due today", "Due in 3 days" status per habit
- Frontend: Dim habits on off-days (similar to Smart Rest Days)
- Backend: Accept and persist spaced frequency config

**Effort:** Medium | **Dependencies:** None

---

### NEW-2: Complexity Modes (Progressive Disclosure)

**What:** The app has three complexity modes that control which features
are visible:

| Mode | What's Visible | Target User |
|------|---------------|-------------|
| **Simple** | Create habits, toggle daily, see streak. No health scores, no difficulty, no cues, no dashboard. Just a clean checklist. | New users, minimalists |
| **Standard** | Everything in Simple + dashboard stats, health score, momentum stages, tags, heatmap. | Most users after 2+ weeks |
| **Power** | Everything in Standard + command bar, difficulty tiers, cue mapping, rituals, insights, A/B testing, keyboard shortcuts. | Invested users after 1+ month |

The app starts in Simple mode. After 7 days of active use, it suggests
upgrading to Standard. After 30 days, it suggests Power. Users can
switch freely at any time.

**Why this fills a real gap:**
The prior docs propose 80+ features but never address how users will
discover and learn them. Dumping Health Score, Momentum Stages,
Difficulty Tiers, Cue Mapping, Ritual Builder, Streak Weather,
Confidence Calibration, and Command Bar on a day-1 user is
overwhelming. They'll leave before creating their first habit.

Progressive disclosure is a foundational UX principle (Nielsen Norman
Group). The app should feel as simple as a paper checklist on day 1
and as powerful as a behavioral science lab on day 100. Complexity
Modes make this explicit.

**Implementation:**
- Storage: `complexityMode` in localStorage (default: 'simple')
- Frontend: Mode selector in settings (3 toggle buttons)
- Frontend: Conditional rendering — wrap advanced features in
  `{mode >= 'standard' && <HealthBadge />}` style checks
- Frontend: Upgrade suggestion toast at day 7 and day 30
- No backend changes

**Effort:** Low (it's primarily conditional rendering) |
**Dependencies:** Should be implemented early so all future features
respect the mode system

---

### NEW-3: Accessibility Foundation

**What:** A systematic accessibility pass covering:

| Category | Specific Improvements |
|----------|----------------------|
| **Keyboard navigation** | Full tab-order through habits, toggle with Enter/Space, focus indicators on all interactive elements |
| **Screen reader** | ARIA labels on all interactive elements, live regions for toasts, role annotations on the habit grid |
| **Color** | Ensure all color-coded elements (streaks, habit colors) have non-color indicators (icons, patterns). WCAG AA contrast ratios (4.5:1 minimum) |
| **Motion** | Respect `prefers-reduced-motion` for all animations (streak celebrations, weather effects, garden) |
| **Focus management** | Return focus correctly after modals close, trap focus inside modals, skip-to-content link |

**Why this fills a real gap:**
Zero mentions of accessibility across 9 planning documents and 80+
proposed features. The app uses custom CSS with color-coded cells,
small click targets (the 14-day grid), and no ARIA attributes. A
screen reader user cannot use the app at all.

This isn't a feature — it's a responsibility. It should be part of
Sprint 0, not an afterthought.

**Implementation:**
- Frontend: Add ARIA labels to all buttons, inputs, and grid cells
- Frontend: Add `role="grid"`, `role="row"`, `role="gridcell"` to
  the habit table
- Frontend: Focus ring styles (`:focus-visible` with visible outlines)
- Frontend: `prefers-reduced-motion` media queries
- Frontend: Skip-to-content link
- CSS: Audit all color pairings for WCAG AA contrast
- Testing: Add axe-core or similar a11y testing to the test suite

**Effort:** Medium | **Dependencies:** None — do this early so all
future features are built accessibly from the start

---

### NEW-4: Behavioral Momentum Score

**What:** A single composite metric that captures both the *difficulty*
of what you're doing and the *consistency* with which you're doing it,
using a physics-inspired model:

```
Momentum = Mass × Velocity

Mass     = sum of active habit difficulties (1-5 scale)
Velocity = rolling 14-day completion rate (0.0 - 1.0)
Momentum = Mass × Velocity (range: 0 to ~25 for 5 habits)
```

The Momentum Score is displayed as a single number in the dashboard
header. It goes up when you:
- Complete harder habits (mass increases)
- Maintain consistency (velocity stays high)
- Add new habits you follow through on (mass + velocity both up)

It goes down when you:
- Skip habits (velocity drops)
- Drop difficult habits (mass drops)
- Add habits without following through (velocity drops faster than
  mass rises)

**Why this is different from Health Score (F2):**
Health Score measures per-habit consistency (0-100 per habit). Momentum
Score is a **portfolio-level** metric that captures the *total effort
invested across all habits*. A user with 2 easy habits at 100%
completion has lower momentum than a user with 5 hard habits at 80%.

Health Score answers "Am I consistent?" Momentum answers "How much
behavioral change am I sustaining right now?"

The physics metaphor is intuitive: objects with high momentum are hard
to stop. A user with high behavioral momentum is resilient to
disruption. Low momentum means fragile.

**Implementation:**
- Utils: `calculateMomentum(habits, logs, today)` — weighted sum
- Frontend: Momentum number + direction arrow in dashboard header
- Frontend: Sparkline showing 30-day momentum trend
- No backend changes — derived from existing data + difficulty field

**Effort:** Low | **Dependencies:** Difficulty Tiers (P1) for the
mass component. Works with default difficulty=3 without it.

---

### NEW-5: Snapback Recovery Ramp

**What:** After a disruption (3+ days with 0 completions, or returning
from vacation/life phase), the app detects the gap and offers a
structured re-entry:

**Detection:** "You haven't tracked any habits since May 14 (5 days
ago). Welcome back."

**Snapback options:**
1. **Gentle return** — Start with just your top 3 habits (by previous
   streak length) for 3 days, then add 2 more per day until full
2. **Jump back in** — Resume all habits immediately (for users who
   just forgot to log, not truly disrupted)
3. **Reset and rebuild** — Archive everything, pick 1-2 to restart
   (for users whose life has fundamentally changed)

If the user picks Gentle return, the app temporarily hides non-selected
habits (like a mini Life Phase) and reveals them on the scheduled ramp.
A progress indicator shows: "Day 2 of recovery. 3 of 7 habits active.
Full routine resumes May 22."

**Why this fills a real gap:**
Life Phases (C6) helps users proactively downshift before a disruption.
Failure Recovery (F4) shows stats after a streak breaks. Warmup Ramp
(C1) helps new habits start small. But **nothing addresses the moment
of return** — the user who opens the app after 10 days away and faces
their full habit list with zero streaks.

That moment is the highest-churn point in any habit tracker. The user
sees 8 habits, all at Streak: 0, and thinks "I've lost everything."
Snapback reframes it: "You're back. Here's an easy way to rebuild."

**Implementation:**
- Frontend: `detectGap(logs, today)` — check if 3+ consecutive days
  have zero completions across all habits
- Frontend: `<SnapbackModal />` — shown on first visit after gap
- Frontend: Recovery plan stored in localStorage with daily
  habit-reveal schedule
- Frontend: Recovery progress indicator in header
- No backend changes

**Effort:** Medium | **Dependencies:** None (enhanced by Life Phases)

---

### NEW-6: External Integration Hooks (Shortcuts/Zapier API)

**What:** A simple REST API endpoint that allows external tools to
toggle habits by name:

```
POST /api/external/toggle
Body: { "habit": "Exercise", "date": "2026-05-19" }
Header: X-API-Key: <generated-key>
```

The API key is generated in settings (a random string stored in
data.json). This enables:

- **iOS Shortcuts:** "Hey Siri, I exercised" → HTTP POST → habit toggled
- **Android Tasker:** Location-based triggers (arrive at gym → toggle)
- **IFTTT/Zapier:** Connect to wearables, calendars, or other apps
- **CLI:** `curl` one-liner for terminal-loving users
- **Browser bookmarklet:** One-click toggle from any webpage

**Why this fills a real gap:**
Every prior doc treats the app as a closed system. The only proposed
integration is iCal export (passive, read-only). No feature allows
external tools to *write* to the app.

Habit check-ins compete with friction. The faster and more contextual
the check-in, the more likely it happens. A Siri Shortcut that takes
2 seconds beats opening a browser, navigating to the app, finding the
habit, and clicking the toggle.

This is also the foundation for future integrations without needing
a full auth system — the API key provides single-user security.

**Implementation:**
- Backend: New `POST /api/external/toggle` endpoint with API key
  validation
- Backend: `GET /api/external/status` — returns today's habit
  completion summary
- Backend: API key generation and storage in data.json settings
- Frontend: Settings panel with "Generate API Key" button and
  example curl commands
- Security: Rate limiting (10 requests/minute), key validation

**Effort:** Low-Medium | **Dependencies:** None

---

## 3. Consolidated Feature Backlog

The features below are selected from the 80+ proposals across all
prior docs plus the 6 new proposals above. Each was evaluated on:

1. **User impact:** Does it make the daily check-in better?
2. **Technical leverage:** Does it enable other features?
3. **Effort:** Can it ship in 1-2 focused sessions?
4. **Foundation:** Is the app broken without it?

### What Made the Cut: 32 Features in 5 Sprints

### What Got Cut: See Section 5

---

### Sprint 0: Fix the Foundation (3-5 days)

The app has UX gaps that disqualify it as a recommendable product.
Fix these before anything else. Zero schema changes. Zero new deps.

| # | Feature | Source | Effort | What |
|---|---------|--------|--------|------|
| 1 | Edit Habit After Creation | BACKLOG G1 | Small | `PATCH /api/habits/:id` + edit modal. Users currently must delete and recreate to change a name. |
| 2 | View & Restore Archived | BACKLOG G2 | Small | Collapsible "Archived" section + `POST /api/habits/:id/unarchive` endpoint. |
| 3 | Undo Toast for Toggles | FEATURES #3 | Small | 5-second undo toast. Re-toggles on undo. Standard UX pattern. |
| 4 | Auto-Backup | BACKLOG N7 | Small | Copy `data.json` on every write. Keep 7 days. Prevent catastrophic data loss. |
| 5 | Accessibility Foundation | **NEW-3** | Medium | ARIA labels, keyboard nav, focus management, contrast audit. Do this now so all future features are accessible. |
| 6 | Responsive Mobile | BACKLOG G4 | Medium | 7-day grid on mobile, 44px tap targets, single-column layout. |

**Exit criteria:** Users can edit, unarchive, and undo. Data is backed
up. App works on mobile. Screen reader users can navigate.

---

### Sprint 1: Motivation & Daily Experience (5-7 days)

Replace the fragile streak-only system with a richer, more forgiving
motivation model. All frontend-only — zero backend changes.

| # | Feature | Source | Effort | What |
|---|---------|--------|--------|------|
| 7 | Complexity Modes | **NEW-2** | Low | Simple/Standard/Power modes. Start simple. Suggest upgrades at day 7/30. All subsequent features tagged with their mode. |
| 8 | Health Score | NEW_FEATURES F2 | Low | Composite 0-100 score (30-day rate × 0.5 + 7-day rate × 0.3 + trend × 0.2). Replaces raw streak emphasis. **[Standard mode]** |
| 9 | Failure Recovery + Records | BACKLOG F4+N10 | Low | When streak breaks: show previous streak, personal best, bounce-back rate, "days to beat record" countdown. **[Standard mode]** |
| 10 | Momentum Stages | BACKLOG N3 | Low | Seedling (0-7d) → Growing (8-21d) → Rooted (22-66d) → Evergreen (67d+). Stage-appropriate messaging. **[Simple mode — visible to all]** |
| 11 | Today View | BACKLOG N1 | Low | Toggle to a minimal checklist of today's habits. Large tap targets, no history grid. Optimized for <15-second check-in. **[Simple mode]** |
| 12 | Dashboard Stats | FEATURES #1 | Low | Today's completion rate, active habit count, longest active streak, weekly trend. **[Standard mode]** |
| 13 | Theme Toggle | FEATURES #14 | Small | Light/dark toggle. CSS vars already exist. localStorage persistence. **[Simple mode]** |

**Exit criteria:** The app has a forgiving motivation system, a fast
daily check-in mode, aggregate stats, and progressive complexity.

---

### Sprint 2: Data Model & Engagement (7-10 days)

First schema changes. Richer habit model. Features that give users
reasons to come back.

| # | Feature | Source | Effort | What |
|---|---------|--------|--------|------|
| 14 | Smart Rest Days | NEW_FEATURES F5 | Medium | Custom frequency: weekdays, MWF, 4x/week. Streaks and scores respect off-days. **[Standard mode]** |
| 15 | Completion Timestamps | BACKLOG N2 | Medium | Store ISO timestamp alongside date. Backward-compatible. Every day without this = lost data. **[invisible infrastructure]** |
| 16 | Difficulty Tiers | PROPOSALS P1 | Low | 1-5 star difficulty per habit. Enables effort-weighted scoring. **[Standard mode]** |
| 17 | Behavioral Momentum Score | **NEW-4** | Low | Portfolio-level metric: difficulty × consistency. Single dashboard number. **[Standard mode]** |
| 18 | Data Export | FEATURES #4 | Low | `GET /api/export?format=json|csv`. Download button. Ship before model gets more complex. **[Simple mode]** |
| 19 | Onboarding & Templates | BACKLOG G3 + FEATURES #12 | Small | Empty state with guided onboarding + 5-6 one-click template habits. **[Simple mode]** |
| 20 | Streak Shields | NEW_FEATURES F1 | Medium | Earn 1 shield per 14-day streak. Shield auto-spends on a miss. Vacation mode for date ranges. **[Standard mode]** |

**Exit criteria:** Habits support flexible scheduling. Difficulty is
tracked. Momentum captures total effort. Data is exportable. New users
get guidance. Streaks have safety nets.

---

### Sprint 3: Depth & Organization (7-10 days)

Features for users with 2+ weeks of data and 5+ habits. Organization
tools and richer tracking.

| # | Feature | Source | Effort | What |
|---|---------|--------|--------|------|
| 21 | Categories / Tags | FEATURES #2 | Medium | User-defined tags with filter UI. Habits can have multiple tags. **[Standard mode]** |
| 22 | Habit Stacking / Routines | NEW_FEATURES F3 | Medium | Named groups ("Morning Routine") with collapsible sections and "Complete All." **[Standard mode]** |
| 23 | Heatmap | FEATURES #5 | Medium | GitHub-style calendar heatmap. Per-habit or all-habits. 3-6 month view. **[Standard mode]** |
| 24 | Spaced Repetition | **NEW-1** | Medium | Third frequency type. Expanding intervals for skill-building habits. **[Power mode]** |
| 25 | Environmental Cue Tracker | CREATIVE C4 | Low | Optional cue field per habit. Shown as subtitle. Refresh prompt when completion drops. **[Standard mode]** |
| 26 | Drag & Drop Reorder | FEATURES #8 | Medium | Persistent sort order. `sortOrder` field on habits. **[Simple mode]** |
| 27 | External Integration API | **NEW-6** | Low-Med | Toggle habits via REST API. API key auth. Enables Siri Shortcuts, CLI, Zapier. **[Power mode]** |

**Exit criteria:** Habits are organized (tags, stacks, reorder).
Long-term patterns are visible (heatmap). Skill habits have proper
scheduling. External tools can interact with the app.

---

### Sprint 4: Intelligence & Reflection (10-14 days)

Features that synthesize accumulated data into actionable insight.
Users need 30+ days of data for these to be meaningful.

| # | Feature | Source | Effort | What |
|---|---------|--------|--------|------|
| 28 | Insights Engine | NEW_FEATURES F8 | Med-High | Auto-detected patterns: day-of-week analysis, co-occurrence, trend detection. Plain-English summaries. **[Power mode]** |
| 29 | Snapback Recovery | **NEW-5** | Medium | Detect 3+ day gaps. Offer gentle return (gradual ramp), jump back in, or reset. Structured re-entry. **[Standard mode]** |
| 30 | Command Bar | IMPL_PLAN NEW-3 | Medium | Press `/` for fuzzy-search command palette. Toggle habits, create, archive, navigate — all by keyboard. **[Power mode]** |
| 31 | Contextual Micro-Rewards | IMPL_PLAN NEW-7 | Medium | Data-driven encouragement at key moments. Every message contains real numbers from the user's data. Never generic. **[Standard mode]** |
| 32 | Weekly Review Wizard | NEW_FEATURES F10 | Medium | Guided 5-step reflection: this week's stats → what went well → what was hard → adjust habits → set next week's intention. **[Power mode]** |

**Exit criteria:** The app surfaces patterns the user didn't notice.
Disruptions are handled gracefully. Power users have keyboard-driven
efficiency. Weekly reflection creates a meta-habit.

---

### Backlog (Build After Sprints 0-4 Are Shipped)

These features are valid but premature. Build when the core experience
is proven and users have months of data.

| Feature | Source | Why Deferred |
|---------|--------|-------------|
| Anti-Habit Tracking | IMPL_PLAN NEW-1 / PROPOSALS P8 | Opens a new use case but increases scope. Core positive tracking should be excellent first. |
| Living Garden Visualization | ROADMAP NEW-1 | High visual impact but SVG/illustration work is time-consuming. Ship when the app's identity is proven. |
| Confidence Calibration | CREATIVE C5 | Forward-looking prediction. Unique but complex UX. Users need to be deeply engaged before this adds value. |
| Life Phase Modes | CREATIVE C6 | Snapback Recovery (Sprint 4) handles most disruption cases. Full life phases are more complex. |
| A/B Habit Testing | CREATIVE C2 | Genuine differentiator but niche. Most users don't need controlled experiments. |
| Monthly Memory Lane | CREATIVE C7 | Beautiful narrative recap. Needs 2+ months of data. Build after insights engine. |
| Habit Autopsy | FEATURE_PLAN C3 | Structured reflection on dropped habits. Needs 3+ archived habits to be useful. |
| Streak Weather | FEATURE_PLAN C5 | Ambient background based on habit health. Nice polish, not essential. |
| Progress Proof Gallery | FEATURE_PLAN C4 | Tangible evidence of improvement. Medium effort, niche value. |
| Ritual Builder | FEATURE_PLAN C7 | Micro-step breakdown. Habit Stacking covers the grouping use case first. |
| Smart Rest Days (expanded) | Additional custom scheduling beyond initial Sprint 2 implementation. |
| Reports Page | FEATURES #9 | Dedicated analytics page. The insights engine and heatmap cover most use cases. |
| Habit Notes / Journal | FEATURES #6 / ROADMAP NEW-5 | Day-level notes. Nice context but not a retention driver. |
| Reminders | FEATURES #7 | Browser notifications. Streak Decay Warnings (if added) solve the awareness problem passively. |
| Goals & Milestones | FEATURES #13 | Target-based celebrations. Momentum Stages and Records cover this partially. |
| Authentication | FEATURES #10 | Only for multi-user deployment. |
| Database Migration | FEATURES #11 | JSON works for single user. Migrate when auth ships. |
| PWA / Offline | FEATURES #15 | Large effort. Ship when targeting mobile users seriously. |
| Social / Accountability | FEATURES #16 | Requires auth. |
| Mood & Energy Correlation | NEW_FEATURES F6 | A second daily habit most users won't sustain. |
| Micro-Habits / Partial Completion | NEW_FEATURES F9 | Breaking schema change. Warmup Ramp solves similar problem. |
| Warmup Ramp | CREATIVE C1 | Good idea but adds complexity to habit creation. The simple version (just start small manually) works. |
| Streak Savings Bank | CREATIVE C3 | Novel mechanic but confusing UX. Streak Shields are simpler. |
| Effort-Reward Quadrant | CREATIVE C9 | Interesting analysis but low daily utility. |
| Completion Combos | CREATIVE C10 | Daily breadth reward. Fun but not essential. |
| Natural Language Input | BACKLOG N9 | Regex parsers create more frustration than forms. |
| Streak DNA | BACKLOG N4 | Cool inline viz but the heatmap covers long-term patterns. |
| Correlation Map | BACKLOG N5 | Needs 60+ days. Part of the insights engine, not standalone. |
| Adaptive Scaling | BACKLOG N6 | "Level up" prompts. Good for mature users only. |
| Time Budgeting | BACKLOG N8 | Estimated minutes per habit. Nice but not a retention driver. |
| Difficulty Pulse | IMPL_PLAN NEW-2 | Post-completion micro-survey. Interesting but survey fatigue risk. |
| Personal Record Board | IMPL_PLAN NEW-6 | Merged into Failure Recovery + Records (Sprint 1, item 9). |
| Streak Autopsy | IMPL_PLAN NEW-4 | Auto-analysis of why streaks broke. Build after insights engine. |
| Ritual Builder (Sequencing) | IMPL_PLAN NEW-5 | Habit sequencing into rituals. Stacking covers the primary use case. |
| Keyboard Shortcuts | NEW_FEATURES F11 | Folded into Command Bar (Sprint 4). j/k/space nav comes with it. |
| Habit Experiments | NEW_FEATURES F7 | 30-day trials. Users can frame any habit as a trial mentally. |
| Compatibility Advisor | FEATURE_PLAN C6 | Smart guidance on adding habits. Needs data history. |
| Autopilot Detection | FEATURE_PLAN C8 | Graduate stable habits. Interesting UX inversion — build after momentum stages prove out. |
| Identity Statements | PROPOSALS P3 | Part of Momentum Stages (shown at Rooted/Evergreen). |
| Contextual Check-In | PROPOSALS P4 | Morning/evening filtering. Folded into Today View with time-awareness. |
| Habit Chains | PROPOSALS P5 | Cue Mapping + Stacking covers this more simply. |
| Weekly Intentions | PROPOSALS P6 | Folded into Weekly Review Wizard. |
| Time Capsule Snapshots | PROPOSALS P7 | Needs months of data. |
| Power Hours | PROPOSALS P9 | Blocked by Timestamps + needs weeks of data. |
| Minimum Viable Day | PROPOSALS P10 | Good concept. Can be approximated with tags ("essential" tag). |
| Decay Warnings | PROPOSALS P2 | Visual urgency based on time-of-day. Build with Today View enhancements. |
| Cue Mapping | FEATURE_PLAN C1 | Merged into Environmental Cue Tracker (Sprint 3, item 25). |
| Motivation Capsule | FEATURE_PLAN C2 | "Why I Started" note. Small addition — can be added to Edit Habit modal without a standalone feature. |

---

## 4. Architecture Decisions

### Storage: Stay with JSON until...

**Trigger to migrate to SQLite:** any of these become true:
1. Authentication ships (need per-user isolation)
2. Heatmap queries exceed 100ms (date-range lookups over large data)
3. Data file exceeds 1MB
4. Multi-device sync is needed

Until then, JSON + mutex is fine for a single-user app.

### State Management: useReducer Migration

The current `useHabits` hook should migrate to `useReducer` + React
Context when Today View ships (Sprint 1). Multiple views need shared
state, and undo/redo naturally maps to action history.

### Complexity Mode Architecture

Implement as a React Context:

```tsx
const mode = useComplexityMode() // 'simple' | 'standard' | 'power'

// In components:
{mode >= 'standard' && <HealthBadge />}
{mode >= 'power' && <CommandBar />}
```

Every new feature should document its mode level. Simple mode features
must work perfectly standalone.

### Testing Strategy

- Backend: Continue Jest + Supertest integration tests
- Frontend: Add React Testing Library for component tests starting
  Sprint 1. Priority: Today View, Dashboard, toggle interactions.
- Accessibility: Add axe-core automated a11y tests in Sprint 0.

---

## 5. What's Cut and Why

| Decision | Rationale |
|----------|-----------|
| No AI/ML anywhere | Deterministic logic is explainable, fast, and free of API deps. |
| No gamification (XP, levels, badges) | Risks extrinsic motivation replacing intrinsic. Momentum Stages and Records are grounded in real data. |
| No email/push notifications | Browser Notification API requires permission prompts most users deny. In-app visual cues are sufficient. |
| No social features | Requires auth. Build the solo experience first. |
| No natural language input | Regex parsers fail on edge cases and frustrate users more than forms. |
| Cut from 80+ to 32 features | A realistic backlog you can finish is better than an aspirational one you'll never start. |
| Merged 8 overlapping features | Failure Recovery + Records, Momentum + Identity, Today View + Contextual, Keyboard + Command Bar. |
| Deferred 40+ features | Not rejected — deferred until the foundation is solid and users have data. |

---

## 6. Dependency Graph

```
Sprint 0: Foundation
  G1 Edit ─────────────────┐
  G2 Unarchive             │
  #3 Undo Toast            │
  N7 Backup                │
  NEW-3 Accessibility      │
  G4 Mobile                │
         │                 │
         ▼                 │
Sprint 1: Motivation       │
  NEW-2 Complexity Modes ──┤ (gates all future feature visibility)
  F2 Health Score           │
  F4+N10 Recovery+Records  │
  N3 Momentum Stages       │
  N1 Today View            │
  #1 Dashboard             │
  #14 Theme                │
         │                 │
         ▼                 │
Sprint 2: Data Model       │
  F5 Smart Rest Days       │
  N2 Timestamps            │
  P1 Difficulty ───────────┤
  NEW-4 Momentum Score ◄───┘ (uses difficulty)
  #4 Export
  G3+#12 Onboarding+Templates
  F1 Streak Shields
         │
         ▼
Sprint 3: Organization
  #2 Tags
  F3 Stacking
  #5 Heatmap ◄──── N2 Timestamps (enhanced)
  NEW-1 Spaced Repetition
  C4 Environmental Cues
  #8 Drag & Drop
  NEW-6 External API
         │
         ▼
Sprint 4: Intelligence
  F8 Insights Engine ◄──── N2 Timestamps + 30 days data
  NEW-5 Snapback Recovery
  NEW-3 (IMPL) Command Bar
  NEW-7 (IMPL) Micro-Rewards
  F10 Weekly Review
```

---

## 7. Success Metrics

How to know each sprint succeeded:

| Sprint | Success Looks Like |
|--------|-------------------|
| 0 | A friend can use the app on their phone without asking "how do I edit this?" |
| 1 | Daily check-in takes <15 seconds via Today View. Streak breaks don't feel catastrophic. |
| 2 | Users with 5+ habits feel their effort is accurately reflected. Data is exportable. |
| 3 | Users with 10+ habits can organize and find what they need. Heatmap shows long-term patterns. |
| 4 | The app surfaces insights users didn't know about themselves. Power users never touch the mouse. |

---

## 8. What NOT to Do

1. **Don't write more planning documents.** This is the tenth. Ship code.
2. **Don't build infrastructure before features.** No database, no auth,
   no PWA until the daily experience is excellent.
3. **Don't ship features without testing them.** Backend tests exist.
   Frontend tests don't. Fix that in Sprint 0.
4. **Don't add features to Simple mode without extreme justification.**
   Simple mode's value is what it excludes.
5. **Don't optimize for power users before regular users exist.**
   Power mode features are Sprint 3-4. Basics come first.

---

## 9. Feature Detail Quick Reference

For full specifications of features from prior docs, refer to:

| Feature | Detailed Spec In |
|---------|-----------------|
| Health Score (F2) | NEW_FEATURES.md, lines 36-50 |
| Failure Recovery (F4) | NEW_FEATURES.md, lines 71-81 |
| Smart Rest Days (F5) | NEW_FEATURES.md, lines 86-99 |
| Streak Shields (F1) | NEW_FEATURES.md, lines 20-31 |
| Habit Stacking (F3) | NEW_FEATURES.md, lines 55-68 |
| Insights Engine (F8) | NEW_FEATURES.md, lines 140-159 |
| Weekly Review (F10) | NEW_FEATURES.md, lines 179-195 |
| Command Bar | IMPLEMENTATION_PLAN.md, lines 99-134 |
| Micro-Rewards | IMPLEMENTATION_PLAN.md, lines 269-318 |
| Environmental Cues | CREATIVE_FEATURES.md, lines 169-209 |
| Momentum Stages (N3) | BACKLOG.md, lines 149-186 |
| Today View (N1) | BACKLOG.md, lines 86-112 |
| Timestamps (N2) | BACKLOG.md, lines 116-145 |
| Difficulty Tiers (P1) | FEATURE_PROPOSALS.md, lines 26-54 |

For the 6 new features (NEW-1 through NEW-6), full specs are in
Section 2 of this document.

---

## 10. Summary

| Metric | Value |
|--------|-------|
| Total features in plan | 32 active + 40+ deferred |
| New features (this doc) | 6 |
| Sprints | 5 (Sprint 0-4) |
| Estimated total effort | 5-8 weeks |
| Schema changes | Sprints 2-3 only |
| New backend dependencies | 0 |
| New frontend dependencies | 1 (drag-and-drop, Sprint 3) |

**The next step is Sprint 0: Fix the Foundation.**
