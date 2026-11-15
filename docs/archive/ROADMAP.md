# Habit Garden — Roadmap

**Date:** 2026-10-21
**Author:** Automated codebase review
**Status:** Replaces FEATURES_v3–v16, FEATURES_FINAL, BACKLOG, and PLAN as the single planning reference

---

## Reality Check

| Metric | Value |
|--------|-------|
| Application code | ~960 lines, 11 source files |
| Working features | Create, toggle (14-day grid), streaks, archive, delete |
| Planning documents | **17** (including FEATURES_FINAL) |
| Total lines of planning | **~9,200** |
| Total features ever proposed | **83** |
| Features shipped | **0** |
| Planning-to-code ratio | ~9.6 lines of planning per line of code |

The codebase has a documentation problem — not too little, but too much of the wrong kind. Every prior document acknowledges this, then adds 400–800 more lines. This document breaks the cycle by doing two things differently:

1. **Fewer proposals, deeper reasoning.** Five features, each targeting a dimension that all 83 prior proposals genuinely missed.
2. **Ship-first backlog structure.** Tier 0 is bugs that take under an hour. Each tier after that is one session of work.

---

## What the App Actually Is (For Anyone Reading This Cold)

Habit Garden is a personal habit tracker:

- **Frontend:** React 19 + TypeScript + Vite. Dark-themed, responsive 2-column layout. A creation form on the left, a 14-day completion grid on the right.
- **Backend:** Express server reading/writing a flat JSON file (`data.json`) with an async mutex for concurrency.
- **Data model:** `Habit { id, name, frequency (daily|weekly), color, createdAt, archived }` and `HabitLog { [habitId]: string[] }` (array of completion dates).
- **Key UX:** Optimistic updates with rollback, toast error notifications, streak calculation (daily consecutive, weekly ISO-week consecutive).

### Known Defects in Current Code

1. **`api.ts` never checks `res.ok`** — server 500s are silently treated as success.
2. **No edit-habit flow** — users must delete and recreate to fix a typo.
3. **Archive is one-way** — no unarchive, no visibility of archived habits.
4. **`index.css` is dead code** — defines a light theme that `App.css` completely overrides.
5. **`data.json` has test cruft** — 8 habits named "test" / "123" from March 2026.

---

## New Feature Proposals (J1–J5)

### Design Principle

Every prior proposal adds *more information* to the screen — more metrics, more visualizations, more data dimensions. These five proposals instead change *how the user relates to the app*: how they enter it, what it asks of them, how it speaks, what it hides, and when it lets go.

---

### J1. Effort Budget (Daily Energy-Aware Prioritization)

**What 83 proposals missed:** Every proposal treats habits as equally weighted. A user with 8 daily habits implicitly commits to all 8 every day. No proposal acknowledges that willpower, time, and energy are finite resources, and that attempting everything daily is itself a failure mode that causes abandonment.

**What it does:**

At the start of each day (or on first open), the user sets a simple energy level: Low (3 points) / Medium (5) / High (7). Each habit has a user-assigned effort cost (1–3 points, default 1). The app shows which habits fit today's budget and which to skip guilt-free.

```
Today's energy: ⚡ Medium (5 pts)

Affordable today:              Costs:
  ○ Meditate 10 min            1 pt
  ○ Read 20 pages              1 pt
  ○ Walk the dog               1 pt
  ○ Journal                    1 pt
                          ─────────
  Budget remaining:            1 pt

Over budget (skip guilt-free):
  ◌ Exercise 30 min            2 pts
  ◌ Deep clean                 3 pts
  ◌ Study Spanish              2 pts
```

Key design decisions:
- "Skip guilt-free" is the critical label — it reframes skipping as *strategic* instead of *failure*.
- Habits are auto-sorted by cost within the budget, cheapest first (quick wins create momentum).
- The budget is optional. Users who prefer the current "do everything" model ignore it. One boolean on the settings, not a forced flow.
- Low-cost habits that the user always completes (low friction + low cost) are candidates for "graduation" — a signal the habit is automated and doesn't need tracking.

