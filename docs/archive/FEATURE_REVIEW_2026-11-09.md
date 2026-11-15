# Habit Garden — Feature Review (2026-11-09)

## Situation

| Metric | Value |
|--------|-------|
| Application source files | 11 files, ~560 lines |
| Planning documents | 26 (including this one) |
| Feature proposals across all docs | 120+ (series A through V) |
| Features shipped to date | **0** |
| Planning-to-code ratio | ~15:1 (by line count) |
| Working features | Create, toggle 14-day grid, daily/weekly streaks, edit, archive/unarchive, delete |

This is the 26th planning document. Every prior one diagnosed the same problem and every one added to it. This review takes a different structural approach: rather than proposing 5-6 new features that expand the backlog, it **curates and ranks** the full proposal space, adds only features that fill gaps the prior 120 missed, and delivers a single execution plan with no ambiguity about what to build first.

---

## Part 1: What the App Actually Needs (Product Gaps)

Before proposing anything, here's what a real user encounters today:

1. **No onboarding.** Empty state says "Create your first one on the left." No templates, no guidance on what makes a good habit.
2. **No feedback beyond streaks.** The only metric is a streak counter. No weekly summary, no completion rate, no trend.
3. **No data portability.** No export, no import. Users are locked into a flat JSON file on a single server.
4. **Dark-only, desktop-biased.** No theme toggle. The 14-column grid overflows on mobile with no horizontal scroll indicator.
5. **No keyboard workflow.** Daily check-in requires precise mouse clicks on 26px cells. Power users (the kind who track habits) want keyboard shortcuts.

These are not novel observations — every prior review identified them. But they remain the top priority because they define the difference between "demo" and "usable product."

---

## Part 2: W-Series — 4 New Feature Proposals

Verified against all 120+ prior proposals (series A through V). Each addresses a gap no prior proposal fills.

### W1. Ritual Mode (Batched Sequential Check-In)

**Gap addressed:** Every check-in requires scanning a table and clicking individual cells. When a user has 5+ habits, the daily check-in becomes a chore of micro-interactions. No prior proposal addresses the *check-in flow itself* as a design problem.

- **Habit Stacking (N1)** defines cue-based chains between habits. It's about *when* to trigger habits.
- **Now Mode (L5)** focuses on one habit at a time. It's about *attention*.
- **Time-of-day grouping (H1, B4)** sorts the display. It's about *organization*.

None redesigns the act of checking in. Ritual Mode does.

**What it does:** Users can group habits into named rituals ("Morning", "Evening", "Workout"). A "Start Ritual" button opens a full-screen sequential flow: one habit at a time, large tap target, swipe or tap to mark done/skip, automatic advance. At the end, a summary shows what you completed. All toggles are batched into a single optimistic update.

**Why it matters:** Habit research (Wood & Neal, 2007) shows that reducing friction at the point of action is the single strongest predictor of habit adherence. The current grid is *high friction* for the most common action. Ritual Mode makes the daily check-in feel like a 10-second guided flow rather than a spreadsheet data-entry task.

**Data model change:**
```typescript
type Ritual = {
  id: string
  name: string
  habitIds: string[]   // ordered
  createdAt: string
}
// New field in data.json: "rituals": []
```

**Files to touch:** `types.ts`, `api.ts` (2 new endpoints), `server/app.js` (CRUD for rituals), new `RitualFlow.tsx` component, `useHabits.ts` (batch toggle), `App.tsx` (ritual entry point).

**Effort:** ~3 hours.

---

### W2. Streak Autopsy (Post-Break Diagnostic)

**Gap addressed:** When a streak breaks, the app shows "0 days." That's it. No context, no history, no recovery narrative. Prior proposals address streak *protection* (grace days N2, 2-day rule dim 42, earned shields dim 60) and streak *alternatives* (rhythm scoring, flexible completions). None addresses what happens *psychologically after* a streak breaks.

- **Comeback Mode (H3)** delays the streak reset. It's about *mechanics*.
- **Miss Reason (dim 45)** asks why you skipped. It's about *logging the cause*.
- **Difficulty Curve (L4)** normalizes struggle. It's about *expectation setting*.

None provides a structured post-break diagnostic that helps the user understand the break, see it in historical context, and plan recovery.

**What it does:** When a streak breaks (transition from streak > 0 to streak = 0), the app shows a non-intrusive card:

```
Your Exercise streak ended at 12 days.
That was your 2nd longest streak (best: 18 days).

Pattern: your last 3 breaks were all on weekends.

[Quick recover: check in today to start rebuilding]
```

The diagnostic is computed entirely from existing log data. No new data collection. It surfaces:
- The broken streak's rank among all past streaks for that habit
- Day-of-week pattern analysis (are breaks clustered?)
- Time since last break (are breaks getting further apart = improving?)

