import './App.css'
import { useHabits } from './hooks/useHabits'
import { HabitForm } from './components/HabitForm'
import { HabitTable } from './components/HabitTable'
import { todayISO, generatePastNDays } from './utils'

function App() {
  const {
    habits,
    logs,
    loading,
    error,
    toast,
    addHabit,
    toggle,
    archive,
    remove,
  } = useHabits()

  const today = todayISO()
  const past14Days = generatePastNDays(14, today)

  function handleDelete(habitId: string) {
    if (!window.confirm('Delete this habit and its history?')) return
    remove(habitId)
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
        <div className="today-pill">{today}</div>
      </header>

      <main className="layout">
        <HabitForm onAdd={addHabit} />
        <HabitTable
          habits={habits}
          logs={logs}
          past14Days={past14Days}
          today={today}
          onToggle={toggle}
          onArchive={archive}
          onDelete={handleDelete}
        />
      </main>
    </div>
  )
}

export default App
