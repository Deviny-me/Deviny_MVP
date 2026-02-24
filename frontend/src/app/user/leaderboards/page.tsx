'use client'

import { Trophy, Sparkles, Clock, Award, TrendingUp, Zap, Crown, Medal } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function LeaderboardsPage() {
  const t = useTranslations('leaderboards')
  const tc = useTranslations('common')

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] pb-6">
        <div className="max-w-3xl w-full">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-[#1A1A1A] via-[#1A1A1A] to-[#3B82F6]/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Header with animated gradient */}
            <div className="relative p-8 pb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-sky-500/10 animate-pulse"></div>
              
              <div className="relative flex flex-col items-center text-center">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Title */}
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-6 h-6 text-blue-500" />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                    {t('title')}
                  </h1>
                  <Crown className="w-6 h-6 text-sky-500" />
                </div>

                {/* Subtitle */}
                <p className="text-xl text-gray-400 mb-2">{tc('comingVerySoon')}</p>
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-500">{tc('inDevelopment')}</span>
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
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{t('globalRankings')}</h3>
                      <p className="text-sm text-gray-400">{t('globalRankingsDesc')}</p>
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Crown className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{t('topPerformers')}</h3>
                      <p className="text-sm text-gray-400">{t('topPerformersDesc')}</p>
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Medal className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{t('weeklyChallenges')}</h3>
                      <p className="text-sm text-gray-400">{t('weeklyChallengesDesc')}</p>
                    </div>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Award className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{t('achievementsBadges')}</h3>
                      <p className="text-sm text-gray-400">{t('achievementsBadgesDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Leaderboard Preview */}
              <div className="bg-[#0A0A0A] rounded-xl p-6 border border-white/5 mb-6">
                <h3 className="text-white font-semibold mb-4 text-center">{t('previewTop3')}</h3>
                <div className="space-y-3">
                  {/* 1st Place */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg border border-blue-500/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-700 rounded w-32 mb-1"></div>
                      <div className="h-2 bg-gray-800 rounded w-20"></div>
                    </div>
                    <div className="flex items-center gap-1 text-blue-500 font-semibold">
                      <Trophy className="w-4 h-4" />
                      <span>???</span>
                    </div>
                  </div>
                  
                  {/* 2nd Place */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-400/10 to-transparent rounded-lg border border-gray-400/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center font-bold text-sm text-black">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-700 rounded w-28 mb-1"></div>
                      <div className="h-2 bg-gray-800 rounded w-16"></div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 font-semibold">
                      <Trophy className="w-4 h-4" />
                      <span>???</span>
                    </div>
                  </div>
                  
                  {/* 3rd Place */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500/10 to-transparent rounded-lg border border-orange-500/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-700 rounded w-36 mb-1"></div>
                      <div className="h-2 bg-gray-800 rounded w-24"></div>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500 font-semibold">
                      <Trophy className="w-4 h-4" />
                      <span>???</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gradient-to-r from-blue-500/5 to-sky-500/5 rounded-xl p-6 border border-blue-500/10">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="text-white font-semibold">{tc('expectedLaunch')}</h3>
                </div>
                <p className="text-center text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  {tc('comingQ2')}
                </p>
                <p className="text-center text-sm text-gray-400 mt-2">
                  {t('getReady')}
                </p>
              </div>

              {/* CTA */}
              <div className="mt-6 text-center">
                <button
                  disabled
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg opacity-50 cursor-not-allowed"
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
              {t('startTraining')}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
