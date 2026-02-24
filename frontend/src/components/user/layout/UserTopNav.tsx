'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { 
  Flame, 
  MessageCircle, 
  Bell, 
  Settings,
  LogOut,
  User,
  Users
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useUser } from '@/components/user/UserProvider'
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
    <nav className="sticky top-0 bg-[#1A1A1A] border-b border-white/10 z-50 shadow-xl">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* Logo */}
            <button 
              onClick={() => router.push('/user')}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </button>

            {/* Search */}
            <SearchBar placeholder={t('searchUserPlaceholder')} />
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const hasUnread = item.badge !== undefined && item.badge > 0
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`relative flex flex-col items-center justify-center px-6 py-2 rounded transition-colors ${
                    isActive(item.path)
                      ? 'text-[#3B82F6]'
                      : hasUnread
                      ? 'text-[#2563EB] hover:text-[#2563EB]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-6 h-6" strokeWidth={1.5} />
                  <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]" />
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute top-1 right-4 w-4 h-4 bg-[#2563EB] rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-[10px] font-bold text-white">{item.badge}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <LanguageSwitcher compact />
            <div className="w-px h-6 bg-white/10" />
            {/* Notifications */}
            <NotificationDropdown />

            <div className="w-px h-6 bg-white/10" />

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 pr-3 rounded hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-white leading-tight">{t('me')}</p>
                  <svg className="w-3 h-3 text-gray-400 mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {user?.fullName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user?.fullName || 'User'}</p>
                          <p className="text-xs text-gray-400">Level {user?.level || 1} • {user?.xp || 0} XP</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          router.push('/user/profile')
                          setShowProfileMenu(false)
                        }}
                        className="mt-3 w-full py-1.5 border border-[#3B82F6] text-[#3B82F6] rounded-lg text-sm font-semibold hover:bg-[#3B82F6]/10 transition-colors"
                      >
                        {t('viewProfile')}
                      </button>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          router.push('/user/settings')
                          setShowProfileMenu(false)
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                      >
                        <Settings className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm">{t('settingsPrivacy')}</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                      >
                        <LogOut className="w-5 h-5" strokeWidth={1.5} />
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
