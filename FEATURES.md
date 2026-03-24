# Habit Garden — Feature Roadmap

> Tracked here for planning and implementation progress.

---

## Status Legend
- [ ] Not started
- [x] Done

---

## 1. Streak Tracking
**Consecutive days completed + longest streak per habit.**

- [ ] Calculate current streak (unbroken chain of completed days up to today)
- [ ] Calculate longest streak ever
- [ ] Display streak on each habit row (e.g. 🔥 7 days)

---

## 2. Calendar Heatmap View
**GitHub-style contribution heatmap per habit, replacing or augmenting the table.**

- [ ] Heatmap component showing last 365 days
- [ ] Color intensity based on completion (done / missed / no data)
- [ ] Tooltip on hover showing date + status
- [ ] Toggle between table view and heatmap view

---

## 3. Habit Categories / Tags
**Group and filter habits by category.**

- [ ] Add optional `category` field to habit model
- [ ] Category input on habit creation form
- [ ] Filter bar to show habits by category
- [ ] Color-code rows/cards by category

---

## 4. Completion Rate Stats
**Show % completion over recent time windows.**

- [ ] Calculate 7-day, 30-day, 90-day completion rates
- [ ] Display as a stat badge on each habit row
- [ ] Summary dashboard card showing overall completion rate

---

## 5. Reorder Habits (Drag & Drop)
**Let users set their own habit priority order.**

- [ ] Add `order` field to habit model
- [ ] Drag-and-drop sorting in the habit list
- [ ] Persist order via API

---

## 6. Habit Color & Icon
**Visual identity per habit.**

- [ ] Color picker on habit form (preset palette)
- [ ] Icon/emoji picker on habit form
- [ ] Render color/icon in habit list

---

## 7. Notes on Log Entries
**Add optional text notes when logging a habit.**

- [ ] Extend log model with optional `note` field
- [ ] Note input in toggle flow (optional, dismissible)
- [ ] Display note on hover/tap in table/heatmap

---

## 8. Flexible Frequency Targets
**Not every habit is daily.**

- [ ] Add `frequency` field: `daily`, `weekdays`, `weekends`, `custom (N days/week)`
- [ ] Update streak + completion logic to respect frequency
- [ ] Show target frequency on habit row

---

## 9. Real Database (SQLite)
**Replace fragile JSON file storage.**

- [ ] Add `better-sqlite3` dependency
- [ ] Migrate schema: habits table, logs table
- [ ] Migrate existing `data.json` on first run
- [ ] Remove file-based store

---

## 10. CSV Export
**Let users download their own data.**

- [ ] Export all habits + logs as CSV
- [ ] Export button in the UI
- [ ] Server endpoint `GET /api/export/csv`

---

## 11. Dark / Light Mode Toggle
**Currently locked to dark mode.**

- [ ] CSS variables for theme tokens
- [ ] Toggle button in header
- [ ] Persist preference in `localStorage`

---

## 12. User Accounts
**Multi-user support (larger scope).**

- [ ] Auth system (local username/password or OAuth)
- [ ] Scope all habits + logs to a user ID
- [ ] Session management

---

## 13. Reminders / Notifications
**Prompt users to complete habits.**

- [ ] Browser push notification support
- [ ] Per-habit reminder time setting
- [ ] Opt-in/opt-out

---

## Notes

- Items 1–4 are the highest value / lowest effort — good starting point.
- Item 9 (SQLite) is a prerequisite for Items 12–13 at scale.
- Item 12 (auth) is a large scope change and should be planned separately.
