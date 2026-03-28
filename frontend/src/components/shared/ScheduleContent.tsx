'use client'

import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  Users,
  Video,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  MapPin,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ScheduleEvent, CreateScheduleEventRequest, ScheduleEventType, ScheduleStats, GetEventsQuery, StartCallResponse } from '@/types/schedule'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

export interface ScheduleApiAdapter {
  getEvents(query?: GetEventsQuery): Promise<ScheduleEvent[]>
  getStats(weekStartISO: string): Promise<ScheduleStats>
  createEvent?(data: CreateScheduleEventRequest): Promise<ScheduleEvent>
  updateEvent?(id: string, data: CreateScheduleEventRequest): Promise<ScheduleEvent>
  cancelEvent?(id: string): Promise<void>
  startCall?(id: string): Promise<StartCallResponse>
}

interface StudentOption {
  id: string
  name: string
}

interface ScheduleContentProps {
  api: ScheduleApiAdapter
  fetchStudents?: () => Promise<StudentOption[]>
  readOnly?: boolean
  currentUserId?: string
}

// Simple toast helper
const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDates(start: Date): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d)
  }
  return dates
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ScheduleContent({ api, fetchStudents, readOnly, currentUserId }: ScheduleContentProps) {
  const accent = useAccentColors()
  const t = useTranslations('schedule')
  const tc = useTranslations('common')

  const weekDays = [t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat'), t('days.sun')]
  const eventTypes: { value: ScheduleEventType; label: string }[] = [
    { value: 'Gym', label: t('eventTypes.gym') },
    { value: 'Online', label: t('eventTypes.online') },
    { value: 'Consultation', label: t('eventTypes.consultation') },
  ]

  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [stats, setStats] = useState<ScheduleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()))
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<ScheduleEventType>('Online')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [location, setLocation] = useState('')
  const [comment, setComment] = useState('')
  const [studentId, setStudentId] = useState('')

  useEffect(() => {
    loadEvents()
    loadStats()
  }, [weekStart])

  useEffect(() => {
    if (fetchStudents) {
      fetchStudents().then(setStudents).catch(() => setStudents([]))
    }
  }, [fetchStudents])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const data = await api.getEvents({
        from: weekStart.toISOString(),
        to: weekEnd.toISOString(),
      })
      setEvents(data)
    } catch (error) {
      console.error('Failed to load events:', error)
      toast.error(t('toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await api.getStats(weekStart.toISOString())
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  useRealtimeScopeRefresh(['schedule'], () => {
    loadEvents()
    loadStats()
  })

  const resetForm = () => {
    setTitle('')
    setEventType('Online')
    setStartDate('')
    setStartTime('')
    setDuration('60')
    setLocation('')
    setComment('')
    setStudentId('')
    setEditingEvent(null)
  }

  const openCreateModal = () => {
    resetForm()
    setStartDate(formatDateForInput(selectedDate))
    setStartTime('10:00')
    setShowCreateModal(true)
  }

  const openEditModal = (event: ScheduleEvent) => {
    setEditingEvent(event)
    setTitle(event.title)
    setEventType(event.type)
    const eventDate = new Date(event.startAt)
    setStartDate(formatDateForInput(eventDate))
    setStartTime(eventDate.toTimeString().slice(0, 5))
    setDuration(event.durationMinutes.toString())
    setLocation(event.location || '')
    setComment(event.comment || '')
    setStudentId(event.studentId || '')
    setShowCreateModal(true)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !startDate || !startTime || !duration) {
      toast.error(t('toasts.fillRequired'))
      return
    }

    try {
      setSaving(true)

      const startAt = new Date(`${startDate}T${startTime}:00`).toISOString()

      const request: CreateScheduleEventRequest = {
        title,
        type: eventType,
        startAt,
        durationMinutes: parseInt(duration),
        location: location || undefined,
        comment: comment || undefined,
        studentId: studentId || undefined,
      }

      if (editingEvent) {
        await api.updateEvent!(editingEvent.id, request)
        toast.success(t('toasts.updated'))
      } else {
        await api.createEvent!(request)
        toast.success(t('toasts.created'))
      }

      closeModal()

      const eventDate = new Date(`${startDate}T00:00:00`)
      setSelectedDate(eventDate)
      const newWeekStart = getWeekStart(eventDate)
      if (newWeekStart.getTime() !== weekStart.getTime()) {
        setWeekStart(newWeekStart)
      } else {
        loadEvents()
        loadStats()
      }
    } catch (error) {
      console.error('Failed to save event:', error)
      toast.error(editingEvent ? t('toasts.updateError') : t('toasts.createError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm(t('toasts.cancelConfirm'))) return

    try {
      setDeleting(eventId)
      await api.cancelEvent!(eventId)
      toast.success(t('toasts.cancelled'))
      loadEvents()
      loadStats()
    } catch (error) {
      console.error('Failed to cancel event:', error)
      toast.error(t('toasts.cancelError'))
    } finally {
      setDeleting(null)
    }
  }

  const handleStartCall = async (eventId: string) => {
    try {
      const result = await api.startCall!(eventId)
      window.open(result.callUrl, '_blank')
    } catch (error) {
      console.error('Failed to start call:', error)
      toast.error(t('toasts.callError'))
    }
  }

  const goToPreviousWeek = () => {
    const newStart = new Date(weekStart)
    newStart.setDate(newStart.getDate() - 7)
    setWeekStart(newStart)
  }

  const goToNextWeek = () => {
    const newStart = new Date(weekStart)
    newStart.setDate(newStart.getDate() + 7)
    setWeekStart(newStart)
  }

  const goToToday = () => {
    setWeekStart(getWeekStart(new Date()))
    setSelectedDate(new Date())
  }

  const weekDates = getWeekDates(weekStart)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filter events for selected date
  const selectedDateStr = selectedDate.toDateString()
  const todaysEvents = events
    .filter((event) => {
      const eventDate = new Date(event.startAt)
      return eventDate.toDateString() === selectedDateStr && !event.isCancelled
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const getListParticipantName = (event: ScheduleEvent) => {
    if (currentUserId && event.studentId === currentUserId) {
      return event.trainerName || event.studentName || null
    }

    if (currentUserId && event.trainerId === currentUserId) {
      return event.studentName || event.trainerName || null
    }

    return event.studentName || event.trainerName || null
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {!readOnly && (
          <button
            onClick={openCreateModal}
            className={`px-4 py-2 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 flex items-center gap-2`}
          >
            <Plus className="w-5 h-5" />
            {t('addEvent')}
          </button>
        )}
      </div>

      {/* Calendar Week View */}
      <div className="bg-surface-2 rounded-xl border border-border-subtle p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={goToPreviousWeek} className="p-2 hover:bg-hover-overlay rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-foreground">
              {weekStart.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={goToToday} className="px-3 py-1 text-xs bg-border-subtle hover:bg-white/10 rounded-lg text-muted-foreground transition-colors">
              {t('today')}
            </button>
          </div>
          <button onClick={goToNextWeek} className="p-2 hover:bg-hover-overlay rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const dateOnly = new Date(date)
            dateOnly.setHours(0, 0, 0, 0)
            const isToday = dateOnly.getTime() === today.getTime()
            const isSelected = date.toDateString() === selectedDate.toDateString()
            const dayEvents = events.filter((e) => {
              const eventDate = new Date(e.startAt)
              return eventDate.toDateString() === date.toDateString() && !e.isCancelled
            })

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-3 rounded-xl text-center transition-all relative ${
                  isSelected
                    ? `bg-gradient-to-br ${accent.gradient} text-white`
                    : isToday
                    ? `${accent.bgMuted20} text-foreground border ${accent.borderMuted50}`
                    : 'bg-background text-muted-foreground hover:bg-hover-overlay'
                }`}
              >
                <p className="text-xs font-medium mb-1">{weekDays[index]}</p>
                <p className="text-lg font-bold">{date.getDate()}</p>
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : accent.bg}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Events for Selected Date */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">
          {selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
          </div>
        ) : todaysEvents.length === 0 ? (
          <div className="text-center py-12 bg-surface-2 rounded-xl border border-border-subtle">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('noEvents')}</p>
            {!readOnly && (
              <button
                onClick={openCreateModal}
                className={`mt-4 px-4 py-2 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90`}
              >
                {t('addEvent')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {todaysEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setDetailEvent(event)}
                className={`bg-surface-2 rounded-xl border border-border-subtle p-4 ${accent.hoverBorder} transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-1.5 h-16 rounded-full bg-gradient-to-b ${accent.gradient} ${
                      event.type === 'Consultation' ? 'opacity-70' : ''
                    }`}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${accent.bgMuted20} ${accent.text}`}
                      >
                        {eventTypes.find((et) => et.value === event.type)?.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          event.status === 'Confirmed'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {event.status === 'Confirmed' ? t('confirmed') : t('pending')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(event.startAt)} • {event.durationMinutes} {tc('min')}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {getListParticipantName(event) && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{getListParticipantName(event)}</span>
                        </div>
                      )}
                    </div>
                    {event.comment && <p className="text-xs text-faint-foreground mt-1">{event.comment}</p>}
                  </div>

                  {!readOnly && (!currentUserId || event.trainerId === currentUserId) && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {event.type === 'Online' && (
                      <button
                        onClick={() => handleStartCall(event.id)}
                        className={`p-3 bg-gradient-to-r ${accent.gradient} rounded-lg hover:opacity-90 transition-opacity`}
                      >
                        <Video className="w-5 h-5 text-foreground" />
                      </button>
                    )}
                    <button onClick={() => openEditModal(event)} className="p-2 bg-border-subtle hover:bg-white/10 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      className="p-2 bg-border-subtle hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting === event.id ? (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-400" />
                      )}
                    </button>
                  </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 text-center">
          <Calendar className={`w-8 h-8 ${accent.text} mx-auto mb-2`} />
          <p className="text-2xl font-bold text-foreground">{todaysEvents.length}</p>
          <p className="text-xs text-muted-foreground">{t('totalEvents')}</p>
        </div>
        <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 text-center">
          <Users className={`w-8 h-8 ${accent.text} mx-auto mb-2`} />
          <p className="text-2xl font-bold text-foreground">{stats?.upcomingEvents || 0}</p>
          <p className="text-xs text-muted-foreground">{t('upcoming')}</p>
        </div>
        <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 text-center">
          <Clock className={`w-8 h-8 ${accent.text} mx-auto mb-2`} />
          <p className="text-2xl font-bold text-foreground">{stats?.totalMinutes ? Math.round(stats.totalMinutes / 60) : 0}ч</p>
          <p className="text-xs text-muted-foreground">{t('trainingHours')}</p>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-2 rounded-2xl border border-border-subtle w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {editingEvent ? t('editEvent') : t('newEvent')}
                </h2>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{t('eventName')}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground focus:outline-none ${accent.focusBorder}`}
                    placeholder={t('eventNamePlaceholder')}
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{t('eventType')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {eventTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setEventType(type.value)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          eventType === type.value
                            ? `bg-gradient-to-r ${accent.gradient} text-white`
                            : 'bg-white/5 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Student Selection */}
                {students.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('student')}</label>
                    <select
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground focus:outline-none ${accent.focusBorder}`}
                    >
                      <option value="">{t('selectStudent')}</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('date')}</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground focus:outline-none ${accent.focusBorder}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('time')}</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground focus:outline-none ${accent.focusBorder}`}
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{t('duration')}</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground focus:outline-none ${accent.focusBorder}`}
                  >
                    <option value="30">{t('duration30')}</option>
                    <option value="45">{t('duration45')}</option>
                    <option value="60">{t('duration60')}</option>
                    <option value="90">{t('duration90')}</option>
                    <option value="120">{t('duration120')}</option>
                  </select>
                </div>

                {/* Location */}
                {eventType === 'Gym' && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('location')}</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground focus:outline-none ${accent.focusBorder}`}
                      placeholder={t('locationPlaceholder')}
                    />
                  </div>
                )}

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{t('comment')}</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    className={`w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground focus:outline-none ${accent.focusBorder} resize-none`}
                    placeholder={t('commentPlaceholder')}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full py-3 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  {editingEvent ? t('saveChanges') : t('createEvent')}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Event Detail Modal */}
      {detailEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-2 rounded-2xl border border-border-subtle w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">{t('eventDetails')}</h2>
                <button onClick={() => setDetailEvent(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title & badges */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{detailEvent.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${accent.bgMuted20} ${accent.text}`}>
                      {eventTypes.find((et) => et.value === detailEvent.type)?.label}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        detailEvent.status === 'Confirmed'
                          ? 'bg-green-500/20 text-green-400'
                          : detailEvent.status === 'Completed'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {detailEvent.status === 'Confirmed' ? t('confirmed') : detailEvent.status === 'Completed' ? t('completed') : t('pending')}
                    </span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className={`w-5 h-5 ${accent.text}`} />
                  <span>
                    {new Date(detailEvent.startAt).toLocaleDateString('ru-RU', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <Clock className={`w-5 h-5 ${accent.text}`} />
                  <span>
                    {formatTime(detailEvent.startAt)} • {detailEvent.durationMinutes} {tc('min')}
                  </span>
                </div>

                {/* Location */}
                {detailEvent.location && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className={`w-5 h-5 ${accent.text}`} />
                    <span>{detailEvent.location}</span>
                  </div>
                )}

                {/* Trainer */}
                {detailEvent.trainerName && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className={`w-5 h-5 ${accent.text}`} />
                    <span>{t('trainerLabel')}: {detailEvent.trainerName}</span>
                  </div>
                )}

                {/* Student */}
                {detailEvent.studentName && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className={`w-5 h-5 ${accent.text}`} />
                    <span>{t('student')}: {detailEvent.studentName}</span>
                  </div>
                )}

                {/* Comment */}
                {detailEvent.comment && (
                  <div className="bg-background rounded-lg p-4 border border-border-subtle">
                    <p className="text-sm text-muted-foreground mb-1">{t('comment')}</p>
                    <p className="text-foreground">{detailEvent.comment}</p>
                  </div>
                )}

                {/* Created at */}
                <p className="text-xs text-faint-foreground">
                  {t('createdAt')}: {new Date(detailEvent.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Actions */}
              {!readOnly && (!currentUserId || detailEvent.trainerId === currentUserId) && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-border-subtle">
                  {detailEvent.type === 'Online' && (
                    <button
                      onClick={() => { handleStartCall(detailEvent.id); setDetailEvent(null); }}
                      className={`flex-1 py-2.5 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 flex items-center justify-center gap-2`}
                    >
                      <Video className="w-4 h-4" />
                      {t('startCall')}
                    </button>
                  )}
                  <button
                    onClick={() => { openEditModal(detailEvent); setDetailEvent(null); }}
                    className="flex-1 py-2.5 bg-border-subtle hover:bg-white/10 text-foreground font-semibold rounded-lg flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {t('editEvent')}
                  </button>
                  <button
                    onClick={() => { handleDelete(detailEvent.id); setDetailEvent(null); }}
                    className="py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-lg flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
