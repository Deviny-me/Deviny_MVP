'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { scheduleApi } from '@/lib/api/scheduleApi'
import { studentsApi, type Student } from '@/lib/api/studentsApi'
import type { ScheduleEventType, ScheduleEventStatus, ScheduleEvent } from '@/types/schedule'

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialDate?: Date
  editEvent?: ScheduleEvent | null
}

export function AddEventModal({ isOpen, onClose, onSuccess, initialDate, editEvent }: AddEventModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [studentSearchText, setStudentSearchText] = useState('')

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getLocalTimeString = (dateStr: string) => {
    const date = new Date(dateStr)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    type: 'Gym' as ScheduleEventType,
    date: initialDate ? getLocalDateString(initialDate) : getLocalDateString(new Date()),
    time: '10:00',
    duration: 60,
    location: '',
    comment: '',
  })

  useEffect(() => {
    if (editEvent) {
      const eventDate = new Date(editEvent.startAt)
      setFormData({
        studentId: editEvent.studentId || '',
        title: editEvent.title,
        type: editEvent.type as ScheduleEventType,
        date: getLocalDateString(eventDate),
        time: getLocalTimeString(editEvent.startAt),
        duration: editEvent.durationMinutes,
        location: editEvent.location || '',
        comment: editEvent.comment || '',
      })
      // Установить текст для студента при редактировании
      if (editEvent.studentName) {
        setStudentSearchText(editEvent.studentName)
      }
    } else {
      // Сбросить форму для нового события
      setFormData({
        studentId: '',
        title: '',
        type: 'Gym',
        date: initialDate ? getLocalDateString(initialDate) : getLocalDateString(new Date()),
        time: '10:00',
        duration: 60,
        location: '',
        comment: '',
      })
      setStudentSearchText('')
    }
  }, [editEvent, initialDate, isOpen])

  useEffect(() => {
    if (isOpen) {
      loadStudents()
    }
  }, [isOpen])

  const loadStudents = async () => {
    setLoadingStudents(true)
    try {
      const data = await studentsApi.getStudents()
      setStudents(data)
    } catch (err) {
      console.error('Ошибка загрузки студентов:', err)
    } finally {
      setLoadingStudents(false)
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const startAt = new Date(`${formData.date}T${formData.time}:00`)
      
      // Проверяем, является ли studentId валидным GUID (выбран из списка)
      const isValidGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.studentId)
      const studentId = isValidGuid ? formData.studentId : undefined
      
      console.log('Создание события:', {
        title: formData.title,
        type: formData.type,
        startAt: startAt.toISOString(),
        durationMinutes: formData.duration,
        studentId: studentId,
      })

      let result
      if (editEvent) {
        result = await scheduleApi.updateEvent(editEvent.id, {
          studentId: studentId,
          title: formData.title,
          type: formData.type,
          startAt: startAt.toISOString(),
          durationMinutes: formData.duration,
          location: formData.location || undefined,
          comment: formData.comment || undefined,
          status: 'Confirmed',
        })
        console.log('Событие обновлено:', result)
      } else {
        result = await scheduleApi.createEvent({
          studentId: studentId,
          title: formData.title,
          type: formData.type,
          startAt: startAt.toISOString(),
          durationMinutes: formData.duration,
          location: formData.location || undefined,
          comment: formData.comment || undefined,
          status: 'Confirmed',
        })
        console.log('Событие создано:', result)
      }

      // Сброс формы
      setFormData({
        studentId: '',
        title: '',
        type: 'Gym',
        date: getLocalDateString(new Date()),
        time: '10:00',
        duration: 60,
        location: '',
        comment: '',
      })
      setStudentSearchText('')

      onClose()
      onSuccess()
    } catch (err: any) {
      console.error('Ошибка создания события:', err)
      if (err.message && err.message.includes('overlaps')) {
        setError('Это время уже занято другим событием. Выберите другое время.')
      } else {
        setError(err.message || 'Ошибка создания события')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-neutral-50">
            {editEvent ? 'Редактировать событие' : 'Новое событие'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Студент *
            </label>
            {loadingStudents ? (
              <div className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-500 dark:text-neutral-400">
                Загрузка студентов...
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  required
                  value={studentSearchText}
                  onChange={(e) => {
                    setStudentSearchText(e.target.value)
                    setShowStudentDropdown(true)
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  placeholder="Выберите или введите имя студента"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {showStudentDropdown && students.length > 0 && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowStudentDropdown(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg">
                      {students
                        .filter(student => 
                          student.name.toLowerCase().includes(studentSearchText.toLowerCase())
                        )
                        .map(student => (
                          <div
                            key={student.id}
                            onClick={() => {
                              setFormData({ ...formData, studentId: student.id })
                              setStudentSearchText(student.name)
                              setShowStudentDropdown(false)
                            }}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer text-gray-900 dark:text-neutral-50"
                          >
                            {student.name}
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Название *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Тип *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleEventType })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Gym">В зале</option>
              <option value="Online">Онлайн</option>
              <option value="Consultation">Консультация</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Дата *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Время *
              </label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Продолжительность (мин) *
            </label>
            <input
              type="number"
              required
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Место
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Комментарий
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (editEvent ? 'Сохранение...' : 'Создание...') : (editEvent ? 'Сохранить' : 'Создать событие')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
