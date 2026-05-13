# Habit Garden — Consolidated Feature Plan & Backlog

> Single source of truth for all planned features. Supersedes the previous
> `FEATURES.md` and `NEW_FEATURES.md`. Each feature includes what it does,
> why it matters, scope, effort, and dependencies.

---

## Current State (as of May 2025)

**Habit Garden** is a React + Express habit tracker with:

- Habit CRUD: create (name, frequency, color), archive, permanent delete
- Frequency: daily or weekly (binary — no custom schedules)
- 14-day rolling calendar grid with click-to-toggle completion
- Streak calculation (consecutive days/weeks from today backward)
- Optimistic UI updates with rollback on failure
- Toast notifications, loading/error states
- JSON file persistence with async mutex lock
- 33 backend integration tests, zero frontend tests
- Dark-only theme, responsive layout

**What works well:** The core loop (create → toggle → see streak) is fast and
reliable. Optimistic updates feel instant. The dark theme is polished.

**What's missing:** No way to see progress beyond 14 days. Streaks are the only
metric and they punish imperfection. No categories, no notes, no rest days.
The "Garden" brand metaphor is unused. Single-user, no data portability, no
offline support.

---

## Design Principles

1. **Consistency over perfection.** Streaks reward unbroken chains; real
   humans have off days. Every feature should reward *patterns*, not *perfection*.
2. **Insight over information.** Raw checkmarks are data. "You complete 90% on
   weekdays but 30% on weekends" is insight. Prefer the latter.
3. **Low friction, high frequency.** This app is opened daily. Every extra click
   on the happy path compounds into frustration. Keyboard shortcuts, smart
   defaults, and minimal modals matter.
4. **The garden metaphor is the brand.** Lean into it. Growth, seasons, tending,
   wilting — these emotional metaphors make habit tracking feel alive.

---

## Sprint 1 — Foundation Fixes (Low Effort, High Impact)

These features require no schema changes and fix the most painful gaps in
the current UX. All are frontend-only or trivial backend additions.

### 1. Habit Health Score (Consistency Index)

**What:** A composite 0-100 score per habit based on rolling 30-day completion
rate (50% weight), 7-day rate (30% weight), and trend direction (20% bonus if
improving). Displayed as a colored badge alongside the streak pill.

**Why:** Streaks are fragile — one miss resets to zero, which is psychologically
devastating and factually misleading. A user who completed 28/30 days shows
streak=0 after missing yesterday. Health Score shows 93/100. This is more
truthful, more forgiving, and better motivation for non-perfectionists.

**Scope:** New `calculateHealthScore()` in `utils.ts`, new `<HealthBadge>`
component. Pure frontend — no backend changes.

**Effort:** Low | **Dependencies:** None

---

### 2. Failure Recovery Panel

**What:** When a streak breaks, replace the bare "0 days" with a recovery
context panel: previous streak, personal best, current bounce-back run, and
bounce-back rate (how quickly you historically resume after a miss).

**Why:** The moment after a streak breaks is when users are most likely to quit.
Showing "0 days" maximizes that impulse. Showing "Previous: 45 days | Best
ever: 45 days | Back on track: 3 days" reframes the miss as a speed bump,
not a cliff. This directly counters the "abstinence violation effect" from
behavioral psychology.

**Scope:** New `calculateRecoveryStats()` in `utils.ts`, conditional render in
`HabitRow`. Computed from existing log data.

**Effort:** Low | **Dependencies:** None

---

### 3. View & Restore Archived Habits

**What:** A toggleable "Show archived" section at the bottom of the habit
table. Archived habits display muted with a "Restore" button.

**Why:** Archive is currently a one-way door. Users who accidentally archive
or want to resume an old habit are stuck. This is a baseline usability gap.

**Scope:** New `POST /api/habits/:id/unarchive` endpoint (mirrors archive).
Toggle button + filtered list in `HabitTable`.

**Effort:** Low | **Dependencies:** None

---

### 4. Habit Sunset Prompts (Auto-Archive Nudge)

**What:** If a habit hasn't been completed in 14+ days, dim it in the UI and
show a gentle prompt: "You haven't tracked [Habit] in 2 weeks. Recommit,
archive, or snooze this reminder?"

