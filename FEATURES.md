# Habit Garden — Feature Proposals & Backlog

## Current State Summary

Habit Garden is a habit tracker with:
- Create habits (daily/weekly, custom color)
- 14-day visual completion grid
- Streak tracking
- Archive / delete habits
- Toast notifications
- Dark theme, responsive layout
- File-based JSON persistence, Express API, React frontend

---

## Proposed New Features

### Tier 1 — High Impact, Medium Effort

#### 1. Categories & Tags
**What:** Let users group habits into categories (e.g. Health, Work, Learning) and optionally tag them.
**Why:** As the habit list grows, it becomes hard to scan. Categories enable filtering and give users a mental model for organizing their life areas. This is the #1 feature gap — every serious habit app has it.
**Scope:**
- Add `category` field to Habit model (nullable string)
- Category filter bar above the habit table
- Optional color-coding per category (override or complement habit color)
- API: `GET /api/categories` (derived from habits), filter param on `GET /api/habits`

#### 2. Statistics & Analytics Dashboard
**What:** A dedicated stats view showing completion rates, streaks over time, best/worst days, and weekly/monthly summaries.
**Why:** The current 14-day grid is great for quick glance but tells users nothing about long-term trends. Showing "you completed 85% of habits this month" is a proven motivator. Analytics turn raw data into insight.
**Scope:**
- New route `/stats` or slide-out panel
- Completion rate per habit (7d, 30d, all-time)
- Best streak ever (not just current)
- Heatmap calendar (GitHub-style) for a selected habit
- Day-of-week breakdown (e.g. "You skip most habits on Fridays")

#### 3. Habit Reordering (Drag & Drop)
**What:** Let users drag habits to reorder them in the table.
**Why:** Currently habits are in creation order. Users want their most important habits at the top. Manual ordering is a basic UX expectation for list-based apps.
**Scope:**
- Add `order` field to Habit model (integer)
- Use a lightweight drag-and-drop library (e.g. `@dnd-kit/core`)
- API: `PATCH /api/habits/reorder` (accepts array of IDs in new order)

#### 4. Reminders / Notification System
**What:** Optional daily reminder for incomplete habits, delivered via browser notification or email digest.
**Why:** The biggest reason people stop tracking habits is forgetting to open the app. Push notifications are the standard solution. Even a simple browser notification at a user-chosen time dramatically improves retention.
**Scope:**
- Browser Notification API integration (permission prompt)
- User-configurable reminder time (stored in localStorage or user profile)
- Service worker for background notifications
- Stretch: email digest via a simple cron job

---

### Tier 2 — Medium Impact, Lower Effort

#### 5. Notes / Journal on Completions
**What:** When toggling a habit complete, optionally add a short note (e.g. "Ran 5km" or "Only 10 min today").
**Why:** Bare checkmarks lose context. Adding notes turns habit tracking into a micro-journal, which helps users reflect on quality, not just quantity. It enriches the data for the stats dashboard too.
**Scope:**
- Add optional `note` field to log entries (change logs from `string[]` to `{date, note?}[]`)
- Click-to-expand on completed cells to view/edit note
- API: extend `POST /api/logs/toggle` to accept optional `note` param

#### 6. Habit Templates / Presets
**What:** Offer a library of common habit presets (e.g. "Drink 8 glasses of water", "Read 30 min", "Exercise") that users can add with one click.
**Why:** New users face a blank screen. Templates reduce friction and inspire habit ideas. This is a quick win that improves onboarding significantly.
**Scope:**
- Static JSON file with 15-20 preset habits (name, frequency, suggested color)
- "Browse Templates" button in HabitForm
- Modal/dropdown showing templates grouped by category
- One-click add (pre-fills the form)

#### 7. Data Export & Import
**What:** Export all habit data as JSON or CSV. Import from a file.
**Why:** Users want data portability. Export also serves as manual backup since the app uses file-based storage. This builds trust — users know their data isn't locked in.
**Scope:**
- API: `GET /api/export` returns full data.json
- API: `POST /api/import` validates and replaces/merges data
- Frontend: Export button (downloads file), Import button (file picker with confirmation)

#### 8. Dark/Light Theme Toggle
**What:** Add a light theme and a toggle switch.
**Why:** The current dark theme is well-designed but some users prefer light mode, especially during daytime. Theme preference is table-stakes for modern apps.
**Scope:**
- CSS variables for theme colors (already partially structured)
- Toggle component in header
- Persist preference in localStorage
- `prefers-color-scheme` media query for auto-detection

