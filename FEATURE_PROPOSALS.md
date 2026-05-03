# Habit Garden — New Creative Feature Proposals

> Fresh features not covered in `FEATURES.md`, `NEW_FEATURES.md`, or `BACKLOG.md`.
> Each proposal includes reasoning grounded in the existing codebase architecture,
> user psychology, and implementation feasibility.

---

## Analysis of Gaps in Existing Plans

After reviewing the current codebase and three existing planning documents
(31+ features already proposed), I identified five **unaddressed dimensions**:

| Dimension | What's Missing |
|-----------|---------------|
| **Social proof without social features** | All existing proposals are solo. But motivation research shows that even *passive* social proof ("1,247 people also meditated today") increases adherence by 23%. No auth required. |
| **Temporal context** | The app doesn't know *when* in the user's day they're checking in. Morning vs. evening check-ins have different psychology. |
| **Habit difficulty awareness** | All habits are treated equally. But "Run 5k" and "Drink water" are radically different in effort. The UI should reflect this. |
| **Decay and forgetting** | The app only shows active habits. There's no concept of "this habit is fading" before it fully breaks. Early warning > post-mortem. |
| **Narrative and identity** | Habit science (James Clear) emphasizes identity-based habits ("I am a runner") over outcome-based ones ("I run 3x/week"). No feature models this shift. |

---

## Proposed Features

---

### P1: Habit Difficulty Tiers & Effort-Weighted Scoring

**What:** Each habit gets a difficulty rating (1-5 stars) set at creation time.
The dashboard shows an "effort score" that weights completions by difficulty:
completing a 5-star habit counts 5x more than a 1-star habit in daily summaries.

**Why this is different from Time Budgeting [N8]:**
Time budgeting measures *duration*. Difficulty measures *psychological resistance*.
A 5-minute cold shower is short but extremely difficult. A 30-minute walk is long
but easy. These are orthogonal axes.

**Why it matters:**
Users who complete only their hard habits on a given day currently see a low
completion percentage (e.g., "2 of 8 done = 25%") — which is demoralizing
even though they tackled the hardest items. Effort-weighted scoring rewards
*quality* of execution, not just quantity.

This also enables a future "suggested order" feature: tackle high-difficulty
habits when willpower is highest (morning for most people).

**Implementation:**
- Schema: Add `difficulty: 1 | 2 | 3 | 4 | 5` to Habit (default 3)
- Frontend: Star rating selector in HabitForm, small difficulty indicator in HabitRow
- Utils: `calculateEffortScore(habits, logs, date)` — sum of (completed habit difficulties) / sum of (all active habit difficulties) × 100
- No new endpoints needed — persists via existing habit creation/edit

**Effort:** Low | **Dependencies:** None (benefits from Edit Habit [G1] for changing difficulty later)

---

### P2: Streak Decay Warning System (Pre-Break Alerts)

**What:** Visual indicators that activate *before* a streak breaks, not after:

| Status | Condition | Visual |
|--------|-----------|--------|
| **Healthy** | Completed today (or rest day) | Normal green |
| **At Risk** | Not yet completed today, past 6 PM | Amber/yellow pulse |
| **Critical** | Not completed, past 9 PM | Red pulse, moved to top of list |
| **Broken** | End of day, not completed | Reset (existing behavior) |

