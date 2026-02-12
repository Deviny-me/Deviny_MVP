'use client'

import { AuthProvider } from '@/features/auth/AuthContext'
import { PostStoreProvider } from '@/contexts/PostStoreContext'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PostStoreProvider>
        {children}
      </PostStoreProvider>
    </AuthProvider>
  )
}
