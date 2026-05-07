# Habit Garden — Feature Roadmap & Implementation Plan

> **This document supersedes all prior planning docs** (FEATURES.md, NEW_FEATURES.md,
> FEATURE_PROPOSALS.md, BACKLOG.md, FEATURE_PLAN.md, FEATURE_PLAN_v3.md).
> Those files are preserved as historical reference.
>
> Last updated: 2026-05-07

---

## 1. Honest Assessment

### What Exists (MVP)
~960 lines of working code: Habit CRUD, daily/weekly toggle, 14-day grid,
streak calculation, dark theme, optimistic updates, toast notifications,
JSON persistence with async mutex, 17 backend tests.

### The Planning Problem
Six planning documents propose 55+ features. Each document critiques the
previous ones, adds new features, and attempts to consolidate — creating
more overlap. The result: **more words about features than lines of actual
code** and zero features shipped beyond the MVP.

**Diagnosis:** The bottleneck is not ideas. It's building.

This document takes a different approach:
1. Five genuinely new features that no prior document covers
2. A cherry-picked "Build Next" list from the best of the 55+ existing proposals
3. A ruthlessly short roadmap (3 sprints, not 6)
4. Each sprint ends with a shippable product, not a planning milestone

---

## 2. New Feature Proposals

These five features fill gaps that all 55+ prior proposals miss entirely.

---

### NEW-1: The Actual Garden (Visual Habitat for Habits)

**What:** The app is called "Habit Garden" but has zero garden metaphor in
the UI. This feature replaces the static header area with a small interactive
garden visualization where each active habit is a plant:

| Habit State | Plant Visual |
|-------------|-------------|
| New (0-7 days) | Seed / bare soil patch |
| Building (8-21 days) | Small sprout with 1-2 leaves |
| Established (22-66 days) | Leafy plant / small bush |
| Automatic (67+ days) | Full tree or flowering plant |
| Missed today (at risk) | Slightly wilted / drooping |
| Streak broken | Withered (recovers as you rebuild) |
| Frozen/paused | Snow-covered / dormant |

The garden sits above the habit table and uses the habit's assigned color
for the plant. Clicking a plant scrolls to that habit's row.

**Why this is the most obvious missing feature:**
The app's name, tagline ("Grow tiny daily habits into big changes"), and
conceptual framing all promise a garden metaphor. But the actual UI is a
generic table with checkmarks. The garden visualization:
- Makes the app **instantly memorable** and differentiated from every other
  habit tracker (which all look like spreadsheets)
- Creates **emotional attachment** — users don't want to let their garden
  wilt, which is a more natural motivation than "don't break the streak"
- Absorbs Momentum Stages (N3) into a visual system rather than text badges
- Works as the app's **identity** — screenshots of the garden are shareable
  and distinctive

**Why no prior document proposes this:**
All 6 docs focus on data features (metrics, scores, alerts, analytics). None
question whether the app's fundamental visual metaphor is actually present.
Streak Weather (C5) changes the background gradient, but that's ambient
decoration — this is the core identity of the product made real.

**Implementation:**
- Frontend: `<Garden />` component using SVG or CSS illustrations
- Each plant is a simple SVG with 4-5 states (can start with CSS-only shapes)
- Plant state derived from existing log data (same logic as streak calculation)
- Responsive: on mobile, garden becomes a horizontal scrollable strip
- No backend changes — purely derived from existing data
- Start simple: colored circles that grow larger with streak length. Iterate
  toward plant illustrations later.

**Effort:** Medium (SVG/CSS art is the main cost, logic is trivial)
**Dependencies:** None

---

### NEW-2: Habit Seasons (Cyclical / Temporary Habits)

**What:** Habits can be marked as "seasonal" with an active date range that
recurs annually:

- "Swimming" → Active May-September
- "Ski" → Active December-March
- "Garden (actual garden)" → Active April-October
- "Holiday prep" → Active November-December

