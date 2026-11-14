import { useState } from 'react'
import type { Frequency, Habit } from '../types'
import { calculateStreak, getHabitAge } from '../utils'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

function isDayActive(dateStr: string, activeDays?: number[]): boolean {
  if (!activeDays) return true
  const dayOfWeek = new Date(dateStr).getDay()
  return activeDays.includes(dayOfWeek)
}

type Props = {
  habit: Habit
  dates: string[]
  past14Days: string[]
  today: string
  onToggle: (habitId: string, date: string) => void
  onEdit: (
    habitId: string,
    fields: { name?: string; frequency?: Frequency; color?: string; activeDays?: number[] },
  ) => void
  onArchive: (habitId: string) => void
  onDelete: (habitId: string) => void
}

export function HabitRow({
  habit,
  dates,
  past14Days,
  today,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(habit.name)
  const [editFrequency, setEditFrequency] = useState<Frequency>(habit.frequency)
  const [editColor, setEditColor] = useState(habit.color)
  const [editActiveDays, setEditActiveDays] = useState<number[]>(habit.activeDays ?? ALL_DAYS)

  const streak = calculateStreak(dates, habit.frequency, habit.activeDays)
  const age = getHabitAge(habit.createdAt)
  const streakLabel =
    habit.frequency === 'weekly'
      ? `${streak} week${streak === 1 ? '' : 's'}`
      : `${streak} day${streak === 1 ? '' : 's'}`

  function toggleEditDay(day: number) {
    setEditActiveDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev
        return prev.filter((d) => d !== day)
      }
      return [...prev, day].sort()
    })
  }

  function startEdit() {
    setEditName(habit.name)
    setEditFrequency(habit.frequency)
    setEditColor(habit.color)
    setEditActiveDays(habit.activeDays ?? ALL_DAYS)
    setEditing(true)
  }

  function saveEdit() {
    if (!editName.trim()) return
    const activeDays =
      editFrequency === 'daily' && editActiveDays.length < 7
        ? editActiveDays
        : undefined
    onEdit(habit.id, {
      name: editName.trim(),
      frequency: editFrequency,
      color: editColor,
      activeDays,
    })
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={past14Days.length + 3}>
          <div className="edit-row">
            <input
              type="text"
              className="edit-name-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit()
                if (e.key === 'Escape') cancelEdit()
              }}
              autoFocus
            />
            <select
              className="edit-frequency-select"
              value={editFrequency}
              onChange={(e) => setEditFrequency(e.target.value as Frequency)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <input
              type="color"
              className="edit-color-input"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
            />
            {editFrequency === 'daily' && (
              <div className="day-picker">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`day-picker-btn${editActiveDays.includes(i) ? ' day-picker-btn-active' : ''}`}
                    onClick={() => toggleEditDay(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="ghost-button save-btn"
              onClick={saveEdit}
            >
              Save
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr>
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
              {habit.activeDays && (
                <span className="active-days-hint">
                  {' '}{habit.activeDays.map((d) => DAY_LABELS[d]).join('')}
                </span>
              )}
            </div>
          </div>
          <span className={`age-badge age-badge-${age.tier}`}>{age.label}</span>
        </div>
      </td>
      <td>
        <span className="streak-pill">{streakLabel}</span>
      </td>
      {past14Days.map((d) => {
        const checked = dates.includes(d)
        const isToday = d === today
        const active = isDayActive(d, habit.activeDays)
        if (!active) {
          return (
            <td key={d}>
              <div className="day-cell day-cell-inactive" />
            </td>
          )
        }
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
            onClick={startEdit}
          >
            Edit
          </button>
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
