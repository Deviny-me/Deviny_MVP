'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Search, Filter, Plus, Users } from 'lucide-react'
import { useLanguage } from '@/components/language/LanguageProvider'

interface Client {
  id: string
  name: string
  initials: string
  program: string
  status: 'active' | 'new' | 'attention' | 'vip'
  progress: number
  workouts: number
  nextSession: string
  avatarColor: string
}

export default function TrainerClientsPage() {
  const { t } = useLanguage()
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Empty clients array - data will come from API
  const clients: Client[] = []

  const filters = [
    { key: 'all', label: t.all, count: 0 },
    { key: 'active', label: t.active, count: 0 },
    { key: 'new', label: t.new, count: 0 },
    { key: 'vip', label: t.vip, count: 0 },
    { key: 'attention', label: t.needAttention, count: 0 },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-50">{t.clients}</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">{t.manageClients}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          <Plus className="w-5 h-5" />
          {t.addClient}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === filter.key
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder={t.searchByName}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
          <Filter className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
          <span className="text-gray-700 dark:text-neutral-300">{t.filters}</span>
        </button>
      </div>

      {/* Empty State */}
      {clients.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-gray-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-2">{t.noClients}</h3>
            <p className="text-gray-500 dark:text-neutral-400 mb-6 max-w-md">
              {t.noClientsDescription}
            </p>
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              <Plus className="w-5 h-5" />
              {t.addFirstClient}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
