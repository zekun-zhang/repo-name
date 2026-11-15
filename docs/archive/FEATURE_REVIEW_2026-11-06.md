# Habit Garden — Feature Review (2026-11-06)

**Automated review** | Consolidates and replaces all 24 prior planning documents

---

## Codebase Audit

| Metric | Value |
|--------|-------|
| Source files | 11 (4 components, 1 hook, 1 utils, 1 types, 1 API client, 2 server, 1 test) |
| Lines of code | ~960 |
| Server tests | 14 (supertest, all passing) |
| Frontend tests | 0 |
| Working features | Create (daily/weekly), 14-day toggle grid, streaks, archive, delete |
| Stack | React 19 + TS + Vite 8 / Express + flat JSON |
| Prior planning docs | **24** |
| Prior feature proposals | **117+** (series A through S) |
| Features shipped | **0** |

---

## Fresh Code Findings (Not in Any Prior Review)

Prior reviews caught: silent API errors (F1), missing edit endpoint (F4), one-way archive, dead `index.css`, test data. These remain unfixed. Below are **new findings** from this audit.

### C1. Zero Accessibility

No prior proposal mentions accessibility. The app has significant a11y gaps:

- **Day cells have no accessible date labels.** A screen reader on a grid cell reads "button, pressed" or "button" — with no indication of which date. Each `<button>` in the 14-day grid needs `aria-label={`Toggle ${habit.name} for ${date}`}`.
- **Table header dates are bare numbers** (`10/28`) with no semantic meaning. `<abbr>` or full date in `aria-label` needed.
- **No skip-to-content link.** The form comes before the table — keyboard users tab through every form field to reach the grid.
- **Color-only habit identification.** The `.habit-color` swatch is the only visual differentiator for habits. Color-blind users can't distinguish habits. Needs an icon, pattern, or shape alternative.
- **Toast has no ARIA live region.** Error toasts appear visually but are invisible to assistive technology. Needs `role="alert"` or `aria-live="polite"`.

**Why this matters:** Accessibility isn't a feature — it's a legal and ethical baseline. Every shipped feature should include a11y. This should be part of Tier 0.

**Effort:** ~20 min for all five fixes.

### C2. Dark Mode Is Hardcoded — Light Mode Is Dead Code

`App.css` hardcodes a dark radial gradient background. Meanwhile, `index.css` has a complete light/dark design system with CSS custom properties (`--text`, `--bg`, `--accent`, etc.) and a `@media (prefers-color-scheme: dark)` block — but it's overridden by `App.css`'s hardcoded values.

This means:
- Users in bright environments (outdoors, bright office) have no light option
- The system's `prefers-color-scheme` preference is ignored
- Half the CSS work is already done but wasted

**The fix:** Refactor `App.css` to use the custom properties from `index.css`, then the OS preference automatically works. A manual toggle is a separate (small) feature.

**Effort:** ~15 min to unify the CSS; ~10 min more for a manual theme toggle.

### C3. The Grid Breaks on Mobile

The 14-day table has 17+ columns (habit name, streak, 14 date columns, actions). On a phone screen:
- `overflow-x: auto` on `.habits-table-wrapper` enables horizontal scrolling
- But the habit name and streak columns scroll off-screen — users lose context while scrolling

No prior proposal addresses this specific interaction failure. M3 ("Mobile-Responsive View") proposes a general responsive redesign but doesn't diagnose this specific problem.

**The fix:** Sticky first column (`position: sticky; left: 0`) so the habit name stays visible during horizontal scroll. Pure CSS, no component changes.

**Effort:** ~10 min.

### C4. No Favicon or PWA Manifest

The app ships `public/favicon.svg` and `public/icons.svg` but:
- `index.html` doesn't reference them — browsers show the default blank tab icon
- No `<meta name="theme-color">` for mobile browsers
- No `manifest.json` — can't be installed as a home screen app

For a daily-use tool, home screen installation is table-stakes on mobile.

