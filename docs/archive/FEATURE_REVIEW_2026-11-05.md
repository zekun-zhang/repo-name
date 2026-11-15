# Habit Garden — Feature Review (2026-11-05)

**Automated review** | Scheduled codebase analysis

---

## Project State

| Metric | Value |
|--------|-------|
| Source files | 11 (4 components, 1 hook, 1 utils, 1 types, 1 API client, 2 server files) |
| Lines of code | ~960 |
| Working features | Create (daily/weekly), 14-day toggle grid, streaks (daily/weekly), archive, delete |
| Stack | React 19 + TypeScript + Vite 8 / Express + flat JSON file |
| Planning docs | **24** (including this one) |
| Feature proposals to date | **117+** (series C through S, now T) |
| Features shipped | **0** |
| Planning-to-code ratio | **~13:1** (and rising) |

### Known Defects (Unchanged Since First Review — 8+ Months Ago)

1. `api.ts` never checks `res.ok` — server errors silently treated as success
2. No edit endpoint — `PUT /api/habits/:id` does not exist
3. Archive is one-way — no unarchive, no visibility of archived habits
4. `index.css` is dead code — `App.css` overrides it entirely
5. `data.json` contains 8 test habits ("test", "123") from March 2026

These five bugs have been documented in every review since October 2026. They remain unfixed.

---

## What 117 Proposals All Take For Granted

Prior series have covered streaks (I1, R1, K2), analytics (C1-C4, E3, H3), metadata (I5, S2, S5), paradigm shifts (J1-J5), UX safety (S3-S4), information architecture (L3, L5), onboarding (L1), normalization (L4, S6), visual media (S1), temporal structure (L2), and cross-habit dynamics (I4, R5).

Five assumptions survive all 117 proposals untouched:

1. **Completion is binary.** Every proposal assumes "done" or "not done." No proposal questions whether a 5-minute meditation and a 30-minute meditation should register the same way, or whether a 1-mile walk and a 5-mile run are the same "Exercise."

2. **Habits exist in isolation from each other's history.** Per-habit metrics are everywhere: streaks, sparklines, completion rates, timestamps. But no proposal evaluates the habit *collection* as a system — whether the user's portfolio is balanced, overloaded, or dangerously narrow.

3. **The app only knows the present state.** The grid shows the last 14 days. Proposals add dashboards, narratives, and analytics — all snapshots of now. None uses the user's *personal peak performance* as a motivational reference. "You did it before" is the most powerful motivator, and the app never says it.

4. **Expectations are static.** Whether a habit is daily or weekly, the expectation doesn't change. If you exercise 5/7 days consistently, the app still shows 2 "misses" per week — even though 5/7 IS your rhythm. No proposal adapts expectations to what the user actually does.

5. **Habit maturity is invisible.** A 3-day-old habit and a 200-day-old habit look identical in the grid. The Difficulty Curve (L4) adds a text label ("Day 18 — The Dip"), but the visual design of the habit row itself never changes. The app's aesthetics don't reflect the journey.

---

## T-Series: 5 Novel Features (Dimensions 118-122)

### T1. Flexible Completions (Beyond the Binary Toggle)

**Dimension 118: Completion granularity**

**The gap:** The toggle is the most fundamental interaction in the app: tap to check, tap to uncheck. Done or not done. 1 or 0. Every one of the 117 prior proposals accepts this binary and builds on top of it — adding metadata (contexts, timestamps, friction), protection (grace days, shields, streaks), or analytics (sparklines, heatmaps, rhythms). None questions whether the binary itself is the right model.

But real habits aren't binary. "Exercise" on Monday might be a 60-minute gym session. On Wednesday, it's a 20-minute walk. On Friday, you did 10 pushups before bed. All three count as "Exercise," but they represent vastly different levels of engagement. The current app treats them identically — a green checkmark for each. This creates two problems:

1. **Discourages minimum-effort completions.** If a full workout and 10 pushups look the same, the user either does the full thing or skips entirely. The all-or-nothing framing is the top cause of habit abandonment.
2. **Hides the real picture.** A week of "all checkmarks" could mean 7 full workouts or 7 token efforts. The user can't tell the difference in hindsight, so they can't learn from their own data.

**What it does:**

Each habit can define 2-3 completion modes — named alternatives that all count as "done" but carry different visual weight:

```
Exercise 30 min
  Completion modes:
  ○ Full workout (gym/run)         ← primary
  ○ Quick session (home/walk)      ← lighter
  ○ Minimum (stretches/pushups)    ← bare minimum

When completing today:
  ┌─────────────────────────────────────────┐
  │  Exercise — How'd you do it today?      │
  │                                         │
  │  [Full]    [Quick]    [Min]    [Skip]   │
  └─────────────────────────────────────────┘
```

