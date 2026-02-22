'use client'

import { Flame, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { NutritionistClient } from '@/lib/api/nutritionistClientsApi'
import { getMediaUrl } from '@/lib/config'

export function RightSidebar() {
  const router = useRouter()
  const tFeed = useTranslations('feed')
  const tCommon = useTranslations('common')
  const [clients, setClients] = useState<NutritionistClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSidebarData()
  }, [])

  const loadSidebarData = async () => {
    try {
      setLoading(true)
      // TODO: Load clients when backend endpoint is ready
    } catch (error) {
      console.error('Failed to load sidebar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="w-72 flex-shrink-0 space-y-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto pb-6 scrollbar-hide">
      {/* Recent Clients */}
      {clients.length > 0 && (
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">{tFeed('recentClients')}</h3>
            <button
              onClick={() => router.push('/nutritionist/clients')}
              className="text-xs text-[#22c55e] hover:underline flex items-center gap-1"
            >
              {tCommon('all')}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                {client.avatarUrl ? (
                  <img
                    src={getMediaUrl(client.avatarUrl) || ''}
                    alt={client.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(client.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{client.name}</p>
                  <p className="text-xs text-gray-500 truncate">{client.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-gray-500">
          <a href="#" className="hover:text-[#22c55e] hover:underline">About</a>
          <span>•</span>
          <a href="#" className="hover:text-[#22c55e] hover:underline">Help Center</a>
          <span>•</span>
          <a href="#" className="hover:text-[#22c55e] hover:underline">Privacy</a>
          <span>•</span>
          <a href="#" className="hover:text-[#22c55e] hover:underline">Terms</a>
          <span>•</span>
          <a href="#" className="hover:text-[#22c55e] hover:underline">Advertising</a>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center">
            <Flame className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-[10px] text-gray-600">Deviny Fitness © 2026</p>
        </div>
      </div>
    </div>
  )
}
