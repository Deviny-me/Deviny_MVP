'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { NavSection } from './types'
import { startNavigation } from '@/components/ui/RouteProgressBar'

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
  const t = useTranslations('nav')

  const isActivePath = (path: string) => pathname === path

  const colors = colorMap[accentColor]

  return (
    <div className={`w-60 flex-shrink-0 space-y-2 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto pb-6 scrollbar-hide ${className || ''}`}>
      {/* Navigation Links */}
      <div className="bg-surface-2 rounded-xl border border-border-subtle overflow-hidden">
        <div className="p-1.5">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <div className="px-3 pt-4 pb-2">
                  <p className="text-[11px] font-semibold text-faint-foreground uppercase tracking-widest">
                    {t(section.title as any)}
                  </p>
                </div>
              )}
              {section.links.map((link, linkIndex) => {
                const isActive = isActivePath(link.path)
                const LinkIcon = link.icon
                return (
                  <button
                    key={`${link.path}-${linkIndex}`}
                    onClick={() => { if (!isActivePath(link.path)) startNavigation(); router.push(link.path) }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? `bg-gradient-to-r ${colors.activeBg} border-l-2 ${colors.activeBorder}`
                        : 'text-muted-foreground hover:bg-hover-overlay hover:text-foreground'
                    }`}
                  >
                    <LinkIcon 
                      className={`w-[18px] h-[18px] transition-colors ${
                        isActive 
                          ? colors.activeIcon 
                          : `text-faint-foreground ${colors.hoverIcon}`
                      }`} 
                      strokeWidth={isActive ? 2 : 1.5} 
                    />
                    <span className={`text-[13px] font-medium ${
                      isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}>
                      {t(link.label as any)}
                    </span>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold ${colors.badge} text-foreground rounded-full min-w-[20px] text-center`}>
                        {link.badge}
                      </span>
                    )}
                  </button>
                )
              })}
              {sectionIndex < sections.length - 1 && section.title !== null && (
                <div className="px-3 py-2.5">
                  <div className="h-px bg-border-subtle"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
