'use client'

import { useLanguage } from '@/components/language/LanguageProvider'
import { Card } from '@/components/ui/Card'
import { Construction } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function TrainerProfileEditPage() {
  const { t } = useLanguage()
  const router = useRouter()

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <Construction className="w-16 h-16 text-gray-400 dark:text-neutral-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-50 mb-3">
            {t.editProfile}
          </h1>
          <p className="text-gray-600 dark:text-neutral-400 mb-6">
            Страница редактирования профиля находится в разработке
          </p>
          <Button onClick={() => router.back()} variant="outline">
            Назад к профилю
          </Button>
        </div>
      </Card>
    </div>
  )
}
