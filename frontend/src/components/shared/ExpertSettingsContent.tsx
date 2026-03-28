'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { User, LogOut, ChevronRight, Loader2, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { useTheme } from '@/components/theme/ThemeProvider'

interface ExpertSettingsContentProps {
  basePath: string
  fetchProfile: () => Promise<TrainerProfileResponse>
}

export function ExpertSettingsContent({ basePath, fetchProfile }: ExpertSettingsContentProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const accent = useAccentColors()
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === 'dark'
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
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Account Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-2 rounded-xl border border-border-subtle overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <User className={`w-5 h-5 ${accent.text}`} />
          <h2 className="font-semibold text-foreground">{t('account')}</h2>
        </div>
        <div className="divide-y divide-border-subtle">
          <button
            onClick={() => router.push(`${basePath}/profile`)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-hover-overlay"
          >
            <div>
              <p className="text-foreground">{t('editProfile')}</p>
              <p className="text-sm text-muted-foreground">{profile?.trainer?.fullName}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Preferences Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-surface-2 rounded-xl border border-border-subtle overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <h2 className="font-semibold text-foreground">{t('preferences')}</h2>
        </div>
        <div className="divide-y divide-border-subtle">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-hover-overlay"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
              <span className="text-foreground">{t('darkMode')}</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors ${isDarkMode ? `bg-[${accent.primary}]` : 'bg-gray-400'} p-0.5`} style={{ backgroundColor: isDarkMode ? accent.primary : undefined }}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
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
    </div>
  )
}
