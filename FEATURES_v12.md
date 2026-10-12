# Habit Garden — Feature Plan v12: Five Novel Features & Restructured Backlog

**Date:** 2026-10-12
**Status:** 5 new feature proposals (D1-D5) + restructured execution backlog

---

## Codebase Audit

| Area | State |
|------|-------|
| **Frontend** | React 19, Vite 8, TypeScript. 3 components (HabitForm, HabitTable, HabitRow), 1 hook (useHabits), 1 utils file. ~400 lines of app code, ~340 lines of CSS. |
| **Backend** | Express server, JSON file storage, async mutex for writes. 5 endpoints: GET habits, POST habit, POST toggle, POST archive, DELETE habit. ~130 lines. |
| **Working features** | Create habit (name, frequency, color), toggle completions on 14-day grid, daily + weekly streak calculation, archive, delete with confirmation, optimistic updates with rollback, toast notifications on errors. |
| **Missing basics** | No edit habit, no unarchive, no API error checking (`res.ok`), no search/filter, no keyboard navigation, dark theme only. |
| **Data** | 8 test habits in `data.json`, 1 log entry. No real usage data accumulated. |
| **Planning** | 11 documents, ~6,200 lines, 49 proposed dimensions, 5 new proposals (C1-C5 in BACKLOG.md). **0 features shipped.** |

### Architectural observations

1. **No data migration path.** Adding fields to `Habit` type works because the server reads/writes JSON — optional fields just appear. But there's no versioning on the data format.
2. **No PUT endpoint.** Edit is the most requested feature across all docs. The server has no update route.
3. **Streak calculation is O(n) per render.** `calculateStreak` calls `sorted.includes(dayStr)` in a loop — O(n^2) on the dates array. Fine for now, problematic at scale.
4. **No pagination or lazy loading.** All habits + all logs load on mount. Works for <50 habits, will degrade.
5. **CSS is a single file.** Manageable at current size but will need splitting as features add views.

---

## What 54 Existing Proposals Cover

The 49 dimensions from v3-v11 plus the 5 C-series proposals in BACKLOG.md cover:

- Streak mechanics (strict, recovery, 2-day rule, grace days, shields, milestones, personal records)
- Completion metadata (friction log, miss reasons, displacement tracking)
- Temporal patterns (rhythms, scheduling, time-of-day, seasons, quiet weeks)
- Habit relationships (stacking, correlation, ripple effects)
- Habit evolution (difficulty progression, inheritance, experiments, maturity/graduation)
- Analytics (system score, slump radar, autopilot, heatmaps, DNA, compound progress, momentum decay)
- User reflection (weekly compass, notes, confidence prediction, anchor statements)
- Life context (life chapters, pause protocol, life balance radar)
- UX (edit, unarchive, templates, ordering, focus mode, keyboard shortcuts, completion sparks)
- Identity (living garden, heartbeat, categories/tags)
- Consistency metrics (weekly rhythm score)
- Data management (export/import, timestamps, time investment)

### Gaps not addressed by any of the 54 proposals

1. **No "today-first" interaction model.** Every proposal assumes the 14-day grid is the primary interface. No proposal reimagines the daily check-in as a separate, streamlined experience.
2. **No year-scale visualization.** The 30-day heatmap (F5) is the longest view proposed. No feature shows the shape of an entire year — where seasonal patterns, vacations, and long arcs become visible.
3. **No habit de-escalation.** Difficulty Progression (N5) escalates. Nothing lets a habit temporarily shrink to prevent total failure during hard periods.
4. **No inter-habit relationship discovery.** Habit Stacking (N1) is explicit chains. Nothing discovers which habits actually co-occur from the user's own data.
5. **No post-break recovery mechanic.** Shields (F11) and grace days prevent breaks. The 2-Day Rule softens them. Nothing helps after a break has already happened — the transition from "broken" to "rebuilding."

---

## New Feature Proposals

### D1. Year-at-a-Glance Contribution Graph

**Gap filled:** No feature shows the full year. The 30-day heatmap stops at a month. A year-view reveals patterns invisible at shorter timescales.

**What:** A GitHub-style contribution graph — 365 small squares, one per day, colored by completion density. Each habit gets its own graph, expandable from the habit row.

```
Exercise — 2026
Jan  ■■■■■□■ ■■■□■■■ ■■■■■■■ ■■■■□□■
Feb  ■■■■■■■ ■■□■■■■ □□□□□□□ ■■■■■■■  ← vacation week visible
Mar  ■■■■■□■ ■■■■■□■ ■■■■■...
     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     Each square = 1 day. Color intensity = completion.
```

