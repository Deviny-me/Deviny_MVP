'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LogOut, LayoutGrid, Users, Dumbbell, Calendar, MessageSquare, DollarSign, User, Settings, LucideIcon } from 'lucide-react'
import { useUser } from '@/components/user/UserProvider'
import { useLanguage } from '@/components/language/LanguageProvider'
import Link from 'next/link'

interface NavItemData {
  titleKey: keyof typeof import('@/components/language/LanguageProvider').useLanguage extends () => { t: infer T } ? T : never
  href: string
  icon: LucideIcon
}

const navItems: { titleKey: string; href: string; icon: LucideIcon }[] = [
  { titleKey: 'dashboard', href: '/trainer/dashboard', icon: LayoutGrid },
  { titleKey: 'clients', href: '/trainer/clients', icon: Users },
  { titleKey: 'programs', href: '/trainer/programs', icon: Dumbbell },
  { titleKey: 'schedule', href: '/trainer/schedule', icon: Calendar },
  { titleKey: 'chat', href: '/trainer/chat', icon: MessageSquare },
  { titleKey: 'finance', href: '/trainer/finance', icon: DollarSign },
  { titleKey: 'profile', href: '/trainer/profile', icon: User },
  { titleKey: 'settings', href: '/trainer/settings', icon: Settings },
]

export function TrainerSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useUser()
  const { t } = useLanguage()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login?role=trainer')
  }

  // Получаем инициалы из имени
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'T'

  const getTitle = (key: string): string => {
    const translations = t as unknown as Record<string, string>
    return translations[key] || key
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[272px] bg-white dark:bg-neutral-950 border-r border-gray-200 dark:border-neutral-800 flex flex-col">
      {/* Branding */}
      <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">CoachOS</h1>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">{t.trainerPlatform}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{getTitle(item.titleKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Profile Card */}
      <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-neutral-50 truncate">{user?.name || t.trainer}</p>
            <p className="text-sm text-gray-500 dark:text-neutral-400">{t.trainer}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title={t.logout}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
