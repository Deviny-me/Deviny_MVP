'use client'

import { ScheduleContent } from '@/components/shared/ScheduleContent'
import { scheduleApi } from '@/lib/api/scheduleApi'

export default function TrainerSchedulePage() {
  return <ScheduleContent api={scheduleApi} />
}