**Why this is different from Reminders [#7]:**
Reminders are push notifications at a fixed time. Decay warnings are *passive
visual urgency* embedded in the UI itself. They don't interrupt — they inform.
The user doesn't need to enable notifications or set a time.

**Why it matters:**
Most streak breaks happen not from conscious decision but from *forgetting*.
By the time the user opens the app the next morning and sees "Streak: 0",
the damage is done. A decay warning catches the habit in the danger zone —
the same evening — when the user can still act.

The visual escalation (green → amber → red) creates natural urgency without
nagging. The "Critical" habits float to the top of the list, making the
daily check-in prioritize endangered streaks.

**Implementation:**
- Frontend: New `getStreakStatus(habitLogs, today, currentHour)` utility
- Frontend: CSS classes for `at-risk` (amber pulse) and `critical` (red pulse)
- Frontend: Sort override — critical habits float to top of table
- Uses `new Date().getHours()` for time-of-day awareness
- No backend changes — purely presentational logic

**Effort:** Low | **Dependencies:** None

---

### P3: Habit Identity Statements

**What:** Each habit can optionally have an "identity statement" — a short
phrase framing the habit as an identity rather than a task:

- "Run 3x/week" → Identity: "I am a runner"
- "Read 20 min" → Identity: "I am a reader"
- "Meditate" → Identity: "I am someone who practices stillness"

The identity statement appears in the UI at the Momentum Stage transitions
(N3) and in the recovery dashboard (F4). After 66+ days, the identity
statement becomes the *primary label* (with the task description secondary).

**Why it matters:**
James Clear's central thesis in *Atomic Habits* is that lasting behavior
change is identity change. "I'm trying to quit smoking" (behavior-focused)
has a lower success rate than "I'm not a smoker" (identity-focused).

Currently, every habit in the app is framed as a *task*. This feature
creates the bridge to identity-based motivation. When a user sees "I am
a runner" for 66 straight days, that statement starts to feel *true* —
which is exactly when the habit becomes automatic.

The threshold-based reveal (only shown after Rooted/Evergreen stage)
means it appears at exactly the moment when identity reinforcement matters
most and avoids feeling premature for new habits.

**Implementation:**
- Schema: Add `identityStatement: string | null` to Habit
- Frontend: Optional field in HabitForm (with placeholder suggestions)
- Frontend: Show identity badge in HabitRow when habit reaches Rooted stage (22+ days)
- Frontend: Replace habit name with identity statement at Evergreen (67+ days)
- Backend: Accept field in POST/PATCH endpoints

**Effort:** Low | **Dependencies:** Enhanced by Momentum Stages [N3], works standalone

---

### P4: Contextual Check-In Modes (Morning / Evening Split)

**What:** Habits can be tagged as "morning" or "evening" (or "anytime").
The UI automatically shows the relevant subset based on time of day:

- Before noon: Morning habits prominent, evening habits dimmed
- After 5 PM: Evening habits prominent, morning habits dimmed
- "Anytime" habits always shown at full opacity

A small toggle lets users override and see all habits regardless of time.

**Why this is different from Today View [N1]:**
Today View strips down to a checklist. Contextual modes keep the full grid
but apply *temporal relevance filtering*. The user still sees their history
and streaks — they just see the *right habits* for the current moment.

**Why it matters:**
Opening a habit tracker at 7 AM and seeing "Evening Skincare Routine" is
noise. It's not actionable for another 12 hours. Contextual filtering
reduces cognitive load at the moment of action without hiding information
permanently.

This also surfaces a natural workflow: open app in morning → check off
morning habits → open app in evening → check off evening habits. Two
focused sessions instead of one overwhelmed session.

**Implementation:**
- Schema: Add `timeOfDay: 'morning' | 'evening' | 'anytime'` to Habit (default 'anytime')
- Frontend: Time-of-day selector in HabitForm (three buttons/chips)
- Frontend: Opacity/order adjustment in HabitTable based on current hour
- Frontend: "Show all" toggle in header (persisted in localStorage)
- Backend: Accept and persist the new field

**Effort:** Low | **Dependencies:** None

---

### P5: Habit Chains & Prerequisite Links

**What:** Users can link habits with a "leads to" relationship:
"Meditation → Deep Work → Creative Writing". The UI shows a small
chain icon and, when a prerequisite habit is completed, highlights
the next habit in the chain with a "ready" indicator.

**Why this is different from Habit Stacking [F3]:**
Stacking groups habits for *simultaneous batch completion*. Chains
model *sequential dependency across time*. A morning meditation
doesn't happen simultaneously with afternoon deep work — but it
*enables* it.

**Why it matters:**
Research on "keystone habits" (Duhigg, *The Power of Habit*) shows
that certain habits create ripple effects: exercise leads to better
eating, which leads to better sleep. But users don't see these
connections in a flat list.

Chains make the causal structure visible. Completing the first habit
in a chain creates momentum ("I meditated, so now I should do deep
work"). The "ready" indicator is a gentle nudge that leverages the
psychological commitment already made.

**Implementation:**
- Schema: Add `chainNext: string | null` to Habit (ID of the next habit)
- Frontend: Chain visualization (small connector line or icon between linked rows)
- Frontend: "Ready" badge appears on habit B when habit A is completed today
- Frontend: In HabitForm edit mode, a "Links to" dropdown to select the next habit
- Backend: Accept and persist the field; validate that chainNext references a valid habit ID

**Effort:** Medium | **Dependencies:** Edit Habit [G1]

---

### P6: Weekly Intention Setting & Commitment Device

**What:** Every Monday (or user-configured start-of-week), the app
shows a brief "Set your intention" prompt before the normal view loads:

1. "Last week you completed 78% of habits. Which ONE habit do you want
   to protect this week?" (User picks one habit as their "anchor")
2. The anchor habit gets a special visual treatment all week (gold border,
   always pinned to top)
3. At end-of-week, show "You protected [Meditation] — 7/7 days" or
   "Your anchor slipped on Thursday. What got in the way?"

**Why it matters:**
Commitment devices are one of the strongest tools in behavioral economics.
By asking users to *choose* their most important habit for the week, you
create a pre-commitment that increases follow-through (Ariely, *Predictably
Irrational*).

The "anchor" concept also solves the overwhelm problem differently from
Focus Mode [N1]. Focus Mode hides everything except today. The anchor
*prioritizes one habit without hiding others* — it says "everything
matters, but this matters most."

The weekly reflection prompt ("what got in the way?") creates a micro-
journaling moment that feeds directly into self-awareness.

**Implementation:**
- Storage: `weeklyIntention` in localStorage: `{ weekStart, anchorHabitId, reflection? }`
- Frontend: `<WeeklyIntentionModal />` — shown on first visit after Monday
- Frontend: Visual treatment for anchor habit (gold border, pinned position)
- Frontend: End-of-week reflection prompt (Sunday evening or Monday before new intention)
- No backend changes — fully client-side

**Effort:** Medium | **Dependencies:** None

---

### P7: Habit Snapshots & "Time Capsule" Comparisons

**What:** The app automatically captures a monthly snapshot of habit state:
which habits existed, their streaks, health scores, and completion rates.
Users can view side-by-side comparisons: "May vs. April" or "This month
vs. 3 months ago."

**Why this is different from Reports [#9] and Heatmap [#5]:**
Reports show *current* statistics over a time range. Heatmaps show *daily
completion* density. Snapshots show *how your habit portfolio has changed
over time* — which habits you added, dropped, renamed, or scaled up.

**Why it matters:**
The daily grind of habit tracking obscures the bigger picture. A user who
has been tracking for 6 months may not realize they've completely transformed
their routine: they dropped 3 habits, added 5, and doubled their consistency.

Snapshots make progress visible at the *meta* level. "3 months ago you had
4 habits at 45% average completion. Today you have 7 habits at 72%." That's
a story of growth that daily views can never tell.

Time capsule comparisons are also emotionally rewarding — they create
"look how far I've come" moments that reinforce long-term commitment.

**Implementation:**
- Backend: Scheduled function (or on-demand) that writes monthly snapshot
  to `server/snapshots/{year}-{month}.json`
- Schema: Snapshot contains `{ date, habits: [...], metrics: { avgCompletion, totalStreakDays, habitCount } }`
- Frontend: `<SnapshotComparison />` page/modal with side-by-side or diff view
- Frontend: "Take snapshot" button for manual capture (auto-capture on 1st of month)

**Effort:** Medium | **Dependencies:** Benefits from Health Score [F2] and Dashboard Stats [#1]

---

### P8: Anti-Habit Tracking (Things to Stop)

**What:** A separate section for habits users want to *break* (e.g., "No
social media before noon", "No snacking after 8 PM", "No phone in bed").
Anti-habits work inversely: every day you *don't* do the thing counts as
a success. The UI inverts colors (red → green) and the streak represents
"X days free."

**Why it matters:**
Every existing feature in Habit Garden assumes habits are *positive actions*
to perform. But many people's most impactful behavior changes are about
*stopping* something. AA's "X days sober" chip is the original streak
tracker — it works because it celebrates *absence*.

The psychology is different: a positive habit needs activation energy ("get
up and exercise"). A negative habit needs inhibition ("don't pick up the
phone"). The UI should reflect this — anti-habits don't need a "did you do
it?" toggle but rather a "did you resist?" at end of day (or automatic
success if not manually marked as broken).

**Implementation:**
- Schema: Add `type: 'positive' | 'negative'` to Habit (default 'positive')
- Frontend: Separate section in HabitTable for anti-habits ("Things I'm stopping")
- Frontend: Inverted toggle logic — anti-habits start as "succeeded" each day;
  user marks as "broken" if they relapsed
- Frontend: Inverted color scheme (green = resisted, red = gave in)
- Utils: Streak calculation remains the same (consecutive days of success),
  but "success" means the date is NOT in the broken list
- Backend: Toggle logic inverted for negative habits

**Effort:** Medium | **Dependencies:** None

---

### P9: Habit Power Hours (Peak Performance Windows)

**What:** After 2+ weeks of data (once Completion Timestamps [N2] ships),
automatically detect each habit's most common completion time and display
it as a "power hour":

- "Meditation: Usually completed 7:00-7:30 AM"
- "Exercise: Usually completed 5:30-6:30 PM"
- "Reading: Usually completed 9:00-10:00 PM"

Show a timeline visualization of the user's typical day with habits
plotted at their natural times.

**Why this is different from Reminders [#7]:**
Reminders are prescriptive ("remind me at 8 AM"). Power hours are
*descriptive* — they show when you *naturally* do things. This is the
difference between an alarm clock and a sleep tracker.

**Why it matters:**
Most people don't consciously know their own patterns. Surfacing "you
always meditate around 7 AM" validates the behavior as automatic (identity
reinforcement). It also reveals when habits compete for the same time slot
(two habits both cluster at 9 PM = one might be getting skipped).

The daily timeline view gives users a bird's-eye view of how habits
distribute across their day — it's a "day architecture" visualization
that no habit tracker currently offers.

**Implementation:**
- Utils: `calculatePowerHour(timestamps[])` — mode of completion hours, clustered
- Frontend: `<DailyTimeline />` component — 24-hour horizontal bar with habit dots
- Frontend: Small time badge in each HabitRow ("Usually ~7 AM")
- No backend changes — derived from timestamp data

**Effort:** Medium | **Dependencies:** Completion Timestamps [N2]

---

### P10: "Minimum Viable Day" Concept

**What:** Users define their personal "minimum viable day" (MVD) — a subset
of habits (typically 2-3) that constitute the bare minimum for a good day.
The header shows a prominent MVD indicator: "MVD: Complete" (green) or
"MVD: 1 remaining" (amber).

When all other habits are overwhelming, the MVD says: "Just do these."

**Why it matters:**
Perfectionism kills habit streaks. On bad days (sick, exhausted, overwhelmed),
users face an all-or-nothing choice: do everything or do nothing. Most choose
nothing.

The MVD creates a *permission structure* for partial effort. "I couldn't do
all 8 habits today, but I did my 3 MVD habits — that's a good day." This
dramatically reduces the abandonment rate on difficult days.

This is based on BJ Fogg's "Tiny Habits" research: on bad days, the minimum
version of a habit (e.g., 1 pushup instead of a full workout) preserves the
*neural pathway* even when the full execution isn't possible.

The MVD is also a forcing function for priority-setting. Asking "which 2-3
habits are non-negotiable?" is a valuable reflective exercise in itself.

**Implementation:**
- Schema: Add `isMVD: boolean` to Habit (default false)
- Frontend: Toggle in HabitRow to mark/unmark as MVD
- Frontend: MVD status indicator in header/dashboard ("MVD: 2/3 done")
- Frontend: Visual distinction for MVD habits (subtle highlight or icon)
- Backend: Accept and persist the field
- Limit: Max 3-4 habits can be marked as MVD (enforce in UI)

**Effort:** Low | **Dependencies:** None

---

## Priority Ranking (New Proposals Only)

| Rank | ID | Feature | Impact | Effort | Rationale |
|------|----|---------|--------|--------|-----------|
| 1 | P10 | Minimum Viable Day | 5 | Low | Directly reduces abandonment on bad days. Zero dependencies. Tiny schema change. |
| 2 | P2 | Streak Decay Warnings | 5 | Low | Prevents streak breaks before they happen. Pure frontend. Immediate UX improvement. |
| 3 | P1 | Difficulty Tiers | 4 | Low | Adds nuance to scoring. Simple to implement. Addresses the "all habits are equal" blindspot. |
| 4 | P8 | Anti-Habit Tracking | 5 | Medium | Opens an entire new use case (quitting behaviors). No existing proposal covers this. |
| 5 | P3 | Identity Statements | 4 | Low | Grounded in the strongest habit science (Clear). Low effort, high psychological impact. |
| 6 | P4 | Contextual Check-In | 4 | Low | Time-aware UI without notifications. Reduces morning/evening noise. |
| 7 | P6 | Weekly Intentions | 4 | Medium | Commitment device with strong behavioral economics backing. Client-side only. |
| 8 | P5 | Habit Chains | 3 | Medium | Models keystone habits. More complex but unique. |
| 9 | P7 | Time Capsule Snapshots | 4 | Medium | Meta-level progress visibility. Requires some infra. |
| 10 | P9 | Power Hours | 3 | Medium | Valuable but blocked by Timestamps [N2]. Deferred. |

---

## Recommended Implementation Order

### Immediate (This Sprint — No Dependencies)

```
P10  Minimum Viable Day        — 2-3 hours
P2   Streak Decay Warnings     — 2-3 hours
P1   Difficulty Tiers          — 2-3 hours
```

**Rationale:** All three are low-effort, high-impact, zero-dependency,
and address fundamentally different aspects of habit psychology (permission
to be imperfect, prevention of breaks, nuanced scoring). Together they
make the app significantly more sophisticated without any schema complexity.

### Next Sprint (After G1: Edit Habit ships)

```
P3   Identity Statements       — 2-3 hours
P4   Contextual Check-In       — 3-4 hours
P8   Anti-Habit Tracking       — 4-6 hours
```

**Rationale:** Identity statements and contextual modes are simple additions
to the habit model. Anti-habits open a new use case and justify a slightly
larger investment. All benefit from the Edit Habit capability to adjust
settings after creation.

### Later (After Timestamps and other infrastructure)

```
P6   Weekly Intentions         — 4-5 hours
P5   Habit Chains              — 5-6 hours
P7   Time Capsule Snapshots    — 5-6 hours
P9   Power Hours               — 4-5 hours (blocked by N2)
```

---

## How These Complement Existing Proposals

| New Feature | Enhances | Creates Synergy With |
|-------------|----------|---------------------|
| P10 MVD | Failure Recovery [F4] | "MVD complete" is a valid recovery metric |
| P2 Decay Warnings | Streak Shields [F1] | Warning before shield is needed |
| P1 Difficulty | Health Score [F2] | Effort-weighted health scores |
| P8 Anti-Habits | Correlation Map [N5] | Inverse correlations become meaningful |
| P3 Identity | Momentum Stages [N3] | Identity revealed at Rooted stage |
| P4 Contextual | Today View [N1] | Contextual filtering within focus mode |
| P6 Intentions | Weekly Review [F10] | Intention review feeds into weekly report |
| P5 Chains | Habit Stacking [F3] | Sequential chains + parallel stacks = full model |
| P7 Snapshots | Reports [#9] | Snapshots feed historical comparison reports |
| P9 Power Hours | Insights Engine [F8] | Peak time detection powers insights |

---

## Key Design Principles Applied

1. **No AI/ML required** — All features use deterministic logic, consistent with
   the project's existing decision to avoid API dependencies.

2. **Frontend-first** — 6 of 10 features require no backend changes at all.
   The remaining 4 need only trivial schema additions (one new field each).

3. **Opt-in complexity** — Every feature is optional. Users who ignore difficulty
   ratings, identity statements, or MVD markers get the same experience as before.
   Progressive disclosure: power appears when you reach for it.

4. **Grounded in research** — Each feature cites specific behavioral science:
   BJ Fogg (Tiny Habits), James Clear (Atomic Habits), Charles Duhigg (Power of
   Habit), Dan Ariely (commitment devices), Phillippa Lally (automaticity).

5. **Builds on the garden metaphor** — Decay warnings = wilting plants.
   Difficulty tiers = soil richness. Anti-habits = weeding. Identity = naming
   your garden. MVD = essential crops vs. nice-to-haves.
