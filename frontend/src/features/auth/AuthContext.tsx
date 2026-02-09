'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authService, LoginRequestDto, UserDto } from './services/authService'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'trainer' | 'admin'
  avatar?: string
  level?: number
  xp?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role?: 'user' | 'trainer', rememberMe?: boolean) => Promise<void>
  logout: () => void
  register: (email: string, password: string, firstName: string, lastName: string, role?: 'user' | 'trainer') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapUserDtoToUser(dto: UserDto): User {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    role: dto.role === 'trainer' ? 'trainer' : 'user',
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

  const login = async (email: string, password: string, role: 'user' | 'trainer' = 'trainer', rememberMe: boolean = false) => {
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
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  const register = async (email: string, password: string, firstName: string, lastName: string, role: 'user' | 'trainer' = 'trainer') => {
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
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
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