**Effort:** ~15 min for favicon link + theme-color meta + basic manifest.

### C5. Concurrent Optimistic Updates Race

Identified as F5 in the Oct 30 review but never addressed: `useHabits.ts` captures `prevHabits`/`prevLogs` at call time for rollback. If two rapid toggles overlap and the first fails, its rollback overwrites the second toggle's state. In practice: rapidly checking off habits can lose check-ins.

**The fix:** Per-operation rollback using functional state updates that reverse only their own change, not a full snapshot restore.

**Effort:** ~15 min.

---

## T-Series: 5 Novel Features (Dimensions 118–122)

These target dimensions genuinely untouched by all 117 prior proposals. Each was verified against the complete A-through-S series catalog.

### T1. Habit Categories (Life Area Grouping)

**Dimension 118: Organizational taxonomy**

**The gap:** Every prior proposal treats the habit list as flat. 117 features address how habits are tracked, visualized, motivated, and recovered — but none addresses how they're *organized*. With 6+ active habits, the list becomes a wall of undifferentiated rows. The user's "Exercise" sits next to their "Read" next to their "Meditate" with no semantic grouping. This matters because habits cluster by life area, and users think about them that way: "How am I doing on health?" is a natural question the app can't answer.

**What it does:**
- When creating a habit, an optional "category" dropdown: Health, Learning, Creative, Work, Personal, Other (or custom text)
- Habits in the table are grouped by category with a subtle section header
- Uncategorized habits appear in an "Other" group at the bottom
- Each category shows an aggregate: "Health: 3/4 today" as a mini-summary

```
Health                                    3/4 today
  Exercise 30 min     14 days   ✓ ✓ ✓ ○ ✓ ✓ ✓ ...
  Take vitamins        8 days   ✓ ✓ ✓ ✓ ○ ✓ ✓ ...
  Drink water         45 days   ✓ ✓ ✓ ✓ ✓ ✓ ✓ ...
  Stretch              3 days   ○ ○ ✓ ✓ ✓ ○ ○ ...

Learning                                  1/2 today
  Read 10 pages       12 days   ✓ ✓ ✓ ○ ✓ ✓ ✓ ...
  Practice piano       0 days   ○ ○ ○ ○ ○ ○ ○ ...
```

**Why no prior proposal covers this:**
- Habit Zones (L3) triages habits by *attention needed* (auto-sorted by urgency). Categories are user-defined semantic groups.
- Now Mode (L5) focuses on *one habit at a time*. Categories organize *all habits visually*.
- Starter Packs (L1) pre-populates habits by theme. Categories let users define their own themes post-creation.
- Drag-to-Reorder (M2) lets users manually sort. Categories provide automatic, semantic sorting.

**Behavioral science:** "Goal systems theory" (Kruglanski et al., 2002) — people naturally organize goals hierarchically. Life areas (health, career, relationships) are the top level; individual habits are sub-goals. Seeing habits in their life-area context provides "goal coherence" — the feeling that your habits form a meaningful system, not a random checklist. Research on "category-based goal pursuit" (Fishbach et al., 2006) shows that grouping sub-goals under a category increases persistence because each individual action is experienced as contributing to the larger category's progress.

**Data model:**
```typescript
type Habit = {
  // ...existing
  category?: string  // free text, displayed as a group header
}
```

**Effort:** ~25 min. Category field in form, groupBy logic in HabitTable, section headers with aggregate counts.

---

### T2. Completion Heatmap Calendar (Year View)

**Dimension 119: Long-horizon visual progress**

**The gap:** The app shows 14 days. Period. There is no way to see a month, a quarter, or a year of progress. 117 proposals add sparklines (N3), rhythm scores, momentum scores (P3), and narrative views (J2) — but all operate on *derived metrics* (numbers, text, graphs). None provides a direct, raw *visual map of every day's completion* over a long time horizon. The GitHub contribution heatmap is the gold standard for this — and it's conspicuously absent from a habit tracking app.

