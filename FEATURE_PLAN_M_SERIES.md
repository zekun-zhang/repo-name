# Habit Garden — M-Series Feature Proposals & Consolidated Backlog

**Date:** 2026-10-28
**Status:** Supplements FEATURES_AND_BACKLOG.md with 5 genuinely novel proposals

---

## Why Another Document?

This project has 18 planning documents and 0 shipped features. This document exists because a scheduled audit found blind spots that even the L-series (which audited all prior proposals) missed. It does NOT replace FEATURES_AND_BACKLOG.md — it adds 5 proposals and a tighter execution plan.

**If you're reading this and haven't shipped Tier 0 yet, stop reading and go fix the bugs.**

---

## What 98 Prior Proposals All Share (Including L1–L5)

After analyzing proposals C through L, one structural assumption persists across every single one:

**Every habit is boolean.** Done or not done. Checked or unchecked. 1 or 0.

This is the deepest unquestioned assumption in the entire project. Every feature — streaks, sparklines, zones, routines, narratives, effort budgets, difficulty curves — is built on top of a boolean completion model. But most real-world habits have a natural *quantity*:

- "Drink water" → how many glasses?
- "Exercise" → how many minutes?
- "Read" → how many pages?
- "Meditate" → how many minutes?
- "Write" → how many words?

A user who read 15 pages toward a 20-page goal gets the same empty checkbox as someone who read zero. That's not tracking — it's judgment.

Beyond the boolean assumption, there are four more blind spots:

1. **The app's identity is unrealized.** It's called "Habit Garden" but looks like a spreadsheet. The metaphor that names the entire product exists only as text in the header.
2. **No prediction.** Every feature looks backward (what happened) or at the present (what to do now). None looks forward to predict difficulty based on the user's own historical patterns.
3. **Habits exist in isolation.** No feature discovers relationships between habits — which ones catalyze others, which ones compete for the same energy.
4. **History is static.** The 14-day grid is a snapshot. There's no way to *experience* your journey — to watch your progress unfold over time and feel the emotional weight of months of effort.

M1–M5 each targets one of these blind spots.

---

## M1. Quantity Tracking (Measurable Goals)

**Blind spot:** All 98 proposals assume habits are boolean. In reality, most habits have a natural measurement.

### What It Does

Habits gain an optional `target` field — a daily goal with a unit:

```
Create a habit:
  Name: Read
  Frequency: Daily
  Goal: [20] [pages]          ← new
  Color: #6366f1
```

The day cell changes from a binary checkbox to a progress ring:

```
Today's habits:

  Read 20 pages         ████████░░  15/20 pages    75%
  Exercise 30 min       ██████████  30/30 min     100% ✓
  Drink 8 glasses       ██░░░░░░░░   2/8 glasses   25%
  Meditate              ✓ (boolean — no target)
```

Tapping a quantity habit opens a quick-input:

```
┌─────────────────────────┐
│  Read                    │
│  How many pages today?   │
│                          │
│  [  15  ]  / 20 pages    │
│                          │
│  [ Save ]                │
└─────────────────────────┘
```

**Key design decisions:**
- **Targets are optional.** Habits without targets stay boolean — the current UX is unchanged. This is additive, not a rewrite.
- **Partial completion counts.** Reading 15 of 20 pages is 75% complete, not a miss. The streak calculation gains nuance: a "soft streak" counts days with >50% completion; a "hard streak" counts only 100%.
- **Units are freeform text.** Not a dropdown — the user types "pages", "minutes", "glasses", "words", whatever fits. The app doesn't interpret units; it just displays them.
- **The 14-day grid adapts.** Quantity habits show fill level (25%/50%/75%/100%) as opacity or a mini progress ring instead of a binary check. Boolean habits keep the current checkmark.

