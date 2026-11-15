# Habit Garden — Feature Plan v13: Five Novel Features & Definitive Backlog

**Date:** 2026-10-13
**Status:** 5 new feature proposals (E1-E5) + final consolidated backlog
**Supersedes:** All prior feature documents for backlog purposes. Prior documents remain as design reference.

---

## Codebase Audit (Oct 13)

| Area | State |
|------|-------|
| **Frontend** | React 19, Vite 8, TypeScript. 3 components (HabitForm, HabitTable, HabitRow), 1 hook (useHabits), 1 utils file. ~400 lines of app code, ~340 lines of CSS. |
| **Backend** | Express server, JSON file storage, async mutex for writes. 5 endpoints: GET habits, POST habit, POST toggle, POST archive, DELETE habit. ~130 lines. |
| **Working features** | Create habit (name, frequency, color), toggle completions on 14-day grid, daily + weekly streak calculation, archive, delete with confirmation, optimistic updates with rollback, toast notifications on errors. |
| **Missing basics** | No edit habit, no unarchive, no API error checking (`res.ok`), no search/filter, no keyboard navigation, dark theme only. |
| **Planning docs** | 12 documents, ~7,000 lines, 59 proposed features, **0 shipped.** |

---

## What 59 Existing Proposals Cover

Across v3-v12 (dims 1-49) + C1-C5 + D1-D5, every proposal falls into these categories:

| Category | Coverage |
|----------|----------|
| Streak mechanics | Strict, recovery, 2-day rule, grace days, shields, milestones, personal records |
| Completion metadata | Friction log, miss reasons, displacement tracking |
| Temporal patterns | Rhythms, scheduling, time-of-day, seasons, quiet weeks |
| Habit relationships | Stacking, correlation, ripple effects, pair discovery |
| Habit evolution | Difficulty progression, inheritance, experiments, maturity/graduation |
| Analytics | System score, slump radar, autopilot, heatmaps, DNA, compound progress, momentum decay |
| User reflection | Weekly compass, notes, confidence prediction, anchor statements |
| Life context | Life chapters, pause protocol, life balance radar |
| UX improvements | Edit, unarchive, templates, ordering, focus mode, keyboard shortcuts, sparks |
| Identity/visual | Living garden, heartbeat, categories/tags |
| Consistency metrics | Weekly rhythm score |
| Data management | Export/import, timestamps, time investment |
| Views | Today dashboard (D3), year graph (D1), 30-day heatmap |
| De-escalation | Micro-habit fallback (D2) |

### Five Structural Gaps None of the 59 Proposals Address

1. **Every feature is solo.** Not a single proposal involves another person — no sharing, accountability, or social proof. Yet accountability is the single strongest predictor of habit adherence (Lally et al., 2010).
2. **Every habit is infinite.** No proposal creates time-bounded goals with a definitive endpoint and completion celebration. Habits exist forever or get archived — there's no "I did 30 days of cold showers, I'm done."
3. **Every visualization shows what you DID.** Nothing analyzes the *pattern* of misses — which days, which contexts, which combinations lead to failure. Miss Reason (dim 45) captures the reason once, but doesn't map failure as a system.
4. **All habits have equal priority.** No intelligence recommends which habit deserves attention based on risk, momentum, or strategic value. The user sees a flat list and must decide.
5. **All interaction is form-based.** Creating a habit requires 3 fields and a button. Daily check-in requires finding a column in a 14-day grid. No fast-path exists for experienced users.

---

## New Feature Proposals

### E1. Accountability Snapshot

**Gap filled:** Zero outward-facing features. Every proposal is a solo experience. Accountability — the act of making your progress visible to someone else — is entirely absent.

**What:** A "Share Progress" button generates a static image card summarizing a habit's (or all habits') progress. The card includes streak, completion rate, and a mini-graph. The user can copy it to clipboard, download it, or share it directly.

```
┌─────────────────────────────────────────────┐
│                                             │
│  Habit Garden — Weekly Snapshot             │
│                                             │
│  Exercise 30 min      ■■■■■□■  6/7  🔥 34d │
│  Read 20 pages        ■■■□■■■  5/7  🔥 12d │
│  Meditate             ■■■■■■■  7/7  🔥 21d │
│  Journal              ■■□□■□■  3/7         │
│                                             │
│  Overall: 75% this week                     │
│  Best streak: Exercise (34 days)            │
│                                             │
│  Oct 7 – Oct 13, 2026                       │
│                                             │
└─────────────────────────────────────────────┘
```

