'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { useUser } from '@/components/user/UserProvider'
import { 
  Award,
  Flame,
  Trophy,
  Star,
  Target,
  Dumbbell,
  TrendingUp,
  Lock,
  Zap,
  Heart,
  Activity,
  Clock
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
  category: 'workout' | 'streak' | 'milestone' | 'special'
}

export default function AchievementsPage() {
  const { user } = useUser()

  // Sample achievements - some unlocked, some locked
  const achievements: Achievement[] = [
    // Unlocked achievements
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first workout',
      icon: '🎯',
      tier: 'bronze',
      unlocked: true,
      unlockedAt: '2026-01-15',
      category: 'workout'
    },
    {
      id: '2',
      name: 'Week Warrior',
      description: 'Train for 7 days in a row',
      icon: '🔥',
      tier: 'silver',
      unlocked: true,
      unlockedAt: '2026-01-22',
      category: 'streak'
    },
    {
      id: '3',
      name: 'Century Club',
      description: 'Complete 100 workouts',
      icon: '💯',
      tier: 'gold',
      unlocked: true,
      unlockedAt: '2026-01-30',
      category: 'milestone'
    },
    // Locked achievements
    {
      id: '4',
      name: 'Early Bird',
      description: 'Complete 10 morning workouts',
      icon: '🌅',
      tier: 'bronze',
      unlocked: false,
      progress: 3,
      total: 10,
      category: 'special'
    },
    {
      id: '5',
      name: 'Cardio King',
      description: 'Complete 50 cardio sessions',
      icon: '❤️',
      tier: 'silver',
      unlocked: false,
      progress: 15,
      total: 50,
      category: 'workout'
    },
    {
      id: '6',
      name: 'Strength Master',
      description: 'Complete 100 strength workouts',
      icon: '💪',
      tier: 'gold',
      unlocked: false,
      progress: 42,
      total: 100,
      category: 'workout'
    },
    {
      id: '7',
      name: 'Marathon Runner',
      description: 'Run a total of 100km',
      icon: '🏃',
      tier: 'silver',
      unlocked: false,
      progress: 28,
      total: 100,
      category: 'milestone'
    },
    {
      id: '8',
      name: 'Iron Will',
      description: 'Maintain a 30-day streak',
      icon: '⚡',
      tier: 'gold',
      unlocked: false,
      progress: 7,
      total: 30,
      category: 'streak'
    },
    {
      id: '9',
      name: 'Perfect Week',
      description: 'Complete all planned workouts in a week',
      icon: '⭐',
      tier: 'silver',
      unlocked: false,
      progress: 4,
      total: 7,
      category: 'special'
    },
    {
      id: '10',
      name: 'Fitness Legend',
      description: 'Reach level 50',
      icon: '👑',
      tier: 'platinum',
      unlocked: false,
      progress: 1,
      total: 50,
      category: 'milestone'
    },
    {
      id: '11',
      name: 'Yoga Master',
      description: 'Complete 25 yoga sessions',
      icon: '🧘',
      tier: 'bronze',
      unlocked: false,
      progress: 8,
      total: 25,
      category: 'workout'
    },
    {
      id: '12',
      name: 'Night Owl',
      description: 'Complete 10 evening workouts',
      icon: '🌙',
      tier: 'bronze',
      unlocked: false,
      progress: 6,
      total: 10,
      category: 'special'
    }
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

  return (
    <UserMainLayout>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Achievements</h1>
              <p className="text-gray-400">Track your fitness milestones and earn rewards</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF0844] bg-clip-text text-transparent">
                {unlockedAchievements.length}/{achievements.length}
              </div>
              <p className="text-sm text-gray-400">Unlocked</p>
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

        {/* Unlocked Achievements */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Unlocked Achievements ({unlockedAchievements.length})
          </h3>
          {unlockedAchievements.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Achievements Yet</h3>
              <p className="text-sm text-gray-400">Complete workouts to unlock achievements!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-[#1A1A1A] rounded-xl border ${getTierBorder(achievement.tier)} p-4 hover:scale-105 transition-all cursor-pointer group`}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Icon with glow effect */}
                  <div className="relative mb-3">
                    <div className={`absolute inset-0 bg-gradient-to-br ${getTierColor(achievement.tier)} rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                    <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${getTierColor(achievement.tier)} flex items-center justify-center text-3xl shadow-lg`}>
                      {achievement.icon}
                    </div>
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">{achievement.name}</h4>
                  <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
                  {achievement.unlockedAt && (
                    <p className="text-[10px] text-[#FF6B35] mt-auto">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Locked Achievements */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-500" />
            Locked Achievements ({lockedAchievements.length})
          </h3>
          {lockedAchievements.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">All Unlocked!</h3>
              <p className="text-sm text-gray-400">You&apos;ve completed all available achievements</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-[#1A1A1A] rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Grayscale locked icon */}
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] flex items-center justify-center text-3xl grayscale opacity-30 group-hover:opacity-40 transition-opacity">
                      {achievement.icon}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-400 text-sm mb-1">{achievement.name}</h4>
                  <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                  {achievement.progress !== undefined && achievement.total && (
                    <div className="w-full mt-auto">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.total}</span>
                      </div>
                      <div className="h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-gray-600 to-gray-500 rounded-full"
                          style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </UserMainLayout>
  )
}