**Why:** Habit list rot is real. Users accumulate abandoned habits they never
formally remove. These ghost habits clutter the interface and generate guilt
on every visit. A sunset prompt forces a conscious decision — either recommit
(which research shows increases follow-through) or archive cleanly.

**Scope:** Computed from `logs` data. Prompt component in `HabitRow`. No
backend changes.

**Effort:** Low | **Dependencies:** Requires #3 (unarchive) so archiving
feels safe

---

### 5. Undo Toast for Toggles

**What:** When toggling a habit completion, show a 5-second undo toast
instead of the action being instantly permanent.

**Why:** Mis-taps on a grid of small buttons are inevitable, especially on
mobile. An undo toast (Gmail/Slack pattern) prevents frustration without
adding confirmation dialogs that slow down the happy path.

**Scope:** Frontend state change in `useHabits` — undo simply re-toggles.
No backend changes.

**Effort:** Low | **Dependencies:** None

---

### 6. Dark/Light Theme Toggle

**What:** A theme toggle button in the header. Currently dark-only. CSS
variables are already partially set up in `index.css`.

**Why:** User preference. Some users find light themes easier to read in
bright environments. Low complexity since the CSS architecture supports it.

**Scope:** CSS variable swap, toggle button, `localStorage` persistence.

**Effort:** Low | **Dependencies:** None

---

## Sprint 2 — Model & Data Improvements (Medium Effort)

These features improve the habit data model and add missing data operations.
Some require schema changes but no breaking migrations.

### 7. Smart Rest Days / Custom Schedules

**What:** When creating a daily habit, optionally pick active days (e.g.,
Mon-Fri for exercise). Streaks and health scores skip rest days. Also support
"N times per week" flexible goals.

**Why:** This is the #1 structural problem with the app. "Exercise daily"
doesn't mean Saturday. Without rest days, the tracker *punishes correct
behavior*. Users either stop trusting streaks, check off days dishonestly,
or feel guilty — all bad outcomes.

**Scope:**
- Add optional `activeDays: number[]` (0=Sun..6=Sat) to Habit type
- Update `calculateStreak` and health score to skip inactive days
- Day-of-week chip picker in `HabitForm`, dimmed cells in `HabitRow`
- Backend validation: array of 0-6 integers, minimum 1 day

**Effort:** Medium | **Dependencies:** #1 (health score respects rest days)

---

### 8. Habit Categories & Filtering

**What:** Assign each habit a category (Health, Learning, Productivity,
Creative, or custom). Filter bar in the table header. Category badge in
each row.

**Why:** Once users have 5+ habits, the flat list becomes noisy. Categories
let users focus on one area at a time and see how balanced their routine is.

**Scope:** Add `category: string` to Habit type. Filter bar in `HabitTable`,
dropdown in `HabitForm`. New backend validation.

**Effort:** Medium | **Dependencies:** None

---

### 9. Streak Shields & Vacation Mode

**What:** Users earn 1 "streak shield" per 14-day streak (auto-awarded, max 3
stockpiled). A shield preserves the streak through 1 missed day. Separately,
users can activate "vacation mode" for a date range to pause all streaks.

**Why:** Streak anxiety is the #1 churn driver in habit apps. Duolingo's
streak freezes reduced churn 15-20% (per their public data). A shield reframes
a miss from "failure" to "planned pause." Vacation mode handles multi-day
absences (travel, illness) without streak destruction.

**Scope:**
- Add `shieldCount: number` and `vacationRanges: {start, end}[]` to data
- Update streak calculation to consume shields / skip vacation dates
- Shield indicator on streak badge, vacation toggle in settings area

**Effort:** Medium | **Dependencies:** None

---

### 10. Data Export & Import

**What:** Export all habits and logs as JSON (for backup) or CSV (for
spreadsheets). Import from a previously exported JSON file or common formats
(Habitica, generic CSV).

**Why:** Users with months of data are locked in. Export/import builds trust,
enables device migration, and is table-stakes for any personal data app.
Also serves as a manual backup since there's no database.

**Scope:**
- `GET /api/export?format=json|csv` endpoint
- `POST /api/import` with validation and confirmation
- Download button in header, file picker for import

**Effort:** Medium | **Dependencies:** None

---

### 11. Habit Templates

