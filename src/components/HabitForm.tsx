import { useState } from 'react'
import type { Frequency } from '../types'
import { HABIT_NAME_MAX_LENGTH, CATEGORY_MAX_LENGTH } from '../constants'

const EMOJI_SUGGESTIONS = ['🏃', '📚', '💧', '🧘', '💪', '🥗', '😴', '✍️', '🎨', '🎵', '🌿', '🧹']

type Props = {
  onAdd: (name: string, frequency: Frequency, color: string, category?: string, icon?: string) => void
}

export function HabitForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [color, setColor] = useState('#6366f1')
  const [category, setCategory] = useState('')
  const [icon, setIcon] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name, frequency, color, category.trim() || undefined, icon || undefined)
    setName('')
  }

  return (
    <section className="card new-habit-card">
      <h2>Create a habit</h2>
      <form className="habit-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="habit-name">Name</label>
          <div className="name-icon-row">
            <div className="icon-picker-wrapper">
              <button
                type="button"
                className="icon-trigger"
                onClick={() => setShowEmoji((v) => !v)}
                aria-label="Pick an icon"
                title="Pick an icon"
              >
                {icon || '✦'}
              </button>
              {showEmoji && (
                <div className="emoji-popover" role="dialog" aria-label="Select an icon">
                  <div className="emoji-grid">
                    {EMOJI_SUGGESTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className={`emoji-option${icon === e ? ' selected' : ''}`}
                        onClick={() => { setIcon(e); setShowEmoji(false) }}
                      >
                        {e}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="emoji-option emoji-clear"
                      onClick={() => { setIcon(''); setShowEmoji(false) }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
            <input
              id="habit-name"
              type="text"
              placeholder="e.g. Read 10 pages"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-required="true"
              maxLength={HABIT_NAME_MAX_LENGTH}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="habit-category">Category <span className="optional-label">(optional)</span></label>
          <input
            id="habit-category"
            type="text"
            placeholder="e.g. Health, Learning"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={CATEGORY_MAX_LENGTH}
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
              <option value="weekdays">Weekdays</option>
              <option value="weekends">Weekends</option>
              <option value="weekly">Weekly goal</option>
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
