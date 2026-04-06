# Habit Garden — Unified Backlog & Implementation Plan

> Master backlog consolidating all features from three planning documents:
> - `FEATURES.md` — 16 original features (#1–#16)
> - `NEW_FEATURES.md` — 15 creative features (F1–F15)
> - `CREATIVE_FEATURES.md` — 10 new features (G1–G10)
>
> **Total: 41 features** organized into themed sprints with clear sequencing.

---

## Current State (Baseline)

| Capability | Status |
|-----------|--------|
| Habit CRUD (create, archive, delete) | Done |
| Daily & weekly frequency tracking | Done |
| Binary toggle (check/uncheck per date) | Done |
| 14-day visual history grid | Done |
| Streak calculation (daily + weekly) | Done |
| Dark theme UI | Done |
| Optimistic updates + toast notifications | Done |
| JSON file persistence + async mutex | Done |
| 17 backend integration tests | Done |

---

## Sprint Plan

### Sprint 1 — Quick Wins & UX Polish
> **Theme:** Make the daily experience better without touching the backend.
> **Goal:** Users feel the app is faster, smarter, and more satisfying to use.

| ID | Feature | Source | Effort | Backend? |
|----|---------|--------|--------|----------|
| #1 | Dashboard Statistics & Progress Overview | FEATURES.md | Low | No |
| #3 | Undo Toast for Accidental Toggles | FEATURES.md | Low | No |
| #14 | Dark/Light Theme Toggle | FEATURES.md | Low | No |
| F2 | Habit Health Score (Consistency Index) | NEW_FEATURES.md | Low | No |
| F4 | Failure Recovery Dashboard | NEW_FEATURES.md | Low | No |
| F13 | "Best Day" & "Worst Day" Markers | NEW_FEATURES.md | Low | No |
| F14 | Habit Sunset / Auto-Archive Prompts | NEW_FEATURES.md | Low | No |
| G2 | Today Focus Mode | CREATIVE_FEATURES.md | Low-Med | No |
| G3 | Habit Momentum Indicator (Trend Arrows) | CREATIVE_FEATURES.md | Low | No |
| G9 | Quick-Entry Widget (FAB) | CREATIVE_FEATURES.md | Low | No |

**Total: 10 features** | All frontend-only | Est. complexity: Low

**Why this grouping:** Every item here is purely derived from existing data — no schema changes, no new endpoints, no migrations. This is the highest ROI sprint: 10 features that collectively transform the "feel" of the app. The user gets a dashboard, better streaks (health score + recovery + momentum arrows), a focused daily view, theme choice, and delightful polish (undo, sunset prompts, best-day markers).

---

### Sprint 2 — Core Model Improvements
> **Theme:** Fix the habit model to match how real habits work.
> **Goal:** Habits can have rest days, shields, time blocks, and celebrations.

| ID | Feature | Source | Effort | Backend? |
|----|---------|--------|--------|----------|
| #4 | Data Export (JSON / CSV) | FEATURES.md | Low | Yes (new endpoint) |
| #12 | Habit Templates / Presets | FEATURES.md | Low | No |
| #2 | Habit Categories / Tags | FEATURES.md | Medium | Yes (schema) |
| F1 | Streak Shields & Vacation Mode | NEW_FEATURES.md | Medium | Yes (schema) |
| F5 | Smart Rest Days | NEW_FEATURES.md | Medium | Yes (schema) |
| F11 | Keyboard Shortcuts & Command Palette | NEW_FEATURES.md | Low-Med | No |
| G6 | Celebration Engine (Milestones) | CREATIVE_FEATURES.md | Medium | No |
| G7 | Time Block Awareness | CREATIVE_FEATURES.md | Low-Med | Yes (schema) |
| G8 | Personal Hall of Fame | CREATIVE_FEATURES.md | Low-Med | No |

**Total: 9 features** | Mixed frontend/backend | Est. complexity: Medium

**Why this grouping:** This sprint makes the core tracking model significantly richer. Smart Rest Days (F5) and Streak Shields (F1) fix the two biggest frustrations with streak-based tracking. Time Blocks (G7) add temporal structure. Categories (#2) add organizational structure. Celebrations (G6) add emotional reward. Data Export (#4) builds user trust. These changes together make the app feel "complete" for single-user daily use.

**Sequencing within sprint:**
1. F5 Smart Rest Days first (changes frequency schema — all subsequent features must respect it)
2. F1 Streak Shields second (builds on updated streak calculation)
3. #2 Categories, G7 Time Blocks, #4 Export (independent, can parallelize)
4. G6 Celebrations, F11 Keyboard, #12 Templates, G8 Hall of Fame (frontend-only, any order)

---

### Sprint 3 — Engagement & Depth
> **Theme:** Turn the tracker into a behavior design tool.
> **Goal:** Users can build routines, run experiments, and reflect on their week.

| ID | Feature | Source | Effort | Backend? |
|----|---------|--------|--------|----------|
| #5 | Habit Completion Heatmap | FEATURES.md | Medium | Optional |
| #6 | Habit Notes / Journal Entries | FEATURES.md | Medium | Yes (schema) |
| #8 | Habit Reordering (Drag & Drop) | FEATURES.md | Medium | Yes (schema) |
| F3 | Habit Stacking / Routines | NEW_FEATURES.md | Medium | Yes (new endpoints) |
| F7 | Habit Experiments (30-Day Trials) | NEW_FEATURES.md | Medium | Yes (schema) |
| F10 | Weekly Review Wizard | NEW_FEATURES.md | Medium | Yes (new endpoints) |
| G5 | Progressive Habit Scaling | CREATIVE_FEATURES.md | Medium | Yes (schema) |

**Total: 7 features** | All require some backend work | Est. complexity: Medium-High

**Why this grouping:** Sprint 3 is the "depth" sprint — features that reward engaged users. Habit Stacking (F3) models real routines. Experiments (F7) lower the barrier to trying new habits. Weekly Review (F10) adds structured reflection. The Heatmap (#5) provides long-term visual feedback. Drag & Drop (#8) gives control over layout. Notes (#6) add context. Progressive Scaling (G5) makes habits grow with you.

---

### Sprint 4 — Intelligence & Insights
> **Theme:** The app starts understanding your behavior and talking back.
> **Goal:** Automated pattern detection, mood correlation, and actionable reports.

| ID | Feature | Source | Effort | Backend? |
|----|---------|--------|--------|----------|
| #7 | Habit Reminders / Notifications | FEATURES.md | Medium | Minimal |
| #9 | Weekly/Monthly Reports Page | FEATURES.md | Medium | No |
| #13 | Habit Goals & Milestones | FEATURES.md | Medium | Yes (schema) |
| F6 | Mood & Energy Correlation | NEW_FEATURES.md | Med-High | Yes (new endpoints) |
| F8 | Habit Insights Engine | NEW_FEATURES.md | Med-High | No |
| G4 | Habit Conflict & Synergy Detection | CREATIVE_FEATURES.md | Medium | No |

**Total: 6 features** | Mixed | Est. complexity: Medium-High

**Why this grouping:** These are the "aha moment" features. The Insights Engine (F8) and Conflict Detection (G4) surface patterns users can't see themselves. Mood Correlation (F6) connects habits to wellbeing. Reports (#9) aggregate everything into a periodic review. Goals (#13) add target-setting. Reminders (#7) close the "forgot to do it" gap.

**Note:** F8, G4, and F6 all benefit from 30+ days of data. By Sprint 4, early adopters will have enough history for meaningful insights.

---

### Sprint 5 — The Living Garden
> **Theme:** The visual identity transformation.
> **Goal:** Habit Garden becomes a literal garden that grows with your habits.

| ID | Feature | Source | Effort | Backend? |
|----|---------|--------|--------|----------|
| G1 | The Living Garden Visualization | CREATIVE_FEATURES.md | High | No |
| G10 | Seasonal Themes & Ambient Weather | CREATIVE_FEATURES.md | Medium | No |

**Total: 2 features** | Frontend-only but high design effort | Est. complexity: High

**Why this grouping:** G1 is the single biggest differentiator. It deserves a dedicated sprint with full design attention. It needs SVG assets, a plant state machine, responsive layout, and careful animation performance tuning. G10 (Seasonal Themes) builds on G1 and adds polish.

**Why not earlier?** The garden is visually transformative but functionally additive — it doesn't unlock new capabilities. Shipping it after the model is rich (rest days, shields, stacks, time blocks) means the garden can reflect all that richness from day one.

---

### Sprint 6 — Scale & Infrastructure
> **Theme:** Prepare for multi-user deployment and mobile.
> **Goal:** Auth, database, PWA, and data portability.

| ID | Feature | Source | Effort | Backend? |
|----|---------|--------|--------|----------|
| #10 | User Authentication & Multi-User | FEATURES.md | Large | Yes (major) |
| #11 | SQLite / PostgreSQL Migration | FEATURES.md | Large | Yes (major) |
| #15 | PWA / Offline Support | FEATURES.md | Med-Large | Yes |
| #16 | Social / Accountability Features | FEATURES.md | Medium | Yes |
| F9 | Micro-Habits & Partial Completion | NEW_FEATURES.md | High | Yes (breaking) |
| F12 | Calendar / iCal Feed Export | NEW_FEATURES.md | Medium | Yes |
| F15 | Import from Other Trackers | NEW_FEATURES.md | Medium | Yes |

**Total: 7 features** | All backend-heavy | Est. complexity: High

**Why this grouping:** These are infrastructure features that enable deployment as a real product. DB migration (#11) should happen before or alongside Auth (#10), since Auth needs proper user tables. F9 (Micro-Habits) is here because its breaking schema change is easiest during a DB migration. PWA (#15) enables mobile. Import/Export (F15, F12) complete the data portability story.

**Sequencing within sprint:**
1. #11 Database Migration first (enables everything else)
2. #10 Authentication (needs DB)
3. F9 Micro-Habits (schema change during migration window)
4. #15 PWA, #16 Social, F12 iCal, F15 Import (independent, any order)

---

## Full Feature Index (41 features)

| ID | Feature | Sprint | Effort | Category |
|----|---------|--------|--------|----------|
| #1 | Dashboard Statistics | 1 | Low | Analytics |
| #2 | Categories / Tags | 2 | Medium | Organization |
| #3 | Undo Toast | 1 | Low | UX |
| #4 | Data Export | 2 | Low | Data |
| #5 | Heatmap | 3 | Medium | Visualization |
| #6 | Habit Notes | 3 | Medium | Tracking |
| #7 | Reminders | 4 | Medium | Engagement |
| #8 | Drag & Drop Reorder | 3 | Medium | UX |
| #9 | Reports Page | 4 | Medium | Analytics |
| #10 | Authentication | 6 | Large | Infrastructure |
| #11 | Database Migration | 6 | Large | Infrastructure |
| #12 | Habit Templates | 2 | Low | Onboarding |
| #13 | Goals & Milestones | 4 | Medium | Motivation |
| #14 | Theme Toggle | 1 | Low | UX |
| #15 | PWA / Offline | 6 | Med-Large | Infrastructure |
| #16 | Social Features | 6 | Medium | Social |
| F1 | Streak Shields | 2 | Medium | Resilience |
| F2 | Health Score | 1 | Low | Analytics |
| F3 | Habit Stacking | 3 | Medium | Organization |
| F4 | Failure Recovery | 1 | Low | Psychology |
| F5 | Smart Rest Days | 2 | Medium | Tracking |
| F6 | Mood Correlation | 4 | Med-High | Insights |
| F7 | Experiments (30-Day) | 3 | Medium | Engagement |
| F8 | Insights Engine | 4 | Med-High | Insights |
| F9 | Micro-Habits | 6 | High | Tracking |
| F10 | Weekly Review | 3 | Medium | Reflection |
| F11 | Keyboard Shortcuts | 2 | Low-Med | UX |
| F12 | iCal Export | 6 | Medium | Data |
| F13 | Best/Worst Day | 1 | Low | Motivation |
| F14 | Habit Sunset | 1 | Low | Maintenance |
| F15 | Import from Trackers | 6 | Medium | Data |
| G1 | Living Garden | 5 | High | Visualization |
| G2 | Today Focus Mode | 1 | Low-Med | UX |
| G3 | Momentum Arrows | 1 | Low | Analytics |
| G4 | Conflict/Synergy | 4 | Medium | Insights |
| G5 | Progressive Scaling | 3 | Medium | Tracking |
| G6 | Celebration Engine | 2 | Medium | Delight |
| G7 | Time Blocks | 2 | Low-Med | Organization |
| G8 | Hall of Fame | 2 | Low-Med | Motivation |
| G9 | Quick-Entry Widget | 1 | Low | UX |
| G10 | Seasonal Themes | 5 | Medium | Delight |

---

## Category Distribution

```
UX & Polish:        #3, #8, #14, F11, G2, G9              (6 features)
Analytics:          #1, #9, F2, G3                          (4 features)
Tracking Model:     F5, F9, G5                              (3 features)
Visualization:      #5, G1, G10                             (3 features)
Organization:       #2, F3, G7                              (3 features)
Insights:           F6, F8, G4                              (3 features)
Motivation:         #13, F13, G8                            (3 features)
Psychology:         F1, F4                                   (2 features)
Engagement:         #7, F7                                   (2 features)
Delight:            G6, G10                                  (2 features — G10 counted twice)
Reflection:         F10                                      (1 feature)
Onboarding:         #12                                      (1 feature)
Data Portability:   #4, F12, F15                            (3 features)
Infrastructure:     #10, #11, #15                            (3 features)
Social:             #16                                      (1 feature)
Maintenance:        F14                                      (1 feature)
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Garden viz (G1) takes too long to build | Medium | High | Ship as progressive enhancement — basic version first (CSS-only plant icons), full SVG version later |
| Schema changes in Sprint 2 break existing data | Medium | High | Write migration script. Keep backward-compatible defaults for all new fields |
| Insights Engine (F8) gives meaningless results | Medium | Medium | Require minimum 14 days of data. Show "Keep tracking — insights unlock at 14 days" until threshold |
| Feature creep delays core improvements | High | High | Sprint 1 is strictly frontend-only. No scope expansion allowed. Ship it. |
| Smart Rest Days (F5) complicates streak logic | Medium | Medium | Write comprehensive test suite for streak calc BEFORE changing the implementation |
| Celebration animations hurt performance | Low | Medium | Use CSS animations only (GPU-accelerated). No JS animation loops. Test on low-end devices. |

---

## Definition of Done (per feature)

- [ ] Feature works as described in the proposal
- [ ] No regressions in existing tests
- [ ] New backend endpoints have integration tests
- [ ] Responsive on desktop and mobile viewports
- [ ] Accessible (keyboard navigable, ARIA labels where needed)
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] Documented in this file (status updated to "Done")