The card is generated client-side (Canvas API or SVG → PNG), never uploaded anywhere. The user controls exactly when and with whom they share. No accounts, no social feed, no followers — just a static artifact the user owns.

**Why it's different from every existing proposal:**
- No existing proposal produces ANY artifact that leaves the app. Every feature is consumed inside the app.
- This isn't "social features." Social features require accounts, feeds, and networking. An accountability snapshot is a *tool* — like screenshotting your step count and texting it to a friend. The app generates it; the user decides what to do with it.

**Behavioral science:** The American Society of Training and Development found that having a specific accountability appointment with another person increases the probability of completing a goal from 65% to 95%. But accountability doesn't require a social network — it requires making progress *visible*. A weekly snapshot texted to a friend, partner, or coach is the simplest implementation of the most powerful behavioral lever.

"Public commitment" (Cialdini, 2007): stating your progress publicly activates consistency motivation — you want to live up to what you've shared. The snapshot creates a low-friction path to public commitment without requiring real-time social features.

**Data model:** None. Pure rendering of existing data.

**Implementation:**
- Canvas/SVG rendering of habit data into a styled card
- "Copy to clipboard" and "Download PNG" buttons
- Configurable: single habit or all habits, this week or this month
- Respect habit colors in the card design

**Effort:** Medium (~50 min). Canvas rendering, card layout, clipboard API, download link. No server changes.

---

### E2. Habit Challenge Mode

**Gap filled:** Every habit is infinite. No proposal creates a time-bounded goal with a definitive completion state. The psychological difference between "exercise forever" and "exercise for 30 days" is enormous.

**What:** When creating a habit, the user can optionally set a challenge duration: 7, 14, 21, 30, 60, or 90 days.

```
Create a habit

Name:       Cold shower
Frequency:  [Daily]
Color:      [●]
Challenge:  [30 days] [No end date]    ← NEW
```

The habit's row shows progress toward the target:

```
Cold shower    Day 18 of 30    ████████████░░░░    60%
               12 days left    Streak: 18 days
```

When the challenge completes:
- A celebration screen appears with stats (total days, completion rate, longest streak during the challenge).
- The habit moves to a "Completed Challenges" section — a trophy case, not an archive.
- The user can choose to convert it to an ongoing habit, restart the challenge, or let it rest in the trophy case.

```
🏆 Completed Challenges
─────────────────────────────────────────────
Cold shower      30/30 days    100%    Oct 2026
Journaling       28/30 days     93%    Sep 2026
No sugar         19/21 days     90%    Aug 2026
```

**Why it's different from every existing proposal:**
- **Streak milestones** (v9) celebrate milestones on ongoing habits. Challenge Mode creates a *finite game* with a definitive end — you win by finishing, not by continuing forever.
- **Difficulty Progression** (N5) escalates challenge over time. Challenge Mode keeps difficulty constant and bounds the duration.
- **Habit Maturity/Graduation** (dim 48) detects when a habit becomes automatic and "graduates" it. Challenge Mode is user-declared and time-bounded — it ends because you said 30 days, not because an algorithm decided.
- **Archive** removes a habit. Challenge completion *celebrates* it. The emotional valence is opposite.

**Behavioral science:** Finite games vs. infinite games (Carse, 1986). Infinite games (ongoing habits) sustain motivation through identity change. Finite games (challenges) sustain motivation through progress-toward-goal. Both are valid. Most habit apps only support infinite games. Challenges fill the gap.

"Goal gradient effect" (Kivetz et al., 2006): motivation accelerates as you approach a goal. Day 25 of 30 is more motivating than any day of an infinite habit. The progress bar creates visual momentum that flat streak numbers don't provide.

Practical reality: many worthwhile behaviors are experiments. "Try meditating for 30 days" is a reasonable commitment. "Meditate forever" is intimidating. Challenges lower the entry barrier to trying new habits.