Seasonal habits automatically hibernate outside their active window:
- They disappear from the daily view (not archived — dormant)
- Streaks pause during hibernation and resume when the season returns
- A "Returning soon" indicator appears 1 week before a season starts
- End-of-season summary: "Swimming season complete! 78% consistency over 5 months."

**Why this matters:**
Every existing feature models habits as year-round commitments. But real life
is seasonal. A user who swims all summer shouldn't have to archive "Swimming"
in October and recreate it in May — losing all historical data each time.

The current options are:
- **Archive** → Loses the habit from the active view, feels like quitting
- **Freeze (D8)** → Manual, must remember to freeze and unfreeze
- **Just leave it** → Streak breaks, completion rate drops, warnings fire

Seasons automate the lifecycle. The habit knows when it's relevant and when
it's not. This is particularly valuable in temperate climates where outdoor
activities, sports, and routines change with the calendar.

**Implementation:**
- Schema: Add `season: { startMonth: 1-12, endMonth: 1-12 } | null` to Habit
- Backend: Accept and persist the field
- Frontend: Season selector in HabitForm (two month dropdowns, collapsed by default)
- Frontend: Filter seasonal habits from daily view when outside their window
- Frontend: "Returning soon" badge 7 days before season starts
- Utils: Update streak calculation to skip out-of-season months
- Utils: `isInSeason(habit, today)` check

**Effort:** Low-Medium
**Dependencies:** None

---

### NEW-3: Quick Capture Bar (Always-Visible Daily Toggle)

**What:** A persistent bottom bar (mobile) or floating sidebar (desktop)
showing today's uncompleted habits as small colored chips. Tapping a chip
toggles it complete (turns it green with a checkmark) without scrolling
the main table.

