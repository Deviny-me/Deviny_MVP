'use client'

import { MainLayout } from '@/components/trainer/layout/MainLayout'
import { TrainerHomeFeed } from '@/components/trainer/screens/TrainerHomeFeed'

export default function TrainerDashboardPage() {
  return (
    <MainLayout>
      <TrainerHomeFeed />
    </MainLayout>
  )
}
