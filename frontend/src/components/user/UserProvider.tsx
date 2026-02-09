'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { authService } from '@/features/auth/services/authService'
import { API_URL } from '@/lib/config'

interface UserData {
  id: string
  fullName: string
  name: string
  email: string
  phone: string
  avatarUrl?: string | null
  role: number | string
  gender?: string | null
  country?: string | null
  city?: string | null
  bio?: string | null
  createdAt?: string | null
  // Level data
  level?: number
  xp?: number
  xpToNextLevel?: number
  streak?: number
  workoutsCompleted?: number
  // Social stats (placeholders for future features)
  achievementsCount?: number
  followingCount?: number
  postsCount?: number
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
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }
    
    const accessToken = token || localStorage.getItem('accessToken')
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        // Also fetch level data
        let levelData: { currentLevel?: number; currentXp?: number; xpToNextLevel?: number; requiredXpForNextLevel?: number } = {}
        try {
          const levelResponse = await fetch(`${API_URL}/me/level`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
          if (levelResponse.ok) {
            levelData = await levelResponse.json()
          }
        } catch (e) {
          console.log('Level data not available')
        }

        setUser({
          id: data.id,
          fullName: data.name || data.fullName,
          name: data.name,
          email: data.email,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
          role: data.role,
          gender: data.gender,
          country: data.country,
          city: data.city,
          bio: data.bio || null,
          createdAt: data.createdAt || null,
          level: levelData.currentLevel || 1,
          xp: levelData.currentXp || 0,
          xpToNextLevel: levelData.xpToNextLevel || levelData.requiredXpForNextLevel || 1000,
          streak: 0, // Will be fetched from separate endpoint
          workoutsCompleted: 0, // Will be fetched from separate endpoint
          // Social stats (placeholders for future features)
          achievementsCount: 0,
          followingCount: 0,
          postsCount: 0,
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
    if (typeof window === 'undefined') return
    
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem('accessToken')
      setUser(null)
    }
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
