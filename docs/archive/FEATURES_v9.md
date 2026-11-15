# Habit Garden — Feature Plan v9: Fresh Dimensions & Execution Reset

**Date:** 2026-10-06
**Supersedes:** FEATURES_v8.md and all prior planning documents
**Status:** New feature proposals + definitive implementation-ready backlog

---

## The Honest Accounting

**Commits:** 20. **Planning documents:** 8. **Features shipped:** 0.
**Lines of planning markdown:** ~4,500+. **Lines of application code:** ~960.
**Planning-to-code ratio:** 4.7:1 (should be inverted).

Prior documents (PLAN.md, v3-v8) mapped 33 behavioral dimensions with
rigorous citations. The research is exceptional. This document does three
things the others did not:

1. Proposes **5 genuinely novel features** targeting dimensions 34-38 — areas
   no prior document touched.
2. Consolidates the **entire backlog** (old + new) into one ranked list with
   hard effort estimates and zero ambiguity.
3. Defines **Session 1** so concretely that it could be copy-pasted into a
   terminal and executed.

---

## Part 1: What's Been Covered (Complete Dimension Map)

33 dimensions across PLAN.md and v3-v8. New proposals MUST target something
outside this list.

| # | Dimension | Source |
|---|-----------|--------|
| 1-28 | Streaks, energy, visual identity, celebration, planning, failure analysis, analytics, relationships, progression, attention, narrative, data mgmt, completion quality, re-engagement, overcommitment, time-of-day, identity, check-in friction, maturity, rate of change, interdependencies, real-time protection, life context, post-completion, pattern shape, recovery, intentional suspension | v3-v7 |
| 29 | Day-of-week temporal patterns | v8 |
| 30 | Within-day completion dynamics | v8 |
| 31 | System-level health composite | v8 |
| 32 | Predictive system-wide decline | v8 |
| 33 | Adaptive difficulty response | v8 |

---

## Part 2: New Feature Proposals (Dimensions 34-38)

### M1. Habit Templates & Starter Packs (Onboarding & Discovery)

**What:** Pre-built habit bundles that new users can install with one click.
Each bundle is a curated set of 3-5 habits with names, frequencies, and
colors already configured.

```
Starter Packs:
┌──────────────────────────────────────────────┐
│ ☀️ Morning Person                            │
│ Wake by 7am · Make bed · 10 min stretch ·    │
│ Healthy breakfast · Journal                   │
│                              [Add all 5]     │
├──────────────────────────────────────────────┤
│ 💪 Fitness Foundations                       │
│ Exercise 30 min · Drink 2L water ·           │
│ Stretch · Track calories                     │
│                              [Add all 4]     │
├──────────────────────────────────────────────┤
│ 📚 Learning Mode                             │
│ Read 20 pages · Practice language ·           │
│ Review flashcards                             │
│                              [Add all 3]     │
├──────────────────────────────────────────────┤
│ 🧘 Mindfulness                               │
│ Meditate 10 min · Gratitude journal ·         │
│ Digital sunset · Deep breathing              │
│                              [Add all 4]     │
├──────────────────────────────────────────────┤
│ 🌙 Evening Wind-Down                         │
│ No screens after 9pm · Read in bed ·          │
│ Prep tomorrow's clothes · Reflect on day     │
│                              [Add all 4]     │
└──────────────────────────────────────────────┘
```

Templates live as static data in the frontend (a JSON array of template
definitions). No backend changes. The "Add all" button calls `addHabit()`
for each habit in the pack, applying a cohesive color palette per bundle.

Users can also cherry-pick individual habits from a template.

**Why this is genuinely novel (Dimension 34: Onboarding & habit discovery):**
Every prior feature assumes the user already HAS habits to track. No feature
addresses the cold-start problem: a new user opens the app, sees an empty
form, and has to invent their own habits from scratch. This is a significant
friction point — the user must simultaneously decide WHAT to track and learn
HOW the app works.

Templates solve both problems at once: they populate the app with
well-designed habits (removing the "what" friction) while demonstrating
how the app works by example (removing the "how" friction).

No prior document (v3-v8) addressed onboarding, discovery, or the empty-
state experience. All 33 dimensions assume an active user with existing
habits and history.

**Behavioral science:** Choice overload / paradox of choice (Schwartz, 2004):
when faced with too many options, people choose nothing. An empty habit
form is infinite choice — the user can type anything. Templates reduce this
to a curated set of proven habit bundles, making the first action effortless.

