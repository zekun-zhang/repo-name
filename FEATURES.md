# Habit Garden - Feature Plan & Backlog

> This document outlines proposed new features for Habit Garden, organized by priority tier.
> Each feature includes reasoning for why it adds value to the product.

---

## Current State Summary

Habit Garden is a clean, minimal habit tracker with:
- Habit CRUD (create, archive, delete)
- Daily/weekly frequency tracking with toggle
- 14-day history view with streaks
- Dark-themed responsive UI
- JSON file-based persistence (no auth, single user)

---

## Tier 1 — High Impact, Core Experience

### 1.1 Habit Editing
**What:** Allow users to edit a habit's name, frequency, and color after creation.
**Why:** Currently habits are immutable once created. Users frequently want to rename or recolor habits without losing their history. This is table-stakes UX.
**Scope:** New `PATCH /api/habits/:id` endpoint + inline edit UI on HabitRow.

### 1.2 Habit Reordering (Drag & Drop)
**What:** Let users drag habits to reorder them. Persist order in a new `order` field.
**Why:** As users accumulate habits, they want to prioritize and group them. Without ordering, the list feels rigid. Adds a sense of ownership over the layout.
**Scope:** Add `order: number` to Habit type, new `PUT /api/habits/reorder` endpoint, drag-and-drop in HabitTable (use a lightweight library or native HTML drag API).

### 1.3 Undo / Snackbar Confirmation
**What:** When archiving or deleting a habit, show an "Undo" snackbar instead of a confirm dialog.
**Why:** The current `window.confirm()` is disruptive and feels dated. An undo snackbar is less intrusive, faster, and follows modern UX patterns (Gmail, Google Keep). Reduces accidental data loss anxiety.
**Scope:** Replace confirm dialogs with timed undo toasts; delay the actual API call for ~5 seconds.

### 1.4 Data Export / Import
**What:** Export all habits + logs as JSON, and import from a previously exported file.
**Why:** No auth = no cloud backup. Users need a way to safeguard their data and migrate between devices. This is critical for a file-based app with no account system.
**Scope:** `GET /api/export` returning full data.json, `POST /api/import` accepting the same format, plus UI buttons.

---

## Tier 2 — Engagement & Motivation

### 2.1 Streak Milestones & Celebrations
**What:** Show visual celebrations (confetti animation, badge) when users hit streak milestones (7, 14, 30, 60, 100 days).
**Why:** Streaks alone are motivating, but milestone moments amplify the reward. Behavioral psychology shows that intermittent positive reinforcement dramatically improves habit retention. This is the "dopamine hit" feature.
**Scope:** Frontend-only. Detect milestones in streak calculation, trigger CSS animation or lightweight confetti library. Store "seen milestones" in localStorage to avoid repeat celebrations.

### 2.2 Completion Rate & Stats Dashboard
**What:** A stats view showing: completion rate (last 7/30/90 days), best streak ever, total completions, and a simple calendar heatmap.
**Why:** The 14-day window is too narrow to see long-term progress. A dashboard gives users the "big picture" view that sustains motivation over months. Calendar heatmaps (a la GitHub contributions) are universally understood and satisfying.
**Scope:** New `/stats` view or expandable panel. Compute stats from existing log data. Heatmap can be a simple CSS grid — no charting library needed.

### 2.3 Daily Summary / Score
**What:** Show a "Today: 4/7 habits completed" progress bar at the top of the page.
**Why:** Gives immediate, glanceable feedback on today's progress. Creates a natural "completion drive" — users will want to fill the bar. Simple but powerful motivational lever.
**Scope:** Frontend-only. Count today's completions vs. active non-archived habits. Render as progress bar in the header.

### 2.4 Notes / Journal per Day
**What:** Allow adding a short text note to any habit completion (e.g., "ran 3 miles", "read 20 pages").
**Why:** Turns binary check/uncheck into richer self-tracking. Lets users reflect on *quality*, not just consistency. Especially valuable for habits like exercise or reading where context matters.
**Scope:** Extend log data structure from `string[]` to `{ date: string, note?: string }[]`. Add a note popover on click in HabitRow. New `POST /api/logs/note` endpoint.

---

## Tier 3 — Polish & Delight

### 3.1 Categories / Tags
**What:** Group habits by user-defined categories (e.g., "Health", "Learning", "Productivity") with color-coded sections.
**Why:** As the habit count grows, a flat list becomes hard to scan. Categories add visual structure and help users think about balance across life areas.
**Scope:** Add `category?: string` to Habit. Group habits by category in HabitTable. Simple category filter/toggle in the sidebar.

### 3.2 Dark/Light Theme Toggle
**What:** Add a theme switcher. Currently only dark theme exists.
**Why:** Dark mode is great, but some users prefer light mode during daytime. A toggle respects user preference and shows design maturity. Can default to system preference via `prefers-color-scheme`.
**Scope:** Extract CSS variables for theming, add toggle in header, persist preference in localStorage.

