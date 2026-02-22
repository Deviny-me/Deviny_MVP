'use client'

import { motion } from 'framer-motion'
import { 
  Radio, 
  Users,
  Video,
  Calendar,
  Bell,
  Play
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAccentColors } from '@/lib/theme/useAccentColors'

export default function NutritionistLivePage() {
  const accent = useAccentColors()
  const t = useTranslations('live')
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
          <motion.div 
            className="relative w-32 h-32 mx-auto mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} rounded-full blur-2xl opacity-30 animate-pulse`} />
            <div className={`relative w-full h-full bg-gradient-to-br ${accent.gradient} rounded-full flex items-center justify-center`}>
              <Radio className="w-16 h-16 text-white" />
            </div>
            <motion.div 
              className="absolute -top-2 -right-2 w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            </motion.div>
            <motion.div 
              className="absolute -bottom-2 -left-2 w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center"
            >
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            </motion.div>
          </motion.div>

          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Live{' '}
            <span className={`bg-gradient-to-r ${accent.gradient} bg-clip-text text-transparent`}>
              {tc('comingSoon')}
            </span>
          </motion.h1>

          <motion.p 
            className="text-gray-400 text-lg mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {t('teaser')}
          </motion.p>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Video className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-white font-medium mb-1">{t('hdStreaming')}</h3>
              <p className="text-xs text-gray-500">{t('hdStreamingDesc')}</p>
            </div>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className={`w-10 h-10 ${accent.bgMuted} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <Users className={`w-5 h-5 ${accent.text}`} />
              </div>
              <h3 className="text-white font-medium mb-1">{t('groups')}</h3>
              <p className="text-xs text-gray-500">{t('groupsDesc')}</p>
            </div>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-white font-medium mb-1">{t('scheduleLabel')}</h3>
              <p className="text-xs text-gray-500">{t('scheduleDesc')}</p>
            </div>
          </motion.div>

          <motion.button
            className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${accent.gradient} text-white font-medium rounded-xl hover:opacity-90 transition-opacity`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Bell className="w-5 h-5" />
            {tc('notifyOnLaunch')}
          </motion.button>

          <motion.div 
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>{tc('inDevelopment')}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