**Why it's different from every existing proposal:**
- **30-day heatmap (F5)** shows tactical, recent performance. The year graph shows strategic, long-term patterns. One answers "how's this week?" The other answers "what does my year look like?"
- **Momentum decay sparkline (C2)** shows 7-day trend. The year graph shows 365-day shape.
- **Streak number** is abstract. The year graph is a visual artifact — seeing 200 green squares in a row is viscerally motivating in a way "200-day streak" text isn't.

**Behavioral science:** The "endowed progress effect" (Nunes & Dreze, 2006) — people are more motivated to complete a goal when they can see progress already made. A year graph with 8 months of green creates enormous visual momentum. GitHub's contribution graph is the most-cited example of this effect in software: developers report maintaining streaks specifically because the visual gap of a missed day is more salient than any number.

The year view also reveals seasonal patterns: if Exercise drops every December, that's a scheduling problem (holidays) not a motivation problem. This insight is invisible at any shorter timescale.

**Data model:** None new. Pure visualization of existing log data.

**Implementation:**
- SVG grid: 52 columns (weeks) x 7 rows (days)
- Color: habit's color at varying opacity based on completion (0% = gray, 100% = full color)
- Expand/collapse per habit row
- Responsive: scrollable on mobile

**Effort:** Medium (~45 min). SVG generation, date-to-grid mapping, color calculation. No server changes.

---

### D2. Micro-Habit Fallback

**Gap filled:** No feature helps when a habit becomes too hard to maintain at full scope. Every escalation feature (Difficulty Progression, N5) goes up. Nothing goes down.

**What:** Each habit has an optional "tiny version" — the absolute minimum viable version of the behavior:

```
Create a habit

Name:       Exercise 30 min
Frequency:  [Daily]
Color:      [●]
Tiny version: Put on gym shoes    ← NEW (optional)
```

When a habit's 7-day completion rate drops below 40%, the app surfaces the tiny version:

```
Exercise is cooling off (2/7 this week).

Instead of skipping entirely:
  "Put on gym shoes" — the tiniest version still counts.

[Do tiny version]  [Skip today]  [I did the full version]
```

Completing the tiny version counts as a full completion for streak purposes. The grid shows it with a distinct marker (half-filled or a different icon) so the user can see which days were "tiny" versus "full."

```
Day grid:  ✓ ✓ ✓ ✓ · ½ ✓ ✓
                     ^^ tiny version
```

**Why it's different from every existing proposal:**
- **Difficulty Progression (N5)** escalates challenge over time. Micro-Habit Fallback de-escalates during hard periods. One is upward; the other is a safety net below.
- **Adaptive Difficulty (dim 33)** auto-adjusts based on data. Micro-Habit Fallback is user-defined and intentionally simple — no algorithm, just "what's the smallest version?"
- **Grace Days (N2)** skip the day entirely. Micro-Habit Fallback maintains the behavior chain at reduced scope — you still did *something*.
- **Streak Shields (F11)** protect retroactively. Micro-Habit Fallback prevents the break proactively by lowering the bar.

**Behavioral science:** BJ Fogg's Tiny Habits methodology — the core insight is that consistency matters more than intensity. "Floss one tooth" beats "floss all teeth and give up after a week." The fallback version isn't about doing less permanently; it's about keeping the neural pathway active during hard periods.

"Behavior activation" in CBT: during depression, the hardest part is starting. Once you put on gym shoes, the activation energy to actually exercise drops dramatically. The tiny version exploits this: it's the ignition, not the journey.

Research on "goal gradient" (Kivetz et al., 2006): people accelerate toward goals as they get closer. A 23-day streak is worth more psychologically than a 3-day streak. Micro-Habit Fallback protects high-value streaks by making it nearly impossible to break them on a bad day.

**Data model:**
```typescript
type Habit = {
  // ...existing
  microVersion?: string  // max 100 chars
}

// Logs track which completions were "micro":
type HabitLog = {
  [habitId: string]: string[]  // existing: dates of completions
}
type MicroLog = {
  [habitId: string]: string[]  // dates where micro version was used
}
```

**Effort:** Small (~30 min). One optional field on habit, one new data structure, conditional prompt when 7-day rate is low, distinct visual for micro completions. One new API endpoint or extension of toggle.

---

### D3. Today Dashboard View

**Gap filled:** No proposal reimagines the daily check-in. The 14-day grid is optimized for review and analysis. Daily check-in needs a separate, focused interface.

**What:** A toggle between "Grid View" (current) and "Today" (new). The Today view is a simple checklist:

