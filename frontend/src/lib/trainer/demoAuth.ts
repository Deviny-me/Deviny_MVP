export const DEMO_TRAINER_KEY = 'demoTrainerAuth'

export interface DemoTrainer {
  id: string
  name: string
  email: string
  role: 'trainer'
}

export const demoTrainer: DemoTrainer = {
  id: 'trainer-1',
  name: 'Иван Петров',
  email: 'trainer@demo.com',
  role: 'trainer',
}

export function setDemoTrainerAuth() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_TRAINER_KEY, JSON.stringify(demoTrainer))
  }
}

export function getDemoTrainerAuth(): DemoTrainer | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(DEMO_TRAINER_KEY)
    return data ? JSON.parse(data) : null
  }
  return null
}

export function clearDemoTrainerAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_TRAINER_KEY)
  }
}

export function isDemoTrainerAuthenticated(): boolean {
  return getDemoTrainerAuth() !== null
}