**What it does:** A per-habit calendar view showing the last 90 days (or 365 days) as a grid of colored squares:

```
Exercise — Last 90 Days

     Mon  ░░▓▓▓▓▓░░▓▓▓▓▓░░▓▓▓▓░░░▓▓▓▓▓░░▓▓▓▓▓
     Tue  ▓▓▓▓▓░░▓▓▓▓▓░░▓▓▓▓▓░░▓▓▓▓▓░░▓▓▓▓▓░░▓
     Wed  ▓▓▓▓░░░▓▓▓▓░░░▓▓▓▓░░░▓▓▓▓▓░░▓▓▓▓▓░░▓
     Thu  ▓▓▓▓▓░░▓▓▓▓▓░░▓▓▓▓▓░░▓▓▓▓░░░▓▓▓▓▓░░▓
     Fri  ▓▓▓▓░░░▓▓▓░░░░▓▓▓▓░░░▓▓▓▓▓░░▓▓▓▓▓░░▓
     Sat  ░░░▓░░░░░░▓░░░░░░░░░░░░░▓░░░░░▓▓▓░░░░
     Sun  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓░░░░

     ░ = missed    ▓ = completed
     
     Sep: 72%    Oct: 85%    Nov: 80% (so far)
```

Color intensity can encode the habit's own color at varying opacity. Tapping a cell shows that day's details.

**Why no prior proposal covers this:**
- Habit Heatmap (N3) is listed as "Tier 3" but was never specified beyond a title. It's a 2-word placeholder, not a design.
- Sparklines show a trend line. A heatmap shows every individual day — the texture of consistency is visible (weekday vs. weekend patterns, vacation gaps, gradual improvement).
- The 14-day grid exists but 14 days is too narrow to reveal monthly patterns. A 90-day view reveals seasonal and lifestyle patterns invisible in 2 weeks.

**Why it matters for this specific app:** "Habit Garden" uses a growth metaphor. The heatmap IS the garden — a visual field that fills in as habits grow. Empty patches are visible but so is the overall density of green. This is emotionally very different from a streak number that resets to zero.

**Behavioral science:** "Visual progress tracking" (Harkin et al., 2016, meta-analysis of 138 studies) — monitoring goal progress significantly increases goal attainment, and visual monitoring is more effective than numerical. The GitHub heatmap is one of the most successful behavior-reinforcement interfaces ever designed — developers literally change their commit behavior to keep the graph green. The same psychology applies to habits. The density of the heatmap provides "ambient awareness" of consistency without the brittleness of streaks.

**Data model:** No changes. Uses existing `logs` data. Pure client-side rendering.

**Effort:** ~35 min. Calendar grid component (CSS grid, 7 rows x N weeks), color mapping from habit color at varying opacities, month labels, per-habit detail view.

---

### T3. Theme Toggle (Light/Dark Mode)

**Dimension 120: Environmental adaptability**

**The gap:** The app is hardcoded to dark mode. The `index.css` file contains a complete light-mode design system with dark-mode overrides via `prefers-color-scheme` — but `App.css` overrides everything with fixed dark gradients. No prior proposal addresses this, despite it being a UX fundamental for a daily-use app. Users check habits in the morning (often in bright light), during commutes (variable light), and at night (dark). A dark-only app in bright sunlight is unreadable.

**What it does:**
1. Unify `App.css` and `index.css` so all colors flow through CSS custom properties
2. Respect `prefers-color-scheme` automatically (system default)
3. Add a small sun/moon toggle in the header that overrides the system preference
4. Persist the choice in `localStorage`