```
Today — Oct 12                    [Grid View] [Today ←]

  ○ Exercise 30 min          daily    ▸ 12-day streak
  ○ Read 20 pages            daily    ▸ 5-day streak
  ○ Meditate 10 min          daily    ▸ 0 days
  ● Journal 5 min            daily    ✓ Done
  ● No screens before bed    daily    ✓ Done

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Today: 2 of 5 done            40%  ███░░░░░░░
```

Design principles:
- **Incomplete habits on top.** The most actionable items are immediately visible.
- **One tap to complete.** Tap the circle to toggle. No navigating into a row or finding today's column in a 14-column grid.
- **Progress bar.** Makes the "4 of 6" count visual and gamified.
- **No history.** Today is today. If you want to see the week, switch to Grid View.

**Why it's different from every existing proposal:**
- **Completion Momentum (L2)** adds a "3 of 7 done" counter to the existing grid view. Today Dashboard is an entirely separate view with different layout, sorting, and interaction model.
- **Focus Mode (mentioned in v11 UX list)** was listed but never defined as a feature. Today Dashboard is the concrete realization — but it's not "focus mode" (which implies hiding things); it's a purpose-built interface for a specific use case.
- The 14-day grid answers: "How have I been doing?" Today Dashboard answers: "What do I need to do right now?"

**Behavioral science:** "Choice architecture" (Thaler & Sunstein, 2008) — the default interface shapes behavior. A grid of 14 days x N habits presents (14 x N) clickable cells, only N of which are actionable today. The cognitive load of finding the right column is friction that compounds with each check-in. Today Dashboard reduces the decision space to exactly the actions available now.

"Implementation intentions" research (Gollwitzer, 1999): specificity increases follow-through. "Check my habits" is vague. "Open the app and see 3 unchecked items" is specific and actionable. The Today view provides that specificity.

**Data model:** None new. Filters existing habits and logs to today's date.

**Implementation:**
- New `TodayView` component
- View toggle state (persisted in localStorage)
- Sort: incomplete first, then completed
- Reuse existing `toggle` function from `useHabits`

**Effort:** Small (~35 min). New component, view toggle, sorting logic. No server changes.

---

### D4. Habit Pair Discovery

**Gap filled:** No feature reveals relationships between habits from actual behavior data. Habit Stacking (N1) is intentional chains. Nothing discovers which habits naturally co-occur — or anti-correlate.

**What:** After 30+ days of data, the app computes pairwise completion correlations and surfaces insights:

```
Habit Insights

  Strongest pairs:
  ┌─────────────────────────────────────────────────┐
  │ Exercise + Meditation       82% co-completion   │
  │ When you do one, you almost always do the other  │
  └─────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────┐
  │ Reading + Journal           71% co-completion   │
  │ These support each other                        │
  └─────────────────────────────────────────────────┘

  Independent habits:
  ┌─────────────────────────────────────────────────┐
  │ Exercise + Reading          31% co-completion   │
  │ These don't seem connected                      │
  └─────────────────────────────────────────────────┘

  Your best habit day includes:
    Exercise + Meditation + Journal (average 2.8/3 on your best days)

  Your hardest combination:
    Exercise + Reading + No Screens (average 1.1/3 — too many at once?)
```

**Why it's different from every existing proposal:**
- **Habit Stacking (N1)** is explicit — you declare "after A, do B." Pair Discovery is emergent — the app finds patterns in what you actually do.
- **Rhythm Detection (L1)** finds temporal patterns (which days are strong). Pair Discovery finds inter-habit relationships (which habits travel together).
- **Correlation analysis (mentioned in dim 10)** was listed as "ripple effects" — how one habit affects others over time. Pair Discovery is simpler: same-day co-completion rates. No causal claims, just observed patterns.
- **Slump Radar (dim 32)** detects declining individual habits. Pair Discovery identifies which habits to save when you can only do a few — your "keystone" habits that bring others along.

**Behavioral science:** "Keystone habits" (Duhigg, 2012) — some habits catalyze others. Exercise is the classic example: people who exercise also eat better, sleep better, and procrastinate less. But which habit is *your* keystone? It's different for everyone. Pair Discovery finds it empirically.

Network science: habits aren't independent nodes; they're a network. Pair Discovery maps that network. When life gets hard and you can only maintain 2-3 habits, knowing which ones bring the most others along is strategically valuable.

"Bundling" (Milkman et al., 2014): pairing a "should" habit with a "want" habit increases compliance. Pair Discovery reveals natural bundles that already exist in the user's behavior, which can be reinforced.

**Data model:** None new. Computed from existing log data.

