'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  Flame, 
  MessageCircle, 
  Bell, 
  Search,
  Settings,
  LogOut,
  User,
  Users
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useUser } from '@/components/user/UserProvider'
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext'

export function UserTopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useUser()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { unreadCount } = useUnreadMessages()

  const navItems = [
    { icon: Users, label: 'Friends', path: '/dashboard/user/friends' },
    { icon: MessageCircle, label: 'Messages', path: '/dashboard/user/messages', badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: User, label: 'Profile', path: '/dashboard/user/profile' },
    { icon: Settings, label: 'Settings', path: '/dashboard/user/settings' },
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
              onClick={() => router.push('/dashboard/user')}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trainers, programs, workouts..."
                className="w-full pl-10 pr-4 py-1.5 bg-[#0A0A0A] border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-[#262626] transition-colors"
              />
            </div>
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
                      ? 'text-[#FF6B35]'
                      : hasUnread
                      ? 'text-[#FF0844] hover:text-[#FF0844]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-6 h-6" strokeWidth={1.5} />
                  <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]" />
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute top-1 right-4 w-4 h-4 bg-[#FF0844] rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-[10px] font-bold text-white">{item.badge}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {/* Notifications */}
            <button className="relative p-2 rounded hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF0844] rounded-full" />
            </button>

            <div className="w-px h-6 bg-white/10" />

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 pr-3 rounded hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-white leading-tight">Me</p>
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
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
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
                          router.push('/dashboard/user/profile')
                          setShowProfileMenu(false)
                        }}
                        className="mt-3 w-full py-1.5 border border-[#FF6B35] text-[#FF6B35] rounded-lg text-sm font-semibold hover:bg-[#FF6B35]/10 transition-colors"
                      >
                        View Profile
                      </button>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          router.push('/dashboard/user/settings')
                          setShowProfileMenu(false)
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                      >
                        <Settings className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm">Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                      >
                        <LogOut className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm">Sign Out</span>
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
