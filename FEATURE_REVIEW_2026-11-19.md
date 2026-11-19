# Feature Review — November 19, 2026

## Project State

**App:** Habit Garden — a daily/weekly habit tracker with a 14-day completion grid.

**Codebase:** ~600 lines frontend (React 19 + TypeScript + Vite 8), ~180 lines backend (Express 5 + JSON file storage). No routing, no auth, no analytics, dark-mode only.

**Shipped features:** Create/edit/delete habits, archive/unarchive, binary daily/weekly completion toggling on a 14-day grid, streak calculation, optimistic UI updates, error toasts, responsive layout.

**Prior planning:** 135+ proposals across 28 series (A–BB), 36 documents, ~9,000 lines of planning. Zero proposals implemented. Five bug fixes shipped Nov 8. The planning-to-code ratio is now approximately 15:1.

---

## Honest Assessment

This document is number 37. The pattern is clear: each review acknowledges the planning surplus, promises to be different, then adds another layer of proposals. I will not pretend this one breaks the cycle — only code does that. What this document *can* do is provide a final, clean reference that replaces the 36 prior documents with one organized source of truth.

---

## 5 Novel Feature Proposals (CC-series)

These proposals target interaction patterns and behavioral insights that none of the 135 prior proposals addressed. Each is scoped, independent, and includes reasoning grounded in habit psychology research.

---

### CC1: Habit Stacking Chains

**What it is:** Link habits into ordered sequences based on James Clear's "habit stacking" technique — "After I [Habit A], I will [Habit B]." The UI shows chains visually, and completing one habit in a chain highlights the next one to do.

**Why no prior proposal covers this:** All 135 proposals treat habits as independent items. But habit formation research (Clear, 2018; Wood & Neal, 2007) shows habits form 2-3x faster when anchored to an existing behavior. The trigger is not willpower or a notification — it's the completion of the previous action.

**How it differs from "grouping" or "categories" (proposed in D-series, I-series):** Categories are organizational (labels). Stacking is behavioral (sequence). A category says "these are related." A stack says "do this one next."

**Data model change:**
```typescript
// Add to Habit type
stackAfter?: string   // habit ID this habit follows in a chain
```
- No new API endpoint needed — this is a field on the existing habit update endpoint.
- Frontend renders linked habits with a subtle connector line and auto-scrolls to the next habit when one is completed.
- Chains are optional. A habit without `stackAfter` behaves exactly as today.

**Behavioral reasoning:** The "implementation intention" effect (Gollwitzer, 1999) shows that specifying *when* and *where* you'll perform a behavior increases follow-through by 2-3x. Stacking provides both cues (when = after prior habit, where = same context) without requiring a time-of-day scheduler.

**Estimated effort:** ~60 min. One optional field, one visual connector, one auto-highlight behavior.

---

### CC2: Planned Rest Days (Streak Preservation)

**What it is:** Allow users to mark specific days as "planned rest" in advance. A planned rest day doesn't break a streak. The cell shows a distinct marker (a small dash instead of a checkmark or empty).

**Why this matters:** The current streak model is binary — any miss resets to zero. Research on "the what-the-hell effect" (Polivy & Herman, 2002) shows that when people break a streak, they often abandon the habit entirely ("I already ruined it, so why bother?"). Planned rest provides an escape valve that preserves momentum without lowering the bar.

**Why no prior proposal covers this:** Prior proposals addressed streak *display* (momentum scores, weighted averages, forgiving streaks) but never the *input* side — letting the user proactively plan the exception before it happens. The act of planning the rest is itself psychologically different from retroactively excusing a miss.

**Data model change:**
```typescript
// New type for log entries
export type HabitLog = {
  [habitId: string]: Array<string | { date: string; type: 'rest' }>
}
```
- Backward-compatible: existing string entries remain valid completions.
- New API: `POST /api/logs/rest` — marks a date as planned rest (future dates only). Same toggle pattern as completion.
- Streak calculation: `calculateStreak` skips planned rest days instead of breaking the chain.
- UI: Long-press or right-click on a future day cell to mark it as rest. Rest cells show "—" in a muted color.