**Why it's different from every prior proposal:**
- "Minimum Viable Day" (prior proposal) lets users mark habits as "core" vs. optional — a binary split. Effort Budget is a *continuous* resource allocation with variable costs. MvD says "these are important"; Effort Budget says "today, you have this much to give."
- "Energy-Aware Check-In" (prior) captures how you *feel*. Effort Budget converts that feeling into *prioritization*. One is data capture; the other is decision support.
- "Focus Spotlight" highlights one habit. Effort Budget surfaces the optimal *set* for today.

**Behavioral science:** Ego depletion (Baumeister et al., 1998) and its modern reframing as "resource allocation" (Inzlicht & Schmeichel, 2012) both converge on the same practical insight: treating each day as having unlimited capacity causes people to attempt too much, fail partway, and feel defeated. The budget makes the constraint visible and turns partial completion into a win ("5/5 budget spent") instead of a loss ("5/8 habits done").

**Data model:**
```typescript
type Habit = {
  // ...existing
  effortCost?: number  // 1-3, default 1
}

type DailyBudget = {
  [date: string]: 'low' | 'medium' | 'high'
}
```

**Effort:** ~40 min. Energy selector component, habit cost field, sorting/partitioning logic, new small server collection for daily budgets.

---

### J2. Habit Narrative View (Story Mode)

**What 83 proposals missed:** Every visualization proposal (heatmaps, sparklines, radar charts, ripple maps, hour grids) presents data as *numbers and shapes*. No proposal changes the *medium* — the fundamental way information is communicated. Tables and charts are analytical. Stories are emotional. And habits are emotional.

**What it does:**

A toggle that switches the main view from the grid/table to a generated daily narrative:

```
┌──────────────────────────────────────────────────────┐
│  📖  Tuesday, October 21                              │
│                                                       │
│  You started strong — Exercise and Meditation both    │
│  done before noon. That's the 12th day in a row for  │
│  Meditation, quietly becoming one of your steadiest   │
│  habits.                                              │
│                                                       │
│  Reading is waiting. You usually get to it around     │
│  8 PM — there's still time.                           │
│                                                       │
│  Journaling has been tough this week (1 of 4 days).   │
│  Last time you had a week like this was September —   │
│  you bounced back and hit 6 the following week.       │
│                                                       │
│  3 of 6 done today. You've had days like this before  │
│  and finished strong.                                 │
│                                                       │
│  [Complete a habit to continue the story →]           │
└──────────────────────────────────────────────────────┘
```

The narrative is **generated from data, not AI** — it uses templates filled with computed values:
- Streak facts ("12th day in a row")
- Time-of-day patterns ("you usually do this around 8 PM")
- Week-over-week comparisons ("1 of 4 this week vs. 6 last week")
- Historical precedent for recovery ("last time this happened, you bounced back")
- Forward-looking encouragement grounded in the user's own history (not generic platitudes)

Each habit completion updates the story in real-time. The narrative builds through the day like a chapter being written.

**Why it's different:**
- Every prior visualization shows data *about* habits. Narrative View tells a *story with* the data. It's a different cognitive register entirely: System 1 (narrative, emotional, automatic) vs. System 2 (analytical, effortful, deliberate).
- "Anchor Statement" (C3) is one static line. Narrative View is a dynamic, personalized story that changes every day.
- "Weekly Compass" (N4) is intention-setting. Narrative View is real-time commentary on the day as it unfolds.

**Behavioral science:** Narrative identity theory (McAdams, 2001) — people understand their lives through stories, not statistics. "I'm on a 12-day meditation streak" is a fact. "Meditation has quietly become one of your steadiest habits" is an identity statement. The second is stickier because it connects the behavior to who the user is becoming. Research on "self-narratives and health behavior" (Pennebaker, 1997) shows that storytelling about one's own behavior increases commitment to that behavior.

