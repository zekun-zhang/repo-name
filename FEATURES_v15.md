# Habit Garden — Feature Plan v15: Structural Gaps & Ship-First Backlog

**Date:** 2026-10-17
**Status:** 5 new proposals (G1-G5) addressing data model blind spots + implementation-ready backlog
**Context:** 14 prior documents, 69 proposed features, 0 shipped. This document is the last planning pass.

---

## What 69 Prior Proposals All Share

Every one of the 69 features proposed in v3-v14 operates on the same data model: a habit is a named thing done either "daily" or "weekly", tracked as binary (done/not-done) on calendar dates. The features are creative—streak mechanics, narrative summaries, miss pattern analysis, focus spotlights, command bars—but they all decorate the same underlying structure.

**No proposal questions the structure itself.** Five capabilities that real habit trackers need are impossible under the current data model, no matter how many features are layered on top.

---

## Five Structural Gaps

### G1. Custom Scheduling (Specific Days of the Week)

**The gap:** The app supports only two frequencies: "daily" (every day) and "weekly" (once per week). There is no way to express "Mon/Wed/Fri" or "3 times per week, any days."

**Why it matters:** The most common habit schedules are not daily or weekly:
- Gym: 3-4 days/week on specific days
- Yoga class: Tue/Thu
- Meal prep: Sundays
- Medication: every other day

A user tracking "Exercise" as "daily" sees a broken streak every rest day. They must choose between lying (marking rest days as complete) or accepting a permanently broken streak display. Neither is acceptable.

**What changes:**

```typescript
type Frequency = 'daily' | 'weekly' | 'custom'

type Habit = {
  // ...existing fields
  frequency: Frequency
  scheduledDays?: number[]  // 0=Sun, 1=Mon, ..., 6=Sat. Only when frequency='custom'
  weeklyTarget?: number     // "at least N times per week" (alternative to specific days)
}
```

Streak calculation changes: a "custom" habit's streak counts only scheduled days. Missing Tuesday doesn't break a Mon/Wed/Fri streak. The 14-day grid dims non-scheduled days.

**What it unlocks:** Every streak feature (milestones, recovery, 2-day rule, shields) becomes accurate for the majority of real habits. Pace Tracker (F5) can show "2 of 3 scheduled days done this week" instead of guessing. Miss Pattern Map (E3) can distinguish "missed a scheduled day" from "rest day."

**Effort:** ~45 min. Schema change, updated streak logic, schedule picker in HabitForm, dimmed cells in grid.

---

### G2. Quantitative Habits (Measurable Targets)

**The gap:** Every habit is binary—done or not done. There is no way to track "8 glasses of water" (got 6), "10,000 steps" (walked 7,200), or "read 30 pages" (read 12). Partial progress is invisible.

**Why it matters:** Many valuable habits have a measurable dimension where partial completion is meaningful:
- Water intake: 6/8 glasses is not a failure
- Steps: 7,200/10,000 is 72% progress, not zero
- Pages read: 12/30 is still reading
- Push-ups: 15/30 is still exercise

Binary tracking forces users to set the bar low enough to always fully complete ("drink water" instead of "drink 8 glasses") or accept that partial effort registers as zero. Neither reflects reality.

**What changes:**

```typescript
type HabitKind = 'check' | 'measure'

type Habit = {
  // ...existing fields
  kind: HabitKind             // default: 'check' (backward compatible)
  targetValue?: number        // only when kind='measure'
  targetUnit?: string         // "glasses", "pages", "minutes", "steps"
}

// Log entry for measurable habits stores the value
type LogEntry = string | { date: string; time?: string; value?: number }
```

The grid cell for a measurable habit shows a fill level instead of a checkmark. Completing >= target counts as a full completion for streak purposes. Below target shows the fraction.

```
Water    ████░░░░  6/8 glasses     Streak: 5 days (at target)
Steps    ██████░░  7.2K/10K        Streak: 0 (below target today)
Reading  ████████  30/30 pages     Streak: 12 days
```

**What it unlocks:** Compound Progress (C1) becomes precise—"You've read 4,280 pages this year" from actual tracked values, not estimated. The Weekly Story (F4) can report "Your average water intake rose from 5.2 to 6.8 glasses." Analytics features gain a numeric dimension that binary tracking can never provide.

**Effort:** ~50 min. Schema additions, value input modal on grid cell tap, fill-level display, adjusted streak logic.

---

### G3. Quit/Avoidance Habits (Count-Up Tracking)

**The gap:** Every habit is a positive action to complete. There is no model for tracking avoidance—"days without smoking," "days without junk food," "days without social media." These count up from zero and reset on relapse.

**Why it matters:** Quitting bad habits is as common a goal as building good ones. The motivational mechanics are fundamentally different:
- **Positive habits:** motivation comes from building a streak upward
- **Quit habits:** motivation comes from not resetting a counter to zero

