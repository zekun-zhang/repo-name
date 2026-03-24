import { useState } from 'react'
import type { Frequency } from '../types'

type Props = {
  onAdd: (name: string, frequency: Frequency, color: string) => void
}

export function HabitForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [color, setColor] = useState('#6366f1')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name, frequency, color)
    setName('')
  }

  return (
    <section className="card new-habit-card">
      <h2>Create a habit</h2>
      <form className="habit-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="habit-name">Name</label>
          <input
            id="habit-name"
            type="text"
            placeholder="e.g. Read 10 pages"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-required="true"
            maxLength={100}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="habit-frequency">Frequency</label>
            <select
              id="habit-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="habit-color">Color</label>
            <input
              id="habit-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Habit color"
            />
          </div>
        </div>
        <button type="submit" className="primary-button">
          Add habit
        </button>
      </form>
    </section>
  )
}
