# Habit Garden — Feature Review & Backlog (2026-10-30)

**Automated review** | Builds on FEATURE_PLAN.md (Oct 25) and FEATURE_REVIEW (Oct 29)

---

## Project Snapshot

| Metric | Value |
|--------|-------|
| Source files | 11 (4 components, 1 hook, 1 utils, 1 types, 1 API client, 2 server files, 1 test file) |
| Lines of code | ~960 |
| Working features | Create habit (daily/weekly), toggle completion (14-day grid), streak tracking, archive, delete |
| Tech stack | React 19 + TypeScript + Vite 8 (frontend), Express + flat JSON file (backend) |
| Server tests | 14 (supertest, all passing) |
| Frontend tests | 0 |
| Planning documents | 21 (including this one) |
| Total feature proposals across all docs | 99+ (series A through N) |
| Features shipped from any proposal | **0** |

### Planning Debt Acknowledgment

This is the 21st planning document. The prior review (Oct 29) correctly stated: "The planning-to-execution ratio is infinity." This document exists because it was requested, but it takes a different approach than prior docs:

1. **No rehashing** — assumes FEATURE_PLAN.md (Oct 25) and N-series (Oct 29) are the canonical plan
2. **Focus on gaps those docs can't see** — structural, architectural, and UX dimensions that only emerge from reading the actual code
3. **Shorter proposals** — each is under 15 lines, because the bottleneck is coding, not specifying
4. **Ends with an execution contract** — what to build first and a commitment to stop planning

---

## Code-Level Findings (Not in Any Prior Proposal)

These aren't features — they're observations from reading every line of code that planning-doc-only reviews miss.

### F1. API Calls Silently Swallow Errors

`api.ts` never checks `res.ok`. A 500 from the server returns the error HTML parsed as JSON, which silently corrupts state. Every `fetch` call needs `if (!res.ok) throw`. This was identified in Tier 0.1 of FEATURE_PLAN.md but is worth emphasizing: **it's a data-loss bug, not a polish item.**

### F2. index.css Is Orphaned Styling

`index.css` defines a complete light/dark design system (`--text`, `--bg`, `--accent`, `--border`) with a `#root` container at 1126px. `App.css` defines a completely separate dark-only design. The two files conflict — `index.css` sets `color-scheme: light dark` while `App.css` hardcodes a dark background. One of them is dead code from the Vite template.

### F3. No Data Migration Path

The `Habit` type is a flat object in a JSON file. Adding any field (forgiveness, activeDays, sortOrder, anchor) requires either a server-side migration or defensive client-side defaults. No proposal addresses this, but every Tier 1+ feature needs it. A 10-line `migrateData()` function in `app.js` that fills missing fields with defaults would unblock the entire roadmap.

### F4. Server Has No Edit Endpoint

The server has POST (create), POST (archive), DELETE, but no PUT (update). This blocks M5 (Edit Habit), which blocks Anchor Statements, Routines, Effort levels, and every feature that adds editable fields. It's a 15-line addition.

### F5. Optimistic Updates Are Fragile

`useHabits.ts` stores the entire previous state before each operation (`prevHabits`, `prevLogs`) and rolls back on error. But the rollback restores the *snapshot at call time*, not the current state. If two operations overlap (user toggles habit A, then immediately toggles habit B), a failure on A rolls back B's change too. Needs per-operation rollback or a queue.

---

## P-Series: 6 Novel Features (Dimensions 100–105)

These target dimensions untouched by all 99 prior proposals. Each is verified against the full A-through-N series.

### P1. Batch Check-in Mode

**Dimension:** Single-screen daily ritual

**The gap:** Keyboard Quick-Log (M6) speeds up individual toggles. Yesterday Recovery (M4) handles a specific gap. Neither optimizes the most common daily flow: "I just got home, let me log everything I did today."

**What it does:**
- A "Check in" button in the header opens a modal/overlay
- Shows all active habits as a vertical checklist with large toggle buttons
- User taps each one done/not-done, then hits "Save" once
- One API call (new `POST /api/logs/batch` accepting `{date, entries: [{habitId, done}]}`)
- Dismisses with a summary: "4/6 habits completed today"

