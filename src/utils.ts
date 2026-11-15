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

export function calculateStreak(dates: string[], frequency: 'daily' | 'weekly'): number {
  if (!dates.length) return 0

  if (frequency === 'weekly') {
    return calculateWeeklyStreak(dates)
  }

  const sorted = [...dates].sort()
  const cursor = new Date(todayISO())
  let streak = 0

  for (;;) {
    const dayStr = cursor.toISOString().slice(0, 10)
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

export function generatePastNDays(n: number, today: string): string[] {
  const days: string[] = []
  const date = new Date(today)
  for (let i = 0; i < n; i += 1) {
    days.unshift(date.toISOString().slice(0, 10))
    date.setDate(date.getDate() - 1)
  }
  return days
}

export function calculateMomentum(dates: string[]): number {
  if (!dates.length) return 0
  const today = new Date(todayISO())
  const dateSet = new Set(dates)
  let weightedSum = 0
  let weightTotal = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const weight = Math.pow(0.92, i)
    weightTotal += weight
    if (dateSet.has(d.toISOString().slice(0, 10))) {
      weightedSum += weight
    }
  }
  return weightTotal > 0 ? weightedSum / weightTotal : 0
}

export function getHabitAge(createdAt: string): { label: string; tier: number } {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const days = Math.max(0, Math.floor(diffMs / 86400000))

  if (days >= 365) {
    const years = Math.floor(days / 365)
    return { label: `${years}y`, tier: 4 }
  }
  if (days >= 90) {
    const months = Math.floor(days / 30)
    return { label: `${months}mo`, tier: 3 }
  }
  if (days >= 30) {
    const months = Math.floor(days / 30)
    return { label: `${months}mo`, tier: 2 }
  }
  if (days >= 7) {
    const weeks = Math.floor(days / 7)
    return { label: `${weeks}w`, tier: 1 }
  }
  return { label: `${days}d`, tier: 0 }
}
