import { useMemo } from 'react'
import type { Habit, HabitLog } from '../types'
import { generatePastNDays, todayISO } from '../utils'
import { HEATMAP_DAYS } from '../constants'

type Props = {
  habits: Habit[]
  logs: HabitLog
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function HeatmapRow({ habit, dates }: { habit: Habit; dates: string[] }) {
  const today = todayISO()
  const allDays = useMemo(() => generatePastNDays(HEATMAP_DAYS, today), [today])
  const datesSet = useMemo(() => new Set(dates), [dates])
  const [r, g, b] = hexToRgb(habit.color || '#6366f1')

  // Pad front so first day falls on the right weekday column
  const firstDayOfWeek = new Date(allDays[0] + 'T00:00:00').getDay() // 0=Sun
  const paddedDays: (string | null)[] = [...Array(firstDayOfWeek).fill(null), ...allDays]

  // Group into weeks (columns)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7))
  }

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  // Month labels: find the first week where month changes
  const monthLabels: { weekIdx: number; label: string }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstReal = week.find((d) => d !== null)
    if (firstReal) {
      const m = new Date(firstReal + 'T00:00:00').getMonth()
      if (m !== lastMonth) {
        monthLabels.push({ weekIdx: wi, label: MONTHS[m] })
        lastMonth = m
      }
    }
  })

  return (
    <div className="heatmap-row">
      <div className="heatmap-habit-label">
        {habit.icon && <span className="habit-icon">{habit.icon}</span>}
        <span>{habit.name}</span>
        {habit.category && <span className="category-badge">{habit.category}</span>}
      </div>
      <div className="heatmap-scroll">
        <div className="heatmap-month-row">
          {weeks.map((_, wi) => {
            const ml = monthLabels.find((m) => m.weekIdx === wi)
            return (
              <div key={wi} className="heatmap-month-cell">
                {ml ? ml.label : ''}
              </div>
            )
          })}
        </div>
        <div className="heatmap-body">
          <div className="heatmap-day-labels">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="heatmap-day-label">{i % 2 === 1 ? d : ''}</div>
            ))}
          </div>
          <div className="heatmap-grid">
            {weeks.map((week, wi) => (
              <div key={wi} className="heatmap-col">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="heatmap-cell heatmap-cell-empty" />
                  const done = datesSet.has(day)
                  return (
                    <div
                      key={di}
                      className={`heatmap-cell${done ? ' heatmap-cell-done' : ''}`}
                      style={done ? { backgroundColor: `rgba(${r},${g},${b},0.85)` } : undefined}
                      title={day}
                      aria-label={`${day}${done ? ' completed' : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HabitHeatmap({ habits, logs }: Props) {
  if (habits.length === 0) {
    return (
      <p className="empty-state" style={{ marginTop: 16 }}>
        No habits yet. Create your first one on the left.
      </p>
    )
  }

  return (
    <div className="heatmap-container">
      {habits.map((habit) => (
        <HeatmapRow
          key={habit.id}
          habit={habit}
          dates={logs[habit.id] ?? []}
        />
      ))}
    </div>
  )
}
