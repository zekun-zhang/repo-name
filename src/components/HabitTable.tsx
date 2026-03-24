import type { Habit, HabitLog } from '../types'
import { HabitRow } from './HabitRow'

type Props = {
  habits: Habit[]
  logs: HabitLog
  past14Days: string[]
  today: string
  archivingId: string | null
  deletingId: string | null
  onToggle: (habitId: string, date: string) => void
  onArchive: (habitId: string) => void
  onDelete: (habitId: string) => void
}

export function HabitTable({
  habits,
  logs,
  past14Days,
  today,
  archivingId,
  deletingId,
  onToggle,
  onArchive,
  onDelete,
}: Props) {
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
        <span className="hint">Tap today to check in</span>
      </div>
      <div className="habits-table-wrapper">
        <table className="habits-table" aria-label="Habit tracker">
          <thead>
            <tr>
              <th scope="col">Habit</th>
              <th scope="col">Streak</th>
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
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                dates={logs[habit.id] ?? []}
                past14Days={past14Days}
                today={today}
                archivingId={archivingId}
                deletingId={deletingId}
                onToggle={onToggle}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
