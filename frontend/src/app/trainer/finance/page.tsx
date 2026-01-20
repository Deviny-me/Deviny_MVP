'use client'

import { Card } from '@/components/ui/Card'
import { DollarSign, TrendingUp, CreditCard, Download, Wallet } from 'lucide-react'
import { useLanguage } from '@/components/language/LanguageProvider'

interface Transaction {
  id: string
  type: 'income' | 'withdrawal'
  description: string
  amount: string
  date: string
}

interface PopularProgram {
  id: string
  title: string
  sales: number
  revenue: string
}

export default function TrainerFinancePage() {
  const { t } = useLanguage()
  
  // Empty data - will come from API
  const transactions: Transaction[] = []
  const popularPrograms: PopularProgram[] = []

  const kpiCards = [
    { 
      title: t.availableForWithdraw, 
      value: '0 ₽', 
      subtitle: t.platformFee,
      icon: DollarSign, 
      bgColor: 'bg-blue-600',
      textColor: 'text-white',
      isPrimary: true
    },
    { 
      title: t.monthlyIncome, 
      value: '0 ₽', 
      subtitle: t.noData,
      subtitleColor: 'text-gray-500 dark:text-neutral-400',
      icon: TrendingUp, 
      bgColor: 'bg-white dark:bg-neutral-800',
      textColor: 'text-gray-900 dark:text-neutral-50'
    },
    { 
      title: t.forecastIncome, 
      value: '— ₽', 
      subtitle: t.notEnoughData,
      icon: CreditCard, 
      bgColor: 'bg-white dark:bg-neutral-800',
      textColor: 'text-gray-900 dark:text-neutral-50'
    },
  ]

  const incomeBreakdown = [
    { label: t.programs, amount: '0 ₽', percentage: 0, color: 'bg-blue-600' },
    { label: t.personalTraining, amount: '0 ₽', percentage: 0, color: 'bg-green-500' },
    { label: t.consultations, amount: '0 ₽', percentage: 0, color: 'bg-purple-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-50">{t.finance}</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">{t.manageFinance}</p>
        </div>
        <button 
          disabled
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-300 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 rounded-lg cursor-not-allowed font-medium"
        >
          <Download className="w-5 h-5" />
          {t.withdrawFunds}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {kpiCards.map((card) => (
          <Card 
            key={card.title} 
            className={`p-5 ${card.isPrimary ? card.bgColor : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg ${card.isPrimary ? 'bg-white/20' : 'bg-gray-50 dark:bg-neutral-700'} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.isPrimary ? 'text-white' : 'text-gray-600 dark:text-neutral-300'}`} />
              </div>
              <div>
                <p className={`text-sm ${card.isPrimary ? 'text-white/80' : 'text-gray-500 dark:text-neutral-400'}`}>{card.title}</p>
                <p className={`text-2xl font-bold ${card.isPrimary ? 'text-white' : card.textColor}`}>{card.value}</p>
                <p className={`text-sm mt-1 ${card.isPrimary ? 'text-white/70' : card.subtitleColor || 'text-gray-500 dark:text-neutral-400'}`}>
                  {card.subtitle}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Breakdown */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">{t.incomeStructure}</h2>
            <div className="space-y-4">
              {incomeBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 dark:text-neutral-300">{item.label}</span>
                    <span className="font-medium text-gray-900 dark:text-neutral-50">{item.amount}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">{t.recentTransactions}</h2>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Wallet className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
                </div>
                <p className="text-gray-500 dark:text-neutral-400">{t.noTransactions}</p>
                <p className="text-sm text-gray-400 dark:text-neutral-500 mt-1">{t.transactionsHistory}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Transactions will be rendered here */}
              </div>
            )}
          </Card>
        </div>

        {/* Popular Programs */}
        <div>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">{t.popularPrograms}</h2>
            {popularPrograms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
                </div>
                <p className="text-gray-500 dark:text-neutral-400">{t.noData}</p>
                <p className="text-sm text-gray-400 dark:text-neutral-500 mt-1">{t.createProgramToSell}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Programs will be rendered here */}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
