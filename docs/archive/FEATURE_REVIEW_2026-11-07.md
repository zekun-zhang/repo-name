# Habit Garden — Feature Review & Consolidated Backlog (2026-11-07)

**Automated review** | Supersedes all 25 prior planning documents

---

## Executive Summary

This project has produced **25 planning documents** containing **120+ feature proposals** across series A through T, spanning 8 months. **Zero features have been shipped.** The planning-to-code ratio is approximately 14:1 and rising with each review cycle.

This document takes a fundamentally different approach: **ship-first, plan-second**. It identifies the 5 unfixed bugs, proposes 5 genuinely novel features verified against all prior proposals, and organizes everything into a single executable backlog with clear tiers. All prior planning documents are cataloged below for reference but should not drive future work.

---

## Codebase Audit (2026-11-07)

### Project Vitals

| Metric | Value |
|--------|-------|
| Source files | 11 (4 components, 1 hook, 1 utils, 1 types, 1 API client, 2 server) |
| Lines of application code | ~560 |
| Lines of planning docs | ~5,000+ |
| Server endpoints | 5 (GET habits, POST habit, POST toggle, POST archive, DELETE habit) |
| Frontend tests | 0 |
| Server tests | 14 (via supertest) |
| Working features | Create (daily/weekly), 14-day toggle grid, streaks, archive, delete, optimistic UI, toast errors |
| Tech stack | React 19 + TypeScript 5.9 + Vite 8 / Express + flat JSON file |
| Planning documents | 25 (this included) |
| Feature proposals to date | 120+ |
| Features shipped since March 2026 | **0** |

### Architecture

