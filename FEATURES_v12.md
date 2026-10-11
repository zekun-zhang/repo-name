# Habit Garden — Feature Plan v12: Fresh Perspectives & Execution-First Backlog

**Date:** 2026-10-11
**Supersedes:** BACKLOG.md as the actionable source of truth
**Status:** 6 new feature proposals + consolidated execution backlog

---

## Honest Audit

| Metric | Value |
|--------|-------|
| Application source files | 11 |
| Application code lines | ~960 |
| Planning documents (including this one) | **12** |
| Planning markdown lines (prior docs) | ~8,000+ |
| Features shipped beyond initial CRUD | **0** |
| Planning-to-code ratio | **~8:1** |
| Unique dimensions proposed | 49 + 5 (C-series) = 54 |
| Dimensions shipped | **0** |

The prior documents are thorough, well-researched, and grounded in behavioral
science. They are also the problem. This document does two things differently:

1. **Proposes 6 features that none of the 54 existing dimensions cover** — not
   rephrasings, not adjacent ideas, genuinely uncovered conceptual territory.
2. **Structures the backlog as a single ranked list** — no tiers, no phases,
   no exit criteria, no gates. Pick the next item and build it.

---

## Part 1: What 54 Dimensions Already Cover

Before proposing new features, it's important to map what's been proposed to
avoid re-inventing ideas under different names.

**Covered territory** (by cluster, with representative dimension numbers):

| Cluster | Dimensions | Summary |
|---------|-----------|---------|
| Streak mechanics | 22, 42, 49, N2 | Strict, recovery, 2-day rule, grace days, shields, milestones |
| Daily state | N3, N8 | Energy check-in, completion sparks, friction control |
| Temporal patterns | 36, N7 | Scheduling, rhythms, seasons, quiet weeks |
| Habit relationships | N1 | Stacking, chains, correlation |
| Habit evolution | N5, 48 | Difficulty progression, maturity/graduation |
| Analytics | 31-33 | System score, slump radar, heatmap, dashboard |
| Reflection | N4, 45 | Weekly compass, notes, miss reason, displacement |
| Life context | 47, K5 | Life chapters, balance radar, pause protocol |
| Motivation | C1, C3, 46 | Compound progress, anchor statement, cue anchoring |
| Consistency metrics | C2, C4 | Momentum decay sparkline, weekly rhythm score |
| Post-completion data | C5 | Friction log |
| UX fundamentals | (various) | Edit, unarchive, ordering, templates, keyboard shortcuts |
| Identity/visualization | N6 | Living garden, heartbeat |
| Data management | (various) | Export/import, timestamps |

**Uncovered territory** — areas no dimension addresses:

1. The psychology of **restarting** after failure (not recovery or softening — actual restart motivation)
2. **Speed and flow** of the daily check-in as a game mechanic
3. **Temporal self-messaging** — connecting past-you to future-you
4. **Predictive intelligence** from the app's side (user predicts in F2; the app never does)
5. **Scope reduction** as a streak-preserving mechanism (different from energy-aware visibility)
6. **Longevity celebration** independent of completion rate

---

## Part 2: New Feature Proposals

### D1. Streak Comeback Tracker

**Gap:** Every existing streak feature handles either the streak itself (counting,
milestones) or streak protection (grace days, shields, 2-day rule). None addresses
the psychological experience of **restarting** after a break. A streak resets to 0
and the user sees only what they lost.

**What:** When a streak breaks, a parallel "Comeback" counter begins:

```
Exercise
  Current streak: 4 days
  Comeback:       4 of 18  ← working back toward personal best
  Personal best:  18 days

  ████░░░░░░░░░░░░░░  22% of the way back
```

The comeback counter shows progress toward the previous best. The progress bar
fills as the user rebuilds. When the streak surpasses the previous best, a
celebration marks the new personal record.

If the streak breaks again during a comeback, the counter simply restarts
toward the same target — no judgment, just "try again."

**Why it's genuinely different from all 54 dimensions:**
- **Streak Recovery (dim 22)** softens the *display* post-break ("Recovering: 3/7").
  Comeback Tracker adds a *parallel metric* — you're building toward your best, not
  just counting from zero.
- **Streak Shields (dim 49)** *prevent* a break. Comeback Tracker *reframes* the
  aftermath of a break.
- **Streak Milestones** celebrate *absolute thresholds* (7, 30, 90). Comeback
  Tracker celebrates *relative progress* — beating YOUR previous best.
- No existing dimension treats the restart itself as a motivating event.

