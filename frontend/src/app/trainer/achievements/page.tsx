'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { 
  Award, 
  Trophy,
  Star,
  Flame,
  Target,
  Dumbbell,
  Heart,
  Zap,
  Lock
} from 'lucide-react'

const stats = {
  level: 42,
  totalXp: 84500,
  nextLevelXp: 90000,
  workoutsCompleted: 156,
  currentStreak: 12,
  longestStreak: 28,
  badgesEarned: 5,
  totalBadges: 8,
}

export default function AchievementsPage() {
  const t = useTranslations('achievementsPage')

  const badges = [
    { id: '1', name: t('firstSteps'), description: t('firstStepsDesc'), icon: Dumbbell, unlocked: true, date: '2025-12-01' },
    { id: '2', name: t('weekStreak'), description: t('weekStreakDesc'), icon: Flame, unlocked: true, date: '2025-12-08' },
    { id: '3', name: 'Social Butterfly', description: 'Add 10 friends', icon: Heart, unlocked: true, date: '2025-12-15' },
    { id: '4', name: 'Goal Crusher', description: 'Complete 5 challenges', icon: Target, unlocked: true, date: '2025-12-20' },
    { id: '5', name: 'Rising Star', description: 'Reach level 10', icon: Star, unlocked: true, date: '2025-12-25' },
    { id: '6', name: '30-Day Warrior', description: 'Work out 30 days in a row', icon: Flame, unlocked: false, progress: 65 },
    { id: '7', name: 'Elite Trainer', description: 'Complete 100 workouts', icon: Trophy, unlocked: false, progress: 45 },
    { id: '8', name: 'Champion', description: 'Win a group challenge', icon: Award, unlocked: false, progress: 0 },
  ]

  const progressToNextLevel = ((stats.totalXp % 10000) / 10000) * 100

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#FF6B35] to-[#FF0844] rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-1">{t('currentLevel')}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">{stats.level}</span>
                <span className="text-xl text-white/80">/ 100</span>
              </div>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" fill="white" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{stats.totalXp.toLocaleString()} XP</span>
              <span>{stats.nextLevelXp.toLocaleString()} XP</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <p className="text-sm text-white/80 text-center">
              {(stats.nextLevelXp - stats.totalXp).toLocaleString()} {t('xpToLevel')} {stats.level + 1}
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 text-center">
            <Dumbbell className="w-8 h-8 text-[#FF6B35] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.workoutsCompleted}</p>
            <p className="text-xs text-gray-400">{t('workouts')}</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" fill="currentColor" />
            <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
            <p className="text-xs text-gray-400">{t('dayStreak')}</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 text-center">
            <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.longestStreak}</p>
            <p className="text-xs text-gray-400">{t('bestStreak')}</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 text-center">
            <Award className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.badgesEarned}/{stats.totalBadges}</p>
            <p className="text-xs text-gray-400">{t('badges')}</p>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">{t('badgesAndAchievements')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative bg-[#1A1A1A] rounded-xl border p-4 text-center ${
                  badge.unlocked ? 'border-[#FF6B35]/50' : 'border-white/10 opacity-60'
                }`}
              >
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  badge.unlocked 
                    ? 'bg-gradient-to-br from-[#FF6B35] to-[#FF0844]' 
                    : 'bg-gray-700'
                }`}>
                  {badge.unlocked ? (
                    <badge.icon className="w-8 h-8 text-white" />
                  ) : (
                    <Lock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <h3 className={`font-semibold text-sm mb-1 ${badge.unlocked ? 'text-white' : 'text-gray-400'}`}>
                  {badge.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{badge.description}</p>
                
                {badge.unlocked ? (
                  <p className="text-xs text-[#FF6B35]">
                    {new Date(badge.date!).toLocaleDateString()}
                  </p>
                ) : badge.progress !== undefined && badge.progress > 0 ? (
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF0844]"
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">{t('locked')}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