Default effect (Johnson & Goldstein, 2003): people disproportionately
accept defaults. A template that pre-selects "Morning Person" habits
leverages the default effect — the user's path of least resistance is to
adopt a well-designed habit set rather than building from scratch.

**Data model:** None. Templates are static frontend data. The `addHabit()`
function already handles everything needed.

**Effort:** Small. One JSON data file with 5-6 template definitions (~40
lines), one `TemplatePicker` component shown when `habits.length === 0`,
a loop calling `addHabit()` for each template habit. Estimated: 30-45
minutes.

---

### M2. Habit Notes (Per-Completion Micro-Journal)

**What:** When toggling a habit complete, the user can optionally tap-and-hold
(or click a small note icon) to attach a brief text note to that specific
completion:

```
Exercise  ✓ Oct 5   "Ran 5K — new personal best!"
Exercise  ✓ Oct 4   "Short walk, knee was sore"
Exercise  ✓ Oct 3   (no note)
Exercise  ✗ Oct 2
Exercise  ✓ Oct 1   "Gym session with Alex"
```

Notes are visible in an expanded habit detail view (tap habit name to
expand). They form a chronological micro-journal of that specific habit's
evolution — qualitative data alongside the quantitative check marks.

Notes are optional and never prompted. The UI has a tiny pencil icon next
to each checked day cell; tapping it opens a single-line text input that
auto-saves on blur. Maximum 140 characters.

**Why this is genuinely novel (Dimension 35: Completion context / qualitative tracking):**
Every metric in the app (streaks, completion rates, velocity, DNA patterns)
is quantitative — it measures WHETHER a habit was done, not WHAT the
experience was like. Notes add the qualitative dimension.

The closest prior feature is Daily Micro-Journal (PLAN.md, dimension 12),
which proposes one text entry per DAY. Habit Notes differ fundamentally:
they are per-HABIT and per-COMPLETION. "I ran 5K today" is context for the
Exercise habit, not the entire day. This granularity enables a new kind of
self-knowledge: "What did my best meditation sessions have in common?" —
answerable by scrolling through meditation notes.

Narrative Milestones (dimension 12) are system-generated stories. Habit Notes
are user-written context. Different authorship, different purpose, different
dimension.

**Behavioral science:** Self-monitoring with qualitative annotation (Michie
et al., 2011): self-monitoring is more effective when it includes context
about the monitored behavior, not just occurrence. A note like "only 5 min
but felt calmer" captures the subjective experience that a checkmark cannot,
reinforcing the behavior's perceived value.

Elaborative encoding (Craik & Lockhart, 1972): writing a brief note about
a completed habit requires deeper processing than tapping a checkbox,
strengthening the memory of the behavior and its positive effects. This
deeper encoding makes the habit feel more significant and established.

**Data model:**
```typescript
// Extend HabitLog from string[] to a richer structure
// Migration: string[] stays backward-compatible (notes default to empty)
type HabitLogEntry = {
  date: string
  note?: string
}
// OR simpler: keep logs as string[] and add a separate notes store:
type HabitNotes = {
  [habitId: string]: {
    [date: string]: string  // habitId → date → note text
  }
}
```

The simpler approach (separate notes store) avoids migrating the existing
log format. Notes are stored alongside `habits` and `logs` in data.json.

**Effort:** Small-Medium. New `notes` object in data store, one API endpoint
(`POST /api/notes` with `{habitId, date, text}`), note icon in day cells,
expandable note input. Estimated: 45-60 minutes.

---

### M3. Habit Scheduling (Explicit Expected Days)

**What:** Each habit can optionally specify which days of the week it is
expected. By default, "daily" habits expect all 7 days and "weekly" habits
expect 1 of 7. But users can customize:

```
Exercise:  Mon  Tue  Wed  Thu  Fri  Sat  Sun
           [✓]  [ ]  [✓]  [ ]  [✓]  [ ]  [ ]
           → Expected Mon/Wed/Fri (3 days/week)

Meditation: Every day (default)
Reading:    Weekdays only (Mon-Fri)
```

The scheduling changes three things:

1. **Streak calculation:** Streaks count only expected days. Missing Saturday
   for a Mon/Wed/Fri habit doesn't break the streak.
