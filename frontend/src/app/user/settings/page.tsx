'use client'

import { useUser } from '@/components/user/UserProvider'
import { useLevel } from '@/components/level/LevelProvider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { 
  User,
  Bell,
  Shield,
  Globe,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  LucideIcon
} from 'lucide-react'
import { useTranslations } from 'next-intl'

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

export default function SettingsPage() {
  const t = useTranslations('userSettings')
  const tc = useTranslations('common')
  const router = useRouter()
  const { user, logout } = useUser()
  const { level } = useLevel()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    achievements: true,
    newPrograms: false,
    messages: true,
  })

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const settingsSections: SettingsSection[] = [
    {
      title: t('account'),
      items: [
        { icon: User, label: t('editProfile'), action: () => router.push('/user/profile') },
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
          action: () => setIsDarkMode(!isDarkMode) 
        },
        { icon: Globe, label: t('language'), value: t('english'), action: () => {} },
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
          action: () => setNotifications(prev => ({ ...prev, workoutReminders: !prev.workoutReminders })) 
        },
        { 
          icon: Bell, 
          label: t('achievements'), 
          toggle: true, 
          value: notifications.achievements, 
          action: () => setNotifications(prev => ({ ...prev, achievements: !prev.achievements })) 
        },
        { 
          icon: Bell, 
          label: t('newPrograms'), 
          toggle: true, 
          value: notifications.newPrograms, 
          action: () => setNotifications(prev => ({ ...prev, newPrograms: !prev.newPrograms })) 
        },
        { 
          icon: Bell, 
          label: t('messages'), 
          toggle: true, 
          value: notifications.messages, 
          action: () => setNotifications(prev => ({ ...prev, messages: !prev.messages })) 
        },
      ]
    },
  ]

  return (
    <>
      <div className="max-w-2xl space-y-6 pb-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-gray-400">{t('description')}</p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#0c8de6] to-[#0070c4] flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user?.fullName?.charAt(0) || tc('user').charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{user?.fullName || tc('user')}</h3>
              <p className="text-sm text-gray-400">{user?.email || 'user@example.com'}</p>
              <p className="text-xs text-[#0c8de6] mt-1">Level {level?.currentLevel ?? user?.level ?? 1} • {level?.currentXp ?? user?.xp ?? 0} XP</p>
            </div>
            <button
              onClick={() => router.push('/user/profile')}
              className="px-4 py-2 border border-[#0c8de6] text-[#0c8de6] text-sm font-semibold rounded-lg hover:bg-[#0c8de6]/10 transition-colors"
            >
              {t('edit')}
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{section.title}</h3>
            </div>
            <div className="divide-y divide-white/10">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-white">{item.label}</span>
                  </div>
                  {item.toggle ? (
                    <div className={`w-10 h-6 rounded-full transition-colors ${item.value ? 'bg-[#0c8de6]' : 'bg-gray-600'} p-0.5`}>
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${item.value ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  ) : item.value ? (
                    <span className="text-sm text-gray-400">{item.value}</span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
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

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>{t('version')}</p>
          <p className="mt-1">{t('copyright')}</p>
        </div>
      </div>
    </>
  )
}
