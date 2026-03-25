'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { 
  MessageCircle, 
  Bell, 
  Settings,
  LogOut,
  User,
  Users
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useUser } from '@/components/user/UserProvider'
import { useLevel } from '@/components/level/LevelProvider'
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext'
import { SearchBar } from '@/components/search/SearchBar'
import { NotificationDropdown } from '@/components/shared/NotificationDropdown'
import { useTranslations } from 'next-intl'

export function UserTopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useUser()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { unreadCount } = useUnreadMessages()
  const { level } = useLevel()
  const t = useTranslations('nav')

  const navItems = [
    { icon: Users, label: t('friends'), path: '/user/friends' },
    { icon: MessageCircle, label: t('messages'), path: '/user/messages', badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: User, label: t('profile'), path: '/user/profile' },
    { icon: Settings, label: t('settings'), path: '/user/settings' },
  ]

  // Debug logging
  useEffect(() => {
    console.log('[UserTopNav] unreadCount updated:', unreadCount)
  }, [unreadCount])

  const isActive = (path: string) => pathname === path

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <nav className="sticky top-0 glass-strong border-b border-white/[0.06] z-50">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* Logo */}
            <button 
              onClick={() => router.push('/user')}
              className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <Image src="/logo-icon.png" alt="Deviny" width={32} height={32} className="rounded-lg" />
            </button>

            {/* Search */}
            <SearchBar placeholder={t('searchUserPlaceholder')} />
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const hasUnread = item.badge !== undefined && item.badge > 0
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`relative flex flex-col items-center justify-center px-5 py-2 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'text-[#0c8de6] bg-[#0c8de6]/[0.08]'
                      : hasUnread
                      ? 'text-[#0070c4] hover:text-[#0070c4]'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#0c8de6] rounded-full" />
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute -top-0.5 right-2 min-w-[18px] h-[18px] bg-[#0c8de6] rounded-full flex items-center justify-center px-1">
                      <span className="text-[10px] font-bold text-white">{item.badge}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <LanguageSwitcher compact />
            <div className="w-px h-5 bg-white/[0.08]" />
            {/* Notifications */}
            <NotificationDropdown />

            <div className="w-px h-5 bg-white/[0.08]" />

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0c8de6] to-[#0070c4] flex items-center justify-center ring-2 ring-[#0c8de6]/20">
                  <span className="text-white text-sm font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-white leading-tight">{t('me')}</p>
                  <svg className={`w-3 h-3 text-gray-400 mx-auto mt-0.5 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="p-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0c8de6] to-[#0070c4] flex items-center justify-center ring-2 ring-[#0c8de6]/20">
                          <span className="text-white text-lg font-bold">
                            {user?.fullName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{user?.fullName || 'User'}</p>
                          <p className="text-xs text-gray-500">{t('user') || 'Пользователь'}</p>
                        </div>
                      </div>
                      {/* Level Display */}
                      {level && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-[#0c8de6]/[0.06] to-[#0070c4]/[0.06] border border-[#0c8de6]/10 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-white">Level {level.currentLevel}</span>
                            <span className="text-[11px] text-gray-500">{level.currentXp} / {level.requiredXpForNextLevel} XP</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#0c8de6] to-[#0070c4] rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${(level.currentXp / level.requiredXpForNextLevel) * 100}%` }}
                            />
                          </div>
                          {level.levelTitle && (
                            <p className="text-[10px] text-[#0c8de6]/80 font-medium mt-1.5">{level.levelTitle}</p>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          router.push('/user/profile')
                          setShowProfileMenu(false)
                        }}
                        className="mt-3 w-full py-2 border border-[#0c8de6]/30 text-[#0c8de6] rounded-lg text-sm font-medium hover:bg-[#0c8de6]/10 hover:border-[#0c8de6]/50 transition-all"
                      >
                        {t('viewProfile')}
                      </button>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          router.push('/user/settings')
                          setShowProfileMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-white/[0.04] hover:text-gray-200 transition-all"
                      >
                        <Settings className="w-[18px] h-[18px]" strokeWidth={1.5} />
                        <span className="text-sm">{t('settingsPrivacy')}</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-500/[0.08] hover:text-red-400 transition-all"
                      >
                        <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
                        <span className="text-sm">{t('signOut')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