The psychology is loss aversion in its purest form. "47 days without smoking" is a number you desperately don't want to lose. The current app can't express this—you'd have to manually toggle "didn't smoke" every day, which inverts the mental model.

**What changes:**

```typescript
type HabitMode = 'build' | 'quit'

type Habit = {
  // ...existing fields
  mode: HabitMode              // default: 'build'
  quitStartDate?: string       // when the quit counter started
  relapses?: string[]          // dates of resets
}
```

A quit habit displays differently:
```
No smoking     47 days clean     [Reset — I relapsed]
No junk food   12 days clean     [Reset — I relapsed]
```

The "Reset" button is intentionally friction-heavy (confirmation dialog explaining what resets). The relapse history is stored, enabling relapse pattern analysis—which days/weeks are highest risk.

The 14-day grid shows continuous green (clean days) with red markers on relapse dates. Over time, the gaps between relapses should widen—a powerful visual of recovery progress.

**What it unlocks:** Miss Pattern Map (E3) becomes relapse pattern analysis for quit habits. Weekly Story (F4) can say "Your longest smoking-free streak was 47 days in September—you're at 12 now and building." The emotional stakes are different and the narrative features can recognize that.

**Effort:** ~35 min. Schema addition, alternate display mode, reset action with confirmation, relapse tracking.

---

### G4. Habit Tags & Category Views

**The gap:** All habits exist in a flat, unstructured list. Prior proposals mention "categories" (v11) but none design a tagging system that enables grouped views, per-category health scores, and filtered displays.

**Why it matters:** Users with 8+ habits need structure. "Health" habits (exercise, water, sleep) have different rhythms than "Learning" habits (reading, practice, study). A flat list makes it impossible to:
- See "how is my health routine going?" vs "how is my learning routine?"
- Focus on one life area during a difficult period
- Identify which category is strongest/weakest

**What changes:**

```typescript
type Habit = {
  // ...existing fields
  tags?: string[]   // user-defined, freeform, e.g. ["health", "morning"]
}
```

The UI gains:
- Tag chips on habit creation/edit (autocomplete from existing tags)
- Filter bar above the habit table: "All | Health | Learning | Morning | ..."
- Per-tag summary: "Health: 85% this week (3 habits) | Learning: 60% (2 habits)"

Tags are intentionally lightweight—freeform strings, not a managed taxonomy. Users create structure organically. The system suggests existing tags via autocomplete but never enforces categories.

**What it unlocks:** Life Balance Radar (parked in v14) becomes trivial—each tag is a radar axis. Focus Spotlight (F2) can spotlight a tag, not just a habit. Smart Priority (E4) can factor in category balance. The Today Dashboard (D3) can show habits grouped by tag.

**Effort:** ~40 min. Schema addition, tag input component, filter bar, per-tag aggregation.

---

### G5. Habit Templates (Quick-Start Library)

**The gap:** Every habit starts from a blank name field. New users face a cold start—they must know what to track and how to configure it. No prior proposal addresses the onboarding gap.

**Why it matters:** The highest drop-off point for habit apps is the first session. A user who creates 3 well-configured habits in their first minute is 4x more likely to return the next day than one who stares at an empty form (based on published retention data from Habitica and Streaks).

**What changes:**

A "Browse Templates" button next to "Create a habit" opens a curated grid:

```
Popular Templates

  ☀ Morning Routine        🏃 Exercise 30 min       📖 Read 20 pages
    daily, health             3x/week, health           daily, learning

  🧘 Meditate 10 min       💧 Drink 8 glasses       ✍️ Journal
    daily, mindfulness        daily/measure, health     daily, reflection

  🚭 Quit Smoking          💤 Sleep by 11pm          🎸 Practice instrument
    quit mode, health         daily, health             custom: Mon/Wed/Fri
```

Selecting a template pre-fills the form (name, frequency, color, tags, kind, mode). The user can modify anything before saving. Templates are hardcoded in the client—no server endpoint, no user-generated content.

Templates also showcase the new features: "Drink 8 glasses" demonstrates measurable habits, "Quit Smoking" demonstrates quit mode, "Practice instrument" demonstrates custom scheduling. They teach by example.

**What it unlocks:** Immediate demonstration of all habit types. Lower barrier to first habit creation. Consistent naming conventions that improve data analysis later (if many users track "Exercise 30 min", aggregate patterns become meaningful if multi-user is ever added).

**Effort:** ~25 min. Template data array, template grid component, pre-fill form on selection. No server changes.

---

## Why G1-G5 Are Different From Everything Prior

| ID | Feature | What's New | Why 69 Prior Proposals Missed It |
|----|---------|-----------|----------------------------------|
| G1 | Custom Scheduling | Fundamental data model expansion | All proposals assumed daily/weekly is sufficient. It isn't—most real habits run on custom schedules. |
| G2 | Quantitative Habits | New tracking dimension (numbers, not just checkmarks) | All proposals assumed binary completion. Partial progress on measurable goals is invisible. |
| G3 | Quit/Avoidance Mode | Inverted motivational model | All proposals model habits as things you DO. Quitting is about things you DON'T do—different mechanics entirely. |
| G4 | Tags & Categories | Structural organization | Mentioned but never designed. Enables grouped views, category health scores, and is prerequisite for several parked features. |
| G5 | Templates | Onboarding & discovery | All proposals optimize the experience for existing users. Nobody addressed how a new user gets started. |

