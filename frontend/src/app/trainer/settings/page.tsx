'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { User, Bell, Globe, Palette, Mail, Phone, X, Eye, EyeOff, Check, Sun, Moon, Languages } from 'lucide-react'
import { useTheme, getThemeLabel } from '@/components/theme/ThemeProvider'
import { useUser } from '@/components/user/UserProvider'
import { useLanguage, getLanguageLabel } from '@/components/language/LanguageProvider'
import AvatarUpload from '@/components/user/AvatarUpload'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl?: string | null
  pushNotificationsEnabled: boolean
}

// Modal Component
function Modal({ isOpen, onClose, title, children }: { 
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-50">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Toggle Switch Component
function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-14 h-7 rounded-full transition-colors ${
        enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-neutral-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div 
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          enabled ? 'translate-x-8' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function TrainerSettingsPage() {
  const { theme, setTheme, isLoading: themeLoading } = useTheme()
  const { updateUser } = useUser()
  const { language, setLanguage, t, isLoading: langLoading } = useLanguage()
  
  // User data state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    avatarUrl: null,
    pushNotificationsEnabled: false
  })

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Form states
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })

  // Loading & messages
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Load user data from API
  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile({
          id: data.id || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          avatarUrl: data.avatarUrl || null,
          pushNotificationsEnabled: data.pushNotificationsEnabled || false
        })
        setProfileForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || ''
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle theme toggle
  const handleThemeToggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    await setTheme(newTheme)
    setSuccessMessage(t.themeUpdated)
    setTimeout(() => setSuccessMessage(''), 2000)
  }

  // Handle push notifications toggle
  const handlePushToggle = async (enabled: boolean) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pushNotificationsEnabled: enabled })
      })

      if (response.ok) {
        setUserProfile(prev => ({ ...prev, pushNotificationsEnabled: enabled }))
        setSuccessMessage(enabled ? t.notificationsEnabled : t.notificationsDisabled)
        setTimeout(() => setSuccessMessage(''), 2000)
      }
    } catch (error) {
      setErrorMessage(t.error)
    }
  }

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone
        })
      })

      if (response.ok) {
        const updatedData = {
          name: profileForm.name,
          phone: profileForm.phone
        }
        setUserProfile(prev => ({
          ...prev,
          ...updatedData
        }))
        // Update global user context so sidebar and other components update
        updateUser(updatedData)
        setShowProfileModal(false)
        setSuccessMessage(t.profileUpdated)
        setTimeout(() => setSuccessMessage(''), 2000)
      } else {
        setErrorMessage(t.error)
      }
    } catch (error) {
      setErrorMessage(t.connectionError)
    } finally {
      setSaving(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.new !== passwordForm.confirm) {
      setErrorMessage(t.passwordsDontMatch)
      return
    }

    if (passwordForm.new.length < 6) {
      setErrorMessage(t.minChars)
      return
    }

    setSaving(true)
    setErrorMessage('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('http://localhost:5000/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new
        })
      })

      if (response.ok) {
        setShowPasswordModal(false)
        setPasswordForm({ current: '', new: '', confirm: '' })
        setSuccessMessage(t.passwordChanged)
        setTimeout(() => setSuccessMessage(''), 2000)
      } else {
        const data = await response.json()
        setErrorMessage(data.message || t.wrongPassword)
      }
    } catch (error) {
      setErrorMessage(t.connectionError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-50">{t.settings}</h1>
        <p className="text-gray-600 dark:text-neutral-400 mt-1">{t.settingsDescription}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Account Section */}
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">{t.account}</h2>
            </div>

            {/* Avatar Upload */}
            <div className="border-b border-gray-100 dark:border-neutral-800 pb-6 mb-4">
              <AvatarUpload 
                avatarUrl={userProfile.avatarUrl} 
                onAvatarChanged={loadUserProfile}
              />
            </div>

            {/* Profile Info */}
            <div className="border-b border-gray-100 dark:border-neutral-800 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">{t.nameEmailPhone}</p>
                  <p className="font-medium text-gray-900 dark:text-neutral-50">
                    {userProfile.name || '—'} • {userProfile.email}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setProfileForm({
                      name: userProfile.name,
                      email: userProfile.email,
                      phone: userProfile.phone
                    })
                    setShowProfileModal(true)
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  {t.edit}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="border-b border-gray-100 dark:border-neutral-800 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">{t.updatePassword}</p>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  {t.change}
                </button>
              </div>
            </div>

            {/* Delete Account */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">{t.deleteAccountDescription}</p>
                </div>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          </Card>

          {/* Theme Section */}
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">{t.appearance}</h2>
            </div>

            {/* Theme Toggle Row - Clickable */}
            <div
              onClick={!themeLoading ? handleThemeToggle : undefined}
              className="w-full flex items-center justify-between py-4 hover:bg-gray-50 dark:hover:bg-neutral-800 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-500" />
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-neutral-50">{t.theme}</p>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">
                    {theme === 'dark' ? t.themeDark : t.themeLight}
                  </p>
                </div>
              </div>
              <Toggle enabled={theme === 'dark'} onChange={() => {}} disabled={themeLoading} />
            </div>
          </Card>

          {/* Notifications Section */}
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">{t.notifications}</h2>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-neutral-50">{t.pushNotifications}</p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">{t.pushDescription}</p>
              </div>
              <Toggle enabled={userProfile.pushNotificationsEnabled} onChange={handlePushToggle} />
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Quick Info */}
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <h3 className="font-semibold text-gray-900 dark:text-neutral-50 mb-4">{t.quickSettings}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">{t.language}</p>
                    <p className="font-medium text-gray-900 dark:text-neutral-50">{language === 'ru' ? t.russian : t.english}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      language === 'ru'
                        ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-50 shadow-sm'
                        : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    RU
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      language === 'en'
                        ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-50 shadow-sm'
                        : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">{t.theme}</p>
                  <p className="font-medium text-gray-900 dark:text-neutral-50">{theme === 'dark' ? t.themeDark : t.themeLight}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">{t.email}</p>
                  <p className="font-medium text-gray-900 dark:text-neutral-50">{userProfile.email || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">{t.phone}</p>
                  <p className="font-medium text-gray-900 dark:text-neutral-50">{userProfile.phone || '—'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <Modal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        title={t.editProfile}
      >
        <form onSubmit={handleProfileUpdate}>
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">{t.name}</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.name}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">{t.email}</label>
              <input
                type="email"
                value={profileForm.email}
                disabled
                className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">{t.emailCantChange}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">{t.phone}</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+7 (999) 999-99-99"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? '...' : t.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Password Change Modal */}
      <Modal 
        isOpen={showPasswordModal} 
        onClose={() => {
          setShowPasswordModal(false)
          setPasswordForm({ current: '', new: '', confirm: '' })
          setErrorMessage('')
        }} 
        title={t.changePassword}
      >
        <form onSubmit={handlePasswordChange}>
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">{t.currentPassword}</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.currentPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">{t.newPassword}</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.minChars}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">{t.confirmPassword}</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.repeatPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(false)
                setPasswordForm({ current: '', new: '', confirm: '' })
                setErrorMessage('')
              }}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? '...' : t.change}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title={t.deleteAccount}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-gray-600 dark:text-neutral-400 mb-6">
            {t.deleteConfirmation}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              {t.delete}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
