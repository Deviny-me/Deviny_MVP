'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext'
import { TrainerAchievementBridge } from '@/components/trainer/TrainerAchievementBridge'
import { LevelProvider } from '@/components/level/LevelProvider'
import { MainLayout } from '@/components/trainer/layout/MainLayout'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

// Routes where right sidebar should be hidden
const HIDE_RIGHT_SIDEBAR = [
  '/trainer/profile', '/trainer/students', '/trainer/settings',
  '/trainer/messages', '/trainer/leaderboards', '/trainer/live',
  '/trainer/discovery', '/trainer/challenges',
]

export default function TrainerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const checkedRef = useRef(false)

  const showRightSidebar = !HIDE_RIGHT_SIDEBAR.some(r => pathname?.startsWith(r))

  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login?role=trainer')
      return
    }

    // Decode JWT to check role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const role = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      
      // Allow both Trainers and Nutritionists to access this dashboard
      const allowedRoles = ['Trainer', '1', 'Nutritionist', '3']
      if (!allowedRoles.includes(role)) {
        router.push('/auth/login?role=trainer')
        return
      }
      
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Token decode error:', error)
      router.push('/auth/login?role=trainer')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <UnreadMessagesProvider>
          <LevelProvider>
            <MainLayout showRightSidebar={showRightSidebar}>
              {children}
            </MainLayout>
          </LevelProvider>
        </UnreadMessagesProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
