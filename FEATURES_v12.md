# Habit Garden — Feature Plan v12: Fresh Features & Execution Backlog

**Date:** 2026-10-10  
**Purpose:** New creative features addressing conceptual gaps no prior document covers, plus a restructured execution backlog.

---

## Project Reality Check

| Metric | Value |
|--------|-------|
| Application code | ~960 lines across 11 source files |
| Working features | Create, toggle (14-day grid), streaks, archive, delete |
| Planning documents | 11 (PLAN.md, v3-v11, BACKLOG.md) |
| Planning lines | ~7,000+ |
| Proposals across all docs | 49 dimensions + 5 C-proposals = 54 total |
| Features shipped from plans | **0** |

The codebase is a clean, well-structured React 19 + Express app with optimistic updates and a JSON-file backend. The architecture is sound. The gap is execution, not ideas. This document adds only proposals that fill conceptual territories the existing 54 do not touch, then restructures the backlog for immediate action.

---

## Dimension Coverage Audit

Before proposing anything, here's what the 54 existing proposals already cover:

| Territory | Covered By |
|-----------|------------|
| Streak mechanics | Grace days, 2-day rule, shields, milestones, recovery |
| Cumulative progress | C1 (compound progress) |
| Trend visualization | C2 (momentum decay sparkline) |
| Motivation anchoring | C3 (anchor statement) |
| Weekly consistency | C4 (rhythm score) |
| Post-completion metadata | C5 (friction log) |
| Post-miss metadata | Dim 45 (miss reason capture) |
| Environmental triggers | Dim 46 (cue anchoring) |
| Life balance | Dim 47 (balance radar) |
| Habit graduation | Dim 48 (automaticity) |
| Earned protection | Dim 49 (streak shields) |
| Habit relationships | N1 (stacking/chains) |
| Reflection | N4 (weekly compass), M2 (notes) |
| Daily energy | N3 (energy check-in) |
| Celebrations | N8 (completion sparks) |
| Difficulty scaling | N5 (difficulty progression) |
| Analytics | Dim 31 (system score), dim 32 (slump radar), heatmap |

**Five gaps remain that none of these 54 proposals address:**

1. **Breaking bad habits** — Every proposal assumes habits are behaviors to *add*. None handles behaviors to *stop*.
2. **Restart psychology** — Every streak proposal prevents or softens breaks. None makes *rebuilding* after a break feel rewarding.
3. **Tiny fallback actions** — No proposal handles the case where the full habit is too much today but *something* is still possible.
4. **Automatic pattern discovery** — Habit Stacking is user-configured. No proposal discovers correlations the user hasn't noticed.
5. **Holistic emotional summary** — System Score is a number. Momentum Decay is per-habit. No proposal gives a single emotional, at-a-glance summary of overall habit health.

---

## New Feature Proposals

### D1. Reverse Habits (Track What You're Stopping)

**Gap:** Every habit in the system is additive — "do this thing." But real habit-building includes *subtraction*: stop smoking, stop doom-scrolling, stop snacking after 9pm, stop hitting snooze. A "reverse habit" tracks days *without* the behavior. This is a fundamentally unserved user need.

**What:** When creating a habit, the user picks a direction:

```
Direction:  [Build ▲]  [Break ▼]    ← NEW

Build habits:  ✓ = I did it today (existing behavior)
Break habits:  ✓ = I resisted today (inverted framing)
```

Break habits have inverted visual logic:
- Day cells start "pre-filled" (assuming success) and the user marks days they *failed* to resist
- OR (simpler): day cells work identically but the streak label says "3 days clean" instead of "3 days"
- The color scheme shifts — break habits use a distinct visual style (e.g., a subtle strikethrough on the name, or a different cell shape) so the user sees at a glance which habits are about adding and which are about subtracting

The streak calculation is the same (consecutive days with the mark), but the *meaning* inverts: for build habits, a check means "I did it"; for break habits, a check means "I didn't do it."

**Why it's different from all 54 proposals:**
- Every existing dimension assumes `completed = good`. Reverse habits introduce `completed = resisted`, which is a different psychological frame.
- Miss Reason (dim 45) asks "why did you skip?" Reverse habits ask "did you resist?" — a positive frame for avoidance goals.
- No prior proposal changes the *meaning* of a completion. This does.