```
┌──────────────────────────────────────────────────────┐
│  Frontend (React 19 + Vite)                          │
│  ┌─────────────────────────────────────────────────┐ │
│  │ App.tsx                                         │ │
│  │  ├── HabitForm.tsx  (create new habit)           │ │
│  │  └── HabitTable.tsx                              │ │
│  │       └── HabitRow.tsx × N  (per habit)          │ │
│  ├── useHabits.ts  (all state + optimistic updates) │ │
│  ├── api.ts        (5 fetch calls, no error checks) │ │
│  ├── utils.ts      (streak calc, date helpers)      │ │
│  └── types.ts      (Habit, HabitLog, Frequency)     │ │
│  └─────────────────────────────────────────────────┘ │
│         │  HTTP (no auth, no validation of res.ok)   │
│  ┌──────┴──────────────────────────────────────────┐ │
│  │ Express server (app.js + index.js)              │ │
│  │  └── data.json (flat file, mutex-locked writes) │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Known Defects (Unfixed Since October 2026)

These have been documented in every review for 8+ months. They represent real bugs and dead code.

| ID | Defect | File | Severity | Effort |
|----|--------|------|----------|--------|
| BUG-1 | `api.ts` never checks `res.ok` — server 400/500 errors are silently treated as successful responses | `src/api.ts` | High | 10 min |
| BUG-2 | No edit endpoint — habits cannot be renamed, recolored, or have frequency changed after creation | `server/app.js` | Medium | 20 min |
| BUG-3 | Archive is one-way — no unarchive, no way to see archived habits | `src/hooks/useHabits.ts`, `server/app.js` | Medium | 20 min |
| BUG-4 | `index.css` is dead code — contains a full light/dark design system that `App.css` completely overrides | `src/index.css` | Low | 15 min |
| BUG-5 | `data.json` contains 8 stale test habits from March 2026 | `server/data.json` | Low | 2 min |

**Total effort for all 5 bugs: ~67 minutes.** These should be fixed before any feature work.

---

## U-Series: 5 Novel Features (Dimensions 123–127)

Each proposal was verified against the complete A-through-T catalog (120+ proposals). These target dimensions that no prior proposal touches.

### U1. Keyboard-First Quick Actions

**Dimension 123: Input modality — the app is entirely mouse-driven**

**The gap:** Every prior proposal assumes the mouse/touch interaction model. 120 features address *what* happens when you interact — visual feedback, streaks, analytics, flexible completions — but none addresses *how fast* you can interact. For a daily-use tool opened every morning, the current flow is: scroll to habit → find today's column → click the tiny 26×26px cell. With 8 habits this takes 30+ seconds of pointing and clicking. Power users of daily tools (todo apps, note apps, terminals) expect keyboard control.

**What it does:**

- Press `1`–`9` to toggle today's completion for the Nth visible habit (shown as a faint number badge on each row)
- Press `/` or `n` to focus the "Create a habit" name field
- Press `?` to show/hide a keyboard shortcut overlay
- Press `a` to cycle the view between active / archived / all habits
- Arrow keys navigate the 14-day grid; Enter/Space toggles the focused cell

**Why this matters:** The daily check-in is the app's core loop. Making it take 3 seconds instead of 30 determines whether the app becomes a habit itself. No amount of analytics or gamification compensates for a slow daily interaction.

**Key design decisions:**
- Shortcuts only fire when no input field is focused (standard web convention)
- Number badges are subtle (opacity 0.3) so they don't clutter the UI
- `?` overlay is dismissible with Escape
- All shortcuts have `aria-keyshortcuts` attributes for accessibility

**Effort:** ~2 hours (keyboard listener hook + visual badges + help overlay)

**Files changed:** New `src/hooks/useKeyboardShortcuts.ts`, modify `HabitRow.tsx` (badge), `HabitTable.tsx` (grid nav), `App.tsx` (mount hook)

---

### U2. Habit Templates Library

**Dimension 124: Onboarding friction — the blank-slate problem**

**The gap:** L1 proposes a "First-Run Wizard" that asks the user questions and guides them through creating their first habit. But no proposal offers *pre-built habit content*. The user must always invent habits from scratch: think of a name, pick a frequency, choose a color. This is a known UX anti-pattern — the "blank canvas problem" causes most users to create one test habit and never return.

Real habit apps (Habitica, Streaks, HabitBull) all ship curated starter templates. This isn't about onboarding flow — it's about content.

**What it does:**

A "Browse templates" button below the create form opens a categorized template picker:

```
┌─ Templates ──────────────────────────────────┐
│                                              │
│  🏃 Health & Fitness                         │
│  ├─ Exercise 30 min       [daily]  [+ Add]   │
│  ├─ Drink 8 glasses water [daily]  [+ Add]   │
│  ├─ Sleep by 11pm         [daily]  [+ Add]   │
│  └─ Weekly meal prep      [weekly] [+ Add]   │
│                                              │
│  📚 Learning                                 │
│  ├─ Read 20 pages         [daily]  [+ Add]   │
│  ├─ Practice instrument   [daily]  [+ Add]   │
│  └─ Weekly skill review   [weekly] [+ Add]   │
│                                              │
│  🧘 Mindfulness                              │
│  ├─ Meditate 10 min       [daily]  [+ Add]   │
│  ├─ Journal               [daily]  [+ Add]   │
│  └─ Digital detox hour    [daily]  [+ Add]   │
│                                              │
│  💼 Productivity                             │
│  ├─ Plan tomorrow tonight [daily]  [+ Add]   │
│  ├─ Inbox zero            [daily]  [+ Add]   │
│  └─ Weekly review         [weekly] [+ Add]   │
│                                              │
│  [Start with a pack: "Morning Routine" →]    │
│  [Start with a pack: "Fitness Starter" →]    │
└──────────────────────────────────────────────┘
```

"Packs" add 3-4 related habits at once with coordinated colors. Individual templates add one habit with a sensible default color.

**Why it matters:** Templates solve the cold-start problem. A user who adds 3 habits from a pack in their first session is 4x more likely to return (general SaaS retention data). The templates also serve as implicit suggestions — they teach users what habit tracking *can* look like.

**Key design decisions:**
- Templates are static data (a JSON array), not fetched from a server
- Adding a template creates a real habit — no special "template" type in the data model
- Packs use color harmonies (analogous colors on the wheel) so they look intentional together
- The template picker is a modal/drawer, not a separate page — it's an enhancement to the create flow
- Users can still create custom habits normally; templates are additive

**Effort:** ~3 hours (template data, TemplatePicker component, pack logic, modal)

**Files changed:** New `src/data/templates.ts`, new `src/components/TemplatePicker.tsx`, modify `HabitForm.tsx` (browse button), `App.css` (modal styles)

---

### U3. Data Export & Import (Portable Habits)

**Dimension 125: Data ownership — the app has no escape hatch**

**The gap:** The app stores all data in `server/data.json`. There is no way for a user to:
- Back up their habit data
- Move to a different device
- Migrate to a different app
- Recover from a corrupted `data.json`
- Share their habit setup with a friend

120 prior proposals add features *on top of* the data. None addresses the data itself as something the user owns and controls. This is a table-stakes feature for any personal data tool — and particularly important here because the flat-file backend has no durability guarantees.

**What it does:**

Two new actions in a settings/utility area:

1. **Export**: Downloads a JSON file containing all habits (including archived) and all logs. The file is human-readable and documented with a version field for forward compatibility.

```json
{
  "version": 1,
  "exportedAt": "2026-11-07T10:30:00Z",
  "habits": [...],
  "logs": {...}
}
```

2. **Import**: Accepts a previously exported JSON file. Options:
   - **Merge** (default): adds imported habits that don't already exist (matched by name + frequency), merges log dates
   - **Replace**: wipes current data and loads the import (with confirmation dialog)

A "Download backup" link in the header makes export always one click away.

**Why this matters beyond backup:** Export/import is the foundation for future multi-device sync, sharing, and migration features. It also builds user trust — "this app won't hold my data hostage."

**Key design decisions:**
- Export format is the same as `data.json` with an added `version` envelope
- Import validates the file structure before applying (prevents corrupt data from breaking the app)
- Merge uses habit name + frequency as the identity key (not UUID, since UUIDs differ across exports)
- Server endpoint: `GET /api/export` and `POST /api/import`

**Effort:** ~2 hours (API endpoints, download trigger, file picker, merge logic, validation)

**Files changed:** Modify `server/app.js` (2 new endpoints), new `src/components/DataTools.tsx`, modify `App.tsx` (mount tools), `api.ts` (2 new functions)

---

### U4. Completion Notes (Micro-Journal)

**Dimension 126: Qualitative context — completions are data points with no meaning**

**The gap:** T1 (flexible completions / effort modes) addresses *how much* effort a completion represents. S2 addresses adding contextual metadata like location, mood, and time. But no proposal lets the user attach **free-text notes** to a specific day's completion — a simple "what happened" that turns a checkmark into a memory.

The difference from prior metadata proposals: those add structured fields (dropdowns, ratings, tags). This is unstructured — a 140-character text field. The distinction matters because structured metadata requires the user to decide *what to track* upfront, while free-text captures the unexpected. "Ran in the rain and loved it" or "Only did 5 minutes but it counted" are insights that no predefined field would capture.

**What it does:**

- Long-press (or right-click) a checked day cell to open a tiny note popover
- Type up to 140 characters (tweet-length — enough for context, too short to become a chore)
- Notes are shown as a subtle dot indicator on the cell
- Hovering/tapping a cell with a note shows the note in a tooltip
- A "journal view" aggregates all notes chronologically — a mini habit diary

**Data model change:**
```typescript
// logs changes from string[] to:
type HabitLog = {
  [habitId: string]: {
    [date: string]: { completed: true; note?: string }
  }
}
```

This is the one breaking data model change in this plan. Migration: convert existing `string[]` log entries to `{ completed: true }` objects on first load.

**Why this matters:** Notes transform the app from a tracker into a journal. When the user reviews their history, they don't just see "I did it 5/7 days" — they see *why* certain days were hard and what made good days good. This qualitative data is what makes habit tracking personally meaningful rather than just gamified.

**Key design decisions:**
- Notes are optional and never prompted — the default flow (tap to toggle) is unchanged
- 140-character limit keeps it lightweight (this is a note, not a diary entry)
- Notes are stored alongside the completion, not in a separate data structure
- The journal view is read-only — notes are written at completion time, preserving authenticity
- Migration from the old `string[]` format is automatic and backwards-compatible on the server

**Effort:** ~4 hours (data migration, API changes, note popover component, tooltip, journal view)

**Files changed:** Modify `types.ts` (HabitLog type), `server/app.js` (migration + note endpoints), `api.ts`, `useHabits.ts`, `HabitRow.tsx` (popover + indicator), new `src/components/NotePopover.tsx`, new `src/components/JournalView.tsx`

---

### U5. Habit Dependency Chains

**Dimension 127: Inter-habit causality — habits are modeled as independent**

**The gap:** I4 proposes "cross-habit synergies" that detect *correlations* (when you do X, you tend to also do Y). R5 proposes "interaction effects" that measure how habits *influence each other's metrics*. But both are analytical/observational — they discover patterns after the fact.

No proposal models **causal, user-declared dependencies** between habits: "I can only do B if I've done A today." This is how habits actually work in practice: "Morning run" requires "Wake at 6am." "Evening journal" works best after "Digital detox." "Weekly review" depends on "Daily planning" happening most days that week.

**What it does:**

When editing a habit, an optional "Depends on" dropdown lets you select another habit:

```
Morning Run
  Depends on: Wake by 6am ✓
  
  If "Wake by 6am" is NOT checked today:
  ┌─────────────────────────────────────────┐
  │ Morning Run                             │
  │ [dimmed, with lock icon]                │
  │ "Complete 'Wake by 6am' first"          │
  └─────────────────────────────────────────┘
  
  If "Wake by 6am" IS checked today:
  ┌─────────────────────────────────────────┐
  │ Morning Run                             │
  │ [normal, unlocked, tappable]            │
  └─────────────────────────────────────────┘