**Why it's different from M6:** M6 adds keyboard shortcuts to the existing table. P1 replaces the table interaction entirely for the daily check-in. It's a purpose-built screen for the #1 use case.

**Effort:** ~25 min (modal + batch endpoint + state update)

---

### P2. Stale Habit Detection

**Dimension:** Automatic list hygiene

**The gap:** Archive is manual. Comeback Mode (K2) handles returning after a gap. No proposal addresses the inverse: a habit sitting in the active list that the user has silently abandoned. 8 active habits where 3 haven't been touched in 3 weeks creates visual clutter and guilt.

**What it does:**
- When a habit has 0 check-ins in the last 14 days, a subtle indicator appears (faded row, or a small badge)
- After 21 days of inactivity, a non-intrusive prompt: "Still tracking [habit]? [Keep] [Pause] [Remove]"
- "Pause" is a new state between active and archived — paused habits don't appear in the main view but retain their history and can be resumed
- Thresholds are fixed (not configurable — simplicity over flexibility)

**Data model change:**
```typescript
type Habit = {
  // ...existing
  status: 'active' | 'paused' | 'archived'  // replaces boolean `archived`
}
```

**Effort:** ~20 min (status field migration + stale check logic + prompt UI)

---

### P3. Habit Momentum Score

**Dimension:** Continuous resilience metric

**The gap:** Streaks are binary — 45 days to 0 on one miss. Forgiveness Streak (N1) adds grace days but is still binary underneath. Completion Rate (N6) is a percentage over a window. No proposal models habit strength as a *continuous, physics-inspired value* that builds over time and decays gradually.

**What it does:**
- Each habit has a "momentum" score from 0 to 100
- Each completed day adds points (base: +5, boosted by consecutive days)
- Each missed day subtracts points (base: -3, but a 90-momentum habit loses proportionally less — like friction on a flywheel)
- Displayed as a small bar or ring next to the habit name
- A 60-day habit at momentum 95 drops to ~92 on one miss. A 3-day habit at momentum 12 drops to ~8.
- The math: `momentum = min(100, momentum + 5 + floor(momentum/20))` on completion, `momentum = max(0, momentum - max(3, (100 - momentum) / 10))` on miss

**Why it's different from N1/N6:** Forgiveness is about not punishing. Completion Rate is about accuracy. Momentum is about *inertia* — the feeling that a long-running habit is resilient and a new habit is fragile. It maps to how habit formation actually works neurologically.

**Data model change:** Add `momentum: number` to Habit (default 0). Recalculated on each toggle or via a daily cron-like check.

**Effort:** ~20 min (formula + display + daily recalc endpoint)

---

### P4. Weekly Intention Setting

**Dimension:** Prospective planning ritual

**The gap:** Every proposal is retrospective — it shows what happened. None creates a forward-looking moment. The difference between "I tracked 5/7 days this week" and "I committed to 5 days and hit all 5" is enormous psychologically. Commitment amplifies satisfaction.

**What it does:**
- On the first visit each week (Monday by default), a brief overlay appears: "Plan your week"
- User sees each active habit and selects which days they intend to complete it
- The selected days show a subtle dot/outline in the grid (intention marker)
- At week's end, a small summary: "You met 4/5 intentions this week" with a visual comparison
- Intentions are optional — dismissing the prompt skips the week
- Stored as: `intentions: { [weekKey: string]: { [habitId: string]: string[] } }`

**Why it's different from Rest Days (N5):** Rest days are a fixed recurring schedule. Intentions are a weekly micro-commitment that adapts to life. "This week I'm traveling Tuesday-Wednesday, so I'll skip Exercise those days" — without changing the habit's permanent schedule.

**Effort:** ~35 min (intention data model + weekly prompt + grid indicators + summary)

---

### P5. Cross-Habit Correlation View

**Dimension:** Inter-habit relationship discovery

