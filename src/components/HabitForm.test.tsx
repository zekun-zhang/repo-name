import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitForm } from './HabitForm'

describe('HabitForm', () => {
  it('renders name, frequency and color inputs', () => {
    render(<HabitForm onAdd={vi.fn()} />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/color/i)).toBeInTheDocument()
  })

  it('calls onAdd with trimmed name, frequency and color on submit', async () => {
    const onAdd = vi.fn()
    render(<HabitForm onAdd={onAdd} />)

    await userEvent.type(screen.getByLabelText(/name/i), '  Read  ')
    await userEvent.selectOptions(screen.getByLabelText(/frequency/i), 'weekly')
    await userEvent.click(screen.getByRole('button', { name: /add habit/i }))

    expect(onAdd).toHaveBeenCalledOnce()
    expect(onAdd).toHaveBeenCalledWith('  Read  ', 'weekly', expect.any(String))
  })

  it('does not call onAdd when name is empty', async () => {
    const onAdd = vi.fn()
    render(<HabitForm onAdd={onAdd} />)
    await userEvent.click(screen.getByRole('button', { name: /add habit/i }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('does not call onAdd when name is only whitespace', async () => {
    const onAdd = vi.fn()
    render(<HabitForm onAdd={onAdd} />)
    await userEvent.type(screen.getByLabelText(/name/i), '   ')
    await userEvent.click(screen.getByRole('button', { name: /add habit/i }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('resets the name field after a successful submit', async () => {
    render(<HabitForm onAdd={vi.fn()} />)
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
    await userEvent.type(nameInput, 'Exercise')
    await userEvent.click(screen.getByRole('button', { name: /add habit/i }))
    expect(nameInput.value).toBe('')
  })

  it('enforces maxLength=100 on the name input', () => {
    render(<HabitForm onAdd={vi.fn()} />)
    const input = screen.getByLabelText(/name/i) as HTMLInputElement
    expect(input.maxLength).toBe(100)
  })

  it('name input is aria-required', () => {
    render(<HabitForm onAdd={vi.fn()} />)
    expect(screen.getByLabelText(/name/i)).toHaveAttribute('aria-required', 'true')
  })
})