**Why no prior proposal covers this:**
- "Habit Scaling" (K1) offers micro/standard/stretch tiers — still boolean at each tier.
- "Compound Progress" (C1) accumulates totals — but each day is still done/not-done.
- "Anti-Habits" (K4) counts avoidance — still a daily boolean (did you avoid it?).
- Quantity tracking changes the fundamental data model from `boolean` to `number`, which no proposal does.

**Behavioral science:** "Partial reinforcement" (Skinner, 1957) — partial completion that is recognized and rewarded leads to higher long-term engagement than all-or-nothing binary systems. Amabile & Kramer (2011) found that the single strongest motivator in daily work is "making progress" — even small progress. A system that recognizes 15/20 pages as real progress sustains motivation better than one that marks it as failure.

**Data model:**
```typescript
type Habit = {
  // ...existing fields
  targetValue?: number    // e.g. 20
  targetUnit?: string     // e.g. "pages"
}

type HabitLog = {
  [habitId: string]: (string | { date: string; value: number })[]
  // backward compatible: strings are boolean completions,
  // objects are quantity entries
}
```

**Effort:** ~45 min. Target fields in HabitForm, quantity input modal, progress ring component, updated streak calculation, backward-compatible log format. Server needs minor log-shape changes.

---

## M2. The Living Garden (Interactive Ecosystem Visualization)

**Blind spot:** The app is called "Habit Garden" but it's a table. The central metaphor — the idea that makes this app *this app* and not "Generic Habit Tracker #47" — exists only as two words in the header.

### What It Does

A toggle button switches between "Table View" (current) and "Garden View":

```
┌─────────────────────────────────────────────────────┐
│                   Your Garden                        │
│                                                      │
│      🌳          🌻      🌱                          │
│    Exercise    Meditate   Spanish                    │
│    (thriving)  (blooming) (seedling)                 │
│                                                      │
│          🌿          🥀                               │
│        Reading     Journal                           │
│        (growing)   (wilting)                         │
│                                                      │
│    ─── Ground ──────────────────────────────         │
│    Season: Autumn · Garden age: 47 days              │
│    Plants: 5 · Thriving: 2 · Needs water: 1         │
│                                                      │
│         [ Water All ]    [ Table View ]              │
└─────────────────────────────────────────────────────┘
```

Each habit is a plant whose appearance reflects its state:

| State | Visual | Criteria |
|-------|--------|----------|
| Seedling 🌱 | Small sprout | Created < 7 days ago |
| Growing 🌿 | Leafy plant | 7–21 day streak |
| Blooming 🌻 | Flowering | 21–60 day streak |
| Thriving 🌳 | Full tree | 60+ day streak |
| Wilting 🥀 | Drooping | Streak broken, < 3 days since last completion |
| Dormant 🪨 | Bare stem | No completion in 7+ days |

**Key design decisions:**
- **Garden View is the *emotional* view; Table View is the *operational* view.** Users switch between them based on whether they want to feel their progress or manage it. Neither replaces the other.
- **Plants are CSS/SVG, not emoji.** The emoji above is for this doc. The actual implementation uses simple, stylized SVG illustrations that match the dark theme and feel organic.
- **Clicking a plant opens a detail card** with the habit's stats, streak, and a "Water" (complete today) button. The garden is fully interactive, not just a visualization.
- **"Water All" completes all habits for today** — a power-user shortcut. (Only available if all habits are boolean; quantity habits require individual input.)
- **The garden has ambient animation.** Plants sway gently. Blooming plants occasionally emit a particle. The effect is calming, not gamified.

**Why it's in the "Parked" list but shouldn't be:**
FEATURES_AND_BACKLOG.md parks this as "high effort — ship when daily UX is solid." But the garden IS the daily UX for the emotional dimension. The Table View handles operations (check things off). The Garden View handles motivation (see your habits as living things). Shipping the table without the garden is like shipping a music player without album art — functional but soulless.

The "high effort" estimate assumes complex 3D graphics or Canvas animations. A clean SVG implementation with CSS transitions is achievable in ~60 min.

