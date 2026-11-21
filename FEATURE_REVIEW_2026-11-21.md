# Habit Garden — Feature Review, November 21, 2026

**Planning documents:** 38 (including this one)
**Feature proposals to date:** 140+
**Features shipped:** 0
**Code commits since project start:** 1 (bug fixes, Nov 8)

This document exists because a scheduled task requested it. It should take 5 minutes to read, not 20.

---

## 5 Proposals Targeting Dimensions No Prior Document Touches

Every prior proposal (series A through CC) shares three assumptions: (1) all habits deserve equal screen space, (2) streaks measure the right thing, and (3) the app should grow by adding features. These proposals challenge those assumptions.

### DD1: Habit Gravity (Attention-Weighted UI)

**The untouched dimension:** Every proposal treats the habit list as a flat, equal-weight table. No proposal changes *how much space* a habit occupies based on how much attention it needs.

**What it does:** Habits that need attention (low recent completion, declining velocity, near streak-break) automatically expand in the UI — showing more context, larger toggle targets, and motivational cues. Habits on autopilot (30+ days consistent) shrink to a single compact row. The UI self-organizes around *attention need*, not insertion order.

**How it differs:** Smart Priority (E4) reorders. Habit Gravity changes *visual weight* without reordering — your muscle memory for where each habit lives stays intact. Focus Spotlight (F2) elevates one habit by user choice. Gravity does it automatically for every habit simultaneously.

**Data model:** None. Pure CSS + computation from existing logs.
**Effort:** ~35 min.

---

### DD2: Recovery Velocity (Bounce-Back Metric)

**The untouched dimension:** Every streak proposal (shields, grace days, insurance, silent streaks, 2-day rule) tries to prevent or soften streak breaks. None measures *how fast you recover* from a break. Recovery speed is a better predictor of long-term success than streak length.

**What it does:** After any streak break, the app tracks how many days until the habit resumes. This becomes a per-habit "recovery velocity" score displayed alongside (or instead of) the streak count. A habit where you always bounce back in 1 day is healthier than a 90-day streak that, when broken, leads to a 2-week absence.

**Display:**
```
Exercise      Streak: 5 days    Recovery: <1 day avg    ← resilient
Reading       Streak: 2 days    Recovery: 4 days avg    ← fragile
```

**How it differs:** Streaks reward perfection. Recovery velocity rewards resilience. This is not a modification of streaks — it's a replacement metric that measures a fundamentally different quality.

**Data model:** None. Computed from gap analysis of existing log dates.
**Effort:** ~25 min.

---

### DD3: Carrying Capacity (Sustainable Habit Load)

**The untouched dimension:** No proposal addresses the question "how many habits can this user actually sustain?" Every proposal assumes adding more habits is fine. The app never warns that you're overcommitted.

**What it does:** From your completion data, the app calculates your effective capacity — the number of habits you can sustain at 80%+ completion. A simple meter in the header:

```
Habits: 8 active    Sustainable capacity: ~6    ⚠ 2 over
```

When you create a new habit while over capacity, a gentle warning: "You're tracking 8 habits but sustaining about 6. Consider sunsetting or archiving one before adding another."

The capacity estimate uses a trailing 14-day window: how many habits had >80% completion.

**How it differs:** Effort Budget (J1) allocates energy within a single day. Carrying Capacity operates at the habit-collection level across weeks — it's about *how many things* you can track, not *how to prioritize them today*.

**Data model:** None. Computed from existing logs.
**Effort:** ~20 min.

---

### DD4: Day Archetypes (Weekly Personality Map)

**The untouched dimension:** Miss Pattern Map (E3) identifies which days have the most misses. But it stops at observation. No proposal uses day-of-week data to *set different expectations per day*, turning a weakness into a strategy.

**What it does:** After 2+ weeks of data, the app characterizes each day:

```
Monday:    Strong (avg 6/7 habits)     "Your best day"
Tuesday:   Strong (avg 5.5/7)
Wednesday: Average (avg 4/7)
Thursday:  Average (avg 4.5/7)
Friday:    Weak (avg 2.5/7)            "Go easy"
Saturday:  Rest (avg 1.5/7)            "Recovery day"
Sunday:    Moderate (avg 3/7)
```

On weak days, the Habit Debt Dashboard (if built) adjusts expectations: "Friday — aim for your top 3" instead of showing all 7 as incomplete.

**How it differs:** Miss Pattern Map shows *where* failures happen. Day Archetypes *adapts the app's expectations* to match your natural rhythm, turning analytics into automatic behavior.

**Data model:** None. Computed from day-of-week completion rates.
**Effort:** ~30 min.

---

### DD5: Habit Patina (Visual Aging)

**The untouched dimension:** Every habit looks the same whether you created it yesterday or 6 months ago. No proposal gives habits a visual sense of *age and establishment*. A 200-day habit and a 2-day habit shouldn't look identical — the older one should feel more solid, more "yours."

**What it does:** Each habit's color swatch and row style subtly evolve with age:
- **0–7 days:** Bright, fresh color. Thin border. "New sprout" energy.
- **8–30 days:** Color deepens slightly. Border solidifies.
- **31–90 days:** Rich, saturated color. The row feels "settled."
- **90+ days:** Deep, warm tone. A subtle texture or glow. This habit is *established*.

The effect is cosmetic but psychologically powerful: older habits feel like possessions you've built. Deleting a 200-day habit with its rich patina *feels* different from deleting a 3-day one.

**How it differs:** Streak Milestones celebrate numbers. Patina creates ambient visual identity that you notice without reading anything. It makes time visible.

**Data model:** None. CSS computed from `createdAt`.
**Effort:** ~20 min.

---

## Updated Backlog (What to Actually Build)

The backlog below merges the best of 140+ proposals into what matters. It is intentionally short.

### Now (combined ~2 hours)

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 1 | Carrying Capacity meter | 20 min | Prevents the habit-hoarding trap |
| 2 | Recovery Velocity metric | 25 min | Better success metric than streaks |
| 3 | Habit Gravity (auto-weighted UI) | 35 min | Makes the daily view self-organizing |
| 4 | Day Archetypes | 30 min | Turns your weakest days into planned recovery |

### Next (pick 2–3, combined ~2 hours)

| # | Feature | Effort | Source |
|---|---------|--------|--------|
| 5 | Completion Velocity indicator (↑→↓) | 25 min | CC4 |
| 6 | Habit Patina (visual aging) | 20 min | DD5 |
| 7 | Today view / Debt Dashboard | 45 min | I3 |
| 8 | Planned Rest Days | 50 min | CC2 |

### Later (after real usage)

Stats view, custom scheduling, habit stacking, weekly story, sunrise/sunset, minimum viable day, narrative view, habit conversation, time capsule, ripple effects, contexts.

### Parked permanently

Living Garden, PWA, social features, data export, full analytics dashboard, anything requiring 1+ months of data before the app has 1 active user.

---

## The Real Recommendation

This project has produced 9,500+ lines of planning and 1,153 lines of code. The ratio is 8:1 planning-to-code. This is document #38.

The four features in the "Now" tier total ~110 minutes of coding. That's less time than reading all 38 planning documents.

**Stop planning. Ship DD1–DD4. Then decide what's next from actual usage, not another document.**
