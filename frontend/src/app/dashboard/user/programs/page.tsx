'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { useUser } from '@/components/user/UserProvider'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { API_URL, getAuthHeader } from '@/lib/config'
import { 
  Star, 
  Clock, 
  Users,
  PlayCircle,
  CheckCircle,
  Lock
} from 'lucide-react'

interface Program {
  id: string
  title: string
  trainer: string
  trainerAvatar?: string
  cover: string
  price: number
  difficulty: string
  duration: string
  rating: number
  reviews: number
  progress?: number
  enrolled?: boolean
}

export default function ProgramsPage() {
  const router = useRouter()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'enrolled' | 'browse'>('enrolled')
  
  // Demo data
  const enrolledPrograms: Program[] = [
    {
      id: '1',
      title: 'Ultimate Strength Builder',
      trainer: 'Sarah Martinez',
      trainerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      cover: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      price: 49.99,
      difficulty: 'Advanced',
      duration: '8 weeks',
      rating: 4.9,
      reviews: 247,
      progress: 45,
      enrolled: true,
    },
    {
      id: '2',
      title: 'Fat Burn HIIT',
      trainer: 'Jessica Lee',
      trainerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      price: 44.99,
      difficulty: 'Intermediate',
      duration: '4 weeks',
      rating: 4.9,
      reviews: 312,
      progress: 78,
      enrolled: true,
    },
  ]

  const browsePrograms: Program[] = [
    {
      id: '3',
      title: 'Yoga Flow Mastery',
      trainer: 'Marcus Chen',
      trainerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      cover: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      price: 39.99,
      difficulty: 'Intermediate',
      duration: '6 weeks',
      rating: 4.8,
      reviews: 189,
    },
    {
      id: '4',
      title: 'Beginner\'s Full Body',
      trainer: 'Sarah Martinez',
      trainerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      cover: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800',
      price: 29.99,
      difficulty: 'Beginner',
      duration: '4 weeks',
      rating: 4.8,
      reviews: 156,
    },
    {
      id: '5',
      title: 'Powerlifting Fundamentals',
      trainer: 'David Thompson',
      trainerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      cover: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
      price: 54.99,
      difficulty: 'Intermediate',
      duration: '10 weeks',
      rating: 4.7,
      reviews: 98,
    },
  ]

  return (
    <UserMainLayout>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Programs</h1>
            <p className="text-sm text-gray-400">Track your training progress</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'enrolled'
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white'
                : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            My Programs ({enrolledPrograms.length})
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'browse'
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white'
                : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            Browse More
          </button>
        </div>

        {/* Enrolled Programs */}
        {activeTab === 'enrolled' && (
          <div className="space-y-4">
            {enrolledPrograms.length === 0 ? (
              <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-white/10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0A0A0A] flex items-center justify-center">
                  <PlayCircle className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No programs yet</h3>
                <p className="text-sm text-gray-400 mb-4">Start your fitness journey by enrolling in a program</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-6 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Browse Programs
                </button>
              </div>
            ) : (
              enrolledPrograms.map((program) => (
                <div
                  key={program.id}
                  onClick={() => router.push(`/dashboard/user/programs/${program.id}`)}
                  className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-[#FF6B35]/50 transition-all"
                >
                  <div className="flex">
                    {/* Cover */}
                    <div className="w-48 h-32 flex-shrink-0 relative">
                      <img
                        src={program.cover}
                        alt={program.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A1A1A]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{program.title}</h3>
                          <p className="text-sm text-gray-400">{program.trainer}</p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#0A0A0A] rounded">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-medium text-white">{program.rating}</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-[#FF6B35] font-medium">{program.progress}%</span>
                        </div>
                        <div className="h-2 bg-[#0A0A0A] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF0844] rounded-full transition-all"
                            style={{ width: `${program.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-3">
                        <button className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                          <PlayCircle className="w-4 h-4" />
                          Continue
                        </button>
                        <span className="text-xs text-gray-400">{program.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Browse Programs */}
        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {browsePrograms.map((program) => (
              <div
                key={program.id}
                onClick={() => router.push(`/dashboard/user/programs/${program.id}`)}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-[#FF6B35]/50 transition-all group"
              >
                {/* Cover Image */}
                <div className="relative aspect-video">
                  <img
                    src={program.cover}
                    alt={program.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs font-medium text-white">
                    {program.difficulty}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1 group-hover:text-[#FF6B35] transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">{program.trainer}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{program.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-medium">{program.rating}</span>
                      <span>({program.reviews})</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF0844] bg-clip-text text-transparent">
                      ${program.price}
                    </span>
                    <button className="px-4 py-1.5 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                      Enroll
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserMainLayout>
  )
}
