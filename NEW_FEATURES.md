# Habit Garden — New Feature Proposals & Backlog

> Creative features beyond the existing roadmap (see `FEATURES.md` for the original 16 planned features).
> Each feature includes **what** it does, **why** it matters, **effort** estimate, and **dependencies**.

---

## Guiding Principles

These proposals are grounded in three insights from habit science and UX research:

1. **Streaks are fragile motivators.** A single miss can destroy weeks of progress psychologically. Features should build resilience, not just reward perfection.
2. **Context matters more than willpower.** When, where, and how habits are grouped determines success more than raw discipline. Features should help users design their environment.
3. **Reflection beats tracking.** Checking a box is step one. Understanding *patterns* in your behavior is where lasting change happens.

---

## Tier 1 — High Impact, Low-Medium Effort

### F1: Streak Shields & Vacation Mode
**What:** Users can activate "vacation mode" for a date range, or earn "streak shields" (1 free miss per N-day streak) that preserve streaks during planned absences or sick days.

**Why:** Streak anxiety is the #1 reason users abandon habit trackers. A broken 45-day streak feels catastrophic, even if the miss was justified (travel, illness). Duolingo popularized streak freezes for exactly this reason — they reduce churn by 15-20% according to their public data. This reframes a miss from "failure" to "planned pause."

**Scope:**
- Schema: Add `vacationRanges: [{start, end}]` to Habit or global settings
- Schema: Add `shieldCount: number` (earned automatically, e.g., 1 shield per 14-day streak)
- Backend: Update streak calculation to skip shielded/vacation dates
- Frontend: Vacation mode toggle in settings, shield indicator on streak badge

**Effort:** Medium | **Dependencies:** None

---

### F2: Habit Health Score (Consistency Index)
**What:** Replace raw streak count with a composite "health score" (0-100) based on rolling 30-day completion rate, weighted recency, and trend direction (improving/declining). The streak still exists but the health score becomes the primary motivator.

**Why:** Streaks are binary — you're either "on" or "off." A user who completed 28/30 days but missed yesterday shows streak = 0, which is demoralizing and inaccurate. A health score captures *consistency* instead of *perfection*. It answers "How am I really doing?" rather than "How many days since my last miss?" This is more forgiving, more truthful, and more motivating for non-perfectionists (i.e., most humans).

**Formula concept:**
```
healthScore = (completionRate30d × 0.5) + (completionRate7d × 0.3) + (trendBonus × 0.2)
trendBonus  = 1.0 if 7d rate > 30d rate, 0.5 if equal, 0.0 if declining
```

**Scope:**
- Frontend: New `<HealthBadge />` component replacing/augmenting streak display
- Utils: New `calculateHealthScore(logs, frequency)` function
- No backend changes — fully computed from existing log data

**Effort:** Low | **Dependencies:** None

---

### F3: Habit Stacking / Routines
**What:** Users can group habits into named "stacks" (e.g., "Morning Routine", "Wind-Down") that display as collapsible sections. Within a stack, habits appear in a deliberate sequence. Completing a stack marks all its habits at once (with an option to expand and toggle individually).

**Why:** Habit stacking is a core concept from James Clear's *Atomic Habits* — "After I [current habit], I will [new habit]." Grouping habits into routines reduces decision fatigue and leverages existing behavioral chains. Currently, habits are a flat list, which doesn't model how people actually structure their day. Stacks also solve the "too many habits" problem without needing categories/tags.

**Scope:**
- Schema: New `Stack` type: `{ id, name, habitIds: string[], sortOrder }`
- Backend: New `POST /api/stacks`, `PATCH /api/stacks/:id`, `DELETE /api/stacks/:id`
- Backend: New `POST /api/stacks/:id/complete` (batch toggle all habits in stack for today)
- Frontend: New `<StackGroup />` wrapper component, collapsible with "Complete All" button
- Ungrouped habits remain in a default "Uncategorized" section

**Effort:** Medium | **Dependencies:** None (complementary to Categories/Tags from FEATURES.md)

---

### F4: Failure Recovery Dashboard
**What:** When a streak breaks, instead of showing "Streak: 0", show a recovery panel: "Previous streak: 45 days. Recovery: 3/3 days back on track. Personal best: 45 days." Include a "bounce-back rate" metric (how quickly you resume after a miss).

**Why:** The moment after a streak breaks is the highest-risk moment for abandonment. Most trackers punish this moment by showing a zero. A recovery dashboard reframes it: your 45-day streak isn't erased from history, and getting back on track for 3 days is itself an achievement. Research on "abstinence violation effect" shows that how people interpret a lapse determines whether it becomes a relapse. This feature directly targets that psychology.

