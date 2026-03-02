'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Star, 
  Clock,
  PlayCircle,
  BookOpen,
  Loader2
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PurchasedProgram {
  id: string
  code: string
  title: string
  description: string
  coverImageUrl: string | null
  trainerName: string
  trainerAvatarUrl: string | null
  price: number
  purchasedAt: Date
  progress?: number
}

export default function MyJourneyPage() {
  const t = useTranslations('journey')
  const tc = useTranslations('common')
  const router = useRouter()
  const [programs, setPrograms] = useState<PurchasedProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPurchasedPrograms = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // TODO: Replace with actual API call to get purchased programs
        // const data = await programsApi.getMyPrograms()
        // setPrograms(data)
        
        // Placeholder
        await new Promise(resolve => setTimeout(resolve, 500))
        setPrograms([])
        
      } catch (err) {
        console.error('Failed to fetch purchased programs:', err)
        setError(t('errorLoading'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchasedPrograms()
  }, [])

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
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {tc('tryAgain')}
            </button>
          </div>
        )}

        {/* Programs List */}
        {!isLoading && !error && programs.length > 0 && (
          <div className="space-y-4">
            {programs.map((program) => (
              <div
                key={program.id}
                onClick={() => router.push(`/user/programs/${program.code}`)}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-[#3B82F6]/50 transition-all"
              >
                <div className="flex">
                  {/* Cover */}
                  <div className="w-48 h-32 flex-shrink-0 relative">
                    {program.coverImageUrl ? (
                      <img
                        src={program.coverImageUrl}
                        alt={program.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/20 flex items-center justify-center">
                        <span className="text-4xl">🏋️</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A1A1A]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{program.title}</h3>
                        <p className="text-sm text-gray-400">{program.trainerName}</p>
                      </div>
                    </div>

                    {/* Progress */}
                    {program.progress !== undefined && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">{t('progress')}</span>
                          <span className="text-[#3B82F6] font-medium">{program.progress}%</span>
                        </div>
                        <div className="h-2 bg-[#0A0A0A] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full transition-all"
                            style={{ width: `${program.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-3">
                      <button className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                        <PlayCircle className="w-4 h-4" />
                        {program.progress && program.progress > 0 ? t('continue') : t('start')}
                      </button>
                      <span className="text-xs text-gray-400">
                        {t('purchased')} {new Date(program.purchasedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
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
            <p className="text-sm text-gray-400 mb-4">
              {t('startJourney')}
            </p>
            <button
              onClick={() => router.push('/user/programs')}
              className="px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('browsePrograms')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
