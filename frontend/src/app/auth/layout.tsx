'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #ffffff 0%, #fefcf6 30%, #fdf8ed 60%, #faf3e0 100%)' }}
    >
      {/* Soft warm glow — top right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-15%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          maxWidth: 700,
          maxHeight: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.08) 0%, transparent 70%)',
        }}
      />
      {/* Soft warm glow — bottom left */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-15%',
          left: '-10%',
          width: '45vw',
          height: '45vw',
          maxWidth: 600,
          maxHeight: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Image src="/logo.png" alt="Deviny" width={110} height={36} className="w-[90px] sm:w-[110px] h-auto" priority />
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Form area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-6 sm:pb-8">
        {children}
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </LanguageProvider>
  )
}
