'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Star,
  Users,
  ShoppingCart,
  Loader2,
  Dumbbell,
  Apple,
  MessageSquare,
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { mealProgramsApi } from '@/lib/api/mealProgramsApi'
import { purchasesApi } from '@/lib/api/purchasesApi'
import { reviewsApi } from '@/lib/api/reviewsApi'
import { PublicProgramDto, PublicMealProgramDto, ProgramCategory, ReviewDto } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useTranslations } from 'next-intl'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

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
  }
}

export default function ProgramDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('userPrograms')
  const tc = useTranslations('common')

  const [program, setProgram] = useState<UnifiedPublicProgram | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ReviewDto[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const loadProgram = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const category = searchParams.get('category')

      // Try training program first (has a direct by-id endpoint)
      if (category !== 'Diet') {
        const trainingProg = await programsApi.getProgramById(id)
        if (trainingProg) {
          setProgram(fromTraining(trainingProg))
          return
        }
      }

      // Fallback: search in meal programs
      const mealRes = await mealProgramsApi.getAllPublic(1, 100)
      const found = mealRes.items.find((p) => p.id === id)
      if (found) {
        setProgram(fromMeal(found))
        return
      }

      // If category wasn't Diet, also try training (in case getProgramById returned null for other reasons)
      if (category === 'Diet') {
        const trainingProg = await programsApi.getProgramById(id)
        if (trainingProg) {
          setProgram(fromTraining(trainingProg))
          return
        }
      }

      setError('Program not found')
    } catch (err) {
      console.error('Failed to fetch program:', err)
      setError(err instanceof Error ? err.message : 'Failed to load program')
    } finally {
      setIsLoading(false)
    }
  }, [id, searchParams])

  useEffect(() => {
    loadProgram()
  }, [loadProgram])

  const programType = program?.category === 'Diet' ? ('meal' as const) : ('training' as const)

  const loadReviews = useCallback(async () => {
    if (!program) return
    try {
      setReviewsLoading(true)
      const data = await reviewsApi.getReviews(program.id, programType)
      setReviews(data)
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setReviewsLoading(false)
    }
  }, [program, programType])

  useEffect(() => {
    if (program) {
      loadReviews()
    }
  }, [program, loadReviews])

  useRealtimeScopeRefresh(['programs', 'reviews'], () => {
    loadProgram()
    if (program) {
      loadReviews()
    }
  })

  const handlePurchase = async (tier: string) => {
    if (!program) return
    setPurchasing(true)
    setPurchaseError(null)
    try {
      await purchasesApi.purchase({
        programId: program.id,
        programType,
        tier,
      })
      router.push('/user/journey')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Purchase failed'
      setPurchaseError(message)
    } finally {
      setPurchasing(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return tc('free')
    return `$${price.toFixed(2)}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#0c8de6] animate-spin" />
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="space-y-4 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{tc('back')}</span>
        </button>
        <div className="text-center py-12 bg-surface-3 rounded-xl border border-border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{error || 'Program not found'}</h3>
          <button
            onClick={() => router.push('/user/programs')}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#0c8de6] to-[#0070c4] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {tc('back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">{tc('back')}</span>
      </button>

      <div className="bg-surface-3 rounded-xl border border-border overflow-hidden">
        {/* Cover Image */}
        <div className="relative">
          {program.coverImageUrl ? (
            <img
              src={getMediaUrl(program.coverImageUrl) || ''}
              alt={program.title}
              className="w-full h-56 sm:h-72 object-cover"
            />
          ) : (
            <div className="w-full h-56 sm:h-72 bg-background flex items-center justify-center">
              {program.category === 'Training' ? (
                <Dumbbell className="w-16 h-16 text-gray-600" />
              ) : program.category === 'Diet' ? (
                <Apple className="w-16 h-16 text-gray-600" />
              ) : (
                <MessageSquare className="w-16 h-16 text-gray-600" />
              )}
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={`px-2 py-1 text-xs font-bold rounded text-foreground ${
                program.category === 'Training'
                  ? 'bg-blue-600'
                  : program.category === 'Diet'
                  ? 'bg-green-600'
                  : 'bg-violet-600'
              }`}
            >
              {program.category === 'Training'
                ? t('training')
                : program.category === 'Diet'
                ? t('nutrition')
                : t('consultation')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">{program.title}</h1>
            <div className="flex flex-col items-end flex-shrink-0">
              {(() => {
                const availablePrices: number[] = []
                if (program.price > 0) availablePrices.push(program.price)
                if (program.standardPrice != null && program.standardPrice > 0)
                  availablePrices.push(program.standardPrice)
                if (program.proPrice != null && program.proPrice > 0)
                  availablePrices.push(program.proPrice)

                if (availablePrices.length === 0) {
                  return <span className="text-2xl font-bold text-[#0c8de6]">$0.00</span>
                }

                const minPrice = Math.min(...availablePrices)
                const hasMultiple = availablePrices.length > 1
                return (
                  <span className="text-2xl font-bold text-[#0c8de6]">
                    {hasMultiple && (
                      <span className="text-sm font-normal text-muted-foreground mr-1">{tc('from')}</span>
                    )}
                    {`$${minPrice.toFixed(2)}`}
                  </span>
                )
              })()}
            </div>
          </div>

          {/* Trainer */}
          <div
            className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-surface-2 transition-colors"
            onClick={() => router.push(`/user/profile/${program.trainerId}`)}
          >
            {program.trainerAvatarUrl ? (
              <img
                src={getMediaUrl(program.trainerAvatarUrl) || ''}
                alt={program.trainerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(to bottom right, ${getAccentColorsByRole(program.trainerRole).primary}, ${getAccentColorsByRole(program.trainerRole).secondary})`,
                }}
              >
                <span className="text-foreground font-bold">{program.trainerName.charAt(0)}</span>
              </div>
            )}
            <div>
              <p className="text-foreground font-medium">{program.trainerName}</p>
              <p className="text-xs text-muted-foreground">
                {program.trainerRole?.toLowerCase() === 'nutritionist' ||
                program.trainerRole === '2'
                  ? t('viewNutritionistProfile')
                  : t('viewTrainerProfile')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-foreground font-medium">
                {(program.averageRating ?? 0) > 0
                  ? (program.averageRating ?? 0).toFixed(1)
                  : '-'}
              </span>
              <span className="text-faint-foreground">({program.totalReviews ?? 0})</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span>
                {program.totalPurchases ?? 0} {tc('purchases')}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('aboutProgram')}</h3>
            <p className="text-foreground leading-relaxed">{program.description}</p>
          </div>

          {/* Purchase Buttons */}
          <div className="space-y-3">
            {purchaseError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                {purchaseError}
              </div>
            )}

            {/* Basic Tier */}
            {program.price > 0 && (
              <div>
                <button
                  disabled={purchasing}
                  className="w-full py-3 bg-gradient-to-r from-[#0c8de6] to-[#0070c4] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                  onClick={() => handlePurchase('Basic')}
                >
                  {purchasing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  {`${t('basicTier')} \u2014 ${formatPrice(program.price)}`}
                </button>
                <p className="text-xs text-faint-foreground mt-1 text-center">{t('basicTierDesc')}</p>
              </div>
            )}

            {/* Standard Tier */}
            {program.standardPrice != null &&
              program.standardPrice > 0 &&
              (() => {
                const soldOut =
                  program.maxStandardSpots != null &&
                  program.maxStandardSpots > 0 &&
                  (program.standardSpotsRemaining ?? 0) <= 0
                return (
                  <div>
                    <button
                      disabled={soldOut || purchasing}
                      className={`w-full py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-opacity ${
                        soldOut
                          ? 'bg-gray-700 text-muted-foreground cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:opacity-90 disabled:opacity-50'
                      }`}
                      onClick={() => !soldOut && handlePurchase('Standard')}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {soldOut
                        ? t('soldOut')
                        : `${t('standardTier')} — ${formatPrice(program.standardPrice!)}`}
                      {!soldOut &&
                        program.maxStandardSpots != null &&
                        program.maxStandardSpots > 0 && (
                          <span className="text-xs opacity-75">
                            ({program.standardSpotsRemaining} {t('spotsLeft')})
                          </span>
                        )}
                    </button>
                    <p className="text-xs text-faint-foreground mt-1 text-center">
                      {t('standardTierDesc')}
                    </p>
                  </div>
                )
              })()}

            {/* Pro Tier */}
            {program.proPrice != null &&
              program.proPrice > 0 &&
              (() => {
                const soldOut =
                  program.maxProSpots != null &&
                  program.maxProSpots > 0 &&
                  (program.proSpotsRemaining ?? 0) <= 0
                return (
                  <div>
                    <button
                      disabled={soldOut || purchasing}
                      className={`w-full py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-opacity ${
                        soldOut
                          ? 'bg-gray-700 text-muted-foreground cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:opacity-90 disabled:opacity-50'
                      }`}
                      onClick={() => !soldOut && handlePurchase('Pro')}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {soldOut
                        ? t('soldOut')
                        : `${t('proTier')} — ${formatPrice(program.proPrice!)}`}
                      {!soldOut &&
                        program.maxProSpots != null &&
                        program.maxProSpots > 0 && (
                          <span className="text-xs opacity-75">
                            ({program.proSpotsRemaining} {t('spotsLeft')})
                          </span>
                        )}
                    </button>
                    <p className="text-xs text-faint-foreground mt-1 text-center">{t('proTierDesc')}</p>
                  </div>
                )
              })()}
          </div>

          <p className="text-center text-xs text-faint-foreground">
            {t('programCode')}{' '}
            <span className="text-muted-foreground font-mono">{program.code}</span>
          </p>
        </div>
      </div>

      <div className="bg-surface-3 rounded-xl border border-border overflow-hidden">
        <div className="p-5 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            {t('reviews')} ({reviews.length})
          </h2>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#0c8de6] animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-faint-foreground text-sm">{t('noReviews')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-background rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {review.userAvatarUrl ? (
                        <img
                          src={getMediaUrl(review.userAvatarUrl) || ''}
                          alt={review.userName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-foreground text-xs font-bold">
                            {review.userName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-foreground text-sm font-medium">{review.userName}</p>
                        <p className="text-xs text-faint-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
