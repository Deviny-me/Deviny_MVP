'use client'

import { ReactNode } from 'react'
import { SharedLeftSidebar } from './SharedLeftSidebar'
import { NavSection } from './types'

interface SharedMainLayoutProps {
  children: ReactNode
  topNav: ReactNode
  leftSidebarSections: NavSection[]
  rightSidebar?: ReactNode
  footer?: ReactNode
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
  footer,
  showLeftSidebar = true, 
  showRightSidebar = true,
  accentColor = 'orange',
  className,
}: SharedMainLayoutProps) {
  return (
    <div className={`min-h-screen bg-background flex flex-col ${className || ''}`}>
      {topNav}
      
      <div className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6">
        <div className="flex gap-6 pt-5">
          {/* Left Sidebar */}
          {showLeftSidebar && (
            <div className="hidden lg:block">
              <SharedLeftSidebar sections={leftSidebarSections} accentColor={accentColor} />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0 pb-8">
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

      {/* Footer */}
      {footer && (
        <footer className="mt-auto border-t border-border-subtle">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5">
            {footer}
          </div>
        </footer>
      )}
    </div>
  )
}
