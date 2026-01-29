'use client'

import { ReactNode } from 'react'
import { UserTopNav } from './UserTopNav'
import { UserLeftSidebar } from './UserLeftSidebar'
import { UserRightSidebar } from './UserRightSidebar'

interface UserMainLayoutProps {
  children: ReactNode
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
}

export function UserMainLayout({ 
  children, 
  showLeftSidebar = true, 
  showRightSidebar = true 
}: UserMainLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <UserTopNav />
      
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex gap-6 pt-4">
          {/* Left Sidebar */}
          {showLeftSidebar && (
            <div className="hidden lg:block">
              <UserLeftSidebar />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>

          {/* Right Sidebar */}
          {showRightSidebar && (
            <div className="hidden xl:block">
              <UserRightSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
