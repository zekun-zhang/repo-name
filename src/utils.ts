import { MAX_STREAK_ITERATIONS } from './constants'
import type { Frequency } from './types'

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function toggleDateInList(list: string[], date: string): string[] {
  return list.includes(date) ? list.filter((d) => d !== date) : [...list, date]
}

function isRelevantDay(dateStr: string, frequency: Frequency): boolean {
  if (frequency === 'daily' || frequency === 'weekly') return true
  const day = new Date(dateStr + 'T00:00:00').getDay() // 0=Sun, 6=Sat
  if (frequency === 'weekdays') return day >= 1 && day <= 5
  if (frequency === 'weekends') return day === 0 || day === 6
  return true
}

export function calculateStreak(dates: string[], frequency: Frequency): number {
  if (!dates.length) return 0

  if (frequency === 'weekly') {
    return calculateWeeklyStreak(dates)
  }

  const dateSet = new Set(dates)
  const cursor = new Date(todayISO() + 'T00:00:00')
  let streak = 0

  for (let i = 0; i < MAX_STREAK_ITERATIONS; i++) {
    const dayStr = cursor.toISOString().slice(0, 10)
    const relevant = isRelevantDay(dayStr, frequency)
    if (relevant) {
      if (!dateSet.has(dayStr)) break
      streak++
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function calculateLongestStreak(dates: string[], frequency: Frequency): number {
  if (!dates.length) return 0
  if (frequency === 'weekly') return calculateLongestWeeklyStreak(dates)

  const relevant = [...dates].filter((d) => isRelevantDay(d, frequency)).sort()
  if (!relevant.length) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < relevant.length; i++) {
    if (areConsecutiveRelevantDays(relevant[i - 1], relevant[i], frequency)) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }

  return longest
}

function areConsecutiveRelevantDays(prev: string, curr: string, frequency: Frequency): boolean {
  const next = new Date(prev + 'T00:00:00')
  next.setDate(next.getDate() + 1)
  for (let i = 0; i < 10; i++) {
    if (isRelevantDay(next.toISOString().slice(0, 10), frequency)) break
    next.setDate(next.getDate() + 1)
  }
  return next.toISOString().slice(0, 10) === curr
}

export function calculateCompletionRate(
  dates: string[],
  windowDays: number,
  today: string,
  createdAt: string,
  frequency: Frequency = 'daily',
): number {
  if (frequency === 'weekly') {
    return calculateWeeklyCompletionRate(dates, windowDays, today, createdAt)
  }

  const createdDate = new Date(createdAt.slice(0, 10) + 'T00:00:00')
  const datesSet = new Set(dates)
  const cursor = new Date(today + 'T00:00:00')
  let relevant = 0
  let completed = 0

  for (let i = 0; i < windowDays; i++) {
    if (cursor < createdDate) break
    const dayStr = cursor.toISOString().slice(0, 10)
    if (isRelevantDay(dayStr, frequency)) {
      relevant++
      if (datesSet.has(dayStr)) completed++
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  if (relevant === 0) return 0
  return Math.round((completed / relevant) * 100)
}

function calculateWeeklyCompletionRate(
  dates: string[],
  windowDays: number,
  today: string,
  createdAt: string,
): number {
  const createdDate = new Date(createdAt.slice(0, 10) + 'T00:00:00')
  const weeksSet = new Set(dates.map(getISOWeek))
  const cursor = new Date(today + 'T00:00:00')
  const seenWeeks = new Set<string>()
  let totalWeeks = 0
  let completedWeeks = 0

  for (let i = 0; i < windowDays; i++) {
    if (cursor < createdDate) break
    const dayStr = cursor.toISOString().slice(0, 10)
    const week = getISOWeek(dayStr)
    if (!seenWeeks.has(week)) {
      seenWeeks.add(week)
      totalWeeks++
      if (weeksSet.has(week)) completedWeeks++
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  if (totalWeeks === 0) return 0
  return Math.round((completedWeeks / totalWeeks) * 100)
}

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${weekNo}`
}

function calculateWeeklyStreak(dates: string[]): number {
  if (!dates.length) return 0
  const weeks = new Set(dates.map(getISOWeek))
  const cursor = new Date(todayISO())
  let streak = 0
  for (let i = 0; i < MAX_STREAK_ITERATIONS; i++) {
    const weekKey = getISOWeek(cursor.toISOString().slice(0, 10))
    if (!weeks.has(weekKey)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 7)
  }
  return streak
}

function calculateLongestWeeklyStreak(dates: string[]): number {
  if (!dates.length) return 0
  const weeks = [...new Set(dates.map(getISOWeek))].sort()
  if (!weeks.length) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < weeks.length; i++) {
    const [prevYear, prevWeekStr] = weeks[i - 1].split('-W')
    const [currYear, currWeekStr] = weeks[i].split('-W')
    const prevNum = parseInt(prevYear) * 53 + parseInt(prevWeekStr)
    const currNum = parseInt(currYear) * 53 + parseInt(currWeekStr)
    if (currNum - prevNum === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }

  return longest
}

export function generatePastNDays(n: number, today: string): string[] {
  const days: string[] = []
  const date = new Date(today)
  for (let i = 0; i < n; i += 1) {
    days.unshift(date.toISOString().slice(0, 10))
    date.setDate(date.getDate() - 1)
  }
  return days
}
