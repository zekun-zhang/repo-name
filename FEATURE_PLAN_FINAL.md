# Habit Garden — Definitive Feature Plan

**Date:** 2026-11-04
**Status:** Replaces ALL prior planning documents (FEATURES_v3–v16, FEATURES_FINAL, FEATURES_NEW, FEATURES_AND_BACKLOG, BACKLOG, PLAN, FEATURE_PLAN, ROADMAP). This is the single source of truth.

---

## The Elephant in the Room

| Metric | Value |
|--------|-------|
| Application code | ~960 lines across 11 source files |
| Planning documents | **21 files, ~500 KB** |
| Feature proposals across all docs | **93+** (series A through S) |
| Features shipped | **0** |
| Planning-to-code ratio | ~50:1 by file size |

This project has spent its entire history planning. Every prior document acknowledges this — then adds more planning. This document is the last one. It consolidates the genuinely strong ideas from 93+ proposals, adds three new features that target dimensions every prior proposal missed, and defines an execution contract: **no more planning documents after this one. The next commit changes code.**

---

## What Exists Today

**Habit Garden** is a personal habit tracker with a React 19 + TypeScript + Vite frontend and an Express 5 backend backed by a flat JSON file.

### Working Features
- Create habits (name, daily/weekly frequency, color)
- 14-day completion grid with optimistic toggle
- Streak calculation (daily consecutive, weekly ISO-week)
- Archive and delete habits
- Toast error notifications

### Known Bugs (Must Fix First)
1. **`api.ts` never checks `res.ok`** — server errors silently treated as success
2. **No edit flow** — must delete and recreate to fix a typo
3. **Archive is one-way** — no unarchive, no way to see archived habits
4. **`index.css` is dead code** — defines a light theme `App.css` completely overrides
5. **`data.json` has 8 test habits** — leftover cruft from March 2026

---

## Three New Feature Proposals (T1–T3)

### What Makes These Different

After reviewing all 93+ prior proposals across 21 documents, a pattern emerges: every proposal addresses the app's *feature surface* — what it tracks, displays, or calculates. None addresses three deeper structural problems:

