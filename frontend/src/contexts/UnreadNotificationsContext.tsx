'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react'
import { notificationsApi } from '@/lib/api/notificationsApi'
import { chatConnection } from '@/lib/signalr/chatConnection'

interface UnreadNotificationsContextType {
  unreadCount: number
  refreshCount: () => void
}

const UnreadNotificationsContext = createContext<UnreadNotificationsContextType | undefined>(undefined)

const POLLING_INTERVAL = 30_000 // 30 seconds

export function UnreadNotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsApi.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('[Notifications] Failed to load unread count:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Real-time unread count updates via SignalR
  useEffect(() => {
    const handleCountUpdate = (data: { unreadCount: number }) => {
      console.log('[Notifications] Real-time count update:', data.unreadCount)
      setUnreadCount(data.unreadCount)
    }

    chatConnection.onNotificationCountUpdated(handleCountUpdate)

    return () => {
      chatConnection.off('NotificationCountUpdated', handleCountUpdate)
    }
  }, [])

  // Fallback polling (keeps working even if SignalR disconnects)
  useEffect(() => {
    intervalRef.current = setInterval(fetchUnreadCount, POLLING_INTERVAL)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchUnreadCount])

  const refreshCount = useCallback(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  const value = useMemo(
    () => ({ unreadCount, refreshCount }),
    [unreadCount, refreshCount]
  )

  return (
    <UnreadNotificationsContext.Provider value={value}>
      {children}
    </UnreadNotificationsContext.Provider>
  )
}

export function useUnreadNotifications() {
  const context = useContext(UnreadNotificationsContext)
  if (context === undefined) {
    throw new Error('useUnreadNotifications must be used within UnreadNotificationsProvider')
  }
  return context
}
