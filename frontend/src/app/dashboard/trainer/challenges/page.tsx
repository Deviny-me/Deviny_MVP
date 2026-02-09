'use client'

import { MainLayout } from '@/components/trainer/layout/MainLayout'
import { motion } from 'framer-motion'
import { 
  Target, 
  Trophy, 
  Users, 
  Flame,
  Zap,
  Bell,
  Award
} from 'lucide-react'

export default function ChallengesPage() {
  return (
    <MainLayout showRightSidebar={false}>
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
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full blur-2xl opacity-30 animate-pulse" />
            
            {/* Main circle */}
            <div className="relative w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
              <Target className="w-16 h-16 text-white" />
            </div>
            
            {/* Orbiting icons */}
            <motion.div 
              className="absolute -top-2 -right-2 w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Trophy className="w-5 h-5 text-amber-500" />
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-2 -left-2 w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame className="w-5 h-5 text-orange-500" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Challenges{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              Coming Soon
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            className="text-gray-400 text-lg mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Скоро вы сможете создавать челленджи для своих студентов, отслеживать их прогресс и награждать за достижения!
          </motion.p>

          {/* Features coming */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-white font-medium mb-1">Цели</h3>
              <p className="text-xs text-gray-500">Создавайте челленджи</p>
            </div>
            
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-white font-medium mb-1">Группы</h3>
              <p className="text-xs text-gray-500">Командные соревнования</p>
            </div>
            
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-white font-medium mb-1">Награды</h3>
              <p className="text-xs text-gray-500">XP и достижения</p>
            </div>
          </motion.div>

          {/* Notify button */}
          <motion.button
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Bell className="w-5 h-5" />
            Уведомить о запуске
          </motion.button>

          {/* Progress indicator */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span>В разработке</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
