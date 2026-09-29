# Habit Garden — Feature Roadmap v5

**Date:** 2026-09-29
**Supersedes:** FEATURES_v4.md (2026-09-28), FEATURES_v3.md, PLAN.md v2
**Status:** Planning document — no code changes

---

## Meta: The Planning Problem

This repo now has 15 commits. 14 are planning documents. The codebase is
unchanged from the initial scaffold: ~960 lines across 11 source files. Prior
documents (PLAN.md v2, FEATURES_v3, FEATURES_v4) all correctly diagnose this
problem and then add another planning document anyway. This one will do the same
— but it exists because the task is explicitly to document features and reasoning,
not to ship code. The next commit after this one should be implementation.

**What the prior plans got right:**
- Phase 1 basics (Edit Habit, API Error Handling, Archives) are correctly prioritized
- The 20-item consolidated roadmap in FEATURES_v4 is well-scoped
- Behavioral science citations are solid and relevant
- "No backend needed" bias for new features is smart engineering

**What the prior plans missed:** Five dimensions of habit tracking that 60+
proposals across three documents have not touched. These are not incremental
improvements — they address fundamentally different aspects of the user
relationship with their habits.

---

## Part 1: Blind Spot Analysis

Before proposing features, here is what the prior plans cover and what they don't.

### Covered Dimensions (no more proposals needed)

| Dimension | Features Addressing It |
|-----------|----------------------|
| Streak psychology | Grace Days, Phantom Streaks, Streak Recovery, Planned Rest |
| Energy/capacity | Energy Check-In, Daily Calibration, 2-Minute Fallback |
| Visual identity | Living Garden, Heartbeat, Seasonal Rhythms |
| Celebration/reward | Completion Sparks, Milestones, Echoes |
| Forward planning | Weekly Compass, Intentions |
| Failure handling | Autopsy, Weather Forecast |
| Analytics | Dashboard, Heatmap, Correlations, Timestamps |
| Habit relationships | Habit Stacking / Chains |
| Habit progression | Difficulty Levels |
| Attention management | The Ratchet, MVD / Core habits |
| Narrative/meaning | Narrative Milestones, Time Capsule |
| Data management | Export, Import |

### Uncovered Dimensions (genuine gaps)

