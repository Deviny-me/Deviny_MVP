'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/trainer/layout/MainLayout'
import { Search, Star, Users, BookOpen, Award, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { trainersApi } from '@/lib/api/trainersApi'
import { followsApi } from '@/lib/api/friendsApi'
import { PublicTrainerDto } from '@/types/trainer'
import { getMediaUrl } from '@/lib/config'
import { useRouter } from 'next/navigation'

export default function ExpertsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [trainers, setTrainers] = useState<PublicTrainerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTrainers()
    loadFollowing()
  }, [])

  const loadTrainers = async () => {
    try {
      setLoading(true)
      const data = await trainersApi.getAll()
      
      // Get current user ID to exclude from the list
      const currentUserId = getCurrentUserId()
      
      // Filter out current user from trainers list
      const filteredData = currentUserId 
        ? data.filter(trainer => trainer.userId !== currentUserId)
        : data
      
      setTrainers(filteredData)
    } catch (error) {
      console.error('Failed to load trainers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentUserId = (): string | null => {
    if (typeof window === 'undefined') return null
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.sub || payload.userId
      }
    } catch (e) {
      console.error('Failed to get user ID from token:', e)
    }
    return null
  }

  const loadFollowing = async () => {
    try {
      const data = await followsApi.getMyFollowing()
      setFollowing(new Set(data.map(f => f.id)))
    } catch (error) {
      console.error('Failed to load following:', error)
    }
  }

  const handleFollow = async (trainerId: string) => {
    try {
      if (following.has(trainerId)) {
        await followsApi.unfollowTrainer(trainerId)
        setFollowing(prev => {
          const newSet = new Set(prev)
          newSet.delete(trainerId)
          return newSet
        })
      } else {
        await followsApi.followTrainer(trainerId)
        setFollowing(prev => new Set([...prev, trainerId]))
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error)
    }
  }

  const filteredTrainers = trainers.filter((trainer) => {
    const matchesSearch = trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Find Your Expert</h1>
          <p className="text-gray-400">Connect with certified trainers and nutritionists</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B35]/50"
          />
        </div>

        {/* Trainers Grid */}
        {filteredTrainers.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-8 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No trainers found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrainers.map((trainer, index) => (
              <motion.div
                key={trainer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(`/dashboard/trainer/experts/${trainer.slug || trainer.id}`)}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5 hover:border-[#FF6B35]/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={getMediaUrl(trainer.avatarUrl) || '/default-avatar.png'}
                    alt={trainer.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-[#FF6B35] transition-colors">{trainer.name}</h3>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-2">
                      {trainer.primaryTitle || 'Trainer'}
                      {trainer.location && ` • ${trainer.location}`}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {trainer.specializations.slice(0, 3).map((spec, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 text-gray-300 text-[10px] rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{trainer.programsCount} programs</span>
                    </div>
                    {trainer.experienceYears && (
                      <div className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>{trainer.experienceYears}+ years</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFollow(trainer.userId)
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      following.has(trainer.userId)
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white hover:opacity-90'
                    }`}
                  >
                    {following.has(trainer.userId) ? '✓ Following' : 'Follow'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
