'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/features/auth/services/authService'

import { RoleType } from '@/features/auth/types/role.types'

interface RegisterFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
}

interface ValidationErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  termsAccepted?: string
  general?: string
}

export const useRegister = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const validateForm = (data: RegisterFormData): boolean => {
    const newErrors: ValidationErrors = {}

    // Validate full name
    if (!data.fullName.trim()) {
      newErrors.fullName = 'Имя обязательно'
    } else if (data.fullName.trim().length < 2) {
      newErrors.fullName = 'Имя должно содержать минимум 2 символа'
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!data.email) {
      newErrors.email = 'Email обязателен'
    } else if (!emailRegex.test(data.email)) {
      newErrors.email = 'Неверный формат email'
    }

    // Validate password
    if (!data.password) {
      newErrors.password = 'Пароль обязателен'
    } else if (data.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов'
    } else if (!/\d/.test(data.password)) {
      newErrors.password = 'Пароль должен содержать минимум 1 цифру'
    }

    // Validate confirm password
    if (!data.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль'
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают'
    }

    // Validate terms acceptance
    if (!data.termsAccepted) {
      newErrors.termsAccepted = 'Необходимо принять условия'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const register = async (data: RegisterFormData, role: RoleType) => {
    // Clear previous errors
    setErrors({})

    // Validate form
    if (!validateForm(data)) {
      return
    }

    setLoading(true)

    try {
      const response = await authService.register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role,
      })

      // Store auth data
      localStorage.setItem('accessToken', response.accessToken)

      // Navigate to role-specific dashboard
      const dashboardRoute = role === 'user' ? '/dashboard/user' : '/trainer/dashboard'
      router.push(dashboardRoute)
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ general: error.message })
      } else {
        setErrors({ general: 'Ошибка при регистрации' })
      }
    } finally {
      setLoading(false)
    }
  }

  const clearErrors = () => {
    setErrors({})
  }

  return {
    loading,
    errors,
    register,
    clearErrors,
  }
}
