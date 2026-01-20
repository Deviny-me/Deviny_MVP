'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { getRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'
import { useRegister } from '@/features/auth/hooks/useRegister'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [role, setRole] = useState<RoleType | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { loading, errors, register, clearErrors } = useRegister()

  useEffect(() => {
    const roleFromQuery = searchParams.get('role') as RoleType
    if (roleFromQuery && (roleFromQuery === 'user' || roleFromQuery === 'trainer')) {
      setRole(roleFromQuery)
    } else {
      const roleFromStorage = getRole()
      if (roleFromStorage && (roleFromStorage === 'user' || roleFromStorage === 'trainer')) {
        setRole(roleFromStorage)
      } else {
        router.push('/auth')
      }
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!role) return

    clearErrors()
    
    await register(
      {
        fullName,
        email,
        password,
        confirmPassword,
        termsAccepted,
      },
      role
    )
  }

  if (!role) {
    return null
  }

  const isTrainer = role === 'trainer'

  return (
    <div className="light w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary-700 mb-2">Ignite</h1>
        <p className="text-lg text-gray-600">
          Социальная сеть для фитнеса
        </p>
      </div>

      <Card className="p-8 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {isTrainer ? 'Регистрация тренера' : 'Регистрация пользователя'}
        </h2>
        <p className="text-gray-600 mb-6 text-center text-sm">
          {isTrainer 
            ? 'Создайте профиль тренера и начните помогать людям' 
            : 'Создайте аккаунт и начните свой путь к здоровью'}
        </p>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя и фамилия
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Иван Иванов"
              disabled={loading}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your@email.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Минимум 6 символов, 1 цифра"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Повторите пароль
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Повторите пароль"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <div>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className={`mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                  errors.termsAccepted ? 'border-red-500' : ''
                }`}
                disabled={loading}
              />
              <span className="text-sm text-gray-700">
                Согласен с{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-700 underline">
                  условиями использования
                </Link>
                {' '}и{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-700 underline">
                  политикой конфиденциальности
                </Link>
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
            )}
          </div>

          <Button
            variant={isTrainer ? 'trainer' : 'user'}
            size="lg"
            fullWidth
            type="submit"
            disabled={loading}
          >
            {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Уже есть аккаунт?{' '}
            <Link
              href={`/auth/login?role=${role}`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Войти
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
