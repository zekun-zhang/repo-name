export type Frequency = 'daily' | 'weekly' | 'weekdays' | 'weekends'

export type Habit = {
  id: string
  name: string
  frequency: Frequency
  color: string
  icon?: string
  category?: string
  order?: number
  createdAt: string
  archived: boolean
}

export type HabitLog = {
  [habitId: string]: string[]
}

export type LogNotes = {
  [habitId: string]: {
    [date: string]: string
  }
}