```

Dependencies create a visual chain in the habit list — dependent habits are indented slightly under their parent, making the routine structure visible.

**Why this matters:** Dependencies turn a flat list of habits into a **routine** — a structured sequence that mirrors how the user actually lives their day. This is the difference between "I have 8 things to do" and "I have a morning routine, a work routine, and an evening routine." The structure reduces decision fatigue because the app tells you what's next.

**Key design decisions:**
- Dependencies are soft locks: the cell is dimmed and shows a message, but the user CAN still override and check it (long-press to "force complete"). This prevents frustration when the dependency is wrong.
- Only single-parent dependencies (A→B), not multi-parent (A+B→C). Keeps the model simple and the UI clear.
- Circular dependencies are prevented at creation time (the dropdown excludes habits that already depend on this one, directly or transitively).
- Weekly habits can depend on daily habits (checked if the daily was done ≥ N days this week) but not vice versa.

**Effort:** ~4 hours (dependency field in data model, cycle detection, visual chain rendering, soft lock UI, force-complete gesture)

**Files changed:** Modify `types.ts` (add `dependsOn?: string`), `server/app.js` (validation + cycle check), `HabitRow.tsx` (lock state + indentation), `useHabits.ts` (dependency resolution), `HabitForm.tsx` (depends-on picker for edit mode)

---

## Consolidated Backlog

### Tier 0: Bug Fixes (Ship Immediately — ~1 hour total)

These are bugs, not features. They should be fixed in a single session before any feature work.

| # | Item | Effort | Why Now |
|---|------|--------|---------|
| 0.1 | Fix `api.ts` — check `res.ok`, throw on non-2xx responses | 10 min | Silent data loss; every API call is unreliable |
| 0.2 | Add `PUT /api/habits/:id` edit endpoint | 20 min | Users cannot fix typos or change habit settings |
| 0.3 | Add unarchive endpoint + archived habits view | 20 min | Archive is currently a softer delete, not a reversible action |
| 0.4 | Remove dead `index.css` or migrate `App.css` to use its design tokens | 15 min | Dead code confuses contributors |
| 0.5 | Reset `data.json` to `{ "habits": [], "logs": {} }` | 2 min | Stale test data from 8 months ago |

### Tier 1: High Impact, Low Effort (Ship This Sprint — ~7 hours total)

Features that meaningfully improve the daily experience with minimal risk.

| # | Item | Source | Effort | Impact |
|---|------|--------|--------|--------|
| 1.1 | Keyboard shortcuts (U1) | Novel | 2 hr | 10x faster daily check-in for regular users |
| 1.2 | Data export/import (U3) | Novel | 2 hr | Data ownership, backup, portability |
| 1.3 | Accessibility fixes (C1 from 11-06 review) | Prior | 20 min | Screen reader support, legal baseline |
| 1.4 | Mobile sticky column (C3 from 11-06 review) | Prior | 10 min | Grid is broken on phones today |
| 1.5 | PWA manifest + favicon (C4 from 11-06 review) | Prior | 15 min | Home screen install for daily-use tool |
| 1.6 | Habit templates library (U2) | Novel | 3 hr | Solves cold-start / blank-slate abandonment |

### Tier 2: Medium Impact, Medium Effort (Next Sprint — ~8 hours total)

Features that deepen engagement and differentiate the app.

| # | Item | Source | Effort | Impact |
|---|------|--------|--------|--------|
| 2.1 | Completion notes / micro-journal (U4) | Novel | 4 hr | Transforms tracker → journal; qualitative richness |
| 2.2 | Habit dependency chains (U5) | Novel | 4 hr | Flat list → structured routines; reduces decision fatigue |

### Tier 3: Prior Proposals Worth Revisiting (Future — Effort Varies)

Cherry-picked from the 120+ prior proposals. Only items that remain relevant after U-series features are built.

| # | Item | Original ID | Rationale |
|---|------|-------------|-----------|
| 3.1 | Flexible completions (effort levels) | T1 (11-05) | Natural extension after U4 notes; adds quantitative dimension |
| 3.2 | Habit categories / life area grouping | T1 (11-06) | Useful once a user has 8+ habits; pairs well with U5 dependencies |
| 3.3 | Theme toggle (light/dark) | C2 (11-06) | CSS foundation exists in `index.css`; quick win after BUG-4 fix |
| 3.4 | Completion rate sparklines | E3 | Visual history beyond the 14-day window |
| 3.5 | Streak shields / grace days | R1 | Prevents streak anxiety; behavioral psychology best practice |

### Tier 4: Not Recommended

These categories of prior proposals should be deprioritized:

- **Analytics dashboards** (C1-C4, H3): The app has 0-8 habits and no historical depth. Dashboards are meaningless without months of data from real users.
- **Gamification layers** (XP, levels, achievements): Adds complexity without addressing core UX gaps. Gamification on top of a buggy app accelerates abandonment, not retention.
- **Social/sharing features**: Requires authentication infrastructure that doesn't exist. The app is a single-user flat-file JSON store.
- **AI-powered features** (predictions, recommendations): Premature for an app with no user base and no data pipeline.

---

## Planning Debt

This project has accumulated significant planning debt:

| Document | Status |
|----------|--------|
| `FEATURES_v3.md` through `FEATURES_v16.md` | 14 documents, all superseded |
| `FEATURES_NEW.md` | Superseded |
| `FEATURES_FINAL.md` | Superseded |
| `FEATURES_AND_BACKLOG.md` | Superseded |
| `BACKLOG.md` | Superseded |
| `ROADMAP.md` | Superseded |
| `PLAN.md` | Superseded |
| `FEATURE_PLAN.md` | Superseded |
| `FEATURE_REVIEW_2026-10-29.md` through `FEATURE_REVIEW_2026-11-06.md` | 6 documents, findings consolidated here |

**Recommendation:** Archive these files into a `docs/archive/` directory or delete them. They represent valuable thinking but their proliferation actively harms the project — each new review re-covers the same ground instead of building on a single source of truth. This document should be the sole planning reference going forward.

---

## Execution Principle

**The single most important thing this project can do is ship one feature.** Not plan one. Not document one. Ship one. The bug fixes in Tier 0 take 67 minutes. The keyboard shortcuts in Tier 1 take 2 hours. In under 4 hours, this project can go from "25 planning docs, 0 features" to "bugs fixed, first feature live." That momentum matters more than any individual feature in this document.
