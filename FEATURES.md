# Habit Garden — Feature Roadmap & Backlog

> Generated from codebase analysis on 2026-03-29

---

## Current State Summary

Habit Garden is a full-stack habit tracker (React 19 + Express 5, JSON file storage) with:
- Habit CRUD (create, archive, delete — no edit)
- Daily/weekly frequency tracking with a 14-day calendar grid
- Streak calculation (consecutive days/weeks)
- Dark-themed responsive UI with toast notifications
- 16 backend API tests (Jest + Supertest), no frontend tests

---

## Feature Proposals

### Tier 1 — High Impact, Low-Medium Effort

#### 1. Habit Editing
**What:** Allow users to rename a habit, change its color, or switch frequency.
**Why:** Currently the only options are archive or delete. Users who typo a name or want to adjust color are forced to delete and recreate, losing all history. This is a basic CRUD gap.
**Scope:** New `PATCH /api/habits/:id` endpoint + inline edit UI on `HabitRow`.

---

#### 2. Completion Heatmap / Monthly Calendar View
**What:** Replace or supplement the 14-day grid with a GitHub-style heatmap or a scrollable monthly calendar showing completion density.
**Why:** 14 days is too narrow to see trends. A heatmap gives instant visual feedback on consistency, which is the core motivator for habit apps. This is the single most impactful UX upgrade.
**Scope:** New `HabitHeatmap` component, date navigation controls, minor API change to support date-range queries.

---

#### 3. Statistics & Insights Dashboard
**What:** A dedicated stats view showing: current streak, best streak, completion rate (%), total completions, weekly/monthly trend sparklines.
**Why:** Streaks alone don't tell the full story. A user completing 5/7 days weekly has great consistency but a "streak" of 0 every Monday. Completion rate and trends are far more motivating.
**Scope:** New `StatsPanel` component, `utils.ts` extensions for stats calculation, optional chart library (e.g., lightweight `uplot` or pure SVG).

---

#### 4. Undo / Confirmation for Destructive Actions
**What:** Add a confirmation dialog before deleting a habit, and a brief undo window (5s toast) after archive/delete.
**Why:** One misclick permanently destroys a habit and all its logs. There's no recovery. This is a serious UX safety gap.
**Scope:** Small `ConfirmDialog` component, temporary soft-delete buffer in state.

---

#### 5. Data Export & Import
**What:** Export all data as JSON (or CSV) and re-import it.
**Why:** The app uses a single JSON file with no backup mechanism. Users need a way to safeguard their data, migrate, or share between devices.
**Scope:** `GET /api/export` + `POST /api/import` endpoints, download/upload UI buttons.

---

### Tier 2 — Medium Impact, Medium Effort

#### 6. Habit Categories / Tags
**What:** Group habits by user-defined categories (e.g., Health, Learning, Fitness) with color-coded labels and filter/group-by in the UI.
**Why:** As users add more habits (10+), the flat list becomes hard to scan. Categories add structure and let users focus on one area at a time.
**Scope:** New `category` field on Habit model, tag management UI, filter controls on `HabitTable`.

---

#### 7. Habit Reordering (Drag & Drop)
**What:** Let users drag habits to reorder them, persisting the sort order.
**Why:** Habits are currently shown in creation order. Users naturally want their most important habits at the top. Manual sorting adds a sense of ownership.
**Scope:** Add `sortOrder` field to Habit model, integrate a lightweight drag library (e.g., `@dnd-kit`), new `PATCH /api/habits/reorder` endpoint.

---

#### 8. Flexible Scheduling (Custom Days)
**What:** Beyond "daily" and "weekly", allow habits like "Mon/Wed/Fri" or "3 times per week".
**Why:** Many real habits aren't every-day (gym 3x/week, meal prep on Sundays). Forcing "daily" penalizes users on rest days, breaking streaks unfairly. This dramatically improves accuracy.
**Scope:** Extend `Frequency` type to support `{ type: 'custom', days: number[] }` or `{ type: 'timesPerWeek', count: number }`. Update streak calculation logic in `utils.ts`.

---

#### 9. Notes / Journal per Completion
**What:** Let users attach a short note when marking a habit complete (e.g., "Ran 5k today", "Read chapter 12").
**Why:** Turns the tracker from a binary checklist into a lightweight journal. Users can look back and see *what* they did, not just *that* they did it. Adds emotional value.
**Scope:** Extend log structure from `string[]` (dates) to `{ date, note? }[]`, optional note input on cell click, note preview on hover.