**Data model:** None. Pure rendering layer over existing habits, logs, and computed metrics (streaks, weekly counts, time patterns).

**Effort:** ~50 min. Template engine (15–20 sentence templates with computed slots), narrative component, toggle to switch views. No server changes.

---

### J3. Habit Sunset (Graceful Ending)

**What 83 proposals missed:** Every proposal assumes habits are permanent — you either maintain them or you fail. "Archive" is the only exit, and it's presented as giving up. No proposal addresses the reality that *completing* a habit (reaching a goal, internalizing a behavior, or simply deciding it no longer serves you) is a legitimate, positive outcome. Habits should be able to end well.

**What it does:**

A "Sunset" action alongside Archive and Delete. When you sunset a habit:

1. **You choose a reason:**
   - "I've made this automatic — I don't need to track it anymore" (graduation)
   - "I've reached my goal" (completion)
   - "This no longer serves me" (intentional release)
   - "I want to make room for something else" (rotation)

2. **The habit enters a 7-day sunset period** — it stays visible but dimmed, with a gentle countdown. This prevents impulsive sunsets. During the period, you can cancel the sunset.

3. **After 7 days, it moves to the Sunset Gallery** — a separate view that honors retired habits:

```
🌅 Sunset Gallery

Graduated (became automatic):
  Drink 8 glasses of water    Mar–Aug 2026 (168 days)
  Take vitamins               Apr–Sep 2026 (153 days)

Goals reached:
  Read 50 books               Jan–Oct 2026 (287 days, 52 books)

Released:
  Learn piano                 Jun–Jul 2026 (45 days)
    "I realized I was doing this for someone else, not me."
```

4. **Sunset habits contribute to a "Habits Completed" lifetime counter** — a metric that *celebrates endings*. "You've successfully built and completed 7 habits." This reframes the app as a tool for *building* habits, not just *maintaining* them.

**Why it's different:**
- Archive hides habits in shame. Sunset celebrates their completion.
- Delete erases history. Sunset preserves and honors it.
- "Habit Maturity & Graduation" (dim 48) auto-detects when a habit is automatic. Sunset is *user-initiated* — only the user knows when a habit has served its purpose.
- "Quit/Avoidance Mode" (G3) tracks habits you want to stop. Sunset is for habits you've *finished* — the emotional valence is opposite (positive completion vs. negative cessation).

**Behavioral science:** The "Zeigarnik Effect" — incomplete tasks nag at us. A habit with no defined endpoint is permanently "incomplete." Sunset creates closure, which frees cognitive resources. Research on "goal disengagement" (Wrosch et al., 2003) shows that the *ability* to let go of goals is correlated with wellbeing. Apps that only reward persistence inadvertently punish healthy disengagement. The 7-day cooling period addresses impulsivity without creating friction — it's the "sleep on it" pattern.

**Data model:**
```typescript
type Habit = {
  // ...existing
  sunsetAt?: string       // ISO date when sunset was initiated
  sunsetReason?: 'graduated' | 'goal_reached' | 'released' | 'rotation'
  sunsetNote?: string     // optional personal note
  sunsetCompleteAt?: string  // sunsetAt + 7 days, when it fully retires
}
```

**Effort:** ~35 min. Sunset action button, reason selector, 7-day countdown display, Sunset Gallery component, "Habits Completed" counter. Small server changes (sunset fields on habit, filter for gallery view).

---

### J4. Habit Conversation (Micro Check-In Prompts)

**What 83 proposals missed:** Every proposal treats the app as a *dashboard* — you look at data, you tap checkboxes, you leave. No proposal makes the app *talk to you*. Not with notifications (many proposals suggest those), but with contextual micro-questions that turn habit tracking from data entry into a brief daily conversation.

**What it does:**

When you open the app, instead of (or alongside) the grid, you see one contextual question:

