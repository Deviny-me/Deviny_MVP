'use client'

import { ReactNode } from 'react'
import { SharedMainLayout, userConfig } from '@/components/shared/layout'
import { UserTopNav } from './UserTopNav'
import { UserRightSidebar } from './UserRightSidebar'

interface UserMainLayoutProps {
  children: ReactNode
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
}

/**
 * User main layout using shared components.
 */
export function UserMainLayout({ 
  children, 
  showLeftSidebar = true, 
  showRightSidebar = true 
}: UserMainLayoutProps) {
  return (
    <SharedMainLayout
      topNav={<UserTopNav />}
      leftSidebarSections={userConfig.navSections}
      rightSidebar={<UserRightSidebar />}
      showLeftSidebar={showLeftSidebar}
      showRightSidebar={showRightSidebar}
    >
      {children}
    </SharedMainLayout>
  )
}
