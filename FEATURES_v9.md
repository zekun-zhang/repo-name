# Habit Garden — Feature Plan v9: Ship or Garden Dies

**Date:** 2026-10-05
**Supersedes:** All prior planning documents (PLAN.md, FEATURES_v3-v8)
**Status:** Definitive backlog + 5 novel features (dimensions 34-38)

---

## The Honest Score

| Metric | Count |
|--------|-------|
| Commits | 18 |
| Planning documents (including this one) | 8 |
| Features shipped beyond initial build | 0 |
| Lines of planning markdown (all docs) | ~4,300 |
| Lines of application code | ~960 |

This is the last planning document. After this, every session ships code.

---

## Part 1: What Exists Today

A React 19 + TypeScript + Vite frontend with an Express 5 backend storing data
in a flat JSON file. The app can:

- Create habits (name, frequency: daily/weekly, color)
- Toggle daily completions on a 14-day grid
- Calculate streaks (daily and weekly)
- Archive habits (one-way — no unarchive)
- Delete habits (with confirmation)
- Show optimistic UI with rollback on API failure
- Display error toasts and loading/retry states

**Known bugs:**
1. `api.ts` never checks `res.ok` — non-200 responses silently corrupt state
2. Archive is irreversible (no unarchive endpoint or UI)

