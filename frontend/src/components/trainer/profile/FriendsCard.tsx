'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Users, UserPlus } from 'lucide-react'
import { useLanguage } from '@/components/language/LanguageProvider'

interface Friend {
  id: string
  name: string
  avatarUrl?: string | null
  initials: string
}

interface FriendsCardProps {
  friends?: Friend[]
}

export function FriendsCard({ friends = [] }: FriendsCardProps) {
  const { t } = useLanguage()

  const getInitialsColor = (initials: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-red-500',
    ]
    const index = initials.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
            Друзья
          </h3>
        </div>
        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      {friends.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 dark:text-neutral-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Пока нет друзей
          </p>
          <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
            Добавьте друзей, чтобы они отображались здесь
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {friend.avatarUrl ? (
                <Image
                  src={`http://localhost:5000${friend.avatarUrl}`}
                  alt={friend.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getInitialsColor(
                    friend.initials
                  )}`}
                >
                  {friend.initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-neutral-50 truncate">
                  {friend.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {friends.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors w-full text-center">
            Показать всех ({friends.length})
          </button>
        </div>
      )}
    </Card>
  )
}