**What:** Pre-built habit bundles ("Morning Routine", "Fitness Starter",
"Learning Stack", "Mindfulness") that add 3-5 habits with one click.
Shown on empty state and via a "Browse templates" button.

**Why:** The blank-slate problem is real — new users stare at an empty form
and don't know what to track. Templates reduce onboarding friction and
encode best practices. Extremely low backend cost (static data).

**Scope:** Static template JSON (no new endpoints). `<TemplateDrawer>`
component. Batch-creates habits via existing `POST /api/habits`.

**Effort:** Low-Medium | **Dependencies:** None

---

## Sprint 3 — Engagement & Visualization (Medium-High Effort)

Features that add emotional depth and longer-term visibility.

### 12. Garden Visualization

**What:** A visual "garden" view where each active habit is a plant whose
growth stage maps to its health score. Stages: empty plot (no data) → seed
(1-3 days) → sprout (4-7) → sapling (8-14) → bloom (15-30) → tree (31+).
Missed yesterday = wilting overlay. Each plant uses the habit's assigned color.

**Why:** The app is called "Habit Garden" but has zero garden imagery. This
is the most differentiating feature possible — it turns dry checkmarks into
an emotional experience. Users feel *responsible* for their garden, which is
the exact psychological hook that makes habits stick. Think Tamagotchi
mechanics applied to personal growth.

**Scope:**
- New `<GardenView>` component (CSS-only or small SVG sprites, no library)
- View toggle in header: Table | Garden
- Reads existing `habits` + `logs` data, no backend changes

**Effort:** Medium | **Dependencies:** #1 (health score drives growth stage)

---

### 13. Monthly Heatmap View

**What:** GitHub-style contribution heatmap showing 90 or 365 days. Color
intensity = daily completion ratio across all habits, or single-habit
completion when drilled into.

**Why:** The 14-day window is great for daily check-ins but terrible for
seeing long-term trends. Users who've tracked for months have no way to
appreciate their progress. The heatmap is immediately readable.

**Scope:**
- New `<HeatmapView>` component (CSS grid, ~365 cells)
- Per-habit detail via click/expand
- May need `GET /api/logs?from=&to=` for efficiency at scale

**Effort:** Medium | **Dependencies:** None

---

### 14. Habit Stacking / Routines

**What:** Group habits into named "stacks" (e.g., "Morning Routine") that
display as collapsible sections. Within a stack, habits appear in deliberate
order. "Complete All" button marks the entire stack for today.

**Why:** Habit stacking (from *Atomic Habits*) — "After [X], I will [Y]" —
is one of the most effective behavior change techniques. Grouping habits
into routines reduces decision fatigue and models how people actually
structure their day.

**Scope:**
- New `Stack` type: `{ id, name, habitIds, sortOrder }`
- New CRUD endpoints for stacks + batch toggle
- `<StackGroup>` wrapper component with "Complete All"
- Ungrouped habits in a default section

**Effort:** Medium-High | **Dependencies:** None

---

### 15. Habit Experiments (30-Day Trials)

**What:** A special "experiment" mode: commit to exactly 30 days. Distinct
progress ring UI with countdown. At day 30, a reflection prompt: "Keep
permanently, extend, or drop?"

**Why:** Adding a habit permanently feels like a big commitment. "Just try
it for 30 days" is psychologically easier. This is the "free trial" model
applied to behavior change. It also prevents habit list bloat — experiments
that don't work get consciously dropped.

**Scope:**
- Add `experiment: { startDate, durationDays } | null` to Habit type
- `<ExperimentRow>` with progress ring and countdown
- Day-30 reflection modal → keep/extend/archive

**Effort:** Medium | **Dependencies:** None

---

### 16. Completion Notes / Journaling

**What:** Optional short note (max 200 chars) when completing a habit.
Notes appear on hover/tap in the calendar cell. Long-press or secondary
tap opens the note input.

**Why:** Habits aren't binary in real life. "Ran 3 miles" vs "walked 10 min"
both get a checkmark but aren't equal. Notes capture context without
mandatory friction.

**Scope:**
- Change `logs` from `string[]` to `{ date, note? }[]`
- Migration: convert existing date strings to objects on first read
- Tooltip/popover to display, input on long-press
- **Breaking schema change** — needs migration path

**Effort:** Medium-High | **Dependencies:** Migration logic

---