**Known missing basics:**
1. No edit habit capability (can't change name, frequency, or color after creation)
2. No way to view archived habits
3. No mobile-optimized grid (14 columns don't fit on phones)

---

## Part 2: What's Been Proposed (33 Dimensions, v3-v8)

All 33 dimensions from prior docs remain valid proposals. They are not repeated
here. The full map lives in FEATURES_v8.md, Part 1.

Summary of the best proposals by tier (curated from 33 dimensions):

| Tier | Feature | Source | Status |
|------|---------|--------|--------|
| Must-fix | API Error Handling | v8 QW2 | Bug. Ship first. |
| Must-fix | Edit Habit | v8 QW1 | Prerequisite for 8+ features. |
| Must-fix | Unarchive | v8 QW3 | Data integrity issue. |
| High value | Completion Momentum | v8 L2 | Pure frontend, no backend changes. |
| High value | System Score | v8 L3 | Pure frontend, composite health index. |
| High value | Rhythm Detection | v8 L1 | Pure frontend, needs 3+ weeks of data. |
| Medium value | Slump Radar | v8 L4 | Predictive decline detection. |
| Medium value | Effort Autopilot | v8 L5 | Adaptive difficulty. Needs Edit Habit. |
| Medium value | Habit DNA | v7 K3 | Visual pattern fingerprint per habit. |
| Lower priority | Life Chapters | v7 | Needs months of data. |
| Lower priority | Pause Protocol | v7 | Intentional suspension. Needs Edit Habit. |
| Parked | Living Garden View | v2 | High effort, cosmetic. |
| Parked | Habit Stacking | v2 | New data model, medium effort. |
| Parked | PWA / Offline | v2 | Large effort, premature. |

---

## Part 3: Novel Feature Proposals (Dimensions 34-38)

These target gaps not covered by any of the 33 existing dimensions.

---

### F1. Habit Graduation (Automatic Success Detection)

**Dimension 34: Habit lifecycle completion — when tracking becomes unnecessary**

**What:** When a habit reaches sustained high performance (90%+ completion over
60+ consecutive days), the app surfaces a "graduation" prompt:

```
Reading has been at 95% for 67 days straight.

This habit looks rooted. Would you like to graduate it?
  [Graduate]  [Keep tracking]

Graduated habits move to a compact "Rooted" section — still
visible, still toggleable, but out of your daily focus area.
```

Graduated habits appear in a collapsed "Rooted Habits" section below the main
table — a single row per habit showing just the name, color dot, and a small
streak badge. They no longer occupy cells in the 14-day grid. They can be
"un-graduated" at any time (one tap puts them back in the main table).

If a graduated habit's completion drops below 60% over any 14-day window, the
app automatically suggests un-graduating it: "Reading has dropped to 50% this
month. Want to bring it back to your main view?"

**Why this is genuinely novel:**

Every existing dimension (1-33) assumes habits need perpetual active tracking.
Lifecycle Stages (dimension 20) tracks maturity FROM seedling TO rooted, but
"rooted" is still a label on an actively-tracked habit. No feature asks: "What
happens when a habit is so established it no longer needs daily attention?"

This matters because attention is finite. A user tracking 8 habits where 3 are
automatic (brushing teeth, taking medication, morning coffee) has only 5 that
need real focus. The 3 automatic ones create visual noise that dilutes attention
from the 5 that matter. Graduation clears the board.

The re-engagement safety net (auto-suggest un-graduating on decline) prevents
the failure mode where a graduated habit quietly dies without the user noticing.

**Behavioral science:**

- Habit automaticity (Gardner, Lally & Wardle, 2012): habits become automatic
  after sufficient consistent repetition — the point where they no longer require
  deliberate intention. Graduation detects this transition and adapts the UI.
- Attention allocation theory (Kahneman, 1973): cognitive resources are limited.
  Tracking automatic behaviors alongside effortful ones wastes attention on things
  that don't need it. Graduation reclaims that attention.
- Competence satisfaction (Deci & Ryan, SDT): graduating a habit is a concrete
  marker of mastery — "I built this habit so well it doesn't need supervision."
  That's a more meaningful reward than any streak counter.

**Data model:**
```typescript
type Habit = {
  // ... existing fields ...
  graduated?: boolean      // true when habit is in "Rooted" section
  graduatedAt?: string     // ISO date when graduated
}
```

**Effort:** Small. One boolean field, one filtered section in the UI, one
detection function (check 60-day window), one prompt component. Backend needs
an endpoint to toggle the `graduated` flag (or reuse Edit Habit if it exists).

**Depends on:** Edit Habit (for the graduation toggle endpoint). Can be built
without it by adding a dedicated `/api/habits/:id/graduate` endpoint.

---

### F2. Micro-Reflection Tags (Contextual Completion Notes)

**Dimension 35: Completion context — WHY a habit was done or missed**

**What:** After toggling a habit complete, an optional inline input appears for
1-3 seconds, inviting a short tag (max 30 characters):

```
Exercise  ✓  [rain · gym closed · partner joined · _________]
```

The input shows previously-used tags as quick-tap suggestions. New tags are
saved and become future suggestions. Tags are stored per-habit, per-date
alongside the existing completion log.

After 4+ weeks of tagged data, a "Context Patterns" view shows which tags
correlate with completion or misses:

```
Exercise — Context Patterns (last 30 days):
  "with partner"  → completed 12/12 times (100%)
  "morning"       → completed 8/10 (80%)
  "after work"    → completed 3/9 (33%)  ← weak context
  "rain"          → skipped 5/5 times    ← consistent barrier
```

**Why this is genuinely novel:**

All 33 existing dimensions analyze WHAT happened (completion rates, streaks,
patterns, timing). None captures WHY it happened. Algorithms detect that Friday
completion is low — but they can't distinguish "Friday is a rest day" from
"Friday happy hours derail me" from "my gym is closed Fridays." Only the user
knows the context, and micro-tags capture it with minimal friction.

Miss Fingerprinting (dimension 7) attributes misses to CATEGORIES (travel,
illness, forgot). Micro-reflection captures the user's own words in real time
— unstructured, specific, and immediate. "rain" is more useful than the
category "weather" because it's actionable: buy a rain jacket, find an indoor
alternative.

The difference is also temporal: Miss Fingerprinting analyzes AFTER the fact.
Micro-reflection captures context IN THE MOMENT, before memory fades.

**Behavioral science:**

- Implementation intentions (Gollwitzer, 1999): "If [situation], then [behavior]."
  Micro-tags capture the situation half of implementation intentions from actual
  life data. Patterns like "with partner → 100% completion" are discovered
  implementation intentions the user can then deliberately replicate.
- Self-explanation effect (Chi et al., 1994): the act of tagging a completion
  (even briefly) forces a moment of reflection that deepens encoding. The tag
  is the artifact; the reflection is the mechanism.
- Ecological momentary assessment (Stone & Shiffman, 1994): real-time
  context capture in natural settings beats retrospective recall. A 3-second
  tag at completion time is more accurate than a weekly review.

**Data model:**
```typescript
type HabitLog = {
  [habitId: string]: Array<{
    date: string          // YYYY-MM-DD (or keep string[] and add separate tag store)
    tag?: string          // optional context tag, max 30 chars
  }>
}
```

Or, to preserve backward compatibility with the existing `string[]` log format:

```typescript
// New separate collection
type HabitTags = {
  [habitId: string]: {
    [date: string]: string    // one tag per habit per date
  }
}
```

The second approach (separate `tags` object in data.json) requires zero
migration — existing logs continue working, and tags are additive.

**Effort:** Small-Medium. New `tags` field in data.json, one endpoint
(`POST /api/tags`), one inline input component (auto-dismiss after 3s or on
blur), one autocomplete from previous tags. Context Patterns view is a Tier 2
enhancement.

**Depends on:** Nothing. Works with existing toggle flow.

---

### F3. Time Budget (Invisible Cost of Commitment)

**Dimension 36: Time investment visibility — what habits actually cost**

**What:** Each habit has an optional estimated duration field (in minutes).
The header shows today's total time commitment:

```
Today: ~95 min across 7 habits
  ████████████████████░░░░  62 min done · 33 min remaining
```

The time bar fills as habits are completed throughout the day. Completed habits'
time is shown as filled; remaining habits' time is shown as empty. The visual
makes the day's remaining commitment tangible.

When creating or editing a habit, the duration field is optional with a default
of "? min" (unknown). Over time, as the user fills in durations, the time budget
becomes more accurate.

A weekly summary shows total time invested:

```
This week: 8h 45m invested in habits
  Exercise: 3h 30m (40%)
  Reading: 2h 20m (27%)
  Meditation: 1h 10m (13%)
  ...
```

**Why this is genuinely novel:**

Habit Load Monitor (dimension 16) counts HABITS — "you have 10 active habits,
that might be too many." But habit count is a terrible proxy for actual burden.
Three habits at 5 min each (15 min total) is trivially manageable. Three habits
at 45 min each (2h 15m total) is a significant daily commitment.

Time Budget replaces the vague "too many habits" signal with a concrete "your
habits cost 2 hours and 15 minutes per day" signal. This is the difference
between "you might be overcommitted" (abstract) and "you've committed to 2h 15m
daily — is that sustainable for you?" (concrete).

No existing dimension makes the TIME cost of habits visible. All metrics measure
BEHAVIOR (completion, streaks, patterns). Time Budget measures INVESTMENT.

**Behavioral science:**

- Opportunity cost neglect (Frederick et al., 2009): people systematically
  fail to consider what they're giving up. Adding a habit "costs" time from
  something else, but the tracker never makes that cost visible. Time Budget
  surfaces the trade-off.
- Concrete vs. abstract thinking (Trope & Liberman, construal level theory):
  "7 habits" is abstract. "95 minutes" is concrete. Concrete representations
  produce better decisions about commitment.
- Planning fallacy (Kahneman & Tversky, 1979): people underestimate how long
  tasks take. Explicitly estimating and seeing the total combats the planning
  fallacy for daily routines.

**Data model:**
```typescript
type Habit = {
  // ... existing fields ...
  estimatedMinutes?: number    // optional, null means unknown
}
```

**Effort:** Small. One optional numeric field on Habit, one header component
showing sum/progress, one field in the create/edit form. Weekly summary is a
Tier 2 enhancement.

**Depends on:** Edit Habit (to add duration to existing habits). Can launch
with duration only on new habits if Edit isn't ready.

---

### F4. Future Self Projection (Forward-Looking Streak Milestones)

**Dimension 37: Prospective motivation — what today's action achieves**

**What:** Each habit row shows a small forward projection — what the streak or
milestone WILL be if the user completes today:

```
Exercise    🔥 14 → Complete today → 15-day streak
Reading     🔥 28 → Complete today → 30-day milestone! 🎯
Meditation  🔥 0  → Complete today → Start a new streak
```

The projection is subtle — a small text label next to the streak counter that
appears only when the habit hasn't been completed today. Once completed, the
projection disappears (replaced by the actual streak).

Milestone thresholds: 7 days, 14 days, 21 days, 30 days, 60 days, 90 days,
100 days, 365 days. When today's completion would hit a milestone, the
projection is highlighted:

```
→ 30-day milestone tomorrow! 🎯
```

For weekly habits, the projection works on weekly streaks:
```
Journaling (weekly)  🔥 3 weeks → Complete this week → 4-week streak
```

**Why this is genuinely novel:**

Every existing metric is BACKWARD-LOOKING. Streaks count consecutive past days.
Velocity measures past rate of change. DNA shows past patterns. System Score
aggregates past performance. Even Slump Radar, which is "predictive," predicts
a NEGATIVE future (decline).

No feature shows the POSITIVE future — what the user gains by acting today.
This is a fundamental motivational gap. "You have a 14-day streak" is a fact
about the past. "Complete today and you'll have a 15-day streak" is an
invitation to act. "Complete today and you'll hit your 30-day milestone" is
a proximal goal that triggers the goal gradient effect.

Recovery Velocity (dimension 27) measures how fast users recover from breaks —
also backward-looking. Future Self Projection is forward-looking even during
recovery: "Complete today → 3-day streak (your average recovery takes 5 days
— you're ahead of pace)."

**Behavioral science:**

- Goal gradient effect (Kivetz, Urminsky & Zheng, 2006): effort accelerates
  as proximity to a goal increases. "1 day from your 30-day milestone" is a
  powerful proximity signal. Without the projection, the user only sees "29-day
  streak" — the proximity to 30 is implicit and easy to miss.
- Prospective memory and intention (Brandimonte et al., 1996): intentions tied
  to specific future outcomes are more likely to be executed. "Complete today
  for a 30-day milestone" binds today's action to a specific future state.
- Temporal self-continuity (Hershfield, 2011): people who feel connected to
  their future selves make better long-term decisions. The projection literally
  shows the future self's streak — creating a bridge between present action
  and future identity.
- Loss aversion framing: "Complete today → 15-day streak" is gain-framed.
  But the absence of this message when the day is complete provides a natural
  contrast — the user can imagine losing the projected gain by NOT completing.

**Data model:** None. Pure computation from existing streak data + today's date.

**Effort:** Tiny. One utility function (~10 lines: current streak + 1, check
milestone thresholds), one conditional label in `HabitRow`. No backend changes.
This could ship in 15 minutes.

**Depends on:** Nothing.

---

### F5. Habit Personality Types (Automatic Pattern Classification)

**Dimension 38: Pattern identity — making completion patterns memorable**

**What:** After 4+ weeks of data, each habit receives an automatically-assigned
"personality type" based on its completion pattern. The type appears as a small
badge on the habit row:

| Type | Pattern | Badge |
|------|---------|-------|
| **Iron Habit** | 90%+ completion, low variance | 🔩 Iron |
| **Weekend Warrior** | Completion significantly higher on weekends | 🏔️ Weekend |
| **Weekday Regular** | Completion significantly higher on weekdays | 💼 Weekday |
| **Streak Runner** | Long streaks followed by multi-day breaks | 🏃 Sprinter |
| **Slow Burn** | Consistent 50-70%, never crashes, never peaks | 🕯️ Steady |
| **Comeback Kid** | Multiple breaks followed by recoveries | 🔄 Resilient |
| **New Sprout** | Less than 4 weeks of data | 🌱 New |
| **Fading** | Declining trend over last 3 weeks | 📉 Fading |

The classification algorithm is simple pattern matching:
1. Compute overall completion rate (last 30 days)
2. Compute day-of-week variance (std dev of per-day rates)
3. Compute streak pattern (average streak length vs. average break length)
4. Compute trend (compare last 14 days to previous 14 days)
5. Assign the first matching type from the list (checked in priority order)

Tapping the badge shows a one-line explanation:
```
🏃 Sprinter — You tend to build strong streaks then take breaks.
   Average streak: 8 days. Average break: 3 days.
   Tip: Plan your breaks with Grace Days to keep streaks alive.
```

Over time, a habit's personality can change. When it does, a subtle notification
appears: "Exercise evolved from 🏃 Sprinter to 🔩 Iron — it's becoming
automatic!"

**Why this is genuinely novel:**

Habit DNA (dimension 26) creates a visual FINGERPRINT of a habit's pattern —
a sparkline or glyph that represents the raw data. Personality Types go further:
they INTERPRET the pattern and give it a NAME.

The distinction matters because names are sticky. A user who sees a sparkline
might think "huh, interesting shape." A user who sees "🏃 Sprinter" thinks
"I'm a sprinter with this habit — I need to plan my rest days." The label
creates an identity frame that shapes future behavior.

Momentum Velocity (dimension 21) shows arrows (↑↓→) for rate of change — a
directional signal. Personality Types are categorical — they classify the WHOLE
pattern, not just the current direction. An ↑ arrow and a 🏃 Sprinter badge
mean different things: the arrow says "things are improving now," the badge
says "your pattern is boom-and-bust, and the current boom will probably bust."

Lifecycle Stages (dimension 20) classifies by MATURITY (seedling → rooted).
Personality Types classify by PATTERN SHAPE — two habits at the same maturity
stage can have completely different personalities (one is Iron, the other is
Sprinter). They're orthogonal dimensions.

**Behavioral science:**

- Identity-based habits (Clear, 2018): "Every action is a vote for the type
  of person you wish to become." Personality Types make the voting pattern
  visible — "you ARE a Sprinter with this habit." This enables identity-level
  reflection: "Do I want to be a Sprinter, or do I want to become Iron?"
- Categorization and memory (Rosch, 1978): prototype theory — people understand
  and remember categories better than raw data. "Sprinter" is a prototype;
  "72% completion with 0.34 CV and 8.2 avg streak length" is noise.
- Self-concept clarity (Campbell, 1990): people with clearer self-concepts
  make better self-regulatory decisions. Personality Types clarify self-concept
  with respect to each habit: "I am reliable with reading, sporadic with
  exercise." That clarity enables targeted intervention.

**Data model:** None. Pure computation over existing log data. The personality
type is computed on each render (cheap: one pass over 30 days of dates per
habit). No need to persist the classification.

**Effort:** Small. One classification function (~40 lines: compute rates,
variance, streak patterns, match to types), one badge component, one tooltip
with explanation. No backend changes.

**Depends on:** 4+ weeks of log data for meaningful classification. Works
from day 1 (shows "🌱 New" for habits with < 4 weeks of data).

---

## Part 4: Dimension Map Update (34-38)

| # | Dimension | Feature | Gap Filled |
|---|-----------|---------|-----------|
| 34 | **Habit lifecycle completion** | F1: Graduation | All dimensions assume perpetual tracking. Nothing addresses when a habit succeeds so well it should leave the daily view. |
| 35 | **Completion context** | F2: Micro-Reflection Tags | All analysis is WHAT happened. Nothing captures WHY — the user's own real-time context. |
| 36 | **Time investment visibility** | F3: Time Budget | Load Monitor counts habits. Nothing measures the actual TIME cost of a habit system. |
| 37 | **Prospective motivation** | F4: Future Self Projection | All metrics are backward-looking. Nothing shows the positive future that today's action achieves. |
| 38 | **Pattern identity** | F5: Personality Types | DNA shows raw pattern shape. Nothing NAMES the pattern or gives it identity-level meaning. |

---

## Part 5: Definitive Backlog (Ordered)

This is the single source of truth for what to build next. Items are ordered by
a combination of: effort (lower is better), value (higher is better), and
dependency (prerequisites first).

### Tier 0: Fix Bugs (do not build anything else until these are done)

| # | Item | Effort | What |
|---|------|--------|------|
| B1 | API Error Handling | 15 min | Add `if (!res.ok)` to all 5 functions in `api.ts` |
| B2 | Edit Habit | 30-40 min | `PUT /api/habits/:id` endpoint + inline edit UI |
| B3 | Unarchive | 30-40 min | `POST /api/habits/:id/unarchive` + archived section UI |

**Total Tier 0 effort: ~90 minutes.**

### Tier 1: First Real Features (high impact, zero backend changes)

| # | Item | Effort | What |
|---|------|--------|------|
| F4 | Future Self Projection | 15 min | Show "Complete today → X-day streak" on incomplete habits |
| L2 | Completion Momentum | 30 min | Today's progress dots + "X of Y done" in header |
| L3 | System Score | 45 min | Composite 0-100 health index in header |

**Total Tier 1 effort: ~90 minutes. All pure frontend. No backend changes.**

### Tier 2: Insight Features (need some data history)

| # | Item | Effort | What |
|---|------|--------|------|
| F5 | Habit Personality Types | 45 min | Auto-classify each habit's pattern, show badge |
| L1 | Rhythm Detection | 45 min | Day-of-week completion chart per habit |
| F3 | Time Budget | 30 min | Optional duration field, daily time commitment in header |
| L4 | Slump Radar | 30 min | Multi-habit decline detection with gentle alert |

**Total Tier 2 effort: ~2.5 hours.**

### Tier 3: Depth Features (build when core is solid)

| # | Item | Effort | What |
|---|------|--------|------|
| F2 | Micro-Reflection Tags | 1-2 hours | Per-completion context tags with autocomplete |
| F1 | Habit Graduation | 1 hour | Auto-detect established habits, move to compact section |
| L5 | Effort Autopilot | 1-2 hours | Auto-suggest easier version of failing habits |
| K3 | Habit DNA (v7) | 45 min | Visual pattern fingerprint per habit |
| K5 | Pause Protocol (v7) | 1 hour | Intentional habit suspension with return date |

**Total Tier 3 effort: ~6 hours.**

### Parked (good ideas, wrong time)

| Item | Why Parked |
|------|-----------|
| Living Garden View | Cosmetic. Ship when the app has features worth decorating. |
| Habit Stacking / Chains | New data model. Ship after Edit + Unarchive are solid. |
| Weekly Compass | Nice-to-have. No dependencies, no dependents. |
| Data Export/Import | Important eventually. Not until users have data worth exporting. |
| PWA / Offline | Large effort. Ship when the app is worth using offline. |
| Social / Sharing | Requires auth, multi-user. Different product scope entirely. |
| Notifications / Reminders | Requires service workers or native integration. Premature. |
| Narrative Milestones | Needs months of data. Revisit in v2. |
| Life Chapters | Needs months of data. Revisit in v2. |

---

## Part 6: Architecture Notes

### Current constraints (don't fight them)

1. **JSON file storage.** Fine for a single-user app. Don't migrate to a database
   until there's a reason (auth, multi-user, or data > 10MB).
2. **No auth.** This is a personal tool. Auth adds complexity for no value unless
   going multi-user.
3. **No build pipeline / CI.** Tests run locally with `npm test`. Add CI when
   there are enough tests to make it worthwhile (after frontend tests exist).

### Patterns to follow

1. **New features as pure frontend computation first.** F4, L2, L3, F5, L1, L4 all
   require ZERO backend changes — they compute over existing `habits` and `logs`
   data. This is intentional: the data model is already rich enough to support
   significant intelligence. Use it.

2. **Utility functions in `utils.ts`, components in `components/`.** Keep the
   existing pattern. Don't create a `features/` directory or per-feature modules
   until there are 20+ components.

3. **Optimistic UI with rollback.** The existing pattern in `useHabits.ts` is
   correct. New mutations should follow the same pattern: update state immediately,
   call API, rollback on failure.

4. **Backward-compatible data model.** When adding optional fields to `Habit`,
   use `field?: type` with sensible defaults in the computation layer. The server's
   `readData()` returns whatever's in the file — no migration needed if new
   fields are optional.

### What NOT to build

- Don't add a state management library (Redux, Zustand). `useHabits` is fine.
- Don't add a CSS framework (Tailwind, styled-components). The existing CSS works.
- Don't add a router. The app is one page. Add routing when there's a second page.
- Don't add TypeScript to the server. It's 130 lines of Express. Not worth it.

---

## Part 7: The Three-Session Plan

### Session A: Fix Bugs + Basics (Tier 0)

```
[ ] B1: Add `if (!res.ok)` checks to all 5 functions in api.ts
[ ] B2: Add PUT /api/habits/:id endpoint with same validation as POST
[ ] B2: Add inline edit UI in HabitRow (toggle edit mode, save/cancel)
[ ] B3: Add POST /api/habits/:id/unarchive endpoint
[ ] B3: Add collapsed "Archived" section below main table
[ ] B3: Split useHabits to expose activeHabits and archivedHabits
```

**Exit criteria:** All 5 API functions throw on non-OK responses. Users can edit
habit name/frequency/color. Users can view and restore archived habits.

### Session B: First Intelligence (Tier 1)

```
[ ] F4: Add streak projection label to HabitRow ("Complete today → X-day streak")
[ ] F4: Add milestone detection (7, 14, 21, 30, 60, 90, 100, 365 days)
[ ] L2: Add today's progress indicator to header ("3 of 7 done" + dots)
[ ] L2: Add "Perfect Day" detection when all active habits are complete
[ ] L3: Compute System Score (completion rate, consistency, trend, load balance)
[ ] L3: Display score in header with directional arrow
```

**Exit criteria:** The header shows daily progress, system health score, and
each habit row shows what completing it today achieves.

### Session C: Pattern Intelligence (Tier 2, pick 2-3)

```
[ ] F5: Classify habits into personality types, show badges
[ ] L1: Compute per-weekday completion rates, show bar chart in detail view
[ ] F3: Add optional duration field, show daily time budget in header
[ ] L4: Detect multi-habit decline, show gentle alert banner
```

**Exit criteria:** Users see pattern-based intelligence about their habits that
they couldn't see before.

---

## Part 8: Why This Ordering

### F4 (Future Self Projection) is first in Tier 1

It's the smallest possible feature that changes the app's character. One line of
text per habit row — "Complete today → 15-day streak" — transforms the habit
table from a passive record into an active motivator. Fifteen minutes of work,
zero backend changes, immediate impact on every user session.

### Tier 0 before Tier 1 (no exceptions)

The API silently swallows errors. Any feature built on this foundation inherits
the silent-failure bug. Fix the foundation first, then build on it.

### Pure frontend features dominate Tiers 1-2

The existing data model (habits + logs) is rich enough to support 6+ features
without a single backend change. This is the path of least resistance to shipping
real features. Every backend change adds testing, migration consideration, and
risk. Frontend-only features add none of that.

### Micro-Reflection Tags (F2) is Tier 3 despite being novel

It requires a new data model (tags), a new endpoint, and careful UX design
(auto-dismiss timing, autocomplete behavior, not interrupting the toggle flow).
It's the right feature for after the basics are solid and the team has shipped
a few things successfully.

---

## Part 9: Feature Interaction Map

```
F4 Future Self Projection
  └── enhances → Completion Momentum (L2): projection shows "5 of 7 done,
      completing Exercise gives you a 15-day streak AND a Perfect Day"

F5 Personality Types
  ├── enhances → Rhythm Detection (L1): type badge + weekday chart = full picture
  ├── feeds into → Effort Autopilot (L5): "Fading" type triggers downshift
  └── feeds into → Slump Radar (L4): multiple "Fading" habits = system slump

F1 Graduation
  ├── enhances → System Score (L3): graduated habits don't count toward load
  └── feeds into → Personality Types (F5): "Iron Habit" type is a graduation signal

F2 Micro-Reflection Tags
  ├── enhances → Rhythm Detection (L1): tags explain WHY weekday patterns exist
  └── enhances → Slump Radar (L4): common tag during slump reveals the cause

F3 Time Budget
  ├── enhances → Completion Momentum (L2): "33 min remaining" adds time
  │   dimension to "4 of 7 done"
  └── enhances → System Score (L3): time-aware load balance is more honest
      than habit-count load balance
```

---

## Part 10: Metrics That Matter

After shipping Tiers 0-2, the app should show these numbers (all computable
from existing data, no new tracking needed):

- **Today's progress:** "X of Y done" (Completion Momentum)
- **System health:** "Score: 73 ▲" (System Score)
- **Per-habit projection:** "Complete today → X-day streak" (Future Self)
- **Per-habit personality:** "🔩 Iron" / "🏃 Sprinter" / etc. (Personality Types)
- **Time commitment:** "~95 min today" (Time Budget, if duration data exists)

These five numbers tell the user everything they need to know at a glance:
how their day is going, how their system is doing, what each action achieves,
what each habit's pattern looks like, and how much time they're investing.

That's the app. Everything else is depth.
