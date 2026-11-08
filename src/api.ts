import type { Habit, HabitLog } from './types'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? ''

export async function fetchHabits(): Promise<{ habits: Habit[]; logs: HabitLog }> {
  const res = await fetch(`${API_BASE}/api/habits`)
  if (!res.ok) throw new Error(`Failed to fetch habits: ${res.statusText}`)
  return res.json()
}

export async function createHabit(habit: Habit): Promise<Habit> {
  const res = await fetch(`${API_BASE}/api/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habit),
  })
  if (!res.ok) throw new Error(`Failed to create habit: ${res.statusText}`)
  return res.json()
}

export async function updateHabit(
  habitId: string,
  fields: { name?: string; frequency?: string; color?: string },
): Promise<Habit> {
  const res = await fetch(`${API_BASE}/api/habits/${habitId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error(`Failed to update habit: ${res.statusText}`)
  return res.json()
}

export async function toggleLog(habitId: string, date: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/logs/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ habitId, date }),
  })
  if (!res.ok) throw new Error(`Failed to toggle log: ${res.statusText}`)
}

export async function archiveHabit(habitId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/habits/${habitId}/archive`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Failed to archive habit: ${res.statusText}`)
}

export async function unarchiveHabit(habitId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/habits/${habitId}/unarchive`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Failed to unarchive habit: ${res.statusText}`)
}

export async function deleteHabit(habitId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/habits/${habitId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Failed to delete habit: ${res.statusText}`)
}