### 17. Streak Milestones & Celebrations

**What:** At streak milestones (7, 14, 30, 60, 100, 365 days), trigger an
animated celebration (CSS confetti, streak pill glow). Achievements persist
and display as badges.

**Why:** Cheap gamification that delivers dopamine. Milestone thresholds
align with habit formation research: 7 days = initial commitment, 21-30 =
habit forming, 66 = automaticity. Persistent achievements give users
something to look back on.

**Scope:**
- New `achievements` array in data store
- Lightweight CSS/canvas confetti (no library)
- Achievement badge count in `HabitRow`

**Effort:** Low-Medium | **Dependencies:** None

---

## Sprint 4 — Insights & Reflection (Medium-High Effort)

Features that turn raw data into personalized understanding.

### 18. Insights Engine (Pattern Detection)

**What:** Auto-detect behavioral patterns and surface them as plain-English
insights:
- "You complete Reading 90% on weekdays but only 30% on weekends"
- "Your most consistent day is Tuesday"
- "Exercise and Meditation are correlated — you tend to do both or neither"
- "Your habits decline in the last week of each month"

**Why:** Users rarely analyze their own data. Plain-language insights deliver
the "aha moment" directly. This is the feature that makes users say "this
app knows me." No AI/LLM needed — simple statistics (day-of-week analysis,
co-occurrence, rolling averages) are sufficient and explainable.

**Scope:**
- New `generateInsights()` module with pattern detectors
- `<InsightsPanel>` component on dashboard or dedicated tab
- All computed client-side from existing data, no backend changes
- Needs 30+ days of data to be meaningful

**Effort:** Medium-High | **Dependencies:** None

---

### 19. Mood & Energy Correlation

**What:** Optional daily mood (emoji, 1-5) and energy level (1-5) check-in.
Over time, surface correlations: "Your mood averages 4.2 on days you
exercise vs. 2.8 on days you don't."

**Why:** Transforms the app from a tracker into a self-knowledge tool. Users
see not just *what* they did but *how it affected them*. This creates a
powerful feedback loop and provides early warning when energy/mood trends
predict habit dropout.

**Scope:**
- New `dailyCheckins` data collection
- `POST /api/checkins`, `GET /api/checkins`
- Check-in widget above habit table
- `<CorrelationInsights>` component

**Effort:** Medium-High | **Dependencies:** Pairs well with #18

---

### 20. Weekly Review Wizard

**What:** A guided weekly reflection flow:
1. "Here's your week" — auto-generated summary
2. "What went well?" — highlights best streaks
3. "What was hard?" — highlights misses
4. "Adjust anything?" — modify/pause/drop habits
5. "Intention for next week" — stored, shown Monday morning

**Why:** Passive tracking without reflection is like collecting data without
reading the report. A guided wizard with pre-filled data takes <2 minutes
and delivers high-value self-awareness. The stored intention bridges weeks.

**Scope:**
- New `weeklyReviews` data in store
- `POST /api/reviews`, `GET /api/reviews/latest`
- Multi-step modal component, Monday intention banner

**Effort:** Medium | **Dependencies:** Benefits from #1 (dashboard stats)

---

### 21. Reports Page (Aggregated Analytics)

**What:** Dedicated page with per-habit and overall charts: completion rate
trends, best/worst days, habit ranking by consistency, streak history over
time.

**Why:** The daily view optimizes for *doing*; the report optimizes for
*reflecting*. Weekly/monthly perspective helps users adjust strategy.

**Scope:**
- New `<ReportPage>` component
- Lightweight chart rendering (canvas or SVG, no heavy library)
- All data derived from existing logs

**Effort:** Medium | **Dependencies:** None

---

## Sprint 5 — Platform & Infrastructure

### 22. Keyboard Shortcuts & Command Palette

**What:** `j/k` to navigate habits, `Space` to toggle today, `n` for new
habit, `Cmd+K` opens command palette for search, jump-to-date, filter, etc.

**Why:** Power users interact daily. Reducing the most common action from
3 clicks to 1 keystroke compounds over hundreds of sessions.

**Effort:** Low-Medium | **Dependencies:** None

---

### 23. Micro-Habits & Partial Completion

