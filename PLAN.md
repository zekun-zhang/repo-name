# Habit Garden — Final Plan

> **This is the last planning document.** It replaces FEATURES.md,
> NEW_FEATURES.md, BACKLOG.md, FEATURE_PROPOSALS.md, FEATURE_PLAN.md,
> FEATURE_PLAN_v3.md, and ROADMAP.md. Those files remain as historical
> reference. After this document, we build.

---

## 1. Honest State of Affairs

### What's Built
~960 lines of working code: React 19 + TypeScript + Vite frontend,
Express + JSON file backend. Habit CRUD, daily/weekly toggle, 14-day
history grid, streak calculation, dark theme, optimistic updates, toast
notifications, async mutex, 17 backend tests.

### What's Planned (Too Much)
Seven planning documents propose 55+ features. Each doc critiques the
previous ones, proposes new features, and tries to consolidate —
creating more overlap. Total planning word count exceeds the actual
codebase by roughly 20x.

**The bottleneck has never been ideas. It's execution.**

### What This Document Does Differently
1. Identifies **6 genuinely new features** that all 55+ prior proposals miss
2. Provides a **single prioritized backlog of 24 items** (not 55+)
3. Groups work into **3 build phases** (not 6 sprints)
4. Every item has a clear scope and no ambiguous dependencies

---

## 2. New Feature Proposals

These 6 features address gaps that none of the 7 prior documents cover
at all — verified by full-text review of every existing proposal.

---

### E1: Midnight Grace Period (Streak-Safe Day Boundary)

**What:** A configurable "end of day" time (default: 3:00 AM) for
streak calculations. A habit completed at 12:30 AM counts for the
previous calendar day, not the current one.

**Why every prior doc misses this:**
All 55+ proposals assume days end at midnight. But real human behavior
doesn't follow calendar boundaries. Someone who journals at 12:15 AM
after a late night has their streak broken — even though from their
perspective it's still "today." This is one of the top complaints about
every major habit tracker (Streaks, Habitica, Loop).

The fix is invisible to users who complete habits before midnight and
life-saving for night owls. It's a 10-line utility change that prevents
a deeply frustrating experience.

**Implementation:**
- Storage: `dayBoundaryHour` in localStorage (default 3, range 0-6)
- Utils: Update `todayISO()` to subtract `dayBoundaryHour` hours before
  computing the date string — if current hour < boundary, today = yesterday
- Frontend: Setting in a preferences panel (or just the localStorage default)
- No backend changes — the server stores dates, the client determines
  which date "now" maps to

**Effort:** Very Low (< 1 hour)

---

### E2: Batch Operations (Multi-Select Actions)

**What:** A "select" mode (toggle via button or long-press) that lets
users check multiple habits and perform bulk actions:

- Archive selected (3 habits at once)
- Delete selected
- Freeze selected (when Freeze ships)
- Set tag on selected (when Tags ship)

**Why every prior doc misses this:**
All 55+ proposals treat habits individually. As the list grows past 5-7
items, users need bulk operations. Archiving 4 abandoned habits one by
one with individual confirmation dialogs is tedious. Bulk Freeze (D8)
proposes "freeze all except..." — but no doc proposes general-purpose
multi-select, which is a standard UX pattern for any list interface.

**Implementation:**
- Frontend: `selectedIds: Set<string>` state in App
- Frontend: Checkbox column in HabitTable (visible in select mode)
- Frontend: Floating action bar when selection is non-empty
- Backend: No changes — batch operations call existing endpoints in sequence

**Effort:** Low (2-3 hours)

---

### E3: Habit Duplication (Clone with History Reset)

**What:** A "Duplicate" action on any habit that creates a copy with the
same name (+ " (copy)"), color, frequency, and settings — but with
fresh log history. Useful for:

- Restarting a habit cleanly without losing the original's history
- Creating variations ("Run 3k" → duplicate → rename to "Run 5k")
- Seasonal restart ("Swimming 2025" data preserved, "Swimming 2026" starts fresh)