**Implementation:**
- Pairwise co-completion calculation: for each habit pair, count days where both were completed vs. days where at least one was active
- Phi coefficient or simple percentage for correlation strength
- Minimum 30 days of overlapping data before showing results
- "Best day" composition: find the habit combination on highest-completion days
- Display as a card/section (not a separate view)

**Effort:** Medium (~50 min). Statistical computation, insight generation logic, display component. No server changes.

---

### D5. Streak Recovery Mode

**Gap filled:** No feature addresses the psychological moment after a streak breaks. Shields prevent breaks. Grace days prevent breaks. The 2-Day Rule softens breaks. Nothing helps the user rebuild after a break has already happened.

**What:** When a streak of 7+ days breaks, instead of immediately resetting to 0, the habit enters a 3-day "recovery window":

```
Exercise — Streak broken after 23 days

  Recovery mode: complete 3 of the next 3 days to recover.

  Recovery: ○ ○ ○       Previous streak: 23 days
            Day Day Day
             1   2   3

  [Start recovery]  [Accept reset to 0]
```

If the user completes all 3 recovery days, the streak recovers to (previous streak - days missed). If they miss any recovery day, the streak fully resets.

```
Recovery succeeded!

  Previous streak: 23 days
  Days missed: 1
  Recovered streak: 22 days → now 25 days (and counting)

  The gap shows in your grid:
  ✓ ✓ ✓ ✓ ✗ ✓ᴿ ✓ᴿ ✓ᴿ ✓
              ^^^^^^^^^
              recovery days
```

