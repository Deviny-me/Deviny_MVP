'use client'

import { motion } from 'framer-motion'
import { Flame, Zap, CheckCircle2, Clock } from 'lucide-react'

export function DailyChallenges() {
  const currentStreak = 12
  const longestStreak = 28
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const challenges = [
    {
      id: 2,
      title: '5K Steps',
      description: 'Walk or run 5,000 steps today',
      xp: 75,
      icon: Zap,
      completed: false,
      progress: 3240,
      total: 5000,
    },
  ]

  const completedToday = challenges.filter(c => c.completed).length
  const totalChallenges = challenges.length
  
  const featuredChallenge = challenges[0]

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
      {/* Header with Streak */}
      <div className="relative bg-gradient-to-br from-[#FF6B35] to-[#FF0844] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Daily Challenges</h2>
            <p className="text-sm text-white/80">{todayDate}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/80 mb-1">Today&apos;s Challenge</p>
            <p className="text-2xl font-bold text-white">{completedToday}/{totalChallenges}</p>
          </div>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
              <Flame className="w-8 h-8 text-white" fill="white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-[#0A0A0A]">
              {currentStreak}
            </div>
          </motion.div>
          <div>
            <p className="text-2xl font-bold text-white">{currentStreak} Day Streak! 🔥</p>
            <p className="text-sm text-white/80">Longest: {longestStreak} days</p>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-4 rounded-lg border transition-all ${
            featuredChallenge.completed
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-[#0A0A0A] border-white/10 hover:border-[#FF6B35]/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              featuredChallenge.completed
                ? 'bg-green-500'
                : 'bg-gradient-to-br from-[#FF6B35] to-[#FF0844]'
            }`}>
              {featuredChallenge.completed ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <featuredChallenge.icon className="w-5 h-5 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-bold ${
                  featuredChallenge.completed ? 'text-green-500 line-through' : 'text-white'
                }`}>
                  {featuredChallenge.title}
                </h3>
                <span className="text-xs font-semibold text-[#FF6B35] flex items-center gap-1">
                  <Zap className="w-3 h-3" fill="currentColor" />
                  +{featuredChallenge.xp} XP
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{featuredChallenge.description}</p>

              {/* Progress Bar */}
              {!featuredChallenge.completed && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{featuredChallenge.progress} / {featuredChallenge.total}</span>
                  </div>
                  <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(featuredChallenge.progress / featuredChallenge.total) * 100}%` }}
                      className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF0844]"
                    />
                  </div>
                </div>
              )}

              {featuredChallenge.completed && (
                <div className="flex items-center gap-2 text-xs text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">Completed! +{featuredChallenge.xp} XP earned</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer with Timer */}
      <div className="px-4 pb-4">
        <div className="p-3 bg-[#0A0A0A] rounded-lg border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Resets in</span>
          </div>
          <span className="text-sm font-bold text-white">8h 32m</span>
        </div>
      </div>
    </div>
  )
}
