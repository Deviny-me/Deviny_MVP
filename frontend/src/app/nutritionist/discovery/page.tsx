'use client'

import { motion } from 'framer-motion'
import { 
  Compass, 
  Globe, 
  Users, 
  TrendingUp, 
  Sparkles,
  Bell
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAccentColors } from '@/lib/theme/useAccentColors'

export default function NutritionistDiscoveryPage() {
  const accent = useAccentColors()
  const t = useTranslations('discovery')
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
            <div className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} rounded-full blur-2xl opacity-30 animate-pulse`} />
            <div className={`relative w-full h-full bg-gradient-to-br ${accent.gradient} rounded-full flex items-center justify-center`}>
              <Compass className="w-16 h-16 text-white" />
            </div>
            <motion.div 
              className="absolute -top-2 -right-2 w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Globe className={`w-5 h-5 ${accent.text}`} />
            </motion.div>
            <motion.div 
              className="absolute -bottom-2 -left-2 w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              <Users className={`w-5 h-5 ${accent.textSecondary}`} />
            </motion.div>
          </motion.div>

          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Discover{' '}
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
              <div className={`w-10 h-10 ${accent.bgMuted} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <TrendingUp className={`w-5 h-5 ${accent.text}`} />
              </div>
              <h3 className="text-white font-medium mb-1">{t('trends')}</h3>
              <p className="text-xs text-gray-500">{t('trendsDesc')}</p>
            </div>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className={`w-10 h-10 ${accent.featureCard2Bg} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <Users className={`w-5 h-5 ${accent.textSecondary}`} />
              </div>
              <h3 className="text-white font-medium mb-1">{t('community')}</h3>
              <p className="text-xs text-gray-500">{t('communityDesc')}</p>
            </div>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className={`w-10 h-10 ${accent.featureCard1Bg} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <Sparkles className={`w-5 h-5 ${accent.featureCard1Text}`} />
              </div>
              <h3 className="text-white font-medium mb-1">{t('inspiration')}</h3>
              <p className="text-xs text-gray-500">{t('inspirationDesc')}</p>
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
              <div className={`w-2 h-2 ${accent.bg} rounded-full animate-pulse`} />
              <span>{tc('inDevelopment')}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
