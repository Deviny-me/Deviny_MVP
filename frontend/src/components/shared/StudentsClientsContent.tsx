'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  Loader2,
} from 'lucide-react'
import { getMediaUrl } from '@/lib/config'
import { useAccentColors } from '@/lib/theme/useAccentColors'

export interface ClientOrStudent {
  id: string
  firstName?: string
  lastName?: string
  fullName: string
  email: string
  phone?: string | null
  avatarUrl?: string | null
  name: string
}

interface StudentsClientsContentProps {
  fetchData: () => Promise<ClientOrStudent[]>
}

export function StudentsClientsContent({ fetchData }: StudentsClientsContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const accent = useAccentColors()
  const t = useTranslations('students')
  const tc = useTranslations('common')

  // Derive basePath from current route: /trainer, /nutritionist, or /user
  const basePath = pathname?.split('/').slice(0, 2).join('/') || '/user'
  const [students, setStudents] = useState<ClientOrStudent[]>([])
  const [filteredStudents, setFilteredStudents] = useState<ClientOrStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchData()
        setStudents(data)
        setFilteredStudents(data)
      } catch (error) {
        console.error('Failed to load students/clients:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredStudents(
        students.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query) ||
            s.phone?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, students])

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
      </div>
    )
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-2/50 rounded-xl border border-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${accent.gradientBg20} flex items-center justify-center`}>
              <Users className={`w-5 h-5 ${accent.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
              <p className="text-sm text-muted-foreground">{t('totalStudents')}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-2/50 rounded-xl border border-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${accent.bgMuted} flex items-center justify-center`}>
              <Activity className={`w-5 h-5 ${accent.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
              <p className="text-sm text-muted-foreground">{t('active')}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-2/50 rounded-xl border border-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${accent.bgMuted} flex items-center justify-center`}>
              <Calendar className={`w-5 h-5 ${accent.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">{t('todaySessions')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint-foreground" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-12 pr-4 py-3 bg-surface-2/50 border border-border-subtle rounded-lg text-foreground placeholder-gray-500 focus:outline-none ${accent.focusBorder} transition-colors`}
        />
      </div>

      {/* List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-border-subtle flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery ? t('notFound') : t('noStudents')}
          </h3>
          <p className="text-muted-foreground text-sm">
            {searchQuery ? t('tryDifferentSearch') : t('willAppear')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-surface-2/50 rounded-xl border border-border-subtle p-4 hover:border-border-subtle transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => router.push(`${basePath}/profile/${student.id}`)}
                >
                  {student.avatarUrl ? (
                    <img
                      src={getMediaUrl(student.avatarUrl) || ''}
                      alt={student.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white font-bold`}>
                      {getInitials(student.name)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground hover:underline">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{t('student')}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`${basePath}/profile/${student.id}`)}
                  className="p-1.5 hover:bg-hover-overlay rounded-lg transition-colors"
                  title={t('viewProfile')}
                >
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-faint-foreground" />
                  <span>{student.email}</span>
                </div>
                {student.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 text-faint-foreground" />
                    <span>{student.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`${basePath}/messages?userId=${student.id}`)}
                  className={`flex-1 py-2 bg-gradient-to-r ${accent.gradient} text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('write')}
                </button>
                <button
                  onClick={() => router.push(`${basePath}/profile/${student.id}`)}
                  className="px-3 py-2 bg-border-subtle hover:bg-white/10 border border-border-subtle rounded-lg transition-colors"
                  title={t('viewProfile')}
                >
                  <Users className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
