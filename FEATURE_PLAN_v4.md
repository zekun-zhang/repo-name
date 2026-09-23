# Habit Garden — Feature Plan v4 (2026-09-23)

**Replaces all prior planning docs** (FEATURES.md, NEW_FEATURES.md, BACKLOG.md, FEATURE_PROPOSALS.md, FEATURE_PLAN.md, FEATURE_PLAN_v3.md, ROADMAP.md, CREATIVE_FEATURES.md, IMPLEMENTATION_PLAN.md, FEATURE_ROADMAP_FINAL.md)

---

## Status Check

**Shipped code:** ~960 lines. Habit CRUD, 14-day grid, streaks, dark theme, optimistic updates, JSON backend with mutex, 17 API tests.

**Planning docs written:** 10 documents, 65+ features proposed, 0 features built.

**This document** adds 7 genuinely novel features that appear in none of the prior 10 docs, then provides the final consolidated backlog and implementation order.

---

## Part 1: Novel Feature Proposals

Every feature below was checked against all 65+ prior proposals and is not a duplicate or variant. Each fills a gap no prior doc addresses.

---

### V1: Anti-Habit Tracking (Habit Breaking)

**The problem:** The app only tracks habits to BUILD. But many users also need to BREAK habits: reduce social media, quit smoking, stop snacking after 8pm, eliminate nail biting. These are the inverse of habit formation and require different psychology.

**The idea:** A new habit type: "break" (alongside "daily" and "weekly"). Break-habits track "clean" days — days you DIDN'T do the thing. The grid inverts: unchecked means success, checking means you slipped. Streaks count consecutive clean days. The visual language flips: empty cells glow green (resisted), checked cells show orange/red (slipped).

**Why it's novel:** All 65+ prior proposals assume habits are things you DO. None address things you STOP. This is a distinct behavioral domain:
- BUILD habits use cue → routine → reward loops (add friction to skip)
- BREAK habits use cue → alternative → reward loops (add friction to execute)

The UI must reflect this difference. A "clean day" is not the same as a "completed day."

**Data model:**
- Add `type: 'build' | 'break'` to Habit (default `'build'`, backward compatible)
- Log entries for break-habits mean "slipped" instead of "completed"
- Streak calculation inverts: count consecutive days WITHOUT a log entry

**Effort:** Small-Medium. Mostly UI logic inversion + one schema field.

---

### V2: Daily Energy Budget (Overcommitment Guard)

**The problem:** The #1 failure mode in habit tracking is adding too many habits at once. Users create 12 habits on day one, complete 4, see "33% completion rate," feel demoralized, and abandon the app. No prior proposal addresses this: difficulty tiers (P1) measure how hard habits are, but don't warn users they've overloaded their day.

**The idea:** Each habit has an energy cost (auto-calculated from difficulty + frequency, or user-set). A daily "energy bar" shows total load vs. a configurable daily capacity (default 100). When the user adds a habit that pushes them over capacity, the app shows a gentle warning: "You have 120 energy points scheduled today. Consider reducing to stay under 100." The bar is always visible — green when sustainable, yellow when stretched, red when overloaded.

**Why it's novel:** Prior proposals include difficulty tiers (measuring individual effort) and effort-weighted scoring (rewarding hard completions). Neither addresses the AGGREGATE load problem. Energy budget is a planning tool, not a scoring tool. It answers "Am I trying to do too much?" before the day starts, rather than "Did I accomplish enough?" after it ends.

**Implementation:**
- Add `energyCost: number` to Habit (default: derived from difficulty or 10)
- Add `dailyCapacity: number` to user settings (stored in localStorage, default 100)
- New `<EnergyBar />` component showing sum of today's active habit costs vs. capacity
- Pure frontend — no backend changes

**Effort:** Small. One component + one config value.

---

### V3: Combo Days & Cross-Habit Streaks

**The problem:** Individual habit streaks create tunnel vision. A user might complete 7 of 8 habits daily for a month but never feel the accomplishment because one habit always breaks. No existing proposal rewards TOTAL daily consistency across all habits.

**The idea:** A "combo day" is any day where ALL active habits are completed. Combo days get a special visual treatment in the grid (gold border, star icon). Combo streaks track consecutive combo days. A weekly summary shows "3 combo days this week" alongside individual stats.

