# Habit Garden — Creative Feature Proposals (v3)

> A third wave of ideas, designed to be **non-overlapping** with the 16 features
> in [`FEATURES.md`](./FEATURES.md) and the 15 features in [`NEW_FEATURES.md`](./NEW_FEATURES.md).
>
> This document leads with **reasoning first, mechanics second**: every proposal
> starts with a "Why" paragraph so the problem is understood before any schema
> or UI is committed to.

---

## 1. What's Already Covered

To avoid re-proposing existing ideas, the following concept areas are already
on the roadmap and are **intentionally not revisited here**:

- Dashboards, stats, heatmaps, reports, insights engine
- Streak shields / vacation mode / health score / failure recovery
- Categories / tags / habit stacking / smart rest days
- Notes, reminders, templates, goals, experiments, weekly review
- Export, import, iCal, auth, database migration, PWA
- Undo toast, drag-and-drop reorder, keyboard shortcuts, best/worst day markers
- Micro-habits, mood correlation, theme toggle, habit sunset

This document adds **10 new creative directions** that sit outside those areas.

---

## 2. Design Principles Driving This Wave

These three lenses decide whether an idea earns a spot:

1. **Model what users actually do, not what's easy to store.** The current
   schema treats every habit as "daily boolean." Real behavior includes quitting
   things, ramping up difficulty, auto-derivable signals (steps, minutes), and
   habits at different lifecycle stages. Our data model should stretch to meet
   reality rather than force reality to fit booleans.

2. **Use the past as a resource, not a graveyard.** Data older than 14 days is
   effectively invisible in the current UI. A tracker accumulates the user's
   most personal dataset — years of self-knowledge. Features that *replay,
   debrief, and learn from history* turn that data into compound interest.

3. **Integrity beats volume.** More habits ≠ more growth. Features that force
   honesty (random audits, evidence, caps, post-mortems) are more valuable
   than features that let users accumulate checkmarks without reflection.

Every feature below maps to at least one of these lenses; the mapping is noted
in each entry.

---

## 3. Tier 1 — Model Extensions (high impact, contained scope)

### C1. Quit Habits / Anti-Habits

**Why (principles 1, 3).** The entire app assumes habits you want to *do more
of*. But the research-heavy use case — smoking, doomscrolling, late-night
snacking, nail-biting — is about doing *less*. Forcing a "quit" goal into a
"do" schema is dishonest: users end up checking "didn't smoke today" which
feels absurd. Quit habits deserve an inverted model: success is measured by
**days since last occurrence**, and the user logs *slip-ups*, not completions.
This is a fundamentally different psychology and unlocks a major user segment.

**What.**
- New habit kind: `kind: 'build' | 'quit'` (default `'build'` for back-compat).
- For quit habits, the UI shows a prominent "Days clean" counter instead of a
  streak grid, plus a red "I slipped" button (instead of the green check).
- Slips are logged as dated entries; the counter resets but history is kept
  and a "previous best" marker appears, borrowing from Failure Recovery (F4).

**Scope.** Schema addition + a variant row component. No new endpoints — the
existing toggle endpoint reinterprets the date as a slip for quit habits.

**Effort:** Medium | **Risk:** Low

---

### C2. Difficulty Progression / Auto-Ramp

**Why (principle 1).** Habits plateau. "5 pushups a day" is great at week 1
and meaningless at week 12. Static targets fail to model growth. Auto-ramp
treats a habit as a **curve**, not a line: after N consecutive successes at
the current level, the app proposes the next rung ("Ready to try 10?"). The
user can accept, defer, or lock the current level. This turns the tracker
into a gentle coach.

**What.**
- Optional `progression: { levels: string[], currentLevel: number, advanceAfter: number }`
  on a habit. Example: `levels: ["5 pushups", "10 pushups", "15 pushups"]`,
  `advanceAfter: 14`.
- After 14 consecutive completions at level 0, the next check-in triggers
  an "Advance to level 1?" prompt.
- Declining the prompt is fine — no penalty. It just asks again in 7 days.

**Scope.** Schema + a small modal + level display in `HabitRow`.

**Effort:** Medium | **Risk:** Low

---

### C3. Habit Lifecycle Phases

**Why (principles 1, 3).** A 3-day-old habit and a 3-year-old habit need
totally different treatment. New habits need daily visibility and celebration;
mastered habits need quiet background tracking so they don't crowd the UI.
Today, both appear identically in the table forever. Lifecycle phases let the
interface adapt: **Exploring → Building → Maintained → Mastered**, with
decreasing UI prominence at each stage. Mastered habits move to a collapsed
"background" section and only resurface if broken.

**What.**
- Computed (not stored) phase based on age + completion rate:
  - `< 14 days` → Exploring
  - `14–60 days, rate > 70%` → Building
  - `60–180 days, rate > 80%` → Maintained
  - `> 180 days, rate > 85%` → Mastered