**What:** Instead of binary yes/no, allow 25/50/75/100% completion levels.
"Exercise" — walked 10 min (25%) vs. full gym (100%). Any level ≥25% keeps
the streak alive; health scores weight by level.

**Why:** All-or-nothing is the second biggest reason habits fail. On a
low-energy day, doing the minimum viable version ("just put on shoes") is
better than skipping entirely. Based on BJ Fogg's Tiny Habits research.

**Scope:**
- Change logs from `string[]` to `{ date, level }[]`
- Long-press menu for level selection
- Visual encoding: opacity/fill in day cells
- **Breaking schema change**

**Effort:** High | **Dependencies:** Schema migration (combine with #16
notes migration)

---

### 24. Multi-User Authentication

**What:** Simple login system (username + password or magic link) with
per-user data isolation.

**Why:** Currently single-user with no auth. Required for any shared
deployment. However, for personal self-hosted use, this is unnecessary —
defer until the app targets public deployment.

**Scope:** Large — user model, bcrypt, JWT/sessions, middleware, data
isolation. Consider SQLite migration at this point.

**Effort:** High | **Dependencies:** #25 (database)

---

### 25. SQLite Database Migration

**What:** Replace `data.json` with SQLite (via `better-sqlite3`).

**Why:** JSON file + mutex works for single user with <100 habits but
doesn't scale. File I/O becomes a bottleneck under concurrent access.
SQLite adds efficient date-range queries (for heatmap, insights), ACID
transactions, and indexing — all with zero external infrastructure.

**Scope:** Large — rewrite data layer, migration script, update all tests.

**Effort:** High | **Dependencies:** None, but enables #24

---

### 26. PWA & Offline Support

**What:** Service worker, add-to-home-screen, offline toggle with background
sync on reconnect.

**Why:** Habit tracking is a mobile-first, daily ritual. PWA makes the web
app feel native. Offline is critical for common usage moments (gym, commute,
airplane).

**Scope:** Service worker, cache strategy, IndexedDB offline queue, sync
logic.

**Effort:** Medium-High | **Dependencies:** None

---

### 27. iCal Feed Export

**What:** Generate a subscribe-able `.ics` feed URL showing completions as
calendar events. Works with Google Calendar, Apple Calendar, etc.

**Why:** Many users live in their calendar. Seeing "Meditated" alongside
meetings creates a holistic day view. If calendar is shared, habits become
passively visible to accountability partners.

**Effort:** Medium | **Dependencies:** Ideally paired with #24 (auth tokens
for feed URLs)

---

## New Feature Proposals (Not Previously Documented)

### N1. Focus Mode / "Today" View

**What:** A simplified view showing only today's uncompleted habits as a
vertical checklist — no table, no 14-day grid, no archived clutter. Just:
"Here's what's left today. Check them off." Toggle between Full View and
Focus Mode in the header.

**Why:** The 14-day table is great for reviewing progress but is overwhelming
for the daily check-in moment. Focus Mode answers the one question users have
when they open the app: "What do I still need to do today?" This is
particularly valuable on mobile where the table scrolls horizontally. It
also serves as a natural "quick entry" mode for users who just want to check
off and close.

**Scope:**
- New `<FocusView>` component: vertical list, large toggle buttons, habit
  color + name only, "All done!" celebration state
- View toggle in header: Table | Garden | Focus
- Reads existing data, no backend changes

**Effort:** Low | **Dependencies:** None

---

### N2. Time-of-Day Tracking & Optimal Time Discovery

**What:** Silently record the timestamp when a habit is toggled (not just the
date). Over time, show per-habit patterns: "You usually complete Meditation
at 7:15 AM" and "You complete Exercise most consistently when done before
10 AM." Surface this as a small "Best time" indicator per habit.

**Why:** When you do a habit matters almost as much as whether you do it.
A user who exercises at 6 AM has a wildly different consistency profile than
one who "plans to do it later." Surfacing optimal times helps users design
their schedule around proven patterns. This costs almost nothing to collect
(a timestamp on toggle) but enables powerful insights later.

**Scope:**
- Store `toggledAt: ISO timestamp` alongside date in logs (additive, not
  breaking — old entries just lack it)
- New `calculateOptimalTime()` utility
- Small "Usually at [time]" label in `HabitRow`

**Effort:** Low-Medium | **Dependencies:** None

---