```
Light mode:
┌─────────────────────────────────────────┐
│  ☀️ Habit Garden      Today: 2026-11-06 │
│                                         │
│  Clean white background                 │
│  Dark text, subtle borders              │
│  Checked cells: solid habit color       │
└─────────────────────────────────────────┘

Dark mode (current, but now via variables):
┌─────────────────────────────────────────┐
│  🌙 Habit Garden      Today: 2026-11-06 │
│                                         │
│  Dark gradient background               │
│  Light text, subtle borders             │
│  Checked cells: glowing gradient        │
└─────────────────────────────────────────┘
```

**Why no prior proposal covers this:** 117 proposals focus on features (data, interaction, motivation). None addresses the visual environment in which the app is used. The irony is that half the CSS work is already done — the light theme variables exist in `index.css`.

**Behavioral science:** Not a behavioral science feature per se, but "environmental compatibility" determines whether a tool gets used at all. Apps that are uncomfortable to look at in common lighting conditions get abandoned — not because they're bad, but because they're painful. A daily-use app must work in every lighting condition the user encounters.

**Data model:** No changes. Client-side only. `localStorage` for theme preference.

**Effort:** ~25 min. Refactor App.css to use CSS variables, wire up prefers-color-scheme, add toggle button with localStorage persistence. Half the token definitions already exist in index.css.

---

### T4. Data Export & Backup

**Dimension 121: User data ownership**

**The gap:** All data lives in a single `server/data.json` file with no backup, export, or portability mechanism. If the server dies, the file is corrupted, or the user wants to switch devices — all habit history is gone. 117 proposals add features that make the data more valuable (timestamps, photos, skip reasons, momentum scores) but none provides any way to *safeguard* that data. This is a trust issue: users won't invest in a tracker they might lose.

PWA/Offline/Export is listed as "Parked" in prior backlogs, but export specifically is trivial and independent of the larger PWA effort.

**What it does:**
- A "Download my data" button in a minimal settings area (or the header)
- Clicking it triggers a browser download of the full `data.json` as `habit-garden-backup-YYYY-MM-DD.json`
- A companion "Import data" button that accepts a previously exported JSON file, validates its structure, and replaces the current data (with confirmation)

```
Settings
  ┌──────────────────────────────────────┐
  │  📥 Download backup                   │
  │     Last export: 2026-11-01           │
  │                                       │
  │  📤 Import from backup                │
  │     Replaces all current data         │
  └──────────────────────────────────────┘
```

**Why no prior proposal covers this specifically:**
- PWA/Offline is a large infrastructure project. Export/Import is a 20-minute feature that provides 80% of the data safety value.
- Every proposal adds data to the system. None provides a way to get data out.

**Why it matters:** The flat JSON file is a single point of failure. Even with a production database, export is a user right. For a personal tracking app, data loss is catastrophic — it's not just settings, it's months of personal behavioral history.

**Data model:** No changes. The export IS the data model. Import validates the incoming JSON against the expected shape and rejects malformed data.

**Effort:** ~20 min. Download endpoint (`GET /api/export`), file download trigger on the client, import endpoint (`POST /api/import` with validation), file upload UI with confirmation dialog.

---

### T5. Habit Templates (Quick-Start Library)

**Dimension 122: Zero-friction onboarding**

**The gap:** Creating a habit requires typing a name, choosing a frequency, and picking a color. For a first-time user, this is a blank page problem — "what should I track?" is a surprisingly paralyzing question. Prior proposal L1 ("Starter Packs") offers themed bundles (Morning Routine, Fitness Basics). But bundles are opinionated and all-or-nothing: you get 5 pre-selected habits or none.

Templates are different: they're a searchable library of individual habit suggestions that the user picks from one at a time, with pre-filled name, frequency, and color. The user keeps full control while eliminating the blank-page friction.

**What it does:**
- Below the "Create a habit" form, a "Browse templates" link expands a categorized list
- Templates are a static JSON array shipped with the app (no server call)
- Each template has: name, frequency, category, suggested color
- Tapping a template pre-fills the form — user can edit before saving
- Templates are grouped by category: Health, Fitness, Mindfulness, Learning, Productivity, Creative, Social

