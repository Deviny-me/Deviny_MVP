'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { fetchTrainerProfile } from '@/lib/api/trainerProfileApi'
import { TrainerProfileResponse } from '@/types/trainerProfile'

export default function SettingsPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await fetchTrainerProfile()
      setProfile(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">Загрузка...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6 pb-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Настройки</h1>
          <p className="text-gray-400">Управление настройками аккаунта</p>
        </div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <User className="w-5 h-5 text-[#FF6B35]" />
            <h2 className="font-semibold text-white">Аккаунт</h2>
          </div>
          <div className="divide-y divide-white/5">
            <button 
              onClick={() => router.push('/trainer/profile')}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5"
            >
              <div>
                <p className="text-white">Редактировать профиль</p>
                <p className="text-sm text-gray-400">{profile?.trainer?.fullName}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Выйти</span>
        </motion.button>

        {/* Version */}
        <p className="text-center text-xs text-gray-500">
          Deviny v1.0.0
        </p>
      </div>
    </>
  )
}
