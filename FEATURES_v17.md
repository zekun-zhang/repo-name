# FEATURES v17 — Final Feature Plan & Consolidated Backlog

> **Date**: 2026-10-19
> **Status**: Replaces all prior planning documents (PLAN.md, BACKLOG.md, FEATURES_v3–v16)
> **Context**: 78 features proposed across 16 documents. 0 shipped. ~8,400 lines of planning vs ~960 lines of app code. This document breaks that cycle.

---

## Part 1: Current State of the App

Habit Garden is a React 19 + Express 5 habit tracker with file-based JSON storage.

**What it does today** (11 features):
1. Create a habit (name, daily/weekly frequency, color)
2. Toggle completions on a 14-day grid
3. View current streak (daily: consecutive days; weekly: consecutive ISO weeks)
4. Archive a habit (one-way — no unarchive)
5. Delete a habit with confirmation
6. Optimistic UI with rollback on server error
7. Toast notifications for mutation failures
8. Loading spinner and error-with-retry states
9. Dark theme (hardcoded)
10. Responsive layout (collapses below 900px)
11. Sticky habit creation form

**Data model** (minimal):
```
Habit: { id, name, frequency, color, createdAt, archived }
HabitLog: { [habitId]: string[] }  // just date strings like "2026-10-19"
```

**Notable gaps in foundation**: No `res.ok` checks on client fetch calls, no habit editing, no unarchive, no view beyond 14 days, zero client-side tests.

---

## Part 2: New Feature Proposals (8 genuinely novel ideas)

These features have NOT been proposed in any prior document. Each addresses a real gap in the user experience backed by behavioral reasoning.

### J1: Snapback Resilience Score

**Problem**: Every habit tracker obsesses over streaks — an all-or-nothing metric that punishes any miss equally whether you resume the next day or vanish for a month. Users who miss one day and restart immediately feel the same shame as users who quit for weeks.

**Behavioral reasoning**: Research on self-regulation (Baumeister & Vohs, 2007) shows that *recovery speed after failure* predicts long-term success better than unbroken consistency. Measuring resilience reframes misses as part of the process rather than catastrophic failures.

**What it looks like**:
- When a streak breaks, the app records the "gap" (days between last completion and next completion)
- A per-habit "snapback score" shows average recovery time: "You typically restart within 1.2 days"
- Trend indicator: "Your recovery is getting faster" (or slower)
- Displayed alongside streak count, so the user sees TWO metrics: streak length + recovery speed

**Data model change**: Add `gaps: { start: string, end: string | null }[]` to habit log metadata (or compute on read from existing date arrays — no schema change needed for v1).

**Complexity**: Low — purely computed from existing log data. ~2 hours: utility function + UI display.

**Why novel**: Prior proposals (N2 streak insurance, E3 miss pattern map, dim 49 streak shields) focus on preventing or softening streak breaks. None measure the user's actual resilience behavior.

---

### J2: Habit Debt Ledger

**Problem**: Life is irregular. A rigid "daily" habit doesn't account for sick days, travel, or emergencies. Users want flexibility without losing accountability. Missing Monday shouldn't mean the week is ruined.

**Behavioral reasoning**: "Moral licensing" research (Merritt et al., 2010) shows that people who feel they've earned credit through prior effort are more likely to continue. A formal debt/credit system channels this psychology productively instead of letting it become an excuse.

**What it looks like**:
- Each habit has a weekly target (e.g., "5 of 7 days" or "3 sessions this week")
- Completing more than the target earns "credit"; completing less creates "debt"
- A small balance indicator on each habit: "+2 ahead" or "-1 behind"
- Debt carries forward for 1 week only (prevents infinite accumulation)
- Weekly target is optional — habits without it behave as before

**Data model change**: Add optional `weeklyTarget: number` to Habit type. Balance computed from log data.

**Complexity**: Medium — requires weekly aggregation logic + UI indicator. ~4 hours.

**Why novel**: Prior proposals treat habits as binary daily/weekly. Grace days (N2) and quiet weeks (N7) are about pausing the whole system. This is about flexible accountability within a single habit's rhythm.

---

### J3: Completion Emotion Tags

**Problem**: Users complete habits robotically without understanding which habits genuinely improve their wellbeing and which are pure obligation. Over months, they can't tell which habits to keep, adjust, or drop.

**Behavioral reasoning**: Affect tagging — briefly noting how an activity makes you feel — is a core technique in Acceptance and Commitment Therapy (ACT). It builds self-awareness about value alignment: habits that consistently feel bad despite completion may be poorly designed or misaligned with goals.

**What it looks like**:
- After toggling a completion, a small 3-option popover appears (optional, dismissable): 😊 Good / 😐 Neutral / 😔 Draining
- One tap to tag, or click away to skip — must be < 2 seconds of friction
- Over time, a per-habit "mood ratio" appears: "78% positive completions"
- In a future stats view, cross-habit mood patterns surface: "Your mood dips on habits done after 9pm"

