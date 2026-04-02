# Habit Garden - Feature Roadmap & Backlog

> Living document for planned features, priorities, and design reasoning.

---

## Current State Summary

Habit Garden is a full-stack habit tracker (React + Express) with:
- Habit CRUD (create, archive, delete)
- Daily & weekly frequency tracking with toggle
- 14-day visual history grid
- Streak calculation (daily & weekly)
- Dark theme UI, optimistic updates, toast notifications
- JSON file persistence with async mutex
- 17 backend integration tests

The app covers the **core loop** well (create habit → track daily → see streak).
The features below target three goals: **engagement/retention**, **insight/motivation**, and **robustness/scalability**.

---

## Priority Tiers

### P0 - High Priority (Next Sprint)

#### 1. Dashboard Statistics & Progress Overview
**What:** A summary panel above the habit table showing today's completion rate, total active habits, longest active streak, and a weekly completion percentage.
**Why:** Users currently see individual streaks but have no aggregated view of how they're doing overall. A dashboard answers the daily question *"Am I on track?"* at a glance without scanning every row. This is low-effort, high-impact — it only requires computing derived state from existing data.
**Scope:** Frontend only. New `<Dashboard />` component consuming existing `habits` and `logs` state.

#### 2. Habit Categories / Tags
**What:** Allow users to assign one or more tags (e.g., "Health", "Work", "Learning") to habits, with the ability to filter the table by tag.
**Why:** As the habit list grows beyond 5-7 items, cognitive load increases. Categories let users focus on a domain (e.g., morning routine vs. fitness) and create a sense of structure. Tags are more flexible than rigid categories — users define their own taxonomy.
**Scope:** Schema change (`tags: string[]` on Habit), new `POST /api/tags` endpoint (optional, or inline creation), filter UI in `HabitTable`.

#### 3. Undo / Redo for Accidental Toggles
**What:** A brief (5-second) undo toast when toggling a habit, and an undo button that reverts the last toggle action.
**Why:** The current toggle is instant and irreversible in the UI. Mis-taps on mobile or accidental clicks are common in checkbox-heavy interfaces. An undo toast is a well-established UX pattern (Gmail, Slack) that prevents frustration without adding confirmation dialogs.
**Scope:** Frontend state management change in `useHabits`. No backend changes — the undo simply re-toggles.

#### 4. Data Export (JSON / CSV)
**What:** A button to export all habits and logs as JSON or CSV.
**Why:** Users own their data. Export builds trust and enables migration to other tools. It also serves as a manual backup since there's no database — if `data.json` corrupts, users lose everything. CSV export is useful for users who want to analyze habits in spreadsheets.
**Scope:** New `GET /api/export?format=json|csv` endpoint. Simple download button in the UI.

---

### P1 - Medium Priority (Next 2-3 Sprints)