**The gap:** Every visualization proposal (heatmaps, sparklines, rhythm scores, narratives) looks at one habit at a time. No proposal helps the user see *relationships between habits*. "I exercise more on days I meditate" or "Reading drops when I'm gaming" — these insights emerge from cross-referencing logs, and they're invisible in per-habit views.

**What it does:**
- A new "Insights" section (collapsed by default, expandable)
- Select 2 habits from dropdowns
- Shows a simple overlap metric: "You completed both on 18/30 days (60%)" and "When you did [A], you also did [B] 85% of the time"
- A side-by-side mini timeline (two rows of dots, aligned by date) makes co-occurrence and divergence visible at a glance
- Only appears when sufficient data exists (30+ days of logs for both habits)

**Why it's different from analytics proposals:** Prior analytics (sparklines, rhythm scores) measure individual habit health. This measures *habit ecology* — how habits affect each other. It's the difference between monitoring individual plants and understanding the garden.

**Effort:** ~30 min (correlation calculation + selection UI + dual timeline visualization)

---

### P6. Focus Timer for Timed Habits

**Dimension:** Duration-based completion

**The gap:** Every habit is a boolean: done or not done. But "Meditate 10 minutes" and "Meditate 45 minutes" are vastly different achievements, and both get the same checkmark. Check-in Notes (N4) capture text context but not time. No proposal adds an objective measurement dimension.

**What it does:**
- When creating a habit, optionally set a "target duration" (e.g., 10 min, 30 min)
- Timed habits show a "Start" button instead of a checkbox for today
- Clicking Start begins a visible countdown timer (minimal UI: just the time remaining)
- When the timer completes, the habit auto-checks and the duration is logged
- Manual check-in still works (for when you forgot to start the timer)
- Logged duration is visible on hover: "Meditated 12:34 on Oct 30"

**Data model change:**
```typescript
type Habit = {
  // ...existing
  targetMinutes?: number  // undefined = boolean habit (no timer)
}
// Log entries gain optional duration:
type LogEntry = { date: string; note?: string; durationSec?: number }
```

**Effort:** ~30 min (timer UI + duration logging + display)

---

## Novelty Verification: P-Series vs. All Prior Proposals

| ID | Feature | Dimension | Nearest Prior Proposal | Why P Is Different |
|----|---------|-----------|----------------------|-------------------|
| P1 | Batch Check-in | Single-screen daily ritual | M6 (Keyboard Quick-Log) | M6 speeds up the table. P1 replaces the table for the daily flow. |
| P2 | Stale Habit Detection | Automatic list hygiene | Archive (existing), Comeback Mode (K2) | Archive is manual pull. Comeback is return. Stale detection is proactive push. |
| P3 | Habit Momentum | Continuous resilience metric | Forgiveness Streak (N1), Completion Rate (N6) | Forgiveness is binary+grace. Rate is a percentage. Momentum is continuous physics. |
| P4 | Weekly Intentions | Prospective planning | Rest Days (N5), Difficulty Curve (L4) | Rest Days are fixed. Difficulty is retrospective. Intentions are weekly forward commitment. |
| P5 | Cross-Habit Correlation | Inter-habit relationships | All analytics proposals (per-habit) | Every prior viz shows one habit. This shows relationships between two. |
| P6 | Focus Timer | Duration-based completion | Check-in Notes (N4), Effort levels (J1) | Notes are text. Effort is subjective. Timer is objective time measurement. |

---

## Consolidated Execution Plan

The tier structure from FEATURE_PLAN.md (Oct 25) and N-series amendments (Oct 29) remain the canonical backlog. The P-series slots in as follows:

### Tier 0 — Fix What's Broken (unchanged, ~50 min)

| # | Item | Est. |
|---|------|------|
| 0.1 | API error handling (`if (!res.ok) throw` in api.ts) | 10 min |
| 0.2 | Edit habit (PUT endpoint + inline edit UI — M5) | 20 min |
| 0.3 | Unarchive endpoint + archived habits section | 10 min |
| 0.4 | Delete orphaned index.css rules or reconcile with App.css (F2) | 5 min |
| 0.5 | Clean test data in data.json | 1 min |
| 0.6 | Add `migrateData()` to server for safe field additions (F3) | 5 min |