The quick capture bar is visible on every view/page the app may have in
the future (garden, heatmap, reports). It ensures the primary action
(toggle today's habits) is always one tap away.

**On mobile:** Fixed bottom bar with horizontally scrollable habit chips.
Each chip shows the habit's color + first 2-3 letters of the name. Tap to
toggle. Swipe up to expand and see full names.

**On desktop:** Floating pill in the bottom-right corner showing
"3 remaining" with a click-to-expand panel listing today's habits.

**Why this matters:**
The current UI requires users to scroll a 14-column table to find today's
column, then click small cells for each habit. This is acceptable for review
but too friction-heavy for the core action: marking habits done.

Today View (N1) proposes a separate view mode. Quick Capture is different:
it's a **persistent overlay** that works on top of any view. You don't switch
modes — the toggle is always available.

This matters because habit check-ins happen in stolen moments (waiting for
coffee, between meetings, in bed). The interaction should be: open app →
tap tap tap → done in 5 seconds. The quick capture bar makes that possible
without sacrificing the 14-day grid for users who want the full view.

**Implementation:**
- Frontend: `<QuickCapture />` fixed-position component
- Reads from existing `habits`, `logs`, and `toggle` function
- Shows only non-archived habits that haven't been completed today
- Disappears when all today's habits are complete (celebratory micro-animation)
- Position: `position: fixed; bottom: 0` on mobile, floating pill on desktop
- No backend changes

**Effort:** Low-Medium
**Dependencies:** None

---

### NEW-4: Streak Milestones & Trophy Wall

**What:** A permanent, accumulating collection of milestone achievements:

**Milestone tiers (per habit):**
- 7 days → "First Week" (bronze)
- 21 days → "Three Weeks" (silver)
- 30 days → "One Month" (gold)
- 66 days → "Automatic" (platinum) — based on Lally's habit formation research
- 100 days → "Century" (diamond)
- 365 days → "Full Year" (rainbow)

**Global milestones:**
- "First Habit" — created your first habit
- "Full House" — completed all habits in a single day for the first time
- "Perfect Week" — 100% completion for 7 consecutive days
- "Comeback" — rebuilt a streak to 7+ after it broke
- "Gardener" — tracking 5+ active habits simultaneously

When a milestone is earned, show a brief celebration animation (confetti burst
or plant blooming, 2-3 seconds). The Trophy Wall is a dedicated page showing
all earned milestones with the date they were achieved.

**Why this matters AND why it's not gamification:**
The v1 FEATURES.md decision log explicitly rejects "gamification (XP, levels)"
because it "risks extrinsic motivation replacing intrinsic." This is correct —
XP systems are arbitrary and addictive.

Milestones are different. They mark **real behavioral achievements**, not
arbitrary point totals. "You've meditated for 66 consecutive days" is a
factual statement about your behavior, not a game mechanic. The 66-day
milestone specifically corresponds to the scientifically-measured average
time for habit automaticity (Lally et al., 2010).

The trophy wall creates a **permanent record of growth** that persists even
after streaks break. Personal Records (N10) proposes showing "best streak"
numbers. The Trophy Wall is the emotional, visual version: not "your best
was 45" but a wall of bronze → silver → gold badges showing the journey.

**Implementation:**
- Utils: `checkMilestones(habits, logs)` — scan for newly earned milestones
- Storage: `earnedMilestones` array in data.json:
  `{ id, habitId?, type, earnedAt, habitName? }`
- Backend: Milestone check runs on each toggle, new milestones saved
- Frontend: `<TrophyWall />` page showing all milestones in a grid
- Frontend: `<MilestoneToast />` celebration shown when a new milestone is earned
- Frontend: CSS confetti animation (no library needed — pure CSS keyframes)

**Effort:** Medium
**Dependencies:** None

---

### NEW-5: Habit Journal (Daily One-Liner)

**What:** An optional daily text field (max 140 characters) attached to the
day itself (not to individual habits). One entry per day, surfaced as a
timeline:

> **May 7:** "Tough day at work but still got my run in"
> **May 6:** "Everything clicked today. Great morning routine."
> **May 5:** "Skipped exercise — knee is acting up"

Journal entries appear in the 14-day grid as small dot indicators on days
that have entries. Hovering/tapping reveals the note. They also appear in
any future heatmap, report, or narrative view.

**Why this is different from Habit Notes (#6) and Progress Proof (C4):**
- Habit Notes (#6): attached to a specific habit on a specific day. "Ran 5k."
- Progress Proof (C4): structured evidence with numeric tracking. "Bench: 135 lbs."
- Habit Journal: attached to the **day itself**. Context for everything.

The journal captures the *why behind the data*. Six months from now, a
heatmap showing a red week tells you nothing. A journal entry saying
"Sick with flu all week" explains everything. This transforms historical
data from meaningless patterns into a story.

The 140-character limit is intentional. This is a micro-journal, not a diary.
Longer entries would make users skip it. Short entries ("great day", "felt
tired", "vacation") take 5 seconds and provide 90% of the context value.

**Implementation:**
- Schema: New `journal` object in data.json: `{ [date: string]: string }`
- Backend: `POST /api/journal` accepting `{ date, text }` (upsert)
- Backend: Journal data returned with `GET /api/habits` (or separate endpoint)
- Frontend: Small text input below the date header in the habit table
- Frontend: Dot indicator on days with entries, tooltip on hover
- Frontend: `<JournalTimeline />` component for viewing past entries

**Effort:** Low-Medium
**Dependencies:** None

---

## 3. Curated "Build Next" List (from existing 55+ proposals)

From the mountain of existing proposals, these are the highest-impact,
lowest-risk features to build. Selected for: no external dependencies,
minimal schema changes, and immediate user-visible value.

### Must-Build (before any other existing proposals)

| Priority | Feature | Source | Why It's First |
|----------|---------|--------|---------------|
| 1 | **G1: Edit Habit** | BACKLOG | Can't change name/color/frequency without deleting. Data-loss risk. |
| 2 | **G2: View/Restore Archived** | BACKLOG | Archived habits vanish forever. No review, no undo. |
| 3 | **#3: Undo Toast** | FEATURES | UX standard. One mis-tap destroys a streak. |
| 4 | **N7: Auto-Backup** | BACKLOG | Single JSON file = single point of failure. Protect data first. |
| 5 | **#14: Theme Toggle** | FEATURES | Trivial (CSS vars exist), high-polish perception. |
| 6 | **F2: Health Score** | NEW_FEATURES | Composite 0-100 score is more honest than fragile streaks. |
| 7 | **F4: Failure Recovery** | NEW_FEATURES | Reframe streak breaks as recoveries, not failures. |
| 8 | **#1: Dashboard Stats** | FEATURES | Aggregated view: completion rate, active habits, best streak. |
| 9 | **#4: Data Export** | FEATURES | User data ownership. Manual backup. Ship before model gets complex. |
| 10 | **F5: Smart Rest Days** | NEW_FEATURES | Fixes the fundamental "daily or weekly" limitation. |

### Should-Build (after must-build)

| Feature | Source | Why |
|---------|--------|-----|
| G3: Onboarding/Empty State | BACKLOG | New users see nothing helpful. |
| G4: Mobile Responsive | BACKLOG | 14-day grid overflows on mobile. |
| D5: Focus Mode | V3 | "Less is more" — just show today's checkboxes. |
| D8: Habit Freeze | V3 | Pause without archiving. "Life happens" support. |
| F1: Streak Shields | NEW_FEATURES | Duolingo-proven retention mechanic. |
| F3: Habit Stacking | NEW_FEATURES | Core Atomic Habits concept. |
| #5: Heatmap | FEATURES | Most-requested long-term visualization. |
| F11: Keyboard Shortcuts | NEW_FEATURES | Power-user essential for a daily-use app. |

### Explicitly Deferred (do not build until the above are done)

Authentication, database migration, PWA/offline, social features, iCal
export, import from trackers, reminders, micro-habits/partial completion,
natural language input, reports page, weekly review wizard, correlation
maps, mood tracking, habit chains, time capsule snapshots, power hours.

These are all valid features but none of them matter if the app doesn't
nail the core daily experience first.

---

## 4. Implementation Roadmap (3 Sprints)

### Sprint 1: Make It Usable (1-2 weeks)

**Goal:** Fix the embarrassing gaps. Ship a product you'd recommend to a friend.

```
Backend                              Frontend
──────                               ────────
PATCH /api/habits/:id  (G1)          Edit habit modal (G1)
POST /api/habits/:id/unarchive (G2)  Archived habits section (G2)
Auto-backup on write (N7)            Undo toast with 5s window (#3)
                                     Theme toggle (#14)
                                     Onboarding empty state (G3)
```

**Schema changes:** None.
**New dependencies:** None.
**Definition of done:** A user can create, edit, archive, unarchive, and
delete habits. Accidental toggles can be undone. Data is auto-backed up.
Light/dark theme works.

---

### Sprint 2: Make It Motivating (1-2 weeks)

**Goal:** Replace streak-only motivation with a richer system. Add the
garden visualization that gives the app its identity.

```
Backend                              Frontend
──────                               ────────
GET /api/export (JSON/CSV) (#4)      Health Score badges (F2)
                                     Failure Recovery dashboard (F4)
                                     Dashboard stats panel (#1)
                                     Garden visualization (NEW-1) [v1: simple]
                                     Quick Capture bar (NEW-3)
                                     Milestone celebrations (NEW-4) [basic set]
```

**Schema changes:** None — Health Score, Failure Recovery, and Dashboard
Stats are all derived from existing log data. Milestones stored in data.json
alongside existing data.
**New dependencies:** None.
**Definition of done:** The app has a visual garden, a health score that
replaces raw streak emphasis, a failure recovery screen after streak breaks,
a dashboard overview, data export, a quick toggle bar, and milestone
celebrations. It looks and feels like a unique product, not a generic table.

---

### Sprint 3: Make It Smart (2-3 weeks)

**Goal:** Schema improvements + features that require them. The app
understands your habits better than you do.

```
Backend                              Frontend
──────                               ────────
Frequency model change (F5)          Smart Rest Days UI (F5)
POST /api/journal (NEW-5)            Daily journal one-liner (NEW-5)
Season field on habits (NEW-2)       Seasonal habits UI (NEW-2)
                                     Focus Mode toggle (D5)
                                     Habit Freeze (D8)
                                     Trophy Wall page (NEW-4)
                                     Mobile responsive fix (G4)
```

**Schema changes:** Frequency model (daily/weekly → custom), journal
collection, season field, frozen state fields.
**New dependencies:** None.
**Definition of done:** Habits support custom schedules (weekdays, 3x/week,
seasonal). Users can jot a daily one-liner. Habits can be frozen or set to
seasonal. Mobile experience works. The trophy wall showcases all achievements.

---

## 5. New Feature Reasoning Summary

| Feature | Gap It Fills | Why 55+ Prior Proposals Missed It |
|---------|-------------|----------------------------------|
| **NEW-1: Living Garden** | The app's visual identity | All docs focus on data features. None question whether the "garden" metaphor actually exists in the UI. It doesn't. |
| **NEW-2: Habit Seasons** | Cyclical/temporary habits | All features model year-round habits. Real life is seasonal. Archive/freeze are poor substitutes. |
| **NEW-3: Quick Capture** | Frictionless daily toggle | Today View (N1) proposes a separate mode. Quick Capture is a persistent overlay — always available, no mode-switching. |
| **NEW-4: Trophy Wall** | Permanent achievement record | Personal Records (N10) shows numbers. Trophies are visual, emotional, and persist after streaks break. Grounded in behavioral science (66-day automaticity), not arbitrary gamification. |
| **NEW-5: Habit Journal** | Daily context for historical data | Habit Notes (#6) attach to habits. Progress Proof (C4) is structured evidence. The journal attaches to the *day* — one sentence that explains everything six months later. |

---

## 6. What NOT to Do

1. **Don't write more planning documents.** This is the seventh. Ship code.
2. **Don't build infrastructure before features.** No database migration, no
   auth, no PWA until the core daily experience is excellent.
3. **Don't add AI/ML.** Deterministic logic is explainable and free.
4. **Don't build features that need 60+ days of data.** Correlation maps,
   pattern detection, and adaptive scaling are great — after users have been
   using the app for months. Build retention features first.
5. **Don't optimize for power users before regular users exist.** Keyboard
   shortcuts, command palettes, and NL input are polish. Nail the basics.

---

## 7. Decision Log

| Decision | Rationale |
|----------|-----------|
| 3 sprints, not 6 | A 14-week plan for a 960-line app is over-planning. Ship in 6 weeks, reassess. |
| Garden viz in Sprint 2 | The app's identity feature. More impactful than any metric. |
| Quick Capture over Today View | A persistent overlay beats a separate mode. Users don't switch modes for a 5-second action. |
| Trophy Wall over Personal Records (N10) | Same data, better emotional delivery. Visual achievements > number displays. |
| Journal over Notes (#6) or Proof (C4) | Day-level context > habit-level notes. One field captures 90% of the value. |
| Seasons as a first-class concept | Archive/freeze are workarounds. Seasons model real behavior directly. |
| Smart Rest Days in Sprint 3 | Schema change — batch with other Sprint 3 schema work. |
| Defer all 55+ other proposals | They're valid but premature. Build what's above. Revisit after Sprint 3 ships. |
| Preserve old planning docs as-is | Historical reference. Don't delete or modify — just stop adding to them. |