**Behavioral science:** "Object attachment" (Belk, 1988) — people form emotional bonds with representations of their effort. Tamagotchi (1996) demonstrated that even minimal virtual life creates powerful stewardship motivation. The garden leverages "loss aversion" (Kahneman & Tversky, 1979) through wilting: the prospect of a plant wilting is more motivating than the prospect of a check being unchecked, because organic metaphors trigger caretaker instincts that abstract data does not.

**Data model:** No schema changes. Plant state is computed from existing streak data and completion timestamps. Pure rendering logic.

**Effort:** ~60 min. SVG plant components (5 states × stylized template), garden layout, detail card, view toggle, CSS transitions. No server changes.

---

## M3. Habit Weather (Predictive Difficulty Forecast)

**Blind spot:** Every feature looks backward (streaks, sparklines, narratives) or at the present (zones, effort budget, now mode). No feature looks *forward* to tell the user what today will probably be like, based on their own data.

### What It Does

A small forecast banner at the top of the habits view:

```
┌─────────────────────────────────────────────────────┐
│  Today's Forecast: Partly Cloudy ⛅                  │
│  Wednesdays are your 2nd hardest day (avg 62%).     │
│  Your last 3 Wednesdays: 4/6, 3/6, 5/6.            │
│  Tip: Front-load the easy ones.                      │
└─────────────────────────────────────────────────────┘
```

The forecast is computed entirely from the user's own historical data:

| Signal | Weight | Example |
|--------|--------|---------|
| Day-of-week completion rate | 40% | "Mondays average 45% completion" |
| Recent momentum (7-day trend) | 25% | "You've completed 80% this week — momentum is up" |
| Post-gap vulnerability | 20% | "Day after a missed day: historically 55%" |
| Streak pressure | 15% | "Long streaks (20+ days) slightly increase miss probability" |

The forecast maps to 5 weather states:

| Weather | Predicted Completion | Visual |
|---------|---------------------|--------|
| Sunny ☀️ | > 85% | Bright, confident |
| Partly Cloudy ⛅ | 65–85% | Mild caution |
| Cloudy ☁️ | 50–65% | Heads up |
| Rainy 🌧️ | 35–50% | Prepare to be kind to yourself |
| Stormy ⛈️ | < 35% | Survival mode — pick 1–2 habits max |

**Key design decisions:**
- **The forecast is descriptive, not prescriptive.** "Wednesdays are hard for you" — not "you should skip habits on Wednesday." The user decides what to do with the information.
- **Requires 4+ weeks of data.** Below that threshold, no forecast is shown. The feature quietly activates once enough data exists — no setup, no prompt.
- **Weather metaphor is deliberately soft.** "Rainy" doesn't mean "you'll fail." It means "the data suggests today might be harder than usual." The framing is informational, not threatening.
- **Forecast updates through the day.** As the user completes habits, the forecast adjusts: "Started Rainy, but you've already done 3/6 — upgraded to Partly Cloudy."
- **Integration with Effort Budget (J1).** If Effort Budget is implemented, a Stormy forecast could suggest defaulting to "Low" energy budget.

**Why no prior proposal covers this:**
- "Difficulty Curve" (L4) shows *lifecycle* predictions (week 2–4 is hard). Weather shows *day-level* predictions (this Wednesday will be hard).
- "Habit Zones" (L3) react to what *has happened* (declining completion moves to Focus). Weather predicts what *will happen today*.
- "Effort Budget" (J1) is user-declared energy. Weather is data-derived difficulty — the user doesn't have to self-assess.
- "Habit Conversation" (J4) asks a question. Weather provides an unprompted, ambient forecast.

**Behavioral science:** "Psychological forecasting" (Wilson & Gilbert, 2003) — people are notoriously bad at predicting their own future emotional states and behavioral capacity. They overestimate on good days and underestimate on bad ones. Providing a data-driven forecast calibrates expectations, which is the single strongest predictor of satisfaction (expectation - reality). When difficulty is expected, it doesn't feel like failure — it feels like weather. "Planning fallacy" (Kahneman & Tversky, 1979) — people consistently underestimate task difficulty. The forecast is a systematic correction to this bias.

