'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin, Video, Trash2, Edit } from 'lucide-react'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useLevel } from '@/components/level/LevelProvider'
import { scheduleApi } from '@/lib/api/scheduleApi'
import type { ScheduleEvent, ScheduleStats } from '@/types/schedule'
import { AddEventModal } from '@/components/trainer/schedule/AddEventModal'

const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

export default function TrainerSchedulePage() {
  const { t } = useLanguage()
  const { refreshLevel } = useLevel()
  const [selectedDay, setSelectedDay] = useState(0)
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [stats, setStats] = useState<ScheduleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()))
  const [showAddModal, setShowAddModal] = useState(false)
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [showFullCalendar, setShowFullCalendar] = useState(false)

  // Calculate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart)
    date.setDate(currentWeekStart.getDate() + i)
    return date
  })

  const currentDayIndex = (() => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const weekStartDate = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate())
    const diff = Math.floor((todayStart.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff < 7 ? diff : 0
  })()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const selectedDate = new Date(currentWeekStart)
      selectedDate.setDate(currentWeekStart.getDate() + selectedDay)

      const yearStart = new Date(selectedDate.getFullYear(), 0, 1)
      yearStart.setHours(0, 0, 0, 0)

      const yearEnd = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999)

      console.log('Загрузка данных для периода:', {
        from: yearStart.toISOString(),
        to: yearEnd.toISOString(),
      })

      const [eventsData, statsData] = await Promise.all([
        scheduleApi.getEvents({
          from: yearStart.toISOString(),
          to: yearEnd.toISOString(),
        }),
        scheduleApi.getStats(yearStart.toISOString()),
      ])

      console.log('Получено событий:', eventsData.length)
      console.log('Статистика:', statsData)

      setEvents(eventsData)
      setStats(statsData)
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error)
    } finally {
      setLoading(false)
    }
  }, [currentWeekStart, selectedDay])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    setSelectedDay(currentDayIndex)
  }, [currentDayIndex])


  function getMonday(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  function goToPreviousWeek() {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeekStart(newDate)
  }

  function goToNextWeek() {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeekStart(newDate)
  }

  const selectedDate = weekDates[selectedDay]
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
  
  console.log('Выбранная дата:', selectedDateStr)
  console.log('Всего событий:', events.length)
  
  const dayEvents = events.filter((e) => {
    const eventDate = new Date(e.startAt)
    const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`
    console.log('Событие:', e.title, 'дата:', eventDateStr, 'отменено:', e.isCancelled, 'совпадает:', eventDateStr === selectedDateStr)
    return eventDateStr === selectedDateStr && !e.isCancelled
  })
  
  console.log('События на выбранный день:', dayEvents.length)

  // Вычисляем статистику для выбранного дня на основе dayEvents
  const dayStats = {
    totalEvents: dayEvents.length,
    completedEvents: dayEvents.filter(e => {
      const eventEnd = new Date(new Date(e.startAt).getTime() + e.durationMinutes * 60000)
      return eventEnd < new Date()
    }).length,
    upcomingEvents: dayEvents.filter(e => new Date(e.startAt) > new Date()).length,
    totalMinutes: dayEvents.reduce((sum, e) => sum + e.durationMinutes, 0),
    eventsByType: dayEvents.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Функция для фильтрации событий по периоду статистики
  const getStatsEvents = () => {
    const now = new Date()
    const selectedDate = weekDates[selectedDay]
    
    return events.filter(e => {
      if (e.isCancelled) return false
      const eventDate = new Date(e.startAt)
      
      switch (statsPeriod) {
        case 'day':
          return eventDate.getDate() === selectedDate.getDate() &&
                 eventDate.getMonth() === selectedDate.getMonth() &&
                 eventDate.getFullYear() === selectedDate.getFullYear()
        
        case 'week':
          const weekStart = new Date(currentWeekStart)
          weekStart.setHours(0, 0, 0, 0)
          const weekEnd = new Date(currentWeekStart)
          weekEnd.setDate(weekEnd.getDate() + 7)
          weekEnd.setHours(0, 0, 0, 0)
          return eventDate >= weekStart && eventDate < weekEnd
        
        case 'month':
          return eventDate.getMonth() === selectedDate.getMonth() &&
                 eventDate.getFullYear() === selectedDate.getFullYear()
        
        case 'year':
          return eventDate.getFullYear() === selectedDate.getFullYear()
        
        default:
          return false
      }
    })
  }

  const statsEvents = getStatsEvents()
  const periodStats = {
    totalEvents: statsEvents.length,
    completedEvents: statsEvents.filter(e => {
      const eventEnd = new Date(new Date(e.startAt).getTime() + e.durationMinutes * 60000)
      return eventEnd < new Date()
    }).length,
    upcomingEvents: statsEvents.filter(e => new Date(e.startAt) > new Date()).length,
    totalMinutes: statsEvents.reduce((sum, e) => sum + e.durationMinutes, 0),
    eventsByType: statsEvents.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const getStatsPeriodLabel = () => {
    const selectedDate = weekDates[selectedDay]
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    
    switch (statsPeriod) {
      case 'day':
        return selectedDay === currentDayIndex ? 'сегодня' : weekDays[selectedDay]
      case 'week':
        return 'недели'
      case 'month':
        return `за ${monthNames[selectedDate.getMonth()]}`
      case 'year':
        return `за ${selectedDate.getFullYear()} год`
      default:
        return ''
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Вы уверены, что хотите отменить это событие?')) return
    
    try {
      await scheduleApi.cancelEvent(id)
      await loadData()
    } catch (error) {
      console.error('Ошибка отмены события:', error)
      alert('Не удалось отменить событие')
    }
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      Gym: 'В зале',
      Online: 'Онлайн',
      Consultation: 'Консультация',
    }
    return labels[type] || type
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Gym: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      Online: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      Consultation: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    }
    return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }

  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const currentMonth = months[currentWeekStart.getMonth()]

  return (
    <div className="max-w-7xl mx-auto">
      <AddEventModal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false)
          setEditingEvent(null)
        }} 
        onSuccess={async () => {
          await loadData()
          // Обновляем уровень после создания/обновления события
          await refreshLevel()
          setEditingEvent(null)
        }}
        initialDate={weekDates[selectedDay]}
        editEvent={editingEvent}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-50">Расписание</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">Управление расписанием тренировок</p>
        </div>
        <Button 
          variant="primary" 
          className="flex items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-5 h-5" />
          Добавить событие
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
                  {currentMonth} {weekDates[0].getFullYear()}
                </h2>
                <button
                  onClick={() => setShowFullCalendar(!showFullCalendar)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  title={showFullCalendar ? "Показать неделю" : "Показать месяц"}
                >
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={goToPreviousWeek}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
                </button>
                <button 
                  onClick={() => {
                    setCurrentWeekStart(getMonday(new Date()))
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg text-sm font-medium text-gray-700 dark:text-neutral-300"
                >
                  Сегодня
                </button>
                <button 
                  onClick={goToNextWeek}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
                </button>
              </div>
            </div>

            {showFullCalendar ? (
              // Полный календарь месяца
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center">
                      <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">{day}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const year = currentWeekStart.getFullYear()
                    const month = currentWeekStart.getMonth()
                    const firstDay = new Date(year, month, 1)
                    const lastDay = new Date(year, month + 1, 0)
                    const startPadding = (firstDay.getDay() + 6) % 7
                    const days = []
                    
                    for (let i = 0; i < startPadding; i++) {
                      days.push(<div key={`empty-${i}`} />)
                    }
                    
                    for (let day = 1; day <= lastDay.getDate(); day++) {
                      const date = new Date(year, month, day)
                      const isToday = date.toDateString() === new Date().toDateString()
                      const hasEvents = events.some(e => {
                        const eventDate = new Date(e.startAt)
                        return eventDate.toDateString() === date.toDateString()
                      })
                      
                      days.push(
                        <button
                          key={day}
                          onClick={() => {
                            setCurrentWeekStart(getMonday(date))
                            const dayOfWeek = (date.getDay() + 6) % 7
                            setSelectedDay(dayOfWeek)
                            setShowFullCalendar(false)
                          }}
                          className={`relative py-3 rounded-lg text-sm font-medium transition-colors ${
                            isToday
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-900 dark:text-neutral-100'
                          }`}
                        >
                          {day}
                          {hasEvents && (
                            <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                              isToday ? 'bg-white' : 'bg-blue-600'
                            }`} />
                          )}
                        </button>
                      )
                    }
                    
                    return days
                  })()}
                </div>
              </div>
            ) : (
              // Календарь недели
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => (
                  <div key={day} className="text-center">
                    <p className="text-sm text-gray-500 dark:text-neutral-400 mb-2">{day}</p>
                    <button
                      onClick={() => setSelectedDay(index)}
                      className={`w-full py-3 rounded-xl text-lg font-medium transition-colors ${
                        selectedDay === index
                          ? 'bg-blue-600 text-white'
                          : index === currentDayIndex
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-900 dark:text-neutral-100'
                      }`}
                    >
                      {weekDates[index].getDate()}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Sessions List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">
              {selectedDay === currentDayIndex ? 'Сегодня' : weekDays[selectedDay]} — {dayEvents.length} {dayEvents.length === 1 ? 'событие' : 'событий'}
            </h3>
            
            {loading ? (
              <Card className="p-8 text-center text-gray-500 dark:text-neutral-400">
                Загрузка...
              </Card>
            ) : dayEvents.length === 0 ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-2">Нет событий</h4>
                  <p className="text-gray-500 dark:text-neutral-400 mb-4">На этот день пока нет запланированных событий</p>
                  <Button 
                    variant="primary" 
                    className="flex items-center gap-2"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Добавить событие
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <Card key={event.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-neutral-50">
                            {formatTime(event.startAt)} ({event.durationMinutes} мин)
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                            {getEventTypeLabel(event.type)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-neutral-50 mb-1">
                          {event.title}
                        </h4>
                        {event.studentName && (
                          <p className="text-sm text-gray-600 dark:text-neutral-400">
                            Клиент: {event.studentName}
                          </p>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-500 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </div>
                        )}
                        {event.comment && (
                          <p className="text-sm text-gray-500 dark:text-neutral-500 mt-2">
                            {event.comment}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {event.type === 'Online' && (
                          <Button 
                            variant="primary" 
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={async () => {
                              try {
                                const callData = await scheduleApi.startCall(event.id)
                                window.open(callData.callUrl, '_blank')
                              } catch (error) {
                                console.error('Ошибка запуска звонка:', error)
                              }
                            }}
                          >
                            <Video className="w-4 h-4" />
                            Начать
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(event)
                            setShowAddModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Stats */}
        <div>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
                Статистика {getStatsPeriodLabel()}
              </h3>
            </div>
            
            {/* Period Selector */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => setStatsPeriod('day')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  statsPeriod === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                }`}
              >
                День
              </button>
              <button
                onClick={() => setStatsPeriod('week')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  statsPeriod === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                }`}
              >
                Неделя
              </button>
              <button
                onClick={() => setStatsPeriod('month')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  statsPeriod === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                }`}
              >
                Месяц
              </button>
              <button
                onClick={() => setStatsPeriod('year')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  statsPeriod === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                }`}
              >
                Год
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500 dark:text-neutral-400">Загрузка...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">Всего событий</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-neutral-50">{periodStats.totalEvents}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">Завершено</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{periodStats.completedEvents}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">Предстоящих</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{periodStats.upcomingEvents}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">Всего минут</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-neutral-50">{periodStats.totalMinutes}</p>
                </div>
                {Object.keys(periodStats.eventsByType).length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 mb-2">По типам</p>
                    {Object.entries(periodStats.eventsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-700 dark:text-neutral-300">{getEventTypeLabel(type)}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-neutral-50">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