---

### Tier 3 — Nice to Have / Stretch Goals

#### 9. Gamification: Points, Levels & Badges
**What:** Award points for completions, bonus for streaks, and unlock badges (e.g. "7-day streak", "100 completions", "Perfect week").
**Why:** Gamification taps into intrinsic motivation. Badges give users milestone celebrations. This is what separates a tool from an experience. Pairs naturally with the existing streak system.
**Scope:**
- Points system: 1 point per completion, 2x multiplier for streaks > 7
- Level thresholds (Level 1: 0pts, Level 2: 50pts, etc.)
- Badge definitions (JSON config): streak-based, volume-based, consistency-based
- Badge display in header/profile area
- Celebration animation on badge unlock

#### 10. Multi-Device Sync (User Accounts)
**What:** Replace file-based storage with a database and add user authentication, enabling cross-device sync.
**Why:** The file-based JSON storage is the biggest architectural limitation. Moving to a real DB with auth unlocks multi-user support, mobile access, and production readiness. This is the natural evolution path.
**Scope:**
- SQLite or PostgreSQL database (replace data.json)
- Auth: simple email/password or OAuth (Google)
- Session management (JWT or cookie-based)
- Migration script for existing data.json users
- This is a large effort — likely a separate milestone

#### 11. Habit Chaining / Dependencies
**What:** Define relationships between habits (e.g. "After Morning Run, do Stretching").
**Why:** Habit stacking is a core concept from behavior science (James Clear's Atomic Habits). Allowing users to define chains helps them build routines, not just isolated habits.
**Scope:**
- `chainedAfter` field on Habit model (nullable habitId)
- Visual indicator showing chain order
- Optional: auto-suggest next habit after completing one

#### 12. Widget / Quick-Entry Mode
**What:** A minimal, always-accessible view for quickly checking off today's habits without loading the full app.
**Why:** Reducing friction for daily check-ins. A compact "today only" view loads faster and focuses attention. Could also be a browser extension or PWA shortcut.
**Scope:**
- New route `/today` — shows only today's habits as a simple checklist
- PWA manifest for "Add to Home Screen"
- Minimal CSS, fast load

---

## Implementation Backlog (Priority Order)

| # | Feature | Effort | Impact | Priority |
|---|---------|--------|--------|----------|
| 1 | Categories & Tags | Medium | High | P0 — Next |
| 2 | Habit Reordering | Small | High | P0 — Next |
| 6 | Habit Templates | Small | Medium | P1 — Soon |
| 8 | Dark/Light Theme Toggle | Small | Medium | P1 — Soon |
| 5 | Notes on Completions | Medium | Medium | P1 — Soon |
| 3 | Statistics Dashboard | Large | High | P2 — Planned |
| 7 | Data Export & Import | Small | Medium | P2 — Planned |
| 4 | Reminders / Notifications | Medium | High | P2 — Planned |
| 9 | Gamification System | Large | Medium | P3 — Future |
| 12 | Quick-Entry / Today View | Medium | Medium | P3 — Future |
| 11 | Habit Chaining | Medium | Low | P3 — Future |
| 10 | Multi-Device Sync (Auth + DB) | XL | High | P4 — Milestone |

---

## Suggested Sprint Plan

### Sprint 1: Organization & Polish
- [ ] Categories & Tags (#1)
- [ ] Habit Reordering (#3)
- [ ] Dark/Light Theme Toggle (#8)

### Sprint 2: Depth & Onboarding
- [ ] Habit Templates (#6)
- [ ] Notes on Completions (#5)
- [ ] Data Export & Import (#7)

### Sprint 3: Insights & Engagement
- [ ] Statistics Dashboard (#2)
- [ ] Reminders / Notifications (#4)

### Sprint 4: Delight
- [ ] Gamification System (#9)
- [ ] Quick-Entry / Today View (#12)

### Milestone: Production-Ready
- [ ] Multi-Device Sync / Auth / DB migration (#10)
- [ ] Habit Chaining (#11)

---

## Technical Debt to Address Alongside Features

1. **No frontend tests** — Add React Testing Library tests before building new UI
2. **No client-side routing** — Add React Router before adding `/stats` or `/today` routes
3. **JSON file storage** — Works for single user but will need migration for any scale
4. **No input sanitization on frontend** — Add before templates/import features
5. **No API rate limiting** — Add before any public deployment
