# Habit Garden — Feature Review (2026-11-12)

**Automated review** | Supersedes all 33 prior planning documents

---

## Inventory Reality Check

This repository now contains **34 planning documents** (including this one) and **~560 lines of working application code**. Over 120 feature proposals exist across series A through Y. **Zero have been implemented.** The planning-to-code ratio is 12:1 by line count.

This review takes the only responsible approach left: propose a small number of features that are (a) genuinely absent from all prior proposals, (b) grounded in how the app actually fails its users, and (c) small enough that each could be the *entire scope* of the next implementation session.

---

## Current Application Audit (2026-11-12)

### Architecture

| Layer | Stack | Files | Lines |
|-------|-------|-------|-------|
| Frontend | React 19, Vite 8, TypeScript | 8 files | ~350 |
| Backend | Express 5, JSON file, Node | 3 files | ~180 |
| Tests | Jest + Supertest | 1 file | ~230 |

### Working Features

- Create habit (name, daily/weekly, hex color)
- 14-day toggle grid (click any cell to mark done)
- Streak calculation (consecutive days or ISO weeks from today backward)
- Inline edit (name, frequency, color)
- Archive / unarchive / delete (with confirm)
- Optimistic UI with error toast rollback
- Server-side async write mutex
- 18 API integration tests

### Unfixed Defects (carried forward from prior reviews)

1. `src/index.css` — dead file, duplicates resets in `App.css`
2. No test for `PUT /api/habits/:id` (edit)
3. No test for `POST /api/habits/:id/unarchive`
4. No `manifest.json` or PWA metadata

### Data Model

```
Habit: { id, name, frequency('daily'|'weekly'), color, createdAt, archived }
Logs:  { [habitId]: string[] }  // array of 'YYYY-MM-DD' date strings
```

Storage: single `data.json` file. Currently empty (no user data).

---

## Z-Series: 5 Novel Proposals

These target failure modes that all 120+ prior proposals miss. Each proposal is scoped to modify 3-5 existing files, require no new dependencies, and ship in under 2 hours.

### Z1. Momentum Score (Replaces Binary Streaks)

**What every prior proposal missed:** All 120+ proposals treat streaks as the core metric and propose ways to *display* them better (best streak, streak forgiveness, heatmaps, completion bars). None question whether streaks are the right metric at all.

**The behavioral problem:** Streaks are binary — you're either "on" or you broke it. A user who completed 29/30 days, missed one, and completed the next 5 sees "5 day streak." Their 29-day effort is invisible. This is psychologically devastating and is the primary driver of habit tracker abandonment (Eyal, "Hooked"; Clear, "Atomic Habits").

**The proposal:** Replace the streak number with a **momentum score** — a rolling weighted average where recent days count more than distant ones. The formula:

```
momentum = sum(weight[i] * completed[i]) / sum(weight[i])
weight[i] = 0.95 ^ daysAgo  // exponential decay
```

- A score of 0.0–1.0, displayed as a percentage or a 5-segment "fuel gauge"
- Missing one day drops momentum slightly (e.g., 92% → 87%), not to zero
- Recovering after a miss is visible — momentum climbs back up
- The gauge uses the habit's own color, filling proportionally

**Why this differs from Y1 (streak forgiveness):** Y1 patches the streak model with skip days — it's a bandaid on a broken metaphor. Z1 replaces the metaphor entirely. There is no "streak" to break because the metric is continuous, not binary.

**Scope:** Modify `utils.ts` (new `calculateMomentum` function, ~15 lines), `HabitRow.tsx` (render gauge instead of streak pill, ~20 lines), `App.css` (gauge styles, ~15 lines). No backend changes. ~50 lines total.

---

### Z2. Completion Sounds (Micro-Reward Feedback)

**What every prior proposal missed:** All 120+ proposals focus on visual feedback — colors, animations, badges, charts. None address **auditory feedback**, which is one of the strongest reinforcement signals in behavioral design.

**The behavioral science:** The "reward" phase of the habit loop (Cue → Routine → Reward) needs to fire instantly at the moment of completion. Visual changes happen in the grid, but they're subtle and lost in a sea of cells. A short, satisfying sound effect at the exact moment you tap "done" creates a Pavlovian association between the action and the reward. This is why every successful game and social media app uses sounds (think: the Duolingo "ding", the Wordle tile flip, the iPhone lock sound).

