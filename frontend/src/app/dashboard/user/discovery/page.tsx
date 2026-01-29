'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Star, 
  Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { programsApi } from '@/lib/api/programsApi'
import { PublicProgramDto } from '@/types/program'

export default function DiscoveryPage() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [programs, setPrograms] = useState<PublicProgramDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'strength', label: 'Strength' },
    { id: 'cardio', label: 'Cardio' },
    { id: 'yoga', label: 'Yoga' },
    { id: 'hiit', label: 'HIIT' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'recovery', label: 'Recovery' },
  ]

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await programsApi.getAllPublic()
        setPrograms(data)
      } catch (err) {
        console.error('Failed to fetch programs:', err)
        setError('Failed to load programs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          program.trainerName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`
  }

  return (
    <UserMainLayout showRightSidebar={false}>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Discover</h1>
            <p className="text-sm text-gray-400">Find your perfect training program</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs, trainers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === category.id
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white'
                  : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {category.label}
            </button>
          ))}
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
            <h3 className="text-lg font-semibold text-white mb-2">Error loading programs</h3>
            <p className="text-sm text-gray-400">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Programs Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrograms.map((program) => (
              <div
                key={program.id}
                onClick={() => router.push(`/dashboard/user/programs/${program.code}`)}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-[#FF6B35]/50 transition-all group"
              >
                {/* Cover Image */}
                <div className="relative aspect-video bg-gradient-to-br from-[#FF6B35]/20 to-[#FF0844]/20">
                  {program.coverImageUrl ? (
                    <img
                      src={program.coverImageUrl}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">🏋️</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    {program.trainerAvatarUrl ? (
                      <img
                        src={program.trainerAvatarUrl}
                        alt={program.trainerName}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{program.trainerName.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-white">{program.trainerName}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 group-hover:text-[#FF6B35] transition-colors line-clamp-1">
                    {program.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                    {program.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-medium">
                        {program.averageRating > 0 ? program.averageRating.toFixed(1) : 'New'}
                      </span>
                      {program.totalReviews > 0 && (
                        <span>({program.totalReviews})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <span>{program.totalPurchases} enrolled</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF0844] bg-clip-text text-transparent">
                      {formatPrice(program.price)}
                    </span>
                    <button className="px-4 py-1.5 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                      View Program
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No programs found</h3>
            <p className="text-sm text-gray-400">
              {programs.length === 0 
                ? 'No programs available yet. Check back later!' 
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </div>
    </UserMainLayout>
  )
}
