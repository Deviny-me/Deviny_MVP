'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { 
  PlayCircle,
  BookOpen,
  Loader2,
  Dumbbell,
  Apple,
  Video,
  Star,
  X
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { purchasesApi, PurchasedProgramDto } from '@/lib/api/purchasesApi'
import { getMediaUrl, MEDIA_BASE_URL } from '@/lib/config'

export default function MyJourneyPage() {
  const t = useTranslations('journey')
  const tc = useTranslations('common')
  const router = useRouter()
  const [programs, setPrograms] = useState<PurchasedProgramDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<PurchasedProgramDto | null>(null)
  const [filter, setFilter] = useState<'all' | 'training' | 'meal'>('all')

  const loadPurchases = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await purchasesApi.getMyPurchases()
      setPrograms(data)
    } catch (err) {
      console.error('Failed to fetch purchased programs:', err)
      setError(t('errorLoading'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadPurchases()
  }, [loadPurchases])

  const filteredPrograms = programs.filter(p => {
    if (filter === 'all') return true
    return p.programType === filter
  })

  const trainingCount = programs.filter(p => p.programType === 'training').length
  const mealCount = programs.filter(p => p.programType === 'meal').length

  return (
    <>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
            <p className="text-sm text-gray-400">{t('description')}</p>
          </div>
        </div>

        {/* Filter Tabs (only if there are programs) */}
        {!isLoading && !error && programs.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {tc('all')} ({programs.length})
            </button>
            {trainingCount > 0 && (
              <button
                onClick={() => setFilter('training')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filter === 'training'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                <Dumbbell className="w-4 h-4" /> {t('training')} ({trainingCount})
              </button>
            )}
            {mealCount > 0 && (
              <button
                onClick={() => setFilter('meal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filter === 'meal'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                <Apple className="w-4 h-4" /> {t('nutrition')} ({mealCount})
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('errorLoading')}</h3>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button 
              onClick={loadPurchases}
              className="px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {tc('tryAgain')}
            </button>
          </div>
        )}

        {/* Programs Grid */}
        {!isLoading && !error && filteredPrograms.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => (
              <div
                key={program.purchaseId}
                onClick={() => setSelectedProgram(program)}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-[#3B82F6]/50 transition-all group"
              >
                {/* Cover */}
                <div className="relative h-40">
                  {program.coverImageUrl ? (
                    <img
                      src={getMediaUrl(program.coverImageUrl) || ''}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/20 flex items-center justify-center">
                      {program.programType === 'training' 
                        ? <Dumbbell className="w-12 h-12 text-gray-600" />
                        : <Apple className="w-12 h-12 text-gray-600" />
                      }
                    </div>
                  )}
                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded text-white ${
                      program.programType === 'training' ? 'bg-blue-600' : 'bg-green-600'
                    }`}>
                      {program.programType === 'training' ? t('training') : t('nutrition')}
                    </span>
                  </div>
                  {/* Tier badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded text-white ${
                      program.tier === 'Pro' ? 'bg-purple-600'
                        : program.tier === 'Standard' ? 'bg-blue-700'
                        : 'bg-gray-600'
                    }`}>
                      {program.tier}
                    </span>
                  </div>
                  {/* Video count */}
                  {program.videoUrls.length > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-xs text-white">
                      <Video className="w-3 h-3" />
                      {program.videoUrls.length}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-white truncate">{program.title}</h3>
                  {/* Rating */}
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-white font-medium">
                      {program.averageRating > 0 ? program.averageRating.toFixed(1) : '—'}
                    </span>
                    {program.totalReviews > 0 && (
                      <span className="text-xs text-gray-500">({program.totalReviews})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {program.trainerAvatarUrl ? (
                      <img
                        src={getMediaUrl(program.trainerAvatarUrl) || ''}
                        alt={program.trainerName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-700" />
                    )}
                    <span className="text-sm text-gray-400">{program.trainerName}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t('purchased')} {new Date(program.purchasedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && programs.length === 0 && (
          <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0A0A0A] flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('noPrograms')}</h3>
            <p className="text-sm text-gray-400 mb-4">{t('startJourney')}</p>
            <button
              onClick={() => router.push('/user/programs')}
              className="px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('browsePrograms')}
            </button>
          </div>
        )}

        {/* No results for filter */}
        {!isLoading && !error && programs.length > 0 && filteredPrograms.length === 0 && (
          <div className="text-center py-8 bg-[#1A1A1A] rounded-xl border border-white/10">
            <p className="text-gray-400">{t('noResultsFilter')}</p>
          </div>
        )}
      </div>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
          t={t}
        />
      )}
    </>
  )
}

function ProgramDetailModal({
  program,
  onClose,
  t,
}: {
  program: PurchasedProgramDto
  onClose: () => void
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1A1A] rounded-xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          {program.coverImageUrl ? (
            <img
              src={getMediaUrl(program.coverImageUrl) || ''}
              alt={program.title}
              className="w-full h-56 object-cover"
            />
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/20 flex items-center justify-center">
              {program.programType === 'training'
                ? <Dumbbell className="w-16 h-16 text-gray-600" />
                : <Apple className="w-16 h-16 text-gray-600" />
              }
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-2 py-1 text-xs font-bold rounded text-white ${
              program.programType === 'training' ? 'bg-blue-600' : 'bg-green-600'
            }`}>
              {program.programType === 'training' ? t('training') : t('nutrition')}
            </span>
            <span className={`px-2 py-1 text-xs font-bold rounded text-white ${
              program.tier === 'Pro' ? 'bg-purple-600'
                : program.tier === 'Standard' ? 'bg-blue-700'
                : 'bg-gray-600'
            }`}>
              {program.tier}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white">{program.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              {program.trainerAvatarUrl ? (
                <img
                  src={getMediaUrl(program.trainerAvatarUrl) || ''}
                  alt={program.trainerName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-700" />
              )}
              <span className="text-sm text-gray-400">{program.trainerName}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg border border-white/5">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(program.averageRating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg text-white font-semibold">
              {program.averageRating > 0 ? program.averageRating.toFixed(1) : '—'}
            </span>
            <span className="text-sm text-gray-500">
              ({program.totalReviews} {t('reviews')})
            </span>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">{t('aboutProgram')}</h3>
            <p className="text-white leading-relaxed">{program.description}</p>
          </div>

          {/* Videos */}
          {program.videoUrls.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Video className="w-4 h-4" />
                {t('videos')} ({program.videoUrls.length})
              </h3>
              <div className="space-y-3">
                {program.videoUrls.map((url, index) => (
                  <div key={index} className="rounded-lg overflow-hidden bg-black">
                    <video
                      controls
                      preload="metadata"
                      className="w-full max-h-[300px]"
                      src={url.startsWith('http') ? url : `${MEDIA_BASE_URL}${url}`}
                    >
                      {t('videoNotSupported')}
                    </video>
                  </div>
                ))}
              </div>
            </div>
          )}

          {program.videoUrls.length === 0 && (
            <div className="text-center py-6 bg-[#0A0A0A] rounded-lg border border-white/5">
              <Video className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{t('noVideos')}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            {t('purchased')} {new Date(program.purchasedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
