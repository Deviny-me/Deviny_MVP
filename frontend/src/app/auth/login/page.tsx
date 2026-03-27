'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { getRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'
import { Eye, EyeOff, User, Dumbbell, Apple, ArrowLeft, Check } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { cn } from '@/lib/utils/cn'

const roleConfig = {
  user:         { icon: User,     iconBg: 'bg-user-100',         iconColor: 'text-user-600',         ring: 'focus-within:ring-user-500' },
  trainer:      { icon: Dumbbell, iconBg: 'bg-trainer-100',      iconColor: 'text-trainer-600',      ring: 'focus-within:ring-trainer-500' },
  nutritionist: { icon: Apple,    iconBg: 'bg-nutritionist-100', iconColor: 'text-nutritionist-600', ring: 'focus-within:ring-nutritionist-500' },
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('auth')
  const tv = useTranslations('auth.validation')
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
    const validRole = ['user', 'trainer', 'nutritionist'].includes(roleFromQuery) ? roleFromQuery : roleFromStorage

    if (!validRole || !['user', 'trainer', 'nutritionist'].includes(validRole)) {
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
      errors.email = tv('emailRequired')
    } else if (!validateEmail(formData.email)) {
      errors.email = tv('emailInvalid')
    }

    if (!formData.password) {
      errors.password = tv('passwordRequired')
    } else if (formData.password.length < 6) {
      errors.password = tv('passwordMin')
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

      router.push(role === 'user' ? '/user' : role === 'nutritionist' ? '/nutritionist' : '/trainer')
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  if (!role) {
    return null
  }

  const isTrainer = role === 'trainer'
  const isNutritionist = role === 'nutritionist'
  const cfg = roleConfig[role]
  const Icon = cfg.icon

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Back button */}
      <Link
        href="/auth"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-all group mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t('login.backToRoles')}
      </Link>

      {/* Role badge */}
      <div className="flex flex-col items-center mb-8">
        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4', cfg.iconBg)}>
          <Icon className={cn('w-8 h-8', cfg.iconColor)} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isTrainer ? t('login.titleTrainer') : isNutritionist ? t('login.titleNutritionist') : t('login.titleUser')}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{t('tagline')}</p>
      </div>

      {/* Form card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-amber-100/20 border border-amber-200/30 p-6 sm:p-8">
        {error && (
          <div className="mb-5 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
              }}
              className={cn(
                'w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 transition-all hover:border-gray-600 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent',
                fieldErrors.email ? 'border-red-400 focus:ring-red-500' : 'border-gray-900 focus:ring-primary-500'
              )}
              placeholder="name@example.com"
              disabled={isLoading}
            />
            {fieldErrors.email && <p className="mt-1.5 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
                }}
                className={cn(
                  'w-full px-4 py-3 pr-12 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 transition-all hover:border-gray-600 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent',
                  fieldErrors.password ? 'border-red-400 focus:ring-red-500' : 'border-gray-900 focus:ring-primary-500'
                )}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1.5 text-sm text-red-600">{fieldErrors.password}</p>}
          </div>

          {/* Remember me + forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer group" onClick={() => !isLoading && setFormData({ ...formData, rememberMe: !formData.rememberMe })}>
              <div
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                  formData.rememberMe
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-gray-400 bg-white'
                )}
              >
                {formData.rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span className="ml-2 text-sm text-gray-600 select-none group-hover:text-gray-900 transition-colors">
                {t('login.rememberMe')}
              </span>
            </label>

            <Link
              href="#"
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 font-medium transition-all"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>

          <Button
            variant={isNutritionist ? 'nutritionist' : isTrainer ? 'trainer' : 'user'}
            size="lg"
            fullWidth
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" color="white" />
                {t('login.submitting')}
              </span>
            ) : t('login.submit')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-amber-200/30" /></div>
        </div>

        {/* Links */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {t('login.noAccount')}{' '}
            <Link
              href={`/auth/register?role=${role}`}
              className="text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 font-semibold transition-all"
            >
              {t('login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto flex items-center justify-center min-h-[400px]">
        <Spinner size="md" color="primary" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
