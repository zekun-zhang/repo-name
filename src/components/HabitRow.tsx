import { useState } from 'react'
import type { Habit, LogNotes } from '../types'
import { calculateStreak, calculateLongestStreak, calculateCompletionRate } from '../utils'
import { COMPLETION_WINDOW_SHORT, COMPLETION_WINDOW_LONG } from '../constants'
import { NoteModal } from './NoteModal'

type Props = {
  habit: Habit
  dates: string[]
  logNotes: LogNotes
  past14Days: string[]
  today: string
  archivingId: string | null
  deletingId: string | null
  onToggle: (habitId: string, date: string) => void
  onArchive: (habitId: string) => void
  onDelete: (habitId: string) => void
  onSaveNote: (habitId: string, date: string, note: string) => void
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: () => void
}

export function HabitRow({
  habit,
  dates,
  logNotes,
  past14Days,
  today,
  archivingId,
  deletingId,
  onToggle,
  onArchive,
  onDelete,
  onSaveNote,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  const [noteTarget, setNoteTarget] = useState<string | null>(null) // date string

  const streak = calculateStreak(dates, habit.frequency)
  const longestStreak = calculateLongestStreak(dates, habit.frequency)
  const rate7 = calculateCompletionRate(dates, COMPLETION_WINDOW_SHORT, today, habit.createdAt, habit.frequency)
  const rate30 = calculateCompletionRate(dates, COMPLETION_WINDOW_LONG, today, habit.createdAt, habit.frequency)

  const unit = habit.frequency === 'weekly' ? 'wk' : habit.frequency === 'weekdays' ? 'wd' : habit.frequency === 'weekends' ? 'we' : 'd'
  const streakLabel = `${streak}${unit}`
  const longestLabel = `best ${longestStreak}${unit}`

  const freqLabel: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly goal',
    weekdays: 'Weekdays',
    weekends: 'Weekends',
  }

  const isArchiving = archivingId === habit.id
  const isDeleting = deletingId === habit.id
  const habitNotes = logNotes[habit.id] ?? {}

  return (
    <>
      <tr
        className={[
          isDragging ? 'row-dragging' : '',
          isDragOver ? 'row-drag-over' : '',
        ].filter(Boolean).join(' ')}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      >
        <td>
          <div className="habit-label">
            <span
              className="habit-color"
              style={{ backgroundColor: habit.color }}
              aria-hidden="true"
            />
            {habit.icon && <span className="habit-icon" aria-hidden="true">{habit.icon}</span>}
            <div>
              <div className="habit-name">{habit.name}</div>
              <div className="habit-meta">
                {freqLabel[habit.frequency] ?? habit.frequency}
                {habit.category && (
                  <span className="category-badge">{habit.category}</span>
                )}
              </div>
            </div>
          </div>
        </td>
        <td>
          <div className="streak-cell">
            <span
              className="streak-pill"
              role="status"
              aria-label={`Current streak: ${streakLabel}`}
            >
              {streakLabel}
            </span>
            <span className="streak-best" title={`Longest streak: ${longestLabel}`}>{longestLabel}</span>
            <div className="rate-pills">
              <span className="rate-pill" title={`${COMPLETION_WINDOW_SHORT}-day completion rate`}>{rate7}% <span className="rate-label">7d</span></span>
              <span className="rate-pill" title={`${COMPLETION_WINDOW_LONG}-day completion rate`}>{rate30}% <span className="rate-label">30d</span></span>
            </div>
          </div>
        </td>
        {past14Days.map((d) => {
          const checked = dates.includes(d)
          const isToday = d === today
          const hasNote = !!habitNotes[d]
          return (
            <td key={d}>
              <div className="day-cell-wrap">
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
                {checked && (
                  <button
                    type="button"
                    className={`note-dot${hasNote ? ' note-dot-filled' : ''}`}
                    onClick={() => setNoteTarget(d)}
                    aria-label={`${hasNote ? 'Edit' : 'Add'} note for ${d}`}
                    title={hasNote ? habitNotes[d] : 'Add note'}
                  />
                )}
              </div>
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

      {noteTarget && (
        <NoteModal
          habitName={habit.name}
          date={noteTarget}
          initialNote={habitNotes[noteTarget] ?? ''}
          onSave={(note) => onSaveNote(habit.id, noteTarget, note)}
          onClose={() => setNoteTarget(null)}
        />
      )}
    </>
  )
}
