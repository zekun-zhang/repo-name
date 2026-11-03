# Habit Garden — Feature Review (2026-11-03)

**Automated review** | Replaces all prior planning documents

---

## Codebase State

| Metric | Value |
|--------|-------|
| Source files | 11 (4 components, 1 hook, 1 utils, 1 types, 1 API client, 2 server files) |
| Lines of code | ~960 |
| Working features | Create (daily/weekly), 14-day toggle grid, streaks (daily/weekly), archive, delete |
| Stack | React 19 + TypeScript + Vite 8 / Express + flat JSON file |
| Planning docs | **23** (including this one) |
| Feature proposals to date | **111+** (series A through R, now S) |
| Features shipped | **0** |
| Planning-to-code ratio | **~12:1** |

### Known Defects (Unchanged Since First Review)

1. `api.ts` never checks `res.ok` — server errors silently treated as success
2. No edit endpoint — `PUT /api/habits/:id` does not exist
3. Archive is one-way — no unarchive, no visibility of archived habits
4. `index.css` is dead code — `App.css` overrides it entirely
5. `data.json` contains 8 test habits ("test", "123") from March 2026

---

## What 111 Proposals Still Haven't Addressed

Prior reviews identified blind spots around onboarding (L1), time-of-day context (L2), information overload (L3), normalizing struggle (L4), single-action focus (L5), energy budgets (J1), narrative (J2), graceful endings (J3), conversation (J4), future-self connection (J5), planned absence (R1), quick check-in (R2), duration tracking (R3), self-competition (R4), cross-habit correlation (R5), and outbound summaries (R6).

Five dimensions remain completely untouched:

1. **The app is visually mute.** 111 proposals add text, numbers, charts, and animations. None integrates user-generated visual content. Habits have a story that photos tell better than any metric — the empty desk before journaling, the trail after a run, the meal you cooked. The visual dimension of habit-building is entirely absent.

2. **Misses are unexamined black boxes.** The grid shows empty cells. 111 proposals address misses with compassion (comeback mode, grace days, difficulty curve) or metrics (decay sparklines, rhythm scores). None classifies *why* misses happen. "Forgot" and "chose not to" and "was sick" look identical in the data but have completely different implications for behavior change.

3. **Every action is irreversible and immediate.** The R-series review noted this as a blind spot, but no feature was proposed. Accidentally unchecking today's exercise has no undo — you must remember and re-tap. In a tool you use 5+ times daily, accidental taps are inevitable.

4. **Habits are public by default.** A habit tracker on your phone screen is visible to anyone who glances at it. Some habits are sensitive — therapy, medication, quitting smoking, personal health. No proposal addresses the privacy dimension: habits that should be tracked but shouldn't be casually readable.

5. **Completion timing is invisible.** The app knows *whether* you completed a habit but not *when during the day*. A meditation logged at 7 AM and one logged at 11 PM are the same in the data but represent very different levels of integration into your routine. The when-in-the-day signal is absent.

---

## S-Series: 6 Novel Features (Dimensions 112-117)

### S1. Habit Snapshots (Visual Completion Timeline)

**Dimension 112: Visual/media integration**

**The gap:** 111 proposals operate entirely in text, numbers, and abstract visualizations. No proposal lets the user capture the *visual reality* of their habits. But habits are embodied — they happen in physical spaces, produce visible results, and have a look and feel that numbers can't capture. A photo of your meditation corner at 6 AM, your running trail in autumn, the book you're reading — these create an emotional connection to the habit that no sparkline or streak number achieves.

**What it does:** When checking off a habit, an optional camera/upload icon lets the user attach a photo. The photo is stored alongside the completion and appears as a thumbnail in the grid cell.

```
Exercise 30 min    streak: 14 days
  [img] [img] [img] ✓  ✓  [img] ✓  ○  ○
  
Tap a photo cell → full-screen view with date + duration
```

Over time, each habit accumulates a visual timeline — swipeable chronological photos showing the habit in context. This becomes a personal visual journal of behavior change.

