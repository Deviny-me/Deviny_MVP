'use client'

import { useRouter, usePathname } from 'next/navigation'
import { NavSection } from './types'

interface SharedLeftSidebarProps {
  sections: NavSection[]
  className?: string
  accentColor?: 'orange' | 'green' | 'blue'
}

const colorMap = {
  green:  { activeBg: 'from-[#22c55e]/10 to-[#16a34a]/10', activeBorder: 'border-[#22c55e]', activeIcon: 'text-[#22c55e]', hoverIcon: 'group-hover:text-[#22c55e]', badge: 'bg-[#16a34a]' },
  orange: { activeBg: 'from-[#FF6B35]/10 to-[#FF0844]/10', activeBorder: 'border-[#FF6B35]', activeIcon: 'text-[#FF6B35]', hoverIcon: 'group-hover:text-[#FF6B35]', badge: 'bg-[#FF0844]' },
  blue:   { activeBg: 'from-[#3B82F6]/10 to-[#2563EB]/10', activeBorder: 'border-[#3B82F6]', activeIcon: 'text-[#3B82F6]', hoverIcon: 'group-hover:text-[#3B82F6]', badge: 'bg-[#2563EB]' },
}

/**
 * Shared left sidebar navigation component.
 * Configurable via sections prop for different user roles.
 */
export function SharedLeftSidebar({ sections, className, accentColor = 'orange' }: SharedLeftSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isActivePath = (path: string) => pathname === path

  const colors = colorMap[accentColor]

  return (
    <div className={`w-60 flex-shrink-0 space-y-2 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto pb-6 scrollbar-hide ${className || ''}`}>
      {/* Navigation Links */}
      <div className="bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden">
        <div className="p-1">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <div className="px-3 pt-4 pb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </p>
                </div>
              )}
              {section.links.map((link, linkIndex) => {
                const isActive = isActivePath(link.path)
                const LinkIcon = link.icon
                return (
                  <button
                    key={`${link.path}-${linkIndex}`}
                    onClick={() => router.push(link.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all group ${
                      isActive
                        ? `bg-gradient-to-r ${colors.activeBg} border-l-2 ${colors.activeBorder}`
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <LinkIcon 
                      className={`w-5 h-5 transition-colors ${
                        isActive 
                          ? colors.activeIcon 
                          : `text-gray-400 ${colors.hoverIcon}`
                      }`} 
                      strokeWidth={isActive ? 2 : 1.5} 
                    />
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-white font-semibold' : 'text-gray-300'
                    }`}>
                      {link.label}
                    </span>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold ${colors.badge} text-white rounded-full`}>
                        {link.badge}
                      </span>
                    )}
                  </button>
                )
              })}
              {sectionIndex < sections.length - 1 && section.title !== null && (
                <div className="px-3 py-2">
                  <div className="h-px bg-white/5"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