```
Browse templates:

Health
  [+ Drink 8 glasses of water] [+ Take vitamins] [+ Sleep by 11 PM]

Fitness  
  [+ Exercise 30 min] [+ 10,000 steps] [+ Stretch 10 min]

Mindfulness
  [+ Meditate 10 min] [+ Journal] [+ Gratitude list]

Learning
  [+ Read 10 pages] [+ Practice instrument] [+ Study language 15 min]
```

**Why this differs from L1 (Starter Packs):**
- Starter Packs: curated bundles of 4-6 habits, all-or-nothing, themed ("Morning Person" pack). Top-down.
- Templates: individual suggestions you pick one at a time. Bottom-up. The user assembles their own set.
- Starter Packs solve "I don't know what habits to track." Templates solve "I know roughly but I don't want to type it all out."
- Templates remain useful after onboarding (adding a new habit later). Starter Packs are one-time onboarding.

**Behavioral science:** "Choice architecture and defaults" (Thaler & Sunstein, 2008) — providing good defaults dramatically increases adoption. Template suggestions serve as "soft defaults" that reduce the cognitive load of habit creation. "Decision fatigue" (Baumeister et al., 2008) means every choice costs willpower — pre-filled templates let users spend their willpower on *doing* habits rather than *configuring* them. Templates also leverage "social proof" — seeing that other people track "Meditate 10 min" normalizes the habit choice.

**Data model:** No schema changes. Templates are a static `const TEMPLATES: HabitTemplate[]` array in the client code. Tapping a template calls the existing `addHabit` with pre-filled values.

**Effort:** ~20 min. Static template data, expandable template browser component, pre-fill-on-click wiring to existing form.

---

## Novelty Verification: T-Series vs. All 117 Prior Proposals

| ID | Feature | Dimension | Nearest Prior | Why T Is Different |
|----|---------|-----------|---------------|-------------------|
| T1 | Habit Categories | Organizational taxonomy | Habit Zones (L3), Drag-to-Reorder (M2) | Zones sort by urgency (auto). Reorder is manual position. Categories are user-defined semantic groups with aggregate stats. |
| T2 | Heatmap Calendar | Long-horizon visual map | Heatmap (N3, title only), Sparklines | N3 was never designed — just a title. Sparklines show trend lines, not individual days. Heatmap shows the raw texture of consistency over months. |
| T3 | Theme Toggle | Environmental adaptability | None | Zero prior proposals address visual environment. Half the CSS already exists in dead code. |
| T4 | Data Export | User data ownership | PWA/Offline/Export (parked) | PWA is a large project. Export alone is 20 min and provides 80% of the data safety value. |
| T5 | Habit Templates | Zero-friction individual suggestions | Starter Packs (L1) | Packs are themed bundles (all-or-nothing, one-time). Templates are individual suggestions (pick-and-choose, always available). |

---

## Definitive Backlog

This replaces the backlogs in all 24 prior documents. Items are drawn from the best of 122 proposals (A through T), ordered by: fixes defects > removes friction > adds capability > adds depth.

### Tier 0 — Fix Defects (before any feature work)

These are bugs and debt, not features. Each one either corrupts data or blocks the entire roadmap.

| # | Item | What's Wrong | Fix | Est. |
|---|------|-------------|-----|------|
| 0.1 | API error handling | `api.ts` never checks `res.ok` — server 500s silently corrupt client state | Add `if (!res.ok) throw` to every fetch call | 10 min |
| 0.2 | Edit endpoint | No `PUT /api/habits/:id` — blocks every feature that adds editable fields | Add PUT route with same validation as POST | 10 min |
| 0.3 | Data migration | Adding any field to `Habit` requires defensive checks everywhere | `migrateData()` in server that fills defaults on read | 5 min |
| 0.4 | Unify CSS | `index.css` (light/dark tokens) and `App.css` (hardcoded dark) conflict | Refactor `App.css` to use CSS variables, delete dead `index.css` rules | 15 min |
| 0.5 | Accessibility basics | No aria-labels on grid cells, no live region on toast, color-only identification | Add aria-labels, role="alert" on toast, shape alternatives | 20 min |
| 0.6 | Clean test data | `data.json` has 8 test habits from March 2026 | Reset to `{ "habits": [], "logs": {} }` | 1 min |
| 0.7 | Sticky first column | Habit names scroll off-screen on mobile | `position: sticky; left: 0` on first `<td>` | 10 min |
| 0.8 | Favicon + meta | No favicon linked, no theme-color, blank browser tab | Link existing `favicon.svg`, add meta tags | 5 min |