**Behavioral science:** Approach vs. avoidance goals (Elliot & Harackiewicz, 1996). About 40% of New Year's resolutions are avoidance goals ("stop X"). Tracking them as "days clean" leverages the same streak psychology but for subtraction. Recovery programs (AA's "chip" system) prove that counting clean days is powerfully motivating. The key design insight: reframing avoidance as a positive action ("I resisted") rather than a negative one ("I didn't fail") aligns with self-determination theory's autonomy need.

**Data model:**
```typescript
type Habit = {
  // ...existing
  direction: 'build' | 'break'  // defaults to 'build' for backward compat
}
```

**Effort:** Tiny. One field, minor UI label changes, no new endpoints.

---

### D2. Streak Comeback Bonus

**Gap:** Every streak-related proposal across all 54 dimensions focuses on *preventing* or *softening* streak breaks. Grace days prevent them. Shields absorb them. The 2-day rule softens the threshold. But none addresses the most psychologically devastating moment: *day one of rebuilding*. Going from "47-day streak" to "0-day streak" makes restarting feel pointless. This is the #1 churn point in every habit tracker.

**What:** Two changes that make restarting feel like chasing a personal record instead of starting from nothing:

1. **Personal best display:** Each habit shows both current streak and all-time best streak:
   ```
   Exercise   🔥 3 days  |  Best: 47 days
   Reading    🔥 12 days  |  Best: 12 days ★  ← currently at personal best
   ```

2. **Comeback badge:** The first 3 days after a streak break show a distinct "comeback" visual (a small lightning bolt or "↑ Comeback" label). This reframes day 1 from "I'm starting over" to "I'm coming back."

The personal best is computed from existing log data — no new storage needed. The comeback detection is simple: if the current streak is ≤ 3 AND there exists a previous streak ≥ 7, show the badge.

**Why it's different:**
- Grace Days (N2): prevents the break. Comeback Bonus addresses the *aftermath*.
- Streak Shields (dim 49): absorbs one miss. Comeback Bonus celebrates the *restart*.
- 2-Day Rule (dim 42): softens the threshold. Comeback Bonus changes the *framing* of rebuilding.
- Streak Milestones: celebrate achievements during an active streak. Comeback Bonus celebrates the *act of restarting*.

**Behavioral science:** "Fresh start effect" (Dai, Milkman & Riis, 2014) — people are more likely to pursue goals after temporal landmarks (Monday, New Year, birthdays). A comeback badge creates an *artificial fresh start* after every break, mimicking the motivational boost of temporal landmarks on demand. "Personal best" framing leverages social comparison theory applied inward — competing against your past self is more motivating than competing against an arbitrary standard.

**Data model:** None. Computed from existing log data. Best streak = maximum streak found across all historical date ranges.

**Effort:** Small. Streak calculation extension (track max while iterating), two UI elements.

---

### D3. Micro-Habit Fallback (Tiny Version)

**Gap:** BJ Fogg's Tiny Habits framework is the most research-validated behavior design methodology. Its core principle: when the full habit is too much, do a 2-minute version. No existing proposal captures this. The Friction Log (C5) measures difficulty *after* completion. Difficulty Progression (N5) increases challenge over time. Neither offers a *fallback* when the full version isn't happening today.

**What:** Each habit can have an optional "tiny version" — a minimum-viable action:

```
Create a habit

Name:        Exercise 30 min
Tiny version: Walk around the block (2 min)    ← NEW
```

When completing a habit, the user sees two options:
```
Exercise 30 min
[✓ Done]   [½ Tiny version]
```

Tapping "Tiny version" marks the day with a half-credit:
- Visually: half-filled circle (◐) instead of full check (✓)
- Streaks: a tiny-version day *counts* for streak preservation but is visually distinct
- Stats: the app tracks full vs. tiny completions separately

```
Exercise 30 min   🔥 14 days  (11 full, 3 tiny)
```

The critical design choice: tiny versions *preserve streaks*. This eliminates the all-or-nothing trap. A user who does the tiny version on a hard day maintains their streak AND maintains the habit's neural pathway, which is the actual goal.

