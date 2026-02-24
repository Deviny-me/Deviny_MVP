'use client'

import { useEffect, useState } from 'react'
import { Trophy, Lock, Award, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getMyAchievements } from '@/lib/api/achievementApi'
import type { AchievementDto, MyAchievementsResponse } from '@/types/achievement'
import { getIcon, getGradient, getRarityBorder, getRarityGlow, getRarityLabelColor } from '@/components/shared/achievementUtils'
import { useAccentColors } from '@/lib/theme/useAccentColors'

export default function AchievementsContent() {
  const [data, setData] = useState<MyAchievementsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('achievements')
  const accent = useAccentColors()
  const accentGradient = accent.gradient
  const accentText = accent.text
  const spinnerColor = accent.loader

  useEffect(() => {
    getMyAchievements()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`w-8 h-8 ${spinnerColor} animate-spin`} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load achievements</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const unlocked = data.all.filter(a => a.isUnlocked)
  const locked = data.all.filter(a => !a.isUnlocked)

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
            <p className="text-gray-400">{t('subtitle')}</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent`}>
              {data.unlockedCount}/{data.totalCount}
            </div>
            <p className="text-sm text-gray-400">{t('unlocked')}</p>
          </div>
        </div>
      </div>

      {/* Unlocked */}
      <Section
        title={t('unlocked')}
        count={unlocked.length}
        icon={<Trophy className="w-5 h-5 text-yellow-400" />}
        emptyIcon={<Trophy className="w-8 h-8 text-gray-400" />}
        emptyTitle={t('noAchievements')}
        emptyText={t('completeToUnlock')}
        items={unlocked}
        accentText={accentText}
      />

      {/* Locked */}
      <Section
        title={t('locked')}
        count={locked.length}
        icon={<Lock className="w-5 h-5 text-gray-500" />}
        emptyIcon={<Award className="w-8 h-8 text-yellow-400" />}
        emptyTitle={t('allUnlocked')}
        emptyText=""
        items={locked}
        accentText={accentText}
      />
    </div>
  )
}

function Section({
  title,
  count,
  icon,
  emptyIcon,
  emptyTitle,
  emptyText,
  items,
  accentText,
}: {
  title: string
  count: number
  icon: React.ReactNode
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptyText: string
  items: AchievementDto[]
  accentText: string
}) {
  if (count === 0) {
    return (
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          {icon} {title} (0)
        </h3>
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            {emptyIcon}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{emptyTitle}</h3>
          <p className="text-sm text-gray-400">{emptyText}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        {icon} {title} ({count})
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(a => (
          <AchievementCard key={a.id} achievement={a} accentText={accentText} />
        ))}
      </div>
    </div>
  )
}

function AchievementCard({ achievement, accentText }: { achievement: AchievementDto; accentText: string }) {
  const Icon = getIcon(achievement.iconKey)
  const gradient = getGradient(achievement.colorKey)
  const borderCls = achievement.isUnlocked
    ? getRarityBorder(achievement.rarity)
    : 'border-white/5'
  const glowCls = achievement.isUnlocked ? getRarityGlow(achievement.rarity) : ''
  const rarityColor = getRarityLabelColor(achievement.rarity)

  return (
    <div
      className={`bg-[#1A1A1A] rounded-xl border ${borderCls} p-4 hover:scale-105 transition-all cursor-pointer group ${glowCls}`}
    >
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className="relative mb-3">
          {achievement.isUnlocked ? (
            <>
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity`} />
              <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] flex items-center justify-center opacity-30 group-hover:opacity-40 transition-opacity">
                <Icon className="w-8 h-8 text-gray-400" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-600" />
              </div>
            </>
          )}
        </div>

        <h4 className={`font-semibold text-sm mb-1 ${achievement.isUnlocked ? 'text-white' : 'text-gray-400'}`}>
          {achievement.title}
        </h4>
        <p className={`text-xs mb-2 ${achievement.isUnlocked ? 'text-gray-400' : 'text-gray-500'}`}>
          {achievement.description}
        </p>

        {/* Rarity + XP */}
        <div className="flex items-center gap-2 mt-auto">
          <span className={`text-[10px] font-medium ${rarityColor}`}>{achievement.rarity}</span>
          {achievement.xpReward > 0 && (
            <span className={`text-[10px] ${accentText}`}>+{achievement.xpReward} XP</span>
          )}
        </div>

        {/* Date unlocked */}
        {achievement.isUnlocked && achievement.awardedAt && (
          <p className="text-[10px] text-gray-500 mt-1">
            {new Date(achievement.awardedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}
