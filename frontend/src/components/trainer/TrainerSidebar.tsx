'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LogOut, LayoutGrid, Users, Dumbbell, Calendar, MessageSquare, DollarSign, User, Settings, LucideIcon } from 'lucide-react'
import { useUser } from '@/components/user/UserProvider'
import { useLanguage } from '@/components/language/LanguageProvider'
import { LevelBadge } from '@/components/ui/LevelBadge'
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
        <div>
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">CoachOS</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">{t.trainerPlatform}</p>
        </div>
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
        {/* Profile Info - Clickable */}
        <Link 
          href="/trainer/profile" 
          className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 rounded-lg p-2 -mx-2 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold group-hover:ring-2 group-hover:ring-blue-400 dark:group-hover:ring-blue-500 transition-all">
            {initials}
          </div>
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-start gap-1">
              <p className="font-semibold text-gray-900 dark:text-neutral-50 truncate">{user?.name || t.trainer}</p>
              {/* Level Badge as superscript */}
              <div className="scale-[0.67] origin-top-left -ml-1 -mt-1">
                <LevelBadge showTitle={false} />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-neutral-400">{t.trainer}</p>
          </div>
          <User className="w-4 h-4 text-gray-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.logout}</span>
        </button>
      </div>
    </aside>
  )
}