**Data model:** No schema changes. All signals are computed from existing logs + date metadata. Pure frontend rendering logic.

**Effort:** ~30 min. Day-of-week analysis utility, trend calculation, composite forecast score, weather banner component. No server changes.

---

## M4. Keystone Habit Detection (Cross-Habit Correlation)

**Blind spot:** Every feature treats each habit as independent. No feature discovers that habits influence each other. In reality, some habits are "keystone habits" (Duhigg, 2012) — when you do them, other habits become easier. When you skip them, everything else falls apart.

### What It Does

After 4+ weeks of data, the app automatically detects correlations between habits and surfaces them:

```
┌─────────────────────────────────────────────────────┐
│  Keystone Insight                                    │
│                                                      │
│  Exercise appears to be your keystone habit.         │
│                                                      │
│  On days you exercise:                               │
│    Meditation:  82% completion (vs. 41% without)     │
│    Reading:     77% completion (vs. 55% without)     │
│    Journaling:  68% completion (vs. 30% without)     │
│                                                      │
│  When you exercise, everything else follows.         │
│                                                      │
│  ──────────────────────────                          │
│  Conflict detected:                                  │
│  Exercise and Deep Clean rarely happen on the        │
│  same day (only 12% overlap).                        │
│  They may compete for the same energy.               │
└─────────────────────────────────────────────────────┘
```

The system detects two types of relationships:

1. **Catalysts:** Habits where completion on the same day is significantly correlated (>20 percentage point lift). These are keystone habits — doing them makes everything else more likely.

2. **Competitors:** Habits that rarely co-occur (significantly lower than expected overlap). These compete for the same limited resource (time, energy, willpower).

**Key design decisions:**
- **Insights surface passively.** No setup, no configuration. After 28+ days of data, the app analyzes correlations and shows a small "Insights" section below the habit table.
- **Statistical significance matters.** The app only shows correlations that pass a simple chi-squared test (p < 0.05 equivalent). Random noise doesn't generate insights.
- **Correlation ≠ causation, and the UI says so.** The language is "appears to be" and "may compete," never "causes." A small info tooltip explains: "This is a pattern in your data, not a proven cause."
- **Actionable framing.** The insight doesn't just state the correlation — it suggests a strategy: "Prioritize exercise early in the day to unlock the cascade."
- **Updates weekly.** Correlations are recomputed every 7 days, not every render. This prevents noisy fluctuations and reduces computation.

**Why no prior proposal covers this:**
- "Ripple Effects" (I4) was proposed but framed as a visualization of *user-declared* relationships. Keystone Detection discovers relationships *automatically from data*.
- "Habit Stacking" chains habits in user-defined sequences. Keystone Detection reveals natural sequences that already exist.
- "Compound Progress" (C1) tracks cumulative totals per habit. Keystone Detection tracks *inter-habit* patterns.
- No prior proposal performs any statistical analysis across habits.

**Behavioral science:** "Keystone habits" (Duhigg, 2012) are behaviors that create a chain reaction, shifting other patterns. Exercise is the most commonly cited example: people who start exercising tend to eat better, sleep better, and be more productive — not because exercise directly causes those things, but because it shifts self-identity ("I'm someone who takes care of themselves"). Making keystone habits *visible* lets users protect them strategically. The "competitor" detection addresses "goal conflict" (Riediger & Freund, 2004) — when pursuing one goal undermines another, people experience stress and reduced performance on both. Making conflicts visible allows intentional scheduling.

**Data model:** No schema changes. Correlation analysis runs on existing log data.

**Effort:** ~40 min. Correlation computation utility (conditional completion rates, significance test), weekly computation with cache, insights component. No server changes; computation runs client-side.

---

## M5. Habit Replay (Animated Journey Playback)

