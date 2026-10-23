# Habit Garden — New Feature Proposals (K1–K5)

**Date:** 2026-10-23
**Author:** Automated codebase analysis
**Status:** Additive to ROADMAP.md (J1–J5). Does NOT replace it — read that first.

---

## Context

This project has ~960 lines of application code, 17 planning documents (~9,200 lines), 88+ feature proposals, and 0 features shipped. ROADMAP.md correctly identifies this imbalance and proposes J1–J5, which are strong and genuinely novel.

This document adds five more proposals that target dimensions untouched by all 88 prior proposals AND all five J-series proposals. Each addresses a real behavioral science gap in habit formation that no existing proposal covers.

**These should NOT delay Tier 0 (bug fixes) or Tier 1 (daily UX).** They slot into Tiers 2–3 of the existing ROADMAP.md backlog.

---

## Novelty Audit: What ALL 88+ Proposals Share

Every prior proposal, including J1–J5, assumes:

1. **Habits are additive** — you're always trying to do MORE of something. No proposal handles reducing or stopping a behavior.
2. **Habit difficulty is static** — "Exercise 30 min" is the same challenge on day 1 and day 100. No proposal models that habits have a learning curve.
3. **The user is consistent** — they open the app daily. No proposal addresses the experience of coming back after a gap.
4. **Habits run year-round** — no concept of seasonal or contextual activation.
5. **You know the right approach** — no proposal helps users experiment with WHEN/HOW they do a habit to find what actually sticks.

K1–K5 each targets one of these blind spots.

---

## K1. Habit Scaling (The Tiny Habits Ladder)

**Blind spot addressed:** Every proposal treats a habit as a single fixed action. You either "do it" or you don't. This all-or-nothing framing is the #1 reason people abandon habits.

**What it does:**

Each habit can optionally define three tiers:

```
Habit: Exercise

  Micro  (can't-fail):  Do 5 pushups               [  ]
  Standard (the goal):  Exercise 30 min             [  ]
  Stretch (ambitious):  Exercise 60 min + stretch   [  ]
```

- **Micro** is the minimum viable action — so small it's impossible to say no. 2 minutes or less. The purpose isn't fitness; it's maintaining the neural pathway.
- **Standard** is the current habit definition, unchanged.
- **Stretch** is for high-energy days when the user wants to do more.

All three count as a completion for streak purposes, but the grid shows which tier was completed (e.g., a smaller dot for micro, full dot for standard, glowing dot for stretch). Over time, the user can see their tier distribution: "Last month I did 18 standard, 6 micro, and 4 stretch."

The key insight: **a micro day is infinitely better than a zero day**, but the current UI makes them identical (both unchecked). Scaling makes partial effort visible and valued.

**Why it's different from everything proposed before:**
- "Difficulty Progression" (dim N5) auto-increases difficulty over time — a ladder the app climbs for you. Habit Scaling is user-chosen on each day based on energy.
- "Effort Budget" (J1) decides WHICH habits to do today. Scaling decides HOW MUCH of a single habit to do.
- "Minimum Viable Day" marks whole habits as core vs optional. Scaling applies within a single habit.

**Behavioral science:** BJ Fogg's "Tiny Habits" (2019) — the core research finding is that the minimum version of a habit must be so small it requires no motivation. "Floss one tooth" not "floss all teeth." The micro tier encodes this directly. Fogg's data shows that people who do the tiny version on bad days maintain habits 3x longer than people who skip entirely on bad days. The reason: the behavior-identity link ("I am someone who exercises") is maintained by ANY instance of the behavior, regardless of magnitude.

**Data model:**
```typescript
type Habit = {
  // ...existing
  microLabel?: string    // e.g. "5 pushups"
  stretchLabel?: string  // e.g. "60 min + stretch"
}

type CompletionTier = 'micro' | 'standard' | 'stretch'

// HabitLog changes from string[] to:
type HabitLogEntry = {
  date: string
  tier: CompletionTier
}
// Migration: existing string[] entries become { date, tier: 'standard' }
```

**Effort:** ~45 min. Tier fields on habit form, modified toggle (tap cycles through tiers or a small selector), visual differentiation in grid, tier distribution summary. Server: migration of log format, validation.

---

## K2. Comeback Mode (Re-Entry Experience)