This creates a meta-game: individual habits are the notes, combo days are the melody. Users naturally start asking "Can I go all-in today?" which drives completion of the habits they'd otherwise skip.

**Why it's novel:** Every streak proposal (shields, half-life, rebuild cost, milestones, savings bank, weather) focuses on individual habits. None model the cross-habit dimension. Combo days reward breadth of execution, not depth of any single habit.

**Implementation:**
- Pure frontend computation: `isComboDay(date, activeHabits, logs) => boolean`
- Visual: gold ring on grid cells where all habits completed, combo streak counter in header
- Optional: "Perfect Week" badge for 7 consecutive combo days

**Effort:** Small. No backend changes. Pure UI + one utility function.

---

### V4: Habit Graduation & Retirement

**The problem:** A successful habit eventually becomes automatic — you brush your teeth without tracking it. But in the app, it stays on the list forever, cluttering the grid and diluting completion rates. Archive exists, but it feels like giving up. There's no concept of "this habit won, it's part of my identity now."

**The idea:** After a configurable streak threshold (default 90 days), a habit becomes eligible for "graduation." The app presents a ceremony: "Meditation has been part of your life for 90 days. Ready to graduate it?" Graduated habits move to a "Hall of Fame" section — visible, celebrated, but no longer tracked daily. They remain in statistics and the heatmap. Users can "un-graduate" if the habit starts slipping.

**Why it's novel:** Prior proposals include identity-based tracking (narrative) and categories (organization). None model the LIFECYCLE of a habit: formation → consistency → automaticity → graduation. The implicit assumption in every proposal is that tracking is permanent. But the goal of habit formation is to make tracking unnecessary.

**Behavioral reasoning:** The transtheoretical model of behavior change identifies "maintenance" and "termination" as the final stages — where the behavior is automatic and relapse risk is minimal. Graduation maps to the "termination" stage. No habit tracker models this.

**Implementation:**
- Add `graduatedAt: string | null` to Habit
- New `POST /api/habits/:id/graduate` endpoint (sets `graduatedAt`)
- Frontend: "Hall of Fame" section showing graduated habits with their final stats
- Graduation prompt appears when streak exceeds threshold

**Effort:** Small-Medium. Similar pattern to archive.

---

### V5: Weekly Intention Setting

**The problem:** The app is purely retrospective: you look back at what you did. There's no forward-looking component. Users open the app, see yesterday's results, and react. They never proactively decide what to focus on.

**The idea:** Each Sunday evening (or user-configured day), the app prompts: "Set your intentions for the week." The user selects 3-5 habits as "focus habits" for the coming week. Focus habits get visual prominence (bold border, priority position). At week's end, a mini-review shows: "You focused on Meditate, Exercise, Read. Hit rate: 85%, 60%, 100%. Next week?"

This creates a planning → execution → review loop that pure tracking misses.

**Why it's novel:** Prior proposals include self-prediction (calibration accuracy) and weekly/monthly reviews (retrospective analysis). Neither includes PROSPECTIVE intention-setting. Self-prediction asks "Will you do this?" — intention-setting asks "What matters most this week?" These are different psychological operations. Intention-setting activates implementation intentions (Gollwitzer, 1999), one of the most robust findings in behavioral psychology.

**Implementation:**
- Store `weeklyFocus: { weekStartDate: string, habitIds: string[] }` in localStorage (or server)
- New modal/drawer for intention setting, triggered by date logic
- Visual: focused habits get a star or highlight in the grid and Today view
- End-of-week review component showing focus-habit completion rates

**Effort:** Medium. New UI flow + date-based triggering logic.

---

### V6: Drag-and-Drop Habit Reordering

**The problem:** Habits display in creation order. As the list grows, the most important habits might be buried at the bottom. Users can't prioritize what they see first. This seems trivial but has real behavioral impact: habits at the top of the list get completed more often (position bias).

**The idea:** Users can drag habits to reorder them. The order persists. In Today view, the order determines the checklist sequence. Combined with energy budget (V2), users can arrange habits from highest to lowest priority, tackling the hardest ones first when willpower is highest.