**Total Tier 0: ~75 min** — After this, the app is correct, accessible, usable on mobile, and ready for features.

### Tier 1 — Daily Use Essentials (makes the app worth using every day)

Pick 3-4. Each independently improves the daily experience.

| # | Feature | Source | What It Does | Est. |
|---|---------|--------|-------------|------|
| 1.1 | **Undo Stack** | S3 | 5-second undo toast for toggle/archive/delete. Replaces confirm dialog. | 20 min |
| 1.2 | **Theme Toggle** | **T3** | Light/dark mode via CSS variables + system preference + manual toggle | 25 min |
| 1.3 | **Habit Templates** | **T5** | Browse pre-made habit suggestions, one-tap to pre-fill creation form | 20 min |
| 1.4 | **Data Export** | **T4** | Download/upload JSON backup of all habit data | 20 min |
| 1.5 | Today Bar | R2 | Quick check-in overlay for today's habits only | 20 min |
| 1.6 | Anchor Statements | C3 | Per-habit "why I do this" text shown on hover/tap | 10 min |

**Recommended first 3:** 1.1 (Undo) + 1.2 (Theme) + 1.4 (Export) — safety, comfort, trust.

### Tier 2 — Insight & Engagement (makes the app smarter)

Pick 3. Requires a few days of real usage data to be meaningful.

| # | Feature | Source | What It Does | Est. |
|---|---------|--------|-------------|------|
| 2.1 | **Heatmap Calendar** | **T2** | 90-day GitHub-style contribution grid per habit | 35 min |
| 2.2 | **Habit Categories** | **T1** | Group habits by life area with aggregate completion counts | 25 min |
| 2.3 | Empty Day Interstitial | S6 | Empathetic prompt when returning after a zero-completion day | 25 min |
| 2.4 | Skip Taxonomy | S2 | One-tap miss classification (Forgot/Busy/Rest/Chose not to/Sick) | 30 min |
| 2.5 | Private Habits | S4 | Per-habit privacy flag; privacy mode shows only initials | 20 min |
| 2.6 | Completion Timestamps | S5 | Record when-in-day a habit was completed, show avg time | 25 min |

### Tier 3 — Depth & Retention (makes the app feel personal)

| # | Feature | Source | What It Does | Est. |
|---|---------|--------|-------------|------|
| 3.1 | Habit Momentum Score | P3 | Continuous 0-100 resilience metric (not binary streak) | 20 min |
| 3.2 | Weekly Intentions | P4 | Monday planning overlay: commit to specific days per habit | 35 min |
| 3.3 | Batch Check-in | P1 | Full-screen checklist for logging all today's habits at once | 25 min |
| 3.4 | Personal Records | R4 | "Longest streak ever" and "best week ever" badges | 20 min |
| 3.5 | Stale Habit Detection | P2 | Auto-prompt to pause/remove habits untouched for 21 days | 20 min |

### Tier 4 — Differentiation (needs weeks of accumulated data)

| # | Feature | Source | Est. |
|---|---------|--------|------|
| 4.1 | Cross-Habit Correlation | P5 | 30 min |
| 4.2 | Weekly Digest Summary | R6 | 30 min |
| 4.3 | Focus Timer | P6 | 30 min |
| 4.4 | Habit Snapshots (photos) | S1 | 40 min |
| 4.5 | Difficulty Curve | L4 | 25 min |