**The common thread:** G1-G3 expand what a "habit" can be. G4 adds structure to how habits relate. G5 solves the cold start. Together they transform the app from "a binary daily/weekly checkbox tracker" into "a flexible behavior tracking system."

---

## Implementation-Ready Backlog

### Phase 0: Fix the Foundation (~85 min)

These are bugs and missing basics. Ship before anything else.

| # | Item | Est. | Notes |
|---|------|------|-------|
| 0.1 | API error handling | 15 min | Add `if (!res.ok) throw` in all api.ts calls |
| 0.2 | Edit habit | 40 min | PUT endpoint + inline edit UI |
| 0.3 | Unarchive | 30 min | POST unarchive endpoint + archived section |

### Phase 1: Expand the Data Model (~170 min)

These change what the app can represent. Order matters—G1 and G2 affect the most downstream features.

| # | Item | Est. | Depends On |
|---|------|------|------------|
| 1.1 | Custom scheduling (G1) | 45 min | 0.2 (edit needed to change schedule) |
| 1.2 | Quantitative habits (G2) | 50 min | None |
| 1.3 | Quit/avoidance mode (G3) | 35 min | None |
| 1.4 | Tags & categories (G4) | 40 min | 0.2 (edit needed to add tags) |

### Phase 2: Daily Experience (~105 min)

Features that change how the app feels to use every day. All independent.

| # | Item | Est. | Source |
|---|------|------|--------|
| 2.1 | Today Dashboard | 35 min | D3 |
| 2.2 | Pace Tracker | 25 min | F5 |
| 2.3 | Habit templates (G5) | 25 min | G5 |
| 2.4 | Cue anchoring + anchor statement | 20 min | v11 + C3 |

### Phase 3: Engagement & Depth (~175 min)

Features that deepen motivation and provide insight. All independent.

| # | Item | Est. | Source |
|---|------|------|--------|
| 3.1 | Completion timestamps | 25 min | F1 |
| 3.2 | Focus Spotlight | 30 min | F2 |
| 3.3 | Challenge Mode | 40 min | E2 |
| 3.4 | Weekly Story | 45 min | F4 |
| 3.5 | Momentum sparkline | 25 min | C2 |
| 3.6 | Quick Command Bar | 45 min | E5 (defer if mobile-first) |

### Phase 4: Analytics (needs 30+ days of data)

| # | Item | Est. | Source |
|---|------|------|--------|
| 4.1 | Miss Pattern Map | 45 min | E3 |
| 4.2 | Year-at-a-Glance | 45 min | D1 |
| 4.3 | Habit Pair Discovery | 50 min | D4 |
| 4.4 | Smart Priority Queue | 30 min | E4 |

### Parked

| Feature | Reason |
|---------|--------|
| Living Garden View | High effort, needs solid daily use first |
| Streak shields/recovery/2-day rule | Nice-to-have streak variations, not core |
| Habit evolution/morph (F3) | Interesting but niche—most users just edit |
| Accountability Snapshot (E1) | Canvas rendering complexity, defer |
| Data export/import | Important eventually, not daily-use |
| PWA/offline | Separate project |

---

## Critical Path

```
Phase 0 (85 min) ─→ Phase 1 (170 min) ─→ Phase 2 (105 min)
     │                    │                      │
     │                    │                      ▼
     │                    │               Phase 3 (175 min)
     │                    │                      │
     │                    ▼                      ▼
     │              Phase 4 (170 min, after data accumulates)
     │
     ▼
Total to a fully-featured app: ~535 min (~9 hours)
Total to a usable daily-driver: ~360 min (~6 hours, Phases 0-2)
```

The entire backlog—from broken basics to full analytics—is under 9 hours of implementation. Phase 0 + Phase 2 alone (~190 min, ~3 hours) would transform the app from a prototype into a usable daily tool.

---

## The Planning Tax

| Metric | Value |
|--------|-------|
| Planning documents | 15 (including this one) |
| Planning lines | ~9,500 |
| App code lines | ~960 |
| Features proposed (total) | 74 |
| Features shipped | **0** |
| Planning-to-code ratio | **~10:1** |
| Total estimated implementation | ~535 min (~9 hours) |
| Total time spent planning | Unknown, but likely 10x that |

This document identifies the last genuinely novel feature gaps in the product vision. The app's feature set is now fully mapped across:
- Basic CRUD (Phase 0)
- Data model completeness (Phase 1: G1-G4)
- Daily experience (Phase 2)
- Engagement mechanics (Phase 3)
- Data intelligence (Phase 4)

**There are no more features to plan.** The next commit should be TypeScript.
