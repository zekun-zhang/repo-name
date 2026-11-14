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

export function calculateStreak(dates: string[], frequency: 'daily' | 'weekly', activeDays?: number[]): number {
  if (!dates.length) return 0

  if (frequency === 'weekly') {
    return calculateWeeklyStreak(dates)
  }

  const sorted = [...dates].sort()
  const cursor = new Date(todayISO())
  let streak = 0

  for (;;) {
    const dayStr = cursor.toISOString().slice(0, 10)
    if (activeDays && !activeDays.includes(cursor.getDay())) {
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    if (!sorted.includes(dayStr)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
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

  for (;;) {
    const weekKey = getISOWeek(cursor.toISOString().slice(0, 10))
    if (!weeks.has(weekKey)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 7)
  }

  return streak
}

export function getHabitAge(createdAt: string): { label: string; tier: 'seedling' | 'sprout' | 'growing' | 'rooted' } {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  let label: string
  let tier: 'seedling' | 'sprout' | 'growing' | 'rooted'

  if (days < 7) {
    label = `${days}d`
    tier = 'seedling'
  } else if (days < 30) {
    const weeks = Math.floor(days / 7)
    label = `${weeks}w`
    tier = 'seedling'
  } else if (days < 90) {
    const months = Math.floor(days / 30)
    label = `${months}mo`
    tier = 'sprout'
  } else if (days < 365) {
    const months = Math.floor(days / 30)
    label = `${months}mo`
    tier = 'growing'
  } else {
    const years = Math.floor(days / 365)
    label = `${years}y`
    tier = 'rooted'
  }

  return { label, tier }
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