**Blind spot:** History in the app is a static 14-day grid. There's no way to *experience* your journey — to watch weeks and months of effort unfold and feel the emotional weight of sustained commitment (or the resilience of recovery).

### What It Does

A "Replay" button opens a full-screen animated timeline:

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  ▶ Playing: March 16 – October 28, 2026             │
│  ═══════════════════●═══════  Day 187 / 226         │
│                                                      │
│  ┌─────────────────────────────────────┐             │
│  │  March 16                           │             │
│  │                                     │             │
│  │  Exercise      ░░░░░░░░░░░░░░       │             │
│  │  Meditate      ▓░░░░░░░░░░░░░       │             │
│  │  Read          ░░░░░░░░░░░░░░       │             │
│  │                                     │             │
│  │  Habits: 3  ·  Completed: 1        │             │
│  └─────────────────────────────────────┘             │
│                                                      │
│  As days play forward, bars fill in, streaks build,  │
│  new habits appear, old ones sunset, gaps appear     │
│  and recoveries emerge.                              │
│                                                      │
│  [ ◀◀ ]  [ ▶ / ❚❚ ]  [ ▶▶ ]    Speed: [1x] [3x]   │
│                                                      │
│  Milestone: Day 30 — "You built your first           │
│  sustained habit. Meditation hit a 21-day streak."   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

The replay animates day-by-day (at adjustable speed: 1x = 1 day/second, 3x, 7x):

- **Habit bars grow** as streaks build, showing momentum visually
- **New habits appear** when created (with a subtle entrance animation)
- **Gaps appear** as empty segments, then recoveries fill back in
- **Milestones fire** at key moments: first 7-day streak, first 30-day streak, most habits completed in a day, longest total streak, comeback after longest gap
- **Summary at the end:** total days tracked, total completions, longest streak ever, number of habits created, number graduated/sunset

**Key design decisions:**
- **The replay is personal cinema.** It's not an analytical tool — it's an emotional experience. The point is to *feel* 6 months of effort compressed into 60 seconds.
- **Milestones are auto-detected.** The app identifies notable moments (streak records, completion records, comebacks) and labels them during playback. No user configuration.
- **Scrubbing is supported.** The user can drag the timeline to any date, pause, and resume. They can also tap any date in the timeline to see that day's details.
- **Shareable snapshot.** At the end of replay, the app generates a static summary image (SVG) that the user can save — their habit journey as a single visual. This is the closest the app gets to "social" without being social.
- **Available after 30+ days.** Below that, the replay is too short to be meaningful.

**Why no prior proposal covers this:**
- "Narrative View" (J2) tells today's story in text. Replay shows the *entire journey* as animation.
- "Momentum Decay Sparkline" (C2) shows 7 days of micro-trend. Replay shows months.
- "Time Capsule" (J5) bridges two moments. Replay shows every moment in between.
- No prior proposal uses animation or temporal playback as an information medium.

**Behavioral science:** "Peak-end rule" (Kahneman, 2000) — people judge experiences by their peak intensity and their ending, not their average. A 6-month habit journey has countless moments, but the user remembers a few peaks and how it ended. Replay lets them *re-experience* peaks they may have forgotten, which reinforces the identity narrative ("I'm someone who persists"). "Temporal self-appraisal" (Wilson & Ross, 2001) — seeing your past self's effort from a distance increases self-compassion and pride, because temporal distance creates the same perspective shift as spatial distance. Watching your journey in fast-forward creates exactly this distance.

**Data model:** No schema changes. All animation data comes from existing logs and habit timestamps. Pure rendering logic.

**Effort:** ~50 min. Timeline scrubber, day-by-day animation loop, habit bar components, milestone detection algorithm, summary screen. All CSS animations + requestAnimationFrame. No server changes.

---

## Novelty Matrix

