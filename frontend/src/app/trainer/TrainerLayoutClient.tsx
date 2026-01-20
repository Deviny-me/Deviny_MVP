'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrainerSidebar } from '@/components/trainer/TrainerSidebar'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { UserProvider } from '@/components/user/UserProvider'
import { LanguageProvider } from '@/components/language/LanguageProvider'

type Theme = 'light' | 'dark'
type Language = 'ru' | 'en'

function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('accessToken')
  // Just check if token exists, UserProvider will validate and load user data from API
  return !!token
}

interface TrainerLayoutClientProps {
  children: React.ReactNode
  initialTheme: Theme
}

export function TrainerLayoutClient({ children, initialTheme }: TrainerLayoutClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const authed = isAuthenticated()
    setIsAuthed(authed)
    setIsLoading(false)
    
    if (!authed) {
      router.push('/auth/login?role=trainer')
    }
  }, [router])

  // Apply theme class immediately on client to prevent FOUC
  useEffect(() => {
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [initialTheme])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthed) {
    return null
  }

  return (
    <UserProvider>
      <LanguageProvider>
        <ThemeProvider initialTheme={initialTheme}>
          <div className="flex min-h-screen bg-white dark:bg-neutral-950">
            <TrainerSidebar />
            <main className="flex-1 ml-[272px] p-8">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </LanguageProvider>
    </UserProvider>
  )
}
