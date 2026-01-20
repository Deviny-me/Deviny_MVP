'use client'

import { Button } from '@/components/ui/Button'
import { Share2 } from 'lucide-react'
import { useLanguage } from '@/components/language/LanguageProvider'

interface ProfileHeaderActionsProps {
  profilePublicUrl: string
  onShareClick: () => void
}

export function ProfileHeaderActions({ profilePublicUrl, onShareClick }: ProfileHeaderActionsProps) {
  const { t } = useLanguage()

  return (
    <Button
      variant="outline"
      onClick={onShareClick}
      className="flex items-center gap-2"
    >
      <Share2 className="w-4 h-4" />
      {t.share}
    </Button>
  )
}
