'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { User, Dumbbell, Apple } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { saveRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'

export default function AuthPage() {
  const t = useTranslations('auth')

  const roles: { type: RoleType; icon: typeof User; colorClass: string; label: string }[] = [
    { type: 'user', icon: User, colorClass: 'bg-user-600 hover:bg-user-700 focus-visible:ring-user-500', label: t('loginAsUser') },
    { type: 'trainer', icon: Dumbbell, colorClass: 'bg-trainer-600 hover:bg-trainer-700 focus-visible:ring-trainer-500', label: t('loginAsTrainer') },
    { type: 'nutritionist', icon: Apple, colorClass: 'bg-nutritionist-600 hover:bg-nutritionist-700 focus-visible:ring-nutritionist-500', label: t('loginAsNutritionist') },
  ]

  return (
    <div className="light w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-primary-700 mb-3">Deviny</h1>
        <p className="text-lg text-gray-600">
          {t('tagline')}
        </p>
      </div>

      <Card className="p-8">
        <div className="flex flex-col gap-4">
          {roles.map(({ type, icon: Icon, colorClass, label }) => (
            <Link
              key={type}
              href={`/auth/login?role=${type}`}
              onClick={() => saveRole(type)}
              className={cn(
                'w-full inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-medium text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                colorClass
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