```
Good evening. You've done 4 of 6 habits today.

Meditation is the one you most often skip on Tuesdays.
→ Will you do it tonight, or give yourself a pass?

  [ I'll do it ]    [ Not tonight ]    [ Already did ]
```

The question is selected from your data — it's not random or generic. The algorithm picks the habit where a nudge is most likely to change the outcome (based on day-of-week patterns, current streak, time of day, and recent momentum).

After answering:
- "I'll do it" → the habit is highlighted (not completed, just flagged as an intention).
- "Not tonight" → the app acknowledges it without judgment and moves on. No streak warning.
- "Already did" → the completion is logged.

The conversation format also enables:
- **Weekly reflection prompts:** "This week you completed 85% of your habits. Which one felt the most meaningful?" (The answer is stored as a journal note.)
- **Pattern-based observations:** "You've completed Journaling 6 weeks in a row. How does it feel now compared to when you started?"
- **Gentle redirects:** "You created Deep Clean 3 weeks ago but have only done it twice. Want to adjust it to biweekly?"

Key constraint: **one question per session, maximum.** The conversation is a brief exchange, never a quiz or a chore.

**Why it's different:**
- "Completion Sparks" (N8) are celebrations — one-way output. Conversation is *bidirectional* — the app asks, the user responds.
- "Miss Reason Capture" (dim 45) fires after failure. Conversation fires *before or during* the day, when the outcome is still open.
- "Weekly Compass" (N4) is a structured review. Conversation is a single, contextual question — lower friction, higher engagement.
- "Anchor Statement" (C3) is static. Conversation prompts are dynamic and data-driven.

**Behavioral science:** Implementation intentions (Gollwitzer, 1999) — "Will you do X tonight?" is a commitment device. The mere act of answering "I'll do it" increases follow-through by 20–30% in meta-analyses (Webb & Sheeran, 2006). The "Not tonight" option is equally important: it practices *self-compassion* (Neff, 2003), which paradoxically increases long-term adherence. People who can skip without guilt try again tomorrow; people who feel guilty about skipping avoid the app entirely.

**Data model:**
```typescript
type CheckInResponse = {
  date: string
  habitId: string
  promptType: 'will_you' | 'reflection' | 'observation' | 'redirect'
  response: string  // 'commit' | 'pass' | 'done' | free-text for reflections
}

type Data = {
  // ...existing
  checkIns?: CheckInResponse[]
}
```

**Effort:** ~55 min. Question selection algorithm (day/week patterns, streak state), prompt templates, response handling, one new server collection. The weekly reflection prompt adds a simple text-input response flow.

---

### J5. Habit Time Capsule (Letter to Future Self)

**What 83 proposals missed:** Every proposal is about the *present* — what you're doing today, this week, this month. No proposal creates a connection between your *current self* and your *future self*. Behavioral economics shows this is the core problem of habit-building: we discount future rewards because our future self feels like a stranger.

**What it does:**

At habit creation, or at any milestone (7, 30, 90 days), the app offers a "Time Capsule" prompt:

```
You just hit 30 days of meditation.

Want to write a note to yourself at Day 90?

┌─────────────────────────────────────────────────┐
│ Hey future me — if you're reading this, you've  │
│ meditated for 3 months straight. Remember how    │
│ hard the first week was? Worth it.               │
└─────────────────────────────────────────────────┘

  [ Seal capsule → opens at Day 90 ]    [ Skip ]
```

The capsule is sealed — the user can't read it until the target date/milestone. When the milestone arrives:

```
🎁 Time Capsule from 60 days ago

You wrote this on August 22, when you hit 30 days:

  "Hey future me — if you're reading this, you've
   meditated for 3 months straight. Remember how
   hard the first week was? Worth it."

You did it. 90 days.

  [ Write another → opens at Day 180 ]
  [ Save to Sunset Gallery ]
```

