import { useMemo, useState } from 'react'
import './App.css'
import { useHabits } from './hooks/useHabits'
import { HabitForm } from './components/HabitForm'
import { HabitTable } from './components/HabitTable'
import { ConfirmModal } from './components/ConfirmModal'
import { todayISO, generatePastNDays } from './utils'
import { DAYS_TO_SHOW } from './constants'

function App() {
  const {
    habits,
    logs,
    loading,
    error,
    toast,
    archivingId,
    deletingId,
    addHabit,
    toggle,
    archive,
    remove,
    retryLoad,
  } = useHabits()

  const today = todayISO()
  const past14Days = useMemo(() => generatePastNDays(DAYS_TO_SHOW, today), [today])

  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  function handleDelete(habitId: string) {
    setPendingDelete(habitId)
  }

  function confirmDelete() {
    if (pendingDelete) {
      remove(pendingDelete)
      setPendingDelete(null)
    }
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
          <button className="primary-button" onClick={retryLoad}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-root">
      {toast && (
        <div className="toast" role="alert" aria-live="polite">
          {toast}
        </div>
      )}

      {pendingDelete && (
        <ConfirmModal
          message="Delete this habit and all its history? This cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <header className="app-header">
        <div>
          <h1>Habit Garden</h1>
          <p>Grow tiny daily habits into big changes.</p>
        </div>
        <div className="today-pill" aria-label={`Today is ${today}`}>{today}</div>
      </header>

      <main className="layout">
        <HabitForm onAdd={addHabit} />
        <HabitTable
          habits={habits}
          logs={logs}
          past14Days={past14Days}
          today={today}
          archivingId={archivingId}
          deletingId={deletingId}
          onToggle={toggle}
          onArchive={archive}
          onDelete={handleDelete}
        />
      </main>
    </div>
  )
}

export default App
