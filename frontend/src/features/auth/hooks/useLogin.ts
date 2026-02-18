'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { authService, LoginRequestDto } from '../services/authService'
import { RoleType } from '../types/role.types'

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('auth.validation')

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
      const errorMap: Record<string, string> = {
        'SERVER_UNAVAILABLE': t('serverUnavailable'),
      }
      setError(errorMap[message] || message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error, setError }
}
