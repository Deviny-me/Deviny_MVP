'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Loader2,
  Dumbbell,
  Apple,
  Video,
  Star,
  Send,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { purchasesApi, PurchasedProgramDto } from '@/lib/api/purchasesApi'
import { reviewsApi } from '@/lib/api/reviewsApi'
import { getMediaUrl, MEDIA_BASE_URL } from '@/lib/config'

export default function ProgramDetailPage({
  params,
}: {
  params: { purchaseId: string }
}) {
  const { purchaseId } = params
  const t = useTranslations('journey')
  const tc = useTranslations('common')
  const router = useRouter()
  const [program, setProgram] = useState<PurchasedProgramDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [completingPurchase, setCompletingPurchase] = useState(false)
  const [watchedVideoIndexes, setWatchedVideoIndexes] = useState<Set<number>>(new Set())

  const loadProgram = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await purchasesApi.getMyPurchases()
      const found = data.find((p) => p.purchaseId === purchaseId)
      if (found) {
        setProgram(found)
      } else {
        setError('Program not found')
      }
    } catch (err) {
      console.error('Failed to fetch program:', err)
      setError(t('errorLoading'))
    } finally {
      setIsLoading(false)
    }
  }, [purchaseId, t])

  useEffect(() => {
    loadProgram()
  }, [loadProgram])

  const completeProgramIfNeeded = async () => {
    if (!program || program.purchaseStatus === 'Completed' || completingPurchase) return

    try {
      setCompletingPurchase(true)
      await purchasesApi.completePurchase(program.purchaseId)
      setProgram(prev => prev ? {
        ...prev,
        purchaseStatus: 'Completed',
        canReview: true,
      } : prev)
    } catch (err) {
      console.error('Failed to mark purchase completed:', err)
    } finally {
      setCompletingPurchase(false)
    }
  }

  const handleVideoEnded = async (videoIndex: number) => {
    setWatchedVideoIndexes(prev => {
      const next = new Set(prev)
      next.add(videoIndex)
      return next
    })

    if (!program) return
    const isLastVideo = videoIndex === program.videoUrls.length - 1
    if (isLastVideo) {
      await completeProgramIfNeeded()
    }
  }

  const handleSubmitReview = async () => {
    if (!program || reviewRating === 0 || !program.canReview || program.hasReviewed) return

    setSubmittingReview(true)
    setReviewError(null)
    setReviewSuccess(false)
    try {
      await reviewsApi.createReview({
        programId: program.programId,
        programType: program.programType,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      })

      setProgram(prev => prev ? {
        ...prev,
        hasReviewed: true,
        canReview: false,
      } : prev)
      setReviewRating(0)
      setReviewComment('')
      setReviewSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review'
      setReviewError(message)
    } finally {
      setSubmittingReview(false)
    }
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
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{tc('back')}</span>
        </button>
        <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{error || 'Program not found'}</h3>
          <button
            onClick={() => router.push('/user/journey')}
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
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">{tc('back')}</span>
      </button>

      <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
        {/* Cover Image */}
        <div className="relative">
          {program.coverImageUrl ? (
            <img
              src={getMediaUrl(program.coverImageUrl) || ''}
              alt={program.title}
              className="w-full h-56 sm:h-72 object-cover"
            />
          ) : (
            <div className="w-full h-56 sm:h-72 bg-gradient-to-br from-[#0c8de6]/20 to-[#0070c4]/20 flex items-center justify-center">
              {program.programType === 'training' ? (
                <Dumbbell className="w-16 h-16 text-gray-600" />
              ) : (
                <Apple className="w-16 h-16 text-gray-600" />
              )}
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={`px-2 py-1 text-xs font-bold rounded text-white ${
                program.programType === 'training' ? 'bg-blue-600' : 'bg-green-600'
              }`}
            >
              {program.programType === 'training' ? t('training') : t('nutrition')}
            </span>
            <span
              className={`px-2 py-1 text-xs font-bold rounded text-white ${
                program.tier === 'Pro'
                  ? 'bg-purple-600'
                  : program.tier === 'Standard'
                  ? 'bg-blue-700'
                  : 'bg-gray-600'
              }`}
            >
              {program.tier}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white">{program.title}</h1>
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

          {/* Description */}
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
                      onEnded={() => handleVideoEnded(index)}
                      className="w-full max-h-[400px]"
                      src={url.startsWith('http') ? url : `${MEDIA_BASE_URL}${url}`}
                    >
                      {t('videoNotSupported')}
                    </video>
                    {(program.videos?.[index]?.title || program.videos?.[index]?.description) && (
                      <div className="px-3 py-2 bg-[#0A0A0A] border-t border-white/10">
                        {program.videos?.[index]?.title && (
                          <p className="text-sm font-semibold text-white">
                            {program.videos[index].title}
                          </p>
                        )}
                        {program.videos?.[index]?.description && (
                          <p className="text-xs text-gray-400 mt-1">
                            {program.videos[index].description}
                          </p>
                        )}
                      </div>
                    )}
                    {watchedVideoIndexes.has(index) && (
                      <p className="text-xs text-green-400 px-3 py-2 bg-[#0A0A0A]">
                        Watched
                      </p>
                    )}
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

          {/* Review after completion */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <h3 className="text-sm font-medium text-gray-300">Program Review</h3>

            {!program.canReview && !program.hasReviewed && (
              <p className="text-xs text-gray-500">
                Finish the last video to unlock review.
              </p>
            )}

            {program.hasReviewed && (
              <p className="text-sm text-green-400">You already reviewed this program.</p>
            )}

            {(program.canReview && !program.hasReviewed) && (
              <>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (reviewHover || reviewRating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience"
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:border-[#0c8de6]/50"
                />

                {reviewError && <p className="text-sm text-red-400">{reviewError}</p>}
                {reviewSuccess && <p className="text-sm text-green-400">Review submitted successfully.</p>}

                <button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || submittingReview}
                  className="px-4 py-2 bg-gradient-to-r from-[#0c8de6] to-[#0070c4] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingReview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit review
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
