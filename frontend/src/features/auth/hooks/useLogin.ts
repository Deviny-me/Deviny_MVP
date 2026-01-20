'use client'

import { useState } from 'react'
import { authService, LoginRequestDto } from '../services/authService'
import { RoleType } from '../types/role.types'

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (data: LoginRequestDto) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.login(data)
      
      // Only store token, user data will be loaded from API by UserProvider
      localStorage.setItem('accessToken', response.accessToken)
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error, setError }
}