**Why it's different:**
- Difficulty Progression (N5): changes the *target* over time. Tiny Version is a *fallback* within a single day.
- Friction Log (C5): measures how hard it was *after doing it*. Tiny Version offers a *lighter option before*.
- 2-Day Rule (dim 42): lets you skip without consequence. Tiny Version says "don't skip — do less."
- Energy Check-In (N3): captures how you feel. Tiny Version gives you an *action* based on low energy.

**Behavioral science:** Fogg's "Behavior = Motivation × Ability - Friction" model shows that when motivation drops, the answer is reducing the behavior (increase ability) rather than increasing motivation. A 2-minute walk is almost zero-friction. The habit loop's neural pathway fires regardless of intensity — and that pathway is what you're building. Streaks that survive through tiny versions create a "never zero" mindset that research shows produces better long-term adherence than rigid standards (Lally et al., 2010, UCL habit formation study).

**Data model:**
```typescript
type Habit = {
  // ...existing
  tinyVersion?: string  // max 100 chars
}

// Log entries become:
type HabitLog = {
  [habitId: string]: string[]  // existing: dates of full completions
}
type TinyLog = {
  [habitId: string]: string[]  // NEW: dates of tiny completions
}
```

**Effort:** Small-Medium. One optional field, split toggle endpoint (full vs. tiny), visual distinction in day cells, streak calculation includes tiny days.

---

### D4. Habit Correlation Insights (Automatic Pattern Discovery)

**Gap:** Habit Stacking (N1) lets users manually chain habits. But users don't always know which habits are connected. The data already contains these patterns — completion logs reveal which habits rise and fall together — but no proposal surfaces them automatically.

**What:** After 30+ days of data, the app analyzes completion patterns across habits and surfaces discovered correlations:

```
📊 Pattern discovered:
When you complete Meditation, you complete Exercise 87% of the time.
When you skip Reading, you skip Journaling 71% of the time.

💡 Consider: Meditation might be a keystone habit for your routine.
```

The analysis is simple co-occurrence:
- For each pair of habits, compute: P(B completed | A completed) vs P(B completed)
- If the conditional probability is significantly higher (>20pp difference), surface it
- Negative correlations too: "When you skip A, you tend to skip B"

Insights appear in a dedicated "Insights" section below the habit table, updated weekly. They're observational, not prescriptive — "here's what your data shows" rather than "you should do X."

**Why it's different:**
- Habit Stacking (N1): user-defined chains. Correlation Insights are *discovered from data*.
- Slump Radar (dim 32): detects decline in one habit. Correlation Insights show *relationships between* habits.
- System Score (dim 31): aggregates everything into one number. Correlation Insights reveal *specific connections*.
- Weekly Compass (N4): user-set intentions. Correlation Insights are data-driven observations.

**Behavioral science:** Duhigg's "keystone habits" concept — some habits trigger cascading positive effects. Exercise correlates with better eating, more productivity, less stress. But which habit is *your* keystone? You can't introspect this reliably; you need data. Correlation discovery makes the invisible architecture of your routine visible, enabling strategic investment in the habits with the highest knock-on effects.

**Data model:** None. Pure computation on existing log data.

**Effort:** Medium. Pair-wise co-occurrence calculation, significance threshold, insight rendering. Requires 30+ days of data to be meaningful.

---

### D5. Habit Weather (Emotional At-a-Glance Summary)

**Gap:** System Score (dim 31) gives a single number. Momentum Decay (C2) is per-habit sparklines. Neither gives a *holistic, emotional, instantly-understood* summary of how your habit life is going right now. Numbers require interpretation. A weather metaphor doesn't.

**What:** A small weather indicator at the top of the app, always visible:

```
┌─────────────────────────┐
│  ☀️ Sunny                │  ← 80-100% of habits completed in last 3 days
│  "Your habits are       │
│   thriving"             │
└─────────────────────────┘
```

Five states based on trailing 3-day completion rate:

| Rate | Weather | Label |
|------|---------|-------|
| 80-100% | ☀️ | Sunny — habits are thriving |
| 60-79% | ⛅ | Partly Cloudy — mostly on track |
| 40-59% | 🌥 | Overcast — some habits need attention |
| 20-39% | 🌧 | Rainy — slipping on several habits |
| 0-19% | ⛈ | Stormy — time to regroup |

