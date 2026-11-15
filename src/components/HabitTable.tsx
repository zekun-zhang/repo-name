import type { Frequency, Habit, HabitLog } from '../types'
import { HabitRow } from './HabitRow'

const STARTER_HABITS = [
  { name: 'Drink water', color: '#3b82f6' },
  { name: 'Read 10 pages', color: '#8b5cf6' },
  { name: '10 min walk', color: '#22c55e' },
  { name: 'Meditate 5 min', color: '#f59e0b' },
]

type Props = {
  habits: Habit[]
  logs: HabitLog
  past14Days: string[]
  today: string
  onToggle: (habitId: string, date: string) => void
  onEdit: (
    habitId: string,
    fields: { name?: string; frequency?: Frequency; color?: string },
  ) => void
  onArchive: (habitId: string) => void
  onDelete: (habitId: string) => void
  onPrefill?: (name: string, color: string) => void
}

export function HabitTable({
  habits,
  logs,
  past14Days,
  today,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
  onPrefill,
}: Props) {
  if (habits.length === 0) {
    return (
      <section className="card habits-card">
        <div className="habits-header">
          <h2>Welcome to Habit Garden</h2>
        </div>
        <p className="onboarding-text">
          Grow tiny daily habits into lasting changes. Start small — one habit is better than five.
        </p>
        <div className="starter-chips">
          {STARTER_HABITS.map((s) => (
            <button
              key={s.name}
              type="button"
              className="starter-chip"
              style={{ borderColor: s.color, color: s.color }}
              onClick={() => onPrefill?.(s.name, s.color)}
            >
              <span className="starter-dot" style={{ backgroundColor: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
        <p className="onboarding-hint">
          Tap a suggestion or create your own on the left.
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
        <table className="habits-table">
          <thead>
            <tr>
              <th>Habit</th>
              <th>Streak / Momentum</th>
              <th colSpan={past14Days.length}>Last 14 days</th>
              <th />
            </tr>
            <tr>
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
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                dates={logs[habit.id] ?? []}
                past14Days={past14Days}
                today={today}
                onToggle={onToggle}
                onEdit={onEdit}
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
