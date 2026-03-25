import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useHabits } from './useHabits'
import * as api from '../api'
import type { Habit } from '../types'

vi.mock('../api')

const mockHabit: Habit = {
  id: 'h1',
  name: 'Read',
  frequency: 'daily',
  color: '#000000',
  createdAt: '2026-01-01T00:00:00.000Z',
  archived: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.fetchHabits).mockResolvedValue({ habits: [mockHabit], logs: { h1: ['2026-03-24'] }, logNotes: {} })
  vi.mocked(api.createHabit).mockResolvedValue(mockHabit)
  vi.mocked(api.toggleLog).mockResolvedValue()
  vi.mocked(api.archiveHabit).mockResolvedValue()
  vi.mocked(api.deleteHabit).mockResolvedValue()
})

describe('useHabits – initial load', () => {
  it('starts loading and resolves habits', async () => {
    const { result } = renderHook(() => useHabits())
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.habits).toHaveLength(1)
    expect(result.current.habits[0].name).toBe('Read')
    expect(result.current.logs['h1']).toEqual(['2026-03-24'])
    expect(result.current.error).toBeNull()
  })

  it('sets error when fetchHabits rejects', async () => {
    vi.mocked(api.fetchHabits).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useHabits())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/Failed to load/)
    expect(result.current.habits).toHaveLength(0)
  })
})

describe('useHabits – retryLoad', () => {
  it('clears error and reloads on retryLoad', async () => {
    vi.mocked(api.fetchHabits)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce({ habits: [mockHabit], logs: {}, logNotes: {} })

    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.error).toBeTruthy())

    act(() => { result.current.retryLoad() })
    await waitFor(() => expect(result.current.error).toBeNull())
    expect(result.current.habits).toHaveLength(1)
  })
})

describe('useHabits – addHabit', () => {
  it('optimistically adds habit then persists', async () => {
    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.addHabit('Exercise', 'daily', '#ff0000') })
    expect(result.current.habits.some((h) => h.name === 'Exercise')).toBe(true)
    await waitFor(() => expect(api.createHabit).toHaveBeenCalledOnce())
  })

  it('rolls back and shows toast on API failure', async () => {
    vi.mocked(api.createHabit).mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const originalCount = result.current.habits.length
    act(() => { result.current.addHabit('Exercise', 'daily', '#ff0000') })
    await waitFor(() => expect(result.current.toast).toBeTruthy())
    expect(result.current.habits).toHaveLength(originalCount)
  })
})

describe('useHabits – toggle', () => {
  it('optimistically toggles a log entry', async () => {
    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // '2026-03-24' is already logged; toggling removes it
    act(() => { result.current.toggle('h1', '2026-03-24') })
    expect(result.current.logs['h1']).not.toContain('2026-03-24')
  })

  it('rolls back log on API failure', async () => {
    vi.mocked(api.toggleLog).mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.toggle('h1', '2026-03-24') })
    await waitFor(() => expect(result.current.toast).toBeTruthy())
    expect(result.current.logs['h1']).toContain('2026-03-24')
  })
})

describe('useHabits – archive', () => {
  it('removes habit from active list after archiving', async () => {
    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.archive('h1') })
    await waitFor(() => expect(result.current.habits).toHaveLength(0))
  })

  it('sets archivingId while in-flight, clears when done', async () => {
    let resolve!: () => void
    vi.mocked(api.archiveHabit).mockReturnValue(new Promise<void>((r) => { resolve = r }))

    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.archive('h1') })
    expect(result.current.archivingId).toBe('h1')

    await act(async () => { resolve() })
    expect(result.current.archivingId).toBeNull()
  })

  it('rolls back on API failure', async () => {
    vi.mocked(api.archiveHabit).mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.archive('h1') })
    await waitFor(() => expect(result.current.toast).toBeTruthy())
    expect(result.current.habits).toHaveLength(1)
  })
})

describe('useHabits – remove', () => {
  it('removes habit and its logs optimistically', async () => {
    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.remove('h1') })
    expect(result.current.habits).toHaveLength(0)
    expect(result.current.logs['h1']).toBeUndefined()
  })

  it('sets deletingId while in-flight', async () => {
    let resolve!: () => void
    vi.mocked(api.deleteHabit).mockReturnValue(new Promise<void>((r) => { resolve = r }))

    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.remove('h1') })
    expect(result.current.deletingId).toBe('h1')

    await act(async () => { resolve() })
    expect(result.current.deletingId).toBeNull()
  })

  it('rolls back on API failure', async () => {
    vi.mocked(api.deleteHabit).mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useHabits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.remove('h1') })
    await waitFor(() => expect(result.current.toast).toBeTruthy())
    expect(result.current.habits).toHaveLength(1)
    expect(result.current.logs['h1']).toBeDefined()
  })
})
