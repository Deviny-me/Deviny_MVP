'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/components/theme/ThemeProvider'

export function UserFooter() {
  const ts = useTranslations('userRightSidebar')
  const { theme } = useTheme()

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Image src={theme === 'dark' ? '/logo-white.png' : '/logo.png'} alt="Deviny" width={72} height={24} className="h-5 w-auto opacity-50" />
        <p className="text-xs text-gray-600">{ts('copyright')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        <a href="#" className="hover:text-[#0c8de6] transition-colors">{ts('about')}</a>
        <a href="#" className="hover:text-[#0c8de6] transition-colors">{ts('helpCenter')}</a>
        <a href="#" className="hover:text-[#0c8de6] transition-colors">{ts('privacy')}</a>
        <a href="#" className="hover:text-[#0c8de6] transition-colors">{ts('terms')}</a>
      </div>
    </div>
  )
}