**Why it's novel:** Every prior proposal focuses on adding information (stats, scores, tiers) or new views (heatmap, focus mode). None address the ordering of the existing view. This is a basic UX feature that 9 of 10 competing apps have and Habit Garden doesn't.

**Implementation:**
- Add `sortOrder: number` to Habit
- New `PATCH /api/habits/reorder` endpoint accepting `{ habitIds: string[] }`
- Frontend: drag handle on each HabitRow, react-dnd or native HTML5 drag-and-drop
- Persist order on drop

**Effort:** Small-Medium. Well-established UI pattern.

---

### V7: Adaptive Frequency Suggestions

**The problem:** Users set habit frequency at creation time and never revisit it. A user who sets "daily" but consistently completes 4-5 days per week sees a perpetual ~70% completion rate — technically "failing" even though they're building a solid habit. The frequency was wrong, not the behavior.

**The idea:** After 30 days of data, the app analyzes actual completion patterns and suggests frequency adjustments: "You complete Exercise on average 4.2 days/week. Switch to 'weekdays only'?" or "You complete Meditate every day — upgrade from 'weekly' to 'daily'?" Suggestions appear as a non-intrusive banner, dismissable and never repeated for the same habit within 30 days.

**Why it's novel:** Prior proposals include adaptive scaling (auto-adjusting difficulty) and warmup ramps (graduated start). Neither addresses FREQUENCY optimization. Frequency is the most impactful setting — it determines the denominator in every completion rate — yet it's set once and forgotten. This is the only proposal that uses historical data to optimize the tracking configuration itself rather than the habit execution.

**Implementation:**
- New utility: `suggestFrequency(habit, logs)` — analyzes 30-day completion pattern
- Suggestion logic: if daily habit is completed < 5/7 days consistently, suggest specific days; if weekly habit is completed > 5/7 days, suggest daily
- Frontend: dismissable suggestion banner per habit
- Dismissed suggestions stored in localStorage with 30-day cooldown

**Effort:** Small-Medium. Analysis logic + one UI component.

---

## Part 2: Consolidated Master Backlog

All features from all 11 documents (including this one), deduplicated, with a single priority score.

Priority scoring: **Impact (1-5) x Effort Inverse (5=trivial, 1=large) = Score**. Higher is better (do first).

### Tier 1: Foundation Fixes (Score 20+)

Must-haves before any new feature. Each is < 1 day of work.

| # | Feature | Impact | Effort | Score | Source |
|---|---------|--------|--------|-------|--------|
| 1 | **Edit Habit** — change name, color, frequency | 5 | 5 | 25 | BACKLOG G1 |
| 2 | **View & Restore Archived Habits** | 4 | 5 | 20 | BACKLOG G2 |
| 3 | **Undo Toast** — undo toggle/archive/delete | 4 | 5 | 20 | ROADMAP F3 |
| 4 | **Theme Toggle** — light/dark switch | 4 | 5 | 20 | ROADMAP F4 |
| 5 | **Mobile-Responsive Grid** | 5 | 4 | 20 | BACKLOG G4 |

### Tier 2: Core Value Features (Score 12-19)

Make the app worth using beyond week one. Each is 1-3 days.

| # | Feature | Impact | Effort | Score | Source |
|---|---------|--------|--------|-------|--------|
| 6 | **Habit Time Machine** — scroll grid through history | 5 | 5 | 25* | FINAL N3 |
| 7 | **Combo Days** — cross-habit completion tracking | 4 | 5 | 20* | NEW V3 |
| 8 | **Drag-and-Drop Reordering** | 3 | 5 | 15 | NEW V6 |
| 9 | **Today Focus Mode** — minimal daily check-in | 5 | 3 | 15 | FINAL N4 |
| 10 | **Dashboard Statistics** — completion rate, trends | 4 | 3 | 12 | ROADMAP F6 |
| 11 | **Anti-Habit Tracking** — break bad habits | 4 | 3 | 12 | NEW V1 |
| 12 | **Data Export** — JSON/CSV download | 3 | 4 | 12 | ROADMAP F8 |
| 13 | **Empty State & Onboarding** | 3 | 4 | 12 | BACKLOG G3 |

*Time Machine and Combo Days score higher than their tier because they require almost no backend changes.

