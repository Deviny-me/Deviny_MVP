import { cookies } from 'next/headers'
import { TrainerLayoutClient } from './TrainerLayoutClient'

type Theme = 'light' | 'dark'

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read theme from cookie on server side for SSR (prevents FOUC)
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('ignite_theme')
  const initialTheme: Theme = (themeCookie?.value === 'dark' ? 'dark' : 'light')

  return <TrainerLayoutClient initialTheme={initialTheme}>{children}</TrainerLayoutClient>
}
