'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  Award,
  Calendar,
  Home,
  Compass,
  BookOpen,
  Trophy,
  Radio,
  Target,
  GraduationCap,
  Layers,
  Star,
  TrendingUp,
  Crown,
  Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { trainersApi } from '@/lib/api/trainersApi'
import { programsApi } from '@/lib/api/programsApi'
import { PublicTrainerDto } from '@/types/trainer'
import { PublicProgramDto } from '@/types/program'

export function UserLeftSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeRankingTab, setActiveRankingTab] = useState<'trainers' | 'programs'>('trainers')
  const [topTrainers, setTopTrainers] = useState<PublicTrainerDto[]>([])
  const [topPrograms, setTopPrograms] = useState<PublicProgramDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [trainersData, programsData] = await Promise.all([
          trainersApi.getAll().catch(() => []),
          programsApi.getAllPublic().catch(() => [])
        ])
        setTopTrainers(trainersData.slice(0, 3))
        setTopPrograms(programsData.slice(0, 3))
      } catch (err) {
        console.error('Failed to fetch sidebar data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const navigationSections = [
    {
      title: null,
      links: [
        { icon: Home, label: 'Home', path: '/dashboard/user' },
        { icon: Compass, label: 'Discover', path: '/dashboard/user/discovery' },
        { icon: GraduationCap, label: 'Experts', path: '/dashboard/user/experts' },
      ]
    },
    {
      title: 'Training',
      links: [
        { icon: Layers, label: 'Programs', path: '/dashboard/user/programs' },
        { icon: BookOpen, label: 'My Journey', path: '/dashboard/user/journey' },
        { icon: Radio, label: 'Live Workouts', path: '/dashboard/user/live' },
        { icon: Calendar, label: 'Schedule', path: '/dashboard/user/schedule' },
      ]
    },
    {
      title: 'Compete',
      links: [
        { icon: Target, label: 'Challenges', path: '/dashboard/user/challenges' },
        { icon: Trophy, label: 'Leaderboards', path: '/dashboard/user/leaderboards' },
        { icon: Award, label: 'Achievements', path: '/dashboard/user/achievements' },
      ]
    }
  ]

  const isActive = (path: string) => pathname === path

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(0)}`
  }

  return (
    <div className="w-60 flex-shrink-0 space-y-2 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto pb-6">
      {/* Top Rankings Widget */}
      <div className="bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-white text-sm">Top Ranked</h3>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#0A0A0A] rounded-lg p-1">
            <button
              onClick={() => setActiveRankingTab('trainers')}
              className={`flex-1 px-2 py-1.5 rounded text-[10px] font-bold transition-all ${
                activeRankingTab === 'trainers'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Trainers
            </button>
            <button
              onClick={() => setActiveRankingTab('programs')}
              className={`flex-1 px-2 py-1.5 rounded text-[10px] font-bold transition-all ${
                activeRankingTab === 'programs'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Programs
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-[#FF6B35] animate-spin" />
            </div>
          ) : (
            <>
              {/* Trainers */}
              {activeRankingTab === 'trainers' && (
                topTrainers.length > 0 ? (
                  topTrainers.map((trainer, index) => (
                    <button
                      key={trainer.id}
                      onClick={() => router.push(`/dashboard/user/experts/${trainer.slug || trainer.id}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group"
                    >
                      {/* Rank Badge */}
                      <div className={`w-6 h-6 flex items-center justify-center rounded font-bold text-xs ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                        'bg-gradient-to-br from-orange-400 to-orange-600 text-black'
                      }`}>
                        {index === 0 ? <Crown className="w-3 h-3" /> : index + 1}
                      </div>

                      {/* Avatar */}
                      {trainer.avatarUrl ? (
                        <img
                          src={trainer.avatarUrl}
                          alt={trainer.name}
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{trainer.name.charAt(0)}</span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF6B35] transition-colors">
                          {trainer.name}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span>{trainer.primaryTitle || 'Trainer'}</span>
                          {trainer.programsCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{trainer.programsCount} programs</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No trainers yet</p>
                )
              )}

              {/* Programs */}
              {activeRankingTab === 'programs' && (
                topPrograms.length > 0 ? (
                  topPrograms.map((program, index) => (
                    <button
                      key={program.id}
                      onClick={() => router.push(`/dashboard/user/programs/${program.code}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group"
                    >
                      <div className={`w-6 h-6 flex items-center justify-center rounded font-bold text-xs ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                        'bg-gradient-to-br from-orange-400 to-orange-600 text-black'
                      }`}>
                        {index === 0 ? <Crown className="w-3 h-3" /> : index + 1}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF6B35] transition-colors">
                          {program.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          {program.averageRating > 0 && (
                            <>
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span>{program.averageRating.toFixed(1)}</span>
                              <span>•</span>
                            </>
                          )}
                          <span className="text-[#FF6B35] font-bold">{formatPrice(program.price)}</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No programs yet</p>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden">
        {navigationSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={sectionIndex > 0 ? 'border-t border-white/10' : ''}>
            {section.title && (
              <div className="px-4 py-2">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
            )}
            <div className={section.title ? 'pb-2' : 'py-2'}>
              {section.links.map((link) => (
                <button
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isActive(link.path)
                      ? 'text-[#FF6B35] bg-[#FF6B35]/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <link.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