### N3. Habit Difficulty Progression (Auto-Scaling)

**What:** When creating a habit, optionally set a "starter version" and a
"target version" (e.g., Starter: "Meditate 2 min", Target: "Meditate 20
min"). After 14 consecutive days at the current level, the app suggests
leveling up. Users can accept, snooze, or dismiss.

**Why:** Based on the "2-Minute Rule" from *Atomic Habits*: make the habit so
easy you can't say no, then scale up as it becomes automatic. Currently
users either set ambitious targets (and fail) or easy ones (and plateau).
Auto-scaling bridges that gap by timing the progression prompt to when the
habit is established.

**Scope:**
- Add optional `progression: { starter, target, currentLevel, leveledUpAt }` to Habit
- Prompt component when 14-day condition is met
- Accept → update habit name/description, snooze → check again in 7 days

**Effort:** Medium | **Dependencies:** None

---

### N4. "Don't Break the Chain" Calendar View

**What:** A dedicated per-habit view showing a full month as a grid of
linked chain icons. Completed days are solid chain links; the visual chain
snaps visibly at missed days. The unbroken segment is highlighted/glowing.

**Why:** Jerry Seinfeld's "Don't Break the Chain" method is one of the most
popular habit frameworks. The current 14-day grid shows this implicitly,
but a dedicated chain visualization makes it visceral and emotional. Seeing
a long chain of links creates a stronger psychological aversion to breaking
it than seeing a number ("Streak: 23").

**Scope:**
- New `<ChainView>` component, per-habit expandable
- CSS chain-link icons with snap/break animation
- Reads existing log data

**Effort:** Medium | **Dependencies:** None

---

### N5. Habit Accountability Pacts

**What:** Per-habit, set a self-accountability rule: "If I miss [Habit] more
than [N] times in [period], show me this message: [custom text]." The custom
message appears as a prominent banner. Examples: "Remember why you started —
your health matters" or "You promised yourself you'd do this."

**Why:** Self-set consequences (even symbolic ones) dramatically increase
follow-through. Research on "commitment devices" shows that the act of
writing down a consequence — even one with no external enforcement — changes
behavior. This is lightweight to build but psychologically potent. No social
features or auth needed.

**Scope:**
- Add optional `pact: { maxMisses, period, message }` to Habit
- Check condition on each page load, display banner if triggered
- Small pact setup form in habit settings

**Effort:** Low-Medium | **Dependencies:** None

---

### N6. Best Day / Personal Records Tracker

**What:** Auto-annotate the calendar with the user's personal best day (most
habits completed) and track personal records: longest streak per habit,
best day ever, best week ever. Show records in a dedicated "Records" section.

**Why:** Gamification without the game. "You just had your best day ever —
8/8 habits completed!" feels earned, not manufactured. Personal records
create a sense of progression that complements streaks. Pure derived state,
extremely cheap to implement.

**Scope:**
- New `calculatePersonalRecords()` utility
- Records badges in dashboard
- "New record!" toast when triggered

**Effort:** Low | **Dependencies:** None

---

### N7. Habit Drag & Drop Reordering

**What:** Drag habits to reorder them in the table, with order persisted.

**Why:** Users naturally prioritize: morning habits at top, evening at
bottom. Currently ordered by creation date, which is useless long-term.

**Scope:**
- Add `sortOrder: number` to Habit
- `PATCH /api/habits/reorder` endpoint
- Native HTML Drag API or lightweight `@dnd-kit/core`

**Effort:** Medium | **Dependencies:** None

---

### N8. Browser Notifications (Reminders)

**What:** Users set a preferred time for each habit. At that time, a browser
notification fires: "Time to [Habit Name]!" Also show "pending today"
indicators in the UI for habits with a set time that hasn't passed yet.

**Why:** Forgetting is the #1 reason habits fail. Even a simple "You
haven't checked in 3 habits today" notification at 8 PM dramatically
improves follow-through.

**Scope:**
- Add `reminderTime: string | null` to Habit
- Browser Notification API permission request + scheduling
- "Pending" badge in HabitRow

**Effort:** Medium | **Dependencies:** None

---

## Priority Matrix