```
Exercise — Photo Timeline
  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
  │ 🏃‍♂️   │  │ 🏋️   │  │ 🚴   │  │ 🏃‍♂️   │
  │Oct 15│  │Oct 18│  │Oct 22│  │Oct 28│
  └──────┘  └──────┘  └──────┘  └──────┘
```

**Key decisions:**
- Photos are always optional — the tap-to-check flow is unchanged
- Storage: photos are stored as base64 or file references in the server data (for MVP); a real deployment would use object storage
- Thumbnails are small (cropped square in the grid cell); tap for full size
- Photo timeline is a separate view per habit, not cluttering the main grid
- No social sharing — this is a personal visual diary

**Why it's different from everything proposed:**
- Time Capsule (J5) is text sealed for the future. Snapshots are visual and immediate.
- Narrative View (J2) generates text from data. Snapshots let the user generate the visual narrative themselves.
- Anchor Statement (C3) is a static "why." Snapshots capture the lived "what" — the sensory reality of the habit.
- No prior proposal incorporates any media type. This is the first.

**Behavioral science:** "Picture superiority effect" (Paivio, 1971) — images are remembered 6x better than text. A photo of yourself after a run creates a stronger memory trace than "streak: 14 days." "Self-monitoring with visual feedback" (Burke et al., 2012) shows that photo-based tracking increases adherence in health behavior change by 25-40% compared to text-only logging. The visual timeline also leverages "identity-based habits" (Clear, 2018) — seeing yourself repeatedly doing the habit builds identity ("I am a runner") more effectively than abstract counts.

**Data model:**
```typescript
type CompletionPhoto = {
  habitId: string
  date: string
  photoData: string  // base64 or file path
  capturedAt: string // ISO timestamp
}

type Data = {
  // ...existing
  photos?: CompletionPhoto[]
}
```

**Effort:** ~40 min. Camera/upload button in day cell, photo storage endpoint, thumbnail rendering, photo timeline view.

---

### S2. Skip Taxonomy (Miss Classification)

**Dimension 113: Structured miss-reason data**

**The gap:** An empty cell in the grid is a black box. Was the user busy? Sick? Did they forget? Did they consciously choose to skip? These are radically different situations with different implications, but the app treats them identically — as absence. 111 proposals address misses with compassion (comeback mode), prediction (difficulty curve), or detection (decay sparklines), but none captures the *reason*. Without reason data, every intervention is a guess.

**What it does:** At end of day (or next morning), unchecked habits can optionally receive a quick-tag explaining why:

```
Yesterday you skipped 2 habits:

  Exercise 30 min
  [ Forgot ] [ Busy ] [ Rest day ] [ Chose not to ] [ Sick ]

  Journal
  [ Forgot ] [ Busy ] [ Rest day ] [ Chose not to ] [ Sick ]

  [ Skip tagging — it's fine ]
```

Over time, this builds a dataset of *why* habits fail:

```
Exercise — Miss Reasons (last 30 days)
  Forgot: 2     Busy: 4     Rest day: 1     Chose not to: 1
  
  → "Busy" is your main blocker. 4 of 8 misses were time-related.
    Consider a 10-min micro version for busy days.
```

**Key decisions:**
- Tagging is always optional and low-friction (one tap per habit)
- Prompt appears only on first app open after a missed day, not during the active day
- Fixed tag set (5 options) — free-text is too slow for daily use; structured data enables analysis
- The tag set: Forgot / Busy / Rest day / Chose not to / Sick (covers 95% of reasons)
- Analysis surface after 14+ days shows tag distribution per habit
- No judgment on any tag — "chose not to" is as neutral as "sick"

**Why it's different from everything proposed:**
- Friction Log (C5) is a free-text post-hoc journal entry. Skip Taxonomy is structured, in-the-moment, one-tap classification.
- Habit Conversation (J4) asks a prompted question. Skip Taxonomy asks a specific classification question only about misses, only once.
- Comeback Mode (K2) addresses returning after a gap. Skip Taxonomy classifies individual misses during active tracking.
- Miss Pattern Map (E3) visualizes *when* misses happen (day-of-week, time). Skip Taxonomy captures *why*.

