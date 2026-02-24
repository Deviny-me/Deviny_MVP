'use client'

import { Radio, Sparkles, Clock, Calendar, Users, Zap, Play } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function LiveWorkoutsPage() {
  const t = useTranslations('live')
  const tc = useTranslations('common')

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] pb-6">
        <div className="max-w-3xl w-full">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-[#1A1A1A] via-[#1A1A1A] to-[#3B82F6]/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Header with animated gradient */}
            <div className="relative p-8 pb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-[#2563EB]/10 animate-pulse"></div>
              
              <div className="relative flex flex-col items-center text-center">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-full flex items-center justify-center">
                    <Radio className="w-12 h-12 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Title */}
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6 text-[#3B82F6]" />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                    {t('title')}
                  </h1>
                  <Sparkles className="w-6 h-6 text-[#2563EB]" />
                </div>

                {/* Subtitle */}
                <p className="text-xl text-gray-400 mb-2">{tc('comingVerySoon')}</p>
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-full">
                  <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-[#3B82F6]">{tc('inDevelopment')}</span>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="p-8 pt-6">
              <p className="text-center text-gray-400 mb-8">
                {t('description')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Feature 1 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-[#3B82F6]/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{t('realTimeStreaming')}</h3>
                      <p className="text-sm text-gray-400">{t('realTimeStreamingDesc')}</p>
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-[#3B82F6]/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{t('interactiveSessions')}</h3>
                      <p className="text-sm text-gray-400">{t('interactiveSessionsDesc')}</p>
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-[#3B82F6]/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{t('scheduledClasses')}</h3>
                      <p className="text-sm text-gray-400">{t('scheduledClassesDesc')}</p>
                    </div>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-[#3B82F6]/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{t('instantFeedback')}</h3>
                      <p className="text-sm text-gray-400">{t('instantFeedbackDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gradient-to-r from-[#3B82F6]/5 to-[#2563EB]/5 rounded-xl p-6 border border-[#3B82F6]/10">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-[#3B82F6]" />
                  <h3 className="text-white font-semibold">{tc('expectedLaunch')}</h3>
                </div>
                <p className="text-center text-2xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent">
                  {tc('comingQ2')}
                </p>
                <p className="text-center text-sm text-gray-400 mt-2">
                  {t('workingHard')}
                </p>
              </div>

              {/* CTA */}
              <div className="mt-6 text-center">
                <button
                  disabled
                  className="px-8 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-semibold rounded-lg opacity-50 cursor-not-allowed"
                >
                  {tc('notifyWhenAvailable')}
                </button>
                <p className="text-xs text-gray-500 mt-2">{tc('featureComingSoon')}</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {tc('wantToKnow')}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
