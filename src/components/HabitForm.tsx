import { useState } from 'react'
import type { Frequency } from '../types'

type Props = {
  onAdd: (name: string, frequency: Frequency, color: string, category: string) => void
  categories: string[]
}

export function HabitForm({ onAdd, categories }: Props) {
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [color, setColor] = useState('#6366f1')
  const [category, setCategory] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name, frequency, color, category)
    setName('')
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
        <div className="field">
          <label>Category</label>
          <input
            type="text"
            list="category-list"
            placeholder="e.g. Health, Work, Learning"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <datalist id="category-list">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
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
        <button type="submit" className="primary-button">
          Add habit
        </button>
      </form>
    </section>
  )
}
