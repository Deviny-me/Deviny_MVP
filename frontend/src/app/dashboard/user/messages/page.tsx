'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import ChatInbox from '@/components/chat/ChatInbox'

export default function MessagesPage() {
  return (
    <UserMainLayout showLeftSidebar={false} showRightSidebar={false}>
      <ChatInbox />
    </UserMainLayout>
  )
}