2. **Completion rate:** Computed against expected days, not all days. A
   Mon/Wed/Fri habit completed 3/3 expected days = 100%, not 3/7 = 43%.
3. **Visual grid:** Non-expected days are dimmed/grayed in the 14-day grid.
   They still allow check-ins (bonus days) but don't count as misses.

**Why this is genuinely novel (Dimension 36: Explicit temporal scheduling):**
This is the most practically important missing feature in the app. Currently,
every "daily" habit expects completion on all 7 days. But most real habits
aren't truly daily — Exercise 3x/week, Reading on weekdays, Meal prep on
Sundays. Forcing these into "daily" creates artificial misses that demoralize
the user.

The critical distinction from related features:
- **Rhythm Detection (dim 29):** PASSIVELY discovers which days a habit
  clusters on. Scheduling ACTIVELY declares which days are expected.
  Detection is insight; scheduling is structure.
- **Rest Day Patterns (PLAN.md):** Proposed "X times per week" as a
  frequency option. Scheduling goes further: it specifies WHICH specific
  days, not just how many. "3x/week" is ambiguous; "Mon/Wed/Fri" is precise.
- **Grace Days (dim 1):** Pre-declared days off that preserve streaks.
  Scheduling is different: non-expected days aren't "days off from a daily
  habit" — they're days the habit was never meant to happen. A Grace Day
  is an exception; a schedule is the rule.

**Behavioral science:** Implementation intentions (Gollwitzer, 1999): "I will
do X on [specific days]" is dramatically more effective than "I will do X
regularly." Specifying the exact days transforms a vague intention into a
concrete plan. The scheduling UI is an implementation intention builder.

Temporal landmarks (Dai, Milkman & Riis, 2014): specific days of the week
serve as temporal landmarks that cue behavior. A habit scheduled for
Mon/Wed/Fri fires on three weekly landmarks instead of competing with an
undifferentiated "every day" expectation.

**Data model:**
```typescript
type Habit = {
  // ... existing fields ...
  scheduledDays?: number[]  // 0=Sun, 1=Mon, ..., 6=Sat. null = every day
}
```

One optional field. Existing habits default to null (every day), maintaining
backward compatibility.

**Effort:** Small-Medium. One field addition, schedule picker UI (7 toggleable
day buttons in the habit form), streak calculation update to skip non-
scheduled days, visual dimming of non-scheduled day cells. Backend: add
`scheduledDays` to habit validation and storage. Estimated: 60-90 minutes.

**Depends on:** Edit Habit (QW1) — users need to set schedules after creation.

---

### M4. Habit Ordering & Pinning (Intentional Arrangement)

**What:** Users can manually reorder their habits via drag-and-drop, and pin
up to 3 habits to the top of the list. Pinned habits are visually distinct
(subtle pin icon, slightly larger row) and always appear first regardless
of sort order.

Ordering is persisted server-side as a `sortOrder` field on each habit.
Pinning is a boolean `pinned` field.

The reordering serves two purposes:
1. **Priority signal:** The top habit is the most important. Users arrange
   habits in the order they want to complete them, creating an implicit
   daily workflow.
2. **Attention management:** Pinned habits are always visible first, even
   when the list is long. This addresses the "scroll past important habits"
   problem that emerges with 7+ habits.

**Why this is genuinely novel (Dimension 37: Intentional spatial arrangement):**
The current app sorts habits by creation date (newest first). The user has
zero control over arrangement. Every prior feature proposal operates on
habit attributes (streaks, scores, schedules) but none addresses the
spatial layout — WHERE habits appear in the list.

The closest prior proposals:
- **Categories/Tags (PLAN.md Phase 7):** Groups habits by life area. But
  categories are organizational, not sequential. A "Health" category doesn't
  say which health habit to do first.
- **Habit Stacking (dim 9):** Chains habits into named sequences. But
  stacking creates a new data structure (chains). Ordering operates on
  the primary list itself. Stacking is "these go together"; ordering is
  "this comes first."
- **The Ratchet / Core Habits (dim 11):** Identifies which habits matter
  most. Pinning gives the user a way to spatially elevate those habits
  without a complex attention-management system.

**Behavioral science:** Serial position effect (Murdock, 1962): items at
the beginning of a list are remembered and acted on more readily (primacy
effect). Allowing users to place their most important habit first leverages
primacy to increase completion of high-priority habits.