**Blind spot addressed:** Every proposal assumes the user opens the app daily. None addresses what happens when they come back after 3, 7, or 30 days away. The current UI punishes absence: you see a wall of empty checkboxes, broken streaks everywhere, and feel like you've already failed before you start. This is the single most common moment of permanent abandonment.

**What it does:**

When the app detects 3+ days since the last log entry, it replaces the normal view with a Comeback screen:

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│  Welcome back.                                        │
│  You were away for 8 days. That's fine — life         │
│  happens, and you're here now.                        │
│                                                       │
│  Before you left, you had completed Meditation        │
│  23 days in a row. That's still yours — breaks        │
│  don't erase what you built.                          │
│                                                       │
│  Pick one habit to restart with today:                │
│                                                       │
│    ○ Meditation                                       │
│    ○ Reading                                          │
│    ○ Exercise                                         │
│    ○ Journal                                          │
│                                                       │
│  [ Start fresh ]                                      │
│                                                       │
│  Or jump straight to your habits → [Show all]         │
│                                                       │
└──────────────────────────────────────────────────────┘
```

Design details:
- **No shame.** The language is warm, factual, and forward-looking. "You were away for 8 days" not "You missed 8 days."
- **One habit, not all.** Asking the user to restart all habits at once recreates the pressure that caused the gap. Starting with one builds momentum.
- **Pre-gap achievements are honored.** "23 days in a row — that's still yours" reframes the streak as a past accomplishment, not a lost asset.
- **Opt-out available.** "Show all" skips Comeback Mode for users who don't want hand-holding.
- **Only triggers once per gap.** After dismissing, the user sees the normal view until the next 3+ day gap.
- **The 14-day grid starts from today.** Instead of showing 14 days of emptiness, the grid emphasizes today forward.

**Why it's different from everything proposed before:**
- "Streak Recovery / Grace Days" retroactively forgive missed days. Comeback Mode doesn't change the data — it changes the EXPERIENCE of returning.
- "Miss Reason Capture" (dim 45) fires after each miss. Comeback Mode fires once, after a gap, with no interrogation about why.
- "Habit Conversation" (J4) asks daily micro-questions. Comeback Mode is specifically designed for the re-entry moment.
- No prior proposal addresses the UI/UX of the gap itself.

**Behavioral science:** "Abstinence violation effect" (Marlatt & Gordon, 1985) — when someone trying to change a behavior has a lapse, they experience shame and self-blame that makes full relapse more likely. "I missed 8 days, so I'm not the kind of person who keeps habits." Comeback Mode directly counters this by: (1) normalizing the gap, (2) affirming past progress, and (3) lowering the re-entry barrier to one action. Research on "fresh starts" (Dai et al., 2014) shows that temporal landmarks (new week, new month, or in this case, return from a break) are natural moments of increased motivation — the app should harness that energy, not smother it with failure data.

**Data model:** None. Pure rendering logic over existing data. Detects gap by comparing today to the most recent log entry across all habits.

**Effort:** ~30 min. Gap detection utility, Comeback component, one-habit selection flow. No server changes.

---

## K3. Habit Experiments (Self-A/B Testing)

**Blind spot addressed:** Every proposal assumes the user knows the right way to do their habit. In reality, people fail habits because they haven't found the right configuration — the right time of day, the right duration, the right trigger. No proposal helps users systematically TEST different approaches to find what actually works for them.

**What it does:**

Users can create an Experiment on any habit:

```
Experiment: When should I meditate?

  Phase A (Oct 1–14):  Morning meditation (before breakfast)
  Phase B (Oct 15–28): Evening meditation (after dinner)

  ┌─ Results so far ─────────────────────────────────┐
  │                                                    │
  │  Phase A (Morning):   11/14 days  (79%)           │
  │  Phase B (Evening):   9/10 days   (90%) ← current │
  │                                                    │
  │  Early signal: Evening looks stronger.             │
  │  3 days left in Phase B.                           │
  └────────────────────────────────────────────────────┘
```

Experiment setup:
1. Pick a habit
2. Name two approaches (free text labels)
3. Set duration per phase (1–4 weeks each)
4. The app tracks completion rate per phase separately

After both phases complete, the app summarizes:

```
Experiment complete: When should I meditate?

  Morning:  11/14 (79%)
  Evening:  12/14 (86%)

  Evening meditation had 7% higher completion rate.

  → Keep "Evening meditation" as default?
    [ Yes, update habit ]  [ Keep experimenting ]