### Tier 3: Behavioral Differentiators (Score 8-11)

Features that make Habit Garden psychologically smarter than competitors.

| # | Feature | Impact | Effort | Score | Source |
|---|---------|--------|--------|-------|--------|
| 14 | **Habit Half-Life** — continuous strength model | 5 | 3 | 15* | FINAL N1 |
| 15 | **Rebuild Cost Indicator** | 3 | 4 | 12* | FINAL N5 |
| 16 | **Completion Confidence** — partial completions | 4 | 3 | 12* | FINAL N2 |
| 17 | **Habit Graduation** — retire automated habits | 3 | 3 | 9 | NEW V4 |
| 18 | **Energy Budget** — overcommitment warning | 3 | 3 | 9 | NEW V2 |
| 19 | **Weekly Intentions** — prospective focus setting | 4 | 2 | 8 | NEW V5 |
| 20 | **Adaptive Frequency** — data-driven suggestions | 3 | 3 | 9 | NEW V7 |
| 21 | **Streak Milestones** — celebrate thresholds | 3 | 4 | 12* | ROADMAP F16 |
| 22 | **Keyboard Shortcuts** | 2 | 4 | 8 | ROADMAP F9 |
| 23 | **Habit Notes** — text on completions | 3 | 3 | 9 | ROADMAP F10 |

*Scored into Tier 3 despite high scores because they depend on Tier 1/2 being solid first.

### Tier 4: Scale & Polish (Score < 8)

Build only after the core is strong.

| # | Feature | Impact | Effort | Score | Source |
|---|---------|--------|--------|-------|--------|
| 24 | **Categories / Tags** | 3 | 2 | 6 | ROADMAP F17 |
| 25 | **Heatmap View** | 4 | 2 | 8* | ROADMAP F7 |
| 26 | **PWA / Offline Support** | 4 | 1 | 4 | ROADMAP F18 |
| 27 | **Habit Stacking / Routines** | 3 | 2 | 6 | NEW_FEATURES F3 |
| 28 | **Warmup Ramp** | 3 | 2 | 6 | CREATIVE C1 |
| 29 | **Difficulty Tiers** | 2 | 3 | 6 | PROPOSALS P1 |

*Heatmap scores higher but needs significant data to be useful.

### Explicitly Deferred (Not Planned)

- User authentication (no multi-user need)
- Database migration (JSON is fine for single-user)
- Social features (requires auth)
- AI/ML features (needs data volume)
- Reminders/notifications (requires PWA first)
- All "streak variant" mechanics (shields, savings bank, freeze) — Half-Life replaces them

---

## Part 3: Implementation Order

### Phase 1: Make the MVP Complete (items 1-5)
**Goal:** A user can create, edit, archive/restore, and delete habits without footguns. The app works on phones. They can pick a theme.
**Estimated:** 3-5 days. All are small, independent, can be built in any order.

### Phase 2: Make History Visible (items 6-7, 10)
**Goal:** Users can scroll through their history, see combo days, and view basic statistics. The app rewards consistency, not just individual streaks.
**Estimated:** 3-5 days.

### Phase 3: Optimize Daily Use (items 8-9, 11-13)
**Goal:** The daily check-in is fast (Today Mode), habits are in the right order (reorder), bad habits are trackable (anti-habits), data is exportable, and new users get guidance.
**Estimated:** 5-7 days.

### Phase 4: Behavioral Depth (items 14-21)
**Goal:** Habit Garden's tracking model is psychologically healthier than any competitor. Half-life replaces fragile streaks. Partial completions capture nuance. Graduation celebrates success. Intentions drive focus.
**Estimated:** 8-12 days.

### Phase 5: Scale (items 22-29)
**Goal:** Power-user features, organizational tools, offline support.
**Estimated:** 10-15 days.

---

## Part 4: What to Build Right Now

**Build item #1 (Edit Habit) today.** It is:
- The smallest feature on the list
- The most obvious missing basic
- A forcing function to break the planning-to-code ratio

Then ship items 2-5 within the same week. Every prior planning document agrees on this priority. The 7 novel features in this document (V1-V7) are Phase 3-4 work — they depend on the foundation being solid.

**The next commit in this repo should contain application code, not another markdown file.**
