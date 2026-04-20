'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, Trophy, Dumbbell, UtensilsCrossed, Check, CheckCheck, UserPlus, UserCheck, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useUnreadNotifications } from '@/contexts/UnreadNotificationsContext'
import { notificationsApi } from '@/lib/api/notificationsApi'
import { Notification } from '@/types/notification'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { chatConnection } from '@/lib/signalr/chatConnection'

function getNotificationIcon(type: string) {
  switch (type) {
    case 'AchievementUnlocked':
      return <Trophy className="w-4 h-4 text-yellow-400" />
    case 'TrainingProgramCreated':
      return <Dumbbell className="w-4 h-4 text-blue-400" />
    case 'MealProgramCreated':
      return <UtensilsCrossed className="w-4 h-4 text-green-400" />
    case 'FriendRequestReceived':
      return <UserPlus className="w-4 h-4 text-purple-400" />
    case 'FriendRequestAccepted':
      return <UserCheck className="w-4 h-4 text-green-400" />
    case 'NewFollower':
      return <Users className="w-4 h-4 text-blue-400" />
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />
  }
}

function timeAgo(dateStr: string, t: (key: string, values?: Record<string, string | number | Date>) => string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return t('justNow')
  if (diffMin < 60) return t('minutesAgo', { count: diffMin })
  if (diffHour < 24) return t('hoursAgo', { count: diffHour })
  if (diffDay < 7) return t('daysAgo', { count: diffDay })
  return date.toLocaleDateString()
}

export function NotificationDropdown() {
  const accent = useAccentColors()
  const { unreadCount, refreshCount } = useUnreadNotifications()
  const t = useTranslations('notifications')
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const loadNotifications = useCallback(async (cursor?: string) => {
    setLoading(true)
    try {
      const response = await notificationsApi.getNotifications(cursor, 20)
      if (cursor) {
        setNotifications(prev => [...prev, ...response.items])
      } else {
        setNotifications(response.items)
      }
      setNextCursor(response.nextCursor)
      setHasLoaded(true)
    } catch (error) {
      console.error('[Notifications] Failed to load:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleToggle = () => {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening && !hasLoaded) {
      loadNotifications()
    }
    // Refresh when opening if already loaded (to catch any missed items)
    if (opening && hasLoaded) {
      loadNotifications()
    }
  }

  // Real-time notification listener
  useEffect(() => {
    const handleNewNotification = (data: { id: string; type: string; category?: string; title: string; message: string; relatedEntityType: string | null; relatedEntityId: string | null; isRead: boolean; createdAt: string }) => {
      console.log('[Notifications] Real-time notification received:', data)

      // Play notification sound
      try {
        const audio = new Audio('/sounds/message.wav')
        audio.volume = 0.4
        audio.play().catch(() => {})
      } catch {}

      // Prepend to notifications list if already loaded
      if (hasLoaded) {
        setNotifications(prev => [{
          id: data.id,
          type: data.type,
          category: data.category ?? 'System',
          title: data.title,
          message: data.message,
          relatedEntityType: data.relatedEntityType,
          relatedEntityId: data.relatedEntityId,
          isRead: data.isRead,
          createdAt: data.createdAt,
          readAt: null
        }, ...prev])
      }
    }

    chatConnection.onNotificationReceived(handleNewNotification)

    return () => {
      chatConnection.off('NotificationReceived', handleNewNotification)
    }
  }, [hasLoaded])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      )
      refreshCount()
    } catch (error) {
      console.error('[Notifications] Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      refreshCount()
    } catch (error) {
      console.error('[Notifications] Failed to mark all as read:', error)
    }
  }

  const handleLoadMore = () => {
    if (nextCursor && !loading) {
      loadNotifications(nextCursor)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg hover:bg-hover-overlay transition-all"
        title={t('title')}
      >
        <Bell className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <div className={`absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 ${accent.badge} rounded-full flex items-center justify-center`}>
            <span className="text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-2 border border-border rounded-xl overflow-hidden z-50 animate-slide-down" style={{ boxShadow: 'var(--dropdown-shadow)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('markAllRead')}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && !hasLoaded ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-faint-foreground">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">{t('noNotifications')}</p>
              </div>
            ) : (
              <>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border-subtle transition-colors cursor-pointer ${
                      notification.isRead
                        ? 'bg-transparent opacity-60'
                        : 'hover:bg-hover-overlay'
                    }`}
                    style={!notification.isRead ? { background: 'var(--unread-bg)' } : undefined}
                  >
                    {/* Icon */}
                    <div className="mt-0.5 p-1.5 rounded-lg bg-border-subtle flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-faint-foreground mt-1">
                        {timeAgo(notification.createdAt, t)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className={`mt-2 w-2 h-2 ${accent.badge} rounded-full flex-shrink-0`} />
                    )}
                  </div>
                ))}

                {/* Load More */}
                {nextCursor && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="w-full py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-hover-overlay transition-colors disabled:opacity-50"
                  >
                    {loading ? t('loading') : t('loadMore')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