Environmental design (Thaler & Sunstein, 2008): choice architecture research
shows that the order of options affects selection. The habit list IS the
user's choice architecture for their day. Letting them design that
architecture (rather than accepting creation-date order) gives them agency
over their own behavioral environment.

**Data model:**
```typescript
type Habit = {
  // ... existing fields ...
  sortOrder?: number   // lower = higher in list. null = end
  pinned?: boolean     // true = always at top
}
```

**Effort:** Small-Medium. Two optional fields, drag-and-drop in the table
(HTML5 drag events or a lightweight library), pin toggle button per row,
sort logic in `useHabits`. Backend: persist sortOrder on reorder, pin/unpin
endpoint. Estimated: 60-90 minutes.

For an even simpler v1: skip drag-and-drop entirely and add up/down arrow
buttons per row. Estimated: 30-45 minutes.

---

### M5. Streak Milestones with Personal Records (Achievement Memory)

**What:** The app tracks and celebrates streak milestones AND remembers the
user's all-time personal records per habit. When a streak hits 7, 14, 30,
60, 90, 180, or 365 days, a milestone badge appears:

```
Exercise          🔥 30 day streak!
                  Personal best: 47 days (achieved Aug 2026)
```

The personal record (PR) persists even when the streak breaks. After a
break, the display changes to show the current streak AND the record to
beat:

```
Exercise          Streak: 5 days
                  Record: 47 days — 42 to go!
```

The "X to go!" framing turns a broken streak from a failure into a
challenge. Instead of "I lost my 30-day streak" the user sees "I'm 42
days from my personal best."

Milestones are logged with their achievement date, creating a timeline of
accomplishments:

```
Exercise Milestones:
  🏅 7 days   — Mar 22, 2026
  🏅 14 days  — Mar 29, 2026
  🏅 30 days  — Apr 14, 2026
  🥇 47 days  — May 1, 2026 (personal record)
```

**Why this is genuinely novel (Dimension 38: Achievement memory / personal records):**
The current app shows streaks as a live counter that resets to zero on a
miss. There is no memory of past achievements. A user who built a 90-day
streak and then missed one day sees "Streak: 0 days" — as if the 90 days
never happened. This is psychologically devastating and factually dishonest.

The closest prior proposals:
- **Completion Sparks (dim 4):** Celebrates the MOMENT of completion. But
  sparks are ephemeral — they flash and disappear. Milestones are permanent
  records.
- **Lifecycle Stages (dim 20):** Tracks behavioral maturity (Seedling →
  Rooted). Stages are about the habit's character; milestones are about
  specific numerical achievements. "This habit is Rooted" vs. "Your longest
  streak was 47 days."
- **Narrative Milestones (dim 12):** System-generated stories about the
  habit's journey. PR tracking is simpler and more concrete — it's a number
  with a date, not a narrative.

The "personal record" framing is the key innovation. It transforms the
post-break experience from "loss" to "challenge." Research on loss aversion
(Kahneman & Tversky) shows that losses hurt ~2x more than equivalent gains.
By reframing a broken streak as "you're X days from your PR," the app
converts a perceived loss into a goal to pursue.

**Behavioral science:** Personal best / self-competition (Locke & Latham,
2002): competing against one's own past performance is one of the most
effective forms of goal-setting. It's inherently calibrated to the
individual's ability (unlike external benchmarks) and creates a clear,
specific target.

Achievement permanence and self-efficacy (Bandura, 1997): knowing that
past achievements are permanently recorded maintains self-efficacy even
during setbacks. "I've done 47 days before — I can do it again" is a
fundamentally different mental state than "Streak: 0."

**Data model:**
```typescript
type Habit = {
  // ... existing fields ...
  personalRecord?: {
    streak: number
    achievedAt: string  // ISO date
  }
  milestones?: Array<{
    days: number
    achievedAt: string
  }>
}
```

Record and milestones are computed/updated whenever a streak is calculated.
If the current streak exceeds the stored record, the record is updated.

**Effort:** Small. Update streak calculation to track max-ever, add
milestone thresholds, display in HabitRow. Backend: persist record and
milestone fields alongside existing habit data. Estimated: 45-60 minutes.

---

## Part 3: Quick Wins (Carried Forward from v8 — Still Not Shipped)

These were identified in v8 as "should have shipped in the first session."
They remain unshipped. They remain prerequisites.

