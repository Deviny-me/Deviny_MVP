'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { User, Dumbbell, Apple, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { saveRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'

export default function AuthPage() {
  const t = useTranslations('auth')
  const [loadingRole, setLoadingRole] = useState<RoleType | null>(null)

  const roles: {
    type: RoleType
    icon: typeof User
    label: string
    description: string
    gradient: string
    iconBg: string
    iconColor: string
    hoverBorder: string
  }[] = [
    {
      type: 'user',
      icon: User,
      label: t('roles.user.title'),
      description: t('roles.user.description'),
      gradient: 'from-user-500 to-user-600',
      iconBg: 'bg-user-100',
      iconColor: 'text-user-600',
      hoverBorder: 'hover:border-user-300 hover:shadow-user-100/50',
    },
    {
      type: 'trainer',
      icon: Dumbbell,
      label: t('roles.trainer.title'),
      description: t('roles.trainer.description'),
      gradient: 'from-trainer-500 to-trainer-600',
      iconBg: 'bg-trainer-100',
      iconColor: 'text-trainer-600',
      hoverBorder: 'hover:border-trainer-300 hover:shadow-trainer-100/50',
    },
    {
      type: 'nutritionist',
      icon: Apple,
      label: t('roles.nutritionist.title'),
      description: t('roles.nutritionist.description'),
      gradient: 'from-nutritionist-500 to-nutritionist-600',
      iconBg: 'bg-nutritionist-100',
      iconColor: 'text-nutritionist-600',
      hoverBorder: 'hover:border-nutritionist-300 hover:shadow-nutritionist-100/50',
    },
  ]

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Mobile hero */}
      <div className="lg:hidden text-center mb-6">
        <p className="text-gray-500 text-sm">{t('tagline')}</p>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('heroTitle')}</h2>
        <p className="mt-2 text-gray-500">{t('chooseRole')}</p>
      </div>

      <div className="flex flex-col gap-4">
        {roles.map(({ type, icon: Icon, label, description, iconBg, iconColor, hoverBorder }) => (
          <Link
            key={type}
            href={`/auth/login?role=${type}`}
            onClick={() => { saveRole(type); setLoadingRole(type) }}
            className={cn(
              'group flex items-center gap-5 rounded-2xl border-2 border-amber-200/30 bg-white/80 backdrop-blur-sm p-5 shadow-sm shadow-amber-100/10 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]',
              hoverBorder,
              loadingRole && loadingRole !== type && 'opacity-50 pointer-events-none',
            )}
          >
            <div className={cn('flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110', iconBg)}>
              <Icon className={cn('w-7 h-7', iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-lg">{label}</p>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
            {loadingRole === type ? (
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" />
            ) : (
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
            )}
          </Link>
        ))}
      </div>

      {/* Mobile features hint */}
      <div className="lg:hidden mt-10 grid grid-cols-2 gap-3">
        {[
          { emoji: '💪', text: t('features.programs') },
          { emoji: '👥', text: t('features.community') },
          { emoji: '🏆', text: t('features.challenges') },
          { emoji: '💬', text: t('features.chat') },
        ].map(({ emoji, text }) => (
          <div key={text} className="flex items-center gap-2 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-200/30 p-3">
            <span className="text-lg">{emoji}</span>
            <span className="text-xs font-medium text-gray-600">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