In the 14-day grid, completion modes show as different visual intensities:

```
Exercise    streak: 7 days
  [██] [██] [▓▓] [██] [░░] [▓▓] [██]  ← visual shows effort level
   ^         ^         ^
   full    quick     minimum
```

The streak counts ALL modes equally — even the "minimum" keeps the streak alive. But the visual history honestly shows the effort distribution.

**Key decisions:**
- **Modes are optional.** If a user doesn't define modes, the habit stays a simple toggle. Zero friction for users who don't want this.
- **2-3 modes maximum.** Not a 1-10 scale. Named, tappable options that take the same time as the current single-tap.
- **All modes maintain the streak.** The critical behavioral insight: a minimum-effort completion is infinitely better than a skip. The feature exists to make "doing something" easy.
- **The mode selector appears only for habits that have modes defined.** Single-mode habits retain the current one-tap flow.

**Why it's different from everything proposed:**
- "Habit Scaling" (K1) offers micro/standard/stretch tiers — fixed labels the user picks each day. Flexible Completions are custom-named, habit-specific modes that describe *how* the user completed it, not *how much* they committed to in advance. Scaling is a before-the-fact commitment; Completions are an after-the-fact record.
- "Quantitative Habits" (G2, 2.5) counts units (6/8 glasses). Flexible Completions are categorical (gym vs. walk vs. pushups), not numerical. Different data type entirely.
- "Friction Log" (C5) captures how *hard* it felt. Flexible Completions capture what *form* it took. Difficulty and modality are orthogonal dimensions.

**Behavioral science:** The "abstinence violation effect" (Marlatt & Gordon, 1985) is the #1 killer of habits: "I can't do the full thing, so I'll do nothing." Flexible Completions are a direct intervention. By naming the minimum version and making it visually legitimate (it keeps the streak, it shows as a filled cell), the feature dismantles all-or-nothing thinking at the interaction level. Research on "implementation intentions" (Gollwitzer, 1999) shows that pre-specifying what counts ("If I can't go to the gym, I'll do pushups at home") increases follow-through by 2-3x. The named modes ARE implementation intentions, embedded in the UI.

**Data model:**
```typescript
type CompletionMode = {
  id: string
  label: string      // "Full workout", "Quick session", etc.
  intensity: number  // 1 (minimum) to 3 (full) — used for visual weight
}

type Habit = {
  // ...existing
  completionModes?: CompletionMode[]  // undefined = simple binary toggle
}

type HabitLog = {
  [habitId: string]: Array<string | { date: string; mode?: string }>
  // Backward-compatible: string entries = simple completion
  // Object entries = completion with mode ID
}
```

**Effort:** ~40 min. Mode definition in habit creation/edit, mode selector on toggle, visual intensity in grid cells, backward-compatible log format. Small server schema addition.

---

### T2. Habit Ecosystem Weather (Holistic Portfolio Health)

**Dimension 119: System-level health indicator**

**The gap:** Every metric in the app — and every metric proposed across 117 features — is per-habit. Streaks are per-habit. Sparklines are per-habit. Completion rates, rhythm scores, difficulty phases, timestamps, contexts — all per-habit. The user can see how each individual habit is doing but has no single indicator for *"how am I doing overall?"*

This is like tracking each stock in your portfolio without ever looking at the portfolio's total value. The individual readings don't answer the holistic question.

**The problem it solves:** A user with 8 habits has 8 streaks, 8 sparklines, 8 completion rates to mentally synthesize. The cognitive load of this synthesis is why analytics dashboards get proposed (and never built). But the solution isn't more data — it's the right abstraction. One ambient indicator that answers: "Is my habit life healthy, struggling, or somewhere in between?"

**What it does:**

A single ambient "weather" indicator in the app header, computed from the entire habit ecosystem:

```
Header:
  Habit Garden                      ☀️ Clear skies
  Grow tiny daily habits            7-day health: strong
  into big changes.
```

Weather states (5 levels, with emoji and color):

```
☀️ Clear skies    — 85%+ overall completion, no habits declining
🌤️ Mostly sunny  — 70-85% overall, at most 1 habit declining
⛅ Partly cloudy  — 55-70% overall, or 2+ habits declining
🌧️ Rainy         — 40-55% overall, or majority of habits declining
🌩️ Stormy        — Under 40% overall, or major recent drop from personal baseline
```

