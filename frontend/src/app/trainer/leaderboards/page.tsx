'use client'

import { motion } from 'framer-motion'
import { 
  Trophy, 
  Crown,
  Medal,
  TrendingUp,
  Star,
  Bell,
  Users
} from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function LeaderboardsPage() {
  const t = useTranslations('leaderboards')
  const tc = useTranslations('common')
  return (
    <>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg w-full text-center"
        >
          {/* Animated Icon */}
          <motion.div 
            className="relative w-32 h-32 mx-auto mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {/* Glowing background */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full blur-2xl opacity-30 animate-pulse" />
            
            {/* Main circle */}
            <div className="relative w-full h-full bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center">
              <Trophy className="w-16 h-16 text-white" />
            </div>
            
            {/* Orbiting icons */}
            <motion.div 
              className="absolute -top-2 -right-2 w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Crown className="w-5 h-5 text-yellow-500" />
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-2 -left-2 w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              <Medal className="w-5 h-5 text-amber-500" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Leaderboards{' '}
            <span className="bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
              {tc('comingSoon')}
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            className="text-gray-400 text-lg mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {t('teaser')}
          </motion.p>

          {/* Features coming */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-white font-medium mb-1">{t('topTrainers')}</h3>
              <p className="text-xs text-gray-500">{t('topTrainersDesc')}</p>
            </div>
            
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-white font-medium mb-1">{t('xpPoints')}</h3>
              <p className="text-xs text-gray-500">{t('xpPointsDesc')}</p>
            </div>
            
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-white font-medium mb-1">{t('seasons')}</h3>
              <p className="text-xs text-gray-500">{t('seasonsDesc')}</p>
            </div>
          </motion.div>

          {/* Notify button */}
          <motion.button
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Bell className="w-5 h-5" />
            {tc('notifyOnLaunch')}
          </motion.button>

          {/* Progress indicator */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span>{tc('inDevelopment')}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
