# Habit Garden — Consolidated Feature Plan & Backlog

**Date:** 2026-10-31 | **Replaces:** All prior FEATURES_*.md, BACKLOG.md, ROADMAP.md, PLAN.md, FEATURE_PLAN.md, FEATURE_REVIEW_*.md (21 documents)

---

## 1. Project State

| Metric | Value |
|--------|-------|
| App | "Habit Garden" — daily/weekly habit tracker |
| Stack | React 19 + TypeScript + Vite 8 (frontend), Express + flat JSON file (backend) |
| Source files | 11 (4 components, 1 hook, 1 utils, 1 types, 1 API client, 2 server) |
| Lines of code | ~960 |
| Working features | Create habit (daily/weekly, custom color), toggle completion (14-day grid), streak tracking, archive, delete |
| Planning documents | 22 (including this one) |
| Prior feature proposals | 105+ across series A through P |
| Features shipped | **0** |

### What the app does today

A user creates habits with a name, frequency (daily/weekly), and color. Habits appear in a table showing the last 14 days as clickable cells. Clicking a cell toggles completion. A streak counter shows consecutive completed days/weeks. Habits can be archived (hidden) or deleted (permanent). The backend is a single JSON file with no auth.

---

## 2. New Feature Proposals (Q-Series)

These target dimensions genuinely absent from all 105 prior proposals (A through P). Each was found by reading the actual running code, not by extrapolating from feature lists.

### Q1. Habit Template Gallery (Onboarding)

**The blind spot:** Every prior proposal assumes the user already has habits. The actual empty state is `"No habits yet. Create your first one on the left."` — a dead end for anyone who opens the app and doesn't know what to track. Zero proposals address the first 30 seconds of the user experience.