The weather isn't just a number dressed up. It changes the app's *tone*:

- **Clear skies:** The header greeting is casual. "Everything's humming."
- **Partly cloudy:** The greeting is specific. "Exercise and Journal need some attention this week."
- **Stormy:** The greeting is compassionate. "Tough stretch. Focus on one habit today — the rest can wait."

The weather also drives a weekly trend indicator:

```
This week: ☀️ → ⛅  (trending down from last week)
Last 4 weeks: ⛅ ☀️ ☀️ 🌤️
```

**Key decisions:**
- **One indicator, always visible.** Not a dashboard, not a page — a single icon/label in the header that you glance at like checking the weather.
- **The algorithm weights recent data more heavily.** Today and yesterday matter more than 10 days ago.
- **New habits (< 14 days) are excluded from the weather calculation.** They're in the Growing zone (L3) and shouldn't penalize the overall score.
- **Weather is never alarming.** "Stormy" is not "you're failing." It's "tough stretch" — acknowledging difficulty without judgment. The weather metaphor naturally implies that storms pass.
- **The calculation accounts for the user's personal baseline.** Someone who averages 70% completion isn't penalized the same way someone who drops from 95% to 70%. It's relative to your own pattern.

**Why it's different from everything proposed:**
- "Weekly Rhythm Score" (C4) is a single per-habit metric. Weather is a holistic cross-habit indicator.
- "Momentum Decay Sparkline" (C2) shows per-habit trends. Weather synthesizes all trends into one reading.
- "Habit Zones" (L3) categorize individual habits by attention need. Weather evaluates the entire system.
- "Habit Debt Dashboard" (I3) shows what's remaining today. Weather shows the *overall trajectory* — are things getting better or worse?
- No prior proposal has a system-level health indicator. Every metric is per-habit.

**Behavioral science:** "Goal systems theory" (Kruglanski et al., 2002) argues that goals (and habits) function as interconnected systems, not independent items. The well-documented "what-the-hell effect" (Cochran & Tesser, 1996) shows that failure in one area cascades to others — but only when people lack a system-level perspective. A holistic health indicator provides that perspective, helping users see that one struggling habit doesn't mean the whole system is failing. The weather metaphor specifically leverages "affect heuristic" (Slovic et al., 2002) — people process emotional/metaphorical information faster and more accurately than numerical summaries. "Mostly sunny" communicates holistic health better than "73.4% completion rate."

**Data model:** No schema changes. Pure computation from existing logs data. The weather algorithm takes all non-archived, non-new habits' 7-day completion rates, weights by recency, and maps to a 5-level scale relative to the user's own 30-day baseline.

**Effort:** ~25 min. Weather calculation utility, header weather display, optional weekly trend line. No server changes.

---

### T3. Best-Day Flashbacks (Your Own History as Motivation)

**Dimension 120: Personal peak performance as motivational reference**

**The gap:** 117 proposals motivate users through external mechanics — streaks, badges, celebrations, narratives, difficulty curves, anchor statements, time capsules. All valuable. But the most powerful motivational data already exists in the user's own logs: their best days. The days when everything clicked. The app has this data and never uses it.

"You've done this before" is fundamentally different from "you can do this." The first is a fact; the second is encouragement. Facts are more motivating because they're indisputable — the evidence is in your own history.

**The problem it solves:** On a low-motivation day, the user opens the app and sees unchecked habits. Current options: push through on willpower, or feel bad about skipping. No current or proposed feature says: "Three weeks ago, you had a day just like this — and you turned it around by starting with meditation at 6pm."

**What it does:**

At contextually relevant moments, the app surfaces a "flashback" to a personally meaningful past day:

**Trigger 1: Low-completion day (3pm+ with <30% done)**
```
┌──────────────────────────────────────────────┐
│  💫 Flashback: October 12                     │
│                                               │
│  You'd only done 2 habits by 4pm that day.   │
│  Then you knocked out 4 more between 4-8pm.  │
│  Final score: 6/8.                            │
│                                               │
│  Today's at 2/7 — same starting point.       │
│  [ Start with Exercise → ]    [ Dismiss ]     │
└──────────────────────────────────────────────┘
```

**Trigger 2: Streak milestone achieved**
```
┌──────────────────────────────────────────────┐
│  💫 Flashback: Your journey with Meditation   │
│                                               │
│  Day 1 (Sep 1): You started with 5 minutes.  │
│  Day 10: You missed 2 days, then came back.  │
│  Day 30: Today. 30 days, including the hard  │
│  ones. That's who you are now.               │
│                                               │
│  [ Continue → ]                               │
└──────────────────────────────────────────────┘
```