#### 5. Habit Completion Heatmap (GitHub-style)
**What:** A calendar heatmap (like GitHub's contribution graph) showing completion density over the past 3-6 months per habit or across all habits.
**Why:** The 14-day window is good for daily awareness but doesn't show long-term patterns. A heatmap answers *"Am I getting better over time?"* and surfaces patterns like weekend drops or monthly cycles. This is a strong motivational visual — seeing a wall of green is psychologically rewarding.
**Scope:** New `<Heatmap />` component. May need a `GET /api/habits/:id/stats` endpoint for efficient date-range queries as data grows.

#### 6. Habit Notes / Journal Entries
**What:** Allow users to attach a short note to a specific day's check-in (e.g., "Ran 5k today" or "Skipped — was sick").
**Why:** Bare checkmarks lose context over time. Notes let users reflect on *why* they succeeded or failed, which research shows improves habit formation. It transforms the tracker from a binary checklist into a lightweight journal.
**Scope:** New `notes` collection in data model: `{ habitId, date, text }`. New `POST /api/notes` endpoint. UI: click on a checked day to add/edit a note tooltip.

#### 7. Habit Reminders / Notification Hooks
**What:** Users can set a preferred time for each habit. The app shows a "pending today" indicator and optionally integrates with browser Notification API for reminders.
**Why:** Forgetting is the #1 reason habits fail. Even a simple "You haven't checked in 3 habits today" browser notification at 8 PM dramatically improves follow-through. The `targetTime` field also enables future mobile push notifications.
**Scope:** Add `targetTime: string | null` to Habit schema. Frontend: Notification API permission request + scheduling logic. No backend changes needed for browser notifications.

#### 8. Habit Reordering (Drag & Drop)
**What:** Let users drag habits to reorder them in the table, with the order persisted.
**Why:** Users naturally prioritize — morning habits at top, evening at bottom. Currently habits are ordered by creation date, which becomes unhelpful over time. Manual ordering gives users control and reduces visual scanning.
**Scope:** Add `sortOrder: number` to Habit schema. New `PATCH /api/habits/reorder` endpoint. Frontend: drag-and-drop library (e.g., `@dnd-kit/core`) or native HTML drag API.

#### 9. Weekly / Monthly Summary Email or Report View
**What:** A dedicated "Report" page showing completion rates per habit over the last week/month, best and worst days, streak milestones hit, and trends (improving/declining).
**Why:** The daily view optimizes for *doing*; a periodic report optimizes for *reflecting*. Reflection is key to habit science — it lets users adjust their strategy (drop a habit that isn't working, double down on one that is). Even without email, an in-app report page adds significant value.
**Scope:** New `<ReportPage />` component with chart library (e.g., `recharts` or lightweight `<canvas>` charts). All data derivable from existing `logs`.

---

### P2 - Backlog (Future Consideration)

#### 10. User Authentication & Multi-User Support
**What:** Login/signup system so multiple users can use the same instance, each with isolated data.
**Why:** Currently single-user with no auth. This blocks any deployment as a shared service. However, for a personal self-hosted tool, auth may be unnecessary overhead. Prioritize only if the app is intended for public deployment.
**Scope:** Large. Requires user model, password hashing (bcrypt), JWT/session tokens, middleware, and per-user data isolation. Consider SQLite migration at this point.

#### 11. SQLite / PostgreSQL Migration
**What:** Replace `data.json` with a proper database.
**Why:** JSON file storage works for a single user with <100 habits but doesn't scale. File I/O with mutex becomes a bottleneck under concurrent access. A database enables efficient queries (date-range lookups for heatmaps), ACID transactions, and indexing. SQLite is the right first step — zero config, still file-based, but with SQL query power.
**Scope:** Large. Rewrite `app.js` data layer. Schema migration script. Update all tests.

#### 12. Habit Templates / Presets
**What:** Offer a library of common habit templates (e.g., "Drink 8 glasses of water", "Read 30 minutes", "Exercise") that users can add with one click.
**Why:** Reduces friction for new users who don't know where to start. Templates with suggested frequencies and colors provide a guided onboarding experience. Low complexity, nice polish.
**Scope:** Small. Static JSON array of templates. New `<TemplatePickerModal />` component.

#### 13. Habit Goals & Milestones
**What:** Users set a target (e.g., "Complete 30 days in a row") and get a visual progress bar + celebration animation when achieved.
**Why:** Open-ended streaks can feel demotivating ("I'm only on day 4 of infinity"). Finite goals create achievable checkpoints. Milestone celebrations (confetti, badge) trigger dopamine and reinforce the behavior loop.
**Scope:** Add `goal: number | null` to Habit schema. Progress bar in `HabitRow`. Celebration animation (CSS or lightweight library).

#### 14. Dark/Light Theme Toggle
**What:** Add a theme toggle. Currently hardcoded to dark theme only.
**Why:** User preference. Some users find light themes easier to read, especially in bright environments. Low complexity since CSS variables are already defined in `index.css`.
**Scope:** Small. CSS variable swap + toggle button + localStorage persistence.

#### 15. PWA / Offline Support
**What:** Convert to a Progressive Web App with service worker caching and offline toggle support that syncs when back online.
**Why:** Habit tracking is a daily ritual often done on mobile. PWA enables "Add to Home Screen", offline access, and near-native mobile experience without building a separate mobile app. Offline support is critical since the most common usage moment (in bed, on commute) may have spotty connectivity.
**Scope:** Medium-large. Service worker registration, cache strategies, IndexedDB for offline queue, sync logic on reconnect.

#### 16. Social / Accountability Features
**What:** Share a read-only link to your habit board, or pair with an accountability partner who can see your streaks.
**Why:** Social accountability is one of the strongest motivators for habit formation. Even passive visibility ("my partner can see I skipped today") increases follow-through. Keep it lightweight — no social network, just share links.
**Scope:** Medium. Requires auth (P2-10), unique share tokens, read-only public routes.

---

## Implementation Order Recommendation

```
Phase 1 (Quick Wins)          Phase 2 (Engagement)         Phase 3 (Scale)
─────────────────────          ────────────────────         ───────────────
 1. Dashboard Stats             5. Heatmap                  10. Authentication
 3. Undo Toast                  6. Habit Notes              11. Database Migration
 4. Data Export                 7. Reminders                15. PWA / Offline
 14. Theme Toggle               8. Drag & Drop Reorder
 12. Habit Templates            9. Reports Page
 2. Categories/Tags            13. Goals & Milestones
```

**Phase 1** requires no schema changes or new dependencies — pure frontend + simple endpoints.
**Phase 2** introduces richer data and interactions but stays single-user.
**Phase 3** is foundational infrastructure that enables public deployment and mobile use.

---

## Extended Feature Proposals

See **[NEW_FEATURES.md](./NEW_FEATURES.md)** for 15 additional creative features including:
- Streak Shields & Vacation Mode, Habit Health Score, Habit Stacking/Routines
- Failure Recovery Dashboard, Smart Rest Days, Mood & Energy Correlation
- Habit Experiments (30-Day Trials), Insights Engine, Micro-Habits
- Weekly Review Wizard, Keyboard Shortcuts, and more

That document includes a combined implementation roadmap merging both existing and new features across 5 sprints.

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| JSON file storage for now | Sufficient for single-user. Defer DB until auth is needed. |
| No mobile app | PWA covers mobile. Native app is out of scope. |
| No gamification (XP, levels) | Risks extrinsic motivation replacing intrinsic. Goals/milestones are enough. |
| Tags over rigid categories | More flexible, user-defined, no predefined taxonomy to maintain. |
| Browser notifications over email | Zero infrastructure. Email requires SMTP setup and is overkill for v1. |
| SQLite over PostgreSQL | Zero-config, file-based, matches the app's simplicity. Upgrade path exists. |
