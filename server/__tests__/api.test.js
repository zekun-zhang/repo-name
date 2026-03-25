const fs = require('fs')
const os = require('os')
const path = require('path')
const request = require('supertest')

const { createApp } = require('../app')

function makeTempDataFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'habit-tracker-'))
  return path.join(dir, 'data.json')
}

function makeApp() {
  const dataFile = makeTempDataFile()
  fs.writeFileSync(dataFile, JSON.stringify({ habits: [], logs: {} }), 'utf-8')
  return { app: createApp({ dataFile }), dataFile }
}

const validHabit = {
  id: 'h1',
  name: 'Read',
  frequency: 'daily',
  color: '#000000',
  createdAt: new Date().toISOString(),
  archived: false,
}

describe('GET /api/habits', () => {
  test('returns empty habits and logs', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/habits')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ habits: [], logs: {}, logNotes: {} })
  })

  test('returns existing habits from data file', async () => {
    const dataFile = makeTempDataFile()
    fs.writeFileSync(dataFile, JSON.stringify({
      habits: [validHabit],
      logs: { h1: ['2026-03-16'] },
    }), 'utf-8')
    const app = createApp({ dataFile })

    const res = await request(app).get('/api/habits')
    expect(res.body.habits).toHaveLength(1)
    expect(res.body.habits[0].name).toBe('Read')
    expect(res.body.logs.h1).toEqual(['2026-03-16'])
  })

  test('returns defaults when data file does not exist', async () => {
    const dataFile = path.join(os.tmpdir(), `nonexistent-${Date.now()}`, 'data.json')
    const app = createApp({ dataFile })

    const res = await request(app).get('/api/habits')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ habits: [], logs: {}, logNotes: {} })
  })

  test('returns defaults when data file contains invalid JSON', async () => {
    const dataFile = makeTempDataFile()
    fs.writeFileSync(dataFile, 'not valid json!!!', 'utf-8')
    const app = createApp({ dataFile })

    const res = await request(app).get('/api/habits')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ habits: [], logs: {}, logNotes: {} })
  })
})

describe('POST /api/habits', () => {
  test('persists a valid habit', async () => {
    const { app, dataFile } = makeApp()

    const res = await request(app).post('/api/habits').send(validHabit)
    expect(res.statusCode).toBe(201)
    expect(res.body.name).toBe('Read')

    const stored = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
    expect(stored.habits[0].name).toBe('Read')
  })

  test('rejects missing name', async () => {
    const { app } = makeApp()
    const res = await request(app).post('/api/habits').send({
      id: 'h1',
      frequency: 'daily',
      color: '#000000',
    })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/name/i)
  })

  test('rejects empty name', async () => {
    const { app } = makeApp()
    const res = await request(app).post('/api/habits').send({
      id: 'h1',
      name: '   ',
      frequency: 'daily',
      color: '#000000',
    })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/name/i)
  })

  test('rejects name over 100 chars', async () => {
    const { app } = makeApp()
    const res = await request(app).post('/api/habits').send({
      id: 'h1',
      name: 'a'.repeat(101),
      frequency: 'daily',
      color: '#000000',
    })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/100/i)
  })

  test('rejects invalid frequency', async () => {
    const { app } = makeApp()
    const res = await request(app).post('/api/habits').send({
      id: 'h1',
      name: 'Read',
      frequency: 'monthly',
      color: '#000000',
    })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/frequency/i)
  })

  test('rejects invalid color', async () => {
    const { app } = makeApp()
    const res = await request(app).post('/api/habits').send({
      id: 'h1',
      name: 'Read',
      frequency: 'daily',
      color: 'not-a-color',
    })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/color/i)
  })
})

describe('POST /api/logs/toggle', () => {
  test('toggles a date on and off', async () => {
    const { app } = makeApp()

    const res1 = await request(app)
      .post('/api/logs/toggle')
      .send({ habitId: 'h1', date: '2026-03-16' })
    expect(res1.statusCode).toBe(200)
    expect(res1.body.dates).toEqual(['2026-03-16'])

    const res2 = await request(app)
      .post('/api/logs/toggle')
      .send({ habitId: 'h1', date: '2026-03-16' })
    expect(res2.statusCode).toBe(200)
    expect(res2.body.dates).toEqual([])
  })

  test('rejects missing habitId', async () => {
    const { app } = makeApp()
    const res = await request(app)
      .post('/api/logs/toggle')
      .send({ date: '2026-03-16' })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/habitId/i)
  })

  test('rejects invalid date format', async () => {
    const { app } = makeApp()
    const res = await request(app)
      .post('/api/logs/toggle')
      .send({ habitId: 'h1', date: 'March 16' })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/date/i)
  })

  test('rejects missing date', async () => {
    const { app } = makeApp()
    const res = await request(app)
      .post('/api/logs/toggle')
      .send({ habitId: 'h1' })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/date/i)
  })
})