**Trigger 3: After returning from a zero-day (integrates with S6)**
```
┌──────────────────────────────────────────────┐
│  💫 You've bounced back 6 times before.       │
│                                               │
│  Best comeback: Oct 3 → Oct 4                 │
│  You went from 0/7 to 7/7 the next day.     │
│                                               │
│  [ Let's go → ]                               │
└──────────────────────────────────────────────┘
```

**Key decisions:**
- **Flashbacks are always factual.** No generic motivation, no platitudes. Every statement is computed from the user's own data: actual dates, actual counts, actual patterns.
- **Maximum one flashback per session.** They're special because they're rare.
- **Flashbacks require 2+ weeks of data.** New users don't have meaningful history yet.
- **The "start with X" suggestion is the habit most likely to create momentum** — computed from historical patterns of which habit, when completed first on a low day, led to the highest total completions.
- **Flashbacks are always dismissable.** One tap to close, no guilt.
- **They surface specific dates, not averages.** "October 12th" is a memory; "your average low day" is a statistic. Memories are more motivating.

**Why it's different from everything proposed:**
- "Empty Day Interstitial" (S6) fires after zero-completion days with empathy messaging. Flashbacks fire on low-energy days (before they become zero-days) with evidence-based motivation from your own history.
- "Narrative View" (J2) tells today's story. Flashbacks reference specific past days as motivation for today.
- "Difficulty Curve" (L4) normalizes struggle with population-level research. Flashbacks normalize it with the user's own past evidence — far more personal and convincing.
- "Comeback Mode" (K2) addresses returning after a gap. Flashbacks can fire during an active day when motivation dips — before the gap happens.
- "Time Capsule" (J5) is a sealed letter from past self. Flashbacks are automatically generated from data — no user writing required.
- No prior proposal uses the user's own best performance as a dynamically surfaced motivational tool.

**Behavioral science:** "Self-efficacy theory" (Bandura, 1977) identifies four sources of efficacy beliefs, ranked by power: (1) mastery experiences, (2) vicarious experiences, (3) verbal persuasion, (4) physiological states. Your own past success is a mastery experience — the strongest source. Streaks are abstract numbers; flashbacks are concrete mastery reminders. "Temporal self-appraisal theory" (Wilson & Ross, 2001) shows that people are more motivated when they perceive their past selves favorably — seeing that "I did this before" strengthens the present-self's belief in the behavior. The specificity of dates and numbers activates episodic memory (Tulving, 1972), which is emotionally richer and more motivating than semantic memory ("I generally do well").

**Data model:** No schema changes. Flashbacks are computed from existing habit logs — daily completion counts, streak recovery patterns, per-habit completion sequences. One new client-side state: `lastFlashbackDate` to enforce the once-per-day limit.

**Effort:** ~30 min. Flashback computation utility (best day finder, comeback pattern detector, momentum habit identifier), flashback card component, trigger logic based on time-of-day and current completion rate. No server changes.

---

### T4. Adaptive Expectations (Smart Rhythm Recognition)

**Dimension 121: Personalized completion baselines**

**The gap:** The app has two frequency modes: daily (7/7 expected) or weekly (1/7 expected). These are rigid prescriptions. But real habit behavior naturally settles into individual rhythms that rarely match either extreme. A user who exercises 5 days a week, consistently, is succeeding — but the app shows 2 "empty" cells every week, and their streak resets every weekend. The data says "5/7 rhythm"; the app says "broke your streak on Saturday."

117 proposals address this through streak protection (grace days, shields, freeze) or scheduling (custom Mon/Wed/Fri). But these are workarounds for the underlying problem: the app's expectations don't match the user's actual behavior.

**The problem it solves:** The gap between expectation and reality creates false failure signals that erode motivation. A user who does 5/7 days every week sees "streak: 0" every Monday. A user who journals 4-5 times a week sees a grid that's 30% empty — even though 4-5/7 is excellent consistency. The metrics punish real, sustainable behavior because they assume perfect daily cadence.

**What it does:**

After 2+ weeks of data, the app detects each habit's natural rhythm and adapts its expectations:

```
Exercise — Your rhythm: 5 days/week (detected)
  This is a healthy, consistent pattern.
  Expectation adjusted: 5/7 = full marks

  This week: ✓ ✓ ✓ ✓ ✓ · ·    ← 5/5 (perfect!)
  Before:    ✓ ✓ ✓ ✓ ✓ · ·    ← 5/7 (71%, 2 "misses")
```