**Data model:**
```typescript
type Habit = {
  // ...existing
  challengeDays?: number       // 7, 14, 21, 30, 60, 90
  challengeStartDate?: string  // ISO date, set when created or challenge started
  challengeCompleted?: boolean
}
```

**Effort:** Small-Medium (~40 min). Two optional fields, progress calculation, completion detection, trophy case section. Minimal server changes.

---

### E3. Miss Pattern Map

**Gap filled:** Every visualization shows completions. Nothing shows the *structure* of failures. Miss Reason (dim 45) captures a one-time reason. Slump Radar (dim 32) detects declines. Neither maps misses as a system with predictable patterns.

**What:** A per-habit analysis view that shows when, how often, and in what patterns the user misses:

```
Exercise — Miss Pattern Map (last 90 days)

  Day of week:
  Mon  ░░░░░ 3 misses (5%)      ← strongest day
  Tue  ░░░░  4 misses (6%)
  Wed  ░░░░░ 2 misses (3%)
  Thu  ░░░░  5 misses (8%)
  Fri  ▓▓▓▓▓▓▓▓ 11 misses (17%) ← problem day
  Sat  ▓▓▓▓▓▓ 8 misses (13%)
  Sun  ▓▓▓▓▓ 6 misses (10%)

  Miss clusters:
  • 72% of misses happen on Fri-Sun (weekend effect)
  • Average gap length: 1.3 days (you recover quickly)
  • Longest gap: 5 days (Sept 3-7 — was this a trip?)
  • After a miss, you complete the next day 81% of the time

  Trend:
  • Monthly miss rate: Aug 18% → Sep 12% → Oct 8%
  • You're getting more consistent.
```

The key insight: misses aren't random — they follow patterns the user can't see from a grid of checkmarks. Identifying "Friday is my problem day" transforms a vague sense of inconsistency into a specific, solvable scheduling problem.

**Why it's different from every existing proposal:**
- **Miss Reason** (dim 45) asks WHY you missed. Miss Pattern Map shows WHEN and HOW OFTEN — the structural pattern, not the individual cause.
- **Momentum Decay** (C2) shows a 7-day trend of declining completions. Miss Pattern Map shows a 90-day structural analysis of failure patterns.
- **Slump Radar** (dim 32) detects that you're slumping. Miss Pattern Map diagnoses *why* — is it a day-of-week effect? A weekend effect? A post-travel effect? A gradual trend?
- Every other visualization makes you feel good about what you've done. Miss Pattern Map makes failure *useful* by turning it into actionable data.

**Behavioral science:** "Defensive pessimism" (Norem & Cantor, 1986): some people perform better when they analyze what could go wrong rather than focusing on what went right. Miss Pattern Map serves this cognitive style, which is underserved by every existing proposal.

"Implementation intentions" (Gollwitzer, 1999): "If [situation X], then [behavior Y]" plans are 2-3x more effective than goal intentions alone. Miss Pattern Map provides the "situation X" — "If it's Friday, then [adjust my Exercise plan]." Without the pattern data, users can't form effective implementation intentions for their failure modes.

**Data model:** None. Pure computation from existing log data (absence of dates in the log = misses).

**Implementation:**
- Calculate miss dates from habit creation date + log data
- Day-of-week frequency histogram
- Cluster detection (consecutive misses)
- Recovery rate (did-complete after a miss-day)
- Monthly trend line
- Expandable section per habit

**Effort:** Medium (~45 min). Date arithmetic, histogram generation, cluster analysis, trend calculation. No server changes.

---

### E4. Smart Priority Queue

**Gap filled:** All habits are displayed in creation order (or whatever order the user last set). No intelligence recommends which habits deserve attention right now based on data.

**What:** An optional "Smart Sort" mode for the Today view (D3) or the main grid that automatically orders habits by urgency:

```
Today — Oct 13 (Smart Sort)

  ⚠ Exercise 30 min       Priority: HIGH
    Reason: 2 days missed, streak at risk (was 14 days)

  ⚡ Read 20 pages          Priority: MEDIUM
    Reason: Completed 4/7 this week, below your 6/7 average

  ○ Meditate 10 min        Priority: NORMAL
    Reason: 21-day streak, completed today's type 92% of the time

  ✓ Journal 5 min          Priority: DONE
    Completed at check-in
```

