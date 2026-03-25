'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { 
  Search,
  Star,
  Users,
  Loader2,
  SortAsc,
  Dumbbell,
  Apple,
  MessageSquare,
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { mealProgramsApi } from '@/lib/api/mealProgramsApi'
import { PublicProgramDto, PublicMealProgramDto, ProgramCategory } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useTranslations } from 'next-intl'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

type SortOption = 'newest' | 'popular' | 'rating' | 'price-low' | 'price-high'
type FilterType = 'all' | 'Training' | 'Diet' | 'Consultation'

// Unified type for displaying both program types
type UnifiedPublicProgram = {
  id: string
  title: string
  description: string
  price: number
  standardPrice?: number
  proPrice?: number
  maxStandardSpots?: number
  maxProSpots?: number
  standardSpotsRemaining?: number
  proSpotsRemaining?: number
  code: string
  coverImageUrl: string
  createdAt: string
  trainerId: string
  trainerName: string
  trainerAvatarUrl: string
  trainerSlug: string
  trainerRole: string
  category: ProgramCategory
  // Training-specific (optional)
  averageRating?: number
  totalReviews?: number
  totalPurchases?: number
  latestReviewComment?: string
  latestReviewRating?: number
  latestReviewUserName?: string
  latestReviewCreatedAt?: string
}

function fromTraining(p: PublicProgramDto): UnifiedPublicProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    standardPrice: p.standardPrice,
    proPrice: p.proPrice,
    maxStandardSpots: p.maxStandardSpots,
    maxProSpots: p.maxProSpots,
    standardSpotsRemaining: p.standardSpotsRemaining,
    proSpotsRemaining: p.proSpotsRemaining,
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    trainerId: p.trainerId,
    trainerName: p.trainerName,
    trainerAvatarUrl: p.trainerAvatarUrl,
    trainerSlug: p.trainerSlug,
    trainerRole: p.trainerRole,
    category: (p.category as ProgramCategory) || 'Training',
    averageRating: p.averageRating,
    totalReviews: p.totalReviews,
    totalPurchases: p.totalPurchases,
    latestReviewComment: p.latestReviewComment,
    latestReviewRating: p.latestReviewRating,
    latestReviewUserName: p.latestReviewUserName,
    latestReviewCreatedAt: p.latestReviewCreatedAt,
  }
}

function fromMeal(p: PublicMealProgramDto): UnifiedPublicProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    standardPrice: p.standardPrice,
    proPrice: p.proPrice,
    maxStandardSpots: p.maxStandardSpots,
    maxProSpots: p.maxProSpots,
    standardSpotsRemaining: p.standardSpotsRemaining,
    proSpotsRemaining: p.proSpotsRemaining,
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    trainerId: p.trainerId,
    trainerName: p.trainerName,
    trainerAvatarUrl: p.trainerAvatarUrl,
    trainerSlug: p.trainerSlug,
    trainerRole: p.trainerRole,
    category: (p.category as ProgramCategory) || 'Diet',
    averageRating: p.averageRating ?? 0,
    totalReviews: p.totalReviews ?? 0,
    totalPurchases: p.totalPurchases ?? 0,
    latestReviewComment: p.latestReviewComment,
    latestReviewRating: p.latestReviewRating,
    latestReviewUserName: p.latestReviewUserName,
    latestReviewCreatedAt: p.latestReviewCreatedAt,
  }
}