### 3.3 Habit Templates / Quick Start
**What:** Offer preset habit templates ("Drink water", "Exercise 30 min", "Read 10 pages", "Meditate", "No sugar") on first use or via a "Browse templates" button.
**Why:** Blank-slate paralysis is real. New users benefit from curated starting points. Reduces onboarding friction and gives the app an opinionated, helpful personality.
**Scope:** Frontend-only. Static list of template objects. "Use template" button pre-fills the HabitForm.

### 3.4 Keyboard Shortcuts
**What:** `N` to open new habit form, `1-9` to toggle today's completion for habit #N, `?` for shortcut help.
**Why:** Power users track habits daily — keyboard shortcuts make the daily ritual faster. Shows attention to detail and respects frequent users' time.
**Scope:** Frontend-only. Global keydown listener with shortcut overlay.

### 3.5 PWA / Offline Support
**What:** Make the app installable as a Progressive Web App with a service worker for offline access.
**Why:** Habit tracking is a daily ritual often done on mobile. PWA lets users "install" it on their home screen and check off habits even without connectivity. Syncs when back online.
**Scope:** Add `manifest.json`, service worker with cache-first strategy, offline queue for toggle actions.

---

## Tier 4 — Backlog (Future Exploration)

### 4.1 Reminders / Push Notifications
**What:** Optional browser push notifications at user-configured times.
**Why:** The biggest failure mode of habit tracking is forgetting to check in. Notifications close the loop. Deferred to backlog because it requires notification permission UX and a service worker.

### 4.2 Social / Accountability Partner
**What:** Share a read-only view of your habit board with a friend via a unique link.
**Why:** Social accountability is one of the strongest behavior change tools. A shared view doesn't require auth — just a unique read-only token. Deferred because it introduces multi-user concerns.

### 4.3 Habit Scheduling (Specific Days)
**What:** Instead of just "daily" or "weekly", allow "Mon/Wed/Fri" or "weekdays only" schedules.
**Why:** Many habits aren't every-day (e.g., gym 3x/week). The current model counts missed off-days against streaks, which is demotivating. Deferred because it significantly complicates streak logic.

### 4.4 Multi-Device Sync (Cloud Storage)
**What:** Replace JSON file with a proper database (SQLite or PostgreSQL) and add user auth for cloud sync.
**Why:** Natural evolution if the app gains users. Deferred because the current file-based approach is intentionally simple and the app is currently single-user.

### 4.5 Gamification / XP System
**What:** Earn XP for completions, level up, unlock visual rewards (new garden themes, plant growth animations).
**Why:** Leans into the "Garden" metaphor. The garden could literally grow as users build consistency. Deferred because it requires significant design and animation work.

### 4.6 REST → WebSocket for Real-Time Updates
**What:** Add WebSocket support so multiple tabs/devices stay in sync without refresh.
**Why:** Minor quality-of-life improvement. Deferred because single-user file-based storage rarely needs real-time sync.

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| 1.1 Habit Editing | High | Small | **P0** |
| 2.3 Daily Summary/Score | High | Small | **P0** |
| 1.3 Undo Snackbar | Medium | Small | **P1** |
| 1.4 Data Export/Import | High | Small | **P1** |
| 2.1 Streak Milestones | High | Medium | **P1** |
| 2.2 Stats Dashboard | High | Medium | **P1** |
| 3.3 Habit Templates | Medium | Small | **P2** |
| 3.4 Keyboard Shortcuts | Medium | Small | **P2** |
| 3.2 Theme Toggle | Medium | Small | **P2** |
| 1.2 Drag & Drop Reorder | Medium | Medium | **P2** |
| 2.4 Notes per Day | Medium | Medium | **P2** |
| 3.1 Categories/Tags | Medium | Medium | **P3** |
| 3.5 PWA/Offline | High | Large | **P3** |
| 4.3 Habit Scheduling | High | Large | **Backlog** |
| 4.5 Gamification/XP | High | Large | **Backlog** |
| 4.1 Reminders | Medium | Large | **Backlog** |
| 4.2 Social Sharing | Medium | Large | **Backlog** |
| 4.4 Cloud Sync | High | XL | **Backlog** |
| 4.6 WebSockets | Low | Medium | **Backlog** |

---

## Recommended First Sprint

Focus on quick wins that dramatically improve the daily experience:

1. **Habit Editing** (1.1) — removes a top frustration
2. **Daily Summary/Score** (2.3) — instant motivation boost, ~30 lines of code
3. **Undo Snackbar** (1.3) — replaces clunky confirm dialogs
4. **Data Export/Import** (1.4) — data safety net

These four features are all small-to-medium effort with high user impact.
