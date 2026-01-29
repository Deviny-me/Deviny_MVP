'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { useUser } from '@/components/user/UserProvider'
import { 
  Camera,
  MapPin,
  Calendar,
  Award,
  Flame,
  Trophy,
  Target,
  Users,
  Edit2,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UserProfilePage() {
  const router = useRouter()
  const { user } = useUser()

  // Calculate level progress
  const currentXp = user?.xp || 0
  const xpToNextLevel = user?.xpToNextLevel || 1000
  const levelProgress = (currentXp / xpToNextLevel) * 100

  const stats = [
    { label: 'Workouts', value: user?.workoutsCompleted || 0, icon: Target },
    { label: 'Day Streak', value: user?.streak || 0, icon: Flame },
    { label: 'Achievements', value: 6, icon: Trophy },
    { label: 'Following', value: 24, icon: Users },
  ]

  const recentActivity = [
    { type: 'workout', title: 'Completed Leg Day Workout', time: '2 hours ago', xp: 150 },
    { type: 'achievement', title: 'Earned "Week Warrior" badge', time: '1 day ago', xp: 200 },
    { type: 'program', title: 'Started "Ultimate Strength Builder"', time: '3 days ago', xp: 50 },
    { type: 'streak', title: '7 Day Streak!', time: '5 days ago', xp: 100 },
  ]

  return (
    <UserMainLayout>
      <div className="space-y-4 pb-6">
        {/* Profile Header */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] relative">
            <button className="absolute bottom-3 right-3 p-2 bg-black/30 backdrop-blur-sm rounded-lg text-white hover:bg-black/50 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center border-4 border-[#1A1A1A]">
                  <span className="text-white text-3xl font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-[#0A0A0A] rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                  <Camera className="w-3 h-3 text-gray-400" />
                </button>
              </div>

              {/* Name & Actions */}
              <div className="flex-1 flex items-end justify-between pb-2">
                <div>
                  <h1 className="text-xl font-bold text-white">{user?.fullName || 'User'}</h1>
                  <p className="text-sm text-gray-400">@{user?.email?.split('@')[0] || 'user'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/dashboard/user/settings')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Bio & Info */}
            <div className="mt-4">
              <p className="text-sm text-gray-300">
                Fitness enthusiast on a journey to a healthier life 💪
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                {(user?.city || user?.country) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{[user?.city, user?.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined January 2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Level Card */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{user?.level || 1}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">Level {user?.level || 1}</span>
                <span className="text-xs text-gray-400">{currentXp} / {xpToNextLevel} XP</span>
              </div>
              <div className="h-2 bg-[#0A0A0A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF0844] rounded-full transition-all"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{xpToNextLevel - currentXp} XP to Level {(user?.level || 1) + 1}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <div key={index} className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 text-center">
              <stat.icon className="w-5 h-5 text-[#FF6B35] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="divide-y divide-white/10">
            {recentActivity.map((activity, index) => (
              <div key={index} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] flex items-center justify-center">
                    {activity.type === 'workout' && <Target className="w-5 h-5 text-green-400" />}
                    {activity.type === 'achievement' && <Trophy className="w-5 h-5 text-yellow-400" />}
                    {activity.type === 'program' && <Award className="w-5 h-5 text-blue-400" />}
                    {activity.type === 'streak' && <Flame className="w-5 h-5 text-[#FF6B35]" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#FF6B35]">+{activity.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UserMainLayout>
  )
}