**Behavioral reasoning:** This addresses the #1 reason people stop tracking: guilt from an inevitable miss. By normalizing rest as part of the plan, you shift from "perfect or failed" to "consistent with recovery" — the same model elite athletes use.

**Estimated effort:** ~50 min. Small data model extension, streak logic update, one new interaction on future cells.

---

### CC3: Habit Sunrise / Sunset (Auto-Lifecycle)

**What it is:** Each habit has an optional start date ("sunrise") and end date ("sunset"). Before sunrise, the habit appears dimmed in the grid with a countdown ("starts in 3 days"). After sunset, the habit auto-archives with a summary toast ("30-day challenge complete! 26 of 30 days.").

**Why this matters:** Not all habits are permanent. "30-day challenges," seasonal habits (swim in summer), and ramp-up periods ("start journaling next Monday") are common. Currently, users must manually remember when to start and when to archive. Forgetting to start creates guilt; forgetting to archive creates clutter.

**Why no prior proposal covers this:** Prior proposals addressed scheduling *within* a week (Mon/Wed/Fri — G1, AA5) and time-of-day reminders, but never the *lifespan* of a habit. This is a different dimension: not "when during the week" but "when in your life."

**Data model change:**
```typescript
// Add to Habit type
startsAt?: string   // YYYY-MM-DD, habit appears but isn't toggleable before this
endsAt?: string     // YYYY-MM-DD, habit auto-archives after this date
```
- Add two optional date fields to the create/edit form.
- Frontend: before `startsAt`, the row shows in the grid but cells are disabled with a subtle "starts Mon" label. After `endsAt`, auto-archive fires on next page load with a summary toast.
- No new API endpoint — uses existing update and archive endpoints.

**Behavioral reasoning:** Commitment devices with defined end dates increase follow-through (Rogers, Milkman & Volpp, 2014). "Do this for 30 days" is more achievable than "do this forever." The sunset also creates a natural reflection point where the user decides to renew, evolve, or retire the habit.

**Estimated effort:** ~45 min. Two optional fields, conditional rendering logic, auto-archive on load check.

---

### CC4: Completion Velocity Indicator

**What it is:** A small, real-time visual indicator on each habit row showing whether your completion rate is accelerating, stable, or decelerating — using the last 7 days vs. the prior 7 days. Displayed as a subtle arrow: ↑ (improving), → (stable), ↓ (declining). No numbers, no charts, no separate view.

**Why this matters:** Streaks are a trailing indicator — they tell you what happened. Velocity is a leading indicator — it tells you what's about to happen. A habit with 5/7 completions this week vs. 3/7 last week is *improving* even if the streak is 0 (because there were gaps). A habit with 7/7 this week vs. 7/7 last week shows → (stable), which is a signal to celebrate consistency rather than chase a higher number.

**Why no prior proposal covers this:** Prior proposals designed *retrospective* analytics (BB4 stats view, heatmaps, sparklines, momentum scores). Velocity is *prospective* — it predicts trajectory. And it requires zero navigation, zero extra views, zero user effort. It lives right in the existing row.

**Implementation:**
```typescript
function getVelocity(dates: string[], today: string): 'up' | 'flat' | 'down' {
  const thisWeek = countCompletionsInRange(dates, today, -7)
  const lastWeek = countCompletionsInRange(dates, today, -14, -7)
  if (thisWeek > lastWeek) return 'up'
  if (thisWeek < lastWeek) return 'down'
  return 'flat'
}
```
- Pure frontend computation. No API changes, no data model changes.
- Render: a tiny arrow next to the streak pill, colored green/gray/amber.

**Behavioral reasoning:** Loss aversion is stronger than gain motivation (Kahneman & Tversky, 1979). Seeing a ↓ arrow creates a gentle nudge ("I'm slipping") that's more actionable than a broken streak ("I already failed"). The ↑ arrow provides positive reinforcement without the fragility of streak counting.

