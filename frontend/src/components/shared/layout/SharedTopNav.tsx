'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Flame } from 'lucide-react'
import { ReactNode } from 'react'
import { TopNavItem, UserRole } from './types'
import { SearchBar } from '@/components/search/SearchBar'

interface SharedTopNavProps {
  role: UserRole
  basePath: string
  logoText?: string
  searchPlaceholder: string
  navItems: TopNavItem[]
  unreadCount?: number
  profileSection: ReactNode
  className?: string
}

/**
 * Shared top navigation component.
 * Configurable via props for different user roles.
 */
export function SharedTopNav({
  role,
  basePath,
  logoText,
  searchPlaceholder,
  navItems,
  unreadCount = 0,
  profileSection,
  className,
}: SharedTopNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  // Update nav items with unread count for messages
  const itemsWithBadges = navItems.map(item => ({
    ...item,
    badge: item.path.includes('/messages') && unreadCount > 0 ? unreadCount : item.badge
  }))

  return (
    <nav className={`sticky top-0 bg-[#1A1A1A] border-b border-white/10 z-50 shadow-xl ${className || ''}`}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* Logo */}
            <button 
              onClick={() => router.push(basePath)}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              {logoText && (
                <span className="text-sm font-bold text-white hidden sm:block">{logoText}</span>
              )}
            </button>

            {/* Search */}
            <SearchBar placeholder={searchPlaceholder} />
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-2">
            {itemsWithBadges.map((item) => {
              const hasUnread = item.badge !== undefined && item.badge > 0
              const ItemIcon = item.icon
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
                  <ItemIcon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-[10px] font-medium mt-0.5 hidden lg:block">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]" />
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute top-0 right-2 w-4 h-4 bg-[#FF0844] rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-[10px] font-bold text-white">{item.badge}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: Profile Section (passed as render prop) */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {profileSection}
          </div>
        </div>
      </div>
    </nav>
  )
}