The weather transitions gradually — it's an ambient signal, not an alarm. It answers the question "how am I doing overall?" in under one second, without reading any chart or number.

An optional micro-interaction: tapping the weather shows a 7-day "forecast" based on the trend direction — "improving" (last 3 days better than prior 3) or "cooling" (opposite).

**Why it's different:**
- System Score (dim 31): a number. Weather is a metaphor — faster to process, emotionally resonant.
- Momentum Decay (C2): per-habit sparklines. Weather is holistic — one signal for everything.
- Slump Radar (dim 32): fires alerts on decline. Weather is always visible and ambient, not alert-based.
- Completion Sparks (N8): celebrate individual completions. Weather summarizes the aggregate state.

**Behavioral science:** Metaphorical framing improves self-regulation (Thibodeau & Boroditsky, 2011). Weather is universally understood, emotionally resonant (sunny = good is cross-cultural), and implies impermanence — storms pass, which normalizes bad weeks without catastrophizing. The 3-day window prevents single bad days from tanking the indicator while still being responsive enough to show trends.

**Data model:** None. Computed from existing log data.

**Effort:** Tiny. Completion rate calculation over 3 days, 5-tier conditional render.

---

## New vs. Existing Proposal Summary

| ID | Feature | What's Genuinely New | Gap in All 54 Proposals |
|----|---------|---------------------|------------------------|
| D1 | Reverse Habits | Inverts the meaning of "completion" for avoidance goals | No proposal handles stopping behaviors |
| D2 | Comeback Bonus | Makes restarting after a break feel like chasing a record | No proposal addresses rebuild psychology |
| D3 | Micro-Habit Fallback | Offers a lighter action instead of binary do/skip | No proposal provides a "do less" option |
| D4 | Correlation Insights | Discovers habit relationships from data automatically | No proposal does automatic pattern discovery |
| D5 | Habit Weather | Emotional, metaphorical, holistic at-a-glance summary | No proposal gives a single-glance emotional readout |

---

## Restructured Execution Backlog

The BACKLOG.md backlog is sound. Here it is refined with the D-series integrated and re-prioritized.

### Tier 0: Fix What's Broken (est. ~90 min total)

Ship these before any feature. They are bugs, not features.

| # | Item | What | Est. |
|---|------|------|------|
| 0.1 | API Error Handling | Check `res.ok` in all `api.ts` functions, surface errors | 15 min |
| 0.2 | Edit Habit | PUT endpoint + inline edit UI | 40 min |
| 0.3 | Unarchive | POST endpoint + archived section in UI | 30 min |

**Definition of done:** Create, edit, archive, unarchive, delete all work. API errors are surfaced to the user.

### Tier 1: Daily Experience (est. ~150 min total)

Features that change how the app feels every day. Each is independent — build in any order.

| # | Item | What | Est. | Source |
|---|------|------|------|--------|
| 1.1 | Habit Weather | Weather indicator at top of app | 20 min | **NEW D5** |
| 1.2 | Anchor Statement | Optional "why I do this" text field | 15 min | C3 |
| 1.3 | Reverse Habits | Build/Break direction toggle | 20 min | **NEW D1** |
| 1.4 | Momentum Decay Sparkline | 7-day colored density blocks per row | 25 min | C2 |
| 1.5 | Comeback Bonus | Personal best display + comeback badge | 25 min | **NEW D2** |
| 1.6 | Compound Progress | Optional unit + amount, cumulative tally | 30 min | C1 |
| 1.7 | Habit Ordering | Up/down arrows or drag to reorder | 35 min | v9 |

### Tier 2: Deeper Engagement (est. ~170 min total)

Features that make the habit system smarter and more forgiving.

| # | Item | What | Est. | Source |
|---|------|------|------|--------|
| 2.1 | Micro-Habit Fallback | Tiny version option with half-credit | 45 min | **NEW D3** |
| 2.2 | 2-Day Rule | Alternative streak mode: never-miss-twice | 35 min | v10 |
| 2.3 | Weekly Rhythm Score | Per-habit weekly consistency % | 30 min | C4 |
| 2.4 | Cue Anchoring | Optional trigger/cue text field | 15 min | v11 |
| 2.5 | Streak Milestones | Celebrate 7/30/90/365 with badge | 45 min | v9 |

