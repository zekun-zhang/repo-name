const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')

// Simple in-memory rate limiter
function createRateLimiter({ windowMs, max }) {
  const hits = new Map()
  setInterval(() => hits.clear(), windowMs).unref()
  return (req, res, next) => {
    const key = req.ip
    const count = (hits.get(key) ?? 0) + 1
    hits.set(key, count)
    if (count > max) {
      return res.status(429).json({ error: 'Too many requests, please slow down.' })
    }
    next()
  }
}

function createApp(options = {}) {
  const dataFile = options.dataFile || path.join(__dirname, 'data.json')

  const app = express()

  // CORS — restrict to configured origins, default to localhost in development
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:4173']
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`))
        }
      },
    }),
  )

  app.use(express.json({ limit: '10kb' }))

  // Rate limit: 200 requests per minute per IP
  const limiter = createRateLimiter({ windowMs: 60_000, max: 200 })
  app.use('/api', limiter)

  // Simple async mutex to prevent concurrent read-modify-write races
  let lock = Promise.resolve()
  function withLock(fn) {
    const next = lock.then(fn, fn)
    lock = next.catch(() => {})
    return next
  }

  async function readData() {
    try {
      const raw = await fs.readFile(dataFile, 'utf-8')
      return JSON.parse(raw)
    } catch {
      return { habits: [], logs: {}, logNotes: {} }
    }
  }

  async function writeData(data) {
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8')
  }

  // Validation helpers
  const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
  const HABIT_NAME_MAX = 100
  const CATEGORY_MAX = 50
  const VALID_FREQUENCIES = ['daily', 'weekly', 'weekdays', 'weekends']

  function validateHabit(body) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return 'name is required'
    }
    if (body.name.length > HABIT_NAME_MAX) {
      return `name must be ${HABIT_NAME_MAX} chars or fewer`
    }
    if (!VALID_FREQUENCIES.includes(body.frequency)) {
      return `frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`
    }
    if (body.color && !HEX_COLOR.test(body.color)) {
      return 'color must be a valid hex color (e.g. #6366f1)'
    }
    if (body.category && typeof body.category !== 'string') {
      return 'category must be a string'
    }
    if (body.category && body.category.length > CATEGORY_MAX) {
      return `category must be ${CATEGORY_MAX} chars or fewer`
    }
    if (body.icon && typeof body.icon !== 'string') {
      return 'icon must be a string'
    }
    if (body.icon && [...body.icon].length > 2) {
      return 'icon must be a single emoji or character'
    }
    return null
  }

  app.get('/api/habits', async (_req, res) => {
    try {
      const data = await readData()
      res.json({
        habits: data.habits || [],
        logs: data.logs || {},
        logNotes: data.logNotes || {},
      })
    } catch (err) {
      console.error('[GET /api/habits]', err)
      res.status(500).json({ error: 'Failed to read habits' })
    }
  })

  app.post('/api/habits', async (req, res) => {
    const error = validateHabit(req.body)
    if (error) return res.status(400).json({ error })

    const habit = {
      id: req.body.id || crypto.randomUUID(),
      name: req.body.name.trim(),
      frequency: req.body.frequency,
      color: req.body.color || '#6366f1',
      icon: req.body.icon || undefined,
      category: req.body.category?.trim() || undefined,
      createdAt: req.body.createdAt || new Date().toISOString(),
      archived: false,
    }
    // Remove undefined fields
    Object.keys(habit).forEach((k) => habit[k] === undefined && delete habit[k])

    try {
      await withLock(async () => {
        const data = await readData()
        data.habits = [habit, ...data.habits]
        await writeData(data)
      })
      res.status(201).json(habit)
    } catch (err) {
      console.error('[POST /api/habits]', err)
      res.status(500).json({ error: 'Failed to save habit' })
    }
  })

  // Reorder must come before /:id routes to avoid conflict
  app.put('/api/habits/reorder', async (req, res) => {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds) || !orderedIds.every((id) => typeof id === 'string')) {
      return res.status(400).json({ error: 'orderedIds must be an array of strings' })
    }
    try {
      await withLock(async () => {
        const data = await readData()
        const habitMap = new Map(data.habits.map((h) => [h.id, h]))
        const reordered = orderedIds.map((id) => habitMap.get(id)).filter(Boolean)
        const reorderedSet = new Set(orderedIds)
        const rest = data.habits.filter((h) => !reorderedSet.has(h.id))
        data.habits = [...reordered, ...rest]
        await writeData(data)
      })
      res.json({ ok: true })
    } catch (err) {
      console.error('[PUT /api/habits/reorder]', err)
      res.status(500).json({ error: 'Failed to reorder habits' })
    }
  })

  app.post('/api/logs/toggle', async (req, res) => {
    const { habitId, date } = req.body
    if (!habitId || typeof habitId !== 'string') {
      return res.status(400).json({ error: 'habitId is required' })
    }
    if (!date || !DATE_RE.test(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' })
    }

    try {
      let updated
      await withLock(async () => {
        const data = await readData()
        const existing = data.logs[habitId] || []
        updated = existing.includes(date)
          ? existing.filter((d) => d !== date)
          : [...existing, date]
        data.logs[habitId] = updated
        await writeData(data)
      })
      res.json({ habitId, dates: updated })
    } catch (err) {
      console.error('[POST /api/logs/toggle]', err)
      res.status(500).json({ error: 'Failed to toggle log' })
    }
  })

  app.post('/api/logs/notes', async (req, res) => {
    const { habitId, date, note } = req.body
    if (!habitId || typeof habitId !== 'string') {
      return res.status(400).json({ error: 'habitId is required' })
    }
    if (!date || !DATE_RE.test(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' })
    }
    if (note !== undefined && typeof note !== 'string') {
      return res.status(400).json({ error: 'note must be a string' })
    }
    if (note && note.length > 500) {
      return res.status(400).json({ error: 'note must be 500 chars or fewer' })
    }

    try {
      await withLock(async () => {
        const data = await readData()
        if (!data.logNotes) data.logNotes = {}
        if (!data.logNotes[habitId]) data.logNotes[habitId] = {}
        if (note?.trim()) {
          data.logNotes[habitId][date] = note.trim()
        } else {
          delete data.logNotes[habitId][date]
        }
        await writeData(data)
      })
      res.json({ ok: true })
    } catch (err) {
      console.error('[POST /api/logs/notes]', err)
      res.status(500).json({ error: 'Failed to save note' })
    }
  })

  app.post('/api/habits/:id/archive', async (req, res) => {
    const { id } = req.params
    try {
      await withLock(async () => {
        const data = await readData()
        data.habits = data.habits.map((h) =>
          h.id === id ? { ...h, archived: true } : h,
        )
        await writeData(data)
      })
      res.json({ id })
    } catch (err) {
      console.error('[POST /api/habits/:id/archive]', err)
      res.status(500).json({ error: 'Failed to archive habit' })
    }
  })

  app.delete('/api/habits/:id', async (req, res) => {
    const { id } = req.params
    try {
      await withLock(async () => {
        const data = await readData()
        data.habits = data.habits.filter((h) => h.id !== id)
        const { [id]: _removed, ...restLogs } = data.logs
        data.logs = restLogs
        if (data.logNotes) {
          const { [id]: _removedNotes, ...restNotes } = data.logNotes
          data.logNotes = restNotes
        }
        await writeData(data)
      })
      res.status(204).end()
    } catch (err) {
      console.error('[DELETE /api/habits/:id]', err)
      res.status(500).json({ error: 'Failed to delete habit' })
    }
  })

  app.get('/api/export/csv', async (_req, res) => {
    try {
      const data = await readData()
      const lines = ['habit_id,habit_name,category,frequency,date,completed']
      for (const habit of data.habits) {
        if (habit.archived) continue
        const dates = new Set(data.logs[habit.id] || [])
        const category = habit.category ? `"${habit.category.replace(/"/g, '""')}"` : ''
        for (let i = 0; i < 365; i++) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().slice(0, 10)
          lines.push(
            `${habit.id},"${habit.name.replace(/"/g, '""')}",${category},${habit.frequency},${dateStr},${dates.has(dateStr) ? 1 : 0}`,
          )
        }
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="habit-garden-export.csv"')
      res.send(lines.join('\n'))
    } catch (err) {
      console.error('[GET /api/export/csv]', err)
      res.status(500).json({ error: 'Failed to export' })
    }
  })

  return app
}

module.exports = { createApp }
