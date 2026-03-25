import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import * as useHabitsModule from './hooks/useHabits'
import type { Habit } from './types'

vi.mock('./hooks/useHabits')

const mockHabit: Habit = {
  id: 'h1',
  name: 'Read',
  frequency: 'daily',
  color: '#6366f1',
  createdAt: '2026-01-01T00:00:00.000Z',
  archived: false,
}

function stubHook(overrides: Partial<ReturnType<typeof useHabitsModule.useHabits>> = {}) {
  vi.mocked(useHabitsModule.useHabits).mockReturnValue({
    habits: [mockHabit],
    logs: { h1: [] },
    logNotes: {},
    loading: false,
    error: null,
    toast: null,
    archivingId: null,
    deletingId: null,
    addHabit: vi.fn(),
    toggle: vi.fn(),
    archive: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
    saveNote: vi.fn(),
    retryLoad: vi.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  stubHook()
})

// ── Loading state ─────────────────────────────────────────────────────────────

describe('App – loading', () => {
  it('shows loading indicator while data is being fetched', () => {
    stubHook({ loading: true, habits: [], logs: {} })
    render(<App />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('does not render the habit form while loading', () => {
    stubHook({ loading: true, habits: [], logs: {} })
    render(<App />)
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })
})

// ── Error state ───────────────────────────────────────────────────────────────

describe('App – error', () => {
  it('shows error message and Retry button on fetch failure', () => {
    stubHook({ error: 'Failed to load habits', habits: [], logs: {} })
    render(<App />)
    expect(screen.getByText(/failed to load habits/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('calls retryLoad when Retry is clicked', async () => {
    const retryLoad = vi.fn()
    stubHook({ error: 'oops', habits: [], logs: {}, retryLoad })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(retryLoad).toHaveBeenCalledOnce()
  })

  it('does not render the habit form in the error state', () => {
    stubHook({ error: 'oops', habits: [], logs: {} })
    render(<App />)
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })
})

// ── Normal state ──────────────────────────────────────────────────────────────

describe('App – normal', () => {
  it('renders the page header', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /habit garden/i })).toBeInTheDocument()
  })

  it('renders HabitForm and HabitTable', () => {
    render(<App />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByRole('table', { name: /habit tracker/i })).toBeInTheDocument()
  })

  it('shows the current date in the header pill', () => {
    render(<App />)
    const today = new Date().toISOString().slice(0, 10)
    expect(screen.getByLabelText(new RegExp(`today is ${today}`, 'i'))).toBeInTheDocument()
  })
})

// ── Toast ─────────────────────────────────────────────────────────────────────

describe('App – toast', () => {
  it('renders toast message when present', () => {
    stubHook({ toast: 'Something went wrong. Please try again.' })
    render(<App />)
    const toast = screen.getByRole('alert')
    expect(toast).toBeInTheDocument()
    expect(toast.textContent).toContain('Something went wrong')
  })

  it('does not render a toast element when toast is null', () => {
    stubHook({ toast: null })
    render(<App />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ── Delete confirmation flow ──────────────────────────────────────────────────

describe('App – delete flow', () => {
  it('opens ConfirmModal when Delete is triggered on a habit', async () => {
    render(<App />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /delete read/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog').textContent).toMatch(/cannot be undone/i)
  })

  it('calls remove and closes modal when Delete is confirmed', async () => {
    const remove = vi.fn()
    stubHook({ remove })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /delete read/i }))
    await userEvent.click(screen.getByRole('dialog').querySelector('button[class*="danger"]')!)

    expect(remove).toHaveBeenCalledWith('h1')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('closes modal without calling remove when Cancel is clicked', async () => {
    const remove = vi.fn()
    stubHook({ remove })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /delete read/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(remove).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
