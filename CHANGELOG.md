# Changelog

## 2026-11-15 — First Implementation Sprint

After 33 planning documents and 122+ feature proposals with zero implementations,
this session broke the cycle and shipped actual code.

### Bug Fixes

- **D1:** Removed dead `src/index.css` (duplicate of `App.css` resets)
- **D5:** Archive/unarchive endpoints now return 404 for nonexistent habit IDs
  (was silently returning 200)

### New Tests (7 added, total: 25)

- **D2:** 5 tests for `PUT /api/habits/:id` (edit endpoint) — name update,
  frequency+color update, 404 for missing habit, invalid frequency, empty name
- **D3:** 2 tests for `POST /api/habits/:id/unarchive` — success case, 404

### New Features

- **Z5: Empty State Onboarding** — New users see a welcoming empty state with
  4 starter habit suggestions (Drink water, Read 10 pages, 10 min walk,
  Meditate 5 min) as clickable chips that pre-fill the create form. Replaces
  the bare "No habits yet" message.

- **Z3: Habit Age Badge** — Each habit displays a small badge showing how long
  it's existed (3d, 2w, 4mo, 1y). Visual tier progresses from plain to green
  to gold as the habit ages. Reinforces the "Habit Garden" growth metaphor.

- **Z1: Momentum Score** — A rolling weighted average displayed as a colored
  progress bar beneath each habit's streak. Uses exponential decay (0.92^days)
  over 30 days. Missing one day drops momentum slightly instead of resetting to
  zero, solving the psychological devastation of broken streaks.

### Housekeeping

- Moved 33 planning documents to `docs/archive/` (previously cluttering root)
- Root now contains only `README.md` and `CHANGELOG.md`

### What's Next (Tier 1 Backlog)

1. **Undo last action** — Toast with 5-second undo button after any mutation
2. **Planned off-days** — Specify active days per habit (Mon/Wed/Fri) so rest
   days don't show as failures
3. **Completion sounds** — Web Audio API micro-reward chime on check-in

> Feature history: see `docs/archive/`
