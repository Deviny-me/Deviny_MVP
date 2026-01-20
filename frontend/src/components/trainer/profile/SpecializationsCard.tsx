'use client'

import { Card } from '@/components/ui/Card'
import { SpecializationDto } from '@/types/trainerProfile'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface SpecializationsCardProps {
  specializations: SpecializationDto[]
  onAdd?: (name: string) => Promise<void>
  onRemove?: (id: string) => Promise<void>
}

const FITNESS_SPECIALIZATIONS = [
  'Персональные тренировки',
  'Групповые занятия',
  'Силовые тренировки',
  'Кардио тренировки',
  'Функциональный тренинг',
  'Кроссфит',
  'Йога',
  'Пилатес',
  'Растяжка и гибкость',
  'HIIT тренировки',
  'Бокс и единоборства',
  'Реабилитация и ЛФК',
  'Тренировки для похудения',
  'Набор мышечной массы',
  'Подготовка к соревнованиям',
  'Онлайн тренировки',
  'Детский фитнес',
  'Фитнес для пожилых',
  'Беговые тренировки',
  'Плавание',
]

export function SpecializationsCard({ specializations, onAdd, onRemove }: SpecializationsCardProps) {
  const { t } = useLanguage()
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const availableSpecs = FITNESS_SPECIALIZATIONS.filter(
    spec => !specializations.some(s => s.name === spec)
  )

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSpec = e.target.value
    if (!selectedSpec || !onAdd) {
      setIsSelectOpen(false)
      return
    }
    
    setLoading(true)
    try {
      await onAdd(selectedSpec)
      setIsSelectOpen(false)
    } catch (error) {
      console.error('Failed to add specialization:', error)
      alert('Ошибка при добавлении специализации')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!onRemove) return
    
    setLoading(true)
    try {
      await onRemove(id)
    } catch (error) {
      console.error('Failed to remove specialization:', error)
      alert('Ошибка при удалении специализации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
          {t.specializations}
        </h3>
        {onAdd && (
          <div className="relative">
            {!isSelectOpen ? (
              <button
                onClick={() => setIsSelectOpen(true)}
                disabled={loading || availableSpecs.length === 0}
                className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                title="Добавить специализацию"
              >
                <Plus className="w-5 h-5" />
              </button>
            ) : (
              <select
                autoFocus
                value=""
                onChange={handleSelectChange}
                onBlur={() => setIsSelectOpen(false)}
                disabled={loading}
                className="px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-w-[250px]"
              >
                <option value="">Выберите специализацию</option>
                {availableSpecs.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {specializations.length === 0 ? (
        <p className="text-gray-500 dark:text-neutral-500 italic">
          {t.noSpecializations}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {specializations.map((spec) => (
            <span
              key={spec.id}
              className="group relative inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <span className="select-none">{spec.name}</span>
              {onRemove && (
                <button
                  onClick={() => handleRemove(spec.id)}
                  disabled={loading}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors disabled:opacity-50"
                  title="Удалить"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}
