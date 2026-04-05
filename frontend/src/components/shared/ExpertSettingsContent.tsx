'use client'

import { useState, useEffect, useRef } from 'react'
import {
  User,
  Bell,
  Shield,
  Globe,
  LogOut,
  Trash2,
  ChevronRight,
  Moon,
  Sun,
  Loader2,
  ImagePlus,
  LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useLanguage, getLanguageLabel, Language } from '@/components/language/LanguageProvider'
import { DeleteAccountModal } from '@/components/shared/DeleteAccountModal'
import { API_BASE_URL } from '@/lib/config'

interface SettingsItem {
  icon: LucideIcon
  label: string
  action: () => void
  toggle?: boolean
  value?: string | boolean
}

interface SettingsSection {
  title: string
  items: SettingsItem[]
}

interface ExpertSettingsContentProps {
  basePath: string
  fetchProfile: () => Promise<TrainerProfileResponse>
  uploadBanner: (file: File) => Promise<{ bannerUrl: string }>
  deleteBanner: () => Promise<void>
}

export function ExpertSettingsContent({ basePath, fetchProfile, uploadBanner, deleteBanner }: ExpertSettingsContentProps) {
  const { user: authUser, logout } = useAuth()
  const router = useRouter()
  const accent = useAccentColors()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const isDarkMode = theme === 'dark'
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const cycleLanguage = () => {
    const langs: Language[] = ['ru', 'en', 'az']
    const idx = langs.indexOf(language)
    const next = langs[(idx + 1) % langs.length]
    setLanguage(next)
  }

  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    achievements: true,
    newPrograms: false,
    messages: true,
  })

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

  const handleDeleteSuccess = () => {
    window.location.href = '/auth/login'
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setBannerUploading(true)
      const result = await uploadBanner(file)
      setProfile(prev => prev ? {
        ...prev,
        trainer: { ...prev.trainer, bannerUrl: result.bannerUrl }
      } : prev)
    } catch (err) {
      console.error('Failed to upload banner:', err)
    } finally {
      setBannerUploading(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  const settingsSections: SettingsSection[] = [
    {
      title: t('account'),
      items: [
        { icon: User, label: t('editProfile'), action: () => router.push(`${basePath}/profile/settings`) },
        { icon: Shield, label: t('privacySecurity'), action: () => {} },
      ]
    },
    {
      title: t('preferences'),
      items: [
        {
          icon: isDarkMode ? Moon : Sun,
          label: t('darkMode'),
          toggle: true,
          value: isDarkMode,
          action: toggleTheme,
        },
        { icon: Globe, label: t('language'), value: getLanguageLabel(language), action: cycleLanguage },
      ]
    },
    {
      title: t('notifications'),
      items: [
        {
          icon: Bell,
          label: t('workoutReminders'),
          toggle: true,
          value: notifications.workoutReminders,
          action: () => setNotifications(prev => ({ ...prev, workoutReminders: !prev.workoutReminders })),
        },
        {
          icon: Bell,
          label: t('achievements'),
          toggle: true,
          value: notifications.achievements,
          action: () => setNotifications(prev => ({ ...prev, achievements: !prev.achievements })),
        },
        {
          icon: Bell,
          label: t('newPrograms'),
          toggle: true,
          value: notifications.newPrograms,
          action: () => setNotifications(prev => ({ ...prev, newPrograms: !prev.newPrograms })),
        },
        {
          icon: Bell,
          label: t('messages'),
          toggle: true,
          value: notifications.messages,
          action: () => setNotifications(prev => ({ ...prev, messages: !prev.messages })),
        },
      ]
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent.primary }} />
      </div>
    )
  }

  const bannerUrl = profile?.trainer?.bannerUrl
  const fullBannerUrl = bannerUrl ? (bannerUrl.startsWith('http') ? bannerUrl : `${API_BASE_URL}${bannerUrl}`) : null

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {/* Profile Card with Banner */}
        <div className="bg-surface-3 rounded-xl border border-border overflow-hidden">
          {/* Banner */}
          <div className="relative h-28 bg-gradient-to-r" style={{
            background: fullBannerUrl
              ? `url(${fullBannerUrl}) center/cover no-repeat`
              : `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`
          }}>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleBannerUpload}
            />
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={bannerUploading}
              className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm transition-colors"
            >
              {bannerUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
              {t('changeBanner')}
            </button>
          </div>

          {/* Profile Info */}
          <div className="p-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
              >
                <span className="text-white text-2xl font-bold">
                  {profile?.trainer?.initials || authUser?.firstName?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{profile?.trainer?.fullName || authUser?.firstName}</h3>
                <p className="text-sm text-muted-foreground">{authUser?.email || ''}</p>
                {profile?.trainer?.primaryTitle && (
                  <p className="text-xs mt-1" style={{ color: accent.primary }}>{profile.trainer.primaryTitle}</p>
                )}
              </div>
              <button
                onClick={() => router.push(`${basePath}/profile`)}
                className="px-4 py-2 border text-sm font-semibold rounded-lg transition-colors"
                style={{
                  borderColor: accent.primary,
                  color: accent.primary,
                }}
              >
                {t('edit')}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-surface-3 rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</h3>
            </div>
            <div className="divide-y divide-border">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-hover-overlay transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  {item.toggle ? (
                    <div
                      className="w-10 h-6 rounded-full transition-colors p-0.5"
                      style={{ backgroundColor: item.value ? accent.primary : '#4b5563' }}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${item.value ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  ) : item.value ? (
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">{t('signOut')}</span>
        </button>

        {/* Delete Account Button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-500/20 text-red-500/70 rounded-xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/40 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">{t('deleteAccount')}</span>
        </button>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
