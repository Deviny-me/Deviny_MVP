'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProvider } from '@/components/user/UserProvider'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login?role=user')
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>
          {children}
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
