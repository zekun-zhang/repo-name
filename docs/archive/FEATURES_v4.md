# Habit Garden — Feature Roadmap v4

**Date:** 2026-09-28  
**Supersedes:** FEATURES_v3.md (2026-09-27)  
**Status:** Planning document — no code changes

---

## Executive Summary

This document proposes **5 novel features** not present in any prior planning
document, consolidates the backlog from 40 items to a **focused 20-item
roadmap**, and establishes a clear implementation sequence.

**Critical observation:** 14 commits exist. 13 are planning documents. Zero
features have shipped since the initial scaffold. This is the fourth planning
document in four days. The highest-value action is not another plan — it is
shipping Edit Habit (#1), API Error Handling (#2), and one psychology feature
to prove the concept.

This document is the last planning artifact before code. Everything after this
is implementation commits.

---

## Part 1: New Feature Proposals

Each feature addresses a dimension untouched by existing plans (PLAN.md's N1-N8,
FEATURES_v3's F1-F3). Prior proposals cover: habit relationships (N1), streak
preservation (N2, N7), energy adaptation (N3), intention-setting (N4), growth
tracking (N5), ambient visualization (N6), micro-celebrations (N8), failure
learning (F1), predictive alerts (F2), and self-addressed motivation (F3).

The following five features target the gaps that remain.

---

### G1. The 2-Minute Fallback

**What:** Every habit has an optional "minimum viable version" — the smallest
action that still counts as done.

- **Running 5km** → fallback: "Put on shoes and step outside"
- **Read 30 pages** → fallback: "Read one paragraph"
- **Meditate 20 min** → fallback: "Three deep breaths"

On low-energy days (integrates with Energy Check-In), the app shows the
fallback description instead of the full habit name. Completing the fallback
preserves the streak and counts as a full completion — because on a hard day,
showing up at all is the win.

The fallback field is optional. Habits without one behave as they do today.

**Why this is novel:** Every existing proposal treats a habit as a fixed unit:
you either did it or you didn't. The 2-Minute Fallback introduces *elastic
scope* — the habit itself flexes based on capacity. This is different from
Streak Insurance (N2), which forgives a miss; fallbacks prevent the miss by
lowering the bar. It's different from Energy Check-In (N3), which hides
non-core habits; fallbacks keep every habit visible but make each one
achievable.

**Behavioral science:** BJ Fogg's Tiny Habits methodology: "After I [anchor],
I will [tiny version of habit]." James Clear's "standardize before you
optimize." The core insight: identity is maintained by showing up, not by
performing at peak level. A 1-minute meditation still means "I am someone
who meditates."

**Data model:** Add optional `fallback?: string` (max 100 chars) to the Habit
type. No new endpoints — it's just a field on the existing habit object.

**Effort:** Small. One text input on the edit form, conditional label rendering
in HabitRow, integration with Energy Check-In's low-energy state.

**Depends on:** Edit Habit (#1). Enhanced by Energy Check-In (N3/merged as
Daily Calibration).

---

### G2. Phantom Streaks

**What:** When a streak breaks, the app doesn't just reset to zero. It shows
*two* numbers:

- **Current streak:** 3 days (the real, active streak)
- **Phantom streak:** 45 days (what the streak would be if you hadn't missed
  Sep 14)

The phantom streak is displayed as a faded, secondary number beneath the
current streak. As the current streak grows, it approaches the phantom. When
the current streak catches up (i.e., the gap between them is within grace-day
tolerance), the phantom and real streak merge with a small celebration.

If there are multiple breaks, the phantom streak shows the longest possible
contiguous run: "You've done this 52 of the last 55 days" is more meaningful
than "Streak: 3."

**Why this is novel:** The existing plan has three approaches to streak
psychology: Grace Days prevent breaks (N2), Streak Recovery Mode softens the
display (Plan #22), and Quiet Weeks pause streaks (N7). All three modify the
*streak itself*. Phantom Streaks don't modify anything — they add a second
lens: "Yes, your streak reset. But look at the bigger picture." This
reframes a broken streak as "almost perfect" rather than "failure."

It's the difference between "Streak: 0" and "52/55 days (95%). Current
run: 3 days." Same data, completely different emotional impact.

**Behavioral science:** Kahneman's loss aversion: losing a 50-day streak
feels worse than gaining 50 days felt good. Phantom streaks reduce perceived
loss by showing that most of the progress is intact. Framing effects
(Tversky & Kahneman): "95% completion" and "streak broken" describe the same
reality but trigger opposite emotions. The phantom streak provides the
positive frame automatically.

**Data model:** None. Pure computation over existing log data. The
`calculateStreak` utility already has the dates array — phantom streak is
calculated by finding the longest near-contiguous subsequence (allowing
N misses, where N = grace days or a fixed tolerance like 1-2).

**Effort:** Small. One utility function, one secondary display element in
HabitRow. No backend changes.

**Depends on:** Nothing. Can ship independently.

---

### G3. Narrative Milestones

**What:** At milestone streaks (7, 30, 60, 90, 180, 365 days), the app
generates a one-paragraph "story" about the habit's journey, synthesized
from actual log data:

> *"You started Exercise on March 1st. Your first week was perfect — 7 for
> 7. You hit a rough patch March 15–17 (3 missed days), but you came back
> on the 18th without skipping a beat. Your most consistent day is Tuesday
> (95%), and Fridays are your challenge (62%). You've now been at this for
> 90 days. Most habit attempts don't make it past 66. This one did."*

The narrative is generated client-side from log data using template
strings — no AI/ML needed. It picks out key data points: start date, first
miss, longest sub-streak, best/worst day of week, total completion rate,
and the milestone number. The templates vary so repeat milestones don't
feel formulaic.

The narrative appears as a card that slides in when the milestone is
reached. It can be dismissed or saved to a "Journey" log.

**Why this is novel:** Existing proposals offer numbers (Dashboard #28),
visual patterns (Heatmap #29), and user-written messages (Time Capsule F3).
None tell the user a *story* about their own data. Narrative is how humans
make meaning — a completion rate of 87% is a statistic; a story about
"your rough patch in March and how you came back" is an identity-forming
experience.

**Behavioral science:** Narrative identity theory (McAdams): people
understand themselves through the stories they tell about their lives.
A habit tracker that narrates your journey contributes to the "redemptive
narrative" structure — setbacks followed by persistence — which research
links to well-being and resilience.

**Data model:** None. Pure computation and templating over existing log
data. Optional `journeyLog` in localStorage for saved narratives.

**Effort:** Small-Medium. Template engine (5-10 templates with data
interpolation), milestone detection in streak calculation, card UI
component.

**Depends on:** Needs ~30+ days of data to be meaningful. Benefits from
Completion Sparks (N8) for the reveal animation.

---

### G4. The Ratchet (Habit Locking)

**What:** When a habit is well-established (configurable threshold, default
21 consecutive days), the user can "lock" it. A locked habit:

1. **Moves to a compact "Established" section** at the bottom of the habit
   list, taking one line instead of a full row with 14 day-cells.
2. **Shows only today's checkbox** and the streak count — no historical grid.
3. **Alerts only on danger** — if the streak is about to break (missed today
   and it's past 8pm, or missed yesterday), the habit visually "unlocks"
   and returns to the main section with a gentle highlight.
4. **Frees attention for developing habits** — the main table focuses on
   habits that need active cultivation.

The metaphor: a ratchet mechanism prevents backward slipping. Locked habits
are base camp — protected, maintained, but no longer the focus. Your
attention belongs on the summit: the new and struggling habits.

Unlocking is always manual. The auto-unlock on danger is visual only (it
highlights the habit), not structural (the user decides whether to keep
it locked or unlock it).

**Why this is novel:** Every habit tracker treats all habits equally —
day-1 habits and day-300 habits get the same screen space and visual
weight. But attention is finite. A user with 15 habits doesn't need to
see a 14-day grid for the ones they've been doing for a year. The Ratchet
introduces *attentional triage*: established habits recede, developing
habits get focus.

This is different from archiving (which removes habits entirely) and
from Categories/Tags (which groups habits by topic). The Ratchet groups
by *maturity* — how established the habit is — and dynamically adjusts
UI prominence.

**Behavioral science:** Attention allocation theory: willpower and
attention are limited resources. Spending them on habits that are already
automatic is waste. The Ratchet matches UI salience to where behavioral
intervention is most needed — the habits that haven't yet become automatic.

**Data model:** Add `locked?: boolean` and `lockedAt?: string` to the
Habit type. No new endpoints needed — it uses the existing edit/update
endpoint.

**Effort:** Small-Medium. One boolean field, compact row component,
conditional rendering to split habits into "developing" and "established"
sections, optional time-based danger detection (client-side).

**Depends on:** Edit Habit (#1). Works well with Difficulty Progression
(N5) — locked habits at high levels are a visual badge of mastery.

---

### G5. Habit Echoes (Asynchronous Self-Recognition)

**What:** At random intervals (every 5-15 days, configurable), the app
surfaces a single past completion as a brief "echo" notification at
check-in time:

> *"Echo: 3 weeks ago today, you completed your 7th consecutive day
> of Meditation. That was the start of a streak that lasted 26 days."*

> *"Echo: 6 weeks ago, you did Exercise on a Friday — one of only
> 4 Fridays you've ever completed it. That mattered."*

Echoes are designed to surprise. They surface achievements the user has
forgotten, moments of consistency they didn't celebrate at the time,
and turning points they didn't notice.

The randomness is intentional. Scheduled celebrations (weekly summaries,
milestone badges) become expected and lose emotional impact through
habituation. A random echo in the middle of a Tuesday reconnects you
with your past self's effort when you weren't expecting it.

Echoes appear as a subtle banner at the top of the app, auto-dismiss
after 8 seconds, and can be tapped to expand. They never appear more
than once per session.

**Why this is novel:** Existing proposals for motivation are either
milestone-based (Streak Milestones #36, Completion Sparks N8) or
scheduled (Weekly Compass N4, Dashboard #28). All are predictable —
you know when they'll appear. Echoes use a *variable reward schedule*,
which behavioral science consistently shows is more engaging than
fixed schedules. The random timing creates the dopamine of
unpredictability.

Echoes are also different from backward-looking analytics: analytics
say "your completion rate is 78%." An echo says "remember September
3rd? You showed up on a day most people wouldn't have." Analytics
inform; echoes affirm.

**Behavioral science:** Skinner's variable-ratio reinforcement — the
most powerful reinforcement schedule. Slot machines, social media feeds,
and surprise rewards all leverage this. Echoes apply it to
self-recognition rather than external reward. Also: nostalgia effect
(Sedikides et al.) — recalling past positive actions improves current
self-esteem and motivation.

**Data model:** Add `lastEchoDate?: string` and `echoFrequencyDays?: number`
to localStorage (not server). Echo selection is a pure function over
existing log data.

**Effort:** Small. One utility function to select noteworthy past events,
one banner component, localStorage for timing. No backend changes.

**Depends on:** Needs 3+ weeks of data to have material to echo. No
feature dependencies.

---

## Part 2: Consolidated Backlog

### What changed from PLAN.md v2 and FEATURES_v3

**Merged (per FEATURES_v3 recommendations, with adjustments):**
- N2 (Grace Days) + N7 (Quiet Weeks) → **Planned Rest** (day-level and
  week-level in one feature)
- N3 (Energy Check-In) + #7 (MVD) → **Daily Calibration** (energy determines
  visibility; core flag defines the threshold)
- #28 (Dashboard) + #29 (Heatmap) + #30 (Timestamps) + #31 (Correlation) →
  **Insights Tab** (one tabbed view, not four releases)
- #22 (Streak Recovery) absorbed into Phantom Streaks (G2) — phantom
  streaks are a superset of "Recovering: 3/7" display

**Cut:**
- #39 (Data Import from Habitica/Loop) — no users to migrate; add on demand
- #26 (Habit Experiments) — subsumed by Difficulty Progression (N5)
- #35 (Accountability Snapshot) — high effort, edge case; defer indefinitely
- #13 (Completion Friction) — over-designed; simplify to a single global
  "confirm completions" toggle if ever needed

**Added:**
- G1 (2-Minute Fallback), G2 (Phantom Streaks), G3 (Narrative Milestones),
  G4 (The Ratchet), G5 (Habit Echoes)

---

### The Roadmap: 20 Items in 5 Phases

#### Phase 1: Make It Work (Ship These First)

These fix real usability gaps. No creative features until these land.

| # | Feature | Effort | Why first |
|---|---------|--------|-----------|
| 1 | **Edit Habit** | S | Can't change name/color/frequency after creation. Blocks everything that modifies habits. |
| 2 | **API Error Handling** | S | `api.ts` never checks `res.ok`. A 500 response is silently treated as success. One-file fix. |
| 3 | **View & Restore Archives** | S | Archived habits vanish forever. No unarchive endpoint exists. Needed for Autopsy (F1). |
| 4 | **Theme Toggle** | S | `index.css` defines a full theme system that `App.css` ignores. Reconcile and add a toggle. |

**Exit criteria:** Users can create, edit, archive, unarchive, and delete
habits without data loss or confusion. Both light and dark themes work.

---

#### Phase 2: Make It Feel Good (Daily Experience)

Features that make the daily check-in fast, adaptive, and rewarding.

| # | Feature | Effort | Source | Why this phase |
|---|---------|--------|--------|----------------|
| 5 | **Daily Calibration** (MVD + Energy) | S | N3 + #7 merged | Foundation for adaptive UX. Core habits get a star; energy level dims non-core on hard days. |
| 6 | **2-Minute Fallback** | S | **New G1** | Pairs with Daily Calibration: low-energy days show fallback descriptions. Prevents misses by lowering the bar. |
| 7 | **Completion Sparks** | S | N8 | Zero backend. Context-aware micro-celebrations create the dopamine loop that drives daily return. |
| 8 | **Phantom Streaks** | S | **New G2** | Zero backend. Reframes broken streaks as "almost perfect." Replaces separate Streak Recovery feature. |
| 9 | **Habit Time Machine** | S | #14 | Arrow navigation beyond 14-day window. Small change, removes an artificial limitation. |

**Exit criteria:** The daily check-in takes < 60 seconds for 10+ habits,
adapts to energy level, celebrates completions, and doesn't punish a
single miss with a streak reset.

---

#### Phase 3: Make It Unique (The Garden + Identity)

The features that differentiate Habit Garden from every other tracker.

| # | Feature | Effort | Source | Why this phase |
|---|---------|--------|--------|----------------|
| 10 | **Living Garden View** | M | #15 | The product's identity. SVG plants reflecting habit health. Build this before analytics. |
| 11 | **Momentum Score** | S | #16 | Single 0-100 score drives garden health. Required by Heartbeat. |
| 12 | **Habit Heartbeat** | S | N6 | Pulsing ECG visualization makes momentum visceral. Ambient, not analytical. |
| 13 | **Narrative Milestones** | S-M | **New G3** | Template-generated stories at 7/30/90/365 days. The habit's biography. |
| 14 | **The Ratchet** | S-M | **New G4** | Established habits recede; developing habits get attention. Attentional triage. |

**Exit criteria:** The app has a visual identity no competitor matches.
Users with 3+ months of data see their habits as a living ecosystem with
a story, not just a spreadsheet.

---

#### Phase 4: Make It Humane (Psychology + Resilience)

Features that keep users through the hard times.

| # | Feature | Effort | Source | Why this phase |
|---|---------|--------|--------|----------------|
| 15 | **Planned Rest** (Grace Days + Quiet Weeks) | S-M | N2 + N7 merged | Pre-declared rest that doesn't break streaks. Day-level and week-level. |
| 16 | **Habit Autopsy** | S | F1 | Structured reflection on abandoned habits. Turns failure into data. |
| 17 | **Habit Weather Forecast** | S | F2 | Predictive day-of-week risk icons. "You usually skip Reading on Fridays." |
| 18 | **Habit Echoes** | S | **New G5** | Random surfacing of forgotten achievements. Variable-schedule self-recognition. |

**Exit criteria:** A user who misses days, has bad weeks, or abandons habits
feels understood and helped, not punished.

---

#### Phase 5: Make It Deep (Insights + Advanced)

For users with months of data who want self-knowledge.

| # | Feature | Effort | Source |
|---|---------|--------|--------|
| 19 | **Insights Tab** (Dashboard + Heatmap + Correlations) | M | #28-31 merged |
| 20 | **Weekly Compass** | M | N4 |

**Deferred indefinitely:** Habit Stacking (N1), Difficulty Progression (N5),
Time Capsule (F3), Categories/Tags (#37), Drag-and-Drop (#38), Data
Export (#34), PWA/Offline (#40), Anti-Habits (#27), Keyboard Shortcuts (#12),
Seasonal Rhythms (#18), Today Focus Mode (#11), Rest Day Patterns (#25),
Streak Milestones (#36), Daily Micro-Journal (#32), Time Investment (#33).

These are good ideas. They're deferred because they're either: (a) nice-to-have
after the core 20, (b) dependent on features above, or (c) effort-heavy without
proven demand. Any can be promoted when the first 20 are shipped.

---

## Part 3: Implementation Strategy

### The First Three Commits

These should be the next three commits in the repository. Each is a single
session of work.

**Commit 1: Edit Habit**
- Add `PUT /api/habits/:id` endpoint (validate same as POST)
- Add edit button to HabitRow that opens an inline edit form
- Reuse HabitForm with pre-filled values
- Add optimistic update in `useHabits`
- Add API error handling fix to `api.ts` (bundle with this — it's 10 lines)

**Commit 2: View & Restore Archives + Unarchive Endpoint**
- Add `POST /api/habits/:id/unarchive` endpoint
- Add collapsible "Archived" section below active habits table
- Show archived habits with "Restore" and "Delete" buttons
- Add the `fallback` field to Habit type (preparing for G1)

**Commit 3: Daily Calibration + Completion Sparks**
- Add `isCore: boolean` to Habit (defaults to false)
- Add star toggle in HabitRow and edit form
- Energy picker (3 icons) in app header, stored in localStorage
- Low energy: dim non-core habits, show "Focus on essentials"
- Completion Sparks: context-aware messages on toggle
  - First of day, all core done, streak milestone, all done, comeback

Each commit adds tests for new API endpoints and keeps the app working
end-to-end.

---

### Architecture Prep (Do Before Phase 2)

Two small refactors prevent rework across all future features:

1. **CSS custom properties.** Extract hardcoded colors from `App.css` into
   `:root` variables. This is required for Theme Toggle and benefits every
   future visual feature (Garden, Heartbeat, Seasonal Rhythms). ~30 min.

2. **Shared `useLocalState` hook.** Energy Check-In, Echoes, Weather
   Forecast, and Completion Sparks all need try/catch-wrapped localStorage.
   One hook prevents four copies of the same boilerplate.

---

## Part 4: Feature-by-Feature Reasoning Matrix

### Why each new feature (G1-G5) exists

| Feature | Dimension Addressed | Differentiation from Existing Plan | Behavioral Science | Effort | Backend? |
|---------|--------------------|------------------------------------|-------------------|--------|----------|
| G1: 2-Minute Fallback | Elastic scope — habit flexes with capacity | Grace Days forgive a miss; Fallback prevents the miss | BJ Fogg's Tiny Habits; James Clear's "standardize before optimize" | S | No (just a text field) |
| G2: Phantom Streaks | Loss reframing — broken streak shown as "almost perfect" | Streak Recovery shows "Recovering: 3/7"; Phantom shows "52/55 (95%)" | Kahneman's loss aversion; Tversky framing effects | S | No (computation) |
| G3: Narrative Milestones | Meaning-making — data becomes story | Dashboard shows numbers; Milestones tell the story | McAdams' narrative identity theory | S-M | No (templates) |
| G4: The Ratchet | Attentional triage — focus on what needs focus | Archive removes; Ratchet reduces prominence while protecting | Attention allocation; automaticity research (Lally et al.) | S-M | No (one boolean) |
| G5: Habit Echoes | Surprise self-recognition — random past achievements | Sparks celebrate now; Echoes celebrate then, unpredictably | Skinner's variable-ratio reinforcement; nostalgia effect | S | No (client-only) |

**Note:** All five new features require zero backend changes. They are
purely frontend features computed from existing data or adding a single
optional field. This is by design — the backend should change only for
structural needs (CRUD), not for presentation intelligence.

---

## Part 5: What NOT to Build (and Why)

| Tempting Feature | Why It's a Trap |
|-----------------|-----------------|
| Authentication / Multi-user | No user base. Adding auth adds 500+ lines, a session system, and deployment complexity for zero current users. |
| Database migration | JSON file is fine for single-user. SQLite migration is premature optimization. |
| Push notifications | Requires PWA, service worker, permission flow. Effort/value ratio is terrible until the core app is proven. |
| AI-generated insights | Needs data volume, API costs, and raises privacy questions. Template-based narratives (G3) achieve 80% of the value at 5% of the cost. |
| Gamification (XP, levels, badges) | Extrinsic motivation undermines intrinsic motivation (Deci & Ryan's self-determination theory). The garden metaphor is better — it's a mirror, not a scoreboard. |
| Social features (friends, challenges, leaderboards) | Requires auth, real-time sync, moderation. The app's strength is private self-improvement. Accountability Snapshot (deferred) is the right scope. |

---

## Appendix: Full Feature Inventory

Every feature ever proposed, with current status and disposition.

| ID | Feature | Origin | Status | Disposition |
|----|---------|--------|--------|-------------|
| 1 | Edit Habit | Plan v1 | Not started | **Phase 1** — build first |
| 2 | API Error Handling | Plan v1 | Not started | **Phase 1** — build first |
| 3 | View & Restore Archives | Plan v1 | Not started | **Phase 1** |
| 4 | Theme Toggle | Plan v1 | Not started | **Phase 1** |
| 5 | Daily Calibration | N3 + #7 merged | Not started | **Phase 2** |
| 6 | 2-Minute Fallback | New (G1) | Not started | **Phase 2** |
| 7 | Completion Sparks | Plan N8 | Not started | **Phase 2** |
| 8 | Phantom Streaks | New (G2) | Not started | **Phase 2** |
| 9 | Habit Time Machine | Plan #14 | Not started | **Phase 2** |
| 10 | Living Garden View | Plan #15 | Not started | **Phase 3** |
| 11 | Momentum Score | Plan #16 | Not started | **Phase 3** |
| 12 | Habit Heartbeat | Plan N6 | Not started | **Phase 3** |
| 13 | Narrative Milestones | New (G3) | Not started | **Phase 3** |
| 14 | The Ratchet | New (G4) | Not started | **Phase 3** |
| 15 | Planned Rest | N2 + N7 merged | Not started | **Phase 4** |
| 16 | Habit Autopsy | FEATURES_v3 F1 | Not started | **Phase 4** |
| 17 | Habit Weather Forecast | FEATURES_v3 F2 | Not started | **Phase 4** |
| 18 | Habit Echoes | New (G5) | Not started | **Phase 4** |
| 19 | Insights Tab | #28-31 merged | Not started | **Phase 5** |
| 20 | Weekly Compass | Plan N4 | Not started | **Phase 5** |
| — | Habit Stacking (N1) | Plan v2 | Not started | Deferred |
| — | Difficulty Progression (N5) | Plan v2 | Not started | Deferred |
| — | Time Capsule (F3) | FEATURES_v3 | Not started | Deferred |
| — | Categories/Tags (#37) | Plan v1 | Not started | Deferred |
| — | Drag-and-Drop (#38) | Plan v1 | Not started | Deferred |
| — | Data Export (#34) | Plan v1 | Not started | Deferred |
| — | PWA/Offline (#40) | Plan v1 | Not started | Deferred |
| — | And 8 others | Various | Not started | Deferred |
