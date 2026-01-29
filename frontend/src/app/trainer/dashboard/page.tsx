'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { TrendingUp, Users, ShoppingBag, AlertCircle, Plus, Inbox, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/language/LanguageProvider'
import { programsApi } from '@/lib/api/programsApi'
import { ProgramDto } from '@/types/program'
import { TopPrograms, TopProgramItem } from '@/components/trainer/dashboard/TopPrograms'
import ProgramDetailsModal from '@/components/trainer/programs/ProgramDetailsModal'

export default function TrainerDashboardPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [topPrograms, setTopPrograms] = useState<TopProgramItem[]>([])
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true)
  const [allPrograms, setAllPrograms] = useState<ProgramDto[]>([])
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<ProgramDto | null>(null)
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

  // Empty state KPI data
  const kpiData = [
    { id: '1', title: t.todayIncome, value: '0 ₽', delta: '0%', icon: TrendingUp },
    { id: '2', title: t.activeClients, value: '0', delta: '0', icon: Users },
    { id: '3', title: t.programsSold, value: '0', delta: '0', icon: ShoppingBag },
    { id: '4', title: t.needsAttention, value: '0', delta: '0', icon: AlertCircle },
  ]

  useEffect(() => {
    loadTopPrograms()
  }, [])

  const loadTopPrograms = async () => {
    try {
      setIsLoadingPrograms(true)
      const programs: ProgramDto[] = await programsApi.getMyPrograms()
      setAllPrograms(programs)
      
      if (programs.length === 0) {
        setTopPrograms([])
        return
      }
      
      // Преобразуем ProgramDto в TopProgramItem
      const programsWithData = programs.map((program) => {
        const totalRevenue = program.totalPurchases * program.price
        const salesText = program.totalPurchases === 0 
          ? '0 продаж' 
          : `${program.totalPurchases} ${getSalesWord(program.totalPurchases)}`
        
        return {
          id: program.id,
          title: program.title,
          salesText: salesText,
          amount: `${formatCurrency(totalRevenue)} ₽`,
          code: program.code,
          totalRevenue: totalRevenue,
          totalPurchases: program.totalPurchases,
          createdAt: new Date(program.createdAt).getTime()
        } as TopProgramItem & { totalRevenue: number; totalPurchases: number; createdAt: number }
      })
      
      // Сортируем: сначала по доходу, затем по количеству продаж, затем по дате создания
      const sortedPrograms = programsWithData.sort((a, b) => {
        // Если есть продажи, сортируем по доходу
        if (a.totalPurchases > 0 || b.totalPurchases > 0) {
          if (b.totalRevenue !== a.totalRevenue) {
            return b.totalRevenue - a.totalRevenue
          }
          if (b.totalPurchases !== a.totalPurchases) {
            return b.totalPurchases - a.totalPurchases
          }
        }
        // Если нет продаж, сортируем по дате создания (новые сначала)
        return b.createdAt - a.createdAt
      })
      
      // Берем топ 3
      const topProgramsData: TopProgramItem[] = sortedPrograms
        .slice(0, 3)
        .map(({ totalRevenue, totalPurchases, createdAt, ...rest }) => rest)
      
      setTopPrograms(topProgramsData)
    } catch (error) {
      console.error('Error loading top programs:', error)
      setTopPrograms([])
    } finally {
      setIsLoadingPrograms(false)
    }
  }

  const handleProgramClick = (programId: string) => {
    const program = allPrograms.find(p => p.id === programId)
    if (program) {
      setSelectedProgram(program)
      setDetailsModalOpen(true)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    showToast(t.codeCopied || 'Код скопирован в буфер обмена')
  }

  const showToast = (message: string) => {
    setToast({ message, show: true })
    setTimeout(() => setToast({ message: '', show: false }), 3000)
  }

  const getSalesWord = (count: number): string => {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'продаж'
    }
    if (lastDigit === 1) {
      return 'продажа'
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'продажи'
    }
    return 'продаж'
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ru-RU').format(Math.round(value))
  }

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
          <TopPrograms 
            programs={topPrograms} 
            isLoading={isLoadingPrograms}
            onProgramClick={handleProgramClick}
            onCopyCode={handleCopyCode}
          />
        </div>
      </div>

      {/* Program Details Modal */}
      <ProgramDetailsModal
        isOpen={detailsModalOpen}
        program={selectedProgram}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedProgram(null)
        }}
        onCopyCode={handleCopyCode}
      />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-up z-50">
          <CheckCircle className="w-5 h-5" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
