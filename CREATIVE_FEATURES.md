# Habit Garden — Creative Features & Consolidated Backlog

> **Context:** This document adds genuinely new feature ideas not found in any of
> the 7 prior planning docs (FEATURES.md, NEW_FEATURES.md, BACKLOG.md,
> FEATURE_PLAN.md, FEATURE_PLAN_v3.md, FEATURE_PROPOSALS.md, ROADMAP.md).
> It also provides a consolidated backlog view across ALL documents.
>
> **Honest disclaimer:** The project has 65+ planned features across 7 docs and
> ~600 lines of shipped code. The ROADMAP.md correctly diagnosed: "The bottleneck
> is not ideas. It's building." These proposals exist to fill *specific behavioral
> science gaps* that every prior document misses — not to add planning weight.
>
> Created: 2026-05-15

---

## Part 1: Gap Analysis — What 65+ Features Still Miss

After auditing every feature across all 7 documents, these behavioral dimensions
remain completely unaddressed:

| Gap | What's Missing | Why It Matters |
|-----|---------------|----------------|
| **Gradual onramp** | Every habit starts at full difficulty on day 1. No warmup period. | 50% of habits fail in the first week (Lally et al.). The all-or-nothing start is the #1 killer. |
| **Head-to-head testing** | No way to compare two habit variants. Users guess which version works. | "Should I run mornings or evenings?" — the app can't help answer this. |
| **Over-performance credit** | Extra effort is invisible. Doing a habit twice earns the same as doing it once. | Discourages above-and-beyond effort. Misses a natural "savings" mechanic. |
| **Physical environment** | All features focus on the *digital* experience. None connect to the physical world. | Atomic Habits' #1 strategy is environment design ("make the cue obvious"). Zero support for this. |
| **Self-prediction** | Users never predict their own behavior. Only retrospective analysis exists. | Calibration (predict → observe → adjust) is one of the most powerful metacognitive tools. |
| **Life transitions** | Calendar seasons (NEW-2) exist, but life changes (new job, new baby, injury) don't. | These transitions break ALL habits simultaneously. No feature addresses systemic disruption. |
| **Narrative output** | Reports are analytical. Nothing is *shareable*, *beautiful*, or *story-shaped*. | The "look how far I've come" moment drives long-term retention more than any metric. |
| **Effort recognition** | Doing 2 hard habits = doing 2 easy habits in every metric. | Demoralizing for users who tackle their hardest habits first and "only" complete 3/8. |

---

## Part 2: New Feature Proposals (10 Features)

Each feature below fills one or more gaps from Part 1 and is not proposed
in any prior document.

---

### C1: Habit Warmup Ramp (Graduated Start)

**What:** New habits start in a 7-day "warmup" phase with auto-scaled
expectations. The user sets both a *minimum* and *target* version:

- Day 1-2: "Meditate 1 minute" (minimum)
- Day 3-4: "Meditate 3 minutes"
- Day 5-6: "Meditate 5 minutes"
- Day 7+: "Meditate 10 minutes" (target)

The UI shows the day's scaled version as the habit name during warmup.
Completing ANY level counts as success. After warmup, the habit
transitions to its full target version with a small celebration.

**Why this fills a real gap:**
Every existing proposal treats day 1 and day 30 identically. But behavioral
science is clear: the first week is when habits are most fragile. BJ Fogg's
Tiny Habits research shows that starting absurdly small ("floss one tooth")
and scaling up produces 3x higher long-term adherence than starting at the
target level.

No prior document proposes graduated difficulty. Momentum Stages (N3) label
the phase but don't change the expectation. Micro-Habits (F9) allows partial
completion but doesn't auto-scale. The warmup ramp is prescriptive: the app
*tells you* what to do today, removing decision fatigue entirely.

