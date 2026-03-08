'use client'

import { ScheduleContent } from '@/components/shared/ScheduleContent'
import { userScheduleApi } from '@/lib/api/userScheduleApi'

export default function SchedulePage() {
  return <ScheduleContent api={userScheduleApi} readOnly />
}
