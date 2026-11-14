import { useEffect, useState } from 'react'
import type { Frequency } from '../types'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

type Props = {
  onAdd: (name: string, frequency: Frequency, color: string, activeDays?: number[]) => void
  prefill?: { name: string; color: string } | null
}

export function HabitForm({ onAdd, prefill }: Props) {
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [color, setColor] = useState('#6366f1')
  const [selectedDays, setSelectedDays] = useState<number[]>(ALL_DAYS)

  useEffect(() => {
    if (prefill) {
      setName(prefill.name)
      setColor(prefill.color)
    }
  }, [prefill])

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev
        return prev.filter((d) => d !== day)
      }
      return [...prev, day].sort()
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const activeDays =
      frequency === 'daily' && selectedDays.length < 7
        ? selectedDays
        : undefined
    onAdd(name, frequency, color, activeDays)
    setName('')
    setSelectedDays(ALL_DAYS)
  }

  return (
    <section className="card new-habit-card">
      <h2>Create a habit</h2>
      <form className="habit-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input
            type="text"
            placeholder="e.g. Read 10 pages"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="field">
            <label>Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>
        {frequency === 'daily' && (
          <div className="field">
            <label>Active days</label>
            <div className="day-picker">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  className={`day-picker-btn${selectedDays.includes(i) ? ' day-picker-btn-active' : ''}`}
                  onClick={() => toggleDay(i)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <button type="submit" className="primary-button">
          Add habit
        </button>
      </form>
    </section>
  )
}