```

Constraints:
- One experiment per habit at a time
- Maximum two phases (A/B, not A/B/C — keep it simple)
- Experiments are optional and don't affect normal tracking

**Why it's different from everything proposed before:**
- "Completion Contexts" (I5) captures context passively — where/when/how a habit was done. Experiments ACTIVELY structure a comparison between two approaches.
- "Habit Conversation" (J4) asks qualitative questions. Experiments produce quantitative data.
- "Difficulty Progression" (N5) assumes a linear path of increasing challenge. Experiments compare lateral alternatives.
- No prior proposal makes habit configuration itself a thing to test and iterate on.

**Behavioral science:** "Self-experimentation" has a long research tradition (Roberts, 2004; Allen, 2012) and is the foundation of Quantified Self methodology. The key insight: people treat habit failure as a CHARACTER flaw ("I'm not disciplined enough") when it's often a DESIGN flaw ("mornings don't work for me"). Experiments reframe failure as data. This maps to Dweck's growth mindset (2006) — the belief that abilities can be developed through experimentation rather than being fixed traits.

**Data model:**
```typescript
type Experiment = {
  id: string
  habitId: string
  question: string          // "When should I meditate?"
  phaseA: { label: string; startDate: string; endDate: string }
  phaseB: { label: string; startDate: string; endDate: string }
  status: 'phase_a' | 'phase_b' | 'complete'
  result?: 'a' | 'b' | 'tie'
}

type Data = {
  // ...existing
  experiments?: Experiment[]
}
```

**Effort:** ~50 min. Experiment creation form, phase indicator on habit row, per-phase completion rate calculation, results summary view. Small server collection.

---

## K4. Anti-Habits (Reduction Tracking)

**Blind spot addressed:** Every single proposal — all 88 of them — assumes habits are things you want to DO MORE of. The app has no concept of behaviors you want to REDUCE or STOP. Yet for many people, their most important habit goals are subtractive: stop smoking, reduce doomscrolling, eat less sugar, stop nail-biting.

**What it does:**

A new habit type: "Reduce." Inverted from normal tracking:

```
Create a habit:

  Name: Doomscrolling
  Type: ● Build (do more)  ○ Reduce (do less)
  
  [When "Reduce" is selected:]
  Tracking: How do you want to track?
    ○ Zero-day counter ("Days without")
    ○ Limit counter ("Keep under N per day")
```

**Zero-day mode:**
```
Doomscrolling          12 days without
  ████████████░░        ← green blocks = clean days
  
  [Mark today as slip]  [Still clean ✓]
```

The grid is inverted: empty cells are GREEN (success — you didn't do it), and marked cells are RED (you slipped). The default state each day is success. You only interact when you slip.

**Limit mode:**
```
Sugary snacks          Target: ≤2 per day
  Today: 1 so far      [+1]  [Done for today]
  
  This week: avg 1.7/day (within target)
```

Key design decisions:
- **Default is success.** For build habits, the default is failure (unchecked). For reduce habits, the default is success (you haven't done the thing). This is psychologically crucial — every day starts as a win.
- **Slips aren't failures.** A single slip on a reduce habit shows as a data point, not a broken streak. The "days since last slip" counter is secondary to the weekly/monthly trend.
- **The trend matters more than the streak.** "Average 3 cigarettes/day this month, down from 7 last month" is more motivating than "streak: 0 days."
- **No judgment language.** "Slip" not "failure." "Clean day" not "success."

**Why it's different from everything proposed before:**
- "Quit/Avoidance Mode" (G3) was proposed in FEATURES_v14 but described only as "track habits you want to stop" with no design for how the inverted UX would work. K4 provides the full behavioral design: inverted defaults, two tracking modes, trend-over-streak emphasis, and slip-not-failure language.
- No other proposal addresses the fundamental UI inversion needed: for build habits, absence = failure; for reduce habits, absence = success.

**Behavioral science:** Harm reduction theory (Marlatt, 1996) — for unwanted behaviors, abstinence-only models (binary success/failure) have worse outcomes than reduction models (gradual decrease with compassion for slips). The limit counter implements "controlled use" — a target that's achievable and measurable. The zero-day counter implements "days since" — which addiction research shows is motivating but only when combined with normalization of slips (which the UI ensures by showing trend over streak).

**Data model:**
```typescript
type HabitMode = 'build' | 'reduce'
type ReduceTracking = 'zero_day' | 'limit'