The streak calculation also adapts:

```
Streak (old): 0 days — broke Saturday
Streak (new): 3 weeks — 5/5 every week for 3 weeks running
```

The adaptation is visible and transparent:

```
Exercise 30 min
  Your rhythm: 5 days/week  [Adjust ▾]
  Streak: 3 weeks (at your rhythm)
  This week: 4 of 5 done
```

**Key decisions:**
- **Rhythm detection is automatic but user-overridable.** The app detects "you do this ~5 days a week" from log data, but the user can manually set their target.
- **Detection requires 14+ days of data.** Below that, the habit uses its declared frequency (daily/weekly).
- **The detected rhythm is the user's median weekly count over the last 30 days.** This filters out anomalies (vacation weeks, sick days).
- **Streaks become rhythm-based.** Instead of "consecutive days," a streak counts "consecutive weeks at or above your rhythm." 5/7, 6/7, 5/7 = 3-week streak, not a broken streak on rest days.
- **"At your rhythm" framing** makes it clear this isn't lowering the bar — it's recognizing the user's actual sustained pattern.
- **When rhythm changes significantly (user gets more/less consistent), the app gently asks:** "Your rhythm for Exercise has shifted from 5 to 3 days/week. Want to update your target?"

**Why it's different from everything proposed:**
- "Custom Scheduling" (G1) lets users pick Mon/Wed/Fri. Adaptive Expectations detects the pattern from data — no manual configuration needed.
- "Grace Days" / "Streak Insurance" protect streaks by allowing misses. Adaptive Expectations redefines what a "miss" IS — rest days within your rhythm aren't misses at all.
- "Weekly Rhythm Score" (C4) measures consistency as a percentage. Adaptive Expectations changes the DENOMINATOR — measuring against your personal rhythm, not an absolute daily target.
- "Habit Zones" (L3) categorize habits by attention need. Adaptive Expectations change how success is measured within each habit.
- No prior proposal changes the fundamental expectation model from "do this every day" to "do this at your natural rhythm."

**Behavioral science:** "Regulatory fit theory" (Higgins, 2000) shows that people are more motivated when goal structures match their natural tendencies. A daily target for a naturally-5-day habit creates regulatory misfit — the goal's structure doesn't match the behavior's reality. This misfit produces "false failure signals" that erode self-efficacy. Deci & Ryan's "competence need" (1985) — one of three basic psychological needs — requires that the person feels effective at what they're doing. An app that shows 71% when the user is actually at 100% of their real rhythm undermines competence perception. The adaptive streak ("3 weeks at your rhythm") preserves competence feedback while being honest about the data.

**Data model:**
```typescript
type Habit = {
  // ...existing
  detectedRhythm?: number     // auto-detected: days per week (e.g. 5)
  customTarget?: number       // user override of detected rhythm
}
```

Server change: store detected/custom rhythm on habit. Detection runs client-side from log data.

**Effort:** ~35 min. Rhythm detection algorithm (median weekly count over rolling 30 days), adaptive streak calculation, rhythm display in HabitRow, target adjustment prompt when rhythm shifts, manual override in edit flow. Small server schema addition.

---

### T5. Habit Aging (Visual Maturity Through Design)

**Dimension 122: Aesthetic evolution reflecting habit journey**

**The gap:** A 3-day-old habit and a 200-day-old habit look identical in the grid: same row height, same font, same cell style, same color treatment. The only visible difference is the streak number. 117 proposals add text labels (Difficulty Curve phase names), analytics (sparklines, completion rates), and features (zones, contexts, narratives) to differentiate habits by maturity. But none changes the visual *design* of the row itself.

This matters because visual design communicates at a pre-conscious level. Before you read "streak: 200 days," your eye should already feel that this habit is established, solid, rooted. And a brand-new habit should look fresh, tender, nascent — something to be nurtured, not judged.

**The problem it solves:** The flat visual treatment creates two problems:
1. **Mature habits don't feel like accomplishments.** A 200-day habit looks the same as yesterday's creation. The visual design doesn't celebrate longevity.
2. **New habits feel immediately pressured.** A day-old habit sits in the same visual context as a 6-month habit. The implicit message: "perform at the same level." This creates premature performance pressure.

**What it does:**

Habits visually evolve through four stages, expressed through subtle CSS changes to the habit row:

**Stage 1: Seedling (Days 1-7)**
```
  ○ Meditate 5 min                    ← softer text, slightly transparent
    Day 3 · Just planted               ← gentle label
    [ · ] [ · ] [✓]                    ← cells have a softer, rounded appearance
```
- Text color is slightly muted (0.75 opacity)
- Color bar is thinner, with a gentle pulse animation on the dot
- Grid cells have softer borders
- No streak shown (too early; this integrates with Silent Streaks I1)