**Estimated effort:** ~25 min. One utility function, one small UI element. The simplest proposal here.

---

### CC5: "Minimum Viable Day" Toggle

**What it is:** Each habit gets an optional "minimum viable" version defined at creation. Example: habit is "Run 5K," minimum is "Put on running shoes." On tough days, the user can long-press the check cell to log the minimum version instead of the full habit. The cell shows a half-filled indicator (half-opacity checkmark). It still counts for the streak.

**Why this matters:** The biggest predictor of long-term habit maintenance isn't intensity — it's identity continuity (Clear, 2018). A person who puts on running shoes on a bad day is still "a runner." A person who skips entirely starts to identify as "someone who doesn't run." The minimum viable day preserves the identity signal at near-zero cost.

**Why no prior proposal covers this:** Prior proposals designed habit "scaling" (K1 — tiny/standard/stretch tiers) and "partial completion" in various forms. But those are categorization systems. The minimum viable day is a *real-time escape hatch* — you don't plan it, you use it in the moment when the alternative is skipping entirely. It's a one-bit decision (full or minimum) rather than a multi-tier selection.

**Data model change:**
```typescript
// Add to Habit type
minimumVersion?: string   // e.g., "Put on running shoes"

// Extend log entries
export type HabitLog = {
  [habitId: string]: Array<string | { date: string; minimum: true }>
}
```
- One optional text field in create/edit form.
- Log toggle extended: tap = full completion, long-press = minimum version.
- Streak logic: both full and minimum count. Stats could later differentiate.
- Cell display: full check = solid fill, minimum = half-opacity fill or a different icon (·).

**Behavioral reasoning:** BJ Fogg's "Tiny Habits" method (2019) shows that scaling down to the smallest possible version is the single most effective technique for habit persistence. This builds that directly into the interaction model rather than asking users to create separate "tiny" habits.

**Estimated effort:** ~55 min. One optional field, long-press interaction, visual differentiation in cells.

---

## Consolidated Backlog — Single Source of Truth

This replaces all prior backlog documents. Items are grouped into 4 tiers by impact and readiness.

### Tier 1: Fix What's Broken (Do First)

These are bugs or correctness issues. Ship before any new feature.

| # | Item | Source | Effort | What's Wrong |
|---|------|--------|--------|--------------|
| 1 | Timezone-aware date handling | BB3 | ~20 min | `todayISO()` returns UTC, wrong for 23/24 timezones |
| 2 | Replace `window.confirm` with inline dialog | BB1 (partial) | ~20 min | Blocks thread, unstyled, no keyboard trap |
| 3 | Accessibility landmarks + ARIA labels | BB1 | ~25 min | Screen reader users cannot navigate the app |

### Tier 2: Foundation (Enables Everything Else)

Infrastructure work that every future feature benefits from.

| # | Item | Source | Effort | Why It's Foundational |
|---|------|--------|--------|----------------------|
| 4 | CSS custom properties + light/dark theme | BB5 | ~40 min | Every future UI change touches hardcoded colors today |
| 5 | Client-side routing (hash-based) | New | ~30 min | Required for stats view, today view, settings — any second page |
| 6 | Toast system upgrade (success + error variants) | New | ~15 min | Current toast is error-only; new features need success/info feedback |

### Tier 3: High-Impact Features (Core Value)

Features that make users stay.

| # | Item | Source | Effort | Impact |
|---|------|--------|--------|--------|
| 7 | Completion velocity indicator | CC4 | ~25 min | Leading indicator, zero-navigation, immediate value |
| 8 | Planned rest days | CC2 | ~50 min | Prevents the #1 abandonment trigger (streak anxiety) |
| 9 | Stats view (30-day, all-time, heatmap) | BB4 | ~90 min | The single highest retention feature for existing users |
| 10 | Habit stacking chains | CC1 | ~60 min | Doubles habit formation speed via behavioral anchoring |
| 11 | Completion notes (micro-journaling) | BB2 | ~50 min | Turns check marks into a personal record worth revisiting |
| 12 | Custom scheduling (Mon/Wed/Fri, N-times/week) | G1/AA5 | ~60 min | Most-requested data model feature across all prior reviews |
| 13 | Habit sunrise/sunset (auto-lifecycle) | CC3 | ~45 min | Eliminates challenge and seasonal habit management friction |
| 14 | Minimum viable day toggle | CC5 | ~55 min | Directly implements the most effective habit persistence technique |

