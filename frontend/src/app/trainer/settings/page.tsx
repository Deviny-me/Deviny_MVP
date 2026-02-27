'use client'

import { ExpertSettingsContent } from '@/components/shared/ExpertSettingsContent'
import { fetchTrainerProfile } from '@/lib/api/trainerProfileApi'

export default function TrainerSettingsPage() {
  return <ExpertSettingsContent basePath="/trainer" fetchProfile={fetchTrainerProfile} />
}
