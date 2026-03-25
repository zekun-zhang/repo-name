# Habit Garden - Feature Roadmap & Backlog

> **Generated:** 2026-03-25
> **Current State:** MVP with habit CRUD, daily/weekly tracking, streaks, 14-day history, archive/delete, dark theme, responsive layout, file-based JSON persistence, Express API, React frontend.

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 | High impact, low effort - do first |
| P1 | High impact, medium effort |
| P2 | Medium impact, worth building |
| P3 | Nice-to-have / future exploration |

---

## P0 - Quick Wins

### 1. Unarchive Habits

**What:** Allow users to restore archived habits back to the active list.
**Why:** Currently archiving is a one-way action. Users who accidentally archive or want to resume an old habit have no way to recover it without directly editing `data.json`. This is a basic usability gap.
**Scope:**
- Add `POST /api/habits/:id/unarchive` endpoint
- Add "Archived" section at bottom of habit table (collapsible)
- Add "Restore" button on archived habits

### 2. Habit Reordering (Manual Sort)

**What:** Let users drag-and-drop or use up/down arrows to reorder habits.
**Why:** Users naturally want their most important habits at the top. Currently order is insertion-based. Without reordering, the list becomes unwieldy as habits accumulate.
**Scope:**
- Add `order` field to habit schema (integer)
- Add `PATCH /api/habits/reorder` endpoint (accepts array of IDs in new order)
- Implement drag-and-drop (e.g. `@dnd-kit/core`) or arrow buttons in `HabitRow`

### 3. Confirmation on Archive

**What:** Add a confirmation dialog before archiving a habit (matching the existing delete confirmation).
**Why:** Archive is currently a single-click action with no undo. Users can accidentally archive habits. Consistency with the delete flow.
**Scope:**
- Add `window.confirm()` call in archive handler (trivial)

---

## P1 - Core Enhancements

### 4. Garden Visualization

**What:** A visual garden/terrarium where each habit is represented as a plant. The plant grows taller and blooms as the streak increases. Wilting occurs when streaks break.
**Why:** The app is called "Habit Garden" but has no garden metaphor in the UI. This is the defining differentiator from every other habit tracker. It turns abstract streak numbers into an emotional, visual reward system that taps into the same psychology as virtual pet games. Users will check in *to see their garden grow*, not just to check a box.
**Scope:**
- New `<Garden />` component with SVG/CSS plant illustrations
- Plant stages: seed (0-2 days) -> sprout (3-6) -> growing (7-13) -> blooming (14-29) -> tree (30+)
- Use each habit's color for its plant
- Toggle between table view and garden view
- Estimated effort: medium-large

### 5. Statistics & Analytics Dashboard

**What:** A dedicated stats panel showing completion rates, best streaks, weekly/monthly trends, and a GitHub-style contribution heatmap.
**Why:** The current 14-day view is too narrow to see long-term progress. Users need to see that their effort compounds over time. Visualization of progress is one of the strongest motivators for habit formation (based on behavioral psychology research). Analytics turn raw data into insight.
**Scope:**
- New route `/stats` or slide-out panel
- Completion rate per habit (last 7d, 30d, all-time)
- Best streak ever vs current streak
- Calendar heatmap (like GitHub contributions) showing density of completions across all habits
- Day-of-week breakdown (e.g. "You skip most habits on Fridays")
- Simple bar/line chart for weekly completion trends
- New `<Dashboard />` component, possibly with a lightweight chart library (e.g., recharts or pure SVG)

### 6. Habit Categories / Tags

**What:** Allow users to tag habits with categories like "Health", "Productivity", "Learning", "Mindfulness", etc. Filter and group the table by category.
**Why:** As the habit list grows (5+), the flat list becomes hard to scan. Categories create mental grouping and let users focus on one life area at a time. This is the #1 feature gap - every serious habit app has it. It also enables future features like per-category stats.
**Scope:**
- Add `category` field to habit schema (string, optional)
- Predefined categories + custom option
- Category filter bar above the habit table
- Color-coded category badges in habit rows
- Migration: existing habits default to "Uncategorized"
- API: `GET /api/categories` (derived from habits), filter param on `GET /api/habits`

### 7. Edit Habit

**What:** Allow editing a habit's name, frequency, color, and category after creation.
**Why:** Users currently cannot fix typos, change colors, or switch frequency without deleting and recreating. This loses all historical log data. Editing is a fundamental CRUD operation that's missing.
**Scope:**
- `PUT /api/habits/:id` endpoint
- Inline edit mode or modal form in `HabitRow`
- Validation same as create

---

## P2 - Engagement & Retention

### 8. Streak Shields (Forgiveness Days)

