# Feature Review — November 18, 2026

## Status of Habit Garden

**Codebase:** ~600 lines frontend (React 19 + TypeScript), ~180 lines backend (Express 5 + JSON file storage), server-only test suite.

**Shipped features:** Create/edit/delete habits, archive/unarchive, binary daily/weekly completion toggling on a 14-day grid, streak calculation, optimistic updates, error toasts, responsive layout.

**Prior planning:** 135+ feature proposals across 27 series (A through AA) in 35 documents totaling ~8,000 lines. Zero proposals have been implemented. Five bug fixes shipped Nov 8.

---

## The Execution Problem

This review acknowledges what every prior document since FEATURES_v3 has noted: the project has a 14:1 planning-to-code ratio. Any new proposal is worthless unless it ships. This document is therefore structured differently from its 35 predecessors:

- **Only 5 proposals**, each scoped to a single PR
- **No "Tier 3/4 future vision"** — only what should be built in the next 2 weeks
- **Implementation sketches included** — not just what, but how
- **Each proposal is independent** — no dependencies, any ordering works

---

## Novel Feature Proposals (BB-series)

These target gaps that none of the 135 prior proposals addressed.

### BB1: Accessibility Pass

**The gap:** Zero prior proposals mention accessibility. The app uses color-coded habits with no text alternative, `window.confirm` for destructive actions, and no ARIA landmarks. Screen reader users cannot use Habit Garden at all.

**Why now:** This isn't a feature — it's a defect. Accessibility isn't optional, and it costs almost nothing to get right at this scale. It also forces improvements (replacing `window.confirm`, adding labels) that benefit all users.

**Scope:**
- Add `role="main"`, `role="navigation"`, `aria-label` to layout regions
- Replace `window.confirm` delete dialog with an inline confirmation component (dismiss on Escape, focus-trap)
- Add `aria-label` to color-only elements (habit color bar → "Habit color: indigo")
- Add `aria-live="polite"` region for toast notifications
- Ensure all interactive elements have visible focus indicators (some exist, audit the rest)
- Add `prefers-reduced-motion` media query guard on the toast slide animation

**What it doesn't include:** Full WCAG 2.1 AA audit, skip-nav links, high-contrast mode. Those are follow-ups.

**Estimated effort:** ~45 min. No data model changes, no API changes, purely frontend.

**Reasoning:** Every subsequent feature benefits from accessible foundations. Building inaccessible features and "fixing a11y later" is a pattern that never actually happens.

---

### BB2: Completion Notes (Micro-Journaling)

**The gap:** Prior proposals designed "friction capture" (why you *skipped* — AA3) but never the inverse: a note when you *complete*. "Great 5K today, 24 min" or "Only did 10 min but still counts" turns binary check marks into a lightweight journal. This is the data users actually want to look back on.

**Why it's different from AA3 (Friction Capture):** Friction capture is diagnostic (analyzing failures). Completion notes are reflective (enriching successes). They serve different psychological needs and trigger at opposite moments.

**Scope:**
- Extend `HabitLog` from `string[]` (dates) to `Array<string | { date: string, note: string }>`
  - Backward-compatible: existing date strings remain valid, notes are optional
