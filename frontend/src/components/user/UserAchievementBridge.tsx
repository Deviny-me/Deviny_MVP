'use client'

import { useUser } from '@/components/user/UserProvider'
import { AchievementNotificationProvider } from '@/components/shared/AchievementNotificationProvider'

/**
 * Wraps AchievementNotificationProvider and wires onLevelChange to UserProvider.refreshUser()
 * so XP/level updates automatically when an achievement is awarded.
 */
export function UserAchievementBridge({ children }: { children: React.ReactNode }) {
  const { refreshUser } = useUser()

  return (
    <AchievementNotificationProvider onLevelChange={refreshUser}>
      {children}
    </AchievementNotificationProvider>
  )
}