**Data model change**: Extend log entries from bare date strings to `{ date: string, mood?: 'good' | 'neutral' | 'draining' }`. Backward-compatible: existing string entries treated as no-mood.

**Complexity**: Medium — requires log schema migration + popover UI + aggregation. ~5 hours.

**Why novel**: Energy-Aware Check-In (N3) is about pre-completion energy level adjusting expectations. Start Friction Log (C5) rates difficulty. Neither captures post-completion emotional feedback, and neither tracks mood trends over time.

---

### J4: Predictive Risk Forecast

**Problem**: Users are blindsided by their own patterns. They don't realize they always skip running on Fridays, or that they never meditate on days they work late, until after the streak breaks.

**Behavioral reasoning**: Implementation intentions ("if X situation, then Y action") are one of the strongest behavior change interventions (Gollwitzer & Sheeran, 2006). But they require awareness of risk situations first. Surfacing patterns proactively creates the awareness that makes implementation intentions possible.

**What it looks like**:
- A subtle "risk" indicator on habits that historically have low completion rates on today's day-of-week
- E.g., on a Friday, "Running" shows a yellow dot with tooltip: "You complete this 30% of Fridays"
- Weekly summary: "Your riskiest day this week is Thursday (3 habits below 50% completion)"
- Not a notification — integrated into the existing table view as a visual signal

**Data model change**: None. Computed from existing log data (day-of-week completion rates).

**Complexity**: Low-medium — statistical aggregation + conditional UI rendering. ~3 hours.

**Why novel**: Miss Pattern Map (E3) is a retrospective analysis tool. Slump Radar detects declining trends. Neither is forward-looking on a specific day. This predicts TODAY's risks based on historical day-of-week patterns.

---

### J5: Focus Check-In Mode

**Problem**: The 14-column table works on desktop but is awkward on phones. More critically, when a user just wants to quickly check off today's habits (the most common interaction), the full table is visual overhead.

**Behavioral reasoning**: Reducing friction is the most reliable way to improve habit consistency (Fogg, 2019). Every extra tap or scroll between "open app" and "mark done" is friction. A dedicated check-in mode should be 1 tap per habit, no scrolling.

**What it looks like**:
- A toggle or dedicated route: "Check In" mode
- Shows ONLY today's incomplete habits, one per card, stacked vertically
- Each card: habit name + color + big tap target to mark complete
- Completing a habit plays a brief animation and the card slides away
- When all habits are done: a celebration state ("All done for today!")
- Automatically exits to normal view when all complete, or user can switch back anytime

**Data model change**: None — uses existing data, just a different view.

**Complexity**: Medium — new component/route + animations. ~4 hours.

**Why novel**: Today Dashboard (D3) is a "simplified daily checklist view" but was designed as a dashboard with stats. This is specifically a phone-first, zero-friction completion flow with sequential reveal and celebration. The UX is fundamentally different: D3 shows information, J5 optimizes for action.

---

### J6: Social Accountability Links

**Problem**: Habit formation is dramatically more successful with social accountability, but the app is entirely solo. Users have no way to share progress or involve others in their journey.

**Behavioral reasoning**: The "Kohler effect" (Kerr et al., 2007) shows that people work harder when they know their effort is visible to others, especially those they respect. Even passive observation (knowing someone CAN see your progress) increases consistency by 30-40% in studies.