**Why it works psychologically:**
- Removes the "I'm not ready for 10 minutes" objection on day 1
- Creates guaranteed early wins (day 1 is always achievable)
- The daily escalation builds self-efficacy ("I did 3 min yesterday, 5 min
  today feels natural")
- The day-7 transition to "full" mode is a mini-milestone

**Implementation:**
- Schema: Add optional `warmup: { minimum: string, target: string } | null` to Habit
- Frontend: During warmup, show interpolated label in HabitRow
- Frontend: Warmup progress indicator (day X of 7) with scaled label
- Frontend: Day-7 transition celebration
- Backend: Accept warmup field in POST/PATCH
- Utils: `getWarmupLabel(habit, daysSinceCreation)` — returns today's scaled version

**Effort:** Low | **Dependencies:** None
**Gap filled:** Gradual onramp

---

### C2: Habit A/B Testing (Variant Comparison)

**What:** Split a single habit into two competing variants to test which
one you actually follow through on:

- "Morning Run" vs. "Evening Run" — track both for 14 days
- "Read physical book" vs. "Read on Kindle"
- "Gym workout" vs. "Home workout"

After the test period, the app shows a comparison card:
"Morning Run: 11/14 days (79%). Evening Run: 6/14 days (43%).
Morning Run wins. Keep it, or extend the test?"

**Why this fills a real gap:**
Habit Experiments (F7) lets you try a habit for 30 days. But it tests
ONE habit — it doesn't compare alternatives. Users constantly face
"which version?" questions that no planning document addresses.

This is the scientific method applied to personal habits: hypothesis →
controlled test → data → decision. No habit tracker in the market offers
this, making it a genuine differentiator.

**Why it works psychologically:**
- Reframes "I don't know if this will work" into "let's find out" (curiosity > anxiety)
- The competitive framing between variants is inherently engaging
- Data-driven decisions feel better than guessing
- Losing variant can be archived without guilt ("the data said so")

**Implementation:**
- Schema: Add `abTest: { variantOf: string, testEndDate: string } | null` to Habit
  (variantOf = ID of the other habit in the pair)
- Frontend: "Create A/B test" option in HabitForm — creates two linked habits
- Frontend: `<ABTestCard />` comparison view after test period ends
- Frontend: Visual indicator linking the two variants in HabitTable
- Backend: No new endpoints — uses existing create/archive flow
- Utils: `compareVariants(habitA, habitB, logs)` — head-to-head stats

**Effort:** Medium | **Dependencies:** None
**Gap filled:** Head-to-head testing

---

### C3: Streak Savings Bank (Over-Performance Buffer)

**What:** When a user completes a "weekly" habit more than the required
number of times (e.g., exercises 5 days when the goal is 3x/week), the
extra completions become "savings" that automatically cover future misses.

Visual: A small piggy bank icon next to the streak with a count of
saved completions. When a miss occurs, a saved completion is spent
automatically and the streak continues.

**How it works:**
- Goal: Exercise 3x/week
- Week 1: Completed 5 days → 2 savings earned
- Week 2: Completed 2 days → 1 saving spent automatically → still on track
- Savings cap: Max 3 (prevents indefinite hoarding)
- Savings display: "2 saved" badge with animated coin icon

**Why this fills a real gap:**
Streak Shields (F1) are earned at milestone intervals (1 per 14-day streak).
The Savings Bank is earned through *consistent over-performance* — a
fundamentally different mechanic. Shields say "you've been good long enough
to earn a break." Savings say "your extra effort today protects your future."

This creates a powerful psychological incentive: on a good day, doing one
extra rep isn't just vanity — it's insurance. It transforms over-performance
from invisible to tangible.

**Implementation:**
- Utils: `calculateSavings(logs, frequency)` — excess completions beyond goal
- Frontend: Savings badge in HabitRow (coin/piggy icon + count)
- Frontend: "Saving spent" animation when a miss is auto-covered
- No schema change — derived from existing log data and frequency config
- Works best with Smart Rest Days (F5) but functions with weekly habits now

**Effort:** Low-Medium | **Dependencies:** Works standalone, enhanced by F5
**Gap filled:** Over-performance credit

---

### C4: Environmental Cue Tracker

**What:** Each habit can be paired with a physical environment cue — a
short description of a real-world trigger or setup:

- "Exercise" → Cue: "Running shoes by front door"
- "Read" → Cue: "Book on pillow before bed"
- "Meditate" → Cue: "Cushion already set up in corner"
- "Drink water" → Cue: "Full water bottle on desk"

Cues are displayed in the habit row as a small tooltip/subtitle.
When a habit's completion rate drops below 60% over 7 days, the app
prompts: "Your cue for [Exercise] is 'Running shoes by front door.'
Is this cue still set up? Try refreshing it or choosing a new one."

**Why this fills a real gap:**
This is arguably the most important missing feature from a behavioral
science standpoint. James Clear's #1 actionable strategy in Atomic Habits
is "make the cue obvious" — redesign your physical environment so the
right behavior is the easiest behavior.

Every single feature proposed across all 7 documents operates purely in
the digital realm. None connect to the physical world where habits actually
happen. The cue tracker bridges this gap: it reminds users that the app is
a tool, not the habit itself.

**Why it works psychologically:**
- Forces users to think about implementation intention ("where and when?")
- The refresh prompt when habits slip targets the actual root cause (broken cue)
- Externalizes the trigger so the habit doesn't depend on memory or motivation
- Creates a physical-digital feedback loop unique to this app

**Implementation:**
- Schema: Add `cue: string | null` to Habit (max 80 chars)
- Frontend: Optional "Environment cue" field in HabitForm (with examples)
- Frontend: Small cue subtitle in HabitRow (tooltip on hover, visible on expand)
- Frontend: Cue refresh prompt when 7-day completion drops below 60%
- Backend: Accept and persist the field

**Effort:** Low | **Dependencies:** None
**Gap filled:** Physical environment connection

---

### C5: Confidence Calibration (Predict → Do → Learn)

**What:** Each morning (or on first daily visit), the app shows a quick
prediction prompt for each habit: "How likely are you to complete this
today?" (Low / Medium / High). At end-of-day, compare predictions to
outcomes:

- **Calibrated:** "You predicted High for Exercise and did it. You know yourself."
- **Underconfident:** "You predicted Low for Meditation but did it anyway!
  You're better at this than you think."
- **Overconfident:** "You predicted High for Reading but missed it.
  What got in the way?"

Over time, show a calibration score: "You're 73% accurate at predicting
your own behavior. Your blind spot: you consistently underestimate your
ability to Exercise."

**Why this fills a real gap:**
Every existing proposal is backward-looking: streaks, health scores,
heatmaps, insights — all analyze what already happened. Confidence
calibration is the only *forward-looking* feature. It engages users at
the start of the day, not just at check-in time.

The metacognitive angle is unique. No habit tracker asks "what do you
think will happen?" Prediction forces active engagement with your own
psychology — it's a 5-second reflective practice that compounds into
genuine self-knowledge.

**Why it works psychologically:**
- Prediction creates a micro-commitment (stating "High" makes you 20% more
  likely to follow through — pre-commitment effect, Cialdini)
- Discovering you're underconfident is genuinely motivating ("I'm better
  than I think")
- Discovering you're overconfident is genuinely useful ("I need to change
  my environment, not just my intention")
- The calibration score is a meta-skill: self-knowledge improves all habits

**Implementation:**
- Storage: `predictions` in localStorage or data.json:
  `{ [date]: { [habitId]: 'low' | 'medium' | 'high' } }`
- Frontend: `<DailyPrediction />` modal on first visit each day (skippable)
- Frontend: End-of-day comparison view in dashboard
- Frontend: Calibration stats panel (accuracy %, per-habit bias)
- Utils: `calculateCalibration(predictions, logs)` — accuracy and bias detection
- Backend: Optional `POST /api/predictions` (or store client-side only)

**Effort:** Medium | **Dependencies:** None
**Gap filled:** Self-prediction, forward-looking engagement

---

### C6: Life Phase Modes (Context-Aware Profiles)

**What:** Users can define "life phases" — named profiles that activate
different subsets of habits and adjust expectations:

| Phase | Active Habits | Expectations |
|-------|--------------|-------------|
| **Normal** | All habits | Full targets |
| **Travel** | Meditation, Reading, Journal | Reduced (no gym access) |
| **New Parent** | Sleep, Basic Exercise, Hydration | Minimum viable day only |
| **Recovery** | Gentle movement, Rest, Medication | Warmup-level targets |
| **Crunch Mode** | Work habits only | Defer personal habits without guilt |

Switching phases is a deliberate, logged action. The app shows: "You've
been in Travel mode for 3 days. When you return to Normal, your paused
habits will resume where they left off."

**Why this is different from Habit Seasons (NEW-2) and Habit Freeze (D8):**
- Seasons are *calendar-based* (May-September) and auto-activate
- Freeze pauses *individual habits* manually
- Life Phases pause/adjust *groups of habits* based on *life circumstances*

Seasons model the calendar. Freeze models individual habits. Life Phases
model the *person's current situation*. They're orthogonal.

**Why this fills a real gap:**
Life disruptions (new job, injury, travel, new baby) are the #1 cause of
complete habit system collapse. When everything changes at once, users face
two bad options: (1) try to maintain all habits and fail miserably, or (2)
stop tracking entirely and lose months of momentum.

Life Phases offer a third option: consciously downshift to a sustainable
subset, preserve inactive habits' state, and upshift when ready. The logged
transition creates a record: "Recovery phase: 2 weeks. 3 core habits
maintained at 85%. Full routine resumed March 15."

**Implementation:**
- Schema: New `phases` array in data.json:
  `{ id, name, activeHabitIds: string[], isDefault: boolean }`
- Schema: Add `currentPhase: string` (ID) to app state
- Frontend: `<PhaseManager />` component in settings/sidebar
- Frontend: Phase indicator in header ("Currently: Travel mode")
- Frontend: Phase switch modal with "which habits stay active?" selector
- Frontend: Phase history log ("Normal → Travel: May 10, Travel → Normal: May 17")
- Backend: New `POST /api/phases`, `PATCH /api/phases/current`

**Effort:** Medium | **Dependencies:** None
**Gap filled:** Life transitions, systemic disruption handling

---

### C7: Monthly Memory Lane (Narrative Recap)

**What:** On the 1st of each month, auto-generate a visual "monthly recap"
card summarizing the previous month in narrative form:

> **April 2026 — Your Month in Review**
>
> You tracked **7 habits** across **30 days**, completing **183 of 210
> possible check-ins** (87%).
>
> **Star habit:** Meditation — 28/30 days, your longest streak yet.
> **Comeback story:** Exercise bounced back from a 3-day miss to finish
> the month at 80%.
> **New addition:** "Cold Shower" started April 15 and survived its first
> 2 weeks.
> **Retired:** "Social Media Limit" — archived after 45 days. Well done.
>
> **Your best day:** April 12 — 7/7 habits completed.
> **Toughest stretch:** April 18-20 — only 3/7 average (was that the
> conference?).
>
> See you in May.

The recap is designed to be *screenshot-able* and *shareable* — a single
card with good typography and the user's habit colors.

**Why this is different from Reports (#9) and Weekly Review (F10):**
- Reports are analytical dashboards with charts and filters
- Weekly Review is a guided reflection wizard (interactive)
- Memory Lane is a *pre-written narrative* — no interaction required, just read

The distinction matters: reports require interpretation, reviews require
effort, but a narrative recap is *consumed passively*. It's the difference
between reading a financial statement and reading a magazine article about
your finances. The narrative form creates emotional resonance that charts
can't match.

**Why it fills a real gap:**
No existing proposal produces *shareable content*. Social features (#16)
require auth and multi-user infrastructure. Memory Lane creates something
share-worthy with zero infrastructure — it's a beautiful card the user can
screenshot and post, text to a friend, or just enjoy privately.

The "story" format also provides the "look how far I've come" moment
that drives long-term retention. A heatmap shows data. A narrative says
"your star habit was Meditation." That's personal. That's motivating.

**Implementation:**
- Utils: `generateMonthlyRecap(habits, logs, month)` — compute stats and
  generate narrative text using template strings (no AI needed)
- Frontend: `<MonthlyRecap />` component — styled card with habit colors
- Frontend: Triggered on first visit after the 1st of each month
- Frontend: "View past recaps" gallery in settings/profile
- Frontend: Share button (copies image to clipboard or generates PNG via
  html2canvas or similar)
- Backend: Store recaps in data.json: `recaps: { [month]: RecapData }`

**Effort:** Medium | **Dependencies:** None (enhanced by Health Score [F2])
**Gap filled:** Narrative output, shareability

---

### C8: Smart Day Planner (Auto-Suggested Order)

**What:** Based on historical completion patterns, suggest an optimal order
for today's habits. The planner considers:

1. **Willpower curve:** Hard habits first (morning = highest willpower)
2. **Historical success time:** If you always meditate before exercise, keep
   that order
3. **Chain dependencies:** If habit A "leads to" habit B (see P5), A comes first
4. **Deadline urgency:** Habits with decay warnings (P2) float up

Display as a numbered checklist in the Quick Capture bar (NEW-3) or
Today View (N1): "Suggested order: 1. Meditate, 2. Exercise, 3. Read..."

Users can follow the suggestion or ignore it — it's advisory, not enforced.

**Why this fills a real gap:**
Every existing feature lets users *track* habits and *analyze* habits.
None help users *plan* their day. Decision fatigue ("which habit should I
do next?") is a real friction point, especially for users with 6+ habits.

The Smart Day Planner synthesizes data from multiple sources (difficulty,
time patterns, chains, urgency) into one actionable recommendation. It's
the app *thinking for you* so you can just execute.

**Why it works psychologically:**
- Pre-decided sequences reduce decision fatigue (Baumeister, *Willpower*)
- Tackling hard tasks when willpower is highest is a proven productivity strategy
- The suggestion creates a "game plan" feeling that increases perceived control
- Advisory (not mandatory) means users never feel restricted

**Implementation:**
- Utils: `suggestDayOrder(habits, logs, today)` — scoring algorithm combining:
  - Difficulty rating (P1) — higher difficulty = earlier in day
  - Historical completion hour (if timestamps available, N2)
  - Chain order (P5, if defined)
  - Streak risk (habits with at-risk streaks get priority)
- Frontend: "Suggested order" numbered list in Quick Capture or Today View
- Frontend: Simple reorder handle if user wants to customize
- No backend changes — purely derived from existing data

**Effort:** Medium | **Dependencies:** Enhanced by P1 (Difficulty), N2
(Timestamps), P5 (Chains). Works standalone with basic heuristics.
**Gap filled:** Forward-looking planning, decision fatigue reduction

---

### C9: Habit Effort-Reward Mapping (Quadrant Analysis)

**What:** Each habit gets two user-rated dimensions:
- **Effort:** How hard is this to do? (1-5)
- **Reward:** How much value does this add to your life? (1-5)

The app plots habits on a 2×2 quadrant chart:

```
        High Reward
            │
  GEMS      │    GRIND
  (easy +   │    (hard +
   valuable)│    valuable)
────────────┼────────────
  COMFORT   │    TRAPS
  (easy +   │    (hard +
   low value)│   low value)
            │
        Low Reward
  Low Effort        High Effort
```

- **Gems** (low effort, high reward): Protect these — they're your best habits
- **Grind** (high effort, high reward): Worth it, but schedule carefully
- **Comfort** (low effort, low reward): Fine to keep, but don't prioritize
- **Traps** (high effort, low reward): Consider dropping or redesigning

**Why this fills a real gap:**
Difficulty Tiers (P1) tracks only one dimension (effort). Time Budgeting
(N8) tracks only duration. No proposal models *perceived value*. But the
effort-reward ratio is the single most important factor in whether a habit
survives long-term.

Users often keep "trap" habits out of guilt or inertia ("I should practice
guitar...") while neglecting "gems" ("I always feel great after a walk but
I skip it"). The quadrant makes this visible.

**Why it works psychologically:**
- Externalizes the cost-benefit analysis users do unconsciously
- Gives permission to drop high-effort, low-value habits
- Identifies under-appreciated habits (the "gems" you take for granted)
- The visual quadrant is immediately intuitive — no explanation needed

**Implementation:**
- Schema: Add `effort: 1-5` and `reward: 1-5` to Habit (both optional, default 3)
- Frontend: Dual slider or star rating in HabitForm/edit modal
- Frontend: `<QuadrantChart />` — simple 2D scatter plot (SVG, no library needed)
- Frontend: Color-coded quadrant labels with actionable advice per quadrant
- Backend: Accept and persist the fields
- Periodic prompt: "Re-rate your habits' effort and reward?" (monthly)

**Effort:** Low-Medium | **Dependencies:** None
**Gap filled:** Effort recognition, strategic self-awareness

---

### C10: Completion Combos (Cross-Habit Daily Streaks)

**What:** When a user completes multiple habits on the same day, they
earn "combos" that accumulate into a separate cross-habit metric:

| Combo Level | Condition | Visual |
|-------------|-----------|--------|
| **Spark** | 3+ habits completed today | Small flame icon |
| **Flow** | 5+ habits completed today | Medium flame |
| **Perfect Day** | ALL habits completed today | Full fire + confetti |
| **Combo Streak** | Perfect Days for 3+ consecutive days | Multiplier badge |

Combos feed into the garden visualization (NEW-1): on combo days, the
entire garden blooms brighter. The dashboard shows "Combo Streak: 3 days"
alongside individual habit streaks.

**Why this fills a real gap:**
Every metric in the app operates at the *individual habit* level. No metric
rewards *breadth* — doing many habits in one day. Best Day Markers (F13)
annotate the calendar but don't create ongoing motivation. The combo system
makes cross-habit daily completion an explicit, trackable achievement.

**Why it works psychologically:**
- After completing 3 habits, the "I might as well finish all of them"
  impulse kicks in (sunk cost, used positively for once)
- The Combo Streak is more achievable than individual streaks (one miss in
  any habit breaks that habit's streak, but completing 5/7 habits still
  earns a Flow combo)
- Visual escalation (Spark → Flow → Perfect Day) creates satisfying
  progression within a single day
- The garden blooming brighter ties directly to the app's core metaphor

**Implementation:**
- Utils: `calculateDailyCombo(habits, logs, date)` — count completed today,
  return combo level
- Utils: `calculateComboStreak(habits, logs)` — consecutive Perfect Days
- Frontend: Combo indicator in header/dashboard
- Frontend: Flame icon animation (CSS keyframes, 3 levels)
- Frontend: Optional garden brightness modifier tied to combo level
- No backend or schema changes — purely derived from existing data

**Effort:** Low | **Dependencies:** None (enhanced by Garden [NEW-1])
**Gap filled:** Cross-habit motivation, breadth reward

---

## Part 3: Priority Matrix (New Proposals Only)

| Rank | ID | Feature | Impact | Effort | Reasoning |
|------|-----|---------|--------|--------|-----------|
| 1 | C1 | Warmup Ramp | 5 | Low | Addresses the #1 failure point (first week). Tiny schema change, huge behavioral impact. |
| 2 | C10 | Completion Combos | 5 | Low | Zero schema changes. Immediate daily motivation. Ties into garden metaphor. |
| 3 | C4 | Environmental Cues | 4 | Low | Core Atomic Habits concept with zero prior coverage. One field addition. |
| 4 | C3 | Streak Savings | 4 | Low-Med | Novel mechanic. No schema change. Natural complement to existing streaks. |
| 5 | C9 | Effort-Reward Map | 4 | Low-Med | Strategic self-awareness. Simple implementation, high insight value. |
| 6 | C5 | Confidence Calibration | 5 | Medium | Unique forward-looking feature. Novel psychology angle. |
| 7 | C7 | Monthly Memory Lane | 4 | Medium | Retention driver. Only shareable content the app produces. |
| 8 | C6 | Life Phase Modes | 5 | Medium | Addresses systemic disruption — the worst-case scenario for habit trackers. |
| 9 | C2 | A/B Habit Testing | 3 | Medium | Genuine differentiator. No other tracker offers this. |
| 10 | C8 | Smart Day Planner | 3 | Medium | Synthesis feature. More impactful after other features ship. |

---

## Part 4: Consolidated Master Backlog (All Documents)

This is every feature across all 8 documents (including this one), organized
by implementation phase with dependencies resolved. Features that appear in
multiple documents are listed once under the most complete description.

### Phase 1: Fix the Basics (Week 1-2)

Zero schema changes. Zero new dependencies. Make the MVP not embarrassing.

| ID | Feature | Source | Hours | Status |
|----|---------|--------|-------|--------|
| G1 | Edit Habit | BACKLOG | 2-3 | Not started |
| G2 | View/Restore Archived | BACKLOG | 2-3 | Not started |
| #3 | Undo Toast | FEATURES | 2-3 | Not started |
| G3 | Onboarding / Empty State | BACKLOG | 2-3 | Not started |
| N7 | Auto-Backup | BACKLOG | 2-3 | Not started |
| #14 | Theme Toggle | FEATURES | 1-2 | Not started |

**Exit criteria:** User can create, edit, archive, unarchive, delete habits.
Undo works. Backups happen automatically. Light theme available.

---

### Phase 2: Make It Feel Good (Week 3-4)

Motivation and emotional engagement. Still no schema changes.

| ID | Feature | Source | Hours | Status |
|----|---------|--------|-------|--------|
| F2 | Health Score | NEW_FEATURES | 3-4 | Not started |
| F4 | Failure Recovery | NEW_FEATURES | 2-3 | Not started |
| C10 | Completion Combos | **NEW** | 2-3 | Not started |
| C1 | Warmup Ramp | **NEW** | 3-4 | Not started |
| N3 | Momentum Stages | BACKLOG | 3-4 | Not started |
| NEW-1 | Living Garden (v1) | ROADMAP | 6-8 | Not started |
| NEW-3 | Quick Capture Bar | ROADMAP | 3-4 | Not started |
| #1 | Dashboard Stats | FEATURES | 3-4 | Not started |
| NEW-4 | Trophy Wall / Milestones | ROADMAP | 4-6 | Not started |

**Exit criteria:** The app has a visual garden, health scores, recovery
dashboards, combo motivation, warmup ramps for new habits, momentum stages,
quick-toggle bar, and milestone celebrations.

---

### Phase 3: Add Depth (Week 5-7)

First schema changes. Richer habit model.

| ID | Feature | Source | Hours | Status |
|----|---------|--------|-------|--------|
| C4 | Environmental Cues | **NEW** | 2-3 | Not started |
| C3 | Streak Savings Bank | **NEW** | 3-4 | Not started |
| C9 | Effort-Reward Mapping | **NEW** | 3-4 | Not started |
| F5 | Smart Rest Days | NEW_FEATURES | 6-8 | Not started |
| NEW-5 | Habit Journal | ROADMAP | 3-4 | Not started |
| NEW-2 | Habit Seasons | ROADMAP | 4-5 | Not started |
| N2 | Completion Timestamps | BACKLOG | 4-5 | Not started |
| #4 | Data Export | FEATURES | 2-3 | Not started |
| P10 | Minimum Viable Day | PROPOSALS | 2-3 | Not started |
| P2 | Streak Decay Warnings | PROPOSALS | 2-3 | Not started |

**Exit criteria:** Habits have cues, difficulty/reward ratings, flexible
schedules, journals, seasonal support. Timestamps capture when habits are
completed. Data is exportable.

---

### Phase 4: Intelligence & Engagement (Week 8-10)

Features that synthesize accumulated data into actionable intelligence.

| ID | Feature | Source | Hours | Status |
|----|---------|--------|-------|--------|
| C5 | Confidence Calibration | **NEW** | 5-6 | Not started |
| C7 | Monthly Memory Lane | **NEW** | 5-6 | Not started |
| P3 | Identity Statements | PROPOSALS | 2-3 | Not started |
| P4 | Contextual Check-In | PROPOSALS | 3-4 | Not started |
| F1 | Streak Shields | NEW_FEATURES | 4-5 | Not started |
| F3 | Habit Stacking | NEW_FEATURES | 5-6 | Not started |
| #5 | Heatmap | FEATURES | 5-6 | Not started |
| N1 | Today View / Focus Mode | BACKLOG | 3-4 | Not started |
| N10 | Personal Records | BACKLOG | 3-4 | Not started |
| F11 | Keyboard Shortcuts | NEW_FEATURES | 3-4 | Not started |
| G4 | Mobile Responsive | BACKLOG | 4-6 | Not started |

**Exit criteria:** Forward-looking prediction feature. Monthly narratives.
Identity-based motivation. Heatmap. Personal records. Stacking. Keyboard nav.
Mobile works properly.

---

### Phase 5: Advanced & Power Features (Week 11-14)

Features that benefit from months of accumulated data.

| ID | Feature | Source | Hours | Status |
|----|---------|--------|-------|--------|
| C6 | Life Phase Modes | **NEW** | 5-6 | Not started |
| C2 | A/B Habit Testing | **NEW** | 5-6 | Not started |
| C8 | Smart Day Planner | **NEW** | 5-6 | Not started |
| P1 | Difficulty Tiers | PROPOSALS | 2-3 | Not started |
| P6 | Weekly Intentions | PROPOSALS | 4-5 | Not started |
| P5 | Habit Chains | PROPOSALS | 5-6 | Not started |
| P8 | Anti-Habit Tracking | PROPOSALS | 4-6 | Not started |
| F7 | Habit Experiments | NEW_FEATURES | 4-5 | Not started |
| F8 | Insights Engine | NEW_FEATURES | 6-8 | Not started |
| F10 | Weekly Review Wizard | NEW_FEATURES | 5-6 | Not started |

**Exit criteria:** Full-featured habit tracking app with life phase support,
A/B testing, smart planning, anti-habits, experiments, and automated insights.

---

### Phase 6: Infrastructure & Scale (Deferred)

Only build after Phases 1-5 deliver a complete single-user experience.

| ID | Feature | Source | Hours |
|----|---------|--------|-------|
| #11 | Database Migration | FEATURES | 16-24 |
| #10 | Authentication | FEATURES | 16-24 |
| #15 | PWA / Offline | FEATURES | 12-16 |
| #2 | Categories / Tags | FEATURES | 4-6 |
| #12 | Habit Templates | FEATURES | 2-3 |
| #8 | Drag & Drop Reorder | FEATURES | 4-5 |
| #7 | Reminders | FEATURES | 4-6 |
| #9 | Reports Page | FEATURES | 6-8 |
| #6 | Habit Notes | FEATURES | 3-4 |
| #13 | Goals & Milestones | FEATURES | 4-5 |
| N4 | Streak DNA | BACKLOG | 4-5 |
| N5 | Correlation Map | BACKLOG | 5-6 |
| N6 | Adaptive Scaling | BACKLOG | 4-5 |
| N8 | Time Budgeting | BACKLOG | 3-4 |
| N9 | NL Input | BACKLOG | 5-6 |
| P7 | Time Capsule Snapshots | PROPOSALS | 5-6 |
| P9 | Power Hours | PROPOSALS | 4-5 |
| F6 | Mood Correlation | NEW_FEATURES | 6-8 |
| F9 | Micro-Habits | NEW_FEATURES | 8-10 |
| F12 | iCal Export | NEW_FEATURES | 4-5 |
| F14 | Habit Sunset Prompts | NEW_FEATURES | 2-3 |
| F15 | Import from Trackers | NEW_FEATURES | 5-6 |
| F13 | Best/Worst Day Markers | NEW_FEATURES | 2-3 |
| #16 | Social / Accountability | FEATURES | 12-16 |

---

## Part 5: Why These 10 (And Not Others)

| Feature | Behavioral Science Basis | Why No Prior Doc Covers It |
|---------|-------------------------|--------------------------|
| **C1: Warmup Ramp** | BJ Fogg's Tiny Habits: start absurdly small, scale up | All docs assume day 1 = full difficulty. Momentum Stages (N3) labels but doesn't adjust expectations. |
| **C2: A/B Testing** | Scientific method applied to personal behavior | Experiments (F7) test one habit. No doc proposes comparing alternatives. |
| **C3: Savings Bank** | Loss aversion: protecting something you earned | Shields (F1) are milestone-based. Savings reward over-performance specifically. |
| **C4: Environment Cues** | Atomic Habits' #1 strategy: make the cue obvious | Every feature is digital. None connect to the physical world where habits happen. |
| **C5: Calibration** | Tetlock's superforecasting: prediction improves judgment | Every feature is retrospective. No feature is forward-looking. |
| **C6: Life Phases** | Transtheoretical model: behavior change isn't linear | Seasons (NEW-2) are calendar-based. Freeze (D8) is per-habit. Nothing handles life-level disruption. |
| **C7: Memory Lane** | Narrative identity theory: stories > statistics | Reports are analytical. No feature produces shareable, narrative content. |
| **C8: Day Planner** | Baumeister's ego depletion: hard tasks first | No feature helps users *plan* their day, only track or analyze it. |
| **C9: Effort-Reward** | Prospect theory: perceived value drives sustained behavior | Difficulty (P1) is one-dimensional. No feature models perceived reward. |
| **C10: Combos** | Zeigarnik effect + sunk cost: near-completion drives finishing | All metrics are per-habit. Nothing rewards cross-habit daily breadth. |

---

## Part 6: Recommendation

**Don't implement these features yet.**

Phase 1 (the basics) isn't shipped. The most impactful thing to do right
now is build G1 (Edit Habit), G2 (Restore Archived), and #3 (Undo Toast) —
features that every user hits every day.

This document exists so that when Phase 1 ships and the question becomes
"what's next?", the answer is organized, researched, and ready — not
another brainstorming session.

**If forced to pick just 3 from this document to build first:**

1. **C10: Completion Combos** — zero schema changes, 2-3 hours, immediate
   daily motivation boost
2. **C1: Warmup Ramp** — tiny schema addition, addresses the biggest
   behavioral failure point
3. **C4: Environmental Cues** — one field, bridges digital and physical,
   core Atomic Habits strategy

These three features cost ~8 hours total and make the app meaningfully
smarter about human behavior.