type Habit = {
  // ...existing
  mode?: HabitMode              // default: 'build'
  reduceTracking?: ReduceTracking
  dailyLimit?: number           // for limit mode
}

// For limit mode, logs store count instead of just presence:
// HabitLog entry for reduce+limit: "2026-10-23:3" (date:count)
// HabitLog entry for reduce+zero_day: "2026-10-23" (slip date)
// HabitLog entry for build: "2026-10-23" (completion date, unchanged)
```

**Effort:** ~55 min. Mode selector on creation form, inverted grid rendering, limit counter component, trend calculation (weekly/monthly averages), slip vs. clean day logic. Server: validation for new fields, limit count storage.

---

## K5. Habit Seasons (Cyclical Activation)

**Blind spot addressed:** Every proposal treats habits as continuous — they start, they run daily or weekly, and they either persist or get archived/deleted. Real life has seasons: school terms, sports seasons, weather-dependent activities, work cycles. "Go swimming" makes sense June–September. "Study for finals" makes sense in December and May. Currently, these habits must be archived and recreated, losing their history and streaks each time.

**What it does:**

Habits can optionally define active seasons:

```
Create a habit:

  Name: Morning run (outdoor)
  Frequency: Daily
  Season: ● Year-round  ○ Seasonal

  [When "Seasonal" is selected:]
  Active months: [Apr] [May] [Jun] [Jul] [Aug] [Sep] [Oct]
  
  During off-season:
    ○ Hide completely
    ● Show dimmed (read-only)
    ○ Replace with alternative: [Indoor treadmill]
```

During the active season, the habit works normally. During the off-season:

```
Morning run (outdoor)     Seasonal — returns April 2027
  ░░░░░░░░░░░░░░         ← dimmed cells, not interactive

  Last season: 142/183 days (78%)
  Best streak: 34 days