| ID | Feature | Blind Spot | Why 98 Prior Proposals Missed It |
|----|---------|-----------|----------------------------------|
| M1 | Quantity Tracking | Boolean-only data model | Every proposal builds on done/not-done. None questions whether "done" is the right measurement. |
| M2 | Living Garden | Unrealized app identity | Everyone sees "Habit Garden" as a name. The garden metaphor is the app's core differentiator, hiding in plain sight. |
| M3 | Habit Weather | No forward prediction | All features look backward or at the present. None uses historical patterns to predict today's difficulty. |
| M4 | Keystone Detection | Habits are isolated | All features treat each habit independently. None discovers that habits influence each other. |
| M5 | Habit Replay | Static history | The 14-day grid is a snapshot. None creates a temporal, animated experience of the user's journey. |

---

## Consolidated Execution Backlog

Drawing from the best of all proposals (C through M), organized by what to build and when.

### Tier 0 — Fix What's Broken (~45 min)

No features until these are done. These are correctness bugs.

| # | Item | Detail | Est. |
|---|------|--------|------|
| 0.1 | API error handling | `if (!res.ok) throw` in all `api.ts` functions | 10 min |
| 0.2 | Edit habit | `PUT /api/habits/:id` + inline edit UI | 20 min |
| 0.3 | Unarchive | `POST /api/habits/:id/unarchive` + archived section | 10 min |
| 0.4 | Remove dead CSS | Delete unused `index.css` | 2 min |
| 0.5 | Clean test data | Reset `data.json` to empty | 1 min |

### Tier 1 — Make It Yours (~70 min, pick 3)

Features that give the app a soul. Each is independent.

| # | Feature | Est. | Source | Impact |
|---|---------|------|--------|--------|
| 1.1 | **Starter Packs** | 30 min | L1 | Solves cold-start — users get started in 30 seconds |
| 1.2 | **Anchor Statement** | 10 min | C3 | One text field, enormous emotional depth |
| 1.3 | **Difficulty Curve** | 25 min | L4 | Normalizes struggle, reduces early dropout |
| 1.4 | **Quantity Tracking** | 45 min | **M1** | Transforms the data model from boolean to continuous |

### Tier 2 — Daily Experience (~75 min, pick 3)

Features that change how the app feels each day.

| # | Feature | Est. | Source | Impact |
|---|---------|------|--------|--------|
| 2.1 | **Habit Zones** | 35 min | L3 | Manages cognitive load as habit list grows |
| 2.2 | **Habit Weather** | 30 min | **M3** | Predictive difficulty makes users proactive |
| 2.3 | **Comeback Mode** | 30 min | K2 | Warm welcome after a gap, not a wall of failure |
| 2.4 | **Momentum Sparkline** | 20 min | C2 | Ambient early-warning for declining habits |

### Tier 3 — Differentiation (~120 min, pick 3)

Features that make Habit Garden unlike any other habit tracker.

| # | Feature | Est. | Source | Impact |
|---|---------|------|--------|--------|
| 3.1 | **Living Garden** | 60 min | **M2** | Realizes the app's identity — this IS the product |
| 3.2 | **Now Mode** | 35 min | L5 | Single-action focus for overwhelmed moments |
| 3.3 | **Context Routines** | 45 min | L2 | Time-of-day structure makes the app a daily companion |
| 3.4 | **Effort Budget** | 40 min | J1 | Energy-aware prioritization — a unique concept |

### Tier 4 — Intelligence (~90 min, pick 2)

Require 4+ weeks of real usage data.

| # | Feature | Est. | Source | Impact |
|---|---------|------|--------|--------|
| 4.1 | **Keystone Detection** | 40 min | **M4** | Reveals hidden habit relationships from data |
| 4.2 | **Habit Replay** | 50 min | **M5** | Emotional journey visualization — shareable |
| 4.3 | **Habit Conversation** | 55 min | J4 | Bidirectional dialogue, not just a dashboard |
| 4.4 | **Narrative View** | 50 min | J2 | Story mode for habits |

### Tier 5 — Depth & Lifecycle (~110 min)

