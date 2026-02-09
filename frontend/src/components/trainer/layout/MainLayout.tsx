'use client'

import { ReactNode } from 'react'
import { SharedMainLayout, trainerConfig } from '@/components/shared/layout'
import { TopNav } from './TopNav'
import { RightSidebar } from './RightSidebar'

interface MainLayoutProps {
  children: ReactNode
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
}

/**
 * Trainer main layout using shared components.
 */
export function MainLayout({ 
  children, 
  showLeftSidebar = true, 
  showRightSidebar = true 
}: MainLayoutProps) {
  return (
    <SharedMainLayout
      topNav={<TopNav />}
      leftSidebarSections={trainerConfig.navSections}
      rightSidebar={<RightSidebar />}
      showLeftSidebar={showLeftSidebar}
      showRightSidebar={showRightSidebar}
    >
      {children}
    </SharedMainLayout>
  )
}
