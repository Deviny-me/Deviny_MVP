'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent, Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { getRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'
import { Eye, EyeOff } from 'lucide-react'
import { useLogin } from '@/features/auth/hooks/useLogin'

function LoginPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [role, setRole] = useState<RoleType | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  const { login, isLoading, error, setError } = useLogin()

  useEffect(() => {
    const roleFromQuery = searchParams.get('role') as RoleType
    const roleFromStorage = getRole()
    const validRole = ['user', 'trainer'].includes(roleFromQuery) ? roleFromQuery : roleFromStorage

    if (!validRole || !['user', 'trainer'].includes(validRole)) {
      router.push('/auth')
      return
    }

    setRole(validRole)
  }, [searchParams, router])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.email) {
      errors.email = 'Email обязателен'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Введите корректный email'
    }

    if (!formData.password) {
      errors.password = 'Пароль обязателен'
    } else if (formData.password.length < 6) {
      errors.password = 'Пароль должен содержать минимум 6 символов'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm() || !role) return

    try {
      await login({
        email: formData.email,
        password: formData.password,
        role,
        rememberMe: formData.rememberMe,
      })

      router.push(role === 'user' ? '/dashboard/user' : '/trainer/dashboard')
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  if (!role) {
    return null
  }

  const isTrainer = role === 'trainer'

  return (
    <div className="light w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary-700 mb-2">Ignite</h1>
        <p className="text-gray-600">
          Социальная сеть для фитнеса и здорового образа жизни
        </p>
      </div>

      <Card className="p-8 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {isTrainer ? 'Вход для тренера' : 'Вход для пользователя'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                if (fieldErrors.email) {
                  setFieldErrors({ ...fieldErrors, email: '' })
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                fieldErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Email"
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  if (fieldErrors.password) {
                    setFieldErrors({ ...fieldErrors, password: '' })
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Пароль"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) =>
                  setFormData({ ...formData, rememberMe: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 accent-primary-600 cursor-pointer"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-700 select-none">Запомнить меня</span>
            </label>

            <Link
              href="#"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Забыли пароль?
            </Link>
          </div>

          <Button
            variant={isTrainer ? 'trainer' : 'user'}
            size="lg"
            fullWidth
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Входим...' : 'Войти'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Нет аккаунта?{' '}
            <Link
              href={`/auth/register?role=${role}`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Зарегистрироваться
            </Link>
          </p>
          <Link
            href="/auth"
            className="block mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Назад к выбору роли
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="light w-full max-w-md mx-auto flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
