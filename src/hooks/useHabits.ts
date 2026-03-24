import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Frequency, Habit, HabitLog } from '../types'
import { generateId, toggleDateInList } from '../utils'
import * as api from '../api'

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    api.fetchHabits()
      .then((data) => {
        setHabits(data.habits)
        setLogs(data.logs)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load habits. Is the server running?')
        setLoading(false)
      })
  }, [])

  const activeHabits = useMemo(
    () => habits.filter((h) => !h.archived),
    [habits],
  )

  function addHabit(name: string, frequency: Frequency, color: string) {
    const newHabit: Habit = {
      id: generateId(),
      name: name.trim(),
      frequency,
      color,
      createdAt: new Date().toISOString(),
      archived: false,
    }

    const prevHabits = habits
    setHabits((prev) => [newHabit, ...prev])

    api.createHabit(newHabit).catch(() => {
      setHabits(prevHabits)
      showToast('Failed to save habit. Please try again.')
    })
  }

  function toggle(habitId: string, date: string) {
    const prevLogs = logs
    setLogs((prev) => {
      const existing = prev[habitId] ?? []
      const updated = toggleDateInList(existing, date)
      return { ...prev, [habitId]: updated }
    })
    api.toggleLog(habitId, date).catch(() => {
      setLogs(prevLogs)
      showToast('Failed to update. Please try again.')
    })
  }

  function archive(habitId: string) {
    const prevHabits = habits
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, archived: true } : h)),
    )
    api.archiveHabit(habitId).catch(() => {
      setHabits(prevHabits)
      showToast('Failed to archive habit.')
    })
  }

  function remove(habitId: string) {
    const prevHabits = habits
    const prevLogs = logs
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
    setLogs((prev) => {
      const copy = { ...prev }
      delete copy[habitId]
      return copy
    })
    api.deleteHabit(habitId).catch(() => {
      setHabits(prevHabits)
      setLogs(prevLogs)
      showToast('Failed to delete habit.')
    })
  }

  return {
    habits: activeHabits,
    logs,
    loading,
    error,
    toast,
    addHabit,
    toggle,
    archive,
    remove,
  }
}
