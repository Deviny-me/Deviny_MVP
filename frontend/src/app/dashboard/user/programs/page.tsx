'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Search,
  Star,
  Users,
  ShoppingCart,
  Loader2,
  Filter,
  SortAsc,
  Dumbbell,
  Apple,
  X
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { PublicProgramDto } from '@/types/program'

type SortOption = 'newest' | 'popular' | 'rating' | 'price-low' | 'price-high'
type FilterType = 'all' | 'training' | 'nutrition'

export default function ProgramsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [programs, setPrograms] = useState<PublicProgramDto[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<PublicProgramDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedProgram, setSelectedProgram] = useState<PublicProgramDto | null>(null)

  useEffect(() => {
    loadPrograms()
  }, [])

  // Check for program query parameter to open modal
  useEffect(() => {
    const programId = searchParams.get('program')
    if (programId && programs.length > 0) {
      const program = programs.find(p => p.id === programId)
      if (program) {
        setSelectedProgram(program)
        // Clear the query param from URL without navigation
        router.replace('/dashboard/user/programs', { scroll: false })
      }
    }
  }, [searchParams, programs, router])

  useEffect(() => {
    applyFiltersAndSort()
  }, [programs, searchQuery, sortBy, filterType])

  const loadPrograms = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await programsApi.getAllPublic()
      setPrograms(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let result = [...programs]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.trainerName.toLowerCase().includes(query)
      )
    }

    // Filter by type (based on title/description keywords for now)
    if (filterType === 'training') {
      result = result.filter(p => 
        p.title.toLowerCase().includes('training') ||
        p.title.toLowerCase().includes('workout') ||
        p.title.toLowerCase().includes('fitness') ||
        p.title.toLowerCase().includes('тренировк') ||
        p.description.toLowerCase().includes('training') ||
        p.description.toLowerCase().includes('workout')
      )
    } else if (filterType === 'nutrition') {
      result = result.filter(p => 
        p.title.toLowerCase().includes('nutrition') ||
        p.title.toLowerCase().includes('diet') ||
        p.title.toLowerCase().includes('meal') ||
        p.title.toLowerCase().includes('питани') ||
        p.description.toLowerCase().includes('nutrition') ||
        p.description.toLowerCase().includes('diet')
      )
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'popular':
        result.sort((a, b) => b.totalPurchases - a.totalPurchases)
        break
      case 'rating':
        result.sort((a, b) => b.averageRating - a.averageRating)
        break
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
    }

    setFilteredPrograms(result)
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free'
    return `$${price.toFixed(2)}`
  }

  return (
    <UserMainLayout>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Programs</h1>
            <p className="text-sm text-gray-400">Training and nutrition programs from professional trainers</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search programs, trainers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35]/50"
            />
          </div>

          {/* Filter and Sort Row */}
          <div className="flex flex-wrap gap-2">
            {/* Type Filters */}
            <div className="flex items-center gap-1 bg-[#0A0A0A] rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterType === 'all' 
                    ? 'bg-[#FF6B35] text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('training')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterType === 'training' 
                    ? 'bg-[#FF6B35] text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                Training
              </button>
              <button
                onClick={() => setFilterType('nutrition')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterType === 'nutrition' 
                    ? 'bg-[#FF6B35] text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Apple className="w-4 h-4" />
                Nutrition
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 ml-auto">
              <SortAsc className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FF6B35]/50"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Programs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadPrograms}
              className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF8555] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0A0A0A] flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {programs.length === 0 ? 'No programs available yet' : 'No programs found'}
            </h3>
            <p className="text-sm text-gray-400">
              {programs.length === 0 
                ? 'Check back later for new programs from trainers'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPrograms.map((program) => (
              <div
                key={program.id}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => setSelectedProgram(program)}
              >
                <div className="flex">
                  {/* Cover Image */}
                  <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-[#0A0A0A]">
                    {program.coverImageUrl ? (
                      <img
                        src={program.coverImageUrl}
                        alt={program.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Dumbbell className="w-10 h-10 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col">
                    {/* Title & Trainer */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white line-clamp-1">{program.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {program.trainerAvatarUrl ? (
                          <img
                            src={program.trainerAvatarUrl}
                            alt={program.trainerName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">
                              {program.trainerName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-gray-400">{program.trainerName}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{program.description}</p>
                    </div>

                    {/* Stats & Price */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm text-white">
                            {program.averageRating > 0 ? program.averageRating.toFixed(1) : '-'}
                          </span>
                          <span className="text-xs text-gray-500">({program.totalReviews})</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{program.totalPurchases}</span>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${
                        program.price === 0 ? 'text-green-400' : 'text-[#FF6B35]'
                      }`}>
                        {formatPrice(program.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && !error && programs.length > 0 && (
          <p className="text-center text-sm text-gray-500">
            Showing {filteredPrograms.length} of {programs.length} programs
          </p>
        )}
      </div>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </UserMainLayout>
  )
}

// Program Detail Modal Component
function ProgramDetailModal({ 
  program, 
  onClose 
}: { 
  program: PublicProgramDto
  onClose: () => void 
}) {
  const router = useRouter()

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free'
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
        {/* Header with Cover */}
        <div className="relative">
          {program.coverImageUrl ? (
            <img
              src={program.coverImageUrl}
              alt={program.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-[#0A0A0A] flex items-center justify-center">
              <Dumbbell className="w-16 h-16 text-gray-600" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Title & Price */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-white">{program.title}</h2>
            <span className={`text-2xl font-bold flex-shrink-0 ${
              program.price === 0 ? 'text-green-400' : 'text-[#FF6B35]'
            }`}>
              {formatPrice(program.price)}
            </span>
          </div>

          {/* Trainer */}
          <div 
            className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg cursor-pointer hover:bg-[#141414] transition-colors"
            onClick={() => {
              onClose()
              router.push(`/dashboard/user/experts/${program.trainerSlug || program.trainerId}`)
            }}
          >
            {program.trainerAvatarUrl ? (
              <img
                src={program.trainerAvatarUrl}
                alt={program.trainerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                <span className="text-white font-bold">
                  {program.trainerName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="text-white font-medium">{program.trainerName}</p>
              <p className="text-xs text-gray-400">View trainer profile →</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-white font-medium">
                {program.averageRating > 0 ? program.averageRating.toFixed(1) : 'No ratings'}
              </span>
              <span className="text-gray-500">({program.totalReviews} reviews)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-5 h-5" />
              <span>{program.totalPurchases} purchases</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">About this program</h3>
            <p className="text-white leading-relaxed">{program.description}</p>
          </div>

          {/* Purchase Button */}
          <button
            className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            onClick={() => {
              // TODO: Implement purchase flow
              alert('Purchase flow coming soon!')
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            {program.price === 0 ? 'Get for Free' : `Purchase for ${formatPrice(program.price)}`}
          </button>

          {/* Program Code */}
          <p className="text-center text-xs text-gray-500">
            Program code: <span className="text-gray-400 font-mono">{program.code}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