**Stage 2: Sprout (Days 8-30)**
```
  ○ Meditate 5 min                    ← normal text opacity
    streak: 12 days                    ← streak appears
    [✓] [✓] [ ] [✓] [✓] [✓] [✓]     ← standard cell appearance
```
- Full text opacity
- Standard color bar thickness
- Streak becomes visible
- Everything looks "normal" — the habit has entered its working phase

**Stage 3: Growing (Days 31-90)**
```
  ○ Meditate 5 min                    ← slightly bolder text
    streak: 45 days                    ← streak pill gets a subtle glow
    [██] [██] [░░] [██] [██] [██] [██] ← cells are slightly larger
```
- Habit name is slightly bolder (font-weight: 500 → 600)
- Streak pill gains a subtle border glow in the habit's color
- Grid cells are 1-2px larger, reflecting the habit "growing"
- Color bar is at full thickness

**Stage 4: Rooted (Day 91+)**
```
  ○ Meditate 5 min                    ← bold, confident text
    streak: 120 days  ✦               ← star icon, enhanced pill
    [██] [██] [██] [██] [██] [██] [██] ← rich, saturated cells
```
- Habit name is bold (font-weight: 700)
- Streak pill has a gold/accent star icon
- Grid cells use slightly more saturated versions of the habit color
- Color bar has a subtle gradient effect
- The overall row has a faint elevated appearance (stronger shadow/border)

**Key decisions:**
- **Changes are subtle, not dramatic.** The transitions should feel natural — like noticing a plant has grown, not like a design overhaul. No animations, no flashy transitions.
- **Purely CSS-driven.** The aging stage is computed from `createdAt` and the current date. No data model changes.
- **The stage transitions are based on consecutive tracking days, not calendar days.** A habit created 90 days ago with only 20 completions is still a Sprout, not Rooted. Age reflects engagement, not time.
- **Reversible.** If a habit's completion rate drops significantly, its visual treatment can regress (Growing → Sprout) to reflect the actual state. This is gentle — it happens over a week of decline, not instantly.
- **Integrates with Habit Zones (L3).** Seedlings naturally fall in the "Growing" zone. Rooted habits naturally fall in "Cruise." The visual aging makes the zone system feel organic rather than mechanical.

**Why it's different from everything proposed:**
- "Difficulty Curve" (L4) adds text labels ("Day 18 — The Dip") to explain the formation journey. Habit Aging changes the visual design — it communicates through aesthetics, not text.
- "Habit Zones" (L3) groups habits by attention need. Aging changes individual row appearance — they're complementary but operate at different levels (grouping vs. styling).
- "Living Garden View" (parked) is a metaphorical garden visualization. Aging applies subtle real CSS changes to the actual habit rows — it's the real UI evolving, not a decorative view.
- "Completion Sparks" (N8) celebrates individual completions with micro-animations. Aging celebrates the journey — the cumulative visual weight of months of consistency.
- No prior proposal changes the visual treatment of habit rows based on maturity. All visual proposals add new elements; none modifies the existing design language.

**Behavioral science:** "Endowed progress effect" (Nunes & Dreze, 2006) — people who can see how far they've come are more motivated to continue than people shown only the remaining distance. The visual evolution IS the endowed progress — every time the user opens the app, their mature habits look different (richer, bolder, more established) than they did months ago. This creates a continuous, ambient sense of progress that doesn't require reading any number. "Aesthetic-usability effect" (Kurosu & Kashimura, 1995) — interfaces perceived as more beautiful are perceived as more effective. As habits mature, the app literally looks more polished, reinforcing the user's perception that the system works. This creates a positive feedback loop: mature habits make the app feel better, which makes the user feel better about tracking, which sustains the habits.

**Data model:** No schema changes. Aging stage is computed from `createdAt`, completion count, and recent completion rate. Pure CSS with dynamic classes.

**Effort:** ~30 min. Stage calculation utility (from createdAt + completion data), CSS classes for four stages (subtle opacity, font-weight, size, glow changes), dynamic class application in HabitRow. No server changes.

---

## Novelty Matrix

