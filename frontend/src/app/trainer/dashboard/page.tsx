'use client'

import { Card } from '@/components/ui/Card'
import { TrendingUp, Users, ShoppingBag, AlertCircle, Plus, Inbox } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/language/LanguageProvider'

export default function TrainerDashboardPage() {
  const router = useRouter()
  const { t } = useLanguage()

  // Empty state KPI data
  const kpiData = [
    { id: '1', title: t.todayIncome, value: '0 ₽', delta: '0%', icon: TrendingUp },
    { id: '2', title: t.activeClients, value: '0', delta: '0', icon: Users },
    { id: '3', title: t.programsSold, value: '0', delta: '0', icon: ShoppingBag },
    { id: '4', title: t.needsAttention, value: '0', delta: '0', icon: AlertCircle },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-50">{t.welcome}</h1>
        <p className="text-gray-500 dark:text-neutral-400 mt-2">{t.dashboardSubtitle}</p>
      </div>

      {/* KPI Grid - 4 cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiData.map((kpi) => (
          <Card key={kpi.id} className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <kpi.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-gray-400 dark:text-neutral-500">
                <span>{kpi.delta}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">{kpi.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-neutral-50">{kpi.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom Section - Activity List (left) + Top Programs (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-4">{t.lastActivity}</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
              </div>
              <p className="text-gray-500 dark:text-neutral-400 mb-2">{t.noActivity}</p>
              <p className="text-sm text-gray-400 dark:text-neutral-500">{t.activityWillAppear}</p>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-4">{t.topPrograms}</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
              </div>
              <p className="text-gray-500 dark:text-neutral-400 mb-4">{t.noPrograms}</p>
              <button
                onClick={() => router.push('/trainer/programs')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {t.createProgram}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