Design details:
- Capsules are tied to specific habits and milestones.
- A sealed capsule shows as a small icon on the habit row, creating mild anticipation.
- Opening a capsule is a moment — the app presents it with a reveal animation and the date it was written.
- Past capsules form a personal timeline of the user's journey with each habit.
- Capsules can also be written for *new* habits: "Write a note to yourself 30 days from now, when you've built this habit."

**Why it's different:**
- "Streak Milestones" celebrate reaching a number. Time Capsule creates *emotional continuity* between past and future selves.
- "Anchor Statement" (C3) is the *why*. Time Capsule is the *who* — it makes the future self vivid and real.
- "Journal / Habit Notes" (M2) is a running log. Time Capsule is sealed — the asymmetry between writing and reading creates anticipation and emotional impact.
- "Weekly Compass" is reflection. Time Capsule is *projection* — it spans weeks or months.

**Behavioral science:** Hal Hershfield's research on "future self-continuity" (2011) shows that people who feel connected to their future selves make better long-term decisions. The act of writing a letter to your future self makes that self *concrete* rather than abstract. The sealed-until-milestone mechanic creates anticipation (dopaminergic reward prediction, Schultz et al., 1997) — the user has a reason to reach the milestone beyond the streak number. Research on "mental time travel" (Suddendorf & Corballis, 2007) shows that vividly imagining future states increases commitment to actions that bring those states about.

**Data model:**
```typescript
type TimeCapsule = {
  id: string
  habitId: string
  message: string
  writtenAt: string       // ISO date
  writtenAtMilestone: number  // e.g. 30 (days)
  opensAt: number         // e.g. 90 (days) — capsule unseals at this streak/milestone
  openedAt?: string       // ISO date when actually opened, null if sealed
}

type Data = {
  // ...existing
  timeCapsules?: TimeCapsule[]
}
```

**Effort:** ~40 min. Capsule write prompt at milestones, sealed capsule icon on habit row, reveal modal, capsule storage. Small server collection.

---

## Novelty Matrix

| ID | Feature | Novel Dimension | Why 83 Prior Proposals Missed It |
|----|---------|----------------|----------------------------------|
| J1 | Effort Budget | Finite daily capacity / prioritization | All proposals assume every habit should be attempted daily. None models the resource constraint. |
| J2 | Narrative View | Storytelling as information architecture | All visualizations are analytical (charts, grids, numbers). None changes the cognitive mode to narrative. |
| J3 | Habit Sunset | Graceful, celebrated ending | All proposals assume habits are permanent. Archive = shame, delete = erasure. No positive exit. |
| J4 | Habit Conversation | Bidirectional contextual dialogue | All prior UX is dashboard-style (look, tap, leave). None makes the app *ask* the user anything. |
| J5 | Time Capsule | Temporal self-connection | All proposals are present-focused. None bridges current and future self across weeks/months. |

---

## Consolidated Execution Backlog

### Tier 0 — Fix What's Broken (Est. ~45 min)

Ship these as the next commit. They aren't features; they're correctness.

| # | Item | Detail | Est. |
|---|------|--------|------|
| 0.1 | API error handling | `if (!res.ok) throw` in all 5 `api.ts` functions | 10 min |
| 0.2 | Edit habit | `PUT /api/habits/:id` + inline edit in HabitRow | 25 min |
| 0.3 | Unarchive | `POST /api/habits/:id/unarchive` + archived section in UI | 15 min |
| 0.4 | Clean dead CSS | Remove unused `index.css` Vite template styles | 5 min |
| 0.5 | Clean test data | Reset `data.json` to `{ "habits": [], "logs": {} }` | 1 min |

### Tier 1 — Transform the Daily Experience (Est. ~75 min, pick 2–3)

