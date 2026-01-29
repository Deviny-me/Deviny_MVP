'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { UserHomeFeed } from '@/components/user/screens/UserHomeFeed'

export default function UserDashboard() {
  return (
    <UserMainLayout>
      <UserHomeFeed />
    </UserMainLayout>
  )
}