export default function ProgramsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const t = useTranslations('userPrograms')
  const tc = useTranslations('common')

  const [trainingPrograms, setTrainingPrograms] = useState<PublicProgramDto[]>([])
  const [mealPrograms, setMealPrograms] = useState<PublicMealProgramDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [trainingPage, setTrainingPage] = useState(1)
  const [mealPage, setMealPage] = useState(1)
  const [hasMoreTraining, setHasMoreTraining] = useState(false)
  const [hasMoreMeal, setHasMoreMeal] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const PAGE_SIZE = 20

  const loadAllPrograms = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [trainingRes, mealRes] = await Promise.all([
        programsApi.getAllPublic(1, PAGE_SIZE),
        mealProgramsApi.getAllPublic(1, PAGE_SIZE),
      ])
      setTrainingPrograms(trainingRes.items)
      setMealPrograms(mealRes.items)
      setTrainingPage(1)
      setMealPage(1)
      setHasMoreTraining(trainingRes.items.length < trainingRes.totalCount)
      setHasMoreMeal(mealRes.items.length < mealRes.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useRealtimeScopeRefresh(['programs', 'purchases'], () => {
    loadAllPrograms()
  })

  // Reload programs on every navigation to this page
  useEffect(() => {
    loadAllPrograms()
  }, [loadAllPrograms, pathname])

  // Reload when tab/window regains focus (user switched back from trainer page)
  useEffect(() => {
    const handleFocus = () => {
      loadAllPrograms()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadAllPrograms])

  // Deep link: ?program=<id> -> redirect to detail page
  useEffect(() => {
    const programId = searchParams.get('program')
    if (!programId) return
    router.replace(`/user/programs/${programId}`)
  }, [searchParams, router])

  const loadMore = async () => {
    try {
      setLoadingMore(true)
      const nextTrainingPage = hasMoreTraining ? trainingPage + 1 : trainingPage
      const nextMealPage = hasMoreMeal ? mealPage + 1 : mealPage

      const [trainingRes, mealRes] = await Promise.all([
        hasMoreTraining ? programsApi.getAllPublic(nextTrainingPage, PAGE_SIZE) : null,
        hasMoreMeal ? mealProgramsApi.getAllPublic(nextMealPage, PAGE_SIZE) : null,
      ])

      if (trainingRes) {
        setTrainingPrograms(prev => [...prev, ...trainingRes.items])
        setTrainingPage(nextTrainingPage)
        setHasMoreTraining(trainingPrograms.length + trainingRes.items.length < trainingRes.totalCount)
      }
      if (mealRes) {
        setMealPrograms(prev => [...prev, ...mealRes.items])
        setMealPage(nextMealPage)
        setHasMoreMeal(mealPrograms.length + mealRes.items.length < mealRes.totalCount)
      }
    } catch (err) {
      console.error('Failed to load more programs:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Build filtered + sorted list
  const allPrograms = [
    ...trainingPrograms.map(fromTraining),
    ...mealPrograms.map(fromMeal),
  ]

  const getFilteredPrograms = (): UnifiedPublicProgram[] => {
    let result: UnifiedPublicProgram[] = filterType === 'all'
      ? allPrograms
      : allPrograms.filter(p => p.category === filterType)

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.trainerName.toLowerCase().includes(q)
      )
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'popular':
        result.sort((a, b) => (b.totalPurchases ?? 0) - (a.totalPurchases ?? 0))
        break
      case 'rating':
        result.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        break
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
    }

    return result
  }

  const filteredPrograms = getFilteredPrograms()
  const totalCount = trainingPrograms.length + mealPrograms.length

  const formatPrice = (price: number) => {
    if (price === 0) return tc('free')
    return `$${price.toFixed(2)}`
  }

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

        {/* Search and Filters */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#0c8de6]/50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Type Filters */}
            <div className="flex items-center gap-1 bg-[#0A0A0A] rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterType === 'all' 
                    ? 'bg-[#0c8de6] text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tc('all')}
              </button>
              {([
                { cat: 'Training' as FilterType, icon: Dumbbell, label: t('training'), count: allPrograms.filter(p => p.category === 'Training').length },
                { cat: 'Diet' as FilterType, icon: Apple, label: t('nutrition'), count: allPrograms.filter(p => p.category === 'Diet').length },
                { cat: 'Consultation' as FilterType, icon: MessageSquare, label: t('consultation'), count: allPrograms.filter(p => p.category === 'Consultation').length },
              ]).map(({ cat, icon: Icon, label, count }) => (
                <button
                  key={cat}
                  onClick={() => setFilterType(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterType === cat 
                      ? 'bg-[#0c8de6] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <SortAsc className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#0c8de6]/50"
              >
                <option value="newest">{t('newest')}</option>
                <option value="popular">{t('mostPopular')}</option>
                <option value="rating">{t('highestRated')}</option>
                <option value="price-low">{t('priceLowToHigh')}</option>
                <option value="price-high">{t('priceHighToLow')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Programs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#0c8de6] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadAllPrograms}
              className="px-4 py-2 bg-[#0c8de6] text-white rounded-lg hover:bg-[#FF8555] transition-colors"
            >
              {tc('tryAgain')}
            </button>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0A0A0A] flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {totalCount === 0 ? t('noPrograms') : t('noProgramsFound')}
            </h3>
            <p className="text-sm text-gray-400">
              {totalCount === 0 ? t('checkBackLater') : t('adjustSearchFilters')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPrograms.map((program) => (
              <div
                key={`${program.category}-${program.id}`}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => router.push(`/user/programs/${program.id}?category=${program.category}`)}
              >
                <div className="flex">
                  {/* Cover Image */}
                  <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-[#0A0A0A] relative">
                    {program.coverImageUrl ? (
                      <img
                        src={getMediaUrl(program.coverImageUrl) || ''}
                        alt={program.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {program.category === 'Training' ? (
                          <Dumbbell className="w-10 h-10 text-gray-600" />
                        ) : program.category === 'Diet' ? (
                          <Apple className="w-10 h-10 text-gray-600" />
                        ) : (
                          <MessageSquare className="w-10 h-10 text-gray-600" />
                        )}
                      </div>
                    )}
                    {/* Category badge — color based on creator role */}
                    <span
                      className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold rounded text-white flex items-center gap-0.5"
                      style={{ backgroundColor: getAccentColorsByRole(program.trainerRole).primary }}
                    >
                      {program.category === 'Training' ? (
                        <><Dumbbell className="w-2.5 h-2.5" />{t('training')}</>
                      ) : program.category === 'Diet' ? (
                        <><Apple className="w-2.5 h-2.5" />{t('nutrition')}</>
                      ) : (
                        <><MessageSquare className="w-2.5 h-2.5" />{t('consultation')}</>
                      )}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white line-clamp-1">{program.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {program.trainerAvatarUrl ? (
                          <img
                            src={getMediaUrl(program.trainerAvatarUrl) || ''}
                            alt={program.trainerName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${getAccentColorsByRole(program.trainerRole).primary}, ${getAccentColorsByRole(program.trainerRole).secondary})` }}>
                            <span className="text-white text-[10px] font-bold">
                              {program.trainerName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-gray-400">{program.trainerName}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{program.description}</p>

                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm text-white">
                            {(program.averageRating ?? 0) > 0 ? (program.averageRating ?? 0).toFixed(1) : '-'}
                          </span>
                          <span className="text-xs text-gray-500">({program.totalReviews ?? 0})</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{program.totalPurchases ?? 0}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {(() => {
                          // Collect all available tier prices (only non-null tiers)
                          const availablePrices: number[] = []
                          if (program.price > 0) availablePrices.push(program.price)
                          if (program.standardPrice != null && program.standardPrice > 0) availablePrices.push(program.standardPrice)
                          if (program.proPrice != null && program.proPrice > 0) availablePrices.push(program.proPrice)

                          // If no tier has a price > 0, show $0.00
                          if (availablePrices.length === 0) {
                            return <span className="text-lg font-bold text-[#0c8de6]">$0.00</span>
                          }

                          const minPrice = Math.min(...availablePrices)
                          const hasMultiplePrices = availablePrices.length > 1
                          return (
                            <span className="text-lg font-bold text-[#0c8de6]">
                              {hasMultiplePrices && (
                                <span className="text-sm font-normal text-gray-400 mr-1">{tc('from')}</span>
                              )}
                              {`$${minPrice.toFixed(2)}`}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {!isLoading && !error && (hasMoreTraining || hasMoreMeal) && (
          <div className="flex justify-center pt-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              {loadingMore ? tc('loading') : tc('loadMore')}
            </button>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && !error && totalCount > 0 && (
          <p className="text-center text-sm text-gray-500">
            {tc('showingXofY', { shown: filteredPrograms.length, total: totalCount })}
          </p>
        )}
      </div>

    </>
  )
}
