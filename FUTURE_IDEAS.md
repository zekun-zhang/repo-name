# Habit Garden — Future Ideas & Creative Backlog

> Third-tier proposals that extend **`FEATURES.md`** (roadmap #1–#16) and **`NEW_FEATURES.md`** (F1–F15).
> This document only contains ideas **not** already covered in those two files. Read it alongside them.

---

## Why a Third Document?

The existing docs cover two categories well:

1. **`FEATURES.md`** — foundational product features (stats, tags, reports, auth, DB, PWA…).
2. **`NEW_FEATURES.md`** — behavior-science refinements (streak shields, health score, stacking, micro-habits…).

What's still missing is a layer of ideas that are either (a) **identity-driven**, (b) **integration-driven**, or (c) **adaptive/data-driven beyond static insights**. Those are the three lenses that guided this document — each feature below maps to one of them.

| Lens | What it targets | Example features in this doc |
|------|-----------------|------------------------------|
| **Identity** | "Who am I becoming?" — the motivational layer beneath streaks and stats. | I1, I2, I9 |
| **Integrations** | Making Habit Garden part of the user's existing tool ecosystem instead of a silo. | I4, I7, I10 |
| **Adaptation** | Using accumulated log data to *change the app's behavior*, not just display it. | I3, I5, I6, I8 |

Every feature includes: **what**, **why** (reasoning), **scope**, **effort**, **risk**.

---

## Tier A — High-Impact, Quick Wins

### I1. Identity Statements ("I am a ___")
**What:** When creating a habit, users optionally attach an identity statement: *"I am a runner"*, *"I am someone who reads every day"*. The statement is shown prominently on the habit row and on check-in.

**Why (reasoning before the feature):** James Clear's central argument in *Atomic Habits* is that durable change comes from *identity-based* habits, not *outcome-based* ones. A user chasing "30 pushups a day" quits when life gets busy. A user who believes "I am someone who exercises" finds a way. Our current model is purely outcome-based — every field (frequency, streak, goal) describes *what* to do, none describes *who* you're becoming. Adding one small field closes that gap with almost zero complexity. It also changes the emotional tone of every check-in from "task done" to "identity reinforced."

**Scope:** Add `identity: string | null` to Habit schema. Display below habit name. No backend logic changes.
**Effort:** Very low · **Risk:** None

---

### I2. Habit Graveyard (with Post-Mortems)
**What:** A separate "Graveyard" view for abandoned habits. When archiving, prompt the user for a short reason ("too ambitious", "wrong time of day", "lost interest"). The graveyard becomes a learning tool, not a failure list.

**Why:** Archived habits currently disappear into a void. But *why* a habit failed is the most valuable data a tracker can collect — it prevents the user from repeating the same mistake on their next attempt. A post-mortem prompt takes 10 seconds at archive time and produces permanent insight. Seeing patterns like "3 of my 5 dead habits were evening-timed" is more actionable than any streak graph. This also removes the stigma of archiving: it becomes a deliberate learning act, not a quiet quit.

**Scope:** Add `archiveReason: string | null` and `archivedAt: string | null` to Habit. New `<GraveyardView />` component. Modify archive endpoint to accept reason.
**Effort:** Low · **Risk:** None

---

### I3. Retrospective Backfill with Confidence
**What:** Allow users to check off *past* days they forgot to log, but require a "confidence" tag (certain / probably / best guess). Backfilled entries are visually distinct (dotted border) and excluded from strict streak calculations by default, with a toggle to include them.

**Why:** Right now, if a user forgets to open the app for 3 days, those completions are lost forever even if they actually did the habits. This punishes users for forgetting the app, not forgetting the habit — a critical distinction. But naive backfill enables self-deception ("I totally did it last Tuesday"). Confidence tagging resolves the tension: users can reconstruct honest history without gaming their own streaks. The dotted visual keeps the raw data honest while still giving credit where due.

**Scope:** Extend log entry schema from `string` to `{ date, backfilledAt?, confidence? }`. New "Add past entry" UI on day cells. Streak calc gains a `strict: boolean` flag.
**Effort:** Medium · **Risk:** Low (additive schema change)

---

### I4. Public Webhooks / Integration API
**What:** Outbound webhooks fired on habit events (created, completed, streak milestone hit, habit archived). Users paste a URL (Zapier, IFTTT, Discord webhook, n8n) and receive JSON payloads.

**Why:** A habit tracker's value multiplies when it talks to the rest of the user's life. Examples: post to Discord when you hit a 30-day streak, log completions to a Notion database, trigger a smart bulb when you check in, update a spreadsheet. Building every integration natively is infeasible; a webhook system lets the community build them. This single feature unlocks dozens of use cases for near-zero per-integration cost. It also makes the app sticky — integrations create switching costs.

**Scope:** New `webhooks` collection: `{ id, url, events: string[] }`. Outbound HTTP POSTs with retry + backoff. Settings UI to add/test webhooks. Log recent deliveries for debugging.
**Effort:** Medium · **Risk:** Medium (outbound network calls need rate-limiting + auth on receiver side is user's responsibility)

---

## Tier B — Adaptive & Data-Driven

### I5. Adaptive Frequency Suggestions
**What:** After 4+ weeks of data, the app proactively suggests frequency adjustments: *"You've hit 'Read' 4/7 days for 8 weeks straight. Want to change the target from daily to 4x/week?"* User accepts, dismisses, or snoozes.

**Why:** Users set initial targets based on aspiration, not data. When the data reveals the sustainable target is lower (or higher!) than the set target, most trackers leave that realization to the user. An adaptive suggestion closes the loop: the app becomes an honest coach rather than a passive scoreboard. Crucially, this **lowers** targets more often than it raises them, which feels counterintuitive but aligns with habit science: a sustained 4x/week beats a broken 7x/week. Pairs naturally with **F5 Smart Rest Days** in `NEW_FEATURES.md`.

**Scope:** New `detectFrequencyMismatch(habit, logs)` util. Dashboard notification card when suggestions exist. One-click apply.
**Effort:** Medium · **Dependencies:** F5 Smart Rest Days · **Risk:** Low

---

### I6. Time-of-Day Completion Analytics
**What:** Track the *time* (not just date) each habit is checked off. Surface analytics: "You complete Meditation 87% of the time before 9 AM but only 12% after noon — consider locking it to your morning routine."

**Why:** When a habit gets done matters as much as whether it gets done. Early-day completion correlates strongly with long-term success (decision fatigue theory). Currently we only track dates, losing half the signal. This data also powers smarter reminders (send the reminder 1 hour before the user's historical completion time, not at a fixed time). Small schema change, large analytical upside.

**Scope:** Add `completedAt: ISO timestamp` to log entries (backward compatible — old entries get `null`). New "Time patterns" chart. Pairs with reminders (#7 in FEATURES.md).
**Effort:** Low-Medium · **Risk:** Low

---

### I7. Calendar-Native Context (Read-Side Integration)
**What:** Opposite of iCal *export* (F12): read the user's calendar (via ICS URL subscription) and show meetings alongside habit rows. On days with dense meetings, the app suggests lighter habits ("You have 6 meetings tomorrow — want to prioritize Micro Exercise instead of Full Workout?").

**Why:** Habits don't exist in a vacuum; they compete with the day's real obligations. A tracker that ignores the calendar is optimizing in isolation. By ingesting (not replacing) the calendar, we make habit planning context-aware. This is genuinely novel — most trackers only push *out* to calendars, never pull *in*. Privacy-preserving (user-supplied ICS URL, read-only, cached client-side).

**Scope:** User supplies ICS subscription URL. Frontend fetches + parses (library: `ical.js`). Match meetings to date rows. Rule engine: "if meeting count > N, suggest micro-habit variant."
**Effort:** Medium-High · **Dependencies:** F9 Micro-Habits (for "lighter variant" concept) · **Risk:** Medium (CORS on arbitrary ICS URLs may require a backend proxy)

---

### I8. Habit DNA / Personal Pattern Profile
**What:** After 60+ days, generate a one-page "profile": *morning person vs. evening person, weekday-consistent vs. weekend-consistent, sprinter vs. marathoner (bursts vs. even pacing), single-focus vs. multi-focus*. The profile evolves over time.

**Why:** Self-knowledge is the deepest form of motivation. Personality-style framings ("You're a Morning Sprinter") are memorable, shareable, and give users a narrative about themselves. Unlike **F8 Insights Engine** in `NEW_FEATURES.md` (which surfaces discrete insights like "you miss Fridays"), this synthesizes *across* habits into an identity summary. It answers "what kind of habit-builder am I?" rather than "what did I do?". Highly shareable, which drives organic growth.

**Scope:** New `generateProfile(habits, logs)` — 4–6 axis scores computed from existing data. `<ProfileCard />` component with labels and a short narrative. Deterministic, no LLM.
**Effort:** Medium · **Dependencies:** Benefits from 60+ days of data · **Risk:** Low

---

## Tier C — Delight, Polish & Power Features

### I9. Photo & Voice Evidence Attachments
**What:** Optional photo or 10-second voice memo attached to a check-in. Photo for visual proof (a finished page of a book, gym selfie, completed meal prep). Voice memo for reflection without typing.

**Why:** Photos and voice lower the friction of capturing *context* compared to typed notes (**#6 Notes** in FEATURES.md). On mobile, voice is 5× faster than typing. Over months, a photo stream becomes a powerful highlight reel — scrolling back through 90 days of gym photos is more motivating than any streak number. This also unlocks a "year in review" feature for almost free.

**Scope:** File upload endpoint. Local storage in `server/uploads/` keyed by `{habitId}/{date}`. Image thumbnails + audio `<audio>` element in UI. Size limits. Graceful degradation on offline.
**Effort:** Medium-High · **Risk:** Medium (storage growth — add a cleanup policy or per-user quota)

---

### I10. Habit Budget (Cognitive Load Cap)
**What:** A soft limit on the number of active habits (default: 7). When the user tries to add an 8th, the app warns: *"You already have 7 active habits. Research suggests people successfully maintain 3–5. Want to experiment with this one (F7) or archive another first?"*

**Why:** Habit list bloat is the silent killer of trackers. Users accumulate 15+ habits, silently ignore 10, feel guilty, abandon the app. A budget creates a forcing function for conscious curation. This is a *feature that prevents a feature* — it adds friction at exactly the moment friction is helpful. Pairs elegantly with **F7 Experiments** (overflow habits become experiments) and **F14 Habit Sunset** (graceful removal of abandoned ones).

**Scope:** Add `settings.habitBudget: number` (user-configurable, default 7). Warning modal in HabitForm when over budget. Never a hard block — always allow override.
**Effort:** Very low · **Dependencies:** Best with F7 and F14 · **Risk:** None

---

## Consolidated Roadmap (Across All Three Documents)

Merging **FEATURES.md** (numeric), **NEW_FEATURES.md** (F-series), and **FUTURE_IDEAS.md** (I-series):

```
Sprint 1 — Foundation & Quick Wins
  #1 Dashboard Stats            I1  Identity Statements
  #3 Undo Toast                 I10 Habit Budget
  #14 Theme Toggle              F2  Health Score
  #4 Data Export                F4  Failure Recovery
  F13 Best/Worst Day            F14 Habit Sunset

Sprint 2 — Core Model Fixes
  #2 Categories/Tags            F5  Smart Rest Days
  #12 Templates                 F1  Streak Shields
  I2  Habit Graveyard           I6  Time-of-Day Analytics
  F11 Keyboard Shortcuts

Sprint 3 — Engagement & Structure
  #5 Heatmap                    F3  Habit Stacking
  #6 Notes                      F7  Experiments
  #8 Drag & Drop                F10 Weekly Review
  I3  Retrospective Backfill

Sprint 4 — Insights & Adaptation
  #7 Reminders                  F6  Mood Correlation
  #9 Reports Page               F8  Insights Engine
  #13 Goals/Milestones          I5  Adaptive Frequency
                                I8  Habit DNA Profile

Sprint 5 — Scale & Integration
  #10 Authentication            F9  Micro-Habits
  #11 Database Migration        F12 iCal Export
  #15 PWA                       F15 Import
  I4  Webhooks                  I9  Photo/Voice Attachments
  I7  Calendar Context Read
```

---

## Priority Matrix (I-Series Only)

| ID  | Feature                       | Impact | Effort    | Risk   | Recommended Sprint |
|-----|-------------------------------|--------|-----------|--------|--------------------|
| I1  | Identity Statements           | ★★★★☆  | Very Low  | None   | **Sprint 1**       |
| I10 | Habit Budget                  | ★★★★☆  | Very Low  | None   | **Sprint 1**       |
| I2  | Habit Graveyard               | ★★★☆☆  | Low       | None   | Sprint 2           |
| I6  | Time-of-Day Analytics         | ★★★★☆  | Low-Med   | Low    | Sprint 2           |
| I3  | Retrospective Backfill        | ★★★★☆  | Medium    | Low    | Sprint 3           |
| I5  | Adaptive Frequency Suggestions| ★★★★★  | Medium    | Low    | Sprint 4           |
| I8  | Habit DNA Profile             | ★★★★☆  | Medium    | Low    | Sprint 4           |
| I4  | Webhooks                      | ★★★★☆  | Medium    | Medium | Sprint 5           |
| I9  | Photo/Voice Attachments       | ★★★★☆  | Med-High  | Medium | Sprint 5           |
| I7  | Calendar Context Read         | ★★★★☆  | Med-High  | Medium | Sprint 5           |

---

## Design Principles (Shared Across All Three Docs)

1. **Additive, never punitive.** New features must not make existing users feel worse about their data. Health scores supplement streaks; backfill is visually distinct; archive prompts are gentle.
2. **Deterministic over magical.** No LLM/AI features in the core path. Insights should be explainable statistics users can audit. (Leaves LLMs for optional, clearly-labeled experimental features.)
3. **Data portability first.** Every feature that stores new data must round-trip through Export (#4) and Import (F15). No lock-in.
4. **Client-side by default.** Push computation to the browser whenever possible — keeps the backend simple and aligns with future PWA/offline goals.
5. **Small surface, deep value.** Prefer one well-designed feature (e.g., I1 Identity Statements is a single text field) over five shallow ones.

---

## Decision Log (I-Series)

| Decision | Rationale |
|----------|-----------|
| Identity Statements before gamification | Identity-based motivation is deeper and more durable than points/levels. |
| Habit Graveyard with mandatory reasons | Passive archive loses the highest-value data (failure modes). Brief friction pays off across a user's lifetime of habit attempts. |
| Backfill with confidence tags | Honesty-preserving mechanism — users can reconstruct history without compromising streak integrity. |
| Webhooks over native integrations | Unbounded integration surface for bounded engineering cost. Each native integration is a maintenance burden. |
| Read-side calendar before write-side coaching | Context must flow *in* before the app can coach effectively. Calendar context is the cheapest rich-context source. |
| Habit DNA as narrative, not dashboard | Numbers fatigue; stories stick. Profile labels are shareable; dashboards aren't. |
| Habit Budget as warning, never a block | Hard limits feel paternalistic. Soft warnings nudge reflection without removing agency. |
| Photo/voice in Tier C, not Tier A | Real value but storage costs + privacy surface. Defer until auth + DB are in place. |
| I5 depends on F5 Smart Rest Days | Adaptive suggestions only make sense once the frequency model is flexible enough to accept them. |