- Each phase gets distinct row styling and a badge.
- Mastered habits collapse into a single-line summary by default.

**Scope.** Frontend-only. Pure derived state from existing logs.

**Effort:** Low | **Risk:** Low

---

## 4. Tier 2 — History & Reflection (leverage accumulated data)

### C4. "On This Day" Time Machine

**Why (principle 2).** Streaks only look forward. But long-term users have
the most motivating data hidden in their own past: "A year ago today you
couldn't do 3 pushups; today you did 30." The app never shows this. A simple
"On this day, 1 year / 6 months / 1 month ago" widget surfaces past check-ins
at the exact calendar moment users are most receptive — today.

**What.**
- Small dashboard card that scans logs for entries on the same month-day in
  prior years/months and renders them.
- Falls back gracefully for new users ("Come back in a month to see your
  first throwback!").

**Scope.** Frontend-only. ~80 lines.

**Effort:** Low | **Risk:** None

---

### C5. Archive Post-Mortems

**Why (principles 2, 3).** Archiving is currently a silent delete: the habit
disappears and its lessons go with it. But *why a habit failed* is some of
the most valuable self-knowledge the app could capture. A 3-question debrief
at archive time ("What worked? What didn't? Would you try again?") builds a
personal "habits graveyard" that informs future attempts — and makes users
think twice before archiving impulsively.

**What.**
- When the user archives a habit, prompt a short modal with three text fields.
- Store `archiveDebrief: { worked, didntWork, retry, archivedAt }` on the habit.
- New "Archived Habits" view shows debriefs as a scrollable journal — searchable,
  educational, cathartic.

**Scope.** Schema add + modal + read-only archived view.

**Effort:** Low-Medium | **Risk:** None

---

### C6. Time-of-Day Check-in Distribution

**Why (principle 2).** The `logs` currently store dates without timestamps, so
we're throwing away a valuable signal: *when during the day* each habit gets
done. Adding timestamps unlocks insights like "you complete morning habits at
11am on weekends — consider rescheduling them" and "your meditation consistency
is 90% before 9am but 30% after." This is behavioral data no other feature
can produce.

**What.**
- Change log entries from `string[]` (dates) to `{ date, completedAt }[]`.
  Backward-compatible: a missing `completedAt` is treated as unknown.
- New small chart: histogram of check-in hours per habit.
- Paired insight: flag habits whose ideal window the user keeps missing.

**Scope.** Schema migration (non-breaking), toggle endpoint adds current time,
new chart component. Pairs naturally with the Insights Engine (F8).

**Effort:** Medium | **Risk:** Low (additive schema)

---

## 5. Tier 3 — Integrity & Focus (keep the tracker honest)

### C7. Active Habit Cap ("Energy Budget")

**Why (principle 3).** The #1 silent failure mode of habit trackers is
accumulation: users add habits faster than they can maintain them, until the
whole board turns red and they quit. Research (BJ Fogg, James Clear) is
consistent: **fewer habits done well beats many habits done poorly**. A soft
cap (default 7) forces a conscious trade-off: adding habit #8 requires
archiving or pausing one of the existing seven. The cap can be raised in
settings, but the friction itself is the feature.

**What.**
- Setting: `activeHabitCap: number` (default 7, configurable, off with `0`).
- When adding a new habit at the cap, show a modal:
  "You're at your active limit. Pause or archive one to make room."
- Never enforced silently — user can raise the cap, but sees the number.

**Scope.** Settings schema + modal.

**Effort:** Low | **Risk:** Low (default of 7 may feel restrictive — make it
easy to adjust).

---

### C8. Random Spot-Check Prompts

**Why (principle 3).** Today's check-ins are trivially gameable: open the app
at 11pm, click everything green. Retroactive honesty decays quickly. A random
mid-day prompt ("It's 2pm — have you done your Water habit yet?") catches the
user *in the moment* rather than letting them reconstruct their day from
memory (or wishful thinking). This is not surveillance; it's a nudge that
defends the user against their own end-of-day bias.

**What.**
- Opt-in setting with N spot checks per day (default 1).
- Randomly picks one pending habit and shows a browser notification or
  in-app banner at a random time within the user's active hours.
- Completely client-side using the Notification API; no server scheduler.

**Scope.** Frontend-only. Complementary to the Reminders feature (FEATURES.md #7).

**Effort:** Low-Medium | **Risk:** Low (keep opt-in — it's mildly intrusive).

---

### C9. Evidence Attachments (Optional Photos / Links)

**Why (principles 1, 3).** A checkmark is cheap. A checkmark with a photo of
your meal, your run route, or the book page you read is **accountable to
yourself**. Evidence makes self-deception harder and also turns the tracker
into a personal scrapbook over time — which compounds retention value (see
C4). Important: evidence is **optional per check-in**, never required, to
avoid making the core flow heavier.

**What.**
- New `evidence: { habitId, date, type: 'image' | 'link' | 'text', value }[]`
  collection.
- Tap a checked day to attach evidence; tiny icon appears on annotated cells.
- Images stored as local files in `server/uploads/` (simple, matches the
  JSON-file aesthetic). Upgrade path to object storage later.

**Scope.** Schema + file upload endpoint + file-size/type validation
(security-sensitive — sanitize filenames, cap size, restrict mime types).

**Effort:** Medium-High | **Risk:** Medium (file handling = attack surface).

---

### C10. "Why Card" — Motivation on Demand

**Why (principle 2).** Every habit has a reason that's crystal clear on day 1
and fuzzy by day 60. Users forget *why they started*. A single short field
per habit ("Why I'm doing this") surfaced at exactly the right moments —
after a miss, on low-streak days, during the weekly review — rebuilds
intrinsic motivation. This is trivially cheap to build and disproportionately
impactful.

**What.**
- `motivation: string` field on Habit (max ~200 chars).
- Automatically displayed in:
  - The first row of a habit after a miss
  - The weekly review wizard (F10)
  - The failure recovery panel (F4)
- Hidden by default on the main table to avoid clutter.

**Scope.** Schema add + conditional display. Very small.

**Effort:** Low | **Risk:** None

---

## 6. Priority Matrix

| ID  | Feature                        | Impact | Effort      | Risk   | Recommended Slot |
|-----|--------------------------------|--------|-------------|--------|------------------|
| C10 | "Why Card"                     | ★★★★☆ | Low         | None   | **Sprint 1**     |
| C3  | Lifecycle Phases               | ★★★★☆ | Low         | Low    | **Sprint 1**     |
| C4  | On This Day                    | ★★★☆☆ | Low         | None   | **Sprint 1**     |
| C7  | Active Habit Cap               | ★★★★☆ | Low         | Low    | Sprint 2         |
| C5  | Archive Post-Mortems           | ★★★★☆ | Low-Medium  | None   | Sprint 2         |
| C1  | Quit Habits                    | ★★★★★ | Medium      | Low    | **Sprint 2**     |
| C2  | Difficulty Auto-Ramp           | ★★★★☆ | Medium      | Low    | Sprint 3         |
| C8  | Random Spot-Checks             | ★★★☆☆ | Low-Medium  | Low    | Sprint 3         |
| C6  | Time-of-Day Distribution       | ★★★★☆ | Medium      | Low    | Sprint 4         |
| C9  | Evidence Attachments           | ★★★★☆ | Medium-High | Medium | Sprint 5         |

---

## 7. Suggested Next-Sprint Backlog (opinionated)

If I could only ship **five** things from this document, in order:

1. **C10 Why Card** — Half a day of work, immediate emotional payoff. No risk.
2. **C3 Lifecycle Phases** — Fixes the "habit list bloat" problem without any
   schema change. Uses data we already have.
3. **C1 Quit Habits** — Unlocks a whole class of users the app currently can't
   serve. Biggest conceptual expansion for medium effort.
4. **C5 Archive Post-Mortems** — Converts silent deletion into learning.
   Pairs beautifully with C1 (quit habits fail often; debriefs become valuable).
5. **C4 On This Day** — Delightful, tiny, celebrates long-time users.

These five can be sequenced into two short sprints and only C1 requires a
schema change. Everything else is additive or frontend-only.

---

## 8. Decision Log

| Decision | Rationale |
|----------|-----------|
| Added "quit" as first-class habit kind instead of a workaround | Inverting the schema is cheaper than inverting users' mental models. Hacking quit habits into boolean do-habits is the kind of shortcut that calcifies bad data. |
| Lifecycle phases computed, not stored | Anything derivable from logs should stay derivable. Storing phase would create invalidation bugs on every toggle. |
| Timestamps are additive, not replacement | Existing date-only logs remain valid. `completedAt` is new data going forward only — no migration pain. |
| Evidence is opt-in per check-in | Required evidence would slow the core toggle flow (the app's hottest path) and punish honest users on busy days. |
| Habit cap default = 7 | Miller's law / working memory. Users pushing past 7 is a signal of overcommitment more often than genuine capacity. |
| No AI/LLM proposals | Consistent with existing NEW_FEATURES.md decision. Simple stats are explainable, deterministic, and private. |
| Spot-checks are opt-in | They're mildly adversarial to the user. Default-off respects autonomy; users who want them will seek them out. |

---

## 9. Cross-Reference

- For core roadmap features (dashboards, tags, heatmaps, auth, DB): see
  [`FEATURES.md`](./FEATURES.md).
- For model-fixing features (streak shields, health score, stacking, rest days,
  mood, insights, micro-habits): see [`NEW_FEATURES.md`](./NEW_FEATURES.md).
- This document covers the gaps neither of the above addresses: **quit habits,
  growth curves, lifecycle awareness, historical replay, integrity safeguards,
  and lightweight motivation surfaces.**
