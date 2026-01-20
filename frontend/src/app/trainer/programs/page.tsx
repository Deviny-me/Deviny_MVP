'use client'

import { Card } from '@/components/ui/Card'
import { DollarSign, Users, Star, TrendingUp, Plus, Package } from 'lucide-react'
import { useLanguage } from '@/components/language/LanguageProvider'

interface Program {
  id: string
  title: string
  description: string
  price: string
  students: number
  revenue: string
  rating: number
  reviews: number
  gradient: string
}

export default function TrainerProgramsPage() {
  const { t } = useLanguage()
  
  // Empty programs array - data will come from API
  const programs: Program[] = []

  const kpiData = [
    { title: t.totalRevenue, value: '0 ₽', icon: DollarSign, bgColor: 'bg-green-50 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
    { title: t.totalStudents, value: '0', icon: Users, bgColor: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    { title: t.avgRating, value: '—', icon: Star, bgColor: 'bg-yellow-50 dark:bg-yellow-900/30', iconColor: 'text-yellow-600 dark:text-yellow-400' },
    { title: t.activePrograms, value: '0', icon: TrendingUp, bgColor: 'bg-purple-50 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-50">{t.programs}</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">{t.createAndSell}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          <Plus className="w-5 h-5" />
          {t.createProgram}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-neutral-400">{kpi.title}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-neutral-50">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {programs.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-gray-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-2">{t.noProgramsYet}</h3>
            <p className="text-gray-500 dark:text-neutral-400 mb-6 max-w-md">
              {t.noProgramsDescription}
            </p>
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              <Plus className="w-5 h-5" />
              {t.createFirstProgram}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