**Behavioral science:** "Fresh start effect" (Dai, Milkman & Riis, 2014) — people
are more motivated to pursue goals after temporal landmarks (Monday, new month,
birthday). A streak break is the most personal temporal landmark of all. Comeback
Tracker harnesses the fresh start by giving the restart a *destination* (the
previous best), transforming "I'm at 0" into "I'm 4 days into my comeback."

Research on "near miss" motivation (Reid, 1986) shows that proximity to a goal
increases effort. The progress bar toward the personal best creates continuous
near-miss motivation throughout the comeback.

**Data model:**
```typescript
type Habit = {
  // ...existing
  personalBest?: number  // longest streak ever achieved
}
```

Computed from existing log data — `personalBest` can be derived at startup by
scanning completion dates, or cached for performance.

**Effort:** Small. Max-streak scan of existing logs, comeback bar UI,
personal-best celebration trigger.

---

### D2. Combo System

**Gap:** Every existing gamification proposal (sparks, milestones, shields) rewards
*what* you complete or *how long* you sustain it. None rewards the *flow* of the
daily check-in itself — the act of rapidly tapping through your habits.

**What:** Completing multiple habits in quick succession (within a configurable
window, default 60 seconds between taps) triggers escalating visual feedback:

```
Habit 1 completed   → small spark
Habit 2 completed   → medium spark, "2x combo!"
Habit 3 completed   → large spark, "3x combo!"
Habit 4+ completed  → cascading effect, "4x combo! On fire!"
```

The combo counter resets after 60 seconds of inactivity. Combos are purely
cosmetic — no persistent state, no scoring, no pressure. They make the daily
check-in feel like a game without adding any tracking burden.

The visual escalation is subtle: a brief flash of the habit's color that grows
with each consecutive completion. The combo text appears for 1 second and fades.

**Why it's genuinely different from all 54 dimensions:**
- **Completion Sparks (N8)** are context-aware messages ("First one down!",
  "Perfect day!"). Combos reward *speed and flow*, not *meaning*.
- **Perfect Day Streak (dim 44)** tracks whether ALL habits were completed
  across days. Combos track rapid completion within a *single session*.
- **Momentum Score (dim 31)** measures overall health. Combos are ephemeral —
  they exist only during check-in and leave no trace.
- No existing dimension treats the check-in session itself as a game loop.

**Behavioral science:** Flow state research (Csikszentmihalyi, 1990) — flow
requires immediate feedback and clear, progressive goals. Combo counters
provide both. The escalating visual feedback creates a micro-flow state during
check-in that makes the mundane act of tapping checkboxes feel satisfying.

Variable reward scheduling (Eyal, 2014) — the combo mechanic is a form of
variable reward because the intensity varies with speed, and users don't know
exactly how high their combo will go until they try. This unpredictability
is more engaging than fixed rewards.

**Data model:** None. Pure frontend state that resets on navigation. Zero
server changes. Zero persistence.

**Effort:** Tiny. Timestamp tracking between completions, escalating CSS
animation, auto-reset timer.

---

### D3. Time Capsule Messages

**Gap:** Anchor Statement (C3) captures a static "why" for each habit. Miss Reason
(dim 45) captures retrospective failure data. Weekly Compass (N4) sets forward
intentions. But nothing connects past-you to future-you with a *personal message
across time*.

**What:** When creating or editing a habit, the user can write optional "Time
Capsule" messages that unlock at specific day milestones:

```
Create a habit

Name:       Exercise 30 min
Frequency:  [Daily]
Color:      [●]

Time Capsules (optional):
  Day 7:   "One week in. Remember how hard day 1 was?"
  Day 30:  "A whole month. You're becoming someone who exercises."
  Day 90:  "Quarter of a year. This is who you are now."

[Add habit]
```

When the user reaches the milestone, the capsule opens with a gentle animation:

```
🕰️ Time Capsule from Oct 11, 2026

"One week in. Remember how hard day 1 was?"

  — You, 7 days ago
```

The message is from the user TO the user. The app is just the delivery mechanism.
Capsules can be written at creation or added/edited later. Each capsule opens
exactly once.

**Why it's genuinely different from all 54 dimensions:**
- **Anchor Statement (C3)** is static — one unchanging "why" that surfaces at
  emotional inflection points. Capsules are temporal — they travel forward in
  time and arrive once.
- **Streak Milestones** celebrate with generic badges. Capsules celebrate with
  the user's own words from the past — personal, irreplaceable.
