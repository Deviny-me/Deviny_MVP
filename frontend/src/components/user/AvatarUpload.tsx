'use client'

import Image from 'next/image'
import { useState } from 'react'
import { User, Upload, Trash2, Loader2 } from 'lucide-react'
import { uploadAvatar, deleteAvatar } from '@/lib/api/userApi'

interface AvatarUploadProps {
  avatarUrl?: string | null
  onAvatarChanged: () => void
}

export default function AvatarUpload({ avatarUrl, onAvatarChanged }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      await uploadAvatar(file)
      onAvatarChanged()
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      alert('Ошибка при загрузке аватара. Попробуйте снова.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    setDeleting(true)

    try {
      await deleteAvatar()
      onAvatarChanged()
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      alert('Ошибка при удалении аватара. Попробуйте снова.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {avatarUrl ? (
          <Image
            src={`http://localhost:5000${avatarUrl}`}
            alt="Avatar"
            width={128}
            height={128}
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
            <User className="w-16 h-16 text-gray-500" />
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {avatarUrl ? 'Изменить' : 'Загрузить'}
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/gif"
            onChange={handleFileChange}
            disabled={uploading || deleting}
            className="hidden"
          />
        </label>

        {avatarUrl && (
          <button
            onClick={handleDeleteAvatar}
            disabled={uploading || deleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Удаление...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Удалить
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
