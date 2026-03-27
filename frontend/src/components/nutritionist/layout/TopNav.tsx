'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { 
  MessageCircle, 
  Settings,
  LogOut,
  User,
  Users
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { fetchNutritionistProfile } from '@/lib/api/nutritionistProfileApi'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { getMediaUrl } from '@/lib/config'
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext'
import { useLevel } from '@/components/level/LevelProvider'
import { SearchBar } from '@/components/search/SearchBar'
import { NotificationDropdown } from '@/components/shared/NotificationDropdown'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const t = useTranslations('nav')
  const tSearch = useTranslations('search')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const { unreadCount } = useUnreadMessages()
  const { level } = useLevel()

  const roleLabel = t('nutritionist')

  useEffect(() => {
    loadProfile()
    
    const handleAvatarUpdate = () => {
      loadProfile()
    }
    
    window.addEventListener('nutritionistAvatarUpdated', handleAvatarUpdate)
    return () => window.removeEventListener('nutritionistAvatarUpdated', handleAvatarUpdate)
  }, [])

  const loadProfile = async () => {
    try {
      const data = await fetchNutritionistProfile()
      setProfile(data)
    } catch (error) {
      console.error('Failed to load nutritionist profile:', error)
    }
  }

  useRealtimeScopeRefresh(['profile'], () => {
    loadProfile()
  })

  const navItems = [
    { icon: Users, label: t('friends'), path: '/nutritionist/friends', badge: undefined },
    { icon: MessageCircle, label: t('messages'), path: '/nutritionist/messages', badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: User, label: t('profile'), path: '/nutritionist/profile', badge: undefined },
    { icon: Settings, label: t('settings'), path: '/nutritionist/settings', badge: undefined },
  ]

  const isActive = (path: string) => pathname === path

  const handleLogout = async () => {
    await logout()
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
              onClick={() => router.push('/nutritionist')}
              className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <Image src="/logo-icon.png" alt="Deviny" width={32} height={32} className="rounded-lg" />
            </button>

            {/* Search */}
            <SearchBar placeholder={tSearch('nutritionistPlaceholder')} />
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
                      ? 'text-[#28bf68] bg-[#28bf68]/[0.08]'
                      : hasUnread
                      ? 'text-[#1c9e52] hover:text-[#1c9e52]'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#28bf68] rounded-full" />
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute -top-0.5 right-2 min-w-[18px] h-[18px] bg-[#28bf68] rounded-full flex items-center justify-center px-1">
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
                {profile?.trainer?.avatarUrl ? (
                  <img
                    src={getMediaUrl(profile.trainer.avatarUrl) || ''}
                    alt={profile.trainer.fullName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#28bf68]/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#28bf68] to-[#1c9e52] flex items-center justify-center ring-2 ring-[#28bf68]/20">
                    <span className="text-white text-sm font-bold">
                      {profile?.trainer?.initials || 'N'}
                    </span>
                  </div>
                )}
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
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-slide-down">
                    <div className="p-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        {profile?.trainer?.avatarUrl ? (
                          <img
                            src={getMediaUrl(profile.trainer.avatarUrl) || ''}
                            alt={profile.trainer.fullName}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-[#28bf68]/20"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#28bf68] to-[#1c9e52] flex items-center justify-center ring-2 ring-[#28bf68]/20">
                            <span className="text-white text-lg font-bold">
                              {profile?.trainer?.initials || 'N'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{profile?.trainer?.fullName || `${user?.firstName} ${user?.lastName}`}</p>
                          <p className="text-xs text-gray-500">{roleLabel}</p>
                        </div>
                      </div>
                      {/* Level Display */}
                      {level && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-[#28bf68]/[0.06] to-[#1c9e52]/[0.06] border border-[#28bf68]/10 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-white">Level {level.currentLevel}</span>
                            <span className="text-[11px] text-gray-500">{level.currentXp} / {level.requiredXpForNextLevel} XP</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#28bf68] to-[#1c9e52] rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${(level.currentXp / level.requiredXpForNextLevel) * 100}%` }}
                            />
                          </div>
                          {level.levelTitle && (
                            <p className="text-[10px] text-[#28bf68]/80 font-medium mt-1.5">{level.levelTitle}</p>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          router.push('/nutritionist/profile')
                          setShowProfileMenu(false)
                        }}
                        className="mt-3 w-full py-2 border border-[#28bf68]/30 text-[#28bf68] rounded-lg text-sm font-medium hover:bg-[#28bf68]/10 hover:border-[#28bf68]/50 transition-all"
                      >
                        {t('viewProfile')}
                      </button>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          router.push('/nutritionist/settings')
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
