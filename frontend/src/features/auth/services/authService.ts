import { RoleType } from '@/features/auth/types/role.types'

const API_URL = 'http://localhost:5000/api'

export interface LoginRequestDto {
  email: string
  password: string
  role: RoleType
  rememberMe: boolean
}

export interface LoginResponseDto {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    role: RoleType
  }
}

export interface RefreshResponseDto {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export interface RegisterRequestDto {
  fullName: string
  email: string
  password: string
  role: RoleType
}

export const authService = {
  async login(data: LoginRequestDto): Promise<LoginResponseDto> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        role: data.role === 'user' ? 0 : 1,
        rememberMe: data.rememberMe,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    return response.json()
  },

  async register(data: RegisterRequestDto): Promise<LoginResponseDto> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role === 'user' ? 0 : 1,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      if (response.status === 409) {
        throw new Error('Email уже зарегистрирован')
      }
      throw new Error(error.message || 'Registration failed')
    }

    return response.json()
  },

  async refreshToken(): Promise<RefreshResponseDto | null> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        return null
      }

      return response.json()
    } catch (error) {
      console.error('Failed to refresh token:', error)
      return null
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    localStorage.removeItem('accessToken')
  },
}