**Why it matters:** The moment after a streak break is the highest-risk moment for habit abandonment. Research on the "what-the-hell effect" (Cochran & Tesser, 1996) shows that after a lapse, people tend to abandon the goal entirely unless given a reframing that normalizes the lapse. This feature provides that reframing with concrete data.

**Data model change:** None. Computed from existing `HabitLog` dates.

**Files to touch:** `utils.ts` (streak history analysis functions), new `StreakAutopsy.tsx` component, `HabitRow.tsx` (trigger display).

**Effort:** ~2 hours.

---

### W3. Habit Pulse (Weekly Completion Rate Badge)

**Gap addressed:** The only metric is streak length, which is binary — you either have one or you don't. A user who completes a habit 6/7 days has a "0-day streak" on Monday. Prior proposals add complex analytics (momentum decay, sparklines, radar charts, velocity scores). None adds the simplest useful metric: *weekly completion rate as a visible, persistent badge*.

- **Sparklines (C2)** show a 7-day trend line. Visual, not numeric.
- **Momentum Score (P3)** is a weighted aggregate. Complex, abstract.
- **Rhythm Scoring (M5)** redefines what "consistent" means. A framework change.

None puts a simple "5/7 this week" badge next to the streak pill. This is the minimum viable feedback upgrade.

**What it does:** Next to the streak pill, a second badge shows this week's completion rate: "5/7" for daily habits, "1/1" for weekly habits. Color-coded: green (>80%), yellow (40-80%), gray (<40%). Tooltip shows last 4 weeks' rates.

Optional (Tier 2 addition): a tiny 4-week bar chart in the tooltip showing the trend.

**Why it matters:** Completion rate is the metric that habit researchers actually use to measure adherence (Lally et al., 2010). Streaks are motivating but brittle and misleading. Showing both gives users the full picture: "My streak is 0 but I've been 6/7 for three weeks" is a very different story from "My streak is 0 and I've been 2/7."

**Data model change:** None. Computed from existing logs.

**Files to touch:** `utils.ts` (completion rate calc), `HabitRow.tsx` (badge display), `App.css` (badge styles).

**Effort:** ~45 minutes.

---

### W4. Quick-Start Templates with One-Tap Setup

**Gap addressed:** The empty state offers no guidance. A new user must invent habits from scratch, choose frequency, pick a color. Prior proposals mention templates (L1, G5, U2) but frame them as "starter packs" — curated themed bundles. None proposes the simpler, more effective pattern: **a gallery of individual common habits that auto-fill the creation form with one tap.**

The distinction matters. Starter packs ("Wellness Bundle: Meditate + Exercise + Journal") impose a philosophy. Individual templates ("Exercise — Daily — Green") reduce friction without prescribing a lifestyle.

**What it does:** When the habit list is empty OR when the user clicks "Browse templates", a grid of 12-15 common habits appears:

```
[Exercise]  [Read]  [Meditate]  [Journal]
[Drink Water]  [No Phone Before Bed]  [Walk]  [Study]
[Cook at Home]  [Stretch]  [Gratitude]  [Clean]
```

Tapping one pre-fills the form (name, suggested frequency, thematic color). User can edit before confirming. No server change — templates are a static array in the frontend.

**Why it matters:** Choice paralysis is the #1 barrier to starting a new tool. Research on default effects (Johnson & Goldstein, 2003) shows that pre-filled defaults dramatically increase adoption rates. Templates aren't about creativity — they're about reducing the cognitive cost of the first 30 seconds.

**Data model change:** None. Static client-side data.

**Files to touch:** New `habitTemplates.ts` (data), `HabitForm.tsx` (template selector), `App.css` (template grid styles).

**Effort:** ~45 minutes.

---

## Part 3: Consolidated Execution Plan

### Priority Principles

1. **Ship over plan.** No feature enters the backlog unless it can be built in one session.
2. **Compute over store.** Features that derive value from existing data (W2, W3) before features that require new data.
3. **Breadth over depth.** Small improvements to 5 areas beat a deep feature in 1 area.
4. **Unblock users.** Features that fix "I can't do X" before features that add "Now you can also do Y."

### Tier 0 — Foundational Fixes (< 2 hours total)

These are prerequisites. Nothing else should be built until these are done.

| # | Item | Effort | Why |
|---|------|--------|-----|
| 0.1 | Mobile-responsive grid: add horizontal scroll indicator + larger tap targets on small screens | 30 min | Grid is broken on phones. Most habit check-ins happen on phones. |
| 0.2 | Theme toggle (dark/light) with system preference detection | 20 min | CSS already has most of the dark theme. Add CSS custom properties + a toggle. |
| 0.3 | Keyboard navigation: Tab through today's cells, Enter to toggle | 30 min | Power users need this. Accessibility requirement. |
| 0.4 | Add `<meta>` viewport, favicon, basic PWA manifest (installable, no offline) | 15 min | The app doesn't declare itself as an app. |

### Tier 1 — Highest-Impact Features (3-4 hours total)

The smallest set of features that transforms this from a demo into a product.