### Tier 4: Polish & Delight (When Core Is Solid)

Nice-to-haves that improve the experience but don't drive retention alone.

| # | Item | Source | Effort | Note |
|---|------|--------|--------|------|
| 15 | Completion celebration animation | M1 | ~20 min | CSS-only micro-delight on check-off |
| 16 | Drag-to-reorder habits | M2/V2 | ~40 min | Requires `order` field + drag handler |
| 17 | Empty state onboarding / templates | Z5 | ~30 min | Suggested starter habits for new users |
| 18 | Today view ("what's left?") | I3/D3 | ~45 min | Requires routing (Tier 2 #5) first |
| 19 | Data export (JSON/CSV) | New | ~25 min | Table stakes for user trust |
| 20 | Anti-habits (inverted tracking) | K4/AA1 | ~40 min | "Days without smoking" — inverted streak logic |
| 21 | Friction capture ("why did you skip?") | AA3 | ~45 min | Diagnostic journaling for missed days |
| 22 | PWA offline support | Multiple | ~90 min | Service worker + sync queue — largest single item |

---

## Recommended Execution Order (Next 2 Weeks)

**Week 1: Fix and Foundation (items 1–6)**
Total: ~2.5 hours. After this, the app is correct, accessible, themeable, and has routing.

**Week 2: First 3 Features (items 7–9)**
Total: ~2.75 hours. Velocity indicator, planned rest, and stats view. These three together transform the app from "a grid you check" into "a tool that helps you understand your behavior."

**Total: ~5.25 hours for a meaningfully better app.**

Items 10–14 follow in week 3. Items 15–22 are picked ad hoc when the core is solid.

---

## Repo Organization Recommendation

The root currently has 37 planning documents. Suggested cleanup:

```
docs/
  archive/           ← Move all FEATURES_*.md, FEATURE_REVIEW_*.md, PLAN.md, ROADMAP.md here
  BACKLOG.md          ← This document's consolidated backlog (Tiers 1-4), kept current
FEATURE_REVIEW_2026-11-19.md  ← This file (remove after extracting backlog)
```

One living `BACKLOG.md` at `docs/BACKLOG.md`, updated as items ship. No new planning documents until items ship. The rule: every planning commit must be followed by an implementation commit before the next planning commit.

---

## Summary of What's New in CC-Series

| Proposal | Psychological Principle | Key Differentiator |
|----------|------------------------|-------------------|
| CC1: Habit Stacking | Implementation intentions (Gollwitzer) | Behavioral *sequence*, not organizational *category* |
| CC2: Planned Rest | What-the-hell effect prevention (Polivy & Herman) | *Proactive* exception planning, not retroactive forgiveness |
| CC3: Sunrise/Sunset | Commitment devices with defined endpoints (Rogers et al.) | Habit *lifespan*, not habit *schedule* |
| CC4: Velocity Indicator | Loss aversion (Kahneman & Tversky) | *Prospective* trajectory, not retrospective analytics |
| CC5: Minimum Viable Day | Tiny Habits / identity continuity (Fogg, Clear) | *In-the-moment* escape hatch, not pre-planned tier selection |

Each proposal targets a *behavioral failure mode* — a specific way people abandon habits — rather than adding a feature for feature's sake. The five proposals together address: missing cues (CC1), streak anxiety (CC2), indefinite commitments (CC3), lack of trajectory awareness (CC4), and all-or-nothing thinking (CC5).

---

*Document #37 of 37. The next commit should be code. For real this time.*