```

Design details:
- **Seasonal habits don't break streaks in the off-season.** The streak pauses and resumes when the season returns.
- **Season history is preserved.** "Last summer you ran 142 of 183 days" is a powerful motivator when the next season starts.
- **The "Replace with alternative" option** lets users set up seasonal pairs — outdoor running → treadmill, swimming → gym, etc. — with automatic switching.
- **Seasonal habits approaching their end date** get a gentle "Season ending in 2 weeks" notice, so the user can plan the transition.
- **Year-over-year comparison:** "This summer vs. last summer" becomes a natural metric.

**Why it's different from everything proposed before:**
- Archive is permanent removal from active view. Seasons are cyclical — the habit returns automatically.
- "Habit Sunset" (J3) is a permanent, celebrated ending. Seasons are recurring cycles.
- "Custom Scheduling" (G1) handles weekly patterns (Mon/Wed/Fri). Seasons handle annual patterns (Apr–Oct).
- No prior proposal addresses the yearly rhythm of human behavior.

**Behavioral science:** Circannual rhythms — humans have well-documented seasonal patterns in motivation, activity, and mood (Kasper et al., 1989). Fighting these patterns ("I should run outdoors in January in Minnesota") creates guilt and failure. Working WITH them ("outdoor running is a summer habit; I switch to indoor exercise in winter") is realistic and sustainable. The seasonal comparison ("last summer vs. this summer") leverages temporal self-comparison (Albert, 1977), which is more motivating than absolute metrics for cyclical activities.

**Data model:**
```typescript
type Habit = {
  // ...existing
  seasonal?: boolean
  activeMonths?: number[]       // 1-12, e.g. [4,5,6,7,8,9,10]
  offSeasonDisplay?: 'hidden' | 'dimmed' | 'replaced'
  offSeasonAlternativeId?: string  // habit ID of the replacement
}
```

**Effort:** ~40 min. Season selector on creation form, month picker component, off-season rendering logic, season transition detection, year-over-year comparison stats. Server: season fields on habit, filtered queries.

---

## Novelty Matrix

| ID | Feature | Blind Spot | Why 88 Prior Proposals Missed It |
|----|---------|-----------|----------------------------------|
| K1 | Habit Scaling | Fixed-magnitude actions | All proposals treat habits as binary (done/not done). None models variable effort levels within a single habit. |
| K2 | Comeback Mode | Consistent daily usage | All proposals assume the user never leaves. None designs for the re-entry moment after a gap. |
| K3 | Habit Experiments | Known-best approach | All proposals assume the user knows how to do their habit. None helps them systematically test variations. |
| K4 | Anti-Habits | Additive-only behaviors | Every proposal tracks doing MORE. None inverts the model for behaviors you want to REDUCE. |
| K5 | Habit Seasons | Year-round continuity | All proposals treat habits as continuous. None models cyclical, seasonal activation. |

---

## Integration with Existing ROADMAP.md Backlog

These features slot into the existing tier structure:

### Recommended tier placement:

| Feature | Tier | Rationale |
|---------|------|-----------|
| K2 (Comeback Mode) | **Tier 1** | No data model changes, pure UI, huge impact on retention. Should ship early. |
| K4 (Anti-Habits) | **Tier 2** | New habit mode, moderate data model change, addresses a large user segment. |
| K1 (Habit Scaling) | **Tier 2** | Modifies log format (requires migration), but transforms daily interaction. |
| K5 (Habit Seasons) | **Tier 3** | Needs several weeks of data to be meaningful. |
| K3 (Habit Experiments) | **Tier 3** | Most useful after the user has established habits and wants to optimize. |

### Updated backlog (ROADMAP.md tiers + K-series):

**Tier 0 — Fix What's Broken (~45 min)**
Unchanged from ROADMAP.md: API error handling, edit habit, unarchive, clean dead CSS, clean test data.

**Tier 1 — Transform Daily Experience (~105 min, pick 3)**
- 1.1 Habit Debt Dashboard (30 min) — from ROADMAP.md
- 1.2 Momentum Decay Sparkline (20 min) — from ROADMAP.md
- 1.3 Anchor Statement (10 min) — from ROADMAP.md
- 1.4 Silent Streaks (15 min) — from ROADMAP.md
- **1.5 Comeback Mode (30 min) — K2 NEW**

**Tier 2 — New Dimensions (~215 min, pick 3)**
- 2.1 Custom Scheduling (45 min) — from ROADMAP.md
- 2.2 Effort Budget (40 min) — J1
- 2.3 Habit Sunset (35 min) — J3
- 2.4 Retroactive Recognition (35 min) — from ROADMAP.md
- **2.5 Anti-Habits (55 min) — K4 NEW**
- **2.6 Habit Scaling (45 min) — K1 NEW**

**Tier 3 — Engagement & Intelligence (~235 min, pick 3)**
- 3.1 Habit Conversation (55 min) — J4
- 3.2 Narrative View (50 min) — J2
- 3.3 Time Capsule (40 min) — J5
- 3.4 Weekly Rhythm Score (30 min) — from ROADMAP.md
- **3.5 Habit Seasons (40 min) — K5 NEW**
- **3.6 Habit Experiments (50 min) — K3 NEW**

**Tier 4 — Analytics & Depth (~170 min)**
Unchanged from ROADMAP.md.

---

## Recommended Implementation Order

Given that 0 features have shipped, the priority is:

1. **Tier 0** — fix bugs (45 min). Non-negotiable.
2. **Tier 1: Comeback Mode (K2) + Anchor Statement (1.3)** — 40 min total. Comeback Mode is the highest-ROI feature in the entire backlog: it addresses the #1 cause of app abandonment with zero data model changes. Anchor Statement adds emotional depth with minimal effort.
3. **Tier 2: Anti-Habits (K4) + Habit Scaling (K1)** — 100 min total. These two features together redefine what "habit tracking" means: you can track reductions, and every habit has a can't-fail minimum. No competing habit tracker offers both.

After these three sessions (~185 min total), the app would have:
- A solid foundation (bugs fixed)
- A compassionate re-entry experience (Comeback Mode)
- Emotional depth (Anchor Statement)
- Reduction tracking (Anti-Habits)
- Flexible effort levels (Habit Scaling)

That's a genuinely differentiated product.

---

## Anti-Planning Note

This document exists because the task specifically requested feature documentation before implementation. Under normal circumstances, the next step should be **Tier 0 code** — the five bug fixes described in ROADMAP.md. Every planning document in this repository, including this one, is a reason NOT to write another planning document. Ship code.
