# Habit Garden — Consolidated Feature Plan

> **Status:** This document replaces all prior planning docs (FEATURES.md,
> NEW_FEATURES.md, FEATURE_PROPOSALS.md, BACKLOG.md, FEATURE_PLAN.md,
> FEATURE_PLAN_v3.md, ROADMAP.md). Those files are preserved as history.
>
> Last updated: 2026-05-08

---

## 1. Current State

**What exists (MVP, ~960 lines):**
- React 19 + TypeScript frontend, Express 5 backend
- Habit CRUD (create, archive, delete — no edit)
- Daily/weekly frequency toggle on a 14-day grid
- Streak calculation, dark theme, optimistic UI, toast notifications
- JSON file persistence with async mutex
- 17 backend integration tests, 0 frontend tests

**The real problem:** Six planning documents propose 55+ features. More words
about features than lines of code. Zero features shipped beyond the MVP.
This document takes a different approach: fewer ideas, more clarity, ruthless
prioritization, and a realistic scope.

---

## 2. New Feature Proposals

These 8 features fill gaps that none of the 55+ prior proposals address.
Each targets a specific blind spot in the existing planning.

---

### P1: Daily Progress Ring

**What:** A circular progress indicator pinned to the header showing today's
completion fraction (e.g., 3/7 habits). The ring fills radially as habits
are toggled. When all habits are complete, it plays a brief pulse animation
and shows a checkmark.

