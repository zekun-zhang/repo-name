import type { Habit } from '../types'
import { calculateStreak } from '../utils'

type Props = {
  habit: Habit
  dates: string[]
  past14Days: string[]
  today: string
  archivingId: string | null
  deletingId: string | null
  onToggle: (habitId: string, date: string) => void
  onArchive: (habitId: string) => void
  onDelete: (habitId: string) => void
}

export function HabitRow({
  habit,
  dates,
  past14Days,
  today,
  archivingId,
  deletingId,
  onToggle,
  onArchive,
  onDelete,
}: Props) {
  const streak = calculateStreak(dates, habit.frequency)
  const streakLabel =
    habit.frequency === 'weekly'
      ? `${streak} week${streak === 1 ? '' : 's'}`
      : `${streak} day${streak === 1 ? '' : 's'}`

  const isArchiving = archivingId === habit.id
  const isDeleting = deletingId === habit.id

  return (
    <tr>
      <td>
        <div className="habit-label">
          <span
            className="habit-color"
            style={{ backgroundColor: habit.color }}
            aria-hidden="true"
          />
          <div>
            <div className="habit-name">{habit.name}</div>
            <div className="habit-meta">
              {habit.frequency === 'daily' ? 'Daily' : 'Weekly goal'}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span
          className="streak-pill"
          role="status"
          aria-label={`Current streak: ${streakLabel}`}
        >
          {streakLabel}
        </span>
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
              aria-label={`${habit.name} on ${d}${checked ? ', completed' : ''}`}
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
            disabled={isArchiving || isDeleting}
            aria-label={`Archive ${habit.name}`}
            aria-busy={isArchiving}
          >
            {isArchiving ? 'Archiving…' : 'Archive'}
          </button>
          <button
            type="button"
            className="ghost-button danger"
            onClick={() => onDelete(habit.id)}
            disabled={isArchiving || isDeleting}
            aria-label={`Delete ${habit.name}`}
            aria-busy={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  )
}