**The proposal:**
- Play a short, pleasant tone (Web Audio API, ~200ms synthesized chime) when a day-cell is toggled ON
- Play nothing when toggled OFF (unchecking shouldn't be rewarded)
- A subtle pitch variation based on how many habits are completed today — the more you've done, the higher/richer the tone (harmonic stacking)
- Muted by default; enabled with a small speaker icon in the header
- Preference saved in `localStorage`

**Why Web Audio API, not audio files:** Zero dependencies, no network requests, < 20 lines of synthesis code. A sine wave with an exponential decay envelope sounds clean and modern.

**Scope:** New `src/audio.ts` (~25 lines — `playCheckSound(completedCount)` function), modify `HabitRow.tsx` (call on toggle-on, ~3 lines), modify `App.tsx` (mute toggle state + icon, ~15 lines), `App.css` (~5 lines). ~48 lines total. No backend changes.

---

### Z3. Habit Age Badge (Time Investment Visibility)

**What every prior proposal missed:** Every metric in the app and every proposed metric measures *performance* — how consistently you've been doing the habit. None measure *commitment* — how long the habit has existed in your life. A habit you created 6 months ago and do imperfectly is a bigger deal than a habit you created yesterday and did once.

**The behavioral insight:** Behavioral research on "identity-based habits" (Clear, ch. 2) shows that people stick with habits longer when they see themselves as "someone who does X." A visible marker of how long you've been *trying* reinforces that identity — "I've been a meditator for 4 months" is a more powerful identity statement than "I have a 12-day streak."

**The proposal:**
- Display a small age badge next to each habit name: "3d", "2w", "4mo", "1y"
- Computed from `createdAt` (already in the data model — no backend changes)
- Milestone badges at specific thresholds that change the badge appearance:
  - 1 week: seedling (green border)
  - 1 month: sprout (thicker border)
  - 3 months: growing (filled background)
  - 1 year: rooted (gold background)
- Fits the "Habit Garden" theme — habits are plants that grow with time regardless of daily perfection

**Scope:** New utility function `getHabitAge(createdAt)` in `utils.ts` (~12 lines), modify `HabitRow.tsx` (render badge, ~10 lines), `App.css` (badge + milestone styles, ~20 lines). ~42 lines total. Pure frontend.

---

### Z4. Undo Last Action (Error Recovery)

**What every prior proposal missed:** The app uses `window.confirm()` for delete and has no undo for any other action. All 120+ proposals add new *features* — none address the fundamental UX principle that users need to recover from mistakes. This is in Nielsen's 10 usability heuristics (#3: "User control and freedom") and is the most glaring omission in the current UI.

**The real-world scenario:** User accidentally taps the wrong day cell on a small screen. Or archives the wrong habit. Or edits a name and saves before noticing a typo. Currently: no recourse except manually undoing each action. With optimistic UI, the mistake is already persisted to the server before the user notices.

**The proposal:**
- After any mutation (toggle, edit, archive, unarchive, delete), show a toast with "Undo" button (5 second window)
- Clicking "Undo" reverts both the optimistic local state and sends the reverse API call
- Only the most recent action is undoable (no undo stack — keeps it simple)
- Replaces the current error-only toast with a dual-purpose toast component

**Implementation sketch:**
- Modify `useHabits.ts`: each mutation saves `{ reverseAction, previousState }` before executing. New `undo()` function restores state and calls the reverse API.
- Modify `App.tsx`: toast shows undo button when `undoAction` is available
- Modify `App.css`: toast gets a clickable button style

**Scope:** Modify `useHabits.ts` (~30 lines — save previous state per mutation + undo function), `App.tsx` (~10 lines — render undo button in toast), `App.css` (~10 lines). ~50 lines total. No new backend endpoints — undo uses existing API (toggle again, edit back, unarchive/archive, recreate).

---

### Z5. Empty State Onboarding (First-Run Experience)

**What every prior proposal missed:** When a new user opens Habit Garden, they see an empty grid with "No habits yet. Create your first one on the left." That's it. No explanation of what the app does, no guidance on what makes a good habit, no suggested starter habits. All 120+ proposals assume the user already has habits — none address the critical moment when someone decides whether to invest in the app at all.

**Why this matters more than any feature:** The #1 predictor of whether someone adopts a habit tracker is whether they create their first habit and complete it on day 1. Every feature in the backlog is useless if users bounce at the empty state. The current `data.json` is empty — this is literally the state every new user encounters.

**The proposal:**
- When `habits.length === 0`, show a richer empty state:
  - A brief welcome message (1-2 sentences, not a tutorial)
  - 3-4 "starter habit" suggestion chips: "Drink water", "Read 10 pages", "10 min walk", "Meditate 5 min"
  - Clicking a chip pre-fills the habit form with name + a suggested color
  - A small "tips" section: "Start small. One habit is better than five."
- After the first habit is created, the onboarding disappears permanently (check `habits` array length, not a separate flag)

**Scope:** Modify `HabitTable.tsx` (expand empty state, ~35 lines), `HabitForm.tsx` (accept pre-fill props, ~8 lines), `App.tsx` (wire pre-fill, ~5 lines), `App.css` (chip styles, ~15 lines). ~63 lines total. No backend changes.

---

## Definitive Consolidated Backlog

Single source of truth. All prior backlogs are superseded.

### Tier 0: Defects (fix before any feature work)

| # | Item | Est. | Status |
|---|------|------|--------|
| 0.1 | Remove dead `src/index.css` | 2 min | Open |
| 0.2 | Add `PUT /api/habits/:id` test | 15 min | Open |
| 0.3 | Add unarchive endpoint test | 10 min | Open |
| 0.4 | Add `manifest.json` + PWA meta | 20 min | Open |

### Tier 1: Ship Next (< 2 hours, highest user impact)

| # | Feature | Est. | Rationale |
|---|---------|------|-----------|
| 1.1 | **Z5: Empty state onboarding** | 1 hr | Fixes the first thing every new user sees |
| 1.2 | **Z4: Undo last action** | 1.5 hr | Core usability — error recovery |
| 1.3 | **Z1: Momentum score** | 1 hr | Fixes the most psychologically damaging metric |
| 1.4 | **Z3: Habit age badge** | 45 min | Zero-effort identity reinforcement, fits "Garden" theme |
| 1.5 | **Y3: Today-focused check-in** | 1 hr | Reduces daily friction (from Y-series) |

### Tier 2: High Value, Moderate Effort

| # | Feature | Est. | Origin |
|---|---------|------|--------|
| 2.1 | **Z2: Completion sounds** | 1 hr | Micro-reward reinforcement |
| 2.2 | **Y4: Weekly pulse summary** | 1 hr | Simplest progress overview |
| 2.3 | **Y1: Streak forgiveness / skip days** | 1.5 hr | Patches streak model for users who prefer streaks |
| 2.4 | Mobile responsive overhaul | 2 hr | Phone usability |
| 2.5 | Data export/import (JSON) | 1.5 hr | Data ownership |
| 2.6 | Monthly completion rate bar | 1 hr | Visual progress per habit |

### Tier 3: Larger Initiatives

| # | Feature | Est. | Origin |
|---|---------|------|--------|
| 3.1 | **Y2: Habit stacking / routines** | 4 hr | Behavioral science — cue chaining |
| 3.2 | Keyboard shortcuts (j/k/space) | 1.5 hr | Power users |
| 3.3 | Habit ordering (drag or arrow keys) | 2 hr | Personalization |
| 3.4 | Flexible frequency (N-times/week) | 3 hr | Gym, weekday-only patterns |
| 3.5 | Dark/light theme toggle | 2 hr | Accessibility |

### Tier 4: Foundation Changes (multi-session)

| # | Feature | Est. | Origin |
|---|---------|------|--------|
| 4.1 | Extended history / scrollable calendar | 3 hr | Long-term visibility |
| 4.2 | PWA with service worker + offline | 4 hr | Mobile-native experience |
| 4.3 | SQLite migration | 5 hr | Data reliability |
| 4.4 | Multi-user auth | 6 hr | Multi-device support |
| 4.5 | GitHub-style yearly heatmap | 4 hr | Long-term motivation |

---

## Recommended Next Session: Implementation Sprint

**Stop planning. Start building.**

The next session should implement exactly this, in this order:

1. **Tier 0 defects** (< 30 min total) — clear the slate
2. **Z5: Empty state onboarding** (1 hr) — fix the first-run experience
3. **Z1: Momentum score** (1 hr) — replace the broken streak metaphor

These three items touch different files with minimal overlap, require no new dependencies, and no backend schema changes. Total estimate: 2.5 hours. Total new code: ~130 lines.

If time remains: **Z3 (habit age badge)** slots in cleanly since it also modifies `HabitRow.tsx` and `utils.ts`.

---

## Why These Z-Series Proposals Are Different

| Prior proposals focus on... | Z-series focuses on... |
|---|---|
| What to show users who are already engaged | What happens before engagement (Z5: onboarding) |
| Visual data displays (charts, heatmaps, bars) | Non-visual feedback channels (Z2: sound) |
| More metrics and data | Better metrics (Z1: momentum replaces streaks) |
| Adding capabilities | Recovering from mistakes (Z4: undo) |
| Performance tracking | Identity reinforcement (Z3: age/commitment) |

Each Z proposal addresses a different *category* of UX failure rather than different *symptoms* of the same one. The prior 120+ proposals are largely variations on "show the user more data about their completions."

---

## Document Hygiene

This repository contains 34 planning documents. The implementation session should:

1. Move all `.md` feature/planning docs to `docs/archive/`
2. Keep only `README.md` in the project root
3. Add a one-line note in README linking to `docs/archive/` for historical reference
4. Not create any new planning documents until at least Tier 1 is fully implemented
