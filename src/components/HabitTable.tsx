import { useMemo, useState, useRef } from 'react'
import type { Habit, HabitLog, LogNotes } from '../types'
import { HabitRow } from './HabitRow'
import { HabitHeatmap } from './HabitHeatmap'
import { getExportCsvUrl } from '../api'

type Props = {
  habits: Habit[]
  logs: HabitLog
  logNotes: LogNotes
  past14Days: string[]
  today: string
  archivingId: string | null
  deletingId: string | null
  onToggle: (habitId: string, date: string) => void
  onArchive: (habitId: string) => void
  onDelete: (habitId: string) => void
  onSaveNote: (habitId: string, date: string, note: string) => void
  onReorder: (orderedIds: string[]) => void
}

export function HabitTable({
  habits,
  logs,
  logNotes,
  past14Days,
  today,
  archivingId,
  deletingId,
  onToggle,
  onArchive,
  onDelete,
  onSaveNote,
  onReorder,
}: Props) {
  const [view, setView] = useState<'table' | 'heatmap'>('table')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragOrderRef = useRef<string[]>([])

  const categories = useMemo(() => {
    const cats = new Set(habits.map((h) => h.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [habits])

  const filteredHabits = useMemo(
    () => (filterCategory ? habits.filter((h) => h.category === filterCategory) : habits),
    [habits, filterCategory],
  )

  function handleDragStart(id: string) {
    setDraggedId(id)
    dragOrderRef.current = habits.map((h) => h.id)
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (draggedId && draggedId !== id) {
      setDragOverId(id)
    }
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    const order = [...dragOrderRef.current]
    const fromIdx = order.indexOf(draggedId)
    const toIdx = order.indexOf(targetId)
    order.splice(fromIdx, 1)
    order.splice(toIdx, 0, draggedId)
    onReorder(order)
    setDraggedId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverId(null)
  }

  if (habits.length === 0) {
    return (
      <section className="card habits-card">
        <div className="habits-header">
          <h2>Your habits</h2>
        </div>
        <p className="empty-state">
          No habits yet. Create your first one on the left.
        </p>
      </section>
    )
  }

  return (
    <section className="card habits-card">
      <div className="habits-header">
        <h2>Your habits</h2>
        <div className="habits-header-actions">
          {categories.length > 0 && (
            <select
              className="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
          <div className="view-toggle" role="group" aria-label="View">
            <button
              type="button"
              className={`view-btn${view === 'table' ? ' view-btn-active' : ''}`}
              onClick={() => setView('table')}
              aria-pressed={view === 'table'}
            >
              Table
            </button>
            <button
              type="button"
              className={`view-btn${view === 'heatmap' ? ' view-btn-active' : ''}`}
              onClick={() => setView('heatmap')}
              aria-pressed={view === 'heatmap'}
            >
              Heatmap
            </button>
          </div>
          <a
            href={getExportCsvUrl()}
            download="habit-garden-export.csv"
            className="ghost-button"
            aria-label="Export habits as CSV"
          >
            Export CSV
          </a>
        </div>
      </div>

      {view === 'heatmap' ? (
        <HabitHeatmap habits={filteredHabits} logs={logs} />
      ) : (
        <div className="habits-table-wrapper">
          <table className="habits-table" aria-label="Habit tracker">
            <thead>
              <tr>
                <th scope="col">Habit</th>
                <th scope="col">Streak / Rate</th>
                <th scope="col" colSpan={past14Days.length}>Last 14 days</th>
                <th scope="col" />
              </tr>
              <tr>
                <th />
                <th />
                {past14Days.map((d) => {
                  const dateObj = new Date(d + 'T00:00:00')
                  const label = dateObj.toLocaleDateString(undefined, {
                    month: 'numeric',
                    day: 'numeric',
                  })
                  return (
                    <th key={d} scope="col" aria-label={d}>
                      {label}
                    </th>
                  )
                })}
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredHabits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  dates={logs[habit.id] ?? []}
                  logNotes={logNotes}
                  past14Days={past14Days}
                  today={today}
                  archivingId={archivingId}
                  deletingId={deletingId}
                  onToggle={onToggle}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  onSaveNote={onSaveNote}
                  isDragging={draggedId === habit.id}
                  isDragOver={dragOverId === habit.id}
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; handleDragStart(habit.id) }}
                  onDragOver={(e) => handleDragOver(e, habit.id)}
                  onDrop={() => handleDrop(habit.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
