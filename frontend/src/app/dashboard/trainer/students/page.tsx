'use client'

import { MainLayout } from '@/components/trainer/layout/MainLayout'
import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar,
  Activity,
  MessageCircle,
  MoreVertical,
  UserX,
  Loader2
} from 'lucide-react'
import { studentsApi, Student } from '@/lib/api/studentsApi'
import { getMediaUrl } from '@/lib/config'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredStudents(
        students.filter(
          (student) =>
            student.name.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query) ||
            student.phone?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, students])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const data = await studentsApi.getStudents()
      setStudents(data)
      setFilteredStudents(data)
    } catch (error) {
      console.error('Failed to load students:', error)
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout showRightSidebar={false}>
      <div className="pb-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Мои ученики</h1>
          <p className="text-gray-400">
            Управляйте своими учениками и следите за их прогрессом
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1A1A1A]/50 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FF6B35]/20 to-[#FF0844]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{students.length}</p>
                <p className="text-sm text-gray-400">Всего учеников</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1A1A1A]/50 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{students.length}</p>
                <p className="text-sm text-gray-400">Активных</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1A1A1A]/50 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-sm text-gray-400">Занятий сегодня</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Поиск по имени, email или телефону..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#1A1A1A]/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] transition-colors"
          />
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? 'Ученики не найдены' : 'Нет учеников'}
            </h3>
            <p className="text-gray-400 text-sm">
              {searchQuery
                ? 'Попробуйте изменить поисковый запрос'
                : 'Ваши ученики появятся здесь после регистрации на ваши программы'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-[#1A1A1A]/50 rounded-xl border border-white/5 p-4 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {student.avatarUrl ? (
                      <img
                        src={getMediaUrl(student.avatarUrl) || ''}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center text-white font-bold">
                        {getInitials(student.name)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{student.name}</h3>
                      <p className="text-sm text-gray-400">Ученик</p>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{student.email}</span>
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Написать
                  </button>
                  <button className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                    <UserX className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
