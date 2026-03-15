'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { 
  Flame, 
  MessageCircle, 
  Bell, 
  Settings,
  LogOut,
  User,
  UserPlus
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { fetchTrainerProfile } from '@/lib/api/trainerProfileApi'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { getMediaUrl } from '@/lib/config'
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext'
import { useLevel } from '@/components/level/LevelProvider'
import { SearchBar } from '@/components/search/SearchBar'
import { NotificationDropdown } from '@/components/shared/NotificationDropdown'

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const t = useTranslations('nav')
  const tSearch = useTranslations('search')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfileResponse | null>(null)
  const { unreadCount } = useUnreadMessages()
  const { level } = useLevel()

  const roleLabel = t('trainer')
  const avatarFallbackInitial = 'T'

  useEffect(() => {
    loadTrainerProfile()
    
    // Listen for avatar update events
    const handleAvatarUpdate = () => {
      loadTrainerProfile()
    }
    
    window.addEventListener('trainerAvatarUpdated', handleAvatarUpdate)
    return () => window.removeEventListener('trainerAvatarUpdated', handleAvatarUpdate)
  }, [])

  const loadTrainerProfile = async () => {
    try {
      const data = await fetchTrainerProfile()
      setTrainerProfile(data)
    } catch (error) {
      console.error('Failed to load trainer profile:', error)
    }
  }

  const navItems = [
    { icon: UserPlus, label: t('friends'), path: '/trainer/friends', badge: undefined },
    { icon: MessageCircle, label: t('messages'), path: '/trainer/messages', badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: User, label: t('profile'), path: '/trainer/profile', badge: undefined },
    { icon: Settings, label: t('settings'), path: '/trainer/settings', badge: undefined },
  ]

  // Debug logging
  useEffect(() => {
    console.log('[TopNav] unreadCount updated:', unreadCount)
  }, [unreadCount])

  const isActive = (path: string) => pathname === path

  const handleLogout = async () => {
    await logout()
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
              onClick={() => router.push('/trainer')}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-white hidden sm:block uppercase">{roleLabel}</span>
            </button>

            {/* Search */}
            <SearchBar placeholder={tSearch('trainerPlaceholder')} />
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const hasUnread = item.badge !== undefined && item.badge > 0
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`relative flex flex-col items-center justify-center px-4 py-2 rounded transition-colors ${
                    isActive(item.path)
                      ? 'text-[#FF6B35]'
                      : hasUnread
                      ? 'text-[#FF0844] hover:text-[#FF0844]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-[10px] font-medium mt-0.5 hidden lg:block">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]" />
                  )}
                  {item.badge && (
                    <div className="absolute top-0 right-2 w-4 h-4 bg-[#FF0844] rounded-full flex items-center justify-center animate-pulse">
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
                {trainerProfile?.trainer?.avatarUrl ? (
                  <img
                    src={getMediaUrl(trainerProfile.trainer.avatarUrl) || ''}
                    alt={trainerProfile.trainer.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center border border-white/10">
                    <span className="text-white text-xs font-bold">
                      {trainerProfile?.trainer?.initials || avatarFallbackInitial}
                    </span>
                  </div>
                )}
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
                        {trainerProfile?.trainer?.avatarUrl ? (
                          <img
                            src={getMediaUrl(trainerProfile.trainer.avatarUrl) || ''}
                            alt={trainerProfile.trainer.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                            <span className="text-white text-lg font-bold">
                            {trainerProfile?.trainer?.initials || avatarFallbackInitial}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{trainerProfile?.trainer?.fullName || `${user?.firstName} ${user?.lastName}`}</p>
                          <p className="text-xs text-gray-400">{roleLabel}</p>
                        </div>
                      </div>
                      {/* Level Display */}
                      {level && (
                        <div className="mt-3 p-2.5 bg-gradient-to-r from-[#FF6B35]/10 to-[#FF0844]/10 border border-[#FF6B35]/20 rounded-lg">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-white">Level {level.currentLevel}</span>
                            <span className="text-xs text-gray-400">{level.currentXp} / {level.requiredXpForNextLevel} XP</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF0844] rounded-full transition-all duration-300"
                              style={{ width: `${(level.currentXp / level.requiredXpForNextLevel) * 100}%` }}
                            />
                          </div>
                          {level.levelTitle && (
                            <p className="text-[10px] text-amber-400 font-medium mt-1">{level.levelTitle}</p>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          router.push('/trainer/profile')
                          setShowProfileMenu(false)
                        }}
                        className="mt-3 w-full py-1.5 border border-[#FF6B35] text-[#FF6B35] rounded-lg text-sm font-semibold hover:bg-[#FF6B35]/10 transition-colors"
                      >
                        {t('viewProfile')}
                      </button>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          router.push('/trainer/settings')
                          setShowProfileMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-white/5 rounded-lg transition-colors text-left"
                      >
                        <Settings className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm">{t('settingsPrivacy')}</span>
                      </button>
                    </div>

                    <div className="border-t border-white/10 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-white/5 rounded-lg transition-colors text-left"
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
