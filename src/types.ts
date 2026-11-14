export type Frequency = 'daily' | 'weekly'

export type Habit = {
  id: string
  name: string
  frequency: Frequency
  color: string
  createdAt: string
  archived: boolean
  activeDays?: number[]
}

export type HabitLog = {
  [habitId: string]: string[]
}
