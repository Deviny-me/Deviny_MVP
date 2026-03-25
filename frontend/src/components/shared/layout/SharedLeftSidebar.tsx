'use client'

import { useRouter, usePathname } from 'next/navigation'
import { NavSection } from './types'

interface SharedLeftSidebarProps {
  sections: NavSection[]
  className?: string
  accentColor?: 'orange' | 'green' | 'blue'
}

const colorMap = {
  green:  { activeBg: 'from-[#28bf68]/10 to-[#1c9e52]/10', activeBorder: 'border-[#28bf68]', activeIcon: 'text-[#28bf68]', hoverIcon: 'group-hover:text-[#28bf68]', badge: 'bg-[#1c9e52]' },
  orange: { activeBg: 'from-[#f07915]/10 to-[#d4600b]/10', activeBorder: 'border-[#f07915]', activeIcon: 'text-[#f07915]', hoverIcon: 'group-hover:text-[#f07915]', badge: 'bg-[#d4600b]' },
  blue:   { activeBg: 'from-[#0c8de6]/10 to-[#0070c4]/10', activeBorder: 'border-[#0c8de6]', activeIcon: 'text-[#0c8de6]', hoverIcon: 'group-hover:text-[#0c8de6]', badge: 'bg-[#0070c4]' },
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
      <div className="bg-[#141414] rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="p-1.5">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <div className="px-3 pt-4 pb-2">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? `bg-gradient-to-r ${colors.activeBg} border-l-2 ${colors.activeBorder}`
                        : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                    }`}
                  >
                    <LinkIcon 
                      className={`w-[18px] h-[18px] transition-colors ${
                        isActive 
                          ? colors.activeIcon 
                          : `text-gray-500 ${colors.hoverIcon}`
                      }`} 
                      strokeWidth={isActive ? 2 : 1.5} 
                    />
                    <span className={`text-[13px] font-medium ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
                    }`}>
                      {link.label}
                    </span>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold ${colors.badge} text-white rounded-full min-w-[20px] text-center`}>
                        {link.badge}
                      </span>
                    )}
                  </button>
                )
              })}
              {sectionIndex < sections.length - 1 && section.title !== null && (
                <div className="px-3 py-2.5">
                  <div className="h-px bg-white/[0.04]"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
