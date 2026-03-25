import { useEffect, useState } from 'react'
import './App.css'
import { useHabits } from './hooks/useHabits'
import { HabitForm } from './components/HabitForm'
import { HabitTable } from './components/HabitTable'
import { todayISO, generatePastNDays } from './utils'

function getInitialTheme(): 'dark' | 'light' {
  const stored = localStorage.getItem('habit-garden-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function App() {
  const {
    habits,
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
  } = useHabits()

  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('habit-garden-theme', theme)
  }, [theme])

  const today = todayISO()
  const past14Days = generatePastNDays(14, today)

  function handleDelete(habitId: string) {
    if (!window.confirm('Delete this habit and its history?')) return
    remove(habitId)
  }

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  if (loading) {
    return (
      <div className="app-root">
        <div className="loading-state">Loading habits...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-root">
        <div className="error-state">
          <p>{error}</p>
          <button
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-root">
      {toast && <div className="toast">{toast}</div>}

      <header className="app-header">
        <div>
          <h1>Habit Garden</h1>
          <p>Grow tiny daily habits into big changes.</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="today-pill">{today}</div>
        </div>
      </header>

      <main className="layout">
        <HabitForm onAdd={addHabit} categories={categories} />
        <HabitTable
          habits={habits}
          logs={logs}
          past14Days={past14Days}
          today={today}
          categories={categories}
          categoryFilter={categoryFilter}
          onCategoryFilter={setCategoryFilter}
          onToggle={toggle}
          onArchive={archive}
          onDelete={handleDelete}
          onReorder={reorder}
        />
      </main>
    </div>
  )
}

export default App