| ID | Feature | Dimension | Why 117 Prior Proposals Missed It |
|----|---------|-----------|-----------------------------------|
| T1 | Flexible Completions | Completion granularity (beyond binary) | The toggle is so fundamental that no proposal questions it. Every feature builds ON the binary; none replaces it. |
| T2 | Habit Ecosystem Weather | System-level health indicator | Every metric is per-habit. No proposal evaluates the habit collection as a holistic system. |
| T3 | Best-Day Flashbacks | Personal peak performance as motivation | All motivation is forward-looking (streaks, goals, anchor statements). None uses the user's own history as evidence they can do it. |
| T4 | Adaptive Expectations | Personalized completion baselines | All proposals assume daily=7/7. None adapts expectations to the user's actual rhythm, creating false failure signals. |
| T5 | Habit Aging | Visual maturity through design | All visual proposals add new elements (labels, sparklines, charts). None changes the design of existing elements to reflect the journey. |

---

## Consolidated Execution Backlog

This is the **24th planning document**. The backlog below draws from the best of 117+ proposals. But the honest assessment is at the bottom.

### Tier 0 — Fix What's Broken (~30 min)

Bugs. Not features. Every prior review lists these. They remain unfixed.

| # | Item | Why | Est. |
|---|------|-----|------|
| 0.1 | API error handling (`if (!res.ok) throw`) | Data-loss bug, blocks everything | 10 min |
| 0.2 | Edit habit (`PUT /api/habits/:id` + inline edit) | Blocks every feature that adds fields | 10 min |
| 0.3 | Unarchive + archived habits section | One-way door | 5 min |
| 0.4 | Remove dead `index.css` styles | Confusing dead code | 2 min |
| 0.5 | Reset `data.json` to `{ "habits": [], "logs": {} }` | 8-month-old test data | 1 min |

### Tier 1 — Make Daily Use Right (~65 min, pick 3)

Features that change how the app feels every day. Each is independent.

| # | Feature | Est. | Source | One-line justification |
|---|---------|------|--------|------------------------|
| 1.1 | **Adaptive Expectations** | 35 min | **T4** | Stop punishing sustainable behavior with false "misses" |
| 1.2 | **Habit Ecosystem Weather** | 25 min | **T2** | Holistic "how am I doing" without reading 8 individual metrics |
| 1.3 | **Undo Stack** | 20 min | S3 | Interaction safety for a tool used 5x/day |
| 1.4 | **Anchor Statement** | 10 min | C3 | One text field, huge emotional payoff |

### Tier 2 — Address Real Human Behavior (~70 min, pick 3)

Features that acknowledge habits are messy, personal, and contextual.

| # | Feature | Est. | Source | What it unlocks |
|---|---------|------|--------|-----------------|
| 2.1 | **Flexible Completions** | 40 min | **T1** | Dismantles all-or-nothing thinking at the interaction level |
| 2.2 | **Best-Day Flashbacks** | 30 min | **T3** | Your own history as the strongest motivator |
| 2.3 | **Empty Day Interstitial** | 25 min | S6 | Catches users at the abandonment moment |
| 2.4 | **Skip Taxonomy** | 30 min | S2 | Misses become data, not shame |
| 2.5 | **Private Habits** | 20 min | S4 | Unlocks tracking sensitive habits |

### Tier 3 — Deepen the Experience (~75 min, pick 2-3)

Features that make the app smarter and more personal over time.

| # | Feature | Est. | Source | Impact |
|---|---------|------|--------|--------|
| 3.1 | **Habit Aging** | 30 min | **T5** | Visual design reflects the journey; mature habits look established |
| 3.2 | **Difficulty Curve** | 25 min | L4 | Normalizes struggle with behavioral science |
| 3.3 | **Habit Zones** | 35 min | L3 | Manages cognitive load as the list grows |
| 3.4 | **Now Mode** | 35 min | L5 | Single-action focus for overwhelmed moments |
| 3.5 | **Starter Packs** | 30 min | L1 | Solves blank-slate onboarding |

### Tier 4 — Differentiation (~120 min)

Features that make Habit Garden unlike any other tracker. Need 2+ weeks of data.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 4.1 | Effort Budget | 40 min | J1 |
| 4.2 | Habit Sunset | 35 min | J3 |
| 4.3 | Habit Conversation | 55 min | J4 |
| 4.4 | Narrative View | 50 min | J2 |
| 4.5 | Completion Timestamps | 25 min | S5 |

### Tier 5 — Intelligence & Vision (~150 min)

Need 1+ month of real data to be meaningful.

| # | Feature | Est. | Source |
|---|---------|------|--------|
| 5.1 | Time Capsule | 40 min | J5 |
| 5.2 | Ripple Effects | 50 min | I4 |
| 5.3 | Context Routines | 45 min | L2 |
| 5.4 | Completion Contexts | 45 min | I5 |
| 5.5 | Weekly Rhythm Score | 30 min | C4 |

