'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext'
import { LevelProvider } from '@/components/level/LevelProvider'

export default function TrainerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login?role=trainer')
      return
    }

    // Decode JWT to check role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const role = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      
      if (role !== 'Trainer' && role !== '1') {
        router.push('/auth/login?role=trainer')
        return
      }
      
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Token decode error:', error)
      router.push('/auth/login?role=trainer')
    }
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
      </div>
    )
  }

  return (
    <UnreadMessagesProvider>
      <LevelProvider>
        {children}
      </LevelProvider>
    </UnreadMessagesProvider>
  )
}
