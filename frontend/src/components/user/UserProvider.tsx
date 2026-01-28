'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { authService } from '@/features/auth/services/authService'

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl?: string | null
  role: number | string
  gender?: string | null
  country?: string | null
  city?: string | null
}

interface UserContextType {
  user: UserData | null
  updateUser: (data: Partial<UserData>) => void
  refreshUser: () => Promise<void>
  isLoading: boolean
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUserFromAPI = useCallback(async (token?: string) => {
    const accessToken = token || localStorage.getItem('accessToken')
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
          role: data.role,
          gender: data.gender,
          country: data.country,
          city: data.city,
        })
      } else if (response.status === 401) {
        const refreshResult = await authService.refreshToken()
        if (refreshResult) {
          localStorage.setItem('accessToken', refreshResult.accessToken)
          await loadUserFromAPI(refreshResult.accessToken)
          return
        } else {
          localStorage.removeItem('accessToken')
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const initializeAuth = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }
    
    let token = localStorage.getItem('accessToken')
    
    // If no token in localStorage, try to refresh from cookie
    if (!token) {
      const refreshResult = await authService.refreshToken()
      if (refreshResult) {
        localStorage.setItem('accessToken', refreshResult.accessToken)
        token = refreshResult.accessToken
      }
    }
    
    if (!token) {
      setIsLoading(false)
      return
    }

    await loadUserFromAPI(token)
  }, [loadUserFromAPI])

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  const updateUser = useCallback((data: Partial<UserData>) => {
    setUser(prev => {
      if (!prev) return null
      return { ...prev, ...data }
    })
  }, [])

  const refreshUser = useCallback(async () => {
    await loadUserFromAPI()
  }, [loadUserFromAPI])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  return (
    <UserContext.Provider value={{ user, updateUser, refreshUser, isLoading, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
