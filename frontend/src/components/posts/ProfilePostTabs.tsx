'use client'

import { Grid, Video, Repeat2 } from 'lucide-react'
import type { ProfilePostTab } from '@/types/post'
import { useAccentColors } from '@/lib/theme/useAccentColors'

interface ProfilePostTabsProps {
  activeTab: ProfilePostTab
  onTabChange: (tab: ProfilePostTab) => void
  disabled?: boolean
}

const tabs: { key: ProfilePostTab; label: string; icon: typeof Grid }[] = [
  { key: 'all', label: 'Все публикации', icon: Grid },
  { key: 'videos', label: 'Видео', icon: Video },
  { key: 'reposts', label: 'Репосты', icon: Repeat2 },
]

export function ProfilePostTabs({ activeTab, onTabChange, disabled }: ProfilePostTabsProps) {
  const accent = useAccentColors()
  return (
    <div className="flex items-center bg-surface-1 border-b border-border-subtle px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            disabled={disabled && !isActive}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
              isActive
                ? accent.text
                : disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {isActive && (
              <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${accent.bg} rounded-t`} />
            )}
          </button>
        )
      })}
    </div>
  )
}
