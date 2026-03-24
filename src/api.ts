import type { Habit, HabitLog } from './types'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? ''

export async function fetchHabits(): Promise<{ habits: Habit[]; logs: HabitLog }> {
  const res = await fetch(`${API_BASE}/api/habits`)
  return res.json()
}

export async function createHabit(habit: Habit): Promise<Habit> {
  const res = await fetch(`${API_BASE}/api/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habit),
  })
  return res.json()
}

export async function toggleLog(habitId: string, date: string): Promise<void> {
  await fetch(`${API_BASE}/api/logs/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ habitId, date }),
  })
}

export async function archiveHabit(habitId: string): Promise<void> {
  await fetch(`${API_BASE}/api/habits/${habitId}/archive`, {
    method: 'POST',
  })
}

export async function deleteHabit(habitId: string): Promise<void> {
  await fetch(`${API_BASE}/api/habits/${habitId}`, {
    method: 'DELETE',
  })
}