| # | Feature | Source | Effort | Why first |
|---|---------|--------|--------|-----------|
| 1.1 | **Habit Pulse** (weekly completion rate badge) | W3 | 45 min | Highest value-per-effort. Computed from existing data. Gives users a reason to keep logging even with broken streaks. |
| 1.2 | **Quick-Start Templates** | W4 | 45 min | Solves the empty-state problem. Reduces first-session abandonment. |
| 1.3 | **Data Export** (JSON + CSV download) | U3 | 45 min | Trust feature. Users won't invest in a tool that holds their data hostage. |
| 1.4 | **Streak Autopsy** | W2 | 2 hr | Addresses the #1 moment of user churn (streak break). No new data needed. |

### Tier 2 — Experience Upgrades (5-6 hours total)

Features that make the app genuinely pleasant, not just functional.

| # | Feature | Source | Effort |
|---|---------|--------|--------|
| 2.1 | Ritual Mode (batched check-in) | W1 | 3 hr |
| 2.2 | Undo/Redo stack | V1 | 1.5 hr |
| 2.3 | Drag-to-reorder habits | V2 | 2 hr |

### Tier 3 — Depth Features (build only after Tier 1-2 are shipped)

| # | Feature | Source | Effort |
|---|---------|--------|--------|
| 3.1 | Streak freeze / planned rest days | V3 | 1.5 hr |
| 3.2 | Anchor statement ("why I do this") | C3/J4 | 30 min |
| 3.3 | Momentum sparkline (7-day trend) | C2 | 1 hr |
| 3.4 | Habit templates as themed starter packs | L1/G5 | 1.5 hr |

### Explicitly Deferred (Do Not Build Yet)

These are good ideas that are wrong for this stage of the product:

| Feature | Why deferred |
|---------|-------------|
| Habit stacking / chains (N1) | Requires 10+ habits to be useful. Build audience first. |
| Gamification (badges, shields, XP) | Risky if core loop isn't solid. Extrinsic motivation can undermine intrinsic. |
| Social / accountability sharing | Needs user accounts. Different product scope. |
| PWA offline support | Service workers + IndexedDB is a separate engineering effort. |
| Anti-habits / avoidance tracking | Different mental model. Better as a v2 feature. |
| Analytics dashboard | Premature without more data points. W3 (Pulse) is sufficient for now. |

---

## Part 4: What's Different About This Plan

**It's small.** Tier 0 + Tier 1 = ~6 hours of work. That's one focused session. The entire plan through Tier 2 is ~12 hours.

**It builds on existing data.** W2 (Autopsy) and W3 (Pulse) add visible value by computing new views of data the app already collects. No migrations, no new server endpoints for either.

**It's ordered by user journey.** Tier 0 makes the app usable (mobile, keyboard, theme). Tier 1 makes it valuable (templates, metrics, export, recovery). Tier 2 makes it delightful (rituals, undo, reorder).

**It doesn't require reading 25 prior documents.** Everything needed to execute is in this file. Prior documents are archived context, not active specifications.

---

## Appendix: Prior Proposal Audit

All 120+ proposals across 25 documents fall into these clusters. The count shows how many independent proposals address each area:

| Cluster | Proposals | Status |
|---------|-----------|--------|
| Visualization (heatmap, sparkline, DNA, radar) | 18 | Overkill. W3 (Pulse) covers the essential metric. |
| Streak mechanics (grace, freeze, shield, flex) | 14 | V3 (rest days) is the right one. Tier 3. |
| Organization (time-of-day, zones, categories) | 12 | Drag-to-reorder (V2) is simpler and user-controlled. |
| Analytics (momentum, velocity, correlation) | 11 | Premature. W3 + W2 are sufficient for now. |
| Habit evolution (scaling, graduation, sunset) | 10 | Tier 3+ territory. Need users first. |
| Social/accountability | 8 | Requires accounts. Deferred. |
| Reflection (journal, notes, why, autopsy) | 8 | W2 (Autopsy) + anchor statement cover the essentials. |
| Gamification (badges, XP, shields, levels) | 7 | Risky at this stage. Deferred. |
| Templates/onboarding | 6 | W4 covers it. Keep it simple. |
| Data management (export, import, sync) | 5 | Export in Tier 1. Import can follow. |
| Habit relationships (stacking, chains, correlation) | 5 | Needs scale. Deferred. |
| UI/UX infrastructure (PWA, theme, mobile, keyboard) | 5 | Tier 0. Do it first. |
| Anti-habits / avoidance | 4 | v2 feature. Different product surface. |
| Prediction / forecasting | 3 | Needs more historical data to be meaningful. |
| Misc (naming, color systems, gestures) | 6 | Nice-to-haves. |

**Total: 122 proposals. This plan selects 12 for execution across 4 tiers.**

---

*This document supersedes all 25 prior planning documents. It is designed to be the last planning document before the codebase doubles in size.*