| Dimension | Why It Matters | Why It Was Missed |
|-----------|---------------|-------------------|
| **Completion quality** | Every feature treats completion as binary. Real habits have degrees — a distracted 2-minute meditation isn't the same as a focused 20-minute one. | Plans focused on *whether* you did it, not *how well*. |
| **Re-engagement after absence** | What happens when someone hasn't opened the app in 2 weeks? Every plan assumes continuous use. | Plans modeled daily/weekly loops, not the "I fell off" return. |
| **Overcommitment detection** | The app lets you add unlimited habits. 3 habits at 90% > 12 habits at 40%. No plan addresses this. | Plans treated more habits as more ambition. Nobody asked "do you have too many?" |
| **Time-of-day patterns** | When you complete habits matters — morning vs. night completion has different psychology. | Timestamps were proposed (#30) but only for passive recording, not active intelligence. |
| **The check-in itself as friction** | 10+ habits with a 14-day grid is a wall of UI. The act of checking in needs to be faster. | Plans added features to the check-in; none simplified it. |
| **Habit identity framing** | "I meditate" (identity) is more powerful than "I should meditate" (obligation). No feature reframes habits as identity statements. | Plans treated habits as tasks, not identity claims. |

---

## Part 2: New Feature Proposals

Six features, each addressing one uncovered dimension. Ordered by
impact-to-effort ratio.

---

### H1. Quick Pulse Check-In (Friction Reduction)

**What:** A minimal alternative check-in mode. Instead of the full 14-day grid
table, the user sees a vertical list of today's habits with large tap targets:

```
Today — Sep 29                          [Full View]

  ● Meditate          ○ ← tap to complete
  ✓ Exercise          ✓ ← already done
  ● Read 10 pages     ○
  ● Journal           ○

  3 of 7 done
```

One tap per habit, no grid, no scrolling, no history. The full table is one tap
away via "Full View." Quick Pulse is the default when opening the app; the table
is for review.

On mobile, Quick Pulse is a swipeable card per habit — swipe right to complete,
swipe left to skip. On desktop, it's a clean vertical list.

**Why this is novel:** Every prior feature proposal *adds* to the check-in
experience (celebrations, energy pickers, weather icons, fallback labels). None
*subtracts*. The daily check-in for a user with 10 habits currently requires
scanning a 10-row × 16-column table to find today's column. That's cognitive
overhead that compounds daily.

Quick Pulse inverts the design: the minimum viable check-in is a list of
today's unchecked habits. Everything else (history, streaks, analytics) is
opt-in depth, not mandatory surface.

**Behavioral science:** Fogg's Behavior Model: Behavior = Motivation × Ability
× Prompt. Quick Pulse maximizes Ability by reducing friction. BJ Fogg's
research shows that making a behavior easier has a larger effect on
completion than increasing motivation. A 3-second check-in that happens daily
beats a 30-second check-in that gets skipped.

**Data model:** None. Pure UI alternative over existing data. One localStorage
flag for preferred view mode.

**Effort:** Small. One new component (~80 lines), a view toggle in the header,
responsive styles.

**Depends on:** Nothing. Can ship independently. Enhanced by Daily Calibration
(shows only core habits in low-energy mode).

---

### H2. Completion Depth (Quality Tracking)

**What:** After tapping a habit complete, an optional single-tap quality rating
appears inline for 2 seconds:

```
  ✓ Meditate    [Light] [Full] [Deep]     ← auto-dismisses
```

Three levels:
- **Light** (did the minimum / phoned it in)
- **Full** (did it properly)
- **Deep** (exceeded expectations / was fully present)

If the user doesn't tap a level within 2 seconds, it defaults to "Full."
The depth rating is stored alongside the completion date.

Over time, completion depth data enables insights no other tracker can offer:
- "Your meditation is 90% consistent but 60% Light — you might benefit from
  reducing frequency and increasing depth."
- "Your exercise sessions have been trending from Light → Full over the past
  month — real progress."
- Phantom Streaks (G2) and Narrative Milestones (G3) incorporate depth:
  "You've done this 52 of 55 days, and 38 of those were Full or Deep."

**Why this is novel:** Every habit tracker, and every feature in every prior
plan, treats completion as binary: done or not done. This is the fundamental
lie of habit tracking. A checked box for "Read 30 pages" might mean you read
30 pages with full attention or skimmed 5 pages while watching TV. Binary
completion conflates showing up with doing the work.

Completion Depth adds the missing dimension without adding friction — the
rating is optional, fast (one tap), and auto-dismisses. It doesn't slow down
the check-in; it enriches the data for anyone who wants more honesty.

**Behavioral science:** Self-monitoring accuracy (Korotitsch & Nelson):
more granular self-tracking produces better behavior change outcomes.
Quality-blind tracking encourages "checking the box" behavior, which
Baumeister's research identifies as a common failure mode in
self-regulation — the act of recording displaces the act of doing.

**Data model:** Extend HabitLog from `string[]` (array of dates) to support
optional depth: `{ date: string, depth?: 'light' | 'full' | 'deep' }[]`
or a parallel `depthLog: { [habitId]: { [date]: depth } }`. The parallel
structure is backward-compatible — existing log data stays unchanged.

**Effort:** Small. One inline component, one data structure addition, optional
depth rendering in the day cells (e.g., filled circle vs. half-circle vs.
glowing circle).

**Depends on:** Nothing. Enhanced by Insights Tab (#19) for depth analytics.

---

### H3. Soft Landing (Re-engagement After Absence)

**What:** When the app detects a gap of 7+ days since last visit, instead of
showing the normal table (which displays a wall of empty cells — pure guilt),
it shows a Soft Landing screen:

```
Welcome back.

You've been away 12 days. That's okay — everyone takes breaks.

Here's where things stand:
  • Exercise: was at 23-day streak. Pick it up today to start fresh.
  • Meditate: you had a 15-day run. Longest ever was 31.
  • Read: last completed Sep 14.

You have 7 active habits. Want to restart with just your
top 3 for this week?

  [Start with 3]    [Show all]    [Archive some]
```

The Soft Landing:
1. Acknowledges the absence without judgment
2. Summarizes what happened to each habit's streak (matter-of-fact, not guilt)
3. Offers to temporarily hide non-core habits for the first week back
4. Provides a direct path to archive habits that are no longer relevant

If the user returns after 30+ days, the screen also offers to run a quick
"recommitment" flow: which of your habits do you still want? This naturally
triggers Habit Autopsy (F1) for anything the user drops.

**Why this is novel:** Every planned feature assumes the user is checking in
regularly. The entire UX — streaks, celebrations, forecasts, echoes, weekly
compass — is designed for the engaged user. But the most critical moment in a
habit tracker's lifecycle is the *return after absence*. This is when most
users uninstall the app.

No prior plan addresses this moment. The closest is Streak Recovery Mode
(showing "Recovering: 3/7" instead of "Streak: 0"), but that's a visual
tweak to the streak display, not a fundamentally different UX for the
re-engagement moment.

**Behavioral science:** Relapse prevention theory (Marlatt & Gordon):
how a person interprets a lapse determines whether it becomes a relapse.
A guilt-inducing "you missed 12 days" screen triggers the
abstinence-violation effect — "I already failed, why bother?" A Soft
Landing reframes the return as a positive act: "You came back. Let's
figure out what's next."

**Data model:** Add `lastVisit?: string` to localStorage. The rest is
computed from existing data (last completion date per habit, streak
calculations).

**Effort:** Small-Medium. One new component, gap detection logic (compare
today to last visit date), conditional rendering in App.tsx to show Soft
Landing before the main UI.

**Depends on:** Enhanced by Daily Calibration (the "Start with 3" option
maps to core habits) and Habit Autopsy (for habits dropped during
recommitment).

---

### H4. Habit Load Monitor (Overcommitment Detection)

**What:** A subtle indicator in the app header that reflects how many habits
the user has relative to their actual completion capacity:

```
  Habit Load: ████████░░ 78%        ← healthy
  Habit Load: ██████████ 103%       ← overloaded (red)
  Habit Load: ████░░░░░░ 42%        ← underloaded (maybe add one?)
```

The Load is calculated as: (number of active habits) / (average daily
completions over the past 14 days). A load > 90% means the user has more
habits than they actually complete — they're overcommitted.

When overloaded (>90% for 7+ days), the app gently suggests:
> "You have 10 active habits but complete an average of 7 per day. Consider
> archiving your least-completed habits, or marking some as non-core."

When a user tries to add a new habit while overloaded:
> "You're completing 7 of 10 habits daily. Adding another may spread you
> thinner. Want to add this and archive one, or add it anyway?"

The monitor never blocks — it informs. The user always has the final say.

**Why this is novel:** Every habit app, and every proposed feature, is designed
to *support more habits*. Categories organize them. Stacking sequences them.
The Ratchet tucks away established ones. Energy Check-In dims low-priority
ones. But none asks the fundamental question: "Do you have too many?"

The load monitor is the app's only feature that might say "don't add this."
That honesty is its strength. Research consistently shows that people with
3-5 focused habits outperform those with 10+ scattered ones. The app should
help users be ambitious about depth, not breadth.

**Behavioral science:** Goal-setting theory (Locke & Latham): too many
simultaneous goals reduce performance on all of them. Schwartz's "paradox of
choice": more options create decision fatigue and reduce satisfaction.
Ego-depletion research (Baumeister): willpower spent on low-priority habits
is unavailable for high-priority ones.

**Data model:** None. Pure computation over existing habits and logs.

**Effort:** Small. One utility function, one header component, one conditional
prompt on the add-habit form. No backend changes.

**Depends on:** Enhanced by Daily Calibration (core vs. non-core) and The
Ratchet (established habits don't count the same way against load).

---

### H5. Identity Framing (Habit-as-Identity Rewrite)

**What:** When creating or editing a habit, the user can optionally write an
"identity statement" — a one-line declaration of who they are because of this
habit:

- Exercise → "I am someone who moves their body every day."
- Read → "I am a reader."
- Meditate → "I am someone who trains their mind."
- Journal → "I am someone who reflects."

Identity statements appear in three places:
1. **On the habit row** — replacing or supplementing the habit name when
   the streak is 7+ days (you've earned the identity)
2. **On streak break** — instead of "Streak: 0", the app shows: "You are
   still a reader. One missed day doesn't change that. Pick it up today."
3. **On the Soft Landing screen** (H3) — "You identified as 'someone who
   trains their mind.' Want to reclaim that?"

The field is optional and has a 60-character limit. Habits without an
identity statement behave exactly as they do today.

**Why this is novel:** Every feature across all plans treats habits as *actions*
— things you do. But James Clear's central thesis in Atomic Habits (cited
repeatedly in the plans but never actually applied to a feature) is that
lasting behavior change is *identity change*: "The goal is not to read a
book, the goal is to become a reader." Clear argues that identity-based
habits outlast outcome-based habits because identity is self-reinforcing.

No proposed feature implements this insight. The plans cite Clear for
habit stacking (a technique) but miss his core argument (identity). Identity
Framing is the direct implementation: let users declare who they are, then
reflect that declaration back at the moments that matter — on streaks, on
breaks, and on returns.

**Behavioral science:** Identity-based motivation (Oyserman): people are more
likely to perform behaviors consistent with their self-concept. Labeling
effects (Cialdini): when people accept a label ("I am a reader"), they
behave consistently with it. The "fresh start effect" (Dai, Milkman &
Riis): identity framing turns every return into a fresh start rather than a
continued failure.

**Data model:** Add optional `identity?: string` (max 60 chars) to the
Habit type. No new endpoints — same as adding any optional field.

**Effort:** Small. One text input on the form, conditional rendering in
HabitRow and streak display, integration with Soft Landing (H3).

**Depends on:** Edit Habit (#1). Enhanced by Phantom Streaks (G2, for
identity preservation during breaks) and Soft Landing (H3).

---

### H6. Ritual Windows (Time-of-Day Intelligence)

**What:** Each habit can optionally declare a "ritual window" — the time of
day the user intends to do it:

- **Morning** (5am-12pm)
- **Afternoon** (12pm-5pm)
- **Evening** (5pm-10pm)
- **Anytime** (default — no window)

The app uses ritual windows for three things:

1. **Smart ordering.** Habits are sorted by their ritual window relative to
   the current time. At 8am, morning habits appear first. At 7pm, evening
   habits appear first (morning ones that were completed drop to the bottom;
   uncompleted morning habits stay highlighted as overdue).

2. **Gentle time nudges.** If it's 11:30am and a morning habit isn't done:
   subtle visual indicator (the row fades or shows a small clock icon).
   Not a notification — just a visual cue when the user happens to be
   looking.

3. **Pattern insights.** Over time: "You complete Exercise 95% of the time
   when you do it in the morning, but only 40% in the evening. Consider
   making it a morning habit."

Ritual windows are set once per habit (via edit) and can be changed anytime.
They don't affect streaks or completions — they only affect ordering and
provide visual context.

**Why this is novel:** Completion Timestamps (#30 in PLAN.md) passively
records when habits are completed. Ritual Windows actively use time-of-day
as a design element. The distinction: timestamps are analytics
(backward-looking data); ritual windows are structure (forward-looking
arrangement).

No proposed feature addresses *when during the day* habits should happen.
The Habit Stacking feature (N1) sequences habits relative to each other,
but not relative to the clock. Ritual Windows add the temporal axis that
stacking lacks.

**Behavioral science:** Circadian psychology: willpower, creativity, and
energy follow predictable daily patterns (Baumeister, Pink's "When").
Morning routines benefit from highest willpower; creative habits suit
the afternoon dip; reflective habits suit evening wind-down. Matching
habits to natural energy cycles increases completion rates.

Implementation intentions (Gollwitzer) are most effective when they specify
time and place: "I will meditate at 7am in the living room" succeeds more
than "I will meditate." Ritual windows encode the time component of this
specification.

**Data model:** Add optional `ritualWindow?: 'morning' | 'afternoon' | 'evening'`
to the Habit type. No new endpoints.

**Effort:** Small. One select input on the form, a sort function in the
habit list, optional visual cues for overdue windows. No backend changes.

**Depends on:** Edit Habit (#1). Enhanced by Quick Pulse Check-In (H1,
which shows habits in ritual-window order for maximum efficiency).

---

## Part 3: Consolidated Master Roadmap

This replaces all prior roadmaps. It incorporates the best of FEATURES_v4's
20-item list plus the 6 new proposals (H1-H6), totaling 24 items in 5 phases.

### Design Principles for Ordering

1. **Ship basics before creativity.** The app needs Edit Habit and error
   handling before anything else.
2. **Reduce friction before adding features.** Quick Pulse (H1) should ship
   early — it makes the daily experience faster, which means users stick
   around long enough to see the creative features.
3. **Frontend-only features first.** No-backend features ship faster and
   can't break the API.
4. **Each phase has a testable thesis.** Not just a feature list — a claim
   about what users will experience.

---

### Phase 1: Make It Solid (Ship First)

**Thesis:** A user can create, edit, manage, and check in on habits without
encountering bugs or confusion.

| # | Feature | Effort | Source | Notes |
|---|---------|--------|--------|-------|
| 1 | **Edit Habit** | S | Plan v1 | PUT endpoint + inline edit form. Unblocks everything. |
| 2 | **API Error Handling** | S | Plan v1 | Check `res.ok` in api.ts. 10-line fix. Bundle with #1. |
| 3 | **View & Restore Archives** | S | Plan v1 | Unarchive endpoint + collapsible section. Completes CRUD. |
| 4 | **Theme Toggle** | S | Plan v1 | index.css already has CSS variables. Reconcile with App.css, add toggle. |

**Exit criteria:** CRUD is complete. API errors surface to the user. Both themes work.

---

### Phase 2: Make It Fast (Daily Experience)

**Thesis:** Checking in on 10+ habits takes under 15 seconds. The app adapts
to the user's energy and time of day. Checking in feels good, not obligatory.

| # | Feature | Effort | Source | Notes |
|---|---------|--------|--------|-------|
| 5 | **Quick Pulse Check-In** | S | **New H1** | Minimal today-only view. Default on open. Table is opt-in depth. |
| 6 | **Daily Calibration** (MVD + Energy) | S | N3 + #7 | Core habit flag + energy picker. Foundation for adaptive UX. |
| 7 | **Completion Sparks** | S | N8 | Context-aware micro-celebrations. The dopamine loop. |
| 8 | **Ritual Windows** | S | **New H6** | Time-of-day habit ordering. Morning habits first in morning. |
| 9 | **Habit Time Machine** | S | #14 | Arrow navigation beyond 14-day window. |

**Exit criteria:** A user opens the app, sees a clean list of today's habits
sorted by time relevance, taps each one with a celebration, and is done in
15 seconds.

---

### Phase 3: Make It Honest (Data Quality + Safety Nets)

**Thesis:** The app tells the truth about your habits — not just whether you
showed up, but how well. It catches you when you fall and helps you right-size
your ambitions.

| # | Feature | Effort | Source | Notes |
|---|---------|--------|--------|-------|
| 10 | **Completion Depth** | S | **New H2** | Light/Full/Deep rating. Optional, auto-dismisses. Enriches all analytics. |
| 11 | **Phantom Streaks** | S | G2 | "52/55 days (95%)" instead of "Streak: 3." Zero backend. |
| 12 | **Habit Load Monitor** | S | **New H4** | Overcommitment detection. "You have 10 habits but complete 7." |
| 13 | **Soft Landing** | S-M | **New H3** | Re-engagement screen after 7+ days absence. The anti-guilt moment. |
| 14 | **2-Minute Fallback** | S | G1 | Elastic habit scope for low-energy days. |

**Exit criteria:** A user who overcommits gets warned. A user who returns after
absence is welcomed, not shamed. Completion data is richer than binary.

---

### Phase 4: Make It Yours (Identity + Meaning)

**Thesis:** The app reflects who you are, not just what you do. Habits feel
like identity, not chores.

| # | Feature | Effort | Source | Notes |
|---|---------|--------|--------|-------|
| 15 | **Identity Framing** | S | **New H5** | "I am a reader." Declared on habit, reflected on streaks and breaks. |
| 16 | **Living Garden View** | M | #15 | SVG plants reflecting habit health. The product's visual soul. |
| 17 | **Narrative Milestones** | S-M | G3 | Template-generated stories at 7/30/90/365 days. |
| 18 | **The Ratchet** | S-M | G4 | Established habits recede. Developing habits get attention. |
| 19 | **Habit Echoes** | S | G5 | Random surfacing of forgotten past achievements. |

**Exit criteria:** A user with 3+ months of data sees themselves in the app.
Their habits have stories, identities, and a visual garden. Established habits
fade into the background while new ones get focus.

---

### Phase 5: Make It Deep (Psychology + Insights)

**Thesis:** The app is an active partner in behavior change — it predicts,
reflects, and teaches.

| # | Feature | Effort | Source | Notes |
|---|---------|--------|--------|-------|
| 20 | **Planned Rest** (Grace Days + Quiet Weeks) | S-M | N2+N7 | Pre-declared rest that preserves streaks. |
| 21 | **Habit Autopsy** | S | F1 | Structured reflection when habits are abandoned. |
| 22 | **Habit Weather Forecast** | S | F2 | Day-of-week risk prediction icons. |
| 23 | **Insights Tab** (Dashboard + Heatmap) | M | #28-31 | Tabbed analytics view with depth data from H2. |
| 24 | **Weekly Compass** | M | N4 | Weekly intention-setting and reflection. |

**Exit criteria:** A user who misses days feels helped. A user who abandons
habits learns from it. A user with months of data can see their patterns.

---

### Deferred (Not On Roadmap)

Promoted when the 24 above are shipped and user demand proves them:

| Feature | Source | Why Deferred |
|---------|--------|-------------|
| Habit Stacking / Chains | N1 | Medium effort, needs new data model. Cool but not core. |
| Difficulty Progression | N5 | Useful after months of use, not before. |
| Time Capsule | F3 | High novelty, low urgency. Shines after Garden is built. |
| Momentum Score | #16 | Feeds Garden view. Build with or after Garden. |
| Habit Heartbeat | N6 | Visualizes momentum score. Build after it exists. |
| Categories / Tags | #37 | Power feature. Needed at 15+ habits, not before. |
| Drag-and-Drop Reorder | #38 | Nice-to-have. Ritual Windows (#8) handles smart ordering. |
| Data Export | #34 | Table stakes but not urgent. |
| PWA / Offline | #40 | Large effort. Defer until daily use is proven. |
| Keyboard Shortcuts | #12 | Small, independent. Ship whenever. |

---

## Part 4: Feature Reasoning Matrix

### Why each new feature (H1-H6) exists

| Feature | Uncovered Dimension | Core Question It Answers | Why Prior Plans Missed It |
|---------|--------------------|--------------------------|-----------------------|
| H1: Quick Pulse | Check-in friction | "How fast can I check in?" | Plans added to check-in; none simplified it |
| H2: Completion Depth | Completion quality | "Did I actually do this well?" | Binary completion was an unquestioned assumption |
| H3: Soft Landing | Re-engagement | "What happens when I come back after falling off?" | Plans assumed continuous daily use |
| H4: Habit Load | Overcommitment | "Do I have too many habits?" | Plans supported adding more, never questioned quantity |
| H5: Identity Framing | Habit-as-identity | "Who am I because of this habit?" | Plans cited James Clear but never implemented his core thesis |
| H6: Ritual Windows | Time-of-day structure | "When should I do this today?" | Plans modeled what and whether, not when |

### New features vs. existing proposals — disambiguation

| New Feature | Closest Existing Proposal | How They Differ |
|-------------|--------------------------|-----------------|
| H1: Quick Pulse | Today Focus Mode (#11) | Focus Mode was proposed as a "minimal daily checklist with large tappable cards." Quick Pulse is simpler: a list, not cards. The key difference: Quick Pulse is the *default view*, not a mode. The table is the secondary view. |
| H2: Completion Depth | Completion Friction (#13) | Friction controls *how* you mark complete (instant vs. hold vs. verify). Depth records *how well* you completed. Orthogonal dimensions. |
| H3: Soft Landing | Streak Recovery Mode (#22) | Recovery Mode changes how streaks display after a break. Soft Landing changes the *entire UI* for the return visit. Recovery is cosmetic; Soft Landing is structural. |
| H4: Habit Load | The Ratchet (G4) | The Ratchet hides established habits to free attention. Load Monitor warns about total habit count. Ratchet manages *visual* load; Monitor manages *behavioral* load. |
| H5: Identity Framing | Time Capsule (F3) | Time Capsule is a message from past self, locked until a milestone. Identity Framing is a persistent declaration shown on streaks, breaks, and returns. Capsule is a surprise; Identity is a mirror. |
| H6: Ritual Windows | Completion Timestamps (#30) | Timestamps passively record when you completed. Ritual Windows actively structure when you should. Timestamps are analytics; Windows are architecture. |

---

## Part 5: Implementation Notes

### Architecture prep (before Phase 2)

1. **CSS custom properties.** Extract App.css hardcoded colors into `:root`
   variables. Required for Theme Toggle (#4), benefits everything after.
   index.css already has variables — reconcile the two files. ~30 minutes.

2. **View state management.** Quick Pulse (H1) and the full table need a
   clean view-switching mechanism. A simple `useState<'pulse' | 'table'>`
   in App.tsx with localStorage persistence is enough. Don't over-engineer
   this — it's two views, not a router.

3. **Optional Habit fields.** Features H5 (identity), H6 (ritual window),
   G1 (fallback), and G4 (locked) all add optional fields to the Habit
   type. Add them all at once to the type definition and the server
   validation, even if the UI features ship separately. This prevents
   repeated type migrations.

### Data model evolution

Current Habit type:
```typescript
type Habit = {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  color: string
  createdAt: string
  archived: boolean
}
```

After all features (additive — all new fields optional):
```typescript
type Habit = {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  color: string
  createdAt: string
  archived: boolean
  // Phase 1
  // (no changes)
  // Phase 2
  isCore?: boolean               // Daily Calibration
  ritualWindow?: 'morning' | 'afternoon' | 'evening'  // Ritual Windows (H6)
  // Phase 3
  fallback?: string              // 2-Minute Fallback (G1)
  // Phase 4
  identity?: string              // Identity Framing (H5)
  locked?: boolean               // The Ratchet (G4)
  lockedAt?: string              // The Ratchet (G4)
  // Phase 5
  autopsy?: { reason: string; note?: string; date: string }  // Habit Autopsy
}
```

Current HabitLog type:
```typescript
type HabitLog = {
  [habitId: string]: string[]    // array of date strings
}
```

After Completion Depth (H2):
```typescript
type HabitLog = {
  [habitId: string]: string[]    // stays unchanged for backward compat
}

type DepthLog = {
  [habitId: string]: {
    [date: string]: 'light' | 'full' | 'deep'
  }
}
```

The parallel DepthLog structure means existing data.json files work without
migration. Habits without depth entries are treated as "full" by default.

### What NOT to build (carries forward from v4, with additions)

| Temptation | Why Not |
|-----------|---------|
| Authentication / multi-user | No user base. Adds 500+ lines for zero users. |
| Database migration to SQLite | JSON is fine at this scale. |
| Push notifications | Requires PWA + permissions flow. Effort/value is terrible. |
| AI-generated insights | Template-based narratives (G3) achieve 80% of value at 5% of cost. |
| Gamification (XP, levels, badges) | Extrinsic rewards undermine intrinsic motivation. |
| Social features | Requires auth, moderation, real-time sync. Out of scope. |
| **Habit marketplace / templates** | Users should name their own habits. Pre-built templates reduce ownership. |
| **Automated reminders / scheduling** | The app should be pulled to, not pushed from. Notifications are interruption. |

---

## Part 6: The Honest Summary

### What this document adds

- **6 genuinely novel features** (H1-H6) addressing 6 dimensions no prior
  plan touched: friction, quality, re-engagement, overcommitment, identity,
  and temporal structure
- **Blind spot analysis** showing exactly what was covered and what wasn't
- **Disambiguation table** proving each new feature is distinct from existing
  proposals
- **24-item consolidated roadmap** in 5 phases with testable theses
- **Complete data model evolution** showing every type change across all phases

### What this document does NOT add

- Any implementation code (the actual gap)
- Solutions to the planning-debt problem (acknowledged but unresolved)
- Features that require backend complexity (all 6 new features are
  frontend-only or add a single optional field)

### The recommended next action

Stop reading this document. Open the codebase. Ship Edit Habit.

The 24-item roadmap is here when you need it. The reasoning is documented.
The behavioral science is cited. The data model evolution is planned. The
architecture prep is scoped.

The only thing missing is a commit that changes something other than a
markdown file.