**Why this is different from Dashboard Stats (#1):**
Dashboard Stats is a panel with multiple metrics (completion rate, longest
streak, active habits). The Progress Ring is a single, glanceable element —
the answer to "am I done for today?" in under one second. Dashboard Stats
is for review; the ring is for the moment of action.

**Why it matters:**
The daily question isn't "what's my completion rate?" — it's "how many
habits do I have left?" A ring answers that instantly. It also creates a
natural "completion pull" — seeing 5/7 filled creates an urge to fill the
remaining two. This is the Zeigarnik effect (incomplete tasks create mental
tension) made visual.

**Implementation:**
- Frontend: `<ProgressRing />` component — SVG circle with stroke-dasharray
- Derived from existing habits + logs state (no backend changes)
- Position: header area, always visible
- Animates on toggle (stroke fills incrementally)
- Completion state: checkmark icon + subtle pulse

**Effort:** Low | **Dependencies:** None

---

### P2: "Two-Minute Rule" Quick Mode

**What:** Each habit has an optional "minimum version" text — the tiniest
possible action that still counts:

| Habit | Minimum Version |
|-------|----------------|
| Exercise 30 min | Put on shoes and step outside |
| Read 30 pages | Read one page |
| Meditate 20 min | Sit quietly for 2 minutes |
| Write 1000 words | Write one sentence |

A "Quick Mode" toggle in the header switches the display: habit names are
replaced with their minimum versions. Completing the minimum version counts
fully for the streak. The toggle persists in localStorage.

**Why this is different from Micro-Habits (F9):**
Micro-Habits changes the *completion model* — 25%/50%/75%/100% levels with
schema migration. Quick Mode changes the *display*. The data model is
untouched. A completion is a completion. The difference is psychological:
on a hard day, "put on shoes" feels doable while "exercise 30 min" doesn't.

**Why it matters:**
James Clear's "Two-Minute Rule" is the most-cited technique in Atomic Habits:
*"When you start a new habit, it should take less than two minutes to do."*
The principle is that showing up matters more than performing. Every habit
tracker models the full version of the habit. None model the scaled-down
starter step. This is the single most impactful behavioral intervention
that no existing proposal captures.

**Implementation:**
- Schema: Add `minVersion: string | null` to Habit
- Backend: Accept and persist the field (trivial PATCH addition)
- Frontend: Toggle button in header ("Quick Mode" / "Full Mode")
- Frontend: When Quick Mode is on, render `minVersion ?? name` in HabitRow
- localStorage: Persist toggle state

**Effort:** Low | **Dependencies:** Edit Habit (G1) for adding minVersion
to existing habits

---

### P3: Streak Insurance (Planned Absence)

**What:** A calendar view where users mark upcoming dates they'll be
unavailable (vacation May 15-22, business trip June 3-5). On insured dates,
all habits auto-pause — streaks freeze, health scores exclude those days,
the daily view shows "Day off (planned)."

**Why this is different from Streak Shields (F1):**
Shields are *reactive* — earned protection spent after an unexpected miss.
Insurance is *proactive* — declared before the absence happens.

**Why this is different from Seasons (NEW-2):**
Seasons are recurring annual patterns (swimming May-Sep). Insurance is
for one-off events (a specific vacation, surgery recovery, moving week).

**Why this is different from Habit Freeze (D8):**
Freezing is a manual per-habit toggle activated in the moment. Insurance is
a date range set in advance, applied globally. The mental model is "I'm
going on vacation next week" vs. "I need to pause this specific habit
right now."

**Why it matters:**
Users know in advance when they'll be unable to track. A planned 2-week
vacation shouldn't threaten months of streaks. Currently the options are:
forget and watch streaks break, or remember to freeze/shield each habit
individually on each day. Insurance eliminates this entire class of anxiety
with one proactive action.

**Implementation:**
- Schema: New `plannedAbsences: { start: string, end: string, label?: string }[]`
  in data.json (global, not per-habit)
- Backend: CRUD endpoints for absences
- Frontend: Simple calendar/date-range picker in a settings panel
- Utils: `isPlannedAbsence(date)` check in streak calculation
- Frontend: Visual indicator on insured dates in the 14-day grid

**Effort:** Medium | **Dependencies:** None

---

### P4: Habit Contribution Score (Portfolio View)

**What:** A "portfolio" panel showing each habit's contribution to overall
consistency:

```
Exercise      ████████░░  22% of completions  (92% consistent)
Meditation    ███████░░░  18% of completions  (85% consistent)
Reading       ██████░░░░  15% of completions  (78% consistent)
Water         █████████░  24% of completions  (96% consistent)
Journaling    ███░░░░░░░   8% of completions  (42% consistent)  ⚠ drag
```

Identifies:
- **Anchor habits:** High contribution + high consistency (protect these)
- **Drag habits:** Low consistency, pulling down overall average (prune or adjust these)
- **Steady habits:** Moderate contribution, steady consistency (maintain)

**Why it matters:**
No existing feature helps users understand which habits are *carrying*
their consistency and which are *dragging* it down. This transforms
pruning from a guilt-laden emotional decision into a data-driven portfolio
rebalancing. "Journaling at 42% isn't bad — it's information. Either
adjust it to 3x/week or replace it with something sustainable."

This is different from Dashboard Stats (#1), which shows aggregate numbers.
The portfolio shows *relative contribution* — it answers "where is my
consistency coming from and where is it leaking?"

**Implementation:**
- Utils: `calculatePortfolio(habits, logs)` — per-habit completion rate +
  share of total completions over rolling 30 days
- Frontend: `<PortfolioPanel />` with horizontal bars and labels
- Frontend: "Anchor" and "Drag" badges based on thresholds
- No backend changes — derived from existing log data

**Effort:** Low-Medium | **Dependencies:** None

---

### P5: Difficulty Decay Tracker

**What:** After completing a habit, the user can optionally rate how hard it
felt: Easy / Medium / Hard (1-3 scale, single tap). Over time, chart the
declining difficulty:

```
Exercise difficulty over time:
Week 1:  ■■■ Hard
Week 2:  ■■■ Hard
Week 3:  ■■  Medium
Week 4:  ■■  Medium
Week 6:  ■   Easy        ← habit is becoming automatic
```

**Why this is different from Momentum Stages (N3):**
Momentum Stages assign lifecycle stages based on a fixed timeline (0-7 days
= Seedling, 8-21 = Growing, etc.). Difficulty Decay uses *subjective data*
from the user. A habit could be 60 days old but still feel Hard — or 10
days old and already feel Easy. Stages model time; Decay models experience.

**Why it matters:**
The most rewarding part of habit formation is feeling it get easier. But
current tracking only shows *whether* you did it, never *how it felt*.
The declining difficulty curve is itself the reward — visible proof that
you're changing. "Exercise felt Hard for 3 weeks, then Medium for 2, and
now it's Easy" is more motivating than any streak number.

This also serves as an early warning: if difficulty *increases* over time,
the habit may be heading toward burnout. Rising difficulty is a signal to
scale down — catching the problem before the streak breaks.

**Implementation:**
- Schema: Extend log entries to include optional difficulty:
  `logs[habitId] = ["2026-05-01", { date: "2026-05-02", difficulty: 2 }]`
  (backward-compatible: string entries = no difficulty recorded)
- Backend: Accept optional `difficulty` field on toggle
- Frontend: After toggling on, show a small 3-button difficulty picker
  (auto-dismiss after 3 seconds if ignored — not mandatory)
- Frontend: `<DifficultyChart />` mini sparkline in habit row or detail view
- Utils: `calculateDifficultyTrend(logs)` — rolling average over time

**Effort:** Medium | **Dependencies:** None (schema extension is backward-compatible)

---

### P6: Weekly Momentum Chart

**What:** A simple line chart showing weekly completion rate over time. Each
data point is one week. The x-axis spans all tracked history. The y-axis is
0-100% completion.

```
100% ─                    ╭───╮
 80% ─    ╭──╮   ╭──╮  ╭─╯   ╰─╮
 60% ─ ╭──╯  ╰───╯  ╰──╯       ╰──
 40% ──╯
 20% ─
  0% ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
      W1  W2  W3  W4  W5  W6  W7  W8
```

Optionally show a 4-week moving average trendline to smooth out noise.

**Why this is different from Heatmap (#5):**
A heatmap is a per-day, per-habit calendar view — detailed and dense. The
Weekly Momentum Chart is a single aggregate line — the simplest possible
answer to "am I getting better or worse over months?" One requires careful
reading; the other communicates trend at a glance.

**Why it matters:**
The 14-day grid shows recent history. The heatmap (proposed) shows detailed
history. Neither shows the *trend*. A user who's at 75% this week doesn't
know if that's an improvement or a decline without looking at prior weeks.
The momentum chart shows trajectory — the single most important long-term
metric.

This is also the lightest-weight visualization that justifies long-term
tracking. After 2-3 months, the chart becomes genuinely interesting
("my dip in March was when I was sick, then I recovered to 90% in April").
It rewards users for sticking with the app.

**Implementation:**
- Utils: `calculateWeeklyRates(habits, logs)` — aggregate completion per
  calendar week
- Frontend: `<MomentumChart />` — SVG line chart (no library needed for a
  simple line; or use a lightweight lib like `uPlot` if available)
- Frontend: Place in a dashboard/stats section or as a collapsible panel
- No backend changes — derived from existing log data

**Effort:** Medium | **Dependencies:** None

---

### P7: Habit Renewal Prompts

**What:** At configurable intervals (default: every 30 days), prompt the
user to consciously re-commit to each habit:

> **Meditation** — 30 days tracked (82% completion)
>
> Does this habit still serve you?
> [ Keep going ] [ Adjust frequency ] [ Archive ]

The prompt surfaces at the top of the app as a gentle card, not a modal.
It can be snoozed for 7 days.

**Why this is different from Sunset Prompts (F14):**
Sunset triggers on *inactivity* (14+ days without completion). Renewal
triggers on *sustained activity*. They address opposite problems:
- Sunset catches abandoned habits
- Renewal catches "zombie habits" — habits maintained out of inertia or
  guilt rather than genuine value

**Why it matters:**
A habit that was meaningful in January might be meaningless in May. But
because the streak is at 120 days, the user keeps doing it to avoid
"losing" the streak. This is the sunk-cost fallacy applied to habits.
Periodic renewal forces a conscious decision: is this still worth my
time? It gives users *permission* to stop — which, counterintuitively,
makes the habits they keep more meaningful.

This complements Autopilot Detection (C8), which suggests graduating
*successful* habits. Renewal addresses the broader question of whether
the habit is still *wanted*, regardless of success.

**Implementation:**
- Schema: Add `lastRenewedAt: string | null` to Habit (set on creation
  and on each renewal decision)
- Backend: Persist the field
- Frontend: `<RenewalPrompt />` card component, shown when
  `today - lastRenewedAt > 30 days` for any active habit
- Frontend: "Keep" resets the timer; "Adjust" opens edit; "Archive" archives
- Snooze: store dismissal in localStorage for 7 days

**Effort:** Low | **Dependencies:** Edit Habit (G1)

---

### P8: Completion Heatstrip (Inline Year View)

**What:** A thin horizontal strip in each habit row showing 90 days of
history as colored cells (similar to GitHub's contribution graph, but
horizontal and inline). Each cell is a tiny square (~4px):

```
Exercise  [■■■■□■■■■■■□■■■■■■□■■■■■■□■■□□■■■...] 87%  streak: 12
```

- Filled = completed
- Empty = missed
- Gray = rest day or planned absence
- Today = highlighted border

**Why this is different from Streak DNA (N4):**
Streak DNA is described as a "barcode/fingerprint" — an artistic,
compact visualization. The heatstrip is purely functional: a literal
90-day pixel grid. No artistic interpretation, just raw data density
packed into the habit row itself.

**Why this is different from Heatmap (#5):**
The heatmap is a full-page calendar view you navigate to. The heatstrip
is *inline* — always visible in every habit row. It answers "what does
this habit's history look like?" without leaving the main view.

**Why it matters:**
The 14-day grid is the app's primary visualization, but 14 days is too
short to reveal patterns (weekly dips, monthly cycles, seasonal changes).
Extending to 90 days in a compact strip gives users a "long tail" view
without the overhead of a full heatmap page. It makes the main view
more information-dense for long-term users while remaining minimal
(it's just a thin row of colored pixels).

**Implementation:**
- Frontend: `<HeatStrip />` component — a row of tiny `<div>` or
  single `<canvas>` element, ~300px wide × 8px tall
- Renders in the habit row, either replacing or supplementing the
  14-day grid on wider screens
- All data derived from existing logs — no backend changes
- Color: use the habit's assigned color at varying opacity

**Effort:** Low-Medium | **Dependencies:** None

---

## 3. Consolidated Feature Backlog

Everything below is the full backlog: 8 new features (P1-P8) from this
document + the best features from prior docs, de-duplicated and prioritized.

### Scoring

**Priority Score = Impact (1-5) x Effort Inverse (5=trivial, 1=huge).**
Ties broken by dependency count (fewer = higher).

---

### Tier 1: Critical UX Gaps (Ship First)

These aren't features — they're missing basics.

| ID | Feature | Score | Effort | Notes |
|----|---------|-------|--------|-------|
| G1 | **Edit Habit** (name, color, frequency) | 25 | Small | PATCH endpoint + modal |
| G2 | **View & Restore Archived Habits** | 20 | Small | Collapsible section + unarchive endpoint |
| #3 | **Undo Toast** (5-second revert window) | 20 | Small | Re-toggle on undo, frontend only |
| G3 | **Onboarding / Empty State** | 20 | Small | Centered card + template starters |
| N7 | **Auto-Backup** (on every write, 7-day retention) | 16 | Small | File copy, prune by age |
| #14 | **Theme Toggle** (dark/light) | 15 | Small | CSS var swap + localStorage |

**Zero schema changes. Zero new dependencies. 1-2 week sprint.**

---

### Tier 2: Motivation & Daily Experience

Replace the fragile streak-only model. All frontend-derived — no backend changes.

| ID | Feature | Score | Effort | Notes |
|----|---------|-------|--------|-------|
| F2 | **Health Score** (0-100, rolling 30d weighted) | 20 | Low | Composite consistency metric |
| F4 | **Failure Recovery + Personal Records** | 20 | Low | Recovery dashboard, personal bests, comeback rate |
| P1 | **Daily Progress Ring** | 18 | Low | Circular completion indicator in header |
| #1 | **Dashboard Stats** (today's rate, longest streak, active count) | 16 | Low | Summary panel |
| NEW-1 | **Garden Visualization** (habit = plant, streak = growth) | 15 | Medium | App identity feature — SVG/CSS |
| C5 | **Streak Weather** (ambient background reflecting health) | 12 | Low-Med | Gradient shifts, no interaction needed |

---

### Tier 3: Core Model Improvements

Schema changes that unlock future features.

| ID | Feature | Score | Effort | Notes |
|----|---------|-------|--------|-------|
| F5 | **Smart Rest Days** (weekdays, 3x/week, Mon/Wed/Fri) | 20 | Medium | Replace daily/weekly binary |
| P2 | **Two-Minute Rule Quick Mode** | 18 | Low | `minVersion` field, display toggle |
| #4 | **Data Export** (JSON + CSV) | 12 | Low | Ship before model gets complex |
| N2 | **Completion Timestamps** | 12 | Medium | ISO timestamps, backward-compat migration |
| P3 | **Streak Insurance** (planned absence dates) | 12 | Medium | Global absence calendar |
| G4 | **Mobile Responsive** | 12 | Medium | 7-day grid, 44px tap targets on mobile |

---

### Tier 4: Insight & Engagement

Features that make accumulated data useful.

| ID | Feature | Score | Effort | Notes |
|----|---------|-------|--------|-------|
| P4 | **Habit Contribution Score** (portfolio view) | 15 | Low-Med | Anchor vs drag habit identification |
| P6 | **Weekly Momentum Chart** | 14 | Medium | Line chart of weekly completion over time |
| P8 | **Completion Heatstrip** (inline 90-day view) | 14 | Low-Med | Compact pixel grid per habit row |
| #5 | **Heatmap** (GitHub-style calendar) | 12 | Medium | Full-page per-habit visualization |
| P5 | **Difficulty Decay Tracker** | 12 | Medium | Subjective difficulty rating over time |
| F1 | **Streak Shields** (earned miss protection) | 12 | Medium | 1 shield per 14-day streak |
| P7 | **Habit Renewal Prompts** (periodic re-commitment) | 12 | Low | Every 30 days, conscious keep/adjust/archive |

---

### Tier 5: Organization & Power Features

Depth for users with 5+ habits and weeks of history.

| ID | Feature | Score | Effort | Notes |
|----|---------|-------|--------|-------|
| NEW-3 | **Quick Capture Bar** (always-visible toggle) | 14 | Low-Med | Persistent bottom bar for today's habits |
| F3 | **Habit Stacking / Routines** | 12 | Medium | Collapsible groups, "Complete All" |
| C1 | **Habit Cue Mapping** ("After coffee → Meditate") | 12 | Low | Cue field + prefix display |
| F11 | **Keyboard Shortcuts** (j/k/space/n) | 10 | Low-Med | Power user navigation |
| #8 | **Drag & Drop Reorder** | 9 | Medium | Persistent sort order |
| #2 | **Categories / Tags** | 12 | Medium | User-defined tags with filtering |

---

### Tier 6: Advanced (Build After Core Is Solid)

Features that need months of accumulated data or significant new infrastructure.

| ID | Feature | Notes |
|----|---------|-------|
| NEW-2 | **Habit Seasons** | Cyclical annual habits |
| NEW-4 | **Trophy Wall & Milestones** | Achievement system |
| NEW-5 | **Habit Journal** (daily one-liner) | Day-level context |
| C3 | **Habit Autopsy** | Structured reflection on dropped habits |
| C7 | **Ritual Builder** | Micro-step breakdown |
| C8 | **Autopilot Detection** | Graduate stable habits |
| F8 | **Insights Engine** | Pattern detection |
| N5 | **Correlation Map** | Inter-habit relationships |
| #9 | **Reports Page** | Weekly/monthly summary |
| F10 | **Weekly Review Wizard** | Guided reflection |

---

### Explicitly Deferred (Do Not Build Yet)

| Feature | Why Not Now |
|---------|-----------|
| Authentication | Single-user app — no deployment target yet |
| Database migration (SQLite) | JSON works fine at this scale |
| PWA / Offline | Large effort, no mobile user base yet |
| Social / Accountability | Requires auth |
| Mood & Energy Correlation | Daily mood logging is a second habit most won't sustain |
| Natural Language Input | Regex parsers for NL create more frustration than forms |
| iCal Export | Niche value |
| Import from Trackers | No users to migrate yet |
| Micro-Habits / Partial Completion | Breaking schema change — Ritual Builder and Quick Mode solve the same problem more simply |

---

## 4. Implementation Roadmap (4 Sprints)

### Sprint 1: Make It Usable (1-2 weeks)

**Goal:** Fix the gaps that make the app embarrassing to share.

```
Backend                              Frontend
──────                               ────────
PATCH /api/habits/:id  (G1)          Edit habit modal (G1)
POST /api/habits/:id/unarchive (G2)  Archived habits section (G2)
Auto-backup on write (N7)            Undo toast w/ 5-second window (#3)
                                     Theme toggle (#14)
                                     Onboarding empty state (G3)
                                     Daily Progress Ring (P1)
```

**Schema changes:** None.
**New dependencies:** None.
**Definition of done:** Users can create, edit, archive, unarchive, and
delete habits. Accidental toggles can be undone. Data is auto-backed up.
Theme works. A progress ring shows daily completion.

---

### Sprint 2: Make It Motivating (1-2 weeks)

**Goal:** The app stops punishing imperfection and starts rewarding consistency.

```
Backend                              Frontend
──────                               ────────
(none)                               Health Score badges (F2)
                                     Failure Recovery + Personal Records (F4)
                                     Dashboard Stats panel (#1)
                                     Garden visualization v1 (NEW-1)
                                     Streak Weather ambient bg (C5)
                                     Habit Contribution Portfolio (P4)
```

**Schema changes:** None — all derived from existing log data.
**New dependencies:** None.
**Definition of done:** The app has a health score replacing raw streak
emphasis, a recovery dashboard for broken streaks, a garden that gives
the app its visual identity, and ambient weather reflecting overall health.

---

### Sprint 3: Make It Smarter (2 weeks)

**Goal:** Schema improvements + features that require them.

```
Backend                              Frontend
──────                               ────────
Frequency model change (F5)          Smart Rest Days UI (F5)
Accept minVersion field (P2)         Two-Minute Rule Quick Mode (P2)
Planned absence CRUD (P3)           Streak Insurance calendar (P3)
GET /api/export (JSON/CSV) (#4)      Data Export button (#4)
                                     Weekly Momentum Chart (P6)
                                     Completion Heatstrip (P8)
                                     Mobile responsive fix (G4)
```

**Schema changes:** frequency model, minVersion field, plannedAbsences array.
**New dependencies:** None.
**Definition of done:** Habits support custom schedules. Users can plan
absences, use quick mode on hard days, export data, and see long-term trends.
Mobile works.

---

### Sprint 4: Make It Deep (2-3 weeks)

**Goal:** Features for users who've been tracking for 30+ days.

```
Backend                              Frontend
──────                               ────────
Accept difficulty field (P5)         Difficulty Decay Tracker (P5)
Renewal timestamp (P7)              Habit Renewal Prompts (P7)
                                     Full Heatmap page (#5)
                                     Streak Shields (F1)
                                     Quick Capture Bar (NEW-3)
                                     Cue Mapping (C1)
                                     Keyboard Shortcuts (F11)
```

**Schema changes:** difficulty on log entries, lastRenewedAt on habits,
shieldCount on habits, cue field on habits.
**Definition of done:** The app has deep engagement features — difficulty
tracking, renewal prompts, heatmaps, streak shields, quick capture, cue
mapping, and keyboard navigation.

---

## 5. New Feature Reasoning Summary

| Feature | Gap It Fills | Why 55+ Prior Proposals Missed It |
|---------|-------------|----------------------------------|
| **P1: Progress Ring** | Instant "am I done?" indicator | Dashboard Stats (#1) is a detailed panel. No one proposed the simplest possible daily completion element. |
| **P2: Quick Mode** | Scaled-down habit on hard days | Micro-Habits (F9) changes the data model. No one proposed changing just the *display* — the lightest possible intervention. |
| **P3: Streak Insurance** | Proactive planned absence | Shields (F1) are reactive. Seasons (NEW-2) are recurring. No one proposed one-off proactive planning. |
| **P4: Contribution Score** | Which habits carry vs drag you | Dashboard Stats shows aggregates. No one proposed *relative contribution* — which habits to protect vs prune. |
| **P5: Difficulty Decay** | Subjective ease-ification over time | Momentum Stages (N3) uses fixed timelines. No one proposed tracking how hard the habit *feels* — the most rewarding signal of habit formation. |
| **P6: Momentum Chart** | Long-term trend in one line | Heatmap (#5) is detailed. 14-day grid is short. No one proposed the simplest possible multi-month trend view. |
| **P7: Renewal Prompts** | Zombie habit prevention | Sunset (F14) catches *inactive* habits. No one proposed catching habits maintained out of *inertia* rather than value. |
| **P8: Heatstrip** | Inline 90-day history | Heatmap is a full page. Streak DNA (N4) is artistic. No one proposed a purely functional, inline long-tail view. |

---

## 6. Decision Log

| Decision | Rationale |
|----------|-----------|
| 4 sprints, not 6 | A 14-week plan for a 960-line app is over-planning. Ship in 8 weeks, reassess. |
| Progress Ring over more dashboard metrics | The daily action question is "how many left?" — one element answers it better than a panel. |
| Quick Mode over Micro-Habits (F9) | Same behavioral benefit (reduce all-or-nothing anxiety), zero schema migration. Display-only change. |
| Streak Insurance alongside Shields | Different mental models: insurance = planned, shields = earned. Both needed; insurance is cheaper. |
| Contribution Score before Insights Engine | Simple bar chart with immediate actionability vs. complex pattern detection that needs months of data. |
| Difficulty Decay as optional data | Not mandatory — auto-dismisses if ignored. Doesn't slow down the core toggle flow. |
| Weekly Momentum over Reports Page | A single line chart ships in 1 day. A Reports Page is a multi-week project. Get the trend out fast. |
| Renewal Prompts as a gentle card | Not a blocking modal. Snooze-able. Users must opt in to archiving; the prompt just asks the question. |
| Heatstrip inline over full-page-only Heatmap | Most users won't navigate to a separate page. Inline data density reaches users where they already are. |
| Preserve old planning docs | Historical reference. Don't delete — just stop referencing them for planning. This doc is the source of truth. |
| No AI/ML for any feature | Deterministic logic is explainable, fast, and free of API dependencies. |
| Defer all infrastructure | Auth, DB, PWA — none of these matter until the daily experience is excellent. |

---

## 7. What Not to Do

1. **Don't write another planning document after this one.** Ship code.
2. **Don't build infrastructure before features.** No database, no auth,
   no PWA until core experience is excellent.
3. **Don't add features that need 60+ days of data.** Insights Engine,
   Correlation Map, and pattern detection are great — after users have
   been using the app for months. Build retention first.
4. **Don't make any feature mandatory.** Difficulty ratings, journals,
   cue mapping, minVersion — all optional. The core toggle must stay
   frictionless.
5. **Don't optimize for hypothetical users.** Build for one person using
   the app daily. Multi-user, social, and scale features come later.