### Tier 3: Intelligence (est. ~170 min total)

Features that require accumulated data. Don't build until Tiers 0-1 are shipped and the app has real usage.

| # | Item | What | Est. | Source |
|---|------|------|------|--------|
| 3.1 | Miss Reason Capture | One-tap reason after missed day | 40 min | v11 |
| 3.2 | Start Friction Log | One-tap difficulty after completion | 30 min | C5 |
| 3.3 | Correlation Insights | Automatic habit pattern discovery | 50 min | **NEW D4** |
| 3.4 | Inline 30-Day Heatmap | Expandable 30-day color grid | 35 min | v10 |
| 3.5 | Life Balance Radar | Domain spider chart | 50 min | v11 |

### Parked (valid but not now)

| Feature | Why Parked |
|---------|-----------|
| Living Garden View | High effort, needs solid foundation first |
| Habit Stacking / Chains | Complex data model, wait for simpler features |
| Earned Streak Shields | Gamification layer — add after core streak improvements |
| Habit Graduation | Needs months of data to detect automaticity |
| Weekly Compass | Needs scheduling and reflection infrastructure |
| Quiet Weeks / Grace Days | Needs scheduling first |
| Completion Sparks | Fun but not functional — add after substance features |
| Theme Toggle | Cosmetic, doesn't affect tracking |
| PWA / Offline | Separate project |
| Data Export/Import | Important eventually, not urgent |
| Dashboard / Analytics | Needs months of real data |

---

## Recommended First Session

If the next work session ships code, here's what to build first (in order):

1. **API Error Handling (0.1)** — 15 min. Add `if (!res.ok) throw new Error(...)` to every function in `api.ts`. This prevents silent failures.

2. **Habit Weather (1.1)** — 20 min. A single component at the top of App.tsx. Compute 3-day completion rate from existing logs. Render one of 5 weather states. Immediately visible, delightful, and ships fast.

3. **Reverse Habits (1.3)** — 20 min. Add `direction: 'build' | 'break'` to the Habit type with `'build'` as default. Add a toggle in HabitForm. Change streak label for break habits ("X days clean"). Backward-compatible — existing habits keep working.

4. **Comeback Bonus (1.5)** — 25 min. Extend `calculateStreak` to also return the all-time best streak. Display "Current: X | Best: Y" in the streak pill. Show a comeback badge when rebuilding after a break.

Total: ~80 minutes. Four shipped features. Ratio of planning-to-code drops from ∞ to something finite.

---

## Architecture Notes

All five D-series features follow the project's existing patterns:

- **D1 (Reverse Habits):** One new field on `Habit` type (`direction`). Defaults to `'build'` for backward compatibility. No new endpoints. Extend existing POST creation.
- **D2 (Comeback Bonus):** Pure computation. Extend `calculateStreak` in `utils.ts` to track max streak seen. No data model changes.
- **D3 (Micro-Habit Fallback):** One new field on `Habit` type (`tinyVersion`). One new log structure (`tinyLogs` alongside `logs`). Extend toggle endpoint to accept a `tiny: boolean` parameter.
- **D4 (Correlation Insights):** Pure computation on existing log data. No data model changes. New component only.
- **D5 (Habit Weather):** Pure computation. No data model changes. New component only.

No breaking changes. No migrations. All features are additive. The `data.json` file needs no structural changes for D1, D2, D4, D5.

---

## What This Document Does Differently

The project's 11 prior planning documents share a pattern: each adds more ideas, restructures the backlog, and ends with "the next commit should be code." None led to code.

This document breaks the pattern by:

1. **Starting with an audit.** Before proposing anything, it maps what 54 existing proposals cover to prove the new ones fill real gaps — not just rephrasings of prior ideas.
2. **Limiting scope.** Five features, not forty-nine. Each fills a provably uncovered conceptual territory.
3. **Ordering by effort, not importance.** The recommended first session picks the four cheapest features — not the most ambitious — because shipping something small beats planning something large.
4. **Giving exact starting points.** "Add `if (!res.ok)` to api.ts" is more actionable than "implement error handling."
5. **Accepting the meta-problem.** The gap isn't ideas. It's the 20:1 ratio of planning commits to code commits. The best feature plan is the one that ends with a code commit.
