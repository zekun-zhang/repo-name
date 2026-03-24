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
        // Allow requests with no origin (e.g. same-origin, curl)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`))
        }
      },
    }),
  )

  // Limit body size to prevent memory exhaustion
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
      return { habits: [], logs: {} }
    }
  }

  async function writeData(data) {
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8')
  }

  // Validation helpers
  const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
  const HABIT_NAME_MAX = 100

  function validateHabit(body) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return 'name is required'
    }
    if (body.name.length > HABIT_NAME_MAX) {
      return `name must be ${HABIT_NAME_MAX} chars or fewer`
    }
    if (!['daily', 'weekly'].includes(body.frequency)) {
      return 'frequency must be "daily" or "weekly"'
    }
    if (body.color && !HEX_COLOR.test(body.color)) {
      return 'color must be a valid hex color (e.g. #6366f1)'
    }
    return null
  }

  app.get('/api/habits', async (_req, res) => {
    try {
      const data = await readData()
      res.json(data)
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
      createdAt: req.body.createdAt || new Date().toISOString(),
      archived: false,
    }

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
        await writeData(data)
      })
      res.status(204).end()
    } catch (err) {
      console.error('[DELETE /api/habits/:id]', err)
      res.status(500).json({ error: 'Failed to delete habit' })
    }
  })

  return app
}

module.exports = { createApp }
