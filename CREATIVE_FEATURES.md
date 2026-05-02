# Habit Garden — Creative Feature Proposals (Round 2)

> Features that address gaps NOT covered in FEATURES.md, NEW_FEATURES.md, or
> BACKLOG.md. Each proposal targets a blind spot in the existing roadmap.

---

## Gaps Identified in Existing Roadmap

After auditing the 40+ features across three existing documents, the following
**themes are missing entirely:**

| Gap | Why it matters |
|-----|---------------|
| Anti-habits (breaking bad habits) | All current features assume *building* behavior. No support for *stopping* behavior. |
| Retrospective logging | Users can't backfill missed days. Real life doesn't happen in order. |
| Context/location awareness | Habits exist in physical contexts (home, gym, office) but the app ignores this. |
| Seasonal/cyclical habits | Some habits are only relevant part of the year. No lifecycle support. |
| External integrations & quick capture | No way to log a habit without opening the full app. |
| Accessibility | Zero a11y mentions in any document. |
| Habit dependencies (explicit) | Correlations [N5] detect implicit links; users can't declare "X requires Y." |
| Pre-commitment mechanisms | No way to commit to future behavior or create accountability in advance. |
| Focus/timer integration | Habits with duration have no built-in timer or focus mode. |
| Progressive difficulty ladders | Adaptive Scaling [N6] prompts after success; ladders are pre-planned progressions. |

---

## Proposed Features

### C1: Anti-Habits (Break Bad Habits)

**What:** A new habit type: "avoid" habits. Instead of tracking days you DID
something, track days you DIDN'T. The streak counts consecutive days of
*abstinence*. UI shows inverse visuals — empty cells are good (green), filled
cells are bad (red). Examples: "No social media after 9pm", "No sugary drinks",
"No snoozing alarm."

