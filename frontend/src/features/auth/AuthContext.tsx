'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authService, LoginRequestDto, UserDto } from './services/authService'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'trainer' | 'nutritionist' | 'admin'
  avatar?: string
  level?: number
  xp?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role?: 'user' | 'trainer' | 'nutritionist', rememberMe?: boolean) => Promise<void>
  logout: () => void
  register: (email: string, password: string, firstName: string, lastName: string, role?: 'user' | 'trainer' | 'nutritionist') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Maps backend UserRole enum values to frontend role strings.
// Backend enum: User=0, Trainer=1, Student=2, Nutritionist=3
// Note: Student (value 2) is not used in the frontend — it maps to 'user' by default.
function normalizeRole(role: string | number | undefined): 'user' | 'trainer' | 'nutritionist' {
  if (role === 'trainer' || role === 'Trainer' || role === 1 || role === '1') return 'trainer'
  if (role === 'nutritionist' || role === 'Nutritionist' || role === 3 || role === '3') return 'nutritionist'
  return 'user' // covers User=0 and Student=2
}

function mapUserDtoToUser(dto: UserDto): User {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    role: normalizeRole(dto.role),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
        if (token) {
          const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
          if (savedUser) {
            setUser(JSON.parse(savedUser))
          }
          // Try to refresh token — if it fails the session is invalid
          const refreshResult = await authService.refreshToken()
          if (refreshResult) {
            const mappedUser = mapUserDtoToUser(refreshResult.user)
            setUser(mappedUser)
            // Persist to the same storage that held the previous token
            const store = localStorage.getItem('accessToken') ? localStorage : sessionStorage
            store.setItem('accessToken', refreshResult.accessToken)
            store.setItem('user', JSON.stringify(mappedUser))
          } else {
            // Refresh failed (e.g. session cookie gone after browser close) — clear stale state
            setUser(null)
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
            sessionStorage.removeItem('accessToken')
            sessionStorage.removeItem('user')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = useCallback(async (email: string, password: string, role: 'user' | 'trainer' | 'nutritionist' = 'trainer', rememberMe: boolean = false) => {
    setIsLoading(true)
    try {
      const response = await authService.login({
        email,
        password,
        role,
        rememberMe,
      })
      
      const mappedUser = mapUserDtoToUser(response.user)
      setUser(mappedUser)

      // Remember me → localStorage (persists across browser closes)
      // No remember me → sessionStorage (cleared on browser close)
      const store = rememberMe ? localStorage : sessionStorage
      // Clear the other storage to avoid stale data
      const otherStore = rememberMe ? sessionStorage : localStorage
      otherStore.removeItem('accessToken')
      otherStore.removeItem('user')

      store.setItem('accessToken', response.accessToken)
      store.setItem('user', JSON.stringify(mappedUser))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    router.push('/auth/login')
  }, [router])

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, role: 'user' | 'trainer' | 'nutritionist' = 'trainer') => {
    setIsLoading(true)
    try {
      const response = await authService.register({
        email,
        password,
        firstName,
        lastName,
        role,
      })
      
      const mappedUser = mapUserDtoToUser(response.user)
      setUser(mappedUser)
      // Registration defaults to session-only (no remember me)
      sessionStorage.setItem('accessToken', response.accessToken)
      sessionStorage.setItem('user', JSON.stringify(mappedUser))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value = useMemo(() => ({ user, isLoading, login, logout, register }), [user, isLoading, login, logout, register])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
