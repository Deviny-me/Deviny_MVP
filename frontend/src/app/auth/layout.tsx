'use client'

import { useEffect } from 'react'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Force light theme for auth pages
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
    
    return () => {
      // Don't restore theme on unmount, let ThemeProvider handle it
    }
  }, [])

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        {children}
      </div>
    </LanguageProvider>
  )
}
