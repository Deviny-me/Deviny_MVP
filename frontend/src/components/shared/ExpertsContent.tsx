'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Star,
  Users,
  BookOpen,
  Award,
  Loader2,
  MessageCircle,
  UserCheck,
  UserPlus,
  MapPin,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { trainersApi } from '@/lib/api/trainersApi'
import { followsApi } from '@/lib/api/friendsApi'
import { PublicTrainerDto } from '@/types/trainer'
import { FriendDto } from '@/types/friend'
import { getMediaUrl } from '@/lib/config'
import { useAccentColors, getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { useAuth } from '@/features/auth/AuthContext'

interface ExpertsContentProps {
  basePath: string
}

export function ExpertsContent({ basePath }: ExpertsContentProps) {
  const router = useRouter()
  const accent = useAccentColors()
  const t = useTranslations('experts')
  const tc = useTranslations('common')
  const { user: currentUser } = useAuth()
  const [trainers, setTrainers] = useState<PublicTrainerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'Trainer' | 'Nutritionist'>('all')
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [followLoading, setFollowLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [data, followingData] = await Promise.all([
          trainersApi.getAll(),
          followsApi.getMyFollowing().catch(() => [] as FriendDto[]),
        ])
        setTrainers(data)
        setFollowedIds(new Set(followingData.map((f) => f.id)))
      } catch (err) {
        console.error('Failed to fetch trainers:', err)
        setError(t('failedToLoad'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Re-sort trainers when currentUser becomes available (push own card first)
  useEffect(() => {
    if (currentUser?.id && trainers.length > 0) {
      setTrainers(prev =>
        [...prev].sort((a, b) => (a.userId === currentUser.id ? -1 : b.userId === currentUser.id ? 1 : 0))
      )
    }
  }, [currentUser?.id])

  const handleFollow = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    if (followLoading) return
    setFollowLoading(userId)
    try {
      if (followedIds.has(userId)) {
        await followsApi.unfollowTrainer(userId)
        setFollowedIds(prev => { const s = new Set(prev); s.delete(userId); return s })
      } else {
        await followsApi.followTrainer(userId)
        setFollowedIds(prev => new Set(prev).add(userId))
      }
    } catch (err) {
      console.error('Follow/unfollow failed:', err)
    } finally {
      setFollowLoading(null)
    }
  }

  const handleMessage = (e: React.MouseEvent, trainer: PublicTrainerDto) => {
    e.stopPropagation()
    const params = new URLSearchParams({ userId: trainer.userId })
    if (trainer.name) params.set('userName', trainer.name)
    if (trainer.avatarUrl) params.set('userAvatar', trainer.avatarUrl)
    router.push(`${basePath}/messages?${params.toString()}`)
  }

  const filteredTrainers = trainers.filter((trainer) => {
    const matchesSearch =
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.primaryTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.specializations.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesRole = roleFilter === 'all' || trainer.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none ${accent.focusBorder}`}
        />
      </div>

      {/* Role Filter */}
      <div className="flex gap-2">
        {(['all', 'Trainer', 'Nutritionist'] as const).map((role) => {
          const isActive = roleFilter === role
          const roleAccent = role === 'all' ? null : getAccentColorsByRole(role)
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? role === 'all'
                    ? 'bg-white text-black'
                    : `bg-gradient-to-r ${roleAccent!.gradient} text-white`
                  : 'bg-[#1A1A1A] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {role === 'all' ? t('filterAll') : role === 'Trainer' ? t('filterTrainers') : t('filterNutritionists')}
            </button>
          )
        })}
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{t('errorLoading')}</h3>
          <p className="text-sm text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-4 px-4 py-2 bg-gradient-to-r ${accent.gradient} text-white rounded-lg text-sm`}
          >
            {tc('tryAgain')}
          </button>
        </div>
      )}

      {/* Trainers Grid */}
      {!loading && !error && (
        <>
          {filteredTrainers.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-8 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">{t('noTrainers')}</h3>
              <p className="text-gray-400 text-sm">{t('tryDifferentSearch')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTrainers.map((trainer, index) => {
                const trainerAccent = getAccentColorsByRole(trainer.role)
                return (
                  <motion.div
                    key={trainer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`${basePath}/experts/${trainer.slug || trainer.id}`)}
                    className={`bg-[#1A1A1A] rounded-xl border border-white/10 p-5 ${trainerAccent.hoverBorder} transition-all cursor-pointer group`}
                  >
                    <div className="flex items-start gap-4">
                      {trainer.avatarUrl ? (
                        <img
                          src={getMediaUrl(trainer.avatarUrl) || '/default-avatar.png'}
                          alt={trainer.name}
                          className={`w-16 h-16 rounded-xl object-cover ${getRoleRingClass(trainer.role)}`}
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${trainerAccent.gradient} flex items-center justify-center`}>
                          <span className="text-white text-xl font-bold">{trainer.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-white ${trainerAccent.groupHoverText} transition-colors`}>
                            {trainer.name}
                          </h3>
                        </div>

                        <p className="text-sm text-gray-400 mb-2">
                          {trainer.primaryTitle || (trainer.role === 'Nutritionist' ? t('nutritionistRole') : t('trainerRole'))}
                          {trainer.location && ` • ${trainer.location}`}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {trainer.specializations.slice(0, 3).map((spec, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white/5 text-gray-300 text-[10px] rounded">
                              {spec}
                            </span>
                          ))}
                          {trainer.specializations.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/5 text-gray-400 rounded text-[10px]">
                              +{trainer.specializations.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{trainer.programsCount} {t('programs')}</span>
                        </div>
                        {trainer.experienceYears && (
                          <div className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>{trainer.experienceYears}+ {t('years')}</span>
                          </div>
                        )}
                      </div>

                      {trainer.userId !== currentUser?.id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleMessage(e, trainer)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-gray-300 text-xs font-medium rounded-lg hover:bg-white/20 transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleFollow(e, trainer.userId)}
                            disabled={followLoading === trainer.userId}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${
                              followedIds.has(trainer.userId)
                                ? `${trainerAccent.bgMuted} ${trainerAccent.text} hover:opacity-80`
                                : `bg-gradient-to-r ${trainerAccent.gradient} text-white hover:opacity-90`
                            }`}
                          >
                            {followLoading === trainer.userId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : followedIds.has(trainer.userId) ? (
                              <UserCheck className="w-3.5 h-3.5" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5" />
                            )}
                            {followedIds.has(trainer.userId) ? t('following') : t('follow')}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