describe('POST /api/habits/:id/archive', () => {
  test('archives a habit', async () => {
    const { app, dataFile } = makeApp()

    await request(app).post('/api/habits').send(validHabit)
    const res = await request(app).post('/api/habits/h1/archive')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ id: 'h1' })

    const stored = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
    expect(stored.habits[0].archived).toBe(true)
  })

  test('does nothing for nonexistent id', async () => {
    const { app } = makeApp()
    const res = await request(app).post('/api/habits/nonexistent/archive')
    expect(res.statusCode).toBe(200)
  })
})

describe('DELETE /api/habits/:id', () => {
  test('deletes a habit and its logs', async () => {
    const { app, dataFile } = makeApp()

    await request(app).post('/api/habits').send(validHabit)
    await request(app)
      .post('/api/logs/toggle')
      .send({ habitId: 'h1', date: '2026-03-16' })

    const res = await request(app).delete('/api/habits/h1')
    expect(res.statusCode).toBe(204)

    const stored = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
    expect(stored.habits).toHaveLength(0)
    expect(stored.logs.h1).toBeUndefined()
  })

  test('does nothing for nonexistent id', async () => {
    const { app } = makeApp()
    const res = await request(app).delete('/api/habits/nonexistent')
    expect(res.statusCode).toBe(204)
  })
})

// ── Rate limiting ─────────────────────────────────────────────────────────────

describe('Rate limiting', () => {
  test('returns 429 after exceeding the request limit', async () => {
    const { app } = makeApp()
    // Hit the limiter: 200 allowed, 201st should be rejected
    const requests = Array.from({ length: 201 }, () =>
      request(app).get('/api/habits')
    )
    const responses = await Promise.all(requests)
    const blocked = responses.filter((r) => r.statusCode === 429)
    expect(blocked.length).toBeGreaterThan(0)
    expect(blocked[0].body.error).toMatch(/too many requests/i)
  })

  test('allows requests up to the limit', async () => {
    const { app } = makeApp()
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request(app).get('/api/habits'))
    )
    expect(responses.every((r) => r.statusCode === 200)).toBe(true)
  })
})

// ── CORS ──────────────────────────────────────────────────────────────────────

describe('CORS', () => {
  test('allows requests from a configured origin', async () => {
    const { app } = makeApp()
    const res = await request(app)
      .get('/api/habits')
      .set('Origin', 'http://localhost:5173')
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })

  test('blocks requests from an unknown origin', async () => {
    const { app } = makeApp()
    const res = await request(app)
      .get('/api/habits')
      .set('Origin', 'https://evil.example.com')
    // Either no ACAO header or an error status
    const isBlocked =
      !res.headers['access-control-allow-origin'] ||
      res.statusCode >= 400 ||
      res.headers['access-control-allow-origin'] !== 'https://evil.example.com'
    expect(isBlocked).toBe(true)
  })

  test('allows same-origin requests (no Origin header)', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/habits')
    expect(res.statusCode).toBe(200)
  })

  test('allows custom origin via ALLOWED_ORIGINS env var', async () => {
    const original = process.env.ALLOWED_ORIGINS
    process.env.ALLOWED_ORIGINS = 'https://myapp.example.com'
    const { createApp } = require('../app')
    const dataFile = makeTempDataFile()
    fs.writeFileSync(dataFile, JSON.stringify({ habits: [], logs: {} }), 'utf-8')
    const customApp = createApp({ dataFile })

    const res = await request(customApp)
      .get('/api/habits')
      .set('Origin', 'https://myapp.example.com')
    expect(res.headers['access-control-allow-origin']).toBe('https://myapp.example.com')

    process.env.ALLOWED_ORIGINS = original
  })
})

// ── Body size limit ──────────────────────────────────────────────────────────

describe('Body size limit', () => {
  test('rejects requests with body larger than 10kb', async () => {
    const { app } = makeApp()
    const largeBody = { name: 'Read', frequency: 'daily', data: 'x'.repeat(11_000) }
    const res = await request(app)
      .post('/api/habits')
      .send(largeBody)
    expect(res.statusCode).toBe(413)
  })

  test('accepts requests within the body size limit', async () => {
    const { app } = makeApp()
    const res = await request(app)
      .post('/api/habits')
      .send({ name: 'Read', frequency: 'daily', color: '#000000' })
    expect(res.statusCode).toBe(201)
  })
})