### Tier 1 — Daily Experience (pick 4, ~80 min)

| # | Feature | Source | Est. |
|---|---------|--------|------|
| 1.1 | Undo Toast | N2 | 20 min |
| 1.2 | Completion Celebration | M1 | 25 min |
| 1.3 | Yesterday Recovery | M4 | 20 min |
| 1.4 | Completion Rate Badge | N6 | 15 min |
| 1.5 | **Batch Check-in Mode** | **P1** | 25 min |
| 1.6 | Keyboard Quick-Log | M6 | 20 min |

**P1 rationale for Tier 1:** Batch check-in directly improves the #1 daily interaction. It's the mobile-friendly answer to M6's keyboard shortcuts.

### Tier 2 — Expand (pick 3, ~100 min)

| # | Feature | Source | Est. |
|---|---------|--------|------|
| 2.1 | Mobile-Responsive View | M3 | 45 min |
| 2.2 | Forgiveness Streak | N1 | 30 min |
| 2.3 | Scheduled Rest Days | N5 | 25 min |
| 2.4 | **Stale Habit Detection** | **P2** | 20 min |
| 2.5 | Drag-to-Reorder | M2 | 30 min |

**P2 rationale for Tier 2:** Stale detection becomes valuable once users have 5+ habits and real usage data. Too early in Tier 1 when the list is small.

### Tier 3 — Depth (pick 3, ~90 min)

| # | Feature | Source | Est. |
|---|---------|--------|------|
| 3.1 | Habit Heatmap | N3 | 40 min |
| 3.2 | Check-in Notes | N4 | 35 min |
| 3.3 | **Habit Momentum Score** | **P3** | 20 min |
| 3.4 | **Weekly Intention Setting** | **P4** | 35 min |
| 3.5 | Now Mode | L5 | 35 min |

### Tier 4 — Differentiation

| # | Feature | Source | Est. |
|---|---------|--------|------|
| 4.1 | **Cross-Habit Correlation** | **P5** | 30 min |
| 4.2 | **Focus Timer** | **P6** | 30 min |
| 4.3 | Narrative View | J2 | 50 min |
| 4.4 | Habit Experiments | K3 | 50 min |
| 4.5 | Time Capsule | J5 | 40 min |

**P5 and P6 rationale for Tier 4:** Both require weeks/months of accumulated data to be meaningful. Ship them after users have a history worth analyzing.

### Parked (unchanged from FEATURE_PLAN.md)

Living Garden View, Social/Sharing, Full Analytics Dashboard, PWA/Offline/Export, Habit Stacking/Chains.

---

## Architectural Notes for Implementers

1. **Data migration (F3) must land in Tier 0.** Every Tier 1+ feature adds fields to `Habit` or changes `HabitLog`. Without a migration function, each feature must defensively check for missing fields everywhere it reads data.

2. **The `archived: boolean` → `status: enum` migration (P2) should happen early** even if Stale Detection ships later. It's cleaner than adding a separate `paused` boolean, and the migration is backward-compatible.

3. **Batch endpoint (P1) is independent.** It doesn't require changing the existing toggle endpoint. The new `POST /api/logs/batch` runs alongside the per-habit toggle.

4. **Momentum (P3) needs a daily recalculation.** Either a server-side cron job (simple: run at midnight) or calculate on the client from log history (heavier but no cron needed). Client-side calculation from logs is simpler for this architecture.

---

## The Honest Recommendation

**Stop planning. Ship Tier 0.**

Tier 0 is ~50 minutes of coding. It fixes real bugs (F1 data corruption, F4 missing edit) and unblocks the entire roadmap. Every hour spent on another planning document is an hour not spent on the 5-line fix in `api.ts` that prevents silent data corruption.

The backlog is set. The priority order is clear. The next document should be a PR, not a `.md` file.

---

*This document supplements FEATURE_PLAN.md (Oct 25) and FEATURE_REVIEW (Oct 29). The P-series fills the remaining novel dimensions. The combined A-through-P catalog covers 105+ feature dimensions. **The planning phase is complete.***
