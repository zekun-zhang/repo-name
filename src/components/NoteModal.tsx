import { useState } from 'react'

type Props = {
  habitName: string
  date: string
  initialNote: string
  onSave: (note: string) => void
  onClose: () => void
}

export function NoteModal({ habitName, date, initialNote, onSave, onClose }: Props) {
  const [note, setNote] = useState(initialNote)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(note)
    onClose()
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Note for ${habitName} on ${date}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-box">
        <p className="modal-message">
          <strong>{habitName}</strong> — {date}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            className="note-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for this day… (optional)"
            rows={3}
            maxLength={500}
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" style={{ marginTop: 0, minWidth: 80 }}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
