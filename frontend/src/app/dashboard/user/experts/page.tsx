'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { useRouter } from 'next/navigation'
import { 
  Star, 
  Users,
  Award,
  MapPin,
  Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { trainersApi } from '@/lib/api/trainersApi'
import { PublicTrainerDto } from '@/types/trainer'

export default function ExpertsPage() {
  const router = useRouter()
  const [trainers, setTrainers] = useState<PublicTrainerDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await trainersApi.getAll()
        setTrainers(data)
      } catch (err) {
        console.error('Failed to fetch trainers:', err)
        setError('Failed to load trainers')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrainers()
  }, [])

  const filteredTrainers = trainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainer.primaryTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainer.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <UserMainLayout showRightSidebar={false}>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Expert Trainers</h1>
            <p className="text-sm text-gray-400">Find the perfect coach for your fitness journey</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search trainers by name or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Error loading trainers</h3>
            <p className="text-sm text-gray-400">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Trainers Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrainers.map((trainer) => (
              <div
                key={trainer.id}
                onClick={() => router.push(`/dashboard/user/experts/${trainer.slug || trainer.id}`)}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-[#FF6B35]/50 transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    {trainer.avatarUrl ? (
                      <img
                        src={trainer.avatarUrl}
                        alt={trainer.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">{trainer.name.charAt(0)}</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{trainer.name}</h3>
                      {trainer.primaryTitle && (
                        <p className="text-sm text-[#FF6B35]">{trainer.primaryTitle}</p>
                      )}
                      {trainer.secondaryTitle && (
                        <p className="text-xs text-gray-400 mt-1">{trainer.secondaryTitle}</p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        {trainer.programsCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>{trainer.programsCount} programs</span>
                          </div>
                        )}
                        {trainer.experienceYears && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5" />
                            <span>{trainer.experienceYears} years exp.</span>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      {trainer.location && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{trainer.location}</span>
                        </div>
                      )}

                      {/* Specializations */}
                      {trainer.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {trainer.specializations.slice(0, 3).map((spec, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-[#FF6B35]/10 text-[#FF6B35] rounded text-xs"
                            >
                              {spec}
                            </span>
                          ))}
                          {trainer.specializations.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/5 text-gray-400 rounded text-xs">
                              +{trainer.specializations.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-4 flex justify-end">
                    <button className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTrainers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No trainers found</h3>
            <p className="text-sm text-gray-400">
              {trainers.length === 0 
                ? 'No trainers available yet. Check back later!' 
                : 'Try adjusting your search'}
            </p>
          </div>
        )}
      </div>
    </UserMainLayout>
  )
}
