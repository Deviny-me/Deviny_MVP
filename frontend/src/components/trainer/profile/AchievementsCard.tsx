'use client'

import { Card } from '@/components/ui/Card'
import { AchievementDto } from '@/types/trainerProfile'
import { useLanguage } from '@/components/language/LanguageProvider'
import { Trophy, Star, Users, Award, Target, Zap } from 'lucide-react'

interface AchievementsCardProps {
  achievements: AchievementDto[]
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  users: Users,
  award: Award,
  target: Target,
  zap: Zap,
}

const toneColors = {
  yellow: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
  blue: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
  purple: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
  pink: 'bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400',
}

export function AchievementsCard({ achievements }: AchievementsCardProps) {
  const { t } = useLanguage()

  if (achievements.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">
          {t.achievements}
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Trophy className="w-12 h-12 text-gray-400 dark:text-neutral-600 mb-3" />
          <p className="text-gray-600 dark:text-neutral-400">
            {t.noAchievements}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">
        {t.achievements}
      </h3>
      <div className="space-y-3">
        {achievements.map((achievement) => {
          const IconComponent = iconMap[achievement.iconKey as keyof typeof iconMap] || Trophy
          const colorClass = toneColors[achievement.tone as keyof typeof toneColors] || toneColors.blue

          return (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg flex items-start gap-3 ${colorClass}`}
            >
              <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium mb-1">{achievement.title}</div>
                {achievement.subtitle && (
                  <div className="text-sm opacity-90">{achievement.subtitle}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