### QW1. Edit Habit
- `PUT /api/habits/:id` with same validation as POST
- Toggle `HabitRow` into edit mode, reuse form fields
- **Effort:** 30-40 minutes
- **Blocks:** M3 (Scheduling), M4 (Ordering), L5 (Effort Autopilot), K5 (Pause Protocol)

### QW2. API Error Handling
- Add `if (!res.ok) throw new Error(...)` to all 5 functions in `api.ts`
- **Effort:** 15 minutes
- **Blocks:** Nothing, but prevents silent data corruption in every feature

### QW3. Unarchive
- `POST /api/habits/:id/unarchive` (sets `archived: false`)
- Collapsible "Archived" section below main table
- **Effort:** 30-40 minutes
- **Blocks:** Nothing directly, but archive is currently a one-way door

---

## Part 4: Dimension Map Update (34-38)

| # | Dimension | Feature | Gap Filled |
|---|-----------|---------|-----------|
| 34 | **Onboarding & habit discovery** | M1: Habit Templates | No prior feature addresses the cold-start / empty-state experience |
| 35 | **Completion context / qualitative tracking** | M2: Habit Notes | All tracking is quantitative (did/didn't). No qualitative dimension |
| 36 | **Explicit temporal scheduling** | M3: Habit Scheduling | Rhythm Detection discovers patterns; Scheduling declares expectations |
| 37 | **Intentional spatial arrangement** | M4: Habit Ordering | No control over where habits appear in the list |
| 38 | **Achievement memory / personal records** | M5: Streak Milestones + PR | Streaks reset to 0 with no memory of past achievements |

### Why these 5 dimensions matter more than further behavioral science

Dimensions 34-38 are **usability and motivation fundamentals** that every
user encounters, versus dimensions 29-33 which are behavioral intelligence
features that require accumulated data and sophisticated computation.

A user who can't reorder their habits (dim 37), can't schedule Exercise as
Mon/Wed/Fri (dim 36), and sees "Streak: 0" after breaking a 60-day run
(dim 38) will abandon the app before they ever benefit from Rhythm
Detection or Slump Radar.

Priority: **fix what hurts before adding what delights.**

---

## Part 5: Definitive Implementation Priority (Single Ranked List)

Every feature from every prior document, ranked once. This is the only
list that matters.

### Tier 0: Fix What's Broken (do these before any feature)

| Rank | ID | Feature | Effort | Notes |
|------|----|---------|--------|-------|
| 1 | QW2 | API Error Handling | 15 min | Bug. Silent failures corrupt state. |
| 2 | QW1 | Edit Habit | 35 min | Prerequisite for 10+ features. |
| 3 | QW3 | Unarchive | 35 min | Archive is currently destructive. |

**Combined: ~85 minutes. Ship all three in one session.**

### Tier 1: Core UX (what users expect from any habit tracker)

| Rank | ID | Feature | Effort | Notes |
|------|----|---------|--------|-------|
| 4 | M3 | Habit Scheduling | 75 min | Most impactful single feature. "Exercise Mon/Wed/Fri" is basic. |
| 5 | M5 | Streak Milestones + PR | 50 min | Transforms the post-break experience. Zero-cost motivation. |
| 6 | M1 | Habit Templates | 35 min | Solves cold-start. One-click value for new users. |
| 7 | M4 | Habit Ordering (v1: arrows) | 35 min | Simple up/down arrows. Drag-and-drop can come later. |

### Tier 2: Daily Experience Upgrades

| Rank | ID | Feature | Effort | Notes |
|------|----|---------|--------|-------|
| 8 | L2 | Completion Momentum | 40 min | "3 of 7 done" progress + Perfect Day detection |
| 9 | L3 | System Score | 60 min | Single 0-100 health number in header |
| 10 | N8 | Completion Sparks | 45 min | Micro-celebrations on completion |
| 11 | M2 | Habit Notes | 55 min | Per-completion micro-journal |

### Tier 3: Behavioral Intelligence

| Rank | ID | Feature | Effort | Notes |
|------|----|---------|--------|-------|
| 12 | L1 | Rhythm Detection | 50 min | Day-of-week pattern analysis. Needs 3+ weeks data. |
| 13 | L4 | Slump Radar | 45 min | Multi-habit decline early warning. Needs 14+ days data. |
| 14 | L5 | Effort Autopilot | 75 min | Auto-downshift failing habits. Needs Edit Habit. |
| 15 | K3 | Habit DNA (v7) | 50 min | Per-habit SVG pattern visualization |

### Tier 4: Depth & Polish

| Rank | ID | Feature | Effort | Notes |
|------|----|---------|--------|-------|
| 16 | N2 | Streak Insurance / Grace Days | 55 min | Pre-declared days off that preserve streaks |
| 17 | N3 | Energy-Aware Check-In | 40 min | Daily energy rating adjusts expectations |
| 18 | K5 | Pause Protocol (v7) | 55 min | Intentional habit suspension |
| 19 | K2 | Ripple Effects (v7) | 45 min | Post-completion outcome tracking |
| 20 | K4 | Recovery Velocity (v7) | 45 min | How fast you bounce back from breaks |

### Tier 5: Aspirational (build when Tiers 0-4 are solid)

| Rank | ID | Feature | Effort | Notes |
|------|----|---------|--------|-------|
| 21 | N1 | Habit Stacking / Chains | 90 min | Link habits into sequences |
| 22 | N4 | Weekly Compass | 80 min | Weekly intention-setting and reflection |
| 23 | N5 | Difficulty Progression | 65 min | Level system per habit |
| 24 | K1 | Life Chapters (v7) | 65 min | Temporal life context framing |
| 25 | M4+ | Drag-and-Drop Reorder | 60 min | Upgrade from arrow buttons to DnD |

### Parked (don't delete, don't schedule)

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | High effort, purely cosmetic. Identity feature for v2. |
| Habit Heartbeat | Needs System Score first. Visual flourish, not core. |
| Seasonal Rhythms | Cosmetic. Low impact. |
| Data Export/Import | Important eventually. Not urgent until users have real data. |
| PWA / Offline | Large effort. Ship when the app is worth using offline. |
| Categories / Tags | Useful at 15+ habits. Most users won't reach that. |
| Narrative Milestones | Needs months of data. Far future. |
| Dashboard / Heatmap | Needs data accumulation. Build after 3+ months of use. |
| Anti-Habits | Niche use case. |
| Accountability Snapshot | Needs social context. |

---

## Part 6: Session-Level Implementation Plan

### Session 1: Fix Everything Broken (Tier 0)

**Goal:** Ship QW1 + QW2 + QW3. Time budget: 90 minutes.

```
Step 1: API Error Handling (QW2) — 15 min
  File: src/api.ts
  Add to each of the 5 fetch functions:
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Request failed: ${res.status}`)
    }