---

#### 10. Reminder Notifications (Browser)
**What:** Optional browser push notifications at a user-set time reminding them to complete habits.
**Why:** The #1 reason habits fail is forgetting. A simple daily reminder at 8pm ("You have 3 incomplete habits today") closes this gap with minimal effort.
**Scope:** Service Worker + Notification API, user preference for reminder time, `NotificationSettings` component.

---

### Tier 3 — Creative / Ambitious (Backlog)

#### 11. Gamification — XP, Levels & Badges
**What:** Award XP for completions (bonus for streaks), show a level/progress bar, unlock badges for milestones (7-day streak, 100 total completions, etc.).
**Why:** Gamification taps into intrinsic motivation. The "garden" theme is perfect for this — habits could visually "grow" as streaks increase (seed → sprout → flower → tree).
**Scope:** New `Gamification` module, XP calculation engine, badge definitions, visual growth stages per habit, celebratory animations.

---

#### 12. Social / Accountability Features
**What:** Share a read-only habit dashboard link with a friend or accountability partner.
**Why:** Social accountability is one of the strongest behavior-change tools. Even a simple "my friend can see my streaks" creates powerful motivation.
**Scope:** Shareable public URLs (hash-based, no auth needed), read-only dashboard view, optional "nudge" button.

---

#### 13. Dark/Light Theme Toggle
**What:** Add a theme switcher. Currently hardcoded to dark mode.
**Why:** User preference. Some users prefer light themes, especially during daytime. Respecting `prefers-color-scheme` is modern best practice.
**Scope:** CSS custom properties for theming, `ThemeToggle` component, localStorage persistence.

---

#### 14. Offline-First with Local Storage Sync
**What:** Cache data in IndexedDB/localStorage, sync to server when online.
**Why:** The app currently fails completely without the server running. Offline support makes it usable as a PWA on mobile, dramatically increasing daily usage.
**Scope:** Service Worker, IndexedDB cache layer, conflict resolution strategy, PWA manifest.

---

#### 15. Multi-User Authentication
**What:** User accounts with login/signup so multiple people can use the same instance.
**Why:** Currently single-user only. Auth is a prerequisite for any shared/hosted deployment.
**Scope:** Auth library (e.g., Passport.js or JWT), user model, login/signup pages, per-user data isolation. Consider migrating from JSON file to SQLite.

---

## Prioritized Backlog

| Priority | Feature | Effort | Impact | Dependencies |
|----------|---------|--------|--------|--------------|
| **P0** | Undo / Confirm destructive actions | S | High | None |
| **P0** | Habit Editing | S | High | None |
| **P1** | Completion Heatmap / Calendar | M | Very High | None |
| **P1** | Statistics & Insights | M | High | None |
| **P1** | Data Export & Import | S | Medium | None |
| **P2** | Flexible Scheduling | M | High | None |
| **P2** | Habit Categories / Tags | M | Medium | None |
| **P2** | Habit Reordering | S | Medium | None |
| **P2** | Notes per Completion | M | Medium | None |
| **P2** | Dark/Light Theme Toggle | S | Low | None |
| **P3** | Browser Notifications | M | Medium | None |
| **P3** | Gamification (XP/Badges) | L | High | Stats |
| **P3** | Social / Accountability | L | Medium | Auth (optional) |
| **P4** | Offline-First / PWA | L | Medium | None |
| **P4** | Multi-User Auth | L | Medium | DB migration |

> **Effort:** S = Small (< 1 day), M = Medium (1–3 days), L = Large (3+ days)

---

## Recommended Implementation Order

**Sprint 1 — Foundation & Safety**
1. Habit Editing (close the CRUD gap)
2. Undo / Confirm destructive actions (protect user data)
3. Data Export & Import (backup safety net)

**Sprint 2 — Visibility & Motivation**
4. Completion Heatmap / Monthly Calendar (the biggest UX win)
5. Statistics & Insights Dashboard (make progress tangible)

**Sprint 3 — Flexibility**
6. Flexible Scheduling (custom days, X times/week)
7. Habit Categories / Tags
8. Habit Reordering (drag & drop)

**Sprint 4 — Engagement**
9. Notes / Journal per completion
10. Dark/Light Theme Toggle
11. Browser Notifications

**Backlog (future)**
12. Gamification system
13. Social features
14. Offline-first PWA
15. Multi-user authentication
