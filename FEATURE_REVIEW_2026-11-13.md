# Habit Garden — Feature Review (2026-11-13)

**Automated review** | Supersedes all 35 prior planning documents

---

## State of the Repository

| Metric | Count |
|--------|-------|
| Planning documents | 35 (including this one) |
| Feature proposals (all series A–Z) | 122+ |
| Proposals implemented | 0 |
| Source files | 11 (8 frontend, 3 backend) |
| Lines of application code | ~560 |
| Lines of planning documents | ~8,000+ |
| Planning-to-code ratio | **14:1** |

This review is the 16th daily review. Each prior review proposed 3–6 "genuinely novel" features. Each concluded with "stop planning, start building." None resulted in implementation. The pattern is clear: the routine generates planning documents, not code.

This review therefore takes a harder line: **proposals must target blind spots that all 122 prior proposals share at the *model* level** — not new visualizations, new metrics, or new framings of the same underlying data. Every prior proposal operates on the same assumption: habits are positive, binary, daily-or-weekly, and tracked in isolation. The AA-series challenges each of those assumptions.

---

## Current Application Audit

### Working Features (unchanged since 2026-11-12)

| # | Feature | Key Files |
|---|---------|-----------|
| 1 | Create habit (name, daily/weekly, color) | `HabitForm.tsx`, `server/app.js:74-93` |
| 2 | 14-day toggle grid | `HabitRow.tsx:130-151`, `HabitTable.tsx:48-84` |
| 3 | Streak calculation (daily/weekly) | `utils.ts:16-60` |
| 4 | Inline edit (name, frequency, color) | `HabitRow.tsx:61-108` |
| 5 | Archive / unarchive | `useHabits.ts:87-107`, `server/app.js:141-163` |
| 6 | Delete with confirm | `App.tsx:26-29`, `server/app.js:165-175` |
| 7 | Optimistic UI with error toast rollback | `useHabits.ts:41-123` |
| 8 | Server-side write mutex | `server/app.js:16-20` |
| 9 | 18 API integration tests | `server/__tests__/api.test.js` |

### Data Model

```
Habit:    { id, name, frequency('daily'|'weekly'), color, createdAt, archived }
HabitLog: { [habitId]: string[] }  // 'YYYY-MM-DD' date strings
Storage:  single data.json file
```

### Carried-Forward Defects

| # | Defect | Est. |
|---|--------|------|
| D1 | `src/index.css` is dead code — duplicates resets in `App.css` | 2 min |
| D2 | No test for `PUT /api/habits/:id` (edit endpoint) | 15 min |
| D3 | No test for `POST /api/habits/:id/unarchive` | 10 min |
| D4 | No `manifest.json` or PWA metadata | 20 min |
| D5 | Archive/unarchive endpoints return 200 for nonexistent habit IDs | 10 min |

---

## AA-Series: 5 Novel Proposals

### Design principle

Every one of the 122 prior proposals shares four hidden assumptions:

1. **Habits are positive** — things you want to DO (exercise, read, meditate)
2. **Completion is binary** — you either did it or you didn't
3. **Every day is the same** — the app doesn't know weekdays from weekends, work from vacation
4. **Habits are independent** — no habit affects any other

The AA-series proposes one feature that challenges each assumption, plus one that captures data no prior proposal asked for. These aren't incremental improvements to the existing model — they expand what the app *can represent*.

---

### AA1. Anti-Habits (Abstinence Tracking)

**The assumption it breaks:** All 122 proposals assume habits are things you want to DO. But a large category of self-improvement is about things you want to STOP: no social media after 9pm, no snacking between meals, no cigarettes, no hitting snooze. These are the hardest habits to build and the ones most underserved by every habit tracker on the market.

