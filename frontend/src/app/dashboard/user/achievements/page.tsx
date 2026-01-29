'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { useUser } from '@/components/user/UserProvider'
import { 
  Award,
  Flame,
  Trophy,
  Star,
  Target,
  Calendar,
  TrendingUp,
  Lock
} from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  total?: number
}

export default function AchievementsPage() {
  const { user } = useUser()

  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first workout',
      icon: '👟',
      tier: 'bronze',
      unlocked: true,
      unlockedAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Week Warrior',
      description: 'Maintain a 7-day workout streak',
      icon: '🔥',
      tier: 'bronze',
      unlocked: true,
      unlockedAt: '2024-02-10',
    },
    {
      id: '3',
      name: 'Century Club',
      description: 'Complete 100 workouts',
      icon: '💯',
      tier: 'silver',
      unlocked: true,
      unlockedAt: '2024-08-22',
    },
    {
      id: '4',
      name: 'Social Butterfly',
      description: 'Get 100 followers',
      icon: '🦋',
      tier: 'gold',
      unlocked: false,
      progress: 45,
      total: 100,
    },
    {
      id: '5',
      name: 'Beast Mode',
      description: 'Complete 500 workouts',
      icon: '🦁',
      tier: 'gold',
      unlocked: false,
      progress: 147,
      total: 500,
    },
    {
      id: '6',
      name: 'Iron Will',
      description: 'Maintain a 30-day streak',
      icon: '⚡',
      tier: 'silver',
      unlocked: true,
      unlockedAt: '2024-09-15',
    },
    {
      id: '7',
      name: 'Program Master',
      description: 'Complete 10 training programs',
      icon: '📚',
      tier: 'gold',
      unlocked: false,
      progress: 3,
      total: 10,
    },
    {
      id: '8',
      name: 'Early Bird',
      description: 'Complete 50 morning workouts',
      icon: '🌅',
      tier: 'silver',
      unlocked: false,
      progress: 28,
      total: 50,
    },
    {
      id: '9',
      name: 'Legendary',
      description: 'Reach Level 50',
      icon: '👑',
      tier: 'platinum',
      unlocked: false,
      progress: user?.level || 1,
      total: 50,
    },
  ]

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-800'
      case 'silver': return 'from-gray-300 to-gray-500'
      case 'gold': return 'from-yellow-400 to-yellow-600'
      case 'platinum': return 'from-purple-400 to-purple-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getTierBorder = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'border-amber-600/50'
      case 'silver': return 'border-gray-400/50'
      case 'gold': return 'border-yellow-500/50'
      case 'platinum': return 'border-purple-500/50'
      default: return 'border-white/10'
    }
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)

  // Calculate level progress
  const currentXp = user?.xp || 0
  const xpToNextLevel = user?.xpToNextLevel || 1000
  const levelProgress = (currentXp / xpToNextLevel) * 100

  return (
    <UserMainLayout>
      <div className="space-y-6 pb-6">
        {/* Level Card */}
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-xl border border-white/10 p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF6B35]/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
                <span className="text-4xl font-bold text-white">{user?.level || 1}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Level {user?.level || 1}</h2>
                <p className="text-gray-400">Fitness Enthusiast</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Progress to Level {(user?.level || 1) + 1}</span>
                <span className="text-white font-medium">{currentXp} / {xpToNextLevel} XP</span>
              </div>
              <div className="h-3 bg-[#0A0A0A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF0844] rounded-full transition-all"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-lg font-bold text-white">{user?.streak || 0}</span>
                </div>
                <span className="text-xs text-gray-400">Day Streak</span>
              </div>
              <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-lg font-bold text-white">{unlockedAchievements.length}</span>
                </div>
                <span className="text-xs text-gray-400">Achievements</span>
              </div>
              <div className="bg-[#0A0A0A] rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-lg font-bold text-white">{user?.workoutsCompleted || 0}</span>
                </div>
                <span className="text-xs text-gray-400">Workouts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unlocked Achievements */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Unlocked ({unlockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-[#1A1A1A] rounded-xl border ${getTierBorder(achievement.tier)} p-4 hover:border-opacity-100 transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTierColor(achievement.tier)} flex items-center justify-center text-2xl`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{achievement.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{achievement.description}</p>
                    {achievement.unlockedAt && (
                      <p className="text-[10px] text-[#FF6B35] mt-1">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locked Achievements */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-500" />
            In Progress ({lockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 opacity-75"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] flex items-center justify-center text-2xl grayscale">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{achievement.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{achievement.description}</p>
                    {achievement.progress !== undefined && achievement.total && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.total}</span>
                        </div>
                        <div className="h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gray-500 rounded-full"
                            style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UserMainLayout>
  )
}
