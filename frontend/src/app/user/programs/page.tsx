'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Search,
  Star,
  Users,
  ShoppingCart,
  Loader2,
  SortAsc,
  Dumbbell,
  Apple,
  MessageSquare,
  X
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { mealProgramsApi } from '@/lib/api/mealProgramsApi'
import { PublicProgramDto, PublicMealProgramDto, ProgramCategory } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useTranslations } from 'next-intl'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'

type SortOption = 'newest' | 'popular' | 'rating' | 'price-low' | 'price-high'
type FilterType = 'all' | 'Training' | 'Diet' | 'Consultation'

// Unified type for displaying both program types
type UnifiedPublicProgram = {
  id: string
  title: string
  description: string
  price: number
  proPrice?: number
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
}

function fromTraining(p: PublicProgramDto): UnifiedPublicProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    proPrice: p.proPrice,
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
  }
}

function fromMeal(p: PublicMealProgramDto): UnifiedPublicProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    proPrice: p.proPrice,
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    trainerId: p.trainerId,
    trainerName: p.trainerName,
    trainerAvatarUrl: p.trainerAvatarUrl,
    trainerSlug: p.trainerSlug,
    trainerRole: p.trainerRole,
    category: (p.category as ProgramCategory) || 'Diet',
    averageRating: 0,
    totalReviews: 0,
    totalPurchases: 0,
  }
}

export default function ProgramsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('userPrograms')
  const tc = useTranslations('common')

  const [trainingPrograms, setTrainingPrograms] = useState<PublicProgramDto[]>([])
  const [mealPrograms, setMealPrograms] = useState<PublicMealProgramDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedProgram, setSelectedProgram] = useState<UnifiedPublicProgram | null>(null)

  useEffect(() => {
    loadAllPrograms()
  }, [])

  // Deep link: ?program=<id>
  useEffect(() => {
    const programId = searchParams.get('program')
    if (!programId) return
    router.replace('/user/programs', { scroll: false })

    const allPrograms = [
      ...trainingPrograms.map(fromTraining),
      ...mealPrograms.map(fromMeal),
    ]
    const found = allPrograms.find(p => p.id === programId)
    if (found) {
      setSelectedProgram(found)
      return
    }

    programsApi.getProgramById(programId).then(prog => {
      if (prog) setSelectedProgram(fromTraining(prog))
    })
  }, [searchParams, trainingPrograms, mealPrograms, router])

  const loadAllPrograms = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [training, meal] = await Promise.all([
        programsApi.getAllPublic(),
        mealProgramsApi.getAllPublic(),
      ])
      setTrainingPrograms(training)
      setMealPrograms(meal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs')
    } finally {
      setIsLoading(false)
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
              className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Type Filters */}
            <div className="flex items-center gap-1 bg-[#0A0A0A] rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterType === 'all' 
                    ? 'bg-[#3B82F6] text-white' 
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
                      ? 'bg-[#3B82F6] text-white' 
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
                className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#3B82F6]/50"
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
            <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadAllPrograms}
              className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#FF8555] transition-colors"
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
                onClick={() => setSelectedProgram(program)}
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
                    {/* Category badge */}
                    <span className={`absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold rounded text-white flex items-center gap-0.5 ${
                      program.category === 'Training' ? 'bg-blue-600' : program.category === 'Diet' ? 'bg-green-600' : 'bg-violet-600'
                    }`}>
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
                        <span className={`text-lg font-bold ${
                          program.price === 0 ? 'text-green-400' : 'text-[#3B82F6]'
                        }`}>
                          {formatPrice(program.price)}
                        </span>
                        {program.proPrice != null && (
                          <span className="text-xs font-semibold text-purple-400">
                            PRO {formatPrice(program.proPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && !error && totalCount > 0 && (
          <p className="text-center text-sm text-gray-500">
            {tc('showingXofY', { shown: filteredPrograms.length, total: totalCount })}
          </p>
        )}
      </div>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
          t={t}
          tc={tc}
        />
      )}
    </>
  )
}

function ProgramDetailModal({ 
  program, 
  onClose,
  t,
  tc
}: { 
  program: UnifiedPublicProgram
  onClose: () => void
  t: ReturnType<typeof useTranslations>
  tc: ReturnType<typeof useTranslations>
}) {
  const router = useRouter()

  const formatPrice = (price: number) => {
    if (price === 0) return tc('free')
    return `$${price.toFixed(2)}`
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1A1A1A] rounded-xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          {program.coverImageUrl ? (
            <img
              src={getMediaUrl(program.coverImageUrl) || ''}
              alt={program.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-[#0A0A0A] flex items-center justify-center">
              {program.category === 'Training' ? (
                <Dumbbell className="w-16 h-16 text-gray-600" />
              ) : program.category === 'Diet' ? (
                <Apple className="w-16 h-16 text-gray-600" />
              ) : (
                <MessageSquare className="w-16 h-16 text-gray-600" />
              )}
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
              program.category === 'Training' ? 'bg-blue-600' : program.category === 'Diet' ? 'bg-green-600' : 'bg-violet-600'
            }`}>
              {program.category === 'Training' ? t('training') : program.category === 'Diet' ? t('nutrition') : t('consultation')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-white">{program.title}</h2>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className={`text-2xl font-bold ${
                program.price === 0 ? 'text-green-400' : 'text-[#3B82F6]'
              }`}>
                {formatPrice(program.price)}
              </span>
              {program.proPrice != null && (
                <span className="text-sm font-semibold text-purple-400">
                  PRO {formatPrice(program.proPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Trainer */}
          <div 
            className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg cursor-pointer hover:bg-[#141414] transition-colors"
            onClick={() => {
              onClose()
              router.push(`/user/experts/${program.trainerSlug || program.trainerId}`)
            }}
          >
            {program.trainerAvatarUrl ? (
              <img
                src={getMediaUrl(program.trainerAvatarUrl) || ''}
                alt={program.trainerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${getAccentColorsByRole(program.trainerRole).primary}, ${getAccentColorsByRole(program.trainerRole).secondary})` }}>
                <span className="text-white font-bold">{program.trainerName.charAt(0)}</span>
              </div>
            )}
            <div>
              <p className="text-white font-medium">{program.trainerName}</p>
              <p className="text-xs text-gray-400">{t('viewTrainerProfile')}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-white font-medium">
                {(program.averageRating ?? 0) > 0 ? (program.averageRating ?? 0).toFixed(1) : '-'}
              </span>
              <span className="text-gray-500">({program.totalReviews ?? 0})</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-5 h-5" />
              <span>{program.totalPurchases ?? 0} {tc('purchases')}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">{t('aboutProgram')}</h3>
            <p className="text-white leading-relaxed">{program.description}</p>
          </div>

          {/* Purchase Buttons */}
          <div className="space-y-2">
            <button
              className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              onClick={() => alert(t('purchaseComingSoon'))}
            >
              <ShoppingCart className="w-5 h-5" />
              {program.price === 0 ? t('getForFree') : t('purchaseStandard', { price: formatPrice(program.price) })}
            </button>
            {program.proPrice != null && (
              <button
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                onClick={() => alert(t('purchaseComingSoon'))}
              >
                <ShoppingCart className="w-5 h-5" />
                {t('purchasePro', { price: formatPrice(program.proPrice) })}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-gray-500">
            {t('programCode')} <span className="text-gray-400 font-mono">{program.code}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
