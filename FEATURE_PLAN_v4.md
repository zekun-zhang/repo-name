# Habit Garden — Feature Plan v4 (Final Consolidation)

**Date:** 2026-09-24
**Status:** Supersedes ALL prior planning documents (FEATURES.md, NEW_FEATURES.md, BACKLOG.md, FEATURE_PROPOSALS.md, FEATURE_PLAN.md, FEATURE_PLAN_v3.md, ROADMAP.md, CREATIVE_FEATURES.md, IMPLEMENTATION_PLAN.md, FEATURE_ROADMAP_FINAL.md, GEMINI.md)

---

## 0. Honest Assessment

This project has **11 source files** (~960 lines of application code) and **11 planning documents** (~250KB of markdown). The last 10 git commits added planning documents. Zero added features. FEATURE_ROADMAP_FINAL.md (Sep 22) identified this exact problem and declared itself "the last planning document." Two days later, this document exists because the scheduled task asked for it.

**This document's purpose is narrow:** propose features NOT covered by prior documents, organize the full backlog into one place, and provide enough implementation detail that the next session can pick up any feature and build it without reading anything else. After this, the next commit should contain `.tsx` files, not `.md` files.

---

## 1. What's Built (Complete Inventory)

| Layer | What Exists | Files |
|-------|-------------|-------|
| **Data Model** | `Habit` (id, name, frequency, color, createdAt, archived), `HabitLog` (habitId → date strings) | `types.ts` |
| **API Client** | 5 endpoints: GET habits, POST habit, POST toggle, POST archive, DELETE habit | `api.ts` |
| **State** | `useHabits` hook with optimistic updates, rollback, toast errors | `hooks/useHabits.ts` |
| **Utilities** | ID gen, today ISO, toggle date in list, streak calc (daily + weekly), past-N-days | `utils.ts` |
| **Components** | `App` (root), `HabitForm` (create), `HabitTable` (grid container), `HabitRow` (per-habit) | `src/components/` |
| **Server** | Express + JSON file with async mutex lock. Validation for name, frequency, color, date format | `server/app.js` |
| **Tests** | 14 backend integration tests (Jest + Supertest). Zero frontend tests | `server/__tests__/` |
| **Styling** | Hardcoded dark theme, 339 lines CSS, responsive at 900px/600px breakpoints | `App.css` |

**What's NOT built that users expect:** edit habit, view/restore archives, theme toggle, undo, history beyond 14 days, any statistics, any onboarding.

---

## 2. New Feature Proposals (Not in Any Prior Document)

These 8 features represent the most impactful gaps in the current app. Some (Anti-Habits, MVD, Micro-Journal) were briefly mentioned in prior documents but never specified with implementation details or reasoning. Others (Habit Experiments, Rest Day Patterns, Habit Correlation, Completion Timestamps, Streak Recovery Mode) are genuinely new. All 8 are fleshed out here for the first time with data model changes, effort estimates, and implementation guidance.

---

### N1. Anti-Habits (Avoidance Tracking)

**Gap:** Every prior proposal assumes habits are things you DO. But many users track things they're trying NOT to do — stop smoking, no junk food, no doomscrolling, no nail-biting. The current model has no way to represent "I succeeded by NOT doing something today."

