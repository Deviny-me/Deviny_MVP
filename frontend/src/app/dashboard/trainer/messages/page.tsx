'use client'

import { MainLayout } from '@/components/trainer/layout/MainLayout'
import ChatInbox from '@/components/chat/ChatInbox'

export default function MessagesPage() {
  return (
    <MainLayout showRightSidebar={false}>
      <ChatInbox />
    </MainLayout>
  )
}