Priority is computed from a simple weighted formula:

| Signal | Weight | Logic |
|--------|--------|-------|
| Days since last completion | High | More days missed → higher priority |
| Current streak at risk | High | Longer streak in danger → higher priority |
| Weekly completion rate vs. average | Medium | Below personal average → elevated |
| Day-of-week miss history | Medium | Historically weak day → elevated |
| Already completed today | Override | Always moves to bottom |

The formula is transparent — the "Reason" line explains exactly why each habit is ranked where it is. No black-box AI.

**Why it's different from every existing proposal:**
- **Habit Ordering** (v9) is manual drag-and-drop. Smart Priority is data-driven and changes daily.
- **Slump Radar** (dim 32) detects declining habits. Smart Priority acts on it — by putting the declining habit at the top of your list.
- **Focus Mode** (mentioned in v11 UX list) hides habits. Smart Priority keeps all habits visible but reorders them by urgency.
- **Today Dashboard** (D3) shows habits for today. Smart Priority adds intelligence to HOW they're shown — incomplete, at-risk habits first.
- No existing proposal produces a per-habit "reason" explaining why it needs attention. The reason line is the feature — it turns the app from a passive tracker into an active coach.

**Behavioral science:** "Choice overload" (Iyengar & Lepper, 2000): when all options look equal, people choose none. A flat list of 8 habits with no hierarchy creates decision paralysis. Prioritized ordering eliminates the "which one should I do first?" question.

"Attention as a scarce resource" (Kahneman, 2011): humans have limited willpower per day. Smart Priority spends that willpower where it matters most — on the habit closest to breaking — rather than distributing it evenly across habits that are already on track.

"Pre-commitment" research: knowing what to do first reduces the activation energy of starting. Opening the app and seeing "Exercise is #1 today because your streak is at risk" is more motivating than scanning a grid and deciding.

**Data model:** None. Computed from existing log data.

**Implementation:**
- Priority score function taking: days since last completion, current streak, weekly average, day-of-week history
- Sort habits by priority score (descending) with completed habits at bottom
- "Reason" string generation from top contributing factor
- Toggle between "Smart Sort" and manual order
- Priority recalculates on each page load

**Effort:** Small (~30 min). Score function, sort, reason-string generation. No server changes. Works best as an extension of Today Dashboard (D3) but can stand alone.

---

### E5. Quick Command Bar

**Gap filled:** Every interaction requires navigating UI elements — forms, dropdowns, grid cells. No fast-path exists for experienced users who want speed over chrome.

**What:** A keyboard-triggered command bar (Ctrl+K or `/`) that accepts natural text commands:

```
┌──────────────────────────────────────────────────────┐
│  > done exercise                                     │
│                                                      │
│  → Mark "Exercise 30 min" as complete for today      │
│  → Press Enter to confirm                            │
└──────────────────────────────────────────────────────┘
```

Supported commands:

| Command | Action |
|---------|--------|
| `done [name]` | Toggle completion for today |
| `done [name] yesterday` | Toggle completion for yesterday |
| `new [name] daily` | Create a daily habit |
| `new [name] weekly` | Create a weekly habit |
| `skip [name]` | Mark as intentional skip (if grace days are implemented) |
| `archive [name]` | Archive a habit |
| `stats [name]` | Show quick stats popup |

Name matching is fuzzy — `done ex` matches "Exercise 30 min." If ambiguous, a dropdown shows matches:

```
┌──────────────────────────────────────────────────────┐
│  > done re                                           │
│                                                      │
│  → Read 20 pages                                     │
│  → Reduce screen time                                │
│                                                      │
│  Select one or type more to narrow down              │
└──────────────────────────────────────────────────────┘
```

The command bar is always available, never required. It's a power-user accelerator, not a replacement for the visual UI.

**Why it's different from every existing proposal:**
- **Keyboard shortcuts** (mentioned in v11 UX) refers to navigation shortcuts (arrow keys in the grid). Quick Command Bar is a text-based interaction model — type what you want to do, not navigate to where it happens.
- **Today Dashboard** (D3) simplifies the visual interface. Quick Command Bar simplifies the interaction itself — from "find the right button" to "type what you mean."
- No existing proposal introduces text-based interaction. Every proposal assumes point-and-click or tap as the only input mode.

