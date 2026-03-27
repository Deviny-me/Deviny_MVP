'use client'

import { ReactNode } from 'react'
import { SharedMainLayout, nutritionistConfig } from '@/components/shared/layout'
import { TopNav } from './TopNav'
import { NutritionistFooter } from './NutritionistFooter'

interface MainLayoutProps {
  children: ReactNode
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
}

/**
 * Nutritionist main layout using shared components.
 */
export function MainLayout({ 
  children, 
  showLeftSidebar = true, 
  showRightSidebar = true 
}: MainLayoutProps) {
  return (
    <SharedMainLayout
      topNav={<TopNav />}
      leftSidebarSections={nutritionistConfig.navSections}
      footer={<NutritionistFooter />}
      showLeftSidebar={showLeftSidebar}
      showRightSidebar={false}
      accentColor="green"
    >
      {children}
    </SharedMainLayout>
  )
}