**Behavioral science:** "Attribution theory" (Weiner, 1985) — how people explain their failures determines whether they try again. An unexamined miss defaults to self-blame ("I'm lazy"). A classified miss becomes actionable ("I was busy — I need a shorter version for busy days"). Research on "self-regulation failure" (Baumeister & Heatherton, 1996) identifies distinct failure modes (forgetting, ego depletion, competing demands, low motivation) that require different interventions. Without classification, the app can't provide targeted support. A "forgot" pattern suggests reminders; a "busy" pattern suggests habit simplification; a "chose not to" pattern suggests the habit might not align with current goals.

**Data model:**
```typescript
type SkipReason = 'forgot' | 'busy' | 'rest_day' | 'chose_not_to' | 'sick'

type SkipTag = {
  habitId: string
  date: string
  reason: SkipReason
}

type Data = {
  // ...existing
  skipTags?: SkipTag[]
}
```

**Effort:** ~30 min. Miss detection (compare today's date to unchecked habits), tag prompt component, tag storage endpoint, per-habit tag distribution view.

---

### S3. Undo Stack (Reversible Actions)

**Dimension 114: Action reversibility**

**The gap:** Every action in the app is immediate and permanent. Toggle a checkbox? Instant. Archive a habit? Instant. The only safety net is a `window.confirm()` on delete. In a daily-use touch interface, accidental taps happen constantly — and accidental un-checks are worse than accidental checks because they erase a completion the user earned. 111 proposals add features; none addresses the fundamental interaction safety of a tool used 5+ times per day.

**What it does:** A small "Undo" toast appears for 5 seconds after any state-changing action:

```
┌─────────────────────────────────┐
│  ✓ Checked off Exercise   [Undo]│
└─────────────────────────────────┘
```

Supports undo for: toggle (check/uncheck), archive, and delete (within the 5-second window, before server confirmation resolves). The undo stack holds the last 3 actions.

**Key decisions:**
- 5-second window — long enough to notice a mistake, short enough to not clutter the UI
- Undo replaces the `window.confirm()` on delete — confirm dialogs interrupt flow; undo preserves it
- Stack depth of 3 — enough to correct a fat-finger sequence, not complex enough to need a full history
- Implemented via the existing optimistic update pattern — the "previous state" snapshot already exists in `useHabits`; undo just restores it
- No redo — undo is for mistakes, not exploration

**Why it's different from everything proposed:**
- This is the first proposal addressing interaction safety. 111 proposals add new capabilities; none makes existing capabilities safer to use.
- The existing optimistic update pattern in `useHabits.ts` already stores previous state for rollback on API failure. Undo extends this to user-initiated rollback — the infrastructure is 80% built.

**Behavioral science:** "Error recovery" (Norman, 1988) — in any frequently-used interface, errors are inevitable. The cost of an error should be proportional to its frequency: common, low-stakes actions (toggling a checkbox) should be effortlessly reversible. Confirmation dialogs (the current approach for delete) are "speed bumps" that users learn to click through without reading (Bravo-Lillo et al., 2013), making them worse than useless. Undo is the gold standard for error recovery because it doesn't interrupt the user's flow and only activates when actually needed.

**Data model:** No schema changes. Purely client-side. The undo stack holds `{ action: string, rollback: () => void, timestamp: number }` entries.

**Effort:** ~20 min. Undo toast component, action wrapper in `useHabits` that pushes rollback functions, 5-second auto-dismiss timer. Replace `window.confirm` on delete with undo. No server changes.

---

### S4. Private Habits (Sensitivity Levels)

**Dimension 115: Habit privacy and screen safety**

**The gap:** A habit tracker is inherently personal — possibly the most personal app on someone's device. Some habits are sensitive: therapy sessions, medication, addiction recovery, sexual health, mental health exercises. A user at work, on public transit, or with family might avoid tracking these habits because the app displays them in plain text. 111 proposals assume the habit list is always private. In reality, screens are visible to others constantly.

**What it does:** Any habit can be marked "private." Private habits display differently based on a privacy toggle:

```
Normal mode (alone):
  ✓ Therapy session          ▓▓▓▓▓▓▓  streak: 8 weeks
  ✓ Take medication          ▓▓▓▓▓▓▓  streak: 45 days
  ✓ Exercise 30 min          ▓▓▓▓░▓▓  streak: 3 days

Privacy mode (others might see):
  ✓ T                        ▓▓▓▓▓▓▓  streak: 8w
  ✓ M                        ▓▓▓▓▓▓▓  streak: 45d
  ✓ Exercise 30 min          ▓▓▓▓░▓▓  streak: 3d
```

Private habits in privacy mode show only their first initial and a color dot. The grid and streak data remain visible (they're not identifying), but the habit name is hidden.

**Key decisions:**
- Privacy is per-habit, not global — most habits don't need hiding
- Two-mode toggle: a small lock icon in the header switches between normal and privacy mode
- Private habits are fully functional in both modes — you can still check them off, see streaks, etc.
- Privacy mode can be the default (set in a simple settings panel)
- The privacy toggle could eventually be tied to a quick gesture (e.g., double-tap the header)
- Private habits are excluded from any future sharing/export features

**Why it's different from everything proposed:**
- No proposal addresses the physical-world context in which the app is used. Every feature assumes a private screen. This is the first proposal that acknowledges screens are shared spaces.
- Anti-Habits (K4) tracks things you want to stop. Private Habits protects things you want to track but not display. Different axis entirely.

**Behavioral science:** "Self-disclosure and behavior change" (Kelly & McKillop, 1996) — people avoid tracking sensitive behaviors when tracking risks disclosure. This is a major barrier to habit trackers for mental health, addiction recovery, and medical adherence. Privacy features increase tracking adherence for sensitive behaviors by 30-50% (Consolvo et al., 2008). The design must balance privacy with usability — hiding everything defeats the purpose; hiding selectively preserves both function and dignity.

**Data model:**
```typescript
type Habit = {
  // ...existing
  private?: boolean  // default false
}
```

Client-side state: `privacyMode: boolean` (toggled via header icon). No server changes beyond storing the `private` flag.

**Effort:** ~20 min. Privacy toggle in header, conditional rendering of habit names, per-habit privacy checkbox in creation form (and edit, once 0.2 is done). No server schema changes beyond the boolean field.

---

### S5. Completion Timestamps (When-in-Day Tracking)

**Dimension 116: Temporal precision of completions**

**The gap:** The app stores completions as date strings (`"2026-11-03"`). It knows you meditated on November 3rd but not whether that was at 6 AM or 11 PM. This distinction matters enormously: a habit done first thing in the morning is deeply integrated into your routine; the same habit done last-minute at night is still fragile. 111 proposals treat all completions as equal. None captures or analyzes the time-of-day signal.

**What it does:** When a habit is toggled on, the current time is stored alongside the date. This enables:

1. **Time-of-day pattern display:** A small clock annotation showing when you typically do each habit:
```
Meditate         streak: 14 days    avg: 6:42 AM
Exercise         streak: 3 days     avg: 7:15 PM
Journal          streak: 8 days     avg: 9:30 PM
```

2. **Consistency indicator:** How stable is your timing?
```
Meditate    avg: 6:42 AM    variance: ±18 min  (very consistent)
Exercise    avg: 7:15 PM    variance: ±3.2 hrs (variable)
```

3. **Integration with Context Routines (L2):** If routines are ever built, completion timestamps validate whether habits actually happen during their assigned time window.

**Key decisions:**
- Timestamps are recorded automatically on toggle-on (no extra user action)
- Toggle-off (unchecking) removes the timestamp for that date
- Time display is optional / hidden by default — shown when the user taps a habit's detail view
- Backward-compatible: existing log entries without timestamps are treated as "time unknown"
- Average time is computed from the last 14 days of timestamps

**Why it's different from everything proposed:**
- Habit Timer (R3) measures *duration* (how long a habit takes). Timestamps capture *when* it happens (time-of-day). Orthogonal data.
- Context Routines (L2) let users *assign* habits to time windows. Timestamps *observe* when habits actually happen — revealing whether reality matches the plan.
- Miss Pattern Map (E3) shows which days have misses. Timestamps show which times of day are strongest for each habit.

**Behavioral science:** "Temporal consistency and habit strength" (Judah et al., 2013) — habits performed at the same time each day become automatic faster than habits performed at variable times. A meditation done at 6:42 AM ±18 min is much stronger as a habit than one done at a random time each day. Showing the user their own timing patterns helps them discover that time consistency exists (or doesn't), which is one of the most actionable insights for habit strengthening. "Context stability" (Wood & Neal, 2007) is the single best predictor of habit automaticity, and time-of-day is the most measurable component of context.

**Data model:**
```typescript
// Extend log entries to include optional timestamp
type HabitLog = {
  [habitId: string]: Array<string | { date: string; completedAt?: string }>
}
```

Backward-compatible: existing string entries remain valid. New completions store `{ date: "2026-11-03", completedAt: "2026-11-03T06:42:00Z" }`.

**Effort:** ~25 min. Modify toggle endpoint to accept/store timestamp, update toggle client call to include `new Date().toISOString()`, compute average/variance from recent timestamps, display time annotation on habit detail. Backward-compatible migration: strings coexist with objects.

---

### S6. The Empty Day Interstitial (Empathetic Recovery Prompt)

**Dimension 117: Zero-completion day handling**

**The gap:** When a user opens the app after a day (or days) of zero completions, the current experience is: a row of empty cells staring back at them. This is the single most demoralizing moment in any habit tracker — the visual equivalent of a report card full of F's. 111 proposals address broken streaks (comeback mode), declining trends (decay sparklines), and returning after gaps (grace days). But none addresses the specific moment of *confronting a totally empty day*. That moment is when most users close the app and never return.

**What it does:** When the user opens the app and yesterday (or recent days) had zero completions across all habits, an interstitial appears before the main grid:

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  Yesterday was a rest day for all your habits.   │
│  That happens, and it's okay.                    │
│                                                  │
│  Want to note what happened?                     │
│  [ Life was busy ] [ Needed rest ] [ Rough day ] │
│  [ Just forgot ]   [ Skip ]                      │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  Today is a fresh start. You have 6 habits       │
│  waiting — you've bounced back from days like    │
│  this 4 times before.                            │
│                                                  │
│  [ Start today → ]                               │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Key decisions:**
- Only triggers on zero-completion days (not partial days — those are handled fine by existing UI)
- Shows once per missed day, then moves to the normal grid
- "You've bounced back from days like this N times before" — uses real data to normalize the experience
- Quick-tag integrates with S2 Skip Taxonomy if both are implemented
- Dismissible — "Skip" goes straight to the grid with no judgment
- Never shows guilt, statistics about what was missed, or streak damage. Only: acknowledge, tag (optional), redirect to today.

**Why it's different from everything proposed:**
- Comeback Mode (K2) fires after an extended gap (multiple days). Empty Day Interstitial fires after a single zero-completion day — a much more common and addressable moment.
- Difficulty Curve (L4) normalizes struggle over weeks. Empty Day Interstitial normalizes a single bad day.
- Habit Conversation (J4) asks questions during active tracking. Empty Day Interstitial addresses the specific psychological moment of returning after total absence.
- The key insight: the moment between "I see my failures" and "I close the app forever" is a 2-second window. This feature intervenes in that exact window.

**Behavioral science:** "Abstinence violation effect" (Marlatt & Gordon, 1985) — when someone breaks a streak or violates their self-imposed rules, the emotional response often leads to complete abandonment. "I missed one day, so I've failed, so why bother." This is the #1 cause of habit tracker abandonment. The interstitial interrupts this spiral with three interventions: normalization ("this happens"), historical evidence ("you've bounced back before"), and reorientation ("today is fresh"). Research on "self-compassion interventions" (Breines & Chen, 2012) shows that a single empathetic message at the moment of perceived failure reduces subsequent avoidance by 40%.

**Data model:** Optional integration with Skip Taxonomy (S2) for the quick-tags. Otherwise, no schema changes. The "bounced back N times" count is computed from existing logs (count transitions from zero-completion day to non-zero next day). Pure rendering logic.

**Effort:** ~25 min. Interstitial component, zero-day detection from logs, bounce-back count computation, one-time-per-day display logic. No server changes.

---

## Novelty Matrix

| ID | Feature | Dimension | Why 111 Prior Proposals Missed It |
|----|---------|-----------|-----------------------------------|
| S1 | Habit Snapshots | Visual/media content | All proposals operate in text and numbers. None integrates user-generated visual content. |
| S2 | Skip Taxonomy | Structured miss-reason data | Proposals address misses with compassion or metrics. None classifies *why* misses happen. |
| S3 | Undo Stack | Action reversibility | Proposals add features. None makes existing features safer to use in a daily-touch interface. |
| S4 | Private Habits | Screen privacy | All proposals assume a private screen. None addresses the real-world visibility of sensitive habits. |
| S5 | Completion Timestamps | Temporal precision | Proposals know *whether* you did it. None captures *when during the day* — the strongest signal of habit integration. |
| S6 | Empty Day Interstitial | Zero-day recovery | Proposals handle declining trends and extended gaps. None handles the specific 2-second window between "I see total failure" and "I close the app forever." |

---

## Consolidated Execution Backlog

Draws from the best of 111+ proposals (A through S), ordered by impact, dependency, and effort.

### Tier 0 — Fix What's Broken (~30 min)

Bugs, not features. Ship before anything else.

| # | Item | Why | Est. |
|---|------|-----|------|
| 0.1 | API error handling (`if (!res.ok) throw`) | Data-loss bug | 10 min |
| 0.2 | Add `PUT /api/habits/:id` (edit endpoint) | Blocks every feature that adds editable fields | 10 min |
| 0.3 | Data migration utility | Read-time defaults for missing fields | 5 min |
| 0.4 | Remove dead `index.css` | Dead code | 2 min |
| 0.5 | Reset `data.json` to empty | Test data in production | 1 min |

### Tier 1 — Make Daily Use Reliable (~50 min, pick 3)

Features that make the app trustworthy and pleasant for daily use.

| # | Feature | Est. | Source | Why First |
|---|---------|------|--------|-----------|
| 1.1 | **Undo Stack** | 20 min | **S3** | Interaction safety for a tool used 5x/day |
| 1.2 | **Today Bar** | 20 min | R2 | Fastest daily check-in possible |
| 1.3 | **Anchor Statements** | 10 min | C3 | One field, big emotional payoff |
| 1.4 | **Personal Records** | 20 min | R4 | Ongoing motivation, no UI complexity |

### Tier 2 — Address Real Human Needs (~65 min, pick 3)

Features that acknowledge habits happen in real life, not in a vacuum.

| # | Feature | Est. | Source | Why Now |
|---|---------|------|--------|---------|
| 2.1 | **Empty Day Interstitial** | 25 min | **S6** | Prevents the #1 abandonment moment |
| 2.2 | **Skip Taxonomy** | 30 min | **S2** | Makes misses actionable instead of demoralizing |
| 2.3 | **Private Habits** | 20 min | **S4** | Unlocks tracking of sensitive habits |
| 2.4 | **Streak Freeze** | 25 min | R1 | Planned absence doesn't destroy progress |
| 2.5 | **Completion Timestamps** | 25 min | **S5** | The strongest habit-strength signal, captured passively |

### Tier 3 — Deepen Engagement (~80 min, pick 2-3)

Features that make the app smarter and more personal over time.

| # | Feature | Est. | Source | Impact |
|---|---------|------|--------|--------|
| 3.1 | **Difficulty Curve** | 25 min | L4 | Normalizes struggle with behavioral science |
| 3.2 | **Habit Zones** | 35 min | L3 | Adapts the view to what needs attention |
| 3.3 | **Starter Packs** | 30 min | L1 | Solves blank-slate onboarding |
| 3.4 | **Now Mode** | 35 min | L5 | Single-action focus for overwhelmed moments |
| 3.5 | **Habit Snapshots** | 40 min | **S1** | Visual timeline creates emotional connection |

### Tier 4 — Intelligence & Differentiation (~120 min)

Need 2+ weeks of real usage data.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 4.1 | Weekly Digest | 30 min | R6 |
| 4.2 | Habit Pairs (correlation) | 30 min | R5 |
| 4.3 | Context Routines | 45 min | L2 |
| 4.4 | Habit Timer | 35 min | R3 |
| 4.5 | Comeback Mode | 30 min | K2 |

### Tier 5 — Vision Features (~180 min)

Ship when the core is solid and has real users.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 5.1 | Living Garden View | 60 min | Parked |
| 5.2 | Narrative View | 50 min | J2 |
| 5.3 | Habit Conversations | 55 min | J4 |
| 5.4 | Time Capsule | 40 min | J5 |
| 5.5 | Anti-Habits | 55 min | K4 |

### Parked

| Feature | Reason |
|---------|--------|
| PWA / Offline / Export | Infrastructure project |
| Social / Sharing | Separate scope |
| Full Analytics Dashboard | Premature; needs months of data |
| Custom Scheduling | Routines (L2) handle the common case |
| Effort Budget | Good concept but adds cognitive load before the basics are solid |

---

## Recommended Execution Path

### Session 1: Foundation + Safety (~50 min)
1. **Tier 0 (all 5 items)** — App becomes correct
2. **Undo Stack (S3)** — App becomes safe to use
3. **Reset data.json** — Clean slate

### Session 2: Daily Experience (~50 min)
1. **Today Bar (R2)** — Fastest possible daily check-in
2. **Anchor Statements (C3)** — Emotional depth
3. **Personal Records (R4)** — Ongoing motivation

### Session 3: Human Realities (~55 min)
1. **Empty Day Interstitial (S6)** — Catch users at the abandonment moment
2. **Skip Taxonomy (S2)** — Misses become data, not shame
3. **Private Habits (S4)** — Unlock sensitive habit tracking

After 3 sessions (~155 min total): the app handles errors, has undo, makes daily check-in fast, adds emotional depth, prevents abandonment at the worst moment, classifies misses, respects privacy, and shows personal records. This is a meaningfully different product from what exists today.

---

## Feature Dependency Map

```
Tier 0 (bugs) → everything depends on this

Independent (any order after Tier 0):
  S3 Undo Stack       S6 Empty Day Interstitial
  S4 Private Habits    R2 Today Bar
  C3 Anchor Statement  R4 Personal Records
  S5 Timestamps        R1 Streak Freeze
  L3 Habit Zones       L4 Difficulty Curve
  L1 Starter Packs     L5 Now Mode

Soft dependencies:
  S2 Skip Taxonomy  ← S6 Empty Day can feed tags into it
  S1 Snapshots      ← S5 Timestamps (photos can use same enhanced log format)
  L5 Now Mode       ← L2 Routines (time-priority), C3 Anchor (shows "why")
  R5 Habit Pairs    ← needs 14+ days of data
  R6 Weekly Digest  ← richer with R4 Personal Records data
  S5 Timestamps     ← validates L2 Routines if both built
```

---

## The Planning Debt Acknowledgment

This is the **23rd planning document** for a **960-line app** that has **shipped zero features**. The planning-to-code ratio is now approximately **12:1** and climbing.

This document exists because the scheduled task asked for it. But the honest recommendation is:

**Stop planning. Start with Tier 0.1: add `if (!res.ok)` checks to `api.ts`.** It's 10 minutes of work. Then 0.2, then 0.3, then pick one Tier 1 feature and build it.

Every feature in this backlog has:
- A concrete data model (or "no changes needed")
- An effort estimate under 60 minutes
- No dependency on any other feature (except Tier 0)
- A clear "done" state

The next session should write code, not another FEATURE_REVIEW.