**Behavioral science:** "Direct manipulation" vs. "conversational interaction" (Hutchins et al., 1985). Grid UIs use direct manipulation — you see the state and click to change it. Command bars use conversational interaction — you state your intent and the system executes. For routine actions (daily check-in), conversational interaction is faster because it skips the visual search step entirely.

"Expert user optimization" (Nielsen, 1993): novice users need visual cues; expert users need shortcuts. Habit tracking is a daily activity — users become experts quickly. The command bar serves the expert without removing the novice interface.

Practical benefit: `done exercise` takes ~1 second. Finding the right column in a 14-day grid and clicking the right cell takes 3-5 seconds. Over 365 days × 5 habits, the command bar saves ~30 minutes of pure interaction time per year.

**Data model:** None. Dispatches to existing actions (toggle, create, archive).

**Implementation:**
- Command bar component (modal overlay triggered by Ctrl+K or `/`)
- Command parser: split input into verb + target + modifier
- Fuzzy name matching against active habits
- Dispatch to existing `useHabits` functions (toggle, addHabit, archive)
- Keyboard navigation for disambiguation dropdown
- Auto-dismiss on successful action with brief confirmation toast

**Effort:** Medium (~45 min). Command bar UI, parser, fuzzy matcher, keyboard handling. No server changes.

---

## What Makes E1-E5 Different From Everything Before

| ID | Feature | Structural Gap | Why 59 Prior Proposals Missed It |
|----|---------|---------------|----------------------------------|
| E1 | Accountability Snapshot | No outward-facing features | All prior thinking assumed the app is used alone. Accountability requires making progress visible to others — even via a screenshot. |
| E2 | Challenge Mode | No finite goals | All prior thinking modeled habits as infinite behaviors. Challenges are finite games with endpoints — a fundamentally different motivational structure. |
| E3 | Miss Pattern Map | No failure analysis | All prior visualizations celebrate success. Failure data is more actionable — it shows exactly where to intervene. |
| E4 | Smart Priority Queue | No intelligent ordering | All prior proposals treat habits as equal-priority items. Data-driven prioritization turns the app from a passive tracker into an active advisor. |
| E5 | Quick Command Bar | No text-based interaction | All prior proposals assume visual, point-and-click interaction. Text commands serve the daily-use power user who wants speed. |

---

## Definitive Execution Backlog

This is the single prioritized list. Every item is independent (no dependencies between tiers). Estimated times are for a single developer in one session.

### Tier 0: Ship the Basics (do these before anything else)

| # | Feature | What | Est. |
|---|---------|------|------|
| 1 | API error handling | Check `res.ok` in all `api.ts` fetch calls, throw on failure, surface in toast | 15 min |
| 2 | Edit habit | PUT `/api/habits/:id` endpoint + inline edit mode in HabitRow | 40 min |
| 3 | Unarchive | POST `/api/habits/:id/unarchive` endpoint + "Archived" section in UI with unarchive button | 30 min |

**Done means:** Create, edit, archive, unarchive, delete all work. API failures show a meaningful toast.

### Tier 1: Transform Daily Experience

These features change how the app feels to use every day. Highest impact-to-effort ratio.

| # | Feature | Est. | Source | Rationale |
|---|---------|------|--------|-----------|
| 4 | Today Dashboard | 35 min | D3 | Alternative daily interface: focused checklist vs. grid |
| 5 | Smart Priority Queue | 30 min | **NEW E4** | Data-driven habit ordering: at-risk habits first |
| 6 | Quick Command Bar | 45 min | **NEW E5** | `done exercise` — sub-second daily check-in |
| 7 | Cue anchoring | 10 min | v11 | Optional "when/where" trigger text per habit |
| 8 | Anchor statement | 10 min | C3 | Optional "why I do this" text, shown at inflection points |
| 9 | Micro-habit fallback | 30 min | D2 | Tiny version of a habit for hard days |
| 10 | Habit ordering | 35 min | v9 | Manual up/down reordering |

### Tier 2: Deepen Motivation & Insight

These features add psychological depth without requiring accumulated data.