**Scope:**
- Utils: New `calculateRecoveryStats(logs)` — previous streak, personal best, current recovery run, bounce-back rate
- Frontend: Conditional render in `HabitRow` — when streak < previous streak, show recovery panel instead of bare streak number
- No backend changes — derived from existing log data

**Effort:** Low | **Dependencies:** None

---

### F5: Smart Rest Days
**What:** Per-habit configuration for active days. Instead of just "daily" or "weekly", allow "5x per week", "Mon/Wed/Fri", or "weekdays only". Streaks and health scores only count configured active days.

**Why:** The current daily/weekly binary is the biggest limitation of the tracking model. Real habits have nuance: exercise might be 4x/week, meditation might be weekdays only. Currently, a user who exercises Mon-Fri and rests on weekends sees their streak break every Saturday. This makes the tracker *punish correct behavior*. Smart rest days fix this fundamental modeling issue.

**Scope:**
- Schema: Replace `frequency: 'daily' | 'weekly'` with:
  ```typescript
  frequency: {
    type: 'daily' | 'weekly' | 'custom',
    activeDays?: number[]  // 0=Sun, 1=Mon, ... 6=Sat (for 'custom')
    timesPerWeek?: number  // for flexible "4x per week" goals
  }
  ```
- Backend: Validate new frequency format, update existing habits migration
- Frontend: Enhanced frequency picker in `HabitForm` with day-of-week checkboxes
- Utils: Update `calculateStreak` and health score to respect active days

**Effort:** Medium | **Dependencies:** Streak calculation refactor

---

## Tier 2 — High Impact, Medium-High Effort

### F6: Mood & Energy Correlation Tracker
**What:** Optional daily mood (1-5 scale or emoji) and energy level (1-5) check-in. Over time, surface correlations: "Your mood averages 4.2 on days you exercise vs. 2.8 on days you don't" or "You complete more habits on high-energy days (obvious) but your *streak consistency* is actually higher on low-energy days (surprising)."

**Why:** This transforms the app from a *tracker* into an *insight engine*. Users don't just see *what* they did — they see *how it affected them*. This creates a powerful feedback loop: "I can see that meditating actually improves my mood the next day." It also provides an early warning system: declining energy/mood trends predict habit dropout before it happens.

**Scope:**
- Schema: New `dailyCheckin: { date, mood: 1-5, energy: 1-5 }`
- Backend: New `POST /api/checkins`, `GET /api/checkins?range=30d`
- Frontend: Small daily check-in widget (emoji row or slider) above the habit table
- Frontend: New `<CorrelationInsights />` component showing cross-analysis
- Utils: Pearson correlation or simple average comparison between mood/energy and habit completion

