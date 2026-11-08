import './App.css'
import { useHabits } from './hooks/useHabits'
import { HabitForm } from './components/HabitForm'
import { HabitTable } from './components/HabitTable'
import { todayISO, generatePastNDays } from './utils'

function App() {
  const {
    habits,
    archivedHabits,
    logs,
    loading,
    error,
    toast,
    addHabit,
    editHabit,
    toggle,
    archive,
    unarchive,
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
        <div className="habits-column">
          <HabitTable
            habits={habits}
            logs={logs}
            past14Days={past14Days}
            today={today}
            onToggle={toggle}
            onEdit={editHabit}
            onArchive={archive}
            onDelete={handleDelete}
          />
          {archivedHabits.length > 0 && (
            <section className="card archived-card">
              <h2>Archived</h2>
              <ul className="archived-list">
                {archivedHabits.map((h) => (
                  <li key={h.id} className="archived-item">
                    <span
                      className="habit-color"
                      style={{ backgroundColor: h.color }}
                    />
                    <span className="archived-name">{h.name}</span>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => unarchive(h.id)}
                    >
                      Unarchive
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