**Why every prior doc misses this:**
Habit Templates (#12) offers pre-built presets. Edit Habit (G1) allows
changing properties. Neither addresses the use case: "I want a new
version of this exact habit." Currently users must manually recreate
with the same settings, which is error-prone and loses the connection
to the original.

**Implementation:**
- Frontend: "Duplicate" button in row actions (next to Archive/Delete)
- Frontend: Calls existing `addHabit` with copied properties + new ID
- No backend changes beyond existing create endpoint

**Effort:** Very Low (< 1 hour)

---

### E4: Session Habits (Multi-Completion Per Day)

**What:** Habits that can be completed multiple times per day with a
configurable daily target:

- "Drink water" — target: 8x/day, current: 5/8
- "Take medication" — target: 3x/day (morning, afternoon, evening)
- "Pomodoro sessions" — target: 6x/day, current: 4/6

The day cell shows a fill level (like a progress ring) instead of a
binary checkmark. The habit counts as "complete" for streak purposes
when the target is met.

**Why this is different from Micro-Habits / Partial Completion (F9):**
F9 proposes quality levels (25%/50%/75%/100%) for a single completion.
Session habits are about **quantity** — doing the same action multiple
times. "Drink water 8 times" is fundamentally different from "exercise
at 75% intensity." F9 was deferred for breaking schema changes.
Session habits can be modeled more cleanly.

**Why every prior doc misses this:**
All 55+ proposals model habits as binary-per-day (done/not done). But
many real habits are inherently repetitive within a day. Water intake,
medication doses, stretch breaks, prayer times — these aren't "done
once" habits. Forcing them into a binary model means "drink water" is
either "did I drink any water today?" (too easy) or requires 8 separate
habits (absurd).

**Implementation:**
- Schema: Add `dailyTarget: number | null` to Habit (null = binary)
- Schema: Log entries for session habits store count instead of
  presence: `logs[habitId] = ["2026-05-01", "2026-05-01", "2026-05-01"]`
  (3 entries for same date = 3 completions). Alternative: store as
  `{ date: string, count: number }` but this breaks backward compat.
  Simplest: allow duplicate dates in the array — `dates.filter(d => d === today).length`
  gives the count. Toggle becomes "increment" (capped at target).
- Frontend: Progress ring in day cell showing count/target
- Frontend: Tap increments, long-press decrements
- Backend: Toggle endpoint becomes "increment" for session habits
  (add date again if under target, remove one if at target)

**Effort:** Medium (4-6 hours)

---

### E5: Habit Changelog / Audit Trail

**What:** Automatically track when habits are modified:

```
Exercise
  Created: 2026-03-15
  Renamed: "Workout" → "Exercise" on 2026-04-01
  Frequency changed: daily → 3x/week on 2026-04-15
  Archived: 2026-05-01
  Unarchived: 2026-05-03
  Color changed: #6366f1 → #10b981 on 2026-05-05
```

Displayed as a collapsible timeline in an "info" or "details" panel for
each habit. Also visible in future export data.

**Why every prior doc misses this:**
All docs focus on **log data** (when habits were completed). None track
**metadata changes** (when habits were modified). But metadata changes
tell an important story: a habit that's been renamed 3 times and had
its frequency changed twice is a habit the user is still figuring out.
A habit that hasn't been touched since creation is stable.

This also provides data integrity value: if something looks wrong ("why
is this habit suddenly weekly?"), the changelog shows what happened and
when.

**Implementation:**
- Schema: New `changelog` array in data.json per habit or global:
  `{ habitId, action, field?, oldValue?, newValue?, timestamp }`
- Backend: Append to changelog on every mutation (create, edit, archive,
  unarchive, delete, freeze, unfreeze)
- Frontend: `<HabitChangelog />` expandable section in habit detail/edit modal
- Minimal: just append entries on write. No new endpoints — changelog
  is returned with habit data.

**Effort:** Low-Medium (2-3 hours)

---

### E6: Quick-Add Keyboard Shortcut from Anywhere

**What:** A global keyboard shortcut (Ctrl+N or Cmd+K) that opens a
minimal habit creation popover from any state in the app — even if
the user is viewing archived habits, the heatmap, or any future page.
The popover is a single text input + Enter to create with defaults.
Tab to cycle through optional fields (frequency, color).

**Why this is different from Keyboard Shortcuts (F11):**
F11 proposes j/k navigation and space to toggle — navigation and
toggling within the existing table view. E6 is specifically about
**creation** — making the "add habit" action available everywhere
without navigating back to the form. It's the Cmd+K pattern but
focused on creation, not search.

**Why every prior doc misses this:**
The current HabitForm is embedded in the left sidebar. Every future page
(heatmap, trophy wall, reports) would require the user to navigate back
to the main view to add a habit. A global creation shortcut decouples
habit creation from the form's location. This is standard in
productivity apps (Todoist, Linear, Notion) but absent from all 55+
proposals.

**Implementation:**
- Frontend: `<QuickAddPopover />` — fixed-position modal triggered by
  keydown event listener on document
- Frontend: Single input field, Enter creates habit with defaults
  (daily, #6366f1), Tab reveals frequency/color
- Reuses existing `addHabit` from `useHabits`
- No backend changes

**Effort:** Low (1-2 hours)

---

## 3. Consolidated Backlog (24 Items)

Ruthlessly trimmed from 55+ to 24. Features are kept only if they:
(a) fix a real usability problem, (b) are implementable in the current
architecture, and (c) don't substantially duplicate another kept feature.

### Phase 1: Make It Complete (Week 1-2)

Fix every UX gap. After this phase, the app is something you'd
recommend to a friend.

| # | Feature | Source | Effort | What It Fixes |
|---|---------|--------|--------|---------------|
| 1 | G1: Edit Habit | BACKLOG | Small | Can't change name/color/frequency without deleting |
| 2 | G2: View/Restore Archived | BACKLOG | Small | Archived habits vanish with no way back |
| 3 | G3: Onboarding / Empty State | BACKLOG | Small | New users see nothing helpful |
| 4 | #3: Undo Toast | FEATURES | Small | Mis-taps destroy streaks |
| 5 | N7: Auto-Backup | BACKLOG | Small | Single JSON file = single point of failure |
| 6 | #14: Theme Toggle | FEATURES | Small | Light/dark preference, trivial with CSS vars |
| 7 | **E1: Midnight Grace Period** | **New** | **Very Small** | Night owls lose streaks at midnight |
| 8 | **E3: Habit Duplication** | **New** | **Very Small** | No way to clone a habit's settings |
| 9 | **E6: Quick-Add Shortcut** | **New** | **Small** | Habit creation locked to sidebar form |

**Schema changes:** None.
**New dependencies:** None.
**Definition of done:** Users can create, edit, duplicate, archive,
unarchive, delete habits. Toggles can be undone. Data is auto-backed up.
Theme works. Night owls are safe. Creation is fast from anywhere.

---

### Phase 2: Make It Motivating (Week 3-5)

Replace the fragile streak-only motivation model. Add the visual
identity the app's name promises. Make the daily check-in faster.

| # | Feature | Source | Effort | What It Adds |
|---|---------|--------|--------|-------------|
| 10 | F2: Health Score | NEW_FEATURES | Low | Composite 0-100 consistency score |
| 11 | F4: Failure Recovery | NEW_FEATURES | Low | Reframes streak breaks as comebacks |
| 12 | #1: Dashboard Stats | FEATURES | Low | Aggregated overview (completion %, active count) |
| 13 | #4: Data Export (JSON/CSV) | FEATURES | Low | Data ownership + manual backup |
| 14 | P10: Minimum Viable Day | PROPOSALS | Low | "Just do these 3" permission for bad days |
| 15 | D5: Focus Mode | V3 | Low | Hide all metrics, show only today's checkboxes |
| 16 | G4: Mobile Responsive | BACKLOG | Medium | 7-day grid on mobile, 44px tap targets |
| 17 | **E2: Batch Operations** | **New** | **Low** | Multi-select archive/delete |

**Schema changes:** `isMVD: boolean` on Habit.
**New dependencies:** None.

---

### Phase 3: Make It Smart (Week 6-8)

Schema improvements that fix the fundamental frequency model + features
that give the app depth and differentiation.

| # | Feature | Source | Effort | What It Adds |
|---|---------|--------|--------|-------------|
| 18 | F5: Smart Rest Days | NEW_FEATURES | Medium | Custom frequencies (weekdays, 3x/week) |
| 19 | F1: Streak Shields | NEW_FEATURES | Medium | Earned shields for planned misses |
| 20 | #5: Heatmap | FEATURES | Medium | GitHub-style long-term visualization |
| 21 | F3: Habit Stacking | NEW_FEATURES | Medium | Routines with "Complete All" |
| 22 | **E4: Session Habits** | **New** | **Medium** | Multi-completion per day (water 8x) |
| 23 | **E5: Habit Changelog** | **New** | **Low-Med** | Audit trail of habit modifications |
| 24 | F11: Keyboard Shortcuts | NEW_FEATURES | Low-Med | j/k nav, space toggle, / palette |

**Schema changes:** Frequency model, `dailyTarget` field, `changelog` array.
**New dependencies:** None.

---

### Explicitly Deferred (Build Only If/When Needed)

These are all valid features from prior docs. They're deferred because
they either need infrastructure that doesn't exist (auth, database),
need months of accumulated data (correlations, insights engine), or
solve problems users don't have yet (templates before users exist,
import before there's something to import to).

**Infrastructure:** Auth (#10), DB migration (#11), PWA (#15)
**Social:** Social features (#16), iCal export (F12)
**Analytics:** Insights Engine (F8), Correlation Map (N5), Mood (F6/D7),
  Power Hours (P9), Reports Page (#9), Weekly Review (F10)
**Advanced UX:** Natural Language Input (N9), Micro-Habits (F9),
  Habit Chains (P5), Adaptive Scaling (N6), Anti-Habits (P8)
**Visualization:** Streak DNA (N4), Garden (NEW-1), Progress Narrative (D6)
**Meta:** Snapshots (P7), Confidence Calibration (D4),
  Compatibility Advisor (C6), Resource Map (D3), Comeback Engine (D1),
  System Health Monitor (D2), Ritual Builder (C7)

These can be revisited after Phase 3 ships. Many will be naturally
deprioritized once the core experience is solid.

---

## 4. New Feature Reasoning Summary

| Feature | Gap It Fills | Why 55+ Proposals Missed It |
|---------|-------------|---------------------------|
| **E1: Midnight Grace** | Day boundary is wrong for night owls | Every proposal assumes midnight = end of day. Real humans don't. |
| **E2: Batch Operations** | No multi-select on lists | All docs treat habits individually. Standard list UX is absent. |
| **E3: Habit Duplication** | No way to clone settings | Templates (preset library) and Edit (change existing) don't cover "copy this exact habit." |
| **E4: Session Habits** | Habits are binary per day | All 55+ features assume done/not-done. Water 8x, meds 3x, pomodoros — these need counting. |
| **E5: Changelog** | No audit trail | Every doc focuses on completion logs. None track metadata changes (edits, archives, freezes). |
| **E6: Quick-Add** | Creation locked to one view | Every future page (heatmap, trophies) would require navigating back to add a habit. |

---

## 5. Decision Log

| Decision | Rationale |
|----------|-----------|
| 24 features, not 55+ | A backlog you can finish is more useful than one you can't. |
| 3 phases, not 6 sprints | Match planning granularity to team size and codebase complexity. |
| Phase 1 has zero schema changes | Eliminate risk from the first shipment. |
| Garden viz (NEW-1) deferred | It's the splashiest feature but it's visual polish. Fix the data model and UX first. |
| Session habits (E4) over Micro-habits (F9) | Both address "habits aren't binary." Sessions (quantity per day) have cleaner semantics and don't require breaking the log format as severely as partial completion (quality per attempt). |
| Changelog (E5) before Insights (F8) | You need to know what changed before you can explain why metrics changed. |
| Midnight Grace (E1) in Phase 1 | It's 10 lines of code that prevents the most frustrating streak-break scenario. No reason to defer. |
| Deferred all features needing 30+ days of data | Build retention features first. Analytics features need users who've been retained. |
| No new planning docs after this one | Seven is enough. Build. |

---

## 6. What's Next

Pick a phase. Start building. Phase 1 item #1 (Edit Habit) is the
highest-impact, lowest-risk starting point — it requires one new
backend endpoint (`PATCH /api/habits/:id`) and an edit modal in the
frontend.
