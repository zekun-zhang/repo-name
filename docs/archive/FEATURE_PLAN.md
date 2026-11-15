# Habit Garden — Feature Plan & Backlog

**Date:** 2026-10-25
**Replaces:** All prior planning documents (PLAN.md, ROADMAP.md, BACKLOG.md, FEATURES_v3–v16, FEATURES_FINAL, FEATURES_NEW, FEATURES_AND_BACKLOG)

---

## Current State

| Metric | Value |
|--------|-------|
| Source files | 11 (4 components, 1 hook, 1 utils, 1 types, 1 API client, 2 server files, 1 test file) |
| Lines of code | ~960 |
| Working features | Create habit, toggle completion (14-day grid), daily/weekly streaks, archive, delete |
| Test coverage | Server API has 14 tests via supertest |
| Tech stack | React 19 + TypeScript + Vite 8 (frontend), Express + flat JSON file (backend) |
| Known defects | 6 (see Tier 0) |
| Prior planning docs | 18 files, ~10,000 lines |
| Prior feature proposals | 93+ |
| Features shipped from proposals | 0 |

---

## Fresh Analysis: What's Actually Missing

After reading every line of code and every prior proposal, six dimensions remain unaddressed. Prior proposals (C1–L5) focused on behavioral science, analytics, and information architecture. They overlooked the **physical experience** of using the app — how it feels to tap, how it looks on a phone, whether you can rearrange things, and whether the core interaction loop is satisfying.

### M1. Completion Celebration (The Dopamine Gap)

**The problem:** Checking off a habit is the single most frequent interaction in the app. It currently changes a cell from dark to gradient — and that's it. No animation, no sound, no visual feedback proportional to the achievement. The core habit loop of the *app itself* (open → check off → feel good → come back tomorrow) has an empty reward stage.

**Why 93 proposals missed it:** Every proposal focuses on *what information to show*. None addresses *how the primary interaction feels*. Analytics, sparklines, zones, narratives — they're all about viewing. The check-off moment is about doing, and it has zero delight.

**What it does:**
- Checking a cell plays a subtle scale-up + color burst animation (CSS only, ~150ms)
- Hitting a streak milestone (7, 14, 30, 60, 100 days) triggers a larger celebration: confetti particles or a brief glow effect on the streak pill
- The streak pill itself animates when it increments (number rolls up)
- Optional: a soft haptic pulse on mobile (via `navigator.vibrate`)

**Key decisions:**
- Pure CSS animations, no libraries. Must feel instant, not sluggish
- Celebrations scale with milestone rarity — day 7 is a small pop, day 100 is dramatic
- All animations respect `prefers-reduced-motion`
- No sound by default (sound is opt-in and stored in localStorage)

**Data model:** No changes. Pure CSS/JS rendering enhancement.

**Effort:** ~25 min

---

### M2. Drag-to-Reorder Habits

**The problem:** Habits are displayed in reverse creation order and cannot be rearranged. Users who care about "Exercise" more than "Read" have no way to put Exercise first. This is a basic UX capability that every list-based app needs.

**Why 93 proposals missed it:** Reordering is "boring." It doesn't involve behavioral science, data visualization, or novel interaction models. But it directly impacts daily usability more than most proposed features. The habit you care about most should be at the top.

**What it does:**
- Each habit row has a drag handle (grip icon on the left)
- Drag and drop reorders the list
- Order persists to the server

**Data model:**
```typescript
type Habit = {
  // ...existing
  sortOrder: number  // new field, integer, lower = higher
}
```

Server: new `PUT /api/habits/reorder` endpoint accepting `{ ids: string[] }` (ordered array).

**Effort:** ~30 min (HTML5 drag-and-drop or pointer events, no library needed for a simple vertical list)

---

### M3. Mobile-Responsive Habit View

**The problem:** The 14-day table grid requires horizontal scrolling on any screen narrower than ~800px. On a phone, the user sees the habit name and maybe 3-4 day columns before scrolling. This makes the primary view — the daily check-in grid — nearly unusable on the device where most habit tracking happens.

**Why 93 proposals missed it:** Proposals add features to the table. None questions whether a table is the right container on mobile. The grid is assumed, not examined.

