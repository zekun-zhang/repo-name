# Habit Garden — New Feature Proposals & Backlog Audit

**Date:** 2026-09-27
**Author:** Automated codebase review (scheduled)

---

## Observation: Planning Debt

The repo has 14 commits. 13 are planning documents. Zero features have shipped
since the initial commit. The existing PLAN.md is thorough (40 items, 7 phases,
8 novel features with behavioral science citations). Adding more planning
without shipping creates "planning debt" — the illusion of progress.

**Recommendation:** Before adding features to the plan, ship the top 3 items
from Phase 1 (Edit Habit, API Error Handling, Minimum Viable Day). Each is
small enough for a single session. This converts planning energy into shipped
code.

That said, three genuinely novel feature concepts emerged from analyzing the
codebase against what the existing plan covers. These address dimensions no
prior planning document has touched.

---

## New Feature Proposals

### F1. Habit Autopsy (Learn from Abandonment)

**What:** When a user archives a habit, or when the app detects a habit has
been untouched for 14+ days, offer a brief "autopsy" prompt:

1. "What got in the way?" — three tappable options: **Too hard**, **Forgot**,
   **Lost interest**, plus a one-line free text field.
2. "Would a smaller version work?" — if "Too hard", suggest creating a
   reduced-scope replacement (e.g., "Run 5km" → "Walk 10 minutes").
3. Store the autopsy alongside the archived habit.

Over time, autopsy data reveals patterns: "You've abandoned 4 habits tagged
'Too hard.' Consider starting smaller next time." This insight appears in
the Weekly Compass or on the habit creation screen.

**Why this is novel:** Every habit tracker records *what* you did. None records
*why you stopped*. The plan's existing features (Streak Recovery, Grace Days,
Quiet Weeks) help you survive rough patches. Autopsy helps you learn from the
ones you didn't survive. Failure data is the most valuable data in behavior
change — it's where the actionable lessons live.

**Behavioral science:** Schon's "reflective practice" — structured reflection
on failure produces learning that unexamined failure doesn't. Also relates to
growth mindset (Dweck): framing abandonment as data rather than defeat.

**Data model:** Add `autopsy?: { reason: string, note?: string, date: string }`
to the Habit type. Pure additive, no breaking changes.

**Effort:** Small. One modal component, one optional field, pattern detection
in existing log data.