- On completion toggle: if the cell is being checked ON, show a small text input below the cell (max 140 chars). Pressing Enter or clicking away saves it. The input is optional — clicking the cell without typing still works exactly as before.
- API change: `POST /api/logs/toggle` accepts optional `note` field. Response includes notes.
- Display: hovering a completed cell shows the note in a tooltip. No separate journal view (that's a follow-up).

**What it doesn't include:** Note search, note editing after save, dedicated journal/timeline view, photo attachments.

**Estimated effort:** ~50 min. Small data model extension, one new UI element, one API field.

**Reasoning:** The highest-value data in a habit tracker isn't "did you do it" — it's the texture of the experience. This is the smallest possible step toward that insight, with no workflow disruption for users who don't want it.

---

### BB3: Timezone-Aware Date Handling

**The gap:** Zero prior proposals address timezone handling. The app uses `new Date().toISOString().split('T')[0]` to determine "today," which produces UTC dates. A user in UTC-8 toggling a habit at 8 PM sees it recorded on tomorrow's date. Weekly streak calculation steps back by 7 days, which can skip ISO weeks at year boundaries.

**Why now:** This is a correctness bug, not a feature. Every date in the system is potentially wrong for non-UTC users. Every future feature that touches dates (scheduling, analytics, heatmaps) will inherit this bug. Fixing it now costs ~20 min; fixing it after 10 more features touch dates costs 10x that.

**Scope:**
- Add a `getLocalDateString()` utility that returns YYYY-MM-DD in the user's local timezone
- Replace all `new Date().toISOString().split('T')[0]` calls (frontend) with `getLocalDateString()`
- Fix `generateDateRange` in utils.ts to use local dates
- Fix weekly streak logic to use proper ISO week calculation instead of 7-day subtraction
- Server stores whatever date string the client sends (already does this — no server changes needed)

**What it doesn't include:** Server-side timezone awareness, timezone selection UI, historical data migration.

**Estimated effort:** ~20 min. Pure utility refactor, no UI changes, no API changes.

**Reasoning:** Correctness before features. A habit tracker that records the wrong day is fundamentally broken for 23 of 24 time zones.

---

### BB4: Dedicated Stats View (30-Day + All-Time)

**The gap:** The 14-day grid is the only way to see history. Multiple prior proposals suggested specific visualizations (heatmaps, sparklines, charts), but none designed a cohesive stats page. Users who've tracked for months have no way to see if they're improving.

**Why a page, not a widget:** Individual stat widgets (proposed 20+ times) each solve a narrow question. A stats page answers the meta-question: "Am I getting better at this?" It's also the natural home for every future analytics feature.

**Scope:**
- New route/view toggle: "Habits" (current grid) | "Stats" (new view)
- Per-habit stats card showing:
  - Completion rate: last 7 days, last 30 days, all-time (simple percentage)
  - Current streak + longest streak ever
  - Calendar heatmap: 90-day grid (like GitHub contribution graph), colored by habit color at two opacities (done/not-done)
  - Best day of week (which weekday has highest completion rate)
- Global summary at top:
  - Total completions today / total active habits
  - Overall 7-day and 30-day completion rates
- Pure CSS implementation — no charting library. The heatmap is a CSS grid of small squares.

**What it doesn't include:** Trend lines, comparison between habits, exportable reports, date range picker.

**Estimated effort:** ~90 min. New component + view toggle, computation from existing log data, no API changes (all data already fetched).

**Reasoning:** This is the single feature most likely to increase retention. Users who can see their own progress stay. Users who can't, leave. The 14-day window is too narrow to show growth.

---

### BB5: Light/Dark Theme Toggle with System Detection

**The gap:** The app is dark-mode only. Multiple prior documents park "theme toggle" as a Tier 4 nice-to-have, but it's actually an accessibility and usability issue: dark-only themes cause readability problems in bright environments and for users with certain visual conditions.

**Why now (not Tier 4):** The CSS is already well-organized with a consistent color palette. Converting to CSS custom properties is a ~30 min refactor that also improves maintainability. It naturally pairs with BB1 (accessibility).

**Scope:**
- Extract all color values in `index.css` and `App.css` into CSS custom properties on `:root`
- Define light-mode overrides under `@media (prefers-color-scheme: light)` and `:root[data-theme="light"]`
- Add a small toggle button (sun/moon icon, no emoji) in the app header
- Persist preference in `localStorage` with fallback to system preference
- Respect `prefers-color-scheme` on first visit

**What it doesn't include:** High-contrast mode, custom theme colors, per-habit theme.

**Estimated effort:** ~40 min. CSS refactor + one small UI element. No data model or API changes.

**Reasoning:** Theme support is infrastructure that every future UI feature benefits from. Building more UI on top of hardcoded colors means more migration work later.

---

## Recommended Build Order

| Order | Feature | Effort | Why this order |
|-------|---------|--------|----------------|
| 1 | BB3: Timezone Fix | ~20 min | Correctness bug — fix before building anything date-dependent |
| 2 | BB1: Accessibility Pass | ~45 min | Foundation — every subsequent feature should be accessible from the start |
| 3 | BB5: Theme Toggle | ~40 min | CSS variable extraction benefits all future UI work |
| 4 | BB2: Completion Notes | ~50 min | First new user-facing feature; small, satisfying, shippable |
| 5 | BB4: Stats View | ~90 min | Largest item, highest retention impact, benefits from clean CSS/a11y foundation |

**Total: ~4 hours of implementation** for all five.

---

## Backlog (Post-BB, Prioritized)

These are the highest-impact items from the 135 prior proposals, filtered to items that remain valuable after the BB series ships. Each is a single PR.

### High Priority (Next Sprint)
1. **Custom Scheduling** (G1/AA5) — Mon/Wed/Fri habits, N-times/week. The most-requested missing data model feature.
2. **Today View** (I3/D3) — "What's left today?" dashboard replacing the backward-looking grid as the default view.
3. **Inline Confirmation Dialog** — Replace remaining `window.confirm` calls (BB1 starts this, finish it).

### Medium Priority (Following Sprint)
4. **Completion Celebration** (M1) — CSS animation on check-off. Pure delight, zero data model changes.
5. **Drag-to-Reorder** (M2/V2) — Add `order` field to habits, drag handle in rows.
6. **Momentum Score** (Z1) — Weighted rolling average replacing binary streak count.
7. **Empty State Onboarding** (Z5) — Template suggestions for first-time users.

### Lower Priority (When Fundamentals Are Solid)
8. **Anti-Habits** (K4/AA1) — Inverted tracking for quit/reduce behaviors.
9. **Friction Capture** (AA3) — "Why did you skip?" prompt with categorized reasons.
10. **Data Export** — JSON/CSV download of all habit data.
11. **Habit Scaling** (K1) — Tiny/standard/stretch tiers per habit.
12. **PWA Offline Support** — Service worker for offline check-ins, sync on reconnect.

---

## Repo Hygiene Note

The repository root contains 35 feature planning documents (FEATURES_v3–v15, FEATURES_FINAL, FEATURES_NEW, FEATURE_PLAN, ROADMAP, FEATURE_REVIEW_2026-10-29 through 2026-11-18). Consider:
- Moving all prior documents to a `docs/archive/` directory
- Keeping only this document and a slim `BACKLOG.md` at the root
- Adopting a rule: no new planning document until the previous plan's items ship

---

*This is planning document #36. The next commit should be code.*