**Effort:** Medium-High | **Dependencies:** None, but pairs well with Reports (FEATURES.md #9)

---

### F7: Habit Experiments (30-Day Trials)
**What:** A special "experiment" mode for new habits. User commits to exactly 30 days. The UI shows a distinct progress ring (not a streak), a countdown, and at day 30, prompts a reflection: "Keep this habit permanently, extend the experiment, or drop it?"

**Why:** Adding a habit permanently feels like a big commitment. "Just try it for 30 days" is psychologically easier — it has a defined end, which reduces resistance. This is the "free trial" model applied to behavior change. It also solves the problem of habit list bloat: experiments that don't work get consciously dropped rather than silently ignored. The reflection prompt forces a deliberate decision.

**Scope:**
- Schema: Add `experiment: { isExperiment: boolean, startDate: string, durationDays: number } | null` to Habit
- Frontend: "Start Experiment" option in HabitForm, distinct `<ExperimentRow />` UI with progress ring
- Frontend: Day-30 reflection modal with keep/extend/drop options
- Backend: No new endpoints — uses existing create/archive flow

**Effort:** Medium | **Dependencies:** None

---

### F8: Habit Insights Engine (Pattern Detection)
**What:** Automated detection of behavioral patterns from log data, surfaced as plain-English insights:
- "You complete Reading 90% on weekdays but only 30% on weekends"
- "Your most consistent day is Tuesday (95% all-habit completion)"
- "Exercise and Meditation are correlated — you tend to do both or neither"
- "Your habits decline in the last week of each month"
- "You've improved Water intake from 60% to 85% over the past 8 weeks"

**Why:** Users rarely analyze their own data. Raw numbers and heatmaps require interpretation. Plain-language insights deliver the "aha moment" directly. This is the kind of feature that makes users say "this app knows me" — it builds emotional attachment and retention. It also surfaces blind spots users don't notice themselves.

**Scope:**
- Utils: New `generateInsights(habits, logs)` module with pattern detectors:
  - Day-of-week analysis (chi-squared or simple percentage comparison)
  - Habit co-occurrence (which habits are completed together)
  - Trend detection (rolling average comparison: recent vs. historical)
  - Monthly/weekly cycle detection
- Frontend: New `<InsightsPanel />` component, either on dashboard or as a dedicated tab
- No backend changes — all computed client-side from existing data

**Effort:** Medium-High | **Dependencies:** Benefits from 30+ days of log data to be meaningful

---

### F9: Micro-Habits & Partial Completion
**What:** Instead of binary yes/no, allow configurable completion levels per habit: "Did it minimally" (25%), "Partial" (50%), "Almost full" (75%), "Full" (100%). Example: "Exercise" — walked 10 min (25%) vs. full gym session (100%). Streaks count any ≥25% as "done" but health scores weight by completion level.

**Why:** The all-or-nothing binary is the second biggest reason habits fail (after streak anxiety). On a low-energy day, a user might skip entirely because they can't do the "full" version. Partial completion keeps the chain going. The principle is "never miss twice" + "something is better than nothing." This is directly supported by BJ Fogg's Tiny Habits research: scaling down to the minimum viable version of a habit is more important than doing it perfectly.

**Scope:**
- Schema: Change logs from `string[]` (dates) to `{ date: string, level: 25|50|75|100 }[]`
- Backend: Update toggle endpoint to accept `level` parameter (default 100 for backward compat)
- Frontend: Long-press or click menu on day cells to select completion level
- Frontend: Visual encoding — opacity or fill level in day cells (25% = quarter fill, etc.)
- Utils: Update streak calc (any level counts) and health score (weighted by level)

**Effort:** High | **Dependencies:** Breaking schema change, needs migration

---

### F10: Weekly Review Wizard
**What:** A guided weekly reflection flow (triggered Sunday evening or user-configured) that walks through:
1. "Here's your week at a glance" (completion summary)
2. "What went well?" (auto-highlights best streaks/completions)
3. "What was hard?" (auto-highlights missed habits)
4. "Any habits to adjust?" (modify frequency, pause, or drop)
5. "Set an intention for next week" (free text, stored and shown Monday morning)

**Why:** Passive tracking without reflection is like collecting data without reading the report. A weekly review is a meta-habit that improves all other habits. By making it guided and semi-automated (pre-filled with actual data), it takes <2 minutes but delivers high-value self-awareness. The stored intention creates a bridge between weeks, so Monday morning has direction.

**Scope:**
- Schema: New `weeklyReviews: { weekOf: string, reflection: string, intention: string }[]`
- Backend: New `POST /api/reviews`, `GET /api/reviews/latest`
- Frontend: New `<WeeklyReviewWizard />` multi-step modal component
- Frontend: Monday morning intention banner on dashboard

**Effort:** Medium | **Dependencies:** Benefits from Dashboard Stats (FEATURES.md #1)

---

## Tier 3 — Creative Polish & Power User Features

### F11: Keyboard Shortcuts & Command Palette
**What:** Vim-style keyboard navigation: `j/k` to move between habits, `space` to toggle today, `n` for new habit, `/` to open a command palette for quick actions (search habits, jump to date, toggle archived view, etc.).

**Why:** Power users interact with habit trackers daily — this is a high-frequency app. Keyboard shortcuts reduce friction from ~3 clicks to 1 keystroke for the most common action (toggling today). A command palette (Cmd+K pattern) is now a standard expectation in modern web apps and demonstrates polish. This costs little to build but disproportionately improves perceived quality.

**Effort:** Low-Medium | **Dependencies:** None

---

### F12: Calendar / iCal Feed Export
**What:** Generate a read-only iCal (.ics) feed URL that shows habit completions as calendar events. Users subscribe in Google Calendar, Apple Calendar, etc.

**Why:** Many users already live in their calendar app. Seeing "✓ Meditated" and "✓ Exercised" alongside meetings creates a holistic view of their day. It also provides passive accountability — if calendar is shared with a partner/team, habits become visible. The iCal standard is universal and requires zero app installation.

**Effort:** Medium | **Dependencies:** Requires a stable URL, ideally with auth tokens (pairs with Auth, FEATURES.md #10)

---

### F13: "Best Day" & "Worst Day" Markers
**What:** Automatically annotate the calendar/heatmap with the user's personal best day (most habits completed) and worst day. Show these as small badges or markers. On the best day, show a subtle celebration. Track "personal records" over time.

**Why:** Gamification without the game. Users get natural milestone moments ("You just had your best day ever — 8/8 habits completed!") that feel earned, not manufactured. Personal records create a sense of progression that complements streaks. This is extremely low-effort to implement since it's pure derived state.

**Effort:** Low | **Dependencies:** None

---

### F14: Habit Sunset / Auto-Archive
**What:** If a habit hasn't been completed in 14+ days, surface a gentle prompt: "You haven't tracked [Reading] in 2 weeks. Archive it, recommit, or snooze this reminder?" Auto-dim inactive habits in the UI.

**Why:** Habit list rot is real — users accumulate habits they've silently abandoned but never formally remove. These ghost habits clutter the interface and create guilt ("I see Exercise every day and ignore it"). A sunset prompt forces a conscious decision: either recommit (which research shows increases follow-through) or archive cleanly. This keeps the active list honest and focused.

**Effort:** Low | **Dependencies:** None

---

### F15: Import from Other Trackers
**What:** Import habits and historical data from common formats: CSV, Habitica JSON export, Streaks app export, or a generic JSON schema. Provide a mapping UI for column/field alignment.

**Why:** The #1 barrier to switching habit trackers is losing historical data. An import tool eliminates this friction and signals that the app respects the user's investment in their data. Paired with Data Export (FEATURES.md #4), it creates a full data portability story.

**Effort:** Medium | **Dependencies:** Pairs with Data Export (FEATURES.md #4)

---

## Proposed Implementation Roadmap

```
                        EXISTING ROADMAP (FEATURES.md)          NEW FEATURES (this doc)
                        ─────────────────────────────          ─────────────────────────

Sprint 1               #1 Dashboard Stats                      F2  Health Score
(Quick Wins)           #3 Undo Toast                           F4  Failure Recovery
                       #14 Theme Toggle                        F13 Best/Worst Day Markers
                                                               F14 Habit Sunset Prompts

Sprint 2               #4 Data Export                           F1  Streak Shields / Vacation
(Core Model            #12 Templates                           F5  Smart Rest Days
 Improvements)         #2 Categories/Tags                      F11 Keyboard Shortcuts

Sprint 3               #5 Heatmap                              F3  Habit Stacking / Routines
(Engagement)           #8 Drag & Drop                          F7  Habit Experiments
                       #6 Notes                                F10 Weekly Review Wizard

Sprint 4               #9 Reports Page                         F6  Mood & Energy Correlation
(Insights)             #7 Reminders                            F8  Insights Engine
                       #13 Goals/Milestones

Sprint 5               #10 Authentication                      F9  Micro-Habits (schema change)
(Scale &               #11 Database Migration                  F12 iCal Export
 Infrastructure)       #15 PWA                                 F15 Import from Other Trackers
```

---

## Priority Matrix

| Feature | Impact | Effort | Risk | Recommended |
|---------|--------|--------|------|-------------|
| F2  Health Score | ★★★★★ | Low | Low | **Sprint 1** |
| F4  Failure Recovery | ★★★★★ | Low | Low | **Sprint 1** |
| F1  Streak Shields | ★★★★☆ | Medium | Low | **Sprint 2** |
| F5  Smart Rest Days | ★★★★★ | Medium | Medium | **Sprint 2** |
| F3  Habit Stacking | ★★★★☆ | Medium | Low | **Sprint 3** |
| F7  Experiments | ★★★★☆ | Medium | Low | Sprint 3 |
| F13 Best/Worst Day | ★★★☆☆ | Low | Low | Sprint 1 |
| F14 Habit Sunset | ★★★★☆ | Low | Low | Sprint 1 |
| F11 Keyboard Shortcuts | ★★★☆☆ | Low-Med | Low | Sprint 2 |
| F10 Weekly Review | ★★★★☆ | Medium | Low | Sprint 3 |
| F6  Mood Correlation | ★★★★☆ | Med-High | Medium | Sprint 4 |
| F8  Insights Engine | ★★★★★ | Med-High | Medium | Sprint 4 |
| F9  Micro-Habits | ★★★★☆ | High | High | Sprint 5 |
| F12 iCal Export | ★★★☆☆ | Medium | Low | Sprint 5 |
| F15 Import | ★★★☆☆ | Medium | Low | Sprint 5 |

---

## Decision Log (New Features)

| Decision | Rationale |
|----------|-----------|
| Health Score over raw streaks | Streaks punish imperfection. Consistency metrics are more truthful and motivating. |
| Streak Shields modeled after Duolingo | Proven retention mechanic. Low complexity, high emotional impact. |
| Smart Rest Days before Micro-Habits | Rest days fix the frequency model; micro-habits change the completion model. Fix the model first. |
| Client-side insights over server-side | Keeps backend simple. Insight computation is not performance-critical. |
| Experiments as a first-class concept | Reduces habit list bloat. Lowers commitment barrier for trying new habits. |
| Weekly Review as guided wizard | Unstructured "journal" features get ignored. A wizard with pre-filled data takes <2 min. |
| No AI/LLM integration for insights | Keep it deterministic and explainable. Simple statistics > black-box AI for personal data. |
| Partial completion as Tier 2 | Breaking schema change. High value but high migration risk — save for when DB migration happens. |
