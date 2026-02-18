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

function normalizeRole(role: string | number | undefined): 'user' | 'trainer' | 'nutritionist' {
  if (role === 'trainer' || role === 'Trainer' || role === 1 || role === '1') return 'trainer'
  if (role === 'nutritionist' || role === 'Nutritionist' || role === 3 || role === '3') return 'nutritionist'
  return 'user'
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
        const token = localStorage.getItem('accessToken')
        if (token) {
          const savedUser = localStorage.getItem('user')
          if (savedUser) {
            setUser(JSON.parse(savedUser))
          }
          // Try to refresh token
          const refreshResult = await authService.refreshToken()
          if (refreshResult) {
            const mappedUser = mapUserDtoToUser(refreshResult.user)
            setUser(mappedUser)
            localStorage.setItem('accessToken', refreshResult.accessToken)
            localStorage.setItem('user', JSON.stringify(mappedUser))
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
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
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('user', JSON.stringify(mappedUser))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
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
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('user', JSON.stringify(mappedUser))
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