**Why this is structurally different, not cosmetically:**
- The toggle semantics invert. For a positive habit, a day starts "incomplete" and you mark it "done." For an anti-habit, a day starts "successful" (you haven't done the bad thing yet) and you mark it "broken" if you slip.
- The streak meaning changes. A positive-habit streak counts consecutive days you DID the thing. An anti-habit streak counts consecutive days you DIDN'T — days since last slip.
- The motivational framing flips. Missing a positive habit says "you didn't do enough." Breaking an anti-habit says "you slipped once but your 23-day run is still real."
- The grid rendering changes. Unchecked cells are green (success), checked cells are red (slip). The color inversion reinforces the inverted mental model.

**Data model change:**
```
Habit: { ..., mode: 'do' | 'avoid' }  // new field, default 'do'
```

**Scope:**
- `types.ts`: add `mode` to Habit type (+1 line)
- `HabitForm.tsx`: add mode toggle (+12 lines)
- `HabitRow.tsx`: invert cell coloring and toggle logic for `mode === 'avoid'` (+15 lines)
- `utils.ts`: new `calculateAbstinenceStreak()` that counts days since last logged date (+10 lines)
- `server/app.js`: accept `mode` in create/update validation (+5 lines)
- `App.css`: `.day-cell-slip` style for broken days (+5 lines)

**Total: ~48 lines. Backend schema change: additive (new optional field with default).**

---

### AA2. Partial Completions (Graduated Success)

**The assumption it breaks:** All 122 proposals treat completion as binary — you did it or you didn't. But real habits have degrees. You planned to run 5K but ran 2K. You planned to read 30 minutes but read 10. You planned to meditate 20 minutes but did 5. In the current model, all three are "not done." This is both inaccurate and demoralizing — partial effort is invisible.

**Why this matters more than any visualization feature:** The single most important moment in habit formation is the day you *almost* skip but do a reduced version instead. James Clear calls this "the two-minute rule" — showing up at all matters more than hitting the full target. The current binary model punishes this critical behavior by recording it as failure.

**The proposal:**
- Habits can optionally have a **target** (number + unit): "30 minutes", "5 km", "10 pages"
- The toggle grid becomes a **tap-to-set** grid: tap once for partial (half-filled cell), tap again for full, tap again to clear
- Streaks count both partial and full completions (a partial day doesn't break a streak)
- The streak pill shows completion quality: "12 days (8 full, 4 partial)"
- Habits without a target work exactly as today (backward compatible)

**Data model change:**
```
Habit: { ..., target?: { value: number, unit: string } }
HabitLog: { [habitId]: (string | { date: string, partial: boolean })[] }
```

For backward compatibility, plain date strings remain "full completion." Objects with `partial: true` are partial.

**Scope:**
- `types.ts`: extend Habit and log types (+6 lines)
- `HabitForm.tsx`: optional target fields (+18 lines)
- `HabitRow.tsx`: three-state toggle (empty → partial → full → empty), half-filled cell rendering (+25 lines)
- `utils.ts`: update `calculateStreak` to count partials as non-breaking (+8 lines)
- `server/app.js`: accept target in validation, handle partial log entries (+15 lines)
- `App.css`: `.day-cell-partial` style (half-circle or reduced opacity fill) (+8 lines)

**Total: ~80 lines. This is the largest AA proposal but also the most impactful model change.**

---

### AA3. Friction Capture (Why You Skipped)

**The assumption it breaks:** No prior proposal asks WHY a habit was missed. All 122 focus on *recording* and *displaying* completions. But the most valuable data in habit tracking isn't when you succeeded — it's the pattern of why you failed.

**The insight:** If you skip meditation every Monday, that's a scheduling conflict. If you skip exercise when it rains, that's an environment barrier. If you skip reading when you're tired, that's an energy management problem. Each has a different solution, but the current model can't distinguish them because it only records presence/absence.

**The proposal:**
- When a day passes with incomplete habits, the next time the user opens the app, a subtle non-blocking prompt appears: "Yesterday you skipped [Habit]. Quick reason?" with 5 tap-targets:
  - Forgot
  - Too busy
  - Didn't feel like it
  - Out of routine (travel/sick/weekend)
  - Other
- The reason is stored with the date in the log
- After 30+ data points, a "Patterns" section appears showing the top friction reasons per habit: "You skip Exercise most often because: Too busy (45%), Didn't feel like it (30%)"
- Completely optional — dismissing the prompt records no reason and it doesn't reappear for that day

**Why this is different from Y-series behavioral proposals:** Y-series proposed behavioral *interventions* (nudges, forgiveness, stacking). AA3 proposes behavioral *measurement* — capturing the data needed to understand failure before prescribing solutions. It's diagnostic, not therapeutic.

**Data model change:**
```
HabitLog: { [habitId]: (string | { date: string, skippedReason?: string })[] }
```

**Scope:**
- `types.ts`: extend log entry type (+3 lines)
- New `src/components/FrictionPrompt.tsx`: lightweight prompt component (~35 lines)
- `useHabits.ts`: detect incomplete-yesterday habits, expose `recordSkipReason()` (+20 lines)
- `App.tsx`: render FrictionPrompt when applicable (+8 lines)
- `server/app.js`: new `POST /api/logs/skip-reason` endpoint (+15 lines)
- `App.css`: friction prompt styles (+15 lines)

**Total: ~96 lines. One new component, one new endpoint.**

---

### AA4. Habit Correlations (Cross-Habit Analysis)

**The assumption it breaks:** All 122 proposals treat each habit as independent. But habits interact. Exercise improves sleep. Poor sleep hurts morning routines. Reading before bed replaces screen time. The current model stores all the data needed to detect these relationships — it just never computes them.

**The proposal:**
- A "Connections" view (accessible via a small link/button, not always visible) that computes pairwise completion correlation between all active habits
- Uses the Pearson correlation coefficient on the binary completion vectors over the last 60 days
- Displays only statistically significant correlations (|r| > 0.3 with p < 0.05):
  - **Positive:** "When you Exercise, you're 2.4x more likely to also Sleep Early" (green link)
  - **Negative:** "When you code Late Night, you're 0.3x as likely to Wake Early" (red link)
- Pure frontend computation — no backend changes. All data is already in the `logs` object.
- Shown as a simple list of correlation pairs, not a graph visualization (keeping scope small)

**Why this has never been proposed:** Every prior proposal focuses on single-habit metrics (streaks, completion rates, heatmaps). Cross-habit analysis requires thinking about the dataset holistically. This is the only proposal that generates *new insights* from existing data without collecting any new data.

**Scope:**
- New `src/utils/correlations.ts`: Pearson correlation + significance test (~40 lines)
- New `src/components/Connections.tsx`: render correlated pairs (~30 lines)
- `App.tsx`: toggle to show/hide Connections view (+5 lines)
- `App.css`: connection pair styles (+10 lines)

**Total: ~85 lines. Pure frontend. Zero backend changes. Zero data model changes.**

---

### AA5. Planned Off-Days (Expected Rest Pattern)

**The assumption it breaks:** "Daily" means every single day. But almost no real habit is truly every-day. You exercise Mon/Wed/Fri. You read on weekdays. You meal-prep on Sundays. The current model offers only "daily" or "weekly" — if you set "daily" but plan to rest on weekends, every Saturday and Sunday shows as a broken streak and a missed day in the grid. This generates false guilt and makes the completion percentage permanently inaccurate.

**Why "weekly" doesn't solve this:** "Weekly" means "at least once per week." It doesn't express "Monday, Wednesday, Friday" or "weekdays only." There's a huge middle ground between "every day" and "once a week" that the model can't represent.

**The proposal:**
- Habits can optionally specify **active days**: a bitmask of days of the week (Mon–Sun)
- Days outside the active pattern render as gray/disabled cells in the grid — not empty, not missed
- Streaks only count active days (skipping Saturday doesn't break a weekday streak)
- Completion percentage is (completed active days) / (total active days), not (completed) / (calendar days)
- Default: all days active (backward compatible with current "daily")

**Data model change:**
```
Habit: { ..., activeDays?: number[] }  // 0=Sun, 1=Mon, ..., 6=Sat; undefined = all days
```

**Scope:**
- `types.ts`: add `activeDays` to Habit (+1 line)
- `HabitForm.tsx`: day-of-week toggle chips in create form (+20 lines)
- `HabitRow.tsx`: gray out non-active days, disable click (+10 lines)
- `utils.ts`: update `calculateStreak` to skip non-active days (+12 lines)
- `server/app.js`: validate activeDays array (+8 lines)
- `App.css`: `.day-cell-inactive` style (+5 lines)

**Total: ~56 lines. Small schema addition, significant UX improvement.**

---

## Why the AA-Series Is Structurally Different

| Prior proposals (A–Z) | AA-series |
|---|---|
| Assume habits are positive actions | AA1: Introduces abstinence/avoidance tracking |
| Assume completion is binary (done/not-done) | AA2: Introduces partial completions |
| Focus on recording/displaying completions | AA3: Captures failure reasons |
| Treat each habit as independent | AA4: Discovers cross-habit correlations |
| Treat every day as equivalent | AA5: Introduces planned rest patterns |

Each AA proposal challenges a different foundational assumption. Together they expand the app from a "daily checkbox grid" into a tool that models how habits actually work in real life.

---

## Consolidated Backlog (Definitive)

Single source of truth. Every prior backlog document is superseded.

### Tier 0: Defects (fix before features)

| # | Item | Est. | Files |
|---|------|------|-------|
| D1 | Remove dead `src/index.css` | 2 min | `src/index.css`, `src/main.tsx` (if imported) |
| D2 | Add PUT edit endpoint test | 15 min | `server/__tests__/api.test.js` |
| D3 | Add unarchive endpoint test | 10 min | `server/__tests__/api.test.js` |
| D4 | Add `manifest.json` + PWA meta tags | 20 min | `public/manifest.json`, `index.html` |
| D5 | Return 404 for archive/unarchive of nonexistent habit | 10 min | `server/app.js:141-163` |

**Tier 0 total: ~57 minutes. All defects are independent; can be done in any order or in parallel.**

### Tier 1: Ship Next (highest impact, smallest scope)

These are selected from ALL proposals (A–Z + AA) based on three criteria: (1) user-facing impact, (2) implementation size under 60 lines, (3) no dependency on other features.

| # | Feature | Origin | Est. | Lines | Rationale |
|---|---------|--------|------|-------|-----------|
| 1.1 | **Empty state onboarding** | Z5 | 45 min | ~63 | Fixes what every new user sees first |
| 1.2 | **Undo last action** | Z4 | 1 hr | ~50 | Core usability — Nielsen heuristic #3 |
| 1.3 | **Planned off-days** | AA5 | 1 hr | ~56 | Fixes false guilt for non-daily habits |
| 1.4 | **Habit age badge** | Z3 | 30 min | ~42 | Zero-effort identity reinforcement |
| 1.5 | **Momentum score** | Z1 | 45 min | ~50 | Replaces psychologically damaging binary streaks |

### Tier 2: High Value, Moderate Scope

| # | Feature | Origin | Est. | Lines | Rationale |
|---|---------|--------|------|-------|-----------|
| 2.1 | **Anti-habits** | AA1 | 1.5 hr | ~48 | Unlocks abstinence tracking (new user segment) |
| 2.2 | **Completion sounds** | Z2 | 1 hr | ~48 | Micro-reward reinforcement loop |
| 2.3 | **Data export/import (JSON)** | Various | 1 hr | ~40 | Data ownership and portability |
| 2.4 | **Habit correlations** | AA4 | 1.5 hr | ~85 | New insights from existing data, zero backend work |
| 2.5 | **Dark/light theme toggle** | Various | 1 hr | ~60 | Accessibility, currently dark-only |

### Tier 3: Larger Model Changes

| # | Feature | Origin | Est. | Lines | Rationale |
|---|---------|--------|------|-------|-----------|
| 3.1 | **Partial completions** | AA2 | 2 hr | ~80 | Challenges binary model; significant UX change |
| 3.2 | **Friction capture** | AA3 | 2 hr | ~96 | New data collection; one new component + endpoint |
| 3.3 | **Keyboard shortcuts** (j/k/space) | Various | 1.5 hr | ~50 | Power user efficiency |
| 3.4 | **Flexible frequency** (N-times/week) | Various | 2 hr | ~70 | Gym patterns, weekday-only |
| 3.5 | **Monthly completion bar** | Various | 1 hr | ~40 | Visual progress per habit |

### Tier 4: Foundation / Multi-Session

| # | Feature | Origin | Est. | Rationale |
|---|---------|--------|------|-----------|
| 4.1 | PWA with service worker + offline | Various | 4 hr | Mobile-native experience |
| 4.2 | SQLite migration | Various | 5 hr | Data reliability at scale |
| 4.3 | Extended history / scrollable calendar | Various | 3 hr | Long-term visibility beyond 14 days |
| 4.4 | GitHub-style yearly heatmap | Various | 4 hr | Long-term motivation visualization |
| 4.5 | Multi-user auth | Various | 6 hr | Multi-device, multi-user |

---

## Recommended Implementation Order

The next implementation session should execute **exactly this sequence**:

### Sprint 1: Foundation (est. 1 hour)
1. **All Tier 0 defects** — clean slate, all independent, parallelize freely
2. **1.1: Empty state onboarding** — fixes the first-run experience

### Sprint 2: Core UX (est. 2 hours)
3. **1.3: Planned off-days** — fixes the most structurally broken assumption (every day = same)
4. **1.2: Undo last action** — error recovery for all mutations
5. **1.5: Momentum score** — replace binary streaks

### Sprint 3: Identity + Model Expansion (est. 2 hours)
6. **1.4: Habit age badge** — quick win, reinforces "Garden" theme
7. **2.1: Anti-habits** — biggest model expansion with smallest code footprint

**Total for 3 sprints: ~5 hours, ~350 lines of new code, 5 features + all defects fixed.**

---

## Document Hygiene Recommendation

This repository contains 35 planning documents and ~560 lines of code. The implementation session should:

1. `mkdir -p docs/archive`
2. `git mv FEATURES*.md BACKLOG.md PLAN.md ROADMAP.md FEATURE_PLAN.md FEATURE_REVIEW*.md docs/archive/`
3. Keep only `README.md` in root
4. Add to README: `> Feature history: see docs/archive/`
5. **Do not create any new planning documents until Tier 1 is fully implemented**

---

## Meta-Observation

This is the 16th automated feature review. The routine has produced ~8,000 lines of planning across 35 documents. It has produced 0 lines of implementation. The routine itself may be the problem — it fulfills the mandate ("check codebase and come up with features") without ever fulfilling the implied goal ("make the app better").

**Recommendation:** Retarget this routine from "propose features" to "implement the top Tier 1 item." The planning is done. The backlog is definitive. What remains is code.
