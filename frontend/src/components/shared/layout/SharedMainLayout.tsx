'use client'

import { ReactNode } from 'react'
import { SharedLeftSidebar } from './SharedLeftSidebar'
import { NavSection } from './types'

interface SharedMainLayoutProps {
  children: ReactNode
  topNav: ReactNode
  leftSidebarSections: NavSection[]
  rightSidebar?: ReactNode
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
  accentColor?: 'orange' | 'green' | 'blue'
  className?: string
}

/**
 * Shared main layout component.
 * Configurable via props for different user roles.
 */
export function SharedMainLayout({ 
  children,
  topNav,
  leftSidebarSections,
  rightSidebar,
  showLeftSidebar = true, 
  showRightSidebar = true,
  accentColor = 'orange',
  className,
}: SharedMainLayoutProps) {
  return (
    <div className={`min-h-screen bg-[#0A0A0A] ${className || ''}`}>
      {topNav}
      
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex gap-6 pt-4">
          {/* Left Sidebar */}
          {showLeftSidebar && (
            <div className="hidden lg:block">
              <SharedLeftSidebar sections={leftSidebarSections} accentColor={accentColor} />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>

          {/* Right Sidebar */}
          {showRightSidebar && rightSidebar && (
            <div className="hidden xl:block">
              {rightSidebar}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
