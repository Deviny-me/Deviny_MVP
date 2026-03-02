'use client'

import { useLevel } from '@/components/level/LevelProvider'
import { useUser } from '@/components/user/UserProvider'
import { AchievementNotificationProvider } from '@/components/shared/AchievementNotificationProvider'

/**
 * Wraps AchievementNotificationProvider and wires onLevelChange to both
 * LevelProvider.refreshLevel() and UserProvider.refreshUser()
 * so XP/level bar and user data update automatically when an achievement is awarded.
 */
export function UserAchievementBridge({ children }: { children: React.ReactNode }) {
  const { refreshLevel } = useLevel()
  const { refreshUser } = useUser()

  const handleLevelChange = async () => {
    await Promise.all([refreshLevel(), refreshUser()])
  }

  return (
    <AchievementNotificationProvider onLevelChange={handleLevelChange}>
      {children}
    </AchievementNotificationProvider>
  )
}