Step 2: Edit Habit Backend (QW1 part 1) — 15 min
  File: server/app.js
  Add PUT /api/habits/:id endpoint:
    - Validate with existing validateHabit()
    - withLock: read data, find habit by id, merge updated fields, write
    - Return updated habit

Step 3: Unarchive Backend (QW3 part 1) — 10 min
  File: server/app.js
  Add POST /api/habits/:id/unarchive endpoint:
    - Same pattern as archive, sets archived: false

Step 4: Frontend — Edit + Unarchive (QW1 + QW3 part 2) — 40 min
  Files: src/api.ts, src/hooks/useHabits.ts, src/components/HabitRow.tsx,
         src/components/HabitTable.tsx
  - Add updateHabit() and unarchiveHabit() to api.ts
  - Add edit() and unarchive() to useHabits hook
  - Return archivedHabits from useHabits
  - Add edit mode toggle to HabitRow (inline name/frequency/color fields)
  - Add collapsed "Archived habits" section in HabitTable with unarchive btn

Step 5: Test manually — 10 min
  - Create habit, edit its name and color, verify persistence
  - Archive a habit, verify it appears in archived section
  - Unarchive it, verify it returns to active list
  - Trigger a server error, verify toast appears (not silent failure)
```

### Session 2: Scheduling + Milestones (Tier 1 core)

**Goal:** Ship M3 + M5. Time budget: 2 hours.

```
Step 1: Habit Scheduling (M3) — 75 min
  - Add scheduledDays to Habit type and server validation
  - Add 7 day-toggle buttons to HabitForm and edit mode
  - Update streak calculation: skip non-scheduled days
  - Update completion rate: divide by expected days only
  - Dim non-scheduled day cells in the grid

