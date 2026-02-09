'use client'

import { Flame, Users, Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { studentsApi, Student } from '@/lib/api/studentsApi'
import { scheduleApi } from '@/lib/api/scheduleApi'
import { getMediaUrl } from '@/lib/config'

export function RightSidebar() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSidebarData()
  }, [])

  const loadSidebarData = async () => {
    try {
      setLoading(true)
      // TODO: Load students when backend endpoint is ready
      // const studentsData = await studentsApi.getStudents()
      // setStudents(studentsData.slice(0, 5))

      // Load upcoming events
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const events = await scheduleApi.getEvents({
        from: today.toISOString(),
        to: nextWeek.toISOString(),
      })
      setUpcomingEvents(events.length)
    } catch (error) {
      console.error('Failed to load sidebar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="w-72 flex-shrink-0 space-y-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto pb-6 scrollbar-hide">
      {/* Recent Students */}
      {students.length > 0 && (
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Недавние ученики</h3>
            <button
              onClick={() => router.push('/dashboard/trainer/students')}
              className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1"
            >
              Все
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                {student.avatarUrl ? (
                  <img
                    src={getMediaUrl(student.avatarUrl) || ''}
                    alt={student.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(student.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{student.name}</p>
                  <p className="text-xs text-gray-500 truncate">{student.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <span>•</span>
          <a href="#" className="hover:text-[#FF6B35] hover:underline">Advertising</a>
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