- **Habit Notes (M2)** is a running journal attached to habits. Capsules are
  *addressed to a specific future moment*, not ongoing commentary.
- No existing dimension uses the mechanism of self-to-self temporal messaging.

**Behavioral science:** "Temporal self-continuity" (Hershfield, 2011) — people
who feel connected to their future selves make better long-term decisions.
Time Capsules create literal artifacts of that connection. Reading your own
words from day 1 on day 30 strengthens the narrative of "I was that person
and I became this person."

"Implementation intentions" (Gollwitzer, 1999) are strengthened when tied to
vivid mental imagery of the future moment. Writing a capsule for day 30 forces
the user to imagine reaching day 30 — which itself increases the probability
of getting there.

**Data model:**
```typescript
type TimeCapsule = {
  day: number       // milestone day (7, 30, 90, etc.)
  message: string   // max 280 chars
  opened: boolean
}

type Habit = {
  // ...existing
  capsules?: TimeCapsule[]
}
```

**Effort:** Small. Array field on Habit, milestone check against streak length,
capsule display modal with open-once logic.

---

### D4. Habit Weather Forecast

**Gap:** Tomorrow Confidence (dim F2, v10) asks the *user* to predict their
completion probability. No dimension has the *app* predict the user's day based
on historical patterns.

**What:** Each habit shows a tiny "weather" indicator reflecting the app's
prediction of completion probability based on historical data:

```
Today's Forecast:

Exercise    ☀️  91%  (you complete this 93% of Wednesdays)
Reading     🌤  72%  (your momentum has been cooling — 5/7 last week)
Meditation  ⛅  58%  (you often skip after missing yesterday)
Journaling  🌧  34%  (Wednesdays are historically your weakest day)
```

The forecast is computed from:
- **Day-of-week completion rate** for this habit (strongest signal)
- **Trailing 7-day completion density** (recent momentum)
- **Post-miss probability** (did you complete this habit the day after a miss?)
- **Overall completion rate** (baseline)

Weighted formula: `0.4 × dayOfWeek + 0.3 × recent7Day + 0.2 × postMiss + 0.1 × overall`

The weather metaphors make the numbers feel intuitive rather than clinical:
- ☀️ 80-100% — Clear skies
- 🌤 60-79% — Mostly sunny
- ⛅ 40-59% — Partly cloudy
- 🌧 20-39% — Rain likely
- ⛈ 0-19% — Storm warning

The forecast is shown at the top of the daily view, before the user starts
checking in. It sets expectations without creating pressure — a "rainy" habit
isn't a failure, it's an honest assessment that today is hard for this one.

**Why it's genuinely different from all 54 dimensions:**
- **Tomorrow Confidence (F2)** is a *user input* — "How confident are you?"
  Forecast is an *app output* — "Here's what your data says." The interesting
  feature would be showing both side by side — when the user is more optimistic
  than the data, or more pessimistic.
- **Slump Radar (dim 32)** detects declining trends reactively. Forecast is
  *proactive* — it tells you before the day begins what to expect.
- **Momentum Decay (C2)** shows trailing density. Forecast uses density as one
  input among several to produce a *prediction*, not just a visualization.
- No existing dimension has the app make predictions about the user's behavior.

**Behavioral science:** "Realistic optimism" (Schneider, 2001) — people who
set expectations that match reality perform better than those with unrealistic
expectations (who crash when reality intervenes) or those with no expectations
(who lack direction). The forecast sets a realistic frame: "Today is a ☀️ day
for Exercise and a 🌧 day for Journaling" lets the user plan their effort.

"Metacognitive awareness" (Flavell, 1979) — knowing that you tend to skip
Meditation on Wednesdays is self-knowledge that enables intervention. The
forecast externalizes patterns the user can't see in raw data.

**Data model:** None. Pure computation on existing log data + current date.

**Effort:** Small. Day-of-week aggregation from logs, weighted scoring formula,
weather icon mapping. Zero server changes.

---

### D5. Minimum Viable Habit (Tiny Version)

**Gap:** Energy-Aware Check-In (N3) adjusts which *habits* are shown based on
daily energy. Difficulty Progression (N5) tracks leveling *up*. But nothing
addresses the most common failure mode: an all-or-nothing frame where "Exercise
30 min" feels impossible, so the user does nothing and breaks the streak.

**What:** Each habit can define an optional "tiny version" — the absolute minimum
that still counts:

```
Exercise 30 min
  Tiny version: 5 pushups

Reading 20 pages
  Tiny version: 1 page

Meditation 15 min
  Tiny version: 3 deep breaths
```

