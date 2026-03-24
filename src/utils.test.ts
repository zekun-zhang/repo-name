import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  generateId,
  todayISO,
  toggleDateInList,
  calculateStreak,
  generatePastNDays,
} from './utils'

// ── generateId ──────────────────────────────────────────────────────────────

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string')
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId))
    expect(ids.size).toBe(100)
  })
})

// ── todayISO ─────────────────────────────────────────────────────────────────

describe('todayISO', () => {
  it('returns a string matching YYYY-MM-DD', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('matches the real date', () => {
    const expected = new Date().toISOString().slice(0, 10)
    expect(todayISO()).toBe(expected)
  })
})

// ── toggleDateInList ─────────────────────────────────────────────────────────

describe('toggleDateInList', () => {
  it('adds a date that is not in the list', () => {
    expect(toggleDateInList([], '2026-01-01')).toEqual(['2026-01-01'])
    expect(toggleDateInList(['2026-01-02'], '2026-01-01')).toContain('2026-01-01')
  })

  it('removes a date that is already in the list', () => {
    expect(toggleDateInList(['2026-01-01'], '2026-01-01')).toEqual([])
    expect(toggleDateInList(['2026-01-01', '2026-01-02'], '2026-01-01')).toEqual(['2026-01-02'])
  })

  it('does not mutate the original list', () => {
    const original = ['2026-01-01']
    toggleDateInList(original, '2026-01-02')
    expect(original).toEqual(['2026-01-01'])
  })
})

// ── calculateStreak (daily) ──────────────────────────────────────────────────

describe('calculateStreak – daily', () => {
  const TODAY = '2026-03-24'

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(TODAY))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('returns 0 for empty dates', () => {
    expect(calculateStreak([], 'daily')).toBe(0)
  })

  it('returns 1 when only today is logged', () => {
    expect(calculateStreak([TODAY], 'daily')).toBe(1)
  })

  it('counts consecutive days ending today', () => {
    const dates = ['2026-03-22', '2026-03-23', TODAY]
    expect(calculateStreak(dates, 'daily')).toBe(3)
  })

  it('resets when there is a gap', () => {
    // Today and two days ago — yesterday is missing
    const dates = ['2026-03-22', TODAY]
    expect(calculateStreak(dates, 'daily')).toBe(1)
  })

  it('returns 0 when the most recent date is before today', () => {
    expect(calculateStreak(['2026-03-20', '2026-03-21'], 'daily')).toBe(0)
  })

  it('handles unsorted input', () => {
    const dates = [TODAY, '2026-03-23', '2026-03-22']
    expect(calculateStreak(dates, 'daily')).toBe(3)
  })
})

// ── calculateStreak (weekly) ─────────────────────────────────────────────────

describe('calculateStreak – weekly', () => {
  const TODAY = '2026-03-24' // Tuesday, week 13

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(TODAY))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('returns 0 for empty dates', () => {
    expect(calculateStreak([], 'weekly')).toBe(0)
  })

  it('returns 1 when a date in the current week is logged', () => {
    expect(calculateStreak(['2026-03-23'], 'weekly')).toBe(1)
  })

  it('counts consecutive weeks', () => {
    // This week + last week
    const dates = ['2026-03-16', TODAY]
    expect(calculateStreak(dates, 'weekly')).toBe(2)
  })

  it('resets when a week is skipped', () => {
    // This week and two weeks ago — last week is missing
    const dates = ['2026-03-09', TODAY]
    expect(calculateStreak(dates, 'weekly')).toBe(1)
  })
})

// ── generatePastNDays ────────────────────────────────────────────────────────

describe('generatePastNDays', () => {
  it('returns exactly n dates', () => {
    expect(generatePastNDays(14, '2026-03-24')).toHaveLength(14)
    expect(generatePastNDays(1, '2026-03-24')).toHaveLength(1)
  })

  it('ends with today', () => {
    const days = generatePastNDays(14, '2026-03-24')
    expect(days[days.length - 1]).toBe('2026-03-24')
  })

  it('starts with (today - n + 1)', () => {
    const days = generatePastNDays(14, '2026-03-24')
    expect(days[0]).toBe('2026-03-11')
  })

  it('returns dates in ascending order', () => {
    const days = generatePastNDays(5, '2026-03-24')
    for (let i = 1; i < days.length; i++) {
      expect(days[i] > days[i - 1]).toBe(true)
    }
  })

  it('handles a single day', () => {
    expect(generatePastNDays(1, '2026-03-24')).toEqual(['2026-03-24'])
  })
})
