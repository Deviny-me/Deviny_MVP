'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Users } from 'lucide-react'

interface GymBroCardProps {
  gymBro?: {
    id: string
    name: string
    avatarUrl?: string
  }
}

export function GymBroCard({ gymBro }: GymBroCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
          GymBro
        </h3>
      </div>

      {!gymBro ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-3">
            <Users className="w-8 h-8 text-gray-400 dark:text-neutral-600" />
          </div>
          <p className="text-gray-500 dark:text-neutral-500 text-sm">
            Партнер по тренировкам не выбран
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {gymBro.avatarUrl ? (
            <Image
              src={gymBro.avatarUrl}
              alt={gymBro.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {gymBro.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-neutral-50">
              {gymBro.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-neutral-500">
              Партнер по тренировкам
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