**Design:** A new habit type: `avoidance`. The UX inverts: the default state for each day is "success" (you didn't do the thing). You only tap a cell to log a *slip*. At end of day, unchecked days are automatically green — you avoided successfully. Slips show as red X marks. The streak counts consecutive days without a slip.

**Why it matters:** Habit trackers that only track positive actions force avoidance goals into awkward workarounds ("Do: No sugar" is semantically wrong — you didn't DO anything). Proper avoidance tracking reflects the psychology correctly: the goal is inaction, and the failure is the event.

**Data model change:**
- Add `'avoidance'` to `Frequency` type (or add a separate `type: 'positive' | 'avoidance'` field)
- For avoidance habits, logged dates represent *slips*, not completions
- Streak logic inverts: count consecutive days where the date is NOT in the log

**Effort:** Small. New type value, inverted streak calc, CSS for slip cells (red instead of green gradient).

---

### N2. Habit Experiments (Time-Boxed Trials)

**Gap:** All prior proposals treat habits as permanent. But real habit formation starts with experimentation: "Try cold showers for 30 days." "Do yoga for 2 weeks to see if I like it." Without a built-in end date, abandoned experiments clutter the habit list forever, and successful ones have no "graduation" moment.

**Design:** When creating a habit, optionally set a trial duration (7, 14, 30, 60, or 90 days). The habit row shows a progress bar and countdown: "Day 12 of 30." When the trial ends, a modal prompts three choices:
1. **Keep** — convert to a permanent habit (removes countdown)
2. **Extend** — restart the trial for another period
3. **Retire** — archive with a "completed experiment" badge (not a failure)

Expired, un-decided experiments show a gentle amber highlight until the user chooses.

**Why it matters:** Habit list bloat is a leading reason people abandon habit trackers. Time-boxing creates natural cleanup points. It also lowers the psychological barrier to starting: "Try for 14 days" feels lighter than "commit forever."

**Data model change:**
- Add optional `trialDays: number | null` and `trialStartDate: string | null` to `Habit`
- Frontend computes days remaining, progress percentage
- No backend logic changes needed — expiration is a UI concept

**Effort:** Small-Medium. New fields on create form (optional), progress bar component, expiration modal.

---

### N3. Minimum Viable Day (MVD)

**Gap:** Prior proposals addressed daily experience through Focus Mode (simplified UI) and Dashboard (aggregate stats). Neither addressed the psychological problem of an ever-growing habit list: when you have 12 habits and complete 9, you see "3 incomplete" rather than "core day achieved." There's no concept of "done enough for today."

**Design:** Each habit gets an optional "core" toggle (star icon). Core habits define the user's Minimum Viable Day. When all core habits are completed for today, the header displays a "Day Complete" state with a subtle celebration (green border, checkmark icon). Non-core habits are still visible and trackable but don't block the "done" signal.

The dashboard (if built) would show "MVD completion rate" separately from "total completion rate," giving two useful metrics: consistency on what matters vs. stretch performance.

**Why it matters:** Decision fatigue and guilt from long lists are well-documented habit-killer. MVD creates a "good enough" threshold. Psychologically, hitting MVD first and then doing extra habits feels like bonus achievement, not minimum obligation.

**Data model change:**
- Add `core: boolean` (default `false`) to `Habit`
- MVD status is pure frontend computation: `activeHabits.filter(h => h.core).every(h => logs[h.id]?.includes(today))`

**Effort:** Small. Star toggle on habit row, header state change, one boolean field.

---

### N4. Rest Day Patterns (Flexible Scheduling)

**Gap:** The current model offers two frequencies: daily (every day) and weekly (once per week). Real habits don't fit either: exercise is "5 of 7 days," a hobby might be "every other day," and gym routines often follow specific-day patterns (MWF). Prior proposals didn't address this — they focused on what to track, not WHEN to track.

**Design:** Replace the binary frequency dropdown with flexible scheduling options:
1. **Daily** — every day (current behavior)
2. **Weekly** — once per week (current behavior)  
3. **X per week** — e.g., "5 of 7 days" — user picks a target count
4. **Specific days** — e.g., Mon/Wed/Fri — user picks which days

The grid visually distinguishes planned rest days (dimmed, no-penalty) from missed days (empty/red). Streaks count only "due" days — resting on a planned rest day doesn't break a streak.

**Why it matters:** The #1 reason users hack habit trackers is to represent non-daily schedules. They create "Exercise (MWF only)" and mentally ignore Tue/Thu cells. Built-in scheduling removes this mental overhead and makes streaks honest.

**Data model change:**
- Replace `frequency: 'daily' | 'weekly'` with:
  ```
  schedule: 
    | { type: 'daily' }
    | { type: 'weekly' }
    | { type: 'x_per_week', target: number }
    | { type: 'specific_days', days: number[] }  // 0=Sun, 1=Mon, ...6=Sat
  ```
- Backward compat: old `frequency: 'daily'` maps to `{ type: 'daily' }`
- Streak calc changes: only count days where `isDue(habit, date)` is true

**Effort:** Medium. Schedule picker UI, `isDue()` logic, streak calc refactor, grid cell dimming for rest days.

---

### N5. Daily Micro-Journal

**Gap:** Prior proposals included "Habit Notes" (per-habit-per-completion annotations). This is different: a once-per-day reflection that sits above the habit grid, not attached to any single habit. No prior document proposed a daily journal entry.

**Design:** Below the header and above the grid, a collapsible "Today's note" section. A single-line text input (expandable to 2-3 lines). One entry per day, timestamped. Past entries visible when scrolling the Time Machine (N3 from FEATURE_ROADMAP_FINAL). The input is deliberately tiny — this is a micro-journal (one thought, not morning pages).

Example entries: "Rough day, still got the core 3 done." "Best morning routine in weeks." "Traveling — doing minimum."

**Why it matters:** Context collapses over time. In 3 months, looking back at a grid of checkmarks, you can't remember WHY that week was sparse. Was it vacation? Illness? Burnout? A one-line note per day preserves the story behind the data.

**Data model change:**
- New top-level field in data.json: `journal: { [date: string]: string }`
- New API endpoints: `GET /api/journal?from=&to=` and `POST /api/journal` (body: `{ date, text }`)

**Effort:** Small-Medium. New API routes, small UI component, text persistence.

---

### N6. Habit Correlation Discovery

**Gap:** Prior documents deferred "AI/ML features" as premature (need data volume). But simple statistical correlation (conditional probability) is not ML — it's arithmetic. No prior document proposed computing co-occurrence patterns from existing log data.

**Design:** After 30+ days of data, a small "Insights" card appears on the dashboard showing discovered correlations:
- "When you Exercise, you're 85% likely to also Eat Healthy (vs. 60% on non-exercise days)"
- "Meditation and Reading are your most consistent pair — done together 92% of the time"
- "You tend to skip Journaling when you skip Exercise"

Computed entirely client-side from the logs object. No ML, no server changes. Just conditional probability: P(HabitB completed | HabitA completed) vs. P(HabitB completed | HabitA not completed).

**Why it matters:** Users build habits in isolation but their habits interact. Knowing that exercise unlocks healthy eating gives users a lever — focus on the keystone habit. This turns raw data into actionable self-knowledge.

**Implementation:**
- Pure utility function: `findCorrelations(habits, logs, minDays=30) → Correlation[]`
- Only surface correlations with statistical significance (>20% difference in conditional probability and >10 data points)
- Frontend-only — no API changes

**Effort:** Small. Math utility + a card component. Gated behind 30 days of data.

---

### N7. Completion Timestamps (Silent Time-of-Day Tracking)

**Gap:** The current toggle records WHAT day a habit was done but not WHEN during the day. Prior proposals for analytics focused on completion rates, trends, and streaks. None captured the time dimension of individual completions.

**Design:** When a habit is toggled ON, silently record the timestamp (not just the date). Display nothing new immediately — this is passive data collection. After 2+ weeks, surface a subtle "Best window" insight per habit: "You usually do this between 7-9am" or "Most consistent in the evening."

Long-term, this enables a "Daily rhythm" visualization: a timeline view showing when during the day each habit typically gets completed, revealing routine patterns.

**Why it matters:** Habit science shows that time-anchoring (doing a habit at the same time each day) dramatically increases consistency. By surfacing when users naturally do each habit, the app helps them recognize and reinforce their own timing patterns without prescriptive scheduling.

**Data model change:**
- `HabitLog` evolves from `string[]` (dates) to `Array<string | { date: string, time: string }>` 
- Backward compat: plain strings are date-only (legacy data), objects include time
- `time` is `HH:MM` in local time, recorded only on toggle-on (not toggle-off)

**Effort:** Small. Record timestamp on toggle, aggregate after N days, display insight text.

---

### N8. Streak Recovery Mode

**Gap:** Prior proposals addressed streak psychology through Half-Life (continuous decay), Rebuild Cost (reframing display), and various shields/banks (preventing breaks). None addressed the UX of the recovery journey itself — the experience of rebuilding after a break.

**Design:** When a streak breaks, instead of showing "0 days," the habit enters "Recovery Mode." The streak pill changes to show progress toward the user's previous level: "Recovering: 3 of 7 days back." The target is configurable but defaults to the lesser of (a) the broken streak length or (b) 7 days. 

During recovery, the streak pill is amber instead of green. Completing the recovery target transitions the pill back to green with a small celebration animation and starts the new streak count from the recovery length (not from zero).

**Why it matters:** The hardest moment in habit formation is the day after a break. Showing "Streak: 0" after weeks of effort is demoralizing and is the #1 cause of permanent abandonment. Recovery mode reframes "starting over" as "coming back" — a smaller, achievable goal that rebuilds momentum.

**Implementation:**
- Track `lastStreakLength` per habit (or compute from logs)
- When current streak is 0 but there was a prior streak, enter recovery display
- Recovery target = `min(lastStreakLength, 7)`
- Pure frontend logic — no API changes

**Effort:** Small. Streak display logic + CSS state for amber recovery pill.

---

## 3. Consolidated Master Backlog

Everything from prior documents + the 8 new proposals above, deduplicated into one prioritized list. No feature appears twice. Features that were explicitly deferred in FEATURE_ROADMAP_FINAL.md remain deferred.

### Tier 1: Foundation (Fix MVP Gaps — Build First)

These are not features. They're missing basics that users encounter in their first session.

| ID | Feature | Description | Effort | Files Touched |
|----|---------|-------------|--------|---------------|
| F1 | **Edit Habit** | Change name, color, frequency after creation. Inline edit or modal. | S | `HabitRow.tsx`, `useHabits.ts`, `api.ts`, `app.js` |
| F2 | **View & Restore Archives** | Collapsible "Archived" section below main table. Unarchive button per row. | S | `App.tsx`, `HabitTable.tsx`, `useHabits.ts`, `api.js` (new endpoint) |
| F3 | **Undo Toast** | On toggle/archive/delete, show toast with "Undo" button (5s timeout). | S | `useHabits.ts`, `App.tsx`, `App.css` |
| F4 | **Theme Toggle** | Light/dark switch in header. CSS vars already exist in `index.css`. Add `data-theme` attr, persist to localStorage. | S | `App.tsx`, `App.css`, `index.css` |
| F5 | **Mobile Grid** | Below 600px: either horizontal scroll with sticky habit column, or card layout replacing the table. | S | `HabitTable.tsx`, `HabitRow.tsx`, `App.css` |

**Sprint goal:** The app feels complete for daily single-user use.
**Estimated total:** 3-5 days.

### Tier 2: Daily Experience (Make the App Worth Opening Every Day)

| ID | Feature | Description | Effort | New? |
|----|---------|-------------|--------|------|
| F6 | **Today Focus Mode** | Minimal daily checklist view. Large tappable cards, one per habit. Default on mobile. | M | Prior |
| F7 | **Habit Time Machine** | Date range navigator on the 14-day grid. Arrow buttons scroll through history. "Today" resets. | S | Prior |
| F8 | **Keyboard Shortcuts** | `n` = new habit, `t` = toggle today, arrow keys navigate grid, `?` = help overlay. | S | Prior |
| F9 | **Minimum Viable Day** | Star-toggle on habits marks them "core." All-core-done = "Day Complete" header state. | S | **NEW** |
| F10 | **Rest Day Patterns** | Flexible scheduling: X per week, specific days. Grid dims rest days. Streaks skip rest days. | M | **NEW** |
| F11 | **Habit Experiments** | Optional trial duration (7-90 days). Progress bar, countdown, graduation/retire prompt. | S-M | **NEW** |

**Sprint goal:** The daily check-in is fast, flexible, and psychologically rewarding.
**Estimated total:** 5-8 days.

### Tier 3: Data & Insights (Give Users Reasons to Stay)

| ID | Feature | Description | Effort | New? |
|----|---------|-------------|--------|------|
| F12 | **Dashboard Statistics** | Completion rate, best day of week, total completions, trend arrows. New component. | M | Prior |
| F13 | **Heatmap View** | GitHub-style yearly contribution grid. Completion density by color intensity. | M | Prior |
| F14 | **Data Export** | Download habits + logs as JSON or CSV. Button in a settings/data section. | S | Prior |
| F15 | **Completion Timestamps** | Silently record time-of-day on toggle. Surface "best window" insight after 2 weeks. | S | **NEW** |
| F16 | **Habit Correlation** | Compute co-occurrence patterns from logs. Show "When you X, you Y 85% of the time." | S | **NEW** |
| F17 | **Daily Micro-Journal** | One-line per-day text entry above the grid. Visible in Time Machine history. | S-M | **NEW** |
| F18 | **Habit Notes** | Optional text note per completion, visible on hover/tap. | M | Prior |

**Sprint goal:** The data users generate becomes self-knowledge.
**Estimated total:** 6-10 days.

### Tier 4: Psychology (Healthier Tracking Model)

| ID | Feature | Description | Effort | New? |
|----|---------|-------------|--------|------|
| F19 | **Anti-Habits** | Avoidance tracking. Inverted completion logic. Slip logging instead of action logging. | S | **NEW** |
| F20 | **Habit Half-Life** | Continuous strength (0-100) with exponential decay. Replaces fragile binary streaks. | M | Prior |
| F21 | **Completion Confidence** | Partial completions (25/50/75/100%). Long-press selector. Partially-filled grid cells. | M | Prior |
| F22 | **Streak Recovery Mode** | After a break, show "Recovering: X of Y days back" instead of "Streak: 0." | S | **NEW** |
| F23 | **Rebuild Cost Indicator** | Show "X days to rebuild" as investment framing. Recovery countdown after breaks. | S | Prior |
| F24 | **Streak Milestones** | Celebrate 7, 30, 90, 365-day thresholds with visual badges and animation. | S | Prior |

**Sprint goal:** Habit Garden's tracking model is psychologically healthier than any competitor.
**Estimated total:** 5-8 days.

### Tier 5: Organization & Reach

| ID | Feature | Description | Effort | New? |
|----|---------|-------------|--------|------|
| F25 | **Categories / Tags** | Group habits by area (health, work, personal). Collapsible sections or filter tabs. | M | Prior |
| F26 | **Drag-and-Drop Reorder** | Manual habit ordering. Persist sort order server-side. | M | Prior |
| F27 | **PWA / Offline** | Service worker, offline toggle sync, app installability manifest. | L | Prior |
| F28 | **Data Import** | Import from common tracker exports (Habitica, Loop Habit Tracker, generic CSV). | M | Prior |

**Sprint goal:** The app scales to power users and works everywhere.
**Estimated total:** 6-10 days.

### Explicitly Deferred (Not On Roadmap)

These are premature for a single-user JSON-backed app:

- **User authentication / multi-user** — No use case yet
- **Database migration** — JSON file is fine at this scale
- **Social features / accountability partners** — Requires auth
- **AI/ML features** (Smart Day Planner, Autopilot Detection, Insights Engine) — Need data volume
- **Push notifications / reminders** — Requires PWA or native wrapper
- **Streak variant mechanics** (shields, banks, weather, freeze) — Half-Life (F20) and Recovery Mode (F22) handle this better
- **Gamification systems** (XP, levels, achievements, leaderboards) — Adds complexity without proven value

---

## 4. Feature Dependency Graph

Some features unlock or enhance others. Build order should respect these relationships:

```
F1 (Edit Habit) ← Required for F10 (Rest Days) — editing frequency to schedule
F7 (Time Machine) ← Enhances F13 (Heatmap), F17 (Micro-Journal)
F4 (Theme Toggle) ← No deps, but affects all future CSS work
F9 (MVD) ← Enhanced by F6 (Today Focus) — Today view highlights core habits
F20 (Half-Life) ← Enhanced by F23 (Rebuild Cost) — both reframe streaks
F15 (Timestamps) ← Feeds F16 (Correlation) — richer data for analysis
F22 (Recovery Mode) ← Enhanced by F23 (Rebuild Cost) — complementary displays
```

**Critical path for maximum value:**
```
F1 → F4 → F5 → F7 → F9 → F12 → F10 → F19
(Edit → Theme → Mobile → Time Machine → MVD → Dashboard → Rest Days → Anti-Habits)
```

---

## 5. Implementation Guidance for Top 3 New Features

### Implementing F9: Minimum Viable Day (Smallest new feature, highest impact)

**Step 1: Data model** — Add `core: boolean` to `Habit` type and server validation:
```typescript
// types.ts
export type Habit = {
  id: string
  name: string
  frequency: Frequency
  color: string
  createdAt: string
  archived: boolean
  core: boolean        // NEW
}
```

**Step 2: Server** — Accept `core` in POST /api/habits, add PATCH endpoint for toggling core status.

**Step 3: UI** — Add a star icon button in HabitRow, before the habit name. Filled star = core. Click toggles.

**Step 4: Header state** — In App.tsx, compute MVD status:
```typescript
const coreHabits = habits.filter(h => h.core)
const mvdComplete = coreHabits.length > 0 && 
  coreHabits.every(h => (logs[h.id] ?? []).includes(today))
```
When `mvdComplete`, add a `.mvd-done` class to the header for a green glow effect.

---

### Implementing F19: Anti-Habits (Most novel feature)

**Step 1: Data model** — Add `habitType: 'positive' | 'avoidance'` to `Habit`:
```typescript
export type HabitType = 'positive' | 'avoidance'
// Add to Habit type: habitType: HabitType
```

**Step 2: Streak calc** — New function `calculateAvoidanceStreak`:
```typescript
function calculateAvoidanceStreak(slipDates: string[]): number {
  const cursor = new Date(todayISO())
  let streak = 0
  for (;;) {
    const dayStr = cursor.toISOString().slice(0, 10)
    if (slipDates.includes(dayStr)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
    if (streak > 365) break // cap at 1 year lookback
  }
  return streak
}
```

**Step 3: UI** — In HabitRow, when `habit.habitType === 'avoidance'`:
- Unchecked cells = green (success by default)
- Checked cells = red X (slip logged)
- Streak pill label: "X days clean" instead of "X days"

**Step 4: Form** — Add a toggle in HabitForm: "I want to build this habit" vs. "I want to stop this habit."

---

### Implementing F22: Streak Recovery Mode (Smallest, highest emotional impact)

**Step 1: Detect recovery state** — When current streak = 0 but logs contain dates within the last 30 days:
```typescript
function getRecoveryState(dates: string[], frequency: Frequency) {
  const currentStreak = calculateStreak(dates, frequency)
  if (currentStreak > 0) return null // Active streak, no recovery
  
  // Find the most recent completion
  const sorted = [...dates].sort().reverse()
  if (!sorted.length) return null // Never completed
  
  // Count days completed in the last 7 days
  const recent = last7Days.filter(d => dates.includes(d)).length
  const target = Math.min(previousStreakLength(dates), 7)
  
  return { recovering: true, current: recent, target }
}
```

**Step 2: Display** — In HabitRow, when in recovery:
- Streak pill background: amber instead of green
- Label: "Recovering: 3/7 days" instead of "0 days"
- On reaching target: flash green animation, reset to new active streak

No server changes needed.

---

## 6. Recommendation

**The FEATURE_ROADMAP_FINAL.md from two days ago was right:** build F1 (Edit Habit) first. It's the smallest, most obvious gap, and it proves this project ships code.

**From the new features, build F9 (Minimum Viable Day) second.** It's one boolean field, one star icon, and one header state check. Thirty minutes of work for a meaningful behavioral improvement that no other habit tracker offers.

**Then F19 (Anti-Habits) and F22 (Streak Recovery Mode).** Both are small, both are genuinely novel, and both address real psychological gaps in habit tracking.

The full backlog above has ~28 features. At the current codebase's pace, shipping one small feature per session would complete Tiers 1-2 in about 11 sessions. That's a reasonable goal. The remaining tiers are stretch goals that become relevant only after the app has real daily use.

**The next commit should be code, not markdown.**