```
                    Low Effort          Medium Effort          High Effort
                    ──────────          ─────────────          ───────────
High Impact    ★★★  #1 Health Score     #7 Rest Days           #25 SQLite
                    #2 Recovery Panel   #9 Streak Shields      #23 Micro-Habits
                    #5 Undo Toast       #14 Habit Stacking     #24 Auth
                    N1 Focus Mode       #18 Insights Engine
                    N6 Personal Records

Med Impact     ★★   #3 Unarchive        #8 Categories          #26 PWA
                    #4 Sunset Prompts   #10 Export/Import      #16 Notes
                    #6 Theme Toggle     #12 Garden View
                    #17 Milestones      #13 Heatmap
                    N2 Time Tracking    #15 Experiments
                                        N3 Difficulty Prog.
                                        N4 Chain View
                                        N7 Drag & Drop

Lower Impact   ★    #22 Keyboard        N5 Pacts               #27 iCal
                    Shortcuts           N8 Notifications
                    #11 Templates       #19 Mood Correlation
                                        #20 Weekly Review
                                        #21 Reports Page
```

---

## Recommended Implementation Roadmap

```
Sprint 1 (Quick Wins — ~1 week)
├── #1  Health Score               ← Core motivation upgrade
├── #2  Failure Recovery Panel     ← Streak break safety net
├── #3  View & Restore Archived    ← Fix usability gap
├── #5  Undo Toast                 ← Mobile mis-tap prevention
├── #6  Theme Toggle               ← Quick polish
└── N6  Personal Records           ← Free gamification

Sprint 2 (Model Improvements — ~2 weeks)
├── #7  Smart Rest Days            ← Fixes the data model
├── #8  Categories & Filtering     ← Scales the habit list
├── #9  Streak Shields             ← Retention mechanic
├── #10 Data Export/Import         ← Data trust
├── #11 Templates                  ← Onboarding
└── N1  Focus Mode                 ← Daily UX improvement

Sprint 3 (Visual & Emotional — ~2 weeks)
├── #12 Garden Visualization       ← Brand identity feature
├── #13 Monthly Heatmap            ← Long-term visibility
├── #14 Habit Stacking             ← Routine modeling
├── #15 Experiments (30-Day)       ← Lower commitment barrier
├── #17 Milestones & Celebrations  ← Dopamine hits
└── N4  Chain View                 ← Visceral streak display

Sprint 4 (Insights — ~2 weeks)
├── #18 Insights Engine            ← Pattern detection
├── #20 Weekly Review Wizard       ← Reflection loop
├── #21 Reports Page               ← Aggregated analytics
├── N2  Time-of-Day Tracking       ← Optimal time discovery
├── N3  Difficulty Progression     ← Auto-scaling
└── N5  Accountability Pacts       ← Commitment device

Sprint 5 (Infrastructure — ~3 weeks)
├── #25 SQLite Migration           ← Foundation for scale
├── #24 Multi-User Auth            ← Shared deployment
├── #26 PWA & Offline              ← Mobile experience
├── #22 Keyboard Shortcuts         ← Power user polish
├── #16 Notes + #23 Micro-Habits   ← Combined schema migration
└── N7  Drag & Drop + N8 Reminders ← Finishing touches
```

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Health Score before Garden View | Fix the metric first (Sprint 1), then visualize it (Sprint 3). |
| Rest Days before Micro-Habits | Rest Days fix the frequency model; Micro-Habits change the completion model. Fix the model first. |
| No AI/LLM for insights | Deterministic statistics are explainable and trustworthy. Users need to understand *why* the app says something. |
| Client-side computation | Keeps backend simple. Insight and score computation is not performance-critical for <100 habits. |
| Focus Mode as a new view | The table is feature-rich but not optimized for the most common action (daily check-in). A dedicated mode reduces cognitive load. |
| Chain View separate from Heatmap | Different psychological purpose: chain is about *not breaking*, heatmap is about *long-term pattern*. Both are useful. |
| Templates as static data | No need for a template CRUD system. A JSON array of curated presets is sufficient and zero-maintenance. |
| SQLite over Postgres | Zero-config, file-based, matches the app's single-server simplicity. Clear upgrade path exists. |
| JSON storage for now | Sufficient for single-user MVP. Database migration deferred to Sprint 5 with auth. |
| Streak Shields earned, not purchased | No monetization mechanics. Shields are earned through consistency, reinforcing the behavior loop. |
