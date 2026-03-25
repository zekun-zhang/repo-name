import { useRef } from 'react'
import type { Habit, HabitLog } from '../types'
import { HabitRow } from './HabitRow'

type Props = {
  habits: Habit[]
  logs: HabitLog
  past14Days: string[]
  today: string
  categories: string[]
  categoryFilter: string | null
  onCategoryFilter: (cat: string | null) => void
  onToggle: (habitId: string, date: string) => void
  onArchive: (habitId: string) => void
  onDelete: (habitId: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function HabitTable({
  habits,
  logs,
  past14Days,
  today,
  categories,
  categoryFilter,
  onCategoryFilter,
  onToggle,
  onArchive,
  onDelete,
  onReorder,
}: Props) {
  const dragIdx = useRef<number | null>(null)

  function handleDragStart(index: number) {
    dragIdx.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(index: number) {
    if (dragIdx.current !== null && dragIdx.current !== index) {
      onReorder(dragIdx.current, index)
    }
    dragIdx.current = null
  }

  const showFilters = categories.length > 0

  if (habits.length === 0 && !categoryFilter) {
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
        <span className="hint">Drag to reorder &middot; Tap today to check in</span>
      </div>

      {showFilters && (
        <div className="category-filters">
          <button
            type="button"
            className={`filter-pill ${categoryFilter === null ? 'filter-pill-active' : ''}`}
            onClick={() => onCategoryFilter(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-pill ${categoryFilter === cat ? 'filter-pill-active' : ''}`}
              onClick={() => onCategoryFilter(categoryFilter === cat ? null : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {habits.length === 0 && categoryFilter ? (
        <p className="empty-state">No habits in this category.</p>
      ) : (
        <div className="habits-table-wrapper">
          <table className="habits-table">
            <thead>
              <tr>
                <th />
                <th>Habit</th>
                <th>Streak</th>
                <th colSpan={past14Days.length}>Last 14 days</th>
                <th />
              </tr>
              <tr>
                <th />
                <th />
                <th />
                {past14Days.map((d) => {
                  const dateObj = new Date(d)
                  const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
                  return <th key={d}>{label}</th>
                })}
                <th />
              </tr>
            </thead>
            <tbody>
              {habits.map((habit, index) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  dates={logs[habit.id] ?? []}
                  past14Days={past14Days}
                  today={today}
                  index={index}
                  onToggle={onToggle}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
