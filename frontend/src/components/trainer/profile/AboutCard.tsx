'use client'

import { Card } from '@/components/ui/Card'
import { AboutDto } from '@/types/trainerProfile'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useState } from 'react'
import { Edit2, Save, X } from 'lucide-react'

interface AboutCardProps {
  about: AboutDto
  onUpdate?: (text: string) => Promise<void>
}

export function AboutCard({ about, onUpdate }: AboutCardProps) {
  const { t } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(about.text || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!onUpdate) return
    
    setSaving(true)
    try {
      await onUpdate(text)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update about:', error)
      alert('Ошибка при сохранении. Попробуйте снова.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setText(about.text || '')
    setIsEditing(false)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
          {t.aboutMe}
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Редактировать"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors disabled:opacity-50"
              title="Сохранить"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50"
              title="Отменить"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={saving}
          className="w-full min-h-[150px] px-4 py-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          placeholder="Расскажите о себе..."
        />
      ) : (
        <>
          {text ? (
            <p className="text-gray-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
              {text}
            </p>
          ) : (
            <p className="text-gray-500 dark:text-neutral-500 italic">
              {t.noData}
            </p>
          )}
        </>
      )}
    </Card>
  )
}
