# Codebase Improvement Findings

> Habit Tracker — React/TypeScript frontend + Express backend
> Analyzed: 2026-03-24

---

## CRITICAL (Security & Stability)

1. **No Authentication/Authorization** — Anyone can read/modify all habits; no user isolation whatsoever.
2. **No Rate Limiting** — The API is vulnerable to DoS attacks.
3. **CORS allows all origins** — Should be restricted to known domains only.
4. **No input size limits** — Overly large payloads could cause memory exhaustion.
5. **No error logging** — Failures are silent; no request ID tracking for debugging.
6. **`api.ts` has no response validation** — Doesn't check `res.ok` before calling `res.json()`; fetch errors are unhandled.

---

## High Priority (Code Quality)

7. **No frontend tests at all** — No unit, integration, or E2E tests for any React component.
8. **Magic numbers/strings scattered throughout:**
   - Toast timeout hardcoded: `3000`
   - Habit name max length: `100`
   - API endpoints as raw strings in `api.ts`
   - Frequency literals `'daily'` / `'weekly'` not centralised in a shared constant
9. **`utils.ts` streak functions use `for(;;)` infinite loops** — Fragile; could hang if data is malformed.
10. **`useHabits.ts` error state never clears** after initial load failure — No retry mechanism for the user.
11. **No environment variable handling** — `dotenv` not installed; no `.env.example` file provided.
12. **Vite proxy URL hardcoded** to `localhost:4001` — Not flexible for CI or staging environments.
13. **ESLint not using type-aware rules** — README itself notes this should be upgraded.

---

## Medium Priority (UX & Maintainability)

14. **No loading states on Archive/Delete buttons** — User gets no feedback while requests are in-flight.
15. **`window.confirm()` used for delete confirmation** — Poor UX; should be replaced with a modal dialog.
16. **No accessibility features** — Missing ARIA labels, no keyboard navigation on the habit table, color-only state indicators.
17. **Date labels in `HabitTable.tsx` are not localized** — Manual `month + date` string construction ignores browser locale.
18. **Toast notification is not reusable** — Hardcoded inside `useHabits`, cannot be used by other components.
19. **README.md is the default Vite template** — Doesn't describe the project, API endpoints, or how to run it.
20. **No API versioning** — Using `/api/habits` instead of `/api/v1/habits` makes future breaking changes harder to manage.

---

## Performance

21. **File I/O on every request** — `data.json` is read and fully rewritten on every mutation; no in-memory caching.
22. **Full file rewrite on every mutation** — Should use a patch or append-only approach for larger datasets.
23. **No pagination** — All habits fetched at once; will degrade as the dataset grows.
24. **`generatePastNDays` recalculates every render** — Should be wrapped in `useMemo`.
25. **No code splitting or lazy loading** — Entire frontend bundle is loaded upfront.
26. **Synchronous `JSON.parse` / `JSON.stringify` in server** — Blocks the Node.js event loop on large payloads.

---

## Low Priority / Nice to Have

27. **File-based storage won't scale** — Should migrate to SQLite or a proper database for production use.
28. **No data export/import feature** — Users cannot back up or migrate their habit data.
29. **No dark/light mode toggle** — Currently only dark mode is available.
30. **No pre-commit hooks** (Husky / lint-staged) — No automated code quality gate before commits.
31. **No Prettier configured** — Code formatting is not enforced across the project.
32. **No concurrent request tests** — A mutex exists in `app.js` but is never stress-tested.
33. **Comment in Chinese in `server/index.js`** — Inconsistent with the rest of the English codebase.

---

## Affected Files Summary

| File | Issues |
|------|--------|
| `src/api.ts` | No `res.ok` check, no error handling, hardcoded endpoint strings |
| `src/utils.ts` | Infinite loops in streak calc, no date validation |
| `src/hooks/useHabits.ts` | Error state never clears, no retry, hardcoded toast timeout |
| `src/components/HabitRow.tsx` | No loading states, `window.confirm`, no ARIA labels |
| `src/components/HabitTable.tsx` | Non-localized dates, no keyboard navigation |
| `src/components/HabitForm.tsx` | No frontend validation feedback |
| `server/app.js` | No auth, no rate limiting, CORS open, file I/O on every request |
| `server/index.js` | Chinese comment, hardcoded port default |
| `server/__tests__/api.test.js` | No concurrent/load tests |
| `package.json` | No Prettier, no pre-commit hooks, no frontend test runner |
| `vite.config.ts` | Hardcoded proxy URL |
| `eslint.config.js` | No type-aware lint rules |
| `README.md` | Still the default Vite template |