These change how the app feels each day. Each is independent.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 1.1 | **Habit Debt Dashboard** (today's remaining work) | 30 min | I3 |
| 1.2 | **Momentum Decay Sparkline** (7-day colored blocks) | 20 min | C2 |
| 1.3 | **Anchor Statement** ("why I do this" text field) | 10 min | C3 |
| 1.4 | **Silent Streaks** (per-habit streak visibility toggle) | 15 min | I1 |

### Tier 2 — New Dimensions (Est. ~120 min, pick 2–3)

Each adds a genuinely new capability to the habit model.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 2.1 | **Custom Scheduling** (Mon/Wed/Fri) | 45 min | G1 |
| 2.2 | **Effort Budget** | 40 min | **J1** |
| 2.3 | **Habit Sunset** | 35 min | **J3** |
| 2.4 | **Retroactive Recognition** | 35 min | I2 |

### Tier 3 — Engagement & Intelligence (Est. ~145 min)

Features that make the app smarter over time. Best after 2+ weeks of data.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 3.1 | **Habit Conversation** | 55 min | **J4** |
| 3.2 | **Narrative View** | 50 min | **J2** |
| 3.3 | **Time Capsule** | 40 min | **J5** |
| 3.4 | **Weekly Rhythm Score** | 30 min | C4 |

### Tier 4 — Analytics & Depth (Est. ~170 min)

Require 1+ month of real usage data to be meaningful.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 4.1 | Completion Contexts | 45 min | I5 |
| 4.2 | Ripple Effects (cross-habit influence) | 50 min | I4 |
| 4.3 | Miss Pattern Map | 45 min | E3 |
| 4.4 | Compound Progress (cumulative tallies) | 30 min | C1 |

### Parked — Build Later

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | The app's namesake, but high effort — ship when daily UX is solid |
| Habit Stacking / Chains | Complex dependency model; needs simpler features first |
| Social/Sharing | Separate scope; the app is personal-first |
| PWA / Offline / Export | Infrastructure project, not a feature |
| Full Analytics Dashboard | Needs months of data; premature optimization of insight |

---

## Recommended Path

**Session 1 → Tier 0.** Fix bugs. ~45 min. The app becomes trustworthy.

**Session 2 → Tier 1 pick 2.** Suggested: Habit Debt Dashboard (1.1) + Anchor Statement (1.3). ~40 min. The app gains a unique daily UX and emotional depth.

**Session 3 → Tier 2 pick 2.** Suggested: Effort Budget (2.2) + Habit Sunset (2.3). ~75 min. The app gains two features no competing habit tracker has.

After Tier 0–2, the app has fixed its foundation, differentiated its daily experience, and introduced two genuinely novel concepts. Everything after that depends on real usage patterns.

---

## Why These Five Features (And Not Five Others)

The 83 prior proposals cluster around three themes:
1. **More data** — more metrics, more visualizations, more analytics.
2. **Softer streaks** — grace days, shields, insurance, flexible counting.
3. **More metadata** — friction logs, context tags, timestamps, reasons.

All valid. But they're all *additions within the same paradigm*: the app as a dashboard you look at and tap.

J1–J5 each change the paradigm:
- **J1 (Effort Budget)** changes the app from "track everything" to "prioritize what matters today."
- **J2 (Narrative View)** changes the app from "display data" to "tell your story."
- **J3 (Habit Sunset)** changes the app from "maintain forever" to "build, complete, celebrate, release."
- **J4 (Conversation)** changes the app from "dashboard" to "dialogue partner."
- **J5 (Time Capsule)** changes the app from "present state" to "journey across time."

Together they reposition Habit Garden from "another habit tracker" to "a tool that understands habits are personal, finite, and evolving."

---

## Summary

| | |
|---|---|
| New features proposed | 5 (J1–J5) |
| Total backlog items | 23 (curated from 88 total proposals) |
| Tier 0 estimate | ~45 min |
| Tier 0+1 estimate | ~120 min |
| Full backlog (Tiers 0–4) | ~555 min (~9.25 hours) |
| **Next step** | Tier 0 code, not ROADMAP_v2.md |
