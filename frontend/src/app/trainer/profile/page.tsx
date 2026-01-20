'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/language/LanguageProvider'
import { fetchTrainerProfile, updateAbout, addSpecialization, deleteSpecialization } from '@/lib/api/trainerProfileApi'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { TrainerProfileCard } from '@/components/trainer/profile/TrainerProfileCard'
import { CertificatesCard } from '@/components/trainer/profile/CertificatesCard'
import { AboutCard } from '@/components/trainer/profile/AboutCard'
import { AchievementsCard } from '@/components/trainer/profile/AchievementsCard'
import { SpecializationsCard } from '@/components/trainer/profile/SpecializationsCard'
import { FriendsCard } from '@/components/trainer/profile/FriendsCard'
import { GymBroCard } from '@/components/trainer/profile/GymBroCard'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function TrainerProfilePage() {
  const { t } = useLanguage()
  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchTrainerProfile()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleUpdateAbout = async (text: string) => {
    await updateAbout(text)
    await loadProfile()
  }

  const handleAddSpecialization = async (name: string) => {
    await addSpecialization(name)
    await loadProfile()
  }

  const handleDeleteSpecialization = async (id: string) => {
    await deleteSpecialization(id)
    await loadProfile()
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-neutral-400">{t.loading}</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-2">
              {t.error}
            </h2>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">{error}</p>
            <Button onClick={loadProfile} variant="primary">
              Попробовать снова
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (!profile) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-50">
          {t.trainerProfile}
        </h1>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <TrainerProfileCard trainer={profile.trainer} onAvatarChanged={loadProfile} />
          <AboutCard about={profile.about} onUpdate={handleUpdateAbout} />
          <SpecializationsCard 
            specializations={profile.specializations}
            onAdd={handleAddSpecialization}
            onRemove={handleDeleteSpecialization}
          />
        </div>

        {/* Right column (1/3 width) */}
        <div className="space-y-6">
          <GymBroCard />
          <CertificatesCard 
            certificates={profile.certificates} 
            onCertificateAdded={loadProfile}
          />
          <AchievementsCard achievements={profile.achievements} />
          <FriendsCard friends={[]} />
        </div>
      </div>
    </div>
  )
}
