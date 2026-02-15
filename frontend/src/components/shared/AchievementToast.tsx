'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import type { AchievementAwardedEvent } from '@/types/achievement'
import { getIcon, getGradient, getRarityLabelColor } from '@/components/shared/achievementUtils'

interface Toast {
  id: string
  achievement: AchievementAwardedEvent
}

export function useAchievementToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((achievement: AchievementAwardedEvent) => {
    const id = `${achievement.id}-${Date.now()}`
    setToasts(prev => [...prev, { id, achievement }])

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 6000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, show, dismiss }
}

interface AchievementToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function AchievementToastContainer({ toasts, onDismiss }: AchievementToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <AchievementToast
            key={toast.id}
            achievement={toast.achievement}
            onDismiss={() => onDismiss(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function AchievementToast({
  achievement,
  onDismiss,
}: {
  achievement: AchievementAwardedEvent
  onDismiss: () => void
}) {
  const Icon = getIcon(achievement.iconKey)
  const gradient = getGradient(achievement.colorKey)
  const rarityColor = getRarityLabelColor(achievement.rarity)

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="pointer-events-auto w-80 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Top gradient accent */}
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />

      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400 uppercase tracking-wide">Achievement Unlocked!</span>
          </div>
          <h4 className="text-sm font-bold text-white truncate">{achievement.title}</h4>
          <p className="text-xs text-gray-400 line-clamp-1">{achievement.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-medium ${rarityColor}`}>{achievement.rarity}</span>
            {achievement.xpReward > 0 && (
              <span className="text-[10px] text-[#FF6B35]">+{achievement.xpReward} XP</span>
            )}
          </div>
        </div>

        {/* Close */}
        <button onClick={onDismiss} className="text-gray-500 hover:text-white transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