### Tier 5 — Vision (ship when core is solid and has real users)

| # | Feature | Source | Est. |
|---|---------|--------|------|
| 5.1 | Living Garden Visualization | Parked | 60 min |
| 5.2 | Narrative View | J2 | 50 min |
| 5.3 | Context Routines | L2 | 45 min |
| 5.4 | Now Mode | L5 | 35 min |
| 5.5 | Habit Conversations | J4 | 55 min |

### Parked (not in the backlog)

| Feature | Reason |
|---------|--------|
| PWA / Service Worker / Offline | Large infrastructure project; T4 (export) covers data safety in the meantime |
| Social / Sharing | Different product direction; needs user research |
| Full Analytics Dashboard | Premature; heatmap + momentum + correlation cover the analytics need |
| Custom Scheduling (beyond daily/weekly) | Context Routines (L2) handles the common case |
| Anti-Habits (stop-doing tracking) | Niche; revisit after core is mature |

---

## Dependency Map

```
Tier 0 (all items) → everything else

Independent (any order after Tier 0):
  S3 Undo           T3 Theme Toggle     T5 Templates
  T4 Export          R2 Today Bar        C3 Anchors
  T2 Heatmap         T1 Categories       S4 Private Habits
  S6 Empty Day       P3 Momentum         P1 Batch Check-in
  R4 Records         P2 Stale Detection

Soft dependencies:
  S2 Skip Taxonomy ← enhanced if S6 Empty Day feeds tags into it
  T1 Categories    ← T5 Templates can pre-fill categories
  S5 Timestamps    ← validates L2 Routines if both built
  P5 Correlation   ← needs 30+ days of data for 2+ habits
  R6 Digest        ← richer with P3 Momentum + R4 Records data
```

---

## Recommended Execution Sessions

### Session A: Foundation (~75 min)
All Tier 0 items. After this: errors are caught, habits are editable, CSS is unified, the grid works on mobile, a11y basics are in place.

### Session B: Daily Trust (~60 min)
1. Undo Stack (S3) — safety net for daily interactions
2. Theme Toggle (T3) — light mode, system preference
3. Data Export (T4) — "my data is safe"

### Session C: Onboarding + Insight (~60 min)
1. Habit Templates (T5) — eliminate blank-page friction
2. Heatmap Calendar (T2) — long-horizon visual progress
3. Habit Categories (T1) — organize the growing habit list

After sessions A+B+C (~195 min total): the app catches errors, works on mobile, supports light/dark mode, has undo, backs up data, helps new users get started, shows a 90-day visual history, and organizes habits by life area. That's a shippable product.

---

## The Planning Debt

This is the **25th planning document** for a **960-line app** with **zero shipped features**.

The 122 feature proposals across these documents include genuinely good ideas. The problem has never been a shortage of ideas — it's a shortage of execution. Every planning session adds ~30 more proposals; none adds a single line of production code.

This document exists because the scheduled task requested it. But the honest output of this review is:

**The next session should produce a commit, not a markdown file.**

Tier 0.1 (`if (!res.ok) throw` in `api.ts`) is 6 lines of code. It fixes a data corruption bug. It has been identified in 5 separate planning documents over 8 days. It remains unfixed.

The backlog above is final. The priority order is clear. Every item has an effort estimate, a concrete description, and no dependency on any other item (except Tier 0). There is nothing left to plan.

---

*This document consolidates and replaces: FEATURES_v3 through v15, FEATURES_NEW, FEATURES_FINAL, FEATURES_AND_BACKLOG, ROADMAP, PLAN, FEATURE_PLAN, FEATURE_REVIEW_2026-10-29, FEATURE_REVIEW_2026-10-30, and FEATURE_REVIEW_2026-11-03. The combined A-through-T catalog covers 122 feature dimensions. **The planning phase is complete.***
