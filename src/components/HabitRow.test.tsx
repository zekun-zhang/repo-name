import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitRow } from './HabitRow'
import type { Habit } from '../types'

const TODAY = '2026-03-24'

const habit: Habit = {
  id: 'h1',
  name: 'Read',
  frequency: 'daily',
  color: '#6366f1',
  createdAt: '2026-01-01T00:00:00.000Z',
  archived: false,
}

function renderRow(overrides = {}) {
  const props = {
    habit,
    dates: [TODAY],
    logNotes: {},
    past14Days: [TODAY],
    today: TODAY,
    archivingId: null,
    deletingId: null,
    onToggle: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
    onSaveNote: vi.fn(),
    ...overrides,
  }
  render(<table><tbody><HabitRow {...props} /></tbody></table>)
  return props
}

// ── Rendering (fake timers scoped here for streak calculation) ────────────────

describe('HabitRow – rendering', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(TODAY))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('renders habit name and frequency', () => {
    renderRow()
    expect(screen.getByText('Read')).toBeInTheDocument()
    expect(screen.getByText('Daily')).toBeInTheDocument()
  })

  it('renders streak label with role="status"', () => {
    renderRow()
    const streak = screen.getByRole('status')
    expect(streak).toBeInTheDocument()
    expect(streak.textContent).toMatch(/\d/)
  })

  it('shows streak in weeks for weekly habit', () => {
    renderRow({ habit: { ...habit, frequency: 'weekly' } })
    expect(screen.getByRole('status').textContent).toContain('wk')
  })

  it('marks the checked day cell with aria-pressed=true', () => {
    renderRow()
    const checked = screen.getAllByRole('button').find(
      (b) => b.getAttribute('aria-pressed') === 'true',
    )
    expect(checked).toBeDefined()
    expect(checked?.textContent).toBe('✓')
  })

  it('marks an unchecked day as aria-pressed=false', () => {
    renderRow({ dates: [] })
    const unchecked = screen.getAllByRole('button').find(
      (b) => b.getAttribute('aria-pressed') === 'false',
    )
    expect(unchecked).toBeDefined()
    expect(unchecked?.textContent).toBe('')
  })
})

// ── Interactions (real timers so userEvent works correctly) ──────────────────

describe('HabitRow – interactions', () => {
  it('calls onToggle when a day cell is clicked', async () => {
    const onToggle = vi.fn()
    renderRow({ onToggle })
    const dayCell = screen.getAllByRole('button').find(
      (b) => b.getAttribute('aria-pressed') !== null,
    )!
    await userEvent.click(dayCell)
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('calls onArchive with habit id when Archive is clicked', async () => {
    const onArchive = vi.fn()
    renderRow({ onArchive })
    await userEvent.click(screen.getByRole('button', { name: /archive read/i }))
    expect(onArchive).toHaveBeenCalledWith('h1')
  })

  it('calls onDelete with habit id when Delete is clicked', async () => {
    const onDelete = vi.fn()
    renderRow({ onDelete })
    await userEvent.click(screen.getByRole('button', { name: /delete read/i }))
    expect(onDelete).toHaveBeenCalledWith('h1')
  })
})

// ── Loading states ─────────────────────────────────────────────────────────────

describe('HabitRow – loading states', () => {
  it('shows "Archiving…" and disables both action buttons', () => {
    renderRow({ archivingId: 'h1' })
    expect(screen.getByText('Archiving…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /archive read/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /delete read/i })).toBeDisabled()
  })

  it('shows "Deleting…" and disables both action buttons', () => {
    renderRow({ deletingId: 'h1' })
    expect(screen.getByText('Deleting…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete read/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /archive read/i })).toBeDisabled()
  })

  it('does not disable buttons when ids belong to a different habit', () => {
    renderRow({ archivingId: 'other', deletingId: 'other' })
    expect(screen.getByRole('button', { name: /archive read/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /delete read/i })).not.toBeDisabled()
  })
})