**What it does:**
- **Desktop (>900px):** Current 14-day table view, unchanged
- **Tablet (600-900px):** 7-day table view (current week)
- **Mobile (<600px):** Card-based layout replacing the table entirely:

```
┌──────────────────────────────┐
│ ● Exercise 30 min      [✓]  │
│   Daily · Streak: 12 days   │
│   ▓▓▓░▓▓▓  (last 7 days)   │
├──────────────────────────────┤
│ ● Read 20 pages        [ ]  │
│   Daily · Streak: 0 days    │
│   ░░▓░░░░  (last 7 days)   │
└──────────────────────────────┘
```

Each card shows:
- Habit name + today's toggle button (big, thumb-friendly)
- Frequency + current streak
- Mini 7-day dot strip (small indicators, not a full grid)
- Swipe left to reveal Archive / Delete

**Key decisions:**
- The mobile view optimizes for the #1 use case: "check off today's habits"
- Today's toggle button is large and prominent — the primary tap target
- Historical data is compressed (dot strip) not hidden
- Swipe-for-actions avoids cluttering the card with buttons

**Data model:** No changes. Pure responsive CSS + conditional rendering.

**Effort:** ~45 min

---

### M4. Yesterday Recovery Flow

**The problem:** The most common habit tracker interaction pattern is: open app → notice yesterday is empty → need to backfill yesterday → then check off today. The current UI treats yesterday identically to any other past day in the grid. There's no acknowledgment that "catching up on yesterday" is a distinct, frequent user moment.

**Why 93 proposals missed it:** "Comeback Mode" (K2) handles multi-day gaps. The "Difficulty Curve" (L4) handles ongoing struggle. Neither addresses the mundane, ultra-frequent case of a 1-day gap — the user simply forgot to open the app yesterday. This isn't a comeback; it's a Tuesday.

