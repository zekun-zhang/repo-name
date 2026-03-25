import type { Habit } from '../types'
import { calculateStreak } from '../utils'

type Props = {
  habit: Habit
  dates: string[]
  past14Days: string[]
  today: string
  index: number
  onToggle: (habitId: string, date: string) => void
  onArchive: (habitId: string) => void
  onDelete: (habitId: string) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (index: number) => void
}

export function HabitRow({
  habit,
  dates,
  past14Days,
  today,
  index,
  onToggle,
  onArchive,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: Props) {
  const streak = calculateStreak(dates, habit.frequency)
  const streakLabel =
    habit.frequency === 'weekly'
      ? `${streak} week${streak === 1 ? '' : 's'}`
      : `${streak} day${streak === 1 ? '' : 's'}`

  return (
    <tr
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
    >
      <td>
        <span className="drag-handle" title="Drag to reorder">&#x2630;</span>
      </td>
      <td>
        <div className="habit-label">
          <span
            className="habit-color"
            style={{ backgroundColor: habit.color }}
          />
          <div>
            <div className="habit-name">{habit.name}</div>
            <div className="habit-meta">
              {habit.frequency === 'daily' ? 'Daily' : 'Weekly goal'}
              {habit.category && <span className="category-badge">{habit.category}</span>}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className="streak-pill">{streakLabel}</span>
      </td>
      {past14Days.map((d) => {
        const checked = dates.includes(d)
        const isToday = d === today
        return (
          <td key={d}>
            <button
              type="button"
              className={[
                'day-cell',
                checked ? 'day-cell-checked' : '',
                isToday ? 'day-cell-today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onToggle(habit.id, d)}
              aria-pressed={checked}
            >
              {checked ? '✓' : ''}
            </button>
          </td>
        )
      })}
      <td>
        <div className="row-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => onArchive(habit.id)}
          >
            Archive
          </button>
          <button
            type="button"
            className="ghost-button danger"
            onClick={() => onDelete(habit.id)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