**Why this is missing and needed:**
Every existing feature assumes habits are positive actions to build. But half
of behavior change is *stopping* harmful patterns. The app's garden metaphor
works here too — anti-habits are "weeds" being pulled. Without this, users
either (a) awkwardly reframe negative goals as positives ("Go to bed without
phone" instead of "No phone in bed") or (b) use a different app entirely.

Breaking bad habits has different psychology: the streak is about *resistance*,
not *action*. The UI should reflect this — celebrating a "clean" day rather
than a "completed" day. A miss on an anti-habit feels different from a miss
on a positive habit, and the recovery framing should differ too.

**Scope:**
- Schema: Add `type: 'build' | 'break'` to Habit (default 'build')
- Frontend: Inverted color logic in day cells (empty = green, filled = red)
- Frontend: Different streak language ("X days clean" vs "X day streak")
- Utils: Same streak calculation, just inverted — streak = consecutive days
  WITHOUT a log entry
- Backend: Toggle endpoint logic unchanged — toggling marks a "slip"

**Effort:** Low | **Dependencies:** None. Works with existing schema with
minimal additions.

---

### C2: Retrospective Logging with Audit Trail

**What:** Allow users to log habits for past dates (up to 7 days back) with
a visual distinction. Retro-logged days show a dotted border or diagonal
stripe pattern to differentiate from real-time logs. An optional "reason"
field captures why the backfill happened ("forgot to log", "was offline").

**Why this is missing and needed:**
The current toggle only works for days visible in the 14-day grid, but
there's no explicit "backfill" concept. Life is messy — users forget to
open the app, go camping for a weekend, or simply fall asleep before
logging. Without retro-logging, these legitimate completions vanish.

But unrestricted backfilling undermines data integrity — a user could
retroactively "complete" their entire history. The 7-day window balances
flexibility with honesty. The visual distinction preserves trust in the
data: "I can see which days I logged in real-time vs. which I backfilled."

**Scope:**
- Schema: Add `loggedAt: string` (ISO timestamp) to log entries to
  distinguish real-time (loggedAt ≈ date) from retro (loggedAt > date + 1d)
- Backend: Toggle endpoint accepts optional `retroDate` param, validates
  within 7-day window
- Frontend: Day cells styled differently for retro entries (CSS hatching)
- Frontend: Clicking an older day cell shows a confirmation: "Log [habit]
  for [date]? This will be marked as a backfill."

**Effort:** Low-Medium | **Dependencies:** Benefits from Completion
Timestamps [N2] but can ship independently.

---

### C3: Context Tags & Smart Filtering

**What:** Each habit gets an optional `context` field (e.g., "home", "gym",
"office", "commute", "anywhere"). The app can filter by context, showing
only habits relevant to where the user currently is. Contexts are user-defined
but come with 5 suggested defaults.

A "Quick Context" bar at the top of the habit list lets users tap their
current context to filter instantly. Combined with Today View [N1], this
means: "Show me only the habits I can do RIGHT NOW in THIS place."

**Why this is missing and needed:**
Categories/Tags [#2] organize habits by *domain* (health, learning, work).
Contexts organize by *environment* — a fundamentally different axis. You
might have 3 "health" habits but one requires a gym, one requires a kitchen,
and one is anywhere. Domain tags don't help you decide what to do RIGHT NOW.

Context-aware filtering reduces the visible list to only actionable items,
which is critical on mobile. Showing "Go to gym" when you're in bed at 10pm
is noise. Context filtering makes the app responsive to the user's physical
reality.

**Scope:**
- Schema: Add `context: string | null` to Habit
- Frontend: Context filter bar (row of pills) above habit list
- Frontend: Active context stored in localStorage, auto-filters on load
- Backend: Accept and persist context field (no filtering server-side —
  all data still returned, filtering is client-side)

**Effort:** Low | **Dependencies:** None. Complementary to Categories [#2]
but orthogonal.

---

### C4: Seasonal & Lifecycle Habits

**What:** Habits can be configured with an active season or date range:
- "Active: Apr-Oct" (garden watering, cycling)
- "Active: Nov-Feb" (vitamin D supplements, SAD lamp)
- "Active: until Jun 15" (exam prep)
- "Active: starting Sep 1" (school-year habits)

Outside their active window, habits are automatically hidden from the daily
view (not archived — they return when the season comes back). Streaks pause
during inactive seasons without breaking.

**Why this is missing and needed:**
The current model assumes all habits are year-round. Real life is seasonal.
Exercise habits shift with weather. Diet habits shift with holidays. Study
habits follow academic calendars. Without seasonal support, users either:
- Manually archive/unarchive every season change (tedious, loses context)
- Leave seasonal habits visible year-round (creates guilt and clutter)
- Break streaks every winter/summer (demoralizing for correct behavior)

This is different from Smart Rest Days [F5] (which handles weekly patterns)
and Vacation Mode [F1] (which handles one-off absences). Seasons are
*recurring* lifecycle patterns.

**Scope:**
- Schema: Add `activeRange: { type: 'always' | 'seasonal' | 'temporary',
  months?: number[], startDate?: string, endDate?: string } | null` to Habit
- Frontend: "Active period" section in HabitForm (optional, collapsed by
  default)
- Frontend: Filter out seasonally-inactive habits from main view (show
  count: "3 habits inactive this season")
- Utils: `isHabitActiveToday(habit, today)` — respects seasonal config
- Utils: Streak calculation skips inactive periods (like vacation mode but
  automatic and recurring)

**Effort:** Medium | **Dependencies:** Smart Rest Days [F5] for shared
frequency logic. Can ship independently at reduced scope (just hide/show).

---

### C5: Focus Timer Integration

**What:** Habits with a duration component ("Meditate 10 min", "Deep work
1 hour") get an integrated countdown timer. Starting the timer opens a
focused view with:
- Large countdown display
- Habit name and color
- "Pause" and "Done early" buttons
- Auto-marks habit complete when timer finishes
- Optional ambient sound (white noise, rain — from a static audio file)

**Why this is missing and needed:**
Time-based habits are the hardest to verify — did you actually meditate
for 10 minutes, or did you just check the box? A timer creates an honest
commitment device. It also eliminates the "I'll do it later" problem:
starting the timer creates immediate engagement.

The Time Budgeting feature [N8] adds duration estimates but doesn't help
users *execute* on them. Focus Timer is the execution counterpart. Together
they answer "how long will my habits take?" (budgeting) and "let me do
them now" (timer).

This also opens a path to duration logging — automatically tracking how long
each session actually lasted, building a dataset for future analytics.

**Scope:**
- Frontend: New `<FocusTimer />` component (full-screen overlay)
- Frontend: "Start Timer" button on habits that have `estimatedMinutes`
- Frontend: Timer state in localStorage (survives page refresh)
- Frontend: `requestAnimationFrame` or `setInterval` for countdown
- Backend: No changes needed — timer completion triggers normal toggle
- Optional: `Notification API` alert when timer completes (background tab)

**Effort:** Medium | **Dependencies:** Time Budgeting [N8] for the
`estimatedMinutes` field, OR can independently add a `durationMinutes`
config to habits.

---

### C6: Pre-Commitment Contracts

**What:** Users can "pre-commit" to specific habits for the upcoming week.
On Sunday evening (or any chosen day), a prompt asks: "Which habits will
you definitely complete this week?" Selected habits get a ⭐ marker for the
week. At week's end, show how many pre-commitments were honored.

Over time, track "commitment reliability" — a percentage of pre-committed
habits actually completed. This creates a self-accountability metric:
"I follow through on 78% of my weekly commitments."

**Why this is missing and needed:**
Existing features measure *past* behavior (streaks, health scores, recovery).
Pre-commitment measures *future* intention vs. reality. This is a distinct
psychological lever — research on implementation intentions (Gollwitzer, 1999)
shows that explicitly committing to "when" and "what" increases follow-through
by 2-3x compared to vague goals.

It also surfaces overcommitment patterns: if a user pre-commits to 10 habits
but only completes 6, the reliability metric gently signals "commit to fewer,
execute on more." This pairs naturally with Time Budgeting [N8] to help users
plan realistically.

**Scope:**
- Schema: New `commitments: { weekOf: string, habitIds: string[],
  completed: string[] }[]` in a separate data section
- Backend: New `POST /api/commitments`, `GET /api/commitments/current`
- Frontend: Weekly commitment prompt (modal or dedicated step in Weekly
  Review [F10])
- Frontend: Star indicator on committed habits during the active week
- Frontend: "Commitment score" metric on dashboard

**Effort:** Medium | **Dependencies:** None. Pairs naturally with Weekly
Review Wizard [F10] but can ship alone.

---

### C7: Habit Dependency Chains (Explicit)

**What:** Users can declare explicit dependencies between habits:
- "Blocked by" — Habit B can't start until Habit A is complete today
  (e.g., "Review notes" blocked by "Attend lecture")
- "Enabled by" — Completing Habit A unlocks/highlights Habit B
  (e.g., completing "Warm up" enables "Exercise")
- "Conflicts with" — Completing Habit A disables Habit B for the day
  (e.g., "Rest day" conflicts with "Exercise")

Dependencies create a visual mini-graph in the Today View and determine
sort order (upstream habits appear first).

**Why this is missing and needed:**
Habit Pair Correlations [N5] *detects* statistical relationships
automatically. This feature lets users *declare* intentional relationships.
They're complementary:
- Correlations say "these tend to happen together" (observation)
- Dependencies say "this MUST happen first" (intention)

Habit Stacking [F3] groups habits into routines but doesn't model
conditional logic between them. Dependencies add real-world constraints:
you can't "Take medication with food" until you've "Eaten breakfast."

**Scope:**
- Schema: Add `dependencies: { type: 'blockedBy' | 'enables' | 'conflicts',
  habitId: string }[]` to Habit
- Frontend: Dependency config in edit modal (select from existing habits)
- Frontend: In Today View, gray out / lock blocked habits until blocker
  is complete
- Frontend: Subtle arrow or connector between linked habits
- Backend: Validate dependency references on create/update

**Effort:** Medium | **Dependencies:** Edit Habit [G1], Today View [N1].

---

### C8: Quick Capture API & Browser Extension

**What:** A lightweight REST endpoint (`POST /api/quick/:habitId`) that
toggles a habit for today with zero authentication friction (secured by a
personal API token). This enables:
- **iOS/Android Shortcuts** — One-tap widget on home screen to log a habit
- **Browser extension** — Small popup showing today's habits with toggles
- **CLI command** — `curl` one-liner for terminal users
- **Zapier/IFTTT** — Trigger habit completion from external events
  (e.g., Strava workout auto-completes "Exercise")

**Why this is missing and needed:**
The app currently requires opening a full web page to log a habit. This is
fine for the daily review session, but many habits happen *in context* — at
the gym, during a commute, right after an event. The faster the logging, the
more accurate the data.

A quick-capture API turns the app from a "check-in destination" into a
"background data collector." It also opens the door to automation: habits
that can be verified by external systems don't need manual logging at all.

**Scope:**
- Backend: New `POST /api/quick/:habitId` — same as toggle but accepts
  `token` query param for auth
- Backend: New `GET /api/token` — generates/retrieves a personal API token
  (stored in data.json)
- Frontend: "Quick Capture" settings page showing the token and example
  curl/shortcut recipes
- Future: Browser extension (separate repo, uses this API)

**Effort:** Low (API only) to Medium (with extension) | **Dependencies:**
None for the API. Extension is optional scope.

---

### C9: Accessibility Overhaul

**What:** A dedicated accessibility pass ensuring the app meets WCAG 2.1 AA:
- Semantic HTML (`<table>`, `<button>`, proper headings hierarchy)
- ARIA labels on all interactive elements (day cells, toggle buttons, streak
  badges)
- Keyboard navigation: Tab through habits, Enter/Space to toggle, arrow
  keys within the grid
- Focus indicators (visible focus rings, not just outline: none)
- Color contrast: ensure all text meets 4.5:1 ratio against dark background
- Screen reader announcements: "Meditation, day 5 streak, today: not
  completed. Press Enter to mark complete."
- Reduced motion: respect `prefers-reduced-motion` for animations
- High contrast mode: alternative theme with stronger borders and no
  gradient reliance

**Why this is missing and needed:**
Zero accessibility features are mentioned in any of the three existing
documents. This isn't a "nice to have" — it's a correctness issue. The
current dark theme with subtle gradients, small day-cell buttons (24px),
and no ARIA labels makes the app unusable for:
- Screen reader users (completely inaccessible — no semantic structure)
- Keyboard-only users (no focus management in the grid)
- Low-vision users (small targets, low contrast on some elements)
- Users with motor impairments (tiny click targets)

Accessibility work should happen BEFORE the app scales to more users, not
after. It's also often cheaper to build accessible from the start than to
retrofit later.

**Scope:**
- Frontend: Audit all components with axe-core or Lighthouse
- Frontend: Add ARIA labels, roles, and live regions
- Frontend: Implement roving tabindex in the day grid
- Frontend: Add `prefers-reduced-motion` media query guards
- Frontend: Ensure all colors pass contrast checks (may need theme tweaks)
- CSS: Minimum 44px tap targets (aligns with Mobile fix [G4])
- Testing: Add a11y tests with `jest-axe` or `@testing-library` queries

**Effort:** Medium | **Dependencies:** None. Should happen in Sprint 1-2
alongside mobile responsiveness [G4] since both affect tap targets and layout.

---

### C10: Progressive Habit Ladders

**What:** Users can define a multi-stage progression for a habit:

```
Stage 1 (Week 1-2):   Meditate 2 minutes
Stage 2 (Week 3-4):   Meditate 5 minutes
Stage 3 (Week 5-8):   Meditate 10 minutes
Stage 4 (Week 9+):    Meditate 20 minutes
```

The app automatically advances to the next stage when the timer expires
(based on calendar weeks or completion count). The habit name/description
updates to reflect the current stage. A progress bar shows position in the
overall ladder.

**Why this is missing and needed:**
Adaptive Scaling [N6] prompts users to level up *after* they demonstrate
consistency. Ladders are *pre-planned* progressions defined upfront —
like Couch-to-5K programs. They address a different user need:

- Adaptive Scaling: "You've been great at X. Want to try X+1?" (reactive)
- Ladders: "Here's the plan: weeks 1-2 do X, weeks 3-4 do Y..." (proactive)

Many real-world habit programs (C25K, meditation apps, language learning)
use ladders because they remove decision-making from the user entirely.
You just follow the plan. This is especially powerful for habits where
the user doesn't know what "good" looks like — they need a guided ramp.

Pre-built ladder templates ("Couch to 5K", "Meditation Beginner",
"Reading Challenge") can ship alongside Habit Templates [#12].

**Scope:**
- Schema: Add `ladder: { stages: { name: string, durationWeeks: number,
  description: string }[], currentStage: number, stageStartDate: string }
  | null` to Habit
- Frontend: Ladder builder in HabitForm (add stages, set durations)
- Frontend: Stage indicator and progress bar in HabitRow
- Frontend: Auto-advance logic (advance when weeks elapsed ≥ stage duration
  AND minimum completion % met)
- Backend: Persist ladder config and current stage

**Effort:** Medium-High | **Dependencies:** Time Budgeting [N8] for
duration-aware stages. Can work without it using simple week counts.

---

## Priority Matrix (New Features Only)

| ID | Feature | Impact | Effort | Score | Quick Win? |
|----|---------|--------|--------|-------|------------|
| C1 | Anti-Habits | 5 | Low | 25 | Yes |
| C9 | Accessibility | 5 | Medium | 20 | No, but urgent |
| C3 | Context Tags | 4 | Low | 20 | Yes |
| C2 | Retro Logging | 4 | Low-Med | 16 | Yes |
| C8 | Quick Capture API | 4 | Low | 20 | Yes |
| C6 | Pre-Commitment | 4 | Medium | 12 | No |
| C5 | Focus Timer | 4 | Medium | 12 | No |
| C4 | Seasonal Habits | 3 | Medium | 9 | No |
| C7 | Dependency Chains | 3 | Medium | 9 | No |
| C10 | Progressive Ladders | 4 | Med-High | 8 | No |

---

## Where These Fit in the Existing Roadmap

```
Sprint 1 (Foundation)     Add:  C1 Anti-Habits (trivial schema addition)
                                C9 Accessibility (start audit, fix critical issues)

Sprint 2 (Model)          Add:  C3 Context Tags (pairs with Categories [#2])
                                C2 Retro Logging (pairs with Timestamps [N2])
                                C8 Quick Capture API (no frontend needed)

Sprint 3 (Engagement)     Add:  C5 Focus Timer (pairs with Time Budgeting [N8])
                                C6 Pre-Commitment (pairs with Weekly Review [F10])

Sprint 4 (Intelligence)   Add:  C4 Seasonal Habits (advanced scheduling)
                                C7 Dependency Chains (advanced modeling)

Sprint 5 (Scale)          Add:  C10 Progressive Ladders (requires templates [#12])
```

---

## Reasoning: Why These 10 and Not Others

| Feature | Gap it uniquely fills |
|---------|----------------------|
| **C1 Anti-Habits** | Entire category of behavior change (stopping) has zero support. Affects ~50% of real habit goals. |
| **C2 Retro Logging** | Data accuracy. Without it, a weekend camping trip creates permanent gaps in an otherwise perfect record. |
| **C3 Context Tags** | Bridges the gap between "what habits exist" and "what can I do RIGHT NOW." No existing proposal addresses situational filtering. |
| **C4 Seasonal Habits** | Prevents streak death from correct seasonal behavior. Existing proposals only handle weekly/daily patterns. |
| **C5 Focus Timer** | Converts duration habits from honor-system checkboxes into verified commitments. Execution tool, not just tracking. |
| **C6 Pre-Commitment** | Only forward-looking accountability mechanism. Everything else measures the past. Research shows 2-3x follow-through improvement. |
| **C7 Dependency Chains** | Models real-world constraints between habits. Stacking [F3] is sequence; this is conditional logic. |
| **C8 Quick Capture** | Removes the "open app" friction. Enables automation and in-context logging. |
| **C9 Accessibility** | Not a feature — a correctness requirement. Currently excludes entire user populations. |
| **C10 Ladders** | Pre-planned progression for users who don't want to decide "what's next." Different psychology than reactive scaling [N6]. |

---

## Combined Backlog: Full Feature Count

After this document, Habit Garden's total feature inventory:

| Source | Features | Status |
|--------|----------|--------|
| Shipped | 8 core features | Done |
| BACKLOG.md (G1-G4) | 4 UX gaps | Planned |
| BACKLOG.md (N1-N10) | 10 new features | Planned |
| FEATURES.md (#1-#16) | 16 features | Planned |
| NEW_FEATURES.md (F1-F15) | 15 features | Planned |
| **This doc (C1-C10)** | **10 features** | **Proposed** |
| **TOTAL planned** | **55 features** | |

---

## Recommended Next Action

The backlog is now comprehensive (55 features). The next step should NOT be
adding more features. Instead:

1. **Consolidate** — Merge this document into BACKLOG.md as a new section
2. **Cut** — Identify features that overlap and eliminate duplicates
3. **Ship** — Start Sprint 1 (G1 Edit Habit, G2 Archived View, G3 Onboarding,
   C1 Anti-Habits, C9 Accessibility audit)

The biggest risk isn't missing features — it's analysis paralysis from
having 55 planned features and 0 being built.
