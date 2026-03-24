import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HabitTable } from './HabitTable'
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

const defaultProps = {
  habits: [habit],
  logs: { h1: [] },
  past14Days: [TODAY],
  today: TODAY,
  archivingId: null,
  deletingId: null,
  onToggle: vi.fn(),
  onArchive: vi.fn(),
  onDelete: vi.fn(),
}

describe('HabitTable – empty state', () => {
  it('shows empty-state message when there are no habits', () => {
    render(<HabitTable {...defaultProps} habits={[]} />)
    expect(screen.getByText(/no habits yet/i)).toBeInTheDocument()
  })

  it('does not render a table in the empty state', () => {
    render(<HabitTable {...defaultProps} habits={[]} />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('HabitTable – with habits', () => {
  it('renders the table when habits are provided', () => {
    render(<HabitTable {...defaultProps} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders a row for each habit', () => {
    const habits = [
      habit,
      { ...habit, id: 'h2', name: 'Exercise' },
      { ...habit, id: 'h3', name: 'Meditate' },
    ]
    render(<HabitTable {...defaultProps} habits={habits} logs={{ h1: [], h2: [], h3: [] }} />)
    expect(screen.getByText('Read')).toBeInTheDocument()
    expect(screen.getByText('Exercise')).toBeInTheDocument()
    expect(screen.getByText('Meditate')).toBeInTheDocument()
  })

  it('renders one date column header per day in past14Days', () => {
    const past14Days = ['2026-03-23', '2026-03-24']
    render(<HabitTable {...defaultProps} past14Days={past14Days} />)
    // Each date gets a <th aria-label="YYYY-MM-DD">
    expect(screen.getByRole('columnheader', { name: '2026-03-23' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '2026-03-24' })).toBeInTheDocument()
  })

  it('has aria-label on the table for accessibility', () => {
    render(<HabitTable {...defaultProps} />)
    expect(screen.getByRole('table', { name: /habit tracker/i })).toBeInTheDocument()
  })
})