The daily view shows a second, smaller button next to the main completion toggle:

```
Exercise 30 min    [✓ Full]  [· Tiny]
```

Tapping "Tiny" marks the habit as completed with a distinct visual — the day cell
shows a half-filled state instead of a full checkmark:

```
Day grid:  ✓ ✓ ◐ ✓ ✓ ◐ ✓ ✓ ✓ ◐ ✓ ✓ ✓ ✓
                ^         ^           ^
              tiny      tiny        tiny
```

Tiny completions count toward the streak. They are real completions — the user
did *something*. But they're visually distinct so the user can see their pattern
and decide if they're relying on tiny versions too often.

**Why it's genuinely different from all 54 dimensions:**
- **Energy-Aware Check-In (N3)** adjusts which habits appear. Tiny Version
  adjusts the *scope* of a single habit. One is about selection; the other
  is about reduction.
- **Difficulty Progression (N5)** moves UP through levels. Tiny Version moves
  DOWN to a floor. Progression is growth; Tiny Version is resilience.
- **Grace Days (N2)** excuse a miss entirely. Tiny Version ensures *something*
  happens — it's not an excuse, it's a minimum.
- **2-Day Rule (dim 42)** forgives one miss. Tiny Version prevents the miss
  from happening in the first place by lowering the bar.
- No existing dimension offers a "scope reduction" mechanism as an alternative
  to missing.

**Behavioral science:** BJ Fogg's "Tiny Habits" method — the core insight of
the most successful habit-building framework is: make the behavior so small it's
impossible to fail. "Floss one tooth." "Do one pushup." "Read one sentence."
The tiny version maintains the *routine* (which is the hardest part to rebuild)
while removing the *effort barrier* that causes misses.

"Minimum viable effort" research shows that maintaining a streak of small actions
is more durable than alternating between big efforts and total misses. The user
who does 5 pushups on a bad day and 30 minutes on a good day has a better
long-term outcome than the user who does 30 minutes three times and then quits.

**Data model:**
```typescript
type Habit = {
  // ...existing
  tinyVersion?: string  // max 100 chars
}

// Log entries need a "tiny" flag:
type HabitLog = {
  [habitId: string]: Array<string | { date: string; tiny: boolean }>
}
```

The log structure change is backward-compatible — existing string entries are
treated as full completions.

**Effort:** Small. One text field on habit creation/edit, a second button in the
day cell, half-filled visual state, log structure extension.

---

### D6. Habit Anniversaries

**Gap:** Streak Milestones celebrate consecutive-day thresholds. Maturity/Graduation
(dim 48) celebrates automaticity. Compound Progress (C1) celebrates cumulative output.
But nothing celebrates the simple fact that a habit has been *in your life* for a
significant duration — regardless of completion rate.

**What:** The app tracks each habit's "birthday" (its creation date) and celebrates
anniversaries:

```
🎂 Exercise turns 6 months old today!

  Created:        Apr 11, 2026
  Total tracked:  183 days
  Completed:      147 times (80%)
  Longest streak: 34 days
  Tiny completions: 12

  "Half a year of showing up. That's commitment."
```

Anniversary milestones: 1 month, 3 months, 6 months, 1 year, and every year after.

The celebration acknowledges longevity independent of perfection. A habit with
50% completion rate that's been tracked for a year is genuinely impressive — the
user kept it in their life through seasons, travel, illness, and motivation dips.

An "age badge" appears next to each habit showing its age in months:

```
Exercise        6mo    ████████████░░ streak: 8 days
Meditation      3mo    ██████████████ streak: 14 days
Reading         1yr    ████████░░░░░░ streak: 3 days
Journaling      2wk    ██████████████ streak: 14 days
```

**Why it's genuinely different from all 54 dimensions:**
- **Streak Milestones** celebrate *consecutive completions*. Anniversaries
  celebrate *elapsed time since commitment*. One rewards perfection; the other
  rewards persistence.
- **Maturity/Graduation (dim 48)** tracks automaticity — high completion rates
  over time. Anniversaries celebrate longevity at *any* completion rate. A
  habit you've tracked for a year at 40% completion still gets a birthday party.
- **Compound Progress (C1)** tallies cumulative output (pages, km). Anniversaries
  tally cumulative *time committed to tracking*, regardless of output.
- No existing dimension values the duration of the habit's *presence in the
  user's life* as an achievement in its own right.