For mature usage (2+ months of data, 5+ habits).

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 5.1 | Habit Sunset | 35 min | J3 |
| 5.2 | Time Capsule | 40 min | J5 |
| 5.3 | Habit Scaling | 45 min | K1 |
| 5.4 | Weekly Rhythm Score | 30 min | C4 |

### Parked — Valid But Not Now

| Feature | Reason |
|---------|--------|
| Anti-Habits (K4) | Interesting but niche; core tracking should be solid first |
| Custom Scheduling (Mon/Wed/Fri) | Context Routines (L2) handle the more common need |
| Habit Stacking | Complex dependency model; Keystone Detection (M4) reveals natural chains |
| Social / Sharing | Personal-first app; Replay summary image (M5) is the lightweight social bridge |
| PWA / Offline / Export | Infrastructure, not a feature |
| Full Analytics Dashboard | Needs months of data; premature |

---

## Recommended Execution Path

### Session A: Foundation (~45 min)
All of Tier 0. The app becomes correct.

### Session B: First Impression (~65 min)
- Starter Packs (L1) → new users start in 30 seconds
- Anchor Statement (C3) → emotional depth, 10 minutes of code
- Difficulty Curve (L4) → new habits feel supported

**After Session B:** The app has a designed onboarding experience and emotional depth.

### Session C: Daily Loop (~65 min)
- Habit Zones (L3) → adaptive visibility based on what needs attention
- Habit Weather (M3) → predictive difficulty forecast
- Momentum Sparkline (C2) → ambient trend indicator

**After Session C:** The app is smart about what to show and when.

### Session D: Identity (~95 min)
- Living Garden (M2) → the app becomes its name
- Now Mode (L5) → single-action focus for overwhelmed moments

**After Session D:** Habit Garden is no longer "another habit tracker." It has a visual identity and UX that no competitor offers.

### Session E: Intelligence (~90 min)
- Quantity Tracking (M1) → habits become measurable
- Keystone Detection (M4) → the app discovers hidden patterns

**After Session E:** The app understands habits as quantifiable, interconnected behaviors.

---

## Dependency Map

```
Tier 0 (bugs) → everything depends on this

Independent (any order after Tier 0):
  L1 Starter Packs       M1 Quantity Tracking
  C3 Anchor Statement     M2 Living Garden
  L4 Difficulty Curve     M3 Habit Weather
  L3 Habit Zones          M4 Keystone Detection
  K2 Comeback Mode        M5 Habit Replay
  C2 Momentum Sparkline   L5 Now Mode
  J1 Effort Budget        J3 Habit Sunset

Soft dependencies (enhanced by, but doesn't require):
  M2 Living Garden ← enhanced by M1 Quantity Tracking (progress rings on plants)
  M3 Habit Weather ← enhanced by M1 Quantity Tracking (quantity patterns in forecast)
  M4 Keystone Detection ← enhanced by M1 Quantity Tracking (correlation on quantity, not just boolean)
  M5 Habit Replay ← enhanced by M2 Living Garden (replay shows garden growing)
  M5 Habit Replay ← enhanced by J3 Habit Sunset (replay shows sunsets as milestones)
  L5 Now Mode ← enhanced by L2 Context Routines (time-of-day priority)
  L5 Now Mode ← enhanced by J1 Effort Budget (cost-based priority)
  L5 Now Mode ← enhanced by C3 Anchor Statement (shows "why" in focus view)
```

---

## Total Scope

| Metric | Value |
|--------|-------|
| New proposals (M-series) | 5 |
| Total proposals across all series | ~103 |
| Curated backlog items | 22 (Tiers 0–5) |
| Tier 0 estimate | ~45 min |
| Tier 0 + Session B | ~110 min |
| Full curated backlog | ~510 min (~8.5 hours) |
| **Next action** | Tier 0.1 — add `if (!res.ok)` to `api.ts` |

---

## The Planning Debt Situation

This is now the **19th planning document** in a project with **0 shipped features**.

This document will be the last planning document. The next document created in this repository should be a CHANGELOG.