### Parked

| Feature | Reason |
|---------|--------|
| Living Garden View | The app's namesake; high effort, ship when core is solid |
| Custom Scheduling | Adaptive Expectations (T4) handles the common case automatically |
| Habit Stacking | Complex dependency model; needs simpler features first |
| Social / Sharing | Separate scope |
| PWA / Offline / Export | Infrastructure project |
| Full Analytics Dashboard | Premature; needs months of data |

---

## Feature Dependency Map

```
Tier 0 (bugs) → everything depends on this

Independent (any order after Tier 0):
  T4 Adaptive Expectations    T2 Habit Weather
  T1 Flexible Completions     T3 Best-Day Flashbacks
  T5 Habit Aging              S3 Undo Stack
  C3 Anchor Statement         S6 Empty Day Interstitial
  S2 Skip Taxonomy            S4 Private Habits
  L4 Difficulty Curve         L3 Habit Zones
  L5 Now Mode                 L1 Starter Packs

Soft dependencies:
  T3 Flashbacks    ← richer with S5 Timestamps and T1 Flexible Completions
  T5 Aging         ← integrates naturally with L3 Zones
  T2 Weather       ← can incorporate T4 Adaptive rhythm into calculation
  L5 Now Mode      ← benefits from C3 Anchor (shows "why") and T1 Completions
  S6 Empty Day     ← can feed tags into S2 Skip Taxonomy
  T3 Flashbacks    ← integrates with S6 as "bounce-back" evidence
```

---

## Recommended Execution Path

### Session 1: Foundation (~30 min)
Ship Tier 0. All five items. The app stops silently swallowing errors.

### Session 2: Smart Defaults (~60 min)
- **Adaptive Expectations (T4)** — The app stops punishing sustainable behavior
- **Ecosystem Weather (T2)** — Users get a holistic health indicator
- **Anchor Statement (C3)** — Emotional depth with 10 min of code

### Session 3: Human Behavior (~65 min)
- **Flexible Completions (T1)** — "Something" beats "nothing" every time
- **Best-Day Flashbacks (T3)** — Personal history as coach
- **Undo Stack (S3)** — Interaction safety

After 3 sessions (~155 min): The app has error handling, adaptive expectations that match user behavior, holistic health monitoring, flexible completions that eliminate all-or-nothing thinking, personal-history-based motivation, and undo. This is a fundamentally different product.

---

## The Hard Truth About This Project

This is the **24th planning document**. It proposes **5 new features**, bringing the total to **122 feature proposals** for an app with **960 lines of code** that has **shipped zero features** since its creation.

The planning-to-code ratio is now **~13 lines of planning per line of code**, and rising with each automated review.

Every prior document ends with the same recommendation: "Stop planning. Ship code. Start with Tier 0." This document is no exception. The irony is self-evident.

### What Would Actually Move This Project Forward

The next session should not produce `FEATURE_REVIEW_2026-11-07.md`. It should produce:

```diff
+ if (!res.ok) throw new Error(`API error: ${res.status}`)
```

That single line, added to 5 functions in `api.ts`, would be the first shipped improvement in the project's history. It would take 10 minutes. It has been documented as the #1 priority in every review since October 2026.

**The 122 proposed features are not the bottleneck. Implementation is.**

### Proposed Action: Implementation Sprint

If the scheduled task is configurable, consider replacing the next feature-review run with an implementation session targeting Tier 0. The specifications are complete. The data models are defined. The effort estimates are under 30 minutes total. What's missing is execution.

| What to build | Est. | Specification |
|--------------|------|---------------|
| API error handling | 10 min | Add `if (!res.ok)` to 5 functions in `api.ts` |
| Edit habit endpoint | 10 min | `PUT /api/habits/:id` in `server/app.js`, edit button in `HabitRow.tsx` |
| Unarchive | 5 min | `POST /api/habits/:id/unarchive`, archived section in UI |
| Clean CSS | 2 min | Remove unused Vite template styles from `index.css` |
| Reset data | 1 min | Empty `data.json` |

Total: ~28 minutes of implementation. This would be the project's first shipped work.

---

## Summary

| | |
|---|---|
| New features proposed | 5 (T1-T5) |
| Total proposals to date | 122 |
| Backlog items (curated) | 30 |
| Tier 0 estimate | ~28 min |
| Tier 0-2 estimate | ~165 min (~2.75 hours) |
| Features shipped to date | 0 |
| Honest recommendation | Ship Tier 0 code next, not another review |