Recovery is opt-in (must tap "Start recovery"), limited to streaks of 7+ days (short streaks reset normally), and available once per streak (can't chain recoveries).

**Why it's different from every existing proposal:**
- **Streak Shields (F11)** are spent retroactively to erase a miss. Recovery Mode is forward-looking — it requires proving you're back by completing 3 consecutive days.
- **Grace Days (N2)** are pre-declared. Recovery Mode activates after an unexpected break.
- **2-Day Rule (F4)** modifies streak math to be more forgiving. Recovery Mode keeps strict streak math but adds a second-chance mechanic.
- **Streak Recovery display (dim 22)** softens how the UI shows a broken streak. Recovery Mode changes the actual mechanic — the streak can be genuinely restored.
- The critical difference: every other protection is about *preventing* breaks. Recovery Mode is about *what happens next* — the transition from broken to rebuilding.

**Behavioral science:** The "what-the-hell effect" (Polivy & Herman, 1985) — after a diet lapse, people abandon the diet entirely ("I already blew it, might as well eat everything"). The habit equivalent: "I broke my streak, why bother?" This is the single most destructive moment in habit formation.

Recovery Mode directly counters this by offering a structured re-entry: "You didn't blow it — you have 3 days to get it back." The 3-day requirement prevents trivial recovery while being short enough to feel achievable.

"Fresh start effect" (Dai et al., 2014): people are more motivated at temporal landmarks (new year, new week, birthdays). Recovery Mode creates an artificial fresh start after every break — a mini "new beginning" that leverages the same motivational boost.

"Near-miss" effect: the streak isn't gone yet — it's suspended. The possibility of recovering 23 days of work is more motivating than starting from 0.

**Data model:**
```typescript
type HabitRecovery = {
  [habitId: string]: {
    previousStreak: number
    recoveryStartDate: string
    daysMissed: number
  }
}
```

**Implementation:**
- Detect streak break for streaks >= 7 days
- Offer recovery prompt (opt-in)
- Track 3 consecutive completions during recovery window
- On success: restore streak (previous - missed days)
- On failure: full reset, remove recovery state
- Distinct visual marker for recovery days in grid

**Effort:** Small-Medium (~40 min). Recovery state management, modified streak calculation during recovery, prompt UI, recovery day markers. One new data structure. Minimal server changes.

---

## What Makes D1-D5 Different From C1-C5 and Dims 1-49

| ID | Feature | What's Genuinely New |
|----|---------|---------------------|
| D1 | Year Contribution Graph | Only full-year visualization. Reveals seasonal patterns and creates "sunk cost" visual momentum. |
| D2 | Micro-Habit Fallback | Only de-escalation mechanism. Every other feature maintains or increases scope; this shrinks it to prevent failure. |
| D3 | Today Dashboard | Only alternative interaction model. Every other proposal adds to the grid view; this replaces it for daily use. |
| D4 | Habit Pair Discovery | Only emergent relationship feature. Stacking is explicit; this discovers patterns from actual behavior data. |
| D5 | Streak Recovery Mode | Only post-break mechanic. Every other streak feature prevents breaks; this helps rebuild after one happens. |

---

## Restructured Execution Backlog

The prior BACKLOG.md and FEATURES_v11 both identified the core problem: 6,200+ lines of planning, 0 lines shipped. This section doesn't add more granularity — it strips it back to what matters.

### Tier 0: Basics (no more planning until these ship)

These are missing functionality, not features. Ship them first.

| # | Feature | What | Est. |
|---|---------|------|------|
| 1 | API error handling | Check `res.ok` in all `api.ts` fetch calls, throw on failure | 15 min |
| 2 | Edit habit | PUT `/api/habits/:id` endpoint + inline edit in HabitRow | 40 min |
| 3 | Unarchive | POST `/api/habits/:id/unarchive` endpoint + archived section in UI | 30 min |

### Tier 1: Daily experience (pick any, in any order)

These change how the app feels to use every day. All are independent.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 4 | **Today Dashboard View** | 35 min | **NEW D3** |
| 5 | Cue anchoring (trigger field) | 10 min | v11 F8 |
| 6 | Anchor statement (why field) | 10 min | BACKLOG C3 |
| 7 | **Micro-Habit Fallback** | 30 min | **NEW D2** |
| 8 | Momentum decay sparkline | 25 min | BACKLOG C2 |
| 9 | Habit ordering (up/down) | 35 min | v9 |
| 10 | Compound progress tracker | 30 min | BACKLOG C1 |

### Tier 2: Streak & consistency (pick any, in any order)

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 11 | 2-Day Rule streak mode | 35 min | v10 F4 |
| 12 | **Streak Recovery Mode** | 40 min | **NEW D5** |
| 13 | Weekly rhythm score | 30 min | BACKLOG C4 |
| 14 | Inline 30-day heatmap | 35 min | v10 F5 |
| 15 | **Year-at-a-Glance Graph** | 45 min | **NEW D1** |
| 16 | Streak milestones (7/30/90/365) | 50 min | v9 |
| 17 | Earned streak shields | 45 min | v11 F11 |
| 18 | Completion sparks | 45 min | PLAN.md N8 |

### Tier 3: Intelligence (needs 30+ days of data)

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 19 | **Habit Pair Discovery** | 50 min | **NEW D4** |
| 20 | Miss reason capture | 40 min | v11 F7 |
| 21 | Start friction log | 30 min | BACKLOG C5 |
| 22 | Habit maturity & graduation | 55 min | v11 F10 |
| 23 | Life balance radar | 50 min | v11 F9 |

### Parked (valid, not now)

| Feature | Why |
|---------|-----|
| Living Garden View | High effort, needs solid basics first |
| Habit stacking / chains | Complex data model |
| Weekly compass | Needs simpler reflection features first |
| Difficulty progression | Needs micro-habit and maturity first |
| Data export/import | Important eventually |
| PWA / offline | Separate project |
| Dashboard / analytics | Needs months of real data |
| Theme toggle | Cosmetic, not blocking |

---

## Recommendation

The five new features (D1-D5) are deliberately practical:

- **D2 (Micro-Habit Fallback)** and **D3 (Today Dashboard)** are the highest-impact, lowest-effort additions. They change how the app *feels* to use daily.
- **D5 (Streak Recovery)** fills the biggest emotional gap — the moment when users are most likely to abandon the app entirely.
- **D1 (Year Graph)** and **D4 (Pair Discovery)** are longer-term features that reward sustained use.

But the most important thing remains: **ship Tier 0 first.** Edit, unarchive, and error handling are table stakes. Nothing else matters if the basics don't work.

After Tier 0, the recommended first new feature to build is **D3 (Today Dashboard)** — it's the simplest to implement, requires no data model changes, and fundamentally improves the daily check-in experience that every other feature builds on.

---

## Feature Interaction Map (D-series)

```
D3 Today Dashboard ─── frames ──→ D2 Micro-Habit Fallback
    │                                │
    │ (today view is where the       │ (micro fallback prompt
    │  micro-habit prompt appears)   │  appears in today view)
    │                                │
    ▼                                ▼
D5 Streak Recovery ─── protects ──→ D1 Year Graph
    │                                │
    │ (recovery keeps streaks alive, │ (year graph shows the
    │  which keeps the year graph    │  recovery days distinctly)
    │  unbroken)                     │
    ▼                                ▼
D4 Pair Discovery ──── informs ──→ D2 Micro-Habit Fallback
    │
    │ (pair data reveals which habits
    │  to protect with micro fallbacks
    │  — your keystone habits)
```

All five features work independently and can be built in any order.