**What it does:**
When the app detects uncompleted habits from yesterday (habits that have no log entry for yesterday's date), it shows a brief, non-intrusive prompt at the top of the main view:

```
┌─────────────────────────────────────────┐
│ 📋 Yesterday (Oct 24): 3 habits to log  │
│                                          │
│  ○ Exercise 30 min    [✓] [✗]           │
│  ○ Read 20 pages      [✓] [✗]           │
│  ○ Meditate           [✓] [✗]           │
│                                          │
│  [ Done ]            [ Skip all ]        │
└─────────────────────────────────────────┘
```

- Shows only when there are uncompleted habits for yesterday specifically
- Two buttons per habit: Yes (log it) or No (skip explicitly)
- "Done" closes the prompt and applies selections
- "Skip all" dismisses without logging anything
- Dismissed for the session (doesn't nag on every app open)
- Only shows once per day (tracked in sessionStorage)

**Key decisions:**
- Only yesterday, never older dates. Older gaps are a different problem (Comeback Mode territory)
- Non-blocking — the regular habit view is visible below/behind
- Explicit skip (✗) vs. just dismissing: the user can distinguish "I didn't do it" from "I don't remember"
- No guilt language. "3 habits to log" not "3 habits you missed"

**Data model:** No changes. Uses existing toggle endpoint. Session-level dismissal state stored client-side.

**Effort:** ~20 min

---

### M5. Edit Habit (In-Place)

**The problem:** Once created, a habit's name, frequency, and color cannot be changed. The only option is delete + recreate, which loses all history. This is listed as a known defect in prior docs but never designed. Editing is not a "feature" — it's table stakes for any CRUD app.

**Why it matters now:** Multiple prior features (Anchor Statements, Routines, Effort levels) add new fields to habits. Without an edit flow, none of those fields can be changed after creation. Edit is a prerequisite for the roadmap.

**What it does:**
- Clicking the habit name in a row switches that row to edit mode
- Inline edit: name becomes a text input, frequency becomes a dropdown, color becomes a color picker
- Enter or a Save button commits; Escape cancels
- Server: `PUT /api/habits/:id` accepts partial updates (name, frequency, color)

**Data model:** No schema changes (existing fields become editable).

**Effort:** ~20 min

---

### M6. Keyboard Quick-Log

**The problem:** Daily habit logging on desktop requires: find habit in list → move mouse to today's column → click small 26px cell → repeat for each habit. With 6 habits, this is 6 precise mouse movements. For a daily ritual, it should take seconds.

**Why 93 proposals missed it:** Proposals design for viewing and reflection. None designs for the speed of the daily check-in itself. The fastest daily check-in is: open app → press 1, 2, 3, 4, 5, 6 → done.

**What it does:**
- Number keys 1–9 toggle today's check for the nth visible habit
- A small "1", "2", "3" label appears next to each habit name (subtle, like keyboard hints)
- Spacebar on a focused habit row toggles today
- `?` shows a tiny keyboard shortcuts overlay
- Works only when no text input is focused

**Data model:** No changes. Calls existing toggle function.

**Effort:** ~20 min

---

## Novelty Matrix: M-Series vs. All Prior Proposals

| ID | Feature | Dimension | Why It's Distinct |
|----|---------|-----------|-------------------|
| M1 | Completion Celebration | Interaction delight | Every proposal adds information. None makes the core tap feel rewarding. |
| M2 | Drag-to-Reorder | Manual control | Every proposal adds automatic sorting/grouping. None lets the user simply put things where they want. |
| M3 | Mobile-Responsive View | Device adaptation | Every proposal adds to the table. None redesigns for the primary device people track habits on. |
| M4 | Yesterday Recovery | Micro-moment | Comeback Mode handles multi-day gaps. This handles the most common gap: exactly one day. |
| M5 | Edit Habit | CRUD completeness | Listed as a defect in prior docs but never designed. Prerequisite for 12+ proposed features. |
| M6 | Keyboard Quick-Log | Input speed | Every proposal enhances what you see. None makes the daily action faster. |

---

## Consolidated Backlog

### Tier 0 — Fix What's Broken (before any features)

| # | Item | What | Est. |
|---|------|------|------|
| 0.1 | API error handling | Add `if (!res.ok) throw new Error(...)` to all 5 functions in `api.ts` | 10 min |
| 0.2 | Edit habit | `PUT /api/habits/:id` + inline editing in HabitRow (M5) | 20 min |
| 0.3 | Unarchive | `POST /api/habits/:id/unarchive` + show archived habits section in UI | 10 min |
| 0.4 | Clean dead CSS | Remove unused rules from `index.css` (the Vite default file, not `App.css`) | 5 min |
| 0.5 | Clean test data | Reset `data.json` to `{ "habits": [], "logs": {} }` | 1 min |
| 0.6 | Habit name uniqueness | Warn (client-side) when creating a habit with a name that already exists | 5 min |

**Total: ~50 min**

### Tier 1 — Make It Feel Right (daily experience improvements)

These features change how the app *feels* to use every single day. They're small, independent, and high-impact-per-line-of-code.

| # | Feature | Source | Est. | Why this tier |
|---|---------|--------|------|---------------|
| 1.1 | Completion Celebration | **M1** | 25 min | The core interaction should feel good |
| 1.2 | Yesterday Recovery | **M4** | 20 min | Addresses the #1 daily friction point |
| 1.3 | Keyboard Quick-Log | **M6** | 20 min | Turns a 30-second ritual into 5 seconds |
| 1.4 | Drag-to-Reorder | **M2** | 30 min | Users control their own list |
| 1.5 | Anchor Statement | L-series/C3 | 10 min | One optional "why" text field per habit — deep emotional value, trivial to build |

**Pick 3–4. Total: ~75–105 min**

### Tier 2 — Expand the Experience (new capabilities)

Features that change what the app *can do*. Each opens a new dimension.

| # | Feature | Source | Est. | Why |
|---|---------|--------|------|-----|
| 2.1 | Mobile-Responsive View | **M3** | 45 min | Makes the app usable on phones — where most habit tracking happens |
| 2.2 | Starter Packs | L1 | 30 min | Solves the cold-start problem for new users |
| 2.3 | Difficulty Curve | L4 | 25 min | Normalizes struggle during the hard weeks 2–4 |
| 2.4 | Habit Zones | L3 | 35 min | Manages cognitive load as the habit list grows |
| 2.5 | Comeback Mode | L-series/K2 | 30 min | Warm return flow after multi-day gaps |

**Pick 2–3. Total: ~55–135 min**

### Tier 3 — Differentiation (features no competitor has)

| # | Feature | Source | Est. |
|---|---------|--------|------|
| 3.1 | Now Mode | L5 | 35 min |
| 3.2 | Context Routines | L2 | 45 min |
| 3.3 | Effort Budget | L-series/J1 | 40 min |
| 3.4 | Habit Scaling | L-series/K1 | 45 min |
| 3.5 | Weekly Rhythm Score | L-series/C4 | 30 min |

### Tier 4 — Depth (needs real usage data)

| # | Feature | Source | Est. |
|---|---------|--------|------|
| 4.1 | Narrative View | J2 | 50 min |
| 4.2 | Habit Experiments | K3 | 50 min |
| 4.3 | Time Capsule | J5 | 40 min |
| 4.4 | Anti-Habits | K4 | 55 min |
| 4.5 | Momentum Sparkline | C2 | 20 min |

### Parked

| Feature | Reason |
|---------|--------|
| Living Garden View | High effort, cosmetic — ship when core UX is solid |
| Custom Scheduling (Mon/Wed/Fri) | Routines (L2) cover the more common need |
| Social / Sharing | Separate scope entirely |
| Full Analytics Dashboard | Needs months of data |
| PWA / Offline / Export | Infrastructure, not feature |
| Habit Stacking / Chains | Complex dependency model, premature |

---

## Dependency Map

```
Tier 0 (all items)
  └──→ Everything else

No dependencies between features (all independent after Tier 0), except:

  M5 Edit Habit ←── Required by: Anchor Statement, Context Routines,
                     Effort Budget, Habit Scaling (all add editable fields)

  Soft enhancements (better with, but work without):
    Now Mode ← benefits from Context Routines (time-based priority)
    Now Mode ← benefits from Effort Budget (energy-based priority)
    Now Mode ← benefits from Anchor Statement (shows "why" in focus view)
    Narrative View ← benefits from Anchor Statement + Sparkline (richer data)
```

---

## Recommended Execution Order

### Session 1: Solid Foundation
**Ship all of Tier 0** (~50 min). The app becomes correct and complete at its current scope.

### Session 2: Daily Delight
**Completion Celebration (M1) + Yesterday Recovery (M4) + Keyboard Quick-Log (M6)** (~65 min). The daily check-in becomes fast, satisfying, and forgiving.

### Session 3: Real Users
**Mobile-Responsive View (M3) + Starter Packs (L1)** (~75 min). The app becomes usable on phones and welcoming to new users.

### Session 4: Behavioral Depth
**Difficulty Curve (L4) + Habit Zones (L3)** (~60 min). The app understands where each habit is in its lifecycle and shows what needs attention.

### Session 5+: Differentiation
**Now Mode (L5) + Context Routines (L2)** or **Effort Budget + Habit Scaling**. At this point, Habit Garden has features no other habit tracker offers.

---

## Planning Debt Cleanup

This project has accumulated 18 planning documents. The following files are superseded by this document and can be deleted:

```
PLAN.md
ROADMAP.md  
BACKLOG.md
FEATURES_v3.md through FEATURES_v16.md (14 files)
FEATURES_FINAL.md
FEATURES_NEW.md
FEATURES_AND_BACKLOG.md
```

**Total: 18 files to remove.**

This document (FEATURE_PLAN.md) is the single source of truth for what to build and in what order.

---

## What Changed From the Last Plan (FEATURES_AND_BACKLOG.md)

| Change | Reasoning |
|--------|-----------|
| Added M1–M6 (6 new features) | Identified six dimensions that 93+ prior proposals all overlooked: interaction delight, manual control, device adaptation, micro-moments, CRUD completeness, input speed |
| Moved M5 Edit Habit to Tier 0 | It's not a feature — it's a correctness gap. Every CRUD app needs edit. Multiple Tier 1+ features depend on it. |
| Reordered Tier 1 to prioritize feel over information | Prior plans led with analytics (sparklines, rhythm scores). This plan leads with the daily experience (celebration, yesterday recovery, keyboard shortcuts). Information features are Tier 2+. |
| Reduced Tier 1 scope | "Pick 3–4" instead of "all 5." Shipping 3 polished features is better than 5 rough ones. |
| Added M3 Mobile-Responsive View to Tier 2 | The app is unusable on phones. This gates real adoption more than any behavioral science feature. |

---

*Next action: start coding Tier 0.1 (API error handling in `api.ts`).*
