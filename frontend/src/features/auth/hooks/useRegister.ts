'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/features/auth/services/authService'

import { RoleType } from '@/features/auth/types/role.types'

export type GenderType = 'Male' | 'Female' | 'Other'

export interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
  // Extended fields for trainer registration
  phone?: string
  gender?: GenderType
  country?: string
  city?: string
  verificationDocument?: File
}

interface ValidationErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  termsAccepted?: string
  phone?: string
  gender?: string
  country?: string
  city?: string
  verificationDocument?: string
  general?: string
}

export const useRegister = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const validateForm = (data: RegisterFormData, role: RoleType): boolean => {
    const newErrors: ValidationErrors = {}

    // Validate first name
    if (!data.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно'
    } else if (data.firstName.trim().length < 2) {
      newErrors.firstName = 'Имя должно содержать минимум 2 символа'
    }

    // Validate last name
    if (!data.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна'
    } else if (data.lastName.trim().length < 2) {
      newErrors.lastName = 'Фамилия должна содержать минимум 2 символа'
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

    // Additional validation for trainers
    if (role === 'trainer') {
      if (!data.phone?.trim()) {
        newErrors.phone = 'Номер телефона обязателен для тренеров'
      } else {
        // Basic phone validation (digits, spaces, +, -, parentheses)
        const phoneRegex = /^[\d\s\+\-\(\)]+$/
        if (!phoneRegex.test(data.phone)) {
          newErrors.phone = 'Неверный формат номера телефона'
        } else if (data.phone.replace(/\D/g, '').length < 10) {
          newErrors.phone = 'Номер телефона должен содержать минимум 10 цифр'
        }
      }
      if (!data.gender) {
        newErrors.gender = 'Выберите пол'
      }
      if (!data.country) {
        newErrors.country = 'Выберите страну'
      }
      if (!data.city?.trim()) {
        newErrors.city = 'Укажите город'
      }
      if (!data.verificationDocument) {
        newErrors.verificationDocument = 'Загрузите документ подтверждения квалификации'
      } else {
        // Validate file size (10 MB max)
        if (data.verificationDocument.size > 10 * 1024 * 1024) {
          newErrors.verificationDocument = 'Размер файла не должен превышать 10 МБ'
        }
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if (!allowedTypes.includes(data.verificationDocument.type)) {
          newErrors.verificationDocument = 'Допустимые форматы: PDF, JPG, PNG'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const register = async (data: RegisterFormData, role: RoleType) => {
    // Clear previous errors
    setErrors({})

    // Validate form
    if (!validateForm(data, role)) {
      return
    }

    setLoading(true)

    try {
      const response = await authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role,
        phone: data.phone,
        gender: data.gender,
        country: data.country,
        city: data.city,
        verificationDocument: data.verificationDocument,
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
