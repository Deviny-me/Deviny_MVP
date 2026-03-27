'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { User, LogOut, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { useAccentColors } from '@/lib/theme/useAccentColors'

interface ExpertSettingsContentProps {
  basePath: string
  fetchProfile: () => Promise<TrainerProfileResponse>
}

export function ExpertSettingsContent({ basePath, fetchProfile }: ExpertSettingsContentProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const accent = useAccentColors()
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchProfile()
        setProfile(data)
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent.primary }} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      {/* Account Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141414] rounded-xl border border-white/[0.06] overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <User className={`w-5 h-5 ${accent.text}`} />
          <h2 className="font-semibold text-white">{t('account')}</h2>
        </div>
        <div className="divide-y divide-white/5">
          <button
            onClick={() => router.push(`${basePath}/profile`)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.04]"
          >
            <div>
              <p className="text-white">{t('editProfile')}</p>
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
        <span className="font-medium">{tc('logout')}</span>
      </motion.button>

      {/* Version */}
      <p className="text-center text-xs text-gray-500">Deviny v1.0.0</p>
    </div>
  )
}
