import { RoleType } from '@/features/auth/types/role.types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export interface LoginRequestDto {
  email: string
  password: string
  role: RoleType
  rememberMe: boolean
}

export interface UserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: RoleType
  country?: string
  city?: string
}

export interface LoginResponseDto {
  accessToken: string
  refreshToken: string
  user: UserDto
}

export interface RefreshResponseDto {
  accessToken: string
  user: UserDto
}

export interface RegisterRequestDto {
  firstName: string
  lastName: string
  email: string
  password: string
  role: RoleType
  // Extended fields for trainer registration
  gender?: 'Male' | 'Female' | 'Other'
  country?: string
  city?: string
  verificationDocument?: File
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
    const formData = new FormData()
    formData.append('firstName', data.firstName)
    formData.append('lastName', data.lastName)
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('role', data.role === 'user' ? '0' : data.role === 'trainer' ? '1' : '2')
    
    // Extended fields for trainers
    if (data.gender) {
      formData.append('gender', data.gender)
    }
    if (data.country) {
      formData.append('country', data.country)
    }
    if (data.city) {
      formData.append('city', data.city)
    }
    if (data.verificationDocument) {
      formData.append('verificationDocument', data.verificationDocument)
    }

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
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