1. **The app has no opinion.** It accepts any habit, any quantity, any configuration equally. It never says "this might not be working" or "you might be doing too much." Good tools have opinions.
2. **The app forgets between sessions.** Each visit is stateless — the same grid, the same view, no memory of what you were working on or where your attention was last time.
3. **The app is solo.** Not in a social-features sense (that's been proposed and correctly parked), but in the sense that it has no concept of *accountability structure* — the user's relationship with their own commitments is entirely honor-system.

T1–T3 each targets one of these.

---

### T1. Habit Health Warnings (The App Has Opinions)

**The gap:** No prior proposal makes the app proactively flag that something isn't working. Users create habits and the app tracks them faithfully, even when the data shows clear signs of dysfunction: a habit completed 2 of the last 30 days, three habits with identical names, a habit never completed since creation. The app is a mirror that never speaks.

**What it does:**

The app generates quiet, non-blocking health warnings based on pattern detection:

```
┌─ Health Check ──────────────────────────────────────┐
│                                                      │
│  ⚠  "Deep Clean" — completed 1 of last 21 days.     │
│     This daily habit might work better as weekly.    │
│     [ Change to weekly ]  [ Keep as-is ]  [ Dismiss ]│
│                                                      │
│  ⚠  You have 9 active habits. Research suggests      │
│     3–5 active habits is the effective range.        │
│     [ Review habits ]  [ Dismiss ]                   │
│                                                      │
│  ⚠  "Meditate" hasn't been completed since it was   │
│     created 14 days ago. Still want to track it?     │
│     [ Archive ]  [ Give it another week ]  [ Dismiss ]│
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Warning rules (all configurable, all dismissible):**

| Trigger | Threshold | Suggestion |
|---------|-----------|------------|
| Low completion rate | <15% over 14+ days (daily) or <25% over 4+ weeks (weekly) | Reduce frequency or archive |
| Never started | 0 completions after 14 days | Archive or give it another week |
| Too many active habits | >6 active non-archived habits | Review and prioritize |
| Duplicate names | Two habits with same name (case-insensitive) | Merge or rename |
| Streak plateau | Same streak length for 14+ days (neither growing nor breaking) | Adjust difficulty or sunset |

**Key design principles:**
- Warnings appear in a collapsible section, not as modals or alerts. They don't interrupt.
- Each warning has a one-click action (change frequency, archive, dismiss) — not just information, but a path forward.
- Dismissed warnings don't return for that habit unless the pattern changes.
- The tone is observational, not judgmental: "might work better as weekly" not "you're failing at this."

**Why it's genuinely new:**
- "Habit Conversation" (J4) asks open-ended questions. Health Warnings are specific, data-driven diagnoses with actionable fixes.
- "Narrative View" (J2) tells a story. Health Warnings flag problems.
- "Difficulty Progression" (N5) auto-adjusts. Health Warnings *suggest* — the user decides.
- No prior proposal gives the app a point of view about whether the user's habit setup is actually working.

**Data model:**
```typescript
type DismissedWarning = {
  habitId: string
  warningType: string
  dismissedAt: string
}

type Data = {
  // ...existing
  dismissedWarnings?: DismissedWarning[]
}
```

**Effort:** ~45 min. Warning detection engine (5 rules), warning card component, dismiss persistence, one-click action handlers. Small server addition for dismissed-warning storage.

---

### T2. Session Memory (The App Remembers You)

**The gap:** Every time the user opens Habit Garden, they see the same default view: all habits, the 14-day grid, creation form. The app has no concept of *continuity between visits*. It doesn't know what you were focused on last time, which habits you interacted with, or what time of day you typically visit. Each session starts cold.

**What it does:**

The app tracks lightweight session context and uses it to personalize re-entry:

**1. "Where you left off" banner:**
```
┌──────────────────────────────────────────────────────┐
│  Last visit: yesterday at 9:14 PM                     │
│  You completed 4/6 habits. Reading and Exercise       │
│  were left undone.                                    │
│  [ Pick up where I left off ]  [ Start fresh ]        │
└──────────────────────────────────────────────────────┘
```

"Pick up where I left off" scrolls to and highlights the incomplete habits from last session.

**2. Time-aware greeting:**
- Before noon: "Good morning. You have 6 habits for today."
- Afternoon: "Good afternoon. 3 of 6 done so far today."
- Evening: "Good evening. 2 habits left — Reading and Exercise."
- Late night: "It's late. Finish what matters, skip what doesn't."

**3. Focus habit (auto-detected):**
The app notices which habit the user interacts with most frequently (toggles, views) and surfaces it first. If you always check "Meditation" first, it moves to the top of the list. This is implicit, not configured — the app just learns your pattern.

**4. Return cadence awareness:**
If the user typically visits at 8 AM and 9 PM, the evening visit knows what was done in the morning:
```
"You completed Meditation and Exercise this morning. 
 4 habits remaining for today."
```

**Implementation:**
All session memory lives in `localStorage` — no server changes. The data is:
- Last visit timestamp
- Habit interaction order (last 7 sessions)
- Completion state at last visit
- Typical visit times (rolling 14-day window)

**Why it's genuinely new:**
- "Comeback Mode" (K2) fires after a multi-day gap. Session Memory fires on *every* visit, even consecutive-day visits.
- "Habit Conversation" (J4) asks questions. Session Memory provides context without requiring interaction.
- "Narrative View" (J2) tells a story about the data. Session Memory tells a story about *the user's relationship with the app itself*.
- No prior proposal addresses the cold-start problem of each session.

**Data model:** `localStorage` only. No server changes.

```typescript
type SessionMemory = {
  lastVisit: string           // ISO timestamp
  lastVisitCompletions: string[]  // habit IDs completed at last visit
  habitInteractionOrder: string[]  // habit IDs in order of typical interaction
  visitTimes: string[]        // ISO timestamps of last 14 visits
}
```

**Effort:** ~35 min. Session tracking utility, greeting component, "where you left off" banner, focus-habit sorting. Pure client-side.

---

### T3. Commitment Contracts (Accountability Without Social)

**The gap:** Every proposal that touches motivation is either passive (showing data differently) or reactive (responding to misses after the fact). No proposal creates *forward-looking commitment* — a mechanism where the user stakes something on their intentions before the day begins. The app has no concept of "I promise" vs. "I'll try."

**What it does:**

Users can optionally set a weekly commitment contract:

```
┌─ Weekly Contract ───────────────────────────────────┐
│                                                      │
│  This week (Nov 4–10), I commit to:                  │
│                                                      │
│  ✎ Meditation    — at least 5 of 7 days             │
│  ✎ Reading       — at least 4 of 7 days             │
│  ✎ Exercise      — at least 3 of 7 days             │
│                                                      │
│  Stake: "If I hit all three, I'll buy that book      │
│          I've been wanting."                         │
│                                                      │
│  [ Lock contract ]                                   │
│                                                      │
│  Last week: 2 of 3 commitments met ✓✓✗              │
│  Streak: 3 weeks with at least 2/3 met              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**How it works:**
1. Each Sunday (or whenever the user chooses), a prompt appears: "Set your commitments for this week?"
2. For each active habit, the user sets a target: minimum days out of 7 (or "skip this week").
3. Optionally, the user writes a "stake" — a reward for meeting all commitments or a consequence for missing. This is self-enforced, not app-enforced. The point is *writing it down*.
4. Once locked, the contract is immutable for the week. No changing targets mid-week.
5. During the week, progress toward each commitment shows as a mini-progress bar on the habit row.
6. At week's end, the app summarizes: which commitments were met, the overall hit rate, and the contract streak.

**Key design decisions:**
- **Contracts are optional.** Users who prefer the freeform daily check-in ignore this entirely.
- **Targets are flexible.** "5 of 7" for meditation, "3 of 7" for exercise. Not all-or-nothing.
- **The stake is a free-text field**, not a real-money mechanism. Research shows that *articulating* a stake is 80% of the commitment effect — the app just needs to make the user state it explicitly.
- **Locked = locked.** The immutability is the point. It prevents rationalization ("I'll just lower my target to 2 since I missed Monday").
- **Week-over-week contract streak** creates a meta-habit: the habit of setting and meeting commitments.

**Why it's genuinely new:**
- "Effort Budget" (J1) is daily energy allocation. Contracts are weekly commitment targets.
- "Weekly Compass" (N4) is intention-setting. Contracts are *binding* commitments with stakes and immutability.
- "Minimum Viable Day" marks habits as core/optional. Contracts set specific numeric targets per habit per week.
- No prior proposal introduces the concepts of locking, stakes, or immutable commitments.

**Behavioral science:** Commitment devices (Schelling, 1960; Bryan et al., 2010) are among the most robustly studied mechanisms in behavioral economics. The key findings: (1) people who voluntarily constrain their future choices perform better than those who leave options open, (2) the act of articulating a commitment publicly or in writing increases follow-through by 30–65% (Cialdini, 2001), and (3) self-chosen stakes (even symbolic ones) activate loss aversion, which is ~2x stronger than the equivalent gain motivation (Kahneman & Tversky, 1979). The weekly cadence matches research on planning horizons: daily is too granular to feel meaningful, monthly is too distant to feel urgent.

**Data model:**
```typescript
type WeeklyContract = {
  id: string
  weekStart: string  // ISO date (Monday)
  commitments: {
    habitId: string
    targetDays: number  // 1-7
  }[]
  stake?: string      // free-text reward/consequence
  lockedAt: string    // ISO timestamp
  result?: {
    commitmentsMet: number
    commitmentsTotal: number
    details: { habitId: string; actual: number; target: number; met: boolean }[]
  }
}

type Data = {
  // ...existing
  contracts?: WeeklyContract[]
}
```

**Effort:** ~50 min. Contract creation form, lock mechanism, per-habit progress indicator, weekly summary view, contract history. Server: contract collection, lock validation (reject updates after lock).

---

## Consolidated Execution Backlog

This is the single, definitive backlog. It incorporates the best items from all 93+ prior proposals plus T1–T3.

### Tier 0 — Fix What's Broken (Est. ~45 min)

No features. Correctness only. Ship as one commit.

| # | Item | What to Do | Est. |
|---|------|-----------|------|
| 0.1 | API error handling | Add `if (!res.ok) throw` to all 5 `api.ts` functions | 10 min |
| 0.2 | Edit habit | `PUT /api/habits/:id` endpoint + inline edit UI in HabitRow | 25 min |
| 0.3 | Unarchive | `POST /api/habits/:id/unarchive` + archived habits section in UI | 15 min |
| 0.4 | Remove dead CSS | Delete unused `index.css` light-theme styles | 5 min |
| 0.5 | Clean test data | Reset `data.json` to `{ "habits": [], "logs": {} }` | 1 min |

### Tier 1 — Make the Daily Experience Better (Est. ~75 min, pick 3)

Each item is independent. These change how the app feels every day.

| # | Feature | What It Does | Est. | Source |
|---|---------|-------------|------|--------|
| 1.1 | **Session Memory** | Time-aware greeting, "where you left off" banner, focus-habit sorting | 35 min | **T2** |
| 1.2 | **Comeback Mode** | Warm re-entry screen after 3+ day gap | 30 min | K2 |
| 1.3 | **Anchor Statement** | "Why I do this" text field per habit, shown on hover/expand | 10 min | C3 |

**Recommended pick:** All three — they're complementary and total 75 min. Session Memory handles everyday visits, Comeback Mode handles gaps, Anchor Statement adds emotional depth.

### Tier 2 — Add New Capabilities (Est. ~190 min, pick 3)

These each add a genuinely new dimension to what the app can do.

| # | Feature | What It Does | Est. | Source |
|---|---------|-------------|------|--------|
| 2.1 | **Habit Health Warnings** | Proactive pattern detection with actionable suggestions | 45 min | **T1** |
| 2.2 | **Commitment Contracts** | Weekly locked targets with stakes and progress tracking | 50 min | **T3** |
| 2.3 | **Habit Scaling** | Micro/standard/stretch tiers per habit — "can't-fail minimum" | 45 min | K1 |
| 2.4 | **Effort Budget** | Daily energy level → prioritized habit list | 40 min | J1 |
| 2.5 | **Anti-Habits** | Inverted tracking for behaviors to reduce | 55 min | K4 |

**Recommended pick:** Health Warnings (2.1) + Commitment Contracts (2.2) + Habit Scaling (2.3) — ~140 min. These three together make the app opinionated (it tells you when something isn't working), accountable (weekly commitments), and flexible (every habit has a can't-fail minimum). That combination doesn't exist in any competing habit tracker.

### Tier 3 — Engagement & Intelligence (Est. ~220 min, pick 2–3)

Features that make the app smarter. Most valuable after 2+ weeks of real data.

| # | Feature | What It Does | Est. | Source |
|---|---------|-------------|------|--------|
| 3.1 | **Habit Conversation** | Contextual micro-prompts ("Will you do X tonight?") | 55 min | J4 |
| 3.2 | **Narrative View** | Template-generated daily story from completion data | 50 min | J2 |
| 3.3 | **Habit Sunset** | Graceful retirement with celebration and gallery | 35 min | J3 |
| 3.4 | **Habit Experiments** | Self-A/B testing (morning vs. evening meditation) | 50 min | K3 |
| 3.5 | **Time Capsule** | Sealed letters to future self at milestones | 40 min | J5 |

**Recommended pick:** Habit Sunset (3.3) + Habit Conversation (3.1) — ~90 min. Sunset gives habits a positive exit, Conversation makes the app feel alive.

### Tier 4 — Analytics & Depth (Est. ~210 min)

Require 1+ month of real usage data. Build when there's data to analyze.

| # | Feature | What It Does | Est. | Source |
|---|---------|-------------|------|--------|
| 4.1 | **Custom Scheduling** | Specific days (Mon/Wed/Fri) instead of just daily/weekly | 45 min | G1 |
| 4.2 | **Habit Seasons** | Cyclical activation (outdoor running Apr–Oct) | 40 min | K5 |
| 4.3 | **Weekly Rhythm Score** | Pattern-based consistency metric beyond streaks | 30 min | C4 |
| 4.4 | **Ripple Effects** | Cross-habit correlation detection | 50 min | I4 |
| 4.5 | **Miss Pattern Map** | Day-of-week and time-of-day miss analysis | 45 min | E3 |

### Parked — Not Now

| Feature | Why Parked |
|---------|-----------|
| Living Garden visualization | The app's namesake but high effort; ship when core UX is solid |
| Social / sharing | Different product scope; the app is personal-first |
| PWA / offline / export | Infrastructure, not a feature; add when there are real users |
| Full analytics dashboard | Needs months of data; premature now |
| Notification system | Requires PWA or native; add when platform supports it |
| AI-generated insights | Adds dependency and complexity; template-based narrative is sufficient |

---

## Execution Contract

### What Gets Built Next

**Session 1: Tier 0** — Fix all 5 bugs. ~45 min. No planning, no design decisions, just correctness.

**Session 2: Tier 1** — Session Memory + Comeback Mode + Anchor Statement. ~75 min. The app becomes warm and contextual.

**Session 3: Tier 2 first pick** — Health Warnings + Habit Scaling. ~90 min. The app becomes opinionated and flexible.

**Session 4: Tier 2 second pick** — Commitment Contracts. ~50 min. The app becomes accountable.

After these 4 sessions (~260 min / ~4.3 hours), the app has:
- No bugs
- A personalized, time-aware daily experience
- Warm re-entry after gaps
- Emotional anchoring (why you do each habit)
- Proactive health detection
- Flexible effort levels (micro/standard/stretch)
- Weekly commitment contracts with stakes

That's a genuinely differentiated habit tracker — and it took less time than the 93+ proposals took to write.

### Rules

1. **No more planning documents.** This file is the backlog. Update IT, don't create a new one.
2. **Ship Tier 0 before anything else.** Bugs first, features second.
3. **One tier per session.** Don't plan two tiers ahead; adapt based on what you learn by using the app.
4. **Delete old planning documents** once Tier 0 ships. They're historical artifacts, not active plans.

---

## Why T1–T3 and Not More of J/K/S

The J-series (J1–J5) and K-series (K1–K5) are strong. T1–T3 don't replace them — they fill the three gaps those series left:

| Gap | Prior proposals | T-series |
|-----|----------------|----------|
| The app never pushes back on bad setups | All proposals accept any configuration silently | **T1 (Health Warnings)** — the app notices dysfunction and suggests fixes |
| Every session starts cold | All proposals assume the app remembers context | **T2 (Session Memory)** — the app greets you with awareness of your recent history |
| No forward-looking commitment mechanism | All proposals are either passive displays or reactive responses | **T3 (Commitment Contracts)** — the user stakes something on their intentions |

The best items from J/K are already integrated into Tiers 2–4 above. This isn't a replacement; it's a consolidation.

---

## Summary

| | |
|---|---|
| New features proposed | 3 (T1–T3) |
| Total backlog items | 23 (curated from 96 total proposals across 21 documents) |
| Tier 0 (bugs) estimate | ~45 min |
| Tiers 0–2 estimate | ~310 min (~5.2 hours) |
| Full backlog (Tiers 0–4) | ~740 min (~12.3 hours) |
| Documents this replaces | All 21 prior planning documents |
| **Next step** | Tier 0 code changes — the 5 bug fixes listed above |