Step 2: Streak Milestones + Personal Record (M5) — 45 min
  - Add personalRecord and milestones to Habit type
  - Update streak calculation to track/persist max-ever streak
  - Show PR in HabitRow when streak < record: "Record: 47 — 42 to go!"
  - Show milestone badge when streak hits threshold (7/14/30/60/90)
  - Celebrate with a brief toast on milestone hit
```

### Session 3: Templates + Ordering (Tier 1 remaining)

**Goal:** Ship M1 + M4. Time budget: 70 minutes.

```
Step 1: Habit Templates (M1) — 35 min
  - Create src/data/templates.ts with 5 template bundles
  - Create TemplatePicker component (shown when habits.length === 0)
  - "Add all" button loops addHabit() with template data
  - Each template has a cohesive color palette

Step 2: Habit Ordering with arrows (M4 v1) — 35 min
  - Add sortOrder to Habit type
  - Add up/down arrow buttons to each HabitRow
  - Reorder endpoint: POST /api/habits/reorder with [{id, sortOrder}]
  - Sort activeHabits by sortOrder in useHabits
```

### After Session 3: Pick from the ranked list

Sessions 1-3 ship the 7 most important items (Tiers 0-1). After that,
work down the ranked list in Part 5. Pick the next item. Ship it. Repeat.

---

## Part 7: Feature Interaction Map (New + Best of Prior)

```
M1 Templates ─── onboarding ──→ M3 Scheduling
    │                              │
    │ (new users get habits        │ (templates can include
    │  with schedules pre-set)     │  recommended schedules)
    │                              │
    ▼                              ▼
M4 Ordering ←── priority ───── M5 Milestones
    │                              │
    │ (pin the habit you're        │ (milestones make streaks
    │  trying to set a PR on)      │  meaningful after breaks)
    │                              │
    ▼                              ▼
L2 Momentum ──── feeds ──────→ L3 System Score
    │                              │
    │ (perfect day count is        │ (score uses scheduling-
    │  a score component)          │  adjusted completion rates)
    │                              │
    ▼                              ▼
M2 Notes ←──── enriches ────── L1 Rhythm Detection
    │                              │
    │ (notes on specific days      │ (detection uses scheduled
    │  explain rhythm patterns)    │  days as baseline, not 7/7)
    │                              │
    ▼                              ▼
L5 Autopilot ← triggers ───── L4 Slump Radar
    (auto-downshift failing        (multi-habit decline
     habits, informed by notes     detection informed by
     about WHY completions fail)   scheduling-adjusted rates)
```

---

## Part 8: What Makes This Plan Different

### 1. It addresses the empty-state problem (M1)

No prior plan acknowledged that a new user's first experience is an empty
screen. Templates are the most impactful feature per line of code.

### 2. It adds qualitative tracking (M2)

Every prior feature is quantitative. Notes add the human dimension — why
you did (or didn't do) something. This data becomes invaluable as history
accumulates.

### 3. It fixes the scheduling gap (M3)

The single most requested feature in any habit tracker. "Exercise 3 days a
week" is a basic expectation that the current app cannot express. Everything
downstream (streaks, completion rates, Rhythm Detection, Slump Radar)
becomes more accurate with proper scheduling.

### 4. It respects past achievements (M5)

"Streak: 0 days" after breaking a 60-day run is psychologically destructive.
Personal records transform the post-break experience from devastation to
challenge. This is the highest-ROI motivation feature in the backlog.

### 5. It has a 90-minute Session 1

Not "Phase 1 (3-5 sessions)." Not "Sprint 1 (2 weeks)." One session.
Ninety minutes. Three features shipped. The planning-to-shipping ratio
inverts today.

---

## Appendix: Feature Count by Document

| Document | New Features Proposed | Features Shipped | Net Progress |
|----------|----------------------|-----------------|-------------|
| PLAN.md v1 | ~10 | 0 | 0 |
| PLAN.md v2 | 8 (N1-N8) | 0 | 0 |
| FEATURES_v3 | 3 | 0 | 0 |
| FEATURES_v4 | 5 | 0 | 0 |
| FEATURES_v5 | 6 | 0 | 0 |
| FEATURES_v6 | 5 | 0 | 0 |
| FEATURES_v7 | 5 | 0 | 0 |
| FEATURES_v8 | 5 + 3 QW | 0 | 0 |
| **FEATURES_v9** | **5 + 3 QW (carried)** | **TBD** | **TBD** |
| **Total** | **~55 unique features** | **0** | **0** |

The next commit should not be a planning document.
