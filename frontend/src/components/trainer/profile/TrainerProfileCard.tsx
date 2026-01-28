'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { MapPin, Briefcase, Star, Camera, Trash2, Loader2, User, Globe } from 'lucide-react'
import { TrainerDto } from '@/types/trainerProfile'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useState, useRef } from 'react'
import { uploadAvatar, deleteAvatar } from '@/lib/api/userApi'

interface TrainerProfileCardProps {
  trainer: TrainerDto
  onAvatarChanged?: () => void
}

export function TrainerProfileCard({ trainer, onAvatarChanged }: TrainerProfileCardProps) {
  const { t } = useLanguage()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      await uploadAvatar(file)
      if (onAvatarChanged) {
        onAvatarChanged()
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      alert('Ошибка при загрузке аватара. Попробуйте снова.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteAvatar = async () => {
    setDeleting(true)

    try {
      await deleteAvatar()
      if (onAvatarChanged) {
        onAvatarChanged()
      }
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      alert('Ошибка при удалении аватара. Попробуйте снова.')
    } finally {
      setDeleting(false)
    }
  }

  const getInitialsColor = (initials: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
    ]
    const index = initials.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="mb-4 relative">
          {trainer.avatarUrl ? (
            <Image
              src={`http://localhost:5000${trainer.avatarUrl}`}
              alt={trainer.fullName}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold ${getInitialsColor(
                trainer.initials
              )}`}
            >
              {trainer.initials}
            </div>
          )}
          
          {(uploading || deleting) && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          
          {/* Camera Icon Button */}
          <button
            onClick={handleCameraClick}
            disabled={uploading || deleting}
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Изменить аватар"
          >
            <Camera className="w-4 h-4" />
          </button>
          
          {/* Trash Icon Button */}
          {trainer.avatarUrl && (
            <button
              onClick={handleDeleteAvatar}
              disabled={uploading || deleting}
              className="absolute bottom-0 left-0 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Удалить аватар"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/gif"
            onChange={handleFileChange}
            disabled={uploading || deleting}
            className="hidden"
          />
        </div>

        {/* Name and Titles */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-50 mb-2">
          {trainer.fullName}
        </h2>
        
        {(trainer.primaryTitle || trainer.secondaryTitle) && (
          <p className="text-gray-600 dark:text-neutral-400 mb-4">
            {[trainer.primaryTitle, trainer.secondaryTitle]
              .filter(Boolean)
              .join(' • ')}
          </p>
        )}

        {/* Location and Experience */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-sm text-gray-600 dark:text-neutral-400">
          {trainer.gender && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{trainer.gender === 'male' ? 'Мужской' : trainer.gender === 'female' ? 'Женский' : trainer.gender}</span>
            </div>
          )}
          {(trainer.country || trainer.city) && (
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <span>{[trainer.city, trainer.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
          {trainer.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{trainer.location}</span>
            </div>
          )}
          {trainer.experienceYears && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>
                {trainer.experienceYears}{' '}
                {trainer.experienceYears === 1
                  ? 'год'
                  : trainer.experienceYears < 5
                  ? 'года'
                  : 'лет'}{' '}
                опыта
              </span>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="w-5 h-5 fill-none stroke-gray-400 dark:stroke-neutral-600"
            />
          ))}
          <span className="text-sm text-gray-500 dark:text-neutral-500">
            ({trainer.reviewsCount} {t.reviews})
          </span>
        </div>

        {/* Stats */}
        <div className="w-full border-t border-gray-200 dark:border-neutral-800 pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-neutral-50">
                {trainer.studentsCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-neutral-400 mt-1">
                Студентов
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-neutral-50">
                {trainer.programsCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-neutral-400 mt-1">
                {t.programs}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-neutral-50">
                {trainer.reviewsCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-neutral-400 mt-1">
                Отзывов
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-neutral-50">
                {trainer.ratingValue.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 dark:text-neutral-400 mt-1">
                {t.rating}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