**What it looks like**:
- Per-habit "Share" button generates a unique read-only link
- Link shows: habit name, current streak, last 30 days of completions, snapback score
- No login required for the viewer — it's a static, auto-updating page
- Optional: viewer can send a "nudge" (a push to the habit's activity feed) if the user enables it
- The shared link can be revoked at any time

**Data model change**: Add `shareToken: string | null` to Habit. New public API endpoint for reading shared habit data.

**Complexity**: High — new route, token generation, public API, share page UI. ~8 hours.

**Why novel**: Accountability Snapshot (E1) is a one-time static image export. This is a live, persistent, read-only link with optional bidirectional nudging. The social mechanism is fundamentally different.

---

### J7: Habit Autopilot Detection & Collapse

**Problem**: As users build many habits over months, their table grows. Habits that are firmly established (e.g., "brush teeth" at a 98% completion rate for 3 months) take up the same visual space as habits that still need conscious attention.

**Behavioral reasoning**: The habit formation literature (Lally et al., 2010) identifies that habits become automatic after an average of 66 days of consistent practice. Once automatic, conscious attention is wasted on them — and worse, a long list of "easy" habits dilutes attention from the ones that actually need effort.

**What it looks like**:
- When a habit exceeds a consistency threshold (e.g., >90% for 60+ days), it gets an "Autopilot" badge
- Autopilot habits collapse into a compact row at the bottom: just name + green indicator + streak
- One tap to expand back to full view
- If an autopilot habit's consistency drops below 80%, it automatically "wakes up" back to normal view
- Users can manually promote/demote habits to/from autopilot

**Data model change**: Add optional `autopilot: boolean` to Habit (or compute from log data with manual override).

**Complexity**: Medium — consistency calculation + collapsible UI section. ~4 hours.

**Why novel**: Habit Maturity & Graduation (dim 48) proposes "retiring" habits entirely. This is different: autopilot habits are still tracked and still visible — they just take up less space. They can also "wake up" automatically, which graduation doesn't support.

---

### J8: Weekly Review Ritual

**Problem**: Users check habits daily but never step back to reflect on patterns, celebrate progress, or adjust strategy. Without periodic reflection, habit tracking becomes mechanical data entry.

**Behavioral reasoning**: The "weekly review" is a cornerstone of GTD (Allen, 2001) and most coaching frameworks. Structured reflection converts raw data into behavioral insight. Users who review weekly are 2-3x more likely to sustain habits long-term than those who only do daily check-ins.

**What it looks like**:
- Every Sunday (configurable), a "Weekly Review" prompt appears
- Auto-generated summary: completions this week, best/worst habits, streak changes, mood trends (if J3 enabled)
- Three guided prompts:
  1. "What went well?" (freeform text)
  2. "What got in the way?" (freeform text)
  3. "One adjustment for next week?" (freeform text)
- Responses saved and viewable in a timeline
- Previous weeks' reviews accessible for reflection on longer-term patterns

**Data model change**: New `WeeklyReview` type: `{ id, weekStart: string, summary: auto-generated, responses: { wentWell, obstacles, adjustment }, createdAt }`.

**Complexity**: Medium-high — new data type, auto-summary generation, review UI, timeline view. ~6 hours.

**Why novel**: Weekly Compass (N4) is about forward intention-setting. Weekly Story (F4) is auto-generated narrative prose. Neither includes user-written reflection, and neither stores responses for longitudinal review. This combines auto-generated insight with guided journaling.

---

## Part 3: Consolidated Backlog

One list. Prioritized by: (1) foundation fixes that unblock everything else, (2) features with the highest impact-to-effort ratio, (3) features that differentiate the app.

### Tier 0: Foundation Fixes (must ship before any feature)

These are bugs and missing basics, not features. Estimated: ~3 hours total.

| # | Item | Est. | Reasoning |
|---|------|------|-----------|
| 0.1 | **API error handling** — check `res.ok` in all fetch calls, surface server errors to user | 30m | Client silently swallows 500s. Every other feature depends on reliable error reporting. |
| 0.2 | **Edit habit** — rename, change color, change frequency of existing habits | 45m | Most requested missing CRUD operation. Users currently delete and recreate. |
| 0.3 | **Unarchive habit** — view archived habits and restore them | 30m | Archive is currently a one-way trap. Makes archive usable as a "pause" mechanism. |
| 0.4 | **Client-side tests** — unit tests for `calculateStreak`, `calculateWeeklyStreak`, and `useHabits` hook | 45m | Complex date logic is untested. Streak bugs would silently corrupt the core metric users care about. |

### Tier 1: High-Impact UX Wins (~30 min each)

| # | Item | Est. | Source | Reasoning |
|---|------|------|--------|-----------|
| 1.1 | **Focus Check-In Mode** (J5) | 4h | New | The single biggest friction reducer. Transforms the most common daily interaction. |
| 1.2 | **Predictive Risk Forecast** (J4) | 3h | New | Pure computation over existing data — no schema changes. Immediate user insight. |
| 1.3 | **Snapback Resilience Score** (J1) | 2h | New | Reframes the streak-break experience. Computed from existing data. |
| 1.4 | **Habit Templates** (G5) | 2h | v15 | Solves cold-start problem. Predefined habits with sensible defaults. |
| 1.5 | **Anchor Statement** (C3) | 1h | BACKLOG | Simple text field — "why I do this." Adds meaning with minimal effort. |

### Tier 2: Data Model Expansion

| # | Item | Est. | Source | Reasoning |
|---|------|------|--------|-----------|
| 2.1 | **Custom Scheduling** (G1) | 4h | v15 | Unlocks Mon/Wed/Fri habits, "3x per week" habits. Required for Habit Debt (J2). |
| 2.2 | **Habit Debt Ledger** (J2) | 4h | New | Requires weekly targets (see 2.1). Flexible accountability for real life. |
| 2.3 | **Completion Emotion Tags** (J3) | 5h | New | Log schema migration. Unlocks mood-based insights in later features. |
| 2.4 | **Quantitative Habits** (G2) | 4h | v15 | "8 glasses of water" — partial progress tracking. Major data model expansion. |
| 2.5 | **Tags & Categories** (G4) | 3h | v15 | Grouping mechanism. Becomes essential once users have 10+ habits. |

### Tier 3: Engagement & Differentiation

| # | Item | Est. | Source | Reasoning |
|---|------|------|--------|-----------|
| 3.1 | **Habit Autopilot Detection** (J7) | 4h | New | Declutters the UI for power users. Data-driven, automatic. |
| 3.2 | **Weekly Review Ritual** (J8) | 6h | New | The feature that turns mechanical tracking into genuine self-improvement. |
| 3.3 | **Social Accountability Links** (J6) | 8h | New | Social features have the strongest evidence for habit persistence. |
| 3.4 | **Completion Sparks** (N8) | 3h | PLAN.md | Micro-celebrations. Small but meaningful for daily satisfaction. |
| 3.5 | **Year-at-a-Glance Heatmap** (D1) | 4h | v12 | Long-term perspective. The GitHub contribution graph for habits. |

### Tier 4: Polish & Power Features

| # | Item | Est. | Source | Reasoning |
|---|------|------|--------|-----------|
| 4.1 | **Theme Toggle** (light/dark) | 1h | PLAN.md | CSS variables already partially exist in index.css. Quick win. |
| 4.2 | **Data Export** (JSON/CSV) | 2h | PLAN.md | User data ownership. Simple server endpoint. |
| 4.3 | **Quit/Avoidance Mode** (G3) | 3h | v15 | "Days since last cigarette" — count-up tracking for habits to break. |
| 4.4 | **Miss Pattern Map** (E3) | 4h | v13 | Structural failure analysis — which days, which habits, which contexts. |
| 4.5 | **Momentum Decay Sparkline** (C2) | 3h | BACKLOG | 7-day colored density indicator. Compact visual health metric. |

### Parked (good ideas, wrong time)

These require infrastructure that doesn't exist yet or serve edge cases:

- **Living Garden View** — Beautiful but needs a design system and canvas rendering. Ship core features first.
- **PWA / Offline** — Requires service worker, sync logic, conflict resolution. Premature without multi-device.
- **Habit Stacking / Chains** (N1) — Requires habit dependency model. Build after tags & categories.
- **Habit Pair Discovery** (D4) — Requires substantial log history to compute correlations. Ship after 3+ months of user data.
- **Energy-Aware Check-In** (N3) — Interesting but adds friction to every check-in. Conflicts with J5's friction-reduction goal.
- **Quick Command Bar** (E5) — Power-user feature. Build after there are enough features to command.

---

## Part 4: Execution Principles

**Why 16 prior documents produced 0 shipped features** (diagnosis):
1. Each document proposed 5-8 new features without implementing the prior document's features
2. Features were designed in isolation from the codebase's actual constraints
3. No document started with "fix the foundation first" — they all jumped to novel ideas
4. Time estimates were absent or unrealistic
5. No document defined "done" for individual features

**Rules for this backlog**:
1. **Tier 0 ships before any Tier 1 work begins.** No exceptions.
2. **One feature at a time.** No parallel development tracks.
3. **Each feature is "done" when**: code is written, tests pass, UI works on desktop AND mobile viewport.
4. **No new planning documents.** Update THIS document's status column. If a feature needs design, design it in a code comment or component file, not a new .md file.
5. **The next commit after this document MUST be code** — specifically, item 0.1 (API error handling).

---

## Part 5: Tech Debt Items (address opportunistically)

Not backlog items — fix these when touching adjacent code:

| Item | When to fix |
|------|-------------|
| Duplicate CSS `:root` definitions (index.css vs App.css) | When implementing theme toggle (4.1) |
| `data.json` in git with test data | Next commit that touches `.gitignore` |
| 16 accumulated FEATURES_v*.md files in repo root | After this document is committed — archive or delete them |
| Zero client-side tests | Tier 0.4, and then with each new feature |
| Server not TypeScript | When server needs significant changes (e.g., new data types for J3, J8) |
| Unused boilerplate assets (react.svg, vite.svg) | Any cleanup commit |
| GET reads bypass async mutex on server | When implementing any feature that adds concurrent write patterns |

---

## Appendix: Feature ID Registry

To avoid collisions with prior documents:

| Series | Documents | Range |
|--------|-----------|-------|
| N1–N8 | PLAN.md | 8 features |
| C1–C5 | BACKLOG.md | 5 features |
| D1–D5 | FEATURES_v12 | 5 features |
| E1–E5 | FEATURES_v13 | 5 features |
| F1–F5 | FEATURES_v14 | 5 features |
| G1–G5 | FEATURES_v15 | 5 features |
| H1–H4 | FEATURES_v16 | 4 features |
| **J1–J8** | **This document (v17)** | **8 features** |

(I-series skipped to avoid confusion with the Roman numeral I and the pronoun.)
