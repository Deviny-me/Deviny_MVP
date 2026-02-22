'use client'

import { useLevel } from '@/components/level/LevelProvider'
import { AchievementNotificationProvider } from '@/components/shared/AchievementNotificationProvider'

/**
 * @deprecated Use AchievementBridge from '@/components/shared/AchievementBridge' instead.
 * Kept for backward compatibility with trainer layout.
 */
export function TrainerAchievementBridge({ children }: { children: React.ReactNode }) {
  const { refreshLevel } = useLevel()

  return (
    <AchievementNotificationProvider onLevelChange={refreshLevel}>
      {children}
    </AchievementNotificationProvider>
  )
}