**Behavioral science:** "Mere exposure effect" (Zajonc, 1968) — the longer
something is in your life, the more positively you feel about it. Celebrating
a habit's age strengthens the emotional bond between user and behavior.

"Identity-based habits" (Clear, 2018) — lasting change comes from identity
shifts, not outcomes. Keeping "Exercise" in your tracker for a year, even at
moderate completion, signals "I am someone who values exercise." Anniversaries
reinforce this identity narrative. The celebration says "You've been this person
for a year" — which is more durable motivation than "You hit 30 days."

**Data model:** None. `createdAt` already exists on every habit. Pure computation
of elapsed time.

**Effort:** Tiny. Date math against `createdAt`, milestone display, age badge
in HabitRow.

---

## Part 3: Dimension Map Update (D1-D6)

| # | Dimension | Feature | Gap Filled |
|---|-----------|---------|-----------|
| 55 | **Restart psychology** | D1: Streak Comeback | No dimension makes restarting motivating |
| 56 | **Check-in flow gamification** | D2: Combo System | No dimension rewards the speed of daily check-in |
| 57 | **Temporal self-messaging** | D3: Time Capsule | No dimension connects past-self to future-self |
| 58 | **Predictive intelligence** | D4: Weather Forecast | No dimension has the app predict user behavior |
| 59 | **Scope reduction** | D5: Tiny Version | No dimension offers a "do less, not nothing" mechanism |
| 60 | **Longevity celebration** | D6: Anniversaries | No dimension celebrates how long a habit has been tracked |

---

## Part 4: Consolidated Execution Backlog

This is a single ranked list. No tiers, no phases, no exit criteria. Pick the
next un-built item and build it. Items are ordered by: (1) dependency — if X
must exist for Y to make sense, X comes first; (2) effort — faster wins rank
higher; (3) daily-use impact — features that change every check-in beat features
that show up monthly.

**Effort key:** T = Tiny (<15 min), S = Small (15-40 min), M = Medium (40-80 min)

| # | Feature | Effort | What | Source |
|---|---------|--------|------|--------|
| 1 | API Error Handling | T | `if (!res.ok) throw` in all api.ts functions | Tier 0 |
| 2 | Edit Habit | S | PUT `/api/habits/:id` + inline edit UI | Tier 0 |
| 3 | Unarchive | S | POST `/api/habits/:id/unarchive` + archived section | Tier 0 |
| 4 | Habit Anniversaries | T | Age badge from existing `createdAt`, milestone celebrations | **NEW D6** |
| 5 | Streak Comeback Tracker | S | Personal best tracking, comeback progress bar | **NEW D1** |
| 6 | Combo System | T | Escalating visual feedback for rapid completions | **NEW D2** |
| 7 | Momentum Decay Sparkline | S | 7-day colored density blocks per habit | C2 |
| 8 | Cue Anchoring | T | Optional `cue` text field on habit | v11 F8 |
| 9 | Anchor Statement | T | Optional `anchor` text field ("why I do this") | C3 |
| 10 | Minimum Viable Habit | S | Tiny version field + half-completion toggle | **NEW D5** |
| 11 | Habit Weather Forecast | S | Per-habit daily completion prediction from log data | **NEW D4** |
| 12 | Compound Progress | S | Optional unit/amount fields, cumulative tally | C1 |
| 13 | Time Capsule Messages | S | Milestone-linked personal messages | **NEW D3** |
| 14 | Weekly Rhythm Score | S | Per-habit weekly consistency percentage | C4 |
| 15 | 2-Day Rule | S | Alternative streak mode: never-miss-twice | v10 |
| 16 | Inline 30-Day Heatmap | S | Expandable 30-day color grid per habit | v10 |
| 17 | Habit Ordering | S | Up/down arrows to reorder habits | v9 |
| 18 | Completion Sparks | M | Context-aware micro-celebrations | PLAN.md N8 |
| 19 | Streak Milestones | M | Badges + animation at 7/30/90/365 | v9 |
| 20 | Miss Reason Capture | M | One-tap reason after a missed day | v11 F7 |
| 21 | Start Friction Log | S | One-tap difficulty after completing | C5 |
| 22 | Earned Streak Shields | M | Consistency earns streak protection tokens | v11 F11 |
| 23 | Habit Scheduling | M | Mon/Wed/Fri patterns, dimmed rest days | v9 |
| 24 | Life Balance Radar | M | Domain assignment + spider chart | v11 F9 |
| 25 | Habit Maturity & Graduation | M | Automaticity detection + Hall of Fame | v11 F10 |
| 26 | Weekly Compass | M | Weekly intention-setting and reflection | PLAN.md N4 |

