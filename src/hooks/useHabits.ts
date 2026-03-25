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
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

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

  const activeHabits = useMemo(() => {
    let filtered = habits.filter((h) => !h.archived)
    if (categoryFilter) {
      filtered = filtered.filter((h) => h.category === categoryFilter)
    }
    return filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [habits, categoryFilter])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    habits.filter((h) => !h.archived).forEach((h) => {
      if (h.category) cats.add(h.category)
    })
    return Array.from(cats).sort()
  }, [habits])

  function addHabit(name: string, frequency: Frequency, color: string, category: string) {
    const maxOrder = habits.reduce((max, h) => Math.max(max, h.order ?? 0), -1)
    const newHabit: Habit = {
      id: generateId(),
      name: name.trim(),
      frequency,
      color,
      createdAt: new Date().toISOString(),
      archived: false,
      category: category.trim(),
      order: maxOrder + 1,
    }

    const prevHabits = habits
    setHabits((prev) => [...prev, newHabit])

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

  function reorder(fromIndex: number, toIndex: number) {
    const sorted = [...activeHabits]
    const [moved] = sorted.splice(fromIndex, 1)
    sorted.splice(toIndex, 0, moved)
    const orderedIds = sorted.map((h) => h.id)

    const prevHabits = habits
    setHabits((prev) => {
      const updated = [...prev]
      orderedIds.forEach((id, i) => {
        const idx = updated.findIndex((h) => h.id === id)
        if (idx !== -1) updated[idx] = { ...updated[idx], order: i }
      })
      return updated
    })

    api.reorderHabits(orderedIds).catch(() => {
      setHabits(prevHabits)
      showToast('Failed to reorder habits.')
    })
  }

  function updateCategory(habitId: string, category: string) {
    const prevHabits = habits
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, category } : h)),
    )
    api.updateHabit(habitId, { category }).catch(() => {
      setHabits(prevHabits)
      showToast('Failed to update category.')
    })
  }

  return {
    habits: activeHabits,
    logs,
    loading,
    error,
    toast,
    categories,
    categoryFilter,
    setCategoryFilter,
    addHabit,
    toggle,
    archive,
    remove,
    reorder,
    updateCategory,
  }
}
