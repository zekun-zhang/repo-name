import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchHabits, createHabit, toggleLog, archiveHabit, deleteHabit } from './api'
import type { Habit } from './types'

const mockHabit: Habit = {
  id: 'h1',
  name: 'Read',
  frequency: 'daily',
  color: '#000000',
  createdAt: '2026-01-01T00:00:00.000Z',
  archived: false,
}

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ── fetchHabits ──────────────────────────────────────────────────────────────

describe('fetchHabits', () => {
  it('returns habits and logs on success', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { habits: [mockHabit], logs: { h1: [] } }))
    const data = await fetchHabits()
    expect(data.habits).toHaveLength(1)
    expect(data.habits[0].name).toBe('Read')
    expect(data.logs).toEqual({ h1: [] })
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch(500, { error: 'Internal Server Error' }))
    await expect(fetchHabits()).rejects.toThrow('Internal Server Error')
  })

  it('throws with status code when body has no error field', async () => {
    vi.stubGlobal('fetch', mockFetch(503, {}))
    await expect(fetchHabits()).rejects.toThrow('503')
  })
})

// ── createHabit ──────────────────────────────────────────────────────────────

describe('createHabit', () => {
  it('sends POST and returns the created habit', async () => {
    const fetchMock = mockFetch(201, mockHabit)
    vi.stubGlobal('fetch', fetchMock)

    const result = await createHabit(mockHabit)
    expect(result.id).toBe('h1')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/habits')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toMatchObject({ name: 'Read' })
  })

  it('throws on 400 with server error message', async () => {
    vi.stubGlobal('fetch', mockFetch(400, { error: 'name is required' }))
    await expect(createHabit(mockHabit)).rejects.toThrow('name is required')
  })
})

// ── toggleLog ────────────────────────────────────────────────────────────────

describe('toggleLog', () => {
  it('sends POST to /api/logs/toggle', async () => {
    const fetchMock = mockFetch(200, { habitId: 'h1', dates: ['2026-03-24'] })
    vi.stubGlobal('fetch', fetchMock)

    await toggleLog('h1', '2026-03-24')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/logs/toggle')
    expect(JSON.parse(init.body as string)).toEqual({ habitId: 'h1', date: '2026-03-24' })
  })

  it('throws on error response', async () => {
    vi.stubGlobal('fetch', mockFetch(400, { error: 'date must be YYYY-MM-DD' }))
    await expect(toggleLog('h1', 'bad-date')).rejects.toThrow('date must be YYYY-MM-DD')
  })
})

// ── archiveHabit ─────────────────────────────────────────────────────────────

describe('archiveHabit', () => {
  it('sends POST to /api/habits/:id/archive', async () => {
    const fetchMock = mockFetch(200, { id: 'h1' })
    vi.stubGlobal('fetch', fetchMock)

    await archiveHabit('h1')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/habits/h1/archive')
    expect(init.method).toBe('POST')
  })

  it('throws on error response', async () => {
    vi.stubGlobal('fetch', mockFetch(500, { error: 'Failed to archive' }))
    await expect(archiveHabit('h1')).rejects.toThrow('Failed to archive')
  })
})

// ── deleteHabit ──────────────────────────────────────────────────────────────

describe('deleteHabit', () => {
  it('sends DELETE to /api/habits/:id', async () => {
    const fetchMock = mockFetch(204, null)
    vi.stubGlobal('fetch', fetchMock)

    await deleteHabit('h1')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/habits/h1')
    expect(init.method).toBe('DELETE')
  })

  it('throws on error response', async () => {
    vi.stubGlobal('fetch', mockFetch(500, { error: 'Failed to delete' }))
    await expect(deleteHabit('h1')).rejects.toThrow('Failed to delete')
  })
})
