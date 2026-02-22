'use client'

import { useLevel } from '@/components/level/LevelProvider'
import { AchievementNotificationProvider } from '@/components/shared/AchievementNotificationProvider'

/**
 * Wraps AchievementNotificationProvider and wires onLevelChange to LevelProvider.refreshLevel()
 * so XP/level bar updates automatically when an achievement is awarded.
 * Shared between Trainer and Nutritionist layouts.
 */
export function AchievementBridge({ children }: { children: React.ReactNode }) {
  const { refreshLevel } = useLevel()

  return (
    <AchievementNotificationProvider onLevelChange={refreshLevel}>
      {children}
    </AchievementNotificationProvider>
  )
}