**What:** Each habit gets 1-2 "shield" days per month where missing a day doesn't break the streak.
**Why:** The #1 reason people abandon habit trackers is the "what the hell" effect - one missed day breaks a long streak, which feels devastating, so they give up entirely. Streak shields are a proven gamification pattern (used by Duolingo, Snapchat) that prevents this spiral. It acknowledges that life happens while still encouraging consistency.
**Scope:**
- Add `shieldsPerMonth` and `shieldsUsed` fields
- Modify streak calculation in `utils.ts` to skip shielded gaps
- Visual indicator (shield icon) on days where a shield was auto-applied
- Reset shield count monthly

### 9. Notes / Micro-Journal on Completions

**What:** Optional one-line note field when checking in a habit (e.g. "Ran 5km", "Read 20 pages"). Plus a random motivational quote on the header that rotates daily.
**Why:** Bare checkmarks lose context. Adding notes turns habit tracking into a micro-journal, which helps users reflect on quality, not just quantity. It enriches the data for the stats dashboard too. The motivational quotes keep the landing screen fresh and emotionally engaging.
**Scope:**
- Add `notes` field to logs: `logs[habitId] = [{ date, note? }]` (breaking schema change, needs migration)
- Click-to-expand on completed cells to view/edit note
- API: extend `POST /api/logs/toggle` to accept optional `note` param
- Static array of ~50 curated quotes, hash date to select one deterministically

### 10. Completion Celebrations

**What:** Satisfying micro-animations and optional sounds when toggling a habit complete. Milestone celebrations at streak thresholds (7, 30, 100 days).
**Why:** Immediate positive feedback is critical for habit reinforcement (the "reward" in the cue-routine-reward loop). A subtle confetti burst or checkmark animation makes each check-in feel rewarding rather than mechanical. Milestone celebrations mark progress and create shareable moments.
**Scope:**
- CSS animation on check-in (scale + color pulse)
- Confetti effect at milestones (canvas-confetti library, ~3KB)
- Toast message: "7-day streak on Meditate!"
- Sound toggle in settings (default off)

### 11. Light / Dark Theme Toggle

**What:** Add a theme switcher. Currently hardcoded to dark theme.
**Why:** Dark theme is great, but some users prefer light mode, especially during daytime or for accessibility reasons. Theme preference is table-stakes for modern apps.
**Scope:**
- CSS custom properties for theming (refactor hardcoded colors)
- Theme toggle button in header
- Persist preference to localStorage
- Respect `prefers-color-scheme` system setting as default

### 12. Gamification: Points, Levels & Badges

**What:** Award points for completions, bonus for streaks, and unlock badges (e.g. "7-day streak", "100 completions", "Perfect week").
**Why:** Gamification taps into intrinsic motivation. Badges give users milestone celebrations. This is what separates a tool from an experience. Pairs naturally with the existing streak system.
**Scope:**
- Points system: 1 point per completion, 2x multiplier for streaks > 7
- Level thresholds (Level 1: 0pts, Level 2: 50pts, etc.)
- Badge definitions (JSON config): streak-based, volume-based, consistency-based
- Badge display in header/profile area
- Celebration animation on badge unlock

### 13. PWA Support (Installable App)

**What:** Add a service worker and web manifest so the app can be installed on mobile home screens and work offline.
**Why:** Habit tracking is inherently mobile-first - users check in throughout the day. A PWA removes the friction of opening a browser and navigating to a URL. Offline support means check-ins work on planes, subways, etc. and sync when back online.
**Scope:**
- `manifest.json` with icons and theme colors
- Service worker for caching static assets
- Offline queue for API calls (sync on reconnect)
- Vite PWA plugin simplifies setup significantly

---

## P3 - Future Exploration

### 14. Habit Templates Library

**What:** Pre-built habit packs like "Morning Routine" (meditate, exercise, journal, healthy breakfast) or "Developer Growth" (read docs, side project, leetcode).
**Why:** Reduces friction for new users. Instead of staring at a blank form, they pick a template and customize. Templates also encode best practices for habit stacking.
**Scope:**
- Static JSON file with 15-20 preset habits (name, frequency, suggested color)
- "Browse Templates" button in HabitForm
- Modal/dropdown showing templates grouped by category
- One-click add (pre-fills the form)

### 15. Recurring Reminders (Browser Notifications)