**Depends on:** Edit Habit (#1) and View Archives (#2) from Phase 1.

---

### F2. Habit Weather Forecast (Predictive Risk Alerts)

**What:** Based on historical completion patterns, the app displays a simple
"weather forecast" for each habit at the start of the week:

- **Sunny** (>80% historical completion on this day): "Exercise is strong on
  Tuesdays — keep it up."
- **Cloudy** (50-80%): No alert, normal display.
- **Rainy** (<50%): "Heads up: you usually skip Reading on Fridays. Plan ahead?"

The forecast is a small icon (sun/cloud/rain) on each day cell in the upcoming
week. It's purely derived from existing log data — no ML, just day-of-week
completion percentages over the past 8 weeks.

**Why this is novel:** The existing plan has backward-looking analytics (Phase
5) and forward-looking intention-setting (Weekly Compass, N4). But neither
makes *predictions*. A prediction is different from both reflection and
intention: it says "here's what's likely to happen based on your patterns"
and lets you preempt it. Weather metaphors are intuitive and non-judgmental
— "rainy" doesn't mean you failed, it means conditions are challenging.

**Behavioral science:** Implementation intentions (Gollwitzer) are most
effective when paired with obstacle anticipation. "If it's Friday and I
usually skip reading, then I'll read during lunch" — the forecast provides
the "if" condition that makes the intention specific.

**Data model:** None. Pure computation over existing logs. Could be memoized
in a useMemo hook.

**Effort:** Small. A utility function, three weather icons, conditional
rendering on day cells. Needs 8+ weeks of data to be meaningful, so it
naturally gates itself.

**Depends on:** Nothing. Can ship independently.

---

### F3. Time Capsule (Self-Addressed Motivation)

**What:** When creating or editing a habit, users can write a short "Time
Capsule" message (max 280 chars) that unlocks after a streak milestone:

- "Open at 7 days": A note of encouragement from past-you.
- "Open at 30 days": A reflection on why this habit matters.
- "Open at 90 days": What you hope to have become.

When the milestone is reached, the capsule opens with a special animation
(an envelope unfurling, a sealed bottle opening). The message is displayed
once, then moves to a "Capsule Archive" viewable anytime.

Users can also write capsules for themselves at any time, locked to a
future date (not streak-based): "Open on December 1st."

**Why this is novel:** Every existing and planned feature is about the system
talking *to* the user (streaks, celebrations, suggestions, forecasts). Time
Capsule is the user talking to their *future self*. This creates emotional
investment that no algorithmic celebration can match — the message is personal,
written in their own words, at a moment when they chose this habit.

The 280-char limit forces conciseness. The lock mechanism creates anticipation
— a known psychological driver of engagement (Cialdini's commitment principle:
writing down a goal increases follow-through).

**Behavioral science:** Self-authoring interventions (Pennebaker, Jordan
Peterson's research) show that writing about personal goals and values
improves outcomes more than external rewards. The capsule is a micro
self-authoring exercise embedded in the habit flow.

**Data model:** Add optional `capsules?: { message: string, unlockAt: { type: 'streak', days: number } | { type: 'date', date: string }, opened?: boolean }[]` to Habit. New lightweight collection also works.

**Effort:** Small-Medium. Capsule creation form, unlock detection in streak
calculation, reveal animation, archive view.

**Depends on:** Edit Habit (#1). Works well with Completion Sparks (N8).

---

## Existing Plan Audit: What to Cut, What to Merge

The current PLAN.md has 40 backlog items. That's too many for a ~960-line app
with one developer. Some items overlap or could be merged.

### Merge candidates

| Items | Merged as | Rationale |
|-------|-----------|-----------|
| N2 (Grace Days) + N7 (Quiet Weeks) | **Planned Rest** | Both are "pre-declared rest that doesn't break streaks." A single feature with day-level and week-level granularity is simpler than two separate features. |
| N3 (Energy Check-In) + #7 (MVD) | **Daily Calibration** | Energy level determines which habits are shown; MVD defines which ones are "core." These are the same feature: adaptive daily expectations. |
| #22 (Streak Recovery) + N2 (Grace Days) | Already partially merged in Phase 4 | Streak Recovery is the fallback when Grace Days aren't enough. Keep both but implement together. |
| #28 (Dashboard) + #29 (Heatmap) + #30 (Timestamps) + #31 (Correlation) | **Insights Tab** | Four separate "data view" features should be one tabbed view, not four releases. |

### Cut candidates

| Item | Why cut |
|------|---------|
| #39 (Data Import from Habitica/Loop) | No user base to migrate. Add only if users request it. |
| #35 (Accountability Snapshot) | Requires canvas rendering, image generation, sharing UX — high effort for an edge-case use. Defer until core is solid. |
| #26 (Habit Experiments) | Overlaps with Difficulty Progression (N5). "Try this for 30 days" is just a Level 1 → Level 2 transition with a deadline. |
| #13 (Completion Friction) | Three modes (instant/mindful-hold/verify) is over-designed for a checkbox. One mode is fine. Simplify to just "hold to confirm" as a global setting. |

### Unchanged priorities

The Phase 1 basics (#1-#6) and the Garden view (#15) remain correctly
prioritized. The garden is the product's identity and should ship before
analytics.

---

## Revised Priority Stack (Top 10)

Combining existing plan items with the 3 new proposals, ordered by
impact-to-effort ratio and dependency chain:

| Rank | Feature | Source | Effort | Why this rank |
|------|---------|--------|--------|---------------|
| 1 | Edit Habit | Plan #1 | S | Unblocks everything. Ship it. |
| 2 | API Error Handling | Plan #6 | S | One file fix. Prevents silent data loss. |
| 3 | Daily Calibration (MVD + Energy) | Plan #7 + N3 | S | Foundation for psychology features. Merged for simplicity. |
| 4 | Completion Sparks | Plan N8 | S | Zero backend. Immediate emotional payoff. |
| 5 | Theme Toggle | Plan #4 | S | Clean up vestigial CSS. Table stakes. |
| 6 | View & Restore Archives | Plan #2 | S | Completes the CRUD story. Needed for Autopsy. |
| 7 | Habit Weather Forecast | **New F2** | S | Zero backend. Leverages existing data. Unique differentiator. |
| 8 | Living Garden View | Plan #15 | M | The product's identity. Build it before analytics. |
| 9 | Habit Autopsy | **New F1** | S | Turns failure into learning. Novel. |
| 10 | Planned Rest (Grace Days + Quiet Weeks) | Plan N2+N7 | S-M | The retention feature. Merged for simplicity. |

**Time Capsule (F3)** ranks ~12th — high novelty but depends on Edit Habit and
benefits from the Garden view being in place (capsule reveal as a garden
animation is more impactful than a modal).

---

## Architecture Readiness

Before building beyond Phase 1, two small structural improvements would
prevent rework:

1. **Extract CSS variables.** App.css uses 338 lines of hardcoded colors. Pull
   them into CSS custom properties on `:root` so Theme Toggle (#4), Seasonal
   Rhythms (#18), and Garden View (#15) can share a palette. This is 30
   minutes of work and saves hours later.

2. **Add a `useLocalState` hook.** Energy Check-In, Habit Weather, and
   Completion Sparks all need client-side-only state (localStorage). A thin
   wrapper hook with try/catch (for private browsing) prevents duplicated
   boilerplate across three features.

Neither requires a data model change or API change.

---

## Summary

- **3 genuinely new features** proposed: Habit Autopsy (F1), Weather Forecast (F2), Time Capsule (F3)
- **4 merge opportunities** identified in existing plan (40 items → ~34)
- **4 cut candidates** identified (defer until user demand proves them)
- **Top 10 priority stack** established, interleaving new and existing items
- **Key insight:** The plan is comprehensive. The gap is execution. Ship Edit Habit, API Error Handling, and Daily Calibration in the next 3 sessions, then reassess.
