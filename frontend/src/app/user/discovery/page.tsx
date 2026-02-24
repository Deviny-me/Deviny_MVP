'use client'

import { 
  Search, 
  Globe
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function DiscoveryPage() {
  const t = useTranslations('discovery')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
            <p className="text-sm text-gray-400">{t('subtitle')}</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50 transition-colors"
            />
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/20 flex items-center justify-center">
            <Globe className="w-10 h-10 text-[#3B82F6]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{t('globalFeedTitle')}</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            {t('globalFeedDesc')}
          </p>
        </div>
      </div>
    </>
  )
}
