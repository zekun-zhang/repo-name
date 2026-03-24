import { test, expect } from '@playwright/test'
import fs from 'fs'

test.beforeEach(() => {
  // Reset data before every test
  fs.writeFileSync('/tmp/e2e-habits.json', JSON.stringify({ habits: [], logs: {} }), 'utf-8')
})

// ── Create a habit ────────────────────────────────────────────────────────────

test('can create a new habit', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Name').fill('Read 10 pages')
  await page.getByLabel('Frequency').selectOption('daily')
  await page.getByRole('button', { name: /add habit/i }).click()

  await expect(page.getByText('Read 10 pages')).toBeVisible()
  await expect(page.locator('.habit-meta').getByText('Daily')).toBeVisible()
})

test('does not add a habit when name is empty', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /add habit/i }).click()
  // The habits table should still show the empty state
  await expect(page.getByText(/no habits yet/i)).toBeVisible()
})

test('can create a weekly habit', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Name').fill('Meal prep')
  await page.getByLabel('Frequency').selectOption('weekly')
  await page.getByRole('button', { name: /add habit/i }).click()

  await expect(page.getByText('Meal prep')).toBeVisible()
  await expect(page.getByText('Weekly goal')).toBeVisible()
})

// ── Toggle a day ──────────────────────────────────────────────────────────────

test('can toggle a day cell to check in', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Name').fill('Exercise')
  await page.getByRole('button', { name: /add habit/i }).click()
  await expect(page.getByText('Exercise')).toBeVisible()

  // Find the today-marked cell (has day-cell-today class) and click it
  const todayCell = page.locator('.day-cell-today').first()
  await expect(todayCell).toBeVisible()
  await todayCell.click()

  // Cell should now be checked
  await expect(todayCell).toHaveClass(/day-cell-checked/)
  await expect(todayCell).toContainText('✓')
})

test('can uncheck a checked day cell', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Name').fill('Exercise')
  await page.getByRole('button', { name: /add habit/i }).click()

  const todayCell = page.locator('.day-cell-today').first()
  await todayCell.click()
  await expect(todayCell).toHaveClass(/day-cell-checked/)

  // Click again to uncheck
  await todayCell.click()
  await expect(todayCell).not.toHaveClass(/day-cell-checked/)
})

// ── Archive ───────────────────────────────────────────────────────────────────

test('can archive a habit', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Name').fill('Journaling')
  await page.getByRole('button', { name: /add habit/i }).click()
  await expect(page.getByText('Journaling')).toBeVisible()

  await page.getByRole('button', { name: /archive journaling/i }).click()

  // Habit disappears from the active list
  await expect(page.getByText('Journaling')).not.toBeVisible()
})

// ── Delete (with confirm modal) ───────────────────────────────────────────────

test('can delete a habit after confirming in the modal', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Name').fill('Meditate')
  await page.getByRole('button', { name: /add habit/i }).click()
  await expect(page.getByText('Meditate')).toBeVisible()

  await page.getByRole('button', { name: /delete meditate/i }).click()

  // Modal should appear
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(/delete/i)

  // Confirm deletion
  await dialog.getByRole('button', { name: /delete/i }).click()

  await expect(page.getByText('Meditate')).not.toBeVisible()
  await expect(dialog).not.toBeVisible()
})

test('cancel in delete modal keeps the habit', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Name').fill('Stretch')
  await page.getByRole('button', { name: /add habit/i }).click()
  await expect(page.getByText('Stretch')).toBeVisible()

  await page.getByRole('button', { name: /delete stretch/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click()

  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByText('Stretch')).toBeVisible()
})

// ── Streak display ────────────────────────────────────────────────────────────

test('streak increments after checking in today', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Name').fill('Push-ups')
  await page.getByRole('button', { name: /add habit/i }).click()

  const streak = page.getByRole('status').first()
  await expect(streak).toContainText('0 days')

  await page.locator('.day-cell-today').first().click()
  await expect(streak).toContainText('1 day')
})

// ── Multiple habits ────────────────────────────────────────────────────────────

test('multiple habits are shown independently', async ({ page }) => {
  await page.goto('/')

  for (const name of ['Running', 'Reading', 'Coding']) {
    await page.getByLabel('Name').fill(name)
    await page.getByRole('button', { name: /add habit/i }).click()
    await expect(page.getByText(name)).toBeVisible()
  }

  const rows = page.locator('.habits-table tbody tr')
  await expect(rows).toHaveCount(3)
})