**What:** Optional push notifications at user-defined times reminding them to complete habits.
**Why:** "Out of sight, out of mind" is the enemy of habit building. Timely reminders at the right moment (e.g., 7am for morning habits) dramatically increase completion rates.
**Scope:**
- Browser Notification API permission request
- Per-habit reminder time setting
- Service worker for scheduled notifications
- Requires PWA support (#13) as prerequisite

### 16. Data Export / Import

**What:** Export all habits and logs as JSON or CSV. Import from file to restore or migrate.
**Why:** Data portability builds trust. Users are more willing to invest in a tool when they know they can take their data with them. Also useful for backups.
**Scope:**
- `GET /api/export` endpoint returning full `data.json`
- `POST /api/import` endpoint with validation
- Download/upload buttons in a settings area

### 17. Habit Chaining / Dependencies

**What:** Define relationships between habits (e.g. "After Morning Run, do Stretching").
**Why:** Habit stacking is a core concept from behavior science (James Clear's Atomic Habits). Allowing users to define chains helps them build routines, not just isolated habits.
**Scope:**
- `chainedAfter` field on Habit model (nullable habitId)
- Visual indicator showing chain order
- Optional: auto-suggest next habit after completing one

### 18. Widget / Quick-Entry Mode

**What:** A minimal, always-accessible view for quickly checking off today's habits without loading the full app.
**Why:** Reducing friction for daily check-ins. A compact "today only" view loads faster and focuses attention. Could also be a browser extension or PWA shortcut.
**Scope:**
- New route `/today` - shows only today's habits as a simple checklist
- Minimal CSS, fast load

### 19. Accountability Sharing

**What:** Generate a read-only shareable link showing your habit garden/stats for an accountability partner.
**Why:** Social accountability is one of the strongest predictors of habit success. Knowing someone can see your progress increases follow-through.
**Scope:**
- Token-based read-only view generation
- Public route that renders a simplified dashboard
- Requires authentication groundwork (currently no auth)

### 20. Multi-User Support & Authentication

**What:** User accounts with login/signup so multiple people can use the same instance.
**Why:** Currently single-user with a shared JSON file. Authentication is a prerequisite for sharing features, cloud sync, and any production deployment.
**Scope:**
- Large effort: auth system (JWT or OAuth), per-user data isolation, sessions
- SQLite or PostgreSQL database (replace data.json)
- Migration script for existing data.json users
- Consider this only if the app moves toward a SaaS model

---

## Implementation Backlog (Priority Order)

| # | Feature | Effort | Impact | Priority |
|---|---------|--------|--------|----------|
| 3 | Confirmation on Archive | Trivial | Medium | P0 |
| 1 | Unarchive Habits | Small | High | P0 |
| 7 | Edit Habit | Small | High | P0 |
| 2 | Habit Reordering | Small | High | P0 |
| 11 | Dark/Light Theme Toggle | Small | Medium | P1 |
| 4 | Garden Visualization | Large | High | P1 |
| 5 | Statistics Dashboard | Large | High | P1 |
| 6 | Categories & Tags | Medium | High | P1 |
| 10 | Completion Celebrations | Small | Medium | P2 |
| 8 | Streak Shields | Medium | Medium | P2 |
| 9 | Notes / Micro-Journal | Medium | Medium | P2 |
| 14 | Habit Templates | Small | Medium | P2 |
| 16 | Data Export & Import | Small | Medium | P2 |
| 12 | Gamification System | Large | Medium | P2 |
| 13 | PWA Support | Medium | High | P2 |
| 15 | Reminders / Notifications | Medium | High | P3 |
| 17 | Habit Chaining | Medium | Low | P3 |
| 18 | Quick-Entry / Today View | Medium | Medium | P3 |
| 19 | Accountability Sharing | Large | Medium | P3 |
| 20 | Multi-Device Sync (Auth + DB) | XL | High | P3 |

---

## Recommended Implementation Order

```
Phase 1 - Polish (1-2 days)
├── #3  Confirmation on Archive
├── #1  Unarchive Habits
├── #7  Edit Habit
├── #2  Habit Reordering
└── #11 Light/Dark Theme Toggle

Phase 2 - Differentiator (3-5 days)
├── #4  Garden Visualization  <- the signature feature
├── #5  Statistics Dashboard
├── #6  Habit Categories/Tags
└── #10 Completion Celebrations

Phase 3 - Retention (3-5 days)
├── #8  Streak Shields
├── #9  Notes / Micro-Journal
├── #14 Habit Templates
└── #16 Data Export/Import

Phase 4 - Platform (5+ days)
├── #12 Gamification System
├── #13 PWA Support
├── #15 Recurring Reminders
└── #18 Quick-Entry / Today View

Phase 5 - Social (future)
├── #17 Habit Chaining
├── #19 Accountability Sharing
└── #20 Multi-User & Auth
```

---

## Technical Debt to Address Alongside Features

1. **No frontend tests** - Add React Testing Library tests before building new UI
2. **No client-side routing** - Add React Router before adding `/stats` or `/today` routes
3. **JSON file storage** - Works for single user but will need migration for any scale
4. **No input sanitization on frontend** - Add before templates/import features
5. **No API rate limiting** - Add before any public deployment

---

## Architectural Notes

- **Schema migrations:** Features #9 (notes) and #8 (shields) change the data shape. Add a `version` field to `data.json` and a migration function in `app.js` that runs on startup.
- **State management:** As complexity grows past Phase 2, consider extracting state into a lightweight store (Zustand or React context + reducer) instead of a single `useHabits` hook.
- **Component library:** The Garden visualization (#4) will benefit from SVG components. Consider a shared `src/components/icons/` directory.
- **Testing:** Each new endpoint needs corresponding tests in `server/__tests__/api.test.js`. Frontend tests (React Testing Library) should be added starting Phase 2.
