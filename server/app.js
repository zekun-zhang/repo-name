const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')

function createApp(options = {}) {
  const dataFile = options.dataFile || path.join(__dirname, 'data.json')

  const app = express()
  app.use(cors())
  app.use(express.json())

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

  function validateHabit(body) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return 'name is required'
    }
    if (body.name.length > 100) return 'name must be 100 chars or fewer'
    if (!['daily', 'weekly'].includes(body.frequency)) {
      return 'frequency must be "daily" or "weekly"'
    }
    if (body.color && !HEX_COLOR.test(body.color)) {
      return 'color must be a valid hex color (e.g. #6366f1)'
    }
    return null
  }

  app.get('/api/habits', async (_req, res) => {
    const data = await readData()
    res.json(data)
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
      category: req.body.category || '',
      order: typeof req.body.order === 'number' ? req.body.order : 0,
    }

    await withLock(async () => {
      const data = await readData()
      data.habits = [habit, ...data.habits]
      await writeData(data)
    })
    res.status(201).json(habit)
  })

  app.post('/api/logs/toggle', async (req, res) => {
    const { habitId, date } = req.body
    if (!habitId || typeof habitId !== 'string') {
      return res.status(400).json({ error: 'habitId is required' })
    }
    if (!date || !DATE_RE.test(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' })
    }

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
  })

  app.post('/api/habits/:id/archive', async (req, res) => {
    const { id } = req.params
    await withLock(async () => {
      const data = await readData()
      data.habits = data.habits.map((h) =>
        h.id === id ? { ...h, archived: true } : h,
      )
      await writeData(data)
    })
    res.json({ id })
  })

  app.delete('/api/habits/:id', async (req, res) => {
    const { id } = req.params
    await withLock(async () => {
      const data = await readData()
      data.habits = data.habits.filter((h) => h.id !== id)
      const { [id]: _removed, ...restLogs } = data.logs
      data.logs = restLogs
      await writeData(data)
    })
    res.status(204).end()
  })

  app.patch('/api/habits/reorder', async (req, res) => {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds must be an array' })
    }
    await withLock(async () => {
      const data = await readData()
      const orderMap = {}
      orderedIds.forEach((id, i) => { orderMap[id] = i })
      data.habits = data.habits.map((h) =>
        orderMap[h.id] !== undefined ? { ...h, order: orderMap[h.id] } : h,
      )
      await writeData(data)
    })
    res.json({ ok: true })
  })

  app.patch('/api/habits/:id', async (req, res) => {
    const { id } = req.params
    const updates = {}
    if (typeof req.body.category === 'string') updates.category = req.body.category
    if (typeof req.body.name === 'string' && req.body.name.trim()) updates.name = req.body.name.trim()
    if (typeof req.body.order === 'number') updates.order = req.body.order

    await withLock(async () => {
      const data = await readData()
      data.habits = data.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h,
      )
      await writeData(data)
    })
    res.json({ id, ...updates })
  })

  return app
}

module.exports = { createApp }
