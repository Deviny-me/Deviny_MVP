'use client'

import { useRouter } from 'next/navigation'
import { 
  TrendingUp,
  Flame,
  Star,
  Loader2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { programsApi } from '@/lib/api/programsApi'
import { trainersApi } from '@/lib/api/trainersApi'
import { PublicProgramDto } from '@/types/program'
import { PublicTrainerDto } from '@/types/trainer'

interface NewsItem {
  title: string
  category: string
  time: string
}

export function UserRightSidebar() {
  const router = useRouter()
  const [trainers, setTrainers] = useState<PublicTrainerDto[]>([])
  const [programs, setPrograms] = useState<PublicProgramDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Static news data for now
  const fitnessNews: NewsItem[] = [
    { title: 'Top 5 HIIT Workouts for Fat Loss', category: 'Training', time: '2h ago' },
    { title: 'Nutrition Tips for Muscle Gain', category: 'Nutrition', time: '4h ago' },
    { title: 'Recovery Techniques Every Athlete Needs', category: 'Recovery', time: '6h ago' },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [trainersData, programsData] = await Promise.all([
          trainersApi.getAll().catch(() => []),
          programsApi.getAllPublic().catch(() => [])
        ])
        setTrainers(trainersData.slice(0, 3)) // Top 3 trainers
        setPrograms(programsData.slice(0, 3)) // Top 3 programs
      } catch (err) {
        console.error('Failed to fetch sidebar data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`
  }

  return (
    <div className="w-72 flex-shrink-0 space-y-2 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto pb-6">
      {/* Fitness News */}
      <div className="bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-white/10">
          <h3 className="text-xs font-bold text-white">IGNITE Fitness News</h3>
        </div>
        <div className="p-2">
          {fitnessNews.map((news, index) => (
            <button
              key={index}
              className="w-full text-left p-2 rounded hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-1 h-1 rounded-full bg-gray-500 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white leading-tight">{news.title}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{news.time}</p>
                </div>
              </div>
            </button>
          ))}
          <button className="w-full py-1.5 text-xs text-gray-400 hover:text-white transition-colors font-medium mt-1">
            Show more →
          </button>
        </div>
      </div>

      {/* Featured Trainers */}
      <div className="bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-white/10">
          <h3 className="text-xs font-bold text-white">Featured Instructors</h3>
        </div>
        <div className="p-2 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-[#FF6B35] animate-spin" />
            </div>
          ) : trainers.length > 0 ? (
            <>
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  className="flex items-center gap-2.5 p-2 rounded hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/user/experts/${trainer.slug || trainer.id}`)}
                >
                  {trainer.avatarUrl ? (
                    <img
                      src={trainer.avatarUrl}
                      alt={trainer.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                      <span className="text-white font-bold">{trainer.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-xs truncate">{trainer.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate">
                      {trainer.primaryTitle || trainer.specializations[0] || 'Trainer'}
                    </p>
                    {trainer.programsCount > 0 && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {trainer.programsCount} program{trainer.programsCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    className="px-2.5 py-1 bg-transparent border border-gray-600 text-gray-300 text-[10px] font-semibold rounded hover:bg-white/5 hover:border-gray-500 transition-colors"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </>
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">No trainers yet</p>
          )}
          <button
            onClick={() => router.push('/dashboard/user/experts')}
            className="w-full py-1.5 text-xs text-gray-400 hover:text-white transition-colors font-medium"
          >
            See all instructors →
          </button>
        </div>
      </div>

      {/* Trending Programs */}
      <div className="bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-white/10 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#FF6B35]" strokeWidth={2} />
          <h3 className="text-xs font-bold text-white">Trending Programs</h3>
        </div>
        <div className="p-2 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-[#FF6B35] animate-spin" />
            </div>
          ) : programs.length > 0 ? (
            <>
              {programs.map((program, index) => (
                <div
                  key={program.id}
                  className="flex items-start gap-2.5 p-2 rounded hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/user/programs/${program.code}`)}
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center text-white text-[10px] font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-xs truncate">{program.title}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{program.trainerName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF0844] bg-clip-text text-transparent">
                        {formatPrice(program.price)}
                      </span>
                      {program.averageRating > 0 && (
                        <>
                          <span className="text-[10px] text-gray-500">•</span>
                          <div className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] text-gray-400">{program.averageRating.toFixed(1)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">No programs yet</p>
          )}
          <button
            onClick={() => router.push('/dashboard/user/discovery')}
            className="w-full py-1.5 text-xs text-gray-400 hover:text-white transition-colors font-medium"
          >
            Explore all programs →
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-gray-500">
          <a href="#" className="hover:text-[#FF6B35] hover:underline">About</a>
          <span>•</span>
          <a href="#" className="hover:text-[#FF6B35] hover:underline">Help Center</a>
          <span>•</span>
          <a href="#" className="hover:text-[#FF6B35] hover:underline">Privacy</a>
          <span>•</span>
          <a href="#" className="hover:text-[#FF6B35] hover:underline">Terms</a>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
            <Flame className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-[10px] text-gray-600">IGNITE Fitness © 2026</p>
        </div>
      </div>
    </div>
  )
}
