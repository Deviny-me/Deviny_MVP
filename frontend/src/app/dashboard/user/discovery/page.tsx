'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { 
  Search, 
  Globe
} from 'lucide-react'
import { useState } from 'react'

export default function DiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <UserMainLayout showRightSidebar={false}>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Discover</h1>
            <p className="text-sm text-gray-400">Global feed - Coming soon</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts, people, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
            />
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FF0844]/20 flex items-center justify-center">
            <Globe className="w-10 h-10 text-[#FF6B35]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Global Feed Coming Soon</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            This will be your main feed where you&apos;ll see posts, activities, and updates from the community.
          </p>
        </div>
      </div>
    </UserMainLayout>
  )
}
