'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Copy, Check } from 'lucide-react'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useState } from 'react'

interface ShareProfileCardProps {
  profilePublicUrl: string
}

export function ShareProfileCard({ profilePublicUrl }: ShareProfileCardProps) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profilePublicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert(t.linkCopied)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">
        {t.share}
      </h3>
      <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
        Поделитесь ссылкой на свой профиль с клиентами
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={profilePublicUrl}
          readOnly
          className="flex-1 px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          onClick={handleCopy}
          variant="outline"
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              {t.linkCopied}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {t.copyLink}
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
