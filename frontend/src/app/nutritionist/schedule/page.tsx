'use client'

import { ScheduleContent } from '@/components/shared/ScheduleContent'
import { nutritionistScheduleApi } from '@/lib/api/nutritionistScheduleApi'

export default function NutritionistSchedulePage() {
  return <ScheduleContent api={nutritionistScheduleApi} />
}
