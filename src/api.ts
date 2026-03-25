import type { Habit, HabitLog, LogNotes } from './types'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? ''

async function checkResponse(res: Response): Promise<Response> {
  if (!res.ok) {
    const body: { error?: string } = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed with status ${res.status}`)
  }
  return res
}

export async function fetchHabits(): Promise<{ habits: Habit[]; logs: HabitLog; logNotes: LogNotes }> {
  const res = await fetch(`${API_BASE}/api/habits`)
  await checkResponse(res)
  return res.json()
}

export async function createHabit(habit: Habit): Promise<Habit> {
  const res = await fetch(`${API_BASE}/api/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habit),
  })
  await checkResponse(res)
  return res.json()
}

export async function toggleLog(habitId: string, date: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/logs/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ habitId, date }),
  })
  await checkResponse(res)
}

export async function archiveHabit(habitId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/habits/${habitId}/archive`, {
    method: 'POST',
  })
  await checkResponse(res)
}

export async function deleteHabit(habitId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/habits/${habitId}`, {
    method: 'DELETE',
  })
  await checkResponse(res)
}

export async function reorderHabits(orderedIds: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/api/habits/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  })
  await checkResponse(res)
}

export async function saveLogNote(habitId: string, date: string, note: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/logs/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ habitId, date, note }),
  })
  await checkResponse(res)
}

export function getExportCsvUrl(): string {
  return `${API_BASE}/api/export/csv`
}