### Parked (valid, not now)

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | The differentiator — build when basics ship |
| Energy-Aware Check-In | Needs Minimum Viable Day concept first |
| Habit Stacking / Chains | Complex model, build after simpler features |
| Quiet Weeks / Grace Days | Needs scheduling first |
| Theme Toggle | CSS cleanup, doesn't affect habit tracking |
| Dashboard / Analytics | Needs months of real data |
| PWA / Offline | Separate project |
| Data Export/Import | Important later |
| Difficulty Progression | Needs habits with enough history |
| Habit Heartbeat | Needs system score |

---

## Part 5: Why These 6 Features and Not Others

### Selection criteria

Each of the 6 new features was selected because it:

1. **Fills a conceptual gap** — not "another way to visualize streaks" but a
   mechanism that no existing dimension provides.
2. **Requires minimal data model changes** — most use existing `createdAt` or
   log data. No migrations. No breaking changes.
3. **Affects daily usage** — each changes what the user sees or does every time
   they open the app, not just on special occasions.
4. **Compounds with existing proposals** — Comeback Tracker makes Streak Shields
   more meaningful. Tiny Version works alongside Energy Check-In. Forecast pairs
   with Momentum Decay. Combos enhance Completion Sparks.

### What was intentionally NOT proposed

- **Social features** — Need auth, fundamentally different architecture. Not now.
- **AI/ML features** — Hype-driven, excessive for a JSON-file app. The Weather
  Forecast uses simple arithmetic, not ML.
- **More analytics** — The app has 0 users and 0 real data. Analytics are
  premature.
- **Platform features** (PWA, push notifications, offline) — Engineering
  infrastructure, not product features. Build when there's something worth
  accessing offline.

---

## Part 6: Implementation Notes

### Feature interaction map (v12 additions)

```
D1 Comeback ────── enhances ───→ Streak Milestones
    │                               │
    │ (comeback bar creates a       │ (milestones celebrate new
    │  destination for restarts)    │  personal records from comebacks)
    │                               │
    ▼                               ▼
D5 Tiny Version ── prevents ───→ Streak Breaks
    │                               │
    │ (doing the tiny version       │ (fewer breaks = fewer comebacks
    │  maintains the streak)        │  needed = healthier relationship)
    │                               │
    ▼                               ▼
D4 Forecast ────── informs ────→ D5 Tiny Version use
    │                               │
    │ ("rainy" forecast suggests    │ (user sees ⛅ and preemptively
    │  today might be a tiny day)   │  chooses the tiny version)
    │                               │
    ▼                               ▼
D2 Combos ──────── pairs with ──→ Completion Sparks (N8)
    │                               │
    │ (combos add flow-state        │ (sparks add meaning-state
    │  gamification to check-in)    │  celebration to milestones)
    │                               │
    ▼                               ▼
D3 Capsules ────── deepens ────→ Anchor Statement (C3)
    │                               │
    │ (capsules are temporal        │ (anchor is static "why";
    │  self-messaging)              │  capsules are "why" across time)
    │                               │
    ▼                               ▼
D6 Anniversaries ─ complements ─→ Maturity (F10)
    │                               │
    │ (anniversaries celebrate      │ (maturity celebrates
    │  longevity regardless of      │  automaticity at high
    │  completion rate)             │  completion rates)
```

### Architecture compatibility

All 6 features follow the existing project patterns:

- **D1 (Comeback):** One optional field (`personalBest`) on Habit, or pure
  computation from logs. No new endpoints.
- **D2 (Combos):** Zero data model changes. Zero server changes. Frontend-only
  timer state.
- **D3 (Capsules):** Array field on Habit type. Extends existing POST/PUT.
- **D4 (Forecast):** Zero data model changes. Zero server changes. Pure log
  computation.
- **D5 (Tiny Version):** One string field on Habit. Log entries gain an optional
  `tiny` flag. Backward-compatible.
- **D6 (Anniversaries):** Zero data model changes. Uses existing `createdAt`.

### Recommended first implementation session

The 3 fastest, highest-impact items from the backlog:

1. **#1: API Error Handling** (15 min) — add `if (!res.ok)` checks to api.ts
2. **#4: Habit Anniversaries** (15 min) — age badge from existing data
3. **#6: Combo System** (15 min) — frontend-only timer + CSS animation

Total: ~45 minutes. Ships 2 new features and 1 critical bugfix. No server
changes needed. The next commit should be code.