**What it does:**
- Replace the empty-state text with a gallery of 8-10 common habits (Exercise, Read 10 pages, Meditate, Drink 8 glasses of water, Journal, No phone before bed, Study, Walk 10k steps)
- Each is a card with pre-filled name, frequency, and color — one tap to add
- Gallery disappears once the user has 3+ habits (they've learned the system)
- Also accessible from a "Browse templates" link in the create form

**Why it matters:** Onboarding friction is the highest-leverage UX problem. A user who adds 3 habits in the first minute will return tomorrow. A user who stares at a blank form may not.

**Effort:** ~20 min (template data array + gallery component + conditional rendering)

---

### Q2. Time-of-Day Grouping

**The blind spot:** The app treats all habits as equal regardless of when they happen. A user with 8 habits sees "Meditate" next to "Read before bed" in the same flat list. No proposal adds temporal context to habits — not scheduling, not reminders, just *grouping by when you do them*.

**What it does:**
- When creating a habit, optionally tag it: Morning / Afternoon / Evening / Anytime (default)
- The habit table gains collapsible section headers: "Morning", "Afternoon", "Evening", "Anytime"
- On mobile, the current time-of-day group auto-expands; others are collapsed
- No behavior change — same grid, same toggles, just grouped

**Data model:** Add `timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'` to Habit (default `'anytime'`).

**Why it's different from M2 (Drag-to-Reorder):** Reorder is manual spatial sorting. Time-of-day is semantic grouping that adapts to when you open the app.

**Effort:** ~25 min (field addition + groupBy logic + collapsible sections + migration default)

---

### Q3. Completion Velocity Indicator

**The blind spot:** Streaks show *current consecutive run*. Momentum (P3) shows *resilience to disruption*. Completion rate (N6) shows *percentage over a window*. None shows *trend direction* — is this habit getting better or worse compared to last week?

**What it does:**
- For each habit, compare completion rate of the last 7 days vs. the 7 days before that
- Display a single arrow: up (improving), flat (stable), or down (declining)
- Arrow appears next to the streak pill — tiny, non-intrusive, information-dense
- Calculated client-side from existing log data (no API change)
- Rules: >=20% improvement = up, >=20% decline = down, otherwise flat

**Why it's different from P3 (Momentum):** Momentum is an absolute score. Velocity is a *derivative* — the rate of change. A habit at 40% completion rate with an upward arrow feels very different from one at 40% with a downward arrow. One is building; the other is slipping.

**Effort:** ~10 min (pure computation from existing logs + tiny UI element)

---

### Q4. "Did I Already Log Today?" Indicator

**The blind spot:** 105 proposals, and none addresses the most basic anxiety: "Wait, did I already check in today?" Users open the app, see the 14-day grid, and must scan a row of 14 tiny cells to find today's column and check if it's filled. Prior proposals add more data to the grid (notes, durations, intentions). None simplifies the most frequent glance.

**What it does:**
- In the habit name area (left column), a small green dot appears if today is already checked
- In the header, show a fraction: "4/6 today" — how many habits are done vs. total active
- Both are derived from existing state, zero API calls
- On mobile, the "4/6 today" becomes the primary information in the header, replacing the date pill

**Why it matters:** This is the most common interaction: "open app → glance → close." It should take 0.5 seconds, not 5. Every data-heavy proposal (heatmaps, momentum, correlations) makes this glance *harder*, not easier. Q4 makes it instant.

**Effort:** ~10 min (derive from existing state + two small UI additions)

---

### Q5. Habit Pause with Auto-Resume

**The blind spot:** P2 proposed a "paused" state between active and archived. But pausing without an auto-resume is just soft archiving — users pause habits and forget they exist. The missing piece is *temporary* pause with a return date.

**What it does:**
- "Pause" action asks "Resume in: 3 days / 1 week / 2 weeks / custom date"
- Paused habits move to a collapsed "Paused" section showing the resume date
- On the resume date, the habit silently returns to the active list (streak resets to 0, momentum preserved if P3 is implemented)
- If a user opens the app after the resume date, a gentle highlight says "Welcome back to [habit]!"

**Data model:** Add `pausedUntil?: string` (ISO date) to Habit. Status logic: if `pausedUntil` exists and is in the future → paused. If in the past → auto-resume (clear the field).

**Why it's different from P2 (Stale Detection):** P2 is reactive (detects abandoned habits). Q5 is intentional (user explicitly pauses and sets a return). P2 says "you stopped doing this." Q5 says "I'm traveling and will resume Monday."

**Effort:** ~20 min (pause UI + resume date + status section + auto-clear logic)

---

### Q6. Weekly Digest / Scorecard

**The blind spot:** Every analytics proposal is *always visible* — embedded in the main view as heatmaps, sparklines, or badges. None creates a *periodic summary* — a distinct moment where the user reviews their week. The daily view is for doing. A weekly view is for reflecting. They need different designs.

**What it does:**
- Every Sunday (or configurable day), a "Weekly Scorecard" banner appears at the top of the app
- Shows: total completions / total possible, best habit this week, habit that needs attention, current longest streak
- Dismissible — once viewed, it collapses to a small "View last week's scorecard" link
- Data is all computed client-side from existing logs
- The scorecard is a simple card, not a dashboard — 4 stats, 30-second read

**Why it's different from P4 (Weekly Intentions):** Intentions are prospective (plan the week). Scorecard is retrospective (review the week). They're complementary — intentions set goals, scorecard measures them — but each stands alone.

**Effort:** ~25 min (scorecard component + weekly trigger logic + dismissal state)

---

## 3. Novelty Verification: Q-Series vs. All Prior Work

| ID | Feature | Dimension | Nearest Prior | How Q Differs |
|----|---------|-----------|---------------|---------------|
| Q1 | Template Gallery | First-time onboarding | None | No prior proposal addresses the empty state or first 30 seconds |
| Q2 | Time-of-Day Groups | Temporal context | M2 (Drag Reorder) | M2 is manual spatial order. Q2 is semantic time-based grouping |
| Q3 | Completion Velocity | Trend direction | P3 (Momentum), N6 (Rate) | Momentum is absolute score. Rate is percentage. Velocity is the derivative |
| Q4 | Today Indicator | At-a-glance status | None | 105 proposals add data. None simplifies the most basic glance |
| Q5 | Pause + Auto-Resume | Intentional temporary break | P2 (Stale Detection) | P2 is reactive detection. Q5 is user-initiated with a return date |
| Q6 | Weekly Scorecard | Periodic reflection | P4 (Intentions), N3 (Heatmap) | Intentions are prospective. Heatmap is always-visible. Scorecard is a weekly moment |

---

## 4. The Definitive Backlog

This is the single source of truth. It incorporates the best items from all prior documents (A through P series) plus the Q-series above, deduplicated and ordered by impact.

### Tier 0 — Fix What's Broken (before any feature work)

These are bugs and architectural blockers. Nothing else should be built until these land.

| # | Item | Why | Est. |
|---|------|-----|------|
| 0.1 | **API error handling** — add `if (!res.ok) throw` to every fetch in `api.ts` | Silent data corruption. A 500 response currently parses HTML as JSON. | 10 min |
| 0.2 | **PUT /api/habits/:id endpoint** — server can create and delete but not update | Blocks every feature that edits a habit field (pause, time-of-day, etc.) | 15 min |
| 0.3 | **Data migration function** — `migrateData()` in `app.js` fills missing fields with defaults | Every new feature adds fields. Without this, every read path needs defensive checks. | 10 min |
| 0.4 | **Reconcile CSS** — `index.css` defines an unused light/dark system that conflicts with `App.css` | Two competing design systems cause unpredictable rendering. | 5 min |
| 0.5 | **Clean test data** — reset `data.json` to `{"habits":[],"logs":{}}` | Current data is 8 test habits named "test" and "123". | 1 min |
| | | **Tier 0 total** | **~40 min** |

### Tier 1 — Make the Daily Experience Good (high-impact, low-effort)

These are the features that make opening the app every day *feel good*. Ordered by impact-per-minute-of-effort.

| # | Feature | Source | Why this tier | Est. |
|---|---------|--------|---------------|------|
| 1.1 | **Today indicator** ("4/6 today" + green dots) | Q4 | Highest-frequency interaction, lowest effort | 10 min |
| 1.2 | **Completion velocity arrows** (up/flat/down trend) | Q3 | Pure computation, massive information density | 10 min |
| 1.3 | **Undo toast** (undo last toggle/archive within 5s) | N2 | Prevents the most common "oops" | 20 min |
| 1.4 | **Template gallery** (onboarding empty state) | Q1 | First-time experience is currently a dead end | 20 min |
| 1.5 | **Batch check-in** (modal for daily review) | P1 | Optimizes the #1 daily flow | 25 min |
| 1.6 | **Celebration micro-animation** (confetti/flash on all-done) | M1 | Dopamine hit when you complete your day | 15 min |
| | | | **Tier 1 total (all 6)** | **~100 min** |

### Tier 2 — Expand the Model (medium effort, structural improvements)

These add new dimensions to how habits work. Each requires the Tier 0 edit endpoint and migration.

| # | Feature | Source | Why this tier | Est. |
|---|---------|--------|---------------|------|
| 2.1 | **Time-of-day grouping** (morning/afternoon/evening) | Q2 | Scales the UI from 5 to 15+ habits | 25 min |
| 2.2 | **Pause + auto-resume** (temporary break with return date) | Q5 | Intentional breaks without losing history | 20 min |
| 2.3 | **Stale habit detection** (flag 14-day-inactive habits) | P2 | Automatic list hygiene | 20 min |
| 2.4 | **Forgiveness streak** (1 grace day per 7 completed) | N1 | Makes streaks resilient, reduces anxiety | 25 min |
| 2.5 | **Unarchive + archived habits section** | Prior (multiple) | Users archive by accident, can't recover | 15 min |
| 2.6 | **Edit habit** (rename, change frequency/color) | M5 | Basic CRUD completeness | 20 min |
| | | | **Tier 2 total (all 6)** | **~125 min** |

### Tier 3 — Reflection & Insight (require accumulated data to be useful)

Ship these after users have 2+ weeks of data. Launching earlier means empty charts.

| # | Feature | Source | Why this tier | Est. |
|---|---------|--------|---------------|------|
| 3.1 | **Weekly scorecard** (periodic summary banner) | Q6 | Reflection ritual, distinct from daily view | 25 min |
| 3.2 | **Habit heatmap** (GitHub-style year grid) | N3 | Visual density for long-term patterns | 40 min |
| 3.3 | **Momentum score** (continuous 0-100 resilience metric) | P3 | Replaces binary streaks with a resilient metric | 20 min |
| 3.4 | **Check-in notes** (optional text per completion) | N4 | Adds qualitative context to quantitative tracking | 30 min |
| 3.5 | **Weekly intention setting** (plan which days this week) | P4 | Prospective commitment amplifies satisfaction | 35 min |
| | | | **Tier 3 total (all 5)** | **~150 min** |

### Tier 4 — Differentiation (ambitious, high-effort, make the app unique)

These are the features that make Habit Garden distinct from every other tracker. Build them when the core is solid.

| # | Feature | Source | Why this tier | Est. |
|---|---------|--------|---------------|------|
| 4.1 | **Cross-habit correlation** (co-occurrence insights) | P5 | Requires months of multi-habit data | 30 min |
| 4.2 | **Focus timer** (countdown for timed habits) | P6 | New interaction paradigm (timer vs. checkbox) | 30 min |
| 4.3 | **Yesterday recovery** (quick-log yesterday's habits) | M4 | Common need but lower priority than forward features | 20 min |
| 4.4 | **Keyboard quick-log** (j/k to navigate, space to toggle) | M6 | Power-user efficiency | 20 min |
| 4.5 | **Narrative view** ("Your October: ...") | J2 | Storytelling from data — unique differentiator | 50 min |
| | | | **Tier 4 total (all 5)** | **~150 min** |

### Parked (not on the roadmap, revisit after Tier 3)

These are either too complex for the current architecture, require infrastructure the app doesn't have, or are "nice to have" that don't improve the core loop.

| Feature | Source | Why parked |
|---------|--------|------------|
| Living garden visualization | Various | Scope explosion — needs canvas/SVG/animation expertise |
| Social/sharing | Various | Requires auth, which this app doesn't have |
| Full analytics dashboard | Various | The scorecard (Q6) + heatmap (N3) cover 90% of the value |
| PWA/offline support | Various | Architecture change (service workers, IndexedDB) |
| Export/import | Various | Useful but low-frequency; add when users ask |
| Habit stacking/chains | K4 | Complex dependency modeling for marginal UX gain |
| Drag-to-reorder | M2 | Time-of-day grouping (Q2) solves the ordering problem more naturally |
| Difficulty curve | L4 | Interesting but hard to explain to users; momentum (P3) is simpler |
| Habit experiments | K3 | A/B testing habits is clever but niche |
| Rest days (scheduled) | N5 | Weekly intentions (P4) subsumes this more flexibly |

---

## 5. Reasoning: Why This Order

**Tier 0 first** because bugs compound. The `api.ts` error handling gap (0.1) is a data-corruption risk — every toggle could silently fail. The missing edit endpoint (0.2) blocks half of Tiers 2-4. Migration (0.3) is 10 minutes that saves 5 minutes per future feature. These aren't optional.

**Tier 1 before Tier 2** because daily experience beats structural depth. A user who opens the app and instantly sees "4/6 today" (Q4) feels informed. A user who sees velocity arrows (Q3) feels motivated. A user who finishes all habits and sees a celebration (M1) feels rewarded. These three take 35 minutes combined and transform every single session. Tier 2 features (forgiveness, grouping, pause) are valuable but affect specific scenarios, not every visit.

**Q4 at the top of Tier 1** because it has the best effort-to-impact ratio in the entire backlog: 10 minutes of work, and every user sees it every time they open the app. It's pure derivation from existing state — no API changes, no data model changes, no migration.

**Tier 3 after Tier 2** because reflection features need data. A weekly scorecard with 3 days of history is pointless. A heatmap with one week of data is misleading. These features reward long-term users, so they should ship after the core is compelling enough to create long-term users.

**Tier 4 last** because these are either power-user features (keyboard shortcuts, correlation analysis) or new interaction paradigms (focus timer) that expand scope. The app should nail checkbox-based habit tracking before adding timer-based habits.

---

## 6. Architecture Notes

1. **Every feature from Tier 1 onward assumes Tier 0 is done.** Don't skip 0.2 (edit endpoint) or 0.3 (migration) — they're load-bearing.

2. **The `archived: boolean` → `status: 'active' | 'paused' | 'archived'` migration should happen with Q5 (Pause).** Until then, `archived: boolean` is fine. Don't migrate prematurely.

3. **Client-side computation is preferred over new endpoints** for analytics (Q3, Q4, Q6, P3, P5). The data is already fetched; deriving insights from it saves API complexity.

4. **Batch check-in (P1) needs one new endpoint** (`POST /api/logs/batch`), but it's additive — the existing toggle endpoint stays untouched.

5. **Template gallery (Q1) is pure frontend** — the templates are a static array, not a database table. Keep it simple.

---

## 7. What This Document Replaces

This is the 22nd planning document. It consolidates and supersedes:

- FEATURES_v3.md through FEATURES_v16.md (14 documents)
- BACKLOG.md, ROADMAP.md, PLAN.md, FEATURE_PLAN.md
- FEATURES_NEW.md, FEATURES_FINAL.md, FEATURES_AND_BACKLOG.md
- FEATURE_REVIEW_2026-10-29.md, FEATURE_REVIEW_2026-10-30.md

**Every feature worth keeping is in Section 4.** If it's not in the backlog above, it was either duplicated by a better proposal, too complex for the current architecture, or insufficiently impactful.

**The prior docs can be archived or deleted.** They served their purpose as exploration; this document is the distillation.

---

## 8. The Execution Contract

The backlog is set. The next action is code, not another `.md` file.

| What | When | Deliverable |
|------|------|-------------|
| Tier 0 (bugs + blockers) | First session | 5 commits, each addressing one item |
| Tier 1 (daily experience) | Next 2-3 sessions | 6 features, each a separate PR-able commit |
| Tier 2 (expand the model) | After Tier 1 ships and gets real use | 6 features |
| Tier 3 (reflection) | After 2+ weeks of Tier 1+2 usage data | 5 features |
| Tier 4 (differentiation) | After core is solid | 5 features |

**Total estimated effort across all tiers: ~565 minutes (~9.4 hours).**

The entire app — from bug-free core to differentiated product — is under 10 hours of focused coding. The planning took longer.