| # | Feature | Est. | Source | Rationale |
|---|---------|------|--------|-----------|
| 11 | Habit Challenge Mode | 40 min | **NEW E2** | Time-bounded goals: "30 days of X" with trophy case |
| 12 | Accountability Snapshot | 50 min | **NEW E1** | Shareable progress card — accountability without social |
| 13 | Momentum decay sparkline | 25 min | C2 | Ambient 7-day trend per habit row |
| 14 | Compound progress tracker | 30 min | C1 | "You've run 267 km" — cumulative output in native units |
| 15 | Streak milestones (7/30/90/365) | 50 min | v9 | Celebrate long streaks with badges + animation |
| 16 | 2-Day Rule streak mode | 35 min | v10 | Alternative streak: never-miss-twice |
| 17 | Streak Recovery Mode | 40 min | D5 | 3-day recovery window after a long streak breaks |

### Tier 3: Analytics & Intelligence (30+ days of data)

| # | Feature | Est. | Source | Rationale |
|---|---------|------|--------|-----------|
| 18 | Miss Pattern Map | 45 min | **NEW E3** | Day-of-week miss analysis, cluster detection, recovery rate |
| 19 | Year-at-a-Glance Graph | 45 min | D1 | 365-day contribution graph per habit |
| 20 | Habit Pair Discovery | 50 min | D4 | Which habits co-occur? Find your keystone habits |
| 21 | Weekly Rhythm Score | 30 min | C4 | Per-habit weekly consistency percentage |
| 22 | Miss Reason Capture | 40 min | v11 | One-tap reason after a missed day |
| 23 | Start Friction Log | 30 min | C5 | One-tap difficulty after completing a habit |
| 24 | Inline 30-Day Heatmap | 35 min | v10 | Expandable 30-day color grid per habit |
| 25 | Habit Maturity & Graduation | 55 min | v11 | Automaticity detection + Hall of Fame |

### Parked (valid ideas, wrong time)

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | High effort, the differentiator — build when basics + daily experience are solid |
| Life Balance Radar | Needs categories/tags system first |
| Habit Stacking / Chains | Complex data model, wait for simpler relationship features |
| Weekly Compass | Needs simpler reflection features first |
| Difficulty Progression | Needs micro-habit fallback and maturity detection first |
| Earned Streak Shields | Needs streak milestones and 2-day rule first |
| Completion Sparks | Cosmetic polish, not core functionality |
| Data Export/Import | Important eventually, not a daily-experience improvement |
| PWA / Offline | Large effort, separate project |
| Dashboard / Analytics | Needs months of real data |
| Theme Toggle | Cosmetic, not blocking |

---

## Feature Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│                     Tier 0: Basics                          │
│          Edit ──── Unarchive ──── Error Handling            │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    E5 Command Bar   D3 Today View   E2 Challenge Mode
          │               │               │
          │  dispatches to │  enhanced by  │  completions in
          ▼               ▼               ▼
    E4 Smart Priority ──→ Habit List ←── D2 Micro-Fallback
          │                               │
          │  uses data from               │  protected by
          ▼                               ▼
    E3 Miss Pattern ──→ Insights ←────── D5 Streak Recovery
          │                               │
          │  feeds into                   │  visualized by
          ▼                               ▼
    D4 Pair Discovery    E1 Snapshot ←── D1 Year Graph
```

All features are independently buildable. Arrows show enhancement relationships, not dependencies.

---

## Planning Debt Acknowledgment

This project has **13 planning documents totaling ~7,500 lines and 64 proposed features with 0 features shipped.** The planning-to-code ratio is roughly 8:1 (planning lines to app code lines).

This document does not solve that problem by being a better plan. It solves it by being the LAST plan:

1. **No more feature proposals after this.** 64 features is more than enough for a 960-line app. The next document committed to this repo should be code, not planning.
2. **Tier 0 is non-negotiable.** The app is missing basic edit functionality. Nothing else matters until that ships.
3. **Tiers 1-3 are a menu, not a sequence.** Pick any item, build it, ship it, pick the next one. The tier numbers suggest priority, not gates.
4. **Each feature is scoped to one session.** Nothing on this list takes more than 55 minutes. If you can't ship it in one sitting, break it down further or drop it.

The measure of success is not the quality of this document. It's whether the next commit after this one contains TypeScript.
